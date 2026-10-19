import Link from "next/link";
import { ApplyMergesButton, MergeZoneButton, UnmergeZoneButton } from "@/components/backoffice/seo-quality-actions";
import { getSeoQuality, type QualityRow } from "../generateur/actions";

export const dynamic = "force-dynamic";

const TXL: Record<string, string> = { rent: "Location", sale: "Vente", furnished: "Meublés", event: "Espaces", hub: "Quartier" };
const LEVEL: Record<QualityRow["level"], [string, string]> = {
  bon: ["Bonne", "bg-emerald-50 text-emerald-800"],
  moyen: ["À enrichir", "bg-amber-50 text-amber-800"],
  faible: ["Faible", "bg-red-50 text-red-800"],
};
const TEXT: Record<string, string> = { rédigé: "Texte rédigé", guide: "Guide de quartier", chiffres: "Chiffres seulement" };

/**
 * Qualité des pages générées : Google sanctionne les pages créées en masse
 * pour chaque variante d'une recherche sans contenu propre. Ici : quelles
 * pages enrichir, lesquelles fusionner, lesquelles restent hors de Google.
 */
export default async function SeoQualityPage({ searchParams }: { searchParams: { niveau?: string } }) {
  const q = await getSeoQuality();
  if (!q) return <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">Tableau indisponible (API non à jour ou hors ligne).</p>;
  const level = ["bon", "moyen", "faible"].includes(searchParams.niveau ?? "") ? searchParams.niveau : "";
  const rows = level ? q.rows.filter((r) => r.level === level) : q.rows;
  const s = q.summary;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Qualité des pages SEO</h1>
          <p className="max-w-3xl text-sm text-muted">
            Google pénalise les sites qui créent une page pour chaque variante d’une même recherche sans rien apporter de neuf.
            Une bonne page a des annonces en ligne, un texte qui lui est propre (rédigé ou guide du quartier) et n’existe qu’une fois.
            En dessous de {q.minIndex} annonce(s), la page reste visible mais n’est pas proposée à Google.
          </p>
        </div>
        <Link href="/admin/reglages/seoGen" className="text-sm font-semibold text-brand-800 hover:underline">Seuil d’indexation →</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {[
          ["Pages générées", s.total, ""], ["Bonnes", s.bon, "bon"], ["À enrichir", s.moyen, "moyen"], ["Faibles", s.faible, "faible"],
          ["Hors Google (noindex)", s.noindex, null], ["En double", s.duplicates, null],
        ].map(([k, v, f]) => {
          const box = (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-ink">{Number(v).toLocaleString("fr-FR")}</p>
            </>
          );
          const cls = "block rounded-lg bg-white p-4 shadow-sm ring-1 " + (f !== null && f === level ? "ring-2 ring-brand-600" : "ring-slate-200");
          return f === null ? <div key={String(k)} className={cls}>{box}</div> : <Link key={String(k)} href={f ? `/admin/seo/qualite?niveau=${f}` : "/admin/seo/qualite"} className={cls}>{box}</Link>;
        })}
      </div>

      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-ink">Zones à fusionner</h2>
            <p className="text-xs text-muted">
              Les orthographes connues (« Angré. », « Cocody Angré », « Rivera », « Bassam »…) sont déjà regroupées automatiquement.
              Une fusion redirige (301) les anciennes adresses vers la page retenue.
            </p>
          </div>
          {q.merges.pending.length ? <ApplyMergesButton count={q.merges.pending.length} /> : null}
        </div>
        {q.merges.pending.length ? (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {q.merges.pending.length} page(s) portent encore une variante de zone (ex. /{q.merges.pending[0].page}) : elles seront fusionnées au prochain contrôle de nuit, ou tout de suite avec le bouton.
          </p>
        ) : null}
        <h3 className="mt-4 text-sm font-semibold text-ink">Ressemblances à vérifier</h3>
        <ul className="mt-2 divide-y divide-slate-100 text-sm">
          {q.merges.suggestions.map((m) => (
            <li key={m.from.slug} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                <b>{m.from.label}</b> <span className="text-muted">({m.from.n})</span> → <b>{m.to.label}</b> <span className="text-muted">({m.to.n})</span>
                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">{m.reason}</span>
              </span>
              <MergeZoneButton from={m.from.slug} to={m.to.label} />
            </li>
          ))}
          {!q.merges.suggestions.length ? <li className="py-2 text-muted">Aucune ressemblance détectée.</li> : null}
        </ul>
        {q.merges.aliases.length ? (
          <>
            <h3 className="mt-4 text-sm font-semibold text-ink">Fusions décidées ici</h3>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {q.merges.aliases.map((a) => (
                <li key={a.from} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span><span className="font-mono text-xs">{a.from}</span> → <b>{a.to}</b></span>
                  <UnmergeZoneButton from={a.from} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold text-ink">Pages {level ? `— ${LEVEL[level as QualityRow["level"]][0].toLowerCase()}` : ""}</h2>
          <p className="text-xs text-muted">Les plus faibles d’abord. « Chiffres seulement » : l’introduction automatique (prix médian, fourchette) existe, mais un guide de quartier rendrait la page unique.</p>
        </div>
        <div className="max-h-[40rem] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs text-muted">
              <tr><th className="px-3 py-2">Page</th><th className="px-3 py-2">Qualité</th><th className="px-3 py-2 text-right">Annonces</th><th className="px-3 py-2">Texte propre</th><th className="px-3 py-2">Doublon</th><th className="px-3 py-2">Google</th><th className="px-3 py-2">À faire</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.slice(0, 1000).map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2">
                    <Link href={`/admin/seo/${r.id}`} className="font-medium text-ink hover:text-brand-800 hover:underline">{r.title}</Link>
                    <p className="font-mono text-[11px] text-muted">/{r.slug} · {TXL[r.tx ?? ""] ?? r.tx}</p>
                  </td>
                  <td className="px-3 py-2"><span className={"rounded px-1.5 py-0.5 text-xs font-semibold " + LEVEL[r.level][1]}>{LEVEL[r.level][0]}</span></td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.listings}</td>
                  <td className="px-3 py-2">{r.text ? TEXT[r.text] : <span className="text-red-700">Aucun</span>}</td>
                  <td className="px-3 py-2">{r.duplicate ? <span className="text-red-700">{r.duplicate}</span> : "—"}</td>
                  <td className="px-3 py-2">{r.status !== "published" ? "Retirée" : r.noindex ? <span className="text-amber-700">noindex</span> : <span className="text-emerald-700">indexée</span>}</td>
                  <td className="px-3 py-2 text-xs">
                    {r.todo === "Publier le guide du quartier" || r.todo === "Ajouter un texte ou un guide de quartier"
                      ? <Link href={`/admin/seo/quartiers/${r.zone}`} className="font-semibold text-brand-800 hover:underline">{r.todo}</Link>
                      : r.todo}
                  </td>
                </tr>
              ))}
              {!rows.length ? <tr><td colSpan={7} className="px-3 py-4 text-center text-muted">Aucune page.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
