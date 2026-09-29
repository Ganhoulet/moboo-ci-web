import { notFound } from "next/navigation";
import { AdminTaxonomy } from "@/components/admin-taxonomy";
import { listTaxonomy } from "../../actions";

const LISTS: Record<string, { title: string; help: string }> = {
  type: { title: "Types de bien", help: "Proposés dans l’éditeur d’annonce, les filtres et la recherche. Un type utilisé par des annonces ne peut pas être supprimé." },
  feature: { title: "Équipements", help: "Cases à cocher de l’éditeur d’annonce, affichées sur la fiche et la fiche imprimée." },
  label: { title: "Étiquettes", help: "Badges de couleur posés par le back-office sur une annonce (Exclusivité, Nouveau…), visibles sur les cartes et la fiche." },
  city: { title: "Villes", help: "Villes proposées ; les quartiers / communes s’y rattachent." },
  area: { title: "Quartiers et communes", help: "Liste « Commune / quartier » de l’éditeur d’annonce." },
  status: { title: "Statuts", help: "Badge affiché sur les cartes et la fiche selon l’annonce : à louer, à vendre, loué ou vendu. Renommez-les et choisissez leur couleur ; la liste elle-même est fixe." },
};

export default async function AdminList({ params }: { params: { kind: string } }) {
  const meta = LISTS[params.kind];
  if (!meta) notFound();
  const [items, cities] = await Promise.all([listTaxonomy(params.kind), params.kind === "area" ? listTaxonomy("city") : Promise.resolve([])]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{meta.title}</h1>
        <p className="text-sm text-muted">{meta.help}</p>
      </div>
      <AdminTaxonomy kind={params.kind} items={items} cities={cities.map((c) => ({ slug: c.slug, label: c.label }))} />
    </div>
  );
}
