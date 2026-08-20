/**
 * Read-only probe of the Odoo instance.
 *
 * Prints ONLY findings - model availability, field names, record counts and
 * access rights. Never prints the API key.
 *
 * Run: node scripts/probe-odoo.mjs
 */
import fs from "node:fs";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .trim()
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const { ODOO_URL, ODOO_DB, ODOO_LOGIN, ODOO_API_KEY } = env;

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
  const j = await res.json();
  if (j.error) throw new Error(j.error.data?.message || j.error.message);
  return j.result;
}

let uid;
async function call(model, method, args = [], kwargs = {}) {
  return rpc("object", "execute_kw", [
    ODOO_DB,
    uid,
    ODOO_API_KEY,
    model,
    method,
    args,
    kwargs,
  ]);
}

const MODELS = [
  ["blog.post", "Blog posts"],
  ["blog.blog", "Blogs (categories)"],
  ["event.event", "Events"],
  ["hr.employee", "Team / employees"],
  ["crm.lead", "CRM leads"],
  ["slide.channel", "eLearning courses"],
  ["website", "Website settings"],
  ["res.company", "Company (social links)"],
];

const WANTED_FIELDS = {
  "blog.post": ["name", "subtitle", "content", "post_date", "published_date", "is_published", "website_meta_title", "website_meta_description", "website_meta_keywords", "tag_ids", "author_id", "cover_properties", "blog_id", "teaser"],
  "event.event": ["name", "date_begin", "date_end", "address_id", "description", "is_published", "website_url", "tag_ids", "organizer_id", "event_type_id", "cover_properties"],
  "hr.employee": ["name", "job_title", "work_email", "image_1920", "department_id", "employee_properties"],
  "crm.lead": ["name", "contact_name", "email_from", "phone", "function", "description", "city", "source_id", "medium_id"],
  "slide.channel": ["name", "description", "is_published", "tag_ids", "total_slides"],
};

console.log("=".repeat(66));
console.log("ODOO PROBE");
console.log("=".repeat(66));

try {
  const v = await rpc("common", "version", []);
  console.log(`version      : ${v.server_version}`);
  console.log(`database     : ${ODOO_DB}`);
  console.log(`login        : ${ODOO_LOGIN}`);

  uid = await rpc("common", "authenticate", [
    ODOO_DB,
    ODOO_LOGIN,
    ODOO_API_KEY,
    {},
  ]);

  if (!uid) {
    console.log("\nAUTH FAILED - the login email is wrong (the key looks fine).");
    console.log("Find the right email: Odoo -> avatar -> My Profile -> Email.");
    process.exit(1);
  }
  console.log(`authenticated: uid ${uid}\n`);

  console.log("-".repeat(66));
  console.log("MODEL ACCESS & RECORD COUNTS");
  console.log("-".repeat(66));

  const available = [];
  for (const [model, label] of MODELS) {
    try {
      const count = await call(model, "search_count", [[]]);
      let canCreate = "?";
      try {
        canCreate = (await call(model, "check_access_rights", ["create"], {
          raise_exception: false,
        }))
          ? "yes"
          : "no";
      } catch {
        canCreate = "n/a";
      }
      console.log(
        `  OK   ${model.padEnd(16)} ${String(count).padStart(5)} records   create=${canCreate}   ${label}`
      );
      available.push(model);
    } catch (e) {
      console.log(`  --   ${model.padEnd(16)} unavailable (${String(e.message).slice(0, 45)})`);
    }
  }

  console.log("\n" + "-".repeat(66));
  console.log("FIELD CHECK (which of the fields we need actually exist)");
  console.log("-".repeat(66));

  for (const [model, wanted] of Object.entries(WANTED_FIELDS)) {
    if (!available.includes(model)) continue;
    const schema = await call(model, "fields_get", [], { attributes: ["type"] });
    const present = wanted.filter((f) => f in schema);
    const missing = wanted.filter((f) => !(f in schema));
    console.log(`\n${model}`);
    console.log(`  present: ${present.join(", ") || "(none)"}`);
    if (missing.length) console.log(`  MISSING: ${missing.join(", ")}`);
  }

  // Sample existing content so we know what is already populated.
  console.log("\n" + "-".repeat(66));
  console.log("EXISTING CONTENT SAMPLE");
  console.log("-".repeat(66));

  for (const [model, fields] of [
    ["blog.blog", ["name"]],
    ["blog.post", ["name", "is_published"]],
    ["event.event", ["name", "date_begin", "is_published"]],
    ["hr.employee", ["name", "job_title"]],
    ["slide.channel", ["name"]],
  ]) {
    if (!available.includes(model)) continue;
    try {
      const rows = await call(model, "search_read", [[], fields], { limit: 8 });
      console.log(`\n${model} (${rows.length} shown)`);
      if (!rows.length) console.log("  (empty)");
      rows.forEach((r) =>
        console.log(
          "  - " +
            fields.map((f) => `${f}=${JSON.stringify(r[f])}`).join("  ")
        )
      );
    } catch (e) {
      console.log(`\n${model}: read failed (${String(e.message).slice(0, 50)})`);
    }
  }

  console.log("\n" + "=".repeat(66));
  console.log("PROBE COMPLETE");
  console.log("=".repeat(66));
} catch (e) {
  console.log(`\nPROBE ERROR: ${e.message}`);
  process.exit(1);
}
