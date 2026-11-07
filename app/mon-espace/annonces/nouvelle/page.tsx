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
import { QuickPublish } from "@/components/quick-publish";
import { getQuickMemberPage } from "@/app/mon-espace/quick-actions";

export default async function NouvelleAnnonce({ searchParams }: { searchParams: { cat?: string; type?: string; complet?: string } }) {
  const account = getSession()!;
  // Compte « particulier » venu de la page Publier : il choisit d'abord un profil qui publie (propriétaire…).
  if (!canAccess(account.accountType, "nouvelle")) {
    redirect(`/inscription?${new URLSearchParams({ profil: "modifier", type: "proprietaire", next: publishFormHref(searchParams.cat, searchParams.type) }).toString()}`);
  }
  // Onglet « Publier une annonce » coupé ou réservé (back-office → Formulaires).
  await requireSpace(account.accountType, "nouvelle");
  const name = account.companyName || displayName(account);
  const { submit, forms } = await getSiteSettings();
  // Par défaut : la publication rapide (mêmes 5 écrans que le lien WhatsApp et l'application) ;
  // « Formulaire complet » pour tous les détails.
  const quick = searchParams.complet === "1" ? null : await getQuickMemberPage();
  if (quick) {
    const full = new URLSearchParams({ complet: "1", ...(searchParams.cat ? { cat: searchParams.cat } : {}), ...(searchParams.type ? { type: searchParams.type } : {}) });
    return (
      <div className="max-w-3xl">
        <PageHeader title="Publier une annonce" sub={submit.submitIntro} />
        <QuickPublish mode="member" fullFormHref={`/mon-espace/annonces/nouvelle?${full.toString()}`}
          account={{ firstName: account.firstName ?? null, accountType: account.accountType ?? "particulier", onboarded: true }} page={quick} />
      </div>
    );
  }
  return (
    <div className="max-w-3xl">
      <PageHeader title="Publier une annonce" sub={submit.submitIntro} />
      {searchParams.complet === "1" ? <p className="-mt-2 mb-4 text-sm text-muted">Formulaire complet. <a href="/mon-espace/annonces/nouvelle" className="font-semibold text-brand-800 underline">Revenir à la publication rapide</a></p> : null}
      <ListingEditor {...editorLists(await getTaxonomies())} form={await siteListingForm(forms.listingForm)} video={await getSiteVideoConfig()} accountType={account.accountType} maxPhotos={submit.maxPhotos} initial={{
        ...emptyDraft({ name: name !== account.phone ? name : "", phone: account.whatsapp || account.phone }),
        ...(searchParams.cat === "sale" || searchParams.cat === "rent" ? { transaction: searchParams.cat } : {}),
        ...(searchParams.type ? { propertyType: searchParams.type } : {}),
      }} />
    </div>
  );
}
