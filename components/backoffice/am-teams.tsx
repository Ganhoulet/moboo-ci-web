"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTeamAction, distributeAction, runAlertsAction, saveMemberAction, saveTeamAction } from "@/app/admin/comptes/actions";

const input = "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-600 focus:outline-none";
export interface AmTeam { id: string; name: string; zones: string[]; leadId: string | null; members: string[] }
export interface AmManager { id: string; name: string; phone: string; lead: boolean; teamId: string | null; zones: string[]; active: boolean; alertPhone: string | null; maxAccounts: number | null; accounts: number }

/** Équipe d'account managers : nom, zones couvertes, responsable, membres. */
export function TeamCard({ team, managers, canEdit }: { team: AmTeam | null; managers: AmManager[]; canEdit: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ name: team?.name ?? "", zones: (team?.zones ?? []).join(", "), leadId: team?.leadId ?? "", members: team?.members ?? [] });
  const [msg, setMsg] = useState<string | null>(null);
  const save = () => start(async () => {
    const r = await saveTeamAction(team?.id ?? null, { name: f.name, zones: f.zones, leadId: f.leadId || null, members: f.members });
    setMsg(r.ok ? "Équipe enregistrée." : r.error ?? "Erreur.");
    if (r.ok) { if (!team) setF({ name: "", zones: "", leadId: "", members: [] }); router.refresh(); }
  });
  return (
    <div className="space-y-2 rounded-lg bg-white p-4 ring-1 ring-slate-200" data-team={team?.id ?? "new"}>
      <input className={input + " font-semibold"} placeholder="Nom de l’équipe (ex. Équipe Cocody – Riviera)" value={f.name} disabled={!canEdit} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <label className="block text-xs font-semibold text-ink">Zones couvertes (communes, villes, quartiers — séparées par des virgules)
        <textarea className={input + " mt-1"} rows={2} placeholder="Cocody, Riviera, Angré, Bingerville" value={f.zones} disabled={!canEdit} onChange={(e) => setF({ ...f, zones: e.target.value })} />
      </label>
      <label className="block text-xs font-semibold text-ink">Responsable de l’équipe (reçoit les escalades)
        <select className={input + " mt-1"} value={f.leadId} disabled={!canEdit} onChange={(e) => setF({ ...f, leadId: e.target.value })}>
          <option value="">—</option>
          {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </label>
      <div>
        <p className="text-xs font-semibold text-ink">Membres</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {managers.map((m) => {
            const on = f.members.includes(m.id);
            return <button key={m.id} type="button" disabled={!canEdit} onClick={() => setF({ ...f, members: on ? f.members.filter((x) => x !== m.id) : [...f.members, m.id] })} className={"rounded-full px-2.5 py-1 text-xs font-semibold ring-1 " + (on ? "bg-brand-50 text-brand-800 ring-brand-300" : "bg-white text-slate-600 ring-slate-300")}>{on ? "✓ " : ""}{m.name}</button>;
          })}
          {!managers.length ? <span className="text-xs text-muted">Aucun administrateur n’a encore le rôle « Account manager ».</span> : null}
        </div>
      </div>
      {canEdit ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button type="button" disabled={pending || !f.name.trim()} onClick={save} className="rounded-md bg-brand-800 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">{team ? "Enregistrer" : "Créer l’équipe"}</button>
          {team ? <button type="button" disabled={pending} onClick={() => confirm(`Supprimer « ${team.name} » ? Les membres restent account managers.`) && start(async () => { await deleteTeamAction(team.id); router.refresh(); })} className="text-sm font-semibold text-red-600">Supprimer</button> : null}
          {msg ? <span className="text-sm text-muted">{msg}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

/** Ligne d'un account manager : équipe, zones propres, disponibilité, numéro d'alerte, plafond. */
export function MemberRow({ m, teams, canEdit, isMe }: { m: AmManager; teams: AmTeam[]; canEdit: boolean; isMe: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ teamId: m.teamId ?? "", zones: m.zones.join(", "), active: m.active, alertPhone: m.alertPhone ?? "", maxAccounts: m.maxAccounts ? String(m.maxAccounts) : "" });
  const [msg, setMsg] = useState<string | null>(null);
  const save = () => start(async () => {
    const body = canEdit ? { teamId: f.teamId || null, zones: f.zones, active: f.active, alertPhone: f.alertPhone, maxAccounts: f.maxAccounts } : { active: f.active, alertPhone: f.alertPhone };
    const r = await saveMemberAction(m.id, body);
    setMsg(r.ok ? "✓" : r.error ?? "Erreur."); if (r.ok) router.refresh();
  });
  const edit = canEdit || isMe;
  return (
    <tr className="border-t border-slate-100 align-top" data-member={m.id}>
      <td className="p-3"><b>{m.name}</b>{m.lead ? <span className="ml-1 rounded bg-violet-50 px-1.5 text-[11px] font-semibold text-violet-800">responsable</span> : null}<br /><span className="text-xs text-muted">{m.phone} · {m.accounts} compte(s)</span></td>
      <td className="p-3"><select className={input} value={f.teamId} disabled={!canEdit} onChange={(e) => setF({ ...f, teamId: e.target.value })} aria-label="Équipe"><option value="">— Sans équipe —</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></td>
      <td className="p-3"><input className={input} placeholder="Zones en plus de l’équipe" value={f.zones} disabled={!canEdit} onChange={(e) => setF({ ...f, zones: e.target.value })} aria-label="Zones propres" /></td>
      <td className="p-3"><input className={input} placeholder="Numéro d’alerte" value={f.alertPhone} disabled={!edit} onChange={(e) => setF({ ...f, alertPhone: e.target.value })} aria-label="Numéro d’alerte" /></td>
      <td className="p-3"><input className={input + " w-20"} inputMode="numeric" placeholder="∞" value={f.maxAccounts} disabled={!canEdit} onChange={(e) => setF({ ...f, maxAccounts: e.target.value.replace(/\D/g, "") })} aria-label="Plafond" /></td>
      <td className="p-3"><label className="flex items-center gap-1.5 text-sm"><input type="checkbox" className="h-4 w-4" checked={f.active} disabled={!edit} onChange={(e) => setF({ ...f, active: e.target.checked })} />{f.active ? "Disponible" : "Absent"}</label></td>
      <td className="p-3">{edit ? <button type="button" disabled={pending} onClick={save} className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white">Enregistrer</button> : null} {msg ? <span className="text-xs text-muted">{msg}</span> : null}</td>
    </tr>
  );
}

export function TeamTools() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const L: Record<string, string> = { org: "résidences", event: "espaces", site: "membres" };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending} onClick={() => start(async () => {
        const r = await distributeAction();
        setMsg(r.ok ? `Répartition faite : ${Object.entries(r.data ?? {}).map(([k, v]: [string, any]) => `${v.assigned} ${L[k]} attribué(s)${v.noZone ? `, ${v.noZone} hors zones` : ""}`).join(" · ")}` : r.error ?? "Erreur.");
        router.refresh();
      })} className="rounded-md bg-brand-800 px-3 py-1.5 text-sm font-semibold text-white">{pending ? "…" : "Répartir maintenant par zone"}</button>
      <button type="button" disabled={pending} onClick={() => start(async () => {
        const r = await runAlertsAction();
        setMsg(r.ok ? `Alertes vérifiées : ${r.data?.alerted ?? 0} envoyée(s), ${r.data?.escalated ?? 0} escalade(s).` : r.error ?? "Erreur.");
      })} className="rounded-md px-3 py-1.5 text-sm font-semibold text-ink ring-1 ring-slate-300">Vérifier les alertes maintenant</button>
      {msg ? <span className="text-sm text-muted">{msg}</span> : null}
    </div>
  );
}
