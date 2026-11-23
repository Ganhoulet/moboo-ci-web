import { listCatalogues } from "./actions";
import { CataloguesView } from "./view";

export const dynamic = "force-dynamic";

/** Intelligence immobilière → Catalogues des agences : annonces reçues pour les statistiques (jamais publiées). */
export default async function CataloguesPage() {
  return <CataloguesView items={await listCatalogues()} />;
}
