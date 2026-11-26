import Link from "next/link";
import { AutoRefresh } from "@/components/backoffice/am-ui";
import { TrackedEventCard, type TrackedEvent } from "@/components/backoffice/am-events";
import { EventTeamActions } from "@/components/backoffice/am-event-actions";
import { fcfa } from "@/lib/am";
import { getAm } from "../actions";

export const dynamic = "force-dynamic";

/** Événements (espaces Moboo Event) réservés et payés en ligne : de l'acompte au reversement après l'événement. */
export default async function AmEvents({ searchParams }: { searchParams: { scope?: string; status?: string } }) {
  const scope = searchParams.scope === "all" ? "all" : "mine";
  const status = ["alerts", "done"].includes(searchParams.status ?? "") ? searchParams.status! : "active";
  const [d, o] = await Promise.all([
    getAm<{ items: TrackedEvent[]; totals: { count: number; encaisse: number; commission: number; alerts: number } }>(`/events?scope=${scope}&status=${status}`),
    getAm<any>("/overview"),
  ]);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Événements indisponibles.</p>;
  const tab = (k: string, l: string, key: "scope" | "status") => {
    const p = new URLSearchParams({ scope, status, [key]: k });
    const on = (key === "scope" ? scope : status) === k;
    return <Link key={k} href={`?${p}`} className={"rounded-full px-3 py-1 font-semibold " + (on ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>;
  };
  return (
    <div className="space-y-4">
      <AutoRefresh seconds={60} />
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Événements en cours</h1>
        <p className="max-w-3xl text-sm text-muted">
          Salles réservées sur Moboo.ci : acompte puis solde payés en ligne et gardés par Moboo, code du jour J saisi par le propriétaire,
          part de l’hôte disponible après l’événement. La caution se règle sur place, hors Moboo.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {tab("active", "En cours", "status")}{tab("alerts", "À surveiller", "status")}{tab("done", "Terminés / annulés", "status")}
        {o?.canSeeAll ? <span className="mx-2 w-px bg-slate-300" /> : null}
        {o?.canSeeAll ? [tab("mine", "Mon portefeuille", "scope"), tab("all", "Toute l’équipe", "scope")] : null}
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Événements", String(d.totals.count)],
          ["À surveiller", String(d.totals.alerts)],
          ["Encaissé par Moboo", fcfa(d.totals.encaisse)],
          ["Commissions Moboo", fcfa(d.totals.commission)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><dt className="text-xs text-muted">{l}</dt><dd className="font-display text-xl font-extrabold text-ink">{v}</dd></div>
        ))}
      </dl>
      <div className="space-y-3">
        {[...d.items.filter((e) => e.alerts.length), ...d.items.filter((e) => !e.alerts.length)].map((e) => (
          <TrackedEventCard key={e.id} e={e} actions={
            <EventTeamActions id={e.id}
              canRelease={e.statut === "CONFIRME" && !e.progress.steps.find((s) => s.key === "jourj")?.done && new Date(e.dateDebut) < new Date()}
              canCancel={e.statut === "CONFIRME" || e.statut === "OPTION"} />
          } />
        ))}
        {!d.items.length ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-muted">Aucun événement payé en ligne pour le moment.</p> : null}
      </div>
    </div>
  );
}
