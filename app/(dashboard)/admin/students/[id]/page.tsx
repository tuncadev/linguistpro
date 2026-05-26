import Link from "next/link";
import { Role, CommunicationTemplate } from "@prisma/client";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/i18n/format";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

export default async function AdminStudentDetailPage({ params }: Params) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("dashboard.adminStudents");
  const tx = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);

  const student = await prisma.user.findUnique({
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
              language: {
                select: {
                  name: true,
                },
              },
              level: {
                select: {
                  name: true,
                },
              },
              tutor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      communications: {
        where: {
          template: CommunicationTemplate.PAYMENT_RECEIPT,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          status: true,
          subject: true,
          recipientEmail: true,
          sentAt: true,
          failedAt: true,
          createdAt: true,
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

  if (!student || student.role !== Role.STUDENT) {
    notFound();
  }

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
              href="/admin/users"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
            >
              {tx("tabs.users", "Users")}
            </Link>
            <Link
              href={`/admin/students/${student.id}`}
              className="rounded-full bg-sky-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
            >
              {tx("tabs.student", "Student")}
            </Link>
          </div>

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={
                  student.avatarUrl ||
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"
                }
                className="h-16 w-16 rounded-2xl border border-slate-200 object-cover"
                alt={student.name || student.email}
              />
              <div>
                <h1 className="text-2xl font-black text-slate-900">
                  {student.name || tx("labels.unnamedStudent", "Unnamed student")}
                </h1>
                <p className="text-sm font-semibold text-slate-600">{student.email}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {tx("labels.studentId", "Student ID")}: {student.id}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
              <p>
                {tx("labels.joined", "Joined")}{" "}
                {formatDate(student.createdAt, locale, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="mt-1">
                {tx("labels.locale", "Preferred Locale")}: {student.preferredLocale || "—"}
              </p>
              <p className="mt-1">
                {tx("labels.verified", "Email Verified")}: {student.emailVerifiedAt ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-black text-slate-900">
              {tx("enrollments.title", "Enrolled Courses")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {tx("enrollments.subtitle", "Full enrollment history for this student.")}
            </p>

            {student.enrollments.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                {tx("enrollments.empty", "This student has no enrollments yet.")}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {student.enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {enrollment.course.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {enrollment.course.language.name} · {enrollment.course.level.name} ·{" "}
                          {enrollment.course.status}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {tx("enrollments.tutor", "Tutor")}: {enrollment.course.tutor.name} (
                          {enrollment.course.tutor.email})
                        </p>
                      </div>
                      <div className="text-right text-xs font-semibold text-slate-600">
                        <p>{formatCurrency(Number(enrollment.course.price), locale)}</p>
                        <p className="mt-1 uppercase tracking-wide text-slate-500">
                          {enrollment.trial ? "TRIAL" : "PAID"}
                        </p>
                        <p className="mt-1">
                          {formatDate(enrollment.createdAt, locale, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/courses/${enrollment.course.id}`}
                      className="mt-3 inline-flex rounded-lg border border-sky-300 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-700 hover:bg-sky-50"
                    >
                      {tx("enrollments.openCourse", "Open Course")}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">
              {tx("payments.title", "Payment Records")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {tx(
                "payments.subtitle",
                "Current backend stores payment receipt communications, not a full payment ledger."
              )}
            </p>

            {student.communications.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                {tx("payments.empty", "No payment receipt records found for this student.")}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {student.communications.map((payment) => {
                  const meta =
                    payment.meta && typeof payment.meta === "object" && !Array.isArray(payment.meta)
                      ? (payment.meta as Record<string, unknown>)
                      : null;
                  const amountLabel =
                    typeof meta?.amountLabel === "string" ? meta.amountLabel : null;
                  return (
                    <div
                      key={payment.id}
                      className="rounded-xl border border-slate-200 p-3"
                    >
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        {payment.status}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {payment.course?.title || payment.subject}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {amountLabel || tx("payments.amountMissing", "Amount not recorded")}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {tx("payments.createdAt", "Created")}:{" "}
                        {formatDate(payment.createdAt, locale, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
