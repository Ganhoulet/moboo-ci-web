import Link from "next/link";
import { getModerationQueue, getModerationSummary, getReports } from "../backoffice-actions";
import { ModerationQueue, ReportsList } from "@/components/backoffice/moderation-queue";

type SP = Record<string, string | undefined>;
const MODE: Record<string, string> = {
  off: "Validation désactivée : les annonces sont publiées immédiatement.",
  new: "Les nouvelles annonces attendent votre validation avant d’être visibles.",
  all: "Les nouvelles annonces et chaque modification attendent votre validation.",
};

/** Back-office → Modération (façon Airbnb / Zillow) : annonces à valider et signalements. */
export default async function ModerationPage({ searchParams }: { searchParams: SP }) {
  const sp = searchParams;
  const tab = sp.tab === "reports" ? "reports" : sp.state && ["changes", "rejected", "suspended", "approved"].includes(sp.state) ? sp.state : "pending";
  const [sum, queue, reports] = await Promise.all([
    getModerationSummary(),
    tab !== "reports" ? getModerationQueue({ state: tab, page: sp.page, q: sp.q }) : Promise.resolve(null),
    tab === "reports" ? getReports({ status: sp.status, page: sp.page }) : Promise.resolve(null),
  ]);
  const tabs: [string, string, number | undefined][] = [
    ["pending", "À valider", sum?.pending], ["changes", "Corrections demandées", sum?.changes], ["rejected", "Refusées", sum?.rejected],
    ["suspended", "Comptes suspendus", sum?.suspended], ["reports", "Signalements", sum?.reports],
  ];
  const data = queue ?? reports;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;
  const pageHref = (p: number) => `/admin/moderation?${new URLSearchParams({ ...(tab === "reports" ? { tab } : { state: tab }), ...(sp.status ? { status: sp.status } : {}), page: String(p) })}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Modération</h1>
          <p className="text-sm text-muted">{MODE[sum?.mode ?? "new"]} <Link href="/admin/moderation/reglages" className="font-semibold text-brand-800 hover:underline">Réglages</Link></p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map(([k, label, n]) => {
          const on = tab === k;
          return (
            <Link key={k} href={k === "reports" ? "/admin/moderation?tab=reports" : `/admin/moderation?state=${k}`}
              className={"-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-semibold " + (on ? "border-brand-700 text-brand-800" : "border-transparent text-slate-500 hover:text-ink")}>
              {label}{n ? <span className={"ml-1.5 rounded-full px-1.5 py-0.5 text-xs " + (k === "pending" || k === "reports" ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-700")}>{n}</span> : null}
            </Link>
          );
        })}
      </div>

      {tab === "reports" ? (
        <div className="flex gap-3 text-sm">
          {[["open", "Ouverts"], ["resolved", "Résolus"], ["dismissed", "Classés sans suite"]].map(([k, l]) => (
            <Link key={k} href={`/admin/moderation?tab=reports&status=${k}`} className={(sp.status ?? "open") === k ? "font-bold text-ink" : "text-brand-800 hover:underline"}>{l}</Link>
          ))}
        </div>
      ) : (
        <form action="/admin/moderation" className="flex gap-2">
          <input type="hidden" name="state" value={tab} />
          <input name="q" defaultValue={sp.q} placeholder="Titre, ville, téléphone" className="h-10 min-w-[14rem] flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm sm:max-w-sm" />
          <button className="h-10 rounded-md border border-brand-700 px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50">Rechercher</button>
        </form>
      )}

      {!data ? (
        <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Impossible de charger la file.</p>
      ) : tab === "reports" ? (
        <ReportsList items={data.items} status={data.status} />
      ) : (
        <ModerationQueue items={data.items} reasons={sum?.rejectReasons ?? []} state={tab} />
      )}

      {data && pages > 1 ? (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{data.total} élément(s) · page {data.page} / {pages}</span>
          <div className="flex gap-2">
            {data.page > 1 ? <Link href={pageHref(data.page - 1)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50">← Précédente</Link> : null}
            {data.page < pages ? <Link href={pageHref(data.page + 1)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50">Suivante →</Link> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
