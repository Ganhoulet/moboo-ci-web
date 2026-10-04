import { PromotionForm, PromotionRowActions } from "@/components/backoffice/marketing-center";
import { listPromotions } from "../actions";

export const dynamic = "force-dynamic";
const TYPE: Record<string, string> = { residence: "Résidence", espace: "Espace", listing: "Annonce" };

/** Back-office → Centre marketing → Promotions. */
export default async function Promotions() {
  const items = await listPromotions();
  const now = Date.now();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Promotions</h1>
        <p className="max-w-3xl text-sm text-muted">Offres réelles affichées sur la fiche (avec compte à rebours) et sur les cartes des résultats : « −15 % · Offre de lancement (dès 3 nuits) · se termine dans 2 jours ».</p>
      </div>
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <PromotionForm />
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          {items.length ? (
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-2">Offre</th><th className="px-2 py-2">Bien</th><th className="px-2 py-2">Fin</th><th className="px-2 py-2 text-right">Vues</th><th className="px-4 py-2" /></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((p) => {
                  const live = p.active && new Date(p.endsAt).getTime() > now;
                  return (
                    <tr key={p.id} className={live ? "" : "text-muted"}>
                      <td className="px-4 py-2.5"><p className="font-medium">{p.discountPct ? `−${p.discountPct} % · ` : ""}{p.title}</p>{p.conditions ? <p className="text-xs text-muted">{p.conditions}</p> : null}</td>
                      <td className="px-2 py-2.5"><span className="text-xs text-muted">{TYPE[p.targetType] ?? p.targetType} · </span>{p.targetLabel}</td>
                      <td className="whitespace-nowrap px-2 py-2.5">{new Date(p.endsAt).toLocaleDateString("fr-FR")}{live ? <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">En cours</span> : p.active ? " (terminée)" : " (suspendue)"}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{p.views}</td>
                      <td className="px-4 py-2.5 text-right"><PromotionRowActions id={p.id} active={p.active} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <p className="p-6 text-sm text-muted">Aucune promotion.</p>}
        </div>
      </div>
    </div>
  );
}
