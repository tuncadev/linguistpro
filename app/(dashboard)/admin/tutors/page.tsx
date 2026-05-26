"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { User } from "@/types";
import {
  AdminTutorIntegritySnapshot,
  createAdminTutor,
  deleteAdminTutor,
  fetchAdminTutorIntegrity,
  fetchAdminTutors,
  updateAdminTutor,
} from "@/services/adminTutorCrudApiService";
import { fetchAdminCourses } from "@/services/adminCourseCrudApiService";
import { Course } from "@/types";

type TutorFormState = {
  name: string;
  email: string;
  password: string;
  avatarUrl: string;
  bio: string;
  tutorApprovalStatus: "PENDING" | "APPROVED" | "REJECTED";
  tutorApprovalNotes: string;
};

const EMPTY_FORM: TutorFormState = {
  name: "",
  email: "",
  password: "",
  avatarUrl: "",
  bio: "",
  tutorApprovalStatus: "PENDING",
  tutorApprovalNotes: "",
};

function fallbackAvatar(value: string | undefined): string {
  if (value?.trim()) {
    return value;
  }
  return "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200";
}

export default function AdminTutorsPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard.adminTutors");
  const tx = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);
  const formatTutorApprovalStatus = (status: TutorFormState["tutorApprovalStatus"] | null | undefined) => {
    const normalized = (status ?? "PENDING").toUpperCase();
    return tx(`approvalValues.${normalized}`, normalized);
  };
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const [tutors, setTutors] = useState<User[]>([]);
  const [integrity, setIntegrity] = useState<AdminTutorIntegritySnapshot | null>(null);
  const [assignedCoursesByTutor, setAssignedCoursesByTutor] = useState<Record<string, Course[]>>({});
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
      let auxiliaryError: string | null = null;

      const [tutorsResult, coursesResult, integrityResult] = await Promise.allSettled([
        fetchAdminTutors(),
        fetchAdminCourses(),
        fetchAdminTutorIntegrity(),
      ]);

      if (!isMounted) {
        return;
      }

      if (tutorsResult.status === "fulfilled") {
        setTutors(tutorsResult.value);
      } else {
        const message =
          tutorsResult.reason instanceof Error
            ? tutorsResult.reason.message
            : "Failed to load tutor management data.";
        setError(message);
        setTutors([]);
      }

      if (coursesResult.status === "fulfilled") {
        const assignments = (coursesResult.value ?? []).reduce<Record<string, Course[]>>((acc, course) => {
          acc[course.tutorId] = [...(acc[course.tutorId] ?? []), course];
          return acc;
        }, {});
        setAssignedCoursesByTutor(assignments);
      } else {
        setAssignedCoursesByTutor({});
        auxiliaryError = tx(
          "errors.courseAssignmentCountLoad",
          "Tutor list loaded, but course assignment counts could not be loaded."
        );
      }

      if (integrityResult.status === "fulfilled") {
        setIntegrity(integrityResult.value);
      } else {
        setIntegrity(null);
        if (!auxiliaryError) {
          auxiliaryError = tx(
            "errors.integritySummaryLoad",
            "Tutor list loaded, but integrity summary could not be loaded."
          );
        }
      }

      if (tutorsResult.status === "fulfilled" && auxiliaryError) {
        setError(auxiliaryError);
      }

      setLoading(false);
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
    const totalStudents = tutors.reduce((sum, tutor) => {
      const assignedCourses = assignedCoursesByTutor[tutor.id] ?? [];
      return (
        sum +
        assignedCourses.reduce((courseSum, course) => {
          return courseSum + (Number.isFinite(course.studentCount) ? course.studentCount : 0);
        }, 0)
      );
    }, 0);

    return {
      totalTutors,
      tutorsWithLogin,
      avgRating,
      totalStudents,
      distinctTutorIdsInCourses: integrity?.distinctTutorIdsInCourses ?? 0,
      unassignedTutorCount: integrity?.unassignedTutorCount ?? 0,
    };
  }, [assignedCoursesByTutor, integrity, tutors]);

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
      tutorApprovalStatus: tutor.tutorApprovalStatus ?? "PENDING",
      tutorApprovalNotes: tutor.tutorApprovalNotes ?? "",
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    const password = form.password.trim();
    if (!editingTutorId && password.length < 8) {
      setSaving(false);
      setError(tx("errors.invalidPassword", "Password must be at least 8 characters for new tutors."));
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: password || undefined,
      avatarUrl: form.avatarUrl.trim() || null,
      bio: form.bio.trim() || null,
      tutorApprovalStatus: form.tutorApprovalStatus,
      tutorApprovalNotes: form.tutorApprovalNotes.trim() || null,
    };

    try {
      const result = editingTutorId
        ? await updateAdminTutor(editingTutorId, payload)
        : await createAdminTutor(payload);

      if (editingTutorId) {
        setTutors((current) => current.map((tutor) => (tutor.id === result.id ? result : tutor)));
        setNotice(tx("notices.updated", "Tutor updated."));
      } else {
        setTutors((current) => [result, ...current]);
        setNotice(tx("notices.created", "Tutor created."));
      }

      try {
        const snapshot = await fetchAdminTutorIntegrity();
        setIntegrity(snapshot);
      } catch {
        // Keep UI usable even if integrity refresh fails after successful write.
      }

      resetForm();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : tx("errors.saveFailed", "Failed to save tutor.");
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (tutor: User) => {
    const confirmed = window.confirm(tx("confirm.deleteTutor", `Delete tutor "${tutor.name}"?`));
    if (!confirmed) {
      return;
    }

    setDeletingTutorId(tutor.id);
    setError(null);
    setNotice(null);

    try {
      await deleteAdminTutor(tutor.id);
      setTutors((current) => current.filter((candidate) => candidate.id !== tutor.id));
      setAssignedCoursesByTutor((current) => {
        const next = { ...current };
        delete next[tutor.id];
        return next;
      });
      if (editingTutorId === tutor.id) {
        resetForm();
      }

      try {
        const snapshot = await fetchAdminTutorIntegrity();
        setIntegrity(snapshot);
      } catch {
        // Keep UI usable even if integrity refresh fails after successful delete.
      }

      setNotice(tx("notices.removed", "Tutor removed."));
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : tx("errors.removeFailed", "Failed to remove tutor.");
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
              {tx("tabs.courses", "Courses")}
            </Link>
            <Link
              href="/admin/tutors"
              className="rounded-full bg-sky-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
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
          <h1 className="text-3xl font-black text-slate-900">{tx("title", "Admin Tutor Management")}</h1>
          <p className="text-sm text-slate-600">
            {tx(
              "subtitle",
              "Add, edit, and remove tutor records while keeping the current frontend tutor cards and profile style intact."
            )}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("stats.allTutors", "All Tutors")}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{totals.totalTutors}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("stats.loginReady", "Login Ready")}</p>
            <p className="mt-2 text-3xl font-black text-emerald-600">{totals.tutorsWithLogin}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("stats.averageRating", "Average Rating")}</p>
            <p className="mt-2 text-3xl font-black text-amber-600">
              {totals.avgRating > 0 ? totals.avgRating.toFixed(2) : "-"}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("stats.totalStudents", "Total Students")}</p>
            <p className="mt-2 text-3xl font-black text-indigo-600">{numberFormatter.format(totals.totalStudents)}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("stats.tutorsOnCourses", "Tutors On Courses")}</p>
            <p className="mt-2 text-3xl font-black text-sky-700">{totals.distinctTutorIdsInCourses}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{tx("stats.unassignedTutors", "Unassigned Tutors")}</p>
            <p className="mt-2 text-3xl font-black text-fuchsia-700">{totals.unassignedTutorCount}</p>
          </article>
        </section>

        {integrity?.status === "warning" ? (
          <section className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
            <p className="text-sm font-black uppercase tracking-wider text-amber-700">{tx("integrity.warningTitle", "Tutor Integrity Warning")}</p>
            <p className="mt-1 text-sm text-amber-900">
              {tx("integrity.warningBodyPrefix", "Some courses reference tutor IDs that are not valid tutor records. Run")}
              <span className="font-bold"> npm run ops:uat:tutors</span>
              {tx("integrity.warningBodySuffix", " and repair assignments.")}
            </p>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-5">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">
                {editingTutorId ? tx("form.editTutor", "Edit Tutor") : tx("form.addNewTutor", "Add New Tutor")}
              </h2>
              {editingTutorId ? (
                <button
                  onClick={resetForm}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700"
                  type="button"
                >
                  {tx("form.cancelEdit", "Cancel edit")}
                </button>
              ) : null}
            </div>

            <form className="space-y-3" onSubmit={onSubmit}>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder={tx("form.placeholders.tutorName", "Tutor name")}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                required
              />
              <input
                value={form.email}
                type="email"
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder={tx("form.placeholders.tutorEmail", "Tutor email")}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                required
              />
              <input
                value={form.password}
                type="password"
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={
                  editingTutorId
                    ? tx("form.placeholders.newPasswordOptional", "New password (optional)")
                    : tx("form.placeholders.passwordMin", "Password (min 8 chars)")
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                minLength={editingTutorId ? undefined : 8}
                required={!editingTutorId}
              />
              <input
                value={form.avatarUrl}
                onChange={(event) => setForm((current) => ({ ...current, avatarUrl: event.target.value }))}
                placeholder={tx("form.placeholders.avatarUrl", "Avatar URL")}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
              />
              <textarea
                value={form.bio}
                onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                placeholder={tx("form.placeholders.tutorBio", "Tutor bio")}
                rows={5}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <select
                  value={form.tutorApprovalStatus}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      tutorApprovalStatus: event.target.value as TutorFormState["tutorApprovalStatus"],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                >
                  <option value="PENDING">{tx("form.approval.pending", "Approval: Pending")}</option>
                  <option value="APPROVED">{tx("form.approval.approved", "Approval: Approved")}</option>
                  <option value="REJECTED">{tx("form.approval.rejected", "Approval: Rejected")}</option>
                </select>
                <input
                  value={form.tutorApprovalNotes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      tutorApprovalNotes: event.target.value,
                    }))
                  }
                  placeholder={tx("form.placeholders.approvalNotes", "Approval notes")}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                />
              </div>

              {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
              {notice ? <p className="text-sm font-bold text-emerald-600">{notice}</p> : null}

              <button
                disabled={saving || loading}
                type="submit"
                className="w-full rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving
                  ? tx("form.saving", "Saving...")
                  : editingTutorId
                  ? tx("form.updateTutor", "Update Tutor")
                  : tx("form.createTutor", "Create Tutor")}
              </button>
            </form>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
            <h2 className="mb-4 text-lg font-black text-slate-900">{tx("list.title", "Tutors")}</h2>
            {loading ? (
              <p className="text-sm text-slate-500">{tx("list.loading", "Loading tutor list...")}</p>
            ) : tutors.length === 0 ? (
              <p className="text-sm text-slate-500">{tx("list.empty", "No tutors found.")}</p>
            ) : (
              <div className="space-y-3">
                {tutors.map((tutor) => {
                  const assignedCourses = assignedCoursesByTutor[tutor.id] ?? [];
                  const assignedCourseCount = assignedCourses.length;
                  const assignedStudentCount = assignedCourses.reduce((sum, course) => {
                    return sum + (Number.isFinite(course.studentCount) ? course.studentCount : 0);
                  }, 0);

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
                            {tx("list.rating", "Rating")}: {tutor.rating ?? "-"} · {tx("list.students", "Students")}:{" "}
                            {numberFormatter.format(assignedStudentCount)} · {tx("list.courses", "Courses")}: {assignedCourseCount}
                          </p>
                          {assignedCourses.length > 0 ? (
                            <div className="mt-2 space-y-1">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                {tx("list.coursesAuthored", "Courses authored")}
                              </p>
                              {assignedCourses.map((course) => (
                                <p key={course.id} className="truncate text-xs text-slate-500">
                                  {course.title} ({numberFormatter.format(course.studentCount ?? 0)}{" "}
                                  {tx("list.studentsInline", "students")})
                                </p>
                              ))}
                            </div>
                          ) : null}
                          <p className="mt-1 text-xs text-slate-400">
                            {tx("list.login", "Login")}:{" "}
                            {tutor.hasPassword
                              ? tx("list.loginConfigured", "Configured")
                              : tx("list.loginMissingPassword", "Missing password")}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {tx("list.approval", "Approval")}: {formatTutorApprovalStatus(tutor.tutorApprovalStatus)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditing(tutor)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                          type="button"
                        >
                          {tx("actions.editTutor", "Edit Tutor")}
                        </button>
                        <button
                          onClick={() => onDelete(tutor)}
                          disabled={deletingTutorId === tutor.id}
                          className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
                          type="button"
                        >
                          {deletingTutorId === tutor.id
                            ? tx("actions.removing", "Removing...")
                            : tx("actions.remove", "Remove")}
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
