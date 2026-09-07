"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { hero, heroForm, schools } from "@/content/site";
import { registerGsap, prefersReducedMotion } from "@/lib/motion";
import Icon from "@/components/ui/Icon";
import HeroMedia from "@/components/sections/HeroMedia";
import Magnetic from "@/components/motion/Magnetic";
import { openEnquiry } from "@/components/ui/EnquiryDrawer";
import { asset } from "@/lib/asset";

/**
 * Split hero. Copy on the left over solid navy; the video owns the right
 * ~58% at full height so the character and the lab are fully visible - the
 * clips are composed with the robot on their left, and the copy no longer
 * sits on top of him. The navy fades into the video along its left edge.
 *
 * The enquiry form left the hero: the primary button opens it as a slide-in
 * panel (EnquiryDrawer). Stacks on phones: video block first, copy below.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  // Only the VISIBLE media copy may load video (a CSS-hidden <video> still
  // downloads). Decided after mount so server and client markup match.
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (prefersReducedMotion()) return;
    const { gsap } = registerGsap();
    const ctx = gsap.context(() => {
      gsap
        .timeline({ delay: 0.1 })
        .from("[data-hero-line] > span", { yPercent: 115, duration: 1, ease: "power4.out", stagger: 0.09 })
        .from("[data-hero-eyebrow]", { opacity: 0, y: 12, duration: 0.55, ease: "power2.out" }, 0.05)
        .from("[data-hero-fade]", { opacity: 0, y: 20, duration: 0.7, ease: "power3.out", stagger: 0.07 }, 0.4)
        .from("[data-hero-media]", { opacity: 0, scale: 1.04, duration: 1.2, ease: "power3.out" }, 0.2);
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-night pt-[var(--nav-h)]">
      {/* Ambient wash on the copy side */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_80%_at_10%_20%,rgba(59,130,246,0.22),transparent_60%),radial-gradient(60%_60%_at_20%_100%,rgba(139,92,246,0.16),transparent_60%)]"
      />

      {/* ---------- Desktop media: right 58%, full height ---------- */}
      <div data-hero-media className="absolute inset-y-0 right-0 hidden w-[58%] lg:block">
        <HeroMedia allowVideo={isDesktop === true} blend="left" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-6 pb-16 pt-6 lg:min-h-[640px] lg:grid-cols-[44%_56%] lg:items-center lg:pb-20 lg:pt-6">
        {/* ---------- Mobile media (first on phones) ---------- */}
        <div data-hero-media className="relative -mx-6 aspect-video overflow-hidden lg:hidden">
          <HeroMedia allowVideo={isDesktop === false} blend="bottom" />
        </div>

        {/* ---------- Copy ---------- */}
        <div className="max-w-xl lg:pr-6">
          <p data-hero-eyebrow className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300 sm:text-xs">
            {hero.eyebrow}
          </p>

          <h1 className="mt-3 font-display text-[2.4rem] leading-[1.08] text-white sm:text-5xl lg:text-[2.35rem] xl:text-[2.7rem]">
            {hero.titleLines.map((line, i) => (
              <span key={line} data-hero-line className="block overflow-hidden py-[0.04em]">
                <span className={i === hero.titleLines.length - 1 ? "text-gradient block" : "block"}>{line}</span>
              </span>
            ))}
          </h1>

          <p data-hero-fade className="mt-4 text-base leading-relaxed text-white/75 sm:text-lg">
            {hero.body} - <span className="font-semibold text-brand-300">{hero.bodyHighlight}</span>
          </p>

          {/* CTAs */}
          <div data-hero-fade className="mt-6 flex flex-wrap items-center gap-3">
            <Magnetic strength={0.2}>
              <button
                type="button"
                onClick={openEnquiry}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-azure via-indigo to-violet px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo/30 transition-all hover:brightness-110"
              >
                {heroForm.title}
                <Icon name="arrow" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Magnetic>
            <Link
              href={hero.secondaryCta.href}
              className="group inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-all hover:border-brand-300 hover:text-brand-300"
            >
              {hero.secondaryCta.label}
              <Icon name="arrow" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Proof points */}
          <dl data-hero-fade className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {hero.proofPoints.map((p) => (
              <div key={p.label}>
                <dt className="text-brand-300">
                  <Icon name={p.icon} className="h-6 w-6" strokeWidth={1.5} />
                </dt>
                <dd className="mt-2">
                  <span className="block text-sm font-semibold leading-snug text-white">{p.value}</span>
                  <span className="block text-xs leading-snug text-white/60">{p.label}</span>
                </dd>
              </div>
            ))}
          </dl>

          {/* Trusted by - compact */}
          <div data-hero-fade className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-xs font-medium text-white/50">{hero.trustedByLabel}</span>
            {schools.logos.map((s) => (
              <span key={s.name} className="flex items-center gap-1.5" title={s.name}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
                  <Image src={asset(s.image)} alt="" width={24} height={24} className="h-full w-full object-contain p-px" />
                </span>
                <span className="text-[10px] font-semibold leading-tight text-white/75">{s.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Curved transition into the next (light) section */}
      <div aria-hidden className="absolute inset-x-0 -bottom-1 z-10 h-[70px] rounded-t-[100%_100%] bg-sand sm:h-[90px]" />
    </section>
  );
}
