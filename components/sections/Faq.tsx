"use client";

import { useState } from "react";
import { contactPage } from "@/content/site";
import SectionHeading from "@/components/ui/SectionHeading";
import { useReveal } from "@/components/motion/useReveal";

/**
 * Accordion using grid-template-rows: 0fr -> 1fr for the open transition.
 * That animates to the content's natural height without measuring it in JS,
 * which max-height hacks cannot do without a hardcoded ceiling.
 */
export default function Faq() {
  const ref = useReveal<HTMLElement>({ stagger: 0.06 });
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section ref={ref} className="bg-sand">
      <div className="mx-auto max-w-4xl px-6 py-20 lg:py-28">
        <SectionHeading
          eyebrow="Need help?"
          title="Frequently asked questions"
          align="center"
        />

        <div className="mt-12 space-y-3">
          {contactPage.faq.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                data-reveal="up"
                className="overflow-hidden rounded-[var(--radius-card)] border border-ink/10 bg-paper"
              >
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left"
                  >
                    <span className="font-display text-base text-ink sm:text-lg">
                      {item.q}
                    </span>
                    <span
                      aria-hidden
                      className={[
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-lg leading-none transition-all duration-400",
                        isOpen
                          ? "rotate-45 border-brand bg-brand text-paper"
                          : "border-ink/20 text-ink-400",
                      ].join(" ")}
                    >
                      +
                    </span>
                  </button>
                </h3>

                <div
                  className="grid transition-[grid-template-rows] duration-400 ease-[var(--ease-brand)]"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-sm leading-relaxed text-ink-700">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
