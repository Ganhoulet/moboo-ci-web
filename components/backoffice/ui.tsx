// Petits éléments partagés des pages Utilisateurs / Modération / Journal (serveur et client).

export const TYPE_LABEL: Record<string, string> = {
  particulier: "Particulier", proprietaire: "Propriétaire", agent: "Agent", entreprise: "Agence / promoteur", etablissement: "Résidences / espaces",
};

export const fmtDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Abidjan" }) : "—";
export const fmtDateTime = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Abidjan" }) : "—";

/** « il y a 3 h », « il y a 2 j »… */
export function ago(d?: string | Date | null) {
  if (!d) return "jamais";
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "à l’instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 86400 * 30) return `il y a ${Math.floor(s / 86400)} j`;
  return fmtDate(d);
}

const STATUS: Record<string, [string, string]> = {
  active: ["Actif", "bg-emerald-50 text-emerald-700 ring-emerald-200"],
  suspended: ["Suspendu", "bg-amber-50 text-amber-800 ring-amber-200"],
  banned: ["Banni", "bg-red-50 text-red-700 ring-red-200"],
  pending: ["En attente", "bg-amber-50 text-amber-800 ring-amber-200"],
  approved: ["Validée", "bg-emerald-50 text-emerald-700 ring-emerald-200"],
  rejected: ["Refusée", "bg-red-50 text-red-700 ring-red-200"],
  changes: ["À corriger", "bg-sky-50 text-sky-800 ring-sky-200"],
  open: ["Ouvert", "bg-amber-50 text-amber-800 ring-amber-200"],
  resolved: ["Résolu", "bg-emerald-50 text-emerald-700 ring-emerald-200"],
  dismissed: ["Classé", "bg-slate-100 text-slate-600 ring-slate-200"],
  ACTIVE: ["En ligne", "bg-emerald-50 text-emerald-700 ring-emerald-200"],
  DISABLED: ["Masquée", "bg-slate-100 text-slate-600 ring-slate-200"],
  SOLD: ["Vendue", "bg-violet-50 text-violet-700 ring-violet-200"],
  RENTED: ["Louée", "bg-violet-50 text-violet-700 ring-violet-200"],
};
// « suspended » d'une annonce = masquée avec son compte suspendu.
export function Pill({ s, label }: { s: string; label?: string }) {
  const [l, c] = STATUS[s] ?? [s, "bg-slate-100 text-slate-600 ring-slate-200"];
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${c}`}>{label ?? l}</span>;
}

export function Avatar({ name, url, size = 36 }: { name: string; url?: string | null; size?: number }) {
  const initials = name.replace(/^\+/, "").split(/\s+/).map((x) => x[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="grid shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-800" style={{ width: size, height: size, fontSize: size / 2.6 }}>{initials}</span>
  );
}

export function Card({ title, action, children, className = "" }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg bg-white shadow-sm ring-1 ring-slate-200 ${className}`}>
      {title ? (
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold text-ink">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

export const ACTION_LABEL: Record<string, string> = {
  listing: "Annonce", account: "Compte", role: "Rôle", settings: "Réglages", seo: "Page SEO", marketing: "Marketing",
  page: "Page d’accueil", taxonomy: "Listes", partner: "Partenaire", review: "Avis", package: "Forfait", invoice: "Facture",
  verification: "Vérification", app: "Application",
};
