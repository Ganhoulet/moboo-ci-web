import Link from "next/link";
import { TaskCheck } from "@/components/backoffice/am-ui";
import { getAm } from "../actions";

export const dynamic = "force-dynamic";

/** Mes tâches (rappels, relances, visites prévues). */
export default async function AmTasks({ searchParams }: { searchParams: { scope?: string } }) {
  const scope = searchParams.scope === "all" ? "all" : "mine";
  const d = await getAm<{ items: any[] }>(`/tasks?scope=${scope}`);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Tâches indisponibles.</p>;
  const now = Date.now();
  const late = d.items.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < now);
  const next = d.items.filter((t) => !t.dueAt || new Date(t.dueAt).getTime() >= now);
  const List = ({ items }: { items: any[] }) => (
    <ul className="divide-y divide-slate-100 rounded-lg bg-white px-4 ring-1 ring-slate-200">
      {items.map((t) => (
        <li key={t.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
          <TaskCheck id={t.id} done={false} label={<><Link href={`/admin/comptes/${t.kind}/${t.targetId}`} className="font-semibold hover:underline">{t.targetName}</Link> — {t.body}</>} />
          <span className="text-xs text-muted">{t.dueAt ? new Date(t.dueAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "sans date"}{scope === "all" && t.managerName ? ` · ${t.managerName}` : ""}</span>
        </li>
      ))}
      {!items.length ? <li className="py-3 text-sm text-muted">Rien ici.</li> : null}
    </ul>
  );
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-extrabold text-ink">Tâches</h1>
      <div className="flex gap-2 text-sm">
        {[["mine", "Mes tâches"], ["all", "Toute l’équipe"]].map(([k, l]) => <Link key={k} href={`?scope=${k}`} className={"rounded-full px-3 py-1 font-semibold " + (scope === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>)}
      </div>
      <h2 className="font-semibold text-red-700">En retard ({late.length})</h2>
      <List items={late} />
      <h2 className="font-semibold text-ink">À venir ({next.length})</h2>
      <List items={next} />
    </div>
  );
}
