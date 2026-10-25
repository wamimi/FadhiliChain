"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f4efe4", color: "#1d2417", display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div style={{ padding: 24, maxWidth: 520 }}>
          <h1 style={{ fontSize: 40, fontWeight: 900, margin: 0 }}>FadhiliChain is having trouble</h1>
          <p style={{ fontSize: 18, lineHeight: 1.5 }}>Your money is safe in its campaign contract. Please try again in a moment.</p>
          <button onClick={reset} style={{ padding: "14px 24px", borderRadius: 999, border: 0, background: "#1d2417", color: "#f4efe4", fontWeight: 600, fontSize: 16 }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
