"use client";

import { useState, useTransition } from "react";
import {
  disableTwoFactorAction, emailCodeAction, emailEnableAction, regenerateBackupAction,
  totpEnableAction, totpSetupAction, type TwoFactorStatus,
} from "@/app/securite/actions";

type Method = "totp" | "email" | "backup";
type Confirm = { kind: "disable-totp" | "disable-email" | "backup"; title: string };

const Badge = ({ on }: { on: boolean }) => (
  <span className={"shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold " + (on ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
    {on ? "Activée" : "Désactivée"}
  </span>
);

function BackupCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = `Codes de secours Moboo.ci (chacun utilisable une seule fois)\n\n${codes.join("\n")}\n`;
  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
      <p className="font-semibold text-ink">Enregistrez vos codes de secours</p>
      <p className="mt-1 text-sm text-slate-700">Ils vous permettent de vous connecter si vous perdez votre téléphone. Ils ne seront plus affichés.</p>
      <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-5">
        {codes.map((c) => <span key={c} className="rounded-lg bg-white px-2 py-1.5 text-center ring-1 ring-amber-200">{c}</span>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); }} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">{copied ? "Copiés ✓" : "Copier"}</button>
        <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`} download="moboo-codes-de-secours.txt" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">Télécharger</a>
        <button type="button" onClick={onDone} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">J’ai enregistré mes codes</button>
      </div>
    </div>
  );
}

/**
 * Double authentification : application (QR code), e-mail, codes de secours.
 * `required` : écran bloquant du back-office (administrateur sans 2FA).
 */
export function TwoFactorSettings({ initial, required = false }: { initial: TwoFactorStatus; required?: boolean }) {
  const [st, setSt] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [totp, setTotp] = useState<{ qr: string; secret: string } | null>(null);
  const [emailStep, setEmailStep] = useState(false);
  const [code, setCode] = useState("");
  const [backup, setBackup] = useState<string[] | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [cMethod, setCMethod] = useState<Method>("totp");
  const [cCode, setCCode] = useState("");

  const methods: Method[] = [...(st.totp ? ["totp" as const] : []), ...(st.email ? ["email" as const] : []), ...(st.backupRemaining ? ["backup" as const] : [])];
  const fail = (e?: string) => setMsg({ ok: false, text: e ?? "Action impossible." });

  const enabled = (r: { backupCodes: string[] | null; status: TwoFactorStatus } | undefined, text: string) => {
    if (!r) return;
    setSt(r.status); setTotp(null); setEmailStep(false); setCode("");
    setMsg({ ok: true, text });
    if (r.backupCodes?.length) setBackup(r.backupCodes);
    else if (required) window.location.reload();
  };

  const openConfirm = (c: Confirm) => {
    setConfirm(c); setCCode(""); setMsg(null);
    setCMethod(methods[0] ?? "totp");
  };
  const runConfirm = () => start(async () => {
    if (!confirm) return;
    if (confirm.kind === "backup") {
      const r = await regenerateBackupAction(cMethod, cCode);
      if (!r.ok) return fail(r.error);
      setConfirm(null); setBackup(r.data!.backupCodes); setSt((s) => ({ ...s, backupRemaining: r.data!.backupCodes.length }));
      return;
    }
    const r = await disableTwoFactorAction(confirm.kind === "disable-totp" ? "totp" : "email", cMethod, cCode);
    if (!r.ok) return fail(r.error);
    setSt(r.data!); setConfirm(null); setMsg({ ok: true, text: "Méthode désactivée." });
  });

  if (!st.offered && !st.enabled) return null;

  return (
    <section className={required ? "" : "mt-8 rounded-2xl bg-white p-5 shadow-card sm:p-6"}>
      {!required ? (
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Double authentification (2FA)</h2>
            <p className="mt-1 text-sm text-muted">Après votre mot de passe ou votre code téléphone, un 2e code est demandé : votre compte reste protégé même si l’un des deux fuite.</p>
          </div>
          <Badge on={st.enabled} />
        </div>
      ) : null}
      {st.required && !st.enabled && !required ? (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Obligatoire pour les administrateurs : activez au moins une méthode pour accéder au back-office.</p>
      ) : null}

      {backup ? <div className="mt-5"><BackupCodes codes={backup} onDone={() => { setBackup(null); if (required) window.location.reload(); }} /></div> : null}

      <div className="mt-5 space-y-3">
        {/* Application d'authentification */}
        {st.allowTotp || st.totp ? (
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg">📱</span>
                <div>
                  <p className="font-semibold text-ink">Application d’authentification <span className="ml-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-800">Recommandé</span></p>
                  <p className="text-sm text-muted">Google Authenticator, Microsoft Authenticator, Authy, 1Password… Fonctionne sans réseau.</p>
                </div>
              </div>
              <Badge on={st.totp} />
            </div>
            {totp ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={totp.qr} alt="QR code à scanner" className="h-44 w-44 rounded-xl border border-slate-200 bg-white p-2" />
                <div className="space-y-3 text-sm">
                  <ol className="list-decimal space-y-1 pl-4 text-slate-700">
                    <li>Ouvrez l’application et touchez « + » / « Ajouter un compte ».</li>
                    <li>Scannez ce QR code (ou saisissez la clé ci-dessous).</li>
                    <li>Entrez le code à 6 chiffres affiché.</li>
                  </ol>
                  <p className="break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">{totp.secret}</p>
                  <div className="flex gap-2">
                    <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="123456" className="input w-36 text-center font-mono text-lg tracking-widest" />
                    <button type="button" disabled={pending || code.length !== 6} onClick={() => start(async () => {
                      const r = await totpEnableAction(code);
                      if (!r.ok) return fail(r.error);
                      enabled(r.data, "Application d’authentification activée.");
                    })} className="rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-50">Activer</button>
                  </div>
                  <button type="button" onClick={() => { setTotp(null); setCode(""); }} className="text-xs font-semibold text-muted">Annuler</button>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                {st.totp ? (
                  <button type="button" onClick={() => openConfirm({ kind: "disable-totp", title: "Désactiver l’application d’authentification" })} className="text-sm font-semibold text-red-600">Désactiver</button>
                ) : (
                  <button type="button" disabled={pending} onClick={() => start(async () => {
                    setMsg(null); setEmailStep(false);
                    const r = await totpSetupAction();
                    if (!r.ok) return fail(r.error);
                    setTotp({ qr: r.data!.qr, secret: r.data!.secret }); setCode("");
                  })} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">Configurer</button>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Code par e-mail */}
        {st.allowEmail || st.email ? (
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg">✉️</span>
                <div>
                  <p className="font-semibold text-ink">Code par e-mail</p>
                  <p className="text-sm text-muted">{st.emailAddress ? <>Un code est envoyé à <span className="font-medium text-ink">{st.emailAddress}</span> à chaque connexion.</> : "Ajoutez d’abord une adresse e-mail dans « Mon profil »."}</p>
                </div>
              </div>
              <Badge on={st.email} />
            </div>
            <div className="mt-3">
              {st.email ? (
                <button type="button" onClick={() => openConfirm({ kind: "disable-email", title: "Désactiver le code par e-mail" })} className="text-sm font-semibold text-red-600">Désactiver</button>
              ) : emailStep ? (
                <div className="flex flex-wrap gap-2">
                  <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="Code reçu" className="input w-36 text-center font-mono text-lg tracking-widest" />
                  <button type="button" disabled={pending || code.length !== 6} onClick={() => start(async () => {
                    const r = await emailEnableAction(code);
                    if (!r.ok) return fail(r.error);
                    enabled(r.data, "Code par e-mail activé.");
                  })} className="rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-50">Activer</button>
                  <button type="button" onClick={() => { setEmailStep(false); setCode(""); }} className="text-xs font-semibold text-muted">Annuler</button>
                </div>
              ) : st.emailAddress ? (
                <button type="button" disabled={pending} onClick={() => start(async () => {
                  setMsg(null); setTotp(null);
                  const r = await emailCodeAction("setup");
                  if (!r.ok) return fail(r.error);
                  setEmailStep(true); setCode(""); setMsg({ ok: true, text: `Code envoyé à ${r.data!.email}.` });
                })} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">Activer</button>
              ) : (
                <a href="/mon-espace/profil" className="text-sm font-semibold text-brand-800 hover:underline">Ajouter mon e-mail</a>
              )}
            </div>
          </div>
        ) : null}

        {/* Codes de secours */}
        {st.enabled ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg">🔑</span>
              <div>
                <p className="font-semibold text-ink">Codes de secours</p>
                <p className="text-sm text-muted">{st.backupRemaining} code{st.backupRemaining > 1 ? "s" : ""} restant{st.backupRemaining > 1 ? "s" : ""} — si vous perdez votre téléphone.</p>
              </div>
            </div>
            <button type="button" onClick={() => openConfirm({ kind: "backup", title: "Générer de nouveaux codes de secours" })} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold">Nouveaux codes</button>
          </div>
        ) : null}
      </div>

      {confirm ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="font-semibold text-ink">{confirm.title}</p>
          <p className="mt-1 text-sm text-muted">Confirmez avec un code valide.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {methods.map((m) => (
              <button key={m} type="button" onClick={() => { setCMethod(m); setCCode(""); }}
                className={"rounded-full border px-3 py-1 text-xs font-semibold " + (cMethod === m ? "border-ink bg-ink text-white" : "border-slate-300 bg-white")}>
                {m === "totp" ? "Application" : m === "email" ? "E-mail" : "Code de secours"}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input value={cCode} onChange={(e) => setCCode(e.target.value)} placeholder={cMethod === "backup" ? "xxxx-xxxx" : "123456"} className="input w-40 text-center font-mono" />
            {cMethod === "email" ? (
              <button type="button" disabled={pending} onClick={() => start(async () => {
                const r = await emailCodeAction("manage");
                setMsg(r.ok ? { ok: true, text: `Code envoyé à ${r.data!.email}.` } : { ok: false, text: r.error ?? "Envoi impossible." });
              })} className="text-sm font-semibold text-brand-800">Recevoir un code</button>
            ) : null}
            <button type="button" disabled={pending || cCode.length < 6} onClick={runConfirm} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Confirmer</button>
            <button type="button" onClick={() => setConfirm(null)} className="text-sm font-semibold text-muted">Annuler</button>
          </div>
        </div>
      ) : null}

      {msg ? <p className={"mt-4 text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
    </section>
  );
}
