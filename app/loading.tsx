import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("loaders.appBoot");
  const tx = (key: string, fallback: string) =>
    t.has(key) ? t(key) : fallback;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-4">
            <div className="app-loader-pulse h-11 w-11 rounded-2xl bg-[#2d3e50]" />
            <div className="leading-tight">
              <p className="text-xl font-black uppercase tracking-tight text-[#2d3e50]">
                {tx("brandPrimary", "Catalina")}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f47361]">
                {tx("brandSecondary", "Academy")}
              </p>
            </div>
          </div>
          <div className="mb-5">
            <p className="text-sm font-bold text-slate-700">
              {tx("title", "Loading your learning workspace...")}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {tx("subtitle", "Preparing courses, tutors, and dashboard data")}
            </p>
          </div>
          <div className="space-y-3">
            <div className="h-3 w-5/6 rounded-full bg-slate-100" />
            <div className="h-3 w-4/6 rounded-full bg-slate-100" />
            <div className="h-10 w-full rounded-xl bg-slate-100" />
            <div className="h-10 w-full rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    </main>
  );
}
