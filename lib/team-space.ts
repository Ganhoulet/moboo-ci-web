// Espace équipe Moboo (ep.moboo.ci, moboo.ci/equipe) : une seule entrée pour toute
// l'équipe ; chacun voit les rubriques de son rôle (Rôles et permissions).
// /equipe/… affiche les écrans du back-office /admin/… dans un cadre allégé :
// les droits restent vérifiés par l'API et par lib/admin-perms.
import { canAccess } from "./admin-perms";
import type { TeamIcon } from "@/components/team-icons";

export const TEAM_BASE = "/equipe";

export interface TeamTab {
  href: string; label: string; icon: TeamIcon;
  /** Raccourci de la barre du bas sur téléphone. */
  main?: boolean;
  /** Account managers : rubrique liée à leur spécialité (hôtes ou annonces). */
  kind?: "hosts" | "ads";
  /** Réservé au responsable des account managers. */
  lead?: boolean;
  badge?: "urgent" | "pending" | "support";
}
export interface TeamGroup { id: string; label: string; icon: TeamIcon; desc: string; tabs: TeamTab[] }

export const TEAM_GROUPS: TeamGroup[] = [
  {
    id: "comptes", label: "Mes comptes", icon: "briefcase",
    desc: "Account managers : réservations à confirmer, portefeuille, publication pour les agents, support des clients.",
    tabs: [
      { href: "/equipe/comptes", label: "Aujourd’hui", icon: "phoneCall", main: true, badge: "urgent" },
      { href: "/equipe/comptes/reservations", label: "Réservations", icon: "concierge", main: true, kind: "hosts", badge: "pending" },
      { href: "/equipe/comptes/sejours", label: "Séjours", icon: "luggage", kind: "hosts" },
      { href: "/equipe/comptes/portefeuille", label: "Portefeuille", icon: "users", main: true },
      { href: "/equipe/comptes/appels", label: "Appels", icon: "phone" },
      { href: "/equipe/comptes/studio", label: "Publier", icon: "pen", main: true, kind: "ads" },
      { href: "/equipe/comptes/liens-rapides", label: "Liens rapides", icon: "link", kind: "ads" },
      { href: "/equipe/comptes/opportunites", label: "Opportunités", icon: "lightbulb", kind: "hosts" },
      { href: "/equipe/comptes/support", label: "Support", icon: "message", badge: "support" },
      { href: "/equipe/comptes/taches", label: "Tâches", icon: "checkSquare" },
      { href: "/equipe/comptes/performance", label: "Objectifs", icon: "target" },
      { href: "/equipe/comptes/journal", label: "Mes actions", icon: "history" },
      { href: "/equipe/comptes/academie", label: "Académie", icon: "graduation" },
      { href: "/equipe/comptes/guide", label: "Guide", icon: "book" },
      { href: "/equipe/comptes/equipes", label: "Équipes et zones", icon: "map", lead: true },
    ],
  },
  {
    id: "compta", label: "Comptabilité", icon: "receipt", desc: "Factures et forfaits des clients.",
    tabs: [
      { href: "/equipe/immobilier/factures", label: "Factures", icon: "receipt", main: true },
      { href: "/equipe/immobilier/forfaits", label: "Forfaits", icon: "package" },
    ],
  },
  {
    id: "marketing", label: "Marketing", icon: "megaphone", desc: "Campagnes, centre marketing, affiches QR, documents et publicité.",
    tabs: [
      { href: "/equipe/marketing", label: "Campagnes", icon: "megaphone", main: true },
      { href: "/equipe/centre-marketing", label: "Centre marketing", icon: "target" },
      { href: "/equipe/affiches-qr", label: "Affiches QR", icon: "qr" },
      { href: "/equipe/documents", label: "Documents", icon: "file" },
      { href: "/equipe/publicite", label: "Publicité", icon: "badge" },
      { href: "/equipe/professionnels/demandes", label: "Demandes de rappel", icon: "phoneIncoming" },
    ],
  },
  {
    id: "donnees", label: "Données", icon: "chart", desc: "Statistiques du site et intelligence immobilière.",
    tabs: [
      { href: "/equipe/statistiques", label: "Statistiques", icon: "chart", main: true },
      { href: "/equipe/statistiques/recherches", label: "Recherches", icon: "search" },
      { href: "/equipe/statistiques/professionnels", label: "Professionnels", icon: "building" },
      { href: "/equipe/statistiques/prix", label: "Indice des prix", icon: "trending" },
      { href: "/equipe/intelligence", label: "Marché", icon: "compass" },
    ],
  },
  {
    id: "moderation", label: "Modération", icon: "shield", desc: "Annonces à valider, signalements et vérification des comptes.",
    tabs: [
      { href: "/equipe/moderation", label: "Modération", icon: "shield", main: true },
      { href: "/equipe/moderation/anti-fraude", label: "Anti-fraude", icon: "flag" },
      { href: "/equipe/verifications", label: "Vérifications", icon: "badgeCheck" },
    ],
  },
  {
    id: "support", label: "Support client", icon: "headset", desc: "Demandes d’aide, réservations, litiges et fiches des utilisateurs.",
    tabs: [
      { href: "/equipe/services/support", label: "Demandes d’aide", icon: "headset", main: true },
      { href: "/equipe/reservations", label: "Réservations", icon: "calendar" },
      { href: "/equipe/litiges", label: "Litiges", icon: "scale" },
      { href: "/equipe/utilisateurs", label: "Utilisateurs", icon: "users" },
    ],
  },
  {
    id: "contenu", label: "Contenu", icon: "pen", desc: "Pages SEO, centre d’aide et page d’accueil.",
    tabs: [
      { href: "/equipe/seo", label: "Pages SEO", icon: "search", main: true },
      { href: "/equipe/aide", label: "Centre d’aide", icon: "help" },
      { href: "/equipe/accueil", label: "Page d’accueil", icon: "layout" },
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
