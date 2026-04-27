"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const ADMIN_LINKS = [
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/tutors", label: "Tutors" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/taxonomies", label: "Taxonomies" },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-[1600px] gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-64 shrink-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
          <p className="mb-3 px-2 text-xs font-black uppercase tracking-widest text-slate-400">
            Admin Dashboard
          </p>
          <nav className="space-y-1.5">
            {ADMIN_LINKS.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                    active
                      ? "bg-[#2d3e50] text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
