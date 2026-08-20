"use client";

import { useCallback, useEffect, useState } from "react";
import { useReveal } from "@/components/motion/useReveal";
import Icon from "@/components/ui/Icon";

export type Video = {
  youtubeId: string;
  title: string;
  /** eLearning course name. */
  category: string;
  duration: string;
  /** Placement tags from Odoo, e.g. Homepage / Astronomy. */
  tags?: string[];
};

/**
 * Video gallery with category filter and a click-to-play lightbox.
 *
 * Thumbnails come straight from YouTube's image CDN and the iframe is only
 * mounted AFTER a click. That matters: embedding six live YouTube iframes on
 * page load pulls in ~1MB of player JS each and tanks the page score. Nothing
 * from YouTube is requested until someone actually chooses to watch.
 */
export default function VideoGrid({
  videos,
  /** The homepage shows a small tagged selection, so it hides the filter. */
  showFilter = true,
  columns = 3,
}: {
  videos: Video[];
  showFilter?: boolean;
  columns?: 2 | 3;
}) {
  const ref = useReveal<HTMLElement>({ stagger: 0.07 });
  const [category, setCategory] = useState<string>("All");
  const [playing, setPlaying] = useState<Video | null>(null);

  const close = useCallback(() => setPlaying(null), []);

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, close]);

  // Freeze Lenis while the player is open.
  useEffect(() => {
    const lenis = (window as Window & { lenis?: { stop(): void; start(): void } })
      .lenis;
    if (!lenis) return;
    if (playing) lenis.stop();
    else lenis.start();
    return () => lenis.start();
  }, [playing]);

  // Chips cover BOTH the eLearning course and any placement tags, so editors
  // can organise by either and a new course or tag appears here on its own.
  const categories = [
    "All",
    ...Array.from(
      new Set(videos.flatMap((v) => [v.category, ...(v.tags ?? [])].filter(Boolean)))
    ),
  ];

  const shown =
    category === "All"
      ? videos
      : videos.filter(
          (v) => v.category === category || (v.tags ?? []).includes(category)
        );

  return (
    <section ref={ref} className="bg-sand">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        {/* Filter */}
        {showFilter && (
        <div
          data-reveal="fade"
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Video categories"
        >
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={[
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                category === c
                  ? "bg-brand text-paper shadow-sm"
                  : "border border-ink/12 bg-paper text-ink-700 hover:border-brand/40 hover:text-brand",
              ].join(" ")}
            >
              {c}
            </button>
          ))}
        </div>
        )}

        {/* Grid */}
        <div
          className={[
            "grid gap-7 sm:grid-cols-2",
            showFilter ? "mt-10" : "",
            columns === 3 ? "lg:grid-cols-3" : "",
          ].join(" ")}
        >
          {shown.map((v, i) => (
            <button
              key={`${v.youtubeId}-${i}`}
              type="button"
              data-reveal="up"
              onClick={() => setPlaying(v)}
              className="group overflow-hidden rounded-[var(--radius-card)] border border-ink/8 bg-paper text-left transition-all duration-500 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-xl hover:shadow-ink/5"
            >
              <span className="relative block aspect-video overflow-hidden bg-night">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-brand)] group-hover:scale-[1.06]"
                />
                <span className="absolute inset-0 bg-night/25 transition-colors duration-500 group-hover:bg-night/10" />

                {/* Play button */}
                <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand/95 shadow-lg transition-transform duration-500 group-hover:scale-110">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="ml-0.5 text-paper"
                    aria-hidden
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>

                <span className="absolute bottom-2.5 right-2.5 rounded bg-night/85 px-1.5 py-0.5 text-[11px] font-medium text-paper">
                  {v.duration}
                </span>
              </span>

              <span className="block p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand">
                  {v.category}
                </span>
                <span className="mt-1.5 block font-display text-base leading-snug text-ink">
                  {v.title}
                </span>
              </span>
            </button>
          ))}
        </div>

        {shown.length === 0 && (
          <p className="mt-10 text-sm text-ink-400">
            No videos in this category yet.
          </p>
        )}
      </div>

      {/* Player */}
      {playing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={playing.title}
          onClick={close}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-night/95 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close video"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-paper/30 bg-night/60 text-paper transition-colors hover:bg-paper/15"
          >
            <Icon name="close" className="h-5 w-5" strokeWidth={2} />
          </button>

          <div
            className="w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${playing.youtubeId}?autoplay=1&rel=0`}
                title={playing.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <p className="mt-4 text-center font-display text-lg text-paper">
              {playing.title}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
