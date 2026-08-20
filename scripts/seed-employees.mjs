/**
 * Replaces the test employee records with Robonest's real team, uploading the
 * photos that already live in public/images/team/.
 *
 * Photos are converted to JPEG before upload: Odoo's image pipeline handles
 * JPEG/PNG reliably, while WebP support depends on how its imaging library was
 * built - not worth gambling a silent failure on.
 *
 * Prashant and Ayushi have no photo on file, so they are created without one
 * and the site draws initials for them (Odoo's own placeholder is a grey
 * silhouette, which reads as a broken image).
 *
 * Run: node scripts/seed-employees.mjs
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

/** Read a local image and return base64 JPEG, or null if the file is absent. */
async function photoBase64(file) {
  if (!file) return null;
  const p = path.join("public/images/team", file);
  if (!fs.existsSync(p)) return null;
  const buf = await sharp(p)
    .resize({ width: 1024, height: 1280, fit: "cover", position: "top" })
    .jpeg({ quality: 88 })
    .toBuffer();
  return buf.toString("base64");
}

const TEAM = [
  { name: "Achal Arya", job: "Founder & CEO", file: "achal-arya.webp" },
  { name: "Tushar Arya", job: "Co-Founder & Director", file: "tushar-arya.webp" },
  { name: "Siddharth Sharma", job: "CFO", file: "siddharth-sharma.webp" },
  { name: "Manish Bhaskar", job: "CRO", file: "manish-bhaskar.webp" },
  { name: "Vibhu Sharma", job: "Chief Technical Officer", file: "vibhu-sharma.webp" },
  { name: "Suhani Sharma", job: "Sr. Trainer - AI & Robotics", file: "suhani-sharma.webp" },
  { name: "Prashant", job: "Trainer - AI & Robotics", file: null },
  { name: "Ayushi", job: "Trainer - AI & Robotics", file: null },
];

const KEEP = new Set(TEAM.map((t) => t.name));

console.log("Employees\n" + "=".repeat(60));

/* ---------------------------------------------------- remove test records */

const existing = await call("hr.employee", "search_read", [[], ["name"]], { limit: 100 });
for (const e of existing) {
  if (KEEP.has(e.name)) continue;
  try {
    await call("hr.employee", "unlink", [[e.id]]);
    console.log(`removed  #${e.id} ${e.name}`);
  } catch {
    // Deletion can be blocked by linked records (a user account, timesheets).
    // Archiving hides it from the site just as effectively.
    try {
      await call("hr.employee", "write", [[e.id], { active: false }]);
      console.log(`archived #${e.id} ${e.name} (delete blocked by linked records)`);
    } catch (err2) {
      console.log(`SKIPPED  #${e.id} ${e.name}: ${String(err2.message).slice(0, 60)}`);
    }
  }
}

/* -------------------------------------------------------- create the team */

for (const t of TEAM) {
  // hr.employee has no `sequence` field, so display order comes from creation
  // order: the site reads employees with `order: "id asc"`.
  const values = { name: t.name, job_title: t.job };
  const b64 = await photoBase64(t.file);
  if (b64) values.image_1920 = b64;

  const found = await call("hr.employee", "search", [[["name", "=", t.name]]], { limit: 1 });
  let id;
  if (found.length) {
    await call("hr.employee", "write", [[found[0]], values]);
    id = found[0];
  } else {
    id = await call("hr.employee", "create", [values]);
  }
  const kb = b64 ? Math.round((b64.length * 0.75) / 1024) : 0;
  console.log(
    `${found.length ? "updated" : "created"}  #${String(id).padEnd(3)} ${t.name.padEnd(18)} ${t.job.padEnd(28)} ${b64 ? kb + " KB photo" : "no photo -> initials"}`
  );
}

/* ------------------------------------------------------------- verify */

const after = await rpc("object", "execute_kw", [
  env.ODOO_DB, uid, env.ODOO_API_KEY, "hr.employee", "search_read",
  [[], ["name", "job_title", "image_1920"]], { context: { bin_size: true } },
]);

console.log("\n" + "-".repeat(60));
console.log("Final state (photo size decides photo vs initials, threshold 2 KB):");
after.forEach((e) =>
  console.log(`  #${String(e.id).padEnd(3)} ${String(e.name).padEnd(18)} ${String(e.job_title || "-").padEnd(28)} ${e.image_1920 || "none"}`)
);
