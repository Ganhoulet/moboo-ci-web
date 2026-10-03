"use client";

import { useState, useTransition } from "react";
import { cancelDeletionAction, deleteMyAccountAction, requestDeletionAction, sendDeletionCodeAction } from "@/app/suppression-compte/actions";

const REASONS: [string, string][] = [
  ["plus_besoin", "Je n’ai plus besoin du service"],
  ["trouve", "J’ai trouvé un logement / vendu mon bien"],
  ["doublon", "J’ai un autre compte"],
  ["confidentialite", "Raisons de confidentialité"],
  ["messages", "Je reçois trop de messages"],
  ["autre", "Autre"],
];
const SCOPES: [string, string, string][] = [
  ["site", "Moboo.ci", "Compte du site moboo.ci et de l’application Moboo.ci"],
  ["app", "Ancien compte de l’application", "Compte créé dans l’application avant le nouveau site (identifiant moboo.ci)"],
  ["pro", "Moboo Pro / Moboo Resi", "Compte professionnel de gestion (résidences, espaces)"],
];

const fmt = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

function Reason({ reason, setReason, details, setDetails }: { reason: string; setReason: (v: string) => void; details: string; setDetails: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-ink">Pourquoi partez-vous ? <span className="font-normal text-muted">(facultatif)</span></label>
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="input">
        {REASONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={2} maxLength={1000} className="input text-sm" placeholder="Un commentaire pour nous aider à nous améliorer" />
    </div>
  );
}

/** Connecté : confirmation en tapant SUPPRIMER. */
export function DeleteMine({ name, days }: { name: string; days: number }) {
  const [reason, setReason] = useState("plus_besoin");
  const [details, setDetails] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (done) return <Done date={done} days={days} />;
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        const r = await deleteMyAccountAction({ reason, details, confirm });
        if (r.ok) setDone(r.data?.scheduledAt ?? ""); else setErr(r.error ?? "Suppression impossible.");
      });
    }}>
      <p className="text-sm text-slate-700">Vous êtes connecté en tant que <strong>{name}</strong>.</p>
      <Reason reason={reason} setReason={setReason} details={details} setDetails={setDetails} />
      <label className="block text-sm font-semibold text-ink">Pour confirmer, tapez <span className="font-mono text-red-700">SUPPRIMER</span>
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input mt-1 font-mono uppercase" autoComplete="off" required />
      </label>
      {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
      <button disabled={pending || confirm.trim().toUpperCase() !== "SUPPRIMER"} className="btn-primary w-full bg-red-600 hover:bg-red-700 disabled:opacity-50">
        {pending ? "Un instant…" : "Supprimer mon compte"}
      </button>
    </form>
  );
}

function Done({ date, days, manual }: { date?: string; days: number; manual?: boolean }) {
  return (
    <div className="rounded-xl bg-emerald-50 p-5 text-sm text-emerald-900 ring-1 ring-emerald-200">
      <p className="font-display text-lg font-bold">Demande enregistrée</p>
      {manual ? (
        <p className="mt-1">Notre équipe traite votre demande sous 30 jours au plus et vous confirme la suppression.</p>
      ) : (
        <p className="mt-1">
          Votre compte est désactivé et vos annonces ne sont plus visibles.
          {days > 0 ? <> Il sera supprimé définitivement {date ? <>le <strong>{fmt(date)}</strong></> : `dans ${days} jours`}. D’ici là, vous pouvez annuler depuis cette page (onglet « Annuler une suppression »).</> : " Vos données ont été supprimées."}
        </p>
      )}
    </div>
  );
}

/** Non connecté : numéro → code → périmètre et motif → demande (ou annulation). */
export function DeletionByPhone({ days, mode }: { days: number; mode: "delete" | "cancel" }) {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [code, setCode] = useState("");
  const [hint, setHint] = useState<{ channel?: string; emailHint?: string | null; devCode?: string } | null>(null);
  const [scope, setScope] = useState("site");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("plus_besoin");
  const [details, setDetails] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ date?: string; manual?: boolean; cancelled?: boolean } | null>(null);
  const [pending, start] = useTransition();

  if (done?.cancelled) {
    return <div className="rounded-xl bg-emerald-50 p-5 text-sm text-emerald-900 ring-1 ring-emerald-200"><p className="font-display text-lg font-bold">Suppression annulée</p><p className="mt-1">Votre compte est de nouveau actif et vos annonces sont remises en ligne. Vous pouvez vous connecter normalement.</p></div>;
  }
  if (done) return <Done date={done.date} days={days} manual={done.manual} />;

  const send = (channel?: "email") => start(async () => {
    setErr(null);
    const r = await sendDeletionCodeAction(phone, channel);
    if (r.ok) { setHint(r.data); setStep("code"); } else setErr(r.error ?? "Envoi impossible.");
  });

  if (step === "phone") {
    return (
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <label className="block text-sm font-semibold text-ink">Numéro de téléphone du compte
          <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07 07 12 34 56" className="input mt-1" required />
        </label>
        <p className="text-xs text-muted">Nous vous envoyons un code pour vérifier que ce numéro vous appartient.</p>
        {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
        <button disabled={pending} className="btn-primary w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-60">{pending ? "Envoi…" : "Recevoir un code"}</button>
      </form>
    );
  }

  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        setErr(null);
        if (mode === "cancel") {
          const r = await cancelDeletionAction({ phone, code });
          if (r.ok) setDone({ cancelled: true }); else setErr(r.error ?? "Annulation impossible.");
          return;
        }
        const r = await requestDeletionAction({ phone, code, scope, reason, details, email: email || undefined });
        if (r.ok) setDone({ date: r.data?.scheduledAt, manual: r.data?.mode === "manual" }); else setErr(r.error ?? "Demande impossible.");
      });
    }}>
      <label className="block text-sm font-semibold text-ink">Code reçu
        <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6 chiffres" className="input mt-1 tracking-[0.4em]" required />
      </label>
      <p className="-mt-2 text-xs text-muted">
        {hint?.channel === "email" && hint.emailHint ? <>Envoyé par e-mail à {hint.emailHint}.</> : <>Envoyé par {hint?.channel === "sms" ? "SMS" : "WhatsApp"} au {phone}.</>}
        {hint?.devCode ? <span className="ml-1 font-semibold text-accent-700">Code de test : {hint.devCode}</span> : null}
        {hint?.channel !== "email" && hint?.emailHint ? <button type="button" onClick={() => send("email")} className="ml-1 font-semibold text-brand-800 hover:underline">Recevoir par e-mail</button> : null}
      </p>
      {mode === "delete" ? (
        <>
          <fieldset className="space-y-1.5">
            <legend className="mb-1 text-sm font-semibold text-ink">Quel compte supprimer ?</legend>
            {SCOPES.map(([k, l, d]) => (
              <label key={k} className={"flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm " + (scope === k ? "border-brand-600 bg-brand-50" : "border-slate-200 hover:bg-slate-50")}>
                <input type="radio" name="scope" className="mt-1" checked={scope === k} onChange={() => setScope(k)} />
                <span><span className="font-semibold text-ink">{l}</span><span className="block text-xs text-muted">{d}</span></span>
              </label>
            ))}
          </fieldset>
          {scope !== "site" ? (
            <label className="block text-sm font-semibold text-ink">E-mail du compte <span className="font-normal text-muted">(pour vous répondre)</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input mt-1" placeholder="vous@exemple.com" />
            </label>
          ) : null}
          <Reason reason={reason} setReason={setReason} details={details} setDetails={setDetails} />
        </>
      ) : null}
      {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
      <button disabled={pending} className={"btn-primary w-full disabled:opacity-60 " + (mode === "cancel" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}>
        {pending ? "Un instant…" : mode === "cancel" ? "Annuler la suppression et réactiver mon compte" : "Demander la suppression"}
      </button>
      <button type="button" onClick={() => { setStep("phone"); setCode(""); }} className="w-full text-center text-sm font-semibold text-muted hover:text-ink">Changer de numéro</button>
    </form>
  );
}

export function DeletionTabs({ days, loggedIn, name }: { days: number; loggedIn: boolean; name: string }) {
  const [tab, setTab] = useState<"delete" | "cancel">("delete");
  return (
    <div className="space-y-5">
      <div role="tablist" className="grid grid-cols-2 rounded-full bg-slate-100 p-1 text-sm font-semibold">
        {([["delete", "Supprimer un compte"], ["cancel", "Annuler une suppression"]] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={"rounded-full px-3 py-2 transition " + (tab === k ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink")}>{l}</button>
        ))}
      </div>
      {tab === "delete" ? (loggedIn ? <DeleteMine name={name} days={days} /> : <DeletionByPhone key="d" days={days} mode="delete" />) : <DeletionByPhone key="c" days={days} mode="cancel" />}
    </div>
  );
}
