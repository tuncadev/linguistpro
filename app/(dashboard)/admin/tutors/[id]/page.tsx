"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { fetchAdminCourses } from "@/services/adminCourseCrudApiService";
import { fetchAdminTutorById, updateAdminTutor } from "@/services/adminTutorCrudApiService";
import { Course } from "@/types";

type TutorEditPageProps = {
  params: Promise<{ id: string }>;
};

type TutorFormState = {
  name: string;
  email: string;
  password: string;
  avatarUrl: string;
  bio: string;
  studentCount: string;
  coursesAuthored: string;
};

const EMPTY_FORM: TutorFormState = {
  name: "",
  email: "",
  password: "",
  avatarUrl: "",
  bio: "",
  studentCount: "",
  coursesAuthored: "",
};

function toOptionalNonNegativeInt(raw: string): number | null | undefined {
  const normalized = raw.trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export default function AdminTutorEditPage({ params }: TutorEditPageProps) {
  const [tutorId, setTutorId] = useState<string>("");
  const [form, setForm] = useState<TutorFormState>(EMPTY_FORM);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const resolved = await params;
        const [tutor, allCourses] = await Promise.all([
          fetchAdminTutorById(resolved.id),
          fetchAdminCourses(),
        ]);

        if (!isMounted) {
          return;
        }

        setTutorId(tutor.id);
        setForm({
          name: tutor.name,
          email: tutor.email,
          password: "",
          avatarUrl: tutor.avatar?.trim() || "",
          bio: tutor.bio?.trim() || "",
          studentCount:
            typeof tutor.studentCount === "number" && Number.isFinite(tutor.studentCount)
              ? String(tutor.studentCount)
              : "",
          coursesAuthored:
            typeof tutor.coursesAuthored === "number" && Number.isFinite(tutor.coursesAuthored)
              ? String(tutor.coursesAuthored)
              : "",
        });
        setCourses(allCourses ?? []);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        const message = loadError instanceof Error ? loadError.message : "Failed to load tutor.";
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [params]);

  const assignedCourses = useMemo(
    () => courses.filter((course) => course.tutorId === tutorId),
    [courses, tutorId]
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tutorId) {
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const studentCount = toOptionalNonNegativeInt(form.studentCount);
    const coursesAuthored = toOptionalNonNegativeInt(form.coursesAuthored);
    if (studentCount === null || coursesAuthored === null) {
      setSaving(false);
      setError("Student count and authored courses must be non-negative integers.");
      return;
    }

    const password = form.password.trim();
    if (password && password.length < 8) {
      setSaving(false);
      setError("New password must be at least 8 characters.");
      return;
    }

    try {
      await updateAdminTutor(tutorId, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: password || undefined,
        avatarUrl: form.avatarUrl.trim() || null,
        bio: form.bio.trim() || null,
        studentCount,
        coursesAuthored,
      });

      setForm((current) => ({ ...current, password: "" }));
      setNotice("Tutor updated.");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to update tutor.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="p-4 lg:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Tutor Page</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Edit Tutor</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href="/admin/tutors"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
            >
              Back to Tutors
            </Link>
            <Link
              href="/admin/courses"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
            >
              Go to Courses
            </Link>
          </div>
        </header>

        {loading ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Loading tutor...</p>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-5">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
              <form className="space-y-3" onSubmit={onSubmit}>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Tutor name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                  required
                />
                <input
                  value={form.email}
                  type="email"
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Tutor email"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                  required
                />
                <input
                  value={form.password}
                  type="password"
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="New password (optional)"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                />
                <input
                  value={form.avatarUrl}
                  onChange={(event) => setForm((current) => ({ ...current, avatarUrl: event.target.value }))}
                  placeholder="Avatar URL"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                />
                <textarea
                  value={form.bio}
                  onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                  placeholder="Tutor bio"
                  rows={6}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    value={form.studentCount}
                    onChange={(event) => setForm((current) => ({ ...current, studentCount: event.target.value }))}
                    placeholder="Student count"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                    inputMode="numeric"
                  />
                  <input
                    value={form.coursesAuthored}
                    onChange={(event) => setForm((current) => ({ ...current, coursesAuthored: event.target.value }))}
                    placeholder="Courses authored"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                    inputMode="numeric"
                  />
                </div>

                {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
                {notice ? <p className="text-sm font-bold text-emerald-600">{notice}</p> : null}

                <button
                  disabled={saving}
                  type="submit"
                  className="w-full rounded-xl bg-[#2d3e50] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1a2530] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Update Tutor"}
                </button>
              </form>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-black text-slate-900">Assigned Courses</h2>
              {assignedCourses.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No courses are currently assigned to this tutor.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {assignedCourses.map((course) => (
                    <div key={course.id} className="rounded-xl border border-slate-200 px-3 py-2">
                      <p className="text-sm font-bold text-slate-800">{course.title}</p>
                      <p className="text-xs text-slate-500">
                        ${course.price} · {course.studentCount} students
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        )}
      </div>
    </main>
  );
}
