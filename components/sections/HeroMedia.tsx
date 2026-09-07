"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { hero, heroMedia } from "@/content/site";
import Icon from "@/components/ui/Icon";
import { asset } from "@/lib/asset";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Hero visual: still image or looping video, with hexagonal tech badges
 * connected by faint lines floating over it.
 *
 * Badge coordinates live in one place (BADGE_POS) and are shared by both the
 * badges and the connector SVG, so the lines can never drift away from the
 * hexagons they join. The SVG uses a 0-100 viewBox with
 * preserveAspectRatio="none" so its coordinates ARE the percentage positions.
 */
/* X is constrained to 19-39: on desktop this box sits under BOTH the
   headline column (ends ~15%) and the form card (starts ~44%). Y is pushed
   to the top and bottom bands. The first layout only avoided TEXT and put
   two hexagons squarely on students' faces in the photo; the people are in
   the middle band (y ~30-65), so the badges now stay out of it. */
const BADGE_POS = [
  { x: 46, y: 78 }, // Robotics
  { x: 48, y: 16 }, // AI
  { x: 58, y: 28 }, // IoT
  { x: 57, y: 66 }, // Coding
];

function Hexagon({
  icon,
  label,
  delay,
}: {
  icon: string;
  label: string;
  delay: string;
}) {
  return (
    <div
      className="hex-float absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ animationDelay: delay }}
    >
      <div className="relative flex h-[74px] w-[66px] items-center justify-center sm:h-[86px] sm:w-[78px]">
        <svg
          viewBox="0 0 78 86"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <polygon
            points="39,2 76,22 76,64 39,84 2,64 2,22"
            fill="rgba(10,19,38,0.72)"
            stroke="url(#hexStroke)"
            strokeWidth="1.6"
          />
          <defs>
            <linearGradient id="hexStroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <span className="relative flex flex-col items-center gap-1 text-cyan">
          <Icon name={icon} className="h-5 w-5" />
          <span className="text-[10px] font-semibold tracking-wide text-white sm:text-[11px]">
            {label}
          </span>
        </span>
      </div>
    </div>
  );
}

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
      loop
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
        {heroMedia.video && allowVideo ? (
          <HeroVideo {...heroMedia.video} />
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

      {/* Connector lines - same coordinate space as the badges */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 z-10 h-full w-full"
        aria-hidden="true"
      >
        <polyline
          points={BADGE_POS.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="#38bdf8"
          strokeOpacity="0.35"
          strokeWidth="0.3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Badges */}
      {hero.techBadges.map((b, i) => (
        <div
          key={b.label}
          className="absolute"
          style={{ left: `${BADGE_POS[i].x}%`, top: `${BADGE_POS[i].y}%` }}
        >
          <Hexagon icon={b.icon} label={b.label} delay={`${i * 0.8}s`} />
        </div>
      ))}
    </div>
  );
}
