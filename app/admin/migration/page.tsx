import { MigrationButtons } from "@/components/backoffice/migration-actions";
import { getMigrationStatus } from "./actions";

export const dynamic = "force-dynamic";

const mo = (b: number) => (b >= 1e9 ? `${(b / 1e9).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Go` : `${Math.round(b / 1e6).toLocaleString("fr-FR")} Mo`);
const n = (v: number) => v.toLocaleString("fr-FR");

function Tile({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "ok" | "warn" | "bad" }) {
  const cls = { default: "text-ink", ok: "text-emerald-700", warn: "text-amber-700", bad: "text-red-700" }[tone];
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={"mt-1 font-display text-2xl font-extrabold tabular-nums " + cls}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

/** Back-office → Migration WordPress : photos et comptes, avant la bascule de moboo.ci. */
export default async function Migration() {
  const s = await getMigrationStatus();
  if (!s) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Migration indisponible (réservée au super administrateur).</p>;
  const m = s.media, u = s.users;
  const pct = m.total ? Math.round((m.done / m.total) * 100) : 0;
  const ready = m.total > 0 && m.pending === 0 && m.failed === 0 && m.rowsWithWpUrls === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Migration WordPress</h1>
        <p className="max-w-3xl text-sm text-muted">
          Avant de faire pointer moboo.ci vers le nouveau site : copier les photos de la médiathèque WordPress dans le stockage Moboo,
          et reprendre les comptes avec leur mot de passe. Rien n’est supprimé dans WordPress ; tout peut être relancé sans risque.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-bold text-ink">Photos</h2>
          {m.running ? <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-800 ring-1 ring-sky-200">⟳ Copie en cours</span> : null}
          {ready ? <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">✔ Prêt pour la bascule</span> : null}
        </div>
        {!m.storageConfigured ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">Stockage non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY dans Render) : la copie est impossible.</p> : null}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Tile label="Photos recensées" value={n(m.total)} hint={`depuis ${m.origin}`} />
          <Tile label="Copiées" value={`${n(m.done)}`} hint={`${pct} % · ${mo(m.bytes)}`} tone={m.done && m.done === m.total ? "ok" : "default"} />
          <Tile label="À copier" value={n(m.pending)} tone={m.pending ? "warn" : "ok"} />
          <Tile label="En échec" value={n(m.failed)} hint={m.missing ? `+ ${n(m.missing)} introuvable(s) sur WordPress` : undefined} tone={m.failed ? "bad" : "ok"} />
          <Tile label="Contenus à mettre à jour" value={n(m.rowsWithWpUrls)} hint="annonces, pages… citant encore moboo.ci/wp-content" tone={m.rowsWithWpUrls ? "warn" : "ok"} />
        </div>
        {m.total ? (
          <div className="h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Photos copiées">
            <div className="h-full bg-brand-700" style={{ width: `${pct}%` }} />
          </div>
        ) : null}
        <MigrationButtons running={m.running} />
        <details className="rounded-lg bg-white p-4 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
          <summary className="cursor-pointer font-semibold text-ink">Comment ça marche ?</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li><strong>Analyser</strong> : repère toutes les photos WordPress citées dans la base (annonces, résidences, espaces, agents, profils, pages, blog, réglages).</li>
            <li><strong>Tester</strong> : vérifie que WordPress laisse la nouvelle plateforme télécharger les photos. Si SiteGround bloque (protection anti-robots), autorisez l’adresse IP de Render, ou envoyez les photos depuis l’extension WordPress « Moboo Migration ».</li>
            <li><strong>Lancer la copie</strong> : chaque photo est copiée au même chemin dans le stockage Moboo ; à la fin, les adresses sont remplacées automatiquement.</li>
            <li>À refaire juste avant la bascule (nouvelles annonces) : <strong>Analyser</strong> puis <strong>Lancer la copie</strong>. « Contenus à mettre à jour » doit être à 0.</li>
          </ol>
        </details>
        {m.failures.length ? (
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-2">Photo</th><th className="px-2 py-2">État</th><th className="px-4 py-2">Raison</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {m.failures.map((f) => (
                  <tr key={f.path}><td className="px-4 py-2 font-mono text-xs">{f.path}</td><td className="px-2 py-2">{f.status === "missing" ? "Introuvable" : `Échec (${f.attempts} essai(s))`}</td><td className="px-4 py-2 text-slate-600">{f.error}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-ink">Comptes</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Tile label="Comptes reçus" value={n(u.total)} hint="envoyés par l’extension WordPress" />
          <Tile label="Créés" value={n(u.created)} hint="nouveaux comptes du site" tone="ok" />
          <Tile label="Reliés" value={n(u.linked)} hint="même téléphone ou même e-mail" tone="ok" />
          <Tile label="Sans numéro" value={n(u.noPhone)} hint="confirmeront leur numéro à la 1re connexion" tone={u.noPhone ? "warn" : "default"} />
          <Tile label="Conflits" value={n(u.conflict)} hint="à vérifier ci-dessous" tone={u.conflict ? "bad" : "ok"} />
        </div>
        {!u.total ? (
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
            <p className="font-semibold">Aucun compte reçu pour l’instant.</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
              <li>Installez l’extension « Moboo Migration » sur moboo.ci (WordPress → Extensions → Ajouter → Téléverser).</li>
              <li>Outils → Moboo Migration : collez la clé <code>ADMIN_API_KEY</code> de Render, enregistrez.</li>
              <li>Cliquez « Envoyer les comptes ». Les mots de passe restent chiffrés et fonctionneront sur le nouveau site.</li>
            </ol>
          </div>
        ) : null}
        {u.problems.length ? (
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full min-w-[44rem] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-2">Compte WordPress</th><th className="px-2 py-2">Téléphone saisi</th><th className="px-2 py-2">État</th><th className="px-4 py-2">Détail</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {u.problems.map((p) => (
                  <tr key={p.wpId}>
                    <td className="px-4 py-2"><span className="font-medium text-ink">{p.login}</span><span className="block text-xs text-muted">{p.email ?? "—"} · n° {p.wpId}</span></td>
                    <td className="px-2 py-2 text-slate-700">{p.phoneRaw ?? "—"}</td>
                    <td className="px-2 py-2">{p.status === "conflict" ? <span className="font-semibold text-red-700">Conflit</span> : <span className="text-amber-700">Sans numéro</span>}</td>
                    <td className="px-4 py-2 text-slate-600">{p.note ?? (p.status === "no_phone" ? "Pourra se connecter avec son ancien mot de passe, puis confirmera son numéro par code." : "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
