import Link from "next/link";
import { QrSelectAll, SeoBatchBar } from "@/components/backoffice/qr-batch-bar";
import { listSeoPages, type SeoQrPage } from "../actions";

export const dynamic = "force-dynamic";

/** Marketing terrain → QR pages SEO : une affiche de rue par page (« Maisons à louer à Yopougon »…). */
export default async function SeoQrPages({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const pages = await listSeoPages(q);
  const groups = new Map<string, SeoQrPage[]>();
  for (const p of pages) { const k = p.group || "Autres pages"; groups.set(k, [...(groups.get(k) ?? []), p]); }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">QR pages SEO</h1>
          <p className="max-w-3xl text-sm text-muted">
            Une affiche de rue pour chaque page de catégorie (« Maisons à louer à Yopougon », « Maisons en vente à Bingerville »…) : texte en haut, QR code, contact Moboo en bas.
            Le passant scanne et tombe sur les annonces de la zone. Chaque affiche posée a son code : ses scans sont comptés par emplacement.
          </p>
        </div>
        <Link href="/admin/affiches-qr/modele" className="rounded-md bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Modèle par défaut</Link>
      </div>
      <form className="flex flex-wrap gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200" action="/admin/affiches-qr/seo">
        <input name="q" defaultValue={q} placeholder="Commune, quartier, type de bien… (ex. Yopougon, villa, à vendre)" className="min-w-[16rem] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Rechercher</button>
      </form>
      {pages.length ? (
        <>
          <div className="flex items-center gap-3 text-sm text-muted">{pages.length} page{pages.length > 1 ? "s" : ""} publiée{pages.length > 1 ? "s" : ""} <QrSelectAll name="seo" /></div>
          {[...groups].map(([g, list]) => (
            <section key={g}>
              <h2 className="mb-2 font-display text-lg font-bold text-ink">{g}</h2>
              <ul className="grid gap-2 md:grid-cols-2">
                {list.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200 has-[:checked]:ring-2 has-[:checked]:ring-brand-600">
                    <input type="checkbox" name="seo" value={p.id} form="qr-batch" aria-label={`Sélectionner ${p.title}`} className="h-5 w-5" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{p.title}</p>
                      <p className="truncate text-xs text-muted">{p.column ? `${p.column} · ` : ""}{p.url} · <strong className="text-ink">{p.scans30}</strong> scan{p.scans30 > 1 ? "s" : ""} (30 j)</p>
                    </div>
                    <Link href={`/admin/affiches-qr/seo/${p.id}`} className="shrink-0 rounded-md bg-[#0555CC] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">Créer l’affiche</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <form id="qr-batch" action="/admin/affiches-qr/imprimer" method="get"><input type="hidden" name="lot" value="seo" /></form>
          <SeoBatchBar />
        </>
      ) : <p className="rounded-lg bg-white p-6 text-sm text-muted ring-1 ring-slate-200">Aucune page SEO publiée{q ? ` pour « ${q} »` : ""}. Créez-les dans Pages SEO.</p>}
    </div>
  );
}
