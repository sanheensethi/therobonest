"use client";

import Image from "next/image";
import { hardware } from "@/content/site";
import { useReveal } from "@/components/motion/useReveal";
import { asset } from "@/lib/asset";

export default function Hardware() {
  const ref = useReveal<HTMLElement>({ stagger: 0.14 });

  return (
    <section ref={ref} className="bg-paper">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <h2
          data-reveal="clip"
          className="max-w-2xl text-balance text-3xl leading-tight text-ink sm:text-4xl"
        >
          The hardware students actually build with
        </h2>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {hardware.map((h) => (
            <article
              key={h.title}
              data-reveal="up"
              className="group overflow-hidden rounded-[var(--radius-card)] border border-ink/8 bg-sand"
            >
              <div className="overflow-hidden bg-night">
                <Image
                  src={asset(h.image)}
                  alt={h.title}
                  width={800}
                  height={520}
                  sizes="(min-width: 768px) 45vw, 90vw"
                  className="h-60 w-full object-contain p-4 transition-transform duration-700 ease-[var(--ease-brand)] group-hover:scale-[1.06] sm:h-64 sm:p-6"
                />
              </div>
              <div className="p-7">
                <h3 className="font-display text-xl uppercase tracking-wide text-ink">
                  {h.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {h.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-center gap-3 text-sm text-ink-700"
                    >
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full bg-brand"
                      />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
