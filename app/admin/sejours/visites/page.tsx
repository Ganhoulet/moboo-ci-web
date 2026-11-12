import { ChecksBoard } from "@/components/stays/admin-checks";
import { listChecks } from "../actions";

export const dynamic = "force-dynamic";

/** Back-office → Séjours → Vérifié sur place : visites des agents et confort réel. */
export default async function AdminStayChecks({ searchParams }: { searchParams: { q?: string } }) {
  const rows = await listChecks(searchParams.q);
  const todo = rows?.filter((r) => r.state === "a_faire").length ?? 0;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Vérifié sur place</h1>
        <p className="max-w-3xl text-sm text-muted">Après la visite d’un agent, saisissez ce qu’il a constaté : conformité aux photos, électricité, eau, Wi-Fi mesuré, climatisation, sécurité, parking. La page de la résidence affiche alors le badge « Vérifié sur place » et la fiche « confort réel » pendant 12 mois.</p>
      </div>
      <form className="flex gap-2"><input name="q" defaultValue={searchParams.q ?? ""} placeholder="Nom de la résidence" className="w-72 rounded-lg border border-slate-300 p-2 text-sm" /><button className="rounded-full bg-white px-4 text-sm font-semibold text-ink ring-1 ring-slate-300">Rechercher</button></form>
      {rows ? <><p className="text-sm text-muted">{rows.length} résidences visibles · {todo} à visiter</p><ChecksBoard rows={rows} /></> : <p className="rounded-lg bg-white p-6 text-muted ring-1 ring-slate-200">Chargement impossible (droits « Pages SEO » requis).</p>}
    </div>
  );
}
