"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type WelcomePayload = {
  message: string;
  onboardingCompleted: boolean;
  enrollmentCount: number;
  suggestedNextStep: string;
};

type OnboardingPayload = {
  id: string;
  name: string | null;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  onboardingCompletedAt: string | null;
};

type CoursePayload = {
  id: string;
  title: string;
};

type EnrollmentPayload = {
  id: string;
  courseId: string;
  createdAt: string;
  course: {
    id: string;
    title: string;
    status: string;
  };
};

export default function StudentMyLearningPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [welcome, setWelcome] = useState<WelcomePayload | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingPayload | null>(null);
  const [courses, setCourses] = useState<CoursePayload[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentPayload[]>([]);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [targetCourseId, setTargetCourseId] = useState("");
  const [nextLessonPath, setNextLessonPath] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [welcomeRes, onboardingRes, coursesRes, enrollmentsRes] = await Promise.all([
          fetch("/api/student/welcome", { credentials: "include" }),
          fetch("/api/student/onboarding", { credentials: "include" }),
          fetch("/api/courses", { credentials: "include" }),
          fetch("/api/enroll?mine=true", { credentials: "include" }),
        ]);

        const welcomeJson = await welcomeRes.json();
        const onboardingJson = await onboardingRes.json();
        const coursesJson = await coursesRes.json();
        const enrollmentsJson = await enrollmentsRes.json();

        if (!welcomeRes.ok || !onboardingRes.ok || !coursesRes.ok || !enrollmentsRes.ok) {
          throw new Error(
            welcomeJson.error || onboardingJson.error || coursesJson.error || enrollmentsJson.error || "Failed to load onboarding data."
          );
        }

        if (!isMounted) return;

        const welcomeData = welcomeJson.data as WelcomePayload;
        const onboardingData = onboardingJson.data as OnboardingPayload;
        const courseData = (coursesJson.data as CoursePayload[]) ?? [];
        const enrollmentData = (enrollmentsJson.data as EnrollmentPayload[]) ?? [];

        setWelcome(welcomeData);
        setOnboarding(onboardingData);
        setCourses(courseData);
        setEnrollments(enrollmentData);
        setName(onboardingData.name ?? "");
        setBio(onboardingData.bio ?? "");
        setTargetCourseId((current) => current || courseData[0]?.id || "");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load onboarding data.");
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

  const enrolledCourseIds = useMemo(() => new Set(enrollments.map((item) => item.courseId)), [enrollments]);

  async function onCompleteOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch("/api/student/onboarding", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim() || null,
          targetCourseId: targetCourseId || undefined,
          complete: true,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to complete onboarding.");
      }

      setStatus("Onboarding completed and profile saved.");
      setNextLessonPath((payload.nextLessonPath as string | null | undefined) ?? null);

      const enrollmentsResponse = await fetch("/api/enroll?mine=true", { credentials: "include" });
      const enrollmentsPayload = await enrollmentsResponse.json();
      if (enrollmentsResponse.ok) {
        setEnrollments((enrollmentsPayload.data as EnrollmentPayload[]) ?? []);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to complete onboarding.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="p-4 lg:p-6">
        <p className="text-sm text-slate-500">Loading onboarding workflow...</p>
      </main>
    );
  }

  return (
    <main className="p-4 lg:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-slate-900">Student Onboarding</h1>
          <p className="mt-2 text-sm text-slate-600">{welcome?.message ?? "Welcome to LinguistPro."}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {welcome?.suggestedNextStep ?? "Complete profile and choose your first course."}
          </p>
          {onboarding?.onboardingCompletedAt ? (
            <p className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              Completed on {new Date(onboarding.onboardingCompletedAt).toLocaleDateString()}
            </p>
          ) : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <form onSubmit={onCompleteOnboarding} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Profile Setup + First Enrollment</h2>
            <p className="mt-2 text-sm text-slate-600">
              Save profile details and enroll in your first published course in one step.
            </p>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Full name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  minLength={2}
                  maxLength={120}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f47361]"
                />
              </label>

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
                First course
                <select
                  value={targetCourseId}
                  onChange={(event) => setTargetCourseId(event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f47361]"
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}
            {status ? <p className="mt-4 text-sm font-semibold text-emerald-700">{status}</p> : null}

            <button
              type="submit"
              disabled={saving || courses.length === 0}
              className="mt-5 rounded-xl bg-[#2d3e50] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1a2530] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Completing..." : "Complete Onboarding"}
            </button>
          </form>

          <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">My Courses</h2>
            <p className="text-sm text-slate-600">
              Enrolled courses: <span className="font-bold text-slate-900">{enrollments.length}</span>
            </p>

            {enrollments.length === 0 ? (
              <p className="text-sm text-slate-500">No enrollments yet. Complete onboarding to get started.</p>
            ) : (
              <ul className="space-y-2">
                {enrollments.map((item) => (
                  <li key={item.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    <p className="font-bold text-slate-800">{item.course.title}</p>
                    <p className="text-xs text-slate-500">
                      Enrolled {new Date(item.createdAt).toLocaleDateString()} · Status {item.course.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {nextLessonPath ? (
              <Link
                href={nextLessonPath}
                className="inline-flex rounded-xl bg-[#f47361] px-4 py-2 text-xs font-black uppercase tracking-wide text-white hover:brightness-105"
              >
                Continue to Learning
              </Link>
            ) : null}

            {targetCourseId && enrolledCourseIds.has(targetCourseId) ? (
              <p className="text-xs font-semibold text-emerald-700">Selected first course is already enrolled.</p>
            ) : null}
          </aside>
        </section>
      </div>
    </main>
  );
}
