/**
 * Pulls photos and videos out of Odoo rich-text (event descriptions, blog
 * posts) and separates them from the prose.
 *
 * WHY: Odoo has no "event gallery" field. What it does have is a description
 * editor where images upload to PUBLIC /web/image/... URLs and pasted YouTube
 * links become iframes. So the description doubles as the media container -
 * we lift the media out and render it as a real gallery + player instead of
 * leaving it inline in the text.
 */

const ODOO_URL = process.env.ODOO_URL ?? "https://www.therobonest.com";

/** Odoo stores relative asset paths; make them absolute for our domain. */
export function absoluteOdooUrl(src: string): string {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("//")) return `https:${src}`;
  return `${ODOO_URL}${src.startsWith("/") ? "" : "/"}${src}`;
}

const YT =
  /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/;

export function youtubeIdFrom(url: string): string {
  const m = url.match(YT);
  return m ? m[1] : "";
}

export type ExtractedMedia = {
  /** Public, absolute image URLs found in the HTML. */
  images: string[];
  /** YouTube video ids found in iframes or bare links. */
  videoIds: string[];
  /** The HTML with those images and iframes removed. */
  html: string;
};

export function extractMedia(html: string | false | null): ExtractedMedia {
  if (!html) return { images: [], videoIds: [], html: "" };

  const images: string[] = [];
  const videoIds: string[] = [];
  let out = html;

  // 1. iframes -> videos (YouTube only; anything else is dropped)
  out = out.replace(/<iframe\b[^>]*src=["']([^"']+)["'][^>]*>[\s\S]*?<\/iframe>/gi,
    (_m, src: string) => {
      const id = youtubeIdFrom(src);
      if (id && !videoIds.includes(id)) videoIds.push(id);
      return "";
    }
  );
  out = out.replace(/<iframe\b[^>]*src=["']([^"']+)["'][^>]*\/?>/gi,
    (_m, src: string) => {
      const id = youtubeIdFrom(src);
      if (id && !videoIds.includes(id)) videoIds.push(id);
      return "";
    }
  );

  // 2. bare YouTube links in the prose also count as videos
  for (const m of out.matchAll(new RegExp(YT.source, "gi"))) {
    const id = m[1];
    if (id && !videoIds.includes(id)) videoIds.push(id);
  }

  // 3. <img> -> gallery. Skip tracking pixels and inline data URIs.
  out = out.replace(/<img\b[^>]*src=["']([^"']+)["'][^>]*\/?>/gi,
    (_m, src: string) => {
      if (!src.startsWith("data:")) {
        const abs = absoluteOdooUrl(src);
        if (!images.includes(abs)) images.push(abs);
      }
      return "";
    }
  );

  // 4. Tidy the wrappers those media left behind.
  out = out
    .replace(/<figure\b[^>]*>\s*(<figcaption\b[^>]*>\s*<\/figcaption>)?\s*<\/figure>/gi, "")
    .replace(/<p>\s*(&nbsp;|\s)*<\/p>/gi, "")
    .replace(/<a\b[^>]*>\s*<\/a>/gi, "")
    .trim();

  return { images, videoIds, html: out };
}

/**
 * Odoo keeps the cover image inside a CSS-ish JSON blob, e.g.
 *   {"background-image":"url(\"/web/image/1470-.../cover.webp\")", ...}
 * so it has to be dug out rather than read from a plain field.
 */
export function coverImageFrom(
  coverProperties: string | Record<string, unknown> | false | null
): string | null {
  if (!coverProperties) return null;
  try {
    const obj =
      typeof coverProperties === "string"
        ? (JSON.parse(coverProperties) as Record<string, unknown>)
        : coverProperties;
    const bg = String(obj["background-image"] ?? "");
    const m = bg.match(/url\(\s*["']?([^"')]+)["']?\s*\)/);
    if (!m || !m[1] || m[1] === "none") return null;
    return absoluteOdooUrl(decodeURI(m[1]));
  } catch {
    return null;
  }
}
