import { odooSearchRead, odooConfigured } from "@/lib/odoo";
import { sanitizeOdooHtml, htmlToText } from "@/lib/sanitize";

/**
 * Typed content fetchers over Odoo. SERVER-SIDE ONLY.
 *
 * Every fetcher degrades to an empty list if Odoo is unreachable or not
 * configured, so a CMS outage can never break the build or blank a page - the
 * section just renders its empty state.
 *
 * Field names verified against this instance (saas~19.2+e):
 *   blog.post   -> name, subtitle, content, published_date, is_published,
 *                  website_meta_title, website_meta_description, teaser,
 *                  blog_id, author_id, tag_ids
 *                  NOTE: `post_date` does NOT exist here; use published_date.
 *   event.event -> name, date_begin, date_end, address_id, description,
 *                  is_published, event_type_id, tag_ids
 */

type Many2One = [number, string] | false;

export type BlogPost = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  teaser: string;
  contentHtml: string;
  date: string | null;
  author: string;
  category: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
};

export type EventItem = {
  id: number;
  slug: string;
  title: string;
  start: string;
  end: string | null;
  location: string;
  descriptionHtml: string;
  teaser: string;
  isPast: boolean;
};

/** URL-safe slug with the record id appended, mirroring Odoo's own scheme. */
export function toSlug(name: string, id: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "post"}-${id}`;
}

/** Pull the trailing id back out of a slug. */
export function idFromSlug(slug: string): number | null {
  const m = slug.match(/-(\d+)$/);
  return m ? Number(m[1]) : null;
}

const name = (v: Many2One): string => (Array.isArray(v) ? v[1] : "");

/* ------------------------------------------------------------------ blog */

type RawPost = {
  id: number;
  name: string;
  subtitle: string | false;
  content: string | false;
  teaser: string | false;
  published_date: string | false;
  author_id: Many2One;
  blog_id: Many2One;
  website_meta_title: string | false;
  website_meta_description: string | false;
  tag_ids: number[];
};

export async function getBlogPosts(
  limit = 30,
  tag?: string
): Promise<BlogPost[]> {
  if (!odooConfigured()) return [];
  try {
    const domain: unknown[] = [["is_published", "=", true]];
    if (tag) domain.push(["tag_ids.name", "=", tag]);
    const rows = await odooSearchRead<RawPost>(
      "blog.post",
      domain,
      [
        "name", "subtitle", "content", "teaser", "published_date",
        "author_id", "blog_id", "website_meta_title", "website_meta_description",
        "tag_ids",
      ],
      { limit, order: "published_date desc" }
    );
    // Resolve every tag id to a name in ONE extra query rather than one per
    // post - a per-post lookup would mean N+1 round trips to Odoo.
    const tagNames = await resolveTagNames("blog.tag", rows.flatMap((r) => r.tag_ids));
    return rows.map((r) => shapePost(r, tagNames));
  } catch {
    return [];
  }
}

export async function getBlogPost(id: number): Promise<BlogPost | null> {
  if (!odooConfigured()) return null;
  try {
    const rows = await odooSearchRead<RawPost>(
      "blog.post",
      [["id", "=", id], ["is_published", "=", true]],
      [
        "name", "subtitle", "content", "teaser", "published_date",
        "author_id", "blog_id", "website_meta_title", "website_meta_description",
        "tag_ids",
      ],
      { limit: 1 }
    );
    if (!rows[0]) return null;
    const tagNames = await resolveTagNames("blog.tag", rows[0].tag_ids);
    return shapePost(rows[0], tagNames);
  } catch {
    return null;
  }
}

/** id -> name map for a tag model, fetched in a single query. */
async function resolveTagNames(
  model: string,
  ids: number[]
): Promise<Map<number, string>> {
  const unique = Array.from(new Set(ids));
  if (unique.length === 0) return new Map();
  try {
    const rows = await odooSearchRead<{ id: number; name: string }>(
      model,
      [["id", "in", unique]],
      ["name"],
      { limit: unique.length }
    );
    return new Map(rows.map((r) => [r.id, r.name]));
  } catch {
    return new Map();
  }
}

function shapePost(r: RawPost, tagNames: Map<number, string>): BlogPost {
  const contentHtml = sanitizeOdooHtml(r.content);
  return {
    id: r.id,
    slug: toSlug(r.name, r.id),
    title: r.name,
    subtitle: r.subtitle || "",
    teaser: r.teaser || htmlToText(r.content, 160),
    contentHtml,
    date: r.published_date || null,
    author: name(r.author_id),
    category: name(r.blog_id),
    metaTitle: r.website_meta_title || r.name,
    metaDescription:
      r.website_meta_description || r.teaser || htmlToText(r.content, 155),
    tags: (r.tag_ids ?? [])
      .map((id) => tagNames.get(id))
      .filter((n): n is string => Boolean(n)),
  };
}

/* ----------------------------------------------------------------- events */

type RawEvent = {
  id: number;
  name: string;
  date_begin: string;
  date_end: string | false;
  address_id: Many2One;
  description: string | false;
};

/**
 * PLACEMENT TAGS
 *
 * Where a record appears on the site is controlled by the tag an editor picks
 * in Odoo, not by code. Tag an event "Homepage" and it shows in the homepage
 * strip; tag it "Popup" and it becomes the site popup. Adding a new slot is
 * the only thing that needs a developer.
 */
export const TAG = {
  home: "Homepage",
  popup: "Popup",
  astronomy: "Astronomy",
  ai: "AI & Robotics",
} as const;

export async function getEvents(
  limit = 50,
  tag?: string
): Promise<EventItem[]> {
  if (!odooConfigured()) return [];
  try {
    const domain: unknown[] = [["is_published", "=", true]];
    if (tag) domain.push(["tag_ids.name", "=", tag]);
    const rows = await odooSearchRead<RawEvent>(
      "event.event",
      domain,
      ["name", "date_begin", "date_end", "address_id", "description"],
      { limit, order: "date_begin desc" }
    );
    const now = Date.now();
    return rows.map((r) => ({
      id: r.id,
      slug: toSlug(r.name, r.id),
      title: r.name,
      start: r.date_begin,
      end: r.date_end || null,
      location: name(r.address_id),
      descriptionHtml: sanitizeOdooHtml(r.description),
      teaser: htmlToText(r.description, 150),
      // An event counts as past once its END has gone by (or its start, if
      // no end was set) - otherwise a multi-day event in progress would be
      // filed under "past" on its second morning.
      isPast: new Date(r.date_end || r.date_begin).getTime() < now,
    }));
  } catch {
    return [];
  }
}

export function splitEvents(events: EventItem[]) {
  return {
    upcoming: events
      .filter((e) => !e.isPast)
      .sort((a, b) => a.start.localeCompare(b.start)),
    past: events
      .filter((e) => e.isPast)
      .sort((a, b) => b.start.localeCompare(a.start)),
  };
}

/* -------------------------------------------------------------------- team */

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  imageUrl: string | null;
};

/**
 * Parses Odoo's human-readable binary size ("305.00 bytes", "24.10 Kb").
 * Reading a binary field with the `bin_size` context returns this instead of
 * the base64 blob, so we learn the size without downloading the image.
 */
function parseBinSize(value: string | false | null): number {
  if (!value || typeof value !== "string") return 0;
  const m = value.match(/([\d.]+)\s*(bytes|kb|mb|gb)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  const mult =
    unit === "kb" ? 1024 : unit === "mb" ? 1024 ** 2 : unit === "gb" ? 1024 ** 3 : 1;
  return n * mult;
}

/**
 * Odoo NEVER leaves an employee photo empty: it generates and stores a tiny
 * placeholder (measured at 305 bytes on this instance), so
 * `image_1920 != false` is always true and is useless for detecting a missing
 * photo. A real upload is orders of magnitude larger, so size is the reliable
 * signal. Below this threshold we return no URL, and the UI draws its own
 * initial-letter avatar rather than Odoo's grey silhouette.
 */
const REAL_PHOTO_MIN_BYTES = 2048;

export async function getTeam(limit = 30): Promise<TeamMember[]> {
  if (!odooConfigured()) return [];
  try {
    const rows = await odooSearchRead<{
      id: number;
      name: string;
      job_title: string | false;
      image_1920: string | false;
    }>("hr.employee", [], ["name", "job_title", "image_1920"], {
      limit,
      context: { bin_size: true },
    });

    return rows.map((r) => {
      const hasRealPhoto = parseBinSize(r.image_1920) >= REAL_PHOTO_MIN_BYTES;
      return {
        id: r.id,
        name: r.name,
        role: r.job_title || "",
        // Odoo serves photos from a public web route, so no blob travels
        // through the API - we only ever send the URL to the browser.
        imageUrl: hasRealPhoto
          ? `${process.env.ODOO_URL ?? ""}/web/image/hr.employee/${r.id}/image_512`
          : null,
      };
    });
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ videos */

export type VideoItem = {
  id: number;
  youtubeId: string;
  title: string;
  /** The eLearning course the video sits in. */
  category: string;
  duration: string;
  description: string;
  /** Placement tags, e.g. Homepage / Astronomy. */
  tags: string[];
};

/**
 * Videos come from Odoo eLearning (slide.slide, category "video").
 *
 * The team pastes a YouTube URL in Odoo and it fills in `youtube_id`, the
 * title and the duration itself - so nothing has to be transcribed by hand.
 * `slide.channel` acts as the category/playlist.
 */
export async function getVideos(
  limit = 60,
  tag?: string
): Promise<VideoItem[]> {
  if (!odooConfigured()) return [];
  try {
    const rows = await odooSearchRead<{
      id: number;
      name: string;
      youtube_id: string | false;
      url: string | false;
      completion_time: number | false;
      channel_id: Many2One;
      description: string | false;
      tag_ids: number[];
    }>(
      "slide.slide",
      tag
        ? [
            ["is_published", "=", true],
            ["slide_category", "=", "video"],
            ["tag_ids.name", "=", tag],
          ]
        : [
            ["is_published", "=", true],
            ["slide_category", "=", "video"],
          ],
      ["name", "youtube_id", "url", "completion_time", "channel_id", "description", "tag_ids"],
      { limit, order: "sequence asc" }
    );

    const tagNames = await resolveTagNames("slide.tag", rows.flatMap((r) => r.tag_ids ?? []));

    return rows
      .map((r) => ({
        id: r.id,
        // Fall back to parsing the URL if Odoo has not resolved the id yet.
        youtubeId: r.youtube_id || parseYouTubeId(r.url || ""),
        title: r.name,
        category: name(r.channel_id) || "Videos",
        duration: formatDuration(r.completion_time),
        description: htmlToText(r.description, 120),
        tags: (r.tag_ids ?? [])
          .map((id) => tagNames.get(id))
          .filter((n): n is string => Boolean(n)),
      }))
      .filter((v) => v.youtubeId);
  } catch {
    return [];
  }
}

function parseYouTubeId(url: string): string {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : "";
}

/** Odoo stores completion_time in HOURS as a float. */
function formatDuration(hours: number | false): string {
  if (!hours || hours <= 0) return "";
  const total = Math.round(hours * 3600);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------- pages */

export type CmsPage = { title: string; html: string };

/**
 * Prose pages (About, Astronomy) held as Odoo Knowledge articles.
 *
 * Convention: an article titled "Website: <Page>" with Published ticked.
 * Knowledge is used rather than a blog post because these are pages, not
 * posts - keeping them in a separate model means they never appear in the
 * blog listing or its tag filters.
 *
 * Returns null when the article is missing or unpublished, so the caller can
 * fall back to its built-in copy instead of rendering a blank page.
 */
export async function getPage(title: string): Promise<CmsPage | null> {
  if (!odooConfigured()) return null;
  try {
    const rows = await odooSearchRead<{
      id: number;
      name: string;
      body: string | false;
      is_published: boolean;
    }>(
      "knowledge.article",
      [["name", "=", title], ["is_published", "=", true]],
      ["name", "body", "is_published"],
      { limit: 1 }
    );
    const a = rows[0];
    if (!a || !a.body) return null;
    const html = sanitizeOdooHtml(a.body);
    if (!html) return null;
    return { title: a.name.replace(/^Website:\s*/i, ""), html };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ social */

export type SocialLink = { label: string; href: string };

/**
 * Social links, read from the Odoo website record.
 *
 * Only networks with an actual URL are returned. That is deliberate: the
 * previous site rendered Facebook / X / LinkedIn / Instagram icons that all
 * led nowhere, because the fields were never filled in. An icon that does
 * nothing is worse than no icon, so an empty field means no icon.
 *
 * Odoo 17+ removed these from Settings - they are edited via the website
 * footer editor, or written directly (scripts/set-social-links.mjs).
 */
export async function getSocials(): Promise<SocialLink[]> {
  if (!odooConfigured()) return [];
  const MAP: [string, string][] = [
    ["social_facebook", "Facebook"],
    ["social_instagram", "Instagram"],
    ["social_linkedin", "LinkedIn"],
    ["social_twitter", "Twitter"],
    ["social_youtube", "YouTube"],
  ];
  try {
    const rows = await odooSearchRead<Record<string, string | false | number>>(
      "website",
      [],
      MAP.map(([field]) => field),
      { limit: 1 }
    );
    const site = rows[0];
    if (!site) return [];
    return MAP.filter(([field]) => {
      const v = site[field];
      return typeof v === "string" && v.trim().length > 0;
    }).map(([field, label]) => ({
      label,
      href: String(site[field]).trim(),
    }));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------- popup */

/**
 * The event to promote in the site popup.
 *
 * Prefers an UPCOMING event tagged "Popup". Falls back to the next upcoming
 * event so the popup still works before anyone learns the tag - and returns
 * null when there is nothing upcoming, rather than promoting a past event
 * (announcing a show that already happened is worse than no popup).
 */
export async function getPopupEvent(): Promise<EventItem | null> {
  const tagged = splitEvents(await getEvents(10, TAG.popup)).upcoming;
  if (tagged.length) return tagged[0];
  const anyUpcoming = splitEvents(await getEvents(10)).upcoming;
  return anyUpcoming[0] ?? null;
}

/** Formats an Odoo UTC datetime for display in IST. */
export function formatEventDate(value: string): string {
  const d = new Date(value.replace(" ", "T") + "Z");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function formatPostDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value.replace(" ", "T") + "Z");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}
