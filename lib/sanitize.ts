/**
 * Strips Odoo's editor markup out of blog/event HTML so the content inherits
 * OUR typography instead of dragging Odoo's styling in with it.
 *
 * Odoo's WYSIWYG writes Bootstrap classes and inline styles into the stored
 * HTML (`class="o_default_snippet_text"`, `style="font-size:16px"`, `<div
 * class="oe_structure">` wrappers). Rendered raw, that fights the site's own
 * CSS and the blog visually drifts from every other page.
 *
 * SCOPE: this is a *presentation* normaliser for content written by trusted
 * staff in your own Odoo backend. The tag allowlist also removes script and
 * event-handler vectors, but if you ever accept blog HTML from untrusted
 * authors, put a real parser-based sanitiser (e.g. DOMPurify) in front of it.
 */

/** Tags we keep. Everything else is unwrapped (children preserved). */
const ALLOWED = new Set([
  "p", "br", "hr",
  "h2", "h3", "h4", "h5",
  "strong", "b", "em", "i", "u", "s", "mark", "small", "sup", "sub",
  "ul", "ol", "li",
  "a", "img", "figure", "figcaption",
  "blockquote", "q", "cite",
  "code", "pre",
  "table", "thead", "tbody", "tr", "th", "td",
  "iframe", // YouTube embeds
  "span",
]);

/** Tags removed together with their contents. */
const DROP_WITH_CONTENT = new Set([
  "script", "style", "noscript", "form", "input", "button", "select",
  "textarea", "svg", "canvas", "object", "embed", "link", "meta",
]);

/** Per-tag attribute allowlist. Everything else (class, style, on*) is cut. */
const ATTRS: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "width", "height", "loading"],
  iframe: ["src", "title", "allow", "allowfullscreen", "width", "height"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan", "scope"],
};

/** Only these URL schemes may appear in href/src. */
function safeUrl(value: string): string | null {
  const v = value.trim();
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(v)) return v;
  return null; // blocks javascript:, data:, vbscript:
}

function cleanAttributes(tag: string, raw: string): string {
  const allowed = ATTRS[tag];
  if (!allowed) return "";

  const out: string[] = [];
  const attrRe = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;

  while ((m = attrRe.exec(raw))) {
    const name = m[1].toLowerCase();
    if (!allowed.includes(name)) continue;

    let value = m[3] ?? m[4] ?? "";
    if (name === "href" || name === "src") {
      const safe = safeUrl(value);
      if (!safe) continue;
      value = safe;
    }
    out.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
  }

  // External links should not leak referrer or hijack the tab.
  if (tag === "a") {
    const href = out.find((a) => a.startsWith("href="));
    if (href && /^href="https?:/i.test(href)) {
      if (!out.some((a) => a.startsWith("target=")))
        out.push('target="_blank"');
      out.push('rel="noopener noreferrer"');
    }
  }
  if (tag === "iframe" && !out.some((a) => a.startsWith("loading=")))
    out.push('loading="lazy"');
  if (tag === "img" && !out.some((a) => a.startsWith("loading=")))
    out.push('loading="lazy"');

  return out.length ? " " + out.join(" ") : "";
}

export function sanitizeOdooHtml(html: string | false | null): string {
  if (!html) return "";
  let out = html;

  // 1. Remove dangerous elements along with their contents.
  for (const tag of DROP_WITH_CONTENT) {
    out = out.replace(
      new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`, "gi"),
      ""
    );
    out = out.replace(new RegExp(`<${tag}\\b[^>]*/?>`, "gi"), "");
  }

  // 2. Remove HTML comments (Odoo leaves editor hints in them).
  out = out.replace(/<!--[\s\S]*?-->/g, "");

  // 3. Rewrite every remaining tag: drop it if not allowed, strip its
  //    attributes if it is.
  out = out.replace(
    /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g,
    (_full, slash: string, rawTag: string, rawAttrs: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED.has(tag)) return ""; // unwrap: children survive
      if (slash) return `</${tag}>`;
      const selfClosing = /\/\s*$/.test(rawAttrs) || tag === "br" || tag === "hr" || tag === "img";
      return `<${tag}${cleanAttributes(tag, rawAttrs)}${selfClosing && tag !== "iframe" ? " /" : ""}>`;
    }
  );

  // 4. Collapse the empty paragraphs Odoo's editor scatters around.
  out = out.replace(/<p>\s*(&nbsp;|\s)*<\/p>/gi, "");
  out = out.replace(/(\s*\n\s*){3,}/g, "\n\n");

  return out.trim();
}

/** Plain text for meta descriptions and card teasers. */
export function htmlToText(html: string | false | null, limit = 180): string {
  if (!html) return "";
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= limit) return text;
  return text.slice(0, text.lastIndexOf(" ", limit)) + "…";
}
