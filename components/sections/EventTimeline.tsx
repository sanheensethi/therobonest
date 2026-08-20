"use client";

import { useState } from "react";
import Link from "next/link";
import { useReveal } from "@/components/motion/useReveal";
import type { EventItem } from "@/lib/odoo-content";

const PAGE = 4;

/** Same IST formatting as the server helper, safe in the browser. */
function fmt(value: string): string {
  return new Date(value.replace(" ", "T") + "Z").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

/**
 * Past events as a vertical timeline, revealed a page at a time.
 *
 * All events are already in the payload (they came in one Odoo query), so
 * "Show more" is a local slice - no extra request, no loading state. That is
 * the right trade at this volume; if the archive grows into the hundreds this
 * becomes a paged Odoo query instead.
 */
export default function EventTimeline({ events }: { events: EventItem[] }) {
  const ref = useReveal<HTMLDivElement>({ stagger: 0.08, start: "top 92%" });
  const [shown, setShown] = useState(PAGE);

  const visible = events.slice(0, shown);
  const remaining = events.length - visible.length;

  return (
    <div>
      <div ref={ref} className="relative">
        <span
          aria-hidden
          className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-brand via-brand/40 to-transparent sm:left-[9px]"
        />

        <ol className="space-y-10">
          {visible.map((e) => (
            <li key={e.id} data-reveal="up" className="relative pl-9 sm:pl-12">
              <span
                aria-hidden
                className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-brand bg-night sm:h-5 sm:w-5"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              </span>

              <div className="flex flex-wrap items-center gap-3">
                <time className="text-xs font-semibold uppercase tracking-wider text-brand-300">
                  {fmt(e.start)}
                </time>
                {e.images.length > 0 && (
                  <span className="rounded-full border border-paper/25 px-2.5 py-0.5 text-[10px] font-medium text-paper/60">
                    {e.images.length} {e.images.length === 1 ? "photo" : "photos"}
                  </span>
                )}
              </div>

              <h3 className="mt-1.5 font-display text-xl leading-snug text-paper">
                <Link
                  href={`/events/${e.slug}`}
                  className="transition-colors hover:text-brand-300"
                >
                  {e.title}
                </Link>
              </h3>

              {e.location && (
                <p className="mt-1 text-sm text-paper/50">{e.location}</p>
              )}

              {e.teaser && (
                <p className="mt-3 text-sm leading-relaxed text-paper/70">
                  {e.teaser}
                </p>
              )}

              <Link
                href={`/events/${e.slug}`}
                className="mt-3 inline-block text-sm font-semibold text-brand-300 transition-colors hover:text-paper"
              >
                {e.images.length > 0 ? "See photos" : "View details"} →
              </Link>
            </li>
          ))}
        </ol>
      </div>

      {remaining > 0 && (
        <div className="mt-12 pl-9 sm:pl-12">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="rounded-full border border-paper/25 px-6 py-3 text-sm font-semibold text-paper transition-colors hover:border-brand hover:bg-brand hover:text-paper"
          >
            Show {Math.min(PAGE, remaining)} more
            <span className="ml-2 text-paper/50">({remaining} left)</span>
          </button>
        </div>
      )}
    </div>
  );
}
