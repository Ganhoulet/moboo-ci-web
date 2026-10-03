import Link from "next/link";
import { listUsers } from "../backoffice-actions";
import { Avatar, Pill, TYPE_LABEL, ago, fmtDate } from "@/components/backoffice/ui";

type SP = Record<string, string | undefined>;
const STATUS_TABS = [
  { key: "", label: "Tous" }, { key: "active", label: "Actifs" }, { key: "suspended", label: "Suspendus" }, { key: "banned", label: "Bannis" },
  { key: "deleting", label: "Suppression en cours" }, { key: "deleted", label: "Supprimés" },
];

/** Back-office → Utilisateurs (façon WordPress « Tous les utilisateurs »). */
export default async function AdminUsersPage({ searchParams }: { searchParams: SP }) {
  const sp = searchParams;
  const data = await listUsers(sp);
  const href = (patch: SP) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, page: undefined, ...patch })) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/utilisateurs${s ? `?${s}` : ""}`;
  };
  const statusCounts = data?.counts.status ?? {};
  const all = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;
  const field = "h-10 rounded-md border border-slate-300 bg-white px-3 text-sm";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Utilisateurs</h1>
        <p className="text-sm text-muted">Tous les comptes du site : ouvrez une fiche pour voir l’historique complet, suspendre, bannir ou ajouter une note interne.</p>
      </div>

      <div className="flex flex-wrap gap-x-1 gap-y-2 text-sm">
        {STATUS_TABS.map((t, i) => {
          const on = (sp.status ?? "") === t.key;
          return (
            <span key={t.key} className="inline-flex items-center">
              {i ? <span className="mx-1 text-slate-300">|</span> : null}
              <Link href={href({ status: t.key || undefined })} className={on ? "font-bold text-ink" : "text-brand-800 hover:underline"}>{t.label}</Link>
              <span className="ml-1 text-slate-500">({t.key ? statusCounts[t.key] ?? 0 : all})</span>
            </span>
          );
        })}
      </div>

      <form className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200" action="/admin/utilisateurs">
        {sp.status ? <input type="hidden" name="status" value={sp.status} /> : null}
        <input name="q" defaultValue={sp.q} placeholder="Nom, téléphone, e-mail, identifiant, n° de compte" className={field + " min-w-[14rem] flex-1"} />
        <select name="type" defaultValue={sp.type ?? ""} className={field}>
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v} ({data?.counts.type[k] ?? 0})</option>)}
        </select>
        <select name="verified" defaultValue={sp.verified ?? ""} className={field}>
          <option value="">Vérifiés ou non</option><option value="1">Vérifiés</option><option value="0">Non vérifiés</option>
        </select>
        <select name="sort" defaultValue={sp.sort ?? ""} className={field}>
          <option value="">Plus récents</option><option value="login">Dernière connexion</option><option value="name">Nom</option>
        </select>
        <label className="inline-flex items-center gap-1.5 text-sm"><input type="checkbox" name="admin" value="1" defaultChecked={sp.admin === "1"} /> Administrateurs</label>
        <button className="h-10 rounded-md border border-brand-700 px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50">Filtrer</button>
        {Object.keys(sp).length ? <Link href="/admin/utilisateurs" className="text-sm text-slate-500 hover:underline">Réinitialiser</Link> : null}
      </form>

      {!data ? (
        <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Impossible de charger les utilisateurs.</p>
      ) : data.items.length ? (
        <>
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Compte</th>
                  <th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 font-semibold">Annonces</th>
                  <th className="px-4 py-2.5 font-semibold">Statut</th>
                  <th className="px-4 py-2.5 font-semibold">Inscrit</th>
                  <th className="px-4 py-2.5 font-semibold">Dernière connexion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/utilisateurs/${u.id}`} className="flex items-center gap-3">
                        <Avatar name={u.name} url={u.avatarUrl} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 font-semibold text-brand-800 hover:underline">
                            {u.name || u.phone}
                            {u.verified ? <span title="Compte vérifié" className="text-sky-600">✔</span> : null}
                            {u.isAdmin ? <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Admin</span> : null}
                          </span>
                          <span className="block truncate text-xs text-muted">{u.phone}{u.email ? ` · ${u.email}` : ""}{u.username ? ` · @${u.username}` : ""}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{TYPE_LABEL[u.accountType] ?? u.accountType}{u.companyName ? <span className="block text-xs text-muted">{u.companyName}</span> : null}</td>
                    <td className="px-4 py-3 text-slate-600">{u.listings}</td>
                    <td className="px-4 py-3"><Pill s={u.status} /></td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-600">{ago(u.lastLoginAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{data.total.toLocaleString("fr-FR")} compte(s) · page {data.page} / {pages}</span>
            <div className="flex gap-2">
              {data.page > 1 ? <Link href={href({ page: String(data.page - 1) })} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50">← Précédente</Link> : null}
              {data.page < pages ? <Link href={href({ page: String(data.page + 1) })} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50">Suivante →</Link> : null}
            </div>
          </div>
        </>
      ) : (
        <p className="rounded-lg bg-white p-8 text-center text-sm text-muted ring-1 ring-slate-200">Aucun compte ne correspond.</p>
      )}
    </div>
  );
}
