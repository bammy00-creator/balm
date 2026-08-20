"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { normalizeNigerianPhone } from "@/lib/phone";

function subscribeToOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}
const getOnlineSnapshot = () => navigator.onLine;
const getOnlineServerSnapshot = () => true; // assume online during SSR/first paint

type Provider = { id: string; full_name: string; role: string | null };

type WaitBand = "under_15" | "15_to_30" | "30_to_60" | "over_60";
type ReturnIntent = "yes" | "maybe" | "no";

const WAIT_OPTIONS: { value: WaitBand; label: string }[] = [
  { value: "under_15", label: "Less than 15 minutes" },
  { value: "15_to_30", label: "15 to 30 minutes" },
  { value: "30_to_60", label: "30 minutes to an hour" },
  { value: "over_60", label: "More than an hour" },
];

const RESPECT_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Not at all" },
  { value: 2, label: "Not really" },
  { value: 3, label: "It was fine" },
  { value: 4, label: "Yes" },
  { value: 5, label: "Very much so" },
];

const RETURN_OPTIONS: { value: ReturnIntent; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
];

const TAP_ADVANCE_DELAY = 180;

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-16 w-full rounded-block px-4 py-3 text-left font-body text-lg font-medium transition-colors ${
        selected ? "bg-marigold text-cocoa" : "bg-sand text-cocoa active:bg-rule"
      }`}
    >
      {label}
    </button>
  );
}

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="mb-6 flex gap-2" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-chip ${step > i ? "bg-marigold" : "bg-sand"}`}
        />
      ))}
    </div>
  );
}

function GoBack({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 min-h-11 text-sm text-muted underline underline-offset-2"
    >
      Go back
    </button>
  );
}

export function PatientForm({
  token,
  clinicName,
  branchName,
  providers,
}: {
  token: string;
  clinicName: string;
  branchName: string;
  providers: Provider[];
}) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [waitBand, setWaitBand] = useState<WaitBand | null>(null);
  const [respectScore, setRespectScore] = useState<number | null>(null);
  const [returnIntent, setReturnIntent] = useState<ReturnIntent | null>(null);
  const [comment, setComment] = useState("");
  const [providerId, setProviderId] = useState<string>("unspecified");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [consentToPublish, setConsentToPublish] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isOnline = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineSnapshot,
    getOnlineServerSnapshot
  );
  const autoRetryPending = useRef(false);

  useEffect(() => {
    if (isOnline && autoRetryPending.current) {
      autoRetryPending.current = false;
      submit();
    }
    // Only the online transition should trigger this - submit() always reads
    // current state via its own closure at call time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  function selectAndAdvance<T>(setter: (v: T) => void, value: T, nextStep: number) {
    setter(value);
    window.setTimeout(() => setStep(nextStep), TAP_ADVANCE_DELAY);
  }

  async function submit() {
    if (patientPhone.trim() && !normalizeNigerianPhone(patientPhone)) {
      setPhoneError("That doesn't look like a Nigerian phone number.");
      return;
    }

    if (!navigator.onLine) {
      autoRetryPending.current = true;
      setSubmitError(
        "You're offline. Your answers are still here - we'll send them as soon as your connection is back."
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      token,
      wait_band: waitBand,
      respect_score: respectScore,
      return_intent: returnIntent,
      comment: comment.trim() || null,
      provider_id: providerId === "unspecified" ? null : providerId,
      patient_name: patientName.trim() || null,
      patient_phone: patientPhone.trim() ? normalizeNigerianPhone(patientPhone) : null,
      consent_to_publish: consentToPublish,
    };

    const attempt = () =>
      fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

    try {
      let res = await attempt();
      if (!res.ok) res = await attempt(); // retry once, per SPEC 6

      if (!res.ok) {
        setSubmitError(
          "Your answer did not send. Check your connection and tap Send again. Your answers are still here."
        );
        setSubmitting(false);
        return;
      }

      const { notify } = (await res.json()) as { notify: boolean };
      router.push(`/r/${token}/done${notify ? "?notice=1" : ""}`);
    } catch {
      autoRetryPending.current = true;
      setSubmitError(
        "Your answer did not send. Check your connection - your answers are still here, and we'll retry once you're back online."
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-[520px] px-6 pt-8 pb-8">
      {!isOnline && (
        <div className="mb-4 rounded-block bg-sand px-3 py-2 text-sm text-cocoa">
          You&apos;re offline. Your answers are safe and will send once
          you&apos;re back online.
        </div>
      )}
      {step === 0 && (
        <div className="flex min-h-[80vh] flex-col justify-center gap-6">
          <div>
            <p className="text-sm text-muted">{clinicName}</p>
            <h1 className="mt-2 font-display text-[30px] font-semibold leading-tight text-cocoa">
              How was your visit today?
            </h1>
            <p className="mt-3 text-base leading-6 text-cocoa">
              This takes about thirty seconds. Please do not tell us anything
              about your health condition. Your answers go to the clinic.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="min-h-16 w-full rounded-control bg-marigold px-4 py-3 font-body text-[17px] font-semibold text-cocoa"
          >
            Start
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          <p className="text-sm text-muted">{clinicName}</p>
          <ProgressDots step={1} />
          <h2 className="mb-4 font-display text-[30px] font-semibold leading-tight text-cocoa">
            How long did you wait before someone attended to you?
          </h2>
          <div className="flex flex-col gap-3">
            {WAIT_OPTIONS.map((o) => (
              <OptionButton
                key={o.value}
                label={o.label}
                selected={waitBand === o.value}
                onClick={() => selectAndAdvance(setWaitBand, o.value, 2)}
              />
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="text-sm text-muted">{clinicName}</p>
          <ProgressDots step={2} />
          <h2 className="mb-4 font-display text-[30px] font-semibold leading-tight text-cocoa">
            Were you treated with respect and courtesy?
          </h2>
          <div className="flex flex-col gap-3">
            {RESPECT_OPTIONS.map((o) => (
              <OptionButton
                key={o.value}
                label={o.label}
                selected={respectScore === o.value}
                onClick={() => selectAndAdvance(setRespectScore, o.value, 3)}
              />
            ))}
          </div>
          <GoBack onClick={() => setStep(1)} />
        </div>
      )}

      {step === 3 && (
        <div>
          <p className="text-sm text-muted">{clinicName}</p>
          <ProgressDots step={3} />
          <h2 className="mb-4 font-display text-[30px] font-semibold leading-tight text-cocoa">
            Would you come back to this clinic?
          </h2>
          <div className="flex flex-col gap-3">
            {RETURN_OPTIONS.map((o) => (
              <OptionButton
                key={o.value}
                label={o.label}
                selected={returnIntent === o.value}
                onClick={() => selectAndAdvance(setReturnIntent, o.value, 4)}
              />
            ))}
          </div>
          <GoBack onClick={() => setStep(2)} />
        </div>
      )}

      {step === 4 && (
        <div>
          <p className="text-sm text-muted">{clinicName}</p>
          <ProgressDots step={4} />
          <h2 className="mb-2 font-display text-[30px] font-semibold leading-tight text-cocoa">
            Anything you would like them to know?
          </h2>
          <p className="mb-3 text-sm text-muted">
            Please do not include details about your health condition.
          </p>
          <textarea
            value={comment}
            maxLength={300}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            className="w-full rounded-control border border-rule bg-paper p-3 font-body text-base text-cocoa"
            placeholder="Optional"
          />
          {comment.length > 240 && (
            <p className="mt-1 text-right text-xs text-muted">{comment.length}/300</p>
          )}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setComment("");
                setStep(5);
              }}
              className="min-h-16 flex-1 rounded-control border border-rule px-4 py-3 font-body text-[17px] font-semibold text-cocoa"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => setStep(5)}
              className="min-h-16 flex-1 rounded-control bg-marigold px-4 py-3 font-body text-[17px] font-semibold text-cocoa"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          <p className="text-sm text-muted">{clinicName}</p>
          <h2 className="mb-4 font-display text-[22px] font-semibold text-cocoa">
            A few optional questions
          </h2>

          {providers.length > 0 && (
            <div className="mb-5">
              <label className="mb-1 block text-sm text-muted">Who attended to you?</label>
              <select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="min-h-16 w-full rounded-control border border-rule bg-paper p-3 font-body text-base text-cocoa"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                    {p.role ? ` (${p.role})` : ""}
                  </option>
                ))}
                <option value="unspecified">I would rather not say</option>
              </select>
              {branchName && <p className="mt-1 text-xs text-muted">{branchName}</p>}
            </div>
          )}

          <p className="mb-2 text-sm text-muted">
            Only if you are happy for the clinic to call you.
          </p>
          <div className="mb-4">
            <label className="mb-1 block text-sm text-muted">Your name (optional)</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="min-h-16 w-full rounded-control border border-rule bg-paper p-3 font-body text-base text-cocoa"
            />
          </div>

          <div className="mb-5">
            <label className="mb-1 block text-sm text-muted">
              Your phone number (optional)
            </label>
            <input
              type="tel"
              value={patientPhone}
              onChange={(e) => {
                setPatientPhone(e.target.value);
                setPhoneError(null);
              }}
              className="min-h-16 w-full rounded-control border border-rule bg-paper p-3 font-body text-base text-cocoa"
              placeholder="0803 123 4567"
            />
            {phoneError && <p className="mt-1 text-sm text-berry">{phoneError}</p>}
          </div>

          <label className="mb-6 flex items-start gap-3">
            <input
              type="checkbox"
              checked={consentToPublish}
              onChange={(e) => setConsentToPublish(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-marigold"
            />
            <span className="text-sm text-cocoa">
              The clinic may publish my comment publicly, without my full name.
            </span>
          </label>

          {submitError && <p className="mb-3 text-sm text-berry">{submitError}</p>}

          <button
            type="button"
            disabled={submitting}
            onClick={submit}
            className="min-h-16 w-full rounded-control bg-marigold px-4 py-3 font-body text-[17px] font-semibold text-cocoa disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send"}
          </button>
        </div>
      )}
    </main>
  );
}
