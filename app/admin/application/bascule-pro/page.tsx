import { getProBascule } from "../actions";
import { BasculeToggle, BasculeReset } from "./controls";

export const dynamic = "force-dynamic";

const COUNT_LABELS: Record<string, string> = {
  properties: "biens", owners: "propriétaires", tenants: "locataires", leases: "baux", payments: "loyers", leads: "prospects", contracts: "contrats", qr_scans: "scans QR",
};
const countsText = (c: Record<string, number> | null) =>
  Object.entries(c ?? {}).filter(([, n]) => Number(n) > 0).map(([k, n]) => `${n} ${COUNT_LABELS[k] ?? k}`).join(" · ") || "aucune donnée";

export default async function BasculePro() {
  const data = await getProBascule();
  if (!data) return <p className="text-muted">Bascule indisponible (droit « Application » requis).</p>;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Bascule Moboo Pro vers Render</h1>
        <p className="max-w-3xl text-sm text-muted">
          Moboo Pro passe de WordPress à la base Moboo (Render), domaine par domaine. Quand un domaine est ouvert, chaque agence qui se connecte
          envoie une fois ses données WordPress, puis utilise Render pour ce domaine. Tant qu’il est fermé, rien ne change pour les agences.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {data.domains.map((d) => (
          <section key={d.key} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">{d.label}</h2>
                <p className="text-xs text-muted">{d.detail}</p>
              </div>
              <span className={"rounded-full px-2.5 py-0.5 text-xs font-semibold " + (d.open ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600")}>{d.open ? "Ouvert" : "Fermé"}</span>
            </div>
            <p className="mt-3 text-sm text-ink"><strong>{d.migrated}</strong> agence(s) reprise(s)</p>
            <div className="mt-3"><BasculeToggle domain={d.key} open={d.open} /></div>
          </section>
        ))}
      </div>

      <section className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <h2 className="border-b border-slate-200 px-4 py-3 font-semibold text-ink">Agences reprises</h2>
        {data.migrations.length ? (
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="border-b border-slate-200 text-left"><tr><th className="px-4 py-2">Agence</th><th className="px-4 py-2">Domaine</th><th className="px-4 py-2">Données reprises</th><th className="px-4 py-2">Date</th><th className="px-4 py-2" /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.migrations.map((m) => (
                <tr key={m.organizationId + m.domain}>
                  <td className="px-4 py-2.5 font-semibold text-ink">{m.name}</td>
                  <td className="px-4 py-2.5">{data.domains.find((d) => d.key === m.domain)?.label ?? m.domain}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{countsText(m.counts)}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{new Date(m.migratedAt).toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-2.5 text-right"><BasculeReset domain={m.domain} orgId={m.organizationId} name={m.name} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="p-6 text-center text-sm text-muted">Aucune agence reprise pour l’instant.</p>}
      </section>
      <p className="text-xs text-muted">« Refaire la reprise » : l’agence renverra ses données WordPress à sa prochaine connexion (les fiches déjà reprises sont mises à jour, pas dupliquées).</p>
    </div>
  );
}
