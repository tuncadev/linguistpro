type EnrollmentApiItem = {
  id: string;
  courseId: string;
  studentId: string;
};

type ListEnrollmentsResponse = {
  data?: EnrollmentApiItem[];
};

type CreateEnrollmentResponse = {
  data?: EnrollmentApiItem;
  idempotentReplay?: boolean;
  error?: {
    message?: string;
  };
};

async function parseJsonSafe<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export async function fetchMyEnrollmentCourseIds(): Promise<string[] | null> {
  try {
    const response = await fetch("/api/enroll", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const payload = await parseJsonSafe<ListEnrollmentsResponse>(response);
    if (!payload.data) {
      return [];
    }

    return payload.data.map((item) => item.courseId);
  } catch {
    return null;
  }
}

export async function enrollInCourse(courseId: string): Promise<{
  ok: boolean;
  idempotentReplay: boolean;
  errorMessage?: string;
}> {
  try {
    const response = await fetch("/api/enroll", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ courseId }),
    });

    const payload = await parseJsonSafe<CreateEnrollmentResponse>(response);
    if (!response.ok) {
      return {
        ok: false,
        idempotentReplay: false,
        errorMessage: payload.error?.message || "Enrollment failed.",
      };
    }

    return {
      ok: true,
      idempotentReplay: payload.idempotentReplay === true,
    };
  } catch {
    return {
      ok: false,
      idempotentReplay: false,
      errorMessage: "Enrollment request failed.",
    };
  }
}
