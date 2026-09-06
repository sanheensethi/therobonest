"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { registerGsap, prefersReducedMotion } from "@/lib/motion";

/**
 * Robonest's robot mascots, drawn as inline SVG and driven by GSAP.
 *
 * Vector on purpose. A generated video clip cannot keep a character
 * consistent between shots, weighs megabytes, and cannot respond to anything.
 * ~15KB of SVG stays identical everywhere it appears, is sharp on a school
 * projector, and - the point - the character becomes code, so it can react to
 * what the visitor does.
 *
 * Two axes:
 *   variant    - WHICH robot (shape + palette). Same rig, different shell.
 *   expression - what its FACE is doing. Eyes, brows and mouth are data, so a
 *                new expression is a new row in EXPRESSIONS, not new markup.
 *
 * Behaviour is exposed through a ref rather than props: "look at this field",
 * "celebrate", "make a face for a second" are one-off events, not state a
 * parent should have to hold and reset.
 */
export type Variant = "nesty" | "sparky" | "bolt" | "pixel" | "puppy" | "crane" | "rover" | "ufo" | "drone";

export type Expression =
  | "neutral"
  | "happy"
  | "surprised"
  | "thinking"
  | "sad"
  | "wink"
  | "sleepy"
  | "love"
  | "giggle"
  | "cool"
  | "dizzy"
  | "proud"
  | "cheeky"
  | "angry"
  | "laugh"
  | "shy"
  | "confused"
  | "scared"
  | "excited"
  | "bored"
  | "smug"
  | "kiss";

/** Little performances with props. Each runs 2-4s and cleans up after itself. */
export type Skit = "giggle" | "hearts" | "gift" | "experiment" | "dance" | "spin";

export type MascotHandle = {
  /** Point the eyes at an element (or viewport point). null = free-look. */
  lookAt: (target: Element | { x: number; y: number } | null) => void;
  /** Arms up, jump, confetti. Used on successful form submit. */
  celebrate: () => void;
  /** One arm waves. */
  wave: () => void;
  /** Show an expression; with `ms` it reverts to the prop afterwards. */
  express: (e: Expression, ms?: number) => void;
  /** Run a prop performance: lab experiment, gift, hearts, dance... */
  skit: (name: Skit) => void;
  /** Start / stop the walk cycle (legs swing, body bobs, wheels roll). */
  walk: (on: boolean) => void;
};

type Props = {
  /** Rendered width in px. Height follows the 120x140 viewBox. */
  size?: number;
  variant?: Variant;
  expression?: Expression;
  /** Follow the cursor when not explicitly looking at something. */
  trackCursor?: boolean;
  /** Arms out, head tilted - for empty states. Pairs well with "sad". */
  shrug?: boolean;
  /** @deprecated use expression / shrug. Kept so older call sites still work. */
  mood?: "idle" | "happy" | "shrug";
  className?: string;
  /** Decorative by default; pass a label to expose it to screen readers. */
  label?: string;
  /** Hover -> surprised, click -> celebrate. On by default. */
  interactive?: boolean;
  /** Random idle antics (wink, doze, wave...) on its own timer. On by default. */
  antics?: boolean;
  /** Static pose with a prop: reading, stargazing, winning, typing, a placard. */
  holding?: "book" | "telescope" | "trophy" | "laptop" | "sign";
  /** Text on the placard when holding="sign". */
  signText?: string;
};

// The pupil may travel this far (in SVG units) from the eye centre.
const PUPIL_RANGE = 4.2;
const VIEW_W = 120;

/* ------------------------------------------------------------------ */
/* Variants: shell geometry + palette. Eyes stay at (47,53) and (73,53) */
/* in every variant so the tracking maths never changes.               */
/* ------------------------------------------------------------------ */
const VARIANTS: Record<
  Variant,
  {
    from: string;
    to: string;
    accent: string;
    /** head shell */
    head: { x: number; y: number; w: number; h: number; r: number };
    /** face plate inset */
    face: { x: number; y: number; w: number; h: number; r: number };
    /** ear blocks */
    earR: number;
    antenna: "single" | "double" | "side" | "none";
    torsoR: number;
    /** chest ornament */
    chest: "lights" | "screen" | "bolt" | "heart";
    /** Body plan. Biped is the default rig; the others swap torso + limbs. */
    body?: "biped" | "puppy" | "crane" | "rover" | "ufo" | "drone";
  }
> = {
  nesty: {
    from: "#38bdf8", to: "#8b5cf6", accent: "#38bdf8",
    head: { x: 22, y: 22, w: 76, h: 62, r: 22 },
    face: { x: 29, y: 30, w: 62, h: 46, r: 17 },
    earR: 4, antenna: "single", torsoR: 16, chest: "lights",
  },
  sparky: {
    from: "#fb923c", to: "#f43f5e", accent: "#fbbf24",
    head: { x: 24, y: 24, w: 72, h: 58, r: 10 },
    face: { x: 31, y: 31, w: 58, h: 44, r: 8 },
    earR: 2, antenna: "side", torsoR: 10, chest: "screen",
  },
  bolt: {
    from: "#34d399", to: "#0ea5e9", accent: "#a7f3d0",
    head: { x: 27, y: 18, w: 66, h: 68, r: 30 },
    face: { x: 33, y: 28, w: 54, h: 50, r: 24 },
    earR: 6, antenna: "double", torsoR: 22, chest: "bolt",
  },
  pixel: {
    from: "#f472b6", to: "#8b5cf6", accent: "#fbcfe8",
    head: { x: 18, y: 26, w: 84, h: 56, r: 14 },
    face: { x: 25, y: 33, w: 70, h: 42, r: 10 },
    earR: 3, antenna: "none", torsoR: 12, chest: "heart",
  },
  // A robot puppy: floppy ears, four legs, wagging tail. Front legs are the
  // "arms" so wave() lifts a paw.
  puppy: {
    from: "#fbbf24", to: "#f97316", accent: "#7c2d12",
    head: { x: 26, y: 30, w: 68, h: 52, r: 26 },
    face: { x: 33, y: 37, w: 54, h: 38, r: 19 },
    earR: 8, antenna: "none", torsoR: 18, chest: "lights", body: "puppy",
  },
  // A little crane: cab for a head, tracks underneath, a boom with a hook
  // as the right arm so wave() swings the load.
  crane: {
    from: "#facc15", to: "#f59e0b", accent: "#1f2937",
    head: { x: 26, y: 26, w: 68, h: 56, r: 8 },
    face: { x: 33, y: 33, w: 54, h: 40, r: 6 },
    earR: 2, antenna: "none", torsoR: 6, chest: "screen", body: "crane",
  },
  // An RC car: the face is the windscreen, wheels spin while it drives.
  rover: {
    from: "#f43f5e", to: "#dc2626", accent: "#fef2f2",
    head: { x: 30, y: 40, w: 60, h: 40, r: 12 },
    face: { x: 36, y: 46, w: 48, h: 28, r: 8 },
    earR: 6, antenna: "single", torsoR: 10, chest: "lights", body: "rover",
  },
  // A flying saucer: the head is the dome, a lit disc underneath, no legs -
  // it hovers, tilts when it "walks", and its ring lights chase.
  // A quadcopter: the head is the fuselage, four arms with spinning rotors,
  // a camera gimbal underneath. Hovers; never touches the ground.
  drone: {
    from: "#fb7185", to: "#f97316", accent: "#fff1f2",
    head: { x: 28, y: 34, w: 64, h: 46, r: 16 },
    face: { x: 35, y: 41, w: 50, h: 32, r: 12 },
    earR: 3, antenna: "none", torsoR: 8, chest: "lights", body: "drone",
  },
  ufo: {
    from: "#a78bfa", to: "#22d3ee", accent: "#e9d5ff",
    head: { x: 30, y: 30, w: 60, h: 50, r: 26 },
    face: { x: 36, y: 37, w: 48, h: 36, r: 18 },
    earR: 4, antenna: "single", torsoR: 10, chest: "lights", body: "ufo",
  },
};

/* ------------------------------------------------------------------ */
/* Expressions: pure data. `pupils: false` swaps the pupil for a shape. */
/* Eye centres: L (47,53), R (73,53). Mouth centred at x=60, y~66.      */
/* ------------------------------------------------------------------ */
type Face = {
  pupils: boolean;
  pupilR?: number;
  eyeScaleY?: [number, number];
  /** Replacement for the pupil when pupils=false: path relative to eye centre */
  eyeShape?: string;
  browL?: string;
  browR?: string;
  /** Fill for eyeShape (default: none/stroke; hearts are red). */
  eyeFill?: string;
  mouth: string;
  mouthFill?: boolean;
  /** Small extra: blush / sweat / hearts / tongue / steam / punctuation */
  extra?: "blush" | "zzz" | "drop" | "hearts" | "tongue" | "steam" | "??" | "!!";
};

const EXPRESSIONS: Record<Expression, Face> = {
  neutral: {
    pupils: true, pupilR: 4.6,
    mouth: "M51 66 Q60 72 69 66",
  },
  happy: {
    pupils: false,
    eyeShape: "M-7 2 Q0 -7 7 2", // upturned arcs
    mouth: "M48 64 Q60 77 72 64",
    extra: "blush",
  },
  surprised: {
    pupils: true, pupilR: 3.2, eyeScaleY: [1.25, 1.25],
    browL: "M39 39 Q47 34 55 39", browR: "M65 39 Q73 34 81 39",
    mouth: "M56 66 a4 4.5 0 1 0 8 0 a4 4.5 0 1 0 -8 0", mouthFill: true,
  },
  thinking: {
    pupils: true, pupilR: 4, eyeScaleY: [0.7, 1],
    browL: "M39 41 L55 44", browR: "M65 38 Q73 34 81 40",
    mouth: "M52 68 Q60 65 68 69",
  },
  sad: {
    pupils: true, pupilR: 4.6,
    browL: "M39 41 Q47 39 55 44", browR: "M65 44 Q73 39 81 41",
    mouth: "M51 70 Q60 63 69 70",
    extra: "drop",
  },
  wink: {
    pupils: true, pupilR: 4.6, eyeScaleY: [1, 0.08],
    mouth: "M50 64 Q60 76 70 66",
  },
  sleepy: {
    pupils: true, pupilR: 4.6, eyeScaleY: [0.18, 0.18],
    mouth: "M56 67 a4 3 0 1 0 8 0 a4 3 0 1 0 -8 0", mouthFill: true,
    extra: "zzz",
  },
  love: {
    pupils: false,
    eyeShape: "M0 4 C-8 -3 -6 -9 0 -5 C6 -9 8 -3 0 4Z", // heart
    eyeFill: "#f43f5e",
    mouth: "M48 64 Q60 77 72 64",
    extra: "hearts",
  },
  giggle: {
    pupils: false,
    eyeShape: "M-7 1 Q0 -8 7 1", // squeezed shut
    mouth: "M47 63 Q60 82 73 63 Z", mouthFill: true,
    extra: "blush",
  },
  cool: {
    pupils: false,
    eyeShape: "M-10 -5 h20 v9 h-20 z", // shades
    eyeFill: "#0a1326",
    browL: "M56 50 L64 50", // the bridge of the glasses
    mouth: "M52 66 Q62 72 70 64",
  },
  dizzy: {
    pupils: false,
    eyeShape: "M-5 -5 L5 5 M5 -5 L-5 5",
    mouth: "M50 68 q5 -4 10 0 t10 0",
    extra: "steam",
  },
  proud: {
    pupils: false,
    eyeShape: "M-7 0 Q0 -6 7 0",
    browL: "M39 40 Q47 36 55 40", browR: "M65 40 Q73 36 81 40",
    mouth: "M52 66 Q62 72 70 63",
    extra: "blush",
  },
  cheeky: {
    pupils: true, pupilR: 4.6, eyeScaleY: [1, 0.08],
    mouth: "M50 64 Q60 74 70 64",
    extra: "tongue",
  },
  angry: {
    pupils: true, pupilR: 3.4,
    browL: "M39 37 L55 44", browR: "M81 37 L65 44",
    mouth: "M51 70 Q60 64 69 70",
    extra: "steam",
  },
  laugh: {
    pupils: false,
    eyeShape: "M-7 1 Q0 -8 7 1",
    browL: "M39 38 Q47 34 55 38", browR: "M65 38 Q73 34 81 38",
    mouth: "M46 62 Q60 84 74 62 Z", mouthFill: true,
    extra: "blush",
  },
  shy: {
    pupils: true, pupilR: 4.2, eyeScaleY: [0.75, 0.75],
    mouth: "M54 68 Q60 71 66 68",
    extra: "blush",
  },
  confused: {
    pupils: true, pupilR: 4.2, eyeScaleY: [1, 0.7],
    browL: "M39 38 Q47 33 55 38", browR: "M65 44 L81 42",
    mouth: "M50 68 q4 -4 8 0 t8 0 t4 -3",
    extra: "??",
  },
  scared: {
    pupils: true, pupilR: 2.6, eyeScaleY: [1.3, 1.3],
    browL: "M39 36 Q47 32 55 37", browR: "M65 37 Q73 32 81 36",
    mouth: "M49 70 q3 -5 6 0 t6 0 t6 0 t4 -4",
    extra: "!!",
  },
  excited: {
    pupils: false,
    eyeShape: "M0 -7 L2 -2 L7 -2 L3 1 L4.5 6 L0 3 L-4.5 6 L-3 1 L-7 -2 L-2 -2 Z", // star
    eyeFill: "#fbbf24",
    mouth: "M47 63 Q60 80 73 63 Z", mouthFill: true,
    extra: "hearts",
  },
  bored: {
    pupils: true, pupilR: 4.2, eyeScaleY: [0.45, 0.45],
    mouth: "M52 68 L68 68",
  },
  smug: {
    pupils: true, pupilR: 3.8, eyeScaleY: [0.6, 0.6],
    browL: "M39 41 L55 39", browR: "M65 36 Q73 33 81 38",
    mouth: "M50 66 Q62 74 72 62",
  },
  kiss: {
    pupils: false,
    eyeShape: "M-7 0 Q0 -6 7 0",
    mouth: "M57 66 a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0", mouthFill: true,
    extra: "hearts",
  },
};

const Mascot = forwardRef<MascotHandle, Props>(function Mascot(
  {
    size = 120,
    variant = "nesty",
    expression: expressionProp,
    trackCursor = true,
    shrug: shrugProp,
    mood,
    className,
    label,
    interactive = true,
    antics = true,
    holding,
    signText = "Hi!",
  },
  ref
) {
  // Legacy mood -> new axes. With no expression given at all, each instance
  // picks its own resting face after mount, so two robots on one screen never
  // wear the same expression by default. (Effect, not render: SSR must match.)
  const [randomFace, setRandomFace] = useState<Expression | null>(null);
  useEffect(() => {
    if (expressionProp || mood) return;
    const pool: Expression[] = ["neutral", "happy", "cool", "proud", "cheeky", "wink", "thinking", "surprised", "smug", "excited", "shy", "laugh"];
    setRandomFace(pool[Math.floor(Math.random() * pool.length)]);
  }, [expressionProp, mood]);
  const baseExpression: Expression =
    expressionProp ?? (mood === "happy" ? "happy" : mood === "shrug" ? "sad" : randomFace ?? "neutral");
  const shrug = shrugProp ?? mood === "shrug";

  const root = useRef<SVGSVGElement | null>(null);
  const target = useRef<Element | { x: number; y: number } | null>(null);
  const cursor = useRef<{ x: number; y: number } | null>(null);
  const revert = useRef<number | null>(null);
  // click-to-cycle: each click shows the next expression in the list
  const clickIdx = useRef(0);
  // `base` is the resting face. It starts from the prop but the antics loop
  // may move it (a robot that always returns to the exact same face reads as
  // a sticker); `expression` is what is showing right now.
  const [base, setBase] = useState<Expression>(baseExpression);
  const [expression, setExpression] = useState<Expression>(baseExpression);
  const baseRef = useRef<Expression>(baseExpression);
  useEffect(() => {
    setBase(baseExpression);
    baseRef.current = baseExpression;
    setExpression(baseExpression);
  }, [baseExpression]);
  useEffect(() => {
    baseRef.current = base;
  }, [base]);

  function express(e: Expression, ms?: number) {
    if (revert.current) window.clearTimeout(revert.current);
    setExpression(e);
    if (ms) revert.current = window.setTimeout(() => setExpression(baseRef.current), ms);
  }

  useImperativeHandle(ref, () => ({
    lookAt: (t) => {
      target.current = t;
    },
    celebrate,
    wave,
    express,
    skit,
    walk,
  }));

  /* ---- eye tracking: pure geometry on every frame ---- */
  useEffect(() => {
    const svg = root.current;
    if (!svg) return;
    const { gsap } = registerGsap();
    const head = svg.querySelector<SVGElement>("[data-head]");
    if (prefersReducedMotion()) return;

    const onMove = (e: PointerEvent) => {
      cursor.current = { x: e.clientX, y: e.clientY };
    };
    if (trackCursor) window.addEventListener("pointermove", onMove, { passive: true });

    const tick = () => {
      const pupils = svg.querySelectorAll<SVGElement>("[data-pupil]");
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0) return;
      const scale = rect.width / VIEW_W;

      let pt: { x: number; y: number } | null = null;
      const t = target.current;
      if (t && "getBoundingClientRect" in t) {
        const r = (t as Element).getBoundingClientRect();
        pt = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      } else if (t) {
        pt = t as { x: number; y: number };
      } else if (trackCursor) {
        pt = cursor.current;
      }

      const cx = rect.left + 60 * scale;
      const cy = rect.top + 53 * scale;
      // Reading: eyes rest on the book unless something else grabs them.
      if (!pt && holding === "book") pt = { x: cx, y: rect.bottom + 30 * scale };

      let dx = 0;
      let dy = 0;
      if (pt) {
        const vx = (pt.x - cx) / scale;
        const vy = (pt.y - cy) / scale;
        const len = Math.hypot(vx, vy) || 1;
        const mag = Math.min(PUPIL_RANGE, len / 14);
        dx = (vx / len) * mag;
        dy = (vy / len) * mag;
      }
      if (pupils.length) gsap.to(pupils, { x: dx, y: dy, duration: 0.35, ease: "power2.out", overwrite: "auto" });
      if (head) gsap.to(head, { rotation: dx * 0.9, transformOrigin: "50% 100%", duration: 0.6, overwrite: "auto" });
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", onMove);
    };
  }, [trackCursor, holding]);

  /* ---- random antics so every placement is alive, not a sticker ---- */
  useEffect(() => {
    if (!antics || prefersReducedMotion()) return;
    const RESTING: Expression[] = ["neutral", "happy", "cool", "proud", "cheeky", "thinking", "smug", "shy", "bored", "excited"];
    // A reading robot keeps reading: faces only, no prop skits that would
    // fight the book in its hands.
    const acts: Array<() => void> = holding
      ? [
          () => express("thinking", 1800),
          () => express("surprised", 900),
          () => express("giggle", 1200),
          () => express("proud", 1500),
          () => express("sleepy", 2000),
        ]
      : [
      () => {
        const next = RESTING[Math.floor(Math.random() * RESTING.length)];
        setBase(next);
        setExpression(next);
      },
      () => express("wink", 900),
      () => express("surprised", 1100),
      () => express("thinking", 1600),
      () => express("sleepy", 2400),
      () => express("cool", 1800),
      () => express("proud", 1500),
      () => express("cheeky", 1200),
      () => express("dizzy", 1400),
      () => express("laugh", 1300),
      () => express("confused", 1500),
      () => express("scared", 1000),
      () => express("kiss", 1100),
      () => express("excited", 1400),
      () => wave(),
      () => skit("giggle"),
      () => skit("hearts"),
      () => skit("gift"),
      () => skit("experiment"),
      () => skit("dance"),
      () => skit("spin"),
    ];
    // first change comes quickly so a fresh page never shows the same face twice
    const first = window.setTimeout(() => acts[0](), 1500 + Math.random() * 2500);
    let t: number | null = null;
    const loop = () => {
      t = window.setTimeout(() => {
        acts[Math.floor(Math.random() * acts.length)]();
        loop();
      }, 6000 + Math.random() * 10000);
    };
    loop();
    return () => {
      window.clearTimeout(first);
      if (t) window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [antics, holding]);

  /* ---- idle life: float, blink, antenna glow, tail ---- */
  useEffect(() => {
    const svg = root.current;
    if (!svg || prefersReducedMotion()) return;
    const { gsap } = registerGsap();
    // Selector scoped to THIS robot. A bare string selector would match every
    // mascot on the page and make them all move in lockstep.
    const $ = gsap.utils.selector(svg);

    const ctx = gsap.context(() => {
      gsap.to($("[data-body]"), { y: -4, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to($("[data-antenna-tip]"), {
        opacity: 0.35, scale: 0.8, transformOrigin: "50% 50%",
        duration: 1.1, ease: "sine.inOut", yoyo: true, repeat: -1,
      });
      gsap.to($("[data-tail]"), {
        rotation: 18, transformOrigin: "0% 100%",
        duration: 0.35, ease: "sine.inOut", yoyo: true, repeat: -1,
      });
      gsap.to($("[data-ufo-light]"), {
        opacity: 0.25, duration: 0.35, stagger: { each: 0.12, repeat: -1, yoyo: true }, ease: "sine.inOut",
      });
      gsap.to($("[data-rotor] ellipse"), { scaleX: 0.15, transformOrigin: "50% 50%", duration: 0.08, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.to($("[data-beam]"), { opacity: 0.28, scaleX: 1.08, transformOrigin: "50% 0%", duration: 1.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
      // Poses: arm angles measured on the rig (left arm UP = positive).
      if (holding === "telescope") {
        gsap.set($("[data-arm-l]"), { rotation: -100, transformOrigin: "100% 15%" });
        gsap.set($("[data-arm-r]"), { rotation: -120, transformOrigin: "0% 15%" });
        gsap.set($("[data-prop-telescope]"), { opacity: 1 });
        gsap.set($("[data-head]"), { rotation: -10, transformOrigin: "50% 100%" });
        gsap.to($("[data-star]"), { opacity: 0.2, duration: 0.8, stagger: { each: 0.3, repeat: -1, yoyo: true }, ease: "sine.inOut" });
      }
      if (holding === "trophy") {
        gsap.set($("[data-arm-l]"), { rotation: 125, transformOrigin: "100% 15%" });
        gsap.set($("[data-arm-r]"), { rotation: -125, transformOrigin: "0% 15%" });
        gsap.set($("[data-prop-trophy]"), { opacity: 1 });
        gsap.to($("[data-prop-trophy] [data-shine]"), { opacity: 0, duration: 0.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
      }
      if (holding === "laptop") {
        gsap.set($("[data-arm-l]"), { rotation: -95, transformOrigin: "100% 15%" });
        gsap.set($("[data-arm-r]"), { rotation: 95, transformOrigin: "0% 15%" });
        gsap.set($("[data-prop-laptop]"), { opacity: 1 });
        // typing: the hands tap, the code lines flicker
        gsap.to($("[data-arm-l]"), { rotation: -90, duration: 0.12, yoyo: true, repeat: -1, ease: "sine.inOut" });
        gsap.to($("[data-arm-r]"), { rotation: 90, duration: 0.14, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 0.07 });
        gsap.to($("[data-prop-laptop] [data-code]"), { opacity: 0.3, duration: 0.35, stagger: { each: 0.2, repeat: -1, yoyo: true } });
      }
      if (holding === "sign") {
        gsap.set($("[data-arm-l]"), { rotation: 120, transformOrigin: "100% 15%" });
        gsap.set($("[data-arm-r]"), { rotation: -120, transformOrigin: "0% 15%" });
        gsap.set($("[data-prop-sign]"), { opacity: 1 });
        gsap.to($("[data-prop-sign]"), { rotation: 4, transformOrigin: "50% 100%", duration: 0.9, yoyo: true, repeat: -1, ease: "sine.inOut" });
      }
      // rover: headlights blink on and off
      gsap.to($("[data-headlight]"), { opacity: 0.15, duration: 0.5, yoyo: true, repeat: -1, ease: "steps(1)", stagger: 0.5 });
      if (holding === "book") {
        gsap.set($("[data-arm-l]"), { rotation: -100, transformOrigin: "100% 15%" });
        gsap.set($("[data-arm-r]"), { rotation: 100, transformOrigin: "0% 15%" });
        gsap.set($("[data-prop-book]"), { opacity: 1 });
        // a page turns now and then
        const flip = () => {
          gsap.fromTo($("[data-page]"), { scaleX: 1 }, {
            scaleX: -1, transformOrigin: "0% 50%", duration: 0.5, ease: "power2.inOut",
            onComplete: () => {
              gsap.delayedCall(2.5 + Math.random() * 4, flip);
            },
          });
        };
        gsap.delayedCall(2, flip);
      }
      if (shrug) {
        gsap.set($("[data-arm-l]"), { rotation: 70, transformOrigin: "100% 15%" });
        gsap.set($("[data-arm-r]"), { rotation: -70, transformOrigin: "0% 15%" });
        gsap.set($("[data-head]"), { rotation: -8, transformOrigin: "50% 100%" });
      }

      // Blink at irregular intervals so it reads as alive, not metronomic.
      // Skips while an expression already controls the lids (wink, sleepy).
      const blink = () => {
        if (!svg.dataset.lids) {
          gsap.to($("[data-eye]"), {
            scaleY: 0.08, transformOrigin: "50% 50%",
            duration: 0.07, yoyo: true, repeat: 1,
          });
        }
        gsap.delayedCall(1.8 + Math.random() * 3.2, blink);
      };
      gsap.delayedCall(1.2, blink);
    }, svg);

    return () => ctx.revert();
  }, [shrug, holding]);

  function celebrate() {
    const svg = root.current;
    if (!svg) return;
    const { gsap } = registerGsap();
    const $ = gsap.utils.selector(svg);
    express("happy", 3000);
    if (prefersReducedMotion()) return;

    const tl = gsap.timeline();
    // Arm pivots sit at the shoulder. In SVG (y down) the LEFT arm rises with a
    // POSITIVE rotation and the right arm with a NEGATIVE one - get the sign
    // wrong and the hands swing down behind the torso, which is exactly what
    // the first version did.
    tl.to($("[data-arm-l]"), { rotation: 120, transformOrigin: "100% 15%", duration: 0.35, ease: "back.out(2)" }, 0)
      .to($("[data-arm-r]"), { rotation: -120, transformOrigin: "0% 15%", duration: 0.35, ease: "back.out(2)" }, 0)
      // three hops: left, right, home - it travels, not just bounces in place
      .to($("[data-body]"), { y: -18, x: -22, duration: 0.3, ease: "power2.out" }, 0)
      .to($("[data-body]"), { y: 0, duration: 0.45, ease: "bounce.out" }, 0.3)
      .to($("[data-body]"), { y: -16, x: 22, duration: 0.3, ease: "power2.out" }, 0.8)
      .to($("[data-body]"), { y: 0, duration: 0.45, ease: "bounce.out" }, 1.1)
      .to($("[data-body]"), { y: -12, x: 0, rotation: 360, transformOrigin: "50% 60%", duration: 0.5, ease: "power2.out" }, 1.6)
      .to($("[data-body]"), { y: 0, duration: 0.4, ease: "bounce.out" }, 2.1)
      .set($("[data-body]"), { rotation: 0 })
      .to($("[data-arm-l]"), { rotation: 0, duration: 0.5, ease: "power2.inOut" }, 2.3)
      .to($("[data-arm-r]"), { rotation: 0, duration: 0.5, ease: "power2.inOut" }, 2.3);

    const bits = svg.querySelectorAll<SVGElement>("[data-confetti]");
    bits.forEach((b, i) => {
      const a = (i / bits.length) * Math.PI * 2 + Math.random() * 0.4;
      const d = 42 + Math.random() * 26;
      tl.fromTo(
        b,
        { x: 0, y: 0, opacity: 1, scale: 1 },
        { x: Math.cos(a) * d, y: Math.sin(a) * d - 20, opacity: 0, scale: 0.4, rotation: 240,
          duration: 0.9 + Math.random() * 0.3, ease: "power2.out" },
        0.1 + Math.random() * 0.1
      );
    });
  }

  function skit(name: Skit) {
    const svg = root.current;
    if (!svg || prefersReducedMotion()) return;
    const { gsap } = registerGsap();
    const $ = gsap.utils.selector(svg);
    const q = (sel: string) => svg.querySelectorAll<SVGElement>(sel);

    if (name === "giggle") {
      express("giggle", 1800);
      gsap.timeline()
        .to($("[data-body]"), { rotation: 4, x: 3, transformOrigin: "50% 100%", duration: 0.09, yoyo: true, repeat: 11, ease: "sine.inOut" })
        .set($("[data-body]"), { rotation: 0, x: 0 });
      return;
    }

    if (name === "hearts") {
      express("love", 2200);
      q("[data-heart]").forEach((h, i) => {
        gsap.fromTo(h,
          { x: 0, y: 0, opacity: 0, scale: 0.4 },
          { x: (i - 2) * 14 + (Math.random() * 10 - 5), y: -55 - Math.random() * 25, opacity: 1, scale: 1,
            duration: 1.6, delay: i * 0.15, ease: "power1.out",
            onComplete: () => { gsap.to(h, { opacity: 0, duration: 0.3 }); } });
      });
      return;
    }

    if (name === "gift") {
      express("happy", 2600);
      gsap.timeline()
        .to($("[data-arm-r]"), { rotation: -80, transformOrigin: "0% 15%", duration: 0.4, ease: "back.out(1.6)" })
        .to($("[data-prop-gift]"), { opacity: 1, scale: 1, transformOrigin: "50% 100%", duration: 0.3, ease: "back.out(2)" }, "-=0.1")
        .to($("[data-prop-gift]"), { y: -6, duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut" })
        .to($("[data-prop-gift]"), { opacity: 0, scale: 0.6, duration: 0.25 })
        .to($("[data-arm-r]"), { rotation: 0, duration: 0.4, ease: "power2.inOut" }, "-=0.1");
      return;
    }

    if (name === "experiment") {
      express("thinking", 1400);
      const tl = gsap.timeline();
      tl.to($("[data-arm-r]"), { rotation: -70, transformOrigin: "0% 15%", duration: 0.4, ease: "back.out(1.4)" })
        .to($("[data-prop-flask]"), { opacity: 1, scale: 1, transformOrigin: "50% 100%", duration: 0.3, ease: "back.out(2)" }, "-=0.1")
        .to($("[data-prop-flask]"), { rotation: -14, transformOrigin: "50% 90%", duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut" });
      q("[data-bubble]").forEach((b, i) => {
        tl.fromTo(b, { y: 0, opacity: 0, scale: 0.5 },
          { y: -18 - i * 5, opacity: 1, scale: 1, duration: 0.7, ease: "power1.out",
            onComplete: () => { gsap.set(b, { opacity: 0 }); } }, 0.8 + i * 0.18);
      });
      tl.call(() => express("surprised", 900), [], 1.7)
        // FIRE: flames roar out of the flask and flicker
        .fromTo($("[data-fire]"), { opacity: 0, scaleY: 0.2 }, { opacity: 1, scaleY: 1, duration: 0.18, ease: "back.out(2)" }, 1.7)
        .to($("[data-fire]"), { scaleY: 1.25, scaleX: 0.9, duration: 0.08, yoyo: true, repeat: 5, ease: "sine.inOut" }, 1.9)
        .to($("[data-fire]"), { opacity: 0, scaleY: 1.6, duration: 0.15 }, 2.05)
        // BOOM: soot-blackened face, a few blinks of white eyes, then it clears
        .to($("[data-soot]"), { opacity: 1, duration: 0.05 }, 2.1)
        .to($("[data-body]"), { y: -10, duration: 0.12, yoyo: true, repeat: 1 }, 2.1)
        .to($("[data-soot]"), { opacity: 0, duration: 0.6 }, 3.4);
      q("[data-confetti]").forEach((c, i) => {
        const a = (i / 14) * Math.PI * 2;
        tl.fromTo(c, { x: 34, y: -20, opacity: 1, scale: 1 },
          { x: 34 + Math.cos(a) * 30, y: -20 + Math.sin(a) * 30 - 10, opacity: 0, scale: 0.3,
            duration: 0.7, ease: "power2.out" }, 2.05 + Math.random() * 0.1);
      });
      tl.call(() => express("dizzy", 1300), [], 2.2)
        .call(() => express("giggle", 1500), [], 3.5)
        .to($("[data-prop-flask]"), { opacity: 0, scale: 0.6, duration: 0.25 }, 2.3)
        .to($("[data-arm-r]"), { rotation: 0, duration: 0.4, ease: "power2.inOut" }, 2.4);
      return;
    }

    if (name === "dance") {
      express("happy", 2400);
      gsap.timeline()
        .to($("[data-body]"), { rotation: 8, transformOrigin: "50% 100%", duration: 0.28, yoyo: true, repeat: 7, ease: "sine.inOut" }, 0)
        .to($("[data-arm-l]"), { rotation: 110, transformOrigin: "100% 15%", duration: 0.28, yoyo: true, repeat: 7, ease: "sine.inOut" }, 0)
        .to($("[data-arm-r]"), { rotation: -110, transformOrigin: "0% 15%", duration: 0.28, yoyo: true, repeat: 7, ease: "sine.inOut" }, 0.28)
        .to($("[data-body]"), { y: -8, duration: 0.28, yoyo: true, repeat: 7, ease: "sine.inOut" }, 0)
        .set($("[data-body]"), { rotation: 0, y: 0 })
        .set($("[data-arm-l], [data-arm-r]"), { rotation: 0 });
      return;
    }

    if (name === "spin") {
      express("dizzy", 1600);
      gsap.timeline()
        .to($("[data-body]"), { rotation: 360, transformOrigin: "50% 60%", duration: 0.7, ease: "power2.inOut" })
        .to($("[data-body]"), { rotation: 372, duration: 0.15, yoyo: true, repeat: 3, ease: "sine.inOut" })
        .set($("[data-body]"), { rotation: 0 });
    }
  }

  const walking = useRef<gsap.core.Timeline | null>(null);
  function walk(on: boolean) {
    const svg = root.current;
    if (!svg) return;
    const { gsap } = registerGsap();
    const $ = gsap.utils.selector(svg);
    walking.current?.kill();
    walking.current = null;
    gsap.set($("[data-leg-l], [data-leg-r], [data-arm-l], [data-arm-r]"), { rotation: 0 });
    if (!on || prefersReducedMotion()) return;
    const tl = gsap.timeline({ repeat: -1 });
    // legs swing out of phase; arms counter-swing; the rover just rolls
    tl.to($("[data-leg-l]"), { rotation: 28, transformOrigin: "50% 0%", duration: 0.26, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0)
      .to($("[data-leg-r]"), { rotation: -28, transformOrigin: "50% 0%", duration: 0.26, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0)
      .to($("[data-leg-l]"), { rotation: -28, duration: 0.26, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.52)
      .to($("[data-leg-r]"), { rotation: 28, duration: 0.26, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.52)
      .to($("[data-arm-l]"), { rotation: -22, transformOrigin: "100% 15%", duration: 0.52, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0)
      .to($("[data-arm-r]"), { rotation: -22, transformOrigin: "0% 15%", duration: 0.52, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.52);
    gsap.to($("[data-wheel]"), { rotation: "+=360", transformOrigin: "50% 50%", duration: 0.7, repeat: -1, ease: "none" });
    walking.current = tl;
  }

  function wave() {
    if (!root.current || prefersReducedMotion()) return;
    const { gsap } = registerGsap();
    const $ = gsap.utils.selector(root.current);
    gsap
      .timeline()
      .to($("[data-arm-r]"), { rotation: -130, transformOrigin: "0% 15%", duration: 0.35, ease: "power2.out" })
      .to($("[data-arm-r]"), { rotation: -100, duration: 0.18, yoyo: true, repeat: 3, ease: "sine.inOut" })
      .to($("[data-arm-r]"), { rotation: 0, duration: 0.45, ease: "power2.inOut" });
  }

  const v = VARIANTS[variant];
  const face = EXPRESSIONS[expression];
  /**
   * Gradient ids must be unique PER INSTANCE, not per variant. url(#id)
   * resolves to the first element with that id in the whole document - and
   * if that happens to live inside a display:none SVG (a mascot hidden on
   * mobile), Chrome paints the fill as transparent. That was the "ghost
   * robot" on phones.
   */
  const gid = `m${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const lids = face.eyeScaleY ? "1" : undefined;

  const Eye = ({ cx, scaleY }: { cx: number; scaleY: number }) => (
    <g data-eye style={{ transform: `scaleY(${scaleY})`, transformOrigin: `${cx}px 53px` }}>
      <circle cx={cx} cy="53" r="9" fill="#fff" />
      {face.pupils ? (
        <>
          <circle data-pupil cx={cx} cy="53" r={face.pupilR ?? 4.6} fill="#0a1326" />
          <circle cx={cx + 2.5} cy="50.5" r="1.6" fill="#fff" />
        </>
      ) : (
        <path
          d={face.eyeShape}
          transform={`translate(${cx} 53)`}
          fill={face.eyeFill ?? "none"}
          stroke="#0a1326"
          strokeWidth={face.eyeFill ? 0 : 3.5}
          strokeLinecap="round"
        />
      )}
    </g>
  );

  return (
    <svg
      ref={root}
      viewBox="0 0 120 140"
      width={size}
      height={(size * 140) / 120}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-lids={lids}
      style={{ overflow: "visible", cursor: interactive ? "pointer" : undefined }}
      onPointerEnter={interactive ? () => express("surprised", 900) : undefined}
      onClick={
        interactive
          ? () => {
              // Walk through every face, one per click; every 6th click is a celebration.
              const all = Object.keys(EXPRESSIONS) as Expression[];
              clickIdx.current += 1;
              if (clickIdx.current % 6 === 0) {
                celebrate();
                return;
              }
              const next = all[clickIdx.current % all.length];
              setBase(next);
              setExpression(next);
              wave();
            }
          : undefined
      }
    >
      <defs>
        <linearGradient id={`${gid}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={v.from} />
          <stop offset="100%" stopColor={v.to} />
        </linearGradient>
        <linearGradient id={`${gid}-face`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16244a" />
          <stop offset="100%" stopColor="#0a1326" />
        </linearGradient>
        <radialGradient id={`${gid}-glow`}>
          <stop offset="0%" stopColor="#fff" />
          <stop offset="60%" stopColor={v.accent} />
          <stop offset="100%" stopColor={v.accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* confetti sits at the head centre, hidden until celebrate() */}
      <g transform="translate(60 58)">
        {Array.from({ length: 14 }).map((_, i) => (
          <rect key={i} data-confetti x="-2.5" y="-2.5" width="5" height="5"
            rx={i % 3 === 0 ? 2.5 : 0.8}
            fill={[v.from, v.to, "#f97316", "#fff"][i % 4]} opacity="0" />
        ))}
      </g>

      {/* hearts for the "hearts" skit - rise from the head */}
      <g transform="translate(60 40)">
        {Array.from({ length: 5 }).map((_, i) => (
          <path key={i} data-heart opacity="0"
            d="M0 4 C-6 -1 -5 -7 0 -4 C5 -7 6 -1 0 4Z" fill={["#f43f5e", "#fb7185", "#f472b6"][i % 3]} />
        ))}
      </g>

      <g data-body>
        <ellipse cx="60" cy="138" rx="26" ry="3.5" fill="#000" opacity="0.18" />

        {/* legs - bipeds and the cyclist. Drawn under the torso. */}
        {(v.body ?? "biped") === "biped" && (
          <>
            <g data-leg-l>
              <rect x="41" y="122" width="11" height="14" rx="4" fill={v.to} />
              <ellipse cx="46" cy="136" rx="8" ry="3" fill="#0a1326" opacity="0.7" />
            </g>
            <g data-leg-r>
              <rect x="68" y="122" width="11" height="14" rx="4" fill={v.from} />
              <ellipse cx="74" cy="136" rx="8" ry="3" fill="#0a1326" opacity="0.7" />
            </g>
          </>
        )}

        {/* torso / chassis, per body plan */}
        {(v.body ?? "biped") === "biped" && (
          <>
            <rect x="30" y="86" width="60" height="42" rx={v.torsoR} fill={`url(#${gid}-body)`} />
            {v.chest === "lights" && (
              <>
                <rect x="42" y="98" width="36" height="18" rx="7" fill="#0a1326" opacity="0.55" />
                <circle cx="52" cy="107" r="3" fill="#38bdf8" />
                <circle cx="61" cy="107" r="3" fill="#8b5cf6" />
                <circle cx="70" cy="107" r="3" fill="#f97316" />
              </>
            )}
            {v.chest === "screen" && (
              <>
                <rect x="42" y="96" width="36" height="22" rx="4" fill="#0a1326" opacity="0.6" />
                <path d="M46 110 L52 104 L57 109 L63 101 L69 107 L74 103" stroke={v.accent} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}
            {v.chest === "bolt" && (
              <path d="M63 94 L52 110 L60 110 L57 122 L69 104 L61 104 Z" fill={v.accent} />
            )}
            {v.chest === "heart" && (
              <path d="M60 116 C48 108 46 98 54 96 C58 95 60 99 60 99 C60 99 62 95 66 96 C74 98 72 108 60 116Z" fill={v.accent} />
            )}
          </>
        )}
        {v.body === "drone" && (
          <>
            {/* rotor arms */}
            <path d="M34 44 L12 24 M86 44 L108 24 M34 70 L12 86 M86 70 L108 86" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
            {/* rotors - spin in idle */}
            {[[12, 24], [108, 24], [12, 86], [108, 86]].map(([cx, cy], i) => (
              <g key={i} data-rotor>
                <ellipse cx={cx} cy={cy} rx="16" ry="3.5" fill={v.to} opacity="0.75" />
                <circle cx={cx} cy={cy} r="3" fill="#1f2937" />
              </g>
            ))}
            {/* landing skids + camera gimbal */}
            <path d="M40 82 L40 92 L52 92 M80 82 L80 92 L68 92" stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="60" cy="88" r="7" fill="#1f2937" />
            <circle cx="60" cy="88" r="3.5" fill="#38bdf8" />
            <circle data-headlight cx="60" cy="88" r="1.5" fill="#fff" />
          </>
        )}
        {v.body === "ufo" && (
          <>
            {/* tractor beam, faint, pulses in idle */}
            <path data-beam d="M42 96 L20 138 L100 138 L78 96 Z" fill={v.to} opacity="0.12" />
            {/* saucer - sits right under the dome */}
            <ellipse cx="60" cy="92" rx="50" ry="13" fill={`url(#${gid}-body)`} />
            <ellipse cx="60" cy="88" rx="34" ry="8" fill="#0a1326" opacity="0.35" />
            <ellipse cx="60" cy="100" rx="26" ry="6" fill="#0a1326" opacity="0.45" />
            {/* ring lights - chase in the idle loop */}
            {[18, 32, 46, 60, 74, 88, 102].map((cx, i) => (
              <circle key={cx} data-ufo-light cx={cx} cy="95" r="3" fill={["#fef08a", "#f472b6", "#22d3ee"][i % 3]} />
            ))}
          </>
        )}
        {v.body === "puppy" && (
          <>
            {/* long body, hind legs, wagging tail, red collar */}
            <path data-tail d="M100 102 q16 -12 10 -26" stroke={v.to} strokeWidth="7" fill="none" strokeLinecap="round" />
            <rect x="24" y="90" width="78" height="30" rx="15" fill={`url(#${gid}-body)`} />
            {/* hind legs, spaced apart so all four legs read clearly */}
            <rect x="70" y="112" width="12" height="22" rx="6" fill={v.to} />
            <ellipse cx="76" cy="134" rx="7" ry="3.5" fill={v.to} />
            <rect x="88" y="112" width="12" height="22" rx="6" fill={v.from} />
            <ellipse cx="94" cy="134" rx="7" ry="3.5" fill={v.from} />
            <rect x="34" y="84" width="52" height="8" rx="4" fill="#dc2626" />
            <circle cx="60" cy="93" r="4" fill="#fde68a" />
          </>
        )}
        {v.body === "crane" && (
          <>
            <rect x="24" y="108" width="72" height="20" rx="10" fill="#1f2937" />
            {[34, 48, 62, 76, 90].map((cx) => (
              <circle key={cx} cx={cx} cy="118" r="5" fill="#4b5563" />
            ))}
            <rect x="34" y="82" width="52" height="28" rx="6" fill={`url(#${gid}-body)`} />
            <rect x="40" y="88" width="40" height="6" rx="3" fill="#1f2937" opacity="0.5" />
            <rect x="40" y="98" width="40" height="6" rx="3" fill="#1f2937" opacity="0.5" />
          </>
        )}
        {v.body === "rover" && (
          <>
            {/* a proper car: cab (the head) on a long red body, doors,
                bumpers, headlights, a light bar on the roof, big wheels */}
            <rect x="10" y="88" width="100" height="32" rx="10" fill={`url(#${gid}-body)`} />
            <path d="M28 88 L36 76 L84 76 L92 88 Z" fill={v.to} />
            <rect x="50" y="30" width="20" height="8" rx="3" fill="#0ea5e9" />
            <rect x="53" y="38" width="14" height="4" fill="#1f2937" />
            <rect x="16" y="94" width="26" height="16" rx="4" fill="#fff" opacity="0.25" />
            <rect x="78" y="94" width="26" height="16" rx="4" fill="#fff" opacity="0.25" />
            <rect x="8" y="104" width="104" height="8" rx="4" fill="#1f2937" />
            <circle data-headlight cx="14" cy="96" r="4" fill="#fef08a" />
            <circle data-headlight cx="106" cy="96" r="4" fill="#fef08a" />
            <g data-wheel>
              <circle cx="34" cy="122" r="11" fill="#111827" />
              <circle cx="34" cy="122" r="5" fill="#9ca3af" />
              <rect x="33" y="112" width="2" height="20" fill="#374151" />
            </g>
            <g data-wheel>
              <circle cx="86" cy="122" r="11" fill="#111827" />
              <circle cx="86" cy="122" r="5" fill="#9ca3af" />
              <rect x="85" y="112" width="2" height="20" fill="#374151" />
            </g>
          </>
        )}

        {/* head */}
        <g data-head>
          {v.antenna === "single" && (
            <>
              <rect x="58" y="8" width="4" height="14" rx="2" fill={`url(#${gid}-body)`} />
              <circle data-antenna-tip cx="60" cy="8" r="7" fill={`url(#${gid}-glow)`} />
              <circle cx="60" cy="8" r="3.2" fill="#fff" />
            </>
          )}
          {v.antenna === "double" && (
            <>
              <rect x="44" y="6" width="4" height="14" rx="2" fill={`url(#${gid}-body)`} transform="rotate(-15 46 20)" />
              <rect x="72" y="6" width="4" height="14" rx="2" fill={`url(#${gid}-body)`} transform="rotate(15 74 20)" />
              <circle data-antenna-tip cx="43" cy="6" r="5" fill={`url(#${gid}-glow)`} />
              <circle data-antenna-tip cx="77" cy="6" r="5" fill={`url(#${gid}-glow)`} />
            </>
          )}
          {v.antenna === "side" && (
            <>
              <rect x="88" y="10" width="4" height="16" rx="2" fill={`url(#${gid}-body)`} transform="rotate(20 90 26)" />
              <circle data-antenna-tip cx="94" cy="9" r="6" fill={`url(#${gid}-glow)`} />
            </>
          )}

          {/* ears */}
          {v.body === "puppy" ? (
            <>
              {/* floppy ears hanging off the head */}
              <path d="M32 36 q-16 2 -12 34 q12 -6 14 -26z" fill={v.to} />
              <path d="M88 36 q16 2 12 34 q-12 -6 -14 -26z" fill={v.to} />
            </>
          ) : v.body === "crane" ? (
            <rect x="46" y="18" width="28" height="10" rx="2" fill="#1f2937" />
          ) : v.body === "drone" ? null : (
            <>
              <rect x={v.head.x - 6} y="46" width="8" height="20" rx={v.earR} fill={v.to} />
              <rect x={v.head.x + v.head.w - 2} y="46" width="8" height="20" rx={v.earR} fill={v.from} />
            </>
          )}

          {/* shell + face plate */}
          <rect x={v.head.x} y={v.head.y} width={v.head.w} height={v.head.h} rx={v.head.r} fill={`url(#${gid}-body)`} />
          <rect x={v.face.x} y={v.face.y} width={v.face.w} height={v.face.h} rx={v.face.r} fill={`url(#${gid}-face)`} />

          {/* brows */}
          {face.browL && <path d={face.browL} stroke={v.accent} strokeWidth="2.6" fill="none" strokeLinecap="round" />}
          {face.browR && <path d={face.browR} stroke={v.accent} strokeWidth="2.6" fill="none" strokeLinecap="round" />}

          {/* eyes */}
          <Eye cx={47} scaleY={face.eyeScaleY?.[0] ?? 1} />
          <Eye cx={73} scaleY={face.eyeScaleY?.[1] ?? 1} />

          {/* dog snout sits under the mouth */}
          {v.body === "puppy" && (
            <>
              <ellipse cx="60" cy="70" rx="13" ry="8" fill="#fde68a" />
              <ellipse cx="60" cy="65" rx="4.5" ry="3.2" fill="#7c2d12" />
            </>
          )}
          {/* soot from a failed experiment - see skit("experiment") */}
          <g data-soot opacity="0">
            <ellipse cx="60" cy="52" rx="26" ry="18" fill="#111827" opacity="0.85" />
            <circle cx="40" cy="40" r="4" fill="#111827" />
            <circle cx="82" cy="38" r="3" fill="#111827" />
            <circle cx="48" cy="72" r="3" fill="#111827" />
            <circle cx="47" cy="53" r="6" fill="#fff" />
            <circle cx="73" cy="53" r="6" fill="#fff" />
            <circle cx="47" cy="53" r="2.4" fill="#0a1326" />
            <circle cx="73" cy="53" r="2.4" fill="#0a1326" />
            <path d="M54 66 Q60 62 66 66" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>
          {/* mouth */}
          <path
            d={face.mouth}
            stroke={v.accent}
            strokeWidth="3"
            fill={face.mouthFill ? "#0a1326" : "none"}
            strokeLinecap="round"
          />

          {/* extras */}
          {face.extra === "blush" && (
            <>
              <ellipse cx="38" cy="63" rx="4" ry="2.2" fill="#f472b6" opacity="0.6" />
              <ellipse cx="82" cy="63" rx="4" ry="2.2" fill="#f472b6" opacity="0.6" />
            </>
          )}
          {face.extra === "drop" && (
            <path d="M88 40 q-4 6 0 9 q4 -3 0 -9z" fill="#38bdf8" />
          )}
          {face.extra === "zzz" && (
            <text x="92" y="30" fontSize="11" fontWeight="700" fill={v.accent} fontFamily="Inter, sans-serif">z</text>
          )}
          {face.extra === "tongue" && (
            <path d="M60 68 q6 0 6 6 q0 4 -4 4 q-4 0 -4 -4z" fill="#fb7185" />
          )}
          {face.extra === "steam" && (
            <>
              <path d="M30 26 q3 -5 0 -9" stroke="#cbd5e1" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
              <path d="M90 26 q3 -5 0 -9" stroke="#cbd5e1" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
            </>
          )}
          {(face.extra === "??" || face.extra === "!!") && (
            <text x="98" y="30" fontSize="16" fontWeight="800" fill={face.extra === "??" ? v.accent : "#f43f5e"}
              fontFamily="DynaPuff, Inter, sans-serif" transform="rotate(12 98 30)">{face.extra}</text>
          )}
          {face.extra === "hearts" && (
            <path d="M96 30 C92 26 90 22 94 21 C96 20 97 22 97 22 C97 22 98 20 100 21 C104 22 102 26 97 30Z" fill="#f43f5e" />
          )}
        </g>

        {/* props - hidden until a skit shows them */}
        <g data-prop-flask opacity="0" transform="translate(93 62)" style={{ transformBox: "fill-box" }}>
          <path d="M-5 -14 h10 v10 l8 16 a3 3 0 0 1 -3 4 h-20 a3 3 0 0 1 -3 -4 l8 -16z" fill="#e0f2fe" stroke="#0a1326" strokeWidth="1.5" />
          <path d="M-9 6 l4 -8 h10 l4 8z" fill="#a3e635" opacity="0.85" />
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} data-bubble cx={-4 + i * 2.5} cy="-2" r={1.4 + (i % 2)} fill="#a3e635" opacity="0" />
          ))}
          {/* fire burst out of the neck of the flask */}
          <g data-fire opacity="0" style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
            <path d="M0 -12 C-9 -22 -7 -34 0 -40 C7 -34 9 -22 0 -12Z" fill="#f97316" />
            <path d="M0 -14 C-5 -21 -4 -29 0 -33 C4 -29 5 -21 0 -14Z" fill="#fbbf24" />
            <path d="M-8 -16 C-13 -22 -12 -28 -8 -31 C-5 -28 -4 -22 -8 -16Z" fill="#fb7185" />
            <path d="M8 -16 C13 -22 12 -28 8 -31 C5 -28 4 -22 8 -16Z" fill="#fb7185" />
          </g>
        </g>
        <g data-prop-book opacity="0">
          <path d="M36 96 L60 100 L84 96 L84 122 L60 126 L36 122 Z" fill="#1e3a8a" />
          <path d="M39 99 L59 102.5 L59 122 L39 118.5 Z" fill="#f8fafc" />
          <path d="M81 99 L61 102.5 L61 122 L81 118.5 Z" fill="#f1f5f9" />
          <g data-page>
            <path d="M61 102.5 L79 99.5 L79 118 L61 121.5 Z" fill="#fff" />
          </g>
          {[106, 110, 114].map((y) => (
            <path key={y} d={`M43 ${y} L56 ${y - 1.5}`} stroke="#94a3b8" strokeWidth="1.2" />
          ))}
        </g>
        {/* telescope: tube from the hands up to the right, a few stars */}
        <g data-prop-telescope opacity="0">
          <path d="M40 104 L104 46" stroke="#1f2937" strokeWidth="10" strokeLinecap="round" />
          <path d="M44 100 L100 50" stroke={v.to} strokeWidth="6" strokeLinecap="round" />
          <path d="M96 52 L108 42" stroke="#1f2937" strokeWidth="13" strokeLinecap="round" />
          <path d="M60 86 L52 118" stroke="#1f2937" strokeWidth="3" />
          <path d="M60 86 L70 118" stroke="#1f2937" strokeWidth="3" />
          {[[112, 30], [104, 20], [118, 14]].map(([x, y], i) => (
            <path key={i} data-star transform={`translate(${x} ${y}) scale(0.6)`}
              d="M0 -7 L2 -2 L7 -2 L3 1 L4.5 6 L0 3 L-4.5 6 L-3 1 L-7 -2 L-2 -2 Z" fill="#fbbf24" />
          ))}
        </g>
        {/* trophy held overhead */}
        <g data-prop-trophy opacity="0" transform="translate(60 6)">
          <path d="M-14 0 h28 v10 a14 14 0 0 1 -28 0z" fill="#fbbf24" />
          <path d="M-14 2 q-10 0 -8 10 q2 6 8 6 M14 2 q10 0 8 10 q-2 6 -8 6" stroke="#fbbf24" strokeWidth="3" fill="none" />
          <rect x="-3" y="22" width="6" height="8" fill="#f59e0b" />
          <rect x="-11" y="30" width="22" height="5" rx="2" fill="#b45309" />
          <path data-shine d="M-6 3 l3 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
        </g>
        {/* laptop on the lap, screen facing the viewer */}
        <g data-prop-laptop opacity="0">
          <path d="M34 118 L86 118 L90 124 L30 124 Z" fill="#374151" />
          <rect x="37" y="92" width="46" height="26" rx="3" fill="#1f2937" />
          <rect x="40" y="95" width="40" height="20" rx="2" fill="#0a1326" />
          {[0, 1, 2].map((i) => (
            <rect key={i} data-code x="43" y={99 + i * 5} width={14 + i * 8} height="2.2" rx="1" fill={["#38bdf8", "#a3e635", "#f472b6"][i]} />
          ))}
        </g>
        {/* placard held overhead */}
        <g data-prop-sign opacity="0">
          <rect x="58" y="22" width="4" height="70" fill="#b45309" />
          <rect x="24" y="4" width="72" height="30" rx="5" fill="#fff7ed" stroke="#b45309" strokeWidth="2" />
          <text x="60" y="25" textAnchor="middle" fontSize="15" fontWeight="700" fill="#16203a"
            fontFamily="DynaPuff, Inter, sans-serif">{signText}</text>
        </g>
        <g data-prop-gift opacity="0" transform="translate(93 70)" style={{ transformBox: "fill-box" }}>
          <rect x="-9" y="-8" width="18" height="16" rx="2" fill="#f43f5e" />
          <rect x="-9" y="-2" width="18" height="4" fill="#fde68a" />
          <rect x="-2" y="-8" width="4" height="16" fill="#fde68a" />
          <path d="M0 -8 q-6 -8 -6 -1 q6 -2 6 1 q0 -3 6 -1 q0 -7 -6 1z" fill="#fde68a" />
        </g>

        {/* limbs - pivot at the shoulder. Drawn AFTER the head so a raised arm
            (celebrate, wave) crosses in front of the face instead of vanishing
            behind it. Each body plan supplies its own pair. */}
        {v.body === "drone" && (
          <>
            <g data-arm-l>
              <rect x="18" y="56" width="12" height="6" rx="3" fill={v.to} />
            </g>
            <g data-arm-r>
              <rect x="90" y="56" width="12" height="6" rx="3" fill={v.from} />
            </g>
          </>
        )}
        {v.body === "ufo" && (
          <>
            <g data-arm-l>
              <path d="M14 90 q-8 6 -4 14" stroke={v.to} strokeWidth="4" fill="none" strokeLinecap="round" />
              <circle cx="10" cy="104" r="4" fill={v.to} />
            </g>
            <g data-arm-r>
              <path d="M106 90 q8 6 4 14" stroke={v.from} strokeWidth="4" fill="none" strokeLinecap="round" />
              <circle cx="110" cy="104" r="4" fill={v.from} />
            </g>
          </>
        )}
        {(v.body ?? "biped") === "biped" && (
          <>
            <g data-arm-l>
              <rect x="14" y="92" width="16" height="9" rx="4.5" fill={`url(#${gid}-body)`} />
              <circle cx="15" cy="96.5" r="6" fill={v.to} />
            </g>
            <g data-arm-r>
              <rect x="90" y="92" width="16" height="9" rx="4.5" fill={`url(#${gid}-body)`} />
              <circle cx="105" cy="96.5" r="6" fill={v.from} />
            </g>
          </>
        )}
        {v.body === "puppy" && (
          <>
            <g data-arm-l>
              <rect x="26" y="110" width="12" height="24" rx="6" fill={v.from} />
              <ellipse cx="32" cy="134" rx="7" ry="3.5" fill={v.from} />
            </g>
            <g data-arm-r>
              <rect x="44" y="110" width="12" height="24" rx="6" fill={v.to} />
              <ellipse cx="50" cy="134" rx="7" ry="3.5" fill={v.to} />
            </g>
          </>
        )}
        {v.body === "crane" && (
          <>
            <g data-arm-l>
              <rect x="20" y="92" width="16" height="8" rx="3" fill="#1f2937" />
            </g>
            <g data-arm-r>
              <rect x="86" y="88" width="34" height="7" rx="2" fill={v.from} transform="rotate(-35 86 92)" />
              <line x1="113" y1="72" x2="113" y2="90" stroke="#1f2937" strokeWidth="1.5" />
              <path d="M113 90 q-6 2 -5 8 q2 5 7 3" stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" />
            </g>
          </>
        )}
        {v.body === "rover" && (
          <>
            <g data-arm-l>
              <rect x="10" y="96" width="10" height="6" rx="3" fill={v.to} />
            </g>
            <g data-arm-r>
              <rect x="100" y="96" width="10" height="6" rx="3" fill={v.from} />
            </g>
          </>
        )}
      </g>
    </svg>
  );
});

export default Mascot;
