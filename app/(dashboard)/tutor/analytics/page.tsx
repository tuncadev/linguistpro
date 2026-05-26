import { getTranslations } from "next-intl/server";

export default async function TutorAnalyticsPage() {
  const t = await getTranslations("misc.tutorAnalytics");
  return (
    <main style={{ padding: "2rem" }}>
      <h1>{t.has("title") ? t("title") : "Tutor: Analytics"}</h1>
      <p>{t.has("scaffold") ? t("scaffold") : "Protected route scaffold."}</p>
    </main>
  );
}
