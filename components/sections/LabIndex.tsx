"use client";

import { labs } from "@/content/site";
import { useReveal } from "@/components/motion/useReveal";
import { scrollToTarget } from "@/components/motion/SmoothScroll";
import Icon from "@/components/ui/Icon";

/**
 * Compact index of the five lab tiers, directly under the hero. Gives the
 * whole offer at a glance before the visitor commits to scrolling, and each
 * card jumps to the detailed rail further down.
 */
const TINTS: Record<string, { tile: string; text: string }> = {
  amber: { tile: "bg-amber-100", text: "text-amber-600" },
  green: { tile: "bg-emerald-100", text: "text-emerald-600" },
  blue: { tile: "bg-blue-100", text: "text-blue-600" },
  ember: { tile: "bg-orange-100", text: "text-orange-600" },
  violet: { tile: "bg-violet-100", text: "text-violet-600" },
};

export default function LabIndex() {
  const ref = useReveal<HTMLElement>({ stagger: 0.08, start: "top 92%" });

  return (
    <section ref={ref} className="bg-sand">
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-4 lg:pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {labs.map((lab, i) => {
            const tint = TINTS[lab.tint] ?? TINTS.blue;
            return (
              <button
                key={lab.id}
                type="button"
                data-reveal="up"
                onClick={() => scrollToTarget("#labs")}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-ink/8 bg-paper p-5 text-left shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-xl hover:shadow-ink/5"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${tint.tile} ${tint.text}`}
                >
                  <Icon name={lab.icon} className="h-6 w-6" />
                </span>

                <span className={`text-xs font-semibold ${tint.text}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span className="font-display text-[0.95rem] leading-snug text-ink">
                  {lab.title}
                </span>

                <span className="text-xs text-ink-400">({lab.grades})</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
