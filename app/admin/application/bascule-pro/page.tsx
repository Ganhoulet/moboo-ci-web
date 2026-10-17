import { getProBascule } from "../actions";
import { BasculeModeSwitch, BasculeReset, PilotAdd, PilotRemove } from "./controls";

export const dynamic = "force-dynamic";

/** Domaines sans reprise de données par l'application (servis dès leur ouverture). */
const NO_REPRISE = new Set(["support", "partages", "compte"]);
const COUNT_LABELS: Record<string, string> = {
  properties: "biens", owners: "propriétaires", tenants: "locataires", leases: "baux", payments: "loyers", leads: "prospects", contracts: "contrats", qr_scans: "scans QR", edl: "états des lieux", devis: "devis", foncier: "transactions foncières", encaissements: "encaissements", depenses: "dépenses", agents: "agents", demandes: "demandes", mandats: "mandats web", errors: "non reprises",
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
          Commencez par le mode « Agences pilotes » avec un ou deux comptes, vérifiez, puis ouvrez à toutes.
        </p>
      </div>

      {data.domains.map((d) => (
        <section key={d.key} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-ink">{d.label}</h2>
              <p className="text-xs text-muted">{d.detail}</p>
              {NO_REPRISE.has(d.key) ? (
                <p className="mt-2 text-sm text-ink">Actif dès l’ouverture, sans reprise par l’application.</p>
              ) : (
                <p className="mt-2 text-sm text-ink"><strong>{d.migrated}</strong> agence(s) reprise(s)</p>
              )}
            </div>
            <BasculeModeSwitch domain={d.key} mode={d.mode} />
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <h3 className="text-sm font-semibold text-ink">Agences pilotes</h3>
            <p className="text-xs text-muted">{d.mode === "pilot" ? "Seules ces agences utilisent Render pour ce domaine." : d.mode === "on" ? "Le domaine est ouvert à toutes les agences : la liste n’a plus d’effet." : "Passez en mode « Agences pilotes » pour que ces agences basculent."}</p>
            {d.pilots.length ? (
              <ul className="mt-2 divide-y divide-slate-100 rounded-md ring-1 ring-slate-200">
                {d.pilots.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span><span className="font-semibold text-ink">{p.name}</span>{p.contact ? <span className="block text-xs text-muted">{p.contact}</span> : null}</span>
                    <span className="flex items-center gap-3">
                      {NO_REPRISE.has(d.key) ? null : (
                        <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (p.migrated ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600")}>{p.migrated ? "Reprise faite" : "En attente de connexion"}</span>
                      )}
                      <PilotRemove domain={d.key} orgId={p.id} name={p.name} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-xs text-muted">Aucune agence pilote.</p>}
            <PilotAdd domain={d.key} existing={d.pilots.map((p) => p.id)} />
          </div>
        </section>
      ))}

      <section className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <h2 className="border-b border-slate-200 px-4 py-3 font-semibold text-ink">Agences reprises</h2>
        {data.migrations.length ? (
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="border-b border-slate-200 text-left"><tr><th className="px-4 py-2">Agence</th><th className="px-4 py-2">Domaine</th><th className="px-4 py-2">Données reprises</th><th className="px-4 py-2">Date</th><th className="px-4 py-2" /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.migrations.map((m) => (
                <tr key={m.organizationId + m.domain}>
                  <td className="px-4 py-2.5"><span className="font-semibold text-ink">{m.name}</span>{m.contact ? <span className="block text-xs text-muted">{m.contact}</span> : null}</td>
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
