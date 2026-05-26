import { getZoomAccessTokenForUser } from "@/lib/integrations/zoom/token-store";

export type CreateZoomMeetingInput = {
  userId: string;
  topic: string;
  agenda?: string | null;
  startTimeIso: string;
  durationMinutes: number;
  timezone: string;
};

export type CreateZoomMeetingResult = {
  id: string;
  topic: string;
  start_time: string;
  duration: number;
  timezone: string;
  join_url: string;
  start_url?: string;
  password?: string;
  host_email?: string;
  status?: string;
};

export async function createZoomMeeting(input: CreateZoomMeetingInput): Promise<CreateZoomMeetingResult> {
  const accessToken = await getZoomAccessTokenForUser({
    userId: input.userId,
  });

  const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      topic: input.topic,
      type: 2,
      agenda: input.agenda ?? undefined,
      start_time: input.startTimeIso,
      duration: input.durationMinutes,
      timezone: input.timezone,
      settings: {
        waiting_room: true,
        join_before_host: false,
        participant_video: true,
        host_video: true,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Zoom meeting creation failed (${response.status}): ${body.slice(0, 400)}`);
  }

  return (await response.json()) as CreateZoomMeetingResult;
}
