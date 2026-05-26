"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CourseEditorForm from "../../_components/CourseEditorForm";
import { fetchAdminCourseById } from "@/services/adminCourseCrudApiService";
import { Course } from "@/types";

export default function AdminCourseEditPage() {
  const params = useParams<{ id: string }>();
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!courseId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const value = await fetchAdminCourseById(courseId);
      if (!active) {
        return;
      }
      setCourse(value);
      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [courseId]);

  return (
    <main className="p-4 lg:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-2">
          <Link
            href="/admin/courses"
            className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
          >
            Back to courses
          </Link>
          <h1 className="text-3xl font-black text-slate-900">Edit Course</h1>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-slate-500">Loading course...</p>
          ) : course ? (
            <CourseEditorForm mode="edit" initialCourse={course} />
          ) : (
            <p className="text-sm font-bold text-rose-600">Course not found or inaccessible.</p>
          )}
        </section>
      </div>
    </main>
  );
}
