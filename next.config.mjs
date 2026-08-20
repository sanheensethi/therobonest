/**
 * Rendering mode: ISR (Incremental Static Regeneration), not a static export.
 *
 * WHY NOT `output: "export"`: with a static export every page - including each
 * /blog/[slug] - must exist at build time. A post or event published in Odoo
 * afterwards has NO page at all until someone redeploys, so the CMS would be
 * useless without a developer on standby.
 *
 * Under ISR pages are still served from cache (fast), but they revalidate
 * against Odoo on a timer, and routes that did not exist at build time are
 * rendered on first request. Publishing in Odoo is all the client has to do.
 *
 * Consequence: this rules out GitHub Pages, which can only serve static files.
 * Netlify (and Vercel) run the Next.js server runtime natively.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Odoo serves images from its own domain; we pass the URLs through rather
  // than proxying them through the image optimiser.
  images: { unoptimized: true },
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  agentRules: false,
};
export default nextConfig;
