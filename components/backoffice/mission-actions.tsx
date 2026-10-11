"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { missionAgents, missionAssign, missionSetStatus } from "@/app/admin/services/actions";

type Agent = { id: string; name: string; phone: string; zone: string; moboo: boolean; verified: boolean; type: string; inZone: boolean };
interface Mission { uuid: string; id: number; title: string; status: string; where: string; prop_type: string; full_name: string; price: number; moboo_note: string; agent_id: string | null }

/** Actions d'une mission : attribuer à un agent (reçue dans Moboo Pro), remettre à attribuer, clôturer. */
export function MissionActions({ m }: { m: Mission }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const act = (status: string, ok: string) => start(async () => { const x = await missionSetStatus(m.uuid, status); setMsg(x.ok ? ok : x.error ?? "Erreur."); if (x.ok) router.refresh(); });
  const done = m.status === "done" || m.status === "cancelled";
  const small = "rounded-md px-2 py-1 text-xs font-semibold ring-1 disabled:opacity-50";
  return (
    <div className="flex flex-col items-start gap-1">
      {!done ? <button type="button" onClick={() => setOpen(true)} className={small + " bg-ink text-white ring-ink"}>{m.agent_id ? "Réattribuer" : "Attribuer"}</button> : null}
      {m.agent_id && !done ? <button type="button" disabled={pending} onClick={() => act("new", "Remise à attribuer.")} className={small + " ring-slate-300"}>Retirer l’agent</button> : null}
      {m.agent_id && !done ? <button type="button" disabled={pending} onClick={() => act("done", "Marquée réalisée.")} className={small + " ring-emerald-300 text-emerald-800"}>Réalisée</button> : null}
      {!done ? <button type="button" disabled={pending} onClick={() => { if (confirm("Annuler cette mission ?")) act("cancelled", "Annulée."); }} className={small + " ring-red-200 text-red-700"}>Annuler</button> : null}
      {m.status === "cancelled" ? <button type="button" disabled={pending} onClick={() => act("new", "Rouverte.")} className={small + " ring-slate-300"}>Rouvrir</button> : null}
      {msg ? <span className="text-[11px] text-muted">{msg}</span> : null}
      {open ? <AssignDialog m={m} onClose={() => setOpen(false)} onDone={(t) => { setOpen(false); setMsg(t); router.refresh(); }} /> : null}
    </div>
  );
}

function AssignDialog({ m, onClose, onDone }: { m: Mission; onClose: () => void; onDone: (msg: string) => void }) {
  const [q, setQ] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pick, setPick] = useState(m.agent_id ?? "");
  const [price, setPrice] = useState(m.price ? String(m.price) : "");
  const [note, setNote] = useState(m.moboo_note ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => {
    const t = setTimeout(() => { void missionAgents(m.uuid, q).then((x) => setAgents(x.data?.items ?? [])); }, 250);
    return () => clearTimeout(t);
  }, [q, m.uuid]);
  const input = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
  return (
    <div role="dialog" aria-modal="true" aria-label="Attribuer la mission" className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg space-y-3 rounded-xl bg-white p-5 text-left shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="font-display text-lg font-bold text-ink">Mission n° {m.id} : {m.title}</p>
        <p className="text-xs text-muted">{m.full_name} · {m.prop_type || "Bien"} · {m.where}. L’agent la reçoit dans Moboo Pro › Missions Moboo (notification + e-mail) ; le client est prévenu par SMS.</p>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un agent ou une agence…" className={input} />
        <ul className="max-h-60 divide-y divide-slate-100 overflow-y-auto rounded-md ring-1 ring-slate-200">
          {agents.map((a) => (
            <li key={a.id}>
              <label className={"flex cursor-pointer items-center gap-3 px-3 py-2 text-sm " + (pick === a.id ? "bg-brand-50" : "hover:bg-slate-50")}>
                <input type="radio" name="agent" checked={pick === a.id} onChange={() => setPick(a.id)} />
                <span className="min-w-0 flex-1">
                  <b>{a.name}</b>{a.verified ? " ✅" : ""} <span className="text-xs text-muted">({a.type})</span>
                  {a.moboo ? <span className="ml-1 rounded bg-accent-100 px-1.5 text-[10px] font-bold text-accent-800">AGENT MOBOO</span> : null}
                  {a.inZone ? <span className="ml-1 rounded bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-800">DANS LA ZONE</span> : null}
                  <br /><span className="text-xs text-muted">{a.phone} · {a.zone || "—"}</span>
                </span>
              </label>
            </li>
          ))}
          {!agents.length ? <li className="p-3 text-xs text-muted">Aucun agent proposé : tapez au moins 2 lettres, ou ajoutez vos agents Moboo dans Réglages › État des lieux.</li> : null}
        </ul>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">Rémunération de l’agent (FCFA)<input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={input + " mt-1"} /></label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Note pour l’agent<textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={input + " mt-1"} /></label>
        </div>
        {err ? <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-semibold ring-1 ring-slate-300">Fermer</button>
          <button type="button" disabled={!pick || pending} onClick={() => start(async () => { const x = await missionAssign(m.uuid, pick, Number(price) || 0, note); if (x.ok) onDone(`Attribuée à ${x.data?.agent ?? "l’agent"}.`); else setErr(x.error ?? "Erreur."); })}
            className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Envoi…" : "Attribuer"}</button>
        </div>
      </div>
    </div>
  );
}
