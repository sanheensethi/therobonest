/**
 * Adds real photos to a finished event, exactly the way the client will:
 * images inside the event's Description.
 *
 * Uploads the local gallery images to Odoo as PUBLIC attachments first, then
 * references their URLs in the description HTML. Public matters - an
 * attachment defaults to private and would render as a broken image.
 *
 * Run: node scripts/seed-event-photos.mjs
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

const EVENT_NAME = "Techno Zone at K.N. Modi Global School";
const PHOTOS = ["g5.jpeg", "g3.jpeg", "g4.jpeg", "g1.jpeg", "g6.jpeg", "g2.jpeg"];

const [event] = await call("event.event", "search_read", [
  [["name", "=", EVENT_NAME]],
  ["name"],
], { limit: 1 });

if (!event) {
  console.log(`Event "${EVENT_NAME}" not found.`);
  process.exit(1);
}

console.log(`Event #${event.id} ${event.name}\n`);

const urls = [];
for (const file of PHOTOS) {
  const p = path.join("public/images/gallery", file);
  if (!fs.existsSync(p)) {
    console.log(`skip ${file} (missing)`);
    continue;
  }
  // Resize before upload: full-size event photos would bloat the database and
  // the page for no visual gain at gallery dimensions.
  const buf = await sharp(p)
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();

  const name = `event-${event.id}-${file.replace(/\.[^.]+$/, "")}.jpg`;
  const existing = await call("ir.attachment", "search", [[["name", "=", name]]], { limit: 1 });

  const values = {
    name,
    datas: buf.toString("base64"),
    mimetype: "image/jpeg",
    res_model: "event.event",
    res_id: event.id,
    // Without this the image is private and renders broken on the public site.
    public: true,
  };

  let id;
  if (existing.length) {
    await call("ir.attachment", "write", [[existing[0]], values]);
    id = existing[0];
  } else {
    id = await call("ir.attachment", "create", [values]);
  }

  const [att] = await call("ir.attachment", "read", [[id], ["checksum"]]);
  const url = `/web/image/${id}-${String(att.checksum).slice(0, 8)}/${name}`;
  urls.push(url);
  console.log(`  #${String(id).padEnd(4)} ${Math.round(buf.length / 1024)} KB  ${url}`);
}

const body = `
<p>Our Integrated Lab installation was showcased alongside student-built robots at the school's annual technology exhibition. Over two hundred students, parents and visiting teachers came through the Techno Zone across the day.</p>
<p>Students demonstrated line-following robots, sensor-based automation and their own Arduino projects, explaining the builds to visitors themselves - which is usually the moment teachers realise how much the students have actually absorbed.</p>
<h3>What was on show</h3>
<ul>
  <li>Student-built line-following and obstacle-avoiding robots</li>
  <li>Arduino sensor projects, including a working smart-irrigation model</li>
  <li>LEGO&reg; Education builds from the junior classes</li>
  <li>A live 3D printer running through the day</li>
</ul>
<p>Thank you to the staff and students of Dr. K.N. Modi Global School for hosting us.</p>
${urls.map((u) => `<img src="${u}" alt="">`).join("\n")}
`.trim();

await call("event.event", "write", [[event.id], { description: body, is_published: true }]);

console.log(`\nDescription updated with ${urls.length} photos.`);
console.log("The event page will show them as a 'How it went' gallery.");
