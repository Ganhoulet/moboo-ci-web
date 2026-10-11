import Link from "next/link";
import { ListingFormBuilder } from "@/components/backoffice/form-builder";
import { parseListingForm } from "@/lib/listing-form";
import { editorLists, getTaxonomies } from "@/lib/taxonomies";
import { getAdminSettings } from "../actions";

export const dynamic = "force-dynamic";

/** Formulaire de publication d'annonce : champs affichés, obligatoires, masqués, réservés ou créés. */
export default async function FormulairePublication() {
  const [settings, tax] = await Promise.all([getAdminSettings(), getTaxonomies()]);
  if (!settings) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Réglages indisponibles.</p>;
  const forms = (settings.values.forms ?? {}) as { listingForm?: string };
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Formulaire de publication</h1>
        <p className="max-w-3xl text-sm text-muted">
          Choisissez, champ par champ, ce que les annonceurs voient quand ils publient une annonce (Mon espace, page Publier et API des agences) :
          facultatif, obligatoire, masqué ou réservé à l’équipe Moboo. Limitez un champ à certains profils, à la location ou à la vente,
          ou à certains types de bien, renommez-le, ou créez de nouveaux champs. Un champ masqué ou réservé est refusé par l’API même si
          quelqu’un tente de l’envoyer. <Link href="/admin/formulaires/espace-membre" className="font-semibold text-brand-800 hover:underline">Onglets de l’espace membre →</Link>
        </p>
      </div>
      <ListingFormBuilder initial={parseListingForm(forms.listingForm)} propertyTypes={editorLists(tax).types} />
    </div>
  );
}
