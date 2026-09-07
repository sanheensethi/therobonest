"use client";

import { useEffect, useRef, useState } from "react";
import { registerGsap, prefersReducedMotion } from "@/lib/motion";
import { tellNesty } from "@/components/ui/ChatBot";
import { asset } from "@/lib/asset";

/**
 * "Time stop": a pinned section where the visitor's scroll scrubs through a
 * frame sequence - a frozen moment the camera orbits around. This is how
 * Apple's product pages work: an image sequence on a <canvas>, frame index
 * driven by scroll progress. A <video> cannot be seeked frame-accurately on
 * scroll, so a video would stutter here; frames do not.
 *
 * Cost control: frames load in the background AFTER the hero has painted,
 * lowest-detail first (every 4th frame, then the rest), so the section is
 * usable within a second even if the full set is still arriving. Phones get
 * a single still with the captions - scrubbing by thumb is not fine enough
 * to be fun, and the frame set is a few MB.
 */
type Caption = { at: number; kicker: string; text: string };

export default function ScrollFreeze({
  frames,
  captions,
  poster,
}: {
  /** Frame URLs in order. */
  frames: string[];
  /** Captions revealed at progress points (0..1). */
  captions: Caption[];
  /** Still used on phones and while frames load. */
  poster: string;
}) {
  const section = useRef<HTMLElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = section.current;
    const cv = canvas.current;
    if (!el || !cv || frames.length === 0) return;
    if (prefersReducedMotion()) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    const { gsap, ScrollTrigger } = registerGsap();
    const ctx2d = cv.getContext("2d")!;
    const imgs: (HTMLImageElement | null)[] = new Array(frames.length).fill(null);
    let current = -1;
    let killed = false;

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(cv.clientWidth * dpr);
      cv.height = Math.round(cv.clientHeight * dpr);
      current = -1;
      draw(lastIndex);
    };

    // nearest loaded frame so scrubbing never shows a blank
    const nearest = (i: number) => {
      for (let d = 0; d < frames.length; d++) {
        if (imgs[i - d]) return imgs[i - d]!;
        if (imgs[i + d]) return imgs[i + d]!;
      }
      return null;
    };

    let lastIndex = 0;
    const draw = (i: number) => {
      lastIndex = i;
      const img = nearest(i);
      if (!img || i === current) return;
      current = i;
      // cover-fit
      const cw = cv.width;
      const ch = cv.height;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      ctx2d.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    };

    const loadFrame = (i: number) =>
      new Promise<void>((res) => {
        const im = new Image();
        im.decoding = "async";
        im.onload = () => {
          imgs[i] = im;
          if (i === 0) setReady(true);
          if (Math.abs(i - lastIndex) < 2) {
            current = -1;
            draw(lastIndex);
          }
          res();
        };
        im.onerror = () => res();
        im.src = asset(frames[i]);
      });

    // coarse pass first, then fill in
    (async () => {
      await loadFrame(0);
      for (let i = 0; i < frames.length && !killed; i += 4) await loadFrame(i);
      for (let i = 0; i < frames.length && !killed; i++) if (!imgs[i]) await loadFrame(i);
    })();

    fit();
    window.addEventListener("resize", fit);

    const state = { p: 0 };
    let frozen = false;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "+=180%",
      pin: true,
      scrub: 0.4,
      anticipatePin: 1,
      onUpdate: (self) => {
        state.p = self.progress;
        draw(Math.min(frames.length - 1, Math.round(self.progress * (frames.length - 1))));
        // captions
        el.querySelectorAll<HTMLElement>("[data-cap]").forEach((c) => {
          const at = Number(c.dataset.cap);
          const on = self.progress >= at && self.progress < at + 0.3;
          c.style.opacity = on ? "1" : "0";
          c.style.transform = on ? "translateY(0)" : "translateY(12px)";
        });
        // the mascot notices the freeze once, and relaxes when it ends
        if (!frozen && self.progress > 0.05) {
          frozen = true;
          tellNesty({ action: "express", expression: "surprised", ms: 1500 });
        }
        if (frozen && (self.progress <= 0.02 || self.progress >= 0.98)) frozen = false;
      },
    });

    return () => {
      killed = true;
      st.kill();
      window.removeEventListener("resize", fit);
      gsap.killTweensOf(state);
    };
  }, [frames]);

  return (
    <section ref={section} data-nesty="freeze" className="relative h-[100svh] overflow-hidden bg-night text-paper">
      {/* phone / loading still */}
      <img
        src={asset(poster)}
        alt=""
        aria-hidden
        className={[
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
          ready ? "lg:opacity-0" : "opacity-100",
        ].join(" ")}
      />
      <canvas ref={canvas} className="absolute inset-0 hidden h-full w-full lg:block" />

      {/* frozen-time treatment: a cold vignette + a faint frost sparkle */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_50%,transparent_40%,rgba(10,19,38,0.75)_100%)]" />
      <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-40" />

      {/* captions */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 mx-auto max-w-7xl px-6 pb-16 lg:pb-24">
        {captions.map((c) => (
          <div
            key={c.at}
            data-cap={c.at}
            className="absolute bottom-16 left-6 max-w-md transition-all duration-500 lg:bottom-24"
            style={{ opacity: 0, transform: "translateY(12px)" }}
          >
            <p className="font-display text-sm uppercase tracking-[0.2em] text-brand-300">{c.kicker}</p>
            <p className="text-on-photo mt-2 font-display text-3xl leading-tight sm:text-4xl">{c.text}</p>
          </div>
        ))}
        {/* first caption is visible before any scroll so the section is never blank */}
        <div className="absolute bottom-16 left-6 max-w-md lg:bottom-24" data-cap-static>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-brand-300">{captions[0]?.kicker}</p>
          <p className="text-on-photo mt-2 font-display text-3xl leading-tight sm:text-4xl">{captions[0]?.text}</p>
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-6 right-6 hidden items-center gap-2 text-xs text-paper/60 lg:flex">
        <span className="scroll-cue inline-block h-6 w-px bg-paper/60" />
        scroll to move through the moment
      </p>
    </section>
  );
}
