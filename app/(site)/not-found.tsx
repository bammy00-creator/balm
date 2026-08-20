import Link from "next/link";

export default function SiteNotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-base font-medium text-zinc-900">Page not found.</p>
      <Link
        href="/"
        className="min-h-11 content-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
      >
        Home
      </Link>
    </main>
  );
}
