"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { registerGsap, prefersReducedMotion } from "@/lib/motion";
import Mascot, { type MascotHandle } from "@/components/ui/Mascot";

/**
 * Astronomy lab teaser: a particle sky the visitor can play with.
 *
 *  - ~2,800 particles with real star colours (blue-white, white, amber).
 *  - Scroll morphs the random field into a spiral galaxy and back: every
 *    particle has a "sky" position and a "galaxy" position and lerps between
 *    them with scroll progress. That is the whole trick behind the effect.
 *  - The cursor has gravity: nearby particles are pushed aside and spring
 *    back. A click sends out a shockwave.
 *  - A rocket robot flies a random smooth path through it all, flame
 *    flickering, leaving a short ember trail.
 *
 * Pure canvas. Renders only while the section is on screen.
 */
type P = {
  sx: number; sy: number; // sky position (0..1 of viewport)
  gx: number; gy: number; // galaxy position (0..1)
  tx: number; ty: number; // text position (0..1) - the word ROBONEST
  x: number; y: number;   // current (px)
  vx: number; vy: number; // velocity from interaction
  r: number; c: string; tw: number;
};

const COLOURS = ["#dbeafe", "#ffffff", "#bfdbfe", "#fde68a", "#fca5a5", "#e9d5ff"];

export default function SpaceWarp({
  eyebrow, title, body, cta, href,
}: { eyebrow: string; title: string; body: string; cta: string; href: string }) {
  const section = useRef<HTMLElement | null>(null);
  // Pin THIS inner box, never the <section> React owns. ScrollTrigger wraps
  // whatever it pins in a .pin-spacer div; if that were the section, React's
  // unmount on route change would try to remove a node that has been
  // re-parented and throw "removeChild: not a child of this node".
  const pinBox = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const rocket = useRef<HTMLDivElement | null>(null);
  const rocketBot = useRef<MascotHandle | null>(null);
  const ufo = useRef<HTMLDivElement | null>(null);
  const ufoBot = useRef<MascotHandle | null>(null);

  useEffect(() => {
    const el = section.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const reduced = prefersReducedMotion();
    const { gsap, ScrollTrigger } = registerGsap();
    const ctx = cv.getContext("2d")!;

    let W = 0, H = 0;
    let ps: P[] = [];
    const pointer = { x: -9999, y: -9999, down: 0 };
    const waves: { x: number; y: number; r: number; a: number }[] = [];
    const embers: { x: number; y: number; a: number; r: number }[] = [];
    // missiles the rocket fires at the saucer; the saucer gets dizzy on a hit
    const missiles: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    let lastShot = 0;
    // the saucer fires back: a short green beam, the rocket tumbles if it lands
    const zaps: { x1: number; y1: number; x2: number; y2: number; a: number }[] = [];
    let lastZap = 0;
    const bombs: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    let lastBomb = 0;
    let heading = 0; // rocket rotation in radians (0 = nose up)

    /** Centre of an overlay sprite in canvas coordinates. */
    const centreOf = (el: HTMLElement | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const c = cv.getBoundingClientRect();
      return { x: r.left + r.width / 2 - c.left, y: r.top + r.height / 2 - c.top };
    };

    const state = { p: 0, t: 0 };

    const build = () => {
      // Budget: 1.5x DPR cap and ~2,200 particles keep this at a fraction of a
      // frame on a laptop; phones get half.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = W < 768 ? 1100 : 2200;

      // Sample the word ROBONEST into points: draw it on an offscreen canvas
      // in the display font, read back the pixels, keep the opaque ones.
      const off = document.createElement("canvas");
      const ow = 480, oh = 140;
      off.width = ow; off.height = oh;
      const oc = off.getContext("2d")!;
      oc.fillStyle = "#fff";
      oc.textAlign = "center"; oc.textBaseline = "middle";
      oc.font = "700 96px DynaPuff, Inter, system-ui, sans-serif";
      oc.fillText("ROBONEST", ow / 2, oh / 2 + 4);
      const data = oc.getImageData(0, 0, ow, oh).data;
      const on = (x: number, y: number) => x >= 0 && y >= 0 && x < ow && y < oh && data[(y * ow + x) * 4 + 3] > 128;
      // Edge pixels (opaque with a transparent neighbour) light the letter
      // outlines; interior pixels fill them. Outlines get the bright particles.
      const pts: [number, number][] = [];
      const edge: [number, number][] = [];
      for (let y = 0; y < oh; y += 1) for (let x = 0; x < ow; x += 1) {
        if (!on(x, y)) continue;
        const isEdge = !on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1);
        (isEdge ? edge : pts).push([x / ow, y / oh]);
      }
      // scale the word to ~70% of the viewport width, centred
      const scaleW = 0.78, scaleH = scaleW * (oh / ow) * (W / H);
      const textPoint = (i: number, big: boolean): [number, number] => {
        const pool = big && edge.length ? edge : pts;
        const [px, py] = pool[(i * 7919) % pool.length]; // spread picks across the glyphs
        const j = big ? 0.0015 : 0.004;
        return [0.5 + (px - 0.5) * scaleW + (Math.random() - 0.5) * j, 0.5 + (py - 0.5) * scaleH + (Math.random() - 0.5) * j * 1.5];
      };
      ps = [];
      for (let i = 0; i < n; i++) {
        // galaxy: 3 logarithmic arms + a bright core
        const arm = i % 3;
        const t = Math.pow(Math.random(), 0.7) * 3.2; // distance along the arm
        const ang = t * 2.1 + (arm * Math.PI * 2) / 3 + (Math.random() - 0.5) * 0.45 / (0.4 + t);
        const rad = 0.045 + t * 0.085;
        const core = Math.random() < 0.12;
        const gx = 0.5 + (core ? (Math.random() - 0.5) * 0.06 : Math.cos(ang) * rad) * (W > H ? H / W : 1);
        const gy = 0.5 + (core ? (Math.random() - 0.5) * 0.06 : Math.sin(ang) * rad * 0.62);
        const sx = Math.random(), sy = Math.random();
        // a third of the particles are "bright": bigger, and they draw the letter edges
        const big = Math.random() < 0.33;
        const [tx, ty] = pts.length ? textPoint(i, big) : [sx, sy];
        ps.push({
          sx, sy, gx, gy, tx, ty, x: sx * W, y: sy * H, vx: 0, vy: 0,
          r: big ? 1.1 + Math.random() * 0.6 : 0.35 + Math.random() * 0.6,
          c: COLOURS[Math.floor(Math.random() * COLOURS.length)],
          tw: Math.random() * Math.PI * 2,
        });
      }
    };

    const ease = (t: number) => t * t * (3 - 2 * t);

    const render = () => {
      state.t += 0.016;
      // Same navy as the sections above and below so there is no hard edge;
      // the star field then just "starts" inside the same dark.
      ctx.fillStyle = "#0a1326";
      ctx.fillRect(0, 0, W, H);

      // stage weights: g = how galaxy, w = how word. The galaxy dissolves as
      // the word forms, so the two never fight for the same particles.
      const gRaw = ease(Math.min(1, Math.max(0, (state.p - 0.08) / 0.4)));
      const w = ease(Math.min(1, Math.max(0, (state.p - 0.58) / 0.34)));
      const g = gRaw * (1 - w);
      if (g > 0) {
        const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.32);
        glow.addColorStop(0, `rgba(255,244,214,${0.55 * g})`);
        glow.addColorStop(0.25, `rgba(196,181,253,${0.25 * g})`);
        glow.addColorStop(1, "rgba(10,19,38,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);
      }

      // slow galaxy rotation once formed
      const rot = state.t * 0.03 * g;
      const cs = Math.cos(rot), sn = Math.sin(rot);

      for (const p of ps) {
        // target = lerp(sky, galaxy) with rotation applied to the galaxy part
        const gxr = 0.5 + ((p.gx - 0.5) * cs - (p.gy - 0.5) * sn);
        const gyr = 0.5 + ((p.gx - 0.5) * sn + (p.gy - 0.5) * cs);
        // sky -> galaxy -> word
        let ux = p.sx + (gxr - p.sx) * g;
        let uy = p.sy + (gyr - p.sy) * g;
        ux += (p.tx - ux) * w;
        uy += (p.ty - uy) * w;
        const tx = ux * W;
        const ty = uy * H;

        // cursor gravity (push) + shockwaves
        const dx = p.x - pointer.x, dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 130 * 130) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / 130) * 1.8;
          p.vx += (dx / d) * f; p.vy += (dy / d) * f;
        }
        for (const w of waves) {
          const wx = p.x - w.x, wy = p.y - w.y;
          const wd = Math.sqrt(wx * wx + wy * wy) || 1;
          if (Math.abs(wd - w.r) < 40) {
            const f = (1 - Math.abs(wd - w.r) / 40) * 4 * w.a;
            p.vx += (wx / wd) * f; p.vy += (wy / wd) * f;
          }
        }
        // spring to target, damp velocity
        const k = 0.06 + w * 0.08;
        p.vx += (tx - p.x) * k; p.vy += (ty - p.y) * k;
        p.vx *= 0.82; p.vy *= 0.82;
        p.x += p.vx; p.y += p.vy;

        const bright = p.r > 1.05;
        const a = Math.min(1, 0.5 + 0.45 * Math.sin(state.t * 2 + p.tw) + w * (bright ? 0.5 : 0.3));
        ctx.globalAlpha = a;
        ctx.fillStyle = bright && w > 0.4 ? "#fff" : p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (bright ? 1 + w * 0.4 : 1 - w * 0.3), 0, Math.PI * 2);
        ctx.fill();
        if (bright && (w < 0.4 || w > 0.7)) {
          ctx.globalAlpha = a * (w > 0.7 ? 0.22 : 0.12);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // shockwave rings
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i];
        w.r += 9; w.a *= 0.95;
        ctx.strokeStyle = `rgba(147,197,253,${w.a * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2); ctx.stroke();
        if (w.a < 0.03) waves.splice(i, 1);
      }

      // missiles: yellow streaks that home loosely on the saucer
      const uc = centreOf(ufo.current);
      const rc = centreOf(rocket.current);
      const ux = uc ? uc.x : -999;
      const uy = uc ? uc.y : -999;

      const nowMs = performance.now();
      // the saucer drops a bomb every ~4s while the rocket is around
      if (uc && rc && nowMs - lastBomb > 4000) {
        lastBomb = nowMs;
        bombs.push({ x: uc.x, y: uc.y + 26, vx: (Math.random() - 0.5) * 2, vy: 3, life: 220 });
        ufoBot.current?.express("smug", 800);
      }
      // ---- saucer bombs: green orbs that home on the rocket ----
      for (let i = bombs.length - 1; i >= 0; i--) {
        const b = bombs[i];
        const dx = (rc ? rc.x : -999) - b.x, dy = (rc ? rc.y : -999) - b.y;
        const d = Math.hypot(dx, dy) || 1;
        b.vx += (dx / d) * 0.32; b.vy += (dy / d) * 0.32;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > 7.5) { b.vx = (b.vx / sp) * 7.5; b.vy = (b.vy / sp) * 7.5; }
        b.x += b.vx; b.y += b.vy; b.life -= 1;
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 9);
        g.addColorStop(0, "#ffffff"); g.addColorStop(0.35, "#4ade80"); g.addColorStop(1, "rgba(74,222,128,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#22c55e"; ctx.beginPath(); ctx.arc(b.x, b.y, 3.2, 0, Math.PI * 2); ctx.fill();
        if (d < 34 || b.life <= 0) {
          bombs.splice(i, 1);
          if (d < 34) {
            waves.push({ x: (rc ? rc.x : -999), y: (rc ? rc.y : -999), r: 8, a: 1 });
            rocketBot.current?.express("dizzy", 1400);
            if (rocket.current) gsap.to(rocket.current, { rotation: "+=360", duration: 0.8, ease: "power2.out" });
            ufoBot.current?.express("laugh", 1000);
          }
        }
      }

      // the saucer zaps back every few seconds when the rocket is in range
      if (uc && rc && nowMs - lastZap > 5500 && Math.hypot(rc.x - ux, rc.y - uy) < W * 0.6) {
        lastZap = nowMs;
        zaps.push({ x1: ux, y1: uy + 20, x2: rc.x, y2: rc.y, a: 1 });
        ufoBot.current?.express("angry", 900);
        // did it land? (the rocket is moving, so this is a coin-flip on purpose)
        if (Math.random() < 0.6 && rocket.current) {
          window.setTimeout(() => {
            rocketBot.current?.express("dizzy", 1500);
            if (rocket.current) gsap.to(rocket.current, { rotation: "+=360", duration: 0.8, ease: "power2.out" });
            if (rc) waves.push({ x: rc.x, y: rc.y, r: 6, a: 0.8 });
          }, 120);
        } else {
          rocketBot.current?.express("cheeky", 900);
        }
      }
      for (let i = zaps.length - 1; i >= 0; i--) {
        const z = zaps[i];
        z.a *= 0.86;
        ctx.strokeStyle = `rgba(74,222,128,${z.a})`;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(z.x1, z.y1); ctx.lineTo(z.x2, z.y2); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${z.a * 0.8})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(z.x1, z.y1); ctx.lineTo(z.x2, z.y2); ctx.stroke();
        if (z.a < 0.04) zaps.splice(i, 1);
      }
      for (let i = missiles.length - 1; i >= 0; i--) {
        const m = missiles[i];
        // gentle homing
        const dx = ux - m.x, dy = uy - m.y;
        const d = Math.hypot(dx, dy) || 1;
        m.vx += (dx / d) * 0.35; m.vy += (dy / d) * 0.35;
        const sp = Math.hypot(m.vx, m.vy);
        if (sp > 9) { m.vx = (m.vx / sp) * 9; m.vy = (m.vy / sp) * 9; }
        m.x += m.vx; m.y += m.vy; m.life -= 1;
        ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 3; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(m.x - m.vx * 2.2, m.y - m.vy * 2.2); ctx.lineTo(m.x, m.y); ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(m.x, m.y, 2.2, 0, Math.PI * 2); ctx.fill();
        embers.push({ x: m.x - m.vx, y: m.y - m.vy, a: 0.7, r: 1.5 + Math.random() * 1.5 });
        if (d < 34 || m.life <= 0) {
          missiles.splice(i, 1);
          if (d < 34) {
            waves.push({ x: ux, y: uy, r: 8, a: 1 });
            ufoBot.current?.express("dizzy", 1600);
            rocketBot.current?.express("cheeky", 1200);
            if (ufo.current) gsap.to(ufo.current, { rotation: "+=360", duration: 0.9, ease: "power2.out" });
          }
        }
      }

      // rocket ember trail
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.a *= 0.93; e.r *= 0.97; e.y += 0.4;
        ctx.globalAlpha = e.a;
        ctx.fillStyle = e.a > 0.5 ? "#fde68a" : "#fb923c";
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
        if (e.a < 0.03) embers.splice(i, 1);
      }
      ctx.globalAlpha = 1;
    };

    build();
    const rebuild = () => {
      build();
      render();
    };
    window.addEventListener("resize", rebuild);

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
    };
    const onLeave = () => { pointer.x = -9999; pointer.y = -9999; };
    const onDown = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      waves.push({ x: e.clientX - r.left, y: e.clientY - r.top, r: 10, a: 1 });
      rocketBot.current?.express("surprised", 900);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);

    // ---- rocket: endless random smooth path while the section is active ----
    let flying = false;
    const flyNext = () => {
      const r = rocket.current;
      if (!r || !flying) return;
      const from = { x: Number(gsap.getProperty(r, "x")), y: Number(gsap.getProperty(r, "y")) };
      const to = { x: W * (0.08 + Math.random() * 0.84), y: H * (0.1 + Math.random() * 0.7) };
      const mid = { x: (from.x + to.x) / 2 + (Math.random() - 0.5) * W * 0.4, y: (from.y + to.y) / 2 + (Math.random() - 0.5) * H * 0.5 };
      const ang = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
      gsap.to(r, { rotation: ang + 90, duration: 0.6, ease: "power2.out",
        onUpdate: () => { heading = (Number(gsap.getProperty(r, "rotation")) * Math.PI) / 180; } });
      gsap.to(r, {
        duration: 3 + Math.random() * 2,
        ease: "power1.inOut",
        motionPath: undefined,
        x: to.x, y: to.y,
        onUpdate: function () {
          // quadratic bezier by hand: overwrite x/y along the curve
          const t = this.progress();
          const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * mid.x + t * t * to.x;
          const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * mid.y + t * t * to.y;
          gsap.set(r, { x, y });
          // (no canvas ember trail: the rocket's own SVG flame is the exhaust)
        },
        onComplete: () => {
          if (Math.random() < 0.3) rocketBot.current?.express("cool", 1200);
          flyNext();
        },
        onStart: () => {
          // fire one missile per leg, at most every 4s, from the nozzle
          const now = performance.now();
          if (now - lastShot > 4000 && ufo.current) {
            lastShot = now;
            // fire from the nose (opposite the nozzle), in the heading direction
            const c = centreOf(rocket.current);
            if (c) {
              const nx = c.x + Math.sin(heading) * 30;
              const ny = c.y - Math.cos(heading) * 30;
              missiles.push({ x: nx, y: ny, vx: Math.sin(heading) * 4, vy: -Math.cos(heading) * 4, life: 220 });
              rocketBot.current?.express("angry", 900);
            }
          }
        },
      });
    };

    // the saucer drifts around the upper half, dodging lazily
    let drifting = false;
    const driftNext = () => {
      const u = ufo.current;
      if (!u || !drifting) return;
      gsap.to(u, {
        x: W * (0.15 + Math.random() * 0.7),
        y: H * (0.08 + Math.random() * 0.4),
        duration: 3.5 + Math.random() * 2.5,
        ease: "sine.inOut",
        onComplete: driftNext,
      });
    };

    let ticking = false;
    const tick = () => render();
    const start = () => {
      if (ticking) return;
      ticking = true; gsap.ticker.add(tick);
      flying = true;
      if (rocket.current) gsap.set(rocket.current, { x: -80, y: H * 0.5, opacity: 1 });
      flyNext();
      drifting = true;
      if (ufo.current) gsap.set(ufo.current, { x: W * 0.7, y: -120, opacity: 1 });
      driftNext();
    };
    const stop = () => {
      if (!ticking) return;
      ticking = false; gsap.ticker.remove(tick);
      flying = false;
      drifting = false;
      if (rocket.current) { gsap.killTweensOf(rocket.current); gsap.set(rocket.current, { opacity: 0 }); }
      if (ufo.current) { gsap.killTweensOf(ufo.current); gsap.set(ufo.current, { opacity: 0 }); }
    };

    // Visibility drives the render loop (so the sky is alive as it scrolls into
    // view, on phones too); the ScrollTrigger below only drives progress.
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.05 });
    io.observe(el);

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: reduced ? "+=10%" : "+=170%",
      pin: reduced ? false : pinBox.current,
      pinSpacing: true,
      scrub: 0.4,
      onUpdate: (self) => {
        state.p = self.progress;
        const copy = el.querySelector<HTMLElement>("[data-copy]");
        const ctaEl = el.querySelector<HTMLElement>("[data-cta]");
        if (copy) copy.style.opacity = String(Math.max(0, 1 - self.progress * 2.4));
        if (ctaEl) {
          const o = Math.max(0, (self.progress - 0.86) / 0.14);
          ctaEl.style.opacity = String(o);
          ctaEl.style.transform = `translateY(${(1 - o) * 20}px)`;
          ctaEl.style.pointerEvents = o > 0.5 ? "auto" : "none";
        }
      },
    });
    render();

    return () => {
      st.kill(); stop();
      window.removeEventListener("resize", rebuild);
      io.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <section ref={section} data-nesty="space" className="relative cursor-crosshair bg-night text-paper">
      <div ref={pinBox} className="relative h-[100svh] overflow-hidden">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      {/* feather the top and bottom into the neighbouring navy sections */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-night to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-night to-transparent" />

      {/* the saucer the rocket keeps taking pot-shots at */}
      <div ref={ufo} className="pointer-events-none absolute left-0 top-0 z-10 -ml-10 -mt-12 hidden opacity-0 lg:block">
        <Mascot ref={ufoBot} variant="ufo" size={92} trackCursor={false} antics={false} />
      </div>
      {/* rocket robot - flames are part of the variant */}
      <div ref={rocket} className="pointer-events-none absolute left-0 top-0 z-10 -ml-8 -mt-10 hidden opacity-0 lg:block">
        <Mascot ref={rocketBot} variant="rocket" size={76} trackCursor={false} antics={false} />
      </div>

      <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6">
        <div data-copy className="max-w-xl">
          <p className="font-display text-sm uppercase tracking-[0.22em] text-brand-300">{eyebrow}</p>
          <h2 className="text-on-photo mt-3 text-balance font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">{title}</h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-paper/80 sm:text-lg">{body}</p>
        </div>

        <div data-cta className="absolute inset-x-6 bottom-20 flex flex-col items-start gap-4 opacity-0 lg:bottom-28">
          <Link
            href={href}
            className="pointer-events-auto rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-paper shadow-lg shadow-brand/30 transition-all hover:bg-brand-600 hover:shadow-xl"
          >
            {cta}
          </Link>
        </div>
      </div>
      </div>
    </section>
  );
}
