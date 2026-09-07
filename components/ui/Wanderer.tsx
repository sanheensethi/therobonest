"use client";

import { useEffect, useRef, useState } from "react";
import Mascot, { type MascotHandle, type Variant, type Expression } from "@/components/ui/Mascot";
import { registerGsap, prefersReducedMotion } from "@/lib/motion";

/**
 * The other lab robots occasionally wander across the bottom of the viewport,
 * treating the bottom edge as the ground. Sometimes one; sometimes two or
 * three turn up from opposite sides, meet in the middle and squabble - angry
 * faces, shoving, sparks - then make up and leave.
 *
 * Deliberately rare (a few visits per page view), never in the first seconds,
 * never for reduced-motion users. They sit under the floating buttons so they
 * cannot block a task; hovering surprises one, a click makes it celebrate.
 *
 * Nesty (the mascot) is ONE character. These are its lab-mates.
 */
const OTHERS: Variant[] = ["drone", "crane", "rover", "ufo", "sparky", "bolt", "pixel"];
/** These never touch the floor: they cross at a random height on a wavy path. */
const FLIERS: Variant[] = ["drone", "ufo"];
const GROUND = OTHERS.filter((v) => !FLIERS.includes(v));
const FACES: Expression[] = ["neutral", "happy", "thinking", "surprised", "cool", "cheeky"];
const MAX_VISITS = 10;

type Bot = { variant: Variant; face: Expression; fromLeft: boolean };
type Visit = { key: number; bots: Bot[] };

function pick<T>(arr: T[], not?: T): T {
  const pool = not ? arr.filter((x) => x !== not) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function Wanderer() {
  const [visit, setVisit] = useState<Visit | null>(null);
  const wraps = useRef<(HTMLDivElement | null)[]>([]);
  const bots = useRef<(MascotHandle | null)[]>([]);

  // Scheduler: solo walk or a group scene, bounded per page view.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let count = 0;
    let t: number | null = null;
    const next = (delay: number) => {
      t = window.setTimeout(() => {
        if (count >= MAX_VISITS) return;
        count += 1;
        const n = Math.random() < 0.45 ? 1 : Math.random() < 0.6 ? 2 : 3;
        const list: Bot[] = [];
        for (let i = 0; i < n; i++) {
          list.push({
            // groups squabble on the floor, so groups are ground robots only
            variant: pick(GROUND, list[0]?.variant),
            face: pick(FACES),
            // groups arrive from both sides so they can meet
            fromLeft: n === 1 ? Math.random() > 0.5 : i % 2 === 0,
          });
        }
        setVisit({ key: Date.now(), bots: list });
      }, delay);
    };
    next(9000 + Math.random() * 6000);
    const onDone = () => next(35000 + Math.random() * 40000);
    window.addEventListener("wanderer:done", onDone);
    return () => {
      if (t) window.clearTimeout(t);
      window.removeEventListener("wanderer:done", onDone);
    };
  }, []);

  /**
   * Fliers (drone, UFO) run on their OWN clock, independent of the ground
   * scenes, so one is in the air most of the time. Each flight is a random
   * path: enter from any edge, wander through 3-4 waypoints with a sine bob,
   * a barrel-roll or a hover-and-look now and then, leave from another edge.
   */
  const [flight, setFlight] = useState<{ key: number; variant: Variant } | null>(null);
  const flierWrap = useRef<HTMLDivElement | null>(null);
  const flierBot = useRef<MascotHandle | null>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let t: number | null = null;
    const next = (delay: number) => {
      t = window.setTimeout(() => setFlight({ key: Date.now(), variant: pick(FLIERS) }), delay);
    };
    next(14000 + Math.random() * 8000);
    const onDone = () => next(30000 + Math.random() * 40000);
    window.addEventListener("flier:done", onDone);
    return () => {
      if (t) window.clearTimeout(t);
      window.removeEventListener("flier:done", onDone);
    };
  }, []);

  useEffect(() => {
    const el = flierWrap.current;
    if (!flight || !el) return;
    const { gsap } = registerGsap();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const size = vw < 640 ? 60 : 84;
    // random entry / exit edges (never the same one)
    const edges = ["left", "right", "top"] as const;
    const from = edges[Math.floor(Math.random() * edges.length)];
    const to = pick(edges.filter((e) => e !== from) as unknown as string[]) as (typeof edges)[number];
    const edgePoint = (e: (typeof edges)[number]) =>
      e === "left"
        ? { x: -size * 1.5, y: vh * (0.15 + Math.random() * 0.5) }
        : e === "right"
          ? { x: vw + size * 0.5, y: vh * (0.15 + Math.random() * 0.5) }
          : { x: vw * (0.1 + Math.random() * 0.8), y: -size * 1.5 };
    const start = edgePoint(from);
    const end = edgePoint(to);
    // 3-4 waypoints across the middle band of the screen
    const n = 3 + Math.floor(Math.random() * 2);
    const pts = Array.from({ length: n }, (_, i) => ({
      x: start.x + ((end.x - start.x) * (i + 1)) / (n + 1) + (Math.random() - 0.5) * vw * 0.2,
      y: vh * (0.12 + Math.random() * 0.55),
    }));

    const ctx = gsap.context(() => {
      gsap.set(el, { x: start.x, y: start.y, opacity: 1, scaleX: end.x > start.x ? 1 : -1 });
      gsap.to(el.querySelector("[data-body]"), { y: -12, duration: 1.3, yoyo: true, repeat: -1, ease: "sine.inOut" });
      const tl = gsap.timeline({
        onComplete: () => {
          setFlight(null);
          window.dispatchEvent(new Event("flier:done"));
        },
      });
      pts.forEach((p, i) => {
        tl.to(el, { x: p.x, y: p.y, duration: 2.2 + Math.random() * 1.2, ease: "sine.inOut" });
        // now and then: a hover-and-look, a wave, or a barrel roll
        const r = Math.random();
        if (r < 0.3) tl.call(() => flierBot.current?.express("surprised", 900)).to({}, { duration: 0.9 });
        else if (r < 0.5) tl.call(() => flierBot.current?.wave()).to({}, { duration: 1 });
        else if (r < 0.65 && i < pts.length - 1) tl.to(el, { rotation: 360, duration: 0.8, ease: "power2.inOut" }).set(el, { rotation: 0 });
        // face the direction of travel
        const nx = i < pts.length - 1 ? pts[i + 1].x : end.x;
        tl.set(el, { scaleX: nx > p.x ? 1 : -1 });
      });
      tl.to(el, { x: end.x, y: end.y, duration: 2.4, ease: "sine.in" });
    }, el);
    return () => ctx.revert();
  }, [flight]);

  // A stray missile from the dogfight can land on a ground robot.
  useEffect(() => {
    const onHit = (e: Event) => {
      const i = (e as CustomEvent<{ index: number }>).detail?.index;
      const m = bots.current[i];
      const el = wraps.current[i];
      if (!m || !el) return;
      m.walk(false);
      m.express("dizzy", 1600);
      const { gsap } = registerGsap();
      gsap.timeline()
        .to(el.querySelector("[data-body]"), { rotation: 360, transformOrigin: "50% 60%", duration: 0.8, ease: "power2.out" })
        .set(el.querySelector("[data-body]"), { rotation: 0 })
        .call(() => m.walk(true));
    };
    window.addEventListener("robot:hit", onHit);
    return () => window.removeEventListener("robot:hit", onHit);
  }, []);

  // The scene.
  useEffect(() => {
    if (!visit) return;
    const els = wraps.current.slice(0, visit.bots.length);
    if (els.some((e) => !e)) return;
    const { gsap } = registerGsap();
    const vw = window.innerWidth;
    const size = vw < 640 ? 64 : 88;
    const n = visit.bots.length;
    const centre = vw * (0.3 + Math.random() * 0.4);
    // meeting slots, spaced so they touch but do not overlap
    const slots = visit.bots.map((_, i) => centre + (i - (n - 1) / 2) * size * 0.95);

    const ctx = gsap.context(() => {
      const master = gsap.timeline({
        onComplete: () => {
          setVisit(null);
          window.dispatchEvent(new Event("wanderer:done"));
        },
      });

      // walk (or fly) in
      const vh = window.innerHeight;
      visit.bots.forEach((b, i) => {
        const el = els[i]!;
        const fly = FLIERS.includes(b.variant);
        const startX = b.fromLeft ? -size * 1.5 : vw + size * 0.5;
        // fliers cross somewhere between a quarter and three quarters up the screen
        const alt = fly ? -vh * (0.25 + Math.random() * 0.5) : 0;
        gsap.set(el, { x: startX, y: alt, scaleX: b.fromLeft ? 1 : -1, opacity: 1 });
        if (fly) {
          // slow wave + tilt, and a random drift up or down across the trip
          gsap.to(el.querySelector("[data-body]"), { y: -14, duration: 1.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
          gsap.to(el.querySelector("[data-body]"), { rotation: b.fromLeft ? 6 : -6, transformOrigin: "50% 50%", duration: 1.1, yoyo: true, repeat: -1, ease: "sine.inOut" });
          master.to(el, { y: alt + (Math.random() - 0.5) * vh * 0.3, duration: 4 + Math.random() * 1.5, ease: "sine.inOut" }, 0);
        } else {
          gsap.to(el.querySelector("[data-body]"), { y: -6, duration: 0.28, yoyo: true, repeat: -1, ease: "sine.inOut" });
          bots.current[i]?.walk(true);
        }
        master.to(el, { x: slots[i] - size / 2, duration: 4 + Math.random() * 1.5, ease: "none" }, 0);
      });

      // arrive: stop walking, face the middle
      master.call(() => {
        visit.bots.forEach((_, i) => {
          bots.current[i]?.walk(false);
          const faceLeft = slots[i] > centre;
          gsap.set(els[i], { scaleX: n === 1 ? 1 : faceLeft ? -1 : 1 });
        });
      });

      if (n === 1) {
        // solo: a little performance for the visitor
        master
          .call(() => {
            const m = bots.current[0];
            if (!m) return;
            const r = Math.random();
            if (r < 0.25) m.wave();
            else if (r < 0.45) m.skit("experiment");
            else if (r < 0.6) m.skit("gift");
            else if (r < 0.75) m.skit("dance");
            else if (r < 0.9) m.skit("giggle");
            else m.celebrate();
          })
          .to({}, { duration: 3.4 });
      } else {
        // the squabble
        master
          .call(() => {
            visit.bots.forEach((_, i) => bots.current[i]?.express("surprised", 900));
          })
          .to({}, { duration: 0.9 })
          .call(() => {
            visit.bots.forEach((_, i) => bots.current[i]?.express("angry", 2600));
          });
        // shove each other three times - each lunges toward the centre
        for (let k = 0; k < 3; k++) {
          const label = `shove${k}`;
          master.addLabel(label);
          visit.bots.forEach((_, i) => {
            const dir = slots[i] < centre ? 1 : slots[i] > centre ? -1 : k % 2 ? 1 : -1;
            master
              .to(els[i], { x: `+=${dir * 10}`, duration: 0.12, ease: "power2.out" }, label)
              .to(els[i], { x: `-=${dir * 10}`, duration: 0.22, ease: "bounce.out" }, `${label}+=0.12`);
          });
          master.to({}, { duration: 0.45 });
        }
        // sparks: everyone's confetti, ends the fight
        master
          .call(() => {
            visit.bots.forEach((_, i) => bots.current[i]?.celebrate());
          })
          .to({}, { duration: 1.2 })
          // one of them giggles and they make up
          .call(() => {
            bots.current[Math.floor(Math.random() * n)]?.skit("giggle");
            visit.bots.forEach((_, i) => bots.current[i]?.express("happy", 2000));
          })
          .to({}, { duration: 2 });
      }

      // leave, each the way it came
      master.call(() => {
        visit.bots.forEach((b, i) => {
          gsap.set(els[i], { scaleX: b.fromLeft ? 1 : -1 });
          bots.current[i]?.walk(true);
        });
      });
      master.addLabel("leave");
      visit.bots.forEach((b, i) => {
        const endX = b.fromLeft ? vw + size * 0.5 : -size * 1.5;
        master.to(els[i], { x: endX, duration: 4.5 + Math.random() * 1.5, ease: "none" }, "leave");
      });
    });

    return () => ctx.revert();
  }, [visit]);

  if (!visit && !flight) return null;

  return (
    <>
      {flight && (
        <div
          key={flight.key}
          ref={flierWrap}
          aria-hidden
          className="fixed left-0 top-0 z-[5] opacity-0"
          style={{ transformOrigin: "50% 50%" }}
        >
          <Mascot
            ref={flierBot}
            variant={flight.variant}
            size={typeof window !== "undefined" && window.innerWidth < 640 ? 60 : 84}
            trackCursor
            antics={false}
          />
        </div>
      )}
      {visit?.bots.map((b, i) => (
        <div
          key={`${visit.key}-${i}`}
          ref={(el) => {
            wraps.current[i] = el;
          }}
          aria-hidden
          data-wanderer={i}
          className="fixed bottom-0 left-0 z-30 opacity-0"
          style={{ transformOrigin: "50% 100%" }}
        >
          <Mascot
            ref={(m) => {
              bots.current[i] = m;
            }}
            variant={b.variant}
            expression={b.face}
            size={typeof window !== "undefined" && window.innerWidth < 640 ? 64 : 88}
            trackCursor
            antics={false}
          />
        </div>
      ))}
    </>
  );
}
