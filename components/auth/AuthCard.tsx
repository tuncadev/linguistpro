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

type RegisterResponse = {
  message?: string;
  error?: string;
  verificationRequired?: boolean;
  verificationToken?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: "STUDENT" | "TUTOR" | "ADMIN";
  };
};

type AuthTab = "login" | "register";

type AuthCardProps = {
  nextPath?: string | null;
  initialTab?: AuthTab;
  onSuccess?: () => void;
};

function redirectByRole(role: "STUDENT" | "TUTOR" | "ADMIN", locale: string) {
  if (role === "ADMIN") return `/${locale}/admin/courses`;
  if (role === "TUTOR") return `/${locale}/tutor/my-courses`;
  return `/${locale}/student/my-learning`;
}

export default function AuthCard({ nextPath, initialTab = "login", onSuccess }: AuthCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const tLogin = useTranslations("authPage.login");
  const tRegister = useTranslations("authPage.register");

  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const registerHref = nextPath
    ? `/${locale}/register?next=${encodeURIComponent(nextPath)}`
    : `/${locale}/register`;
  const loginHref = nextPath ? `/${locale}/login?next=${encodeURIComponent(nextPath)}` : `/${locale}/login`;

  const switchTab = (nextTab: AuthTab) => {
    setTab(nextTab);
    setError(null);
    setSuccess(null);
  };

  async function onLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const payload = (await response.json()) as LoginResponse;
      if (!response.ok || !payload.user) {
        setError(payload.error ?? tLogin("loginFailed"));
        return;
      }

      setSuccess(payload.message ?? tLogin("loginSuccess"));
      onSuccess?.();
      router.push(nextPath ?? redirectByRole(payload.user.role, locale));
      router.refresh();
    } catch {
      setError(tLogin("requestFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (regPassword !== regConfirmPassword) {
      setError(tRegister("passwordMismatch"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
        }),
      });

      const payload = (await response.json()) as RegisterResponse;
      if (!response.ok) {
        setError(payload.error ?? tRegister("registrationFailed"));
        return;
      }

      if (payload.verificationRequired) {
        setSuccess(payload.message ?? tRegister("registrationSuccess"));
        setRegPassword("");
        setRegConfirmPassword("");
        return;
      }

      setSuccess(payload.message ?? tRegister("registeredSuccessfully"));
      onSuccess?.();
      router.push(nextPath ?? `/${locale}/student/my-learning`);
      router.refresh();
    } catch {
      setError(tRegister("requestFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/30">
      <div className="bg-gradient-to-r from-[#2d3e50] via-slate-700 to-[#f47361] px-7 py-6 text-white">
        <h1 className="text-3xl font-black">{tab === "login" ? tLogin("title") : tRegister("title")}</h1>
        <p className="mt-1 text-sm text-white/90">{tab === "login" ? tLogin("subtitle") : tRegister("subtitle")}</p>
      </div>

      <div className="p-6 sm:p-7">
        <div className="mb-6 flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => switchTab("login")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-black uppercase tracking-wide transition ${
              tab === "login" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tLogin("signIn")}
          </button>
          <button
            type="button"
            onClick={() => switchTab("register")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-black uppercase tracking-wide transition ${
              tab === "register" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tRegister("createAccount")}
          </button>
        </div>

        {tab === "login" ? (
          <form onSubmit={onLoginSubmit} className="space-y-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>{tLogin("email")}</span>
              <input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                required
                autoComplete="email"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#f47361]"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>{tLogin("password")}</span>
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
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
              {isSubmitting ? tLogin("signingIn") : tLogin("signIn")}
            </button>
            <p className="text-sm text-slate-600">
              {tLogin("noAccount")}{" "}
              <button
                type="button"
                onClick={() => switchTab("register")}
                className="font-bold text-sky-700 hover:text-sky-800 hover:underline"
              >
                {tLogin("createOne")}
              </button>
              {" · "}
              <Link href={registerHref} className="font-semibold text-slate-500 hover:underline">
                /register
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={onRegisterSubmit} className="space-y-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>{tRegister("name")}</span>
              <input
                type="text"
                value={regName}
                onChange={(event) => setRegName(event.target.value)}
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#f47361]"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>{tRegister("email")}</span>
              <input
                type="email"
                value={regEmail}
                onChange={(event) => setRegEmail(event.target.value)}
                required
                autoComplete="email"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#f47361]"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                <span>{tRegister("password")}</span>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(event) => setRegPassword(event.target.value)}
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#f47361]"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                <span>{tRegister("confirmPassword")}</span>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(event) => setRegConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#f47361]"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? tRegister("creatingAccount") : tRegister("createAccount")}
            </button>
            <p className="text-sm text-slate-600">
              {tRegister("alreadyRegistered")}{" "}
              <button
                type="button"
                onClick={() => switchTab("login")}
                className="font-bold text-sky-700 hover:text-sky-800 hover:underline"
              >
                {tRegister("signIn")}
              </button>
              {" · "}
              <Link href={loginHref} className="font-semibold text-slate-500 hover:underline">
                /login
              </Link>
            </p>
          </form>
        )}

        {error ? <p className="mt-4 text-sm font-semibold text-rose-600" role="alert">{error}</p> : null}
        {success ? <p className="mt-4 text-sm font-semibold text-emerald-700" role="status">{success}</p> : null}
      </div>
    </section>
  );
}
