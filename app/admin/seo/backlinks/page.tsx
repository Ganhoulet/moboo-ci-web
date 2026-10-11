import { BacklinksManager } from "@/components/backoffice/backlinks-manager";
import { getBacklinks } from "./actions";

export const dynamic = "force-dynamic";

export default async function BacklinksPage() {
  const d = await getBacklinks();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Backlinks</h1>
        <p className="max-w-3xl text-sm text-muted">Les liens d’autres sites vers moboo.ci comptent beaucoup pour Google. Suivez ici les liens obtenus et ceux à obtenir. Chaque nuit, Moboo vérifie que le lien est toujours sur la page et s’il est « follow » (pris en compte par Google).</p>
      </div>
      {d ? <BacklinksManager items={d.items} stats={d.stats} /> : <p className="text-muted">Indisponible pour le moment.</p>}
    </div>
  );
}
