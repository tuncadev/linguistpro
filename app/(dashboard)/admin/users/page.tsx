import Link from "next/link";

export default function AdminUsersPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/courses"
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
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
            className="rounded-full bg-[#2d3e50] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
          >
            Users
          </Link>
        </div>

        <h1 className="mt-5 text-3xl font-black text-slate-900">Admin User Management</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tutor create/edit/remove is now available at <span className="font-bold">/admin/tutors</span>. Student/admin
          user management can be expanded here next.
        </p>
      </div>
    </main>
  );
}
