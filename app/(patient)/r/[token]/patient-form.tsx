"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeNigerianPhone } from "@/lib/phone";

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

const TOTAL_QUESTIONS = 4;

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
      className={`min-h-11 w-full rounded-lg border px-4 py-3 text-left text-base ${
        selected
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-300 bg-white text-zinc-900 active:bg-zinc-100"
      }`}
    >
      {label}
    </button>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <p className="mb-4 text-sm text-zinc-500">
      Question {step} of {TOTAL_QUESTIONS}
    </p>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 min-h-11 text-sm text-zinc-500 underline underline-offset-2"
    >
      Back
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

  async function submit() {
    if (patientPhone.trim() && !normalizeNigerianPhone(patientPhone)) {
      setPhoneError("That doesn't look like a Nigerian phone number.");
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
          "That didn't go through. Your answers are still here - please try again."
        );
        setSubmitting(false);
        return;
      }

      const { notify } = (await res.json()) as { notify: boolean };
      router.push(`/r/${token}/done${notify ? "?notice=1" : ""}`);
    } catch {
      setSubmitError(
        "That didn't go through. Check your connection and try again - your answers are still here."
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-sm px-5 py-8">
      {step === 0 && (
        <div className="flex min-h-[80vh] flex-col justify-center gap-6">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">{clinicName}</h1>
            <p className="mt-3 text-base leading-6 text-zinc-700">
              This clinic wants to know how your visit went. It takes about
              thirty seconds. Do not tell us anything about your health
              condition. Your answers are shared with the clinic.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="min-h-11 w-full rounded-lg bg-zinc-900 px-4 py-3 text-base font-medium text-white"
          >
            Start
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          <Progress step={1} />
          <h2 className="mb-4 text-lg font-medium text-zinc-900">
            How long did you wait before someone attended to you?
          </h2>
          <div className="flex flex-col gap-2">
            {WAIT_OPTIONS.map((o) => (
              <OptionButton
                key={o.value}
                label={o.label}
                selected={waitBand === o.value}
                onClick={() => {
                  setWaitBand(o.value);
                  setStep(2);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <Progress step={2} />
          <BackLink onClick={() => setStep(1)} />
          <h2 className="mb-4 text-lg font-medium text-zinc-900">
            Were you treated with respect and courtesy?
          </h2>
          <div className="flex flex-col gap-2">
            {RESPECT_OPTIONS.map((o) => (
              <OptionButton
                key={o.value}
                label={o.label}
                selected={respectScore === o.value}
                onClick={() => {
                  setRespectScore(o.value);
                  setStep(3);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <Progress step={3} />
          <BackLink onClick={() => setStep(2)} />
          <h2 className="mb-4 text-lg font-medium text-zinc-900">
            Would you come back to this clinic?
          </h2>
          <div className="flex flex-col gap-2">
            {RETURN_OPTIONS.map((o) => (
              <OptionButton
                key={o.value}
                label={o.label}
                selected={returnIntent === o.value}
                onClick={() => {
                  setReturnIntent(o.value);
                  setStep(4);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <Progress step={4} />
          <BackLink onClick={() => setStep(3)} />
          <h2 className="mb-2 text-lg font-medium text-zinc-900">
            Anything you would like them to know?
          </h2>
          <p className="mb-3 text-sm text-zinc-500">
            Please do not include details about your health condition.
          </p>
          <textarea
            value={comment}
            maxLength={300}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-zinc-300 p-3 text-base"
            placeholder="Optional"
          />
          <p className="mt-1 text-right text-xs text-zinc-400">
            {comment.length}/300
          </p>
          <button
            type="button"
            onClick={() => setStep(5)}
            className="mt-4 min-h-11 w-full rounded-lg bg-zinc-900 px-4 py-3 text-base font-medium text-white"
          >
            {comment.trim() ? "Next" : "Skip"}
          </button>
        </div>
      )}

      {step === 5 && (
        <div>
          <BackLink onClick={() => setStep(4)} />
          <h2 className="mb-4 text-lg font-medium text-zinc-900">
            A few optional questions
          </h2>

          {providers.length > 0 && (
            <div className="mb-5">
              <label className="mb-1 block text-sm text-zinc-600">
                Who attended to you?
              </label>
              <select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white p-3 text-base"
              >
                <option value="unspecified">I would rather not say</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                    {p.role ? ` (${p.role})` : ""}
                  </option>
                ))}
              </select>
              {branchName && (
                <p className="mt-1 text-xs text-zinc-400">{branchName}</p>
              )}
            </div>
          )}

          <div className="mb-5">
            <label className="mb-1 block text-sm text-zinc-600">
              Your name (optional)
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-zinc-300 p-3 text-base"
              placeholder="If you're happy for the clinic to call you back"
            />
          </div>

          <div className="mb-5">
            <label className="mb-1 block text-sm text-zinc-600">
              Your phone number (optional)
            </label>
            <input
              type="tel"
              value={patientPhone}
              onChange={(e) => {
                setPatientPhone(e.target.value);
                setPhoneError(null);
              }}
              className="min-h-11 w-full rounded-lg border border-zinc-300 p-3 text-base"
              placeholder="0803 123 4567"
            />
            {phoneError && (
              <p className="mt-1 text-sm text-red-600">{phoneError}</p>
            )}
          </div>

          <label className="mb-6 flex items-start gap-3">
            <input
              type="checkbox"
              checked={consentToPublish}
              onChange={(e) => setConsentToPublish(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0"
            />
            <span className="text-sm text-zinc-700">
              You may publish my comment publicly, without my full name.
            </span>
          </label>

          {submitError && (
            <p className="mb-3 text-sm text-red-600">{submitError}</p>
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={submit}
            className="min-h-11 w-full rounded-lg bg-zinc-900 px-4 py-3 text-base font-medium text-white disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      )}
    </main>
  );
}
