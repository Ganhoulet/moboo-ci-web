import Link from "next/link";
import { notFound } from "next/navigation";
import { SeoPosterBuilder } from "@/components/backoffice/seo-poster-builder";
import { getSeoPoster } from "../../actions";

export const dynamic = "force-dynamic";

/** Affiche de rue d'une page SEO : builder (textes, couleurs, emplacement) + impression. */
export default async function SeoPosterPage({ params }: { params: { id: string } }) {
  const d = await getSeoPoster(params.id);
  if (!d) notFound();
  return (
    <div className="space-y-4">
      <Link href="/admin/affiches-qr/seo" className="qr-toolbar text-sm font-semibold text-brand-700 hover:underline">← QR pages SEO</Link>
      <div className="qr-toolbar">
        <h1 className="font-display text-2xl font-extrabold text-ink">{d.page.title}</h1>
        <p className="text-sm text-muted">
          Le QR code mène à <a href={d.page.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 hover:underline">{d.page.url}</a>
          {d.page.listings != null ? ` · ${d.page.listings} annonce${d.page.listings > 1 ? "s" : ""} en ligne aujourd’hui` : ""}. Textes pré-remplis par le <Link href="/admin/affiches-qr/modele" className="font-semibold text-brand-700 hover:underline">modèle par défaut</Link>, modifiables ici pour cette affiche.
        </p>
      </div>
      <SeoPosterBuilder pageId={d.page.id} defaults={d.defaults} placements={d.placements} />
    </div>
  );
}
