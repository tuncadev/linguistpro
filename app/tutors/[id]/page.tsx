import { getTranslations } from "next-intl/server";

type TutorProfilePageProps = {
  params: { id: string };
};

export default async function TutorProfilePage({ params }: TutorProfilePageProps) {
  const t = await getTranslations("misc.tutorProfilePage");
  return (
    <main style={{ padding: "2rem" }}>
      <h1>{t.has("title") ? t("title") : "Tutor Profile"}</h1>
      <p>{t.has("idLabel") ? t("idLabel") : "Tutor ID"}: {params.id}</p>
    </main>
  );
}
