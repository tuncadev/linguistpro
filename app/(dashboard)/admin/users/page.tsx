import Link from "next/link";
import { Role, TutorApprovalStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";

const ROLE_GROUP_ORDER: Role[] = [Role.STUDENT, Role.TUTOR, Role.ADMIN];

function parseRoleFilter(value: string | undefined): Role | null {
  if (!value) return null;
  if (value === Role.STUDENT || value === Role.TUTOR || value === Role.ADMIN) return value;
  return null;
}

function roleGroupRank(role: Role): number {
  const index = ROLE_GROUP_ORDER.indexOf(role);
  return index === -1 ? ROLE_GROUP_ORDER.length : index;
}

function roleBadgeClass(role: Role): string {
  if (role === Role.ADMIN) return "bg-rose-600/90 text-white";
  if (role === Role.TUTOR) return "bg-amber-500/90 text-white";
  return "bg-sky-600/90 text-white";
}

function roleCardBackgroundClass(role: Role): string {
  if (role === Role.ADMIN) return "bg-rose-100/80";
  if (role === Role.TUTOR) return "bg-amber-100/80";
  return "bg-sky-100/80";
}

function userStatus(user: {
  role: Role;
  emailVerifiedAt: Date | null;
  onboardingCompletedAt: Date | null;
  tutorApprovalStatus: TutorApprovalStatus;
}): string {
  if (!user.emailVerifiedAt) return "Email Unverified";
  if (user.role === Role.TUTOR) {
    if (user.tutorApprovalStatus === TutorApprovalStatus.APPROVED) return "Tutor Approved";
    if (user.tutorApprovalStatus === TutorApprovalStatus.REJECTED) return "Tutor Rejected";
    return "Tutor Pending";
  }
  if (user.role === Role.STUDENT) {
    return user.onboardingCompletedAt ? "Onboarded" : "Onboarding Pending";
  }
  return "Admin Active";
}

function statusBadgeClass(status: string): string {
  if (status.includes("Unverified")) return "bg-rose-600/90 text-white";
  if (status.includes("Rejected")) return "bg-rose-600/90 text-white";
  if (status.includes("Pending")) return "bg-amber-500/90 text-white";
  return "bg-emerald-600/90 text-white";
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ role?: string }> | { role?: string };
}) {
  const t = await getTranslations("dashboard.adminUsers");
  const tx = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeRole = parseRoleFilter(resolvedSearchParams?.role);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      emailVerifiedAt: true,
      onboardingCompletedAt: true,
      tutorApprovalStatus: true,
      createdAt: true,
      _count: {
        select: {
          enrollments: true,
          authoredCourses: true,
        },
      },
    },
  });

  const totals = {
    all: users.length,
    students: users.filter((user) => user.role === Role.STUDENT).length,
    tutors: users.filter((user) => user.role === Role.TUTOR).length,
    admins: users.filter((user) => user.role === Role.ADMIN).length,
  };

  const groupedUsers = [...users]
    .filter((user) => (activeRole ? user.role === activeRole : true))
    .sort((a, b) => {
      const roleDiff = roleGroupRank(a.role) - roleGroupRank(b.role);
      if (roleDiff !== 0) return roleDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  const activeRoleLabel = activeRole
    ? activeRole === Role.STUDENT
      ? tx("stats.students", "Students")
      : activeRole === Role.TUTOR
      ? tx("stats.tutors", "Tutors")
      : tx("stats.admins", "Admins")
    : tx("stats.allUsers", "All Users");

  const statsCardClass = (isActive: boolean) =>
    `block rounded-2xl border bg-white p-5 shadow-sm transition-colors ${
      isActive ? "border-sky-400 ring-2 ring-sky-100" : "border-slate-200 hover:border-sky-200"
    }`;

  return (
    <main className="p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/courses"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
            >
              {tx("tabs.courses", "Courses")}
            </Link>
            <Link
              href="/admin/tutors"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
            >
              {tx("tabs.tutors", "Tutors")}
            </Link>
            <Link
              href="/admin/users"
              className="rounded-full bg-sky-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
            >
              {tx("tabs.users", "Users")}
            </Link>
          </div>

          <h1 className="text-3xl font-black text-slate-900">{tx("title", "Admin User Management")}</h1>
          <p className="text-sm text-slate-600">
            {tx(
              "subtitle",
              "Browse every account quickly, then open a user page for full profile, enrollment, and payment-related details."
            )}
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/users" className={statsCardClass(activeRole === null)}>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("stats.allUsers", "All Users")}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{totals.all}</p>
          </Link>
          <Link href="/admin/users?role=STUDENT" className={statsCardClass(activeRole === Role.STUDENT)}>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("stats.students", "Students")}</p>
            <p className="mt-2 text-3xl font-black text-sky-700">{totals.students}</p>
          </Link>
          <Link href="/admin/users?role=TUTOR" className={statsCardClass(activeRole === Role.TUTOR)}>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("stats.tutors", "Tutors")}</p>
            <p className="mt-2 text-3xl font-black text-amber-600">{totals.tutors}</p>
          </Link>
          <Link href="/admin/users?role=ADMIN" className={statsCardClass(activeRole === Role.ADMIN)}>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("stats.admins", "Admins")}</p>
            <p className="mt-2 text-3xl font-black text-rose-600">{totals.admins}</p>
          </Link>
        </section>

        {groupedUsers.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            {tx("empty", "No users found.")} {tx("labels.filteredBy", "Filtered by")}: {activeRoleLabel}
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groupedUsers.map((user) => {
              const status = userStatus(user);
              const displayName = user.name?.trim() || tx("labels.unnamedUser", "Unnamed user");
              const avatarFallback =
                user.role === Role.ADMIN
                  ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800"
                  : user.role === Role.TUTOR
                  ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800"
                  : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800";

              return (
                <article
                  key={user.id}
                  className={`overflow-hidden rounded-3xl border border-slate-200 shadow-sm ${roleCardBackgroundClass(
                    user.role
                  )}`}
                >
                  <div className="relative h-48">
                    <img
                      src={user.avatarUrl || avatarFallback}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span
                        className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-tight shadow-sm ${roleBadgeClass(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                      <span
                        className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-tight shadow-sm ${statusBadgeClass(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 p-5">
                    <h2 className="line-clamp-1 text-lg font-black text-slate-900">{displayName}</h2>
                    <p className="line-clamp-1 text-sm text-slate-600">{user.email}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {tx("labels.enrollments", "Enrollments")}: {user._count.enrollments} ·{" "}
                      {tx("labels.authoredCourses", "Authored Courses")}: {user._count.authoredCourses}
                    </p>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {tx("labels.userId", "User ID")} {user.id.slice(0, 8)}
                      </span>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-sky-700"
                      >
                        {tx("actions.viewDetails", "View Details")}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
