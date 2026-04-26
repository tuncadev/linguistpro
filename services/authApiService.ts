import { MOCK_USERS } from "../constants";
import { User, UserRole } from "../types";

type BackendRole = "STUDENT" | "TUTOR" | "ADMIN";

type BackendUser = {
  id: string;
  name?: string | null;
  email: string;
  role: BackendRole;
};

type LoginResponse = {
  error?: string;
  user?: BackendUser;
};

type RegisterResponse = {
  error?: string;
  user?: BackendUser;
};

type SessionResponse = {
  authenticated?: boolean;
  user?: BackendUser;
};

function avatarByRole(role: BackendRole): string | undefined {
  return MOCK_USERS.find((user) => user.role === role)?.avatar;
}

function mapBackendUser(user: BackendUser): User {
  return {
    id: user.id,
    name: user.name?.trim() || user.email,
    email: user.email,
    role: user.role as UserRole,
    avatar: avatarByRole(user.role),
  };
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
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
): Promise<User> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password }),
  });

  const payload = await parseJson<RegisterResponse>(response);
  if (!response.ok || !payload.user) {
    throw new Error(payload.error || "Registration failed");
  }

  return mapBackendUser(payload.user);
}

export async function logoutUser(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}
