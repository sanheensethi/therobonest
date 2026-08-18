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

  const endpoint = process.env.NEXT_PUBLIC_FORM_ENDPOINT;

  if (!endpoint) {
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
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return { ok: true };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Something went wrong";
    return {
      ok: false,
      error: `${detail}. Please call ${contact.phones[0]} instead.`,
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
