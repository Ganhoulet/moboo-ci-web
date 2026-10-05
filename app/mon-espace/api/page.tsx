import Link from "next/link";
import { PageHeader } from "@/components/dashboard-ui";
import { ApiIntegrations } from "@/components/api-integrations";
import { getMyApi, type MyApi } from "./actions";

export const dynamic = "force-dynamic";

/** Mon espace → API & intégrations (agences partenaires). */
export default async function MyApiPage() {
  const d = await getMyApi();
  return (
    <div className="space-y-6">
      <PageHeader title="API & intégrations" sub="Reliez le logiciel de votre agence à Moboo.ci : annonces synchronisées automatiquement, demandes reçues en temps réel." />
      {!d ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-red-700 shadow-card">Page indisponible pour le moment.</p>
      ) : !d.enabled ? (
        <div className="rounded-2xl bg-white p-6 text-sm shadow-card">
          <p className="font-semibold text-ink">L’API est réservée aux agences partenaires.</p>
          <p className="mt-1 text-muted">Contactez l’équipe Moboo pour ouvrir l’accès à votre agence. <Link href="/developpeurs" className="font-semibold text-brand-700 hover:underline">Voir la documentation</Link></p>
        </div>
      ) : (
        <ApiIntegrations d={d as Required<MyApi>} />
      )}
    </div>
  );
}
