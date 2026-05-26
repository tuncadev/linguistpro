import Link from "next/link";
import { CommunicationTemplate, Role } from "@prisma/client";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/i18n/format";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

function formatNullable(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "—";
}

export default async function AdminUserDetailPage({ params }: Params) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("dashboard.adminUsers");
  const tx = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      bio: true,
      preferredLocale: true,
      emailVerifiedAt: true,
      onboardingCompletedAt: true,
      welcomeDismissedAt: true,
      tutorApprovalStatus: true,
      tutorApprovedAt: true,
      tutorApprovalNotes: true,
      location: true,
      languagesSpoken: true,
      rating: true,
      studentCount: true,
      coursesAuthored: true,
      profileHighlights: true,
      profileStats: true,
      pedagogicalModules: true,
      createdAt: true,
      updatedAt: true,
      enrollments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          trial: true,
          createdAt: true,
          course: {
            select: {
              id: true,
              title: true,
              status: true,
              price: true,
              language: { select: { name: true } },
              level: { select: { name: true } },
              tutor: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
      authoredCourses: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          price: true,
          studentCount: true,
          language: { select: { name: true } },
          level: { select: { name: true } },
        },
      },
      communications: {
        where: {
          template: CommunicationTemplate.PAYMENT_RECEIPT,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          status: true,
          subject: true,
          createdAt: true,
          sentAt: true,
          failedAt: true,
          meta: true,
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const displayName = user.name?.trim() || tx("labels.unnamedUser", "Unnamed user");
  const isStudent = user.role === Role.STUDENT;
  const isTutor = user.role === Role.TUTOR;
  const isAdmin = user.role === Role.ADMIN;
  const roleLabel =
    user.role === Role.STUDENT
      ? tx("roles.student", "Student")
      : user.role === Role.TUTOR
      ? tx("roles.tutor", "Tutor")
      : tx("roles.admin", "Admin");
  const yesLabel = tx("labels.yes", "Yes");
  const noLabel = tx("labels.no", "No");
  const avatarFallback =
    user.role === Role.ADMIN
      ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800"
      : user.role === Role.TUTOR
      ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800"
      : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800";

  return (
    <main className="p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
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
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
            >
              {tx("tabs.users", "Users")}
            </Link>
            <Link
              href={`/admin/users/${user.id}`}
              className="rounded-full bg-sky-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
            >
              {tx("tabs.user", "User")}
            </Link>
          </div>

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={user.avatarUrl || avatarFallback}
                className="h-16 w-16 rounded-2xl border border-slate-200 object-cover"
                alt={displayName}
              />
              <div>
                <h1 className="text-2xl font-black text-slate-900">{displayName}</h1>
                <p className="text-sm font-semibold text-slate-600">{user.email}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {tx("labels.userId", "User ID")}: {user.id}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
              <p>{tx("labels.role", "Role")}: {roleLabel}</p>
              <p className="mt-1">
                {tx("labels.joined", "Joined")}: {formatDate(user.createdAt, locale, { year: "numeric", month: "short", day: "numeric" })}
              </p>
              <p className="mt-1">
                {tx("labels.updated", "Last Updated")}: {formatDate(user.updatedAt, locale, { year: "numeric", month: "short", day: "numeric" })}
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-black text-slate-900">{tx("profile.title", "Profile Information")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("labels.preferredLocale", "Preferred Locale")}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{formatNullable(user.preferredLocale)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("labels.location", "Location")}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{formatNullable(user.location)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("labels.languagesSpoken", "Languages Spoken")}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{formatNullable(user.languagesSpoken)}</p>
              </div>
              {isTutor ? (
                <>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("labels.rating", "Rating")}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{user.rating ?? "—"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("labels.studentCount", "Student Count")}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{user.studentCount ?? "—"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("labels.coursesAuthored", "Courses Authored")}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{user.coursesAuthored ?? "—"}</p>
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("labels.bio", "Bio")}</p>
              <p className="mt-1 text-sm text-slate-700">{formatNullable(user.bio)}</p>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">{tx("account.title", "Account State")}</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p><span className="font-bold">{tx("labels.emailVerified", "Email Verified")}:</span> {user.emailVerifiedAt ? yesLabel : noLabel}</p>
              {isStudent ? (
                <>
                  <p>
                    <span className="font-bold">{tx("labels.onboardingCompleted", "Onboarding Completed")}:</span>{" "}
                    {user.onboardingCompletedAt
                      ? formatDate(user.onboardingCompletedAt, locale, { year: "numeric", month: "short", day: "numeric" })
                      : noLabel}
                  </p>
                  <p>
                    <span className="font-bold">{tx("labels.welcomeDismissed", "Welcome Dismissed")}:</span>{" "}
                    {user.welcomeDismissedAt
                      ? formatDate(user.welcomeDismissedAt, locale, { year: "numeric", month: "short", day: "numeric" })
                      : noLabel}
                  </p>
                </>
              ) : null}
              {isTutor ? (
                <>
                  <p><span className="font-bold">{tx("labels.tutorApprovalStatus", "Tutor Approval")}</span>: {user.tutorApprovalStatus}</p>
                  <p>
                    <span className="font-bold">{tx("labels.tutorApprovedAt", "Tutor Approved At")}:</span>{" "}
                    {user.tutorApprovedAt
                      ? formatDate(user.tutorApprovedAt, locale, { year: "numeric", month: "short", day: "numeric" })
                      : "—"}
                  </p>
                  <p><span className="font-bold">{tx("labels.tutorApprovalNotes", "Tutor Approval Notes")}:</span> {formatNullable(user.tutorApprovalNotes)}</p>
                </>
              ) : null}
              {isAdmin ? (
                <p className="text-xs text-slate-500">
                  {tx("account.adminNote", "Admin accounts do not have student onboarding or tutor approval workflow fields.")}
                </p>
              ) : null}
            </div>
          </article>
        </section>

        {isStudent ? (
          <section className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">{tx("enrollments.title", "Enrollments")}</h2>
              {user.enrollments.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">{tx("enrollments.empty", "No enrollments found.")}</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {user.enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="rounded-xl border border-slate-200 p-3">
                      <p className="text-sm font-black text-slate-900">{enrollment.course.title}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {enrollment.course.language.name} · {enrollment.course.level.name} · {enrollment.course.status}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {enrollment.trial ? tx("enrollments.trial", "TRIAL") : tx("enrollments.paid", "PAID")} · {formatCurrency(Number(enrollment.course.price), locale)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {tx("enrollments.enrolled", "Enrolled")}: {formatDate(enrollment.createdAt, locale, { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {tx("enrollments.tutor", "Tutor")}: {enrollment.course.tutor.name} ({enrollment.course.tutor.email})
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">{tx("payments.title", "Payment Records")}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {tx(
                  "payments.subtitle",
                  "Current backend stores payment receipt communications, not a full payment ledger."
                )}
              </p>

              {user.communications.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">{tx("payments.empty", "No payment receipt records found.")}</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {user.communications.map((payment) => {
                    const meta =
                      payment.meta && typeof payment.meta === "object" && !Array.isArray(payment.meta)
                        ? (payment.meta as Record<string, unknown>)
                        : null;
                    const amountLabel = typeof meta?.amountLabel === "string" ? meta.amountLabel : null;

                    return (
                      <div key={payment.id} className="rounded-xl border border-slate-200 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{payment.status}</p>
                        <p className="mt-1 text-sm font-black text-slate-900">{payment.course?.title || payment.subject}</p>
                        <p className="mt-1 text-xs text-slate-600">{amountLabel || tx("payments.amountMissing", "Amount not recorded")}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {tx("payments.createdAt", "Created")}: {formatDate(payment.createdAt, locale, { year: "numeric", month: "short", day: "numeric" })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          </section>
        ) : null}

        {isTutor ? (
          <section className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">{tx("authoredCourses.title", "Authored Courses")}</h2>
              {user.authoredCourses.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">{tx("authoredCourses.empty", "No authored courses found.")}</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {user.authoredCourses.map((course) => (
                    <div key={course.id} className="rounded-xl border border-slate-200 p-3">
                      <p className="text-sm font-black text-slate-900">{course.title}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {course.language.name} · {course.level.name} · {course.status}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatCurrency(Number(course.price), locale)} · {tx("authoredCourses.students", "Students")} {course.studentCount}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">{tx("rawProfile.title", "Extended Raw Profile Data")}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {tx("rawProfile.subtitle", "Serialized profile arrays/objects captured on the user record.")}
              </p>
              <pre className="mt-4 max-h-80 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
{JSON.stringify(
  {
    profileHighlights: user.profileHighlights,
    profileStats: user.profileStats,
    pedagogicalModules: user.pedagogicalModules,
  },
  null,
  2
)}
              </pre>
            </article>
          </section>
        ) : null}
      </div>
    </main>
  );
}
