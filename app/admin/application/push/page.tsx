import { AppPushForm } from "@/components/app-push-form";
import { getAdminSettings } from "../../actions";
import { getPushHistory } from "../actions";

export const dynamic = "force-dynamic";

export default async function Push() {
  const [settings, history] = await Promise.all([getAdminSettings(), getPushHistory()]);
  const o = (settings?.values.mobile_app ?? {}) as Record<string, unknown>;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Notifications push</h1>
        <p className="text-sm text-muted">Envoyées aux téléphones via OneSignal (le service déjà utilisé par l’application).</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <AppPushForm configured={!!(o.onesignalAppId && o.onesignalRestKey)} />
        <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <h2 className="border-b border-slate-100 px-4 py-3 font-semibold text-ink">Historique</h2>
          {history.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {history.map((p) => (
                <li key={p.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{p.title}</p>
                    <span className="text-xs text-muted">{new Date(p.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </div>
                  <p className="text-slate-600">{p.body}</p>
                  <p className="mt-1 text-xs">{p.error ? <span className="text-red-600">Échec : {p.error}</span> : <span className="text-emerald-700">Envoyée{p.recipients != null ? ` · ${p.recipients} appareil(s)` : ""}</span>}</p>
                </li>
              ))}
            </ul>
          ) : <p className="p-6 text-center text-sm text-muted">Aucune notification envoyée.</p>}
        </section>
      </div>
    </div>
  );
}
