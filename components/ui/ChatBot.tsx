"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mascot, whatsapp } from "@/content/site";
import Mascot, { type MascotHandle, type Expression } from "@/components/ui/Mascot";
import SocialIcon from "@/components/ui/SocialIcon";
import { registerGsap, prefersReducedMotion } from "@/lib/motion";

/** Corner-mode button diameter, px. Docked on the form the robot is ~1.7x. */
const LAUNCHER = 64;
const DOCK_SCALE = 1.7;

/**
 * Anything on the page can talk to the mascot without holding a ref to it:
 *   window.dispatchEvent(new CustomEvent("nesty", { detail: { action: "wave" } }))
 * Used by the hero form (look at the focused field, celebrate on submit).
 */
export type NestyEvent =
  | { action: "lookAt"; target: Element | null }
  | { action: "celebrate" }
  | { action: "wave" }
  | { action: "express"; expression: Expression; ms?: number }
  | { action: "say"; id: string; text: string; href?: string; label?: string; ms?: number };

export function tellNesty(detail: NestyEvent) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<NestyEvent>("nesty", { detail }));
  }
}

/** Random idle antics so the robot reads as alive while nobody is talking to it. */
const ANTICS: Array<(m: MascotHandle) => void> = [
  (m) => m.express("wink", 900),
  (m) => m.express("surprised", 1100),
  (m) => m.express("thinking", 1600),
  (m) => m.express("sleepy", 2200),
  (m) => m.express("love", 1400),
  (m) => m.wave(),
  (m) => {
    // glance left, then right, then back to the cursor
    m.lookAt({ x: 0, y: window.innerHeight / 2 });
    window.setTimeout(() => m.lookAt({ x: window.innerWidth, y: window.innerHeight / 2 }), 500);
    window.setTimeout(() => m.lookAt(null), 1000);
  },
];

type Msg = { from: "bot" | "user"; text: string; href?: string; label?: string };

/** A proactive speech bubble from the mascot, tied to where the visitor is. */
type Tip = { id: string; text: string; href?: string; label?: string };

export type ChatEvent = {
  title: string;
  dateLabel: string;
  slug: string;
  registrationsOpen: boolean;
};

/**
 * Chat assistant fronted by the mascot.
 *
 * SCRIPTED on purpose. Answers are keyword-matched against `mascot.faq` in
 * content/site.ts, so the team edits them like any other copy and the bot can
 * never invent a price or a promise. Anything it cannot answer is handed to
 * a human - WhatsApp or the enquiry form - which is what a school actually
 * wants anyway. `answer()` is the one seam to replace if a real LLM backend
 * (a Netlify Function holding the key) is added later.
 */
function answer(q: string): string {
  const words = q.toLowerCase();
  const hit = mascot.faq.find((f) => f.keywords.some((k) => words.includes(k)));
  return hit ? hit.answer : mascot.fallback;
}

export default function ChatBot({ event }: { event?: ChatEvent | null }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    const first: Msg[] = [{ from: "bot", text: mascot.greeting }];
    if (event) {
      first.push({
        from: "bot",
        text: `Also - ${event.title} is on ${event.dateLabel}.${
          event.registrationsOpen ? " Registrations are open." : ""
        }`,
        href: `/events/${event.slug}/`,
        label: event.registrationsOpen ? "Register" : "Event details",
      });
    }
    return first;
  });
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [tip, setTip] = useState<Tip | null>(null);
  const bot = useRef<MascotHandle | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);
  const tipTimer = useRef<number | null>(null);
  const said = useRef<Set<string>>(new Set());
  const pathname = usePathname();
  const launcher = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  /**
   * Docking. Each frame: if the hero form's dock slot is on screen and clear
   * of the fixed header, sit the robot there (bigger, no ring); otherwise
   * glide to the bottom-right corner. quickTo gives the transition its
   * elastic "follow" feel without a separate state machine.
   */
  useEffect(() => {
    const el = launcher.current;
    if (!el) return;
    const { gsap } = registerGsap();
    const ring = el.querySelectorAll<HTMLElement>("[data-ring]");
    const robot = el.querySelector<HTMLElement>("[data-robot]");
    const dur = prefersReducedMotion() ? 0 : 0.45;
    const xTo = gsap.quickTo(el, "x", { duration: dur, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: dur, ease: "power3.out" });
    let docked: boolean | null = null;
    let placed = false;

    const tick = () => {
      // While it is off running a victory lap, leave its position alone.
      if (el.dataset.lap) return;
      const dock = document.querySelector<HTMLElement>("[data-mascot-dock]");
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 76;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let x: number, y: number, isDocked = false;

      // Chat open: step out and stand beside the panel (left of it on
      // desktop), so the visitor talks TO someone rather than at a window.
      const panel = panelRef.current;
      if (open && panel && vw < 640) {
        // Phone: no room beside the panel, so it stands in the header,
        // left of the close button.
        const pr = panel.getBoundingClientRect();
        x = pr.right - LAUNCHER - 44;
        y = pr.top - 2;
        if (!placed) { gsap.set(el, { x, y }); placed = true; el.style.visibility = "visible"; }
        xTo(x);
        yTo(y);
        if (docked !== false) {
          docked = false;
          if (robot) gsap.to(robot, { scale: 1, transformOrigin: "50% 100%", duration: dur, overwrite: true });
          gsap.to(ring, { opacity: 0, duration: dur });
        }
        return;
      }
      if (open && panel && vw >= 640) {
        const pr = panel.getBoundingClientRect();
        const big = LAUNCHER * DOCK_SCALE;
        x = pr.left - big - 8;
        y = pr.bottom - big + 4;
        xTo(x);
        yTo(y);
        if (docked !== true) {
          docked = true;
          if (robot) gsap.to(robot, { scale: DOCK_SCALE, transformOrigin: "50% 100%", duration: dur, overwrite: true });
          gsap.to(ring, { opacity: 0, duration: dur });
        }
        return;
      }

      if (dock && !open) {
        const r = dock.getBoundingClientRect();
        // Docked while the robot (which stands on the slot's bottom edge) would
        // clear the fixed header and still be above the fold. The slot itself
        // may poke under the header - only the robot's head matters.
        const robotH = 46 * (140 / 120) * DOCK_SCALE;
        if (r.bottom - robotH > navH - 4 && r.bottom < vh - 20) {
          isDocked = true;
          x = r.left + r.width / 2 - LAUNCHER / 2;
          y = r.bottom - LAUNCHER;
        }
      }
      if (!isDocked) {
        // stacked above the WhatsApp button
        const bottom = vw >= 640 ? 156 : 140;
        x = vw - (vw >= 640 ? 24 : 20) - LAUNCHER;
        y = vh - bottom - LAUNCHER;
      }
      if (!placed) {
        gsap.set(el, { x: x!, y: y! });
        placed = true;
        el.style.visibility = "visible";
      }
      xTo(x!);
      yTo(y!);
      if (isDocked !== docked) {
        docked = isDocked;
        el.dataset.docked = String(isDocked);
        if (robot) {
          gsap.to(robot, {
            scale: isDocked ? DOCK_SCALE : 1,
            transformOrigin: "50% 100%",
            duration: dur,
            ease: "power3.out",
            overwrite: true,
          });
        }
        gsap.to(ring, { opacity: isDocked ? 0 : 1, duration: dur });
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [open]);

  /**
   * On a submit the mascot does not just hop in place: it runs a lap along
   * the bottom of the page and comes back to wherever it was. The dock ticker
   * pauses for the duration (data-lap) so the two never fight over `x`.
   */
  function victoryLap() {
    const el = launcher.current;
    if (!el || prefersReducedMotion()) return;
    const { gsap } = registerGsap();
    const startX = Number(gsap.getProperty(el, "x"));
    const startY = Number(gsap.getProperty(el, "y"));
    const floorY = window.innerHeight - LAUNCHER - 24;
    const span = Math.min(window.innerWidth * 0.45, 520);
    el.dataset.lap = "1";
    gsap
      .timeline({
        onComplete: () => {
          delete el.dataset.lap;
        },
      })
      .to(el, { y: floorY, duration: 0.35, ease: "power2.in" })
      .to(el, { x: startX - span, duration: 1.1, ease: "power1.inOut" })
      .to(el, { x: startX - span * 0.4, duration: 0.7, ease: "power1.inOut" })
      .to(el, { x: startX, y: startY, duration: 0.8, ease: "power3.inOut" });
  }

  /* Event bridge + idle antics */
  useEffect(() => {
    const onNesty = (e: Event) => {
      const d = (e as CustomEvent<NestyEvent>).detail;
      const m = bot.current;
      if (!m || !d) return;
      if (d.action === "lookAt") m.lookAt(d.target);
      else if (d.action === "celebrate") {
        m.celebrate();
        victoryLap();
      }
      else if (d.action === "wave") m.wave();
      else if (d.action === "express") m.express(d.expression, d.ms);
      else if (d.action === "say") say({ id: d.id, text: d.text, href: d.href, label: d.label }, d.ms ?? 9000);
    };
    window.addEventListener("nesty", onNesty);

    let timer: number | null = null;
    const schedule = () => {
      timer = window.setTimeout(() => {
        if (bot.current && !prefersReducedMotion()) {
          ANTICS[Math.floor(Math.random() * ANTICS.length)](bot.current);
        }
        schedule();
      }, 7000 + Math.random() * 9000);
    };
    schedule();

    return () => {
      window.removeEventListener("nesty", onNesty);
      if (timer) window.clearTimeout(timer);
    };
  }, [open]);

  /**
   * Proactive bubbles. The mascot travels with the visitor (it is fixed), so
   * it can say something relevant to where they are: the upcoming event soon
   * after arrival, a note when the Labs rail comes into view, a nudge at the
   * enquiry form. Each tip shows once per page load - a mascot that repeats
   * itself within a visit stops being charming very quickly.
   */
  function say(t: Tip, ms = 7000) {
    if (open) return;
    // Once per page load (not per session): a reload is a fresh visit, and
    // silently skipping tips made the mascot look broken rather than polite.
    if (said.current.has(t.id)) return;
    said.current.add(t.id);
    setTip(t);
    bot.current?.express("surprised", 1200);
    bot.current?.wave();
    if (tipTimer.current) window.clearTimeout(tipTimer.current);
    tipTimer.current = window.setTimeout(() => setTip(null), ms);
  }

  useEffect(() => {
    const hello = window.setTimeout(
      () => say({ id: "hello", text: "Hi! Any questions about labs? Tap me." }, 4500),
      2600
    );
    const ev = event
      ? window.setTimeout(
          () =>
            say(
              {
                id: `event-${event.slug}`,
                text: `${event.title} - ${event.dateLabel}.${
                  event.registrationsOpen ? " Registrations are open!" : ""
                }`,
                href: `/events/${event.slug}/`,
                label: event.registrationsOpen ? "Register →" : "See details →",
              },
              9000
            ),
          12000
        )
      : null;

    // Section-aware tips: every element carrying data-nesty="<key>" gets the
    // matching line from mascot.sectionTips when a quarter of it is on screen.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const key = (e.target as HTMLElement).dataset.nesty;
          const text = key ? mascot.sectionTips[key] : undefined;
          if (e.isIntersecting && key && text) say({ id: `section-${key}`, text });
        });
      },
      { threshold: 0, rootMargin: "-35% 0px -35% 0px" }
    );
    // Sections mount with the page; give the route a beat to render first.
    const scan = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>("[data-nesty]").forEach((el) => io.observe(el));
    }, 400);

    return () => {
      window.clearTimeout(hello);
      window.clearTimeout(scan);
      if (ev) window.clearTimeout(ev);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.slug, pathname]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 1e6, behavior: "smooth" });
  }, [msgs, typing]);

  // While the panel is open the robot watches it; the antics keep running.
  useEffect(() => {
    const m = bot.current;
    if (!m) return;
    if (open) {
      m.lookAt(panelRef.current);
      m.wave();
      m.express("happy", 1500);
    } else {
      m.lookAt(null);
    }
  }, [open]);

  function ask(q: string) {
    const text = q.trim();
    if (!text) return;
    setMsgs((m) => [...m, { from: "user", text }]);
    setInput("");
    setTyping(true);
    bot.current?.express("thinking");
    // A short beat before replying reads as attention, not a lookup table.
    window.setTimeout(() => {
      const reply = answer(text);
      setMsgs((m) => [...m, { from: "bot", text: reply }]);
      setTyping(false);
      bot.current?.express(reply === mascot.fallback ? "sad" : "happy", 1800);
    }, 650);
  }

  const wa = `https://wa.me/${whatsapp.number.replace(/\D/g, "")}?text=${encodeURIComponent(whatsapp.message)}`;
  const unanswered = msgs.some((m) => m.text === mascot.fallback);

  return (
    <>
      {/* Launcher: the ONE mascot. It starts perched on the hero form (the
          element carrying data-mascot-dock) and, once that scrolls away,
          detaches and travels with the visitor in the bottom-right corner. */}
      <div
        ref={launcher}
        className="group fixed left-0 top-0 z-[56] flex items-end will-change-transform"
        /* hidden until the first tick has placed it - otherwise it flashes at (0,0) on reload */
        style={{ width: LAUNCHER, height: LAUNCHER, visibility: "hidden" }}
      >
        <span
          className={[
            "absolute bottom-full right-full mb-1 mr-1 w-max max-w-[13rem] rounded-2xl rounded-br-sm bg-paper px-3.5 py-2.5 text-left text-xs font-medium leading-snug text-ink shadow-lg shadow-night/20 transition-all duration-300",
            tip && !open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
          ].join(" ")}
          aria-live="polite"
        >
          {tip?.text}
          {tip?.href && (
            <Link
              href={tip.href}
              onClick={() => setTip(null)}
              className="mt-1.5 block font-semibold text-brand hover:underline"
            >
              {tip.label}
            </Link>
          )}
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close chat" : `Chat with ${mascot.name}`}
          className="relative flex h-full w-full items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105"
        >
          {/* The circle only shows in corner mode; docked, the robot sits bare on the card. */}
          <span
            data-ring
            className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo to-violet shadow-lg shadow-night/30 ring-2 ring-white/40"
          />
          {/* block, not inline: transforms (the dock scale) are ignored on inline boxes */}
          <span data-robot className="relative -mt-1 block origin-bottom">
            <Mascot ref={bot} size={46} trackCursor antics={false} interactive={false} />
          </span>
          {!open && (
            <span data-ring className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-paper bg-emerald-400" />
          )}
        </button>
      </div>

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label={`Chat with ${mascot.name}`}
        aria-hidden={!open}
        className={[
          "fixed z-[57] flex flex-col overflow-hidden bg-paper shadow-2xl shadow-night/40 ring-1 ring-ink/10 transition-all duration-300",
          // phone: a full-height sheet under the header; desktop: a card bottom-right
          "inset-x-0 bottom-0 top-[var(--nav-h)] rounded-t-3xl sm:inset-auto sm:bottom-5 sm:right-6 sm:w-[calc(100vw-2.5rem)] sm:max-w-sm sm:rounded-3xl",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        ].join(" ")}
        style={{ maxHeight: typeof window !== "undefined" && window.innerWidth < 640 ? undefined : "min(600px, calc(100vh - 6rem))" }}
      >
        <div className="flex items-center gap-3 bg-gradient-to-r from-indigo to-violet px-4 py-3 pr-24 text-paper sm:pr-4">
          <div className="min-w-0 flex-1">
            <p className="font-display text-base leading-tight">{mascot.name}</p>
            <p className="text-[11px] text-paper/75">Robonest lab assistant · replies instantly</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/15"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div ref={scroller} data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto bg-sand px-4 py-4">
          {msgs.map((m, i) => (
            <div key={i} className={m.from === "user" ? "flex justify-end" : "flex justify-start"}>
              <p
                className={[
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.from === "user"
                    ? "rounded-br-sm bg-brand text-paper"
                    : "rounded-bl-sm bg-paper text-ink-700 shadow-sm",
                ].join(" ")}
              >
                {m.text}
                {m.href && (
                  <Link
                    href={m.href}
                    onClick={() => setOpen(false)}
                    className="mt-1.5 block font-semibold text-brand hover:underline"
                  >
                    {m.label} →
                  </Link>
                )}
              </p>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <span className="flex gap-1 rounded-2xl rounded-bl-sm bg-paper px-3.5 py-3 shadow-sm">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </span>
            </div>
          )}

          {/* Quick replies until the visitor starts typing their own */}
          {msgs.filter((m) => m.from === "user").length === 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {mascot.quickReplies.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  className="rounded-full border border-brand/30 bg-paper px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand hover:text-paper"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Human handoff - always available, emphasised once the bot has failed */}
          <div className={["flex gap-2 pt-1", unanswered ? "" : "opacity-90"].join(" ")}>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-3 py-2 text-xs font-semibold text-paper hover:brightness-105"
            >
              <SocialIcon name="whatsapp" className="h-4 w-4" />
              {mascot.handoff.whatsapp}
            </a>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="flex flex-1 items-center justify-center rounded-full border border-ink/15 bg-paper px-3 py-2 text-xs font-semibold text-ink hover:border-brand hover:text-brand"
            >
              {mascot.handoff.enquiry}
            </Link>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex items-center gap-2 border-t border-ink/8 bg-paper p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mascot.placeholder}
            aria-label={mascot.placeholder}
            className="min-w-0 flex-1 rounded-full border border-ink/10 bg-sand px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-400 focus:border-brand"
          />
          <button
            type="submit"
            aria-label="Send"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-paper transition-colors hover:bg-brand-600"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>
    </>
  );
}
