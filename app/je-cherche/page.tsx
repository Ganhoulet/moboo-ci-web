import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getSiteSettings } from "@/lib/settings";
import { getMyLeadRequests } from "./actions";
import { LeadRequestForm } from "@/components/lead-request-form";

export const metadata: Metadata = {
  title: "Je cherche un logement — les agents vous rappellent",
  description: "Décrivez le logement que vous cherchez à Abidjan ou en Côte d’Ivoire : les agents immobiliers de la zone vous rappellent avec des biens qui correspondent.",
  alternates: { canonical: "/je-cherche" },
};
export const dynamic = "force-dynamic";

/** Bourse des demandes côté demandeur : « Je cherche » (location, achat, meublé). */
export default async function JeCherche() {
  const s = getSession();
  const cfg = ((await getSiteSettings()) as any).leadMarket ?? {};
  const mine = await getMyLeadRequests();
  return (
    <div className="container-page max-w-2xl py-8 sm:py-12">
      <h1 className="font-display text-3xl font-extrabold text-ink">Vous ne trouvez pas ? Dites-nous ce que vous cherchez</h1>
      <p className="mt-2 text-muted">Les agents immobiliers de votre commune reçoivent votre demande et vous rappellent avec des biens qui correspondent, souvent avant qu’ils soient publiés.</p>
      <div className="mt-6">
        {cfg.enabled === false ? <p className="rounded-2xl bg-white p-6 text-sm text-muted shadow-card">Le dépôt de demandes est fermé pour le moment.</p>
          : cfg.requireLogin !== false && !s ? (
            <div className="rounded-2xl bg-white p-6 text-center shadow-card">
              <p className="font-semibold text-ink">Connectez-vous avec votre numéro pour envoyer votre demande.</p>
              <p className="mt-1 text-sm text-muted">Votre numéro est confirmé par un code : les agents savent que votre demande est sérieuse.</p>
              <Link href="/compte?next=%2Fje-cherche" className="mt-4 inline-block rounded-xl bg-brand-800 px-5 py-3 font-bold text-white">Se connecter et continuer</Link>
            </div>
          ) : <LeadRequestForm defaults={{ name: [s?.firstName, s?.lastName].filter(Boolean).join(" "), phone: s?.phone ?? "" }} mine={mine} />}
      </div>
    </div>
  );
}
