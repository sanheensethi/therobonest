/**
 * Single source of truth for all site copy.
 * Extracted from the previous Odoo site; placeholder/demo text removed.
 * Change a number here and it updates everywhere.
 */

export const site = {
  name: "RoboNest",
  legalName: "RoboNest Pvt. Ltd.",
  tagline: "Empowering the Next Generation of Innovators and Explorers",
  description:
    "Turnkey Robotics, AI and Astronomy labs for schools and colleges - complete with cutting-edge equipment, future-ready curricula and dedicated expert educators.",
  url: "https://www.therobonest.com",
} as const;

export const contact = {
  addressLabel: "Registered Office",
  address: "Ground Floor, B-1057/1, Kh. No. 204, Gali No. 6, Khajoori Khas, New Delhi 110094",
  /** First number is WhatsApp-enabled; second is the office landline. */
  phones: ["8860788886", "0120-5278820"],
  email: "robonestacc@gmail.com",
  mapQuery: "B-1057/1, Gali No 6, Khajoori Khas, New Delhi 110094, India",
} as const;

/**
 * Social links now come from Odoo (getSocials in lib/odoo-content.ts), so they
 * are editable without a deploy and empty networks render no icon at all.
 * The previous hardcoded list pointed at platform home pages - effectively
 * dead links - so it was removed rather than kept as a fallback.
 */

export const nav = [
  { label: "Home", href: "/" },
  { label: "Labs", href: "/#labs" },
  { label: "Events", href: "/events" },
  { label: "Videos", href: "/videos" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const hero = {
  eyebrow: "Robotics · AI · Astronomy labs for schools & colleges",
  titleLines: ["Empowering the Next", "Generation of", "Innovators & Explorers"],
  /** The last line renders with the cyan-to-violet gradient. */
  body:
    "Turnkey Robotics, AI and Astronomy labs for schools and colleges - complete with cutting-edge equipment, future-ready curricula",
  bodyHighlight: "dedicated expert educators on your campus.",
  /** Secondary call to action beside the form's primary one. */
  secondaryCta: { label: "Partner with Us", href: "/contact" },
  /** Trust strip under the headline. `icon` maps to components/ui/Icon.tsx. */
  proofPoints: [
    { icon: "cap", value: "10,000+", label: "Students Reached" },
    { icon: "clock", value: "Turnkey Setup", label: "labs live in ~10 days" },
    { icon: "support", value: "Certified Educators", label: "placed on campus" },
    { icon: "badge", value: "Future-Ready", label: "curricula" },
  ],
  trustedByLabel: "Trusted by Leading Schools",
  scrollCue: "Scroll to explore",
  /** Hexagon badges overlaid on the hero media. */
  techBadges: [
    { icon: "robot", label: "Robotics" },
    { icon: "ai", label: "AI" },
    { icon: "telescope", label: "Astronomy" },
    { icon: "code", label: "Coding" },
  ],
} as const;

/**
 * Hero visual. Drop an animated file at `video` and the hero swaps from the
 * still image to looping video automatically - no code change needed.
 * `image` doubles as the video poster, so there is never an empty frame.
 */
export const heroMedia = {
  image: "/images/gallery/g5.jpeg",
  // Silent, forward-then-reverse so it loops without a seam. `poster` is the
  // clip's own first frame so there is no visual jump when playback starts;
  // `image` above stays the real-school photo used on phones (no video there).
  /**
   * Hero reel: clips play in order with a crossfade, once through, then hold
   * on the last frame. Slide 1 Robot School, slide 2 the robotics bench,
   * slide 3 the rooftop astronomy night.
   */
  video: {
    mp4: "/images/bg/hero-1.mp4",
    poster: "/images/bg/hero-poster.jpg",
    clips: ["/images/bg/hero-1.mp4", "/images/bg/hero-2.mp4", "/images/bg/hero-3.mp4"],
  } as { mp4: string; webm?: string; poster?: string; clips?: string[] } | null,

  alt: "Students building a robot in a Robonest school lab",
} as const;

/** Compact lead-capture form in the hero. */
export const heroForm = {
  title: "Book a Demo Lab Setup",
  subtitle: "For schools and colleges - we come to your campus",
  note: "Our team will connect with you shortly!",
  submit: "Book a Demo",
} as const;

/** Grounded in real site copy only - no invented figures. */
export const stats = [
  { value: 10000, suffix: "+", label: "Students Empowered" },
  { value: 10, suffix: " Days", label: "Turnkey Lab Setup" },
  { value: 3, suffix: "", label: "Lab Programmes - Robotics, AI, Astronomy" },
  { value: 100, suffix: "%", label: "Educator-Led - certified instructors on campus" },
] as const;

export const about = {
  eyebrow: "About RoboNest",
  titleLines: ["Hands-on STEM,", "on your campus"],
  body:
    "RoboNest is transforming STEM education by bringing hands-on, experiential learning directly to academic campuses. We partner with progressive schools and colleges to design, build and operate state-of-the-art innovation labs.",
  extra:
    "Beyond delivering cutting-edge hardware, we provide certified, expert educators who manage daily lab operations, guide students through project-based learning and ensure seamless curriculum delivery.",
} as const;

/** "The RoboNest Advantage" - rendered beside the About copy. */
export const aiFeatures = {
  title: "The RoboNest Advantage: the Embedded Educator Model",
  intro:
    "A lab is only as effective as the mentor guiding it. RoboNest removes the training burden from institutions entirely.",
  items: [
    {
      title: "Certified In-House Instructors",
      body:
        "Rigorously trained STEM educators placed on your campus, full-time or part-time.",
    },
    {
      title: "Turnkey Management",
      body:
        "Complete responsibility for lesson plans, hardware maintenance, inventory and student assessments.",
    },
    {
      title: "Interdisciplinary Learning",
      body:
        "Lessons structured to reinforce core physics, mathematics and computer science through practical experimentation.",
    },
  ],
} as const;

export type HardwareItem = {
  title: string;
  /** Still image; also the poster/fallback when a video is set. */
  image: string;
  /** Optional short silent loop (mp4). Drop the file in public/images/hw/. */
  video?: string;
  points: string[];
};

export const hardware: HardwareItem[] = [
  {
    title: "ARDUINO UNO",
    image: "/images/hw/arduino-poster.jpg",
    video: "/images/hw/arduino.mp4",
    points: ["Arduino projects", "Arduino programming", "Board design & learning"],
  },
  {
    title: "Sensors",
    image: "/images/hw/sensors-poster.jpg",
    video: "/images/hw/sensors.mp4",
    points: ["How sensors work", "Sensor applications", "Sensor-based projects"],
  },
];

export const labsIntro = {
  eyebrow: "Our Labs",
  title: "Three labs. One turnkey model.",
  body:
    "Robotics & Automation, Artificial Intelligence & Coding, and Astronomy & Space Science - each delivered complete with equipment, a future-ready curriculum and a certified educator on your campus.",
} as const;

export type Lab = {
  id: string;
  badge: string;
  grades: string;
  title: string;
  body: string;
  /** Icon key (components/ui/Icon.tsx) + tile colour for the lab strip. */
  icon: string;
  tint: string;
  features: { label: string; detail: string }[];
};

export const labs: Lab[] = [
  {
    id: "robotics",
    icon: "robot",
    tint: "amber",
    badge: "Build",
    grades: "Schools & Colleges",
    title: "Robotics & Automation Lab",
    body:
      "Practical mechanics, sensors, microcontrollers and circuit design - students build functional robots and IoT prototypes, not just read about them.",
    features: [
      { label: "Hands-on Engineering", detail: "Mechanics, sensors, microcontrollers and circuit design." },
      { label: "Project-Based Kits", detail: "Build functional robots and IoT prototypes." },
      { label: "Competition Prep", detail: "Coaching for national and international robotics leagues." },
    ],
  },
  {
    id: "ai",
    icon: "brain",
    tint: "violet",
    badge: "Code",
    grades: "Schools & Colleges",
    title: "Artificial Intelligence & Coding Lab",
    body:
      "Python, machine-learning logic, computer vision and data fundamentals - taught in safe sandboxes where students build real AI applications.",
    features: [
      { label: "Practical Modules", detail: "Python, ML logic, computer vision and data fundamentals." },
      { label: "Safe Sandboxes", detail: "Build real-world AI applications and conversational tools." },
      { label: "Ethical AI", detail: "Training designed to foster critical thinking and digital literacy." },
    ],
  },
  {
    id: "astronomy",
    icon: "telescope",
    tint: "blue",
    badge: "Explore",
    grades: "Schools & Colleges",
    title: "Astronomy & Space Science Lab",
    body:
      "Professional telescopes, solar scopes and a digital sky observatory - with sky-watching sessions, astrophotography and orbital mechanics workshops.",
    features: [
      { label: "Professional Optics", detail: "Optical telescopes, solar scopes and digital sky observatories." },
      { label: "Practical Sessions", detail: "Sky-watching, astrophotography and orbital mechanics workshops." },
      { label: "Celestial Mapping", detail: "Interactive software aligned with global space-science frameworks." },
    ],
  },
];

export const founders = {
  eyebrow: "Leadership",
  titleLines: ["Visionaries Behind", "Robonest"],
  quote:
    "At Robonest, our founders believe in creating a future where every student gets access to innovation-driven education through AI, Robotics and emerging technologies.",
  people: [
    {
      name: "Achal Arya",
      role: "Founder & CEO",
      quote: "Passionate about transforming education through AI, Robotics and Innovation.",
      image: "/images/team/achal-arya.webp",
    },
    {
      name: "Tushar Arya",
      role: "Co-Founder & Director",
      quote: "Committed to empowering students with future-ready skills and technology.",
      image: "/images/team/tushar-arya.webp",
    },
    {
      name: "Siddharth Sharma",
      role: "CFO",
      quote: "Dream Big, Learn Bigger.",
      image: "/images/team/siddharth-sharma.webp",
    },
    {
      name: "Manish Bhaskar",
      role: "CRO",
      quote: "Building Tomorrow's Innovators.",
      image: "/images/team/manish-bhaskar.webp",
    },
  ],
} as const;

export const execTeam = {
  title: "Discover our executive team",
  people: [
    {
      name: "Vibhu Sharma",
      role: "Chief Technical Officer",
      image: "/images/team/vibhu-sharma.webp",
    },
    {
      name: "Suhani Sharma",
      role: "Sr. Trainer - AI & Robotics",
      image: "/images/team/suhani-sharma.webp",
    },
    { name: "Prashant", role: "Trainer - AI & Robotics", image: null },
    { name: "Ayushi", role: "Trainer - AI & Robotics", image: null },
  ],
} as const;

export const gallery = {
  eyebrow: "Photos",
  title: "Institution Gallery",
  images: [
    "/images/gallery/g1.jpeg",
    "/images/gallery/g2.jpeg",
    "/images/gallery/g3.jpeg",
    "/images/gallery/g4.jpeg",
    "/images/gallery/g5.jpeg",
    "/images/gallery/g6.jpeg",
    "/images/gallery/g7.webp",
  ],
} as const;

export const journey = {
  eyebrow: "About Us",
  title: "Our Journey",
  paragraphs: [
    "Our early days were spent offering small classes in community centres, where we rapidly gained a reputation for our engaging teaching methods and supportive environment. As we honed our curriculum, our student base grew, fuelled by word-of-mouth recommendations and our undeniable passion for education.",
    "With each new program, our institution has continued to evolve, experimenting with different teaching styles while staying true to our mission. Our relentless drive and commitment to fostering authentic, impactful learning experiences have brought us to where we are today - a school on the brink of educational excellence.",
  ],
} as const;

export const schools = {
  title: "Schools We Empower",
  logos: [
    { name: "K.N. Modi", image: "/images/schools/kn-modi.jpg" },
    { name: "Wisdom World School", image: "/images/schools/wisdom-world.jpg" },
    { name: "RSM Olympian", image: "/images/schools/rsm-olympian.jpg" },
    { name: "Bhagirath Public School", image: "/images/schools/bhagirath.webp" },
  ],
} as const;

export const ctaForm = {
  eyebrow: "Contact us",
  title: "Ready to bring a lab to your campus?",
  body:
    "Book a demo lab setup or partner with us. Our team will design the right Robotics, AI or Astronomy lab for your school or college - equipment, curriculum and educators included.",
  designations: [
    "Principal",
    "Headmaster",
    "Vice Principal",
    "Director",
    "Academic Coordinator",
    "Senior Teacher",
    "Administrative Head",
    "Teacher / HOD",
    "School Manager",
    "Trustee / Director",
    "College Dean / HOD",
    "Chairperson",
    "Other",
  ],
} as const;

/**
 * Floating WhatsApp button.
 *
 * `number` must include the country code with no spaces or symbols - wa.me
 * silently fails on a local-format number. 91 = India.
 * `message` is prefilled in the chat, so the enquiry arrives with context
 * instead of a bare "hi".
 */
export const whatsapp = {
  number: "918860788886",
  label: "Chat with us",
  message:
    "Hi Robonest, I'm interested in setting up a lab at our school. Could you share the details?",
} as const;

/**
 * HOMEPAGE TEAM RULES - the only place these are set.
 *
 * `tag`   which employees appear on the homepage. Tag someone "Homepage" in
 *         Odoo (Employees -> the Tags field) and they show there. Set this to
 *         null to fall back to showing everyone.
 * `max`   hard cap, so the homepage can never grow into a wall of faces as
 *         the company hires. The About page is uncapped.
 */
export const homeTeam = {
  tag: "Homepage" as string | null,
  max: 8,
} as const;

/* ---------------- Videos ---------------- */

/**
 * YouTube videos for /videos.
 *
 * PLACEHOLDER IDS - replace `youtubeId` with the real ones from Robonest's
 * channel (the value after `v=` in a YouTube URL). Thumbnails are pulled from
 * YouTube automatically, so no images need uploading.
 *
 * These live here rather than in Odoo because Odoo has no native "video"
 * model; if you want the team editing this list themselves, the eLearning app
 * (slide.slide, video type) is the place and I can switch the source over.
 */
export const videosPage = {
  eyebrow: "Watch",
  title: "Robonest in Action",
  body:
    "Lab installations, student projects, exhibitions and educator-led sessions - see what a RoboNest lab actually looks like.",
  categories: ["All", "Lab Setup", "Student Projects", "Astronomy", "Events"],
  items: [
    {
      youtubeId: "dQw4w9WgXcQ",
      title: "Inside an Integrated Robotics Lab",
      category: "Lab Setup",
      duration: "3:24",
    },
    {
      youtubeId: "dQw4w9WgXcQ",
      title: "Students Build a Line-Following Robot",
      category: "Student Projects",
      duration: "5:10",
    },
    {
      youtubeId: "dQw4w9WgXcQ",
      title: "Stargazing Session with the Astronomy Lab",
      category: "Astronomy",
      duration: "4:02",
    },
    {
      youtubeId: "dQw4w9WgXcQ",
      title: "Robotics Exhibition Highlights",
      category: "Events",
      duration: "2:48",
    },
    {
      youtubeId: "dQw4w9WgXcQ",
      title: "An Educator-Led Lab Session",
      category: "Lab Setup",
      duration: "6:15",
    },
    {
      youtubeId: "dQw4w9WgXcQ",
      title: "Tiny ML on a Microcontroller",
      category: "Student Projects",
      duration: "7:31",
    },
  ],
} as const;

/* ---------------- About page ---------------- */

export const aboutPage = {
  hero: { eyebrow: "About Us", title: "About Robonest" },
  intro: [
    "RoboNest is transforming STEM education by bringing hands-on, experiential learning directly to academic campuses. We partner with progressive schools and colleges to design, build and operate state-of-the-art innovation labs.",
    "Beyond just delivering cutting-edge hardware, we provide certified, expert educators who manage daily lab operations, guide students through project-based learning and ensure seamless curriculum delivery.",
    "Our three programmes - Robotics & Automation, Artificial Intelligence & Coding, and Astronomy & Space Science - are structured to reinforce core physics, mathematics and computer science through practical experimentation.",
  ],
  focus: {
    title: "We focus on",
    items: [
      "Certified in-house instructors on your campus",
      "Turnkey management - lessons, maintenance, inventory, assessment",
      "Interdisciplinary, project-based learning",
      "Three lab tracks: Robotics, AI, Astronomy",
      "Competition preparation for robotics leagues",
    ],
  },
  closing: "At RoboNest, we do not just build labs - we run them, so your students can explore.",
  why: {
    eyebrow: "The RoboNest Advantage",
    title: "The Embedded Educator Model",
    items: [
      {
        title: "Certified In-House Instructors",
        body:
          "Rigorously trained STEM educators placed on your campus full-time or part-time - no training burden on your staff.",
      },
      {
        title: "Turnkey Management",
        body:
          "Complete responsibility for lesson plans, hardware maintenance, inventory and student assessments.",
      },
      {
        title: "Interdisciplinary Learning",
        body:
          "Lessons structured to reinforce core physics, mathematics and computer science concepts through practical experimentation.",
      },
    ],
  },
  programs: {
    eyebrow: "Our Labs",
    title: "Three labs, delivered turnkey",
    body:
      "Every programme arrives complete: the equipment, a future-ready curriculum and a certified RoboNest educator who runs it on your campus.",
    items: [
      {
        title: "Robotics & Automation",
        body: "Mechanics, sensors, microcontrollers, circuit design - and competition prep.",
      },
      {
        title: "Artificial Intelligence & Coding",
        body: "Python, ML logic, computer vision and ethical-AI training in safe sandboxes.",
      },
      {
        title: "Astronomy & Space Science",
        body:
          "Telescopes, solar scopes, digital sky observatories, astrophotography and orbital mechanics.",
      },
    ],
  },
  cta: {
    titleLines: ["Bring a RoboNest lab", "to your campus"],
    body: "Book a demo lab setup, or partner with us to run innovation labs across your institution.",
    action: "Book a Demo Lab Setup",
  },
} as const;

/* ---------------- Contact page ---------------- */

export const contactPage = {
  eyebrow: "Contact us",
  title: "Let us build your lab",
  body:
    "Talk to us about a Robotics, AI or Astronomy lab for your school or college, partnerships, or anything else RoboNest.",
  responseNote: "We typically respond within 1-2 business days.",
  faq: [
    {
      q: "Who are the labs for?",
      a: "Schools and colleges. Each of our three programmes - Robotics & Automation, AI & Coding, and Astronomy & Space Science - is delivered with an age-appropriate curriculum, from school classes through to undergraduate cohorts.",
    },
    {
      q: "How long does a complete lab setup take?",
      a: "A standard lab is delivered, installed and ready to run in about 10 days from confirmation - hardware, curriculum and the educator who will run it.",
    },
    {
      q: "Is the curriculum aligned to NEP?",
      a: "Yes. Our lab ecosystems and curriculum are NEP-aligned and built around age-appropriate, project-based progression from block-based logic through to Python and machine learning.",
    },
    {
      q: "Who runs the lab day to day?",
      a: "We do - that is the RoboNest difference. A certified in-house instructor is placed on your campus, full-time or part-time, and takes complete responsibility for lesson plans, hardware maintenance, inventory and student assessments. There is no training burden on your staff.",
    },
    {
      q: "What equipment is included?",
      a: "Robotics: microcontrollers, sensors, mechanics and project kits for building robots and IoT prototypes. AI: coding workstations with safe sandboxes for Python, machine learning and computer vision. Astronomy: professional optical telescopes, solar scopes, a digital sky observatory and celestial mapping software.",
    },
    {
      q: "Do you provide support after installation?",
      a: "Yes. We provide continued technical and academic support, replacement assistance for consumables and components, and periodic curriculum updates.",
    },
  ],
} as const;

/**
 * The robot mascot. Appears in the hero form, page heroes, stats, the labs
 * rail, the footer, the 404 page and as the face of the chat assistant.
 * Everything the assistant SAYS lives here so the team can change it without
 * touching a component. It is scripted, not an LLM: it cannot invent prices
 * or promises, and every path ends at a human (WhatsApp or the enquiry form).
 */
export const mascot = {
  name: "Nesty",
  greeting:
    "Hi! I'm Nesty, RoboNest's lab robot. Ask me about our labs, or tap a question below.",
  placeholder: "Ask Nesty…",
  fallback:
    "Good question - that one's for a human. Tap WhatsApp and the team will answer directly, or leave your details and we'll call you.",
  quickReplies: [
    "What labs do you offer?",
    "Who runs the lab?",
    "How long does setup take?",
    "Is it for colleges too?",
    "How do I get pricing?",
  ],
  /** Keyword-matched answers. First match wins; keep keywords lowercase. */
  faq: [
    {
      keywords: ["lab", "labs", "offer", "solution", "product"],
      answer:
        "Three turnkey labs: Robotics & Automation, Artificial Intelligence & Coding, and Astronomy & Space Science. Each comes complete with equipment, a future-ready curriculum and a certified RoboNest educator on your campus. Scroll to the Labs section for details.",
    },
    {
      keywords: ["long", "time", "setup", "install", "days", "fast", "quick"],
      answer:
        "A complete lab - equipment, curriculum and the educator who runs it - is up and running in about 10 working days from sign-off.",
    },
    {
      keywords: ["grade", "grades", "class", "age", "standard", "nep", "college", "colleges", "university", "school"],
      answer:
        "Schools and colleges. Each programme has an age-appropriate curriculum - from school classes up to undergraduate cohorts - structured to reinforce physics, mathematics and computer science through practical work.",
    },
    {
      keywords: ["teacher", "train", "training", "staff", "support", "who runs", "instructor", "educator", "mentor"],
      answer:
        "We run it. A certified RoboNest instructor is placed on your campus - full-time or part-time - and handles lesson plans, hardware maintenance, inventory and assessments. Your staff carry no training burden.",
    },
    {
      keywords: ["price", "pricing", "cost", "quote", "budget", "fee", "rate", "demo"],
      answer:
        "Pricing depends on the lab type, the number of students and the room. Leave your school name and mobile in the form and our team will call with a tailored quote - or tap WhatsApp to talk right now.",
    },
    {
      keywords: ["where", "location", "noida", "delhi", "city", "office", "address"],
      answer:
        "We're based in New Delhi (Khajoori Khas) and set up labs across India. Travel is included in the setup.",
    },
    {
      keywords: ["event", "exhibition", "workshop", "showcase"],
      answer:
        "We run exhibitions, teacher workshops and school showcases. Upcoming ones - and photos from past events - are on the Events page.",
    },
    {
      keywords: ["hello", "hi", "hey", "namaste"],
      answer: "Hello! What would you like to know about setting up a lab at your school?",
    },
  ],
  handoff: {
    whatsapp: "Chat on WhatsApp",
    enquiry: "Request a call back",
  },
  /**
   * What the mascot says when a section scrolls into view. Keys match the
   * `data-nesty` attribute on that section. Each shows once per visit. Keep
   * them to one short sentence - it is a speech bubble, not a paragraph.
   */
  sectionTips: {
    "lab-index": "Our three labs. Tap any card to jump to the details.",
    stats: "Real numbers - 10,000+ students, and every lab educator-led.",
    about: "Who we are, and why we do this.",
    labs: "Three labs - Robotics, AI, Astronomy. Each comes with its own RoboNest educator.",
    hardware: "The actual hardware your students will work with - Arduino, sensors and more.",
    team: "The people who set up your lab - and the educators who run it.",
    videos: "See a real lab in action - pick any video.",
    gallery: "Photos from labs and events we've run.",
    journey: "How Robonest grew, year by year.",
    schools: "Some of the schools already running our labs.",
    enquiry: "Leave your school name and number - the team calls back within a day.",
    "events-upcoming": "Upcoming events - tap one to register.",
    "events-past": "Our past events, with photos from each. Tap 'See photos'.",
    "blog-list": "Articles from the team - filter by topic.",
    "video-grid": "Our full video library. Shorts are marked.",
    contact: "Call, WhatsApp or drop a note - whichever is easiest for you.",
    "about-body": "Our story, mission and the team behind Robonest.",
    freeze: "Scroll slowly - time is stopped, you're moving the camera.",
    space: "Keep scrolling. You're flying. This is the Astronomy Lab.",
  } as Record<string, string>,
} as const;

/** Astronomy lab teaser (SpaceWarp): the interactive particle sky. */
export const space = {
  eyebrow: "Astronomy & Space Science Lab",
  title: "Some labs look up.",
  body: "Professional optical telescopes, solar scopes and a digital sky observatory - with sky-watching sessions, astrophotography and orbital mechanics workshops, run by a RoboNest educator on your campus.",
  cta: "Explore the Astronomy Lab",
  href: "/#labs",
} as const;
