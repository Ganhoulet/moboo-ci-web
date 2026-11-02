import Link from "next/link";
import { getMyServiceAds } from "./actions";
import { ServiceAdsManager } from "@/components/service-ads-manager";

export const dynamic = "force-dynamic";

/** Mon espace → Publicités de services : fiche prestataire, campagnes entre les annonces, demandes reçues. */
export default async function ServiceAdsPage() {
  const d = await getMyServiceAds();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Publicités de services</h1>
        <p className="max-w-3xl text-sm text-muted">Déménagement, nettoyage, aménagement, peinture… Votre carte « Sponsorisé » s’affiche entre les annonces des personnes qui cherchent un logement, dans vos zones. Un clic ouvre votre page : appel, WhatsApp ou demande de devis.</p>
      </div>
      {!d ? <p className="rounded-2xl bg-white p-6 text-sm text-red-600 shadow-card">Indisponible pour le moment.</p>
        : !d.options.enabled ? <p className="rounded-2xl bg-white p-6 text-sm text-muted shadow-card">Les publicités de services ne sont pas encore ouvertes.</p>
        : <ServiceAdsManager data={d} />}
      <p className="text-xs text-muted">Solde de crédits : <strong>{(d?.balance ?? 0).toLocaleString("fr-FR")} FCFA</strong> · <Link href="/mon-espace/publicite" className="text-brand-800 underline">Recharger mes crédits</Link></p>
    </div>
  );
}
