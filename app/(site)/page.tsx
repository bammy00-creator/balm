import Link from "next/link";

const STEPS = [
  {
    title: "Send a link",
    body: "After a visit, share a QR code at the front desk or send a link by WhatsApp or text. No app to install.",
  },
  {
    title: "They answer in seconds",
    body: "Four short questions, about thirty seconds. No account, no login, nothing about their health condition.",
  },
  {
    title: "You find out first",
    body: "A low score alerts you the same day, with a WhatsApp link to call the patient back. Good ones can go public, with their permission.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-marigold" />
            <span className="font-display text-lg font-semibold text-cocoa">Balm</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-cocoa">
              Log in
            </Link>
            <Link
              href="/signup"
              className="min-h-11 content-center rounded-control bg-marigold px-4 py-2 text-sm font-semibold text-cocoa"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 pb-16 pt-20 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">
            For Nigerian clinics
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight text-cocoa sm:text-5xl">
            Know how your patients feel, before they tell the internet.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-cocoa">
            Send a short link after every visit. Patients answer four quick
            questions on their phone. You see the results the same day, with
            time to call back before a bad visit becomes a bad review.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="min-h-16 content-center rounded-control bg-marigold px-6 py-3 text-base font-semibold text-cocoa"
            >
              Set up your clinic
            </Link>
            <Link
              href="/login"
              className="min-h-16 content-center rounded-control border border-rule px-6 py-3 text-base font-semibold text-cocoa"
            >
              Log in
            </Link>
          </div>
        </section>

        <section className="border-t border-rule bg-sand">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <p className="mb-8 text-center text-sm font-semibold uppercase tracking-[0.08em] text-muted">
              How it works
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <div key={step.title} className="rounded-block bg-milk p-6 shadow-soft">
                  <p className="font-display text-2xl font-bold text-leaf">{i + 1}</p>
                  <p className="mt-2 font-display text-lg font-semibold text-cocoa">
                    {step.title}
                  </p>
                  <p className="mt-2 text-sm text-muted">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="font-display text-2xl font-semibold text-cocoa">
            Patients never sign up for anything.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted">
            No account, no download, and nothing about their health condition
            is ever asked or stored. Just four questions, straight to you.
          </p>
        </section>

        <section className="border-t border-rule bg-sand">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <h2 className="font-display text-2xl font-semibold text-cocoa">
              Ready to hear from your patients?
            </h2>
            <Link
              href="/signup"
              className="mt-6 inline-block min-h-16 content-center rounded-control bg-marigold px-6 py-3 text-base font-semibold text-cocoa"
            >
              Set up your clinic
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule px-6 py-8 text-center text-sm text-muted">
        Balm is built by Atofarati. Reviews patients agree to share appear on
        their clinic&apos;s Sabi Health page.
      </footer>
    </div>
  );
}
