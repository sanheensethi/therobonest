import type { Metadata } from "next";
import { contact, contactPage } from "@/content/site";
import PageHero from "@/components/sections/PageHero";
import EnquiryForm from "@/components/sections/EnquiryForm";
import Faq from "@/components/sections/Faq";

export const metadata: Metadata = {
  title: "Contact",
  description: contactPage.body,
};

export default function ContactPage() {
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    contact.mapQuery
  )}&output=embed`;

  return (
    <>
      <PageHero
        eyebrow={contactPage.eyebrow}
        title={contactPage.title}
        body={contactPage.body}
        image="/images/gallery/g4.jpeg"
      />

      <EnquiryForm />

      {/* Real location — the previous site shipped San Francisco transit
          directions here as unedited template content. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div>
              <h2 className="font-display text-3xl leading-tight text-ink">
                Come visit us
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-700">
                {contactPage.responseNote}
              </p>

              <dl className="mt-8 space-y-6 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-brand">
                    {contact.addressLabel}
                  </dt>
                  <dd className="mt-1.5 text-ink-700">{contact.address}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-brand">
                    Phone
                  </dt>
                  <dd className="mt-1.5 space-y-1">
                    {contact.phones.map((p) => (
                      <a
                        key={p}
                        href={`tel:${p}`}
                        className="block py-1.5 text-ink-700 transition-colors hover:text-brand"
                      >
                        {p}
                      </a>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-brand">
                    Email
                  </dt>
                  <dd className="mt-1.5">
                    <a
                      href={`mailto:${contact.email}`}
                      className="inline-block py-1.5 text-ink-700 transition-colors hover:text-brand"
                    >
                      {contact.email}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="overflow-hidden rounded-[var(--radius-card)] border border-ink/10">
              <iframe
                src={mapSrc}
                title={`Map showing ${contact.address}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-80 w-full lg:h-[26rem]"
              />
            </div>
          </div>
        </div>
      </section>

      <Faq />
    </>
  );
}
