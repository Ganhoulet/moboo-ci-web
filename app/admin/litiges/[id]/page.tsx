import Link from "next/link";
import { notFound } from "next/navigation";
import { ADMIN_DISPUTE_LABEL, DisputePill, StagePill, fcfa, frDay } from "@/components/booking-ui";
import { DisputePanel } from "@/components/backoffice/dispute-panel";
import { getAdminDispute } from "../actions";

export const dynamic = "force-dynamic";
const when = (d: string) => new Date(d).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
const ESCROW: Record<string, string> = { PENDING: "en attente de paiement", HELD: "séquestré chez Moboo", RELEASED: "versé à l’hôte", PARTIALLY_RELEASED: "versé en partie", REFUNDED: "remboursé au client", FAILED: "paiement échoué" };
const PAYOUT: Record<string, string> = { NONE: "aucun", PENDING: "à verser", PROCESSING: "en cours", PAID: "versé", DISPUTED: "❄ gelé (litige)" };
const BUBBLE: Record<string, string> = { guest: "bg-brand-50 ring-brand-100", host: "bg-amber-50 ring-amber-100", admin: "bg-white ring-slate-200", system: "bg-slate-50 ring-slate-200" };

/** Back-office → Litige : contexte de la réservation, acompte, fil d'échanges, décision. */
export default async function AdminDisputePage({ params }: { params: { id: string } }) {
  const d = await getAdminDispute(params.id);
  if (!d) notFound();
  const b = d.booking;
  return (
    <div className="space-y-4">
      <Link href="/admin/litiges" className="text-sm font-semibold text-brand-800 hover:underline">← Litiges</Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl font-extrabold text-ink">Litige {d.number}</h1>
        <DisputePill status={d.status} label={ADMIN_DISPUTE_LABEL[d.status] ?? d.statusLabel} />
        {d.overdue ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 ring-1 ring-red-200">⏰ Délai de réponse dépassé</span> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          <section className="rounded-lg bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Problème signalé</p>
            <p className="mt-1 font-semibold text-ink">{d.categoryLabel}</p>
            <p className="mt-1 text-slate-700">Demande du client : <strong>{d.desiredOutcomeLabel}{d.amountClaimed ? ` · ${fcfa(d.amountClaimed)}` : ""}</strong></p>
            <p className="mt-1 text-xs text-muted">Ouvert le {when(d.createdAt)}{d.respondBy && d.open ? ` · réponse attendue avant le ${when(d.respondBy)}` : ""}</p>
            {d.resolutionLabel ? (
              <div className="mt-3 rounded-md bg-emerald-50 p-3 text-emerald-900">
                <p className="font-semibold">Décision : {d.resolutionLabel}{d.refundAmount ? ` · ${fcfa(d.refundAmount)}` : ""}</p>
                {d.resolutionNote ? <p className="mt-1 whitespace-pre-line">{d.resolutionNote}</p> : null}
                {d.refundRef ? <p className="mt-1 text-xs">Référence : {d.refundRef}</p> : null}
              </div>
            ) : null}
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold text-ink">Échanges</h2>
            <ol className="space-y-2">
              {d.messages.map((m) => (
                <li key={m.id} className={"rounded-lg p-3 text-sm ring-1 " + (m.internal ? "bg-slate-100 ring-slate-300" : BUBBLE[m.author] ?? BUBBLE.admin)}>
                  <p className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="font-semibold text-slate-700">{m.author === "guest" ? `Client · ${m.authorName}` : m.authorName}</span>
                    {m.internal ? <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-white">INTERNE</span> : null}
                    <span>{when(m.createdAt)}</span>
                  </p>
                  <p className="whitespace-pre-line text-ink">{m.body}</p>
                  {m.files.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.files.filter((f) => f.url).map((f, i) => (
                        <a key={i} href={f.url!} target="_blank" rel="noopener noreferrer" className="block h-20 w-24 overflow-hidden rounded bg-slate-100 ring-1 ring-slate-200">
                          {/\.pdf(\?|$)/i.test(f.url!) ? <span className="grid h-full place-items-center text-xs">📄 PDF</span> : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={f.url!} alt={`Pièce jointe ${i + 1}`} className="h-full w-full object-cover" />
                          )}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
          {d.open ? <DisputePanel id={d.id} resolutions={d.meta.resolutions} escrowAmount={d.escrow?.status === "HELD" ? d.escrow.amount : null} amountClaimed={d.amountClaimed} hostReplyHours={d.meta.hostReplyHours} /> : null}
        </div>

        <aside className="space-y-4">
          <section className="space-y-2 rounded-lg bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Réservation</p>
            {b ? <>
              <p className="font-semibold text-ink">{b.title}</p>
              <p className="text-xs text-muted">{b.kind === "stay" ? "Séjour" : "Espace"} · {b.ref} · {b.place}</p>
              <StagePill stage={b.stage} label={b.stageLabel} />
              <p>{frDay(b.start)} → {frDay(b.end)}{b.nights ? ` · ${b.nights} nuit(s)` : ""} · {b.guests} pers.</p>
              {b.amount ? <p>Total : <strong>{fcfa(b.amount)}</strong>{b.deposit ? ` · acompte ${fcfa(b.deposit)}` : ""}</p> : null}
              {b.href ? <Link href={b.href} target="_blank" className="text-brand-800 hover:underline">Voir l’annonce ↗</Link> : null}
            </> : <p className="text-muted">Réservation introuvable (supprimée ?).</p>}
          </section>
          <section className="space-y-1 rounded-lg bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Acompte en ligne</p>
            {d.escrow ? <>
              <p><strong>{fcfa(d.escrow.amount)}</strong> · {ESCROW[d.escrow.status] ?? d.escrow.status}</p>
              <p>Reversement à l’hôte : <strong>{PAYOUT[d.escrow.payoutStatus] ?? d.escrow.payoutStatus}</strong>{d.escrow.managerPayout != null ? ` (${fcfa(d.escrow.managerPayout)})` : ""}</p>
              {d.escrow.commission != null ? <p className="text-xs text-muted">Commission Moboo : {fcfa(d.escrow.commission)}</p> : null}
              {d.escrow.refunded ? <p className="text-emerald-800">Remboursé au client : {fcfa(d.escrow.refunded)}</p> : null}
              <p className="text-xs text-muted">Réf. {d.escrow.reference}</p>
            </> : <p className="text-muted">Aucun acompte payé en ligne : médiation seulement.</p>}
          </section>
          <section className="space-y-1 rounded-lg bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Client</p>
            {d.guest ? <>
              <Link href={`/admin/utilisateurs/${d.guest.id}`} className="font-semibold text-ink hover:underline">{d.guest.name || d.guest.phone}</Link>
              {d.guest.verified ? <span className="ml-1 text-xs font-bold text-emerald-700">✓ Identité vérifiée</span> : null}
              <p><a href={`tel:${d.guest.phone}`} className="text-brand-800 hover:underline">{d.guest.phone}</a>{d.guest.email ? ` · ${d.guest.email}` : ""}</p>
            </> : <p className="text-muted">—</p>}
          </section>
          <section className="space-y-1 rounded-lg bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Hôte</p>
            {d.host ? <>
              <p className="font-semibold text-ink">{d.host.name || "—"}{b?.host.name && b.host.name !== d.host.name ? <span className="font-normal text-muted"> · {b.host.name}</span> : null}</p>
              {d.host.phone ? <p><a href={`tel:${d.host.phone}`} className="text-brand-800 hover:underline">{d.host.phone}</a> · <a href={`https://wa.me/${d.host.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-brand-800 hover:underline">WhatsApp</a></p> : null}
              {d.host.email ? <p className="text-xs text-muted">{d.host.email}</p> : null}
            </> : <p className="text-muted">Hôte inconnu.</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}
