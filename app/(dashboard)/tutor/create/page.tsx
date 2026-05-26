import { getTranslations } from "next-intl/server";

export default async function TutorCreateCoursePage() {
  const t = await getTranslations("misc.tutorCreateCourse");
  return (
    <main style={{ padding: "2rem" }}>
      <h1>{t.has("title") ? t("title") : "Tutor: Create Course"}</h1>
      <p>{t.has("scaffold") ? t("scaffold") : "Protected route scaffold."}</p>
    </main>
  );
}
