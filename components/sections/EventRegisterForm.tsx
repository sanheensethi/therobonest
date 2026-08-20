"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { contact } from "@/content/site";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Event sign-up. Creates an event.registration in Odoo, so attendees show up
 * in the event's Attendees count and Registration Desk - the same place staff
 * already manage walk-ins.
 *
 * Rendered only when Odoo says registrations are open; the function re-checks
 * that server-side, because a stale page could otherwise post to a closed event.
 */
export default function EventRegisterForm({
  eventId,
  eventTitle,
  seatsAvailable,
  seatsLimited,
}: {
  eventId: number;
  eventTitle: string;
  seatsAvailable: number;
  seatsLimited: boolean;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<
      string,
      string
    >;

    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/.netlify/functions/event-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, eventId }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !payload.ok) {
        throw new Error(payload.error || `Request failed (${res.status})`);
      }
      setStatus("success");
      form.reset();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      // Local dev has no Netlify functions, so make that failure legible
      // instead of showing a generic error.
      setStatus("error");
      setError(
        /fetch|Failed/i.test(msg)
          ? `Could not reach the registration service. Please call ${contact.phones[0]}.`
          : msg
      );
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-[var(--radius-card)] border border-brand/30 bg-brand-100 p-7 text-center">
        <h3 className="font-display text-xl text-ink">You&apos;re registered</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">
          We&apos;ve saved your place for <strong>{eventTitle}</strong> and our
          team will be in touch with the details.
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-ink/12 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink-400 outline-none transition-colors focus:border-brand";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-[var(--radius-card)] border border-ink/10 bg-sand p-7"
    >
      <h3 className="font-display text-xl text-ink">Register for this event</h3>
      {seatsLimited && seatsAvailable > 0 && (
        <p className="mt-1.5 text-sm font-medium text-brand">
          {seatsAvailable} {seatsAvailable === 1 ? "seat" : "seats"} remaining
        </p>
      )}

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
        <input
          name="name"
          required
          autoComplete="name"
          placeholder="Your name"
          aria-label="Your name"
          className={inputCls}
        />
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email address"
          aria-label="Email address"
          className={inputCls}
        />
        <input
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="Mobile number"
          aria-label="Mobile number"
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="group mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-paper transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "Registering…" : "Confirm my place"}
        {status !== "submitting" && (
          <Icon
            name="arrow"
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
          />
        )}
      </button>

      <p aria-live="polite" className="mt-3 min-h-5 text-center text-xs">
        {status === "error" && error ? (
          <span className="text-ember">{error}</span>
        ) : (
          <span className="text-ink-400">
            No payment required. We&apos;ll confirm by email.
          </span>
        )}
      </p>
    </form>
  );
}
