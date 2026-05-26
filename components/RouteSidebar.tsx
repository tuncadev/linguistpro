"use client";

import { LayoutGrid, Shield, UserCog, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { localizePath, stripLocalePrefix } from "@/i18n/locale-path";
import { normalizeLocale } from "@/i18n/routing";

type SidebarRole = "STUDENT" | "TUTOR" | "ADMIN";

type RouteSidebarProps = {
  role: SidebarRole;
};

type SidebarItem = {
  id: string;
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
};

function isActivePath(currentPath: string, itemPath: string): boolean {
  if (itemPath === "/courses") {
    return currentPath === "/courses" || currentPath.startsWith("/courses/");
  }
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

export default function RouteSidebar({ role }: RouteSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = normalizeLocale(useLocale());
  const tNav = useTranslations("sidebar");
  const currentPath = stripLocalePrefix(pathname);

  const adminItems: SidebarItem[] =
    role === "ADMIN"
      ? [
          {
            id: "admin-courses",
            label: tNav("adminCoursesPage"),
            path: "/admin/courses",
            icon: LayoutGrid,
          },
          {
            id: "admin-tutors",
            label: tNav("adminTutorsPage"),
            path: "/admin/tutors",
            icon: UserCog,
          },
          {
            id: "admin-users",
            label: tNav("adminManageUsers"),
            path: "/admin/users",
            icon: Users,
          },
          {
            id: "admin-taxonomies",
            label: tNav("adminTaxonomies"),
            path: "/admin/taxonomies",
            icon: Shield,
          },
        ]
      : [];

  if (adminItems.length === 0) {
    return null;
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="space-y-1 p-4">
        <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {tNav("administration")}
        </p>
        {adminItems.map((item) => {
          const active = isActivePath(currentPath, item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => router.push(localizePath(item.path, locale))}
              className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-all ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              type="button"
            >
              <span className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
