/**
 * Creates the "Website: About" Knowledge article, seeded with the copy that
 * currently lives in code, so the About page becomes editable in Odoo.
 *
 * Run once: node scripts/seed-about-page.mjs
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

const TITLE = "Website: About";

const BODY = `
<p>Robonest is a forward-thinking technology company dedicated to transforming education through innovation. We specialize in Robotics, Artificial Intelligence (AI), Coding, STEM education and advanced lab solutions for schools and institutions.</p>
<p>At Robonest, we believe that the future belongs to creators, innovators and problem-solvers. Our mission is to equip students with 21st-century skills by providing hands-on learning experiences that go beyond textbooks. We design and implement smart labs - including AI Labs, Robotics Labs, Language Labs, ATL Labs and Digital Classrooms - to create an interactive and future-ready learning environment.</p>
<p>Our team consists of experienced engineers, educators and technology experts who are passionate about empowering young minds. From installation and training to ongoing support, we ensure seamless implementation and long-term success for every institution we work with.</p>
<h2>We focus on</h2>
<ul>
  <li>Practical, hands-on learning</li>
  <li>Industry-relevant curriculum</li>
  <li>Affordable and scalable solutions</li>
  <li>Complete setup, training and support</li>
  <li>Future-ready technology integration</li>
</ul>
<blockquote>At Robonest, we do not just build labs - we build innovators.</blockquote>
<h2>Why choose us</h2>
<h3>Cutting-edge technology</h3>
<p>Our platform is built on the latest advancements in machine learning and natural language processing.</p>
<h3>Expert content creators</h3>
<p>Our team curates high-quality, relevant and engaging content tailored to your needs.</p>
<h3>Continuous innovation</h3>
<p>We are constantly updating and improving our programmes so your students stay ahead of the curve.</p>
`.trim();

const found = await call("knowledge.article", "search", [[["name", "=", TITLE]]], {
  limit: 1,
});

if (found.length) {
  await call("knowledge.article", "write", [[found[0]], { body: BODY, is_published: true }]);
  console.log(`updated knowledge.article #${found[0]}  "${TITLE}"  published`);
} else {
  const id = await call("knowledge.article", "create", [
    { name: TITLE, body: BODY, is_published: true },
  ]);
  console.log(`created knowledge.article #${id}  "${TITLE}"  published`);
}

console.log("Edit it in Odoo -> Knowledge. The About page follows within 5 minutes.");
