import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/**
 * Register GSAP plugins exactly once.
 * Safe to call from any client component; no-ops on the server.
 */
export function registerGsap() {
  if (typeof window === "undefined" || registered) return { gsap, ScrollTrigger };
  gsap.registerPlugin(ScrollTrigger);

  // ScrollTrigger should not try to smooth out frame-rate lag while Lenis
  // is interpolating scroll - that combination causes visible drift on pins.
  gsap.ticker.lagSmoothing(0);

  registered = true;
  return { gsap, ScrollTrigger };
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, ScrollTrigger };
