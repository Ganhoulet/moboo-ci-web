import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/dashboard-ui";
import { DisputePill, StagePill, fcfa, frDay } from "@/components/booking-ui";
import { listMyBookings } from "./actions";

export const dynamic = "force-dynamic";

/** Mon espace → Mes réservations : séjours meublés et espaces réservés sur Moboo.ci. */
export default async function MyBookings() {
  const data = await listMyBookings();
  const items = data?.items ?? [];
  const upcoming = items.filter((b) => !["completed", "cancelled", "no_show"].includes(b.stage));
  const past = items.filter((b) => ["completed", "cancelled", "no_show"].includes(b.stage));

  const Row = ({ b }: { b: (typeof items)[number] }) => (
    <Link href={`/mon-espace/reservations/${encodeURIComponent(b.key)}`} className="flex gap-4 rounded-2xl bg-white p-3 shadow-card transition hover:ring-2 hover:ring-brand-200">
      <span className="h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {b.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.photo} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : <span className="grid h-full place-items-center text-2xl" aria-hidden="true">{b.kind === "stay" ? "🏠" : "🎉"}</span>}
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="flex flex-wrap items-center gap-2">
          <StagePill stage={b.stage} label={b.stageLabel} />
          {b.dispute ? <DisputePill status={b.dispute.status} label={b.dispute.statusLabel} /> : null}
        </span>
        <span className="block truncate font-semibold text-ink">{b.title}</span>
        <span className="block text-sm text-muted">{b.place}</span>
        <span className="block text-sm text-slate-700">
          {frDay(b.start)}{b.end !== b.start ? ` → ${frDay(b.end)}` : ""}
          {b.nights ? ` · ${b.nights} nuit${b.nights > 1 ? "s" : ""}` : ""} · {b.guests} {b.kind === "stay" ? "voyageur" : "invité"}{b.guests > 1 ? "s" : ""}
          {b.amount ? ` · ${fcfa(b.amount)}` : ""}
        </span>
      </span>
      {b.payUrl ? <span className="self-center rounded-full bg-brand-800 px-3 py-1.5 text-xs font-bold text-white">Payer l’acompte</span> : null}
    </Link>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Mes réservations" sub="Les réservations faites sur Moboo.ci avec votre numéro de téléphone : séjours meublés et espaces événementiels." />
      {!items.length ? (
        <EmptyState title="Aucune réservation pour l’instant" text="Réservez un meublé ou un espace événementiel : vous suivrez ici la réponse de l’hôte, le paiement de l’acompte et votre séjour."
          action={<Link href="/annonces?transaction=furnished" className="btn-primary">Trouver un meublé</Link>} />
      ) : null}
      {upcoming.length ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-ink">En cours et à venir</h2>
          {upcoming.map((b) => <Row key={b.key} b={b} />)}
        </section>
      ) : null}
      {past.length ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-ink">Passées et annulées</h2>
          {past.map((b) => <Row key={b.key} b={b} />)}
        </section>
      ) : null}
      {data?.disputesEnabled ? <p className="text-xs text-muted">Un problème pendant un séjour ? Ouvrez la réservation puis « Signaler un problème », jusqu’à {data.windowDays} jours après la fin.</p> : null}
    </div>
  );
}
