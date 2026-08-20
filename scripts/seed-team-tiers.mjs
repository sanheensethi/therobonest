/**
 * Splits the team into the two tiers the site renders, using fields Odoo
 * actually has:
 *
 *   category_ids     -> employee Tags: "Leadership" or "Executive Team".
 *                       Leadership renders as large photo cards with a quote;
 *                       Executive Team renders as circular portraits.
 *   additional_note  -> the quote shown under a leadership card.
 *
 * hr.employee has no "quote" or "is founder" field, so these two carry the
 * meaning. Both are editable in the Odoo employee form (Tags at the top, the
 * note under the HR Settings tab), so the client can promote someone between
 * tiers or change a quote without a developer.
 *
 * Run: node scripts/seed-team-tiers.mjs
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
  if (found.length) return found[0];
  return call("hr.employee.category", "create", [{ name }]);
}

const LEADERSHIP = await tagId("Leadership");
const EXEC = await tagId("Executive Team");
console.log(`tags: Leadership #${LEADERSHIP}, Executive Team #${EXEC}\n`);

const PLAN = [
  ["Achal Arya", LEADERSHIP, "Passionate about transforming education through AI, Robotics and Innovation."],
  ["Tushar Arya", LEADERSHIP, "Committed to empowering students with future-ready skills and technology."],
  ["Siddharth Sharma", LEADERSHIP, "Dream Big, Learn Bigger."],
  ["Manish Bhaskar", LEADERSHIP, "Building Tomorrow's Innovators."],
  ["Vibhu Sharma", EXEC, ""],
  ["Suhani Sharma", EXEC, ""],
  ["Prashant", EXEC, ""],
  ["Ayushi", EXEC, ""],
];

for (const [name, tag, quote] of PLAN) {
  const ids = await call("hr.employee", "search", [[["name", "=", name]]], { limit: 1 });
  if (!ids.length) {
    console.log(`SKIP    ${name} (not found)`);
    continue;
  }
  const values = { category_ids: [[6, 0, [tag]]] };
  if (quote) values.additional_note = quote;
  await call("hr.employee", "write", [[ids[0]], values]);
  console.log(
    `#${String(ids[0]).padEnd(3)} ${name.padEnd(18)} ${tag === LEADERSHIP ? "Leadership    " : "Executive Team"} ${quote ? "+ quote" : ""}`
  );
}

const after = await call(
  "hr.employee",
  "search_read",
  [[], ["name", "job_title", "category_ids", "additional_note"]],
  { order: "id asc" }
);
console.log("\nFinal:");
after.forEach((e) =>
  console.log(
    `  #${String(e.id).padEnd(3)} ${String(e.name).padEnd(18)} tags=${JSON.stringify(e.category_ids)} note=${e.additional_note ? "yes" : "-"}`
  )
);
