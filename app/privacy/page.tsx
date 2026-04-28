export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#2d3e50" }}>Privacy Policy</h1>
      <p style={{ marginTop: "1rem", color: "#334155", lineHeight: 1.7 }}>
        LinguistPro processes account, course, and learning activity data to deliver language learning services,
        security controls, and operational support.
      </p>
      <h2 style={{ marginTop: "1.5rem", fontSize: "1.25rem", fontWeight: 800, color: "#2d3e50" }}>Data Use</h2>
      <p style={{ marginTop: "0.5rem", color: "#334155", lineHeight: 1.7 }}>
        Data is used for authentication, course enrollment, tutor/student operations, analytics, and incident response.
        Sensitive secrets and integration tokens are protected using approved security controls.
      </p>
      <h2 style={{ marginTop: "1.5rem", fontSize: "1.25rem", fontWeight: 800, color: "#2d3e50" }}>Data Access</h2>
      <p style={{ marginTop: "0.5rem", color: "#334155", lineHeight: 1.7 }}>
        Access is limited by role-based authorization and operational need. Users may contact support for data-access
        and correction requests.
      </p>
    </main>
  );
}
