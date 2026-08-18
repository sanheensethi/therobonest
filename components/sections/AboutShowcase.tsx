"use client";

import Image from "next/image";
import { about, aiFeatures } from "@/content/site";
import SectionHeading from "@/components/ui/SectionHeading";
import { useReveal } from "@/components/motion/useReveal";
import Parallax from "@/components/motion/Parallax";
import { asset } from "@/lib/asset";

/**
 * The "Redefining modern learning" block.
 * The old Odoo site rendered this section twice, verbatim - once here and
 * again 400px further down. It appears once now.
 */
export default function AboutShowcase() {
  const ref = useReveal<HTMLElement>();

  return (
    <section ref={ref} id="about" className="relative overflow-hidden bg-sand">
      {/* Decorative offset panel */}
      <Parallax
        speed={16}
        className="pointer-events-none absolute -right-24 top-10 hidden h-[420px] w-[420px] rounded-full bg-sky/40 blur-3xl lg:block"
      >
        <span />
      </Parallax>

      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="grid items-start gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              eyebrow={about.eyebrow}
              lines={about.titleLines}
              body={about.body}
            />
            <p data-reveal className="mt-6 max-w-xl text-base leading-relaxed text-ink-700">
              {about.extra}
            </p>

            <div
              data-reveal="scale"
              className="mt-10 overflow-hidden rounded-[var(--radius-card)] border border-ink/8"
            >
              <Image
                src={asset("/images/gallery/g7.webp")}
                alt="Students working in a Robonest robotics lab"
                width={900}
                height={600}
                sizes="(min-width: 1024px) 45vw, 90vw"
                className="h-64 w-full object-cover sm:h-80"
              />
            </div>
          </div>

          <div>
            <h3
              data-reveal="clip"
              className="text-2xl leading-tight text-ink lg:text-3xl"
            >
              {aiFeatures.title}
            </h3>

            <ul className="mt-8 space-y-4">
              {aiFeatures.items.map((item, i) => (
                <li
                  key={item.title}
                  data-reveal="right"
                  className="group rounded-[var(--radius-card)] border border-ink/8 bg-paper p-6 transition-all duration-500 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-ink/5"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 font-display text-sm text-brand transition-colors duration-500 group-hover:bg-brand group-hover:text-paper">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h4 className="text-lg leading-snug text-ink">
                        {item.title}
                      </h4>
                      <p className="mt-2 text-sm leading-relaxed text-ink-400">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
