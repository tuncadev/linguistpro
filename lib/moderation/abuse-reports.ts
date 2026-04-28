import { AbuseReportStatus, AbuseTargetType } from "@prisma/client";

export const abuseReportSelect = {
  id: true,
  reporterId: true,
  targetType: true,
  targetId: true,
  reason: true,
  details: true,
  status: true,
  moderationNotes: true,
  reviewedById: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  reporter: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} as const;

type SelectedAbuseReport = {
  id: string;
  reporterId: string;
  targetType: AbuseTargetType;
  targetId: string;
  reason: string;
  details: string | null;
  status: AbuseReportStatus;
  moderationNotes: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  reporter: {
    id: string;
    name: string | null;
    email: string;
    role: "STUDENT" | "TUTOR" | "ADMIN";
  };
};

export function serializeAbuseReport(report: SelectedAbuseReport) {
  return {
    id: report.id,
    reporterId: report.reporterId,
    targetType: report.targetType,
    targetId: report.targetId,
    reason: report.reason,
    details: report.details,
    status: report.status,
    moderationNotes: report.moderationNotes,
    reviewedById: report.reviewedById,
    reviewedAt: report.reviewedAt?.toISOString() ?? null,
    reporter: report.reporter,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}
