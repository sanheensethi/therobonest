"use client";

import Image from "next/image";
import { founders, execTeam } from "@/content/site";
import SectionHeading from "@/components/ui/SectionHeading";
import { useReveal } from "@/components/motion/useReveal";
import { asset } from "@/lib/asset";

/** Initial-letter avatar for team members with no photo on file. */
function InitialAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-brand-100">
      <span className="font-display text-4xl text-brand">{name[0]}</span>
    </div>
  );
}

export default function Team() {
  const ref = useReveal<HTMLElement>({ stagger: 0.1 });

  return (
    <section ref={ref} id="team" className="bg-sand">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <SectionHeading
          eyebrow={founders.eyebrow}
          lines={founders.titleLines}
        />

        <blockquote
          data-reveal
          className="mt-7 max-w-2xl border-l-2 border-brand pl-5 text-base italic leading-relaxed text-ink-700"
        >
          {founders.quote}
        </blockquote>

        {/* Founders */}
        <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {founders.people.map((p) => (
            <article
              key={p.name}
              data-reveal="up"
              className="group overflow-hidden rounded-[var(--radius-card)] border border-ink/8 bg-paper"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={asset(p.image)}
                  alt={p.name}
                  fill
                  sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 90vw"
                  className="object-cover transition-transform duration-700 ease-[var(--ease-brand)] group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-night/85 via-transparent to-transparent opacity-70" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-lg leading-tight text-paper">{p.name}</h3>
                  <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-brand-300">
                    {p.role}
                  </p>
                </div>
              </div>
              <p className="p-5 text-sm italic leading-relaxed text-ink-400">
                {p.quote}
              </p>
            </article>
          ))}
        </div>

        {/* Executive team */}
        <h3
          data-reveal="clip"
          className="mt-20 text-2xl leading-tight text-ink lg:text-3xl"
        >
          {execTeam.title}
        </h3>

        <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {execTeam.people.map((p) => (
            <article
              key={p.name}
              data-reveal="scale"
              className="group text-center"
            >
              <div className="relative mx-auto aspect-square w-32 overflow-hidden rounded-full border-2 border-paper shadow-md">
                {p.image ? (
                  <Image
                    src={asset(p.image)}
                    alt={p.name}
                    fill
                    sizes="128px"
                    className="object-cover transition-transform duration-700 ease-[var(--ease-brand)] group-hover:scale-[1.08]"
                  />
                ) : (
                  <InitialAvatar name={p.name} />
                )}
              </div>
              <h4 className="mt-5 text-lg leading-tight text-ink">{p.name}</h4>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                {p.role}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
