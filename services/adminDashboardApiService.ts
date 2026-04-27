type ApiAdminStats = {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
};

type ApiRecentSubmission = {
  id: string;
  title: string;
  tutorId: string;
  tutorName: string;
  status: string;
  createdAt: string;
};

type ApiActivityItem = {
  id: string;
  type: "enrollment" | "course_update";
  message: string;
  createdAt: string;
};

type ApiOverviewPayload = {
  data?: {
    stats: ApiAdminStats;
    recentSubmissions: ApiRecentSubmission[];
    activity: ApiActivityItem[];
  };
};

export type AdminDashboardOverview = {
  stats: ApiAdminStats;
  recentSubmissions: ApiRecentSubmission[];
  activity: ApiActivityItem[];
};

export async function fetchAdminDashboardOverview(): Promise<AdminDashboardOverview | null> {
  try {
    const response = await fetch("/api/admin/dashboard/overview", {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ApiOverviewPayload;
    if (!payload.data) {
      return null;
    }

    return payload.data;
  } catch (error) {
    console.error("fetchAdminDashboardOverview error", error);
    return null;
  }
}
