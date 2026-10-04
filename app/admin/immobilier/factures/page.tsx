import Link from "next/link";
import { GrantPackage, InvoiceActions } from "@/components/admin-row-actions";
import { PurgeTestInvoices } from "@/components/backoffice/purge-test-invoices";
import { fcfa, INVOICE_STATUS } from "@/lib/community";
import { listInvoices, listPackages } from "../actions";

const TABS = [["", "Toutes"], ["pending", "En attente"], ["paid", "Payées"], ["failed", "Échouées"], ["cancelled", "Annulées"]] as const;

export default async function AdminInvoices({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const status = searchParams.status ?? "";
  const q = searchParams.q ?? "";
  const test = searchParams.test ?? "";
  const page = Number(searchParams.page) || 1;
  const [data, packages] = await Promise.all([listInvoices({ status, q, test, page: String(page) }), listPackages()]);
  const counts = data?.counts ?? {};
  const all = Object.values(counts).reduce((s, n) => s + n, 0);
  const href = (p: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams(Object.entries({ status, q, test, ...p }).filter(([, v]) => v).map(([k, v]) => [k, String(v)])).toString();
    return `/admin/immobilier/factures${qs ? `?${qs}` : ""}`;
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Factures</h1>
          <p className="text-sm text-muted">Achats de forfaits. Encaissé : <strong className="text-ink">{fcfa(data?.revenue ?? 0)}</strong>{data?.testCount ? " (hors factures de test)" : ""}</p>
        </div>
        <GrantPackage packages={packages.map((p) => ({ id: p.id, name: p.name, price: p.price }))} />
      </div>
      {data?.testCount ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span>🧪 <strong>{data.testCount}</strong> facture(s) de test (paiements simulés, hors chiffre d’affaires).</span>
          <Link href={href({ test: test === "1" ? undefined : "1", page: undefined })} className="font-semibold underline">{test === "1" ? "Tout afficher" : "Voir seulement les tests"}</Link>
          <PurgeTestInvoices />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {TABS.map(([k, label]) => (
          <Link key={k} href={href({ status: k, page: undefined })}
            className={"rounded-full px-3.5 py-1.5 font-semibold " + (status === k ? "bg-brand-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50")}>
            {label} <span className="opacity-70">({k ? counts[k] ?? 0 : all})</span>
          </Link>
        ))}
        <form className="ml-auto flex gap-2" action="/admin/immobilier/factures">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <input name="q" defaultValue={q} placeholder="N°, nom, téléphone…" className="input w-56 py-1.5 text-sm" />
          <button className="rounded-md bg-white px-3 text-sm font-semibold ring-1 ring-slate-300">Rechercher</button>
        </form>
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {data?.items.length ? (
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="border-b border-slate-200 text-left">
              <tr><th className="px-4 py-3">N°</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Désignation</th><th className="px-4 py-3 text-right">Montant</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Date</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((i) => {
                const st = INVOICE_STATUS[i.status] ?? INVOICE_STATUS.pending;
                return (
                  <tr key={i.id}>
                    <td className="whitespace-nowrap px-4 py-3"><Link href={`/admin/immobilier/factures/${i.id}`} className="font-mono font-semibold text-brand-800 hover:underline">{i.number}</Link>{i.test ? <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">TEST</span> : null}</td>
                    <td className="px-4 py-3"><p className="font-semibold text-ink">{i.billingName}</p><p className="text-xs text-muted">{i.billingPhone}</p></td>
                    <td className="px-4 py-3">{i.label}{i.method ? <p className="text-xs text-muted">{i.method}</p> : null}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{fcfa(i.amount)}</td>
                    <td className="px-4 py-3"><span className={"rounded px-2 py-0.5 text-xs font-bold " + st.cls}>{st.label}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{new Date(i.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3"><InvoiceActions id={i.id} status={i.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <p className="p-8 text-center text-sm text-muted">Aucune facture.</p>}
      </div>
      {pages > 1 ? (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 ? <Link href={href({ page: page - 1 })} className="rounded bg-white px-3 py-1.5 ring-1 ring-slate-200">← Précédent</Link> : null}
          <span className="px-2 py-1.5 text-muted">Page {page} / {pages}</span>
          {page < pages ? <Link href={href({ page: page + 1 })} className="rounded bg-white px-3 py-1.5 ring-1 ring-slate-200">Suivant →</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
