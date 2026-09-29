import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { canAccess } from "@/lib/accounts";
import { PageHeader, STATUS_LABEL } from "@/components/dashboard-ui";
import { ListingEditor, type ListingDraft } from "@/components/listing-editor";
import { getMyListing } from "../../actions";
import { getSiteSettings } from "@/lib/settings";

const s = (v: unknown) => (v == null ? "" : String(v));

export default async function ModifierAnnonce({ params }: { params: { id: string } }) {
  const account = getSession()!;
  if (!canAccess(account.accountType, "annonces")) redirect("/mon-espace");
  const l = await getMyListing(params.id);
  if (!l) notFound();

  const draft: ListingDraft = {
    transaction: l.transaction === "sale" ? "sale" : "rent",
    propertyType: l.propertyType || "autre",
    title: s(l.title), price: s(l.price), description: s(l.description),
    bedrooms: s(l.bedrooms), bathrooms: s(l.bathrooms), garage: s(l.garage), surface: s(l.surface), yearBuilt: s(l.yearBuilt),
    features: Array.isArray(l.features) ? l.features.map(String) : [],
    city: s(l.city) || "Abidjan", commune: s(l.commune), quartier: s(l.quartier), address: s(l.address),
    latitude: l.latitude ?? null, longitude: l.longitude ?? null,
    photos: Array.isArray(l.photos) ? l.photos.map(String) : [],
    videoUrl: s(l.videoUrl), contactName: s(l.contactName), contactPhone: s(l.contactPhone),
  };
  const st = STATUS_LABEL[l.status] ?? STATUS_LABEL.ACTIVE;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Modifier l'annonce"
        sub={`${l.views ?? 0} vues · publiée le ${new Date(l.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`}
        action={<span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>}
      />
      <ListingEditor id={params.id} initial={draft} maxPhotos={(await getSiteSettings()).submit.maxPhotos} />
    </div>
  );
}
