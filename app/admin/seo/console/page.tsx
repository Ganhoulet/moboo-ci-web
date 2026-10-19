import Link from "next/link";
import { DailyBars } from "@/components/app-charts";
import { SubmitSitemapButton } from "@/components/backoffice/submit-sitemap-button";
import { getGscOverview } from "./actions";

export const dynamic = "force-dynamic";

const n = (v: number) => Math.round(v).toLocaleString("fr-FR");
const pct = (v: number) => `${(v * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const d = (s: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR") : "—");

/** Google Search Console : ce que Google montre de moboo.ci, et ce qui en sort. */
export default async function SearchConsolePage({ searchParams }: { searchParams: { days?: string } }) {
  const days = ["7", "28", "90"].includes(searchParams.days ?? "") ? searchParams.days! : "28";
  const o = await getGscOverview(days);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Google Search Console</h1>
          <p className="text-sm text-muted">Clics, impressions et positions de moboo.ci dans Google{o.site ? ` (${o.site})` : ""}. Données Google avec environ 2 jours de retard.</p>
        </div>
        <div className="flex gap-1">
          {["7", "28", "90"].map((x) => (
            <Link key={x} href={`/admin/seo/console?days=${x}`} className={"rounded-full px-3 py-1.5 text-sm font-semibold " + (x === days ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-slate-300")}>{x} jours</Link>
          ))}
        </div>
      </div>

      {!o.configured ? (
        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-semibold text-ink">Connexion à faire une fois (10 minutes)</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink">
            <li>Sur <b>console.cloud.google.com</b>, créez un projet (ou prenez l’existant), activez <b>« Google Search Console API »</b>.</li>
            <li>IAM › <b>Comptes de service</b> › Créer ; puis Clés › Ajouter une clé › <b>JSON</b> : un fichier se télécharge.</li>
            <li>Sur <b>search.google.com/search-console</b>, propriété moboo.ci › Paramètres › <b>Utilisateurs et autorisations</b> › ajoutez l’adresse e-mail du compte de service (droit « Complet »).</li>
            <li>Collez le contenu du fichier JSON dans <Link href="/admin/reglages/searchConsole" className="font-semibold text-brand-800 hover:underline">Réglages › Google Search Console</Link>.</li>
          </ol>
        </section>
      ) : o.error ? (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{o.error} — <Link href="/admin/reglages/searchConsole" className="font-semibold underline">Réglages</Link></p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[["Clics", n(o.totals!.clicks)], ["Impressions", n(o.totals!.impressions)], ["Taux de clic", pct(o.totals!.ctr)], ["Position moyenne", o.totals!.position.toLocaleString("fr-FR")]].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-ink">{v}</p>
              </div>
            ))}
          </div>
          <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-semibold text-ink">Clics par jour</h2>
            <p className="mb-3 text-xs text-muted">Du {d(o.from!)} au {d(o.to!)}</p>
            <DailyBars data={(o.byDate ?? []).map((x) => ({ day: x.day, value: x.clicks }))} label="Clics Google" unit="clic(s)" />
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <Table title="Requêtes Google" sub="Ce que les gens tapent avant d’arriver sur moboo.ci"
              head={["Requête", "Clics", "Impr.", "Pos."]}
              rows={(o.queries ?? []).slice(0, 100).map((q) => [q.query, n(q.clicks), n(q.impressions), q.position.toLocaleString("fr-FR")])} />
            <Table title="À pousser" sub="Vues sur Google mais pas encore en tête (positions 4 à 30) : guide de quartier, liens internes et backlinks vers la page correspondante."
              head={["Requête", "Impr.", "Clics", "Pos."]}
              rows={(o.opportunities ?? []).map((q) => [q.query, n(q.impressions), n(q.clicks), q.position.toLocaleString("fr-FR")])} />
          </div>
          <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-ink">Dans l’IA générative de Google (aperçus IA, mode IA)</h2>
                <p className="max-w-3xl text-xs text-muted">
                  Google compte les clics et impressions venus des aperçus IA dans les totaux ci-dessus. Le détail (« Performances dans l’IA générative »)
                  n’est disponible que dans Search Console : l’accès automatique ne le fournit pas encore. Ci-dessous, les apparitions spéciales que Google transmet.
                </p>
              </div>
              {o.aiReportUrl ? <a href={o.aiReportUrl} target="_blank" rel="noopener" className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">Ouvrir le rapport dans Search Console ↗</a> : null}
            </div>
            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              {(o.appearances ?? []).map((a) => (
                <li key={a.key} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="text-ink">{a.label}{a.ai ? <span className="ml-2 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-800">IA</span> : null}</span>
                  <span className="tabular-nums text-muted">{n(a.clicks)} clic(s) · {n(a.impressions)} impr. · pos. {a.position.toLocaleString("fr-FR")}</span>
                </li>
              ))}
              {!o.appearances?.length ? <li className="py-2 text-muted">Aucune apparition spéciale sur la période (ou API pas encore à jour).</li> : null}
            </ul>
          </section>
          <Table title="Pages" sub="« Générée » : page créée par le générateur SEO"
            head={["Page", "Clics", "Impr.", "CTR", "Pos."]}
            rows={(o.pages ?? []).slice(0, 150).map((p) => [
              <span key={p.url}><a href={p.url} target="_blank" rel="noopener" className="text-brand-800 hover:underline">{p.path}</a>{p.generated ? <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">Générée</span> : null}</span>,
              n(p.clicks), n(p.impressions), pct(p.ctr), p.position.toLocaleString("fr-FR")])} />
          <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><h2 className="font-semibold text-ink">Plans du site</h2><p className="text-xs text-muted">Google lit le plan du site pour découvrir les pages générées et les annonces.</p></div>
              <SubmitSitemapButton />
            </div>
            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              {(o.sitemaps ?? []).map((s) => (
                <li key={s.path} className="flex flex-wrap gap-x-4 py-2">
                  <span className="font-mono text-xs text-ink">{s.path}</span>
                  <span className="text-muted">envoyé le {d(s.lastSubmitted)} · lu le {d(s.lastDownloaded)} · {n(s.submitted)} adresses</span>
                  {s.errors ? <span className="text-red-700">{s.errors} erreur(s)</span> : null}
                  {s.isPending ? <span className="text-amber-700">en attente</span> : null}
                </li>
              ))}
              {!o.sitemaps?.length ? <li className="py-2 text-muted">Aucun plan du site déclaré : cliquez sur « Envoyer le plan du site ».</li> : null}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function Table({ title, sub, head, rows }: { title: string; sub: string; head: string[]; rows: React.ReactNode[][] }) {
  return (
    <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-100 px-4 py-3"><h2 className="font-semibold text-ink">{title}</h2><p className="text-xs text-muted">{sub}</p></div>
      <div className="max-h-[28rem] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 text-left text-xs text-muted"><tr>{head.map((h, i) => <th key={h} className={"px-3 py-2 " + (i ? "text-right" : "")}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length ? rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={"px-3 py-2 " + (j ? "text-right tabular-nums" : "text-ink")}>{c}</td>)}</tr>)
              : <tr><td colSpan={head.length} className="px-3 py-4 text-center text-muted">Pas encore de données.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
