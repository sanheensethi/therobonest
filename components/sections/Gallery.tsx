"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { gallery } from "@/content/site";
import SectionHeading from "@/components/ui/SectionHeading";
import { useReveal } from "@/components/motion/useReveal";
import Icon from "@/components/ui/Icon";
import { registerGsap, prefersReducedMotion } from "@/lib/motion";
import { asset } from "@/lib/asset";

export default function Gallery() {
  const ref = useReveal<HTMLElement>({ stagger: 0.07 });
  const [active, setActive] = useState<number | null>(null);

  // Thumbnail nodes, so the lightbox can grow FROM (and shrink back INTO)
  // whichever tile is currently in view - including after arrow navigation.
  const thumbsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const figureRef = useRef<HTMLDivElement | null>(null);
  const closingRef = useRef(false);
  // True only for the open triggered by a thumbnail click. Stepping with the
  // arrows re-renders the figure too, and re-running the zoom on every step
  // felt like the popup kept re-opening; steps just crossfade.
  const zoomFromThumb = useRef(false);
  const touchX = useRef<number | null>(null);
  // Phones get a vertical, snap-scrolling strip of every photo (the current
  // one full, neighbours faded) instead of the desktop one-at-a-time viewer.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const openedAt = useRef<number | null>(null);

  // Strip: jump to the tapped photo on open, then let scrolling drive `active`.
  useEffect(() => {
    if (!isMobile || active === null) return;
    const strip = stripRef.current;
    if (!strip) return;
    if (openedAt.current === null) {
      openedAt.current = active;
      strip.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: "center" });
    }
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(Number((hit.target as HTMLElement).dataset.idx));
      },
      { root: strip, threshold: [0.55, 0.75] }
    );
    strip.querySelectorAll("[data-idx]").forEach((n) => io.observe(n));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, active === null]);
  useEffect(() => {
    if (active === null) openedAt.current = null;
  }, [active]);

  /**
   * FLIP: the lightboxed image is rendered at its FINAL layout position, then
   * inverted back onto the thumbnail's rect and released. Animating the real
   * element means no duplicate node and no mid-flight layout thrash - the
   * browser only ever animates transform + opacity.
   */
  useLayoutEffect(() => {
    if (active === null) return;
    const figure = figureRef.current;
    const backdrop = backdropRef.current;
    if (!backdrop) return;
    if (isMobile || !figure) {
      backdrop.style.opacity = "1";
      return;
    }

    if (prefersReducedMotion()) {
      backdrop.style.opacity = "1";
      return;
    }

    const { gsap } = registerGsap();
    const thumb = thumbsRef.current[active];
    const to = figure.getBoundingClientRect();

    const ctx = gsap.context(() => {
      gsap.to(backdrop, { opacity: 1, duration: 0.3, ease: "power2.out" });

      if (!zoomFromThumb.current) {
        // arrow / keyboard / swipe step: a quick crossfade, no zoom
        gsap.from(figure, { opacity: 0, duration: 0.22, ease: "power2.out" });
        return;
      }
      zoomFromThumb.current = false;

      if (!thumb) {
        gsap.from(figure, { opacity: 0, scale: 0.94, duration: 0.4, ease: "power3.out" });
        return;
      }

      const from = thumb.getBoundingClientRect();
      gsap.from(figure, {
        x: from.left - to.left,
        y: from.top - to.top,
        scaleX: from.width / to.width,
        scaleY: from.height / to.height,
        duration: 0.55,
        ease: "power3.out",
        transformOrigin: "top left",
      });
    }, figure);

    return () => ctx.revert();
  }, [active, isMobile]);

  /** Reverse the FLIP, then unmount. */
  const close = useCallback(() => {
    const figure = figureRef.current;
    const backdrop = backdropRef.current;

    if (active === null || closingRef.current) return;

    if (prefersReducedMotion() || isMobile || !figure || !backdrop) {
      setActive(null);
      return;
    }

    closingRef.current = true;
    const { gsap } = registerGsap();
    const thumb = thumbsRef.current[active];
    const from = figure.getBoundingClientRect();

    const done = () => {
      closingRef.current = false;
      setActive(null);
    };

    gsap.to(backdrop, { opacity: 0, duration: 0.35, ease: "power2.in" });

    if (!thumb) {
      gsap.to(figure, {
        opacity: 0,
        scale: 0.94,
        duration: 0.3,
        ease: "power2.in",
        onComplete: done,
      });
      return;
    }

    const target = thumb.getBoundingClientRect();
    gsap.to(figure, {
      x: target.left - from.left,
      y: target.top - from.top,
      scaleX: target.width / from.width,
      scaleY: target.height / from.height,
      opacity: 0.35,
      duration: 0.45,
      ease: "power3.inOut",
      transformOrigin: "top left",
      onComplete: done,
    });
  }, [active, isMobile]);

  const step = useCallback(
    (dir: 1 | -1) =>
      setActive((i) =>
        i === null ? null : (i + dir + gallery.images.length) % gallery.images.length
      ),
    []
  );

  // Keyboard control.
  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close, step]);

  // Freeze Lenis while open, so the page can't scroll behind the lightbox and
  // strand the FLIP's return target off-screen.
  useEffect(() => {
    const lenis = (window as Window & { lenis?: { stop(): void; start(): void } })
      .lenis;
    if (!lenis) return;
    if (active !== null) lenis.stop();
    else lenis.start();
    return () => lenis.start();
  }, [active]);

  return (
    <section data-nesty="gallery" ref={ref} id="gallery" className="bg-paper">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <SectionHeading eyebrow={gallery.eyebrow} title={gallery.title} />

        <div className="mt-12 grid auto-rows-[200px] grid-cols-2 gap-4 md:grid-cols-4">
          {gallery.images.map((src, i) => (
            <button
              key={src}
              ref={(n) => {
                thumbsRef.current[i] = n;
              }}
              type="button"
              data-reveal="scale"
              onClick={() => {
                zoomFromThumb.current = true;
                setActive(i);
              }}
              aria-label={`Open gallery image ${i + 1}`}
              className={[
                "group relative overflow-hidden rounded-[var(--radius-card)] border border-ink/8",
                i === 0 ? "col-span-2 row-span-2" : "",
                i === 3 ? "md:col-span-2" : "",
              ].join(" ")}
            >
              <Image
                src={asset(src)}
                alt={`Robonest lab session ${i + 1}`}
                fill
                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-700 ease-[var(--ease-brand)] group-hover:scale-[1.07]"
              />
              <span className="absolute inset-0 bg-night/0 transition-colors duration-500 group-hover:bg-night/35" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {active !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image viewer"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          onClick={close}
        >
          {/* Backdrop is its own layer so it can fade independently of the
              image's FLIP transform. */}
          <div
            ref={backdropRef}
            aria-hidden
            className="absolute inset-0 bg-paper/96 opacity-0 backdrop-blur-sm"
          />

          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-ink text-paper shadow-lg shadow-ink/20 transition-all hover:scale-105 hover:bg-brand"
          >
            <Icon name="close" className="h-5 w-5" strokeWidth={2} />
          </button>

          {isMobile ? (
            <div
              ref={stripRef}
              data-lenis-prevent
              className="no-scrollbar absolute inset-0 z-10 snap-y snap-mandatory overflow-y-auto py-[12vh]"
              onClick={close}
            >
              {gallery.images.map((src, i) => (
                <div
                  key={src}
                  data-idx={i}
                  className="flex h-[76vh] snap-center items-center justify-center px-4 py-3 transition-opacity duration-300"
                  style={{ opacity: i === active ? 1 : 0.3 }}
                >
                  <div
                    className="relative aspect-[4/3] max-h-full w-full overflow-hidden rounded-2xl bg-sand shadow-2xl shadow-ink/15 ring-1 ring-ink/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Image
                      src={asset(src)}
                      alt={`Robonest lab session ${i + 1}`}
                      fill
                      sizes="100vw"
                      className="object-contain"
                      priority={i === active}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Previous image"
            className="absolute left-3 z-20 hidden h-12 w-12 items-center justify-center rounded-full bg-ink text-paper shadow-lg shadow-ink/20 transition-all hover:scale-105 hover:bg-brand sm:left-6 sm:flex"
          >
            <Icon name="chevronLeft" className="h-6 w-6" strokeWidth={2} />
          </button>

          {!isMobile && (
          <div
            ref={figureRef}
            className="relative z-10 h-[68vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-sand shadow-2xl shadow-ink/15 ring-1 ring-ink/10 sm:h-[78vh]"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              touchX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              touchX.current = null;
              if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
            }}
          >
            <Image
              src={asset(gallery.images[active])}
              alt={`Robonest lab session ${active + 1}`}
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Next image"
            className="absolute right-3 z-20 hidden h-12 w-12 items-center justify-center rounded-full bg-ink text-paper shadow-lg shadow-ink/20 transition-all hover:scale-105 hover:bg-brand sm:right-6 sm:flex"
          >
            <Icon name="chevronRight" className="h-6 w-6" strokeWidth={2} />
          </button>

          <p className="absolute bottom-5 z-20 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-paper">
            {active + 1} / {gallery.images.length}
          </p>
        </div>
      )}
    </section>
  );
}
