import { User, UserRole } from "../types";

type BackendRole = "STUDENT" | "TUTOR" | "ADMIN";

type BackendUser = {
  id: string;
  name?: string | null;
  email: string;
  role: BackendRole;
  preferredLocale?: "uk" | "en" | "es" | "tr" | "ru" | null;
  avatarUrl?: string | null;
  bio?: string | null;
  rating?: number | null;
  studentCount?: number | null;
  coursesAuthored?: number | null;
  emailVerifiedAt?: string | null;
  onboardingCompletedAt?: string | null;
  tutorApprovalStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  tutorApprovedAt?: string | null;
  tutorApprovalNotes?: string | null;
  location?: string | null;
  languagesSpoken?: string | null;
  profileHighlights?: string[] | null;
  profileStats?:
    | Array<{
        id?: string;
        label: string;
        value: string;
      }>
    | null;
  pedagogicalModules?:
    | Array<{
        id?: string;
        title: string;
        description: string;
      }>
    | null;
};

type LoginResponse = {
  error?: string;
  user?: BackendUser;
};

type RegisterResponse = {
  error?: string;
  message?: string;
  verificationRequired?: boolean;
  verificationToken?: string;
  user?: BackendUser;
};

type GenericAuthResponse = {
  error?: string;
  message?: string;
  verificationToken?: string;
  resetToken?: string;
};

type SessionResponse = {
  authenticated?: boolean;
  user?: BackendUser;
};

type LocaleResponse = {
  locale?: "uk" | "en" | "es" | "tr" | "ru";
  user?: BackendUser;
  error?: string;
};

type ProfileResponse = {
  data?: BackendUser;
  error?: string | { message?: string } | null;
};

const DEFAULT_AVATAR_BY_ROLE: Record<BackendRole, string> = {
  ADMIN: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
  TUTOR: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
  STUDENT: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
};

function avatarByRole(role: BackendRole): string {
  return DEFAULT_AVATAR_BY_ROLE[role];
}

function mapBackendUser(user: BackendUser): User {
  return {
    id: user.id,
    name: user.name?.trim() || user.email,
    email: user.email,
    role: user.role as UserRole,
    preferredLocale: user.preferredLocale ?? undefined,
    avatar: user.avatarUrl || avatarByRole(user.role),
    avatarUrl: user.avatarUrl ?? undefined,
    bio: user.bio || undefined,
    rating: user.rating ?? undefined,
    studentCount: user.studentCount ?? undefined,
    coursesAuthored: user.coursesAuthored ?? undefined,
    emailVerifiedAt: user.emailVerifiedAt ?? undefined,
    onboardingCompletedAt: user.onboardingCompletedAt ?? undefined,
    tutorApprovalStatus: user.tutorApprovalStatus ?? undefined,
    tutorApprovedAt: user.tutorApprovedAt ?? undefined,
    tutorApprovalNotes: user.tutorApprovalNotes ?? undefined,
    location: user.location || undefined,
    languagesSpoken: user.languagesSpoken || undefined,
    profileHighlights: user.profileHighlights ?? undefined,
    profileStats:
      user.profileStats?.map((item, index) => ({
        id: item.id || `stat-${index + 1}`,
        label: item.label,
        value: item.value,
      })) ?? undefined,
    pedagogicalModules:
      user.pedagogicalModules?.map((item, index) => ({
        id: item.id || `pedagogy-${index + 1}`,
        title: item.title,
        description: item.description,
      })) ?? undefined,
  };
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    const message = (error as { message: string }).message.trim();
    if (message.length > 0) {
      return message;
    }
  }

  return fallback;
}

export async function fetchSessionUser(): Promise<User | null> {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const payload = await parseJson<SessionResponse>(response);
  if (!payload.authenticated || !payload.user) {
    return null;
  }

  return mapBackendUser(payload.user);
}

export async function loginUser(email: string, password: string): Promise<User> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const payload = await parseJson<LoginResponse>(response);
  if (!response.ok || !payload.user) {
    throw new Error(payload.error || "Login failed");
  }

  return mapBackendUser(payload.user);
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<{ verificationRequired: boolean; verificationToken?: string; message?: string; user?: User }> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password }),
  });

  const payload = await parseJson<RegisterResponse>(response);
  if (!response.ok) {
    throw new Error(payload.error || "Registration failed");
  }

  return {
    verificationRequired: Boolean(payload.verificationRequired),
    verificationToken: payload.verificationToken,
    message: payload.message,
    user: payload.user ? mapBackendUser(payload.user) : undefined,
  };
}

export async function requestEmailVerification(email: string): Promise<{ message: string; verificationToken?: string }> {
  const response = await fetch("/api/auth/request-verification", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const payload = await parseJson<GenericAuthResponse>(response);
  if (!response.ok) {
    throw new Error(payload.error || "Verification request failed");
  }

  return {
    message: payload.message || "Verification token generated.",
    verificationToken: payload.verificationToken,
  };
}

export async function verifyEmailToken(token: string): Promise<string> {
  const response = await fetch("/api/auth/verify-email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const payload = await parseJson<GenericAuthResponse>(response);
  if (!response.ok) {
    throw new Error(payload.error || "Email verification failed");
  }
  return payload.message || "Email verification successful.";
}

export async function requestPasswordReset(email: string): Promise<{ message: string; resetToken?: string }> {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const payload = await parseJson<GenericAuthResponse>(response);
  if (!response.ok) {
    throw new Error(payload.error || "Password reset request failed");
  }
  return {
    message: payload.message || "Reset token generated.",
    resetToken: payload.resetToken,
  };
}

export async function resetPasswordWithToken(token: string, password: string): Promise<string> {
  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  const payload = await parseJson<GenericAuthResponse>(response);
  if (!response.ok) {
    throw new Error(payload.error || "Password reset failed");
  }
  return payload.message || "Password reset successful.";
}

export async function logoutUser(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

export async function updatePreferredLocale(
  locale: "uk" | "en" | "es" | "tr" | "ru"
): Promise<User | null> {
  const response = await fetch("/api/auth/locale", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ locale }),
  });

  const payload = await parseJson<LocaleResponse>(response);
  if (!response.ok) {
    throw new Error(payload.error || "Failed to update preferred locale");
  }

  return payload.user ? mapBackendUser(payload.user) : null;
}

export async function fetchPersonalProfile(): Promise<User | null> {
  const response = await fetch("/api/auth/profile", {
    method: "GET",
    credentials: "include",
  });

  const payload = await parseJson<ProfileResponse>(response);
  if (!response.ok || !payload.data) {
    return null;
  }

  return mapBackendUser(payload.data);
}

export async function updatePersonalProfile(input: {
  name?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}): Promise<User> {
  const response = await fetch("/api/auth/profile", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const payload = await parseJson<ProfileResponse>(response);
  if (!response.ok || !payload.data) {
    throw new Error(extractApiErrorMessage(payload.error, "Failed to update profile"));
  }

  return mapBackendUser(payload.data);
}
