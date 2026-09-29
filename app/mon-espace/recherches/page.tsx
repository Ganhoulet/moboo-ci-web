import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/dashboard-ui";
import { SavedSearches } from "@/components/saved-searches";
import { listSearches } from "@/app/compte/searches-actions";

export default async function Recherches() {
  const has = (await listSearches()).length > 0;
  return (
    <div className="max-w-3xl">
      <PageHeader title="Recherches & alertes" sub="Recevez une alerte WhatsApp dès qu'un nouveau bien correspond." />
      {has ? <SavedSearches /> : (
        <EmptyState title="Aucune recherche enregistrée"
          text="Sur la page des annonces, réglez vos filtres puis touchez « Enregistrer cette recherche »."
          action={<Link href="/annonces" className="btn-primary bg-accent-600 hover:bg-accent-700">Lancer une recherche</Link>} />
      )}
    </div>
  );
}
