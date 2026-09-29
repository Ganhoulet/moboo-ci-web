import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceDocument } from "@/components/invoice-document";
import { PrintButton } from "@/components/print-button";
import { getSiteSettings } from "@/lib/settings";
import { getMyInvoice } from "../../actions";

export default async function MaFacture({ params }: { params: { id: string } }) {
  const [invoice, settings] = await Promise.all([getMyInvoice(params.id), getSiteSettings()]);
  if (!invoice) notFound();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/mon-espace/factures" className="text-sm font-semibold text-brand-800 hover:underline">← Factures</Link>
        <PrintButton />
      </div>
      <InvoiceDocument invoice={invoice} siteName={settings.branding.siteName} />
    </div>
  );
}
