import Link from "next/link";
import { getAm } from "../actions";

export const dynamic = "force-dynamic";

const KINDS: [string, string][] = [["org", "Résidences"], ["event", "Espaces"], ["site", "Annonceurs et membres"]];
const date = (d?: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" }) : "—");

/** Portefeuille : comptes suivis, indicateurs de santé, dernier contact, prochaine tâche. */
export default async function AmPortfolio({ searchParams }: { searchParams: { kind?: string; scope?: string; q?: string; page?: string; manager?: string; flag?: string } }) {
  const kind = KINDS.some(([k]) => k === searchParams.kind) ? searchParams.kind! : "org";
  const qs = new URLSearchParams({ kind, scope: searchParams.scope ?? "mine", q: searchParams.q ?? "", page: searchParams.page ?? "1", manager: searchParams.manager ?? "", flag: searchParams.flag ?? "" });
  const [d, managers] = await Promise.all([getAm<any>(`/portfolio?${qs}`), getAm<{ id: string; name: string; accounts: number }[]>("/managers")]);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Portefeuille indisponible.</p>;
  const link = (p: Record<string, string>) => `?${new URLSearchParams({ kind, scope: d.scope, ...(searchParams.q ? { q: searchParams.q } : {}), ...(d.scope === "manager" && searchParams.manager ? { manager: searchParams.manager } : {}), ...p })}`;
  const scopes: [string, string][] = [["mine", "Mon portefeuille"], ["unassigned", "Sans account manager"], ...(d.canSeeAll ? [["all", "Tous les comptes"] as [string, string]] : [])];
  const pages = Math.max(1, Math.ceil(d.total / d.perPage));
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Portefeuille</h1>
        <p className="max-w-3xl text-sm text-muted">Les comptes que vous suivez, avec leurs signaux d’alerte : réservations à confirmer, annulations, demandes sans suite, annonces hors ligne, comptes jamais contactés ou inactifs.</p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {KINDS.map(([k, l]) => <Link key={k} href={`?${new URLSearchParams({ kind: k, scope: d.scope })}`} className={"rounded-full px-3 py-1 font-semibold " + (kind === k ? "bg-brand-800 text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>)}
        <span className="mx-1 text-slate-300">|</span>
        {scopes.map(([k, l]) => <Link key={k} href={link({ scope: k, page: "1" })} className={"rounded-full px-3 py-1 font-semibold " + (d.scope === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>)}
      </div>
      <form className="flex flex-wrap gap-2">
        <input type="hidden" name="kind" value={kind} /><input type="hidden" name="scope" value={d.scope} />
        {d.scope === "manager" ? <input type="hidden" name="manager" value={searchParams.manager ?? ""} /> : null}
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Nom, téléphone, e-mail, ville…" className="w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
        <select name="flag" defaultValue={searchParams.flag ?? ""} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" aria-label="Signal">
          <option value="">Tous les signaux</option>
          <option value="confirmer">Réservations à confirmer</option>
          <option value="jamais">Jamais contacté</option>
          <option value="contact depuis">Pas de contact récent</option>
          <option value="inactif">Inactif</option>
          <option value="annonce">Aucune annonce en ligne</option>
          <option value="demande">Demandes sans suite</option>
          <option value="annulations">Beaucoup d’annulations</option>
        </select>
        <button className="rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-white">Filtrer</button>
        {d.canSeeAll && managers?.length ? (
          <span className="ml-auto flex flex-wrap items-center gap-1 text-xs text-muted">Par account manager :
            {managers.map((m) => <Link key={m.id} href={`?${new URLSearchParams({ kind, scope: "manager", manager: m.id })}`} className="rounded-full bg-white px-2 py-0.5 font-semibold text-ink ring-1 ring-slate-300">{m.name} ({m.accounts})</Link>)}
          </span>
        ) : null}
      </form>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
            <tr><th className="p-3">Compte</th><th className="p-3">Contact</th><th className="p-3">Indicateurs</th><th className="p-3">Signaux</th><th className="p-3">Dernier contact</th><th className="p-3">Prochaine tâche</th><th className="p-3">Account manager</th></tr>
          </thead>
          <tbody>
            {d.items.map((a: any) => (
              <tr key={a.id} className="border-t border-slate-100 align-top">
                <td className="p-3"><Link href={`/admin/comptes/${a.kind}/${a.id}`} className="font-semibold text-brand-800 hover:underline">{a.name}</Link><br /><span className="text-xs text-muted">{a.sub}</span></td>
                <td className="p-3 text-xs">{a.phone ? <a href={`tel:${a.phone}`} className="text-brand-700">{a.phone}</a> : "—"}{a.whatsapp ? <> · <a href={`https://wa.me/${String(a.whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-emerald-700">WhatsApp</a></> : null}<br /><span className="text-muted">Connexion : {date(a.lastLoginAt)}</span></td>
                <td className="p-3 text-xs">{Object.entries(a.stats).map(([k, v]) => <span key={k} className="mr-2 inline-block">{({ listings: "Annonces", inquiries: "Demandes", pending: "À confirmer", bookings30: "Résa 30 j", cancelled30: "Annul. 30 j" } as Record<string, string>)[k] ?? k} : <b>{String(v)}</b></span>)}</td>
                <td className="p-3">{a.flags.map((f: string) => <span key={f} className={"mb-1 mr-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold " + (/confirmer|annulations/i.test(f) ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800")}>{f}</span>)}</td>
                <td className="p-3 text-xs">{date(a.lastContactAt)}</td>
                <td className="p-3 text-xs">{a.nextTask ? <>{date(a.nextTask.dueAt)}<br /><span className="text-muted">{a.nextTask.body}</span></> : "—"}</td>
                <td className="p-3 text-xs">{a.managerName ?? <span className="text-muted">—</span>}</td>
              </tr>
            ))}
            {!d.items.length ? <tr><td colSpan={7} className="p-6 text-center text-muted">Aucun compte.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {pages > 1 ? (
        <div className="flex items-center gap-2 text-sm">
          {d.page > 1 ? <Link href={link({ page: String(d.page - 1) })} className="rounded-md bg-white px-3 py-1 ring-1 ring-slate-300">← Précédent</Link> : null}
          <span className="text-muted">Page {d.page} / {pages} · {d.total} comptes</span>
          {d.page < pages ? <Link href={link({ page: String(d.page + 1) })} className="rounded-md bg-white px-3 py-1 ring-1 ring-slate-300">Suivant →</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
