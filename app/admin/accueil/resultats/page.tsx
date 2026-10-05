import { getSeoLinks } from "@/lib/seo";
import { COMMUNES } from "@/lib/accounts";
import { ResultLayoutsEditor } from "@/components/backoffice/result-layouts-editor";
import { getLayoutsAdmin } from "./actions";

export const dynamic = "force-dynamic";

/** Apparence → Affichage des résultats : modèles carte + annonces, et pages où ils s'appliquent. */
export default async function ResultLayoutsPage() {
  const [d, links] = await Promise.all([getLayoutsAdmin(), getSeoLinks()]);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Affichage des résultats indisponible (permission « Pages » requise).</p>;
  const seo = links.filter((l) => l.kind === "landing").map((l) => ({ slug: l.slug, title: l.title }));
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Affichage des résultats</h1>
        <p className="max-w-3xl text-sm text-muted">
          Choisissez comment les annonces s’affichent après une recherche : <strong>carte à gauche et annonces à droite</strong>, l’inverse, carte en haut, carte plein écran ou sans carte. Réglez la largeur de la carte et le style des repères, puis appliquez chaque modèle aux pages voulues (onglets de recherche, communes, pages SEO).
        </p>
      </div>
      <ResultLayoutsEditor initial={d} seoPages={seo} communes={COMMUNES} />
    </div>
  );
}
