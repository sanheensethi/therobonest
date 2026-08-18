/**
 * GitHub Pages project sites are served from a sub-path
 * (https://<user>.github.io/<repo>/), so the build needs basePath +
 * assetPrefix. Both come from an env var rather than being hardcoded, so the
 * same code also builds correctly for a custom domain (therobonest.com),
 * where the base path must be empty. The deploy workflow sets it.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  // Do not auto-generate agent instruction files into the repo.
  agentRules: false,
};
export default nextConfig;
