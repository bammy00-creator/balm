import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <h1 className="text-xl font-semibold text-zinc-900">Balm</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        Patient Feedback Engine &mdash; Milestones 1-3 (database, patient form,
        clinic auth and onboarding) are done. The dashboard and other screens
        land in later milestones per SPEC.md.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="min-h-11 content-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="min-h-11 content-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
