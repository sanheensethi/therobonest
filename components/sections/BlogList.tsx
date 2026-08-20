"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import TagFilter from "@/components/ui/TagFilter";
import { useReveal } from "@/components/motion/useReveal";
import type { BlogPost } from "@/lib/odoo-content";

const ALL = "All";

/** Same IST formatting as the server helper, safe to run in the browser. */
function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value.replace(" ", "T") + "Z").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export default function BlogList({ posts }: { posts: BlogPost[] }) {
  const ref = useReveal<HTMLDivElement>({ stagger: 0.07, start: "top 92%" });
  const [active, setActive] = useState(ALL);

  // Tags come from the posts themselves, so a new tag applied in Odoo shows up
  // as a new chip with no code change. Category (the Odoo blog it belongs to)
  // is included as well, since editors use both to organise.
  const { tags, counts } = useMemo(() => {
    const all = posts.flatMap((p) => [...p.tags, p.category].filter(Boolean));
    const counts: Record<string, number> = { [ALL]: posts.length };
    for (const t of all) counts[t] = (counts[t] ?? 0) + 1;
    const ordered = Object.keys(counts)
      .filter((t) => t !== ALL)
      .sort((a, b) => counts[b] - counts[a]);
    return { tags: [ALL, ...ordered], counts };
  }, [posts]);

  const shown =
    active === ALL
      ? posts
      : posts.filter(
          (p) => p.tags.includes(active) || p.category === active
        );

  return (
    <div>
      <TagFilter
        tags={tags}
        active={active}
        onChange={setActive}
        counts={counts}
        label="Filter posts by topic"
      />

      <div
        ref={ref}
        className="mt-10 grid gap-7 md:grid-cols-2 lg:grid-cols-3"
      >
        {shown.map((post) => (
          <article
            key={post.id}
            data-reveal="up"
            className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-ink/8 bg-paper transition-all duration-500 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-xl hover:shadow-ink/5"
          >
            <div className="flex flex-1 flex-col p-7">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {post.category && (
                  <span className="rounded-full bg-brand-100 px-3 py-1 font-semibold text-brand">
                    {post.category}
                  </span>
                )}
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-ink/12 px-2.5 py-1 text-ink-400"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {post.date && (
                <p className="mt-3 text-xs text-ink-400">
                  {formatDate(post.date)}
                </p>
              )}

              <h2 className="mt-2 font-display text-xl leading-snug text-ink">
                <Link
                  href={`/blog/${post.slug}`}
                  className="transition-colors hover:text-brand"
                >
                  {post.title}
                </Link>
              </h2>

              {post.subtitle && (
                <p className="mt-2 text-sm font-medium text-ink-700">
                  {post.subtitle}
                </p>
              )}

              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-400">
                {post.teaser}
              </p>

              <Link
                href={`/blog/${post.slug}`}
                className="mt-6 text-sm font-semibold text-brand transition-colors hover:text-brand-600"
              >
                Read more →
              </Link>
            </div>
          </article>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="mt-10 text-sm text-ink-400">
          No posts tagged “{active}” yet.
        </p>
      )}
    </div>
  );
}
