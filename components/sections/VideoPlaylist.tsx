"use client";

import { useState } from "react";
import { useReveal } from "@/components/motion/useReveal";
import type { Video } from "@/components/sections/VideoGrid";

/**
 * Player on the left, scrollable playlist on the right.
 *
 * Two deliberate choices:
 *
 * 1. Nothing loads from YouTube until a click. The initial view is a poster
 *    image; a live iframe per video would pull ~1MB of player JS each on a
 *    page whose job is the enquiry form.
 * 2. The playlist scroller carries `data-lenis-prevent`, otherwise Lenis
 *    swallows the wheel event and the whole page scrolls instead of the list.
 */
export default function VideoPlaylist({ videos }: { videos: Video[] }) {
  const ref = useReveal<HTMLDivElement>({ stagger: 0.06, start: "top 88%" });
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);

  if (videos.length === 0) return null;
  const current = videos[active] ?? videos[0];

  function select(i: number) {
    // A click is a user gesture, so autoplay is allowed and expected here -
    // selecting a video and then having to press play again is a dead step.
    setActive(i);
    setPlaying(true);
  }

  return (
    <div ref={ref} className="mt-10 grid gap-6 lg:grid-cols-[1.7fr_1fr] lg:gap-8">
      {/* ------------------------------- player ------------------------------- */}
      <div data-reveal="up">
        <div
          className={[
            "relative overflow-hidden rounded-[var(--radius-card)] border border-ink/8 bg-night",
            current.isShort ? "aspect-[9/16] max-h-[70vh] mx-auto w-auto" : "aspect-video",
          ].join(" ")}
        >
          {playing ? (
            <iframe
              key={current.youtubeId}
              src={`https://www.youtube-nocookie.com/embed/${current.youtubeId}?autoplay=1&rel=0`}
              title={current.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play ${current.title}`}
              className="group absolute inset-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://i.ytimg.com/vi/${current.youtubeId}/${current.isShort ? "oardefault" : "maxresdefault"}.jpg`}
                alt=""
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 bg-night/25 transition-colors group-hover:bg-night/10" />
              <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand shadow-xl transition-transform duration-500 group-hover:scale-110">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-1 text-paper" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </button>
          )}
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            {current.category}
          </p>
          <h3 className="mt-1 font-display text-xl leading-snug text-ink">
            {current.title}
          </h3>
        </div>
      </div>

      {/* ------------------------------ playlist ------------------------------ */}
      <div data-reveal="up">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
          {videos.length} videos
        </p>

        <ul
          // Lenis would otherwise capture the wheel and scroll the page.
          data-lenis-prevent
          className="max-h-[26rem] space-y-2 overflow-y-auto pr-1 lg:max-h-[30rem]"
        >
          {videos.map((v, i) => {
            const isActive = i === active;
            return (
              <li key={`${v.youtubeId}-${i}`}>
                <button
                  type="button"
                  onClick={() => select(i)}
                  aria-current={isActive}
                  className={[
                    "flex w-full gap-3 rounded-xl border p-2 text-left transition-all duration-300",
                    isActive
                      ? "border-brand/50 bg-brand-100"
                      : "border-ink/8 bg-paper hover:border-brand/30 hover:bg-sand",
                  ].join(" ")}
                >
                  <span className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-night">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    {v.duration && (
                      <span className="absolute bottom-1 right-1 rounded bg-night/85 px-1 py-0.5 text-[10px] font-medium text-paper">
                        {v.duration}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute inset-0 flex items-center justify-center bg-night/35">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
                      </span>
                    )}
                  </span>

                  <span className="min-w-0 flex-1 py-0.5">
                    <span
                      className={[
                        "block text-[11px] font-semibold uppercase tracking-wider",
                        isActive ? "text-brand" : "text-ink-400",
                      ].join(" ")}
                    >
                      {v.category}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-sm font-medium leading-snug text-ink">
                      {v.title}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
