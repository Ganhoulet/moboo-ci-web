import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/dashboard-ui";
import { PropertyCard } from "@/components/property-card";
import { listAccountFavorites } from "../actions";

export default async function Favoris() {
  const favs = await listAccountFavorites();
  return (
    <div>
      <PageHeader title="Favoris" sub="Enregistrés dans votre compte : retrouvez-les sur tous vos appareils." />
      {favs.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {favs.map((p) => <PropertyCard key={p.id} p={p} />)}
        </div>
      ) : (
        <EmptyState title="Aucun favori" text="Touchez ♥ sur une annonce pour l'enregistrer ici."
          action={<Link href="/annonces" className="btn-primary bg-accent-600 hover:bg-accent-700">Explorer les annonces</Link>} />
      )}
    </div>
  );
}
