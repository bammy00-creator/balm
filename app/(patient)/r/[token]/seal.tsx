"use client";

import { useSyncExternalStore } from "react";

function subscribeToMotionPreference(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
const getPrefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getPrefersReducedMotionServer = () => false;

// DESIGN.md section 7: the one bold move, and the only animation in the
// product. Plays once; prefers-reduced-motion shows the settled end state
// immediately instead.
export function Seal({ clinicName, date }: { clinicName: string; date: string }) {
  const reduceMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getPrefersReducedMotion,
    getPrefersReducedMotionServer
  );

  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex h-40 w-40 flex-col items-center justify-center rounded-full bg-marigold text-center [clip-path:polygon(50%_0%,61%_2%,72%_0%,80%_7%,90%_7%,95%_15%,100%_23%,98%_33%,100%_43%,96%_52%,100%_61%,97%_71%,100%_80%,92%_86%,88%_94%,79%_93%,71%_100%,61%_95%,50%_100%,39%_95%,29%_100%,21%_93%,13%_94%,9%_86%,1%_80%,4%_71%,0%_61%,4%_52%,0%_43%,2%_33%,0%_23%,5%_15%,10%_7%,20%_7%,28%_0%,39%_2%)] ${
          reduceMotion ? "" : "animate-[seal-in_380ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
        }`}
      >
        <p className="font-display text-xl font-semibold text-cocoa">Received</p>
      </div>
      <p className="mt-4 text-sm text-muted">
        {clinicName} &middot; {date}
      </p>
    </div>
  );
}
