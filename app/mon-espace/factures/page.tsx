import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { canAccess } from "@/lib/accounts";
import { EmptyState, PageHeader } from "@/components/dashboard-ui";
import { fcfa, INVOICE_STATUS } from "@/lib/community";
import { listMyInvoices } from "../actions";

export default async function MesFactures() {
  const account = getSession()!;
  if (!canAccess(account.accountType, "factures")) redirect("/mon-espace");
  const items = await listMyInvoices();
  return (
    <div>
      <PageHeader title="Factures" sub="Vos achats de forfaits, imprimables ou à enregistrer en PDF." />
      {items.length ? (
        <div className="divide-y divide-slate-100 rounded-2xl bg-white shadow-card">
          {items.map((i) => {
            const st = INVOICE_STATUS[i.status] ?? INVOICE_STATUS.pending;
            return (
              <Link key={i.id} href={`/mon-espace/factures/${i.id}`} className="flex flex-wrap items-center gap-3 p-4 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold text-brand-800">{i.number}</p>
                  <p className="truncate text-sm text-ink">{i.label}</p>
                  <p className="text-xs text-muted">{new Date(i.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <span className={"rounded px-2 py-0.5 text-xs font-bold " + st.cls}>{st.label}</span>
                <span className="w-28 text-right font-semibold text-ink">{fcfa(i.amount)}</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Aucune facture" text="Vos factures apparaissent ici après l’achat d’un forfait."
          action={<Link href="/mon-espace/forfait" className="btn-primary bg-accent-600 hover:bg-accent-700">Voir les forfaits</Link>} />
      )}
    </div>
  );
}
