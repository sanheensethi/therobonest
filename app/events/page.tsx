import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import RevealList from "@/components/ui/RevealList";
import EventTimeline from "@/components/sections/EventTimeline";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import {
  getEvents,
  splitEvents,
  formatEventDate,
  type EventItem,
} from "@/lib/odoo-content";

/** Pick up newly published Odoo content within 5 minutes. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Events",
  description:
    "Robotics exhibitions, workshops and school events run by Robonest.",
};

function UpcomingCard({ e }: { e: EventItem }) {
  return (
    <article
      data-reveal="up"
      className="group flex flex-col rounded-[var(--radius-card)] border border-ink/8 bg-paper p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-xl hover:shadow-ink/5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={[
            "inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider",
            e.registrationsOpen ? "bg-brand text-paper" : "bg-brand-100 text-brand",
          ].join(" ")}
        >
          {e.registrationsOpen ? "Registration open" : "Upcoming"}
        </span>
        {e.seatsLimited && e.seatsAvailable > 0 && (
          <span className="rounded-full border border-ink/12 px-2.5 py-1 text-[11px] text-ink-400">
            {e.seatsAvailable} seats left
          </span>
        )}
      </div>

      <h3 className="mt-5 font-display text-xl leading-snug text-ink">
        <Link href={`/events/${e.slug}`} className="transition-colors hover:text-brand">
          {e.title}
        </Link>
      </h3>

      <dl className="mt-4 space-y-2 text-sm text-ink-700">
        <div className="flex items-center gap-2.5">
          <Icon name="clock" className="h-4 w-4 shrink-0 text-brand" />
          <dd>
            {formatEventDate(e.start)}
            {e.end && e.end.slice(0, 10) !== e.start.slice(0, 10) && (
              <> – {formatEventDate(e.end)}</>
            )}
          </dd>
        </div>
        {e.location && (
          <div className="flex items-center gap-2.5">
            <Icon name="pin" className="h-4 w-4 shrink-0 text-brand" />
            <dd>{e.location}</dd>
          </div>
        )}
      </dl>

      {e.teaser && (
        <p className="mt-4 text-sm leading-relaxed text-ink-400">{e.teaser}</p>
      )}

      <Link
        href={`/events/${e.slug}`}
        className="mt-5 text-sm font-semibold text-brand transition-colors hover:text-brand-600"
      >
        {e.registrationsOpen ? "Register now" : "View details"} →
      </Link>
    </article>
  );
}

export default async function EventsPage() {
  const events = await getEvents();
  const { upcoming, past } = splitEvents(events);

  return (
    <>
      <PageHero
        eyebrow="What's on"
        title="Events & Exhibitions"
        body="Robotics exhibitions, teacher workshops and school showcases — what's coming up, and everything we've run so far."
        image="/images/gallery/g1.jpeg"
      />

      {/* -------------------------------- Upcoming -------------------------------- */}
      <section className="bg-sand">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <h2 className="font-display text-3xl text-ink">Upcoming events</h2>

          {upcoming.length === 0 ? (
            <p className="mt-6 max-w-lg rounded-[var(--radius-card)] border border-ink/10 bg-paper p-7 text-sm leading-relaxed text-ink-700">
              Nothing scheduled right now. New events published in Odoo appear
              here automatically.
            </p>
          ) : (
            <RevealList className="mt-10 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e) => (
                <UpcomingCard key={e.id} e={e} />
              ))}
            </RevealList>
          )}
        </div>
      </section>

      {/* --------------------------------- Timeline -------------------------------- */}
      {past.length > 0 && (
        <section className="bg-night">
          <div className="mx-auto max-w-4xl px-6 py-20 lg:py-28">
            <h2 className="font-display text-3xl text-paper">Our journey so far</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-paper/60">
              Every exhibition, workshop and school programme we&apos;ve run.
            </p>

            <EventTimeline events={past} />
          </div>
        </section>
      )}
    </>
  );
}
