import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/server-session";
import { resolveLearningAccess } from "@/lib/learning/access";

type LessonPageProps = {
  params: Promise<{
    courseId: string;
    lessonId: string;
  }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params;
  const nextPath = `/learn/${courseId}/${lessonId}`;
  const session = await getServerSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const access = await resolveLearningAccess({
    courseId,
    lessonId,
    session,
  });

  if (!access.allowed) {
    if (access.reason === "COURSE_NOT_FOUND" || access.reason === "LESSON_NOT_FOUND") {
      notFound();
    }
    redirect("/unauthorized");
  }

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Lesson</h1>
      <p>Course: {courseId}</p>
      <p>Lesson: {lessonId}</p>
    </main>
  );
}
