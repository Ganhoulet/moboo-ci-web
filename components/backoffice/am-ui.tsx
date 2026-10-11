"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fcfa, since } from "@/lib/am";
import { addActivityAction, assignAction, bookingContactAction, confirmBookingAction, declineBookingAction, taskDoneAction } from "@/app/admin/comptes/actions";

const input = "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-600 focus:outline-none";
const digits = (p?: string | null) => String(p ?? "").replace(/\D/g, "");

/** Rafraîchit la page toute seule (nouvelles demandes de réservation, délais qui passent). */
export function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}

export interface PendingBooking {
  key: string; kind: "stay" | "event"; ref: string; title: string; place: string; start: string; end: string; guests: number;
  amount: number; deposit: number; waitingMinutes: number; urgent: boolean;
  host: { kind: string; id: string | null; name: string | null; phone: string | null; whatsapp: string | null };
  guest: { name: string; phone: string };
  managerId: string | null; managerName: string | null;
  lastAction: { type: string; outcome: string | null; body: string; by: string | null; at: string } | null;
}

const OUTCOME: Record<string, string> = { joint: "Joint", sans_reponse: "Sans réponse", rappeler: "À rappeler", interesse: "Intéressé", pas_interesse: "Pas intéressé", confirme: "Confirmée", refuse: "Refusée" };

/** Carte d'une demande en attente de l'hôte : appeler, noter, confirmer ou refuser pour lui. */
export function PendingBookingCard({ b }: { b: PendingBooking }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"" | "confirm" | "decline">("");
  const [agreed, setAgreed] = useState(false);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string; paymentUrl?: string | null }>, okText: string) => start(async () => {
    const r = await fn();
    setMsg(r.ok ? { ok: true, text: okText + (r.paymentUrl ? " Le client a reçu son lien de paiement." : "") } : { ok: false, text: r.error ?? "Erreur." });
    if (r.ok) { setMode(""); router.refresh(); }
  });
  const hostWa = digits(b.host.whatsapp || b.host.phone);
  const waText = encodeURIComponent(`Bonjour${b.host.name ? ` ${b.host.name}` : ""}, ici l’équipe Moboo.ci. Vous avez une demande de réservation (${b.ref}) pour ${b.title}, du ${b.start} au ${b.end}, ${b.guests} personne(s). Pouvez-vous la confirmer ?`);
  return (
    <article className={"rounded-xl bg-white p-4 ring-1 " + (b.urgent ? "ring-2 ring-red-400" : "ring-slate-200")} data-booking={b.key}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{b.kind === "stay" ? "Séjour (Moboo Resi)" : "Espace (Moboo Event)"} · {b.ref}</p>
          <p className="font-display text-base font-bold text-ink">{b.title}</p>
          <p className="text-sm text-slate-600">{b.place ? `${b.place} · ` : ""}{b.start} → {b.end} · {b.guests} pers. · {fcfa(b.amount)}{b.deposit ? ` (acompte ${fcfa(b.deposit)})` : ""}</p>
        </div>
        <span className={"shrink-0 rounded-full px-3 py-1 text-xs font-bold " + (b.urgent ? "bg-red-600 text-white" : "bg-amber-100 text-amber-900")}>
          {b.urgent ? "📞 À appeler · " : "En attente · "}{since(b.waitingMinutes)}
        </span>
      </div>
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold text-muted">Hôte</p>
          <p className="font-semibold text-ink">{b.host.name || "—"}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {b.host.phone ? <a href={`tel:${b.host.phone}`} onClick={() => bookingContactAction(b.key, "call", "", "Appel à l’hôte")} className="rounded-full bg-brand-800 px-3 py-1 text-xs font-bold text-white">📞 Appeler {b.host.phone}</a> : <span className="text-xs text-red-600">Pas de téléphone</span>}
            {hostWa ? <a href={`https://wa.me/${hostWa}?text=${waText}`} target="_blank" rel="noreferrer" onClick={() => bookingContactAction(b.key, "whatsapp", "", "Message WhatsApp à l’hôte")} className="rounded-full bg-[#25D366] px-3 py-1 text-xs font-bold text-white">WhatsApp</a> : null}
            {b.host.id ? <Link href={`/admin/comptes/${b.host.kind}/${b.host.id}`} className="rounded-full px-3 py-1 text-xs font-semibold text-brand-800 ring-1 ring-slate-300">Fiche de suivi</Link> : null}
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold text-muted">Client</p>
          <p className="font-semibold text-ink">{b.guest.name || "—"}</p>
          {b.guest.phone ? <div className="mt-1 flex flex-wrap gap-2"><a href={`tel:${b.guest.phone}`} className="rounded-full px-3 py-1 text-xs font-semibold text-brand-800 ring-1 ring-slate-300">📞 {b.guest.phone}</a><a href={`https://wa.me/${digits(b.guest.phone)}`} target="_blank" rel="noreferrer" className="rounded-full px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-slate-300">WhatsApp</a></div> : null}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">
        {b.managerName ? `Account manager : ${b.managerName}` : "Sans account manager"}
        {b.lastAction ? ` · Dernière action : ${b.lastAction.body}${b.lastAction.outcome ? ` (${OUTCOME[b.lastAction.outcome] ?? b.lastAction.outcome})` : ""}${b.lastAction.by ? ` — ${b.lastAction.by}` : ""}` : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => setMode(mode === "confirm" ? "" : "confirm")} className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">✓ Confirmer pour l’hôte</button>
        <button type="button" disabled={pending} onClick={() => setMode(mode === "decline" ? "" : "decline")} className="rounded-md px-3 py-1.5 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50">✕ Refuser (indisponible)</button>
        <button type="button" disabled={pending} onClick={() => run(() => bookingContactAction(b.key, "call", "sans_reponse", "Hôte injoignable"), "Noté : sans réponse.")} className="rounded-md px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Pas de réponse</button>
        <button type="button" disabled={pending} onClick={() => run(() => bookingContactAction(b.key, "call", "rappeler", "L’hôte vérifie et rappelle"), "Noté : à rappeler.")} className="rounded-md px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">L’hôte rappelle</button>
      </div>
      {mode === "confirm" ? (
        <div className="mt-3 space-y-2 rounded-lg bg-emerald-50 p-3 text-sm">
          <label className="flex items-start gap-2 font-semibold text-emerald-900">
            <input type="checkbox" className="mt-0.5 h-4 w-4" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            L’hôte m’a confirmé la disponibilité (par téléphone ou WhatsApp) et accepte cette réservation.
          </label>
          <input className={input} placeholder="Note (facultatif) : ex. joint à 14 h, clés chez le gardien" value={text} onChange={(e) => setText(e.target.value)} />
          <button type="button" disabled={!agreed || pending} onClick={() => run(() => confirmBookingAction(b.key, text), "Réservation confirmée pour l’hôte.")} className="rounded-md bg-emerald-700 px-4 py-1.5 font-semibold text-white disabled:opacity-50">{pending ? "…" : "Confirmer la réservation"}</button>
          <p className="text-xs text-emerald-900">Le client est prévenu et peut payer son acompte depuis « Mes réservations ». L’action est enregistrée à votre nom.</p>
        </div>
      ) : null}
      {mode === "decline" ? (
        <div className="mt-3 space-y-2 rounded-lg bg-red-50 p-3 text-sm">
          <input className={input} placeholder="Raison donnée par l’hôte (ex. déjà occupé ces dates)" value={text} onChange={(e) => setText(e.target.value)} />
          <button type="button" disabled={text.trim().length < 3 || pending} onClick={() => run(() => declineBookingAction(b.key, text), "Réservation refusée.")} className="rounded-md bg-red-700 px-4 py-1.5 font-semibold text-white disabled:opacity-50">Refuser la réservation</button>
        </div>
      ) : null}
      {msg ? <p className={"mt-2 text-sm font-semibold " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
    </article>
  );
}

const TYPES: [string, string][] = [["call", "📞 Appel"], ["whatsapp", "💬 WhatsApp"], ["email", "✉️ E-mail"], ["visit", "🏠 Visite"], ["note", "📝 Note"], ["task", "⏰ Tâche à faire"]];

/** Ajouter un contact, une note ou une tâche à la fiche de suivi. */
export function ActivityForm({ kind, id }: { kind: string; id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ type: "call", outcome: "joint", body: "", dueAt: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const submit = () => start(async () => {
    const r = await addActivityAction(kind, id, { type: f.type, body: f.body, outcome: ["call", "whatsapp", "visit"].includes(f.type) ? f.outcome : undefined, dueAt: f.type === "task" ? f.dueAt : undefined });
    if (!r.ok) return setMsg(r.error ?? "Erreur.");
    setF({ ...f, body: "", dueAt: "" }); setMsg("Enregistré."); router.refresh();
  });
  return (
    <div className="space-y-2 rounded-lg bg-white p-4 ring-1 ring-slate-200">
      <div className="flex flex-wrap gap-1.5">
        {TYPES.map(([k, l]) => <button key={k} type="button" onClick={() => setF({ ...f, type: k })} className={"rounded-full px-3 py-1 text-xs font-semibold ring-1 " + (f.type === k ? "bg-ink text-white ring-ink" : "bg-white text-slate-700 ring-slate-300")}>{l}</button>)}
      </div>
      {["call", "whatsapp", "visit"].includes(f.type) ? (
        <select className={input} value={f.outcome} onChange={(e) => setF({ ...f, outcome: e.target.value })} aria-label="Résultat">
          {Object.entries(OUTCOME).filter(([k]) => !["confirme", "refuse"].includes(k)).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      ) : null}
      {f.type === "task" ? <input type="datetime-local" className={input} value={f.dueAt} onChange={(e) => setF({ ...f, dueAt: e.target.value })} aria-label="Échéance" /> : null}
      <textarea className={input} rows={3} maxLength={2000} placeholder={f.type === "task" ? "Ex. Rappeler pour activer le paiement en ligne" : "Compte rendu : ce qui a été dit, ce qui est convenu…"} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      <div className="flex items-center gap-3">
        <button type="button" disabled={pending || !f.body.trim()} onClick={submit} className="rounded-md bg-brand-800 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? "…" : "Enregistrer"}</button>
        {msg ? <span className="text-sm text-muted">{msg}</span> : null}
      </div>
    </div>
  );
}

export function TaskCheck({ id, done, label }: { id: string; done: boolean; label: React.ReactNode }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" className="mt-0.5 h-4 w-4" disabled={pending} checked={done} onChange={(e) => start(async () => { await taskDoneAction(id, e.target.checked); router.refresh(); })} />
      <span className={done ? "text-muted line-through" : "text-ink"}>{label}</span>
    </label>
  );
}

/** Account manager du compte : attribuer (responsable) ou prendre / rendre (soi-même). */
export function AssignControl({ kind, id, current, managers, canAssign, meId }: { kind: string; id: string; current: string | null; managers: { id: string; name: string }[]; canAssign: boolean; meId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const set = (v: string | null) => start(async () => { const r = await assignAction(kind, id, v); if (!r.ok) setErr(r.error ?? "Erreur."); else { setErr(null); router.refresh(); } });
  if (canAssign) {
    return (
      <div>
        <select className={input} value={current ?? ""} disabled={pending} onChange={(e) => set(e.target.value || null)} aria-label="Account manager">
          <option value="">— Sans account manager —</option>
          {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        {err ? <p className="mt-1 text-xs text-red-600">{err}</p> : null}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!current ? <button type="button" disabled={pending} onClick={() => set(meId)} className="rounded-md bg-brand-800 px-3 py-1.5 text-sm font-semibold text-white">Prendre en charge</button> : null}
      {current === meId ? <button type="button" disabled={pending} onClick={() => set(null)} className="rounded-md px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300">Rendre ce compte</button> : null}
      {err ? <span className="text-xs text-red-600">{err}</span> : null}
    </div>
  );
}
