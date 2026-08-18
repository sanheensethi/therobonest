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

export const socials = [
  { label: "Facebook", href: "https://www.facebook.com/" },
  { label: "Instagram", href: "https://www.instagram.com/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/" },
  { label: "Twitter", href: "https://twitter.com/" },
] as const;

export const nav = [
  { label: "Home", href: "/" },
  { label: "Labs", href: "/#labs" },
  { label: "Team", href: "/#team" },
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
  video: null as string | null, // e.g. "/images/bg/hero.mp4"
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

export const hardware = [
  {
    title: "ARDUINO UNO",
    image: "/images/arduino-uno.webp",
    points: ["Arduino projects", "Arduino programming", "Board design & learning"],
  },
  {
    title: "Sensors",
    image: "/images/sensors.webp",
    points: ["How sensors work", "Sensor applications", "Sensor-based projects"],
  },
] as const;

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
