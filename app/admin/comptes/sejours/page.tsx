import Link from "next/link";
import { AutoRefresh } from "@/components/backoffice/am-ui";
import { TrackedStayCard, type TrackedStay } from "@/components/backoffice/am-stays";
import { fcfa } from "@/lib/am";
import { getAm } from "../actions";

export const dynamic = "force-dynamic";

/** Séjours payés : de l'acompte à l'arrivée du client, puis au reversement à l'hôte. */
export default async function AmStays({ searchParams }: { searchParams: { scope?: string } }) {
  const scope = searchParams.scope === "all" ? "all" : "mine";
  const [d, o] = await Promise.all([getAm<{ releaseDelayHours: number; items: TrackedStay[] }>(`/stays?scope=${scope}`), getAm<any>("/overview")]);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Séjours indisponibles.</p>;
  const sum = (f: (s: TrackedStay) => number) => d.items.reduce((a, s) => a + f(s), 0);
  const enRoute = d.items.filter((s) => s.status === "CONFIRMED");
  const arrived = d.items.filter((s) => s.status === "CHECKED_IN");
  const alerts = d.items.filter((s) => s.alert);
  return (
    <div className="space-y-4">
      <AutoRefresh seconds={30} />
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Séjours en cours</h1>
        <p className="max-w-3xl text-sm text-muted">
          Séjours dont l’acompte est payé : prix, répartition de l’argent et progression jusqu’à l’arrivée du client, puis au reversement à l’hôte
          ({d.releaseDelayHours} h après l’arrivée). Quand le client se situe sur sa page d’arrivée, sa distance au logement s’affiche (jamais sa position exacte).
        </p>
      </div>
      {o?.canSeeAll ? (
        <div className="flex gap-2 text-sm">
          {[["mine", "Mon portefeuille + sans account manager"], ["all", "Toute l’équipe"]].map(([k, l]) => (
            <Link key={k} href={`?scope=${k}`} className={"rounded-full px-3 py-1 font-semibold " + (scope === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>
          ))}
        </div>
      ) : null}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ["En route / à venir", String(enRoute.length)],
          ["Arrivés", String(arrived.length)],
          ["À surveiller", String(alerts.length)],
          ["Acomptes encaissés", fcfa(sum((s) => s.money.deposit))],
          ["Commissions Moboo", fcfa(sum((s) => s.money.commission))],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><dt className="text-xs text-muted">{l}</dt><dd className="font-display text-xl font-extrabold text-ink">{v}</dd></div>
        ))}
      </dl>
      <div className="space-y-3">
        {[...alerts, ...d.items.filter((s) => !s.alert)].map((s) => <TrackedStayCard key={s.key} s={s} />)}
        {!d.items.length ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-muted">Aucun séjour payé en cours.</p> : null}
      </div>
    </div>
  );
}
