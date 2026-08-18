/**
 * Inline stroke icons for the hero proof points, tech badges and lab strip.
 *
 * Stroke-based (not filled) so they stay crisp at small sizes and inherit
 * currentColor. Inline for the same reasons as SocialIcon: static export,
 * no CDN request, no icon-font flash.
 */

const ICONS: Record<string, React.ReactNode> = {
  // --- hero proof points ---
  cap: (
    <>
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  badge: (
    <>
      <path d="M12 3l2.4 1.8 3 .2.9 2.8 2.2 2-1.2 2.7.4 3-2.8 1.2-1.8 2.4-2.9-.6-2.9.6-1.8-2.4-2.8-1.2.4-3L3.7 10.6l2.2-2 .9-2.8 3-.2L12 3Z" />
      <path d="M9 12.5l2 2 4-4.5" />
    </>
  ),
  support: (
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="2.5" y="13.5" width="4" height="6" rx="1.5" />
      <rect x="17.5" y="13.5" width="4" height="6" rx="1.5" />
      <path d="M9 10.5h.01M15 10.5h.01" />
    </>
  ),

  // --- hero tech badges ---
  robot: (
    <>
      <rect x="5" y="8" width="14" height="11" rx="3" />
      <path d="M12 8V4.5M9.5 3.5h5" />
      <path d="M9.5 12.5h.01M14.5 12.5h.01" />
      <path d="M9.5 16h5" />
    </>
  ),
  ai: (
    <>
      <path d="M12 3a5 5 0 0 0-5 5v1.2A4 4 0 0 0 8 17v2a2 2 0 0 0 4 0" />
      <path d="M12 3a5 5 0 0 1 5 5v1.2A4 4 0 0 1 16 17v2a2 2 0 0 1-4 0" />
      <path d="M12 3v18" />
    </>
  ),
  iot: (
    <>
      <path d="M4.5 9a10.5 10.5 0 0 1 15 0" />
      <path d="M7.5 12.5a6.5 6.5 0 0 1 9 0" />
      <path d="M10.5 16a3 3 0 0 1 3 0" />
      <circle cx="12" cy="19.5" r="1" />
    </>
  ),
  code: (
    <>
      <path d="M9 8l-4.5 4L9 16" />
      <path d="M15 8l4.5 4L15 16" />
    </>
  ),

  // --- lab strip ---
  lab: (
    <>
      <path d="M12 4v6" />
      <path d="M7 20h10a2 2 0 0 0 1.6-3.2L14 10.5V4h-4v6.5L5.4 16.8A2 2 0 0 0 7 20Z" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z" />
      <path d="M19 18v3H6.5A2.5 2.5 0 0 1 4 18.5" />
    </>
  ),
  chip: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M10 3.5v3M14 3.5v3M10 17.5v3M14 17.5v3M3.5 10h3M3.5 14h3M17.5 10h3M17.5 14h3" />
    </>
  ),
  cog: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M4.2 7.5l2.2 1.3M17.6 15.2l2.2 1.3M4.2 16.5l2.2-1.3M17.6 8.8l2.2-1.3" />
    </>
  ),
  brain: (
    <>
      <path d="M9.5 4.5A3 3 0 0 0 6.6 8 3.2 3.2 0 0 0 5 11c0 1.2.6 2.2 1.6 2.8A3 3 0 0 0 9.5 19h.5V4.5h-.5Z" />
      <path d="M14.5 4.5A3 3 0 0 1 17.4 8 3.2 3.2 0 0 1 19 11c0 1.2-.6 2.2-1.6 2.8a3 3 0 0 1-2.9 5.2H14V4.5h.5Z" />
    </>
  ),

  // --- form field icons ---
  school: (
    <>
      <path d="M4 20V9.5L12 5l8 4.5V20" />
      <path d="M9.5 20v-5h5v5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.5-5.6 6.5-10a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z" />
      <circle cx="12" cy="11" r="2.3" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12.5h18" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  phone: (
    <path d="M7 3.5h3l1.5 4-2 1.5a10 10 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 5 5.7 2 2 0 0 1 7 3.5Z" />
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </>
  ),
  arrow: <path d="M4 12h15m-5-5 5 5-5 5" />,
  chevronLeft: <path d="M15 5l-7 7 7 7" />,
  chevronRight: <path d="M9 5l7 7-7 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  mouse: (
    <>
      <rect x="8.5" y="3" width="7" height="12" rx="3.5" />
      <path d="M12 6v3" />
    </>
  ),
};

export default function Icon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.7,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const glyph = ICONS[name];
  if (!glyph) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {glyph}
    </svg>
  );
}
