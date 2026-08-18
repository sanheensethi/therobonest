"use client";

import { stats } from "@/content/site";
import Counter from "@/components/motion/Counter";
import { useReveal } from "@/components/motion/useReveal";

export default function Stats() {
  const ref = useReveal<HTMLElement>({ stagger: 0.12 });

  return (
    <section ref={ref} className="relative z-10 bg-paper">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} data-reveal="up" className="text-center lg:text-left">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="block font-display text-4xl text-brand sm:text-5xl lg:text-[3.25rem]">
                  <Counter value={s.value} suffix={s.suffix} />
                </span>
                <span className="mt-2 block text-sm font-medium text-ink-400">
                  {s.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
