"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Plays a sequence of short clips as one continuous background reel.
 *
 * AI video comes out in 5-10 second pieces; a hero needs 20+ seconds before a
 * visitor notices it repeating. Rather than one long file, this chains
 * several clips with a short crossfade and loops the whole sequence, so each
 * piece can be regenerated on its own and the story can grow one shot at a
 * time.
 *
 * Two stacked <video> elements: while A plays, B has the next clip loaded and
 * paused at frame 0. FADE seconds before A ends, B starts and fades in over
 * A. Then the roles swap. Nothing is ever fetched during the transition.
 *
 * Plays only while on screen, never on data-saver or reduced-motion.
 */
const FADE = 0.7;

export default function HeroReel({
  clips,
  poster,
  label,
  className = "",
  anchor = "object-center",
}: {
  clips: string[];
  poster?: string;
  label?: string;
  className?: string;
  /** object-position class for the crop */
  anchor?: string;
}) {
  const a = useRef<HTMLVideoElement | null>(null);
  const b = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const va = a.current;
    const vb = b.current;
    if (!va || !vb || clips.length === 0) return;

    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (prefersReducedMotion() || conn?.saveData) return;

    const layers = [va, vb];
    let current = 0; // index into layers
    let clip = 0; // index into clips
    let switching = false;
    let onScreen = false;

    const load = (v: HTMLVideoElement, i: number) => {
      v.src = asset(clips[i]);
      v.load();
    };

    const fadeTo = (from: HTMLVideoElement, to: HTMLVideoElement) => {
      to.style.transition = `opacity ${FADE}s ease`;
      from.style.transition = `opacity ${FADE}s ease`;
      to.style.opacity = "1";
      from.style.opacity = "0";
    };

    const onTime = () => {
      const v = layers[current];
      if (switching || !v.duration) return;
      if (v.currentTime >= v.duration - FADE) {
        // last clip: let it end and hold there
        if (clip === clips.length - 1) return;
        switching = true;
        const next = layers[1 - current];
        next.currentTime = 0;
        next.play().catch(() => {});
        fadeTo(v, next);
        window.setTimeout(() => {
          v.pause();
          // queue the clip after next into the layer we just left
          clip = (clip + 1) % clips.length;
          load(v, (clip + 1) % clips.length);
          current = 1 - current;
          switching = false;
        }, FADE * 1000);
      }
    };

    // Single clip: play once and hold on the last frame. A 5-10s clip looping
    // forever behind a headline reads as a glitch, not a video.
    if (clips.length === 1) {
      va.loop = false;
      load(va, 0);
      va.style.opacity = "1";
    } else {
      load(va, 0);
      load(vb, 1);
      va.style.opacity = "1";
      vb.style.opacity = "0";
      layers.forEach((v) => v.addEventListener("timeupdate", onTime));
    }

    // play() is not a one-shot: a call before the source is ready, or while
    // the tab is hidden, silently does nothing. Ask again on every signal
    // that could have changed the answer, and a few times after mount.
    const tryPlay = () => {
      if (!onScreen || document.visibilityState !== "visible") return;
      const v = layers[current];
      if (v.paused && !v.ended) v.play().catch(() => {});
    };
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        if (onScreen) tryPlay();
        else layers.forEach((l) => l.pause());
      },
      { threshold: 0.15 }
    );
    io.observe(va);
    layers.forEach((v) => v.addEventListener("canplay", tryPlay));
    document.addEventListener("visibilitychange", tryPlay);
    const retries = [400, 1200, 2500, 5000].map((ms) => window.setTimeout(tryPlay, ms));

    return () => {
      io.disconnect();
      layers.forEach((v) => v.removeEventListener("canplay", tryPlay));
      document.removeEventListener("visibilitychange", tryPlay);
      retries.forEach((t) => window.clearTimeout(t));
      layers.forEach((v) => {
        v.removeEventListener("timeupdate", onTime);
        v.pause();
      });
    };
  }, [clips]);

  const common = `absolute inset-0 h-full w-full object-cover ${anchor}`;
  return (
    <div className={`relative h-full w-full ${className}`} aria-label={label} role={label ? "img" : undefined}>
      <video ref={a} className={common} poster={poster ? asset(poster) : undefined} muted playsInline preload="auto" style={{ opacity: 0 }} />
      <video ref={b} className={common} muted playsInline preload="auto" style={{ opacity: 0 }} />
    </div>
  );
}
