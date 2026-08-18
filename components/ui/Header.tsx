"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav, contact } from "@/content/site";
import { scrollToTarget } from "@/components/motion/SmoothScroll";
import { asset } from "@/lib/asset";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Condense on scroll. The header stays visible at every scroll position -
  // no hide-on-scroll-down, so navigation is always one click away.
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on route change.
  useEffect(() => setOpen(false), [pathname]);

  // Lock page scroll while the mobile drawer is open.
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  // The bar is dark navy at every scroll position AND sits above the white
  // mobile drawer (header z-50 / drawer z-40), so its contents are always
  // light - including the close X. `scrolled` only controls border + blur.

  const handleNav = (href: string) => (e: React.MouseEvent) => {
    // Same-page hash links go through Lenis so they inherit smooth scrolling.
    if (href.startsWith("/#") && pathname === "/") {
      e.preventDefault();
      scrollToTarget(href.slice(1));
      setOpen(false);
    }
  };

  return (
    <>
      <header
        className={[
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          // The hero starts BELOW the header now, so the bar is always dark
          // navy - it just gains a border and blur once the page moves.
          scrolled
            ? "border-b border-white/10 bg-night-900/90 backdrop-blur-md"
            : "border-b border-white/5 bg-night-900",
        ].join(" ")}
        style={{ height: "var(--nav-h)" }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-6 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src={asset("/images/brand/logo.png")}
              alt=""
              width={40}
              height={40}
              className="h-9 w-auto rounded-md"
            />
            <span className="font-display text-lg leading-none text-paper">
              Robonest
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => {
              const active =
                item.href === pathname ||
                (item.href.startsWith("/#") && pathname === "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNav(item.href)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300",
                    active && item.href === pathname
                      ? "text-brand-300"
                      : "text-paper/80 hover:text-brand-300",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={`tel:${contact.phones[0]}`}
              className="hidden text-sm font-semibold text-paper/80 transition-colors duration-300 hover:text-brand-300 md:block"
            >
              {contact.phones[0]}
            </a>
            <Link
              href="/contact"
              className="hidden rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-paper shadow-sm transition-all hover:bg-brand-600 hover:shadow-md sm:block"
            >
              Book a Demo
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              className={[
                "relative z-50 flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full border transition-colors duration-300 lg:hidden",
                open
                  ? "border-paper/40 bg-paper/10"
                  : "border-paper/25 hover:border-paper/40",
              ].join(" ")}
            >
              <span
                className={[
                  "bg-paper",
                  "block h-[2px] w-4 transition-transform duration-300",
                  open ? "translate-y-[7px] rotate-45" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "bg-paper",
                  "block h-[2px] w-4 transition-opacity duration-200",
                  open ? "opacity-0" : "opacity-100",
                ].join(" ")}
              />
              <span
                className={[
                  "bg-paper",
                  "block h-[2px] w-4 transition-transform duration-300",
                  open ? "-translate-y-[7px] -rotate-45" : "",
                ].join(" ")}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={[
          "fixed inset-0 z-40 bg-paper transition-[opacity,visibility] duration-400 lg:hidden",
          open ? "visible opacity-100" : "invisible opacity-0",
        ].join(" ")}
      >
        <nav
          /* Links start just under the fixed bar rather than being centred in
             the viewport - vertical centring left a large empty white band at
             the top of the drawer. */
          className="flex h-full flex-col gap-1 px-6 pt-[calc(var(--nav-h)+20px)]"
        >
          {nav.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNav(item.href)}
              className="border-b border-ink/8 py-3.5 font-display text-2xl text-ink transition-colors hover:text-brand"
              style={{
                transitionDelay: open ? `${i * 40}ms` : "0ms",
                transform: open ? "translateY(0)" : "translateY(12px)",
                opacity: open ? 1 : 0,
                transitionProperty: "transform, opacity, color",
                transitionDuration: "450ms",
              }}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={`tel:${contact.phones[0]}`}
            className="mt-6 rounded-full bg-brand px-6 py-3.5 text-center font-semibold text-paper"
          >
            Call {contact.phones[0]}
          </a>
        </nav>
      </div>
    </>
  );
}
