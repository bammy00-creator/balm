"use client";

// Deliberately minimal - no extra imports beyond React itself, to stay
// inside the patient form's page-weight budget (SPEC section 6).
export default function PatientError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-base font-medium text-zinc-900">Something went wrong.</p>
      <p className="text-sm text-zinc-500">Your answers are safe. Please try again.</p>
      <button
        onClick={reset}
        className="min-h-11 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white"
      >
        Try again
      </button>
    </main>
  );
}
