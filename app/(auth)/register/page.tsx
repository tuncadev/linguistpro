"use client";

import { useSearchParams } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const nextPathRaw = searchParams.get("next");
  const nextPath = nextPathRaw && nextPathRaw.startsWith("/") ? nextPathRaw : null;

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-gradient-to-br from-slate-100 via-white to-sky-50 px-4 py-10">
      <div className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-[#f47361]/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 -bottom-24 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="relative mx-auto flex w-full max-w-5xl justify-center">
        <AuthCard nextPath={nextPath} initialTab="register" />
      </div>
    </main>
  );
}
