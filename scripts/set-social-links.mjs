/**
 * Sets Robonest's social media URLs on the Odoo website record.
 *
 * Odoo 17+ removed these from Settings and only exposes them through the
 * website footer editor, which is easy to miss. Writing them directly is
 * faster and less error-prone.
 *
 * FILL IN the URLs below (leave a blank string to skip a network), then:
 *   node scripts/set-social-links.mjs
 *
 * The site reads these for the header and footer icons.
 */
import fs from "node:fs";

const LINKS = {
  social_facebook: "https://www.facebook.com/",
  social_instagram: "https://www.instagram.com/",
  social_linkedin: "https://www.linkedin.com/",
  social_twitter: "https://x.com/",
  social_youtube: "https://www.youtube.com/",
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
  Object.entries(LINKS).filter(([, v]) => v && v.trim())
);

if (Object.keys(payload).length === 0) {
  console.log("Nothing to set - fill in the LINKS object at the top of this file.");
  process.exit(0);
}

const [site] = await call("website", "search_read", [[], ["id", "name"]], { limit: 1 });
await call("website", "write", [[site.id], payload]);

const [after] = await call("website", "search_read", [[["id", "=", site.id]], Object.keys(LINKS)], { limit: 1 });

console.log(`Updated website "${site.name}" (id ${site.id})\n`);
for (const key of Object.keys(LINKS)) {
  const v = after[key];
  console.log(`  ${key.replace("social_", "").padEnd(10)} ${v || "(not set)"}`);
}
