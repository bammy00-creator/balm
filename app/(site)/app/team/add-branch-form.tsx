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
        <label className="mb-1 block text-xs text-muted">Branch name</label>
        <input
          type="text"
          name="name"
          required
          className="min-h-11 rounded-control border border-rule p-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Address</label>
        <input
          type="text"
          name="address"
          className="min-h-11 rounded-control border border-rule p-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-control bg-marigold px-4 py-2 text-sm font-semibold text-cocoa disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add branch"}
      </button>
      {state.error && <p className="w-full text-sm text-berry">{state.error}</p>}
    </form>
  );
}
