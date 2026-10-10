import Link from "next/link";
import { AdminListingsTable } from "@/components/admin-listings-table";
import { getTaxonomies } from "@/lib/taxonomies";
import { listAdminListings } from "./actions";
import { LinkLegacyButton } from "@/components/backoffice/link-legacy-button";

type SP = Record<string, string | undefined>;
const TABS = [
  { key: "", label: "Toutes" }, { key: "ACTIVE", label: "En ligne" }, { key: "DISABLED", label: "Masquées" },
  { key: "SOLD", label: "Vendues" }, { key: "RENTED", label: "Louées" },
];

/** Back-office → Immobilier → Annonces (façon Houzez « Properties »). */
export default async function AdminListings({ searchParams }: { searchParams: SP }) {
  const sp = searchParams;
  const [data, tax] = await Promise.all([listAdminListings(sp), getTaxonomies()]);
  const href = (patch: SP) => {
    const merged: SP = { ...sp, page: undefined, ...patch };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/immobilier${s ? `?${s}` : ""}`;
  };
  const sortLink = (key: "title" | "price" | "date") => {
    const active = (sp.sort ?? "date") === key;
    const dir = active && sp.dir !== "asc" ? "asc" : "desc";
    return { href: href({ sort: key === "date" ? undefined : key, dir: key === "title" && !active ? "asc" : dir }), arrow: active ? (sp.dir === "asc" ? "▲" : "▼") : "⇅" };
  };
  const labels = Object.fromEntries(tax.label.map((l) => [l.slug, { label: l.label, color: l.color }]));
  const counts = data?.counts ?? {};
  const all = Object.values(counts).reduce((a, b) => a + b, 0);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;
  const field = "h-10 rounded-md border border-slate-300 bg-white px-3 text-sm";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Annonces</h1>
          <p className="text-sm text-muted">Toutes les annonces du site : publier, masquer, mettre en vedette, marquer vendue ou louée, dupliquer.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LinkLegacyButton />
          <Link href="/admin/immobilier/nouvelle" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">+ Nouvelle annonce</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-1 gap-y-2 text-sm">
        {TABS.map((t, i) => {
          const on = (sp.status ?? "") === t.key;
          const n = t.key ? counts[t.key] ?? 0 : all;
          return (
            <span key={t.key} className="inline-flex items-center">
              {i ? <span className="mx-1 text-slate-300">|</span> : null}
              <Link href={href({ status: t.key || undefined })} className={on ? "font-bold text-ink" : "text-brand-800 hover:underline"}>{t.label}</Link>
              <span className="ml-1 text-slate-500">({n})</span>
            </span>
          );
        })}
      </div>

      <form className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200" action="/admin/immobilier">
        {sp.status ? <input type="hidden" name="status" value={sp.status} /> : null}
        <input name="q" defaultValue={sp.q} placeholder="Titre, ville, annonceur, téléphone, réf." className={field + " min-w-[14rem] flex-1"} />
        <select name="transaction" defaultValue={sp.transaction ?? ""} className={field}>
          <option value="">Vente et location</option><option value="sale">En vente</option><option value="rent">À louer</option>
        </select>
        <select name="type" defaultValue={sp.type ?? ""} className={field}>
          <option value="">Tous les types</option>
          {tax.type.map((t) => <option key={t.slug} value={t.slug}>{t.label}</option>)}
        </select>
        <select name="source" defaultValue={sp.source ?? ""} className={field}>
          <option value="">Toutes origines</option><option value="site">Publiées sur le site</option><option value="reprise">Reprise moboo.ci</option>
        </select>
        <label className="inline-flex items-center gap-1.5 text-sm"><input type="checkbox" name="featured" value="1" defaultChecked={sp.featured === "1"} /> En vedette</label>
        <label className="inline-flex items-center gap-1.5 text-sm"><input type="checkbox" name="expired" value="1" defaultChecked={sp.expired === "1"} /> Expirées</label>
        <button className="h-10 rounded-md border border-brand-700 px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50">Filtrer</button>
        {Object.keys(sp).length ? <Link href="/admin/immobilier" className="text-sm text-slate-500 hover:underline">Réinitialiser</Link> : null}
      </form>

      {!data ? (
        <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Impossible de charger les annonces.</p>
      ) : data.items.length ? (
        <>
          <AdminListingsTable items={data.items} labels={labels} sorts={{ title: sortLink("title"), price: sortLink("price"), date: sortLink("date") }} />
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{data.total.toLocaleString("fr-FR")} annonce(s) · page {data.page} / {pages}</span>
            <div className="flex gap-2">
              {data.page > 1 ? <Link href={href({ page: String(data.page - 1) })} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50">← Précédente</Link> : null}
              {data.page < pages ? <Link href={href({ page: String(data.page + 1) })} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50">Suivante →</Link> : null}
            </div>
          </div>
        </>
      ) : (
        <p className="rounded-lg bg-white p-8 text-center text-sm text-muted ring-1 ring-slate-200">Aucune annonce ne correspond.</p>
      )}
    </div>
  );
}
