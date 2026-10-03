import Link from "next/link";
import { getAdminSettings } from "../actions";
import { getErrors, getHealth } from "./actions";
import { ErrorList } from "@/components/backoffice/error-list";
import { SettingsForm } from "@/components/settings-form";
import { API_URL } from "@/lib/api";

const LEVEL = {
  ok: ["✓", "bg-emerald-50 text-emerald-800 ring-emerald-200", "Tout fonctionne"],
  warn: ["!", "bg-amber-50 text-amber-900 ring-amber-200", "À surveiller"],
  error: ["✕", "bg-red-50 text-red-800 ring-red-200", "Problème à corriger"],
} as const;
const dur = (s: number) => (s >= 86400 ? `${Math.floor(s / 86400)} j ${Math.floor((s % 86400) / 3600)} h` : s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min` : `${Math.floor(s / 60)} min`);

/** Back-office → Santé du site (façon « Site Health » de WordPress) + erreurs remontées + alertes. */
export default async function HealthPage({ searchParams }: { searchParams: { status?: string; app?: string } }) {
  const status = ["OPEN", "RESOLVED", "IGNORED"].includes(searchParams.status ?? "") ? searchParams.status! : "OPEN";
  const [h, errors, settings] = await Promise.all([getHealth(), getErrors(status, searchParams.app), getAdminSettings()]);
  const section = settings?.schema.find((s) => s.id === "monitoring");
  const healthUrl = `${API_URL.replace(/\/$/, "")}/health`;
  const tab = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ status, app: searchParams.app, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/sante?${p}`;
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Santé du site</h1>
        <p className="text-sm text-muted">État des services dont dépendent le site et les applications, et erreurs rencontrées par les visiteurs.</p>
      </div>

      {!h ? <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Impossible de joindre l’API : elle est peut-être arrêtée ou en cours de redémarrage sur Render.</p> : (
        <>
          <div className={`flex items-center gap-3 rounded-lg px-4 py-3 ring-1 ${LEVEL[h.overall][1]}`}>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-lg font-black">{LEVEL[h.overall][0]}</span>
            <div><p className="font-semibold">{LEVEL[h.overall][2]}</p>
              <p className="text-xs opacity-80">API version {h.server.version} · en ligne depuis {dur(h.server.uptimeS)} · mémoire {h.server.memoryMb} Mo · Node {h.server.node}{h.server.region ? ` · ${h.server.region}` : ""}</p></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {h.checks.map((c) => (
              <div key={c.key} className="flex gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-black ring-1 ${LEVEL[c.level][1]}`}>{LEVEL[c.level][0]}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{c.label}</p>
                  <p className="break-words text-sm text-slate-600">{c.detail}</p>
                  {c.help ? <p className="mt-1 text-xs text-muted">{c.help}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-ink">Erreurs remontées</h2>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {[["OPEN", "À traiter"], ["RESOLVED", "Corrigées"], ["IGNORED", "Ignorées"]].map(([k, l]) => (
              <Link key={k} href={tab({ status: k })} className={status === k ? "font-bold text-ink" : "text-brand-800 hover:underline"}>{l}</Link>
            ))}
            <span className="text-slate-300">|</span>
            {[["", "Toutes"], ["site", "Site"], ["api", "API"], ["resi", "Resi"], ["event", "Event"]].map(([k, l]) => (
              <Link key={k} href={tab({ app: k || undefined })} className={(searchParams.app ?? "") === k ? "font-bold text-ink" : "text-brand-800 hover:underline"}>
                {l}{k && h ? ` (${h.errorsByApp.find((x) => x.app === k)?.open ?? 0})` : ""}
              </Link>
            ))}
          </div>
        </div>
        <ErrorList items={errors} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-display text-lg font-bold text-ink">Surveillance de disponibilité</h2>
          <p className="mt-1 text-sm text-slate-600">Pour être prévenu si le site ou l’API tombe, créez deux sondes gratuites sur <a href="https://uptimerobot.com" target="_blank" rel="noopener" className="font-semibold text-brand-800 hover:underline">UptimeRobot</a> (ou Better Stack), toutes les 5 minutes, avec alerte par e-mail et SMS :</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• API : <code className="break-all rounded bg-slate-100 px-1.5 py-0.5 text-xs">{healthUrl}</code> <span className="text-muted">(mot-clé attendu : <code>&quot;ok&quot;</code>)</span></li>
            <li>• Site : <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">https://moboo.ci</code></li>
          </ul>
          <p className="mt-2 text-xs text-muted">La sonde de l’API garde aussi le service Render éveillé (pas de démarrage lent pour le premier visiteur).</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-display text-lg font-bold text-ink">Sauvegardes de la base de données</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
            <li>• Vérifiez que les sauvegardes automatiques quotidiennes sont actives chez l’hébergeur de la base (Render Postgres : onglet « Backups » ; Supabase : « Database → Backups »).</li>
            <li>• Activez la restauration à une date précise (PITR) si l’offre le permet.</li>
            <li>• Une fois par mois, restaurez une sauvegarde sur une base de test : une sauvegarde jamais restaurée n’est pas une sauvegarde.</li>
          </ul>
        </div>
      </section>

      {settings && section ? (
        <section>
          <SettingsForm key={section.id} section={section} initial={settings.values[section.id] ?? {}} updatedAt={settings.updated.find((u) => u.section === section.id)?.updatedAt ?? null} />
        </section>
      ) : null}
    </div>
  );
}
