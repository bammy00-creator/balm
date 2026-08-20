"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type FormState } from "./actions";

const initialState: FormState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="mb-6 text-xl font-semibold text-cocoa">Log in</h1>
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
            className="w-full rounded-control border border-rule p-3 text-base"
          />
        </div>
        {state.error && <p className="text-sm text-berry">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-control bg-marigold px-4 py-3 text-base font-semibold text-cocoa disabled:opacity-60"
        >
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        New clinic?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
