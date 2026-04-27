import { User, UserRole } from "../types";
import {
  DEFAULT_TUTOR_LANGUAGES,
  DEFAULT_TUTOR_LOCATION,
  DEFAULT_TUTOR_PEDAGOGICAL_MODULES,
  DEFAULT_TUTOR_PROFILE_HIGHLIGHTS,
  DEFAULT_TUTOR_PROFILE_STATS,
} from "@/lib/tutors/profile-defaults";

export type ApiTutor = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  bio: string | null;
  rating: number | null;
  studentCount: number | null;
  coursesAuthored: number | null;
  hasPassword?: boolean | null;
  tutorApprovalStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  tutorApprovedAt?: string | null;
  tutorApprovalNotes?: string | null;
  location?: string | null;
  languagesSpoken?: string | null;
  profileHighlights?: string[] | null;
  profileStats?: Array<{
    id?: string;
    label: string;
    value: string;
  }> | null;
  pedagogicalModules?: Array<{
    id?: string;
    title: string;
    description: string;
  }> | null;
};

type TutorListResponse = {
  data?: ApiTutor[];
};

export function mapApiTutorToFrontendTutor(tutor: ApiTutor): User {
  return {
    id: tutor.id,
    name: tutor.name?.trim() || tutor.email,
    email: tutor.email,
    role: tutor.role,
    avatar:
      tutor.avatarUrl ||
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    bio: tutor.bio || undefined,
    rating: tutor.rating ?? undefined,
    studentCount: tutor.studentCount ?? undefined,
    coursesAuthored: tutor.coursesAuthored ?? undefined,
    hasPassword: tutor.hasPassword ?? undefined,
    tutorApprovalStatus: tutor.tutorApprovalStatus ?? undefined,
    tutorApprovedAt: tutor.tutorApprovedAt ?? undefined,
    tutorApprovalNotes: tutor.tutorApprovalNotes ?? undefined,
    location: tutor.location || DEFAULT_TUTOR_LOCATION,
    languagesSpoken: tutor.languagesSpoken || DEFAULT_TUTOR_LANGUAGES,
    profileHighlights:
      tutor.profileHighlights && tutor.profileHighlights.length > 0
        ? tutor.profileHighlights
        : DEFAULT_TUTOR_PROFILE_HIGHLIGHTS,
    profileStats:
      tutor.profileStats && tutor.profileStats.length > 0
        ? tutor.profileStats.map((item, index) => ({
            id: item.id || `stat-${index + 1}`,
            label: item.label,
            value: item.value,
          }))
        : DEFAULT_TUTOR_PROFILE_STATS,
    pedagogicalModules:
      tutor.pedagogicalModules && tutor.pedagogicalModules.length > 0
        ? tutor.pedagogicalModules.map((item, index) => ({
            id: item.id || `pedagogy-${index + 1}`,
            title: item.title,
            description: item.description,
          }))
        : DEFAULT_TUTOR_PEDAGOGICAL_MODULES,
  };
}

export async function fetchTutors(): Promise<User[] | null> {
  try {
    const response = await fetch("/api/tutors");
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as TutorListResponse;
    if (!payload.data) {
      return [];
    }

    return payload.data.map(mapApiTutorToFrontendTutor);
  } catch (error) {
    console.error("fetchTutors error", error);
    return null;
  }
}
