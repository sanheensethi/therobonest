import type { MetadataRoute } from "next";
import { site } from "@/content/site";

/**
 * Points crawlers at the dynamic sitemap and keeps the legacy Odoo redirect
 * stubs out of the index - they exist only to forward old links, so indexing
 * them would compete with the real pages for the same queries.
 */
export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/about-robonest/", "/contactus/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
