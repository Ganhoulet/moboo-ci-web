import type { Invoice } from "@/app/admin/immobilier/actions";
import { fcfa, INVOICE_STATUS } from "@/lib/community";

const d = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—");

/** Facture imprimable (espace compte et back-office). */
export function InvoiceDocument({ invoice: i, siteName }: { invoice: Invoice; siteName: string }) {
  const st = INVOICE_STATUS[i.status] ?? INVOICE_STATUS.pending;
  const issuer = i.issuer;
  return (
    <article className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-10 print:max-w-none print:p-0 print:shadow-none print:ring-0">
      <style>{"@page { size: A4; margin: 16mm 14mm; }"}</style>
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <p className="font-display text-2xl font-black text-brand-900">{issuer?.name || siteName}</p>
          {issuer?.address ? <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{issuer.address}</p> : null}
          {issuer?.taxId ? <p className="text-sm text-slate-600">{issuer.taxId}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Facture</p>
          <p className="font-display text-xl font-extrabold text-ink">{i.number}</p>
          <p className="text-sm text-slate-600">Émise le {d(i.createdAt)}</p>
          <span className={"mt-2 inline-block rounded px-2 py-0.5 text-xs font-bold " + st.cls}>{st.label}</span>
        </div>
      </header>
      <section className="grid gap-6 py-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Facturé à</p>
          <p className="mt-1 font-semibold text-ink">{i.billingName || "—"}</p>
          {i.billingPhone ? <p className="text-sm text-slate-600">{i.billingPhone}</p> : null}
          {i.billingEmail ? <p className="text-sm text-slate-600">{i.billingEmail}</p> : null}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Paiement</p>
          <p className="mt-1 text-sm text-slate-700">{i.status === "paid" ? `Payée le ${d(i.paidAt)}` : st.label}</p>
          {i.method ? <p className="text-sm text-slate-600">Moyen : {i.method === "money-fusion" ? "Mobile money / carte (Money Fusion)" : i.method}</p> : null}
          {i.paymentRef ? <p className="text-sm text-slate-600">Réf. : {i.paymentRef}</p> : null}
        </div>
      </section>
      <table className="w-full text-sm">
        <thead><tr className="border-y border-slate-200 text-left text-xs uppercase tracking-wider text-muted"><th className="py-2">Désignation</th><th className="py-2 text-right">Montant</th></tr></thead>
        <tbody>
          <tr className="border-b border-slate-100">
            <td className="py-3">
              <p className="font-semibold text-ink">{i.label}</p>
              {i.subscription ? <p className="text-xs text-muted">Période : du {d(i.subscription.startsAt)} au {d(i.subscription.endsAt)}</p> : null}
            </td>
            <td className="py-3 text-right font-semibold">{fcfa(i.amount)}</td>
          </tr>
        </tbody>
        <tfoot><tr><td className="pt-4 text-right font-semibold">Total</td><td className="pt-4 text-right font-display text-lg font-extrabold text-ink">{fcfa(i.amount)}</td></tr></tfoot>
      </table>
      {issuer?.note ? <p className="mt-10 border-t border-slate-200 pt-4 text-center text-sm text-slate-500">{issuer.note}</p> : null}
    </article>
  );
}
