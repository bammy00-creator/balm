"use client";

import { useActionState } from "react";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { updateClinicDetails, type FormState } from "./actions";

const initialState: FormState = {};

export function ClinicDetailsForm({
  clinic,
}: {
  clinic: {
    name: string;
    phone: string | null;
    email: string | null;
    state: string | null;
    lga: string | null;
    address: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(updateClinicDetails, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm text-zinc-600">Clinic name</label>
        <input
          type="text"
          name="name"
          required
          defaultValue={clinic.name}
          className="w-full rounded-lg border border-zinc-300 p-3 text-base"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-600">Phone</label>
        <input
          type="tel"
          name="phone"
          defaultValue={clinic.phone ?? ""}
          className="w-full rounded-lg border border-zinc-300 p-3 text-base"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-600">Contact email</label>
        <input
          type="email"
          name="email"
          defaultValue={clinic.email ?? ""}
          className="w-full rounded-lg border border-zinc-300 p-3 text-base"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-zinc-600">State</label>
          <select
            name="state"
            defaultValue={clinic.state ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-base"
          >
            <option value="">Select</option>
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
            defaultValue={clinic.lga ?? ""}
            className="w-full rounded-lg border border-zinc-300 p-3 text-base"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-600">Address</label>
        <textarea
          name="address"
          rows={2}
          defaultValue={clinic.address ?? ""}
          className="w-full rounded-lg border border-zinc-300 p-3 text-base"
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">Saved.</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 self-start rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save details"}
      </button>
    </form>
  );
}
