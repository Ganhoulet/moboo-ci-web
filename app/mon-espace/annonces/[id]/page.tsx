import { requireSpace } from "@/lib/member-space";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PageHeader, STATUS_LABEL } from "@/components/dashboard-ui";
import { ListingEditor, type ListingDraft } from "@/components/listing-editor";
import { getMyListing } from "../../actions";
import { getSiteSettings } from "@/lib/settings";
import { editorLists, getTaxonomies } from "@/lib/taxonomies";
import { draftFromListing } from "@/lib/listing-draft";
import { parseListingForm } from "@/lib/listing-form";


export default async function ModifierAnnonce({ params }: { params: { id: string } }) {
  const account = getSession()!;
  await requireSpace(account.accountType, "annonces");
  const l = await getMyListing(params.id);
  if (!l) notFound();

  const settings = await getSiteSettings();
  const draft: ListingDraft = draftFromListing(l);
  const st = STATUS_LABEL[l.status] ?? STATUS_LABEL.ACTIVE;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Modifier l'annonce"
        sub={`${l.views ?? 0} vues · publiée le ${new Date(l.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`}
        action={<span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>}
      />
      <ListingEditor {...editorLists(await getTaxonomies())} id={params.id} initial={draft} maxPhotos={settings.submit.maxPhotos} form={parseListingForm(settings.forms.listingForm)} accountType={account.accountType} />
    </div>
  );
}
