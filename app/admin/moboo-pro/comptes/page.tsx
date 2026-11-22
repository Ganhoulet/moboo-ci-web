import Link from "next/link";
import { getProAccounts } from "../comptes-actions";
import { ago, Pill, Stat } from "../ui";
import { PLAN_LABEL, ROLE_LABEL } from "./labels";

export const dynamic = "force-dynamic";

const ROLES: [string, string][] = [["", "Tous"], ["agency", "Agences"], ["agent", "Agents"], ["owner", "Propriétaires"], ["tenant", "Locataires"]];
const APPS: [string, string][] = [["", "Tous"], ["1", "Utilisent l’appli"], ["none", "Pas encore l’appli"]];

export default async function ProComptes({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const search = (searchParams.search ?? "").trim();
  const role = searchParams.role ?? "";
  const app = searchParams.app ?? "";
  const page = Number(searchParams.page) || 1;
  const data = await getProAccounts({ search, role, app, page: String(page) });
  if (!data) return <p className="text-muted">Comptes indisponibles (droit « Application » requis).</p>;
  const pages = Math.max(1, Math.ceil(data.total / data.perPage));
  const qs = (o: Record<string, string>) => "/admin/moboo-pro/comptes?" + new URLSearchParams(Object.entries({ search, role, app, ...o }).filter(([, v]) => v)).toString();
  const s = data.stats;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Moboo Pro › Comptes</h1>
          <p className="max-w-3xl text-sm text-muted">
            Tous les comptes de l’application Moboo Pro : rechercher, suspendre, changer le rôle ou le forfait, envoyer une notification.
            Remplace la console de l’extension WordPress « Moboo Super Admin ».
          </p>
        </div>
        <Link href="/admin/moboo-pro/notifications" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white">Envoyer une notification</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Comptes" value={s.total_users.toLocaleString("fr-FR")} />
        <Stat label="Agences" value={s.total_agencies.toLocaleString("fr-FR")} hint={`${s.total_agents.toLocaleString("fr-FR")} agents`} />
        <Stat label="Propriétaires" value={s.total_owners.toLocaleString("fr-FR")} hint={`${s.total_tenants.toLocaleString("fr-FR")} locataires`} />
        <Stat label="Sur l’appli" value={s.app_active_users.toLocaleString("fr-FR")} />
        <Stat label="Forfaits payants" value={s.active_subscriptions} />
        <Stat label="Revenu mensuel" value={`${s.monthly_revenue.toLocaleString("fr-FR")} F`} hint="forfaits en cours" />
      </div>

      <form className="flex flex-wrap gap-2" action="/admin/moboo-pro/comptes">
        {role ? <input type="hidden" name="role" value={role} /> : null}
        {app ? <input type="hidden" name="app" value={app} /> : null}
        <input name="search" defaultValue={search} placeholder="Nom, identifiant, e-mail, téléphone, société…" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white">Rechercher</button>
      </form>
      <div className="flex flex-wrap gap-2 text-sm">
        {ROLES.map(([k, l]) => <Link key={k} href={qs({ role: k, page: "" })} className={"rounded-full px-3 py-1 font-semibold " + (role === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>)}
        <span className="mx-1 text-slate-300">|</span>
        {APPS.map(([k, l]) => <Link key={k} href={qs({ app: k, page: "" })} className={"rounded-full px-3 py-1 font-semibold " + (app === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>)}
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {data.items.length ? (
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="border-b border-slate-200 text-left">
              <tr><th className="px-4 py-3">Compte</th><th className="px-4 py-3">Rôle</th><th className="px-4 py-3">Forfait</th><th className="px-4 py-3">État</th><th className="px-4 py-3">Appli</th><th className="px-4 py-3">Dernière connexion</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/moboo-pro/comptes/${a.id}`} className="font-semibold text-brand-800 hover:underline">{a.display_name || `Compte ${a.id}`}</Link>
                    <span className="block text-xs text-muted">{[a.email, a.phone].filter(Boolean).join(" · ") || "—"}</span>
                  </td>
                  <td className="px-4 py-2.5"><Pill tone={a.role === "administrator" ? "blue" : "slate"}>{ROLE_LABEL[a.role] ?? a.role}</Pill></td>
                  <td className="px-4 py-2.5 text-xs">{PLAN_LABEL[a.plan] ?? a.plan}{a.expires_at && a.plan !== "starter" ? <span className="block text-muted">jusqu’au {new Date(a.expires_at).toLocaleDateString("fr-FR")}</span> : null}</td>
                  <td className="px-4 py-2.5">{a.suspended ? <Pill tone="red">Suspendu</Pill> : <Pill tone="green">Actif</Pill>}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{a.app_last_seen ? ago(a.app_last_seen) : a.app_active ? "oui" : "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{a.last_login ? ago(a.last_login) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="p-8 text-center text-sm text-muted">Aucun compte{search ? ` pour « ${search} »` : ""}.</p>}
      </div>

      {pages > 1 ? (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 ? <Link href={qs({ page: String(page - 1) })} className="rounded bg-white px-3 py-1.5 ring-1 ring-slate-200">← Précédent</Link> : null}
          <span className="px-2 py-1.5 text-muted">Page {page} / {pages} · {data.total.toLocaleString("fr-FR")} compte(s)</span>
          {page < pages ? <Link href={qs({ page: String(page + 1) })} className="rounded bg-white px-3 py-1.5 ring-1 ring-slate-200">Suivant →</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
