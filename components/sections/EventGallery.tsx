"use client";

import { useCallback, useEffect, useState } from "react";
import { useReveal } from "@/components/motion/useReveal";
import Icon from "@/components/ui/Icon";

/**
 * Recap gallery for an event: the photos and videos an editor dropped into the
 * event's Description in Odoo.
 *
 * This is how "attach images after the event" works - Odoo has no event
 * gallery field, but images pasted into the description upload to public URLs,
 * so the description doubles as the album and the site lifts them out here.
 */
export default function EventGallery({
  images,
  videoIds,
  title,
  eventTitle,
}: {
  images: string[];
  videoIds: string[];
  title: string;
  eventTitle: string;
}) {
  const ref = useReveal<HTMLElement>({ stagger: 0.06 });
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  const close = useCallback(() => {
    setLightbox(null);
    setPlaying(null);
  }, []);

  const step = useCallback(
    (dir: 1 | -1) =>
      setLightbox((i) =>
        i === null ? null : (i + dir + images.length) % images.length
      ),
    [images.length]
  );

  useEffect(() => {
    if (lightbox === null && !playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (lightbox !== null && e.key === "ArrowRight") step(1);
      if (lightbox !== null && e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, playing, close, step]);

  // Freeze Lenis while an overlay is open.
  useEffect(() => {
    const lenis = (window as Window & { lenis?: { stop(): void; start(): void } })
      .lenis;
    if (!lenis) return;
    if (lightbox !== null || playing) lenis.stop();
    else lenis.start();
    return () => lenis.start();
  }, [lightbox, playing]);

  return (
    <section ref={ref} className="bg-sand">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <h2 data-reveal="fade" className="font-display text-2xl text-ink sm:text-3xl">
          {title}
        </h2>

        {videoIds.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {videoIds.map((id) => (
              <button
                key={id}
                type="button"
                data-reveal="up"
                onClick={() => setPlaying(id)}
                className="group relative aspect-video overflow-hidden rounded-[var(--radius-card)] border border-ink/8 bg-night"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-brand)] group-hover:scale-[1.05]"
                />
                <span className="absolute inset-0 bg-night/25 transition-colors group-hover:bg-night/10" />
                <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand/95 shadow-lg transition-transform duration-500 group-hover:scale-110">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 text-paper" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        )}

        {images.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                data-reveal="scale"
                onClick={() => setLightbox(i)}
                aria-label={`Open photo ${i + 1} of ${images.length}`}
                className="group relative aspect-square overflow-hidden rounded-[var(--radius-card)] border border-ink/8 bg-paper"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${eventTitle} - photo ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-brand)] group-hover:scale-[1.07]"
                />
                <span className="absolute inset-0 bg-night/0 transition-colors duration-500 group-hover:bg-night/25" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* photo lightbox */}
      {lightbox !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Event photo"
          onClick={close}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-night/95 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-paper/30 bg-night/60 text-paper hover:bg-paper/15"
          >
            <Icon name="close" className="h-5 w-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); step(-1); }}
            aria-label="Previous photo"
            className="absolute left-3 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-paper/30 bg-night/60 text-paper hover:bg-paper/15 sm:left-5"
          >
            <Icon name="chevronLeft" className="h-6 w-6" strokeWidth={2} />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[lightbox]}
            alt={`${eventTitle} - photo ${lightbox + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] w-auto max-w-5xl rounded-2xl object-contain"
          />

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); step(1); }}
            aria-label="Next photo"
            className="absolute right-3 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-paper/30 bg-night/60 text-paper hover:bg-paper/15 sm:right-5"
          >
            <Icon name="chevronRight" className="h-6 w-6" strokeWidth={2} />
          </button>

          <p className="absolute bottom-5 text-xs text-paper/70">
            {lightbox + 1} / {images.length}
          </p>
        </div>
      )}

      {/* video player */}
      {playing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Event video"
          onClick={close}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-night/95 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close video"
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-paper/30 bg-night/60 text-paper hover:bg-paper/15"
          >
            <Icon name="close" className="h-5 w-5" strokeWidth={2} />
          </button>
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${playing}?autoplay=1&rel=0`}
                title="Event video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
