import { getLocale, getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/i18n/seo";

export async function generateMetadata() {
  const locale = await getLocale();
  return buildPageMetadata("support", locale, "/support");
}

export default async function SupportPage() {
  const t = await getTranslations("pages.support");
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#2d3e50" }}>{t("title")}</h1>
      <p style={{ marginTop: "1rem", color: "#334155", lineHeight: 1.7 }}>
        {t("intro")}
      </p>
      <h2 style={{ marginTop: "1.5rem", fontSize: "1.25rem", fontWeight: 800, color: "#2d3e50" }}>
        {t("channelsTitle")}
      </h2>
      <ul style={{ marginTop: "0.5rem", color: "#334155", lineHeight: 1.9 }}>
        <li>{t("supportEmail")}</li>
        <li>{t("incidentEscalation")}</li>
        <li>{t("responseSla")}</li>
      </ul>
    </main>
  );
}
