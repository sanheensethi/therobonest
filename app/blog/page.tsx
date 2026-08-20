import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/sections/PageHero";
import { getBlogPosts } from "@/lib/odoo-content";
import BlogList from "@/components/sections/BlogList";

/** Pick up newly published Odoo content within 5 minutes. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights on robotics, AI and STEM education from the Robonest team.",
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <>
      <PageHero
        eyebrow="Insights"
        title="The Robonest Blog"
        body="Notes on robotics, AI, astronomy and building future-ready classrooms."
        image="/images/gallery/g3.jpeg"
      />

      <section className="bg-sand">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          {posts.length === 0 ? (
            <div className="mx-auto max-w-lg rounded-[var(--radius-card)] border border-ink/10 bg-paper p-10 text-center">
              <h2 className="font-display text-2xl text-ink">
                No posts published yet
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">
                Posts written in Odoo appear here automatically once they are
                marked <strong>Published</strong>.
              </p>
            </div>
          ) : (
            <BlogList posts={posts} />
          )}
        </div>
      </section>
    </>
  );
}
