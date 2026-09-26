# RoboNest website guide

Complete reference for therobonest.com: how the site is built, how it is deployed on Netlify, how it talks to Odoo, and how to add, change and remove every kind of content.

Two audiences read this. Content editors need parts 3 to 6. Whoever maintains the code or the hosting needs all of it.

Last updated: 24 September 2026.

---

## 1. The big picture

The site is a Next.js application hosted on Netlify. It has no database of its own. All day-to-day content (blog posts, events, videos, team, partner schools, the About page text, social links) lives in Odoo, the same Odoo the company already uses for CRM and events. The website reads from Odoo, and enquiry forms write back into Odoo.

```
Visitor's browser
      |
      v
Netlify (CDN + Next.js server runtime)
      |  reads content every 5 minutes (ISR)
      v
Odoo Online  (therobonest.com, database robonest-private-limited)
      ^
      |  writes: crm.lead (enquiries), event.registration (sign-ups)
Netlify Functions (enquiry.mjs, event-register.mjs)
```

Key ideas in one paragraph each.

**Odoo is the CMS.** Editors never touch the code or Netlify. They publish a record in Odoo and the site picks it up.

**Incremental Static Regeneration (ISR).** Pages are pre-rendered and served from Netlify's cache, so they are fast. Every page that reads Odoo declares `revalidate = 300`, meaning at most once every 5 minutes the next visitor triggers a background refresh. The visitor after that sees the new content. A post or event that did not exist at build time is rendered on its first request. This is why the site is not a static export: a static export would need a redeploy for every new post.

**The Odoo API key never reaches the browser.** It is held only in Netlify environment variables and used by server code (page rendering, the image proxy) and the two Netlify Functions. The env vars deliberately have no `NEXT_PUBLIC_` prefix, which is what stops Next.js from inlining them into client JavaScript.

**Placement is controlled by tags.** Where something appears (home page, popup, a filter) is decided by the tag an editor picks in Odoo, not by code. See part 5.

**Fallbacks everywhere.** If Odoo is unreachable or credentials are missing, content queries return empty lists and the site still builds and renders. Sections with built-in copy fall back to that copy. Nothing goes blank because the CMS is down.

---

## 2. Architecture in detail

### 2.1 Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19 | ISR, server components for data fetching |
| Styling | Tailwind CSS 4 | Design tokens in `app/globals.css` |
| Motion | GSAP 3 + ScrollTrigger, Lenis smooth scroll | All animation code is client-only |
| Hosting | Netlify, Next.js runtime | `netlify.toml` in the repo root |
| CMS | Odoo Online (Enterprise, saas 19) | JSON-RPC over HTTPS |
| Repo | GitHub `sanheensethi/therobonest`, branch `main` | Every push to `main` deploys |

### 2.2 Folder map

| Path | What lives there |
|---|---|
| `app/` | Routes. One folder per URL. `page.tsx` renders, `layout.tsx` wraps every page (header, footer, popup, chatbot, drawer). |
| `app/api/odoo-image/[model]/[id]/[field]/route.ts` | Authenticated image proxy for employee and contact photos (see 2.5). |
| `app/sitemap.ts`, `app/robots.ts`, `app/llms.txt/route.ts` | Generated `sitemap.xml` (static pages plus every published Odoo post and event), `robots.txt` (points at the sitemap, disallows `/dev/` and the legacy redirect stubs), and `llms.txt` (a plain-text summary of the company, labs, pages, upcoming and past events and posts for AI assistants). All three regenerate on the same 5-minute window. |
| `components/sections/` | Big page blocks: Hero, LabsRail, SpaceWarp (galaxy), Hardware, Team, Gallery, FeaturedVideos, Schools, EnquiryForm, HeroForm and so on. |
| `components/ui/` | Shared pieces: Header, Footer, ChatBot, Mascot (the robot SVG rig), Wanderer (roaming robots), Preloader, EnquiryDrawer, Select, SocialIcon, Icon. |
| `content/site.ts` | Every piece of copy that is not in Odoo. Single source of truth for hero text, labs, stats, hardware cards, gallery photos, contact details, chatbot script and section tips. |
| `lib/odoo.ts` | Low-level Odoo JSON-RPC client. Server-side only. |
| `lib/odoo-content.ts` | Every content query: `getBlogPosts`, `getEvents`, `getVideos`, `getTeam`, `getSchools`, `getPage`, `getSocials`, `getPopupEvent`. Also the `TAG` constants. |
| `lib/media.ts` | Pulls images and YouTube links out of Odoo rich text so they can be shown as galleries and players. |
| `lib/enquiry.ts` | Shared form submit logic for both enquiry forms. |
| `netlify/functions/` | `enquiry.mjs` (form to CRM lead) and `event-register.mjs` (event sign-up). |
| `scripts/` | One-off Node scripts run from a developer machine against Odoo (create tags, seed content, set social links). |
| `public/images/` | Static assets: hero videos (`bg/`), hardware clips (`hw/`), gallery photos (`gallery/`), brand images. |
| `docs/` | This guide and the original client brief. |

### 2.3 Routes and where their data comes from

| URL | Data source | Notes |
|---|---|---|
| `/` | Code for most sections. Odoo for team (`getTeam`, tag Homepage, max 8), school logos (`getSchools`), featured videos (`getVideos` tag Homepage, else first 8). | Hero, labs, stats, hardware, gallery, galaxy are all code. |
| `/about/` | Odoo Knowledge article "Website: About" for the long body. Team (everyone), school logos. Headline and advantage cards from code. | If the article is missing or unpublished, built-in copy is used. |
| `/events/` | Odoo `event.event`, published only, split into upcoming and past by end date. | Cover images come from the event's cover properties. |
| `/events/<slug>/` | One event. Description, photo gallery and videos come from the event's website description. | Registration form shown only when published and registrations are open and not tagged Info Only. |
| `/blog/` | Odoo `blog.post`, published only, newest first. Filter chips from blog tags. | Nesty recommends one post at random. |
| `/blog/<slug>/` | One post. | Inline images and YouTube links rendered. |
| `/videos/` | Odoo `slide.slide` where category is video and published. Grouped by course. | Course name becomes the filter button. |
| `/contact/` | Code (`contactPage` in `content/site.ts`). | FAQ and contact details. |
| `/about-robonest`, `/contactus`, `/home` | 301 redirects to the new URLs, set in `netlify.toml`. | Old Odoo site URLs, kept so search engines follow. |
| `/dev/robots/` | Developer playground for the mascot. Disallowed in robots.txt. | Safe to leave, not linked anywhere. |

Slugs are `<kebab-title>-<id>`. The id at the end is what the site uses to fetch the record, so renaming a post in Odoo changes the pretty part of the URL but old links with the same id still resolve.

### 2.4 How a request flows

1. Visitor requests `/events/`.
2. Netlify serves the cached HTML immediately if it is under 5 minutes old.
3. If older, Netlify still serves the cached copy but re-renders in the background: the server calls `getEvents()`, which authenticates to Odoo once per server instance (the uid is cached) and runs `search_read` on `event.event` with `is_published = true`.
4. Tag ids on the rows are resolved to names in one extra query, not one per row.
5. The fresh HTML replaces the cached copy. The next visitor sees it.

Every Odoo `fetch` also carries `next: { revalidate: 300 }`, so the data layer and the page layer agree on the 5-minute window.

### 2.5 The image proxy

Odoo's public `/web/image/` route does not serve employee photos. `hr.employee` has no publish flag, so an anonymous request gets a 6 KB grey placeholder with HTTP 200, which renders as a broken image. The site therefore reads photo bytes over RPC with the API key, server-side, and streams them out from `/api/odoo-image/<model>/<id>/<field>` with a one-day cache.

The proxy is strictly whitelisted to `hr.employee` and `res.partner`, fields `image_256`, `image_512`, `image_1024`. Anything else returns a 1x1 transparent GIF. Never widen this list casually: an open proxy would let anyone read any binary field in the database through an image tag.

A related detail: Odoo never leaves an employee photo empty. It stores a 305-byte placeholder. The site treats anything under 2 KB as "no photo" and draws an initial-letter avatar instead.

### 2.6 Forms and writes into Odoo

Both enquiry forms (the "Book a Demo Lab Setup" drawer and the long form at the bottom of the home page) go through `lib/enquiry.ts`, which posts JSON to `/.netlify/functions/enquiry`. That function:

- rejects anything that is not POST, invalid JSON, or fails validation (name required, 10-digit phone required, email optional but validated if given),
- silently accepts honeypot submissions so bots learn nothing,
- authenticates to Odoo and creates a `crm.lead` with `type = lead`, title `Lab enquiry - <school>` (or the person's name), contact name, phone, optional email, designation in `function`, state in `city`, and everything else in the description notes.

Event registration posts to `/.netlify/functions/event-register`, which checks the event is published and `event_registrations_open` is true before creating an `event.registration` with name, email and phone.

If `NEXT_PUBLIC_FORM_ENDPOINT` is set, the enquiry form posts there instead (Formspree, Web3Forms). If the endpoint fails, the form falls back to a prefilled mailto so a lead is never silently dropped.

### 2.7 The mascot and animation layer

Not content, but worth knowing so nobody is surprised.

- `Mascot.tsx` is one SVG robot rig with ten variants (Nesty is the main one) and 22 facial expressions, plus skits and poses. Every instance gets unique gradient ids via `useId()` so several robots on one page do not share paint.
- `ChatBot.tsx` is Nesty in the corner. Its answers are a fixed keyword script in `content/site.ts` under `mascot.faq`. It never invents prices or promises. It also reads `data-nesty` attributes on sections to say a one-line tip as the visitor scrolls, and announces the popup event.
- `Wanderer.tsx` sends other robots across the page on long random timers.
- `SpaceWarp.tsx` is the Astronomy galaxy: a canvas particle system that morphs into the word ROBONEST, with a rocket and UFO skirmish. It only renders while on screen.
- `Preloader.tsx` shows a random robot on first load and holds until fonts and the page have loaded (max 4 seconds).

All of it respects `prefers-reduced-motion`.

---

## 3. Deploying on Netlify

### 3.1 How deploys happen today

Netlify is connected to the GitHub repo. Every push to `main` triggers a build and deploy. Nothing else is needed for code changes.

Current production URL: `https://statuesque-gumption-d78cb1.netlify.app`. When the custom domain moves over, this stays as the fallback address.

### 3.2 Build settings

These are in `netlify.toml` and win over anything typed into the Netlify UI:

| Setting | Value | Why |
|---|---|---|
| Build command | `npm run build` | Standard Next.js build |
| Publish directory | `.next` | The Netlify Next.js plugin reads Next's output from here. The site once failed because the UI still said `out` from an older static setup. |
| Functions directory | `netlify/functions` | Where the two Odoo functions live |
| Node version | 22 | Set under `[build.environment]` |

Also in `netlify.toml`: the three 301 redirects from old Odoo URLs, long cache headers for `/_next/static/*` and `/images/*`, and security headers (`nosniff`, `SAMEORIGIN`, referrer policy).

### 3.3 Environment variables

Set these in Netlify under Site configuration, Environment variables. They are read at build time and at runtime by the server and functions.

| Variable | Required | Value |
|---|---|---|
| `ODOO_URL` | Yes | `https://robonest-private-limited.odoo.com`, Odoo's own hostname. Use this, not a custom domain: it never changes, needs no DNS and cannot lose its certificate. `https://odoo.therobonest.com` also works. `https://www.therobonest.com` no longer works (it now belongs to the new website). |
| `ODOO_DB` | Yes | `robonest-private-limited` |
| `ODOO_LOGIN` | Yes | The Odoo user's login email that owns the API key |
| `ODOO_API_KEY` | Yes | Generated in Odoo under the user's Preferences, Account Security, New API Key. Full permissions of that user, so treat it like a password. |
| `NEXT_PUBLIC_FORM_ENDPOINT` | No | Leave blank to use the Netlify function. Set to a Formspree or Web3Forms URL to bypass Odoo for enquiries. |
| `NEXT_PUBLIC_BASE_PATH` | No | Leave blank. Only used if the site is ever served under a sub-path. |

After changing any variable, trigger a redeploy (Deploys, Trigger deploy, Clear cache and deploy site).

### 3.4 Setting up from scratch

If Netlify ever has to be re-created:

1. Netlify, Add new site, Import an existing project, pick GitHub, choose `sanheensethi/therobonest`, branch `main`.
2. Leave build command and publish directory blank in the UI. `netlify.toml` supplies them. If the UI insists, enter `npm run build` and `.next`.
3. Add the four Odoo environment variables from 3.3.
4. Deploy. First build takes 3 to 5 minutes.
5. Add the custom domain under Domain management and follow Netlify's DNS instructions. HTTPS is automatic.
6. Test: home page loads, `/events/` shows Odoo events, a team photo appears on `/about/`, and a test enquiry appears in CRM, Leads.

### 3.5 Running locally

```
npm install
copy .env.example .env.local        (then fill in the four ODOO_ values)
npm run dev
```

Open `http://localhost:3000`. The scripts in `scripts/` also read `.env.local`.

### 3.6 Rolling back

Netlify keeps every deploy. Deploys, pick a previous successful one, Publish deploy. That is instant and needs no code change.

---

## 4. Odoo setup (one-time)

Everything below has already been done on the live instance. It is recorded here so it can be repeated on a fresh database.

### 4.1 Apps that must be installed

Website, Blog, Events, eLearning, Employees, Contacts, CRM, Knowledge.

### 4.2 API user and key

1. Create or pick an internal user for the website (a real staff login works, but a dedicated "Website API" user is cleaner to rotate).
2. Give it access to: CRM (create leads), Events (read events, create registrations), Blog, eLearning, Employees, Contacts, Knowledge (read).
3. Log in as that user, Preferences, Account Security, New API Key. Copy the key once. Put it in Netlify as `ODOO_API_KEY` and the user's email as `ODOO_LOGIN`.

Rotating the key: generate a new one, update Netlify, redeploy, then delete the old key in Odoo. There is no downtime if done in that order. The key shared during initial setup should be rotated before launch.

### 4.3 Placement tags

Run once from a developer machine with `.env.local` filled:

```
node scripts/setup-odoo-tags.mjs
```

It find-or-creates these tags. They then appear in the Tags dropdown on each record type.

| Model | Tags created |
|---|---|
| `event.tag` (under category "Website Placement") | Homepage, Popup, Astronomy, AI & Robotics, Workshop, Exhibition |
| `blog.tag` | Homepage, Astronomy, AI & Robotics, Announcement |
| `slide.tag` (videos) | Homepage, Astronomy, AI & Robotics, Lab Setup, Student Projects, Events |

Tags the site also relies on that are created by hand or by other scripts: `Info Only` and `Short` (add in the same dropdowns if missing), employee tags `Homepage`, `Leadership`, `Executive Team` (Employees, Configuration, Tags), and the contact tag `School` (Contacts, Configuration, Contact Tags).

### 4.4 Knowledge article for the About page

Knowledge, New article, title exactly `Website: About`, write the body, click Share, turn on Publish. The site finds it by the exact title. The prefix `Website:` is the convention for any future page or section held in Knowledge.

### 4.5 Helper scripts

All read `.env.local`. Run with `node scripts/<name>.mjs`.

| Script | Purpose |
|---|---|
| `probe-odoo.mjs` | Checks credentials and prints server version. Run this first when something is wrong. |
| `setup-odoo-tags.mjs` | Creates the placement tags (4.3). Safe to re-run. |
| `set-social-links.mjs` | Writes the social URLs onto the website record. Edit the `LINKS` object at the top, blank clears a network. |
| `set-team-tags.mjs`, `seed-team-tiers.mjs`, `seed-employees.mjs` | Tagging and seeding of the team. Seeds were for the demo and can be ignored now. |
| `seed-demo-content.mjs`, `seed-demo-videos.mjs`, `seed-event-photos.mjs`, `seed-schools.mjs`, `seed-about-page.mjs` | Demo data used during the build. Do not run against live data. |

---

## 5. Tags and how data is displayed

### 5.1 Every tag the site reads

| Tag | Applies to | Effect on the site |
|---|---|---|
| `Homepage` | Events, blog posts, videos, employees | Features the record on the home page. Videos: the home playlist shows up to 8 tagged videos, and falls back to the first 8 videos if fewer than 2 are tagged. Employees: home team shows up to 8 tagged people, falls back to everyone if nobody is tagged. |
| `Popup` | Events | The soonest upcoming event with this tag becomes the corner popup on every page, and Nesty announces it. If none is tagged, the next upcoming event is used. Nothing is shown when no upcoming event exists. |
| `Info Only` | Events | Announce it, show no registration form, show a contact link instead. |
| `Short` | Videos | Rendered in a vertical 9:16 frame. Also inferred automatically from a `/shorts/` URL. |
| `School` | Contacts | Puts the company's logo in the "Trusted by" line and the schools strip. Contact must also be Published and have an image. |
| `Leadership` | Employees | Large photo card with a quote (the quote is the employee's Additional Note under HR Settings). |
| `Executive Team` | Employees | Circular portrait. |
| `Astronomy`, `AI & Robotics` | Events, posts, videos | Topic grouping and filter chips. |
| `Workshop`, `Exhibition` | Events | Topic grouping. |
| `Announcement` | Posts | Blog filter chip. |
| `Lab Setup`, `Student Projects`, `Events` | Videos | Filter chips on the videos page. |

A record with no tag still appears on its own listing page. Tags only add placement.

### 5.2 What each query filters on

| Function | Odoo model | Filter | Order |
|---|---|---|---|
| `getBlogPosts` | `blog.post` | `is_published = true`, optional tag | `published_date desc` |
| `getEvents` | `event.event` | `is_published = true`, optional tag | `date_begin desc`, then split into upcoming and past by end date |
| `getVideos` | `slide.slide` | `is_published = true`, `slide_category = video`, optional tag | `sequence asc` (the order inside the course) |
| `getTeam` | `hr.employee` | optional tag (`category_ids.name`) | creation order |
| `getSchools` | `res.partner` | `category_id.name = School`, `is_published = true`, and has a real image | `name asc` |
| `getPage` / `getSection` | `knowledge.article` | `name = "Website: <Title>"`, `is_published = true` | one record |
| `getSocials` | `website` | first website record, fields `social_facebook`, `social_instagram`, `social_linkedin`, `social_twitter`, `social_youtube` | empty fields produce no icon |

### 5.3 Rich text handling

Blog bodies and event descriptions arrive as Odoo HTML. The site sanitizes it (`lib/sanitize.ts`), restyles it to match the site, and lifts media out (`lib/media.ts`):

- every `<img>` becomes an item in a gallery (events) or stays inline (posts),
- every YouTube iframe or bare YouTube URL becomes a proper player and the raw link is removed from the text,
- relative Odoo asset paths are made absolute using `ODOO_URL`.

---

## 6. Editing content in Odoo

The one rule: saving is not publishing. Every record has a Published toggle (or a "Go to Website" then Publish switch). Nothing reaches the site until it is on. Then wait up to 5 minutes and reload twice.

### 6.1 Blog posts

**Add.** Website, Blog Posts, New. Fill Title, Subtitle, Body (drag images in, paste YouTube links on their own line). Pick Tags. Open the SEO panel and set Meta Title and Meta Description. Switch Published on.

**Edit.** Open the post, change, save. The site follows within 5 minutes.

**Remove.** Switch Published off. That hides it from the site and the sitemap but keeps the post. Delete only if it must be gone from Odoo too. Deleting gives visitors a 404 on the old link, unpublishing does the same, so prefer unpublishing.

### 6.2 Events

**Add.** Events, New. Event Name, start and end Date (this decides upcoming versus past), Venue, cover image, Tags. Published on.

**Description, photos, videos.** The Description is not on the form. Click Go to Website, then Edit. The page body is the description. Drag photos in, paste YouTube links on their own lines, Save. Do not use the Notes and Documents tab, that is internal.

**Three kinds of event.**

| You want | Do this | Site shows |
|---|---|---|
| People to register | Just set future dates | "Registration open" plus a sign-up form |
| Announce only | Add tag `Info Only` | "Announcement", no form, a contact link |
| Show a finished event | Nothing, the end date passing is enough | "Completed" plus the photo gallery |

**Popup.** Tag one upcoming event `Popup`. Remove the tag to stop promoting it.

**Registrations.** Events, the event, Attendees. Same place walk-ins are managed.

**Remove.** Unpublish. Past events are part of the "journey" timeline, so unpublish only events you never want shown.

### 6.3 Videos

Currently switched off: RoboNest has no YouTube videos yet, so the Videos page and the home playlist are hidden (`features.videos` in `content/site.ts`). Their own clips are in the Institution Gallery instead. When real videos exist, add them as below and ask the developer to flip the switch.

Only YouTube links. Nothing is uploaded to Odoo or the site.

**Add.** eLearning, open or create a Course (its name becomes the filter button: Lab Setup, Student Projects, Astronomy, Events). Add Content, Video, paste the YouTube URL. Odoo fills in title, thumbnail and duration. Add tags (`Homepage` to feature, `Short` for vertical). Published on. Drag to reorder inside the course, that order is what the site uses.

**Replace a sample.** Open the video, change the URL, save.

**Remove.** Unpublish, or delete the content item.

### 6.4 Team

**Add.** Employees, New. Name, Job Position, Photo (top right). Tags: `Leadership` (big card with quote) or `Executive Team` (circle), plus `Homepage` to show on the home page. HR Settings, Additional Note is the quote under a leadership card.

**Order.** There is no sequence field. People appear in creation order, so create founders first.

**Remove.** Archive the employee. Archived employees are not returned.

Adding an employee also creates a Contact. Harmless, but expect the duplicate in Contacts.

### 6.5 Partner school logos

**Add.** Contacts, New. Tick Company. Name, Image (square crest on white or transparent), Tag `School`. Published on (the switch is on the contact form's website tab or via Go to Website).

**Remove.** Take the `School` tag off. That removes the logo without deleting the customer record.

### 6.6 About page text

Knowledge, open `Website: About`, edit, keep it Published. Do not rename it. The About page headline, the RoboNest Advantage cards and the lab list are in code.

### 6.7 Social links

Set on the website record. Two ways:

- Odoo UI: Website, Go to Website, Edit, click the social icons block in the footer, paste URLs in the right panel, Save.
- Script: edit `LINKS` in `scripts/set-social-links.mjs` and run it. A blank string clears that network.

An empty field means no icon. Currently set: Instagram `https://www.instagram.com/robonest2026`, YouTube `https://www.youtube.com/@Robonest2026`. Facebook, LinkedIn and X are intentionally blank until real page URLs exist.

### 6.8 Enquiries and registrations

Nothing to set up. Website enquiries appear in CRM, Leads (not Opportunities), titled "Lab enquiry - <school>". Event sign-ups appear under the event's Attendees. If a lead seems missing, clear the CRM filters first.

---

## 7. Content that lives in code

These change by editing `content/site.ts` and pushing to `main`. Each is a plain object near the top of the file, no logic.

| Export | Controls |
|---|---|
| `site`, `contact` | Company name, legal name, address, phones, email |
| `nav` | Header links |
| `hero`, `heroMedia`, `heroForm` | Headline lines, body, proof points, hero video clips, drawer form title |
| `stats` | The four numbers |
| `about`, `aiFeatures`, `labsIntro`, `labs` | About section, RoboNest Advantage, the three lab cards |
| `hardware` | Arduino and sensor cards, with their video files |
| `gallery` | Institution Gallery: photos and short clips (files in `public/images/gallery/`). A clip entry is `{ src, poster, video: true }`. Clips play muted in the slider, with sound and controls in the viewer. |
| `features` | `videos: false` hides everything built on YouTube (the /videos page returns 404, the home playlist, the nav link, sitemap and llms.txt entries). Set to `true` once real videos are in Odoo eLearning. |
| `journey`, `schools`, `homeTeam` | Journey timeline copy, fallback school logos, home team tag and cap |
| `ctaForm`, `contactPage`, `aboutPage`, `videosPage` | Bottom form copy, contact page FAQ, About and Videos page copy |
| `mascot` | Nesty's name, greeting, quick replies, keyword answers, hand-off text, and the per-section tips |
| `space` | Astronomy section copy |

Media files: hero clips in `public/images/bg/hero-1.mp4`, `hero-2.mp4`, `hero-3.mp4` with `hero-poster.jpg`; hardware clips in `public/images/hw/`. Replace the file, keep the name, push.

---

## 8. Troubleshooting

| Symptom | Check, in order |
|---|---|
| New post or event missing | Published is off. Then wait 5 minutes and reload twice. |
| Event in the wrong section | Its end date. |
| Registration form not showing | Tagged `Info Only`, the date has passed, or registrations are closed in Odoo. |
| Popup not showing | No upcoming event at all, or the visitor already dismissed it for that event. |
| Event photos not in the gallery | Added under Notes and Documents instead of Go to Website, Edit. |
| Video has no thumbnail | URL is not a standard YouTube link. |
| Vertical video has black bars | Missing the `Short` tag. |
| Team member not on home page | Missing `Homepage` tag. |
| Grey silhouette or no photo | Photo under 2 KB is treated as missing. Upload a real one. |
| School logo missing | No `School` tag, not Published, or no image. |
| Social icon missing | That field is empty. Deliberate. |
| Icon shows a letter instead of a logo | A network was added that the site has no glyph for. Add it to `components/ui/SocialIcon.tsx`. |
| Enquiry not in CRM | Look in Leads, clear filters. Then check Netlify, Functions, `enquiry` logs. |
| Everything from Odoo is empty | Credentials. Run `node scripts/probe-odoo.mjs` locally, and check the four env vars in Netlify. After the domain move, check `ODOO_URL`. |
| Build fails on Netlify | Read the deploy log. Common causes: a TypeScript error (run `npx tsc --noEmit` locally), or the UI publish directory set to something other than `.next`. |
| Site slow to update | Normal. ISR is 5 minutes plus one extra reload. To force it, redeploy from Netlify. |

---

## 9. Domain cutover plan

Today `therobonest.com` and `www.therobonest.com` point at Odoo Online, so `https://www.therobonest.com/web/login` is the back office. After the cutover the main domain serves the Netlify site and Odoo lives at `odoo.therobonest.com`. Do it in this order, and nothing is offline at any point.

### 9.1 Before touching DNS

1. **Lower the DNS TTL** on the `@` and `www` records to 300 seconds, a day ahead. This makes the final switch propagate in minutes rather than hours.
2. **Find Odoo's native address.** Every Odoo Online database also answers on `<database>.odoo.com`, here `robonest-private-limited.odoo.com`. Confirm login works there. This is the safety net: it keeps working whatever happens to the custom domain.
3. **Do not touch MX, SPF, DKIM or any TXT records.** Email for the domain is independent of where the website points.

### 9.2 Give Odoo its own hostname

1. In the DNS provider add: `odoo` CNAME `robonest-private-limited.odoo.com`.
2. In Odoo: Website app, Configuration, Settings, Domain, set `https://odoo.therobonest.com` (or via the odoo.com database manager, Domain Names, add the domain). Odoo Online issues the SSL certificate itself within a few minutes.
3. Test `https://odoo.therobonest.com/web/login`. Log in. Open an event and click Go to Website to confirm the editor works on the new host.
4. In Odoo, Website, Configuration, Redirects: add `/` to `/web/login`, type 302. Odoo's own public website is being replaced, so its front page should send people to the login rather than show the old site.

### 9.3 Point the website at the new Odoo hostname

1. Netlify, Site configuration, Environment variables: set `ODOO_URL` to `https://odoo.therobonest.com`.
2. Deploys, Trigger deploy, Clear cache and deploy site.
3. Check on the Netlify address: `/events/` still lists events, an event page shows its photos (these are `/web/image/` URLs built from `ODOO_URL`), a team photo loads on `/about/`, and a test enquiry lands in CRM Leads.

At this point both the old and new Odoo hostnames work, and the website already reads from the new one. The main domain still shows the old Odoo site.

### 9.4 Add the domain in Netlify

1. Netlify, Domain management, Add a domain, enter `therobonest.com`. Netlify will list both `therobonest.com` and `www.therobonest.com`.
2. Set `www.therobonest.com` as the primary domain. The site's canonical URL in code is `https://www.therobonest.com`, so the sitemap, `robots.txt` and `llms.txt` already use it. Netlify will redirect the bare domain to `www`.
3. Netlify shows the records it wants. Typically:
   - `www` CNAME `statuesque-gumption-d78cb1.netlify.app`
   - `@` A `75.2.60.5` (Netlify's load balancer), or an ALIAS/ANAME to `apex-loadbalancer.netlify.com` if the DNS provider supports it.
   Use the values Netlify displays, not this document, if they differ.

### 9.5 Switch DNS

1. In the DNS provider, replace the current `@` and `www` records (which point at Odoo) with the Netlify records above. Leave the `odoo` CNAME and all mail records alone.
2. Wait for propagation (minutes at a 300-second TTL). Netlify's domain page turns green and provisions the Let's Encrypt certificate automatically. If it stalls, click Verify DNS configuration, then Renew certificate.
3. Test `https://www.therobonest.com/` shows the new site, and `https://therobonest.com/` redirects to it.

### 9.6 What happens to old Odoo links on the main domain

`netlify.toml` already forwards them, so nothing anyone bookmarked breaks:

| Old URL | Goes to |
|---|---|
| `therobonest.com/odoo` and `/odoo/...` | `odoo.therobonest.com/odoo/...` (the back office) |
| `therobonest.com/web/...` (login, `/web/image/...` in old emails) | `odoo.therobonest.com/web/...` |
| `therobonest.com/my/...` (customer portal) | `odoo.therobonest.com/my/...` |
| `/about-robonest`, `/contactus`, `/home` | The new site's pages |

Tell staff the new login address is `https://odoo.therobonest.com/web/login`. Their bookmarks to the old one will redirect, but the new one is faster.

### 9.7 After the switch

1. In Odoo, remove `www.therobonest.com` and `therobonest.com` from the website's domain settings so Odoo stops generating links to them.
2. Google Search Console: add `https://www.therobonest.com` as a property if it is not already, and submit `https://www.therobonest.com/sitemap.xml`.
3. Rotate the Odoo API key if not already done (part 4.2).
4. Restore the DNS TTL to its normal value after a day.

### 9.8 If something goes wrong

Put the `@` and `www` DNS records back to their previous Odoo values. Within the TTL the old site is back and Odoo answers on the main domain again. The website on Netlify keeps working on its `.netlify.app` address throughout, and `ODOO_URL` can point at either Odoo hostname.

---

## 10. Launch checklist

- Rotate the Odoo API key shared during setup, update Netlify, redeploy, delete the old key.
- Replace the placeholder YouTube URLs in eLearning with real videos.
- Confirm Instagram and YouTube handles open the right profiles. Add Facebook when the page URL is known.
- Supply the final gallery photos and the RoboNest-spelled logo file.
- Confirm the stats (10,000+ students, 10-day setup) and the public email.
- Run the domain cutover in part 9, in order.
- Tell content editors that Odoo's own pages (including the event editor) now live at `odoo.therobonest.com`, not the main domain.
