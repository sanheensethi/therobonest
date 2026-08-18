"use client";

import { useState } from "react";
import { ctaForm, contact } from "@/content/site";
import SectionHeading from "@/components/ui/SectionHeading";
import { useReveal } from "@/components/motion/useReveal";

type Status = "idle" | "submitting" | "success" | "error";

const FIELDS = [
  { name: "name", label: "Your Name", type: "text", required: true, autoComplete: "name" },
  { name: "email", label: "Email Id", type: "email", required: true, autoComplete: "email" },
  { name: "phone", label: "Phone Number", type: "tel", required: true, autoComplete: "tel" },
  { name: "school", label: "School Name", type: "text", required: true, autoComplete: "organization" },
  { name: "state", label: "State", type: "text", required: true, autoComplete: "address-level1" },
  { name: "subject", label: "Subject", type: "text", required: false, autoComplete: "off" },
] as const;

/**
 * School enquiry form.
 *
 * Posts JSON to NEXT_PUBLIC_FORM_ENDPOINT (Formspree, Web3Forms, a Netlify
 * function, your own mailer - anything that accepts a POST). If that variable
 * is not set, it degrades to a prefilled mailto: so enquiries still reach
 * the inbox instead of silently vanishing.
 */
export default function EnquiryForm() {
  const ref = useReveal<HTMLElement>();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const endpoint = process.env.NEXT_PUBLIC_FORM_ENDPOINT;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<
      string,
      string
    >;

    // Honeypot: bots fill hidden fields, humans never see them.
    if (data._trap) return;

    if (!/^\S+@\S+\.\S+$/.test(data.email ?? "")) {
      setStatus("error");
      setError("Please enter a valid email address.");
      return;
    }
    if ((data.phone ?? "").replace(/\D/g, "").length < 10) {
      setStatus("error");
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setStatus("submitting");
    setError(null);

    if (!endpoint) {
      // No backend configured - hand off to the user's mail client.
      const body = Object.entries(data)
        .filter(([k]) => k !== "_trap")
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
      window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(
        `Lab enquiry — ${data.school || data.name}`
      )}&body=${encodeURIComponent(body)}`;
      setStatus("success");
      form.reset();
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? `${err.message}. Please call ${contact.phones[0]} instead.`
          : "Something went wrong."
      );
    }
  }

  return (
    <section ref={ref} id="enquiry" className="relative overflow-hidden bg-night">
      <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-brand/18 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow={ctaForm.eyebrow}
              title={ctaForm.title}
              body={ctaForm.body}
              tone="light"
            />

            <div data-reveal className="mt-10 space-y-4 text-sm text-paper/70">
              <p>
                <span className="block text-xs uppercase tracking-wider text-brand-300">
                  {contact.addressLabel}
                </span>
                {contact.address}
              </p>
              <p>
                <span className="block text-xs uppercase tracking-wider text-brand-300">
                  Call
                </span>
                {contact.phones.map((p, i) => (
                  <span key={p}>
                    <a href={`tel:${p}`} className="hover:text-brand-300">
                      {p}
                    </a>
                    {i < contact.phones.length - 1 && ", "}
                  </span>
                ))}
              </p>
              <p>
                <span className="block text-xs uppercase tracking-wider text-brand-300">
                  Email
                </span>
                <a
                  href={`mailto:${contact.email}`}
                  className="hover:text-brand-300"
                >
                  {contact.email}
                </a>
              </p>
            </div>
          </div>

          <form
            data-reveal="up"
            onSubmit={onSubmit}
            noValidate
            className="rounded-[var(--radius-card)] border border-paper/12 bg-paper/[0.04] p-7 backdrop-blur-sm sm:p-9"
          >
            {/* Honeypot */}
            <input
              type="text"
              name="_trap"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="pointer-events-none absolute h-0 w-0 opacity-0"
            />

            <div className="grid gap-5 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <label key={f.name} className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-paper/60">
                    {f.label}
                    {f.required && <span className="text-brand"> *</span>}
                  </span>
                  <input
                    name={f.name}
                    type={f.type}
                    required={f.required}
                    autoComplete={f.autoComplete}
                    className="w-full rounded-xl border border-paper/15 bg-night/60 px-4 py-3 text-sm text-paper placeholder:text-paper/30 outline-none transition-colors focus:border-brand"
                  />
                </label>
              ))}

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-paper/60">
                  Designation<span className="text-brand"> *</span>
                </span>
                <select
                  name="designation"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-paper/15 bg-night/60 px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-brand"
                >
                  <option value="" disabled>
                    Select your role
                  </option>
                  {ctaForm.designations.map((d) => (
                    <option key={d} value={d} className="text-ink">
                      {d}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-paper/60">
                  Your Requirement
                </span>
                <textarea
                  name="requirement"
                  rows={4}
                  placeholder="Which lab are you interested in? Any budget or timeline in mind?"
                  className="w-full resize-y rounded-xl border border-paper/15 bg-night/60 px-4 py-3 text-sm text-paper placeholder:text-paper/30 outline-none transition-colors focus:border-brand"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={status === "submitting"}
              className="mt-7 w-full rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-paper transition-all hover:bg-brand-600 hover:shadow-lg hover:shadow-brand/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "submitting" ? "Sending…" : "Submit enquiry"}
            </button>

            <p aria-live="polite" className="mt-4 min-h-5 text-sm">
              {status === "success" && (
                <span className="text-sky">
                  Thanks — we&apos;ve received your enquiry and will respond
                  within 1–2 business days.
                </span>
              )}
              {status === "error" && error && (
                <span className="text-brand-300">{error}</span>
              )}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
