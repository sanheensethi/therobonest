/**
 * Creates the "placement tag" vocabulary in Odoo.
 *
 * These tags are how a non-technical editor controls WHERE a record shows up
 * on the site: tag an event "Homepage" and it appears in the homepage strip;
 * tag it "Popup" and it becomes the site popup. No code change, no developer.
 *
 * Idempotent - re-running skips anything that already exists.
 * Run: node scripts/setup-odoo-tags.mjs
 */
import fs from "node:fs";

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

/** find-or-create by name, returning the id */
async function ensure(model, name, extra = {}) {
  const found = await call(model, "search", [[["name", "=", name]]], { limit: 1 });
  if (found.length) return { id: found[0], created: false };
  const id = await call(model, "create", [{ name, ...extra }]);
  return { id, created: true };
}

console.log("Creating placement tags\n" + "=".repeat(52));

// event.tag requires a category, so that comes first.
const cat = await ensure("event.tag.category", "Website Placement");
console.log(`event.tag.category  "Website Placement" #${cat.id} ${cat.created ? "(created)" : "(exists)"}`);

const PLAN = [
  ["event.tag", ["Homepage", "Popup", "Astronomy", "AI & Robotics", "Workshop", "Exhibition"], { category_id: cat.id }],
  ["blog.tag", ["Homepage", "Astronomy", "AI & Robotics", "Announcement"], {}],
  ["slide.tag", ["Homepage", "Astronomy", "AI & Robotics", "Lab Setup", "Student Projects", "Events"], {}],
];

for (const [model, names, extra] of PLAN) {
  const out = [];
  for (const name of names) {
    try {
      const r = await ensure(model, name, extra);
      out.push(`${name}#${r.id}${r.created ? "" : "*"}`);
    } catch (e) {
      out.push(`${name}=FAILED(${String(e.message).slice(0, 40)})`);
    }
  }
  console.log(`${model.padEnd(12)} ${out.join("  ")}`);
}

console.log("\n* = already existed");
console.log("Done. These now appear in the Tags dropdown on each record.");
