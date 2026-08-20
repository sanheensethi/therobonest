/**
 * Enquiry form -> Odoo CRM lead.
 *
 * Runs server-side on Netlify. This exists because the Odoo API key has FULL
 * write access to the database (CRM, invoicing, accounting) - it can never be
 * shipped to a browser. The form posts here; only this function holds the key.
 *
 * Required Netlify environment variables (Site config -> Environment
 * variables). Note: NO `NEXT_PUBLIC_` prefix, so they stay server-only.
 *   ODOO_URL      https://www.therobonest.com
 *   ODOO_DB       robonest-private-limited
 *   ODOO_LOGIN    the Odoo user's email
 *   ODOO_API_KEY  API key from Odoo -> My Profile -> Account Security
 */

const { ODOO_URL, ODOO_DB, ODOO_LOGIN, ODOO_API_KEY } = process.env;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function rpc(service, method, args) {
  const res = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
      id: Date.now(),
    }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.data?.message || data.error.message || "Odoo error");
  }
  return data.result;
}

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  if (!ODOO_URL || !ODOO_DB || !ODOO_LOGIN || !ODOO_API_KEY) {
    // Surface a clear operator error rather than silently losing the lead.
    return json(500, {
      error: "Odoo is not configured on this deployment.",
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  // Honeypot: pretend success so bots get no signal.
  if (body._trap) return json(200, { ok: true });

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();

  if (!name) return json(400, { error: "Please enter your name." });
  if (!/^\S+@\S+\.\S+$/.test(email))
    return json(400, { error: "Please enter a valid email address." });
  if (phone.replace(/\D/g, "").length < 10)
    return json(400, { error: "Please enter a valid 10-digit phone number." });

  const school = String(body.school || "").trim();
  const designation = String(body.designation || "").trim();
  const state = String(body.state || "").trim();
  const subject = String(body.subject || "").trim();
  const requirement = String(body.requirement || "").trim();

  // Everything the form captured, kept in the lead's internal notes so the
  // sales team sees the full context even for fields CRM has no column for.
  const description = [
    requirement && `Requirement: ${requirement}`,
    subject && `Subject: ${subject}`,
    school && `School: ${school}`,
    designation && `Designation: ${designation}`,
    state && `State: ${state}`,
    "",
    "Submitted via the therobonest.com enquiry form.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const uid = await rpc("common", "authenticate", [
      ODOO_DB,
      ODOO_LOGIN,
      ODOO_API_KEY,
      {},
    ]);
    if (!uid) return json(502, { error: "Odoo rejected the credentials." });

    const leadId = await rpc("object", "execute_kw", [
      ODOO_DB,
      uid,
      ODOO_API_KEY,
      "crm.lead",
      "create",
      [
        {
          // Opportunity title - school name first, since that is how the
          // sales team recognises a lead.
          name: school ? `Lab enquiry - ${school}` : `Lab enquiry - ${name}`,
          contact_name: name,
          email_from: email,
          phone,
          function: designation,
          city: state,
          description,
          type: "lead",
        },
      ],
    ]);

    return json(200, { ok: true, leadId });
  } catch (err) {
    return json(502, {
      error: `Could not reach Odoo (${String(err.message).slice(0, 120)})`,
    });
  }
};
