/**
 * Creates the partner schools as Odoo COMPANY CONTACTS, tagged so the website
 * knows where to place them.
 *
 * Why res.partner and not a hardcoded list:
 *   - these schools are genuinely customers, so a lead, a quotation and the
 *     website logo can all point at one record instead of three copies;
 *   - res.partner has `is_published`, unlike hr.employee, so a published
 *     partner's logo is publicly servable;
 *   - adding a school becomes a thing the sales team does anyway.
 *
 * Tag "School" is what puts them in the "Schools We Empower" strip. Removing
 * the tag removes them from the site without deleting the customer record.
 *
 * Run: node scripts/seed-schools.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

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

/** Logos are crests on white - keep them PNG so transparency survives. */
async function logoBase64(file) {
  const p = path.join("public/images/schools", file);
  if (!fs.existsSync(p)) return null;
  const buf = await sharp(p)
    .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  return buf.toString("base64");
}

// res.partner tags live in res.partner.category (the "Tags" field on a contact)
async function tagId(name) {
  const found = await call("res.partner.category", "search", [[["name", "=", name]]], {
    limit: 1,
  });
  return found.length ? found[0] : call("res.partner.category", "create", [{ name }]);
}

const SCHOOL_TAG = await tagId("School");
console.log(`contact tag "School" #${SCHOOL_TAG}\n`);

const SCHOOLS = [
  { name: "Dr. K.N. Modi Global School", file: "kn-modi.jpg", city: "Ghaziabad" },
  { name: "Wisdom World School", file: "wisdom-world.jpg", city: "" },
  { name: "R.S.M. Olympian Public School", file: "rsm-olympian.jpg", city: "Shikarpur" },
  { name: "Bhagirath Public School", file: "bhagirath.webp", city: "Ghaziabad" },
];

for (const s of SCHOOLS) {
  const values = {
    name: s.name,
    is_company: true,
    is_published: true,
    category_id: [[4, SCHOOL_TAG]],
    ...(s.city ? { city: s.city } : {}),
  };
  const b64 = await logoBase64(s.file);
  if (b64) values.image_1920 = b64;

  const found = await call("res.partner", "search", [[["name", "=", s.name]]], { limit: 1 });
  let id;
  if (found.length) {
    await call("res.partner", "write", [[found[0]], values]);
    id = found[0];
  } else {
    id = await call("res.partner", "create", [values]);
  }
  console.log(
    `${found.length ? "updated" : "created"}  #${String(id).padEnd(3)} ${s.name.padEnd(32)} ${b64 ? Math.round((b64.length * 0.75) / 1024) + " KB logo" : "NO LOGO FILE"}`
  );
}

const after = await rpc("object", "execute_kw", [
  env.ODOO_DB, uid, env.ODOO_API_KEY, "res.partner", "search_read",
  [[["category_id.name", "=", "School"]], ["name", "is_published", "image_1920", "city"]],
  { context: { bin_size: true } },
]);
console.log(`\nSchools tagged "School": ${after.length}`);
after.forEach((p) =>
  console.log(`  #${String(p.id).padEnd(3)} ${String(p.name).padEnd(32)} published=${p.is_published} logo=${p.image_1920 || "none"}`)
);
