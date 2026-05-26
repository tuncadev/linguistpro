import { getTranslations } from "next-intl/server";

export default async function AdminTaxonomiesPage() {
  const t = await getTranslations("dashboard.adminTaxonomies");
  return (
    <main className="p-4 lg:p-6">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">
          {t.has("title") ? t("title") : "Admin Taxonomies"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {t.has("subtitle")
            ? t("subtitle")
            : "Taxonomy management scaffold. Language/level CRUD wiring can be added here next."}
        </p>
      </div>
    </main>
  );
}
