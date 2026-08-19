import Link from "next/link";

export default function AppHomePage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-zinc-900">Dashboard</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500">
        The scores-over-time dashboard and alerting land in Milestone 4. For now,
        set up your branches and providers and generate a feedback link.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/app/team"
          className="min-h-11 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white"
        >
          Set up team
        </Link>
        <Link
          href="/app/links"
          className="min-h-11 rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-900"
        >
          Generate a link
        </Link>
      </div>
    </div>
  );
}
