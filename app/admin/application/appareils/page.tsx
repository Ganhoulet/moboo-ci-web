import Link from "next/link";
import { getAppDevices } from "../actions";

export const dynamic = "force-dynamic";

const ago = (d: string) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  return m < 1 ? "à l’instant" : m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : new Date(d).toLocaleDateString("fr-FR");
};

export default async function Devices({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const online = searchParams.online === "1";
  const page = Number(searchParams.page) || 1;
  const data = await getAppDevices({ online: online ? "1" : undefined, page: String(page) });
  const pages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Appareils</h1>
          <p className="text-sm text-muted">{data?.total ?? 0} appareil(s){online ? " en ligne (5 dernières minutes)" : ""}.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/application/appareils" className={"rounded-full px-3.5 py-1.5 font-semibold " + (!online ? "bg-brand-700 text-white" : "bg-white ring-1 ring-slate-200")}>Tous</Link>
          <Link href="/admin/application/appareils?online=1" className={"rounded-full px-3.5 py-1.5 font-semibold " + (online ? "bg-brand-700 text-white" : "bg-white ring-1 ring-slate-200")}>En ligne</Link>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {data?.items.length ? (
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="border-b border-slate-200 text-left"><tr><th className="px-4 py-3">Appareil</th><th className="px-4 py-3">Version</th><th className="px-4 py-3">Compte</th><th className="px-4 py-3 text-right">Sessions</th><th className="px-4 py-3">Installée</th><th className="px-4 py-3">Dernière activité</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-2">
                      <span className={"h-2 w-2 rounded-full " + (d.online ? "bg-emerald-500" : "bg-slate-300")} aria-label={d.online ? "En ligne" : "Hors ligne"} />
                      <span className="font-semibold text-ink">{d.platform === "ios" ? "iOS" : d.platform === "android" ? "Android" : "—"}</span>
                      <span className="text-xs text-muted">{d.model ?? d.osVersion ?? ""}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{d.appVersion ?? "—"}</td>
                  <td className="px-4 py-2.5">{d.account ? <>{d.account.name}<p className="text-xs text-muted">{d.account.phone}</p></> : d.wpUserId ? <span className="text-xs text-slate-600">WordPress #{d.wpUserId}</span> : <span className="text-xs text-muted">Visiteur</span>}</td>
                  <td className="px-4 py-2.5 text-right">{d.sessions}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{new Date(d.firstSeenAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-2.5 text-xs">{ago(d.lastSeenAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="p-8 text-center text-sm text-muted">Aucun appareil{online ? " en ligne" : ""}.</p>}
      </div>
      {pages > 1 ? (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 ? <Link href={`/admin/application/appareils?${online ? "online=1&" : ""}page=${page - 1}`} className="rounded bg-white px-3 py-1.5 ring-1 ring-slate-200">← Précédent</Link> : null}
          <span className="px-2 py-1.5 text-muted">Page {page} / {pages}</span>
          {page < pages ? <Link href={`/admin/application/appareils?${online ? "online=1&" : ""}page=${page + 1}`} className="rounded bg-white px-3 py-1.5 ring-1 ring-slate-200">Suivant →</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
