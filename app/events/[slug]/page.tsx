import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEvents,
  getEvent,
  idFromSlug,
  formatEventDate,
  type EventItem,
} from "@/lib/odoo-content";
import Icon from "@/components/ui/Icon";
import EventRegisterForm from "@/components/sections/EventRegisterForm";
import EventGallery from "@/components/sections/EventGallery";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  const events = await getEvents(100);
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = idFromSlug(slug);
  const e = id ? await getEvent(id) : null;
  if (!e) return { title: "Event not found" };
  return {
    title: e.title,
    description: e.teaser || `${e.title} - a Robonest event.`,
    openGraph: { type: "article", title: e.title, description: e.teaser },
  };
}

/** Human status, derived from what Odoo actually reports. */
function statusOf(e: EventItem): { label: string; tone: string } {
  if (e.registrationsOpen)
    return { label: "Registration open", tone: "bg-brand text-paper" };
  if (!e.isPast)
    return { label: "Upcoming", tone: "bg-brand-100 text-brand" };
  return { label: "Completed", tone: "bg-ink/10 text-ink-700" };
}

function timeOf(value: string): string {
  return new Date(value.replace(" ", "T") + "Z").toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const id = idFromSlug(slug);
  const e = id ? await getEvent(id) : null;
  if (!e) notFound();

  const status = statusOf(e);

  // Event structured data, so Google can show it as a rich result.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    startDate: e.start?.replace(" ", "T") + "Z",
    endDate: e.end ? e.end.replace(" ", "T") + "Z" : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: e.location
      ? { "@type": "Place", name: e.location }
      : undefined,
    organizer: { "@type": "Organization", name: "Robonest Private Limited" },
    description: e.teaser || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ------------------------------- header ------------------------------- */}
      <section className="relative overflow-hidden bg-night pt-[var(--nav-h)]">
        {e.cover && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={e.cover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-night/75" />
            <div className="absolute inset-0 bg-gradient-to-b from-night/50 via-transparent to-night/85" />
          </>
        )}

        <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-16 lg:pb-20 lg:pt-20">
          <Link
            href="/events"
            className="text-sm font-semibold text-brand-300 transition-colors hover:text-paper"
          >
            ← All events
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${status.tone}`}
            >
              {status.label}
            </span>
            {e.stage && (
              <span className="rounded-full border border-paper/25 px-3 py-1 text-[11px] font-medium text-paper/70">
                {e.stage}
              </span>
            )}
          </div>

          <h1 className="text-on-photo mt-4 text-balance font-display text-3xl leading-tight text-paper sm:text-4xl lg:text-5xl">
            {e.title}
          </h1>

          <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-sm text-paper/85">
            <div className="flex items-center gap-2.5">
              <Icon name="clock" className="h-4 w-4 shrink-0 text-brand-300" />
              <dd>
                {formatEventDate(e.start)}
                {e.end && e.end.slice(0, 10) !== e.start.slice(0, 10)
                  ? ` – ${formatEventDate(e.end)}`
                  : `, ${timeOf(e.start)}`}
              </dd>
            </div>
            {e.location && (
              <div className="flex items-center gap-2.5">
                <Icon name="pin" className="h-4 w-4 shrink-0 text-brand-300" />
                <dd>{e.location}</dd>
              </div>
            )}
            {e.seatsLimited && e.seatsMax > 0 && (
              <div className="flex items-center gap-2.5">
                <Icon name="support" className="h-4 w-4 shrink-0 text-brand-300" />
                <dd>
                  {e.seatsAvailable} of {e.seatsMax} seats left
                </dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      {/* -------------------------- body + registration ------------------------- */}
      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
            <div>
              {e.descriptionHtml ? (
                <div
                  className="prose-robonest"
                  dangerouslySetInnerHTML={{ __html: e.descriptionHtml }}
                />
              ) : (
                <p className="text-sm text-ink-400">
                  Details for this event will be added shortly.
                </p>
              )}
            </div>

            <aside className="lg:pt-1">
              {e.registrationsOpen ? (
                <EventRegisterForm
                  eventId={e.id}
                  eventTitle={e.title}
                  seatsAvailable={e.seatsAvailable}
                  seatsLimited={e.seatsLimited}
                />
              ) : (
                <div className="rounded-[var(--radius-card)] border border-ink/10 bg-sand p-7">
                  <h3 className="font-display text-lg text-ink">
                    {e.isPast ? "This event has finished" : "Registration not open"}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-700">
                    {e.isPast
                      ? "Take a look at the photos below, or get in touch about bringing something similar to your school."
                      : "Registration for this event has not opened yet. Contact us to be notified."}
                  </p>
                  <Link
                    href="/contact"
                    className="mt-5 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-brand-600"
                  >
                    Talk to us
                  </Link>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* ------------------------------- gallery ------------------------------- */}
      {(e.images.length > 0 || e.videoIds.length > 0) && (
        <EventGallery
          images={e.images}
          videoIds={e.videoIds}
          title={e.isPast ? "How it went" : "From previous editions"}
          eventTitle={e.title}
        />
      )}
    </>
  );
}
