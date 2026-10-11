import Link from "next/link";
import { getSession } from "@/lib/session";
import { MemberRow, TeamCard, TeamTools, type AmManager, type AmTeam } from "@/components/backoffice/am-teams";
import { getAm } from "../actions";

export const dynamic = "force-dynamic";

/** Équipes d'account managers par zone, disponibilité, répartition automatique. */
export default async function AmTeams() {
  const [d, o] = await Promise.all([getAm<{ teams: AmTeam[]; managers: AmManager[]; unassigned: Record<string, number> }>("/teams"), getAm<any>("/overview")]);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Équipes indisponibles.</p>;
  const canEdit = !!o?.canSeeAll;
  const meId = getSession()?.id ?? "";
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Équipes et zones</h1>
        <p className="max-w-3xl text-sm text-muted">
          Chaque équipe couvre des zones (communes, villes, quartiers). Un compte sans account manager — nouvel hôte, nouvel annonceur, demande de réservation — est confié
          automatiquement au membre de sa zone le moins chargé (réglage « Répartition automatique », chaque heure et à chaque demande en attente).
          Les alertes « à appeler » partent vers son account manager, puis vers le responsable de l’équipe si personne ne réagit.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-amber-50 p-3 text-sm ring-1 ring-amber-200">
        <span className="font-semibold text-amber-900">Sans account manager : {d.unassigned.org ?? 0} résidence(s) · {d.unassigned.event ?? 0} espace(s) · {d.unassigned.site ?? 0} membre(s)</span>
        {canEdit ? <TeamTools /> : null}
        <Link href="/admin/comptes/reglages" className="ml-auto font-semibold text-brand-800 hover:underline">Délais et canaux d’alerte →</Link>
      </div>
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-ink">Équipes</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {d.teams.map((t) => <TeamCard key={`${t.id}-${t.zones.join(",")}-${t.leadId}-${t.members.join(",")}`} team={t} managers={d.managers} canEdit={canEdit} />)}
          {canEdit ? <TeamCard team={null} managers={d.managers} canEdit /> : null}
          {!d.teams.length && !canEdit ? <p className="text-sm text-muted">Aucune équipe pour l’instant.</p> : null}
        </div>
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold text-ink">Account managers</h2>
        <div className="overflow-x-auto rounded-lg bg-white ring-1 ring-slate-200">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-muted"><tr><th className="p-3">Nom</th><th className="p-3">Équipe</th><th className="p-3">Zones propres</th><th className="p-3">Alertes au</th><th className="p-3">Plafond</th><th className="p-3">Disponibilité</th><th className="p-3" /></tr></thead>
            <tbody>
              {d.managers.map((m) => <MemberRow key={`${m.id}-${m.teamId}-${m.zones.join(",")}-${m.active}-${m.alertPhone}-${m.maxAccounts}`} m={m} teams={d.teams} canEdit={canEdit} isMe={m.id === meId} />)}
              {!d.managers.length ? <tr><td colSpan={7} className="p-6 text-center text-muted">Donnez le rôle « Account manager » à vos commerciaux dans <Link href="/admin/administrateurs" className="underline">Administrateurs</Link>.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">« Absent » : ne reçoit plus de nouveaux comptes ni d’alertes (congés, maladie) ; son portefeuille reste à lui.</p>
      </section>
    </div>
  );
}
