"use client";

import { useState, useTransition } from "react";
import { assignAction, reportAction } from "@/app/admin/comptes/studio/actions";

/** Attribuer une annonce publiée par l'équipe à un autre annonceur (qui a donné son accord). */
export function AssignListing({ listingId, currentId, agents }: { listingId: string; currentId: string | null; agents: { id: string; name: string }[] }) {
  const [value, setValue] = useState(currentId ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="flex items-center gap-1">
      <select value={value} onChange={(e) => setValue(e.target.value)} className="max-w-[160px] rounded border border-slate-300 px-1 py-0.5 text-xs" aria-label="Attribuer à">
        {!agents.some((a) => a.id === currentId) && currentId ? <option value={currentId}>(annonceur actuel)</option> : null}
        {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      {value && value !== currentId ? (
        <button type="button" disabled={pending} className="rounded bg-ink px-2 py-0.5 text-xs font-semibold text-white disabled:opacity-50"
          onClick={() => start(async () => { const r = await assignAction(listingId, value); setMsg(r.ok ? "Attribuée" : r.error ?? "Impossible"); })}>
          Attribuer
        </button>
      ) : null}
      {msg ? <span className="text-[11px] text-muted">{msg}</span> : null}
    </span>
  );
}

/** Bilan des 7 derniers jours de l'annonceur → WhatsApp pré-rempli. */
export function SendReport({ accountId }: { accountId: string }) {
  const [pending, start] = useTransition();
  const [info, setInfo] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-1">
      <button type="button" disabled={pending} className="rounded bg-[#25D366] px-2 py-0.5 text-xs font-semibold text-white disabled:opacity-50"
        onClick={() => start(async () => {
          const r = await reportAction(accountId, 7);
          if (!r.ok) return setInfo(r.error ?? "Bilan indisponible");
          setInfo(`${r.data.totals.views} vues · ${r.data.totals.calls} appels · ${r.data.totals.whatsapp} WhatsApp`);
          if (r.data.wa) window.open(r.data.wa, "_blank", "noopener");
        })}>
        Bilan WhatsApp
      </button>
      {info ? <span className="text-[11px] text-muted">{info}</span> : null}
    </span>
  );
}
