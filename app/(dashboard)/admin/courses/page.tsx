"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  deleteAdminCourse,
  fetchAdminCourses,
} from "@/services/adminCourseCrudApiService";
import { Course } from "@/types";
import { formatCurrency, formatDate } from "@/lib/i18n/format";

type CourseEnrollmentRecord = {
  id: string;
  courseId: string;
  studentId: string;
  trial?: boolean;
  enrollmentType?: "TRIAL" | "PAID";
  createdAt: string;
  student?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
};

type EnrollmentsListResponse = {
  data?: CourseEnrollmentRecord[];
};

function findCourseStatusLabel(course: Course): "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED" {
  const normalized = (course.status || "").toUpperCase();
  if (
    normalized === "DRAFT" ||
    normalized === "PENDING_REVIEW" ||
    normalized === "PUBLISHED" ||
    normalized === "ARCHIVED"
  ) {
    return normalized;
  }
  return "PUBLISHED";
}

export default function AdminCoursesPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard.adminCourses");
  const tx = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [studentsCourse, setStudentsCourse] = useState<Course | null>(null);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [studentsList, setStudentsList] = useState<CourseEnrollmentRecord[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      const list = await fetchAdminCourses();
      if (!active) {
        return;
      }

      if (!list) {
        setError(tx("errors.loadCourses", "Unable to load admin courses. Log in as admin and try again."));
      } else {
        setCourses(list);
        setError(null);
      }

      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => {
    const totalCourses = courses.length;
    const totalPublished = courses.filter((course) => findCourseStatusLabel(course) === "PUBLISHED").length;
    const totalDrafts = courses.filter((course) => findCourseStatusLabel(course) !== "PUBLISHED").length;
    const totalRevenuePotential = courses.reduce((sum, course) => sum + course.price, 0);

    return {
      totalCourses,
      totalPublished,
      totalDrafts,
      totalRevenuePotential,
    };
  }, [courses]);

  const onDelete = async (course: Course) => {
    const confirmed = window.confirm(
      tx("confirm.deleteCourse", `Delete "${course.title}"? This cannot be undone.`)
    );
    if (!confirmed) {
      return;
    }

    setDeletingCourseId(course.id);
    setError(null);
    setNotice(null);

    const ok = await deleteAdminCourse(course.id);
    if (!ok) {
      setError(tx("errors.deleteFailed", "Delete failed. Check admin session and try again."));
      setDeletingCourseId(null);
      return;
    }

    setCourses((current) => current.filter((candidate) => candidate.id !== course.id));
    setNotice(tx("notices.removed", "Course removed."));
    setDeletingCourseId(null);
  };

  const closeStudentsDrawer = () => {
    setStudentsCourse(null);
    setStudentsError(null);
    setStudentsList([]);
  };

  const onViewStudents = async (course: Course) => {
    setStudentsCourse(course);
    setStudentsLoading(true);
    setStudentsError(null);
    setStudentsList([]);

    try {
      const response = await fetch(`/api/enroll?courseId=${encodeURIComponent(course.id)}&take=100`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`failed:${response.status}`);
      }

      const json = (await response.json()) as EnrollmentsListResponse;
      setStudentsList(Array.isArray(json.data) ? json.data : []);
    } catch {
      setStudentsError(
        tx("studentsDrawer.errors.load", "Unable to load enrolled students for this course.")
      );
    } finally {
      setStudentsLoading(false);
    }
  };

  return (
    <main className="p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Link
                href="/admin/courses"
                className="rounded-full bg-sky-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
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
            </div>
            <h1 className="text-3xl font-black text-slate-900">{tx("title", "Admin Course Management")}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {tx(
                "subtitle",
                "Manage all database-backed courses from a dedicated create/edit workflow."
              )}
            </p>
          </div>

          <Link
            href="/admin/courses/new"
            className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700"
          >
            {tx("actions.createCourse", "Create Course")}
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("stats.allCourses", "All Courses")}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{totals.totalCourses}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("stats.published", "Published")}</p>
            <p className="mt-2 text-3xl font-black text-emerald-600">{totals.totalPublished}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("stats.draftReview", "Draft & Review")}</p>
            <p className="mt-2 text-3xl font-black text-amber-600">{totals.totalDrafts}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("stats.priceSum", "Price Sum")}</p>
            <p className="mt-2 text-3xl font-black text-indigo-600">{formatCurrency(totals.totalRevenuePotential, locale)}</p>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-black text-slate-900">{tx("list.title", "Courses")}</h2>

          {error ? <p className="mb-3 text-sm font-bold text-rose-600">{error}</p> : null}
          {notice ? <p className="mb-3 text-sm font-bold text-emerald-600">{notice}</p> : null}

          {loading ? (
            <p className="text-sm text-slate-500">{tx("list.loading", "Loading course list...")}</p>
          ) : courses.length === 0 ? (
            <p className="text-sm text-slate-500">{tx("list.empty", "No courses found.")}</p>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">{course.title}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {formatCurrency(course.price, locale)} · {findCourseStatusLabel(course)} · {course.studentCount} {tx("list.students", "students")}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {tx("list.tutorId", "Tutor ID")}: {course.tutorId}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        void onViewStudents(course);
                      }}
                      className="rounded-lg border border-sky-300 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50"
                      type="button"
                    >
                      {tx("actions.viewStudents", "View Students")}
                    </button>
                    <Link
                      href={`/admin/courses/${course.id}/edit`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      {tx("actions.edit", "Edit")}
                    </Link>
                    <button
                      onClick={() => onDelete(course)}
                      disabled={deletingCourseId === course.id}
                      className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
                      type="button"
                    >
                      {deletingCourseId === course.id
                        ? tx("actions.removing", "Removing...")
                        : tx("actions.remove", "Remove")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {studentsCourse ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            aria-label={tx("studentsDrawer.close", "Close students drawer")}
            className="h-full flex-1 bg-slate-900/40"
            onClick={closeStudentsDrawer}
            type="button"
          />
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {tx("studentsDrawer.title", "Enrolled Students")}
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-900">{studentsCourse.title}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {tx("studentsDrawer.subtitle", "Showing enrolled student identities for this course.")}
                </p>
              </div>
              <button
                onClick={closeStudentsDrawer}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                type="button"
              >
                {tx("studentsDrawer.actions.close", "Close")}
              </button>
            </div>

            {studentsLoading ? (
              <p className="text-sm text-slate-500">
                {tx("studentsDrawer.loading", "Loading enrolled students...")}
              </p>
            ) : studentsError ? (
              <p className="text-sm font-bold text-rose-600">{studentsError}</p>
            ) : studentsList.length === 0 ? (
              <p className="text-sm text-slate-500">
                {tx("studentsDrawer.empty", "No enrolled students found for this course.")}
              </p>
            ) : (
              <div className="space-y-2">
                {studentsList.map((enrollment) => (
                  <article
                    key={enrollment.id}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <p className="text-sm font-black text-slate-900">
                      {enrollment.student?.name?.trim() ||
                        tx("studentsDrawer.labels.unnamed", "Unnamed student")}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {enrollment.student?.email || tx("studentsDrawer.labels.noEmail", "No email")}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {(enrollment.enrollmentType ||
                        (enrollment.trial ? "TRIAL" : "PAID"))} ·{" "}
                      {tx("studentsDrawer.labels.enrolled", "Enrolled")}{" "}
                      {formatDate(enrollment.createdAt, locale, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    {enrollment.student?.id ? (
                      <Link
                        href={`/admin/users/${enrollment.student.id}`}
                        className="mt-2 inline-flex rounded-lg border border-sky-300 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-700 hover:bg-sky-50"
                      >
                        {tx("studentsDrawer.actions.openStudentProfile", "Open Student Profile")}
                      </Link>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </aside>
        </div>
      ) : null}
    </main>
  );
}
