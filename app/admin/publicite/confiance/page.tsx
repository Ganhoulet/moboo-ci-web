import Link from "next/link";
import { getTrustAdmin } from "./actions";
import { TrustAdmin } from "@/components/backoffice/trust-admin";

export const dynamic = "force-dynamic";

/** Visites de vérification à faire (badge « Vérifié Moboo ») et demandes de la diaspora. */
export default async function TrustAdminPage() {
  const d = await getTrustAdmin();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Biens vérifiés & diaspora</h1>
          <p className="max-w-3xl text-sm text-muted">Planifiez les visites de contrôle payées par les annonceurs, puis validez (badge sur l’annonce) ou refusez (crédits rendus). Suivez les demandes de la page <b>/diaspora</b>.</p>
        </div>
        <Link href="/admin/publicite/confiance/reglages" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-slate-300">Réglages</Link>
      </div>
      {d ? <TrustAdmin data={d} /> : <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Indisponible.</p>}
    </div>
  );
}
