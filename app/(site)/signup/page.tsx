"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type FormState } from "./actions";

const initialState: FormState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  if (state.checkEmail) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-12 text-center">
        <h1 className="mb-2 text-xl font-semibold text-cocoa">Check your email</h1>
        <p className="text-sm text-cocoa">
          We sent a confirmation link. Click it, then{" "}
          <Link href="/login" className="underline">
            log in
          </Link>{" "}
          to set up your clinic.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="mb-1 text-xl font-semibold text-cocoa">Set up your clinic</h1>
      <p className="mb-6 text-sm text-muted">
        Create an account first - you&apos;ll add your clinic&apos;s details next.
      </p>
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm text-cocoa">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-control border border-rule p-3 text-base"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-cocoa">Password</label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="w-full rounded-control border border-rule p-3 text-base"
          />
          <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
        </div>
        {state.error && <p className="text-sm text-berry">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-control bg-marigold px-4 py-3 text-base font-semibold text-cocoa disabled:opacity-60"
        >
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
