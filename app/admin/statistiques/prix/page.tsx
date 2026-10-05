import Link from "next/link";
import { fcfa } from "@/lib/prices";
import { slugify } from "@/lib/slug";
import { getAdminPrices, refreshPricesAction } from "./actions";

export const dynamic = "force-dynamic";

/** Statistiques → Indice des prix : toutes les médianes, y compris celles pas encore publiées. */
export default async function AdminPrices({ searchParams }: { searchParams: { tx?: string; q?: string } }) {
  const d = await getAdminPrices();
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Indice indisponible.</p>;
  const tx = searchParams.tx === "sale" ? "sale" : "rent";
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const rows = d.rows.filter((r) => r.transaction === tx && (!q || `${r.city} ${r.commune ?? ""}`.toLowerCase().includes(q)));
  const published = d.rows.filter((r) => r.published && r.segment === "all" && r.commune).length;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Indice des prix</h1>
          <p className="max-w-3xl text-sm text-muted">Loyers et prix de vente médians par commune et type de bien, calculés sur les annonces réelles (prix aberrants écartés). Une médiane n’est publiée sur le site qu’à partir de <strong>{d.minSample} annonces</strong> ; en dessous elle reste visible ici seulement. {published} commune(s) publiée(s). Calcul du {new Date(d.updatedAt).toLocaleString("fr-FR")}.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <form action={refreshPricesAction}><button className="rounded-md bg-white px-3 py-2 font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Recalculer</button></form>
          <Link href="/admin/statistiques/prix/reglages" className="rounded-md bg-white px-3 py-2 font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Réglages</Link>
          <a href="/prix-immobilier" target="_blank" rel="noopener noreferrer" className="rounded-md bg-brand-700 px-3 py-2 font-semibold text-white hover:bg-brand-800">Pages publiques ↗</a>
        </div>
      </div>
      <form className="flex flex-wrap gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <select name="tx" defaultValue={tx} className="rounded-md border border-slate-300 px-2 py-2 text-sm"><option value="rent">Location (par mois)</option><option value="sale">Vente</option></select>
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Ville ou commune" className="min-w-[12rem] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Filtrer</button>
      </form>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-2">Zone</th><th className="px-3 py-2">Type de bien</th><th className="px-3 py-2 text-right">Médiane</th><th className="px-3 py-2 text-right">25 % – 75 %</th><th className="px-3 py-2 text-right">Annonces</th><th className="px-4 py-2">Site</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={"border-t border-slate-100 " + (r.segment === "all" ? "bg-slate-50/60 font-semibold" : "")}>
                <td className="px-4 py-2">{r.commune ? <Link href={`/prix-immobilier/${slugify(r.commune)}`} target="_blank" className="hover:underline">{r.commune}</Link> : <em>{r.city} (toute la ville)</em>}<span className="ml-1 text-xs font-normal text-muted">{r.commune ? r.city : ""}</span></td>
                <td className="px-3 py-2">{r.label}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fcfa(r.median)}</td>
                <td className="px-3 py-2 text-right text-xs tabular-nums text-muted">{fcfa(r.p25)} – {fcfa(r.p75)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.count}</td>
                <td className="px-4 py-2">{r.published ? <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-800">Publié</span> : <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">Trop peu d’annonces</span>}</td>
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan={6} className="p-6 text-center text-muted">Aucune donnée.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
