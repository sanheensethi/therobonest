import type { Metadata } from "next";
import Link from "next/link";
import { aboutPage } from "@/content/site";
import PageHero from "@/components/sections/PageHero";
import Stats from "@/components/sections/Stats";
import Team from "@/components/sections/Team";
import { getTeam, getPage, getSchools } from "@/lib/odoo-content";
import Schools from "@/components/sections/Schools";
import AboutBody from "@/components/sections/AboutBody";

/** Pick up Odoo edits within 5 minutes. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "About Robonest",
  description: aboutPage.intro[0],
};

export default async function AboutPage() {
  const team = await getTeam();
  const schoolLogos = await getSchools();
  // Editable in Odoo: Knowledge article titled "Website: About", Published.
  // Falls back to the built-in copy when that article does not exist.
  const page = await getPage("Website: About");
  return (
    <>
      <PageHero
        eyebrow={aboutPage.hero.eyebrow}
        title={aboutPage.hero.title}
        body={aboutPage.intro[0]}
        image="/images/gallery/g5.jpeg"
      />
      {page ? (
        <section className="bg-sand">
          <div className="mx-auto max-w-3xl px-6 py-20 lg:py-24">
            <div
              className="prose-robonest"
              dangerouslySetInnerHTML={{ __html: page.html }}
            />
          </div>
        </section>
      ) : (
        <AboutBody />
      )}
      <Stats />
      <Team members={team} />
      <Schools odooLogos={schoolLogos} />

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
