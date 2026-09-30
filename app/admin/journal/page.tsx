import Link from "next/link";
import { getAudit } from "../backoffice-actions";
import { AuditList } from "@/components/backoffice/audit-list";
import { ACTION_LABEL } from "@/components/backoffice/ui";

type SP = Record<string, string | undefined>;

/** Back-office → Journal d'activité (façon WP Activity Log) : qui a fait quoi, quand, avant → après. */
export default async function JournalPage({ searchParams }: { searchParams: SP }) {
  const sp = searchParams;
  const data = await getAudit(sp);
  const href = (patch: SP) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, page: undefined, ...patch })) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/journal${s ? `?${s}` : ""}`;
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;
  const field = "h-10 rounded-md border border-slate-300 bg-white px-3 text-sm";

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Journal d’activité</h1>
        <p className="text-sm text-muted">Chaque modification faite dans le back-office est enregistrée : auteur, date, adresse IP et valeurs « avant → après ». Les connexions des administrateurs y figurent aussi.</p>
      </div>

      <form className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200" action="/admin/journal">
        <input name="q" defaultValue={sp.q} placeholder="Rechercher (annonce, numéro, réglage…)" className={field + " min-w-[12rem] flex-1"} />
        <select name="actor" defaultValue={sp.actor ?? ""} className={field}>
          <option value="">Tous les membres</option>
          {data?.actors.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.count})</option>)}
        </select>
        <select name="entityType" defaultValue={sp.entityType ?? ""} className={field}>
          <option value="">Tous les éléments</option>
          {data?.entityTypes.map((t) => <option key={t.key} value={t.key}>{ACTION_LABEL[t.key] ?? t.key} ({t.count})</option>)}
        </select>
        <label className="inline-flex items-center gap-1 text-sm text-slate-600">Du <input type="date" name="from" defaultValue={sp.from} className={field} /></label>
        <label className="inline-flex items-center gap-1 text-sm text-slate-600">au <input type="date" name="to" defaultValue={sp.to} className={field} /></label>
        <button className="h-10 rounded-md border border-brand-700 px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50">Filtrer</button>
        {Object.keys(sp).length ? <Link href="/admin/journal" className="text-sm text-slate-500 hover:underline">Réinitialiser</Link> : null}
      </form>

      {!data ? (
        <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Impossible de charger le journal.</p>
      ) : (
        <>
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
            <AuditList items={data.items} />
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{data.total.toLocaleString("fr-FR")} action(s) · page {data.page} / {pages}</span>
            <div className="flex gap-2">
              {data.page > 1 ? <Link href={href({ page: String(data.page - 1) })} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50">← Plus récentes</Link> : null}
              {data.page < pages ? <Link href={href({ page: String(data.page + 1) })} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50">Plus anciennes →</Link> : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
