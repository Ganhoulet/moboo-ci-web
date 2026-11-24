import Link from "next/link";
import { EDITABLE_PAGES } from "@/lib/site-editable";
import { getAdminPage } from "../accueil/actions";
import { listFreePages } from "./actions";
import { FreePagesManager } from "@/components/backoffice/free-pages-manager";

export const dynamic = "force-dynamic";

/** Autres pages du site modifiables dans le constructeur. */
export default async function SitePagesList() {
  const [metas, free] = await Promise.all([Promise.all(EDITABLE_PAGES.map((p) => getAdminPage(p.slug).catch(() => null))), listFreePages().catch(() => [])]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Pages du site</h1>
        <p className="mt-1 text-sm text-muted">Ajoutez des blocs (bannière, texte, images, questions fréquentes…) au-dessus ou en dessous du contenu de chaque page, ou masquez son contenu d’origine. Rien n’est visible des visiteurs avant « Publier ».</p>
      </div>
      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold text-ink">Pages libres (comme dans WordPress)</h2>
        <p className="text-sm text-muted">Créez une nouvelle page (À propos, Partenaires, Recrutement…) : elle se compose avec les mêmes blocs que l’accueil et se modifie directement sur le site.</p>
        <FreePagesManager rows={free} />
      </section>
      <h2 className="pt-2 font-display text-lg font-bold text-ink">Pages existantes du site</h2>
      <ul className="divide-y divide-slate-100 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {EDITABLE_PAGES.map((p, i) => {
          const m = metas[i];
          return (
            <li key={p.slug} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{p.label}</p>
                <p className="text-xs text-muted">moboo.ci{p.path} · {m?.publishedAt ? `publiée le ${new Date(m.publishedAt).toLocaleDateString("fr-FR")}` : "présentation d’origine"}{m?.dirty ? " · modifications non publiées" : ""}</p>
              </div>
              <a href={p.path} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-700 hover:underline">Voir ↗</a>
              <Link href={`/admin/pages-site/${p.slug}`} className="rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800">Modifier</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
