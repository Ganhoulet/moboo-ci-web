import Link from "next/link";
import { ADMIN_DISPUTE_LABEL, DisputePill, fcfa } from "@/components/booking-ui";
import { listAdminDisputes } from "./actions";

export const dynamic = "force-dynamic";

const TABS: [string, string][] = [["open", "À traiter"], ["awaiting_host", "Attente hôte"], ["awaiting_guest", "Attente client"], ["resolved", "Résolus"], ["rejected", "Sans suite"], ["withdrawn", "Retirés"], ["", "Tous"]];
const OPEN = ["open", "awaiting_host", "awaiting_guest", "review"];

/** Back-office → Litiges : médiation entre clients et hôtes. */
export default async function AdminDisputes({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const status = searchParams.status ?? "open";
  const data = await listAdminDisputes({ status, page: searchParams.page });
  const c = data?.counts ?? {};
  const count = (k: string) => (k === "open" ? OPEN.reduce((s, x) => s + (c[x] ?? 0), 0) : k ? c[k] ?? 0 : Object.values(c).reduce((s, n) => s + n, 0));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Litiges</h1>
          <p className="text-sm text-muted">Problèmes signalés par les clients après une réservation. Pendant un litige, le reversement de l’acompte à l’hôte est gelé.</p>
        </div>
        <Link href="/admin/litiges/reglages" className="text-sm font-semibold text-brand-800 hover:underline">Réglages →</Link>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {TABS.map(([k, l]) => (
          <Link key={k || "all"} href={`/admin/litiges?status=${k}`} className={"rounded-full px-3.5 py-1.5 font-semibold " + (status === k ? "bg-brand-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200")}>
            {l} <span className="opacity-70">({count(k)})</span>
          </Link>
        ))}
      </div>
      {data?.items.length ? (
        <div className="space-y-2">
          {data.items.map((d) => (
            <Link key={d.id} href={`/admin/litiges/${d.id}`} className="flex flex-wrap items-start gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-brand-300">
              <div className="min-w-[16rem] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500">{d.number}</span>
                  <DisputePill status={d.status} label={ADMIN_DISPUTE_LABEL[d.status] ?? d.statusLabel} />
                  {d.overdue ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 ring-1 ring-red-200">⏰ Délai dépassé</span> : null}
                  {d.escrowFrozen && d.open ? <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-800 ring-1 ring-violet-200">❄ Reversement gelé</span> : null}
                </div>
                <p className="mt-1 font-semibold text-ink">{d.categoryLabel}</p>
                <p className="text-sm text-slate-600">{d.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{d.description}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-medium text-ink">{d.guest?.name ?? "—"}</p>
                <p className="text-xs text-muted">{d.guest?.phone}</p>
                <p className="mt-1 text-xs text-slate-600">Demande : {d.desiredOutcomeLabel}{d.amountClaimed ? ` · ${fcfa(d.amountClaimed)}` : ""}</p>
                <p className="text-xs text-muted">Mis à jour {new Date(d.updatedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : <p className="rounded-lg bg-white p-8 text-center text-sm text-muted shadow-sm ring-1 ring-slate-200">Aucun litige.</p>}
    </div>
  );
}
