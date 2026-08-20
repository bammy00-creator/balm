"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "./actions";

const LINKS = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/responses", label: "Responses" },
  { href: "/app/alerts", label: "Alerts" },
  { href: "/app/publish", label: "Publish" },
  { href: "/app/team", label: "Team" },
  { href: "/app/links", label: "Links" },
  { href: "/app/settings", label: "Settings" },
];

export function AppNav({ clinicName, role }: { clinicName: string; role: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">{clinicName}</p>
          <p className="text-xs capitalize text-zinc-400">{role}</p>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`min-h-11 rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-11 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
