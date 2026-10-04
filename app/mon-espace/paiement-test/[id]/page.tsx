import Link from "next/link";
import { notFound } from "next/navigation";
import { TestPayForm } from "@/components/test-pay-form";
import { fcfa } from "@/lib/community";
import { getMyInvoice } from "../../actions";

/** Mode test : page de paiement simulé (remplace Money Fusion pour les factures de test). */
export default async function PaiementTest({ params }: { params: { id: string } }) {
  const invoice = await getMyInvoice(params.id);
  if (!invoice || !invoice.test) notFound();
  const back = invoice.kind === "package" ? "/mon-espace/forfait" : "/mon-espace/annonces";

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
        <p className="font-bold">🧪 Mode test — aucun argent n’est débité</p>
        <p className="mt-0.5">Cette page remplace la page de paiement Money Fusion pendant les essais. Choisissez le résultat à simuler.</p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Facture {invoice.number}</p>
        <p className="mt-1 font-display text-lg font-bold text-ink">{invoice.label}</p>
        <p className="mt-2 font-display text-3xl font-extrabold tabular-nums text-ink">{fcfa(invoice.amount)}</p>
        {invoice.status === "paid" ? (
          <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">✅ Déjà payée (simulation). <Link href={`${back}?facture=${invoice.id}`} className="underline">Continuer</Link></p>
        ) : invoice.status === "cancelled" ? (
          <p className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">Facture annulée.</p>
        ) : (
          <TestPayForm id={invoice.id} phone={invoice.billingPhone} failed={invoice.status === "failed"} />
        )}
      </div>

      <Link href={back} className="inline-block text-sm font-semibold text-brand-800 hover:underline">← Retour sans payer</Link>
    </div>
  );
}
