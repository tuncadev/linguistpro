"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createAdminCourse,
  deleteAdminCourse,
  fetchAdminCourses,
  updateAdminCourse,
} from "@/services/adminCourseCrudApiService";
import { fetchTaxonomies } from "@/services/taxonomyApiService";
import { fetchTutors } from "@/services/tutorApiService";
import { Course, Language, Level, User } from "@/types";

type CourseFormState = {
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  languageId: string;
  levelId: string;
  tutorId: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
  syllabusText: string;
  learningObjectivesText: string;
  enrollmentIncludesText: string;
  tuitionLabel: string;
  discountLabel: string;
  courseDirectorLabel: string;
};

const EMPTY_FORM: CourseFormState = {
  title: "",
  description: "",
  price: "",
  imageUrl: "",
  languageId: "",
  levelId: "",
  tutorId: "",
  status: "PUBLISHED",
  syllabusText: "",
  learningObjectivesText: "",
  enrollmentIncludesText: "",
  tuitionLabel: "Tuition Fee",
  discountLabel: "65% Off Enrollment",
  courseDirectorLabel: "Course Tutor",
};

function findCourseStatusLabel(course: Course): CourseFormState["status"] {
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

function parseSyllabusSections(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [tutors, setTutors] = useState<User[]>([]);
  const [form, setForm] = useState<CourseFormState>(EMPTY_FORM);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPageData = async () => {
      setLoading(true);
      setError(null);

      const [fetchedCourses, fetchedTaxonomies, fetchedTutors] = await Promise.all([
        fetchAdminCourses(),
        fetchTaxonomies(),
        fetchTutors(),
      ]);

      if (!isMounted) {
        return;
      }

      if (!fetchedCourses) {
        setError("Unable to load admin courses. Log in as admin and try again.");
      } else {
        setCourses(fetchedCourses);
      }

      if (fetchedTaxonomies) {
        setLanguages(fetchedTaxonomies.languages);
        setLevels(fetchedTaxonomies.levels);
      }

      if (fetchedTutors) {
        setTutors(fetchedTutors);
      }

      const defaultTutorId = fetchedTutors?.[0]?.id || "";
      const defaultLanguageId = fetchedTaxonomies?.languages[0]?.id || "";
      const defaultLevelId = fetchedTaxonomies?.levels[0]?.id || "";

      setForm((current) => ({
        ...current,
        tutorId: current.tutorId || defaultTutorId,
        languageId: current.languageId || defaultLanguageId,
        levelId: current.levelId || defaultLevelId,
      }));

      setLoading(false);
    };

    void loadPageData();

    return () => {
      isMounted = false;
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

  const resetForm = () => {
    setEditingCourseId(null);
    setForm((current) => ({
      ...EMPTY_FORM,
      tutorId: current.tutorId || tutors[0]?.id || "",
      languageId: current.languageId || languages[0]?.id || "",
      levelId: current.levelId || levels[0]?.id || "",
    }));
  };

  const startEditing = (course: Course) => {
    setEditingCourseId(course.id);
    setNotice(null);
    setError(null);
    setForm({
      title: course.title,
      description: course.description,
      price: String(course.price),
      imageUrl: course.imageUrl,
      languageId: course.languageId,
      levelId: course.levelId,
      tutorId: course.tutorId,
      status: findCourseStatusLabel(course),
      syllabusText: course.syllabus.map((section) => section.title).join("\n"),
      learningObjectivesText: (course.learningObjectives ?? []).join("\n"),
      enrollmentIncludesText: (course.enrollmentIncludes ?? []).join("\n"),
      tuitionLabel: course.tuitionLabel || "Tuition Fee",
      discountLabel: course.discountLabel || "65% Off Enrollment",
      courseDirectorLabel: course.courseDirectorLabel || "Course Tutor",
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    const parsedPrice = Number(form.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setSaving(false);
      setError("Price must be a non-negative number.");
      return;
    }

    const syllabus = parseSyllabusSections(form.syllabusText);
    const learningObjectives = parseSyllabusSections(form.learningObjectivesText);
    const enrollmentIncludes = parseSyllabusSections(form.enrollmentIncludesText);

    const basePayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: parsedPrice,
      imageUrl: form.imageUrl.trim(),
      languageId: form.languageId,
      levelId: form.levelId,
      tutorId: form.tutorId,
      syllabus: syllabus.length > 0 ? syllabus : undefined,
      learningObjectives: learningObjectives.length > 0 ? learningObjectives : undefined,
      enrollmentIncludes: enrollmentIncludes.length > 0 ? enrollmentIncludes : undefined,
      tuitionLabel: form.tuitionLabel.trim() || undefined,
      discountLabel: form.discountLabel.trim() || undefined,
      courseDirectorLabel: form.courseDirectorLabel.trim() || undefined,
    };

    const result = editingCourseId
      ? await updateAdminCourse(editingCourseId, { ...basePayload, status: form.status })
      : await createAdminCourse({ ...basePayload, status: form.status });

    if (!result) {
      setSaving(false);
      setError(
        editingCourseId
          ? "Update failed. Verify required fields and admin session."
          : "Create failed. Verify required fields and admin session."
      );
      return;
    }

    if (editingCourseId) {
      setCourses((current) => current.map((course) => (course.id === result.id ? result : course)));
      setNotice("Course updated.");
    } else {
      setCourses((current) => [result, ...current]);
      setNotice("Course created.");
    }

    resetForm();
    setSaving(false);
  };

  const onDelete = async (course: Course) => {
    const confirmed = window.confirm(`Delete "${course.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeletingCourseId(course.id);
    setError(null);
    setNotice(null);

    const ok = await deleteAdminCourse(course.id);
    if (!ok) {
      setError("Delete failed. Check admin session and try again.");
      setDeletingCourseId(null);
      return;
    }

    setCourses((current) => current.filter((candidate) => candidate.id !== course.id));
    if (editingCourseId === course.id) {
      resetForm();
    }
    setNotice("Course removed.");
    setDeletingCourseId(null);
  };

  return (
    <main className="p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Link
              href="/admin/courses"
              className="rounded-full bg-[#2d3e50] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
            >
              Courses
            </Link>
            <Link
              href="/admin/tutors"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
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
          <h1 className="text-3xl font-black text-slate-900">Admin Course Management</h1>
          <p className="mt-2 text-sm text-slate-600">
            Keep existing static cards, and manage dynamic course records from database-backed APIs.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">All Courses</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{totals.totalCourses}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Published</p>
            <p className="mt-2 text-3xl font-black text-emerald-600">{totals.totalPublished}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Draft & Review</p>
            <p className="mt-2 text-3xl font-black text-amber-600">{totals.totalDrafts}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Price Sum</p>
            <p className="mt-2 text-3xl font-black text-indigo-600">{formatPrice(totals.totalRevenuePotential)}</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">
                {editingCourseId ? "Edit Course" : "Add New Course"}
              </h2>
              {editingCourseId ? (
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
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Course title"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                required
              />
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Course description"
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  placeholder="Price (e.g. 49.99)"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                  required
                />
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as CourseFormState["status"],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
              <input
                value={form.imageUrl}
                onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                placeholder="Image URL"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                required
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select
                  value={form.languageId}
                  onChange={(event) => setForm((current) => ({ ...current, languageId: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                  required
                >
                  {languages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.name}
                    </option>
                  ))}
                </select>
                <select
                  value={form.levelId}
                  onChange={(event) => setForm((current) => ({ ...current, levelId: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                  required
                >
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
                <select
                  value={form.tutorId}
                  onChange={(event) => setForm((current) => ({ ...current, tutorId: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                  required
                >
                  {tutors.map((tutor) => (
                    <option key={tutor.id} value={tutor.id}>
                      {tutor.name}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={form.syllabusText}
                onChange={(event) => setForm((current) => ({ ...current, syllabusText: event.target.value }))}
                placeholder="Syllabus sections, one per line"
                rows={5}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
              />
              <textarea
                value={form.learningObjectivesText}
                onChange={(event) =>
                  setForm((current) => ({ ...current, learningObjectivesText: event.target.value }))
                }
                placeholder="Learning objectives, one per line"
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
              />
              <textarea
                value={form.enrollmentIncludesText}
                onChange={(event) =>
                  setForm((current) => ({ ...current, enrollmentIncludesText: event.target.value }))
                }
                placeholder="Enrollment includes items, one per line"
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input
                  value={form.tuitionLabel}
                  onChange={(event) => setForm((current) => ({ ...current, tuitionLabel: event.target.value }))}
                  placeholder="Tuition label"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                />
                <input
                  value={form.discountLabel}
                  onChange={(event) => setForm((current) => ({ ...current, discountLabel: event.target.value }))}
                  placeholder="Discount label"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                />
                <input
                  value={form.courseDirectorLabel}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, courseDirectorLabel: event.target.value }))
                  }
                  placeholder="Course director label"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#f47361]"
                />
              </div>

              {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
              {notice ? <p className="text-sm font-bold text-emerald-600">{notice}</p> : null}

              <button
                disabled={saving || loading}
                type="submit"
                className="w-full rounded-xl bg-[#2d3e50] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1a2530] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving..." : editingCourseId ? "Update Course" : "Create Course"}
              </button>
            </form>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
            <h2 className="mb-4 text-lg font-black text-slate-900">Courses</h2>
            {loading ? (
              <p className="text-sm text-slate-500">Loading course list...</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-slate-500">No courses found.</p>
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
                        {formatPrice(course.price)} · {findCourseStatusLabel(course)} · {course.studentCount} students
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Tutor ID: {course.tutorId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditing(course)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(course)}
                        disabled={deletingCourseId === course.id}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
                        type="button"
                      >
                        {deletingCourseId === course.id ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
