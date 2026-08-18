import type { Metadata } from "next";
import Link from "next/link";
import { aboutPage } from "@/content/site";
import PageHero from "@/components/sections/PageHero";
import Stats from "@/components/sections/Stats";
import Team from "@/components/sections/Team";
import Schools from "@/components/sections/Schools";
import AboutBody from "@/components/sections/AboutBody";

export const metadata: Metadata = {
  title: "About Robonest",
  description: aboutPage.intro[0],
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow={aboutPage.hero.eyebrow}
        title={aboutPage.hero.title}
        body={aboutPage.intro[0]}
        image="/images/gallery/g5.jpeg"
      />
      <AboutBody />
      <Stats />
      <Team />
      <Schools />

      {/* Closing CTA */}
      <section className="bg-night">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="text-balance font-display text-3xl leading-tight text-paper sm:text-4xl">
            {aboutPage.cta.titleLines[0]}{" "}
            <span className="text-brand">{aboutPage.cta.titleLines[1]}</span>
          </h2>
          <p className="mt-5 text-base text-paper/70">{aboutPage.cta.body}</p>
          <Link
            href="/contact"
            className="mt-9 inline-block rounded-full bg-brand px-8 py-4 text-sm font-semibold text-paper transition-all hover:bg-brand-600 hover:shadow-lg hover:shadow-brand/25"
          >
            {aboutPage.cta.action}
          </Link>
        </div>
      </section>
    </>
  );
}
