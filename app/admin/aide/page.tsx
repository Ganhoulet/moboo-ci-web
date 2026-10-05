import Link from "next/link";
import { listHelp } from "./actions";

export const dynamic = "force-dynamic";

const STATUS: Record<string, [string, string]> = {
  published: ["Publié", "bg-emerald-100 text-emerald-700"], draft: ["Brouillon", "bg-slate-100 text-slate-600"], archived: ["Archivé", "bg-slate-200 text-slate-500"],
};

/** Back-office → Centre d'aide : articles par public, lectures, avis, recherches. */
export default async function HelpAdmin({ searchParams }: { searchParams: { public?: string } }) {
  const d = await listHelp();
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Centre d’aide indisponible.</p>;
  const filter = searchParams.public ?? "";
  const items = d.items.filter((i) => !filter || i.audience === filter);
  const views = d.items.reduce((n, i) => n + i.views, 0);
  const yes = d.items.reduce((n, i) => n + i.helpfulYes, 0);
  const no = d.items.reduce((n, i) => n + i.helpfulNo, 0);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Centre d’aide</h1>
          <p className="max-w-3xl text-sm text-muted">Guides pas à pas et questions fréquentes de <a href="/aide" target="_blank" className="font-semibold text-brand-700 underline">moboo.ci/aide</a>, rangés par public. Les articles fournis avec le site peuvent être modifiés puis restaurés à tout moment.</p>
        </div>
        <Link href="/admin/aide/nouveau" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Nouvel article</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Articles publiés", d.items.filter((i) => i.status === "published").length], ["Lectures", views.toLocaleString("fr-FR")], ["Avis « utile »", yes + no ? `${Math.round((yes / (yes + no)) * 100)} %` : "—"], ["Recherches sans résultat", d.searches.empty.length]].map(([l, v]) => (
          <div key={String(l)} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{l}</p><p className="mt-1 font-display text-2xl font-extrabold text-ink">{v}</p></div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/admin/aide" className={"rounded-full px-3 py-1 font-semibold " + (!filter ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>Tous</Link>
            {d.audiences.map((a) => <Link key={a.key} href={`/admin/aide?public=${a.key}`} className={"rounded-full px-3 py-1 font-semibold " + (filter === a.key ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{a.title}</Link>)}
          </div>
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-2">Article</th><th className="px-3 py-2">Public</th><th className="px-3 py-2">Statut</th><th className="px-3 py-2 text-right">Lectures</th><th className="px-3 py-2 text-right">Utile</th></tr>
              </thead>
              <tbody>
                {items.map((i) => {
                  const [l, c] = STATUS[i.status] ?? STATUS.draft;
                  const votes = i.helpfulYes + i.helpfulNo;
                  return (
                    <tr key={i.id} className="border-t border-slate-100">
                      <td className="px-4 py-2">
                        <Link href={`/admin/aide/${i.id}`} className="font-semibold text-ink hover:underline">{i.kind === "faq" ? "❓ " : "📘 "}{i.title}</Link>
                        <p className="text-xs text-muted">{i.kind === "faq" ? "Question fréquente" : i.category || "Guide"}{i.builtin ? " · d’origine" : ""}</p>
                      </td>
                      <td className="px-3 py-2 text-xs">{d.audiences.find((a) => a.key === i.audience)?.title ?? i.audience}</td>
                      <td className="px-3 py-2"><span className={"rounded px-1.5 py-0.5 text-[11px] font-semibold " + c}>{l}</span></td>
                      <td className="px-3 py-2 text-right tabular-nums">{i.views}</td>
                      <td className={"px-3 py-2 text-right tabular-nums " + (votes >= 5 && i.helpfulNo > i.helpfulYes ? "font-semibold text-red-600" : "")}>{votes ? `${Math.round((i.helpfulYes / votes) * 100)} % (${votes})` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recherches sans résultat · 60 j</p>
            <p className="mt-1 text-xs text-muted">Ce que les visiteurs cherchent et ne trouvent pas : de bonnes idées d’articles.</p>
            <ul className="mt-2 space-y-1 text-sm">{d.searches.empty.length ? d.searches.empty.map((s) => <li key={s.q} className="flex justify-between gap-2"><span className="truncate">« {s.q} »</span><span className="text-xs text-muted">{s.count}×</span></li>) : <li className="text-muted">Aucune pour l’instant.</li>}</ul>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recherches les plus fréquentes</p>
            <ul className="mt-2 space-y-1 text-sm">{d.searches.top.length ? d.searches.top.map((s) => <li key={s.q} className="flex justify-between gap-2"><span className="truncate">« {s.q} »</span><span className="text-xs text-muted">{s.count}× · {s.results} rés.</span></li>) : <li className="text-muted">Aucune pour l’instant.</li>}</ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
