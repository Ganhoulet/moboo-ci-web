import Link from "next/link";
import { getGenZones, getGuides } from "../generateur/actions";

export const dynamic = "force-dynamic";

/** Guides de quartier : texte unique par zone, affiché sur toutes ses pages SEO. */
export default async function ZoneGuidesPage() {
  const [zones, guides] = await Promise.all([getGenZones(), getGuides()]);
  const bySlug = new Map(guides.map((g) => [g.slug, g]));
  const rows = zones.filter((z) => z.level !== "pays");
  const done = guides.filter((g) => g.status === "published").length;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Guides de quartier</h1>
        <p className="max-w-3xl text-sm text-muted">
          Vie de quartier, écoles, transports, sécurité, commerces, investissement : un texte rédigé une fois par zone, repris sur toutes ses pages
          (« Appartements à louer à Cocody », « Immobilier à Cocody »…). C’est le contenu unique qui fait la différence sur Google.
        </p>
        <p className="mt-1 text-sm text-ink">{done} guide(s) publié(s) sur {rows.length} zone(s). Commencez par les zones qui ont le plus d’annonces.</p>
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-muted"><tr><th className="p-3">Zone</th><th className="p-3 text-right">Annonces</th><th className="p-3">Guide</th><th className="p-3" /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((z) => {
              const g = bySlug.get(z.slug);
              return (
                <tr key={z.slug}>
                  <td className="p-3"><span className="font-semibold text-ink">{z.name}</span>{z.city && z.city !== z.name ? <span className="text-muted"> · {z.city}</span> : null}</td>
                  <td className="p-3 text-right">{z.total}</td>
                  <td className="p-3">{g?.status === "published" ? <span className="text-emerald-700">Publié</span> : g ? <span className="text-amber-700">Brouillon</span> : <span className="text-muted">À rédiger</span>}</td>
                  <td className="p-3 text-right"><Link href={`/admin/seo/quartiers/${z.slug}`} className="font-semibold text-brand-800 hover:underline">{g ? "Modifier" : "Rédiger"}</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
