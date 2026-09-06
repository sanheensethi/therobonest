import Link from "next/link";
import Mascot from "@/components/ui/Mascot";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center bg-night pt-[var(--nav-h)] text-paper">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <Mascot size={160} expression="sad" shrug trackCursor label="Robot mascot shrugging" />
        <p className="mt-8 font-display text-sm uppercase tracking-[0.2em] text-brand-300">
          Error 404
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">
          This circuit goes nowhere
        </h1>
        <p className="mt-4 max-w-md text-paper/70">
          The page you asked for has been moved, renamed, or never existed.
          Let&apos;s get you back to the lab.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-brand-600"
          >
            Back home
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-paper/25 px-6 py-3 text-sm font-semibold text-paper transition-colors hover:border-brand hover:text-brand-300"
          >
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
