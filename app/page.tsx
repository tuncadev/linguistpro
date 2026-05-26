import App from "../App";
import { getLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/i18n/seo";

export async function generateMetadata() {
  const locale = await getLocale();
  return buildPageMetadata("home", locale, "/");
}

export default function HomePage() {
  return <App />;
}
