import type { Prisma } from "@prisma/client";
import {
  DEFAULT_TUTOR_LANGUAGES,
  DEFAULT_TUTOR_LOCATION,
  DEFAULT_TUTOR_PEDAGOGICAL_MODULES,
  DEFAULT_TUTOR_PROFILE_HIGHLIGHTS,
  DEFAULT_TUTOR_PROFILE_STATS,
} from "@/lib/tutors/profile-defaults";

export const publicTutorSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  tutorApprovalStatus: true,
  tutorApprovedAt: true,
  tutorApprovalNotes: true,
  avatarUrl: true,
  bio: true,
  rating: true,
  studentCount: true,
  coursesAuthored: true,
  location: true,
  languagesSpoken: true,
  profileHighlights: true,
  profileStats: true,
  pedagogicalModules: true,
  _count: {
    select: {
      authoredCourses: true,
    },
  },
} satisfies Prisma.UserSelect;

export const adminTutorSelect = {
  ...publicTutorSelect,
  passwordHash: true,
} satisfies Prisma.UserSelect;

type PublicTutorRecord = Prisma.UserGetPayload<{
  select: typeof publicTutorSelect;
}>;

type AdminTutorRecord = Prisma.UserGetPayload<{
  select: typeof adminTutorSelect;
}>;

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeStringArray(
  value: Prisma.JsonValue | null | undefined,
  fallback: string[]
): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeProfileStats(
  value: Prisma.JsonValue | null | undefined
): Array<{ id: string; label: string; value: string }> {
  if (!Array.isArray(value)) {
    return DEFAULT_TUTOR_PROFILE_STATS;
  }

  const normalized = value
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const label = normalizeString(candidate.label);
      const rawValue = candidate.value;
      const resolvedValue =
        typeof rawValue === "number"
          ? String(rawValue)
          : typeof rawValue === "string"
          ? rawValue.trim()
          : "";

      if (!label || !resolvedValue) {
        return null;
      }

      return {
        id: normalizeString(candidate.id) ?? `stat-${index + 1}`,
        label,
        value: resolvedValue,
      };
    })
    .filter((item): item is { id: string; label: string; value: string } => Boolean(item));

  return normalized.length > 0 ? normalized : DEFAULT_TUTOR_PROFILE_STATS;
}

function normalizePedagogicalModules(
  value: Prisma.JsonValue | null | undefined
): Array<{ id: string; title: string; description: string }> {
  if (!Array.isArray(value)) {
    return DEFAULT_TUTOR_PEDAGOGICAL_MODULES;
  }

  const normalized = value
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const title = normalizeString(candidate.title);
      const description = normalizeString(candidate.description);

      if (!title || !description) {
        return null;
      }

      return {
        id: normalizeString(candidate.id) ?? `pedagogy-${index + 1}`,
        title,
        description,
      };
    })
    .filter((item): item is { id: string; title: string; description: string } => Boolean(item));

  return normalized.length > 0 ? normalized : DEFAULT_TUTOR_PEDAGOGICAL_MODULES;
}

export function serializeTutor(tutor: PublicTutorRecord) {
  return {
    id: tutor.id,
    name: tutor.name,
    email: tutor.email,
    role: tutor.role,
    tutorApprovalStatus: tutor.tutorApprovalStatus,
    tutorApprovedAt: tutor.tutorApprovedAt?.toISOString() ?? null,
    tutorApprovalNotes: tutor.tutorApprovalNotes ?? null,
    avatarUrl: tutor.avatarUrl,
    bio: tutor.bio,
    rating: tutor.rating,
    studentCount: tutor.studentCount,
    coursesAuthored: tutor.coursesAuthored ?? tutor._count.authoredCourses,
    location: tutor.location ?? DEFAULT_TUTOR_LOCATION,
    languagesSpoken: tutor.languagesSpoken ?? DEFAULT_TUTOR_LANGUAGES,
    profileHighlights: normalizeStringArray(
      tutor.profileHighlights,
      DEFAULT_TUTOR_PROFILE_HIGHLIGHTS
    ),
    profileStats: normalizeProfileStats(tutor.profileStats),
    pedagogicalModules: normalizePedagogicalModules(tutor.pedagogicalModules),
  };
}

export function serializeTutorForAdmin(tutor: AdminTutorRecord) {
  return {
    ...serializeTutor(tutor),
    hasPassword: Boolean(tutor.passwordHash),
  };
}
