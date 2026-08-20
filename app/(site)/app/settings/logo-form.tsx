"use client";

import { useActionState } from "react";
import { updateClinicLogo, type FormState } from "./actions";

const initialState: FormState = {};

export function LogoForm({ logoUrl }: { logoUrl: string | null }) {
  const [state, formAction, pending] = useActionState(updateClinicLogo, initialState);

  return (
    <form action={formAction} className="flex items-center gap-4">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt="Clinic logo"
          className="h-16 w-16 rounded-control border border-rule object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-control border border-dashed border-rule text-xs text-muted">
          None
        </div>
      )}
      <div>
        <input type="file" name="logo" accept="image/png,image/jpeg,image/webp" required />
        <button
          type="submit"
          disabled={pending}
          className="ml-3 rounded-control bg-marigold px-3 py-2 text-xs font-semibold text-cocoa disabled:opacity-60"
        >
          {pending ? "Uploading..." : "Upload"}
        </button>
        {state.error && <p className="mt-1 text-sm text-berry">{state.error}</p>}
        {state.success && <p className="mt-1 text-sm text-leaf">Saved.</p>}
        <p className="mt-1 text-xs text-muted">PNG, JPEG, or WebP, under 2MB.</p>
      </div>
    </form>
  );
}
