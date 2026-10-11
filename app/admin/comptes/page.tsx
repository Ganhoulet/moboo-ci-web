import Link from "next/link";
import { AutoRefresh, PendingBookingCard, type PendingBooking } from "@/components/backoffice/am-ui";
import { getAm } from "./actions";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = { org: "Résidences (Moboo Resi)", event: "Espaces (Moboo Event)", site: "Annonceurs et membres du site" };

/** Account manager : à appeler maintenant, tâches du jour, portefeuille. */
export default async function AmDashboard() {
  const d = await getAm<any>("/overview");
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Suivi des comptes indisponible.</p>;
  return (
    <div className="space-y-6">
      <AutoRefresh seconds={20} />
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Suivi des comptes</h1>
        <p className="max-w-3xl text-sm text-muted">
          Votre poste d’account manager, comme chez Booking.com : les demandes de réservation que l’hôte n’a pas acceptées après {d.urgentMinutes} min,
          vos rappels du jour et votre portefeuille. La page se met à jour toute seule.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-ink">📞 À appeler maintenant ({d.urgent.length})</h2>
          <Link href="/admin/comptes/reservations" className="text-sm font-semibold text-brand-800 hover:underline">Toutes les demandes en attente ({d.pendingCount}) →</Link>
        </div>
        {d.urgent.length ? d.urgent.map((b: PendingBooking) => <PendingBookingCard key={b.key} b={b} />) : (
          <p className="rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Aucune réservation en retard : les hôtes de votre portefeuille ont tous répondu.</p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-bold text-ink">⏰ Rappels du jour ({d.tasksDue.length})</h2>
            <Link href="/admin/comptes/taches" className="text-sm font-semibold text-brand-800 hover:underline">Toutes mes tâches{d.tasksLater ? ` (+${d.tasksLater})` : ""} →</Link>
          </div>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {d.tasksDue.map((t: any) => (
              <li key={t.id} className="py-2">
                <Link href={`/admin/comptes/${t.kind}/${t.targetId}`} className="font-semibold text-ink hover:underline">{t.targetName}</Link>
                <span className={"ml-2 text-xs " + (new Date(t.dueAt) < new Date() ? "font-bold text-red-600" : "text-muted")}>{new Date(t.dueAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
                <p className="text-slate-600">{t.body}</p>
              </li>
            ))}
            {!d.tasksDue.length ? <li className="py-2 text-muted">Rien de prévu aujourd’hui.</li> : null}
          </ul>
        </section>
        <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
          <h2 className="font-display text-lg font-bold text-ink">💼 Mon portefeuille</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {Object.entries(KIND_LABEL).map(([k, l]) => (
              <li key={k} className="flex items-center justify-between">
                <Link href={`/admin/comptes/portefeuille?kind=${k}`} className="font-semibold text-brand-800 hover:underline">{l}</Link>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-bold text-ink">{d.portfolio[k] ?? 0}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Un compte rejoint votre portefeuille quand on vous l’attribue, ou dès votre premier contact noté s’il n’a pas encore d’account manager.</p>
          <Link href="/admin/comptes/portefeuille?kind=org&scope=unassigned" className="mt-2 inline-block text-sm font-semibold text-brand-800 hover:underline">Comptes sans account manager →</Link>
        </section>
      </div>

      {d.canSeeAll ? (
        <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
          <h2 className="font-display text-lg font-bold text-ink">👥 Équipe : contacts des 7 derniers jours</h2>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {d.team.map((t: any) => <li key={t.managerId} className="flex justify-between py-1.5"><Link href={`/admin/comptes/portefeuille?kind=org&scope=manager&manager=${t.managerId}`} className="hover:underline">{t.name}</Link><b>{t.contacts7d}</b></li>)}
            {!d.team.length ? <li className="py-2 text-muted">Aucun contact enregistré cette semaine.</li> : null}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
