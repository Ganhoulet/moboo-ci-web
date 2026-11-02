import Link from "next/link";
import { getServiceAdsAdmin } from "./actions";
import { ServiceAdsAdmin } from "@/components/backoffice/service-ads-admin";

export const dynamic = "force-dynamic";

/** Publicités de services façon Zillow : prestataires, campagnes entre les annonces, demandes. */
export default async function ServiceAdsAdminPage() {
  const d = await getServiceAdsAdmin();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Publicités de services</h1>
          <p className="max-w-3xl text-sm text-muted">Déménageurs, nettoyeurs, aménageurs… : cartes « Sponsorisé » entre les annonces, mini-page avec appel, WhatsApp et demande de devis. Payées en Crédits Moboo (jour, clic ou demande) ou offertes par l’équipe.</p>
        </div>
        <Link href="/admin/publicite/services/reglages" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-slate-300">Réglages</Link>
      </div>
      {d ? <ServiceAdsAdmin data={d} /> : <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Indisponible.</p>}
    </div>
  );
}
