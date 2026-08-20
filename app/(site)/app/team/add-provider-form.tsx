"use client";

import { useActionState, useRef, useEffect } from "react";
import { addProvider, type FormState } from "./actions";

const initialState: FormState = {};

export function AddProviderForm({
  branches,
}: {
  branches: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(addProvider, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state.error]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs text-muted">Name</label>
        <input
          type="text"
          name="full_name"
          required
          className="min-h-11 rounded-control border border-rule p-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Role</label>
        <input
          type="text"
          name="role"
          placeholder="Doctor, Nurse, Front desk..."
          className="min-h-11 rounded-control border border-rule p-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Branch</label>
        <select
          name="branch_id"
          required
          defaultValue=""
          className="min-h-11 rounded-control border border-rule bg-paper p-2 text-sm"
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
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-control bg-marigold px-4 py-2 text-sm font-semibold text-cocoa disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add provider"}
      </button>
      {state.error && <p className="w-full text-sm text-berry">{state.error}</p>}
    </form>
  );
}
