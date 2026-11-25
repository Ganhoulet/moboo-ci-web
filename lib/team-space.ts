// Espace équipe Moboo (ep.moboo.ci, moboo.ci/equipe) : une seule entrée pour toute
// l'équipe ; chacun voit les rubriques de son rôle (Rôles et permissions).
// /equipe/… affiche les écrans du back-office /admin/… dans un cadre allégé :
// les droits restent vérifiés par l'API et par lib/admin-perms.
import { canAccess } from "./admin-perms";

export const TEAM_BASE = "/equipe";

export interface TeamTab {
  href: string; label: string; emoji: string;
  /** Raccourci de la barre du bas sur téléphone. */
  main?: boolean;
  /** Account managers : rubrique liée à leur spécialité (hôtes ou annonces). */
  kind?: "hosts" | "ads";
  /** Réservé au responsable des account managers. */
  lead?: boolean;
  badge?: "urgent" | "pending" | "support";
}
export interface TeamGroup { id: string; label: string; emoji: string; desc: string; tabs: TeamTab[] }

export const TEAM_GROUPS: TeamGroup[] = [
  {
    id: "comptes", label: "Mes comptes", emoji: "💼",
    desc: "Account managers : réservations à confirmer, portefeuille, publication pour les agents, support des clients.",
    tabs: [
      { href: "/equipe/comptes", label: "Aujourd’hui", emoji: "📞", main: true, badge: "urgent" },
      { href: "/equipe/comptes/reservations", label: "Réservations", emoji: "🛎️", main: true, kind: "hosts", badge: "pending" },
      { href: "/equipe/comptes/sejours", label: "Séjours", emoji: "🧳", kind: "hosts" },
      { href: "/equipe/comptes/portefeuille", label: "Portefeuille", emoji: "👥", main: true },
      { href: "/equipe/comptes/appels", label: "Appels", emoji: "☎️" },
      { href: "/equipe/comptes/studio", label: "Publier", emoji: "✍️", main: true, kind: "ads" },
      { href: "/equipe/comptes/liens-rapides", label: "Liens rapides", emoji: "🔗", kind: "ads" },
      { href: "/equipe/comptes/opportunites", label: "Opportunités", emoji: "💡", kind: "hosts" },
      { href: "/equipe/comptes/support", label: "Support", emoji: "💬", badge: "support" },
      { href: "/equipe/comptes/taches", label: "Tâches", emoji: "✅" },
      { href: "/equipe/comptes/performance", label: "Objectifs", emoji: "🎯" },
      { href: "/equipe/comptes/journal", label: "Mes actions", emoji: "🗂️" },
      { href: "/equipe/comptes/academie", label: "Académie", emoji: "🎓" },
      { href: "/equipe/comptes/guide", label: "Guide", emoji: "📘" },
      { href: "/equipe/comptes/equipes", label: "Équipes et zones", emoji: "🗺️", lead: true },
    ],
  },
  {
    id: "compta", label: "Comptabilité", emoji: "🧾", desc: "Factures et forfaits des clients.",
    tabs: [
      { href: "/equipe/immobilier/factures", label: "Factures", emoji: "🧾", main: true },
      { href: "/equipe/immobilier/forfaits", label: "Forfaits", emoji: "📦" },
    ],
  },
  {
    id: "marketing", label: "Marketing", emoji: "📣", desc: "Campagnes, centre marketing, affiches QR, documents et publicité.",
    tabs: [
      { href: "/equipe/marketing", label: "Campagnes", emoji: "📣", main: true },
      { href: "/equipe/centre-marketing", label: "Centre marketing", emoji: "🎯" },
      { href: "/equipe/affiches-qr", label: "Affiches QR", emoji: "🔳" },
      { href: "/equipe/documents", label: "Documents", emoji: "📄" },
      { href: "/equipe/publicite", label: "Publicité", emoji: "📢" },
      { href: "/equipe/professionnels/demandes", label: "Demandes de rappel", emoji: "📞" },
    ],
  },
  {
    id: "donnees", label: "Données", emoji: "📊", desc: "Statistiques du site et intelligence immobilière.",
    tabs: [
      { href: "/equipe/statistiques", label: "Statistiques", emoji: "📊", main: true },
      { href: "/equipe/statistiques/recherches", label: "Recherches", emoji: "🔎" },
      { href: "/equipe/statistiques/professionnels", label: "Professionnels", emoji: "🏢" },
      { href: "/equipe/statistiques/prix", label: "Indice des prix", emoji: "📈" },
      { href: "/equipe/intelligence", label: "Marché", emoji: "🧭" },
    ],
  },
  {
    id: "moderation", label: "Modération", emoji: "🛡️", desc: "Annonces à valider, signalements et vérification des comptes.",
    tabs: [
      { href: "/equipe/moderation", label: "Modération", emoji: "🛡️", main: true },
      { href: "/equipe/moderation/anti-fraude", label: "Anti-fraude", emoji: "🚩" },
      { href: "/equipe/verifications", label: "Vérifications", emoji: "✅" },
    ],
  },
  {
    id: "support", label: "Support client", emoji: "🎧", desc: "Demandes d’aide, réservations, litiges et fiches des utilisateurs.",
    tabs: [
      { href: "/equipe/services/support", label: "Demandes d’aide", emoji: "🎧", main: true },
      { href: "/equipe/reservations", label: "Réservations", emoji: "🛎️" },
      { href: "/equipe/litiges", label: "Litiges", emoji: "⚖️" },
      { href: "/equipe/utilisateurs", label: "Utilisateurs", emoji: "👤" },
    ],
  },
  {
    id: "contenu", label: "Contenu", emoji: "✏️", desc: "Pages SEO, centre d’aide et page d’accueil.",
    tabs: [
      { href: "/equipe/seo", label: "Pages SEO", emoji: "🔎", main: true },
      { href: "/equipe/aide", label: "Centre d’aide", emoji: "❓" },
      { href: "/equipe/accueil", label: "Page d’accueil", emoji: "🏠" },
    ],
  },
];

/** Adresse du back-office correspondant à une adresse de l'Espace équipe. */
export const adminPathOf = (href: string) => (href === TEAM_BASE ? "/admin/equipe" : "/admin" + href.slice(TEAM_BASE.length));

export interface TeamContext {
  perms: string[];
  /** Spécialité de l'account manager (produits) ; vide = tout. */
  hosts?: boolean; ads?: boolean;
  badges?: Partial<Record<NonNullable<TeamTab["badge"]>, number>>;
}

/** Rubriques et onglets que le rôle peut ouvrir (une rubrique sans onglet disparaît). */
export function teamGroupsFor(ctx: TeamContext): (TeamGroup & { tabs: (TeamTab & { count?: number })[] })[] {
  const lead = ctx.perms.includes("accounts.all");
  return TEAM_GROUPS.map((g) => ({
    ...g,
    tabs: g.tabs
      .filter((t) => canAccess(ctx.perms, adminPathOf(t.href)))
      .filter((t) => !t.lead || lead)
      .filter((t) => (t.kind === "hosts" ? ctx.hosts !== false : t.kind === "ads" ? ctx.ads !== false : true))
      .map((t) => ({ ...t, count: t.badge ? ctx.badges?.[t.badge] ?? 0 : undefined })),
  })).filter((g) => g.tabs.length > 0);
}
