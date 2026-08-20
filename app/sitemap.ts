import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { getBlogPosts } from "@/lib/odoo-content";

/**
 * Dynamic sitemap, generated from Odoo.
 *
 * Every post published in Odoo enters the sitemap on the next revalidation -
 * no deploy, no manual edit. Without this, search engines have to stumble on
 * new posts by crawling links, which is slow and unreliable for a site that
 * gains a page whenever someone hits Published.
 */
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url.replace(/\/$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/contact/`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/blog/`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/events/`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/videos/`, changeFrequency: "monthly", priority: 0.6 },
  ];

  // A CMS outage must not produce an empty sitemap - that would tell search
  // engines the pages are gone. Fall back to the static routes only.
  let posts: MetadataRoute.Sitemap = [];
  try {
    posts = (await getBlogPosts(200)).map((p) => ({
      url: `${base}/blog/${p.slug}/`,
      lastModified: p.date ? new Date(p.date.replace(" ", "T") + "Z") : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    posts = [];
  }

  return [...staticRoutes, ...posts];
}
