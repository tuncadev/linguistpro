export type AppRole = "STUDENT" | "TUTOR" | "ADMIN";

export function canAccessPath(role: AppRole | null, pathname: string): boolean {
  if (pathname.startsWith("/admin")) {
    return role === "ADMIN";
  }

  if (pathname.startsWith("/tutor")) {
    return role === "TUTOR" || role === "ADMIN";
  }

  if (pathname.startsWith("/student")) {
    return role === "STUDENT" || role === "TUTOR" || role === "ADMIN";
  }

  return true;
}

