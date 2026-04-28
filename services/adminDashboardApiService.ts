type ApiAdminStats = {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
};

type ApiAdminKpis = {
  mrrProxy30d: number;
  onboardingCompletionRate: number;
  tutorApprovalRate: number;
  pendingTutorApprovals: number;
  pendingCourseSubmissions: number;
  upcomingLiveClasses: number;
  completedLiveClasses: number;
  cancelledLiveClasses: number;
  attendanceParticipants: number;
  averageAttendanceJoins: number;
  averageAttendanceMinutes: number;
  recordingAssets: number;
  communicationSent: number;
  communicationFailed: number;
  communicationPending: number;
  communicationSent7d: number;
  communicationFailed7d: number;
  communicationSuccessRate7d: number;
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
  type: "enrollment" | "course_update" | "communication" | "live_class";
  message: string;
  createdAt: string;
};

type ApiOverviewPayload = {
  data?: {
    stats: ApiAdminStats;
    kpis: ApiAdminKpis;
    recentSubmissions: ApiRecentSubmission[];
    activity: ApiActivityItem[];
  };
};

export type AdminDashboardOverview = {
  stats: ApiAdminStats;
  kpis: ApiAdminKpis;
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
