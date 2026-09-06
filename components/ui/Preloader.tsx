"use client";

import { useEffect, useRef, useState } from "react";
import Mascot, { type Variant } from "@/components/ui/Mascot";
import { registerGsap, prefersReducedMotion } from "@/lib/motion";

/**
 * First-visit intro: two lab robots run in, bump, spin, and the curtain lifts.
 *
 * Kept SHORT and shown ONCE per browser session - a loading screen is a cost
 * the visitor pays every time, so it earns its place only as a first
 * impression. Total ~1.5s, and the page underneath is already rendered and
 * interactive; this is a curtain over content, not a blocker for content.
 * Skipped entirely for reduced-motion users and on repeat navigations.
 */
export default function Preloader() {
  const [show, setShow] = useState(false);
  // Two different robots each load. Their "words" match the body: a dog barks,
  // a car honks, a saucer buzzes; anything else just shouts hello.
  const [pair] = useState<[Variant, Variant]>(() => {
    const all: Variant[] = ["nesty", "sparky", "bolt", "pixel", "puppy", "crane", "rover", "ufo"];
    const a = all[Math.floor(Math.random() * all.length)];
    const rest = all.filter((v) => v !== a);
    return [a, rest[Math.floor(Math.random() * rest.length)]];
  });
  const word = (v: Variant) =>
    v === "puppy" ? "WOOF!" : v === "rover" ? "BEEP!" : v === "ufo" ? "BZZT!" : v === "crane" ? "CLANK!" : v === "nesty" ? "HI!" : "HEY!";
  const root = useRef<HTMLDivElement | null>(null);

  // Shown on every full load. It stays up until BOTH the intro has played
  // (min ~1.8s) AND the page reports loaded (fonts, images) - capped at 4s so a
  // slow image can never hold the site hostage.
  const [ready, setReady] = useState(false);
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

  useEffect(() => {
    const el = root.current;
    if (!show || !el) return;
    const { gsap } = registerGsap();
    document.documentElement.classList.add("lenis-stopped");

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => setIntroDone(true),
      });
      tl.fromTo("[data-a]", { x: -300 }, { x: -70, duration: 0.6 }, 0)
        .fromTo("[data-b]", { x: 300 }, { x: 70, duration: 0.6 }, 0)
        // the dog barks: head jolts, WOOF bubble
        .to("[data-a] [data-head]", { rotation: -12, y: -4, transformOrigin: "50% 100%", duration: 0.1, yoyo: true, repeat: 5 }, 0.7)
        .fromTo("[data-woof]", { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.2, ease: "back.out(2)" }, 0.7)
        // the car honks back: shakes, headlights flash, BEEP bubble
        .to("[data-b]", { x: 78, duration: 0.08, yoyo: true, repeat: 5 }, 1.2)
        .to("[data-b] [data-headlight]", { attr: { fill: "#ffffff" }, duration: 0.1, yoyo: true, repeat: 5 }, 1.2)
        .fromTo("[data-beep]", { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.2, ease: "back.out(2)" }, 1.2)
        .to("[data-woof], [data-beep]", { opacity: 0, duration: 0.2 }, 1.8)
        // car drives off, dog gives chase
        .to("[data-b] [data-wheel]", { rotation: 720, transformOrigin: "50% 50%", duration: 1.2, ease: "power1.in" }, 1.9)
        .to("[data-b]", { x: 420, duration: 1.1, ease: "power2.in" }, 1.9)
        .to("[data-a]", { x: 420, duration: 1.1, ease: "power2.in" }, 2.05)
        .to("[data-a] [data-body]", { y: -8, duration: 0.15, yoyo: true, repeat: 7 }, 2.05)
        .to("[data-word]", { opacity: 1, y: 0, duration: 0.35 }, 1.0);
      // exhaust sparks drift up and fade, looping while the curtain is up
      gsap.fromTo("[data-spark]",
        { y: 30, opacity: 0, scale: 0.4 },
        { y: -70, opacity: 0.9, scale: 1, duration: 1.6, ease: "power1.out",
          stagger: { each: 0.2, repeat: -1 } });
    }, el);

    return () => {
      ctx.revert();
      document.documentElement.classList.remove("lenis-stopped");
    };
  }, [show]);

  const [introDone, setIntroDone] = useState(false);
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
      <div className="relative flex h-40 w-72 items-end justify-center">
        <div data-a className="absolute bottom-0">
          <Mascot variant={pair[0]} expression="angry" size={120} trackCursor={false} antics={false} interactive={false} />
          <span data-woof className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl rounded-bl-sm bg-paper px-3 py-1 font-display text-sm text-ink opacity-0">
            {word(pair[0])}
          </span>
        </div>
        <div data-b className="absolute bottom-0">
          <div style={{ transform: "scaleX(-1)" }}>
            <Mascot variant={pair[1]} expression="surprised" size={120} trackCursor={false} antics={false} interactive={false} />
          </div>
          <span data-beep className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl rounded-br-sm bg-paper px-3 py-1 font-display text-sm text-ink opacity-0">
            {word(pair[1])}
          </span>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            data-spark
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
            style={{
              background: ["#38bdf8", "#f97316", "#8b5cf6", "#fbbf24"][i % 4],
              transform: `translate(${Math.cos((i / 8) * Math.PI * 2) * 48}px, ${Math.sin((i / 8) * Math.PI * 2) * 48 - 30}px)`,
            }}
          />
        ))}
        <span className="absolute -bottom-1 h-2 w-56 rounded-full bg-white/10 blur-sm" />
      </div>
      <p data-word className="mt-8 translate-y-3 font-display text-lg text-paper/80 opacity-0">
        Booting the lab…
      </p>
    </div>
  );
}
