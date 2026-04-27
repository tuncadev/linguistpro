import { User } from "@/types";
import { ApiTutor, mapApiTutorToFrontendTutor } from "./tutorApiService";

type ListTutorsResponse = {
  data?: ApiTutor[];
};

type TutorMutationResponse = {
  data?: ApiTutor;
  error?: string | { message?: string };
};

export type TutorMutationPayload = {
  name?: string;
  email?: string;
  password?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  rating?: number | null;
  studentCount?: number | null;
  coursesAuthored?: number | null;
};

function readErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Request failed";
  }

  const candidate = payload as { error?: string | { message?: string } };
  if (typeof candidate.error === "string" && candidate.error.trim()) {
    return candidate.error;
  }
  if (
    candidate.error &&
    typeof candidate.error === "object" &&
    typeof candidate.error.message === "string" &&
    candidate.error.message.trim()
  ) {
    return candidate.error.message;
  }

  return "Request failed";
}

async function parseJsonSafe<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

async function parseResponseOrThrow<T>(response: Response): Promise<T> {
  const payload = await parseJsonSafe<T>(response);
  if (!response.ok) {
    throw new Error(readErrorMessage(payload));
  }
  return payload;
}

export async function fetchAdminTutors(): Promise<User[]> {
  const response = await fetch("/api/admin/tutors?take=200", {
    method: "GET",
    credentials: "include",
  });
  const payload = await parseResponseOrThrow<ListTutorsResponse>(response);
  const tutors = payload.data ?? [];
  return tutors.map(mapApiTutorToFrontendTutor);
}

export async function createAdminTutor(payload: TutorMutationPayload): Promise<User> {
  const response = await fetch("/api/admin/tutors", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const json = await parseResponseOrThrow<TutorMutationResponse>(response);
  if (!json.data) {
    throw new Error("Tutor creation did not return data");
  }
  return mapApiTutorToFrontendTutor(json.data);
}

export async function updateAdminTutor(
  tutorId: string,
  payload: TutorMutationPayload
): Promise<User> {
  const response = await fetch(`/api/admin/tutors/${tutorId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const json = await parseResponseOrThrow<TutorMutationResponse>(response);
  if (!json.data) {
    throw new Error("Tutor update did not return data");
  }
  return mapApiTutorToFrontendTutor(json.data);
}

export async function deleteAdminTutor(tutorId: string): Promise<void> {
  const response = await fetch(`/api/admin/tutors/${tutorId}`, {
    method: "DELETE",
    credentials: "include",
  });
  await parseResponseOrThrow(response);
}
