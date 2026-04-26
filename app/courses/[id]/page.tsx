type CourseDetailsPageProps = {
  params: { id: string };
};

export default function CourseDetailsPage({ params }: CourseDetailsPageProps) {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Course Details</h1>
      <p>Course ID: {params.id}</p>
    </main>
  );
}

