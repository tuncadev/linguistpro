import { User } from "@/types";
import { ApiTutor, mapApiTutorToFrontendTutor } from "./tutorApiService";

type ListTutorsResponse = {
  data?: ApiTutor[];
};

export type AdminTutorIntegritySnapshot = {
  generatedAt: string;
  totalTutors: number;
  totalCourses: number;
  totalPublishedCourses: number;
  distinctTutorIdsInCourses: number;
  distinctTutorIdsInPublishedCourses: number;
  orphanedTutorIdsInCourses: string[];
  orphanedTutorIdsInPublishedCourses: string[];
  unassignedTutorCount: number;
  unassignedTutorIds: string[];
  tutorAssignments: Array<{
    tutorId: string;
    name: string | null;
    email: string;
    assignedCourses: number;
    assignedPublishedCourses: number;
  }>;
  status: "ok" | "warning";
};

type TutorIntegrityResponse = {
  data?: AdminTutorIntegritySnapshot;
  error?: string | { message?: string };
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
  tutorApprovalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  tutorApprovalNotes?: string | null;
  location?: string | null;
  languagesSpoken?: string | null;
  profileHighlights?: string[];
  profileStats?: Array<{
    id?: string;
    label: string;
    value: string;
  }>;
  pedagogicalModules?: Array<{
    id?: string;
    title: string;
    description: string;
  }>;
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

export async function fetchAdminTutorIntegrity(): Promise<AdminTutorIntegritySnapshot> {
  const response = await fetch("/api/admin/tutors/integrity", {
    method: "GET",
    credentials: "include",
  });
  const payload = await parseResponseOrThrow<TutorIntegrityResponse>(response);
  if (!payload.data) {
    throw new Error("Tutor integrity response did not return data");
  }
  return payload.data;
}

export async function fetchAdminTutorById(tutorId: string): Promise<User> {
  const response = await fetch(`/api/admin/tutors/${tutorId}`, {
    method: "GET",
    credentials: "include",
  });
  const payload = await parseResponseOrThrow<TutorMutationResponse>(response);
  if (!payload.data) {
    throw new Error("Tutor was not found");
  }
  return mapApiTutorToFrontendTutor(payload.data);
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
