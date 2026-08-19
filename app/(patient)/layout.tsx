import type { Metadata } from "next";
import "./patient.css";

export const metadata: Metadata = {
  title: "Patient feedback",
};

// A second root layout (Next.js "multiple root layouts" pattern). Kept separate
// from app/(site)/layout.tsx so patient-facing pages never pay for the Geist
// web fonts loaded on the main site - see SPEC section 6 (page weight budget).
export default function PatientRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-white text-zinc-900">{children}</body>
    </html>
  );
}
