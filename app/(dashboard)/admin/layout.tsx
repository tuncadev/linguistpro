import type { ReactNode } from "react";

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-6">{children}</div>
    </div>
  );
}
