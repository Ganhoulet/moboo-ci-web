import Link from "next/link";
import { getMyInspections } from "./actions";
import { InspectionRequests } from "@/components/inspection-requests";

export const dynamic = "force-dynamic";

/** Mon espace → Bien vérifié Moboo : faire contrôler ses biens (badge de confiance). */
export default async function BienVerifiePage() {
  const d = await getMyInspections();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Bien vérifié Moboo</h1>
        <p className="max-w-3xl text-sm text-muted">{d?.options.text || "Un agent Moboo visite le bien et lui attribue le badge « Vérifié Moboo »."}</p>
      </div>
      {!d ? <p className="rounded-2xl bg-white p-6 text-sm text-red-600 shadow-card">Indisponible.</p>
        : !d.options.enabled ? <p className="rounded-2xl bg-white p-6 text-sm text-muted shadow-card">Les demandes de vérification sont fermées pour le moment.</p>
        : <InspectionRequests data={d} />}
      <p className="text-xs text-muted">Les biens vérifiés inspirent confiance : plus de clics et d’appels, moins de questions. · <Link href="/mon-espace/publicite" className="text-brand-800 underline">Recharger mes crédits</Link></p>
    </div>
  );
}
