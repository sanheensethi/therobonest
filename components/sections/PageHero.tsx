"use client";

import Image from "next/image";
import { useReveal } from "@/components/motion/useReveal";
import { asset } from "@/lib/asset";

/** Compact hero for interior pages. */
export default function PageHero({
  eyebrow,
  title,
  body,
  image = "/images/hero-bg.webp",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  image?: string;
}) {
  const ref = useReveal<HTMLElement>({ start: "top 95%" });

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

      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-24 lg:pb-24 lg:pt-32">
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
