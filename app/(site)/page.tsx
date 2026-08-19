export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-white px-6 text-center">
      <h1 className="text-xl font-semibold text-zinc-900">Balm</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        Patient Feedback Engine &mdash; Milestone 1 (database schema, RLS, seed
        data) is done. The patient form, dashboard, and other screens land in
        later milestones per SPEC.md.
      </p>
    </div>
  );
}
