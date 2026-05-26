"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

type LoginResponse = {
  message?: string;
  error?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: "STUDENT" | "TUTOR" | "ADMIN";
  };
};

type LoginCardProps = {
  nextPath?: string | null;
  onSuccess?: () => void;
};

function redirectByRole(role: "STUDENT" | "TUTOR" | "ADMIN", locale: string) {
  if (role === "ADMIN") return `/${locale}/admin/courses`;
  if (role === "TUTOR") return `/${locale}/tutor/my-courses`;
  return `/${locale}/student/my-learning`;
}

export default function LoginCard({ nextPath, onSuccess }: LoginCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("authPage.login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const registerHref = nextPath
    ? `/${locale}/register?next=${encodeURIComponent(nextPath)}`
    : `/${locale}/register`;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as LoginResponse;
      if (!response.ok || !payload.user) {
        setError(payload.error ?? t("loginFailed"));
        return;
      }

      setSuccess(payload.message ?? t("loginSuccess"));
      onSuccess?.();
      router.push(nextPath ?? redirectByRole(payload.user.role, locale));
      router.refresh();
    } catch {
      setError(t("requestFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/30">
      <div className="bg-gradient-to-r from-[#2d3e50] via-slate-700 to-[#f47361] px-6 py-5 text-white">
        <h1 className="text-2xl font-black">{t("title")}</h1>
        <p className="mt-1 text-sm text-white/90">{t("subtitle")}</p>
      </div>

      <div className="space-y-4 p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            <span>{t("email")}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#f47361]"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            <span>{t("password")}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="current-password"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#f47361]"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t("signingIn") : t("signIn")}
          </button>
        </form>

        {error ? <p className="text-sm font-semibold text-rose-600" role="alert">{error}</p> : null}
        {success ? <p className="text-sm font-semibold text-emerald-700" role="status">{success}</p> : null}

        <p className="text-sm text-slate-600">
          {t("noAccount")}{" "}
          <Link href={registerHref} className="font-bold text-sky-700 hover:text-sky-800 hover:underline">
            {t("createOne")}
          </Link>
        </p>
      </div>
    </section>
  );
}
