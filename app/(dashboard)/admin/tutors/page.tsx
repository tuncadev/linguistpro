"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { User } from "@/types";
import {
  createAdminTutor,
  deleteAdminTutor,
  fetchAdminTutors,
  updateAdminTutor,
} from "@/services/adminTutorCrudApiService";
import { fetchAdminCourses } from "@/services/adminCourseCrudApiService";

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

function fallbackAvatar(value: string | undefined): string {
  if (value?.trim()) {
    return value;
  }
  return "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200";
}

export default function AdminTutorsPage() {
  const [tutors, setTutors] = useState<User[]>([]);
  const [assignedCourseCountByTutor, setAssignedCourseCountByTutor] = useState<Record<string, number>>({});
  const [form, setForm] = useState<TutorFormState>(EMPTY_FORM);
  const [editingTutorId, setEditingTutorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingTutorId, setDeletingTutorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPageData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [fetchedTutors, fetchedCourses] = await Promise.all([
          fetchAdminTutors(),
          fetchAdminCourses(),
        ]);

        if (!isMounted) {
          return;
        }

        setTutors(fetchedTutors);

        const counts = (fetchedCourses ?? []).reduce<Record<string, number>>((acc, course) => {
          acc[course.tutorId] = (acc[course.tutorId] ?? 0) + 1;
          return acc;
        }, {});
        setAssignedCourseCountByTutor(counts);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        const message = loadError instanceof Error ? loadError.message : "Failed to load tutor management data.";
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadPageData();

    return () => {
      isMounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const totalTutors = tutors.length;
    const tutorsWithLogin = tutors.filter((tutor) => tutor.hasPassword).length;
    const ratedTutors = tutors.filter((tutor) => Number.isFinite(tutor.rating) && (tutor.rating ?? 0) > 0);
    const avgRating =
      ratedTutors.length > 0
        ? ratedTutors.reduce((sum, tutor) => sum + (tutor.rating ?? 0), 0) / ratedTutors.length
        : 0;
    const totalStudents = tutors.reduce((sum, tutor) => sum + (tutor.studentCount ?? 0), 0);

    return {
      totalTutors,
      tutorsWithLogin,
      avgRating,
      totalStudents,
    };
  }, [tutors]);

  const resetForm = () => {
    setEditingTutorId(null);
    setForm(EMPTY_FORM);
  };

  const startEditing = (tutor: User) => {
    setEditingTutorId(tutor.id);
    setError(null);
    setNotice(null);
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
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    if (!editingTutorId && password.length < 8) {
      setSaving(false);
      setError("Password must be at least 8 characters for new tutors.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: password || undefined,
      avatarUrl: form.avatarUrl.trim() || null,
      bio: form.bio.trim() || null,
      studentCount,
      coursesAuthored,
    };

    try {
      const result = editingTutorId
        ? await updateAdminTutor(editingTutorId, payload)
        : await createAdminTutor(payload);

      if (editingTutorId) {
        setTutors((current) => current.map((tutor) => (tutor.id === result.id ? result : tutor)));
        setNotice("Tutor updated.");
      } else {
        setTutors((current) => [result, ...current]);
        setNotice("Tutor created.");
      }

      resetForm();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save tutor.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (tutor: User) => {
    const confirmed = window.confirm(`Delete tutor "${tutor.name}"?`);
    if (!confirmed) {
      return;
    }

    setDeletingTutorId(tutor.id);
    setError(null);
    setNotice(null);

    try {
      await deleteAdminTutor(tutor.id);
      setTutors((current) => current.filter((candidate) => candidate.id !== tutor.id));
      setAssignedCourseCountByTutor((current) => {
        const next = { ...current };
        delete next[tutor.id];
        return next;
      });
      if (editingTutorId === tutor.id) {
        resetForm();
      }
      setNotice("Tutor removed.");
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to remove tutor.";
      setError(message);
    } finally {
      setDeletingTutorId(null);
    }
  };

  return (
    <main className="p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/courses"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
            >
              Courses
            </Link>
            <Link
              href="/admin/tutors"
              className="rounded-full bg-[#2d3e50] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
            >
              Tutors
            </Link>
            <Link
              href="/admin/users"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
            >
              Users
            </Link>
          </div>
          <h1 className="text-3xl font-black text-slate-900">Admin Tutor Management</h1>
          <p className="text-sm text-slate-600">
            Add, edit, and remove tutor records while keeping the current frontend tutor cards and profile style intact.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">All Tutors</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{totals.totalTutors}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Login Ready</p>
            <p className="mt-2 text-3xl font-black text-emerald-600">{totals.tutorsWithLogin}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Average Rating</p>
            <p className="mt-2 text-3xl font-black text-amber-600">
              {totals.avgRating > 0 ? totals.avgRating.toFixed(2) : "-"}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total Students</p>
            <p className="mt-2 text-3xl font-black text-indigo-600">{totals.totalStudents.toLocaleString()}</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">
                {editingTutorId ? "Edit Tutor" : "Add New Tutor"}
              </h2>
              {editingTutorId ? (
                <button
                  onClick={resetForm}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700"
                  type="button"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>

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
                placeholder={editingTutorId ? "New password (optional)" : "Password (min 8 chars)"}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                minLength={editingTutorId ? undefined : 8}
                required={!editingTutorId}
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
                rows={5}
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
                disabled={saving || loading}
                type="submit"
                className="w-full rounded-xl bg-[#2d3e50] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1a2530] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving..." : editingTutorId ? "Update Tutor" : "Create Tutor"}
              </button>
            </form>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
            <h2 className="mb-4 text-lg font-black text-slate-900">Tutors</h2>
            {loading ? (
              <p className="text-sm text-slate-500">Loading tutor list...</p>
            ) : tutors.length === 0 ? (
              <p className="text-sm text-slate-500">No tutors found.</p>
            ) : (
              <div className="space-y-3">
                {tutors.map((tutor) => {
                  const assignedCourses = assignedCourseCountByTutor[tutor.id] ?? 0;

                  return (
                    <div
                      key={tutor.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={fallbackAvatar(tutor.avatar)}
                          alt={tutor.name}
                          className="h-12 w-12 shrink-0 rounded-full border border-slate-200 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900">{tutor.name}</p>
                          <p className="truncate text-xs font-medium text-slate-500">{tutor.email}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            Rating: {tutor.rating ?? "-"} · Students: {(tutor.studentCount ?? 0).toLocaleString()} ·
                            Courses: {assignedCourses}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Login: {tutor.hasPassword ? "Configured" : "Missing password"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditing(tutor)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                          type="button"
                        >
                          Edit Tutor
                        </button>
                        <button
                          onClick={() => onDelete(tutor)}
                          disabled={deletingTutorId === tutor.id}
                          className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
                          type="button"
                        >
                          {deletingTutorId === tutor.id ? "Removing..." : "Remove"}
                        </button>
                      </div>
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
