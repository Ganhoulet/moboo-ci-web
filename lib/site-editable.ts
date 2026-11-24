// Autres pages du site modifiables dans le constructeur (en plus de l'accueil et
// des pages professionnels). Chaque page garde son contenu d'origine (formulaires,
// listes, annonces…) sous forme d'un bloc « Contenu d'origine de la page » que l'on
// peut masquer ou entourer d'autres blocs (bannière, texte, FAQ, images…).

import { BLOCKS, blockDef, newSection, type BlockDef, type PageContent, type Section } from "./page-blocks";

export const EDITABLE_PAGES = [
  { slug: "site-services", path: "/services", label: "Services Moboo" },
  { slug: "site-publier", path: "/publier", label: "Publier une annonce" },
  { slug: "site-forfaits", path: "/forfaits", label: "Forfaits" },
  { slug: "site-reserver", path: "/reserver", label: "Réserver" },
  { slug: "site-annonces", path: "/annonces", label: "Annonces (résultats de recherche)" },
  { slug: "site-diaspora", path: "/diaspora", label: "Diaspora" },
  { slug: "site-garantie-arrivee", path: "/garantie-arrivee", label: "Garantie arrivée" },
  { slug: "site-telecharger", path: "/telecharger", label: "Télécharger l’application" },
  { slug: "site-aide", path: "/aide", label: "Centre d’aide" },
  { slug: "site-agents-immobiliers", path: "/agents-immobiliers", label: "Agents immobiliers" },
  { slug: "site-programmes-neufs", path: "/programmes-neufs", label: "Programmes neufs" },
] as const;
export type EditableSlug = (typeof EDITABLE_PAGES)[number]["slug"];
export const editablePage = (slug: string) => EDITABLE_PAGES.find((p) => p.slug === slug);

export const PAGE_CONTENT_TYPE = "pageContent";
export const PAGE_CONTENT_BLOCK: BlockDef = {
  type: PAGE_CONTENT_TYPE, label: "Contenu d’origine de la page", icon: "📄",
  description: "Ce que la page affiche aujourd’hui (formulaires, listes, annonces…). Déplacez-le, masquez-le, ou ajoutez des blocs avant et après.",
  fields: [], defaults: {},
};

/** Blocs proposés dans « + Ajouter » (le contenu d'origine n'y est pas : il existe une seule fois). */
export const SITE_PAGE_BLOCKS: BlockDef[] = BLOCKS;
export const sitePageBlockDef = (type: string) => (type === PAGE_CONTENT_TYPE ? PAGE_CONTENT_BLOCK : blockDef(type));
export const newSitePageSection = (type: string): Section =>
  type === PAGE_CONTENT_TYPE ? { id: "page-content", type, enabled: true, props: {} } : newSection(type);

/** Contenu lisible : le bloc d'origine existe toujours, une seule fois (masqué s'il avait été supprimé). */
export function normalizeSitePage(c: Partial<PageContent> | null | undefined): PageContent {
  const raw = Array.isArray(c?.sections) ? c!.sections.filter((s) => s && typeof s.type === "string") : [];
  let seen = false;
  const sections = raw.filter((s) => {
    if (s.type !== PAGE_CONTENT_TYPE) return !!sitePageBlockDef(s.type);
    if (seen) return false;
    seen = true;
    return true;
  }).map((s) => ({ ...s, props: s.props ?? {} }));
  if (!seen) sections.push({ id: "page-content", type: PAGE_CONTENT_TYPE, enabled: !raw.length, props: {} });
  return { sections };
}
