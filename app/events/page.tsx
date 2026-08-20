import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import RevealList from "@/components/ui/RevealList";
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
      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-paper">
        Upcoming
      </span>

      <h3 className="mt-5 font-display text-xl leading-snug text-ink">
        {e.title}
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

            {/* Vertical rail; each entry hangs off it with a node marker. */}
            <RevealList className="relative mt-14" stagger={0.1}>
              <span
                aria-hidden
                className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-brand via-brand/40 to-transparent sm:left-[9px]"
              />

              <ol className="space-y-10">
                {past.map((e) => (
                  <li
                    key={e.id}
                    data-reveal="up"
                    className="relative pl-9 sm:pl-12"
                  >
                    <span
                      aria-hidden
                      className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-brand bg-night sm:h-5 sm:w-5"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                    </span>

                    <time className="text-xs font-semibold uppercase tracking-wider text-brand-300">
                      {formatEventDate(e.start)}
                    </time>

                    <h3 className="mt-1.5 font-display text-xl leading-snug text-paper">
                      {e.title}
                    </h3>

                    {e.location && (
                      <p className="mt-1 text-sm text-paper/50">{e.location}</p>
                    )}

                    {e.teaser && (
                      <p className="mt-3 text-sm leading-relaxed text-paper/70">
                        {e.teaser}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </RevealList>
          </div>
        </section>
      )}
    </>
  );
}
