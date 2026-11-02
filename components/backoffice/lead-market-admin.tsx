"use client";

import { useTransition } from "react";
import { leadStatusAction, refundPurchaseAction } from "@/app/admin/publicite/bourse/actions";

type Buyer = { id: string; name: string; price: number; createdAt: string; reportReason: string | null; reportedAt: string | null; refunded: boolean };
type Lead = { id: string; name: string; phone: string; purpose: string; propType: string; commune: string; quartier: string | null; budgetMax: number | null; urgent: boolean; price: number; maxBuyers: number; soldCount: number; status: string; createdAt: string; buyers: Buyer[] };
type Data = { stats: { open: number; leads30: number; sold30: number; revenue30: number; toReview: number }; leads: Lead[] };

const PURPOSE: Record<string, string> = { rent: "Location", buy: "Achat", furnished: "Meublé" };
const n = (v: number) => v.toLocaleString("fr-FR");

/** Suivi de la Bourse : chiffres du mois, demandes, acheteurs, signalements à rembourser. */
export function LeadMarketAdmin({ data }: { data: Data }) {
  const [pending, start] = useTransition();
  const tile = (l: string, v: string, warn = false) => <div className={"rounded-lg p-3 ring-1 " + (warn ? "bg-amber-50 ring-amber-200" : "bg-white ring-slate-200")}><p className="text-xs text-muted">{l}</p><p className="text-xl font-extrabold text-ink">{v}</p></div>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tile("Demandes ouvertes", n(data.stats.open))}{tile("Demandes (30 j)", n(data.stats.leads30))}{tile("Contacts vendus (30 j)", n(data.stats.sold30))}
        {tile("Chiffre (30 j)", `${n(data.stats.revenue30)} F`)}{tile("Signalements à traiter", n(data.stats.toReview), data.stats.toReview > 0)}
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-muted"><tr><th className="p-3">Demande</th><th className="p-3">Demandeur</th><th className="p-3">Vendue</th><th className="p-3">Agents</th><th className="p-3">État</th></tr></thead>
          <tbody>
            {data.leads.map((l) => (
              <tr key={l.id} className="border-t border-slate-100 align-top">
                <td className="p-3"><b className="text-ink">{PURPOSE[l.purpose]} · {l.propType} à {l.commune}</b>{l.urgent ? <span className="ml-1 rounded bg-red-100 px-1 text-[10px] font-bold text-red-800">URGENT</span> : null}<br /><span className="text-xs text-muted">{l.quartier ? `${l.quartier} · ` : ""}{l.budgetMax ? `≤ ${n(l.budgetMax)} F · ` : ""}{new Date(l.createdAt).toLocaleDateString("fr-FR")} · {n(l.price)} F le contact</span></td>
                <td className="p-3 text-xs">{l.name}<br /><a href={`tel:${l.phone}`} className="text-brand-800">{l.phone}</a></td>
                <td className="p-3 text-xs">{l.soldCount} / {l.maxBuyers}</td>
                <td className="p-3 text-xs">
                  {l.buyers.map((b) => (
                    <div key={b.id} className="mb-1">
                      {b.name || "Agent"} · {n(b.price)} F{b.refunded ? " · remboursé" : ""}
                      {b.reportedAt && !b.refunded ? <> · <span className="text-red-700">signalé : {b.reportReason}</span> <button type="button" disabled={pending} onClick={() => start(async () => { await refundPurchaseAction(b.id); })} className="ml-1 rounded bg-emerald-600 px-1.5 py-0.5 font-semibold text-white">Rembourser</button></> : null}
                    </div>
                  ))}
                  {!l.buyers.length ? <span className="text-muted">—</span> : null}
                </td>
                <td className="p-3">
                  <select defaultValue={l.status} disabled={pending} onChange={(e) => { const v = e.target.value; if (v !== "spam" || window.confirm("Marquer comme fausse demande ? Tous les agents sont remboursés.")) start(async () => { await leadStatusAction(l.id, v); }); }} className="rounded border border-slate-300 px-1 py-0.5 text-xs" aria-label="État">
                    <option value="open">Ouverte</option><option value="closed">Fermée</option><option value="spam">Fausse demande</option>{l.status === "expired" ? <option value="expired" disabled>Expirée</option> : null}
                  </select>
                </td>
              </tr>
            ))}
            {!data.leads.length ? <tr><td colSpan={5} className="p-6 text-center text-muted">Aucune demande pour le moment. Faites connaître la page /je-cherche (site, réseaux sociaux, affiches).</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
