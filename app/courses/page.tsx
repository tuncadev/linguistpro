import App from "@/App";
import { getLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/i18n/seo";

export async function generateMetadata() {
  const locale = await getLocale();
  return buildPageMetadata("courses", locale, "/courses");
}

export default function CoursesPage() {
  return <App initialView="catalog" />;
}
