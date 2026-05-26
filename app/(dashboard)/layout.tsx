import RoleGuard from "@/components/auth/RoleGuard";
import type { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <RoleGuard>{children}</RoleGuard>;
}
