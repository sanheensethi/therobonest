"use client";

import { useState } from "react";
import { ctaForm, heroForm } from "@/content/site";
import { submitEnquiry, INDIAN_STATES } from "@/lib/enquiry";
import Icon from "@/components/ui/Icon";

type Status = "idle" | "submitting" | "success" | "error";

const TEXT_FIELDS = [
  { name: "school", label: "School Name", icon: "school", type: "text", autoComplete: "organization" },
] as const;

const TAIL_FIELDS = [
  { name: "name", label: "Your Name", icon: "user", type: "text", autoComplete: "name" },
  { name: "phone", label: "Mobile Number", icon: "phone", type: "tel", autoComplete: "tel" },
  { name: "email", label: "Email ID", icon: "mail", type: "email", autoComplete: "email" },
] as const;

/** Shared field chrome: icon sits inside the input, left-aligned. */
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

export default function HeroForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(
      new FormData(form).entries()
    ) as Record<string, string>;

    setStatus("submitting");
    setError(null);

    const result = await submitEnquiry(data);
    if (result.ok) {
      setStatus("success");
      form.reset();
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
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo/95 via-[#4f3fc4]/95 to-violet/90 p-6 shadow-2xl shadow-night-900/50 ring-1 ring-white/20 backdrop-blur-sm sm:p-7"
    >
      {/* soft interior highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl"
      />

      <div className="relative">
        <h2
          id="hero-form-title"
          className="text-balance font-display text-xl leading-snug text-white sm:text-2xl"
        >
          {heroForm.title}
        </h2>
        <p className="mt-2 text-sm text-white/80">{heroForm.subtitle}</p>

        {/* Honeypot */}
        <input
          type="text"
          name="_trap"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />

        <div className="mt-5 space-y-3">
          {TEXT_FIELDS.map((f) => (
            <Field key={f.name} icon={f.icon}>
              <input
                name={f.name}
                type={f.type}
                required
                autoComplete={f.autoComplete}
                placeholder={f.label}
                aria-label={f.label}
                className={inputCls}
              />
            </Field>
          ))}

          <Field icon="pin">
            <select
              name="state"
              required
              defaultValue=""
              aria-label="State"
              className={`${inputCls} appearance-none pr-9`}
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

          <Field icon="briefcase">
            <select
              name="designation"
              required
              defaultValue=""
              aria-label="Your Designation"
              className={`${inputCls} appearance-none pr-9`}
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

          {TAIL_FIELDS.map((f) => (
            <Field key={f.name} icon={f.icon}>
              <input
                name={f.name}
                type={f.type}
                required
                autoComplete={f.autoComplete}
                placeholder={f.label}
                aria-label={f.label}
                className={inputCls}
              />
            </Field>
          ))}
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-azure via-indigo to-violet px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-night-900/30 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "Sending…" : heroForm.submit}
          {status !== "submitting" && (
            <Icon
              name="arrow"
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            />
          )}
        </button>

        <p
          aria-live="polite"
          className="mt-3 min-h-[1.25rem] text-center text-xs"
        >
          {status === "success" ? (
            <span className="text-white">
              Thanks — we&apos;ve received your enquiry.
            </span>
          ) : status === "error" && error ? (
            <span className="text-amber-200">{error}</span>
          ) : (
            <span className="text-white/70">{heroForm.note}</span>
          )}
        </p>
      </div>
    </form>
  );
}
