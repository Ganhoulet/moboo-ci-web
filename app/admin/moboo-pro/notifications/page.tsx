import { getProNotifs } from "../comptes-actions";
import { BroadcastForm } from "../comptes/controls";
import { fmtDate, Section } from "../ui";

export const dynamic = "force-dynamic";

export default async function ProNotifications() {
  const d = await getProNotifs();
  if (!d) return <p className="text-muted">Notifications indisponibles (droit « Application » requis).</p>;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Moboo Pro › Notifications</h1>
        <p className="max-w-3xl text-sm text-muted">
          Message envoyé à un public de l’application Moboo Pro : il arrive dans le centre de notifications et, si le téléphone est inscrit, en notification push.
          Remplace l’envoi de l’extension WordPress « Moboo Notifications ». Pour un seul compte, passez par sa fiche (Comptes).
        </p>
      </div>
      <BroadcastForm audiences={d.audiences} />
      <Section title="Derniers envois">
        {d.history.length ? (
          <ul className="divide-y divide-slate-100">
            {d.history.map((h) => (
              <li key={h.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                <span><span className="text-ink">{h.label}</span>{h.by ? <span className="block text-xs text-muted">par {h.by}</span> : null}</span>
                <span className="shrink-0 text-xs text-muted">{fmtDate(h.date)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="p-6 text-center text-sm text-muted">Aucun envoi pour l’instant.</p>}
      </Section>
    </div>
  );
}
