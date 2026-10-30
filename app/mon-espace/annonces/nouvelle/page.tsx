import { getSiteVideoConfig } from "@/app/mon-espace/video-actions";
import { requireSpace } from "@/lib/member-space";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { canAccess } from "@/lib/accounts";
import { QuickPublish } from "@/components/quick-publish";
import { getSiteSettings } from "@/lib/settings";
import { getTaxonomies } from "@/lib/taxonomies";
import { publishFormHref } from "@/lib/publish-route";

/**
 * « Publier une annonce » : le formulaire simple en 5 étapes du lien de publication rapide
 * (champs de la publication rapide de l'application). Les détails avancés (équipements, champs
 * du back-office → Formulaires) restent modifiables ensuite depuis la fiche de l'annonce.
 */
export default async function NouvelleAnnonce({ searchParams }: { searchParams: { cat?: string; type?: string } }) {
  const account = getSession()!;
  // Compte « particulier » venu de la page Publier : il choisit d'abord un profil qui publie (propriétaire…).
  if (!canAccess(account.accountType, "nouvelle")) {
    redirect(`/inscription?${new URLSearchParams({ profil: "modifier", type: "proprietaire", next: publishFormHref(searchParams.cat, searchParams.type) }).toString()}`);
  }
  // Onglet « Publier une annonce » coupé ou réservé (back-office → Formulaires).
  await requireSpace(account.accountType, "nouvelle");
  const [{ submit }, tax, video] = await Promise.all([getSiteSettings(), getTaxonomies(), getSiteVideoConfig()]);
  const page = {
    slug: "", title: "", manager: "", accountTypes: [], minPhotos: 1, location: "optional" as const,
    video: true, aiFill: false, pageTitle: "Publier une annonce", pageIntro: submit.submitIntro ?? "",
    successText: "Votre annonce est enregistrée. Si l’équipe Moboo doit la vérifier, elle apparaîtra sur le site après validation.",
    types: tax.type.map((x) => ({ slug: x.slug, label: x.label })),
    labels: tax.label.map((x) => ({ slug: x.slug, label: x.label })),
    maxPhotos: submit.maxPhotos,
    videoUpload: { enabled: !!video?.uploadEnabled, maxMb: video?.maxMb ?? 100, maxSeconds: video?.maxSeconds ?? 120 },
  };
  return (
    <QuickPublish member page={page}
      account={{ firstName: account.firstName ?? null, accountType: account.accountType ?? "particulier", onboarded: !!account.onboarded }}
      start={{
        ...(searchParams.cat === "sale" || searchParams.cat === "rent" ? { transaction: searchParams.cat } : {}),
        ...(searchParams.type ? { propertyType: searchParams.type } : {}),
      }} />
  );
}
