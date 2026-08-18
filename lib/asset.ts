/**
 * Prefixes a public-folder path with the deployment base path.
 *
 * WHY THIS EXISTS: with `images: { unoptimized: true }` (required by
 * `output: "export"`), next/image passes `src` through verbatim and does NOT
 * prepend `basePath`. On a GitHub Pages project site - served from
 * /<repo>/ - every unprefixed "/images/..." src 404s. Internal <Link> hrefs
 * and /_next assets are handled by Next automatically; only these raw public
 * paths need it.
 *
 * Wrap every <Image src>, <video src> and poster with this.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  if (!path) return path;
  // Leave absolute URLs and data URIs alone.
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${clean}`;
}
