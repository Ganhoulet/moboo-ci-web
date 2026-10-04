import Link from "next/link";
import { ADMIN_DISPUTE_LABEL, DisputePill, StagePill, fcfa } from "@/components/booking-ui";
import { listAdminBookings } from "../litiges/actions";

export const dynamic = "force-dynamic";

const STAGES: [string, string][] = [["", "Toutes"], ["requested", "En attente de l’hôte"], ["accepted", "Acompte à payer"], ["confirmed", "Confirmées"], ["ongoing", "En cours"], ["completed", "Terminées"], ["cancelled", "Annulées"]];
const KINDS: [string, string][] = [["", "Séjours et espaces"], ["stay", "Séjours meublés"], ["event", "Espaces"]];
const ESCROW: Record<string, string> = { PENDING: "en attente", HELD: "séquestré", RELEASED: "versé", PARTIALLY_RELEASED: "versé en partie", REFUNDED: "remboursé", FAILED: "échoué" };
const short = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

/** Back-office → Réservations : toutes les réservations faites sur Moboo.ci (séjours Moboo Resi, espaces Moboo Event). */
export default async function AdminBookings({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const kind = searchParams.kind ?? "";
  const stage = searchParams.stage ?? "";
  const q = searchParams.q ?? "";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const data = await listAdminBookings({ kind, stage, q, page: String(page) });
  const link = (o: Record<string, string>) => `/admin/reservations?${new URLSearchParams({ ...(kind ? { kind } : {}), ...(stage ? { stage } : {}), ...(q ? { q } : {}), ...o }).toString()}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Réservations</h1>
          <p className="text-sm text-muted">Demandes faites sur le site : l’hôte les accepte dans Moboo Resi ou Moboo Event. L’acompte payé en ligne est conservé par Moboo jusqu’à l’arrivée du client.</p>
        </div>
        <Link href="/admin/litiges" className="text-sm font-semibold text-brand-800 hover:underline">Litiges →</Link>
      </div>
      <form className="flex flex-wrap items-center gap-2" action="/admin/reservations">
        {kind ? <input type="hidden" name="kind" value={kind} /> : null}
        {stage ? <input type="hidden" name="stage" value={stage} /> : null}
        <input name="q" defaultValue={q} placeholder="Téléphone, nom du client ou référence" className="w-72 rounded-md border-slate-300 text-sm" />
        <button className="rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white">Rechercher</button>
      </form>
      <div className="flex flex-wrap gap-4 text-sm">
        {KINDS.map(([k, l]) => <Link key={k || "all"} href={link({ kind: k })} className={kind === k ? "font-bold text-ink" : "text-brand-800 hover:underline"}>{l}</Link>)}
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {STAGES.map(([k, l]) => (
          <Link key={k || "all"} href={link({ stage: k })} className={"rounded-full px-3.5 py-1.5 font-semibold " + (stage === k ? "bg-brand-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200")}>{l}</Link>
        ))}
      </div>

      {data?.items.length ? (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full min-w-[64rem] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-2.5">Réservation</th><th className="px-2 py-2.5">Client</th><th className="px-2 py-2.5">Hôte</th><th className="px-2 py-2.5">Dates</th><th className="px-2 py-2.5">État</th><th className="px-2 py-2.5 text-right">Montant</th><th className="px-4 py-2.5">Acompte en ligne</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((b) => (
                <tr key={b.key} className="align-top">
                  <td className="px-4 py-2.5">
                    {b.href ? <Link href={b.href} target="_blank" className="font-medium text-ink hover:underline">{b.title}</Link> : <span className="font-medium text-ink">{b.title}</span>}
                    <span className="block text-xs text-muted">{b.kind === "stay" ? "Séjour" : "Espace"} · {b.ref} · {b.place}</span>
                  </td>
                  <td className="px-2 py-2.5">{b.guest.name || "—"}<span className="block text-xs text-muted">{b.guest.phone}</span></td>
                  <td className="px-2 py-2.5">{b.host.name ?? "—"}{b.host.phone ? <span className="block text-xs text-muted">{b.host.phone}</span> : null}</td>
                  <td className="px-2 py-2.5 whitespace-nowrap">{short(b.start)}{b.end !== b.start ? ` → ${short(b.end)}` : ""}<span className="block text-xs text-muted">{b.nights ? `${b.nights} nuit(s) · ` : ""}{b.guests} pers.</span></td>
                  <td className="px-2 py-2.5"><StagePill stage={b.stage} label={b.stageLabel} />{b.dispute ? <Link href={`/admin/litiges/${b.dispute.id}`} className="mt-1 block"><DisputePill status={b.dispute.status} label={`${b.dispute.number} · ${ADMIN_DISPUTE_LABEL[b.dispute.status] ?? ""}`} /></Link> : null}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{b.amount ? fcfa(b.amount) : "—"}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {b.escrow ? <>
                      <span className="font-semibold text-ink">{fcfa(b.escrow.amount)}</span> {ESCROW[b.escrow.status] ?? b.escrow.status}
                      {b.escrow.payoutStatus === "DISPUTED" ? <span className="mt-0.5 block font-semibold text-violet-800">❄ reversement gelé (litige)</span> : null}
                    </> : <span className="text-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="rounded-lg bg-white p-8 text-center text-sm text-muted shadow-sm ring-1 ring-slate-200">Aucune réservation.</p>}
      {data && data.total > data.perPage ? (
        <div className="flex justify-between text-sm">
          {page > 1 ? <Link href={link({ page: String(page - 1) })} className="text-brand-800 hover:underline">← Précédentes</Link> : <span />}
          {page * data.perPage < data.total ? <Link href={link({ page: String(page + 1) })} className="text-brand-800 hover:underline">Suivantes →</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
