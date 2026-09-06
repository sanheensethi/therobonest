"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Custom select: a button + listbox styled like the rest of the form, in place
 * of the browser's native dropdown (which ignores the site's typography and
 * colours entirely and looks foreign on the dark cards).
 *
 * Keeps the native behaviours people rely on: a hidden <input name> so the
 * value travels with FormData, full keyboard support (arrows, Home/End,
 * Enter/Space, Escape, type-ahead), click-outside to close, and the proper
 * combobox/listbox ARIA roles for screen readers.
 */
export default function Select({
  name,
  value,
  onChange,
  options,
  placeholder = "Select…",
  required,
  tone = "light",
  className = "",
  onFocus,
  onBlur,
  ariaLabel,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  required?: boolean;
  /** light = white field on a coloured card; dark = translucent field on navy */
  tone?: "light" | "dark";
  /** Extra classes for the trigger (e.g. left padding to clear an icon). */
  className?: string;
  onFocus?: (e: React.FocusEvent<Element>) => void;
  onBlur?: () => void;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, options.indexOf(value)));
  const root = useRef<HTMLDivElement | null>(null);
  const list = useRef<HTMLUListElement | null>(null);
  const typed = useRef({ text: "", at: 0 });
  const id = useId();

  // Close on outside click / touch.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  // Keep the highlighted option in view while arrowing.
  useEffect(() => {
    if (!open) return;
    list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function choose(i: number) {
    onChange(options[i]);
    setActive(i);
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent) {
    const last = options.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) setOpen(true);
        else setActive((i) => Math.min(last, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) setOpen(true);
        else setActive((i) => Math.max(0, i - 1));
        break;
      case "Home":
        if (open) { e.preventDefault(); setActive(0); }
        break;
      case "End":
        if (open) { e.preventDefault(); setActive(last); }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) choose(active);
        else setOpen(true);
        break;
      case "Escape":
        if (open) { e.preventDefault(); setOpen(false); }
        break;
      case "Tab":
        setOpen(false);
        break;
      default: {
        // type-ahead: letters typed within a second jump to the first match
        if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
        const now = Date.now();
        typed.current = {
          text: (now - typed.current.at < 1000 ? typed.current.text : "") + e.key.toLowerCase(),
          at: now,
        };
        const hit = options.findIndex((o) => o.toLowerCase().startsWith(typed.current.text));
        if (hit >= 0) {
          setActive(hit);
          if (!open) onChange(options[hit]);
        }
      }
    }
  }

  const light = tone === "light";
  const trigger = light
    ? "border-white/25 bg-white/95 text-ink focus:border-white focus:ring-2 focus:ring-white/60"
    : "border-paper/15 bg-night/60 text-paper focus:border-brand";
  const panel = light
    ? "border-ink/10 bg-paper text-ink shadow-xl shadow-night/20"
    : "border-paper/15 bg-night-800 text-paper shadow-xl shadow-night-900/60";
  const optionCls = (i: number, selected: boolean) =>
    [
      "cursor-pointer px-4 py-2.5 text-sm transition-colors",
      i === active ? (light ? "bg-brand-100 text-brand-600" : "bg-brand/25 text-paper") : "",
      selected ? "font-semibold" : "",
    ].join(" ");

  return (
    <div ref={root} className="relative">
      <input type="hidden" name={name} value={value} required={required} />
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={ariaLabel ?? placeholder}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKey}
        onFocus={onFocus}
        onBlur={onBlur}
        className={[
          "flex w-full items-center justify-between gap-3 rounded-xl border py-3 pr-3 text-left text-sm shadow-sm outline-none transition-all",
          value ? "" : light ? "text-ink-400" : "text-paper/40",
          trigger,
          className,
        ].join(" ")}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={["shrink-0 transition-transform duration-200", open ? "rotate-180" : ""].join(" ")}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          aria-activedescendant={`${id}-opt-${active}`}
          data-lenis-prevent
          className={[
            "absolute left-0 right-0 z-30 mt-1.5 max-h-60 overflow-y-auto rounded-xl border py-1.5",
            panel,
          ].join(" ")}
        >
          {options.map((o, i) => (
            <li
              key={o}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={o === value}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
              className={optionCls(i, o === value)}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
