"use client";

import { useEffect, useState } from "react";
import HeroForm from "@/components/sections/HeroForm";

/**
 * The two-step enquiry form in a slide-in panel.
 *
 * Any button on the site opens it with `openEnquiry()`; the hero's primary
 * CTA and the header's "Book a Demo" both do. The form inside is the same
 * component as before (same validation, same Netlify function, same Odoo
 * lead), so moving it out of the hero changed nothing about where enquiries
 * land. Nesty docks onto the card while the panel is open, as it did in the
 * hero.
 */
const EVENT = "enquiry:open";

export function openEnquiry() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export default function EnquiryDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);

  // Esc closes; page scroll is locked while open.
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", key);
    document.documentElement.classList.add("lenis-stopped");
    return () => {
      document.removeEventListener("keydown", key);
      document.documentElement.classList.remove("lenis-stopped");
    };
  }, [open]);

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className={[
          "fixed inset-0 z-[54] bg-night/60 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Book a demo lab setup"
        aria-hidden={!open}
        className={[
          "fixed inset-y-0 right-0 z-[55] flex w-full max-w-[460px] flex-col overflow-y-auto bg-night-900 px-5 pb-8 pt-[calc(var(--nav-h)+2.5rem)] shadow-2xl shadow-night-900/60 transition-transform duration-500 ease-[var(--ease-brand)] sm:px-7",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        data-lenis-prevent
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-4 top-[calc(var(--nav-h)+0.5rem)] flex h-10 w-10 items-center justify-center rounded-full border border-paper/15 text-paper/80 transition-colors hover:border-brand hover:text-brand-300"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
        {/* extra top room so the docked mascot above the card is not clipped */}
        <div className="mt-16">{open && <HeroForm />}</div>
        <p className="mt-6 text-center text-xs text-paper/50">
          Prefer to talk? WhatsApp us from the chat, or call the number in the header.
        </p>
      </aside>
    </>
  );
}
