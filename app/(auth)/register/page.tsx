"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (password !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const payload = (await response.json()) as RegisterResponse;
      if (!response.ok) {
        setError(payload.error ?? "Registration failed");
        return;
      }

      if (payload.verificationRequired) {
        const tokenHint = payload.verificationToken
          ? ` Verification token (dev/test): ${payload.verificationToken}`
          : "";
        setSuccess(`${payload.message ?? "Registration successful. Verify email before login."}${tokenHint}`);
        setPassword("");
        setConfirmPassword("");
        return;
      }

      setSuccess(payload.message ?? "Registered successfully");
      router.push(nextPath ?? "/student/my-learning");
      router.refresh();
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";

  return (
    <main style={{ maxWidth: "460px", margin: "3rem auto", padding: "0 1rem" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Create account</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Register a new student account for the platform.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.8rem" }}>
        <label style={{ display: "grid", gap: "0.3rem" }}>
          <span>Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          />
        </label>

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
            maxLength={72}
            autoComplete="new-password"
            style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          />
        </label>

        <label style={{ display: "grid", gap: "0.3rem" }}>
          <span>Confirm password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
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
          {isSubmitting ? "Creating account..." : "Create account"}
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
        Already registered? <Link href={loginHref}>Sign in</Link>
      </p>
    </main>
  );
}
