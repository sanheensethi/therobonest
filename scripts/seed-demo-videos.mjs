/**
 * Seeds DEMO videos into Odoo eLearning so the Videos page and the homepage
 * video block can be reviewed.
 *
 * The YouTube ids here are PLACEHOLDERS - every title says so. Replace the URL
 * on each record in Odoo with a real Robonest video; the site picks up the new
 * thumbnail, title and duration on the next build.
 *
 * Run: node scripts/seed-demo-videos.mjs
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

async function upsert(model, name, values) {
  const found = await call(model, "search", [[["name", "=", name]]], { limit: 1 });
  if (found.length) {
    await call(model, "write", [[found[0]], values]);
    return { id: found[0], created: false };
  }
  return { id: await call(model, "create", [{ name, ...values }]), created: true };
}

const tagId = async (name) => {
  const r = await call("slide.tag", "search", [[["name", "=", name]]], { limit: 1 });
  return r[0] ?? null;
};

console.log("Seeding demo videos\n" + "=".repeat(58));

// Courses double as the category chips on /videos.
const COURSES = ["Lab Setup", "Student Projects", "Astronomy", "Events"];
const courseIds = {};
for (const name of COURSES) {
  const r = await upsert("slide.channel", name, {
    description: `${name} videos from Robonest labs and programmes.`,
    is_published: true,
  });
  courseIds[name] = r.id;
  console.log(`course      #${r.id} ${r.created ? "created" : "updated"}  ${name}`);
}

const tHome = await tagId("Homepage");
const tAstro = await tagId("Astronomy");
const tAi = await tagId("AI & Robotics");

const VIDEOS = [
  { name: "SAMPLE - Inside an Integrated Robotics Lab", course: "Lab Setup", yt: "dQw4w9WgXcQ", tags: [tHome], mins: 3.4 },
  { name: "SAMPLE - Students Build a Line-Following Robot", course: "Student Projects", yt: "dQw4w9WgXcQ", tags: [tHome, tAi], mins: 5.2 },
  { name: "SAMPLE - Stargazing Session with the Astronomy Lab", course: "Astronomy", yt: "dQw4w9WgXcQ", tags: [tAstro], mins: 4.0 },
  { name: "SAMPLE - Robotics Exhibition Highlights", course: "Events", yt: "dQw4w9WgXcQ", tags: [], mins: 2.8 },
  { name: "SAMPLE - Teacher Training Programme", course: "Lab Setup", yt: "dQw4w9WgXcQ", tags: [], mins: 6.1 },
];

for (const v of VIDEOS) {
  const r = await upsert("slide.slide", v.name, {
    channel_id: courseIds[v.course],
    slide_category: "video",
    url: `https://www.youtube.com/watch?v=${v.yt}`,
    is_published: true,
    // Odoo stores completion_time in HOURS
    completion_time: v.mins / 60,
    tag_ids: [[6, 0, v.tags.filter(Boolean)]],
  });
  console.log(`video       #${r.id} ${r.created ? "created" : "updated"}  [${v.course}]  ${v.name.slice(0, 40)}`);
}

// Confirm Odoo resolved the YouTube ids itself.
const check = await call("slide.slide", "search_read", [[["slide_category", "=", "video"]], ["name", "youtube_id", "completion_time"]], { limit: 10 });
console.log("\nOdoo-resolved YouTube ids:");
check.forEach((s) => console.log(`  #${s.id} youtube_id=${JSON.stringify(s.youtube_id)}  ${s.name.slice(0, 38)}`));

console.log("\nReplace each URL in Odoo with a real Robonest video.");
