"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fcfa, since } from "@/lib/am";
import { addActivityAction, assignAction, bookingContactAction, changeDatesAction, confirmBookingAction, declineBookingAction, disputeReplyAction, sendPaymentLinkAction, taskDoneAction } from "@/app/admin/comptes/actions";

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

/** Résultat de l'envoi automatique du lien de paiement au client. */
const sentText = (sentBy?: string | null, url?: string | null) =>
  sentBy === "whatsapp" ? " Le client a reçu son lien de paiement par WhatsApp."
  : sentBy === "sms" ? " Le client a reçu son lien de paiement par SMS."
  : url ? " Envoi automatique impossible : envoyez-lui le lien par WhatsApp (liste « Acompte à régler »)." : "";

export interface AwaitingPayment {
  key: string; ref: string; title: string; place: string; start: string; end: string; amount: number; deposit: number;
  paymentUrl: string | null; host: { name: string | null; phone: string | null }; guest: { name: string; phone: string };
  acceptedMinutes: number; managerName: string | null;
}

/** Séjour accepté, acompte pas encore payé : appeler le client et lui (r)envoyer son lien. */
export function AwaitingPaymentCard({ b }: { b: AwaitingPayment }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [url, setUrl] = useState(b.paymentUrl);
  const guestWa = digits(b.guest.phone);
  const first = b.guest.name.split(" ")[0] || "";
  const waText = encodeURIComponent(
    `Bonjour${first ? ` ${first}` : ""}, ici l’équipe Moboo.ci. Votre réservation ${b.title} du ${b.start} au ${b.end} est acceptée par l’hôte.` +
    (url ? ` Pour la confirmer, réglez l’acompte de ${fcfa(b.deposit)} ici (Mobile Money ou carte, sans créer de compte) : ${url}` : " Nous vous recontactons pour le paiement de l’acompte."),
  );
  const resend = () => start(async () => {
    const r = await sendPaymentLinkAction(b.key);
    if (r.paymentUrl) setUrl(r.paymentUrl);
    setMsg(r.ok ? { ok: r.sentBy !== "none", text: r.sentBy === "none" ? "Envoi automatique impossible : utilisez le bouton WhatsApp." : `Lien renvoyé par ${r.sentBy === "whatsapp" ? "WhatsApp" : "SMS"}.` } : { ok: false, text: r.error ?? "Erreur." });
  });
  return (
    <article className="rounded-xl bg-white p-4 ring-1 ring-sky-200" data-booking={b.key}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Séjour (Moboo Resi) · {b.ref}</p>
          <p className="font-display text-base font-bold text-ink">{b.title}</p>
          <p className="text-sm text-slate-600">{b.place ? `${b.place} · ` : ""}{b.start} → {b.end} · {fcfa(b.amount)} · acompte {fcfa(b.deposit)}</p>
        </div>
        <span className="shrink-0 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-900">Acceptée · acompte à régler · {since(b.acceptedMinutes)}</span>
      </div>
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold text-muted">Client</p>
          <p className="font-semibold text-ink">{b.guest.name || "—"}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {b.guest.phone ? <a href={`tel:${b.guest.phone}`} onClick={() => bookingContactAction(b.key, "call", "", "Appel au client (acompte)")} className="rounded-full bg-brand-800 px-3 py-1 text-xs font-bold text-white">📞 Appeler {b.guest.phone}</a> : <span className="text-xs text-red-600">Pas de téléphone</span>}
            {guestWa ? <a href={`https://wa.me/${guestWa}?text=${waText}`} target="_blank" rel="noreferrer" onClick={() => bookingContactAction(b.key, "whatsapp", "", "Lien de paiement envoyé au client par WhatsApp")} className="rounded-full bg-[#25D366] px-3 py-1 text-xs font-bold text-white">WhatsApp{url ? " + lien de paiement" : ""}</a> : null}
            <button type="button" disabled={pending} onClick={resend} className="rounded-full px-3 py-1 text-xs font-semibold text-brand-800 ring-1 ring-slate-300 disabled:opacity-50">{pending ? "…" : "Renvoyer le lien (SMS)"}</button>
          </div>
          {url ? <p className="mt-2 break-all text-xs text-muted">Lien : <a href={url} target="_blank" rel="noreferrer" className="text-brand-800 underline">{url}</a></p> : <p className="mt-2 text-xs text-amber-700">Pas encore de lien : paiement en ligne suspendu ou en cours de création.</p>}
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold text-muted">Hôte</p>
          <p className="font-semibold text-ink">{b.host.name || "—"}</p>
          {b.host.phone ? <a href={`tel:${b.host.phone}`} className="mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold text-brand-800 ring-1 ring-slate-300">📞 {b.host.phone}</a> : null}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">{b.managerName ? `Account manager : ${b.managerName}` : "Sans account manager"}</p>
      {msg ? <p className={"mt-2 text-sm font-semibold " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
    </article>
  );
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
  const run = (fn: () => Promise<{ ok: boolean; error?: string; paymentUrl?: string | null; sentBy?: string | null }>, okText: string) => start(async () => {
    const r = await fn();
    setMsg(r.ok ? { ok: true, text: okText + sentText(r.sentBy, r.paymentUrl) } : { ok: false, text: r.error ?? "Erreur." });
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
          {!b.guest.phone ? <span className="text-xs text-red-600">Pas de téléphone</span> : null}
          {b.guest.phone ? <div className="mt-1 flex flex-wrap gap-2"><a href={`tel:${b.guest.phone}`} onClick={() => bookingContactAction(b.key, "call", "", "Appel au client")} className="rounded-full px-3 py-1 text-xs font-semibold text-brand-800 ring-1 ring-slate-300">📞 Appeler {b.guest.phone}</a><a href={`https://wa.me/${digits(b.guest.phone)}`} target="_blank" rel="noreferrer" className="rounded-full px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-slate-300">WhatsApp</a></div> : null}
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
        <ChangeDates bookingKey={b.key} start={b.start} end={b.end} />
      </div>
      {mode === "confirm" ? (
        <div className="mt-3 space-y-2 rounded-lg bg-emerald-50 p-3 text-sm">
          <label className="flex items-start gap-2 font-semibold text-emerald-900">
            <input type="checkbox" className="mt-0.5 h-4 w-4" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            L’hôte m’a confirmé la disponibilité (par téléphone ou WhatsApp) et accepte cette réservation.
          </label>
          <input className={input} placeholder="Note (facultatif) : ex. joint à 14 h, clés chez le gardien" value={text} onChange={(e) => setText(e.target.value)} />
          <button type="button" disabled={!agreed || pending} onClick={() => run(() => confirmBookingAction(b.key, text), "Réservation confirmée pour l’hôte.")} className="rounded-md bg-emerald-700 px-4 py-1.5 font-semibold text-white disabled:opacity-50">{pending ? "…" : "Confirmer la réservation"}</button>
          <p className="text-xs text-emerald-900">Le client reçoit aussitôt son lien de paiement par WhatsApp ou SMS (pas besoin de compte). L’action est enregistrée à votre nom.</p>
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

/** Changer les dates d'une réservation pour l'hôte (accord de l'hôte et du client). */
export function ChangeDates({ bookingKey, start: s0, end: e0, compact }: { bookingKey: string; start: string; end: string; compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [f, setF] = useState({ start: s0.slice(0, 10), end: e0.slice(0, 10), note: "", host: false, guest: false });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className={compact ? "text-xs font-semibold text-brand-800 hover:underline" : "rounded-md px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"}>📅 Changer les dates</button>;
  return (
    <div className="mt-2 w-full space-y-2 rounded-lg bg-sky-50 p-3 text-sm" data-dates={bookingKey}>
      <div className="flex flex-wrap gap-2">
        <label className="text-xs font-semibold">Arrivée / début<input type="date" className={input + " mt-1"} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></label>
        <label className="text-xs font-semibold">Départ / fin<input type="date" className={input + " mt-1"} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></label>
      </div>
      <label className="flex items-start gap-2"><input type="checkbox" className="mt-0.5 h-4 w-4" checked={f.host} onChange={(e) => setF({ ...f, host: e.target.checked })} />L’hôte accepte les nouvelles dates.</label>
      <label className="flex items-start gap-2"><input type="checkbox" className="mt-0.5 h-4 w-4" checked={f.guest} onChange={(e) => setF({ ...f, guest: e.target.checked })} />Le client a demandé ou accepté ce changement.</label>
      <input className={input} placeholder="Note (facultatif)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={pending || !f.host || !f.guest} onClick={() => start(async () => {
          const r = await changeDatesAction(bookingKey, { start: f.start, end: f.end, note: f.note });
          setMsg(r.ok ? { ok: true, text: `Dates changées${r.data?.totalAmount != null ? ` · nouveau total ${fcfa(r.data.totalAmount)}` : ""}. Le client est prévenu.` } : { ok: false, text: r.error ?? "Erreur." });
          if (r.ok) router.refresh();
        })} className="rounded-md bg-sky-700 px-3 py-1.5 font-semibold text-white disabled:opacity-50">{pending ? "…" : "Enregistrer les nouvelles dates"}</button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-slate-600">Annuler</button>
      </div>
      {msg ? <p className={"text-sm font-semibold " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
    </div>
  );
}

/** Répondre à un litige pour l'hôte (son accord est exigé). */
export function DisputeReply({ kind, id, disputeId }: { kind: string; id: string; disputeId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="mt-2 space-y-2" data-dispute-reply={disputeId}>
      <textarea className={input} rows={3} maxLength={4000} placeholder="Réponse de l’hôte au client (ex. remboursement de la nuit proposé, photo de la réparation…)" value={body} onChange={(e) => setBody(e.target.value)} />
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />L’hôte m’a donné son accord sur cette réponse.</label>
      <button type="button" disabled={pending || !agreed || body.trim().length < 2} onClick={() => start(async () => {
        const r = await disputeReplyAction(kind, id, disputeId, body);
        setMsg(r.ok ? { ok: true, text: "Réponse envoyée au client au nom de l’hôte (signée « via Moboo »)." } : { ok: false, text: r.error ?? "Erreur." });
        if (r.ok) { setBody(""); setAgreed(false); router.refresh(); }
      })} className="rounded-md bg-brand-800 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? "…" : "Répondre pour l’hôte"}</button>
      {msg ? <p className={"text-sm font-semibold " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
    </div>
  );
}
