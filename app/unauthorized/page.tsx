import { getLocale, getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/i18n/seo";

export async function generateMetadata() {
  const locale = await getLocale();
  return buildPageMetadata("unauthorized", locale, "/unauthorized");
}

export default async function UnauthorizedPage() {
  const t = await getTranslations("pages.unauthorized");
  return (
    <main style={{ padding: "2rem" }}>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </main>
  );
}
