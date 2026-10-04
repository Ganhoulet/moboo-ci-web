import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { canAccess } from "@/lib/accounts";
import { PageHeader } from "@/components/dashboard-ui";
import { AdsHub } from "@/components/ads-hub";
import { getAdZones } from "@/lib/ads";
import { getAdsOverview } from "./actions";
import { getMyInvoice } from "../actions";

export const dynamic = "force-dynamic";

/** Espace annonceur (façon Zillow) : Crédits Moboo, boost par zone, vitrine, partenaire de zone, bannières. */
export default async function Publicite({ searchParams }: { searchParams: { facture?: string; tab?: string; annonce?: string } }) {
  const account = getSession()!;
  if (!canAccess(account.accountType, "publicite")) redirect("/mon-espace");
  const [data, zones, invoice] = await Promise.all([
    getAdsOverview(), getAdZones(), searchParams.facture ? getMyInvoice(searchParams.facture) : Promise.resolve(null),
  ]);
  if (!data) return <p className="rounded-2xl bg-white p-6 text-sm text-red-700 shadow-card">Espace annonceur indisponible pour le moment.</p>;
  if (!data.pricing.enabled) return <p className="rounded-2xl bg-white p-6 text-sm text-muted shadow-card">L’espace annonceur n’est pas encore ouvert.</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Publicité" sub="Faites voir vos biens et votre agence : boost par zone, vitrine, partenaire de zone et bannières." />
      {invoice ? (
        <div className={"rounded-2xl p-4 text-sm " + (invoice.status === "paid" ? "bg-emerald-50 text-emerald-800" : invoice.status === "pending" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700")}>
          {invoice.status === "paid" ? <>✅ Recharge confirmée : {invoice.label}. Vos crédits sont disponibles.</>
            : invoice.status === "pending" ? <>⏳ Paiement en attente de confirmation ({invoice.number}). Actualisez dans quelques instants.</>
            : <>Le paiement n’a pas abouti ({invoice.number}). Vous pouvez réessayer.</>}
          {" "}<Link href={`/mon-espace/factures/${invoice.id}`} className="font-bold underline">Voir la facture</Link>
        </div>
      ) : null}
      <AdsHub data={data} zones={zones} isPro={(data.pricing.partner.types ?? []).includes(account.accountType ?? "")} initialTab={searchParams.tab} initialListing={searchParams.annonce} />
    </div>
  );
}
