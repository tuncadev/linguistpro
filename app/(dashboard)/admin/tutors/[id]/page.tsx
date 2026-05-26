"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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

export default function AdminTutorEditPage({ params }: TutorEditPageProps) {
  const t = useTranslations("dashboard.adminTutorDetail");
  const tx = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);
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
          tutorApprovalStatus: tutor.tutorApprovalStatus ?? "PENDING",
          tutorApprovalNotes: tutor.tutorApprovalNotes ?? "",
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

    const password = form.password.trim();
    if (password && password.length < 8) {
      setSaving(false);
      setError(tx("errors.invalidPassword", "New password must be at least 8 characters."));
      return;
    }

    try {
      await updateAdminTutor(tutorId, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: password || undefined,
        avatarUrl: form.avatarUrl.trim() || null,
        bio: form.bio.trim() || null,
        tutorApprovalStatus: form.tutorApprovalStatus,
        tutorApprovalNotes: form.tutorApprovalNotes.trim() || null,
      });

      setForm((current) => ({ ...current, password: "" }));
      setNotice(tx("notices.updated", "Tutor updated."));
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : tx("errors.updateFailed", "Failed to update tutor.");
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="p-4 lg:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">{tx("header.badge", "Tutor Page")}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">{tx("header.title", "Edit Tutor")}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href="/admin/tutors"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
            >
              {tx("header.backToTutors", "Back to Tutors")}
            </Link>
            <Link
              href="/admin/courses"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
            >
              {tx("header.goToCourses", "Go to Courses")}
            </Link>
          </div>
        </header>

        {loading ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{tx("loading", "Loading tutor...")}</p>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-5">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
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
                  placeholder={tx("form.placeholders.newPasswordOptional", "New password (optional)")}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
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
                  rows={6}
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
                  disabled={saving}
                  type="submit"
                  className="w-full rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? tx("form.saving", "Saving...") : tx("form.updateTutor", "Update Tutor")}
                </button>
              </form>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-black text-slate-900">{tx("assignedCourses.title", "Assigned Courses")}</h2>
              {assignedCourses.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  {tx("assignedCourses.empty", "No courses are currently assigned to this tutor.")}
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {assignedCourses.map((course) => (
                    <div key={course.id} className="rounded-xl border border-slate-200 px-3 py-2">
                      <p className="text-sm font-bold text-slate-800">{course.title}</p>
                      <p className="text-xs text-slate-500">
                        ${course.price} · {course.studentCount} {tx("assignedCourses.students", "students")}
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
