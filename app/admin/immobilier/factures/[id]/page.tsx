import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceActions } from "@/components/admin-row-actions";
import { InvoiceDocument } from "@/components/invoice-document";
import { PrintButton } from "@/components/print-button";
import { getSiteSettings } from "@/lib/settings";
import { getAdminInvoice } from "../../actions";

export default async function AdminInvoicePage({ params }: { params: { id: string } }) {
  const [invoice, settings] = await Promise.all([getAdminInvoice(params.id), getSiteSettings()]);
  if (!invoice) notFound();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin/immobilier/factures" className="text-sm font-semibold text-brand-800 hover:underline">← Factures</Link>
        <div className="flex items-center gap-4"><InvoiceActions id={invoice.id} status={invoice.status} /><PrintButton /></div>
      </div>
      <InvoiceDocument invoice={invoice} siteName={settings.branding.siteName} />
    </div>
  );
}
