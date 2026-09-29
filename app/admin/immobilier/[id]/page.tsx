import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingEditor } from "@/components/listing-editor";
import { AdminListingExtras } from "@/components/admin-listing-extras";
import { getSiteSettings } from "@/lib/settings";
import { editorLists, getTaxonomies } from "@/lib/taxonomies";
import { draftFromListing } from "@/lib/listing-draft";
import { getAdminListing, saveAdminListingAction } from "../actions";

export default async function AdminEditListing({ params, searchParams }: { params: { id: string }; searchParams: { creee?: string } }) {
  const [l, settings, tax] = await Promise.all([getAdminListing(params.id), getSiteSettings(), getTaxonomies()]);
  if (!l) notFound();
  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <Link href="/admin/immobilier" className="text-sm font-semibold text-brand-800 hover:underline">← Annonces</Link>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">{l.title}</h1>
          <p className="text-sm text-muted">Créée le {new Date(l.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · {l.views ?? 0} vues</p>
        </div>
        <a href={`/annonce/${l.id}`} target="_blank" rel="noopener" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">Voir sur le site ↗</a>
      </div>
      {searchParams.creee ? <p className="rounded-md bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">Annonce créée. Réglez ci-dessous sa mise en avant et son annonceur.</p> : null}
      <AdminListingExtras
        id={l.id}
        labels={tax.label}
        initial={{
          status: l.status, featured: !!l.featured, labels: Array.isArray(l.labels) ? l.labels : [],
          expiresAt: l.expiresAt ?? null, ownerPhone: l.ownerPhone ?? null, ownerName: l.ownerName ?? null,
        }}
      />
      <ListingEditor id={l.id} initial={draftFromListing(l)} maxPhotos={settings.submit.maxPhotos} saveAction={saveAdminListingAction} {...editorLists(tax)} />
    </div>
  );
}
