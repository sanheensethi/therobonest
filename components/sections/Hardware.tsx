"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { hardware } from "@/content/site";
import { useReveal } from "@/components/motion/useReveal";
import Mascot from "@/components/ui/Mascot";
import Tilt from "@/components/motion/Tilt";
import { asset } from "@/lib/asset";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Hardware cards with a "live bench" layer over each product photo:
 *   - a data pulse that travels around the frame (the board is talking),
 *   - a small serial-monitor HUD with values that tick like real readings,
 *   - for the sensors, sonar rings pulsing out from the centre.
 * Everything is CSS/SVG + one interval; no video, no assets, and the photo
 * geometry does not matter, so swapping the image in content never breaks it.
 */

/** A readout that wanders like a real sensor instead of sitting still. */
function useReading(base: number, spread: number, decimals = 0, every = 700) {
  const [v, setV] = useState(base);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      setV((cur) => {
        const next = cur + (Math.random() - 0.5) * spread;
        const lo = base - spread * 2;
        const hi = base + spread * 2;
        return Math.min(hi, Math.max(lo, next));
      });
    }, every);
    return () => window.clearInterval(id);
  }, [base, spread, every]);
  return v.toFixed(decimals);
}

function ArduinoHud() {
  const [pin, setPin] = useState(true);
  const temp = useReading(27.4, 0.4, 1, 900);
  const loop = useReading(1240, 60, 0, 500);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => setPin((p) => !p), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-cyan/30 bg-night/80 px-3 py-2 font-mono text-[10px] leading-relaxed text-cyan backdrop-blur-sm">
      <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-cyan/70">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        Serial · 9600 baud
      </div>
      <div>
        pin 13 →{" "}
        <span className={pin ? "text-amber-300" : "text-cyan/50"}>{pin ? "HIGH" : "LOW "}</span>
        <span
          className={[
            "ml-2 inline-block h-2 w-2 rounded-full align-middle transition-all duration-150",
            pin ? "bg-amber-300 shadow-[0_0_8px_2px_rgba(252,211,77,0.7)]" : "bg-amber-300/20",
          ].join(" ")}
        />
      </div>
      <div>temp: {temp} °C</div>
      <div>
        loop: {loop} µs<span className="animate-pulse">_</span>
      </div>
    </div>
  );
}

function SensorHud() {
  const dist = useReading(18.2, 1.6, 1, 600);
  const light = useReading(63, 4, 0, 800);
  const hum = useReading(41, 1.5, 0, 1100);
  const pct = Math.min(100, Math.max(0, Number(light)));
  return (
    <>
      {/* sonar rings from the centre of the image */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="sonar absolute h-16 w-16 rounded-full border border-cyan/50"
            style={{ animationDelay: `${i * 0.9}s` }}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-cyan/30 bg-night/80 px-3 py-2 font-mono text-[10px] leading-relaxed text-cyan backdrop-blur-sm">
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-cyan/70">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live readings
        </div>
        <div>ultrasonic: {dist} cm</div>
        <div className="flex items-center gap-2">
          light: {light}%
          <span className="inline-block h-1 w-14 overflow-hidden rounded-full bg-cyan/20 align-middle">
            <span className="block h-full rounded-full bg-cyan transition-all duration-500" style={{ width: `${pct}%` }} />
          </span>
        </div>
        <div>humidity: {hum}%</div>
      </div>
    </>
  );
}

/** A bright dash that runs around the image frame - data on the move. */
function Pulse() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
      <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="10" fill="none" stroke="rgba(56,189,248,0.18)" strokeWidth="1.5" />
      <rect className="pulse-dash" x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="10" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Hardware() {
  const ref = useReveal<HTMLElement>({ stagger: 0.14 });
  const wrap = useRef<HTMLDivElement | null>(null);

  return (
    <section data-nesty="hardware" ref={ref} className="relative bg-paper">
      <div ref={wrap} className="relative mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <div className="absolute right-4 top-3 origin-top-right scale-[0.55] lg:right-6 lg:top-10 lg:scale-100">
          <Mascot size={110} variant="rover" />
        </div>
        <h2
          data-reveal="clip"
          className="max-w-2xl text-balance text-3xl leading-tight text-ink sm:text-4xl"
        >
          The hardware students actually build with
        </h2>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {hardware.map((h, i) => (
            <Tilt key={h.title} max={4} className="h-full">
              <article
                data-reveal="up"
                className="group h-full overflow-hidden rounded-[var(--radius-card)] border border-ink/8 bg-sand"
              >
                <div className="relative overflow-hidden bg-night">
                  {h.video ? (
                    <video
                      className="h-60 w-full object-cover transition-transform duration-700 ease-[var(--ease-brand)] group-hover:scale-[1.04] sm:h-64"
                      src={asset(h.video)}
                      poster={asset(h.image)}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      aria-label={h.title}
                    />
                  ) : (
                    <Image
                      src={asset(h.image)}
                      alt={h.title}
                      width={800}
                      height={520}
                      sizes="(min-width: 768px) 45vw, 90vw"
                      className="h-60 w-full object-contain p-4 transition-transform duration-700 ease-[var(--ease-brand)] group-hover:scale-[1.06] sm:h-64 sm:p-6"
                    />
                  )}
                  {/* subtle scanline sheen on hover */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 translate-y-[-120%] bg-gradient-to-b from-transparent via-cyan/15 to-transparent transition-transform duration-[1400ms] ease-out group-hover:translate-y-[120%]"
                  />
                  <Pulse />
                  {i === 0 ? <ArduinoHud /> : <SensorHud />}
                </div>
                <div className="p-7">
                  <h3 className="font-display text-xl uppercase tracking-wide text-ink">
                    {h.title}
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {h.points.map((p) => (
                      <li key={p} className="flex items-center gap-3 text-sm text-ink-700">
                        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Tilt>
          ))}
        </div>
      </div>
    </section>
  );
}
