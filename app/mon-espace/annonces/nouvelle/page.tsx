import { getSiteVideoConfig } from "@/app/mon-espace/video-actions";
import { requireSpace } from "@/lib/member-space";
import { siteListingForm } from "@/lib/api";
import { redirect } from "next/navigation";
import { getSession, displayName } from "@/lib/session";
import { canAccess } from "@/lib/accounts";
import { PageHeader } from "@/components/dashboard-ui";
import { ListingEditor } from "@/components/listing-editor";
import { emptyDraft } from "@/lib/listing-draft";
import { getSiteSettings } from "@/lib/settings";
import { editorLists, getTaxonomies } from "@/lib/taxonomies";
import { publishFormHref } from "@/lib/publish-route";

export default async function NouvelleAnnonce({ searchParams }: { searchParams: { cat?: string; type?: string; mode?: string } }) {
  const account = getSession()!;
  // Compte « particulier » venu de la page Publier : il choisit d'abord un profil qui publie (propriétaire…).
  if (!canAccess(account.accountType, "nouvelle")) {
    redirect(`/inscription?${new URLSearchParams({ profil: "modifier", type: "proprietaire", next: publishFormHref(searchParams.cat, searchParams.type) }).toString()}`);
  }
  // Onglet « Publier une annonce » coupé ou réservé (back-office → Formulaires).
  await requireSpace(account.accountType, "nouvelle");
  const name = account.companyName || displayName(account);
  const { submit, forms } = await getSiteSettings();
  // Deux façons de publier (mêmes champs que l'application Moboo.ci) : simple en 1 minute, ou complète.
  const mode = searchParams.mode === "simple" || searchParams.mode === "complet" ? searchParams.mode : null;
  const href = (m: string) => `/mon-espace/annonces/nouvelle?${new URLSearchParams({ mode: m, ...(searchParams.cat ? { cat: searchParams.cat } : {}), ...(searchParams.type ? { type: searchParams.type } : {}) }).toString()}`;
  if (!mode) {
    return (
      <div className="max-w-3xl">
        <PageHeader title="Publier une annonce" sub={submit.submitIntro} />
        <div className="grid gap-4 sm:grid-cols-2">
          <a href={href("simple")} className="group flex flex-col gap-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-600">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-600 text-white">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>
            </span>
            <span className="font-display text-lg font-extrabold text-ink">Publication simple</span>
            <span className="text-sm font-semibold text-accent-700">En 1 minute</span>
            <span className="text-sm text-muted">L’essentiel sur une seule page : type, photos et vidéo, prix et conditions (caution, avance, frais d’agence), pièces, commune et point de repère.</span>
            <span className="mt-auto pt-2 text-sm font-bold text-brand-800 group-hover:underline">Commencer →</span>
          </a>
          <a href={href("complet")} className="group flex flex-col gap-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-600">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-800 text-white">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>
            </span>
            <span className="font-display text-lg font-extrabold text-ink">Publication complète</span>
            <span className="text-sm font-semibold text-brand-700">Tous les détails</span>
            <span className="text-sm text-muted">En plusieurs étapes : équipements, compteurs, papiers (ACD, titre foncier…), disponibilité, plans, visite 360°… Une annonce plus complète attire plus de clients.</span>
            <span className="mt-auto pt-2 text-sm font-bold text-brand-800 group-hover:underline">Commencer →</span>
          </a>
        </div>
        <p className="mt-4 text-xs text-muted">Mêmes champs que dans l’application Moboo.ci. Vous pourrez compléter l’annonce plus tard dans Mes annonces.</p>
      </div>
    );
  }
  return (
    <div className="max-w-3xl">
      <PageHeader title="Publier une annonce" sub={submit.submitIntro} />
      <p className="-mt-2 mb-4 text-sm text-muted">{mode === "simple" ? "Publication simple, en 1 minute." : "Publication complète."}{" "}
        <a href={href(mode === "simple" ? "complet" : "simple")} className="font-semibold text-brand-800 underline">{mode === "simple" ? "Passer à la publication complète" : "Passer à la publication simple"}</a></p>
      <ListingEditor simple={mode === "simple"} {...editorLists(await getTaxonomies())} form={await siteListingForm(forms.listingForm)} video={await getSiteVideoConfig()} accountType={account.accountType} maxPhotos={submit.maxPhotos} initial={{
        ...emptyDraft({ name: name !== account.phone ? name : "", phone: account.whatsapp || account.phone }),
        ...(searchParams.cat === "sale" || searchParams.cat === "rent" ? { transaction: searchParams.cat } : {}),
        ...(searchParams.type ? { propertyType: searchParams.type } : {}),
      }} />
    </div>
  );
}
