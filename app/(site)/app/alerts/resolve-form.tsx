"use client";

import { useState } from "react";

// DESIGN.md section 9: "the button stays disabled with the helper text: add
// a short note about what you did" - needs client state to reflect note
// length back into the button, not just HTML's required/minLength (which
// blocks submission but doesn't visually disable anything).
export function ResolveForm({ alertId }: { alertId: string }) {
  const [note, setNote] = useState("");
  const valid = note.trim().length >= 10;

  return (
    <form action={`/api/alerts/${alertId}/resolve`} method="post" className="mt-3">
      <textarea
        name="note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="What did you do about this?"
        className="w-full rounded-control border border-rule bg-paper p-2 text-sm text-cocoa"
      />
      <p className="mt-1 text-xs text-muted">
        {valid ? " " : "Add a short note about what you did."}
      </p>
      <button
        type="submit"
        disabled={!valid}
        className="min-h-11 rounded-control bg-marigold px-4 py-2 text-sm font-semibold text-cocoa disabled:cursor-not-allowed disabled:opacity-40"
      >
        Resolve
      </button>
    </form>
  );
}
