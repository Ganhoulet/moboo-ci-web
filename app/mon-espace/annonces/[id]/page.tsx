import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { canAccess } from "@/lib/accounts";
import { PageHeader, STATUS_LABEL } from "@/components/dashboard-ui";
import { ListingEditor, type ListingDraft } from "@/components/listing-editor";
import { getMyListing } from "../../actions";
import { getSiteSettings } from "@/lib/settings";
import { editorLists, getTaxonomies } from "@/lib/taxonomies";
import { draftFromListing } from "@/lib/listing-draft";


export default async function ModifierAnnonce({ params }: { params: { id: string } }) {
  const account = getSession()!;
  if (!canAccess(account.accountType, "annonces")) redirect("/mon-espace");
  const l = await getMyListing(params.id);
  if (!l) notFound();

  const draft: ListingDraft = draftFromListing(l);
  const st = STATUS_LABEL[l.status] ?? STATUS_LABEL.ACTIVE;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Modifier l'annonce"
        sub={`${l.views ?? 0} vues · publiée le ${new Date(l.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`}
        action={<span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>}
      />
      <ListingEditor {...editorLists(await getTaxonomies())} id={params.id} initial={draft} maxPhotos={(await getSiteSettings()).submit.maxPhotos} />
    </div>
  );
}
