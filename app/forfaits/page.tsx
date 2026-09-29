import type { Metadata } from "next";
import { withSeoOverride } from "@/lib/seo";
import { notFound } from "next/navigation";
import { PackageCards } from "@/components/package-cards";
import { fcfa, getPackages } from "@/lib/community";
import { getSession } from "@/lib/session";
import { getSiteSettings } from "@/lib/settings";

const BASE_METADATA: Metadata = { title: "Forfaits", description: "Publiez plus d’annonces et mettez vos biens en vedette sur Moboo.ci." };
export function generateMetadata() {
  return withSeoOverride("/forfaits", BASE_METADATA);
}

export default async function ForfaitsPage() {
  const [settings, packages] = await Promise.all([getSiteSettings(), getPackages()]);
  if (!settings.packages.enabled) notFound();
  const account = getSession();
  return (
    <div className="bg-slate-50">
      <div className="container-page py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">{settings.packages.pageTitle}</h1>
          <p className="mt-3 text-muted">{settings.packages.pageIntro}</p>
          {packages.requirePackage ? (
            <p className="mt-2 text-sm text-slate-600">Sans forfait : {packages.freeListings} annonce{packages.freeListings > 1 ? "s" : ""} en ligne gratuitement.</p>
          ) : null}
          {packages.submissionMode === "per_listing" && packages.listingPrice ? (
            <p className="mt-2 text-sm text-slate-600">Sans forfait : {fcfa(packages.listingPrice)} par annonce publiée.</p>
          ) : null}
          {packages.featuredPrice ? <p className="mt-1 text-sm text-slate-600">Mise en vedette à l’unité : {fcfa(packages.featuredPrice)} TTC.</p> : null}
        </div>
        <div className="mt-10">
          {packages.items.length ? <PackageCards items={packages.items} loggedIn={!!account} /> : (
            <p className="rounded-2xl bg-white p-8 text-center text-muted shadow-card">Aucun forfait n’est proposé pour le moment. La publication reste gratuite.</p>
          )}
          {packages.termsUrl ? <p className="mt-4 text-center text-xs text-muted">En payant, vous acceptez les <a href={packages.termsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-800 underline">conditions générales</a>.</p> : null}
        </div>
      </div>
    </div>
  );
}
