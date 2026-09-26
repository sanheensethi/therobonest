import type { MetadataRoute } from "next";
import { site, features } from "@/content/site";
import { getBlogPosts, getEvents } from "@/lib/odoo-content";

/**
 * Dynamic sitemap, generated from Odoo.
 *
 * Every post or event published in Odoo enters the sitemap on the next revalidation -
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
    ...(features.videos
      ? [{ url: `${base}/videos/`, changeFrequency: "monthly" as const, priority: 0.6 }]
      : []),
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

  // Event pages too - each published event is its own indexable page.
  let events: MetadataRoute.Sitemap = [];
  try {
    events = (await getEvents(200)).map((e) => ({
      url: `${base}/events/${e.slug}/`,
      changeFrequency: (e.isPast ? "yearly" : "weekly") as "yearly" | "weekly",
      priority: e.isPast ? 0.5 : 0.8,
    }));
  } catch {
    events = [];
  }

  return [...staticRoutes, ...posts, ...events];
}
