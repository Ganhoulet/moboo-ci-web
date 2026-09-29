// Icônes du back-office (module partagé serveur / client).
const sv = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
export const ADMIN_ICONS: Record<string, React.ReactNode> = {
  dashboard: <svg {...sv}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>,
  gauge: <svg {...sv}><path d="M12 14l3-3M3.5 17a9 9 0 1 1 17 0" /><circle cx="12" cy="14" r="1.5" /></svg>,
  image: <svg {...sv}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 17-5-5-9 8" /></svg>,
  layout: <svg {...sv}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /></svg>,
  lock: <svg {...sv}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>,
  bell: <svg {...sv}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0" /></svg>,
  home: <svg {...sv}><path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" /></svg>,
  plus: <svg {...sv}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>,
  search: <svg {...sv}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>,
  mail: <svg {...sv}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>,
  print: <svg {...sv}><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2" /><rect x="6" y="14" width="12" height="7" /></svg>,
  building: <svg {...sv}><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4" /></svg>,
  users: <svg {...sv}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20c0-2.6-1.6-4.8-4-5.6" /></svg>,
  star: <svg {...sv}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9Z" /></svg>,
  card: <svg {...sv}><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19M6 15h4" /></svg>,
  tag: <svg {...sv}><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9Z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>,
  handshake: <svg {...sv}><path d="m11 17 2 2a1.4 1.4 0 0 0 2-2M14 14l2.5 2.5a1.4 1.4 0 0 0 2-2l-3.9-3.9a2 2 0 0 0-2.8 0l-.9.9a1.4 1.4 0 0 1-2-2l2.8-2.8a4 4 0 0 1 4.6-.7l.6.3a2 2 0 0 0 1.5.1L21 6M3 6l3.5 1.2M3 13h2l3.5 3.5a1.4 1.4 0 0 0 2-2" /></svg>,
  receipt: <svg {...sv}><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2ZM9 8h6M9 12h6M9 16h3" /></svg>,
};
