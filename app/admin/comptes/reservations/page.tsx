import Link from "next/link";
import { AutoRefresh, AwaitingPaymentCard, PendingBookingCard, type AwaitingPayment, type PendingBooking } from "@/components/backoffice/am-ui";
import { getAm } from "../actions";

export const dynamic = "force-dynamic";

/** Demandes de réservation Moboo.ci que l'hôte n'a pas encore acceptées. */
export default async function AmBookings({ searchParams }: { searchParams: { scope?: string } }) {
  const scope = searchParams.scope === "all" ? "all" : "mine";
  const [d, o] = await Promise.all([getAm<{ urgentMinutes: number; items: PendingBooking[]; awaitingPayment?: AwaitingPayment[] }>(`/bookings?scope=${scope}`), getAm<any>("/overview")]);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Réservations indisponibles.</p>;
  return (
    <div className="space-y-4">
      <AutoRefresh seconds={20} />
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Réservations à confirmer</h1>
        <p className="max-w-3xl text-sm text-muted">
          Demandes faites sur Moboo.ci (séjours et espaces) que l’hôte n’a pas encore acceptées. Après {d.urgentMinutes} min, appelez l’hôte : s’il est d’accord,
          confirmez pour lui — le client reçoit son lien de paiement par WhatsApp ou SMS, sans avoir besoin de compte. S’il refuse, indiquez la raison. Chaque action est enregistrée à votre nom.
        </p>
      </div>
      {o?.canSeeAll ? (
        <div className="flex gap-2 text-sm">
          {[["mine", "Mon portefeuille + sans account manager"], ["all", "Toute l’équipe"]].map(([k, l]) => (
            <Link key={k} href={`?scope=${k}`} className={"rounded-full px-3 py-1 font-semibold " + (scope === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>
          ))}
        </div>
      ) : null}
      <div className="space-y-3">
        {d.items.map((b) => <PendingBookingCard key={b.key} b={b} />)}
        {!d.items.length ? <p className="rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Aucune demande en attente.</p> : null}
      </div>
      {d.awaitingPayment?.length ? (
        <section className="space-y-3 pt-2">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Acompte à régler ({d.awaitingPayment.length})</h2>
            <p className="max-w-3xl text-sm text-muted">Séjours acceptés par l’hôte dont le client n’a pas encore payé l’acompte. Appelez le client et renvoyez-lui son lien de paiement.</p>
          </div>
          {d.awaitingPayment.map((b) => <AwaitingPaymentCard key={b.key} b={b} />)}
        </section>
      ) : null}
    </div>
  );
}
