// Couleurs et libellés des informations ciblées (client et serveur).
export const NOTICE_TONE: Record<string, { label: string; bar: string; chip: string; icon: string }> = {
  info: { label: "Information", bar: "bg-brand-800 text-white", chip: "bg-brand-50 text-brand-800", icon: "ℹ️" },
  nouveaute: { label: "Nouveauté", bar: "bg-violet-700 text-white", chip: "bg-violet-50 text-violet-700", icon: "✨" },
  important: { label: "Important", bar: "bg-red-600 text-white", chip: "bg-red-50 text-red-700", icon: "⚠️" },
  conseil: { label: "Conseil", bar: "bg-emerald-700 text-white", chip: "bg-emerald-50 text-emerald-700", icon: "💡" },
  promo: { label: "Offre", bar: "bg-accent-600 text-white", chip: "bg-accent-50 text-accent-700", icon: "🎁" },
};
