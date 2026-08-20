import Link from "next/link";

// Handles a URL that matches no route at all. Next.js can't know which of
// the two root layouts ((site) or (patient)) such a URL "belongs" to, so
// this top-level file needs its own <html>/<body>, same as global-error.tsx.
export default function NotFound() {
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
          fontFamily:
            "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <p style={{ fontSize: "16px", fontWeight: 600, color: "#18181b" }}>
          Page not found.
        </p>
        <Link
          href="/"
          style={{
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
            borderRadius: "8px",
            background: "#18181b",
            color: "#fff",
            padding: "10px 20px",
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          Home
        </Link>
      </body>
    </html>
  );
}
