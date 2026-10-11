"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decidePhoneAction, openAssistAction, phoneChangeAction, recoveryAction, requestAssistAction } from "@/app/admin/comptes/actions";

const input = "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-600 focus:outline-none";
const CH: Record<string, string> = { whatsapp: "WhatsApp", sms: "SMS", email: "e-mail", none: "aucun canal" };
const ST: Record<string, string> = { pending: "code envoyé", active: "en cours", ended: "terminé", expired: "expiré", cancelled: "annulé", sent: "lien envoyé", used: "mot de passe changé", approved: "validé", rejected: "refusé" };

/** Fiche d'un compte du site : accès assisté, mot de passe oublié, numéro perdu, historique. */
export function AccessPanel({ accountId, name, history }: { accountId: string; name: string; history: any }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [assist, setAssist] = useState<{ id: string; channel: string; devCode?: string } | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [phone, setPhone] = useState({ open: false, newPhone: "", reason: "" });
  return (
    <section className="space-y-3 rounded-lg bg-white p-4 ring-1 ring-slate-200" data-access-panel>
      <h2 className="font-display text-base font-bold text-ink">🛟 Aider le client dans son compte</h2>

      <div className="rounded-lg bg-slate-50 p-3">
        <p className="text-sm font-semibold text-ink">Accès assisté ({history.minutes} min, avec son accord)</p>
        <p className="text-xs text-muted">Le client reçoit un code et vous le donne au téléphone. Vous pourrez modifier ses annonces et son profil ; paiements, mot de passe, numéro et suppression restent bloqués.</p>
        {!assist ? (
          <button type="button" disabled={pending} onClick={() => start(async () => {
            const r = await requestAssistAction(accountId);
            if (!r.ok) return setMsg({ ok: false, text: r.error ?? "Erreur." });
            setAssist(r.data); setMsg({ ok: true, text: `Code envoyé au client par ${CH[r.data.channel] ?? r.data.channel}. Demandez-le-lui.` });
          })} className="mt-2 rounded-md bg-brand-800 px-3 py-1.5 text-sm font-semibold text-white">Demander l’accès au client</button>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input className={input + " w-36 font-mono tracking-widest"} inputMode="numeric" maxLength={7} placeholder="Code à 6 chiffres" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Code donné par le client" />
            <button type="button" disabled={pending || code.replace(/\D/g, "").length !== 6} onClick={() => start(async () => {
              const r = await openAssistAction(assist.id, code, accountId, name);
              if (r && !r.ok) setMsg({ ok: false, text: r.error ?? "Code refusé." });
            })} className="rounded-md bg-red-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">Ouvrir son compte</button>
            <button type="button" onClick={() => { setAssist(null); setCode(""); setMsg(null); }} className="text-xs font-semibold text-slate-500">Annuler</button>
            {assist.devCode ? <span className="text-xs text-amber-700">Test (hors production) : code {assist.devCode}</span> : null}
          </div>
        )}
      </div>

      <div className="rounded-lg bg-slate-50 p-3">
        <p className="text-sm font-semibold text-ink">Mot de passe oublié</p>
        <p className="text-xs text-muted">Le client reçoit sur son numéro et son e-mail un lien valable 15 min pour choisir lui-même son mot de passe. Vous ne voyez jamais ce mot de passe.</p>
        <button type="button" disabled={pending} onClick={() => start(async () => {
          const r = await recoveryAction(accountId);
          setMsg(r.ok ? { ok: true, text: `Lien envoyé (${(r.data?.channels ?? []).map((c: string) => CH[c] ?? c).join(", ") || "test"}).${r.data?.devUrl ? ` Test : ${r.data.devUrl}` : ""}` } : { ok: false, text: r.error ?? "Erreur." });
          router.refresh();
        })} className="mt-2 rounded-md px-3 py-1.5 text-sm font-semibold text-ink ring-1 ring-slate-300">Envoyer le lien « nouveau mot de passe »</button>
      </div>

      <div className="rounded-lg bg-slate-50 p-3">
        <p className="text-sm font-semibold text-ink">Le client n’a plus accès à son numéro</p>
        {!phone.open ? <button type="button" onClick={() => setPhone({ ...phone, open: true })} className="mt-1 text-sm font-semibold text-brand-800">Demander un changement de numéro →</button> : (
          <div className="mt-2 space-y-2">
            <input className={input} placeholder="Nouveau numéro (ex. 07 00 00 00 00)" value={phone.newPhone} onChange={(e) => setPhone({ ...phone, newPhone: e.target.value })} />
            <textarea className={input} rows={2} placeholder="Comment avez-vous vérifié son identité ? (pièce d’identité, questions sur ses annonces, ancien e-mail…)" value={phone.reason} onChange={(e) => setPhone({ ...phone, reason: e.target.value })} />
            <button type="button" disabled={pending || !phone.newPhone || phone.reason.length < 15} onClick={() => start(async () => {
              const r = await phoneChangeAction(accountId, phone.newPhone, phone.reason);
              setMsg(r.ok ? { ok: true, text: "Demande envoyée : un responsable doit la valider." } : { ok: false, text: r.error ?? "Erreur." });
              if (r.ok) { setPhone({ open: false, newPhone: "", reason: "" }); router.refresh(); }
            })} className="rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">Envoyer pour validation</button>
          </div>
        )}
      </div>

      {msg ? <p className={"text-sm font-semibold " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}

      {history.assists.length || history.recoveries.length ? (
        <details className="text-xs">
          <summary className="cursor-pointer font-semibold text-slate-600">Historique des accès</summary>
          <ul className="mt-1 space-y-1">
            {history.assists.map((a: any) => <li key={a.id}>Accès assisté · {a.by} · {new Date(a.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} · {ST[a.status] ?? a.status}{a.actions ? ` · ${a.actions} modification(s)` : ""}</li>)}
            {history.recoveries.map((r: any) => <li key={r.id}>{r.type === "link" ? "Lien mot de passe" : `Changement de numéro → ${r.newPhone}`} · {new Date(r.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} · {ST[r.status] ?? r.status}</li>)}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

/** Responsable : changements de numéro à valider (vérification d'identité faite par l'account manager). */
export function PhoneChangeQueue({ items, meId }: { items: any[]; meId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  if (!items.length) return null;
  return (
    <section className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200">
      <h2 className="font-display text-lg font-bold text-amber-900">🔐 Changements de numéro à valider ({items.length})</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {items.map((r) => (
          <li key={r.id} className="rounded-md bg-white p-3 ring-1 ring-amber-100" data-phone-change={r.id}>
            <p><b>{r.account}</b> : {r.oldPhone} → <b>{r.newPhone}</b> · demandé par {r.requestedBy}</p>
            <p className="text-xs text-slate-600">Vérification : {r.reason}</p>
            {r.requestedById === meId ? <p className="mt-1 text-xs text-muted">Votre demande : une autre personne doit la valider.</p> : (
              <div className="mt-2 flex gap-2">
                <button type="button" disabled={pending} onClick={() => start(async () => { const x = await decidePhoneAction(r.id, true); if (!x.ok) setErr(x.error ?? "Erreur."); router.refresh(); })} className="rounded-md bg-emerald-700 px-3 py-1 text-xs font-semibold text-white">Valider</button>
                <button type="button" disabled={pending} onClick={() => start(async () => { const note = prompt("Motif du refus") ?? ""; await decidePhoneAction(r.id, false, note); router.refresh(); })} className="rounded-md px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">Refuser</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {err ? <p className="mt-1 text-sm text-red-600">{err}</p> : null}
    </section>
  );
}
