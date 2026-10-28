/**
 * Icônes du site, au trait (style des portails immobiliers comme Zillow) : remplacent les émojis.
 * `SiteIcon` accepte un nom (« maison », « cle »…) ou un ancien émoji enregistré dans le
 * constructeur de pages (🏠, 🔑…), converti à l'affichage : rien à ressaisir dans le back-office.
 */

const P: Record<string, React.ReactNode> = {
  maison: <><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-5h4v5" /></>,
  villa: <><path d="M2 12 9 6l7 6" /><path d="M4 11v9h10v-9" /><path d="M16 9l3-2.5 3 2.5v11h-8" /><path d="M8 20v-4h3v4" /></>,
  appartement: <><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" /><path d="M11 21v-3h2v3" /></>,
  residence: <><rect x="3" y="8" width="8" height="13" rx="1" /><rect x="13" y="3" width="8" height="18" rx="1" /><path d="M6 12h2M6 16h2M16 7h2M16 11h2M16 15h2" /></>,
  ville: <><path d="M3 21h18" /><rect x="4" y="10" width="5" height="11" /><rect x="10" y="4" width="5" height="17" /><rect x="16" y="13" width="4" height="8" /><path d="M12 8h1M12 12h1M12 16h1" /></>,
  terrain: <><path d="M3 20h18" /><path d="M7 20v-5" /><path d="M7 15c-2.5 0-4-1.7-4-4s2-4 4-4 4 1.7 4 4-1.5 4-4 4Z" /><path d="M14 20l3-6 4 6" /></>,
  bureau: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M3 13h18" /></>,
  magasin: <><path d="M4 9l1.5-5h13L20 9" /><path d="M4 9h16v2a3 3 0 0 1-5.3 2A3 3 0 0 1 12 14a3 3 0 0 1-2.7-1A3 3 0 0 1 4 11Z" /><path d="M5 14v6h14v-6" /><path d="M10 20v-4h4v4" /></>,
  entrepot: <><path d="M3 21V9l9-5 9 5v12" /><path d="M7 21v-8h10v8" /><path d="M7 16h10" /></>,
  canape: <><path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" /><path d="M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3Z" /><path d="M6 18v2M18 18v2" /></>,
  lit: <><path d="M3 18V7" /><path d="M3 14h18v4" /><path d="M21 14v-2a3 3 0 0 0-3-3h-7v5" /><circle cx="7" cy="11" r="1.6" /></>,
  cle: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8" /><path d="m16 7 2 2M14 9l2 2" /></>,
  annonce: <><path d="M3 10v4a1 1 0 0 0 1 1h3l6 4V5L7 9H4a1 1 0 0 0-1 1Z" /><path d="M17 9a4 4 0 0 1 0 6" /><path d="M19.5 6.5a8 8 0 0 1 0 11" /></>,
  boussole: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5Z" /></>,
  recherche: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  lieu: <><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  telephone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  mobile: <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>,
  message: <path d="M4 5h16v11H8l-4 4Z" />,
  modifier: <><path d="M4 20h4L19 9l-4-4L4 16Z" /><path d="m13 7 4 4" /></>,
  liste: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 3h6v3H9z" /><path d="M9 11h6M9 15h6" /></>,
  document: <><path d="M6 3h8l4 4v14H6Z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 16h6" /></>,
  calendrier: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  graphique: <><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 16v-4M12 16V8M16 16v-6" /></>,
  tendance: <><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  argent: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 10v4M18 10v4" /></>,
  carte_bancaire: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></>,
  recu: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" /><path d="M9 8h6M9 12h6" /></>,
  bouclier: <><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z" /><path d="m9 12 2 2 4-4" /></>,
  cadenas: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  cloche: <><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  photo: <><path d="M4 8h3l2-3h6l2 3h3v12H4Z" /><circle cx="12" cy="13" r="3.5" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>,
  etoile: <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6L12 16.8 6.6 19.6l1-6L3.3 9.4l6-.9Z" />,
  succes: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  fusee: <><path d="M5 19c1-3 3-5 5-6" /><path d="M14 4c3 0 6 3 6 6l-7 7-6-6Z" /><circle cx="15" cy="9" r="1.5" /></>,
  oeil: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  oeil_barre: <><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.4-1" /></>,
  corbeille: <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></>,
  actualiser: <><path d="M20 11a8 8 0 0 0-14.9-3.9L4 9" /><path d="M4 4v5h5" /><path d="M4 13a8 8 0 0 0 14.9 3.9L20 15" /><path d="M20 20v-5h-5" /></>,
  pouce: <><path d="M7 11v9H4v-9Z" /><path d="M7 11l4-7a2 2 0 0 1 2 2v4h5a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 16.8 20H7" /></>,
  pouce_bas: <><path d="M7 13V4H4v9Z" /><path d="M7 13l4 7a2 2 0 0 0 2-2v-4h5a2 2 0 0 0 2-2.3l-1.2-6A2 2 0 0 0 16.8 4H7" /></>,
  coeur: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  cadeau: <><rect x="3" y="8" width="18" height="4" /><path d="M5 12v9h14v-9M12 8v13" /><path d="M12 8c-2-3-6-3-6-1s4 1 6 1c2 0 6 1 6-1s-4-2-6 1Z" /></>,
  ampoule: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" /></>,
  aide: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /><path d="m5.6 5.6 3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" /></>,
  livre: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z" /><path d="M4 19V5M8 7h7" /></>,
  journal: <><path d="M4 5h13v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2Z" /><path d="M17 9h3v10a2 2 0 0 1-2 2" /><path d="M7 9h7M7 13h7M7 17h4" /></>,
  poignee: <><path d="m3 12 4-4 4 2 3-2 7 5" /><path d="m7 8-4 4 6 6 2-1 2 2 2-1 2 1 3-3" /><path d="m11 17 3-3M13 19l2-2" /></>,
  personne: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  equipe: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.4c2.1.7 3.5 2.7 3.5 5.6" /></>,
  identite: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16c.5-1.5 1.7-2.5 3-2.5s2.5 1 3 2.5M15 10h3M15 14h3" /></>,
  calculatrice: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 12h1M12 12h1M16 12h0M8 16h1M12 16h1M16 15v2" /></>,
  outils: <><path d="M3 9h18v11H3Z" /><path d="M8 9V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M3 14h18" /></>,
  etapes: <><path d="M4 20h5v-5h5v-5h5V5" /><path d="M4 20V5" /></>,
  lien: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  boite: <><path d="M3 13h5l2 3h4l2-3h5" /><path d="M5 5h14l2 8v6H3v-6Z" /></>,
  etiquette: <><path d="M3 12V4h8l10 10-8 8Z" /><circle cx="7.5" cy="8.5" r="1.5" /></>,
  banque: <><path d="M3 10 12 4l9 6" /><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18" /></>,
  fiole: <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" /><path d="M7 15h10" /></>,
  alerte: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h0" /></>,
  bonjour: <><circle cx="12" cy="12" r="9" /><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" /><path d="M9 10h0M15 10h0" /></>,
  plus: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5h0" /></>,
  attention: <><path d="M12 3 2 20h20Z" /><path d="M12 10v4M12 17h0" /></>,
};

/** Ancien émoji (pages enregistrées, menus) → icône au trait. */
const EMOJI: Record<string, string> = {
  "🏠": "maison", "🏡": "villa", "🏢": "appartement", "🏘": "residence", "🏙": "ville", "🏬": "magasin", "🏪": "magasin",
  "🏭": "entrepot", "🏗": "appartement", "🏛": "banque", "🏦": "banque", "🌳": "terrain", "🌿": "terrain", "💼": "bureau",
  "🛋": "canape", "🛏": "lit", "🔑": "cle", "📣": "annonce", "📢": "annonce", "🧭": "boussole", "🔎": "recherche", "🔍": "recherche",
  "📍": "lieu", "📞": "telephone", "📱": "mobile", "💬": "message", "📝": "modifier", "📋": "liste", "📄": "document",
  "🗓": "calendrier", "📅": "calendrier", "📊": "graphique", "📈": "tendance", "💰": "argent", "💸": "argent", "💳": "carte_bancaire",
  "🧾": "recu", "🛡": "bouclier", "🔐": "cadenas", "🔒": "cadenas", "🔔": "cloche", "🛎": "cloche", "📸": "photo", "🖼": "image",
  "🎬": "video", "🌟": "etoile", "⭐": "etoile", "✨": "etoile", "🎉": "succes", "🚀": "fusee", "👁": "oeil", "🙈": "oeil_barre", "🗑": "corbeille",
  "🔄": "actualiser", "👍": "pouce", "👎": "pouce_bas", "🙏": "coeur", "❤": "coeur", "🎁": "cadeau", "💡": "ampoule", "🛟": "aide",
  "📘": "livre", "📚": "livre", "📰": "journal", "🤝": "poignee", "🧑": "personne", "👤": "personne", "👥": "equipe", "🪪": "identite",
  "🧮": "calculatrice", "🧰": "outils", "🪜": "etapes", "🔌": "lien", "🔗": "lien", "📥": "boite", "🏷": "etiquette", "🧪": "fiole",
  "😕": "alerte", "👋": "bonjour", "➕": "plus", "ℹ": "info", "⚠": "attention", "✅": "succes", "🔥": "tendance", "⏱": "calendrier", "⏰": "calendrier", "👀": "oeil", "📦": "boite", "🗺": "lieu", "🏆": "etoile", "💎": "etoile", "🆕": "etoile", "🛒": "magasin", "📷": "photo", "🎥": "video", "📧": "message", "✉": "message", "🧹": "outils", "🔧": "outils", "🛠": "outils", "⚖": "bouclier", "🧑‍💼": "bureau", "👨‍💼": "bureau", "👩‍💼": "bureau",
};

/** Nom d'icône pour une valeur (nom, émoji, ou rien). */
export function iconName(value: string | null | undefined): string | null {
  const v = String(value ?? "").trim();
  if (!v) return null;
  if (P[v]) return v;
  const base = v.replace(/[️‍]/g, "");
  return EMOJI[base] ?? EMOJI[Array.from(base)[0] ?? ""] ?? null;
}

export function Icon({ name, size = 22, className = "", strokeWidth = 1.8 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  const d = P[name] ?? P.maison;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {d}
    </svg>
  );
}

/** Icône d'un bloc (nom ou ancien émoji) ; texte libre non reconnu (lettre, chiffre) gardé tel quel. */
export function SiteIcon({ value, fallback = "maison", size = 22, className = "" }: { value?: string | null; fallback?: string; size?: number; className?: string }) {
  const name = iconName(value) ?? (value && !/\p{Extended_Pictographic}/u.test(value) ? null : fallback);
  if (!name) return <span className={className}>{value}</span>;
  return <Icon name={name} size={size} className={className} />;
}

export const ICON_NAMES = Object.keys(P);
