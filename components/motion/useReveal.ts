"use client";

import { useEffect, useRef } from "react";
import { registerGsap, prefersReducedMotion } from "@/lib/motion";

type RevealKind = "up" | "down" | "left" | "right" | "scale" | "clip" | "fade";

/**
 * Displacements are FIXED PIXELS, not percentages of the element's own size.
 * yPercent/xPercent scale with the element, so a tall block (a 900px form, a
 * full-width image) would travel hundreds of pixels - overshooting its
 * section, getting sliced by an `overflow-hidden` parent, and reading as a
 * broken layout rather than an animation. A constant offset also makes the
 * motion feel consistent between a one-line heading and a whole card.
 */
const SHIFT = 30;

const FROM: Record<RevealKind, gsap.TweenVars> = {
  up: { y: SHIFT, opacity: 0 },
  down: { y: -SHIFT, opacity: 0 },
  left: { x: -SHIFT, opacity: 0 },
  right: { x: SHIFT, opacity: 0 },
  scale: { scale: 0.94, opacity: 0 },
  fade: { opacity: 0 },
  // clipPath reveal - the same technique edubull uses on its headings
  clip: { clipPath: "inset(0 0 100% 0)", opacity: 1, y: 0 },
};

const TO: Record<RevealKind, gsap.TweenVars> = {
  up: { y: 0, opacity: 1 },
  down: { y: 0, opacity: 1 },
  left: { x: 0, opacity: 1 },
  right: { x: 0, opacity: 1 },
  scale: { scale: 1, opacity: 1 },
  fade: { opacity: 1 },
  clip: { clipPath: "inset(0 0 0% 0)", opacity: 1 },
};

/**
 * Animates every `[data-reveal]` descendant of `ref` into view on scroll,
 * staggered in DOM order.
 *
 * Usage:
 *   const ref = useReveal<HTMLElement>();
 *   <section ref={ref}><h2 data-reveal="clip">…</h2><p data-reveal>…</p></section>
 *
 * Variant comes from the attribute value; default is "up".
 */
export function useReveal<T extends HTMLElement>(options?: {
  stagger?: number;
  duration?: number;
  start?: string;
  once?: boolean;
}) {
  const ref = useRef<T | null>(null);
  const {
    stagger = 0.09,
    duration = 0.85,
    start = "top 85%",
    once = true,
  } = options ?? {};

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = Array.from(
      el.querySelectorAll<HTMLElement>("[data-reveal]")
    );
    if (targets.length === 0) return;

    // Reduced motion: make everything visible and skip animation entirely.
    if (prefersReducedMotion()) {
      targets.forEach((t) => {
        t.style.opacity = "1";
        t.style.transform = "none";
        t.style.clipPath = "none";
      });
      return;
    }

    const { gsap, ScrollTrigger } = registerGsap();

    // On narrow screens a horizontal reveal reads as a broken layout: a
    // full-width image slid sideways looks mis-aligned and cropped rather
    // than animated, especially if the viewer catches it mid-flight. Map the
    // horizontal variants to a vertical one below the sm breakpoint.
    const narrow = window.innerWidth < 640;

    // Group targets by variant so each group gets the right from/to pair
    // while still sharing one stagger timeline order.
    const groups = new Map<RevealKind, HTMLElement[]>();
    targets.forEach((t) => {
      let kind = ((t.dataset.reveal || "up") as RevealKind) in FROM
        ? ((t.dataset.reveal || "up") as RevealKind)
        : "up";
      if (narrow && (kind === "left" || kind === "right")) kind = "up";
      const list = groups.get(kind) ?? [];
      list.push(t);
      groups.set(kind, list);
    });

    const ctx = gsap.context(() => {
      groups.forEach((els, kind) => {
        gsap.set(els, FROM[kind]);
        gsap.to(els, {
          ...TO[kind],
          duration,
          ease: "power3.out",
          stagger,
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: once
              ? "play none none none"
              : "play none none reverse",
          },
          onComplete: () =>
            els.forEach((n) => n.classList.add("reveal-done")),
        });
      });
    }, el);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [stagger, duration, start, once]);

  return ref;
}
