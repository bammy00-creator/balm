import type { Metadata } from "next";
import "./patient.css";

// No custom webfont at all here. DESIGN.md 5 asks for Gabarito + Public
// Sans on patient screens, but even a single, maximally-subsetted family
// (Public Sans alone, Latin-basic, 400+600 only) measured ~161KB total
// against the 150KB budget in SPEC section 6 - over even after dropping
// Gabarito first. The system font stack is the only way to reliably stay
// under a hard, numbered acceptance criterion. Every other part of the
// design (palette, shape, spacing, voice, the seal) is intact - see
// README.md for the full account of this trade-off. Clinic screens (no
// such budget) load both faces in full - see app/(site)/layout.tsx.
export const metadata: Metadata = {
  title: "Patient feedback",
};

// A second root layout (Next.js "multiple root layouts" pattern). Kept separate
// from app/(site)/layout.tsx so patient-facing pages never pay for the fuller
// clinic-side font weights - see SPEC section 6 (page weight budget).
export default function PatientRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-milk text-cocoa">{children}</body>
    </html>
  );
}
