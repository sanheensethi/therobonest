"use client";

import { useEffect, useRef, useState } from "react";
import Mascot, { type MascotHandle } from "@/components/ui/Mascot";
import { registerGsap, prefersReducedMotion } from "@/lib/motion";

/**
 * Random page event: the rocket and the saucer fly in, chase each other
 * around the viewport, trade missiles and zap beams for ~14 seconds, then
 * leave. Projectiles, embers and impact rings are drawn on a full-screen
 * canvas that exists only while the scene is running.
 *
 * Rare and desktop-only: first one 25-45s after load, then every 70-130s.
 * Everything sits at z-5, behind positioned page content, so the fight
 * happens *behind* forms and cards and never blocks a click.
 */
const DURATION = 14000;

export default function Dogfight() {
  const [on, setOn] = useState(false);
  const wrapR = useRef<HTMLDivElement | null>(null);
  const wrapU = useRef<HTMLDivElement | null>(null);
  const botR = useRef<MascotHandle | null>(null);
  const botU = useRef<MascotHandle | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);

  // scheduler
  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    let t: number | null = null;
    const next = (delay: number) => {
      t = window.setTimeout(() => setOn(true), delay);
    };
    next(25000 + Math.random() * 20000);
    const onDone = () => next(70000 + Math.random() * 60000);
    window.addEventListener("dogfight:done", onDone);
    return () => {
      if (t) window.clearTimeout(t);
      window.removeEventListener("dogfight:done", onDone);
    };
  }, []);

  // the scene
  useEffect(() => {
    const r = wrapR.current;
    const u = wrapU.current;
    const cv = canvas.current;
    if (!on || !r || !u || !cv) return;
    const { gsap } = registerGsap();
    const ctx = cv.getContext("2d")!;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const start = performance.now();
    const missiles: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    const zaps: { x1: number; y1: number; x2: number; y2: number; a: number }[] = [];
    const bombs: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    let lastBomb = 0;
    const embers: { x: number; y: number; a: number; r: number }[] = [];
    const waves: { x: number; y: number; r: number; a: number }[] = [];
    let lastShot = 0;
    let lastZap = 0;

    // positions are tracked in plain numbers and written with gsap.set
    const R = { x: -120, y: H * 0.6, vx: 0, vy: 0, heading: Math.PI / 2 };
    const U = { x: W + 120, y: H * 0.3, tx: W * 0.6, ty: H * 0.3 };
    let leaving = false;

    const centre = (el: HTMLElement) => {
      const b = el.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    };
    const nose = () => {
      const c = centre(r);
      return { x: c.x + Math.sin(R.heading) * 30, y: c.y - Math.cos(R.heading) * 30 };
    };

    gsap.set(r, { x: R.x, y: R.y, rotation: 90 });
    gsap.set(u, { x: U.x, y: U.y });
    gsap.to(u, { x: U.tx, y: U.ty, duration: 1.6, ease: "power2.out" });

    const pickUfoTarget = () => {
      U.tx = W * (0.15 + Math.random() * 0.7);
      U.ty = H * (0.1 + Math.random() * 0.55);
      gsap.to(u, {
        x: U.tx, y: U.ty, duration: 2 + Math.random() * 1.5, ease: "sine.inOut",
        onComplete: () => { if (!leaving) pickUfoTarget(); },
      });
    };
    gsap.delayedCall(1.6, pickUfoTarget);

    const tick = () => {
      const now = performance.now();
      const t = now - start;
      ctx.clearRect(0, 0, W, H);

      const uc = centre(u);
      const rc = centre(r);

      // ---- rocket: steer toward a point trailing the saucer, with lag ----
      if (!leaving) {
        const goal = { x: uc.x - 160 + Math.sin(t / 900) * 120, y: uc.y + 140 + Math.cos(t / 700) * 90 };
        const ax = (goal.x - R.x) * 0.0022;
        const ay = (goal.y - R.y) * 0.0022;
        R.vx = (R.vx + ax) * 0.965;
        R.vy = (R.vy + ay) * 0.965;
        R.x += R.vx;
        R.y += R.vy;
        const sp = Math.hypot(R.vx, R.vy);
        if (sp > 0.4) {
          const target = Math.atan2(R.vy, R.vx) + Math.PI / 2;
          let d = target - R.heading;
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          R.heading += d * 0.12;
        }
        gsap.set(r, { x: R.x, y: R.y, rotation: (R.heading * 180) / Math.PI });
      }

      // ---- rocket fires ----
      if (!leaving && now - lastShot > 2600) {
        lastShot = now;
        const p = nose();
        missiles.push({ x: p.x, y: p.y, vx: Math.sin(R.heading) * 5, vy: -Math.cos(R.heading) * 5, life: 200 });
        botR.current?.express("angry", 800);
      }
      for (let i = missiles.length - 1; i >= 0; i--) {
        const m = missiles[i];
        const dx = uc.x - m.x, dy = uc.y - m.y;
        const d = Math.hypot(dx, dy) || 1;
        m.vx += (dx / d) * 0.4; m.vy += (dy / d) * 0.4;
        const sp = Math.hypot(m.vx, m.vy);
        if (sp > 10) { m.vx = (m.vx / sp) * 10; m.vy = (m.vy / sp) * 10; }
        m.x += m.vx; m.y += m.vy; m.life -= 1;
        ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 3; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(m.x - m.vx * 2.2, m.y - m.vy * 2.2); ctx.lineTo(m.x, m.y); ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(m.x, m.y, 2.2, 0, Math.PI * 2); ctx.fill();
        embers.push({ x: m.x - m.vx, y: m.y - m.vy, a: 0.7, r: 1.5 + Math.random() * 1.5 });
        if (d < 36 || m.life <= 0) {
          missiles.splice(i, 1);
          if (d < 36) {
            waves.push({ x: uc.x, y: uc.y, r: 8, a: 1 });
            botU.current?.express("dizzy", 1500);
            gsap.to(u, { rotation: "+=360", duration: 0.9, ease: "power2.out" });
            botR.current?.express("cheeky", 1000);
          }
        }
      }

      // ---- saucer drops a bomb every ~3.5s ----
      if (!leaving && now - lastBomb > 3500 && t > 1800) {
        lastBomb = now;
        bombs.push({ x: uc.x, y: uc.y + 26, vx: (Math.random() - 0.5) * 2, vy: 3, life: 220 });
        botU.current?.express("smug", 800);
      }
      // ---- saucer bombs: green orbs that home on the rocket ----
      for (let i = bombs.length - 1; i >= 0; i--) {
        const b = bombs[i];
        const dx = rc.x - b.x, dy = rc.y - b.y;
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
            waves.push({ x: rc.x, y: rc.y, r: 8, a: 1 });
            botR.current?.express("dizzy", 1400);
            gsap.to(r, { rotation: "+=360", duration: 0.8, ease: "power2.out", onComplete: () => { gsap.set(r, { rotation: (R.heading * 180) / Math.PI }); } });
            botU.current?.express("laugh", 1000);
          }
        }
      }

      // ---- saucer zaps back ----
      if (!leaving && now - lastZap > 4200 && t > 2500) {
        lastZap = now;
        zaps.push({ x1: uc.x, y1: uc.y + 20, x2: rc.x, y2: rc.y, a: 1 });
        botU.current?.express("angry", 800);
        if (Math.random() < 0.55) {
          window.setTimeout(() => {
            botR.current?.express("dizzy", 1400);
            gsap.to(r, { rotation: "+=360", duration: 0.8, ease: "power2.out", onComplete: () => { gsap.set(r, { rotation: (R.heading * 180) / Math.PI }); } });
            waves.push({ x: rc.x, y: rc.y, r: 6, a: 0.8 });
          }, 120);
        } else {
          botR.current?.express("cheeky", 900);
        }
      }
      for (let i = zaps.length - 1; i >= 0; i--) {
        const z = zaps[i];
        z.a *= 0.86;
        ctx.strokeStyle = `rgba(74,222,128,${z.a})`; ctx.lineWidth = 3; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(z.x1, z.y1); ctx.lineTo(z.x2, z.y2); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${z.a * 0.8})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(z.x1, z.y1); ctx.lineTo(z.x2, z.y2); ctx.stroke();
        if (z.a < 0.04) zaps.splice(i, 1);
      }

      // ---- rings + embers ----
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i];
        w.r += 9; w.a *= 0.94;
        ctx.strokeStyle = `rgba(253,224,71,${w.a * 0.7})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2); ctx.stroke();
        if (w.a < 0.03) waves.splice(i, 1);
      }
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.a *= 0.92; e.r *= 0.97; e.y += 0.3;
        ctx.globalAlpha = e.a;
        ctx.fillStyle = e.a > 0.5 ? "#fde68a" : "#fb923c";
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
        if (e.a < 0.03) embers.splice(i, 1);
      }
      ctx.globalAlpha = 1;

      // ---- time's up: both leave ----
      if (!leaving && t > DURATION) {
        leaving = true;
        gsap.killTweensOf(u);
        botU.current?.express("scared", 1500);
        botR.current?.express("laugh", 1500);
        gsap.to(u, { x: W + 200, y: -200, duration: 1.4, ease: "power2.in" });
        gsap.to(r, { x: W + 200, y: -120, rotation: 45, duration: 1.7, ease: "power2.in", delay: 0.3,
          onComplete: () => {
            setOn(false);
            window.dispatchEvent(new Event("dogfight:done"));
          } });
      }
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      gsap.killTweensOf([r, u]);
    };
  }, [on]);

  if (!on) return null;

  return (
    <>
      <canvas ref={canvas} aria-hidden className="pointer-events-none fixed inset-0 z-[5] h-full w-full" />
      <div ref={wrapU} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[5] -ml-11 -mt-12">
        <Mascot ref={botU} variant="ufo" size={92} trackCursor={false} antics={false} />
      </div>
      <div ref={wrapR} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[5] -ml-9 -mt-11">
        <Mascot ref={botR} variant="rocket" size={76} trackCursor={false} antics={false} />
      </div>
    </>
  );
}
