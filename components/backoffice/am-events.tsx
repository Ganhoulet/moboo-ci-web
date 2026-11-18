import Link from "next/link";
import { fcfa } from "@/lib/am";
import type { TrackedStep } from "@/components/backoffice/am-stays";

export interface TrackedEvent {
  id: string; reference: string; espace: string | null; commune: string | null; typeEvenement: string; nbInvites: number;
  dateDebut: string; dateFin: string; statut: string; annuleePar: string | null;
  client: { name: string; phone: string | null };
  money: { total: number; acompte: number; solde: number; encaisse: number; commission: number; hostPart: number; rembourse: number; aRembourser: number };
  progress: { steps: TrackedStep[]; current: string };
  dispute: { id: string; number: string; status: string } | null;
  alerts: string[]; managerName?: string | null;
}

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Abidjan" }) : "";
const day = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", timeZone: "Africa/Abidjan" });
const digits = (p: string) => p.replace(/\D/g, "");
const STATUT: Record<string, string> = { OPTION: "Acompte attendu", CONFIRME: "Confirmé", TERMINE: "Terminé", ANNULE: "Annulé" };

/** Événement réservé en ligne : argent (acompte, solde, commission, part de l'hôte), étapes jusqu'au reversement. */
export function TrackedEventCard({ e, actions }: { e: TrackedEvent; actions?: React.ReactNode }) {
  const m = e.money;
  const steps = e.progress.steps;
  const doneCount = steps.filter((s) => s.done).length;
  return (
    <article className={"space-y-3 rounded-xl bg-white p-4 ring-1 " + (e.alerts.length ? "ring-amber-300" : "ring-slate-200")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-ink">{e.espace ?? "Espace"} <span className="text-xs font-normal text-muted">{e.reference}</span></h3>
          <p className="text-sm text-slate-600">
            {e.commune ? `${e.commune} · ` : ""}{day(e.dateDebut)} · {e.typeEvenement} · {e.nbInvites} invités
            {e.managerName ? ` · suivi par ${e.managerName}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800">{STATUT[e.statut] ?? e.statut}{e.annuleePar ? ` (${e.annuleePar.toLowerCase()})` : ""}</span>
          {e.alerts.map((a) => <span key={a} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">⚠ {a}</span>)}
          {e.dispute ? <Link href={`/admin/litiges/${e.dispute.id}`} className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-900">Litige {e.dispute.number}</Link> : null}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-6">
        <div className="rounded-lg bg-slate-50 p-2"><dt className="text-xs text-muted">Prix total</dt><dd className="font-bold text-ink">{fcfa(m.total)}</dd></div>
        <div className="rounded-lg bg-slate-50 p-2"><dt className="text-xs text-muted">Acompte</dt><dd className="font-bold text-ink">{fcfa(m.acompte)}</dd></div>
        <div className="rounded-lg bg-slate-50 p-2"><dt className="text-xs text-muted">Solde</dt><dd className="font-bold text-ink">{fcfa(m.solde)}</dd></div>
        <div className="rounded-lg bg-slate-50 p-2"><dt className="text-xs text-muted">Encaissé par Moboo</dt><dd className="font-bold text-ink">{fcfa(m.encaisse)}</dd></div>
        <div className="rounded-lg bg-brand-50 p-2"><dt className="text-xs text-muted">Commission Moboo</dt><dd className="font-bold text-brand-900">{fcfa(m.commission)}</dd></div>
        <div className="rounded-lg bg-emerald-50 p-2"><dt className="text-xs text-muted">Part de l’hôte</dt><dd className="font-bold text-emerald-900">{fcfa(m.hostPart)}</dd></div>
      </dl>
      {m.rembourse || m.aRembourser ? (
        <p className="text-xs font-semibold text-red-700">
          {m.rembourse ? `À rembourser au client (annulation) : ${fcfa(m.rembourse)}. ` : ""}
          {m.aRembourser ? `Paiement reçu après l’expiration : ${fcfa(m.aRembourser)} à rembourser.` : ""}
        </p>
      ) : null}

      <div>
        <div className="relative h-2 rounded-full bg-slate-200">
          <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-600" style={{ width: `${Math.round(((doneCount - 1) / (steps.length - 1)) * 100)}%` }} />
        </div>
        <ol className="mt-2 grid grid-cols-3 gap-1 text-[11px] leading-tight sm:grid-cols-6">
          {steps.map((s) => (
            <li key={s.key} className={s.done ? "text-emerald-800" : "text-slate-500"}>
              <span className="font-semibold">{s.done ? "✓ " : ""}{s.label}</span>
              {s.at ? <span className="block">{when(s.at)}</span> : null}
              {s.note ? <span className={"block " + (s.done ? "" : "text-amber-700")}>{s.note.startsWith("Prévue le ") ? `Prévue le ${when(s.note.slice(10))}` : s.note}</span> : null}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {e.client.phone ? <a href={`tel:${e.client.phone}`} className="rounded-full bg-brand-800 px-3 py-1 font-bold text-white">📞 Client {e.client.name ? `(${e.client.name})` : ""}</a> : null}
        {e.client.phone ? <a href={`https://wa.me/${digits(e.client.phone)}`} target="_blank" rel="noreferrer" className="rounded-full px-3 py-1 font-semibold text-emerald-700 ring-1 ring-slate-300">WhatsApp client</a> : null}
        {actions}
      </div>
    </article>
  );
}
