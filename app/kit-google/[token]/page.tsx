import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CopyText } from "@/components/stays/copy-text";
import { getGbpKit } from "@/lib/stays";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kit fiche Google de votre résidence", robots: { index: false, follow: false } };

/** Kit Google Business d'une résidence : tout ce qu'il faut copier pour apparaître dans Google Maps. */
export default async function GbpKitPage({ params }: { params: { token: string } }) {
  const k = await getGbpKit(params.token);
  if (!k) notFound();
  return (
    <div className="container-page max-w-3xl py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted">Kit fiche Google</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">{k.name} dans Google Maps</h1>
      <p className="mt-2 text-muted">Quand un voyageur cherche « résidence meublée {k.address.quartier || k.address.commune || k.address.city} », Google affiche d’abord une carte avec les fiches des établissements. Avec ce kit, votre résidence y figure, avec un bouton de réservation vers Moboo.ci.</p>
      {!k.residence.visibleOnMoboo ? <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">Activez d’abord « Visible sur Moboo.ci » dans Moboo Resi (fiche de la résidence) : les liens ci-dessous mènent à votre page de réservation.</p> : null}
      <h2 className="mt-8 font-display text-xl font-bold text-ink">Les étapes</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-ink">{k.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      <h2 className="mt-8 font-display text-xl font-bold text-ink">À copier dans votre fiche</h2>
      <div className="mt-3 grid gap-3">
        <CopyText label="Nom de l’établissement" text={k.name} />
        <CopyText label="Catégorie principale" text={k.categories.primary} />
        <CopyText label="Catégories secondaires" text={k.categories.secondary.join(", ")} />
        <CopyText label="Description (750 caractères maximum)" text={k.description} multiline />
        <CopyText label="Site web" text={k.website} />
        <CopyText label="Lien de réservation" text={k.bookingLink} />
        {k.attributes.length ? <CopyText label="Équipements (attributs)" text={k.attributes.join(", ")} /> : null}
        <CopyText label="Message pour demander un avis Google à vos clients" text={k.reviewRequest} multiline />
        {k.posts.map((p, i) => <CopyText key={i} label={`Publication Google n° ${i + 1}`} text={p} multiline />)}
      </div>
      <h2 className="mt-8 font-display text-xl font-bold text-ink">Adresse</h2>
      <p className="mt-2 text-ink">{[k.address.quartier, k.address.commune, k.address.city, k.address.country].filter(Boolean).join(", ")}</p>
      {k.address.lat != null && k.address.lng != null ? <p className="text-sm text-muted">Position enregistrée dans Moboo Resi : {k.address.lat.toFixed(5)}, {k.address.lng.toFixed(5)}</p> : <p className="text-sm text-muted">Ajoutez la position GPS dans Moboo Resi pour placer le repère exactement.</p>}
      {k.photos.length ? (
        <>
          <h2 className="mt-8 font-display text-xl font-bold text-ink">Vos photos ({k.photos.length})</h2>
          <p className="mt-1 text-sm text-muted">Téléchargez-les puis ajoutez-en au moins 10 dans la fiche (façade, chambres, salle de bain, salon, cuisine).</p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">{k.photos.map((p) => <a key={p} href={p} target="_blank" rel="noopener" className="block aspect-square overflow-hidden rounded-lg bg-slate-100"><img src={p} alt="" loading="lazy" className="h-full w-full object-cover" /></a>)}</div>
        </>
      ) : null}
      {k.reviews.count ? <p className="mt-8 text-sm text-muted">Déjà {k.reviews.count} avis vérifié{k.reviews.count > 1 ? "s" : ""} sur Moboo.ci (★ {String(k.reviews.rating).replace(".", ",")}) : invitez ces clients à noter aussi votre fiche Google.</p> : null}
    </div>
  );
}
