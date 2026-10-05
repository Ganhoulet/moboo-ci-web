"use client";

import { useState, useTransition } from "react";
import { updateProLeadAction, type ProLead } from "@/app/admin/professionnels/demandes/actions";

const ST: Record<string, [string, string]> = {
  new: ["Nouvelle", "bg-sky-100 text-sky-800"], contacted: ["Contactée", "bg-violet-100 text-violet-800"],
  won: ["Inscrite / gagnée", "bg-emerald-100 text-emerald-800"], lost: ["Sans suite", "bg-slate-200 text-slate-600"],
};

/** Une demande de rappel : coordonnées, appel / WhatsApp, statut, note. */
export function ProLeadRow({ lead, audiences }: { lead: ProLead; audiences: Record<string, string> }) {
  const [status, setStatus] = useState(lead.status);
  const [note, setNote] = useState(lead.note ?? "");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const save = (patch: { status?: string; note?: string }) => start(async () => { const r = await updateProLeadAction(lead.id, patch); setSaved(r.ok); });
  const [l, c] = ST[status] ?? ST.new;
  const wa = lead.phone.replace(/[^\d]/g, "");
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">{lead.name}{lead.company ? <span className="font-normal text-muted"> · {lead.company}</span> : null}</p>
          <p className="text-xs text-muted">{audiences[lead.audience] ?? lead.audience}{lead.city ? ` · ${lead.city}` : ""} · {new Date(lead.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}{lead.source ? ` · depuis ${lead.source}` : ""}</p>
        </div>
        <span className={"rounded px-2 py-0.5 text-xs font-semibold " + c}>{l}</span>
      </div>
      {lead.message ? <p className="mt-2 whitespace-pre-line rounded-md bg-slate-50 p-3 text-sm text-slate-700">{lead.message}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <a href={`tel:${lead.phone}`} className="rounded-md bg-brand-700 px-3 py-1.5 font-semibold text-white hover:bg-brand-800">Appeler {lead.phone}</a>
        <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Bonjour ${lead.name}, ici l’équipe Moboo.ci suite à votre demande de rappel.`)}`} target="_blank" rel="noopener noreferrer" className="rounded-md bg-[#25D366] px-3 py-1.5 font-semibold text-white">WhatsApp</a>
        {lead.email ? <a href={`mailto:${lead.email}`} className="rounded-md bg-white px-3 py-1.5 font-semibold ring-1 ring-slate-300">{lead.email}</a> : null}
        <select value={status} disabled={pending} onChange={(e) => { setStatus(e.target.value); save({ status: e.target.value }); }} className="ml-auto rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {Object.entries(ST).map(([k, [lab]]) => <option key={k} value={k}>{lab}</option>)}
        </select>
      </div>
      <div className="mt-2 flex gap-2">
        <input value={note} onChange={(e) => { setNote(e.target.value); setSaved(false); }} placeholder="Note interne (rappelé le…, intéressé par…)" className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
        <button type="button" disabled={pending} onClick={() => save({ note })} className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50">{saved ? "✓" : "Enregistrer"}</button>
      </div>
    </div>
  );
}
