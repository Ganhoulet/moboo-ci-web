"use client";

import { useState, useTransition } from "react";
import { AdForm, AdsTable, LeadsList, ProviderForm, STATUS, type Ad, type Lead, type Provider } from "@/components/service-ads-manager";
import { adminAdAction, adminCreateAdAction, adminLeadStatusAction, adminProviderStatusAction, adminSaveProviderAction } from "@/app/admin/publicite/services/actions";

type Data = { options: { enabled: boolean; prices: { day: number; click: number; lead: number }; review: boolean; categories: string[] }; providers: (Provider & { account: { phone: string; firstName: string | null; lastName: string | null; companyName: string | null } | null })[]; ads: Ad[]; leads: Lead[] };

/** Back-office : valider les fiches et les campagnes, en créer pour un client, suivre les demandes. */
export function ServiceAdsAdmin({ data }: { data: Data }) {
  const [tab, setTab] = useState<"providers" | "ads" | "leads">("providers");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (p: Promise<{ ok: boolean; error?: string }>) => start(async () => { const r = await p; setMsg(r.ok ? null : r.error ?? "Erreur."); });
  const pendingCount = data.providers.filter((p) => p.status === "pending").length + data.ads.filter((a) => a.status === "pending").length;
  const box = "rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-sm">
        {([["providers", `Prestataires (${data.providers.length})`], ["ads", `Campagnes (${data.ads.length})`], ["leads", `Demandes (${data.leads.length})`]] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={"rounded-full px-3 py-1 font-semibold " + (tab === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</button>
        ))}
        {pendingCount ? <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">{pendingCount} à valider</span> : null}
        {!data.options.enabled ? <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-800">Désactivées dans les réglages</span> : null}
      </div>
      {msg ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{msg}</p> : null}

      {tab === "providers" ? (
        <div className={box}>
          <div className="mb-3 flex justify-between"><h2 className="font-bold text-ink">Prestataires</h2><button type="button" onClick={() => setEditing(editing === "new" ? null : "new")} className="text-sm font-semibold text-brand-800">+ Créer pour un client</button></div>
          {editing === "new" ? <div className="mb-4 rounded-lg bg-slate-50 p-3"><ProviderForm team categories={data.options.categories} onSave={(v) => adminSaveProviderAction(v)} /></div> : null}
          <ul className="space-y-2">
            {data.providers.map((p) => (
              <li key={p.id} className="rounded-lg ring-1 ring-slate-200">
                <div className="flex flex-wrap items-center gap-2 p-3 text-sm">
                  <span className="font-semibold text-ink">{p.name}</span><span className="text-muted">{p.category}</span>
                  <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (STATUS[p.status]?.[1] ?? "")}>{STATUS[p.status]?.[0] ?? p.status}</span>
                  <span className="text-xs text-muted">{p.account ? `compte ${p.account.companyName || [p.account.firstName, p.account.lastName].filter(Boolean).join(" ") || p.account.phone}` : "géré par l’équipe"} · {p.views} visites · {p.calls + p.whatsapps} contacts · {p.leadsCount} demandes</span>
                  <span className="ml-auto flex flex-wrap gap-1">
                    {p.status !== "approved" ? <button type="button" disabled={pending} onClick={() => run(adminProviderStatusAction(p.id, "approved"))} className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">Valider</button> : <a href={`/prestataires/${p.slug}`} target="_blank" className="rounded bg-white px-2 py-0.5 text-xs font-semibold ring-1 ring-slate-300">Voir</a>}
                    {p.status === "pending" ? <button type="button" disabled={pending} onClick={() => { const note = window.prompt("Motif du refus (envoyé au prestataire)"); if (note) run(adminProviderStatusAction(p.id, "rejected", note)); }} className="rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">Refuser</button> : null}
                    {p.status === "approved" ? <button type="button" disabled={pending} onClick={() => run(adminProviderStatusAction(p.id, "suspended"))} className="rounded bg-slate-600 px-2 py-0.5 text-xs font-semibold text-white">Suspendre</button> : null}
                    <button type="button" onClick={() => setEditing(editing === p.id ? null : p.id)} className="rounded bg-white px-2 py-0.5 text-xs font-semibold ring-1 ring-slate-300">{editing === p.id ? "Fermer" : "Modifier"}</button>
                  </span>
                </div>
                {editing === p.id ? <div className="border-t border-slate-100 p-3"><ProviderForm team initial={p} categories={data.options.categories} onSave={(v) => adminSaveProviderAction(v, p.id)} /></div> : null}
              </li>
            ))}
            {!data.providers.length ? <li className="text-sm text-muted">Aucun prestataire. Créez-en un pour un client, ou laissez les entreprises s’inscrire depuis « Mon espace → Publicités de services ».</li> : null}
          </ul>
        </div>
      ) : null}

      {tab === "ads" ? (
        <>
          <div className={box}><h2 className="mb-3 font-bold text-ink">Créer une campagne (offerte ou payée hors ligne)</h2><AdForm team providers={data.providers.filter((p) => p.status === "approved")} prices={data.options.prices} onCreate={adminCreateAdAction} /></div>
          <div className={box}>
            <h2 className="mb-3 font-bold text-ink">Campagnes</h2>
            <AdsTable ads={data.ads} providers={data.providers} actions={(a) => (
              <span className="flex flex-wrap justify-end gap-1">
                {a.status === "pending" ? <>
                  <button type="button" disabled={pending} onClick={() => run(adminAdAction(a.id, "approve"))} className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">Valider</button>
                  <button type="button" disabled={pending} onClick={() => { const note = window.prompt("Motif du refus (crédits rendus)"); if (note) run(adminAdAction(a.id, "reject", note)); }} className="rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">Refuser</button>
                </> : null}
                {a.status === "active" ? <button type="button" disabled={pending} onClick={() => run(adminAdAction(a.id, "pause"))} className="rounded bg-slate-600 px-2 py-0.5 text-xs font-semibold text-white">Pause</button> : null}
                {a.status === "paused" ? <button type="button" disabled={pending} onClick={() => run(adminAdAction(a.id, "resume"))} className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">Reprendre</button> : null}
                {["active", "paused"].includes(a.status) ? <button type="button" disabled={pending} onClick={() => { if (window.confirm("Terminer la campagne ? Le budget non dépensé est rendu.")) run(adminAdAction(a.id, "end")); }} className="rounded bg-white px-2 py-0.5 text-xs font-semibold ring-1 ring-slate-300">Terminer</button> : null}
              </span>
            )} />
          </div>
        </>
      ) : null}

      {tab === "leads" ? <div className={box}><h2 className="mb-3 font-bold text-ink">Demandes envoyées aux prestataires</h2><LeadsList leads={data.leads} providers={data.providers} onStatus={adminLeadStatusAction} /></div> : null}
    </div>
  );
}
