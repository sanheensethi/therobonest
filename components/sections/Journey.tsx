"use client";

import Image from "next/image";
import { journey } from "@/content/site";
import SectionHeading from "@/components/ui/SectionHeading";
import { useReveal } from "@/components/motion/useReveal";
import { asset } from "@/lib/asset";

export default function Journey() {
  const ref = useReveal<HTMLElement>();

  return (
    <section ref={ref} className="bg-paper">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div data-reveal="left" className="order-2 lg:order-1">
            <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-ink/8">
              <Image
                src={asset("/images/gallery/g2.jpeg")}
                alt="A Robonest training session in progress"
                width={900}
                height={700}
                sizes="(min-width: 1024px) 45vw, 90vw"
                className="h-72 w-full object-cover sm:h-96"
              />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <SectionHeading
              eyebrow={journey.eyebrow}
              title={journey.title}
            />
            <div className="mt-6 space-y-5">
              {journey.paragraphs.map((p) => (
                <p
                  key={p.slice(0, 24)}
                  data-reveal
                  className="text-base leading-relaxed text-ink-700"
                >
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
