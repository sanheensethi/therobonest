"use client";

import { useReveal } from "@/components/motion/useReveal";

/**
 * Thin client wrapper that applies the scroll-reveal to server-rendered
 * children. Lets a Server Component (which can fetch from Odoo) keep its
 * data-fetching while still getting the site's motion, without turning the
 * whole page into a client component.
 */
export default function RevealList({
  children,
  className,
  stagger = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const ref = useReveal<HTMLDivElement>({ stagger, start: "top 90%" });
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
