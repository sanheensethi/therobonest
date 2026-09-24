import { site, contact, labs, stats } from "@/content/site";
import { getBlogPosts, getEvents, formatEventDate } from "@/lib/odoo-content";

/**
 * /llms.txt - a plain-text summary of the site for AI assistants and crawlers
 * (the llmstxt.org convention). Search-style bots read sitemap.xml; language
 * models read this. It is generated, not hand-written, so it always matches
 * the live content: the fixed facts come from content/site.ts and the lists
 * of posts and events come from Odoo on the same 5-minute window as the pages.
 */
export const revalidate = 300;

export async function GET() {
  const base = site.url.replace(/\/$/, "");

  let posts: string[] = [];
  let upcoming: string[] = [];
  let past: string[] = [];
  try {
    posts = (await getBlogPosts(30)).map(
      (p) => `- [${p.title}](${base}/blog/${p.slug}/)${p.teaser ? `: ${p.teaser}` : ""}`
    );
  } catch {
    posts = [];
  }
  try {
    const events = await getEvents(60);
    const line = (e: (typeof events)[number]) =>
      `- [${e.title}](${base}/events/${e.slug}/): ${formatEventDate(e.start)}${e.location ? `, ${e.location}` : ""}`;
    upcoming = events.filter((e) => !e.isPast).map(line);
    past = events.filter((e) => e.isPast).slice(0, 20).map(line);
  } catch {
    upcoming = [];
    past = [];
  }

  const text = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `${site.legalName} sets up turnkey STEM labs inside schools and colleges in India and places trained educators on campus to run them (the Embedded Educator Model). A lab is typically live within about 10 days of sign-off.`,
    "",
    "## Labs",
    ...labs.map((l) => `- ${l.title} (${l.grades}): ${l.body} Includes ${l.features.map((f) => f.label.toLowerCase()).join(", ")}.`),
    "",
    "## Key facts",
    ...stats.map((s) => `- ${s.value.toLocaleString("en-IN")}${s.suffix} ${s.label}`),
    `- Address: ${contact.address}`,
    `- WhatsApp: ${contact.phones[0]}`,
    `- Landline: ${contact.phones[1]}`,
    `- Email: ${contact.email}`,
    "",
    "## Pages",
    `- [Home](${base}/): overview of the three labs, the educator model, team and partner schools`,
    `- [About](${base}/about/): the company story, team and schools`,
    `- [Events](${base}/events/): upcoming workshops and exhibitions with online registration, plus past events`,
    `- [Videos](${base}/videos/): lab setups, student projects and event recordings`,
    `- [Blog](${base}/blog/): articles on robotics, AI and astronomy education`,
    `- [Contact](${base}/contact/): enquiry form, address and FAQ`,
    "",
    "## Upcoming events",
    ...(upcoming.length ? upcoming : ["- None scheduled at the moment"]),
    "",
    "## Recent events",
    ...(past.length ? past : ["- None listed yet"]),
    "",
    "## Blog posts",
    ...(posts.length ? posts : ["- None published yet"]),
    "",
    "## How to enquire",
    `Schools and colleges can book a demo lab setup through the form on any page, message on WhatsApp at ${contact.phones[0]}, or email ${contact.email}.`,
    "",
    `Sitemap: ${base}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
