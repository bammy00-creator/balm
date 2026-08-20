"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "./actions";

const LINKS = [
  { href: "/app", label: "Overview" },
  { href: "/app/responses", label: "Responses" },
  { href: "/app/alerts", label: "Alerts" },
  { href: "/app/publish", label: "Publish" },
  { href: "/app/team", label: "Team" },
  { href: "/app/links", label: "Links" },
  { href: "/app/settings", label: "Settings" },
];

// DESIGN.md section 9: left rail at 220px in --sand, collapsing to a bottom
// bar on mobile. flex-col-reverse puts the (DOM-first) rail visually below
// the (DOM-second) page content on mobile, then sm:flex-row puts it on the
// left on wider screens - no separate mobile/desktop markup needed.
export function AppShell({
  clinicName,
  role,
  children,
}: {
  clinicName: string;
  role: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col-reverse sm:flex-row">
      <aside className="shrink-0 border-t border-rule bg-sand sm:w-[220px] sm:border-t-0 sm:border-r">
        <div className="hidden px-6 py-6 sm:block">
          <p className="font-display text-base font-semibold text-cocoa">{clinicName}</p>
          <p className="text-xs capitalize text-muted">{role}</p>
        </div>
        <nav className="flex overflow-x-auto sm:flex-col sm:overflow-visible sm:px-3">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`min-h-11 shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium sm:rounded-control sm:px-3 ${
                  active ? "bg-marigold text-cocoa" : "text-cocoa/80 hover:bg-rule/60"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <form action={signOut} className="hidden sm:block sm:px-6 sm:pb-6 sm:pt-3">
          <button type="submit" className="min-h-11 text-sm text-muted underline underline-offset-2">
            Sign out
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 bg-milk px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}
