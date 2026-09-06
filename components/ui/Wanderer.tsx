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
const OTHERS: Variant[] = ["puppy", "crane", "rover", "ufo", "sparky", "bolt", "pixel"];
const FACES: Expression[] = ["neutral", "happy", "thinking", "surprised", "cool", "cheeky"];
const MAX_VISITS = 8;

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
            variant: pick(OTHERS, list[0]?.variant),
            face: pick(FACES),
            // groups arrive from both sides so they can meet
            fromLeft: n === 1 ? Math.random() > 0.5 : i % 2 === 0,
          });
        }
        setVisit({ key: Date.now(), bots: list });
      }, delay);
    };
    next(5000 + Math.random() * 5000);
    const onDone = () => next(20000 + Math.random() * 25000);
    window.addEventListener("wanderer:done", onDone);
    return () => {
      if (t) window.clearTimeout(t);
      window.removeEventListener("wanderer:done", onDone);
    };
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

      // walk in
      visit.bots.forEach((b, i) => {
        const el = els[i]!;
        const startX = b.fromLeft ? -size * 1.5 : vw + size * 0.5;
        gsap.set(el, { x: startX, scaleX: b.fromLeft ? 1 : -1, opacity: 1 });
        gsap.to(el.querySelector("[data-body]"), { y: -6, duration: 0.28, yoyo: true, repeat: -1, ease: "sine.inOut" });
        bots.current[i]?.walk(true);
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

  if (!visit) return null;

  return (
    <>
      {visit.bots.map((b, i) => (
        <div
          key={`${visit.key}-${i}`}
          ref={(el) => {
            wraps.current[i] = el;
          }}
          aria-hidden
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
