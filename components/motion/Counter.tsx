"use client";

import { useEffect, useRef } from "react";
import { registerGsap, prefersReducedMotion } from "@/lib/motion";

/**
 * Counts from 0 to `value` when scrolled into view.
 * Animates a plain object and writes formatted text on each tick, rather
 * than tweening textContent directly - keeps thousands separators correct.
 */
export default function Counter({
  value,
  suffix = "",
  duration = 1.8,
  className,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const format = (n: number) =>
      Math.round(n).toLocaleString("en-IN") + suffix;

    if (prefersReducedMotion()) {
      el.textContent = format(value);
      return;
    }

    const { gsap } = registerGsap();
    const counter = { n: 0 };

    const ctx = gsap.context(() => {
      gsap.to(counter, {
        n: value,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = format(counter.n);
        },
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      });
    }, el);

    return () => ctx.revert();
  }, [value, suffix, duration]);

  // Server-rendered fallback is the final value, so crawlers and
  // no-JS visitors still see the real number.
  return (
    <span ref={ref} className={className}>
      {value.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}
