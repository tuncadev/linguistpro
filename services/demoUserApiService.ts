import { User, UserRole } from "../types";

type ApiDemoUser = {
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

type DemoUsersResponse = {
  data?: ApiDemoUser[];
};

const DEFAULT_AVATAR_BY_ROLE: Record<UserRole, string> = {
  ADMIN: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
  TUTOR: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
  STUDENT: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
};

function mapDemoUser(user: ApiDemoUser): User {
  return {
    id: user.id,
    name: user.name?.trim() || user.email,
    email: user.email,
    role: user.role,
    avatar: user.avatarUrl || DEFAULT_AVATAR_BY_ROLE[user.role],
    bio: user.bio || undefined,
    rating: user.rating ?? undefined,
    studentCount: user.studentCount ?? undefined,
    coursesAuthored: user.coursesAuthored ?? undefined,
  };
}

export async function fetchDemoUsers(): Promise<User[] | null> {
  try {
    const response = await fetch("/api/demo-users");
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as DemoUsersResponse;
    if (!payload.data) {
      return [];
    }

    return payload.data.map(mapDemoUser);
  } catch (error) {
    console.error("fetchDemoUsers error", error);
    return null;
  }
}
