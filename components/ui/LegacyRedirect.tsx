"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Client-side redirect for the old Odoo URLs (/about-robonest, /contactus).
 * A static export cannot emit real 301s - those belong in host config
 * (netlify.toml / vercel.json / .htaccess, see DEPLOY.md). This keeps the
 * links working regardless, and renders a real anchor so crawlers and
 * no-JS visitors still have a path forward.
 */
export default function LegacyRedirect({
  to,
  label,
}: {
  to: string;
  label: string;
}) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-sand px-6">
      <div className="text-center">
        <p className="text-sm text-ink-400">Redirecting…</p>
        <Link
          href={to}
          className="mt-3 inline-block font-display text-2xl text-brand underline"
        >
          Continue to {label}
        </Link>
      </div>
    </section>
  );
}
