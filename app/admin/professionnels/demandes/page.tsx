import Link from "next/link";
import { ProLeadRow } from "@/components/backoffice/pro-lead-row";
import { listProLeads } from "./actions";

export const dynamic = "force-dynamic";

const TABS: [string, string][] = [["", "Toutes"], ["new", "Nouvelles"], ["contacted", "Contactées"], ["won", "Inscrites / gagnées"], ["lost", "Sans suite"]];

/** Back-office → Espace professionnels → Demandes de rappel. */
export default async function ProLeads({ searchParams }: { searchParams: { statut?: string } }) {
  const st = searchParams.statut ?? "";
  const d = await listProLeads(st);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Demandes indisponibles.</p>;
  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/professionnels" className="text-sm text-brand-700 hover:underline">← Espace professionnels</Link>
        <h1 className="font-display text-2xl font-extrabold text-ink">Demandes de rappel</h1>
        <p className="text-sm text-muted">Professionnels qui ont demandé à être rappelés depuis les pages pros. Les administrateurs sont aussi prévenus par e-mail.</p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {TABS.map(([k, l]) => (
          <Link key={k} href={k ? `/admin/professionnels/demandes?statut=${k}` : "/admin/professionnels/demandes"} className={"rounded-full px-3 py-1 font-semibold " + (st === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>
            {l}{k && d.counts[k] ? ` (${d.counts[k]})` : ""}
          </Link>
        ))}
      </div>
      <div className="space-y-3">
        {d.items.map((l) => <ProLeadRow key={l.id} lead={l} audiences={d.audiences} />)}
        {!d.items.length ? <p className="rounded-lg bg-white p-6 text-center text-sm text-muted ring-1 ring-slate-200">Aucune demande.</p> : null}
      </div>
    </div>
  );
}
