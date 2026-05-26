import { getLocale, getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/i18n/seo";

export async function generateMetadata() {
  const locale = await getLocale();
  return buildPageMetadata("privacy", locale, "/privacy");
}

export default async function PrivacyPage() {
  const t = await getTranslations("pages.privacy");
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#2d3e50" }}>{t("title")}</h1>
      <p style={{ marginTop: "1rem", color: "#334155", lineHeight: 1.7 }}>
        {t("intro")}
      </p>
      <h2 style={{ marginTop: "1.5rem", fontSize: "1.25rem", fontWeight: 800, color: "#2d3e50" }}>{t("dataUseTitle")}</h2>
      <p style={{ marginTop: "0.5rem", color: "#334155", lineHeight: 1.7 }}>
        {t("dataUseBody")}
      </p>
      <h2 style={{ marginTop: "1.5rem", fontSize: "1.25rem", fontWeight: 800, color: "#2d3e50" }}>{t("dataAccessTitle")}</h2>
      <p style={{ marginTop: "0.5rem", color: "#334155", lineHeight: 1.7 }}>
        {t("dataAccessBody")}
      </p>
    </main>
  );
}
