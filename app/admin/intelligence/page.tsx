import { getIntelligence } from "./actions";
import type { Filtre } from "./qs";
import { IntelligenceView } from "./view";

export const dynamic = "force-dynamic";

/** Back-office → Intelligence immobilière : la version avancée du « Marché en direct » de l'appli Moboo Pro. */
export default async function IntelligencePage({ searchParams }: { searchParams: Filtre }) {
  const f: Filtre = { commune: searchParams.commune || undefined, quartier: searchParams.quartier || undefined, type: searchParams.type || undefined, tx: searchParams.tx === "rent" || searchParams.tx === "sale" ? searchParams.tx : undefined };
  const r = await getIntelligence(f);
  if (!r.ok) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">{r.error}</p>;
  return <IntelligenceView d={r.data} f={f} />;
}
