import { getProBascule } from "../actions";
import { AppPolicyForm, BasculeModeSwitch, BasculeReset, PilotAdd, PilotRemove, WordpressSwitch } from "./controls";

export const dynamic = "force-dynamic";

/** Protocole de la dernière version de Moboo Pro (RenderBascule.protocol dans l’application). */
const APP_PROTOCOL = 1;

/** Domaines sans reprise de données par l'application (servis dès leur ouverture). */
const NO_REPRISE = new Set(["support", "partages", "compte", "services", "vf", "syndic", "plateforme"]);
const COUNT_LABELS: Record<string, string> = {
  properties: "biens", owners: "propriétaires", tenants: "locataires", leases: "baux", payments: "loyers", leads: "prospects", contracts: "contrats", qr_scans: "scans QR", edl: "états des lieux", devis: "devis", foncier: "transactions foncières", encaissements: "encaissements", depenses: "dépenses", agents: "agents", demandes: "demandes", mandats: "mandats web", tickets: "tickets", projet: "projets", lot: "lots", phase: "phases", acquereur: "acquéreurs", reservation: "réservations", versement: "versements", depense: "dépenses", errors: "non reprises",
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

      <ArretWordpress data={data} />

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

type Data = NonNullable<Awaited<ReturnType<typeof getProBascule>>>;

function Check({ ok, title, children }: { ok: boolean; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2 py-2">
      <span aria-hidden className={"mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold " + (ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800")}>{ok ? "✓" : "!"}</span>
      <span><span className="font-semibold text-ink">{title}</span><span className="block text-xs text-muted">{children}</span></span>
    </li>
  );
}

function ArretWordpress({ data }: { data: Data }) {
  const off = data.wordpress?.off === true;
  const p = data.preparation;
  const app = data.app ?? { minProtocol: 0, androidUrl: "", iosUrl: "", message: "" };
  const checks = [
    app.minProtocol >= APP_PROTOCOL,
    !!p && p.domainsNotOn.length === 0,
  ];
  const blockers = checks.filter((c) => !c).length;
  return (
    <section className={"rounded-lg p-4 shadow-sm ring-1 " + (off ? "bg-slate-50 ring-slate-300" : "bg-white ring-red-200")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">Arrêt de WordPress</h2>
          <p className="max-w-2xl text-xs text-muted">
            {off
              ? `WordPress est arrêté pour Moboo Pro${data.wordpress?.at ? ` depuis le ${new Date(data.wordpress.at).toLocaleString("fr-FR")}` : ""} : l’application n’utilise plus que Render.`
              : "Dernière étape : quand tout est au vert, l’application cesse d’appeler WordPress. Les anciennes versions reçoivent un message de mise à jour."}
          </p>
        </div>
        <WordpressSwitch off={off} blockers={blockers} />
      </div>

      {p ? (
        <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
          <Check ok={checks[0]} title="Version minimale de l’application">
            {app.minProtocol >= APP_PROTOCOL ? `Protocole ${app.minProtocol} exigé : les anciennes versions sont bloquées et renvoyées vers le store.` : `À régler sur ${APP_PROTOCOL} une fois la nouvelle version publiée sur le Play Store et l’App Store.`}
          </Check>
          <Check ok={checks[1]} title="Tous les domaines sur « Ouvert à toutes »">
            {p.domainsNotOn.length ? `Encore fermés ou en pilote : ${p.domainsNotOn.join(", ")}.` : "Tous les domaines sont ouverts."}
          </Check>
          <Check ok={p.orgsStarted === 0 || p.orgsComplete === p.orgsStarted} title="Reprise des agences">
            {`${p.orgsComplete} agence(s) entièrement reprise(s) sur ${p.orgsStarted} commencée(s). Lancez « Reprendre les agences restantes » dans Moboo Migration (WordPress en lecture seule) pour reprendre celles qui ne se sont pas reconnectées.`}
          </Check>
          <Check ok title="Invitations">
            {p.invitationsPending ? `${p.invitationsPending} invitation(s) pas encore acceptée(s) : elles restent valables sur moboo.ci (pages /rejoindre, /proprietaire, /rattachement). Cliquez sur « Envoyer les invitations en attente » dans Moboo Migration juste avant l’arrêt.` : "Aucune invitation en attente."}
          </Check>
          <Check ok title="Comptes Moboo Pro">
            {`${p.proAccounts} compte(s) connu(s) de Render, dont ${p.appSeen30} actif(s) dans l’application ces 30 derniers jours.`}
          </Check>
        </ul>
      ) : null}

      <details className="mt-3 rounded-md bg-slate-50 p-3 text-sm">
        <summary className="cursor-pointer font-semibold text-ink">Version minimale de l’application</summary>
        <div className="mt-3"><AppPolicyForm policy={app} current={APP_PROTOCOL} /></div>
      </details>

      <details className="mt-2 rounded-md bg-slate-50 p-3 text-sm">
        <summary className="cursor-pointer font-semibold text-ink">Procédure d’arrêt, dans l’ordre</summary>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-slate-700">
          <li>Publier la nouvelle version de Moboo Pro (Play Store et App Store), attendre qu’elle soit disponible, puis régler la version minimale ci-dessus.</li>
          <li>Ouvrir tous les domaines à toutes les agences (sections ci-dessous).</li>
          <li>Dans WordPress › Moboo Migration › « 5. Arrêt de WordPress » : activer la lecture seule (plus aucune écriture Moboo Pro sur WordPress).</li>
          <li>Renvoyer depuis Moboo Migration : Comptes, Services, Plateforme Moboo Pro, Syndic, Vérification foncière, Support, puis « Envoyer les invitations en attente ».</li>
          <li>Cliquer sur « Reprendre les agences restantes » et attendre « terminée ✔ » (agences, puis agents).</li>
          <li>Cliquer sur « Arrêter WordPress pour Moboo Pro » ci-dessus.</li>
          <li>Vérifier sur un téléphone : connexion, un bien, un état des lieux, une invitation, mot de passe oublié.</li>
          <li>Faire pointer moboo.ci vers le nouveau site (DNS) et garder une sauvegarde complète de WordPress (fichiers + base) avant de l’éteindre.</li>
        </ol>
      </details>
    </section>
  );
}
