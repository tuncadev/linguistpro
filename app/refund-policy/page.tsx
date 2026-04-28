export default function RefundPolicyPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#2d3e50" }}>Refund Policy</h1>
      <p style={{ marginTop: "1rem", color: "#334155", lineHeight: 1.7 }}>
        Refund handling is processed through support review and billing provider constraints. Requests are evaluated
        against purchase timing, class/session usage, and fraud checks.
      </p>
      <h2 style={{ marginTop: "1.5rem", fontSize: "1.25rem", fontWeight: 800, color: "#2d3e50" }}>
        Request Window
      </h2>
      <p style={{ marginTop: "0.5rem", color: "#334155", lineHeight: 1.7 }}>
        Users should submit refund requests as early as possible through the support channel listed on the Support
        page.
      </p>
      <h2 style={{ marginTop: "1.5rem", fontSize: "1.25rem", fontWeight: 800, color: "#2d3e50" }}>
        Dispute Handling
      </h2>
      <p style={{ marginTop: "0.5rem", color: "#334155", lineHeight: 1.7 }}>
        Charge disputes are tracked as incidents and resolved with billing evidence, course access logs, and policy
        review.
      </p>
    </main>
  );
}
