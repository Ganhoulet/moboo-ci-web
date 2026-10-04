import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard-ui";
import { DisputePill, StagePill, StageSteps, fcfa, frDay } from "@/components/booking-ui";
import { CancelBookingButton, DisputeForm } from "@/components/booking-dispute";
import { getSiteSettings } from "@/lib/settings";
import { getMyBooking } from "../actions";

export const dynamic = "force-dynamic";

const ESCROW: Record<string, string> = {
  PENDING: "Lien de paiement envoyé, en attente de paiement",
  HELD: "Payé : conservé par Moboo jusqu’à votre arrivée",
  RELEASED: "Versé à l’hôte",
  PARTIALLY_RELEASED: "Versé à l’hôte (une partie retenue)",
  REFUNDED: "Remboursé",
  FAILED: "Paiement échoué",
};

/** Mon espace → Réservation : étapes, montants, acompte, annulation, litige. */
export default async function BookingDetail({ params }: { params: { key: string } }) {
  const key = decodeURIComponent(params.key);
  const [b, settings] = await Promise.all([getMyBooking(key), getSiteSettings()]);
  if (!b) notFound();
  const disputeOpen = b.dispute && ["open", "awaiting_host", "awaiting_guest", "review"].includes(b.dispute.status);

  return (
    <div className="max-w-3xl space-y-5">
      <Link href="/mon-espace/reservations" className="text-sm font-semibold text-brand-800 hover:underline">← Mes réservations</Link>
      <PageHeader title={b.title} sub={`${b.place} · réservation ${b.ref}`} />

      <section className="space-y-4 rounded-2xl bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <StagePill stage={b.stage} label={b.stageLabel} />
          {b.dispute ? <Link href={`/mon-espace/reservations/litige/${b.dispute.id}`}><DisputePill status={b.dispute.status} label={`${b.dispute.number} · ${b.dispute.statusLabel}`} /></Link> : null}
        </div>
        <StageSteps stage={b.stage} kind={b.kind} />
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">{b.kind === "stay" ? "Arrivée" : "Début"}</dt><dd className="font-semibold text-ink">{frDay(b.start)}</dd></div>
          <div><dt className="text-muted">{b.kind === "stay" ? "Départ" : "Fin"}</dt><dd className="font-semibold text-ink">{frDay(b.end)}</dd></div>
          <div><dt className="text-muted">{b.kind === "stay" ? "Voyageurs" : "Invités"}</dt><dd className="font-semibold text-ink">{b.guests}{b.nights ? ` · ${b.nights} nuit${b.nights > 1 ? "s" : ""}` : ""}</dd></div>
          {b.amount ? <div><dt className="text-muted">Montant total</dt><dd className="font-semibold text-ink">{fcfa(b.amount)}</dd></div> : <div><dt className="text-muted">Montant</dt><dd className="text-ink">Devis envoyé par le propriétaire</dd></div>}
          {b.deposit ? <div><dt className="text-muted">Acompte</dt><dd className="font-semibold text-ink">{fcfa(b.deposit)}</dd></div> : null}
          {b.escrow ? <div><dt className="text-muted">Acompte en ligne</dt><dd className="font-semibold text-ink">{ESCROW[b.escrow.status] ?? b.escrow.status}{b.escrow.refunded ? ` (${fcfa(b.escrow.refunded)} remboursés)` : ""}</dd></div> : null}
          {b.host.name ? <div><dt className="text-muted">Hôte</dt><dd className="font-semibold text-ink">{b.host.name}</dd></div> : null}
          {b.cancellationReason ? <div className="sm:col-span-2"><dt className="text-muted">Motif d’annulation</dt><dd className="text-ink">{b.cancellationReason}</dd></div> : null}
        </dl>
        <div className="flex flex-wrap gap-2">
          {b.payUrl ? <a href={b.payUrl} className="btn-primary bg-brand-800 hover:bg-brand-900" rel="noopener noreferrer">Payer l’acompte ({fcfa(b.deposit)})</a> : null}
          {b.href ? <Link href={b.href} className="rounded-full px-4 py-2 text-sm font-semibold text-brand-800 ring-1 ring-brand-200 hover:bg-brand-50">Voir l’annonce</Link> : null}
          {b.canCancel ? <CancelBookingButton bookingKey={b.key} /> : null}
        </div>
        {b.stage === "requested" ? <p className="text-xs text-muted">L’hôte confirme la disponibilité ; vous recevez ensuite le lien de paiement de l’acompte par WhatsApp ou SMS. L’acompte est conservé par Moboo et versé à l’hôte après votre arrivée.</p> : null}
      </section>

      {disputeOpen ? (
        <p className="rounded-2xl bg-violet-50 p-4 text-sm text-violet-900">Un litige est en cours pour cette réservation. <Link href={`/mon-espace/reservations/litige/${b.dispute!.id}`} className="font-semibold underline">Suivre le litige</Link></p>
      ) : b.canDispute ? (
        <DisputeForm bookingKey={b.key} categories={b.categories} outcomes={b.outcomes} intro={settings.disputes.intro} />
      ) : null}
    </div>
  );
}
