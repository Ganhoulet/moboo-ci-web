import Link from "next/link";
import { ListingEditor } from "@/components/listing-editor";
import { emptyDraft } from "@/lib/listing-draft";
import { getSiteSettings } from "@/lib/settings";
import { editorLists, getTaxonomies } from "@/lib/taxonomies";
import { saveAdminListingAction } from "../actions";

export default async function AdminNewListing() {
  const [settings, tax] = await Promise.all([getSiteSettings(), getTaxonomies()]);
  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <Link href="/admin/immobilier" className="text-sm font-semibold text-brand-800 hover:underline">← Annonces</Link>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">Nouvelle annonce</h1>
        <p className="text-sm text-muted">Publiée au nom de Moboo.ci. Après l’enregistrement, vous pourrez la rattacher à un compte, la mettre en vedette ou lui donner une date d’expiration.</p>
      </div>
      <ListingEditor
        initial={emptyDraft({ name: "Moboo.ci", phone: "" })}
        maxPhotos={settings.submit.maxPhotos}
        saveAction={saveAdminListingAction}
        createdHref="/admin/immobilier/{id}?creee=1"
        {...editorLists(tax)}
      />
    </div>
  );
}
