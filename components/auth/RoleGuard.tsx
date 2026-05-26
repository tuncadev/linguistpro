"use client";

import type { ReactNode } from "react";

type RoleGuardProps = {
  children: ReactNode;
};

export default function RoleGuard({ children }: RoleGuardProps) {
  // TODO: replace this with real session + role checks.
  return <>{children}</>;
}
