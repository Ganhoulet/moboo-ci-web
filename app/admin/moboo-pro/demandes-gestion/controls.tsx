"use client";

import { useState, useTransition } from "react";
import { setMandatRequestAction } from "../outils-actions";
import { STATUS_LABEL } from "./labels";

export function RequestControls({ id, status, note }: { id: number; status: string; note: string | null }) {
  const [pending, start] = useTransition();
  const [value, setValue] = useState(status);
  const [text, setText] = useState(note ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="mt-3 flex flex-wrap items-end gap-2">
      <label className="text-xs font-semibold text-slate-600">Statut
        <select value={value} onChange={(e) => setValue(e.target.value)} className="mt-1 block rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </label>
      <label className="min-w-[14rem] flex-1 text-xs font-semibold text-slate-600">Note interne (agence proposée, suite…)
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </label>
      <button type="button" disabled={pending}
        onClick={() => start(async () => { const r = await setMandatRequestAction(id, value, text); setMsg(r.ok ? { ok: true, text: "Enregistré." } : { ok: false, text: r.error ?? "Erreur." }); })}
        className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">Enregistrer</button>
      {msg ? <span className={"text-xs " + (msg.ok ? "text-emerald-700" : "text-red-700")}>{msg.text}</span> : null}
    </div>
  );
}
