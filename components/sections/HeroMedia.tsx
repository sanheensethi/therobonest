"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { heroMedia } from "@/content/site";
import { asset } from "@/lib/asset";
import { prefersReducedMotion } from "@/lib/motion";
import HeroReel from "@/components/sections/HeroReel";

/**
 * Hero visual: full-bleed still image or video behind the hero copy, with a
 * uniform scrim so the headline stays legible on any frame.
 */
/**
 * Background video that only plays while on screen and never on a metered
 * connection. `preload="none"` + poster means the video costs nothing until
 * the visitor is actually looking at the hero; the poster image carries LCP.
 */
function HeroVideo({ mp4, webm, poster }: { mp4: string; webm?: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (prefersReducedMotion() || conn?.saveData) {
      v.removeAttribute("autoplay");
      return;
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.15 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className="h-full w-full object-cover object-center"
      poster={asset(poster ?? heroMedia.image)}
      muted
      playsInline
      preload="none"
      aria-label={heroMedia.alt}
    >
      {webm && <source src={asset(webm)} type="video/webm" />}
      <source src={asset(mp4)} type="video/mp4" />
    </video>
  );
}

export default function HeroMedia({
  /**
   * The hero mounts this twice (an absolutely-positioned desktop copy and an
   * in-flow mobile copy) so each can sit correctly in its own layout. Only
   * ONE of them may mount the <video>: two video elements with the same src
   * decode two streams and drain battery for a frame nobody sees. The hidden
   * copy falls back to the poster image, which is a single cached request.
   */
  allowVideo = true,
}: {
  allowVideo?: boolean;
} = {}) {
  return (
    <div className="relative h-full w-full">
      {/* Media */}
      <div className="relative h-full w-full overflow-hidden">
        {heroMedia.video && allowVideo && heroMedia.video.clips && heroMedia.video.clips.length > 1 ? (
          <HeroReel clips={heroMedia.video.clips} poster={heroMedia.video.poster} label={heroMedia.alt} />
        ) : heroMedia.video && allowVideo ? (
          <HeroVideo mp4={heroMedia.video.mp4} webm={heroMedia.video.webm} poster={heroMedia.video.poster} />
        ) : (
          <Image
            src={asset(heroMedia.image)}
            alt={heroMedia.alt}
            fill
            priority
            sizes="(min-width: 1024px) 60vw, 100vw"
            /* The box matches the photo's proportions so nothing is cut off
               by object-fit; the zoom is a deliberate recrop instead. The
               students sit centre-left, the right third of the frame is a
               tree and a wall. Scaling from a point near the students keeps
               them where they are and pushes the dead space out of the box. */
            className="object-cover object-center"
          />
        )}

        {/* Blend the media into the navy on every edge so it reads as one
            composition rather than a pasted-in rectangle. */}
        <div aria-hidden className="absolute inset-0 bg-night/45" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-night/70 via-night/10 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-night/80 to-transparent"
        />
      </div>

    </div>
  );
}
