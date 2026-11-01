import Link from "next/link";
import { getAm, runJourneyTasksAction } from "../actions";
import { Journey, JourneyChip } from "@/components/backoffice/am-journey";

export const dynamic = "force-dynamic";

type Funnel = {
  scope: string; stage: string | null; stuckOnly: boolean; canSeeAll: boolean; total: number;
  stages: { key: string; label: string; count: number; stuck: number }[];
  items: { id: string; name: string; phone: string | null; whatsapp: string | null; city: string | null; journey: Journey; managerName: string | null }[];
};

/** Parcours de démarrage des hôtes Moboo Resi : où chacun bloque, du compte créé au forfait payé. */
export default async function AmJourney({ searchParams }: { searchParams: { scope?: string; stage?: string; stuck?: string } }) {
  const scope = searchParams.scope ?? "mine";
  const qs = new URLSearchParams({ scope, ...(searchParams.stage ? { stage: searchParams.stage } : {}), ...(searchParams.stuck ? { stuck: "1" } : {}) });
  const d = await getAm<Funnel>(`/journey?${qs}`);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Parcours indisponible.</p>;
  const link = (p: Record<string, string>) => `?${new URLSearchParams({ scope: d.scope, ...(d.stage ? { stage: d.stage } : {}), ...(d.stuckOnly ? { stuck: "1" } : {}), ...p })}`;
  const scopes: [string, string][] = [["mine", "Mon portefeuille"], ["unassigned", "Sans account manager"], ...(d.canSeeAll ? [["all", "Tous les hôtes"] as [string, string]] : [])];
  const max = Math.max(1, ...d.stages.map((s) => s.count));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Parcours de démarrage</h1>
          <p className="max-w-3xl text-sm text-muted">Où en est chaque hôte Moboo Resi : résidence créée, logements ajoutés, visible sur Moboo.ci, première réservation, forfait payant. Un hôte bloqué trop longtemps à une étape donne une tâche de relance à son account manager, chaque matin à 8 h.</p>
        </div>
        {d.canSeeAll ? <form action={runJourneyTasksAction}><button className="rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-white">Créer les relances maintenant</button></form> : null}
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {scopes.map(([k, l]) => <Link key={k} href={`?${new URLSearchParams({ scope: k })}`} className={"rounded-full px-3 py-1 font-semibold " + (d.scope === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>)}
        <span className="mx-1 text-slate-300">|</span>
        <Link href={link({ stuck: d.stuckOnly ? "" : "1" })} className={"rounded-full px-3 py-1 font-semibold " + (d.stuckOnly ? "bg-red-600 text-white" : "bg-white ring-1 ring-slate-300")}>Bloqués seulement</Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {d.stages.map((s) => (
          <Link key={s.key} href={link({ stage: d.stage === s.key ? "" : s.key })} className={"rounded-lg bg-white p-3 ring-1 hover:ring-brand-400 " + (d.stage === s.key ? "ring-2 ring-brand-700" : "ring-slate-200")}>
            <p className="text-xs font-semibold text-muted">{s.key === "done" ? "✓ " : "→ "}{s.label}</p>
            <p className="font-display text-2xl font-extrabold text-ink">{s.count}</p>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className={"h-1.5 rounded-full " + (s.key === "done" ? "bg-emerald-500" : "bg-brand-600")} style={{ width: `${Math.round((s.count / max) * 100)}%` }} /></div>
            {s.stuck ? <p className="mt-1 text-xs font-semibold text-red-700">{s.stuck} bloqué{s.stuck > 1 ? "s" : ""}</p> : <p className="mt-1 text-xs text-muted">aucun bloqué</p>}
          </Link>
        ))}
      </div>
      <p className="text-xs text-muted">{d.total} hôte{d.total > 1 ? "s" : ""} au total. Cliquez une étape pour voir ses hôtes{d.items.length >= 100 ? " (100 premiers, les plus bloqués d’abord)" : ""}.</p>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
            <tr><th className="p-3">Hôte</th><th className="p-3">Étape</th><th className="p-3">Pourquoi</th><th className="p-3">À faire</th><th className="p-3">Contact</th><th className="p-3">Account manager</th></tr>
          </thead>
          <tbody>
            {d.items.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 align-top">
                <td className="p-3"><Link href={`/admin/comptes/org/${a.id}`} className="font-semibold text-brand-800 hover:underline">{a.name}</Link>{a.city ? <><br /><span className="text-xs text-muted">{a.city}</span></> : null}</td>
                <td className="p-3"><JourneyChip j={a.journey} /></td>
                <td className="p-3 text-xs">{a.journey.reason ?? <span className="text-muted">—</span>}</td>
                <td className="p-3 text-xs">{a.journey.action ?? "—"}</td>
                <td className="p-3 text-xs">{a.phone ? <a href={`tel:${a.phone}`} className="text-brand-700">{a.phone}</a> : "—"}{a.whatsapp ? <> · <a href={`https://wa.me/${String(a.whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-emerald-700">WhatsApp</a></> : null}</td>
                <td className="p-3 text-xs">{a.managerName ?? <span className="text-muted">—</span>}</td>
              </tr>
            ))}
            {!d.items.length ? <tr><td colSpan={6} className="p-6 text-center text-muted">Aucun hôte ici.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
