"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { registerGsap, prefersReducedMotion } from "@/lib/motion";

/**
 * Wires Lenis smooth scrolling to GSAP's ticker and ScrollTrigger.
 *
 * All three of these are required together:
 *   1. lenis.on("scroll", ScrollTrigger.update)  -> triggers fire at the
 *      interpolated position, not the native one.
 *   2. gsap.ticker.add(t => lenis.raf(t * 1000)) -> one RAF loop, not two.
 *      GSAP's ticker gets seconds; Lenis wants milliseconds.
 *   3. gsap.ticker.lagSmoothing(0)               -> set in registerGsap().
 *
 * Miss any one and pinned sections jitter or drift out of sync.
 */
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const { gsap, ScrollTrigger } = registerGsap();
    const root = document.documentElement;

    // Tell CSS that JS motion is live (gates the data-reveal hidden state).
    root.classList.add("js-motion");

    const reduced = prefersReducedMotion();

    if (reduced) {
      // No smooth scrolling, no scrubbing. Reveals resolve instantly
      // via CSS, so there is nothing further to set up.
      ScrollTrigger.refresh();
      return () => root.classList.remove("js-motion");
    }

    const lenis = new Lenis({
      duration: 1.1,
      lerp: 0.1,
      smoothWheel: true,
      touchMultiplier: 1.6,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    // Expose for anchor navigation + the scroll-to-top button.
    (window as Window & { lenis?: Lenis }).lenis = lenis;

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);

    // Images finishing late change document height; ScrollTrigger needs to
    // recompute start/end positions or every pin lands in the wrong place.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    const t = window.setTimeout(refresh, 400);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("load", refresh);
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(raf);
      lenis.destroy();
      delete (window as Window & { lenis?: Lenis }).lenis;
      root.classList.remove("js-motion");
    };
  }, []);

  return <>{children}</>;
}

/** Smooth-scroll to a selector or element, accounting for the fixed header. */
export function scrollToTarget(target: string | HTMLElement, offset = -90) {
  const lenis = (window as Window & { lenis?: Lenis }).lenis;
  if (lenis) {
    lenis.scrollTo(target, { offset });
    return;
  }
  const el =
    typeof target === "string" ? document.querySelector(target) : target;
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}
