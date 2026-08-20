"use client";

import { useEffect, useState } from "react";
import { contact, whatsapp } from "@/content/site";
import SocialIcon from "@/components/ui/SocialIcon";

/**
 * Floating WhatsApp contact button.
 *
 * Uses wa.me with a prefilled message, which works on both mobile (opens the
 * app) and desktop (opens WhatsApp Web) without any SDK or third-party script.
 *
 * Positioned bottom-RIGHT, stacked above the back-to-top button. The event
 * popup deliberately sits bottom-LEFT so the two never overlap on a phone.
 */
export default function WhatsAppButton() {
  const [expanded, setExpanded] = useState(false);

  // Show the label briefly on first load so the button is understood, then
  // collapse to an icon so it stops competing with the page.
  useEffect(() => {
    const show = window.setTimeout(() => setExpanded(true), 1400);
    const hide = window.setTimeout(() => setExpanded(false), 6000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, []);

  const number = whatsapp.number.replace(/\D/g, "");
  const href = `https://wa.me/${number}?text=${encodeURIComponent(whatsapp.message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${contact.email ? "Robonest" : "us"} on WhatsApp`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={() => setExpanded(false)}
      className="group fixed bottom-20 right-6 z-[55] flex items-center gap-2.5 rounded-full bg-[#25D366] py-3 pl-3.5 pr-3.5 text-paper shadow-lg shadow-night/25 transition-all duration-300 hover:brightness-105 sm:bottom-24"
    >
      <SocialIcon name="whatsapp" className="h-6 w-6 shrink-0" />
      <span
        className={[
          "overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300",
          expanded ? "max-w-[11rem] opacity-100" : "max-w-0 opacity-0",
        ].join(" ")}
      >
        {whatsapp.label}
      </span>
    </a>
  );
}
