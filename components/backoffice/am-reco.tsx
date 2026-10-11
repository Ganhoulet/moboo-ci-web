"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dismissRecoAction, sendRecoAction } from "@/app/admin/comptes/actions";

export interface RecoItem {
  code: string; itemId: string; item: string; category: string; impact: "fort" | "moyen" | "faible";
  title: string; detail: string; how: string; message: string; metric?: string;
  state: { status: string; channel: string | null; sentAt: string | null; note: string | null } | null;
}
const IMPACT: Record<string, string> = { fort: "bg-red-50 text-red-700 ring-red-200", moyen: "bg-amber-50 text-amber-800 ring-amber-200", faible: "bg-slate-100 text-slate-600 ring-slate-200" };
const CHANNEL: Record<string, string> = { whatsapp: "WhatsApp", email: "e-mail", notice: "Infos Moboo" };

export function ScoreRing({ score }: { score: number }) {
  const tone = score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  return (
    <div className="relative grid h-16 w-16 place-items-center">
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90"><circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" /><circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${(score / 100) * 97.4} 97.4`} className={tone} /></svg>
      <span className={"font-display text-lg font-extrabold " + tone}>{score}</span>
    </div>
  );
}

/** Une recommandation : quoi, pourquoi, où corriger, message prêt à envoyer. */
function RecoRow({ kind, id, r, contact }: { kind: string; id: string; r: RecoItem; contact: { email: boolean; notice: boolean; whatsapp: string | null } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState(r.message);
  const [pending, start] = useTransition();
  const [info, setInfo] = useState<{ ok: boolean; text: string } | null>(null);
  const sendVia = (channel: string) => start(async () => {
    // WhatsApp : la fenêtre s'ouvre tout de suite (sinon bloquée par le navigateur), l'envoi est noté ensuite.
    const w = channel === "whatsapp" ? window.open("about:blank", "_blank") : null;
    const res = await sendRecoAction(kind, id, { code: r.code, itemId: r.itemId, channel, message: msg });
    if (!res.ok) { w?.close(); return setInfo({ ok: false, text: res.error ?? "Erreur." }); }
    if (w && res.data?.waUrl) w.location.href = res.data.waUrl;
    setInfo({ ok: true, text: `Envoyée (${CHANNEL[channel]}).` }); setOpen(false); router.refresh();
  });
  const dismissed = r.state?.status === "dismissed";
  return (
    <li className={"py-3 " + (dismissed ? "opacity-60" : "")} data-reco={`${r.code}:${r.itemId}`}>
      <div className="flex flex-wrap items-start gap-2">
        <span className={"rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ring-1 " + IMPACT[r.impact]}>{r.impact}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{r.title}{r.metric ? <span className="ml-1 font-normal text-muted">· {r.metric}</span> : null}</p>
          <p className="text-xs text-muted">{r.item} · {r.category}</p>
          <p className="mt-0.5 text-sm text-slate-600">{r.detail}</p>
          <p className="mt-0.5 text-xs text-slate-500">Où corriger : {r.how}</p>
          {r.state ? <p className="mt-1 text-xs font-semibold text-brand-800">{r.state.status === "sent" ? `✓ Envoyée par ${CHANNEL[r.state.channel ?? ""] ?? r.state.channel} le ${new Date(r.state.sentAt!).toLocaleDateString("fr-FR")} — en attente de correction` : `Ignorée${r.state.note ? ` : ${r.state.note}` : ""}`}</p> : null}
        </div>
        <button type="button" onClick={() => setOpen(!open)} className="rounded-md px-2.5 py-1 text-xs font-semibold text-brand-800 ring-1 ring-slate-300">{open ? "Fermer" : r.state?.status === "sent" ? "Relancer" : "Envoyer à l’hôte"}</button>
      </div>
      {open ? (
        <div className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3">
          <textarea className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm" rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={pending || !contact.whatsapp} onClick={() => sendVia("whatsapp")} className="rounded-md bg-[#25D366] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40">WhatsApp</button>
            <button type="button" disabled={pending || !contact.email} onClick={() => sendVia("email")} className="rounded-md bg-brand-800 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40">E-mail</button>
            <button type="button" disabled={pending || !contact.notice} onClick={() => sendVia("notice")} className="rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40" title="Message dans son espace moboo.ci (Infos Moboo)">Infos Moboo</button>
            {!dismissed ? <button type="button" disabled={pending} onClick={() => { const note = prompt("Pourquoi ignorer ? (facultatif)") ?? ""; start(async () => { await dismissRecoAction(kind, id, { code: r.code, itemId: r.itemId, note }); router.refresh(); }); }} className="ml-auto text-xs font-semibold text-slate-500">Ignorer</button> : null}
          </div>
          {!contact.email || !contact.notice ? <p className="text-xs text-muted">{!contact.email ? "Pas d’e-mail connu. " : ""}{!contact.notice ? "Pas d’espace moboo.ci au même numéro." : ""}</p> : null}
        </div>
      ) : null}
      {info ? <p className={"mt-1 text-xs font-semibold " + (info.ok ? "text-emerald-700" : "text-red-600")}>{info.text}</p> : null}
    </li>
  );
}

export function RecoList({ kind, id, data }: { kind: string; id: string; data: { items: RecoItem[]; fixed: number; score: number; contact: { email: boolean; notice: boolean; whatsapp: string | null } } }) {
  const [showAll, setShowAll] = useState(false);
  const active = data.items.filter((r) => r.state?.status !== "dismissed");
  const list = showAll ? data.items : active;
  return (
    <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200" id="recommandations">
      <div className="flex flex-wrap items-center gap-4">
        <ScoreRing score={data.score} />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-ink">💡 Recommandations</h2>
          <p className="text-sm text-muted">{active.length ? `${active.length} point(s) à améliorer, ${active.filter((r) => r.impact === "fort").length} à fort impact.` : "Rien à améliorer pour l’instant."} {data.fixed ? `${data.fixed} déjà corrigée(s) après envoi.` : ""}</p>
        </div>
        {data.items.length !== active.length ? <button type="button" onClick={() => setShowAll(!showAll)} className="text-xs font-semibold text-brand-800">{showAll ? "Masquer les ignorées" : "Voir les ignorées"}</button> : null}
      </div>
      <ul className="mt-2 divide-y divide-slate-100">
        {list.map((r) => <RecoRow key={`${r.code}:${r.itemId}`} kind={kind} id={id} r={r} contact={data.contact} />)}
      </ul>
    </section>
  );
}
