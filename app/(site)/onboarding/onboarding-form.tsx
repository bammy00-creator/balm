"use client";

import { useActionState } from "react";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { createClinic, type FormState } from "./actions";

const initialState: FormState = {};

export function OnboardingForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, formAction, pending] = useActionState(createClinic, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm text-zinc-600">Clinic name</label>
        <input
          type="text"
          name="name"
          required
          className="w-full rounded-lg border border-zinc-300 p-3 text-base"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-600">Phone</label>
        <input
          type="tel"
          name="phone"
          placeholder="0803 123 4567"
          className="w-full rounded-lg border border-zinc-300 p-3 text-base"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-600">Contact email</label>
        <input
          type="email"
          name="email"
          defaultValue={defaultEmail}
          className="w-full rounded-lg border border-zinc-300 p-3 text-base"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-zinc-600">State</label>
          <select
            name="state"
            defaultValue=""
            className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-base"
          >
            <option value="" disabled>
              Select
            </option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600">LGA</label>
          <input
            type="text"
            name="lga"
            className="w-full rounded-lg border border-zinc-300 p-3 text-base"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-600">Address</label>
        <textarea
          name="address"
          rows={2}
          className="w-full rounded-lg border border-zinc-300 p-3 text-base"
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-zinc-900 px-4 py-3 text-base font-medium text-white disabled:opacity-60"
      >
        {pending ? "Setting up..." : "Continue"}
      </button>
    </form>
  );
}
