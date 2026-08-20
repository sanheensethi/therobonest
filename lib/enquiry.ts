import { contact } from "@/content/site";

export type EnquiryResult = { ok: true } | { ok: false; error: string };

/**
 * Shared submit path for BOTH enquiry forms (the compact one in the hero and
 * the full one further down the page), so validation and the delivery
 * fallback can never drift apart between them.
 *
 * Posts JSON to NEXT_PUBLIC_FORM_ENDPOINT. With no endpoint configured it
 * degrades to a prefilled mailto: rather than silently dropping the lead.
 */
export async function submitEnquiry(
  data: Record<string, string>
): Promise<EnquiryResult> {
  // Honeypot: bots fill hidden fields, humans never see them. Report success
  // so the bot has no signal that it was rejected.
  if (data._trap) return { ok: true };

  if (!data.name?.trim()) {
    return { ok: false, error: "Please enter your name." };
  }
  if (!/^\S+@\S+\.\S+$/.test(data.email ?? "")) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if ((data.phone ?? "").replace(/\D/g, "").length < 10) {
    return { ok: false, error: "Please enter a valid 10-digit phone number." };
  }

  /**
   * Default target is our own Netlify Function, which forwards the enquiry
   * into Odoo CRM as a crm.lead. The Odoo API key has full write access to
   * the database, so it lives ONLY in that function's environment - never in
   * this browser bundle.
   *
   * NEXT_PUBLIC_FORM_ENDPOINT overrides it (Formspree, Web3Forms, etc.), and
   * if the endpoint fails we fall back to a prefilled mailto rather than
   * losing the lead.
   */
  const endpoint =
    process.env.NEXT_PUBLIC_FORM_ENDPOINT || "/.netlify/functions/enquiry";

  const mailtoFallback = () => {
    const body = Object.entries(data)
      .filter(([k, v]) => k !== "_trap" && v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(
      `Lab enquiry - ${data.school || data.name}`
    )}&body=${encodeURIComponent(body)}`;
    return { ok: true };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      // The function returns a readable reason for validation failures.
      let reason = `Request failed (${res.status})`;
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) reason = body.error;
      } catch {
        /* keep the status-code message */
      }
      throw new Error(reason);
    }
    return { ok: true };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Something went wrong";

    // Endpoint unreachable (e.g. running locally without `netlify dev`):
    // hand off to email so the enquiry still reaches someone.
    if (detail.includes("fetch") || detail.includes("Failed")) {
      mailtoFallback();
      return { ok: true };
    }
    return {
      ok: false,
      error: `${detail} Please call ${contact.phones[0]} if this persists.`,
    };
  }
}

/** Indian states + UTs, for the enquiry form's State select. */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman & Nicobar Islands",
  "Chandigarh",
  "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;
