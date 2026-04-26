import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "780px", margin: "0 auto" }}>
      <h1>LinguistPro</h1>
      <p>Next.js runtime is active. Use the links below to test auth and API wiring.</p>

      <ul>
        <li>
          <Link href="/login">Login</Link>
        </li>
        <li>
          <Link href="/register">Register</Link>
        </li>
        <li>
          <Link href="/api/health">API health</Link>
        </li>
      </ul>
    </main>
  );
}
