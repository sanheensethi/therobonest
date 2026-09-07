"use client";

import { labs, labsIntro } from "@/content/site";
import { scrollToTarget } from "@/components/motion/SmoothScroll";
import { useReveal } from "@/components/motion/useReveal";
import Mascot from "@/components/ui/Mascot";

/**
 * The three lab programmes, side by side. This used to be a pinned horizontal
 * rail built for five cards; with three, the rail only needed ~80px of travel,
 * which left a near-zero-length pin and the next section bleeding through.
 * A grid says the same thing without the machinery.
 */
export default function LabsRail() {
  const ref = useReveal<HTMLElement>({ stagger: 0.12 });

  return (
    <section ref={ref} data-nesty="labs" id="labs" className="relative overflow-hidden bg-night text-paper">
      {/* Intro - scrolls normally, deliberately OUTSIDE the pinned wrapper */}
      <div className="relative mx-auto w-full max-w-7xl px-6 pt-20 pb-4 lg:pt-24">
        <div className="absolute right-4 top-4 origin-top-right scale-[0.55] lg:right-6 lg:top-16 lg:scale-100">
          <Mascot size={120} variant="crane" />
        </div>
        <p className="font-display text-sm uppercase tracking-[0.2em] text-brand-300">
          {labsIntro.eyebrow}
        </p>
        <h2 className="mt-3 max-w-3xl text-balance text-3xl leading-tight sm:text-4xl lg:text-5xl">
          {labsIntro.title}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-paper/70 sm:text-base">
          {labsIntro.body}
        </p>
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 pb-20 lg:pb-24">
        <div className="mt-8 grid gap-6 md:grid-cols-3">
            {labs.map((lab, i) => (
              <article
                key={lab.id}
                data-reveal="up"
                className="group relative flex flex-col rounded-[var(--radius-card)] border border-paper/12 bg-paper/[0.04] p-5 backdrop-blur-sm transition-colors duration-500 hover:border-brand/50 sm:p-7"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full bg-brand px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-paper">
                    {lab.badge}
                  </span>
                  <span className="text-xs font-medium text-paper/55">
                    {lab.grades}
                  </span>
                </div>

                <span className="mt-3 block font-display text-4xl text-paper/12 transition-colors duration-500 group-hover:text-brand/35 sm:mt-6 sm:text-5xl">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <h3 className="mt-1 text-xl leading-tight sm:mt-2 sm:text-2xl lg:text-[1.65rem]">
                  {lab.title}
                </h3>

                <p className="mt-2 text-[13px] leading-relaxed text-paper/70 sm:mt-3 sm:text-sm">
                  {lab.body}
                </p>

                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300 sm:mt-6">
                  Key features
                </p>

                <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                  {lab.features.map((f) => (
                    <li key={f.label} className="flex gap-2.5 text-[13px] sm:gap-3 sm:text-sm">
                      <span
                        aria-hidden="true"
                        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                      />
                      <span>
                        <span className="font-semibold text-paper">
                          {f.label}
                        </span>
                        <span className="text-paper/65"> - {f.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => scrollToTarget("#enquiry")}
                  className="mt-auto pt-4 text-left text-sm font-semibold text-brand-300 transition-colors hover:text-brand sm:pt-6"
                >
                  Enquire about this lab →
                </button>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
}
