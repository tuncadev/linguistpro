import { NextRequest, NextResponse } from "next/server";
import {
  buildZoomEndpointValidationResponse,
  parseZoomWebhookPayload,
  verifyZoomWebhookSignature,
} from "@/lib/integrations/zoom/webhook";
import {
  syncZoomParticipantEvent,
  syncZoomRecordingCompleted,
} from "@/lib/integrations/zoom/sync";

function eventIdFromPayload(payload: {
  event?: string;
  event_ts?: number;
  payload?: Record<string, unknown>;
}): string {
  const event = payload.event ?? "unknown";
  const eventTs = payload.event_ts ?? 0;
  const object = (payload.payload?.object as Record<string, unknown> | undefined) ?? {};
  const meetingId = object.id ? String(object.id) : "no-meeting";
  return `${event}:${eventTs}:${meetingId}`;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-zm-signature");
  const timestamp = req.headers.get("x-zm-request-timestamp");

  let payload: ReturnType<typeof parseZoomWebhookPayload>;
  try {
    payload = parseZoomWebhookPayload(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid webhook JSON payload" }, { status: 400 });
  }

  if (payload.event === "endpoint.url_validation") {
    const plainToken =
      ((payload.payload?.plainToken as string | undefined) ?? "").trim();
    if (!plainToken) {
      return NextResponse.json({ error: "Missing plainToken" }, { status: 400 });
    }

    try {
      return NextResponse.json(buildZoomEndpointValidationResponse(plainToken));
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Webhook secret not configured" },
        { status: 500 }
      );
    }
  }

  const verified = verifyZoomWebhookSignature({
    rawBody,
    timestamp,
    signature,
  });

  if (!verified) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const eventName = payload.event ?? "";
  const object = (payload.payload?.object as Record<string, unknown> | undefined) ?? {};
  const participant = (object.participant as Record<string, unknown> | undefined) ?? {};
  const eventId = eventIdFromPayload(payload);

  if (eventName === "meeting.participant_joined" || eventName === "meeting.participant_left") {
    const syncResult = await syncZoomParticipantEvent({
      meetingId: object.id,
      eventName,
      eventId,
      participant: {
        id: participant.id as string | number | undefined,
        user_id: participant.user_id as string | undefined,
        user_name: participant.user_name as string | undefined,
        email: participant.email as string | undefined,
        join_time: participant.join_time as string | undefined,
        leave_time: participant.leave_time as string | undefined,
        duration: participant.duration as number | undefined,
      },
    });

    return NextResponse.json({
      received: true,
      event: eventName,
      sync: syncResult,
    });
  }

  if (eventName === "recording.completed") {
    const recordingFiles = Array.isArray(object.recording_files)
      ? (object.recording_files as Record<string, unknown>[])
      : [];

    const syncResult = await syncZoomRecordingCompleted({
      meetingId: object.id,
      eventId,
      recordingFiles: recordingFiles.map((file) => ({
        id: (file.id as string | undefined) ?? undefined,
        recording_type: file.recording_type as string | undefined,
        file_type: file.file_type as string | undefined,
        file_size: file.file_size as number | undefined,
        play_url: file.play_url as string | undefined,
        download_url: file.download_url as string | undefined,
        recording_start: file.recording_start as string | undefined,
        recording_end: file.recording_end as string | undefined,
      })),
    });

    return NextResponse.json({
      received: true,
      event: eventName,
      sync: syncResult,
    });
  }

  return NextResponse.json({
    received: true,
    event: eventName || "unknown",
    sync: { applied: false, reason: "event_not_handled" },
  });
}
