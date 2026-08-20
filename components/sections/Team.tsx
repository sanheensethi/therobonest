"use client";

import Image from "next/image";
import { founders, execTeam } from "@/content/site";
import type { TeamMember } from "@/lib/odoo-content";
import SectionHeading from "@/components/ui/SectionHeading";
import { useReveal } from "@/components/motion/useReveal";
import { asset } from "@/lib/asset";

/**
 * Initial-letter avatar for team members with no photo on file.
 *
 * Used instead of Odoo's generated grey silhouette: initials in the brand
 * palette read as a deliberate placeholder, while a stock silhouette reads as
 * a broken image. The tint is derived from the name so each person gets a
 * stable colour rather than a wall of identical tiles.
 */
const AVATAR_TINTS = [
  "bg-brand-100 text-brand",
  "bg-violet/15 text-violet",
  "bg-cyan/20 text-azure",
  "bg-ember/15 text-ember",
];

function InitialAvatar({ name }: { name: string }) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  // Stable per-name index, so a person's colour never changes between builds.
  const tint =
    AVATAR_TINTS[
      Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0) %
        AVATAR_TINTS.length
    ];

  return (
    <div
      className={`flex h-full w-full items-center justify-center ${tint}`}
      aria-hidden="true"
    >
      <span className="font-display text-4xl tracking-tight">{letters}</span>
    </div>
  );
}

/**
 * Team section.
 *
 * Prefers people from Odoo Employees when any exist, so the client can add and
 * remove team members themselves. Falls back to the curated lists in
 * content/site.ts (which carry the founders' quotes, something hr.employee has
 * no field for) while Odoo is still empty.
 */
export default function Team({ members = [] }: { members?: TeamMember[] }) {
  const ref = useReveal<HTMLElement>({ stagger: 0.1 });

  if (members.length > 0) {
    return (
      <section ref={ref} id="team" className="bg-sand">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <SectionHeading
            eyebrow={founders.eyebrow}
            lines={founders.titleLines}
          />

          {/* Circular portrait, name beneath, role beneath that. Chosen over
              a large photo card because these are staff headshots of varying
              crop and quality - a circle normalises them, where a big
              rectangle exposes every difference in framing. */}
          <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {members.map((p) => (
              <article key={p.id} data-reveal="up" className="group text-center">
                <div className="relative mx-auto aspect-square w-32 overflow-hidden rounded-full border-2 border-paper shadow-md sm:w-36">
                  {p.imageUrl ? (
                    /* Plain img: the src is our own Odoo image proxy route,
                       not a file next/image can optimise. */
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.imageUrl}
                      alt={`${p.name}, ${p.role || "Robonest team"}`}
                      loading="lazy"
                      className="h-full w-full object-cover object-top transition-transform duration-700 ease-[var(--ease-brand)] group-hover:scale-[1.07]"
                    />
                  ) : (
                    <InitialAvatar name={p.name} />
                  )}
                </div>

                <h3 className="mt-5 font-display text-lg leading-tight text-ink">
                  {p.name}
                </h3>
                {p.role && (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand">
                    {p.role}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} id="team" className="bg-sand">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <SectionHeading
          eyebrow={founders.eyebrow}
          lines={founders.titleLines}
        />

        <blockquote
          data-reveal
          className="mt-7 max-w-2xl border-l-2 border-brand pl-5 text-base italic leading-relaxed text-ink-700"
        >
          {founders.quote}
        </blockquote>

        {/* Founders */}
        <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {founders.people.map((p) => (
            <article
              key={p.name}
              data-reveal="up"
              className="group overflow-hidden rounded-[var(--radius-card)] border border-ink/8 bg-paper"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={asset(p.image)}
                  alt={p.name}
                  fill
                  sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 90vw"
                  className="object-cover transition-transform duration-700 ease-[var(--ease-brand)] group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-night/85 via-transparent to-transparent opacity-70" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-lg leading-tight text-paper">{p.name}</h3>
                  <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-brand-300">
                    {p.role}
                  </p>
                </div>
              </div>
              <p className="p-5 text-sm italic leading-relaxed text-ink-400">
                {p.quote}
              </p>
            </article>
          ))}
        </div>

        {/* Executive team */}
        <h3
          data-reveal="clip"
          className="mt-20 text-2xl leading-tight text-ink lg:text-3xl"
        >
          {execTeam.title}
        </h3>

        <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {execTeam.people.map((p) => (
            <article
              key={p.name}
              data-reveal="scale"
              className="group text-center"
            >
              <div className="relative mx-auto aspect-square w-32 overflow-hidden rounded-full border-2 border-paper shadow-md">
                {p.image ? (
                  <Image
                    src={asset(p.image)}
                    alt={p.name}
                    fill
                    sizes="128px"
                    className="object-cover transition-transform duration-700 ease-[var(--ease-brand)] group-hover:scale-[1.08]"
                  />
                ) : (
                  <InitialAvatar name={p.name} />
                )}
              </div>
              <h4 className="mt-5 text-lg leading-tight text-ink">{p.name}</h4>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                {p.role}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
