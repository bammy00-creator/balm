"use client";

// Only fires if a root layout itself throws (rare) - Next.js requires this
// file to render its own <html>/<body>, so it can't lean on Tailwind or any
// other layout. Inline styles keep it working even when something upstream
// is badly broken.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          padding: "24px",
          textAlign: "center",
          fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <p style={{ fontSize: "16px", fontWeight: 600, color: "#18181b" }}>
          Something went wrong.
        </p>
        <button
          onClick={reset}
          style={{
            minHeight: "44px",
            borderRadius: "8px",
            background: "#18181b",
            color: "#fff",
            padding: "10px 20px",
            fontSize: "14px",
            border: "none",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
