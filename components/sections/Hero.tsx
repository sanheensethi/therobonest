"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { hero, schools } from "@/content/site";
import { registerGsap, prefersReducedMotion } from "@/lib/motion";
import { scrollToTarget } from "@/components/motion/SmoothScroll";
import Icon from "@/components/ui/Icon";
import HeroForm from "@/components/sections/HeroForm";
import HeroMedia from "@/components/sections/HeroMedia";
import { asset } from "@/lib/asset";

/**
 * Three-zone hero: copy + proof on the left, media with tech badges in the
 * centre, lead-capture form on the right. Stacks to a single column below lg.
 *
 * The media is absolutely positioned on desktop so it can bleed to the top
 * and right edges behind the form, and becomes a normal block on mobile.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (prefersReducedMotion()) return;

    const { gsap } = registerGsap();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.1 });

      tl.from("[data-hero-line] > span", {
        yPercent: 115,
        duration: 1,
        ease: "power4.out",
        stagger: 0.09,
      })
        .from(
          "[data-hero-eyebrow]",
          { opacity: 0, y: 12, duration: 0.55, ease: "power2.out" },
          0.05
        )
        .from(
          "[data-hero-fade]",
          {
            opacity: 0,
            y: 20,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.07,
          },
          0.4
        )
        .from(
          "[data-hero-card]",
          { opacity: 0, y: 34, duration: 0.9, ease: "power3.out" },
          0.3
        );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-night pt-[var(--nav-h)]"
    >
      {/* Ambient background wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_75%_0%,rgba(59,130,246,0.28),transparent_60%),radial-gradient(80%_70%_at_10%_100%,rgba(139,92,246,0.18),transparent_60%)]"
      />

      {/* Media: bleeds to the right edge, vertically centred.
         The box is given the source photo's own proportions (~16/11) instead
         of the full hero height. Filling the taller box forced object-cover
         into a hard zoom-crop that cut the students off; matching the aspect
         ratio shows the whole scene with no distortion. */}
      <div className="absolute right-0 top-1/2 hidden w-[64%] -translate-y-1/2 lg:block xl:w-[62%]">
        <div className="relative aspect-[16/11] w-full">
          <HeroMedia />
        </div>
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 pb-24 pt-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12 lg:pb-32 lg:pt-16 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* ---------- Left: copy + proof ---------- */}
        <div className="max-w-xl">
          <p
            data-hero-eyebrow
            className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-300"
          >
            {hero.eyebrow}
          </p>

          <h1 className="mt-3 font-display text-[2.6rem] leading-[1.08] text-white sm:text-6xl lg:text-[4.1rem]">
            {hero.titleLines.map((line, i) => (
              <span
                key={line}
                data-hero-line
                className="block overflow-hidden py-[0.04em]"
              >
                <span className={i === 1 ? "text-gradient block" : "block"}>
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <p
            data-hero-fade
            className="mt-5 text-base leading-relaxed text-white/75 sm:text-lg"
          >
            {hero.body} —{" "}
            <span className="font-semibold text-brand-300">
              {hero.bodyHighlight}
            </span>
          </p>

          {/* Proof points */}
          <dl
            data-hero-fade
            className="mt-9 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-4 sm:gap-x-4"
          >
            {hero.proofPoints.map((p) => (
              <div key={p.label}>
                <dt className="text-brand-300">
                  <Icon name={p.icon} className="h-7 w-7" strokeWidth={1.5} />
                </dt>
                <dd className="mt-2.5">
                  <span className="block text-sm font-semibold leading-snug text-white">
                    {p.value}
                  </span>
                  <span className="block text-xs leading-snug text-white/60">
                    {p.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          {/* Trusted by */}
          <div
            data-hero-fade
            className="mt-9 rounded-2xl border border-white/12 bg-white/[0.045] p-4 backdrop-blur-sm"
          >
            <p className="text-xs font-medium text-white/60">
              {hero.trustedByLabel}
            </p>
            <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2.5">
              {schools.logos.map((s) => (
                <li key={s.name} className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
                    <Image
                      src={asset(s.image)}
                      alt=""
                      width={28}
                      height={28}
                      className="h-full w-full object-contain p-px"
                    />
                  </span>
                  <span className="text-[10px] font-semibold leading-tight text-white/85">
                    {s.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Scroll cue */}
          <button
            data-hero-fade
            type="button"
            onClick={() => scrollToTarget("#labs")}
            className="group mt-9 flex items-center gap-3 text-white/55 transition-colors hover:text-brand-300"
          >
            <span className="flex h-9 w-6 items-center justify-center rounded-full border border-current">
              <Icon name="mouse" className="h-4 w-4" />
            </span>
            <span className="font-accent text-base">{hero.scrollCue}</span>
            <Icon
              name="arrow"
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>
        </div>

        {/* ---------- Mobile media ---------- */}
        <div className="relative -mx-6 aspect-[16/11] overflow-hidden lg:hidden">
          <HeroMedia allowVideo={false} />
        </div>

        {/* ---------- Right: enquiry form ---------- */}
        <div data-hero-card className="lg:pt-2">
          <HeroForm />
        </div>
      </div>

      {/* Curved transition into the next (light) section */}
      <div
        aria-hidden
        className="absolute inset-x-0 -bottom-1 h-[70px] rounded-t-[100%_100%] bg-sand sm:h-[90px]"
      />
    </section>
  );
}
