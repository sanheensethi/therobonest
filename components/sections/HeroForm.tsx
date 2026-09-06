"use client";

import { useState } from "react";
import { ctaForm, heroForm } from "@/content/site";
import { submitEnquiry, INDIAN_STATES } from "@/lib/enquiry";
import Icon from "@/components/ui/Icon";
import { tellNesty } from "@/components/ui/ChatBot";
import Magnetic from "@/components/motion/Magnetic";

type Status = "idle" | "submitting" | "success" | "error";
type Step = 1 | 2;

/**
 * Two-step lead form.
 *
 * The first version put six empty fields above the fold. For a stranger that
 * is a wall of labour before the site has given them anything. Step 1 asks
 * only what sales genuinely needs to call back - school and mobile - and the
 * rest is collected after that commitment is made. Email is optional: a
 * principal on a phone will type a number, not an address.
 *
 * The mascot perched on the card looks at whichever field has focus and
 * celebrates on submit, so the form has a reaction instead of a dead "Thanks".
 */
function Field({
  icon,
  children,
}: {
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-azure">
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/25 bg-white/95 py-3 pl-11 pr-3 text-sm text-ink shadow-sm outline-none transition-all placeholder:text-ink-400 focus:border-white focus:ring-2 focus:ring-white/60";

const EMPTY = {
  school: "",
  phone: "",
  name: "",
  designation: "",
  state: "",
  email: "",
  _trap: "",
};

export default function HeroForm() {
  const [step, setStep] = useState<Step>(1);
  const [values, setValues] = useState(EMPTY);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const set =
    (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [k]: e.target.value }));

  // Eyes follow the active field; release on blur so they go back to the cursor.
  const focusProps = {
    onFocus: (e: React.FocusEvent<Element>) => tellNesty({ action: "lookAt", target: e.currentTarget }),
    onBlur: () => tellNesty({ action: "lookAt", target: null }),
  };

  function next(e: React.MouseEvent) {
    e.preventDefault();
    setError(null);
    if (!values.school.trim()) return setError("Please enter your school name.");
    if (values.phone.replace(/\D/g, "").length < 10)
      return setError("Please enter a valid 10-digit mobile number.");
    setStep(2);
    tellNesty({ action: "wave" });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step === 1) return;
    setStatus("submitting");
    setError(null);

    const result = await submitEnquiry(values);
    if (result.ok) {
      setStatus("success");
      setValues(EMPTY);
      tellNesty({ action: "celebrate" });
    } else {
      setStatus("error");
      setError(result.error);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-labelledby="hero-form-title"
      className="relative rounded-3xl bg-gradient-to-br from-indigo/95 via-[#4f3fc4]/95 to-violet/90 p-6 shadow-2xl shadow-night-900/50 ring-1 ring-white/20 backdrop-blur-sm sm:p-7"
    >
      {/* Dock slot for the travelling mascot (ChatBot.tsx). It sits here while
          the card is on screen and detaches to the corner once it scrolls
          away. Positioned so the antenna clears the fixed header. */}
      <div
        data-mascot-dock
        aria-hidden
        className="pointer-events-none absolute -top-[78px] right-4 h-[108px] w-[92px]"
      />

      {/* soft interior highlight, clipped to the card so the mascot above can
          still overflow it */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between gap-3 pr-20">
          <div>
            <h2
              id="hero-form-title"
              className="text-balance font-display text-xl leading-snug text-white sm:text-2xl"
            >
              {heroForm.title}
            </h2>
            <p className="mt-2 text-sm text-white/80">{heroForm.subtitle}</p>
          </div>
        </div>

        {/* Step indicator */}
        <ol className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-white/70" aria-label="Progress">
          {[1, 2].map((n) => (
            <li key={n} className="flex items-center gap-2">
              <span
                className={[
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] transition-colors",
                  step >= n ? "bg-white text-indigo" : "bg-white/20 text-white",
                ].join(" ")}
              >
                {n}
              </span>
              {n === 1 ? "Your school" : "About you"}
              {n === 1 && <span className="h-px w-6 bg-white/30" />}
            </li>
          ))}
        </ol>

        {/* Honeypot */}
        <input
          type="text"
          name="_trap"
          value={values._trap}
          onChange={set("_trap")}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />

        {step === 1 ? (
          <div key="s1" className="mt-5 space-y-3" data-step>
            <Field icon="school">
              <input
                name="school"
                type="text"
                required
                autoComplete="organization"
                placeholder="School Name"
                aria-label="School Name"
                value={values.school}
                onChange={set("school")}
                className={inputCls}
                {...focusProps}
              />
            </Field>
            <Field icon="phone">
              <input
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                inputMode="numeric"
                placeholder="Mobile Number"
                aria-label="Mobile Number"
                value={values.phone}
                onChange={set("phone")}
                className={inputCls}
                {...focusProps}
              />
            </Field>

            <Magnetic strength={0.18} className="block">
              <button
                type="button"
                onClick={next}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-indigo shadow-lg shadow-night-900/30 transition-all hover:brightness-95"
              >
                Continue
                <Icon
                  name="arrow"
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </button>
            </Magnetic>
          </div>
        ) : (
          <div key="s2" className="mt-5 space-y-3" data-step>
            <Field icon="user">
              <input
                name="name"
                type="text"
                required
                autoFocus
                autoComplete="name"
                placeholder="Your Name"
                aria-label="Your Name"
                value={values.name}
                onChange={set("name")}
                className={inputCls}
                {...focusProps}
              />
            </Field>

            <Field icon="briefcase">
              <select
                name="designation"
                required
                aria-label="Your Designation"
                value={values.designation}
                onChange={set("designation")}
                className={`${inputCls} appearance-none pr-9`}
                {...focusProps}
              >
                <option value="" disabled>
                  Your Designation
                </option>
                {ctaForm.designations.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>

            <Field icon="pin">
              <select
                name="state"
                required
                aria-label="State"
                value={values.state}
                onChange={set("state")}
                className={`${inputCls} appearance-none pr-9`}
                {...focusProps}
              >
                <option value="" disabled>
                  State
                </option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </Field>

            <Field icon="mail">
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email ID (optional)"
                aria-label="Email ID (optional)"
                value={values.email}
                onChange={set("email")}
                className={inputCls}
                {...focusProps}
              />
            </Field>

            <Magnetic strength={0.18} className="block">
              <button
                type="submit"
                disabled={status === "submitting"}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-azure via-indigo to-violet px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-night-900/30 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "submitting" ? "Sending…" : heroForm.submit}
                {status !== "submitting" && (
                  <Icon
                    name="arrow"
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  />
                )}
              </button>
            </Magnetic>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="block w-full text-center text-xs text-white/70 underline-offset-2 hover:text-white hover:underline"
            >
              ← Back
            </button>
          </div>
        )}

        <p
          aria-live="polite"
          className="mt-3 min-h-[1.25rem] text-center text-xs"
        >
          {status === "success" ? (
            <span className="font-semibold text-white">
              Thanks — we&apos;ve received your enquiry. We&apos;ll call you shortly.
            </span>
          ) : error ? (
            <span className="text-amber-200">{error}</span>
          ) : (
            <span className="text-white/70">
              {step === 1 ? "Takes 30 seconds. No spam, ever." : heroForm.note}
            </span>
          )}
        </p>
      </div>
    </form>
  );
}
