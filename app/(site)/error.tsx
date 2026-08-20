"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-base font-semibold text-cocoa">Something went wrong.</p>
      <p className="text-sm text-muted">
        This has been logged. You can try again, or head back home.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          onClick={reset}
          className="min-h-11 rounded-control bg-marigold px-4 py-2 text-sm font-semibold text-cocoa"
        >
          Try again
        </button>
        <Link
          href="/"
          className="min-h-11 content-center rounded-control border border-rule px-4 py-2 text-sm text-cocoa"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
