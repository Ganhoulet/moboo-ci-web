"use client";

import { useState, useTransition } from "react";
import { saveAssistantAction, testAssistantAction, type AssistantSettings } from "@/app/admin/sejours/actions";

/** Réglages et essai de l'assistant WhatsApp des séjours. */
export function AssistantPanel({ initial }: { initial: AssistantSettings }) {
  const [s, setS] = useState(initial);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("Bonsoir, un studio près de l’aéroport pour ce soir, budget 25 000 F ?");
  const [reply, setReply] = useState("");
  const [pending, start] = useTransition();
  const save = () => start(async () => { const r = await saveAssistantAction(s); setMsg(r.ok ? "Réglages enregistrés." : r.error); });
  const test = () => start(async () => { setReply("…"); const r = await testAssistantAction(q); setReply(r.ok ? r.reply : r.error); });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <label className="flex items-center gap-2 font-semibold text-ink"><input type="checkbox" checked={s.enabled} onChange={(e) => setS({ ...s, enabled: e.target.checked })} /> Assistant activé</label>
        <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={s.testOnly} onChange={(e) => setS({ ...s, testOnly: e.target.checked })} /> Mode test : répondre seulement aux numéros ci-dessous</label>
        <label className="block text-sm"><span className="font-semibold text-ink">Numéros autorisés en mode test</span>
          <textarea rows={3} value={s.testNumbers} onChange={(e) => setS({ ...s, testNumbers: e.target.value })} placeholder={"07 07 00 00 01\n05 05 00 00 02"} className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
          <span className="text-xs text-muted">Un numéro par ligne.</span></label>
        <label className="block text-sm"><span className="font-semibold text-ink">Réponses maximum par numéro et par jour</span>
          <input type="number" min={1} max={200} value={s.maxPerDay} onChange={(e) => setS({ ...s, maxPerDay: Number(e.target.value) })} className="mt-1 w-32 rounded-lg border border-slate-300 p-2" /></label>
        <label className="block text-sm"><span className="font-semibold text-ink">Message quand l’assistant passe la main à l’équipe</span>
          <textarea rows={2} value={s.handoff} onChange={(e) => setS({ ...s, handoff: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2" /></label>
        <button type="button" onClick={save} disabled={pending} className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">Enregistrer</button>
        {msg ? <p className="text-sm text-muted" role="status">{msg}</p> : null}
      </div>
      <div className="space-y-3 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="font-semibold text-ink">Essayer une question</p>
        <p className="text-sm text-muted">La réponse s’affiche ici ; rien n’est envoyé sur WhatsApp.</p>
        <textarea rows={3} value={q} onChange={(e) => setQ(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2 text-sm" />
        <button type="button" onClick={test} disabled={pending || !q.trim()} className="rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">{pending ? "Réponse…" : "Tester"}</button>
        {reply ? <div className="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-ink ring-1 ring-slate-200">{reply}</div> : null}
      </div>
    </div>
  );
}
