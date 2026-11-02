import Link from "next/link";
import { getLeadMarketAdmin } from "./actions";
import { LeadMarketAdmin } from "@/components/backoffice/lead-market-admin";

export const dynamic = "force-dynamic";

/** Bourse des demandes : demandes déposées, contacts vendus aux agents, signalements à rembourser. */
export default async function LeadMarketAdminPage() {
  const d = await getLeadMarketAdmin();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Bourse des demandes</h1>
          <p className="max-w-3xl text-sm text-muted">Les locataires et acheteurs déposent leur recherche sur <b>/je-cherche</b> ; les agents de la zone débloquent le contact en Crédits Moboo (3 agents au plus par demande).</p>
        </div>
        <Link href="/admin/publicite/bourse/reglages" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-slate-300">Réglages</Link>
      </div>
      {d ? <LeadMarketAdmin data={d} /> : <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Indisponible.</p>}
    </div>
  );
}
