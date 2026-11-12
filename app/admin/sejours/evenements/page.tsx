import { EventsBoard } from "@/components/stays/admin-events";
import { listEvents } from "../actions";

export const dynamic = "force-dynamic";

/** Back-office → Séjours → Événements : pages « Où dormir pendant … ». */
export default async function AdminStayEvents() {
  const rows = await listEvents();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Événements</h1>
        <p className="max-w-3xl text-sm text-muted">Concert, festival, salon, match, congrès : créez une page « Où dormir pendant … » qui liste les résidences autour du lieu, de la plus proche à la plus éloignée, avec les dates de séjour déjà remplies et, pour les calendriers suivis, les logements libres sur toute la période. Publiez-la 4 à 8 semaines avant pour que Google la trouve à temps. La page quitte le sommaire après le dernier jour.</p>
      </div>
      {rows ? <EventsBoard rows={rows} /> : <p className="rounded-lg bg-white p-6 text-muted ring-1 ring-slate-200">Chargement impossible (droits « Pages SEO » requis).</p>}
    </div>
  );
}
