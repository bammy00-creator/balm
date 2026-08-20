import Link from "next/link";

export default function SiteNotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-base font-semibold text-cocoa">Page not found.</p>
      <Link
        href="/"
        className="min-h-11 content-center rounded-control bg-marigold px-4 py-2 text-sm font-semibold text-cocoa"
      >
        Home
      </Link>
    </main>
  );
}
