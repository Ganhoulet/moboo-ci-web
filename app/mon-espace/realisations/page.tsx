import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";
import { canAccess } from "@/lib/accounts";
import { PageHeader } from "@/components/dashboard-ui";
import { DealsManager } from "@/components/pro-page/deals-manager";

export const metadata: Metadata = { title: "Biens vendus et loués", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Mon espace → Biens vendus et loués : réalisations affichées sur la page pro (et dans l'application). */
export default async function Realisations() {
  const account = getSession()!;
  if (!canAccess(account.accountType, "realisations")) redirect("/mon-espace");
  const r = await authedFetch("/site/me/deals", { method: "GET" });
  return (
    <div className="max-w-5xl">
      <PageHeader title="Biens vendus et loués" sub="Montrez vos réussites : marquez vos annonces (même celles déjà retirées du site) comme vendues ou louées, ou ajoutez un bien conclu hors du site avec ses photos ou son affiche. Le total s’affiche sur votre page pro." />
      {r.ok ? <DealsManager initial={r.data} /> : <p className="rounded-xl bg-white p-6 text-sm text-red-600 shadow-card">Réalisations indisponibles.</p>}
    </div>
  );
}
