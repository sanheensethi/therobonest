"use client";

/**
 * Reusable tag/category filter chips.
 *
 * Filtering happens client-side over the already-fetched list. That's the
 * right trade-off at this volume: no extra round trip to Odoo, instant
 * switching, and it still works if Odoo is briefly unreachable. If the blog
 * ever grows past a few hundred posts, this becomes server-side pagination
 * with a tag in the query.
 */
export default function TagFilter({
  tags,
  active,
  onChange,
  label = "Filter",
  counts,
}: {
  tags: string[];
  active: string;
  onChange: (tag: string) => void;
  label?: string;
  counts?: Record<string, number>;
}) {
  if (tags.length <= 1) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label={label}
    >
      {tags.map((tag) => {
        const isActive = active === tag;
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(tag)}
            className={[
              "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
              isActive
                ? "bg-brand text-paper shadow-sm"
                : "border border-ink/12 bg-paper text-ink-700 hover:border-brand/40 hover:text-brand",
            ].join(" ")}
          >
            {tag}
            {counts?.[tag] !== undefined && (
              <span
                className={[
                  "ml-2 text-xs tabular-nums",
                  isActive ? "text-paper/70" : "text-ink-400",
                ].join(" ")}
              >
                {counts[tag]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
