import Link from "next/link";
import { SeoGenerator } from "@/components/backoffice/seo-generator";
import { getGenDashboard, getGenZones, getOpportunities } from "./actions";

export const dynamic = "force-dynamic";

const TXL: Record<string, string> = { rent: "Location", sale: "Vente", furnished: "Meublés", event: "Espaces", hub: "Quartiers" };

export default async function SeoGeneratorPage() {
  const [d, zones, opps] = await Promise.all([getGenDashboard(), getGenZones(), getOpportunities()]);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Générateur SEO</h1>
          <p className="max-w-3xl text-sm text-muted">
            Crée automatiquement une page pour chaque recherche immobilière (« location appartement Cocody », « terrain à vendre Bingerville »,
            « résidence meublée Riviera »…) avec les vraies annonces, les prix du quartier, une FAQ et des liens internes.
          </p>
        </div>
        <Link href="/admin/seo/quartiers" className="text-sm font-semibold text-brand-800 hover:underline">Guides de quartier →</Link>
      </div>
      {d ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ["Pages générées", d.generated, null],
            ["Indexées par Google", d.indexable, `seuil : ${d.minIndex} annonce(s)`],
            ["En attente d’annonces", d.notIndexed, "visibles, non indexées"],
            ["Guides de quartier publiés", d.guides, null],
            ["Pages manuelles", d.manual, "jamais modifiées"],
          ].map(([k, v, s]) => (
            <div key={String(k)} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-ink">{Number(v).toLocaleString("fr-FR")}</p>
              {s ? <p className="text-xs text-muted">{s}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
      {d?.byTx.length ? (
        <p className="text-sm text-muted">
          {d.byTx.map((r) => `${TXL[r.tx] ?? r.tx} : ${r.indexable}/${r.pages}`).join(" · ")}
          {d.lastRun ? ` · Dernier contrôle : ${new Date(d.lastRun.at).toLocaleString("fr-FR")}` : ""} ·{" "}
          <Link href="/admin/reglages/seoGen" className="font-semibold text-brand-800 hover:underline">Réglages</Link>
        </p>
      ) : null}
      <SeoGenerator zones={zones} opportunities={opps} />
    </div>
  );
}
