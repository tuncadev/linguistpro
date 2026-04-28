export default function SupportPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#2d3e50" }}>Support and Incident Contact</h1>
      <p style={{ marginTop: "1rem", color: "#334155", lineHeight: 1.7 }}>
        For account, learning, tutor operations, and billing issues, contact support with your account email, course
        context, and issue timeline.
      </p>
      <h2 style={{ marginTop: "1.5rem", fontSize: "1.25rem", fontWeight: 800, color: "#2d3e50" }}>
        Contact Channels
      </h2>
      <ul style={{ marginTop: "0.5rem", color: "#334155", lineHeight: 1.9 }}>
        <li>Support Email: support@linguistpro.local</li>
        <li>Incident Escalation: incidents@linguistpro.local</li>
        <li>Response SLA: see `docs/SUPPORT_INCIDENT_RUNBOOK.md`</li>
      </ul>
    </main>
  );
}
