import Link from "next/link";
import { fcfa, since } from "@/lib/am";
import { Icon } from "@/components/team-icons";

export interface TrackedStep { key: string; label: string; at: string | null; done: boolean; note?: string | null }
export interface TrackedStay {
  key: string; ref: string; status: string; title: string; place: string; start: string; end: string; nights: number;
  money: { total: number; deposit: number; commission: number; hostPart: number; refunded: number; balanceOnSite: number };
  escrow: { status: string; payoutStatus: string };
  steps: TrackedStep[]; current: string; payoutDue: string | null;
  distance: { km: number; minutesAgo: number } | null;
  alert: string | null; dispute: { id: string; number: string; status: string } | null;
  host: { name: string | null; phone: string | null }; guest: { name: string; phone: string };
  managerName: string | null;
}

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Abidjan" }) : "";
const km = (n: number) => (n < 1 ? `${Math.round(n * 1000)} m` : `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km`);
const digits = (p: string) => p.replace(/\D/g, "");

/** Barre de progression : demande → acceptée → acompte payé → arrivé → reversé. */
function Progress({ steps }: { steps: TrackedStep[] }) {
  const doneCount = steps.filter((s) => s.done).length;
  return (
    <div>
      <div className="relative h-2 rounded-full bg-slate-200">
        <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-600" style={{ width: `${Math.round(((doneCount - 1) / (steps.length - 1)) * 100)}%` }} />
      </div>
      <ol className="mt-2 grid grid-cols-5 gap-1 text-[11px] leading-tight">
        {steps.map((s) => (
          <li key={s.key} className={s.done ? "text-emerald-800" : "text-slate-500"}>
            <span className="font-semibold">{s.done ? "✓ " : ""}{s.label}</span>
            {s.at ? <span className="block">{when(s.at)}</span> : null}
            {s.note ? <span className={"block " + (s.done ? "" : "text-amber-700")}>{s.note.startsWith("Prévu après le ") ? `Prévu après le ${when(s.note.slice(15))}` : s.note}</span> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Séjour payé suivi par l'account manager : argent, progression, distance du client en route. */
export function TrackedStayCard({ s }: { s: TrackedStay }) {
  const m = s.money;
  return (
    <article className={"space-y-3 rounded-xl bg-white p-4 ring-1 " + (s.alert ? "ring-amber-300" : "ring-slate-200")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-ink">{s.title} <span className="text-xs font-normal text-muted">{s.ref}</span></h3>
          <p className="text-sm text-slate-600">{s.place ? `${s.place} · ` : ""}{s.start} → {s.end} · {s.nights} nuit{s.nights > 1 ? "s" : ""}{s.managerName ? ` · suivi par ${s.managerName}` : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {s.alert ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">⚠ {s.alert}</span> : null}
          {s.dispute ? <Link href={`/admin/litiges/${s.dispute.id}`} className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-900">Litige {s.dispute.number}</Link> : null}
          {s.distance ? (
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-900" title="Distance à vol d’oiseau, partagée par le client depuis sa page d’arrivée">
              <Icon name="compass" size={15} className="mr-1 inline-block -mt-0.5" />Client à {km(s.distance.km)} · il y a {since(s.distance.minutesAgo)}
            </span>
          ) : null}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
        <div className="rounded-lg bg-slate-50 p-2"><dt className="text-xs text-muted">Prix du séjour</dt><dd className="font-bold text-ink">{fcfa(m.total)}</dd></div>
        <div className="rounded-lg bg-slate-50 p-2"><dt className="text-xs text-muted">Acompte encaissé</dt><dd className="font-bold text-ink">{fcfa(m.deposit)}</dd></div>
        <div className="rounded-lg bg-brand-50 p-2"><dt className="text-xs text-muted">Commission Moboo</dt><dd className="font-bold text-brand-900">{fcfa(m.commission)}</dd></div>
        <div className="rounded-lg bg-emerald-50 p-2"><dt className="text-xs text-muted">Part de l’hôte (reversée)</dt><dd className="font-bold text-emerald-900">{fcfa(m.hostPart)}</dd></div>
        <div className="rounded-lg bg-slate-50 p-2"><dt className="text-xs text-muted">Solde payé sur place</dt><dd className="font-bold text-ink">{fcfa(m.balanceOnSite)}</dd></div>
      </dl>
      {m.refunded ? <p className="text-xs text-slate-600">Remboursé au client : {fcfa(m.refunded)}</p> : null}

      <Progress steps={s.steps} />

      <div className="flex flex-wrap gap-2 text-xs">
        {s.guest.phone ? <a href={`tel:${s.guest.phone}`} className="rounded-full bg-brand-800 px-3 py-1 font-bold text-white"><Icon name="phone" size={15} className="mr-1 inline-block -mt-0.5" />Client {s.guest.name ? `(${s.guest.name})` : ""}</a> : null}
        {s.guest.phone ? <a href={`https://wa.me/${digits(s.guest.phone)}`} target="_blank" rel="noreferrer" className="rounded-full px-3 py-1 font-semibold text-emerald-700 ring-1 ring-slate-300">WhatsApp client</a> : null}
        {s.host.phone ? <a href={`tel:${s.host.phone}`} className="rounded-full px-3 py-1 font-semibold text-brand-800 ring-1 ring-slate-300"><Icon name="phone" size={15} className="mr-1 inline-block -mt-0.5" />Hôte {s.host.name ? `(${s.host.name})` : ""}</a> : null}
      </div>
    </article>
  );
}
