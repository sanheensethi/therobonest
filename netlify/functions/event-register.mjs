/**
 * Event registration -> Odoo event.registration.
 *
 * Same least-privilege shape as enquiry.mjs: POST only, one model, one
 * operation, whitelisted fields. The Odoo API key never leaves this function.
 *
 * Two server-side guards that cannot be trusted to the browser:
 *   1. the event must be PUBLISHED - otherwise a draft event's id could be
 *      used to register against something not meant to be public;
 *   2. registrations must be OPEN - Odoo computes this from the dates and
 *      remaining seats, so a closed or finished event cannot be signed up for
 *      even if someone replays an old request.
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
    return json(500, { error: "Odoo is not configured on this deployment." });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  if (body._trap) return json(200, { ok: true });

  const eventId = Number(body.eventId);
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();

  if (!Number.isInteger(eventId) || eventId <= 0)
    return json(400, { error: "Missing event." });
  if (!name) return json(400, { error: "Please enter your name." });
  if (!/^\S+@\S+\.\S+$/.test(email))
    return json(400, { error: "Please enter a valid email address." });
  if (phone.replace(/\D/g, "").length < 10)
    return json(400, { error: "Please enter a valid 10-digit phone number." });

  try {
    const uid = await rpc("common", "authenticate", [
      ODOO_DB,
      ODOO_LOGIN,
      ODOO_API_KEY,
      {},
    ]);
    if (!uid) return json(502, { error: "Odoo rejected the credentials." });

    const call = (model, method, args = [], kwargs = {}) =>
      rpc("object", "execute_kw", [ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs]);

    // Guard: published AND open for registration.
    const events = await call(
      "event.event",
      "search_read",
      [
        [["id", "=", eventId], ["is_published", "=", true]],
        ["name", "event_registrations_open"],
      ],
      { limit: 1 }
    );
    const event = events[0];
    if (!event) return json(404, { error: "That event is not available." });
    if (!event.event_registrations_open)
      return json(409, { error: "Registration for this event has closed." });

    const registrationId = await call("event.registration", "create", [
      {
        event_id: eventId,
        name,
        email,
        phone,
      },
    ]);

    return json(200, { ok: true, registrationId, event: event.name });
  } catch (err) {
    return json(502, {
      error: `Could not reach Odoo (${String(err.message).slice(0, 120)})`,
    });
  }
};
