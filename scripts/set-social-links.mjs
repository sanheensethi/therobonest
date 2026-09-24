/**
 * Sets Robonest's social media URLs on the Odoo website record.
 *
 * Odoo 17+ removed these from Settings and only exposes them through the
 * website footer editor, which is easy to miss. Writing them directly is
 * faster and less error-prone.
 *
 * FILL IN the URLs below (a blank string clears that network), then:
 *   node scripts/set-social-links.mjs
 *
 * The site reads these for the header and footer icons.
 */
import fs from "node:fs";

// A blank string CLEARS that network in Odoo (the site then shows no icon).
const LINKS = {
  social_facebook: "https://www.facebook.com/robonest2026",
  social_instagram: "https://www.instagram.com/robonest2026",
  social_linkedin: "",
  social_twitter: "",
  social_youtube: "https://www.youtube.com/@Robonest2026",
};

/* ------------------------------------------------------------------ */

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").trim().split("\n").filter(Boolean).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);

async function rpc(service, method, args) {
  const r = await fetch(`${env.ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "call", params: { service, method, args }, id: 1 }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.data?.message || j.error.message);
  return j.result;
}

const uid = await rpc("common", "authenticate", [env.ODOO_DB, env.ODOO_LOGIN, env.ODOO_API_KEY, {}]);
const call = (model, method, args = [], kwargs = {}) =>
  rpc("object", "execute_kw", [env.ODOO_DB, uid, env.ODOO_API_KEY, model, method, args, kwargs]);

const payload = Object.fromEntries(
  Object.entries(LINKS).map(([k, v]) => [k, v && v.trim() ? v.trim() : false])
);

const [site] = await call("website", "search_read", [[], ["id", "name"]], { limit: 1 });
await call("website", "write", [[site.id], payload]);

const [after] = await call("website", "search_read", [[["id", "=", site.id]], Object.keys(LINKS)], { limit: 1 });

console.log(`Updated website "${site.name}" (id ${site.id})\n`);
for (const key of Object.keys(LINKS)) {
  const v = after[key];
  console.log(`  ${key.replace("social_", "").padEnd(10)} ${v || "(not set)"}`);
}
