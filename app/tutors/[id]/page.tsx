type TutorProfilePageProps = {
  params: { id: string };
};

export default function TutorProfilePage({ params }: TutorProfilePageProps) {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Tutor Profile</h1>
      <p>Tutor ID: {params.id}</p>
    </main>
  );
}

