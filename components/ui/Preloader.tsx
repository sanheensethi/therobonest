"use client";

import { useEffect, useRef, useState } from "react";
import Mascot, { type MascotHandle, type Variant, type Skit } from "@/components/ui/Mascot";
import { registerGsap, prefersReducedMotion } from "@/lib/motion";

/**
 * Loading screen: ONE random lab robot walks in, says hello in its own voice
 * (a car honks, a saucer buzzes, a crane clanks), does a little routine and
 * idles until the page is ready. A different robot every load.
 *
 * Shown on every full load. It stays up until BOTH the routine has played
 * (~2s) AND the page reports loaded (fonts, images) - capped at 4s so a slow
 * image can never hold the site hostage. The page underneath is already
 * rendered; this is a curtain over content, not a blocker for content.
 * Skipped entirely for reduced-motion users.
 */
const ALL: Variant[] = ["nesty", "sparky", "bolt", "pixel", "crane", "rover", "ufo", "drone"];
const ROUTINES: Skit[] = ["experiment", "dance", "gift", "giggle", "hearts", "spin"];

const word = (v: Variant) =>
  v === "drone" ? "WHIRR!" : v === "rover" ? "BEEP!" : v === "ufo" ? "BZZT!" : v === "crane" ? "CLANK!" : v === "nesty" ? "HI!" : "HEY!";

export default function Preloader() {
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const root = useRef<HTMLDivElement | null>(null);
  const bot = useRef<MascotHandle | null>(null);
  const [variant] = useState<Variant>(() => ALL[Math.floor(Math.random() * ALL.length)]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    setShow(true);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const onLoad = () => {
      const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
      (fonts?.ready ?? Promise.resolve()).then(finish, finish);
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    const cap = window.setTimeout(finish, 4000);
    return () => {
      window.removeEventListener("load", onLoad);
      window.clearTimeout(cap);
    };
  }, []);

  // The routine: walk in, greet, perform, idle.
  useEffect(() => {
    const el = root.current;
    if (!show || !el) return;
    const { gsap } = registerGsap();
    document.documentElement.classList.add("lenis-stopped");

    const ctx = gsap.context(() => {
      const routine = ROUTINES[Math.floor(Math.random() * ROUTINES.length)];
      bot.current?.walk(true);
      const tl = gsap.timeline({ onComplete: () => setIntroDone(true) });
      tl.fromTo("[data-bot]", { x: -320 }, { x: 0, duration: 1.1, ease: "power1.out" })
        .call(() => {
          bot.current?.walk(false);
          bot.current?.wave();
        })
        .fromTo("[data-word]", { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)" })
        .to("[data-label]", { opacity: 1, y: 0, duration: 0.35 }, "<")
        .to("[data-word]", { opacity: 0, duration: 0.25 }, "+=0.9")
        .call(() => {
          bot.current?.skit(routine);
        })
        .to({}, { duration: 2.6 });

      // exhaust sparks drift up and fade, looping while the curtain is up
      gsap.fromTo(
        "[data-spark]",
        { y: 30, opacity: 0, scale: 0.4 },
        { y: -70, opacity: 0.9, scale: 1, duration: 1.6, ease: "power1.out", stagger: { each: 0.2, repeat: -1 } }
      );
    }, el);

    return () => {
      ctx.revert();
      document.documentElement.classList.remove("lenis-stopped");
    };
  }, [show]);

  // Curtain lifts once both the routine and the page are done.
  useEffect(() => {
    const el = root.current;
    if (!show || !el || !introDone || !ready) return;
    const { gsap } = registerGsap();
    gsap.to(el, {
      yPercent: -100,
      duration: 0.6,
      ease: "power4.inOut",
      onComplete: () => {
        document.documentElement.classList.remove("lenis-stopped");
        setShow(false);
        // The curtain held the page at overflow:hidden while the pinned
        // sections measured themselves; re-measure now that it scrolls.
        requestAnimationFrame(() => registerGsap().ScrollTrigger.refresh());
      },
    });
  }, [show, introDone, ready]);

  if (!show) return null;

  return (
    <div
      ref={root}
      aria-hidden
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-night"
    >
      <div className="relative flex h-44 w-72 items-end justify-center">
        <div data-bot className="relative">
          <Mascot ref={bot} variant={variant} size={140} trackCursor={false} antics={false} interactive={false} />
          <span
            data-word
            className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl rounded-bl-sm bg-paper px-3 py-1 font-display text-sm text-ink opacity-0"
          >
            {word(variant)}
          </span>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            data-spark
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
            style={{
              background: ["#38bdf8", "#f97316", "#8b5cf6", "#fbbf24"][i % 4],
              transform: `translate(${Math.cos((i / 8) * Math.PI * 2) * 60}px, ${Math.sin((i / 8) * Math.PI * 2) * 30}px)`,
            }}
          />
        ))}
        <span className="absolute -bottom-1 h-2 w-40 rounded-full bg-white/10 blur-sm" />
      </div>
      <p data-label className="mt-8 translate-y-3 font-display text-lg text-paper/80 opacity-0">
        Booting the lab…
      </p>
    </div>
  );
}
