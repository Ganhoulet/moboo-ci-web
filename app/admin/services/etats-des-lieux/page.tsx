import Link from "next/link";
import { getServices } from "../actions";
import { fcfa } from "@/lib/moboo-services";

export const dynamic = "force-dynamic";

const STATUS: [string, string][] = [["", "Toutes"], ["open", "Ouvertes"], ["selected", "Agent choisi"], ["completed", "Réalisées"], ["cancelled", "Annulées"]];
const LABEL: Record<string, string> = { open: "Ouverte", selected: "Agent choisi", completed: "Réalisée", cancelled: "Annulée" };

/** Services Moboo → Demandes d'état des lieux (séquestre, commission). */
export default async function EdlAdmin({ searchParams }: { searchParams: { statut?: string; page?: string } }) {
  const st = searchParams.statut ?? "";
  const page = Number(searchParams.page) || 1;
  const d = await getServices<any>(`/edl?status=${st}&page=${page}`);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">États des lieux indisponibles.</p>;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">États des lieux</h1>
        <p className="max-w-3xl text-sm text-muted">Quand le demandeur choisit un agent, un séquestre ({"%"} du prix, réglable) est gelé sur le wallet de l’agent. À la réalisation, Moboo prélève sa part et rend le reste ; à l’annulation, tout est rendu. Le prix lui-même est payé en direct par le client.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[["Réalisés", d.totals.completed], ["Commissions Moboo", fcfa(d.totals.commissions)], ["Séquestres gelés", fcfa(d.totals.held)], ["Wallets des agents", fcfa(d.totals.wallets)]].map(([l, v]) => (
          <div key={String(l)} className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200"><p className="text-xs uppercase text-muted">{l}</p><p className="font-display text-xl font-extrabold text-ink">{v}</p></div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {STATUS.map(([k, l]) => <Link key={k} href={k ? `?statut=${k}` : "?"} className={"rounded-full px-3 py-1 font-semibold " + (st === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>)}
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
            <tr><th className="p-3">N°</th><th className="p-3">Demandeur</th><th className="p-3">Bien</th><th className="p-3">Zone</th><th className="p-3">Statut</th><th className="p-3">Agent</th><th className="p-3">Prix</th><th className="p-3">Séquestre / commission</th></tr>
          </thead>
          <tbody>
            {d.items.map((r: any) => (
              <tr key={r.uuid} className="border-t border-slate-100 align-top">
                <td className="p-3 text-xs text-muted">#{r.id}<br />{r.created_at}</td>
                <td className="p-3"><strong>{r.full_name}</strong><br /><span className="text-xs">{r.phone}</span><br /><span className="text-xs text-muted">{r.role === "proprietaire" ? "Propriétaire" : "Locataire"} · {r.purpose === "sortie" ? "sortie" : "entrée"}</span></td>
                <td className="p-3">{r.prop_type || "—"}{r.pieces ? ` · ${r.pieces} p.` : ""}</td>
                <td className="p-3">{r.zone}<br /><span className="text-xs text-muted">{r.targets} agent(s) ciblé(s)</span></td>
                <td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">{LABEL[r.status] ?? r.status}</span></td>
                <td className="p-3">{r.agent || "—"}</td>
                <td className="p-3">{r.agreed_price ? fcfa(r.agreed_price) : "—"}</td>
                <td className="p-3 text-xs">{r.seq_held ? fcfa(r.seq_held) : "—"}{r.commission ? <><br />Moboo : {fcfa(r.commission)}</> : null}</td>
              </tr>
            ))}
            {!d.items.length ? <tr><td colSpan={8} className="p-6 text-center text-muted">Aucune demande.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">Recharger ou corriger le wallet d’un agent : Vue d’ensemble → Crédits d’un compte → « Wallet état des lieux ».</p>
    </div>
  );
}
