import { CopyText } from "@/components/stays/copy-text";
import { listKits } from "../actions";

export const dynamic = "force-dynamic";

/** Back-office → Séjours → Kits Google : un lien par résidence, à envoyer à l'hôte. */
export default async function AdminGbpKits() {
  const rows = await listKits();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Kits fiche Google</h1>
        <p className="max-w-3xl text-sm text-muted">Chaque résidence a un kit prêt à remplir (nom, catégories, description, liens de réservation, étapes) pour apparaître dans Google Maps. Envoyez le lien à l’hôte sur WhatsApp ; il est aussi proposé aux account managers dans leurs recommandations.</p>
      </div>
      {rows ? (
        <div className="grid gap-2">{rows.map((r) => <CopyText key={r.id} label={`${r.name}${r.place ? ` · ${r.place}` : ""}`} text={r.kit} />)}</div>
      ) : <p className="rounded-lg bg-white p-6 text-muted ring-1 ring-slate-200">Chargement impossible (droits « Pages SEO » requis).</p>}
    </div>
  );
}
