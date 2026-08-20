"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { prefersReducedMotion } from "@/lib/motion";

export type PopupEvent = {
  id: number;
  slug: string;
  title: string;
  dateLabel: string;
  location: string;
  cover: string | null;
  registrationsOpen: boolean;
};

/**
 * Site-wide promo for the event tagged "Popup" in Odoo.
 *
 * Deliberately a corner card, not a full-screen modal: this appears on a
 * lead-generation page whose primary job is the enquiry form, and a modal that
 * blocks the hero costs more conversions than the event gains.
 *
 * Dismissal is remembered PER EVENT id, so tagging a new event in Odoo shows
 * the popup again to someone who closed the previous one - a single global
 * "dismissed" flag would silently kill every future announcement.
 */
export default function EventPopup({ event }: { event: PopupEvent }) {
  const [state, setState] = useState<"hidden" | "shown" | "closing">("hidden");

  useEffect(() => {
    const key = `robonest:popup:${event.id}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      // Private browsing can throw on localStorage; showing the popup is the
      // safer failure than crashing the page.
    }

    // Let the hero land first. Immediate appearance reads as an ad.
    const delay = prefersReducedMotion() ? 0 : 2600;
    const t = window.setTimeout(() => setState("shown"), delay);
    return () => window.clearTimeout(t);
  }, [event.id]);

  function dismiss() {
    setState("closing");
    try {
      localStorage.setItem(`robonest:popup:${event.id}`, String(Date.now()));
    } catch {
      /* nothing we can do, and not worth breaking the page over */
    }
    window.setTimeout(() => setState("hidden"), 320);
  }

  if (state === "hidden") return null;

  return (
    <aside
      aria-label="Upcoming event"
      className={[
        "fixed bottom-4 left-4 z-[60] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-paper/15 bg-night-800 shadow-2xl transition-all duration-300 sm:bottom-6 sm:left-6",
        state === "shown"
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-night/70 text-paper/80 backdrop-blur-sm transition-colors hover:bg-night hover:text-paper"
      >
        <Icon name="close" className="h-4 w-4" strokeWidth={2} />
      </button>

      {event.cover && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={event.cover}
          alt=""
          className="h-28 w-full object-cover"
          loading="lazy"
        />
      )}

      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-300">
          {event.registrationsOpen ? "Registration open" : "Upcoming event"}
        </p>

        <h2 className="mt-1.5 text-balance font-display text-base leading-snug text-paper">
          {event.title}
        </h2>

        <dl className="mt-3 space-y-1.5 text-xs text-paper/70">
          <div className="flex items-center gap-2">
            <Icon name="clock" className="h-3.5 w-3.5 shrink-0 text-brand-300" />
            <dd>{event.dateLabel}</dd>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <Icon name="pin" className="h-3.5 w-3.5 shrink-0 text-brand-300" />
              <dd>{event.location}</dd>
            </div>
          )}
        </dl>

        <div className="mt-4 flex items-center gap-3">
          <Link
            href={`/events/${event.slug}`}
            onClick={dismiss}
            className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-paper transition-colors hover:bg-brand-600"
          >
            {event.registrationsOpen ? "Register" : "View details"}
          </Link>
          <Link
            href="/events"
            onClick={dismiss}
            className="rounded-full border border-paper/25 px-4 py-2 text-xs font-semibold text-paper/85 transition-colors hover:border-paper/50 hover:text-paper"
          >
            All events
          </Link>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss this announcement"
            className="text-xs font-medium text-paper/50 transition-colors hover:text-paper/80"
          >
            Not now
          </button>
        </div>
      </div>
    </aside>
  );
}
