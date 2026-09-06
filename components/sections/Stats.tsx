"use client";

import { stats } from "@/content/site";
import Counter from "@/components/motion/Counter";
import { useReveal } from "@/components/motion/useReveal";
import { useEffect, useRef } from "react";
import Mascot, { type MascotHandle } from "@/components/ui/Mascot";
import { registerGsap } from "@/lib/motion";

export default function Stats() {
  const ref = useReveal<HTMLElement>({ stagger: 0.12 });
  const bot = useRef<MascotHandle | null>(null);

  // Cheer once when the counters finish - Counter runs ~1.8s from "top 90%".
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { gsap, ScrollTrigger } = registerGsap();
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => gsap.delayedCall(1.7, () => bot.current?.celebrate()),
    });
    return () => st.kill();
  }, [ref]);

  return (
    <section data-nesty="stats" ref={ref} className="relative z-10 bg-paper">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="flex items-center gap-8">
        <div data-reveal="left" className="hidden shrink-0 lg:block">
          <Mascot ref={bot} size={120} variant="drone" />
        </div>
        <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
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
      </div>
    </section>
  );
}
