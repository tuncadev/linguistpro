"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

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

function redirectByRole(role: "STUDENT" | "TUTOR" | "ADMIN") {
  if (role === "ADMIN") {
    return "/admin/courses";
  }
  if (role === "TUTOR") {
    return "/tutor/my-courses";
  }
  return "/student/my-learning";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState<string | null>(null);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("next");
    if (!value || !value.startsWith("/")) {
      return;
    }
    setNextPath(value);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const payload = (await response.json()) as LoginResponse;
      if (!response.ok || !payload.user) {
        setError(payload.error ?? "Login failed");
        return;
      }

      setSuccess(payload.message ?? "Login successful");
      router.push(nextPath ?? redirectByRole(payload.user.role));
      router.refresh();
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const registerHref = nextPath
    ? `/register?next=${encodeURIComponent(nextPath)}`
    : "/register";

  return (
    <main style={{ maxWidth: "460px", margin: "3rem auto", padding: "0 1rem" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Login</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Sign in with your account to access student, tutor, or admin routes.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.8rem" }}>
        <label style={{ display: "grid", gap: "0.3rem" }}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          />
        </label>

        <label style={{ display: "grid", gap: "0.3rem" }}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="current-password"
            style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: "0.7rem 0.9rem",
            border: 0,
            borderRadius: "8px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            background: "#0f172a",
            color: "#fff",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {error ? (
        <p style={{ marginTop: "0.9rem", color: "#b91c1c" }} role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p style={{ marginTop: "0.9rem", color: "#166534" }} role="status">
          {success}
        </p>
      ) : null}

      <p style={{ marginTop: "1.2rem" }}>
        No account yet? <Link href={registerHref}>Create one</Link>
      </p>
    </main>
  );
}
