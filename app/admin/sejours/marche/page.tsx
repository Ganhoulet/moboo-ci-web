import { MarketBoard } from "@/components/stays/admin-market";
import { listMarket } from "../actions";

export const dynamic = "force-dynamic";

/** Back-office → Séjours → Prix du marché : relevés hors Moboo, sources privées. */
export default async function AdminMarketPrices() {
  const rows = await listMarket();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Prix du marché</h1>
        <p className="max-w-3xl text-sm text-muted">Saisissez les prix de la nuitée relevés hors Moboo : études publiées, annonces de location courte durée, relevés de l’équipe. Le site affiche la colonne « Marché » et un repère combiné avec les prix Moboo, avec la mention « plusieurs plateformes de location et annonces publiques ». Le nom et le lien des sources ne sortent jamais du back-office. Un relevé compte pendant 12 mois.</p>
        <p className="mt-2 max-w-3xl text-sm text-muted">Saisissez des chiffres lus vous-même (rapports publics, comptage d’annonces). Pas de copie automatique des sites : leurs conditions l’interdisent souvent.</p>
      </div>
      {rows ? <MarketBoard rows={rows} /> : <p className="rounded-lg bg-white p-6 text-muted ring-1 ring-slate-200">Chargement impossible (droits « Pages SEO » requis).</p>}
    </div>
  );
}
