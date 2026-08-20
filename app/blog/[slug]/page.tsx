import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/sections/PageHero";
import {
  getBlogPosts,
  getBlogPost,
  idFromSlug,
  formatPostDate,
} from "@/lib/odoo-content";

type Props = { params: Promise<{ slug: string }> };

/**
 * Prerenders the posts that exist at build time so they are instantly fast.
 * Anything published later is rendered on its first request and then cached -
 * `dynamicParams` defaults to true, so a brand new post needs no redeploy.
 */
export async function generateStaticParams() {
  const posts = await getBlogPosts(100);
  return posts.map((p) => ({ slug: p.slug }));
}

/** Re-check Odoo for edits to an existing post every 5 minutes. */
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = idFromSlug(slug);
  const post = id ? await getBlogPost(id) : null;
  if (!post) return { title: "Post not found" };

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    openGraph: {
      type: "article",
      title: post.metaTitle,
      description: post.metaDescription,
      publishedTime: post.date ?? undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const id = idFromSlug(slug);
  const post = id ? await getBlogPost(id) : null;
  if (!post) notFound();

  // Article structured data, so Google can render it as a rich result.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.date ?? undefined,
    author: post.author ? { "@type": "Person", name: post.author } : undefined,
    publisher: {
      "@type": "Organization",
      name: "Robonest Private Limited",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        eyebrow={post.category || "Blog"}
        title={post.title}
        body={post.subtitle || undefined}
        image="/images/gallery/g3.jpeg"
      />

      <article className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-16 lg:py-20">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ink/10 pb-6 text-sm text-ink-400">
            {post.date && <span>{formatPostDate(post.date)}</span>}
            {post.author && <span>· {post.author}</span>}
          </div>

          {/* Odoo's editor HTML, with its classes and inline styles stripped so
              it inherits our typography (see lib/sanitize.ts). */}
          <div
            className="prose-robonest mt-10"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          <div className="mt-14 border-t border-ink/10 pt-8">
            <Link
              href="/blog"
              className="text-sm font-semibold text-brand transition-colors hover:text-brand-600"
            >
              ← All posts
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
