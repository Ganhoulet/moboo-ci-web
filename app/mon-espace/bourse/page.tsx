import Link from "next/link";
import { getSession } from "@/lib/session";
import { requireSpace } from "@/lib/member-space";
import { getLeadMarket } from "./actions";
import { LeadMarket } from "@/components/lead-market";

export const dynamic = "force-dynamic";

/** Mon espace → Bourse des demandes : des clients qui cherchent, à débloquer en crédits. */
export default async function BoursePage({ searchParams }: { searchParams: { commune?: string; purpose?: string } }) {
  await requireSpace(getSession()?.accountType, "bourse");
  const r = await getLeadMarket({ commune: searchParams.commune, purpose: searchParams.purpose });
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Bourse des demandes</h1>
        <p className="max-w-3xl text-sm text-muted">Des locataires et des acheteurs qui cherchent maintenant. Débloquez le contact en Crédits Moboo et appelez-les avec vos biens. Chaque demande est vendue à 3 agents au plus. Faux numéro ? Signalez-le sous 3 jours pour être remboursé.</p>
      </div>
      {r.ok ? <LeadMarket data={r.data} commune={searchParams.commune ?? ""} purpose={searchParams.purpose ?? ""} /> : <p className="rounded-2xl bg-white p-6 text-sm text-red-700 shadow-card">{r.error}</p>}
      <p className="text-xs text-muted">Partagez le lien <b>moboo.ci/je-cherche</b> à vos contacts : plus il y a de demandes, plus vous avez de clients. · <Link href="/mon-espace/publicite" className="text-brand-800 underline">Recharger mes crédits</Link></p>
    </div>
  );
}
