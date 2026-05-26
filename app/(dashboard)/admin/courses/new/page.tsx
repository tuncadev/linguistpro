import Link from "next/link";
import CourseEditorForm from "../_components/CourseEditorForm";

export default function AdminCourseCreatePage() {
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
          <h1 className="text-3xl font-black text-slate-900">Create New Course</h1>
          <p className="text-sm text-slate-600">
            Build a complete course with structured modules, lessons, featured image, and publishing settings.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <CourseEditorForm mode="create" />
        </section>
      </div>
    </main>
  );
}
