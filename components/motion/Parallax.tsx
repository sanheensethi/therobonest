"use client";

import { useEffect, useRef } from "react";
import { registerGsap, prefersReducedMotion } from "@/lib/motion";

/**
 * Scrubbed parallax translate. Replaces Odoo's `s_parallax_is_fixed`
 * background trick, which used background-attachment: fixed - broken on
 * iOS and impossible to control. This moves a real element instead.
 */
export default function Parallax({
  children,
  speed = 12,
  className,
}: {
  children: React.ReactNode;
  /** Percent of its own height the layer drifts across the viewport pass. */
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const { gsap } = registerGsap();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { yPercent: -speed / 2 },
        {
          yPercent: speed / 2,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [speed]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
