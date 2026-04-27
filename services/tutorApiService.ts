import { User, UserRole } from "../types";

type ApiTutor = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  bio: string | null;
  rating: number | null;
  studentCount: number | null;
  coursesAuthored: number | null;
};

type TutorListResponse = {
  data?: ApiTutor[];
};

function mapTutor(tutor: ApiTutor): User {
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

    return payload.data.map(mapTutor);
  } catch (error) {
    console.error("fetchTutors error", error);
    return null;
  }
}

