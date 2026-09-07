/**
 * Single source of truth for all site copy.
 * Extracted from the previous Odoo site; placeholder/demo text removed.
 * Change a number here and it updates everywhere.
 */

export const site = {
  name: "Robonest",
  legalName: "Robonest Private Limited",
  tagline: "Creating AI & Robotics Schools",
  description:
    "Robonest transforms education through Robotics, Artificial Intelligence, Coding and STEM lab solutions for schools across India.",
  url: "https://www.therobonest.com",
} as const;

export const contact = {
  addressLabel: "Branch Office",
  address: "E-22, Sector-72, Noida, Uttar Pradesh",
  phones: ["8860788886", "7217704018", "9953610316"],
  email: "robonestacc@gmail.com",
  mapQuery: "E-22, Sector 72, Noida, Uttar Pradesh, India",
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
  eyebrow: "India's trusted partner for",
  titleLines: ["Future-Ready", "School Labs"],
  /** The second line renders with the cyan-to-violet gradient. */
  body:
    "Complete Robotics, AI & IoT labs with curriculum, kits, software & teacher training",
  bodyHighlight: "installed in just 10 days.",
  /** Trust strip under the headline. `icon` maps to components/ui/Icon.tsx. */
  proofPoints: [
    { icon: "cap", value: "10,000+", label: "Students Reached" },
    { icon: "clock", value: "Complete Setup", label: "in ~10 Days" },
    { icon: "badge", value: "NEP Aligned", label: "Curriculum" },
    { icon: "support", value: "Teacher Training", label: "& Support" },
  ],
  trustedByLabel: "Trusted by Leading Schools",
  scrollCue: "Scroll to explore",
  /** Hexagon badges overlaid on the hero media. */
  techBadges: [
    { icon: "robot", label: "Robotics" },
    { icon: "ai", label: "AI" },
    { icon: "iot", label: "IoT" },
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
  video: {
    mp4: "/images/bg/hero.mp4",
    webm: "/images/bg/hero.webm",
    poster: "/images/bg/hero-poster.jpg",
    /**
     * Optional REEL: several clips played in continuity with a crossfade,
     * looping as a whole. When present it replaces mp4/webm above. Drop the
     * files in public/images/bg/ and list them in order. Each clip's last
     * frame should match the next clip's first frame for a seamless story.
     */
    clips: ["/images/bg/hero.mp4"],
  } as { mp4: string; webm?: string; poster?: string; clips?: string[] } | null,
  alt: "Students building a robot in a Robonest school lab",
} as const;

/** Compact lead-capture form in the hero. */
export const heroForm = {
  title: "Bring Innovation to Your School",
  subtitle: "Enquire now for your school lab",
  note: "Our team will connect with you shortly!",
  submit: "Submit Enquiry",
} as const;

/** Grounded in real site copy only - no invented figures. */
export const stats = [
  { value: 10000, suffix: "+", label: "Students Empowered" },
  { value: 10, suffix: " Days", label: "Complete Lab Setup" },
  { value: 5, suffix: "", label: "Modular Lab Solutions" },
  { value: 12, suffix: "", label: "Grades Covered (1-12)" },
] as const;

export const about = {
  eyebrow: "About Us",
  titleLines: ["Redefining modern", "learning"],
  body:
    "With engaging lessons and a curriculum that is both dynamic and innovative, we create an atmosphere that keeps students motivated from start to finish.",
  extra:
    "At Robonest, we are revolutionizing the way we learn and train with cutting-edge AI technology. Our platform is designed to make learning more efficient, personalized and accessible than ever before.",
} as const;

export const aiFeatures = {
  title: "Unlock the Power of AI-Driven Learning",
  items: [
    {
      title: "Personalized Learning Paths",
      body:
        "Our AI-powered system creates customized learning journeys tailored to your unique needs and goals.",
    },
    {
      title: "Real-Time Feedback and Assessment",
      body:
        "Get instant feedback and assessment on your progress, helping you stay on track and achieve your objectives.",
    },
    {
      title: "Immersive Interactive Experiences",
      body:
        "Engage with interactive simulations, virtual labs and gamification elements that make learning fun and effective.",
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
    image: "/images/arduino-uno.webp",
    // video: "/images/hw/arduino.mp4",
    points: ["Arduino projects", "Arduino programming", "Board design & learning"],
  },
  {
    title: "Sensors",
    image: "/images/sensors.webp",
    // video: "/images/hw/sensors.mp4",
    points: ["How sensors work", "Sensor applications", "Sensor-based projects"],
  },
];

export const labsIntro = {
  eyebrow: "Modular Lab Solutions",
  title: "Transform Learning with Our Future Leaders Lab Solutions",
  body:
    "From foundational tinkering spaces to advanced Artificial Intelligence centres - we deliver modular, NEP-aligned ecosystems equipped with authentic LEGO® Education and Arduino technologies, and our signature RoboGenius kits.",
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
    id: "integrated",
    icon: "lab",
    tint: "amber",
    badge: "Foundation",
    grades: "Grades 1-12",
    title: "Integrated Lab Solution",
    body:
      "Transforms traditional classrooms into innovation hubs where students learn through experimentation, coding, robotics and real-world applications.",
    features: [
      { label: "LEGO® Kits", detail: "Robotics and coding fundamentals." },
      { label: "Arduino Kits", detail: "Advanced AI and IoT prototyping." },
      { label: "RoboGenius Kits", detail: "Core electronics and hands-on tinkering." },
      { label: "Scalable Progression", detail: "From block-based logic to Python." },
    ],
  },
  {
    id: "curriculum",
    icon: "book",
    tint: "green",
    badge: "Curriculum",
    grades: "Grades 1-12",
    title: "Curriculum Base",
    body:
      "A well-designed curriculum that introduces students to AI, Robotics, Coding and Innovation through age-appropriate practical activities and projects.",
    features: [
      { label: "Curriculum-Based Learning", detail: "AI & robotics mapped to grade level." },
      { label: "Hands-on Training", detail: "Project-based practical sessions." },
      { label: "Teacher Support", detail: "Expert mentorship and training." },
      { label: "Future-Ready Skills", detail: "Industry-oriented technology exposure." },
    ],
  },
  {
    id: "arduino",
    icon: "chip",
    tint: "blue",
    badge: "Industry Ready",
    grades: "Grades 6-12",
    title: "Arduino Inspiration Lab",
    body:
      "The engineering frontier focusing on the Internet of Things (IoT) and electronic circuits using the Arduino UNO R4 and Explore IoT Kit.",
    features: [
      { label: "Real-World IoT", detail: "Design deployable IoT solutions." },
      { label: "Cloud Connectivity", detail: "Real-time data collection." },
      { label: "Wireless Prototyping", detail: "Wi-Fi & Bluetooth enabled builds." },
      { label: "Circuit Design", detail: "Electrical and electronic fundamentals." },
    ],
  },
  {
    id: "iot",
    icon: "cog",
    tint: "ember",
    badge: "Industry Ready",
    grades: "Grades 6+",
    title: "Electronics, IoT & Robotics Lab",
    body:
      "Our core engineering setup focused heavily on real-world application, bridging core electronics with the Internet of Things and functional robotics.",
    features: [
      { label: "Extensive Curriculum", detail: "30+ comprehensive hands-on projects." },
      { label: "Automation & Control", detail: "Build and program mechanical systems." },
      { label: "Robust Hardware", detail: "50+ diverse electronic components." },
      { label: "Core Focus", detail: "Deep dive into electronics and IoT." },
    ],
  },
  {
    id: "ai",
    icon: "brain",
    tint: "violet",
    badge: "Advanced Tech",
    grades: "Grades 6-12",
    title: "Artificial Intelligence (A.I.) Lab",
    body:
      "A scalable AI ecosystem. While the Arduino Alvik introduces robotics to younger students, the Tiny ML Kit empowers seniors to deploy real ML models.",
    features: [
      { label: "Tiny Machine Learning", detail: "Run ML on microcontrollers." },
      { label: "Arduino Alvik", detail: "Smart robotic companion." },
      { label: "Python & TensorFlow Lite", detail: "Real framework integration." },
      { label: "Sensor-Based AI", detail: "Environmental interaction models." },
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
  title: "Ready to Transform Your School?",
  body:
    "Get a free consultation with our education experts. We will help you design the perfect robotics lab solution for your school's unique needs and budget.",
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
    "Lab installations, student projects, exhibitions and teacher training - see what a Robonest classroom actually looks like.",
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
      title: "Teacher Training Programme",
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
    "Robonest is a forward-thinking technology company dedicated to transforming education through innovation. We specialize in Robotics, Artificial Intelligence (AI), Coding, STEM education and advanced lab solutions for schools and institutions.",
    "At Robonest, we believe that the future belongs to creators, innovators and problem-solvers. Our mission is to equip students with 21st-century skills by providing hands-on learning experiences that go beyond textbooks. We design and implement smart labs - including AI Labs, Robotics Labs, Language Labs, ATL Labs and Digital Classrooms - to create an interactive and future-ready learning environment.",
    "Our team consists of experienced engineers, educators and technology experts who are passionate about empowering young minds. From installation and training to ongoing support, we ensure seamless implementation and long-term success for every institution we work with.",
  ],
  focus: {
    title: "We focus on",
    items: [
      "Practical, hands-on learning",
      "Industry-relevant curriculum",
      "Affordable and scalable solutions",
      "Complete setup, training & support",
      "Future-ready technology integration",
    ],
  },
  closing: "At Robonest, we do not just build labs - we build innovators.",
  why: {
    eyebrow: "Why?",
    title: "Why Choose Us?",
    items: [
      {
        title: "Cutting-Edge Technology",
        body:
          "Our AI-powered platform is built on the latest advancements in machine learning and natural language processing.",
      },
      {
        title: "Expert Content Creators",
        body:
          "Our team of experts curate high-quality, relevant and engaging content that is tailored to your needs.",
      },
      {
        title: "Continuous Innovation",
        body:
          "We are constantly updating and improving our platform to ensure you stay ahead of the curve.",
      },
    ],
  },
  programs: {
    eyebrow: "About Us",
    title: "Empowering the Next Generation with AI Education",
    body:
      "Prepare students for the future with our AI training programs, designed to integrate seamlessly into school and college curricula. Our expert-led courses and workshops equip students with the skills and knowledge needed to thrive in an AI-driven world.",
    items: [
      {
        title: "AI Fundamentals",
        body: "Introduction to AI, machine learning and data science.",
      },
      {
        title: "Real-World Projects",
        body: "Collaborate with industry partners on real-world AI projects and competitions.",
      },
      {
        title: "Practical Applications",
        body:
          "Hands-on projects and case studies in image recognition, natural language processing and more.",
      },
    ],
  },
  cta: {
    titleLines: ["Experience the real", "Learning of Artificial Intelligence & Robotics"],
    body: "Join us and create the future with us.",
    action: "Book an Appointment",
  },
} as const;

/* ---------------- Contact page ---------------- */

export const contactPage = {
  eyebrow: "Contact us",
  title: "Let us build your lab",
  body:
    "Talk to us about lab solutions, curriculum, training or anything else related to Robonest.",
  responseNote: "We typically respond within 1-2 business days.",
  faq: [
    {
      q: "Which grades do your labs support?",
      a: "Our modular solutions span Grades 1 to 12. Foundation tinkering and LEGO® based robotics start from Grade 1, while Arduino IoT and Artificial Intelligence labs are designed for Grades 6 and above.",
    },
    {
      q: "How long does a complete lab setup take?",
      a: "A standard lab is delivered, installed and made classroom-ready in about 10 days from confirmation, including hardware installation and initial teacher orientation.",
    },
    {
      q: "Is the curriculum aligned to NEP?",
      a: "Yes. Our lab ecosystems and curriculum are NEP-aligned and built around age-appropriate, project-based progression from block-based logic through to Python and machine learning.",
    },
    {
      q: "Do you train our existing teachers?",
      a: "We do. Every installation includes expert mentorship and teacher training, plus ongoing academic support so your staff can run sessions independently.",
    },
    {
      q: "What hardware is included?",
      a: "Depending on the lab tier: authentic LEGO® Education kits, Arduino UNO R4 and Explore IoT kits, Arduino Alvik robots, Tiny ML kits and our signature RoboGenius electronics kits - 50+ components and 30+ guided projects in the Electronics, IoT & Robotics tier.",
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
    "Hi! I'm Nesty, Robonest's lab robot. Ask me about our labs, or tap a question below.",
  placeholder: "Ask Nesty…",
  fallback:
    "Good question - that one's for a human. Tap WhatsApp and the team will answer directly, or leave your details and we'll call you.",
  quickReplies: [
    "What labs do you offer?",
    "How long does setup take?",
    "Which grades is it for?",
    "Do you train our teachers?",
    "How do I get pricing?",
  ],
  /** Keyword-matched answers. First match wins; keep keywords lowercase. */
  faq: [
    {
      keywords: ["lab", "labs", "offer", "solution", "product"],
      answer:
        "We set up five modular labs: Integrated Lab (grades 1-12), Curriculum Base, Arduino Inspiration Lab (6-12), AI & Robotics Lab and the Astronomy Lab. Each comes with kits, curriculum, software and teacher training. Scroll to the Labs section for details.",
    },
    {
      keywords: ["long", "time", "setup", "install", "days", "fast", "quick"],
      answer:
        "A complete lab - hardware, furniture, curriculum and trained teachers - is installed in about 10 working days from sign-off.",
    },
    {
      keywords: ["grade", "grades", "class", "age", "standard", "nep"],
      answer:
        "Grades 1 to 12. The curriculum is NEP-2020 aligned and progresses from block coding with LEGO® Education in the junior classes to Python, Arduino and AI projects in the senior classes.",
    },
    {
      keywords: ["teacher", "train", "training", "staff", "support"],
      answer:
        "Yes. Every lab includes hands-on teacher training and ongoing support from our education team, so your own staff can run the sessions confidently.",
    },
    {
      keywords: ["price", "pricing", "cost", "quote", "budget", "fee", "rate", "demo"],
      answer:
        "Pricing depends on the lab type, the number of students and the room. Leave your school name and mobile in the form and our team will call with a tailored quote - or tap WhatsApp to talk right now.",
    },
    {
      keywords: ["where", "location", "noida", "delhi", "city", "office", "address"],
      answer:
        "We're based in Noida (Sector 72) and install labs across India. Travel is included in the setup.",
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
    "lab-index": "These are our five labs. Tap any card to jump to the details.",
    stats: "Real numbers - 10,000+ students have built with us so far.",
    about: "Who we are, and why we do this.",
    labs: "Swipe through the labs. Each one comes with kits, curriculum and teacher training.",
    hardware: "The actual hardware your students will work with - Arduino, sensors and more.",
    team: "The people who will set up and support your lab.",
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
  } as Record<string, string>,
} as const;
