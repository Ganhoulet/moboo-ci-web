import Link from "next/link";
import { authedFetch } from "@/lib/server-api";
import { EventSettingsForm, type EventSettings, type Saison } from "@/components/backoffice/event-settings-form";

export const dynamic = "force-dynamic";

/** Réglages des réservations d'espaces payées en ligne (acompte, solde, annulation, haute saison). */
export default async function EventSettingsPage() {
  const [s, z] = await Promise.all([
    authedFetch("/site/admin/event-online/settings", { method: "GET" }),
    authedFetch("/site/admin/event-online/saisons", { method: "GET" }),
  ]);
  if (!s.ok || !z.ok) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Réglages indisponibles.</p>;
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/comptes/evenements" className="text-sm font-semibold text-brand-800 hover:underline">← Événements en cours</Link>
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Réglages des réservations d’espaces</h1>
        <p className="text-sm text-muted">S’appliquent aux salles Moboo Event réservées sur Moboo.ci. La caution se règle toujours sur place, hors Moboo.</p>
      </div>
      <EventSettingsForm s={s.data as EventSettings} saisons={z.data as Saison[]} />
    </div>
  );
}
