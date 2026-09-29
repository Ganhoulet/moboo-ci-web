import Link from "next/link";
import { AdminPackages } from "@/components/admin-packages";
import { listPackages } from "../actions";

export default async function AdminPackagesPage() {
  const items = await listPackages();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Forfaits</h1>
        <p className="text-sm text-muted">
          Proposés sur la page <a href="/forfaits" target="_blank" className="font-semibold text-brand-800 hover:underline">/forfaits</a> et payés par Money Fusion (Wave, Orange Money, MTN, Moov, carte).
          Quota gratuit, obligation de forfait et coordonnées des factures : <Link href="/admin/reglages/packages" className="font-semibold text-brand-800 hover:underline">Forfaits et paiements</Link>.
        </p>
      </div>
      <AdminPackages items={items} />
    </div>
  );
}
