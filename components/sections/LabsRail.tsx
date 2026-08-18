"use client";

import { useEffect, useRef } from "react";
import { labs, labsIntro } from "@/content/site";
import { registerGsap, prefersReducedMotion } from "@/lib/motion";
import { scrollToTarget } from "@/components/motion/SmoothScroll";

/**
 * Pinned horizontal scroll rail - the signature motion of this site, and it
 * now runs on MOBILE as well as desktop: vertical scroll drives the cards
 * sideways on every screen that is tall enough.
 *
 * Only the RAIL is pinned, not the intro copy above it. That matters: if the
 * intro lives inside the pinned box, the cards are left with
 * viewport-minus-intro and their content clips on shorter screens. Pinning
 * just the rail gives the cards a full viewport to sit in, and they are
 * centred at their natural height rather than stretched.
 *
 * Gated on HEIGHT only (>=600px). The pinned box is exactly one viewport, so
 * the tallest card has to fit in it - which is why the card typography is
 * compacted on small screens. Shorter windows get a native swipe rail.
 *
 * Native overflow-x is switched OFF while pinned (railpin:overflow-visible),
 * otherwise the browser's own horizontal gesture handling fights the
 * scroll-driven transform.
 *
 * PIN_QUERY must stay in sync with the `railpin` variant in globals.css.
 */
const PIN_QUERY = "(min-height: 600px)";

export default function LabsRail() {
  const pinRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const pin = pinRef.current;
    const track = trackRef.current;
    if (!pin || !track) return;
    if (prefersReducedMotion()) return;

    const { gsap, ScrollTrigger } = registerGsap();
    const mm = gsap.matchMedia();

    mm.add(PIN_QUERY, () => {
      /**
       * Distance the track must travel to bring the LAST panel fully into
       * view, including the trailing gutter.
       *
       * Deliberately not `track.scrollWidth`: on a flex overflow container
       * browsers omit the trailing padding-right from scrollWidth, so the
       * rail stopped ~24px short and clipped the final card. Measuring the
       * last child's layout box and adding both paddings back is exact.
       * offsetLeft/offsetWidth are layout values, so the live GSAP transform
       * does not skew them.
       */
      const distance = () => {
        const first = track.firstElementChild as HTMLElement | null;
        const last = track.lastElementChild as HTMLElement | null;
        if (!first || !last) return 0;

        const cs = getComputedStyle(track);
        const padLeft = parseFloat(cs.paddingLeft) || 0;
        const padRight = parseFloat(cs.paddingRight) || 0;

        const span = last.offsetLeft + last.offsetWidth - first.offsetLeft;
        const needed = padLeft + span + padRight;

        return Math.max(0, needed - track.clientWidth);
      };

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          // Function form + invalidateOnRefresh so a resize or a late image
          // recomputes the pin length instead of freezing the first value.
          end: () => "+=" + distance(),
          pin: true,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: {
            snapTo: 1 / (labs.length - 1),
            duration: { min: 0.15, max: 0.45 },
            ease: "power2.inOut",
            delay: 0.02,
            // Snap to the NEAREST panel rather than projecting the flick's
            // velocity forward - inertia here can fling past several panels.
            inertia: false,
          },
          onUpdate: (self) => {
            if (progressRef.current) {
              progressRef.current.style.transform = `scaleX(${self.progress})`;
            }
          },
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        gsap.set(track, { x: 0 });
      };
    });

    ScrollTrigger.refresh();
    return () => mm.revert();
  }, []);

  return (
    <section id="labs" className="relative overflow-hidden bg-night text-paper">
      {/* Intro - scrolls normally, deliberately OUTSIDE the pinned wrapper */}
      <div className="mx-auto w-full max-w-7xl px-6 pt-20 pb-4 railpin:pt-28">
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

      {/* Pinned wrapper: exactly one viewport tall in pin mode */}
      <div
        ref={pinRef}
        className="relative flex flex-col justify-center pb-16 railpin:h-[100svh] railpin:pb-0"
      >
        {/* Progress bar - pin mode only, reflects rail position */}
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-paper/15">
            <div
              ref={progressRef}
              className="h-full origin-left scale-x-0 rounded-full bg-brand"
            />
          </div>
        </div>

        <div className="mt-8 railpin:mt-10">
          <div
            ref={trackRef}
            className="no-scrollbar flex snap-x snap-mandatory items-center gap-6 overflow-x-auto px-6 railpin:overflow-visible"
          >
            {labs.map((lab, i) => (
              <article
                key={lab.id}
                className="group relative flex w-[88vw] shrink-0 snap-center flex-col rounded-[var(--radius-card)] border border-paper/12 bg-paper/[0.04] p-5 backdrop-blur-sm transition-colors duration-500 hover:border-brand/50 sm:w-[70vw] sm:p-7 md:w-[52vw] lg:w-[40vw] xl:w-[33vw]"
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
                        <span className="text-paper/65"> — {f.detail}</span>
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

        <p className="mt-8 text-center text-xs text-paper/40 railpin:hidden">
          Swipe to explore all {labs.length} labs
        </p>
        <p className="hidden text-center text-xs text-paper/40 railpin:mt-6 railpin:block">
          Keep scrolling to explore all {labs.length} labs
        </p>
      </div>
    </section>
  );
}
