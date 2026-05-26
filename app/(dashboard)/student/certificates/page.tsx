import { getTranslations } from "next-intl/server";

export default async function StudentCertificatesPage() {
  const t = await getTranslations("misc.studentCertificates");
  return (
    <main style={{ padding: "2rem" }}>
      <h1>{t.has("title") ? t("title") : "Student: Certificates"}</h1>
      <p>{t.has("scaffold") ? t("scaffold") : "Protected route scaffold."}</p>
    </main>
  );
}
