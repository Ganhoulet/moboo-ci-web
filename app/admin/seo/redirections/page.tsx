import Link from "next/link";
import { list404, listRedirects } from "./actions";
import { NotFoundTable, RedirectTable, RedirectTools } from "@/components/backoffice/redirects-manager";

type SP = Record<string, string | undefined>;

/** Back-office → Pages SEO → Redirections et 404 (façon plugin WordPress « Redirection »). */
export default async function RedirectionsPage({ searchParams }: { searchParams: SP }) {
  const sp = searchParams;
  const tab = sp.tab === "404" ? "404" : "redirects";
  const view = sp.view === "bots" || sp.view === "ignored" ? sp.view : "open";
  const [redirects, nf] = await Promise.all([
    listRedirects(tab === "redirects" ? { type: sp.type, q: sp.q, page: sp.page } : { page: "1" }),
    list404(tab === "404" ? { view, q: sp.q, page: sp.page } : { view: "open" }),
  ]);
  const data = tab === "redirects" ? redirects : nf;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;
  const href = (patch: SP) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, page: undefined, ...patch })) if (v) p.set(k, v);
    return `/admin/seo/redirections?${p}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Redirections et pages introuvables</h1>
        <p className="text-sm text-muted">
          Les anciennes adresses de moboo.ci (WordPress) sont redirigées automatiquement : annonces, agents, catégories, pages de compte.
          Les adresses qui aboutissent encore à une page 404 apparaissent ici : créez la redirection en un clic pour ne pas perdre de visiteurs ni de référencement Google.
        </p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {[["redirects", "Redirections", (redirects?.counts.manual ?? 0) + (redirects?.counts.auto ?? 0)], ["404", "Pages introuvables (404)", nf?.counts.open ?? 0]].map(([k, l, n]) => (
          <Link key={k as string} href={k === "404" ? "/admin/seo/redirections?tab=404" : "/admin/seo/redirections"}
            className={"-mb-px border-b-2 px-3 py-2 text-sm font-semibold " + (tab === k ? "border-brand-700 text-brand-800" : "border-transparent text-slate-500 hover:text-ink")}>
            {l} <span className={"ml-1 rounded-full px-1.5 py-0.5 text-xs " + (k === "404" && Number(n) ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-700")}>{Number(n).toLocaleString("fr-FR")}</span>
          </Link>
        ))}
      </div>

      {tab === "redirects" ? (
        <>
          <RedirectTools />
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
            {[["", "Toutes"], ["manual", `Manuelles (${redirects?.counts.manual ?? 0})`], ["auto", `Automatiques (${redirects?.counts.auto ?? 0})`]].map(([k, l], i) => (
              <span key={k} className="inline-flex items-center">
                {i ? <span className="mx-1 text-slate-300">|</span> : null}
                <Link href={href({ type: k || undefined })} className={(sp.type ?? "") === k ? "font-bold text-ink" : "text-brand-800 hover:underline"}>{l}</Link>
              </span>
            ))}
            <span className="ml-2 text-xs text-muted">· {(redirects?.counts.hits ?? 0).toLocaleString("fr-FR")} visiteur(s) redirigé(s)</span>
            <form action="/admin/seo/redirections" className="ml-auto flex gap-2">
              {sp.type ? <input type="hidden" name="type" value={sp.type} /> : null}
              <input name="q" defaultValue={sp.q} placeholder="Rechercher une adresse" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" />
            </form>
          </div>
          {redirects ? <RedirectTable items={redirects.items} /> : <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Impossible de charger les redirections.</p>}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
            {[["open", `À traiter (${nf?.counts.open ?? 0})`], ["bots", `Robots et sondes (${nf?.counts.bots ?? 0})`], ["ignored", `Ignorées (${nf?.counts.ignored ?? 0})`]].map(([k, l], i) => (
              <span key={k} className="inline-flex items-center">
                {i ? <span className="mx-1 text-slate-300">|</span> : null}
                <Link href={href({ view: k === "open" ? undefined : k })} className={view === k ? "font-bold text-ink" : "text-brand-800 hover:underline"}>{l}</Link>
              </span>
            ))}
          </div>
          {nf ? <NotFoundTable items={nf.items} view={view} /> : <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Impossible de charger le journal.</p>}
        </>
      )}

      {data && pages > 1 ? (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{data.total.toLocaleString("fr-FR")} élément(s) · page {data.page} / {pages}</span>
          <div className="flex gap-2">
            {data.page > 1 ? <Link href={href({ page: String(data.page - 1) })} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50">← Précédente</Link> : null}
            {data.page < pages ? <Link href={href({ page: String(data.page + 1) })} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50">Suivante →</Link> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
