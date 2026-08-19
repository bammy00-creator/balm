"use client";

import { useActionState, useRef, useEffect } from "react";
import { addBranch, type FormState } from "./actions";

const initialState: FormState = {};

export function AddBranchForm() {
  const [state, formAction, pending] = useActionState(addBranch, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state.error]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs text-zinc-500">Branch name</label>
        <input
          type="text"
          name="name"
          required
          className="min-h-11 rounded-lg border border-zinc-300 p-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-zinc-500">Address</label>
        <input
          type="text"
          name="address"
          className="min-h-11 rounded-lg border border-zinc-300 p-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add branch"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
