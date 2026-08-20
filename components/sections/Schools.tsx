"use client";

import Image from "next/image";
import { schools } from "@/content/site";
import { useReveal } from "@/components/motion/useReveal";
import { asset } from "@/lib/asset";
import type { SchoolLogo } from "@/lib/odoo-content";

/** Either an Odoo-driven logo or one of the bundled fallbacks. */
type Logo = { name: string; image: string; fromOdoo?: boolean };

/**
 * One marquee row. `reverse` sends it the other way.
 *
 * The list is duplicated once because the keyframes translate by exactly -50%
 * (or from -50% back to 0): with two identical halves, that lands the second
 * copy precisely where the first started, so the loop has no visible seam.
 */
function Row({
  logos,
  reverse = false,
  compact = false,
}: {
  logos: readonly Logo[];
  reverse?: boolean;
  compact?: boolean;
}) {
  const loop = [...logos, ...logos];

  return (
    <div className="marquee marquee-mask overflow-hidden">
      <div
        className={[
          reverse ? "marquee-track-rev" : "marquee-track",
          "flex w-max items-center gap-4 pr-4 sm:gap-12 sm:pr-12",
        ].join(" ")}
      >
        {loop.map((s, i) => (
          <div
            key={`${s.name}-${i}`}
            className={[
              "flex shrink-0 items-center justify-center rounded-2xl bg-paper shadow-sm ring-1 ring-ink/5 transition-transform duration-500 hover:-translate-y-1",
              compact
                ? "h-24 w-[44vw] px-4 py-3"
                : "h-32 w-56 px-6 py-4 sm:h-36 sm:w-64",
            ].join(" ")}
            aria-hidden={i >= logos.length}
          >
            {s.fromOdoo ? (
              /* Odoo image proxy URL - not a local file next/image can
                 optimise, so a plain img is correct here. */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={s.image}
                alt={i < logos.length ? s.name : ""}
                loading="lazy"
                className={
                  compact
                    ? "max-h-16 w-auto object-contain"
                    : "max-h-24 w-auto object-contain sm:max-h-28"
                }
              />
            ) : (
            <Image
              src={asset(s.image)}
              alt={i < logos.length ? s.name : ""}
              width={320}
              height={160}
              /* Full colour, full size - these are partner schools and their
                 crests should be recognisable, not washed out. */
              className={
                compact
                  ? "max-h-16 w-auto object-contain"
                  : "max-h-24 w-auto object-contain sm:max-h-28"
              }
            />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Schools({ odooLogos = [] }: { odooLogos?: SchoolLogo[] }) {
  const ref = useReveal<HTMLElement>();

  // Prefer schools from Odoo Contacts (tagged "School", published). Falls back
  // to the bundled logos so the strip is never empty.
  const all: Logo[] =
    odooLogos.length > 0
      ? odooLogos.map((s) => ({ name: s.name, image: s.logoUrl, fromOdoo: true }))
      : schools.logos.map((s) => ({ name: s.name, image: s.image }));

  // Mobile layout: two rows travelling in opposite directions, so two crests
  // are on screen at once instead of one large card creeping past.
  const half = Math.ceil(all.length / 2);
  const rowA = all.slice(0, half);
  const rowB = all.slice(half);

  return (
    <section ref={ref} className="border-y border-ink/8 bg-sand">
      <div className="py-16 lg:py-20">
        <h2
          data-reveal="fade"
          className="px-6 text-center font-display text-2xl text-ink sm:text-3xl"
        >
          {schools.title}
        </h2>

        {/* Mobile: two rows, opposite directions */}
        <div className="mt-8 space-y-3 sm:hidden">
          <Row logos={rowA} compact />
          <Row logos={rowB} compact reverse />
        </div>

        {/* Desktop: a single wide row */}
        <div className="mt-10 hidden sm:block">
          <Row logos={all} />
        </div>
      </div>
    </section>
  );
}
