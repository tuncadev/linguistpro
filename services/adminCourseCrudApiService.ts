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
  imageUrl?: string;
  languageId?: string;
  levelId?: string;
  tutorId?: string;
  status?: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
  syllabus?: string[];
};

async function parseJsonSafe<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
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
  try {
    const response = await fetch("/api/courses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as { data?: ApiCourse };
    if (!json.data) {
      return null;
    }

    return mapApiCourseToFrontendCourse(json.data);
  } catch (error) {
    console.error("createAdminCourse error", error);
    return null;
  }
}

export async function updateAdminCourse(
  courseId: string,
  payload: CourseMutationPayload
): Promise<Course | null> {
  try {
    const response = await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as { data?: ApiCourse };
    if (!json.data) {
      return null;
    }

    return mapApiCourseToFrontendCourse(json.data);
  } catch (error) {
    console.error("updateAdminCourse error", error);
    return null;
  }
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
