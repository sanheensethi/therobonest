/**
 * Sets employee tags DETERMINISTICALLY.
 *
 * Uses Odoo command 6 (replace the whole set) rather than 4 (add one). An
 * earlier run used 4, so tags accumulated across scripts and every employee
 * ended up carrying "Homepage" - the homepage then showed all eight people
 * instead of the five intended. With 6 the record ends up exactly as listed
 * here regardless of what it had before, so re-running is always safe.
 *
 *   Leadership      -> large photo card with a quote
 *   Executive Team  -> circular portrait (About page only)
 *   Homepage        -> appears in the homepage team section
 *
 * Run: node scripts/set-team-tags.mjs
 */
import fs from "node:fs";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

async function rpc(service, method, args) {
  const r = await fetch(`${env.ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
      id: 1,
    }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.data?.message || j.error.message);
  return j.result;
}

const uid = await rpc("common", "authenticate", [
  env.ODOO_DB,
  env.ODOO_LOGIN,
  env.ODOO_API_KEY,
  {},
]);
const call = (m, meth, a = [], k = {}) =>
  rpc("object", "execute_kw", [env.ODOO_DB, uid, env.ODOO_API_KEY, m, meth, a, k]);

async function tagId(name) {
  const found = await call("hr.employee.category", "search", [[["name", "=", name]]], {
    limit: 1,
  });
  return found.length ? found[0] : call("hr.employee.category", "create", [{ name }]);
}

const LEAD = await tagId("Leadership");
const EXEC = await tagId("Executive Team");
const HOME = await tagId("Homepage");

/** name -> exact tag set it should end up with */
const PLAN = [
  ["Achal Arya", [LEAD, HOME]],
  ["Tushar Arya", [LEAD, HOME]],
  ["Siddharth Sharma", [LEAD, HOME]],
  ["Manish Bhaskar", [LEAD, HOME]],
  ["Vibhu Sharma", [EXEC, HOME]],
  ["Suhani Sharma", [EXEC]],
  ["Prashant", [EXEC]],
  ["Ayushi", [EXEC]],
];

const label = (ids) =>
  ids
    .map((i) => (i === LEAD ? "Leadership" : i === EXEC ? "Executive" : "Homepage"))
    .join(" + ");

for (const [name, tags] of PLAN) {
  const ids = await call("hr.employee", "search", [[["name", "=", name]]], { limit: 1 });
  if (!ids.length) {
    console.log(`SKIP  ${name} (not found)`);
    continue;
  }
  // command 6 = replace the entire set
  await call("hr.employee", "write", [[ids[0]], { category_ids: [[6, 0, tags]] }]);
  console.log(`#${String(ids[0]).padEnd(3)} ${name.padEnd(18)} ${label(tags)}`);
}

const home = await call("hr.employee", "search_read", [
  [["category_ids.name", "=", "Homepage"]],
  ["name"],
], { order: "id asc" });
const all = await call("hr.employee", "search_count", [[]]);

console.log(`\nhomepage team: ${home.length} of ${all}`);
console.log("  " + home.map((h) => h.name).join(", "));
