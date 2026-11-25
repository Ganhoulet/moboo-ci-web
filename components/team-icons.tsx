// Icônes de l'Espace équipe : traits fins, même style partout (à la place des emojis).
import type { SVGProps } from "react";

const P = (d: React.ReactNode) => (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>{d}</svg>
);

export const TEAM_ICONS = {
  home: P(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h5v-6h4v6h5V9.5" /></>),
  briefcase: P(<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /></>),
  phoneCall: P(<><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /><path d="M15 3a6 6 0 0 1 6 6M15 7a2 2 0 0 1 2 2" /></>),
  phone: P(<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />),
  phoneIncoming: P(<><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /><path d="M21 3l-5 5M16 4v4h4" /></>),
  concierge: P(<><path d="M3 18h18M4 18a8 8 0 0 1 16 0M12 7V5M10 5h4" /><path d="M2 21h20" /></>),
  luggage: P(<><rect x="5" y="7" width="14" height="13" rx="2" /><path d="M9 7V4h6v3M9 11v5M15 11v5M8 20v1M16 20v1" /></>),
  users: P(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20c0-2.6-1.6-4.8-4-5.6" /></>),
  user: P(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>),
  pen: P(<><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>),
  link: P(<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>),
  lightbulb: P(<><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3Z" /></>),
  message: P(<><path d="M4 5h16v11H8l-4 4V5Z" /><path d="M8 9h8M8 12h5" /></>),
  checkSquare: P(<><rect x="3" y="3" width="18" height="18" rx="3" /><path d="m8 12 3 3 5-6" /></>),
  target: P(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>),
  history: P(<><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>),
  graduation: P(<><path d="m2 9 10-5 10 5-10 5L2 9Z" /><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v6" /></>),
  book: P(<><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5v-15Z" /><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20M8 7h8" /></>),
  map: P(<><path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14M15 6v14" /></>),
  receipt: P(<><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2Z" /><path d="M9 8h6M9 12h6M9 16h3" /></>),
  package: P(<><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>),
  megaphone: P(<><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z" /><path d="M15 8a5 5 0 0 1 0 8M18 5a9 9 0 0 1 0 14" /></>),
  qr: P(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v.01M14 21h3M21 18v3M17 17h1" /></>),
  file: P(<><path d="M6 3h8l5 5v13H6V3Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>),
  badge: P(<><path d="M4 7h16v10H4z" /><path d="M8 11h8M8 14h5" /></>),
  chart: P(<><path d="M4 20V4M4 20h16" /><rect x="7" y="11" width="3" height="6" rx="0.5" /><rect x="12" y="7" width="3" height="10" rx="0.5" /><rect x="17" y="13" width="3" height="4" rx="0.5" /></>),
  search: P(<><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>),
  building: P(<><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4" /></>),
  trending: P(<><path d="m3 17 6-6 4 4 8-8" /><path d="M14 7h7v7" /></>),
  compass: P(<><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>),
  shield: P(<><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></>),
  flag: P(<path d="M4 21V4M4 4h12l-2 4 2 4H4" />),
  badgeCheck: P(<><path d="M12 3l2.3 1.7 2.9-.2.9 2.7 2.4 1.7-.9 2.8.9 2.8-2.4 1.7-.9 2.7-2.9-.2L12 21l-2.3-1.7-2.9.2-.9-2.7-2.4-1.7.9-2.8-.9-2.8 2.4-1.7.9-2.7 2.9.2L12 3Z" /><path d="m9 12 2 2 4-4" /></>),
  headset: P(<><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /><path d="M19 20a3 3 0 0 1-3 2h-2" /></>),
  calendar: P(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  scale: P(<><path d="M12 3v18M7 21h10M5 7h14" /><path d="M5 7l-3 7a3 3 0 0 0 6 0L5 7ZM19 7l-3 7a3 3 0 0 0 6 0l-3-7Z" /></>),
  help: P(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" /></>),
  layout: P(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>),
  lock: P(<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
  bell: P(<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0" />),
  bellOff: P(<><path d="M6 8a6 6 0 0 1 9.5-4.9M18 8c0 7 3 8 3 8H8M3 16s3-1 3-8M10 20a2 2 0 0 0 4 0M3 3l18 18" /></>),
  settings: P(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>),
  logout: P(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>),
  arrowUpRight: P(<path d="M7 17 17 7M8 7h9v9" />),
} as const;

export type TeamIcon = keyof typeof TEAM_ICONS;

export function Icon({ name, className, size = 18 }: { name: TeamIcon; className?: string; size?: number }) {
  const C = TEAM_ICONS[name];
  return <C width={size} height={size} className={className} />;
}
