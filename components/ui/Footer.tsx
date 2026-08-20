import Image from "next/image";
import Link from "next/link";
import { contact, nav, site, labs } from "@/content/site";
import { getSocials } from "@/lib/odoo-content";
import SocialIcon from "@/components/ui/SocialIcon";
import { asset } from "@/lib/asset";

export default async function Footer() {
  const year = 2026;
  // Live from Odoo. Networks with no URL are omitted rather than rendered as
  // dead icons - see getSocials().
  const socials = await getSocials();

  return (
    <footer className="bg-night text-paper/70">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <Image
                src={asset("/images/brand/logo.png")}
                alt=""
                width={40}
                height={40}
                className="h-9 w-auto"
              />
              <span className="font-display text-lg text-paper">
                {site.name}
              </span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed">
              {site.description}
            </p>
            {socials.length > 0 && (
            <div className="mt-6 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-paper/15 text-paper/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand hover:bg-brand hover:text-paper"
                >
                  <SocialIcon name={s.label} />
                </a>
              ))}
            </div>
            )}
          </div>

          {/* Links */}
          <div>
            <h3 className="font-display text-sm uppercase tracking-[0.16em] text-paper">
              Explore
            </h3>
            <ul className="mt-5 space-y-1 text-sm">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-block py-1.5 transition-colors hover:text-brand-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-sm uppercase tracking-[0.16em] text-paper">
              Get in touch
            </h3>
            <address className="mt-5 space-y-3 text-sm not-italic">
              <p>
                {contact.addressLabel} — {contact.address}
              </p>
              <p className="space-x-1">
                {contact.phones.map((p, i) => (
                  <span key={p}>
                    <a
                      href={`tel:${p}`}
                      className="inline-block py-1.5 transition-colors hover:text-brand-300"
                    >
                      {p}
                    </a>
                    {i < contact.phones.length - 1 && <span>,</span>}
                  </span>
                ))}
              </p>
              <p>
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-block py-1.5 transition-colors hover:text-brand-300"
                >
                  {contact.email}
                </a>
              </p>
            </address>
          </div>
        </div>

        {/* Lab list strip */}
        <div className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-paper/10 pt-8 text-xs">
          {labs.map((l) => (
            <span key={l.id}>{l.title}</span>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-2 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Copyright © {year} {site.legalName}. All rights reserved.
          </p>
          <p>Built for future-ready classrooms.</p>
        </div>
      </div>
    </footer>
  );
}
