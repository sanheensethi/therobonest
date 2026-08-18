"use client";

import { aboutPage } from "@/content/site";
import SectionHeading from "@/components/ui/SectionHeading";
import { useReveal } from "@/components/motion/useReveal";

export default function AboutBody() {
  const ref = useReveal<HTMLElement>();

  return (
    <>
      {/* Narrative + focus list */}
      <section ref={ref} className="bg-sand">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
            <div className="space-y-5">
              {aboutPage.intro.slice(1).map((p) => (
                <p
                  key={p.slice(0, 24)}
                  data-reveal
                  className="text-base leading-relaxed text-ink-700"
                >
                  {p}
                </p>
              ))}
              <p
                data-reveal
                className="border-l-2 border-brand pl-5 font-display text-xl leading-snug text-ink"
              >
                {aboutPage.closing}
              </p>
            </div>

            <div
              data-reveal="right"
              className="rounded-[var(--radius-card)] border border-ink/8 bg-paper p-8"
            >
              <h3 className="font-display text-xl text-ink">
                {aboutPage.focus.title}
              </h3>
              <ul className="mt-6 space-y-4">
                {aboutPage.focus.items.map((item, i) => (
                  <li key={item} className="flex gap-4 text-sm text-ink-700">
                    <span className="font-display text-brand">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <WhyChooseUs />
      <Programs />
    </>
  );
}

function WhyChooseUs() {
  const ref = useReveal<HTMLElement>({ stagger: 0.12 });
  return (
    <section ref={ref} className="bg-paper">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <SectionHeading
          eyebrow={aboutPage.why.eyebrow}
          title={aboutPage.why.title}
        />
        <div className="mt-12 grid gap-7 md:grid-cols-3">
          {aboutPage.why.items.map((item, i) => (
            <article
              key={item.title}
              data-reveal="up"
              className="group rounded-[var(--radius-card)] border border-ink/8 bg-sand p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-xl hover:shadow-ink/5"
            >
              <span className="font-display text-4xl text-brand/25 transition-colors duration-500 group-hover:text-brand">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-xl leading-snug text-ink">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-400">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Programs() {
  const ref = useReveal<HTMLElement>({ stagger: 0.1 });
  return (
    <section ref={ref} className="bg-sand">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <SectionHeading
          eyebrow={aboutPage.programs.eyebrow}
          title={aboutPage.programs.title}
          body={aboutPage.programs.body}
        />
        <div className="mt-12 grid gap-7 md:grid-cols-3">
          {aboutPage.programs.items.map((item) => (
            <article
              key={item.title}
              data-reveal="scale"
              className="rounded-[var(--radius-card)] border border-ink/8 bg-paper p-7"
            >
              <h3 className="text-lg leading-snug text-ink">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-400">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
