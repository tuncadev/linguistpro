type LessonPageProps = {
  params: {
    courseId: string;
    lessonId: string;
  };
};

export default function LessonPage({ params }: LessonPageProps) {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Lesson</h1>
      <p>Course: {params.courseId}</p>
      <p>Lesson: {params.lessonId}</p>
    </main>
  );
}

