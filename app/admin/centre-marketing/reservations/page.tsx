import { CancelDeclared, DeclareBookingForm } from "@/components/backoffice/marketing-center";
import { listDeclared } from "../actions";

export const dynamic = "force-dynamic";
const d = (s: string) => new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Back-office → Centre marketing → Réservations déclarées par l'équipe. */
export default async function DeclaredBookings() {
  const items = await listDeclared();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Réservations déclarées</h1>
        <p className="max-w-3xl text-sm text-muted">Le propriétaire vous confirme une réservation qu’il n’a pas saisie dans son application ? Déclarez-la ici : les dates sont bloquées sur le site <strong>et</strong> dans Moboo Resi / Moboo Event, et la réservation compte dans les messages « Réservé N fois » et les notifications d’activité.</p>
      </div>
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <DeclareBookingForm />
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          {items.length ? (
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-2">Bien</th><th className="px-2 py-2">Dates</th><th className="px-2 py-2">Déclarée par</th><th className="px-4 py-2" /></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((m) => {
                  const lastDay = m.targetType === "espace" ? new Date(new Date(m.checkOut).getTime() - 86_400_000).toISOString() : m.checkOut;
                  return (
                    <tr key={m.id} className={m.status === "cancelled" ? "text-muted line-through" : ""}>
                      <td className="px-4 py-2.5"><p className="font-medium">{m.label}</p><p className="text-xs text-muted">{m.zone ?? "—"}{m.guests ? ` · ${m.guests} pers.` : ""}{m.note ? ` · ${m.note}` : ""}</p></td>
                      <td className="whitespace-nowrap px-2 py-2.5">{d(m.checkIn)}{lastDay.slice(0, 10) !== m.checkIn.slice(0, 10) ? ` → ${d(lastDay)}` : ""}</td>
                      <td className="px-2 py-2.5 text-xs">{m.declaredBy ?? "—"}<br /><span className="text-muted">{new Date(m.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span></td>
                      <td className="px-4 py-2.5 text-right">{m.status === "active" ? <CancelDeclared id={m.id} /> : <span className="text-xs no-underline">Annulée</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <p className="p-6 text-sm text-muted">Aucune réservation déclarée.</p>}
        </div>
      </div>
    </div>
  );
}
