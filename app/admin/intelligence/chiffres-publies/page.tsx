import { listReferences } from "./actions";
import { ReferencesView } from "./view";

export const dynamic = "force-dynamic";

/** Intelligence immobilière → Chiffres publiés par d'autres sources (saisie manuelle). */
export default async function ChiffresPubliesPage() {
  return <ReferencesView items={await listReferences()} />;
}
