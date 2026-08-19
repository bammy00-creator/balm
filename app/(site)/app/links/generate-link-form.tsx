"use client";

import { useActionState, useRef, useEffect } from "react";
import { generateLink, type FormState } from "./actions";

const initialState: FormState = {};

export function GenerateLinkForm({
  branches,
}: {
  branches: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(generateLink, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state.error]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs text-zinc-500">Branch</label>
        <select
          name="branch_id"
          required
          defaultValue=""
          className="min-h-11 rounded-lg border border-zinc-300 bg-white p-2 text-sm"
        >
          <option value="" disabled>
            Select
          </option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-zinc-500">Channel</label>
        <select
          name="channel"
          defaultValue="qr"
          className="min-h-11 rounded-lg border border-zinc-300 bg-white p-2 text-sm"
        >
          <option value="qr">QR poster</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-zinc-500">Label (optional)</label>
        <input
          type="text"
          name="label"
          placeholder="Front desk poster"
          className="min-h-11 rounded-lg border border-zinc-300 p-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Generating..." : "Generate link"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
