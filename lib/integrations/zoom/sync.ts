import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ParticipantPayload = {
  id?: string | number;
  user_id?: string;
  user_name?: string;
  email?: string;
  join_time?: string;
  leave_time?: string;
  duration?: number;
};

type RecordingFilePayload = {
  id?: string;
  recording_type?: string;
  file_type?: string;
  file_size?: number;
  play_url?: string;
  download_url?: string;
  recording_start?: string;
  recording_end?: string;
};

function normalizeMeetingId(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }
  return null;
}

function normalizeParticipantId(participant: ParticipantPayload): string | null {
  const candidates = [participant.user_id, participant.id];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    if (typeof candidate === "number") return String(candidate);
  }
  return null;
}

function parseOptionalDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function appendSourceEventId(existing: Prisma.JsonValue | null | undefined, eventId: string) {
  if (!Array.isArray(existing)) {
    return [eventId] as Prisma.JsonArray;
  }
  const current = existing.filter((item): item is string => typeof item === "string");
  if (current.includes(eventId)) {
    return current as Prisma.JsonArray;
  }
  return [...current, eventId] as Prisma.JsonArray;
}

export async function syncZoomParticipantEvent(input: {
  meetingId: unknown;
  eventName: string;
  eventId: string;
  participant: ParticipantPayload;
}) {
  const meetingId = normalizeMeetingId(input.meetingId);
  const participantId = normalizeParticipantId(input.participant);
  if (!meetingId || !participantId) {
    return { applied: false, reason: "missing_meeting_or_participant" as const };
  }

  const session = await prisma.liveClassSession.findFirst({
    where: { zoomMeetingId: meetingId },
    select: { id: true },
  });
  if (!session) {
    return { applied: false, reason: "session_not_found" as const };
  }

  const joinAt = parseOptionalDate(input.participant.join_time);
  const leaveAt = parseOptionalDate(input.participant.leave_time);
  const eventIsJoin = input.eventName === "meeting.participant_joined";

  const existing = await prisma.liveClassAttendance.findUnique({
    where: {
      liveClassSessionId_participantId: {
        liveClassSessionId: session.id,
        participantId,
      },
    },
    select: {
      id: true,
      firstJoinAt: true,
      lastLeaveAt: true,
      joinCount: true,
      sourceEventIds: true,
    },
  });

  if (!existing) {
    await prisma.liveClassAttendance.create({
      data: {
        liveClassSessionId: session.id,
        participantId,
        participantName: input.participant.user_name ?? null,
        participantEmail: input.participant.email ?? null,
        firstJoinAt: eventIsJoin ? joinAt : null,
        lastLeaveAt: eventIsJoin ? null : leaveAt,
        totalDurationMinutes:
          typeof input.participant.duration === "number" ? input.participant.duration : null,
        joinCount: eventIsJoin ? 1 : 0,
        sourceEventIds: [input.eventId] as Prisma.JsonArray,
      },
    });
    return { applied: true, reason: "created" as const };
  }

  const updateData: Prisma.LiveClassAttendanceUpdateInput = {
    participantName: input.participant.user_name ?? undefined,
    participantEmail: input.participant.email ?? undefined,
    sourceEventIds: appendSourceEventId(existing.sourceEventIds, input.eventId),
  };

  if (eventIsJoin) {
    updateData.joinCount = { increment: 1 };
    if (joinAt) {
      updateData.firstJoinAt =
        existing.firstJoinAt && existing.firstJoinAt <= joinAt ? existing.firstJoinAt : joinAt;
    }
  } else if (leaveAt) {
    updateData.lastLeaveAt =
      existing.lastLeaveAt && existing.lastLeaveAt >= leaveAt ? existing.lastLeaveAt : leaveAt;
    if (typeof input.participant.duration === "number") {
      updateData.totalDurationMinutes = input.participant.duration;
    }
  }

  await prisma.liveClassAttendance.update({
    where: { id: existing.id },
    data: updateData,
  });

  return { applied: true, reason: "updated" as const };
}

export async function syncZoomRecordingCompleted(input: {
  meetingId: unknown;
  eventId: string;
  recordingFiles: RecordingFilePayload[];
}) {
  const meetingId = normalizeMeetingId(input.meetingId);
  if (!meetingId) {
    return { applied: false, reason: "missing_meeting_id" as const };
  }

  const session = await prisma.liveClassSession.findFirst({
    where: { zoomMeetingId: meetingId },
    select: { id: true },
  });
  if (!session) {
    return { applied: false, reason: "session_not_found" as const };
  }

  let createdCount = 0;
  for (const file of input.recordingFiles) {
    if (!file.id) {
      continue;
    }

    await prisma.liveClassRecording.upsert({
      where: { externalFileId: file.id },
      create: {
        liveClassSessionId: session.id,
        externalFileId: file.id,
        recordingType: file.recording_type ?? null,
        fileType: file.file_type ?? null,
        fileSizeBytes: typeof file.file_size === "number" ? BigInt(file.file_size) : null,
        playUrl: file.play_url ?? null,
        downloadUrl: file.download_url ?? null,
        recordingStart: parseOptionalDate(file.recording_start),
        recordingEnd: parseOptionalDate(file.recording_end),
      },
      update: {
        recordingType: file.recording_type ?? undefined,
        fileType: file.file_type ?? undefined,
        fileSizeBytes:
          typeof file.file_size === "number" ? BigInt(file.file_size) : undefined,
        playUrl: file.play_url ?? undefined,
        downloadUrl: file.download_url ?? undefined,
        recordingStart: parseOptionalDate(file.recording_start) ?? undefined,
        recordingEnd: parseOptionalDate(file.recording_end) ?? undefined,
      },
    });
    createdCount += 1;
  }

  return { applied: true, reason: "upserted_files" as const, count: createdCount };
}
