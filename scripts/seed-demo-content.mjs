/**
 * Seeds DEMO content into Odoo so the site can be reviewed with real data
 * flowing through the whole pipeline.
 *
 * Everything created here is normal Odoo content - edit or delete it freely in
 * the UI. Titles are real (not lorem) so the layout is judged honestly, but
 * every event description is marked as sample text.
 *
 * Idempotent: re-running updates the same records instead of duplicating.
 * Run: node scripts/seed-demo-content.mjs
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

/** Create if a record with this name does not exist, otherwise update it. */
async function upsert(model, name, values) {
  const found = await call(model, "search", [[["name", "=", name]]], { limit: 1 });
  if (found.length) {
    await call(model, "write", [[found[0]], values]);
    return { id: found[0], created: false };
  }
  const id = await call(model, "create", [{ name, ...values }]);
  return { id, created: true };
}

const tagId = async (model, name) => {
  const r = await call(model, "search", [[["name", "=", name]]], { limit: 1 });
  return r[0] ?? null;
};

console.log("Seeding demo content\n" + "=".repeat(58));

/* ------------------------------------------------------------------ blog */

const [blog] = await call("blog.blog", "search_read", [[], ["name"]], { limit: 1 });
const tHome = await tagId("blog.tag", "Homepage");
const tAnnounce = await tagId("blog.tag", "Announcement");
const tAi = await tagId("blog.tag", "AI & Robotics");

const POSTS = [
  {
    name: "What Does a School Robotics Lab Actually Need?",
    subtitle: "A practical checklist for schools planning their first lab",
    tags: [tHome].filter(Boolean),
    meta: "Hardware, curriculum, teacher training and space - a practical checklist for schools setting up a robotics lab.",
    content: `
<p>Most schools approach a robotics lab as a hardware purchase. That is the single most common reason labs end up unused after the first term.</p>
<p>A lab is four things, and hardware is only one of them.</p>
<h2>1. Hardware that matches the age group</h2>
<p>Younger students need block-based, tactile kits where a working model comes together in one session. Older students need real microcontrollers - Arduino boards, sensors, breadboards - where the wiring can be wrong and has to be debugged.</p>
<h2>2. A curriculum mapped to your timetable</h2>
<p>A kit without a lesson plan becomes a cupboard. Ask for a session-by-session curriculum that fits your actual period length.</p>
<h2>3. Teacher capability</h2>
<p>This is where most labs fail. If one enthusiastic teacher runs everything, the lab stops when they leave. Insist on training for multiple staff members.</p>
<h2>4. Space and electrical planning</h2>
<p>Robotics needs bench depth, accessible power points and lockable storage. A classroom with desks in rows is a poor fit - students need to stand around a build.</p>
<h3>Questions worth asking any vendor</h3>
<ul>
  <li>What exactly is delivered, item by item?</li>
  <li>How many guided projects come with it?</li>
  <li>Who trains our teachers, and is refresher training included?</li>
  <li>What happens when a component breaks in month eight?</li>
  <li>Can we see a lab you installed last year, still running?</li>
</ul>
<p>That last question is the most revealing one. Any vendor can install a lab. Fewer can show you one still in daily use a year later.</p>`,
  },
  {
    name: "NEP 2020 and Robotics: What It Means for Your School",
    subtitle: "Reading the policy without the marketing spin",
    tags: [tHome, tAnnounce].filter(Boolean),
    meta: "What NEP 2020 actually says about coding and experiential learning - and what it means practically for schools.",
    content: `
<p>"NEP-aligned" appears on every ed-tech brochure in India, usually without anyone explaining what it refers to. Here is the substance.</p>
<h2>What the policy actually emphasises</h2>
<p>NEP 2020 introduces coding and computational thinking from the middle stage (around Grade 6), and repeatedly stresses experiential, hands-on learning over rote memorisation.</p>
<p>Note the word: <strong>emphasises</strong>. NEP is a policy framework, not a purchase order. It does not mandate a specific kit, vendor or lab configuration.</p>
<h2>What that means practically</h2>
<ul>
  <li>Coding cannot be a club activity for a handful of students. It needs to sit in the timetable.</li>
  <li>Assessment has to reward building and problem-solving, not memorised definitions.</li>
  <li>Technology should show up inside science and maths, not only in a separate computer period.</li>
  <li>Teacher capability is the binding constraint.</li>
</ul>
<h2>A reasonable starting point</h2>
<p>Begin with the grades where the policy is most explicit - Grade 6 upward - and get one year of teaching genuinely working before expanding downward.</p>`,
  },
  {
    name: "From Block Coding to Python: How Students Actually Progress",
    subtitle: "A realistic six-year path through a school robotics programme",
    tags: [tAi].filter(Boolean),
    meta: "How students move from drag-and-drop blocks to Python and machine learning - and where progress usually stalls.",
    content: `
<p>The jump from drag-and-drop blocks to typing Python is where most school programmes lose students. It is rarely a lack of ability. It is a missing intermediate step.</p>
<h2>Grades 1-5: mechanisms before code</h2>
<p>Gears, levers, structures, simple motors. Sequencing without syntax.</p>
<h2>Grades 6-8: logic in blocks</h2>
<p>Loops, conditionals and variables expressed visually, so attention goes to the logic rather than a missing semicolon. Sensors arrive here.</p>
<h2>Grades 8-9: the bridge that usually gets skipped</h2>
<p>Students should see the <strong>same</strong> project in blocks and in text, side by side. Do not introduce a new concept and a new syntax at the same time.</p>
<h2>Grades 9-10: real text-based code</h2>
<p>Python on a microcontroller. Wiring, serial debugging, reading a datasheet. Things break constantly, and that is the point.</p>
<h2>Grades 11-12: applied AI</h2>
<p>Sensor data becomes a dataset. Students train a small model and run it on device.</p>
<blockquote>Programmes almost always stall at the block-to-text bridge, because it was compressed into a single term. Give it a year.</blockquote>`,
  },
];

for (const p of POSTS) {
  const r = await upsert("blog.post", p.name, {
    subtitle: p.subtitle,
    content: p.content.trim(),
    blog_id: blog.id,
    is_published: true,
    website_meta_title: p.name.slice(0, 60),
    website_meta_description: p.meta,
    tag_ids: [[6, 0, p.tags]],
  });
  console.log(`blog.post   #${r.id} ${r.created ? "created" : "updated"}  published  ${p.name.slice(0, 44)}`);
}

/* ---------------------------------------------------------------- events */

const eHome = await tagId("event.tag", "Homepage");
const ePopup = await tagId("event.tag", "Popup");
const eWorkshop = await tagId("event.tag", "Workshop");
const eExhibition = await tagId("event.tag", "Exhibition");

// A public Odoo image already on this instance, so the gallery extraction has
// something real to pick up.
const IMG = "/web/image/1852-d0140349/Hero-bg.webp";

const EVENTS = [
  {
    name: "Robonest AI & Robotics Showcase 2026",
    date_begin: "2026-09-18 04:00:00", // stored UTC; 09:30 IST
    date_end: "2026-09-19 12:00:00",
    tags: [eHome, ePopup, eExhibition].filter(Boolean),
    description: `
<p>Sample content. Two days of student projects, live robot demonstrations and hands-on stations for visiting schools. Teachers can sit in on a full lab session and see the curriculum being taught.</p>
<p>Open to principals, coordinators and teachers. Entry is free; registration is required.</p>
<img src="${IMG}" alt="">
<p>https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>`,
  },
  {
    name: "Teacher Training Workshop - Arduino & IoT",
    date_begin: "2026-10-10 04:30:00",
    date_end: "2026-10-10 11:30:00",
    tags: [eHome, eWorkshop].filter(Boolean),
    description: `
<p>Sample content. A one-day intensive for school teachers covering Arduino UNO R4, sensor wiring, and running a project-based session with 30 students.</p>
<p>No prior electronics experience needed. Each participant takes home a starter kit.</p>`,
  },
  {
    name: "Techno Zone at K.N. Modi Global School",
    date_begin: "2026-02-12 04:00:00",
    date_end: "2026-02-12 11:00:00",
    tags: [eExhibition].filter(Boolean),
    description: `
<p>Sample content. Our lab installation was showcased alongside student-built robots at the school's annual technology exhibition.</p>
<img src="${IMG}" alt="">`,
  },
  {
    name: "Astronomy Night - Stargazing Session",
    date_begin: "2025-12-06 13:00:00",
    date_end: "2025-12-06 16:00:00",
    tags: [eWorkshop].filter(Boolean),
    description: `
<p>Sample content. An evening telescope session for senior students, covering planetary observation and how to read a star chart.</p>`,
  },
];

for (const e of EVENTS) {
  const r = await upsert("event.event", e.name, {
    date_begin: e.date_begin,
    date_end: e.date_end,
    description: e.description.trim(),
    is_published: true,
    tag_ids: [[6, 0, e.tags]],
  });
  console.log(`event       #${r.id} ${r.created ? "created" : "updated"}  ${e.date_begin.slice(0, 10)}  ${e.name.slice(0, 40)}`);
}

/* -------------------------------------------------------------- employees */

const JOBS = { "Sanheen Sethi": "Web & Systems", "Tushar Bansal": "AI & Robotics Trainer" };
for (const [name, job] of Object.entries(JOBS)) {
  const ids = await call("hr.employee", "search", [[["name", "=", name]]], { limit: 1 });
  if (ids.length) {
    await call("hr.employee", "write", [[ids[0]], { job_title: job }]);
    console.log(`employee    #${ids[0]} job_title set: ${name} - ${job}`);
  }
}

console.log("\n" + "=".repeat(58));
console.log("Done. Everything is editable in Odoo; sample text is labelled.");
