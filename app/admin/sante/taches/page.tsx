import Link from "next/link";
import { dismissAllAction, dismissOneAction, getJobs, retryAllAction, retryOneAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS: Record<string, [string, string]> = {
  ok: ["Réussie", "bg-emerald-100 text-emerald-800"],
  retry: ["Nouvel essai prévu", "bg-amber-100 text-amber-800"],
  failed: ["Abandonnée", "bg-red-100 text-red-800"],
};
const time = (s: string) => new Date(s).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** Santé du site → Tâches en arrière-plan : file (Redis ou mémoire), échecs à relancer, dernières exécutions. */
export default async function JobsPage() {
  const d = await getJobs();
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Suivi des tâches indisponible.</p>;
  const redis = d.mode === "redis";
  const counts: [string, number, string][] = [
    ["En attente", d.counts.waiting + d.counts.delayed, "text-ink"],
    ["En cours", d.counts.active, "text-brand-700"],
    ["Réussies", d.counts.completed, "text-emerald-700"],
    ["À relancer", d.failures.length, d.failures.length ? "text-red-700" : "text-ink"],
  ];
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/sante" className="text-sm font-semibold text-brand-800 hover:underline">← Santé du site</Link>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">Tâches en arrière-plan</h1>
        <p className="max-w-3xl text-sm text-muted">
          E-mails et notifications push partent en arrière-plan : les visiteurs n’attendent pas, et un envoi raté est réessayé automatiquement
          (attente de plus en plus longue entre les essais). Une tâche qui échoue à tous ses essais apparaît ci-dessous pour être relancée.
        </p>
      </div>

      <div className={"rounded-lg px-4 py-3 text-sm ring-1 " + (redis ? "bg-emerald-50 text-emerald-900 ring-emerald-200" : "bg-amber-50 text-amber-900 ring-amber-200")}>
        {redis ? (
          <p><strong>Redis connecté.</strong> La file est partagée par tous les serveurs et survit aux redémarrages ; les tâches planifiées (versements automatiques, purges…) ne tournent que sur un serveur à la fois ; limites anti-abus et réglages communs à tous les serveurs.</p>
        ) : d.redisConfigured ? (
          <p><strong>Redis injoignable</strong> : la file fonctionne en mémoire sur ce serveur (une tâche en cours peut se perdre au redémarrage). Vérifiez le service Redis sur Render et l’adresse REDIS_URL.</p>
        ) : (
          <p><strong>Mode mémoire (sans Redis).</strong> Tout fonctionne sur un seul serveur, avec nouveaux essais ; une tâche en cours peut se perdre au redémarrage. Pour une file durable et plusieurs serveurs : créer un service Redis (« Key Value ») sur Render et renseigner REDIS_URL.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counts.map(([l, n, tone]) => (
          <div key={l} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className={"font-display text-2xl font-extrabold tabular-nums " + tone}>{n.toLocaleString("fr-FR")}</p>
            <p className="text-xs text-muted">{l}</p>
          </div>
        ))}
      </div>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-ink">Tâches abandonnées</h2>
          {d.failures.length ? (
            <div className="flex gap-2 text-sm">
              <form action={retryAllAction}><button className="rounded-md bg-brand-700 px-3 py-1.5 font-semibold text-white hover:bg-brand-800">Tout relancer</button></form>
              <form action={dismissAllAction}><button className="rounded-md bg-white px-3 py-1.5 font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Tout classer</button></form>
            </div>
          ) : null}
        </div>
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-2">Tâche</th><th className="px-3 py-2">Erreur</th><th className="px-3 py-2">Essais</th><th className="px-3 py-2">Date</th><th className="px-4 py-2" /></tr>
            </thead>
            <tbody>
              {d.failures.map((f) => (
                <tr key={f.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-2 font-semibold">{f.label}</td>
                  <td className="max-w-md px-3 py-2 text-xs text-red-800">{f.error}</td>
                  <td className="px-3 py-2 tabular-nums">{f.attempts}</td>
                  <td className="px-3 py-2 text-xs text-muted">{time(f.createdAt)}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1">
                      <form action={retryOneAction.bind(null, f.id)}><button className="rounded px-2 py-1 text-xs font-semibold text-brand-800 ring-1 ring-slate-300 hover:bg-slate-50">Relancer</button></form>
                      <form action={dismissOneAction.bind(null, f.id)}><button className="rounded px-2 py-1 text-xs text-muted ring-1 ring-slate-200 hover:bg-slate-50">Classer</button></form>
                    </div>
                  </td>
                </tr>
              ))}
              {!d.failures.length ? <tr><td colSpan={5} className="p-6 text-center text-muted">Aucune tâche abandonnée.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold text-ink">Dernières exécutions <span className="text-sm font-normal text-muted">(serveur {d.server})</span></h2>
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-2">Tâche</th><th className="px-3 py-2">Résultat</th><th className="px-3 py-2">Durée</th><th className="px-4 py-2">Date</th></tr>
            </thead>
            <tbody>
              {d.recent.map((r, i) => {
                const [label, cls] = STATUS[r.status];
                return (
                  <tr key={i} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-2">{r.label}</td>
                    <td className="px-3 py-2"><span className={"rounded px-1.5 py-0.5 text-[11px] font-semibold " + cls}>{label}</span>{r.error ? <p className="mt-0.5 text-xs text-muted">{r.error}</p> : null}</td>
                    <td className="px-3 py-2 tabular-nums text-xs">{r.ms} ms</td>
                    <td className="px-4 py-2 text-xs text-muted">{time(r.at)}</td>
                  </tr>
                );
              })}
              {!d.recent.length ? <tr><td colSpan={4} className="p-6 text-center text-muted">Aucune tâche depuis le dernier démarrage de ce serveur.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">Types de tâches : {d.types.map((t) => `${t.label} (${t.attempts} essais)`).join(" · ")}.</p>
      </section>
    </div>
  );
}
