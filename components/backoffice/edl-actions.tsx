"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { edlAgents, edlAssign, edlDispatch, edlSetStatus } from "@/app/admin/services/actions";

type Agent = { id: string; name: string; phone: string; zone: string; moboo: boolean; verified: boolean };
interface Req { uuid: string; id: number; status: string; zone: string; prop_type: string; full_name: string; agreed_price: number; note: string; selected_agent_id: string | null }

/** Actions d'une demande d'état des lieux : attribuer à un agent (Moboo Pro), diffuser, clôturer. */
export function EdlActions({ r, mode }: { r: Req; mode: "moboo" | "agents" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<{ ok: boolean; error?: string; data?: any }>, ok: (d: any) => string) =>
    start(async () => { const x = await fn(); setMsg(x.ok ? ok(x.data) : x.error ?? "Erreur."); if (x.ok) router.refresh(); });
  const done = r.status === "completed" || r.status === "cancelled";
  const small = "rounded-md px-2 py-1 text-xs font-semibold ring-1 disabled:opacity-50";
  return (
    <div className="flex flex-col items-start gap-1">
      {!done ? <button type="button" onClick={() => setOpen(true)} className={small + " bg-ink text-white ring-ink"}>{r.status === "selected" ? "Réattribuer" : "Attribuer"}</button> : null}
      {r.status === "open" && mode === "moboo" ? (
        <button type="button" disabled={pending} onClick={() => act(() => edlDispatch(r.uuid), (d) => `Diffusée à ${d?.agents ?? 0} agent(s).`)} className={small + " ring-slate-300"}>Diffuser aux agents</button>
      ) : null}
      {r.status === "selected" ? <button type="button" disabled={pending} onClick={() => act(() => edlSetStatus(r.uuid, "completed"), () => "Marquée réalisée.")} className={small + " ring-emerald-300 text-emerald-800"}>Réalisé</button> : null}
      {!done ? <button type="button" disabled={pending} onClick={() => { if (confirm("Annuler cette demande ?")) act(() => edlSetStatus(r.uuid, "cancelled"), () => "Annulée."); }} className={small + " ring-red-200 text-red-700"}>Annuler</button> : null}
      {r.status === "cancelled" ? <button type="button" disabled={pending} onClick={() => act(() => edlSetStatus(r.uuid, "open"), () => "Rouverte.")} className={small + " ring-slate-300"}>Rouvrir</button> : null}
      {msg ? <span className="text-[11px] text-muted">{msg}</span> : null}
      {open ? <AssignDialog r={r} onClose={() => setOpen(false)} onDone={(t) => { setOpen(false); setMsg(t); router.refresh(); }} /> : null}
    </div>
  );
}

function AssignDialog({ r, onClose, onDone }: { r: Req; onClose: () => void; onDone: (msg: string) => void }) {
  const [q, setQ] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pick, setPick] = useState<string>(r.selected_agent_id ?? "");
  const [price, setPrice] = useState(r.agreed_price ? String(r.agreed_price) : "");
  const [note, setNote] = useState(r.note ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => {
    const t = setTimeout(() => { void edlAgents(q).then((x) => setAgents(x.data?.items ?? [])); }, 250);
    return () => clearTimeout(t);
  }, [q]);
  const input = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
  return (
    <div role="dialog" aria-modal="true" aria-label="Attribuer l’état des lieux" className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg space-y-3 rounded-xl bg-white p-5 text-left shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="font-display text-lg font-bold text-ink">Attribuer la demande #{r.id}</p>
        <p className="text-xs text-muted">{r.full_name} · {r.prop_type || "Bien"} · {r.zone}. L’agent la reçoit aussitôt dans Moboo Pro (notification + e-mail), sans séquestre.</p>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un agent (nom, téléphone, commune)…" className={input} />
        <ul className="max-h-60 divide-y divide-slate-100 overflow-y-auto rounded-md ring-1 ring-slate-200">
          {agents.map((a) => (
            <li key={a.id}>
              <label className={"flex cursor-pointer items-center gap-3 px-3 py-2 text-sm " + (pick === a.id ? "bg-brand-50" : "hover:bg-slate-50")}>
                <input type="radio" name="agent" checked={pick === a.id} onChange={() => setPick(a.id)} />
                <span className="min-w-0 flex-1"><b>{a.name}</b>{a.verified ? " ✅" : ""} {a.moboo ? <span className="ml-1 rounded bg-accent-100 px-1.5 text-[10px] font-bold text-accent-800">AGENT MOBOO</span> : null}<br /><span className="text-xs text-muted">{a.phone} · {a.zone || "—"}</span></span>
              </label>
            </li>
          ))}
          {!agents.length ? <li className="p-3 text-xs text-muted">{q.length < 2 ? "Ajoutez vos agents Moboo dans Réglages › États des lieux, ou tapez au moins 2 lettres." : "Aucun agent trouvé."}</li> : null}
        </ul>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">Prix convenu (FCFA, facultatif)<input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={input + " mt-1"} /></label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Note pour l’agent<textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={input + " mt-1"} placeholder="Ex. rappeler le client avant 10 h" /></label>
        </div>
        {err ? <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-semibold ring-1 ring-slate-300">Fermer</button>
          <button type="button" disabled={!pick || pending} onClick={() => start(async () => { const x = await edlAssign(r.uuid, pick, Number(price) || 0, note); if (x.ok) onDone(`Attribuée à ${x.data?.agent ?? "l’agent"}.`); else setErr(x.error ?? "Erreur."); })}
            className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Envoi…" : "Attribuer"}</button>
        </div>
      </div>
    </div>
  );
}
