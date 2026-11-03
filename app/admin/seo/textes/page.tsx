import Link from "next/link";
import { BottomBulkActions } from "@/components/seo/bottom-bulk-actions";
import { listBottomTextsAction } from "../actions";

export const dynamic = "force-dynamic";

const pct = (n: number) => `${Math.round(n * 100)} %`;

/**
 * Textes du bas des pages « catégorie × lieu » : lesquels existent, publiés ou
 * en brouillon, uniques ou trop proches d'une autre page ; rédaction en lot.
 */
export default async function BottomTextsPage({ searchParams }: { searchParams: { etat?: string } }) {
  const d = await listBottomTextsAction();
  if (!d) return <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">Liste indisponible (API non à jour ou hors ligne).</p>;
  const rows = d.items.filter((r) => !r.noindex);
  const n = {
    all: rows.length,
    published: rows.filter((r) => r.text?.status === "published").length,
    draft: rows.filter((r) => r.text?.status === "draft").length,
    missing: rows.filter((r) => !r.text).length,
  };
  const etat = searchParams.etat ?? "";
  const shown = rows.filter((r) => (etat === "publie" ? r.text?.status === "published" : etat === "brouillon" ? r.text?.status === "draft" : etat === "manquant" ? !r.text : true));
  const drafts = rows.filter((r) => r.text?.status === "draft").map((r) => r.slug);
  const tabs: [string, string, number][] = [["", "Toutes", n.all], ["publie", "Publiés", n.published], ["brouillon", "Brouillons", n.draft], ["manquant", "Sans texte", n.missing]];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Textes du bas de page</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">Sous les annonces de chaque page « catégorie × lieu » : liens vers les recherches voisines, puis un texte d’environ 300 mots (le lieu, les biens, les prix). Les chiffres se mettent à jour seuls. Un texte enregistré n’est jamais écrasé par une rédaction en lot.</p>
      </div>

      <BottomBulkActions missing={n.missing} drafts={drafts} job={d.job} />

      <nav className="flex flex-wrap gap-2 text-sm font-semibold">
        {tabs.map(([k, l, c]) => (
          <Link key={k} href={k ? `/admin/seo/textes?etat=${k}` : "/admin/seo/textes"} className={"rounded-full px-3 py-1.5 " + (etat === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-200")}>{l} ({c})</Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-3 py-2">Page</th><th className="px-3 py-2">Texte</th><th className="px-3 py-2 text-right">Mots</th><th className="px-3 py-2">Unicité</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2"><span className="font-semibold text-ink">{r.title}</span><span className="block text-xs text-muted">/{r.slug}{r.source === "generator" ? " · générée" : ""}</span></td>
                <td className="px-3 py-2">
                  {r.text ? (
                    <span className={"rounded-full px-2 py-0.5 text-xs font-bold " + (r.text.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700")}>
                      {r.text.status === "published" ? "Publié" : "Brouillon"}
                    </span>
                  ) : <span className="text-xs text-muted">—</span>}
                  {r.text?.warnings ? <span className="ml-2 text-xs text-amber-700">{r.text.warnings} point{r.text.warnings > 1 ? "s" : ""} à revoir</span> : null}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{r.text?.words ?? ""}</td>
                <td className="px-3 py-2 text-xs">{r.text?.similar ? <span className={r.text.similar.score > 0.2 ? "font-semibold text-red-700" : "text-emerald-700"}>{pct(r.text.similar.score)} en commun avec /{r.text.similar.slug}</span> : r.text ? <span className="text-emerald-700">unique</span> : null}</td>
                <td className="px-3 py-2 text-right"><Link href={`/admin/seo/${r.id}#texte-du-bas`} className="font-semibold text-brand-800 hover:underline">{r.text ? "Relire" : "Rédiger"}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
