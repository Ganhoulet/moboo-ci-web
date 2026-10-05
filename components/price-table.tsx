import Link from "next/link";
import { fcfa, type PriceSegment } from "@/lib/prices";

/** Type de bien de l'indice → filtre des annonces. */
const TYPE_FILTER: Record<string, string> = { studio: "studio", "appartement-1": "appartement", "appartement-2": "appartement", "appartement-3": "appartement", "appartement-4": "appartement", appartement: "appartement", terrain: "terrain" };

/** Tableau des prix médians par type de bien, avec barres et lien vers les annonces. */
export function PriceTable({ rows, zone, transaction }: { rows: PriceSegment[]; zone: string; transaction: "rent" | "sale" }) {
  const max = Math.max(...rows.map((r) => r.p75), 1);
  const unit = transaction === "rent" ? " / mois" : "";
  return (
    <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr><th className="px-4 py-2.5">Type de bien</th><th className="px-3 py-2.5">Prix médian</th><th className="px-3 py-2.5">Fourchette habituelle</th><th className="px-3 py-2.5 text-right">Annonces</th><th className="px-4 py-2.5" /></tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const qs = new URLSearchParams({ transaction, q: zone, ...(TYPE_FILTER[r.segment] ? { propertyType: TYPE_FILTER[r.segment] } : {}) });
            return (
              <tr key={r.segment} className="border-t border-slate-100 align-middle">
                <td className="px-4 py-3 font-semibold text-ink">{r.label}</td>
                <td className="px-3 py-3"><span className="font-extrabold text-ink">{fcfa(r.median)}</span><span className="text-xs text-muted">{unit}</span></td>
                <td className="px-3 py-3">
                  <div className="relative h-2 w-40 rounded-full bg-slate-100" aria-hidden>
                    <div className="absolute h-2 rounded-full bg-brand-500/70" style={{ left: `${(r.p25 / max) * 100}%`, width: `${Math.max(3, ((r.p75 - r.p25) / max) * 100)}%` }} />
                  </div>
                  <span className="mt-1 block text-xs text-muted">{fcfa(r.p25)} – {fcfa(r.p75)}</span>
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-muted">{r.count}</td>
                <td className="px-4 py-3 text-right"><Link href={`/annonces?${qs}`} className="whitespace-nowrap text-xs font-semibold text-brand-700 hover:underline">Voir les annonces →</Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
