import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
      <h1 className="text-xl font-semibold text-cocoa">Balm</h1>
      <p className="max-w-sm text-sm text-muted">
        Patient Feedback Engine &mdash; Milestones 1-3 (database, patient form,
        clinic auth and onboarding) are done. The dashboard and other screens
        land in later milestones per SPEC.md.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="min-h-11 content-center rounded-control border border-rule px-4 py-2 text-sm font-semibold text-cocoa"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="min-h-11 content-center rounded-control bg-marigold px-4 py-2 text-sm font-semibold text-cocoa"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
