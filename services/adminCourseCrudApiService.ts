import { Course } from "@/types";
import { mapApiCourseToFrontendCourse } from "./courseApiService";

type ApiCourse = Parameters<typeof mapApiCourseToFrontendCourse>[0];

type ListCoursesResponse = {
  data?: ApiCourse[];
};

type CourseMutationPayload = {
  title?: string;
  description?: string;
  price?: number;
  rating?: number;
  reviews?: number;
  studentCount?: number;
  imageUrl?: string;
  languageId?: string;
  levelId?: string;
  tutorId?: string;
  status?: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
  syllabus?: string[];
  syllabusSections?: Array<{
    title: string;
    lessons?: Array<{
      title: string;
      duration?: string;
      type?: "video" | "quiz" | "reading";
      content?: string;
    }>;
  }>;
  learningObjectives?: string[];
  enrollmentIncludes?: string[];
  tuitionLabel?: string;
  discountLabel?: string;
  courseDirectorLabel?: string;
};

async function parseJsonSafe<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

type ApiErrorPayload = {
  error?:
    | string
    | {
        message?: string | null;
      };
};

function extractApiErrorMessage(payload: ApiErrorPayload, fallback: string): string {
  if (typeof payload.error === "string" && payload.error.trim().length > 0) {
    return payload.error;
  }
  if (
    payload.error &&
    typeof payload.error === "object" &&
    typeof payload.error.message === "string" &&
    payload.error.message.trim().length > 0
  ) {
    return payload.error.message;
  }
  return fallback;
}

export async function fetchAdminCourses(): Promise<Course[] | null> {
  try {
    const response = await fetch("/api/courses?includeUnpublished=true&take=100", {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      return null;
    }

    const payload = await parseJsonSafe<ListCoursesResponse>(response);
    const courses = payload.data ?? [];
    return courses.map(mapApiCourseToFrontendCourse);
  } catch (error) {
    console.error("fetchAdminCourses error", error);
    return null;
  }
}

export async function createAdminCourse(payload: CourseMutationPayload): Promise<Course | null> {
  const response = await fetch("/api/courses", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const payload = await parseJsonSafe<ApiErrorPayload>(response);
    throw new Error(extractApiErrorMessage(payload, "Course creation failed."));
  }

  const json = await parseJsonSafe<{ data?: ApiCourse }>(response);
  if (!json.data) {
    throw new Error("Course creation failed.");
  }

  return mapApiCourseToFrontendCourse(json.data);
}

export async function updateAdminCourse(
  courseId: string,
  payload: CourseMutationPayload
): Promise<Course | null> {
  const response = await fetch(`/api/courses/${courseId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const payload = await parseJsonSafe<ApiErrorPayload>(response);
    throw new Error(extractApiErrorMessage(payload, "Course update failed."));
  }

  const json = await parseJsonSafe<{ data?: ApiCourse }>(response);
  if (!json.data) {
    throw new Error("Course update failed.");
  }

  return mapApiCourseToFrontendCourse(json.data);
}

export async function fetchAdminCourseById(courseId: string): Promise<Course | null> {
  const response = await fetch(`/api/courses/${courseId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const json = await parseJsonSafe<{ data?: ApiCourse }>(response);
  if (!json.data) {
    return null;
  }

  return mapApiCourseToFrontendCourse(json.data);
}

export async function deleteAdminCourse(courseId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/courses/${courseId}`, {
      method: "DELETE",
      credentials: "include",
    });
    return response.ok;
  } catch (error) {
    console.error("deleteAdminCourse error", error);
    return false;
  }
}
