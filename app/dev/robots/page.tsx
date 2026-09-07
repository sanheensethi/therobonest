"use client";

import { useRef, useState } from "react";
import Mascot, {
  type MascotHandle,
  type Variant,
  type Expression,
  type Skit,
} from "@/components/ui/Mascot";

/**
 * Dev-only playground: every robot, every face, every skit, on one page.
 * Not linked from anywhere and excluded from the sitemap. Use it to check a
 * new expression or body plan without hunting for it on the real pages.
 */
const VARIANTS: Variant[] = ["nesty", "sparky", "bolt", "pixel", "crane", "rover", "ufo", "drone", "rocket"];
const EXPRESSIONS: Expression[] = [
  "neutral", "happy", "surprised", "thinking", "sad", "wink", "sleepy", "love",
  "giggle", "cool", "dizzy", "proud", "cheeky", "angry",
  "laugh", "shy", "confused", "scared", "excited", "bored", "smug", "kiss",
];
const SKITS: Skit[] = ["giggle", "hearts", "gift", "experiment", "dance", "spin"];

function Rig({ variant }: { variant: Variant }) {
  const ref = useRef<MascotHandle | null>(null);
  const [walking, setWalking] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-ink/10 bg-paper p-4">
      <p className="font-display text-sm text-ink">{variant}</p>
      <div className="flex h-40 items-end">
        <Mascot ref={ref} variant={variant} size={130} antics={false} />
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        <button className="btn" onClick={() => ref.current?.wave()}>wave</button>
        <button className="btn" onClick={() => ref.current?.celebrate()}>celebrate</button>
        <button
          className="btn"
          onClick={() => {
            ref.current?.walk(!walking);
            setWalking((w) => !w);
          }}
        >
          {walking ? "stop" : "walk"}
        </button>
        {SKITS.map((k) => (
          <button key={k} className="btn" onClick={() => ref.current?.skit(k)}>
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RobotsDev() {
  const [variant, setVariant] = useState<Variant>("nesty");
  return (
    <main className="min-h-screen bg-sand px-6 pb-24 pt-[calc(var(--nav-h)+2rem)]">
      <style>{`.btn{border-radius:9999px;border:1px solid rgb(22 32 58 / .15);padding:.25rem .6rem;font-size:11px;font-weight:600;color:#16203a;background:#fff}.btn:hover{border-color:#2e86ff;color:#2e86ff}`}</style>
      <div className="mx-auto max-w-7xl">
        <h1 className="font-display text-3xl text-ink">Robot playground</h1>
        <p className="mt-2 text-sm text-ink-700">
          Hover any robot to surprise it, click to step through its faces. Buttons fire the named behaviour.
        </p>

        <h2 className="mt-10 font-display text-xl text-ink">Body plans</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VARIANTS.map((v) => (
            <Rig key={v} variant={v} />
          ))}
        </div>

        <h2 className="mt-12 font-display text-xl text-ink">Expressions</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {VARIANTS.map((v) => (
            <button
              key={v}
              className="btn"
              style={v === variant ? { background: "#2e86ff", color: "#fff", borderColor: "#2e86ff" } : undefined}
              onClick={() => setVariant(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
          {EXPRESSIONS.map((e) => (
            <div key={e} className="flex flex-col items-center gap-2 rounded-2xl border border-ink/10 bg-paper p-3">
              <Mascot variant={variant} expression={e} size={96} antics={false} trackCursor={false} />
              <p className="text-xs font-semibold text-ink-700">{e}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 font-display text-xl text-ink">Poses</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-ink/10 bg-paper p-4">
            <Mascot size={130} expression="thinking" holding="book" antics={false} />
            <p className="text-xs font-semibold text-ink-700">reading (blog)</p>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-ink/10 bg-paper p-4">
            <Mascot size={130} expression="sad" shrug antics={false} />
            <p className="text-xs font-semibold text-ink-700">shrug (empty states, 404)</p>
          </div>
          {(["telescope", "trophy", "laptop", "sign"] as const).map((h) => (
            <div key={h} className="flex flex-col items-center gap-2 rounded-2xl border border-ink/10 bg-paper p-4">
              <Mascot size={130} holding={h} signText="Hi!" antics={false} variant={h === "trophy" ? "sparky" : h === "laptop" ? "pixel" : "nesty"} />
              <p className="text-xs font-semibold text-ink-700">{h}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
