"use client";

import { useEffect, useMemo, useState } from "react";
import { Info, LayoutGrid, Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import {
  fetchSessionUser,
  logoutUser,
  updatePreferredLocale,
} from "@/services/authApiService";
import {
  isSupportedLocale,
  normalizeLocale,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@/i18n/routing";
import { localizePath } from "@/i18n/locale-path";
import type { User } from "@/types";
import AuthCard from "@/components/auth/AuthCard";

const LOCALE_AUTONYMS: Record<AppLocale, string> = {
  uk: "Українська",
  en: "English",
  es: "Español",
  tr: "Türkçe",
  ru: "Язык",
};

function roleDashboardPath(role: User["role"]): string {
  if (role === "ADMIN") {
    return "/admin/courses";
  }
  if (role === "TUTOR") {
    return "/tutor/my-courses";
  }
  return "/student/my-learning";
}

function isCoursesPath(pathname: string): boolean {
  return /\/(courses)(\/|$)/.test(pathname);
}

function isAboutPath(pathname: string): boolean {
  return /\/(about)(\/|$)/.test(pathname);
}

function isDashboardPath(pathname: string): boolean {
  return /\/(admin|student|tutor)(\/|$)/.test(pathname);
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const localeRaw = useLocale();
  const locale = normalizeLocale(localeRaw);
  const tCommon = useTranslations("common");

  const [user, setUser] = useState<User | null>(null);
  const [localeLoading, setLocaleLoading] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const sessionUser = await fetchSessionUser();
      if (!active) {
        return;
      }
      setUser(sessionUser);
    };

    void loadSession();

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!loginModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLoginModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [loginModalOpen]);

  const activeCourses = useMemo(() => isCoursesPath(pathname), [pathname]);
  const activeAbout = useMemo(() => isAboutPath(pathname), [pathname]);
  const activeDashboard = useMemo(() => isDashboardPath(pathname), [pathname]);

  const goTo = (path: string) => {
    router.push(localizePath(path, locale));
  };

  const onSignOut = async () => {
    await logoutUser();
    setUser(null);
    router.push(localizePath("/", locale));
    router.refresh();
  };

  const onLocaleChange = async (nextLocaleRaw: string) => {
    if (!isSupportedLocale(nextLocaleRaw)) {
      return;
    }

    const nextLocale = nextLocaleRaw as AppLocale;
    if (nextLocale === locale) {
      return;
    }

    setLocaleLoading(true);
    try {
      document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

      if (user) {
        const updated = await updatePreferredLocale(nextLocale);
        if (updated) {
          setUser(updated);
        }
      }
    } catch {
      // Switch route anyway.
    } finally {
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const parts = current.split("?");
      const currentPathname = parts[0];
      const suffix = current.slice(currentPathname.length);
      const segments = currentPathname.split("/").filter(Boolean);
      const hasLocalePrefix = segments.length > 0 && isSupportedLocale(segments[0]);
      const nextPath = hasLocalePrefix
        ? `/${[nextLocale, ...segments.slice(1)].join("/")}`
        : `/${[nextLocale, ...segments].join("/")}`;
      window.location.href = `${nextPath}${suffix}`;
    }
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 h-20 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50">
      <div className="flex items-center gap-12">
        <button
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => {
            goTo("/");
            window.scrollTo(0, 0);
          }}
        >
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M70,30 C70,15 55,5 35,5 C15,5 0,15 0,30 C0,40 8,50 20,55 L15,75 L40,60 L40,60 C55,60 70,50 70,35" fill="#2d3e50" />
              <text x="14" y="42" className="text-[32px] font-black fill-white select-none" style={{ fontFamily: "Inter, sans-serif" }}>C</text>
              <path d="M50,45 L75,45 L100,95 L75,95 L68,80 L57,80 L50,95 L25,95 Z" fill="#f47361" />
              <text x="62" y="75" className="text-[24px] font-bold fill-white select-none" style={{ fontFamily: "Inter, sans-serif" }}>A</text>
            </svg>
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="text-xl font-black text-[#2d3e50] tracking-tighter uppercase">
              {tCommon("brandPrimary")}
            </span>
            <span className="text-[10px] font-bold text-[#f47361] tracking-[0.2em] uppercase">
              {tCommon("brandSecondary")}
            </span>
          </div>
        </button>

        <div className="hidden lg:flex items-center gap-8">
          <button
            onClick={() => goTo("/courses")}
            className={`flex items-center gap-2 text-sm font-bold transition-colors ${
              activeCourses ? "text-[#f47361]" : "text-slate-600 hover:text-[#2d3e50]"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{tCommon("courses")}</span>
          </button>
          <button
            onClick={() => goTo("/about")}
            className={`flex items-center gap-2 text-sm font-bold transition-colors ${
              activeAbout ? "text-[#f47361]" : "text-slate-600 hover:text-[#2d3e50]"
            }`}
          >
            <Info className="w-4 h-4" />
            <span>{tCommon("about")}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center">
          <select
            value={locale}
            onChange={(event) => {
              void onLocaleChange(event.target.value);
            }}
            aria-label={tCommon("language")}
            disabled={localeLoading}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none"
          >
            {SUPPORTED_LOCALES.map((item) => (
              <option key={item} value={item}>
                {LOCALE_AUTONYMS[item]}
              </option>
            ))}
          </select>
        </div>

        {user ? (
          <>
            <div className="hidden md:flex items-center gap-4 bg-slate-100 p-1.5 rounded-full border border-slate-200">
              <button
                onClick={() => goTo(roleDashboardPath(user.role))}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeDashboard
                    ? "bg-white text-[#f47361] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tCommon("dashboard")}
              </button>
              <button
                onClick={() => goTo("/settings")}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-700 transition-all"
              >
                {tCommon.has("settings") ? tCommon("settings") : "Settings"}
              </button>
            </div>
            <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-black text-slate-800">{user.name}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{user.role}</p>
              </div>
              <img
                src={user.avatar ?? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"}
                className="w-11 h-11 rounded-full border-2 border-[#f47361] object-cover shadow-lg"
                alt={tCommon("userAvatarAlt")}
              />
              <button
                onClick={onSignOut}
                className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-[#2d3e50] hover:border-slate-300 transition-colors"
              >
                {tCommon("signOut")}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLoginModalOpen(true)}
              className="text-slate-600 font-bold text-sm px-4 py-2 hover:text-[#2d3e50] transition-colors"
            >
              {tCommon("logIn")}
            </button>
            <button
              onClick={() => goTo("/register")}
              className="bg-sky-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-sky-700 transition-all shadow-xl shadow-slate-200"
            >
              {tCommon("startFreeTrial")}
            </button>
          </div>
        )}

        <button className="lg:hidden p-2 text-slate-600" aria-label="menu">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {loginModalOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              onClick={() => setLoginModalOpen(false)}
            >
              <div className="absolute inset-0" />
              <div
                className="relative z-[201] w-full max-w-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setLoginModalOpen(false)}
                  className="absolute top-3 right-3 z-[202] inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-slate-900/70 text-white hover:bg-slate-800"
                  aria-label={tCommon.has("closeAuthModal") ? tCommon("closeAuthModal") : tCommon("close")}
                >
                  <X className="h-4 w-4" />
                </button>
                <AuthCard onSuccess={() => setLoginModalOpen(false)} initialTab="login" />
              </div>
            </div>,
            document.body
          )
        : null}
    </nav>
  );
}
