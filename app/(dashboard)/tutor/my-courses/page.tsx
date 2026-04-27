"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type TutorOnboarding = {
  id: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  languagesSpoken: string | null;
  tutorApprovalStatus: "PENDING" | "APPROVED" | "REJECTED";
  tutorApprovedAt: string | null;
  tutorApprovalNotes: string | null;
  courseCounts: Array<{ status: string; _count: { _all: number } }>;
};

type TutorCourse = {
  id: string;
  title: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
  reviews: number;
  rating: number;
};

export default function TutorMyCoursesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState<TutorOnboarding | null>(null);
  const [courses, setCourses] = useState<TutorCourse[]>([]);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [languagesSpoken, setLanguagesSpoken] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [onboardingRes, coursesRes] = await Promise.all([
          fetch("/api/tutor/onboarding", { credentials: "include" }),
          fetch("/api/courses?mine=true", { credentials: "include" }),
        ]);

        const onboardingJson = await onboardingRes.json();
        const coursesJson = await coursesRes.json();

        if (!onboardingRes.ok || !coursesRes.ok) {
          throw new Error(onboardingJson.error || coursesJson.error || "Failed to load tutor dashboard.");
        }

        if (!isMounted) return;
        const onboardingData = onboardingJson.data as TutorOnboarding;
        setOnboarding(onboardingData);
        setCourses((coursesJson.data as TutorCourse[]) ?? []);
        setBio(onboardingData.bio ?? "");
        setLocation(onboardingData.location ?? "");
        setLanguagesSpoken(onboardingData.languagesSpoken ?? "");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load tutor dashboard.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch("/api/tutor/onboarding", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bio: bio.trim() || null,
          location: location.trim() || null,
          languagesSpoken: languagesSpoken.trim() || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to update tutor profile.");
      }
      setOnboarding(payload.data as TutorOnboarding);
      setStatus("Tutor profile updated.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to update tutor profile.");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmitForApproval() {
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const response = await fetch("/api/tutor/onboarding", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ submitForApproval: true }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to submit tutor profile for approval.");
      }
      setOnboarding(payload.data as TutorOnboarding);
      setStatus("Tutor profile submitted for admin approval.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit tutor profile for approval.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="p-4 lg:p-6">
        <p className="text-sm text-slate-500">Loading tutor governance workflow...</p>
      </main>
    );
  }

  return (
    <main className="p-4 lg:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-slate-900">Tutor Onboarding and Course Governance</h1>
          <p className="mt-2 text-sm text-slate-600">
            Approval status:{" "}
            <span className="font-black text-slate-900">{onboarding?.tutorApprovalStatus ?? "PENDING"}</span>
          </p>
          {onboarding?.tutorApprovalNotes ? (
            <p className="mt-2 text-sm font-semibold text-amber-700">Admin note: {onboarding.tutorApprovalNotes}</p>
          ) : null}
          {onboarding?.tutorApprovedAt ? (
            <p className="mt-1 text-xs text-emerald-700">
              Approved on {new Date(onboarding.tutorApprovedAt).toLocaleDateString()}
            </p>
          ) : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <form onSubmit={onSaveProfile} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Tutor Profile Governance</h2>
            <p className="mt-2 text-sm text-slate-600">
              Update governance-required profile fields before submitting for approval.
            </p>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Bio
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={4}
                  maxLength={5000}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f47361]"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Location
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  maxLength={200}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f47361]"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Languages spoken
                <input
                  value={languagesSpoken}
                  onChange={(event) => setLanguagesSpoken(event.target.value)}
                  maxLength={240}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f47361]"
                />
              </label>
            </div>

            {error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}
            {status ? <p className="mt-4 text-sm font-semibold text-emerald-700">{status}</p> : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#2d3e50] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1a2530] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
              <button
                type="button"
                disabled={saving || onboarding?.tutorApprovalStatus === "APPROVED"}
                onClick={onSubmitForApproval}
                className="rounded-xl border border-[#2d3e50] px-6 py-3 text-sm font-bold text-[#2d3e50] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Submit for Approval
              </button>
              <Link
                href="/admin/tutors"
                className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100"
              >
                Open Admin Tutors
              </Link>
            </div>
          </form>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">My Course Pipeline</h2>
            <p className="mt-2 text-sm text-slate-600">Total authored courses: {courses.length}</p>
            <ul className="mt-4 space-y-2">
              {courses.length === 0 ? (
                <li className="text-sm text-slate-500">No authored courses yet.</li>
              ) : (
                courses.map((course) => (
                  <li key={course.id} className="rounded-xl border border-slate-200 px-3 py-2">
                    <p className="text-sm font-bold text-slate-900">{course.title}</p>
                    <p className="text-xs text-slate-500">
                      Status: {course.status} · Rating {course.rating.toFixed(1)} · Reviews {course.reviews}
                    </p>
                  </li>
                ))
              )}
            </ul>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Approved tutors can submit draft courses for review and publishing path.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
