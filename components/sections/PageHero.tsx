"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useReveal } from "@/components/motion/useReveal";
import { asset } from "@/lib/asset";
import Mascot, { type Expression } from "@/components/ui/Mascot";

/** Compact hero for interior pages. */
export default function PageHero({
  eyebrow,
  title,
  body,
  image = "/images/hero-bg.webp",
  mascotExpression,
  mascotHolding,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  image?: string;
  /** What the mascot is doing on this page. */
  mascotExpression?: Expression;
  mascotHolding?: "book";
}) {
  const ref = useReveal<HTMLElement>({ start: "top 95%" });
  // No fixed face given: pick one after mount so it differs visit to visit
  // (picked in an effect, not during render, so server and client markup match).
  const [face, setFace] = useState<Expression>(mascotExpression ?? "neutral");
  useEffect(() => {
    if (mascotExpression) return;
    const pool: Expression[] = ["happy", "wink", "cool", "proud", "cheeky", "surprised", "love"];
    setFace(pool[Math.floor(Math.random() * pool.length)]);
  }, [mascotExpression]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-night pt-[var(--nav-h)]">
      <Image
        src={asset(image)}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Uniform full-width dark veil: the photo stays visible across the
         whole hero and the copy reads anywhere on it. A second, very soft
         top/bottom gradient just adds depth and blends into the next section. */}
      <div className="absolute inset-0 bg-night/70" />
      <div className="absolute inset-0 bg-gradient-to-b from-night/45 via-transparent to-night/55" />

      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-24 pr-24 md:pr-6 lg:pb-24 lg:pt-32">
        {/* Mascot keeps the interior pages in the same family as the home hero */}
        <div data-reveal="right" className="absolute bottom-3 right-3 scale-[0.5] origin-bottom-right md:scale-100 md:bottom-6 md:right-6 lg:right-10">
          <Mascot size={130} expression={face} holding={mascotHolding} />
        </div>
        <p
          data-reveal="fade"
          className="text-on-photo font-display text-sm uppercase tracking-[0.24em] text-brand-300"
        >
          {eyebrow}
        </p>
        <h1
          data-reveal="clip"
          className="text-on-photo mt-4 max-w-3xl text-balance font-display text-4xl leading-tight text-paper sm:text-5xl lg:text-6xl"
        >
          {title}
        </h1>
        {body && (
          <p
            data-reveal
            className="text-on-photo mt-6 max-w-2xl text-base leading-relaxed text-paper/85 sm:text-lg"
          >
            {body}
          </p>
        )}
      </div>
    </section>
  );
}
