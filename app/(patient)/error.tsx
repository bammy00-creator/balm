"use client";

// Deliberately minimal - no extra imports beyond React itself, to stay
// inside the patient form's page-weight budget (SPEC section 6).
export default function PatientError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-[520px] flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-display text-base font-semibold text-cocoa">Something went wrong.</p>
      <p className="text-sm text-muted">Your answers are safe. Please try again.</p>
      <button
        onClick={reset}
        className="min-h-16 rounded-control bg-marigold px-4 py-3 text-sm font-semibold text-cocoa"
      >
        Try again
      </button>
    </main>
  );
}
