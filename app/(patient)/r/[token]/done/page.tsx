export default async function DonePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-lg font-medium text-zinc-900">Thank you.</p>
      <p className="text-base text-zinc-600">Your feedback has been received.</p>
      {notice === "1" && (
        <p className="mt-2 text-base text-zinc-600">
          The clinic manager has been notified and may call you.
        </p>
      )}
    </main>
  );
}
