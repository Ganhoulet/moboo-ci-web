import Link from "next/link";
import { getProDeparts } from "../outils-actions";
import { fmtDate, Section } from "../ui";

export const dynamic = "force-dynamic";

export default async function Departs() {
  const rows = await getProDeparts();
  if (!rows) return <p className="text-muted">Départs indisponibles (droit « Application » requis).</p>;
  const zones = Object.entries(rows.reduce<Record<string, number>>((acc, r) => { const z = r.zone || r.commune || "Zone inconnue"; acc[z] = (acc[z] ?? 0) + 1; return acc; }, {}))
    .sort((a, b) => b[1] - a[1]).slice(0, 12);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Moboo Pro › Départs signalés</h1>
        <p className="max-w-3xl text-sm text-muted">
          Locataires qui ont signalé leur départ avec le QR de leur logement (pro.moboo.ci/depart). L’agence est prévenue dans l’application ;
          cette page sert au suivi par Moboo. Remplace l’extension WordPress « Moboo Départs ».
        </p>
      </div>
      {zones.length ? (
        <Section title="Zones où des logements se libèrent">
          <ul className="flex flex-wrap gap-2 p-4">{zones.map(([z, n]) => <li key={z} className="rounded-full bg-slate-100 px-3 py-1 text-sm">{z} <strong>{n}</strong></li>)}</ul>
        </Section>
      ) : null}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {rows.length ? (
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="border-b border-slate-200 text-left"><tr><th className="px-4 py-3">Logement</th><th className="px-4 py-3">Agence</th><th className="px-4 py-3">Départ prévu</th><th className="px-4 py-3">Locataire</th><th className="px-4 py-3">Signalé le</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2.5"><span className="font-semibold text-ink">{r.propertyTitle || "—"}</span><span className="block text-xs text-muted">{[r.zone, r.commune].filter(Boolean).join(", ")}</span></td>
                  <td className="px-4 py-2.5"><Link href={`/admin/moboo-pro/agence/${r.organizationId}`} className="text-brand-800 hover:underline">{r.agency}</Link></td>
                  <td className="px-4 py-2.5 font-semibold">{fmtDate(r.departDate)}</td>
                  <td className="px-4 py-2.5 text-xs">{r.contactName || "—"}<span className="block text-muted">{r.contactPhone}</span>{r.message ? <span className="block text-slate-600">{r.message}</span> : null}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{fmtDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="p-8 text-center text-sm text-muted">Aucun départ signalé sur Render pour l’instant.</p>}
      </div>
    </div>
  );
}
