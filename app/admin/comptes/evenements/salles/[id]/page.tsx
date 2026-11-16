import Link from "next/link";
import { authedFetch } from "@/lib/server-api";
import { SpaceRulesForm, type SpaceRules } from "@/components/backoffice/space-rules-form";

export const dynamic = "force-dynamic";

/** Réglages d'une salle par l'équipe Moboo. */
export default async function SallePage({ params }: { params: { id: string } }) {
  const r = await authedFetch(`/site/admin/event-online/espaces/${encodeURIComponent(params.id)}`, { method: "GET" });
  if (!r.ok) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Salle introuvable.</p>;
  const d = r.data as SpaceRules & { espace: { nom: string; commune: string | null }; tarifs: { type: string; libelle: string; prixBase: number }[] };
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/comptes/evenements/salles" className="text-sm font-semibold text-brand-800 hover:underline">← Réglages des salles</Link>
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{d.espace.nom}</h1>
        <p className="text-sm text-muted">
          Formules : {d.tarifs.length ? d.tarifs.map((t) => `${t.libelle} ${Math.round(t.prixBase).toLocaleString("fr-FR")} F`).join(" · ") : "aucune"}.
          Les prix des formules se règlent dans Moboo Event ; ici, les suppléments, options et visites.
        </p>
      </div>
      <SpaceRulesForm id={params.id} d={d} />
    </div>
  );
}
