import { AdminPartners } from "@/components/admin-partners";
import { listPartners } from "../actions";

export default async function AdminPartnersPage() {
  const items = await listPartners();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Partenaires</h1>
        <p className="text-sm text-muted">Logos affichés sur l’accueil (« Ils nous font confiance »), dans l’ordre de la liste. Section masquée s’il n’y en a aucun.</p>
      </div>
      <AdminPartners items={items} />
    </div>
  );
}
