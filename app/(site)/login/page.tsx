"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type FormState } from "./actions";

const initialState: FormState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">Log in</h1>
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-600">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-lg border border-zinc-300 p-3 text-base"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600">Password</label>
          <input
            type="password"
            name="password"
            required
            className="w-full rounded-lg border border-zinc-300 p-3 text-base"
          />
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-lg bg-zinc-900 px-4 py-3 text-base font-medium text-white disabled:opacity-60"
        >
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-zinc-500">
        New clinic?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
