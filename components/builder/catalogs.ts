// Catalogues de blocs du constructeur (accueil, espace pros, autres pages du site).
// Choisis par une clé : une fonction ne peut pas passer d'un composant serveur à un composant client.
import { PRO_BLOCKS, newProSection, proBlockDef } from "@/lib/pro-blocks";
import { BLOCKS, blockDef as homeBlockDef, newSection as homeNewSection, type BlockDef, type Section } from "@/lib/page-blocks";
import { SITE_PAGE_BLOCKS, newSitePageSection, sitePageBlockDef } from "@/lib/site-editable";

export interface BuilderCatalog { blocks: BlockDef[]; def: (type: string) => BlockDef | undefined; create: (type: string) => Section }
export type CatalogKey = "home" | "pros" | "page";
export const CATALOGS: Record<CatalogKey, BuilderCatalog> = {
  home: { blocks: BLOCKS, def: homeBlockDef, create: homeNewSection },
  pros: { blocks: PRO_BLOCKS, def: proBlockDef, create: newProSection },
  page: { blocks: SITE_PAGE_BLOCKS, def: sitePageBlockDef, create: newSitePageSection },
};
