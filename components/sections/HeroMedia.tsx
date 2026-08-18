"use client";

import Image from "next/image";
import { hero, heroMedia } from "@/content/site";
import Icon from "@/components/ui/Icon";
import { asset } from "@/lib/asset";

/**
 * Hero visual: still image or looping video, with hexagonal tech badges
 * connected by faint lines floating over it.
 *
 * Badge coordinates live in one place (BADGE_POS) and are shared by both the
 * badges and the connector SVG, so the lines can never drift away from the
 * hexagons they join. The SVG uses a 0-100 viewBox with
 * preserveAspectRatio="none" so its coordinates ARE the percentage positions.
 */
/* X is constrained to 19-39 deliberately. On desktop this container sits
   under BOTH the headline column (which ends at ~15% of this box) and the
   form card (which starts at ~44%), so that window is the only place a badge
   can float without landing on top of live text or a form input.
   Measured, not guessed - see the safe-band check in the Hero notes. */
const BADGE_POS = [
  { x: 21, y: 32 }, // Robotics
  { x: 30, y: 11 }, // AI
  { x: 38, y: 35 }, // IoT
  { x: 26, y: 60 }, // Coding
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
      {/* pulsing glow behind the subject */}
      <div
        aria-hidden
        className="glow-pulse pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-azure/25 blur-3xl"
      />

      {/* Media */}
      <div className="media-feather relative h-full w-full overflow-hidden">
        {heroMedia.video && allowVideo ? (
          <video
            className="h-full w-full object-cover object-center"
            src={asset(heroMedia.video)}
            poster={asset(heroMedia.image)}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={heroMedia.alt}
          />
        ) : (
          <Image
            src={asset(heroMedia.image)}
            alt={heroMedia.alt}
            fill
            priority
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover object-center"
          />
        )}

        {/* Blend the media into the navy on every edge so it reads as one
            composition rather than a pasted-in rectangle. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-night/85 via-transparent to-night/80"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-night/75 via-transparent to-night/45"
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
          strokeOpacity="0.45"
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
