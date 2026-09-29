"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { cancelTwoFactorAction, resendTwoFactorEmailAction, verifyTwoFactorAction } from "@/app/connexion/actions";

type Method = "totp" | "email" | "backup";

const LABEL: Record<Method, { tab: string; title: string; help: string }> = {
  totp: { tab: "Application", title: "Code de l’application", help: "Ouvrez Google Authenticator, Microsoft Authenticator ou Authy et saisissez le code à 6 chiffres affiché pour Moboo." },
  email: { tab: "E-mail", title: "Code reçu par e-mail", help: "Nous avons envoyé un code à 6 chiffres à votre adresse. Il expire dans 10 minutes." },
  backup: { tab: "Code de secours", title: "Code de secours", help: "Un des 10 codes « xxxx-xxxx » enregistrés à l’activation. Chacun ne sert qu’une fois." },
};

/** Six cases, collage accepté (application / e-mail). */
function OtpBoxes({ value, onChange, onComplete }: { value: string; onChange: (v: string) => void; onComplete: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { refs.current[0]?.focus(); }, []);
  const set = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 6);
    onChange(d);
    refs.current[Math.min(d.length, 5)]?.focus();
    if (d.length === 6) onComplete(d);
  };
  return (
    <div className="flex justify-between gap-2" onPaste={(e) => { e.preventDefault(); set(e.clipboardData.getData("text")); }}>
      {Array.from({ length: 6 }, (_, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} maxLength={1}
          aria-label={`Chiffre ${i + 1}`} value={value[i] ?? ""}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, "").slice(-1);
            if (!ch) return;
            set((value.slice(0, i) + ch + value.slice(i + 1)).slice(0, 6));
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") { e.preventDefault(); const v = value.slice(0, value[i] ? i : Math.max(0, i - 1)); onChange(v); refs.current[Math.max(0, value[i] ? i : i - 1)]?.focus(); }
          }}
          className="h-14 w-full min-w-0 rounded-xl border border-slate-300 bg-white text-center font-display text-2xl font-bold text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10" />
      ))}
    </div>
  );
}

export function TwoFactorForm({ methods, preferred, email, emailSent }: { methods: Method[]; preferred: Method; email: string | null; emailSent: boolean }) {
  const [method, setMethod] = useState<Method>(methods.includes(preferred) ? preferred : methods[0]);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(emailSent && preferred === "email" ? { ok: true, text: `Code envoyé à ${email}.` } : null);
  const [sentOnce, setSentOnce] = useState(emailSent);
  const [pending, start] = useTransition();

  const submit = (c = code) => start(async () => {
    setMsg(null);
    const r = await verifyTwoFactorAction(method, c);
    if (r.redirectTo) { window.location.assign(r.redirectTo); return; }
    if (!r.ok) { setMsg({ ok: false, text: r.error ?? "Code incorrect." }); setCode(""); }
  });
  const send = () => start(async () => {
    const r = await resendTwoFactorEmailAction();
    setSentOnce(true);
    setMsg(r.ok ? { ok: true, text: `Code envoyé${email ? ` à ${email}` : ""}.` } : { ok: false, text: r.error ?? "Envoi impossible." });
  });
  const choose = (m: Method) => {
    setMethod(m); setCode(""); setMsg(null);
    if (m === "email" && !sentOnce) send();
  };

  return (
    <div className="space-y-5">
      {methods.length > 1 ? (
        <div className="flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
          {methods.map((m) => (
            <button key={m} type="button" onClick={() => choose(m)}
              className={"flex-1 rounded-full px-3 py-2 transition " + (m === method ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink")}>
              {LABEL[m].tab}
            </button>
          ))}
        </div>
      ) : null}
      <div>
        <p className="font-semibold text-ink">{LABEL[method].title}</p>
        <p className="mt-1 text-sm text-muted">{method === "email" && email ? LABEL.email.help.replace("votre adresse", email) : LABEL[method].help}</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
        {method === "backup" ? (
          <input autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="xxxx-xxxx" autoCapitalize="none" spellCheck={false}
            className="input text-center font-mono text-lg tracking-widest" />
        ) : (
          <OtpBoxes key={method} value={code} onChange={setCode} onComplete={(c) => submit(c)} />
        )}
        {msg ? <p className={"text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
        <button type="submit" disabled={pending} className="btn-primary w-full bg-ink hover:bg-black disabled:opacity-60">
          {pending ? "Vérification…" : "Vérifier et continuer"}
        </button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        {method === "email" ? <button type="button" onClick={send} disabled={pending} className="font-semibold text-brand-800 hover:underline">Renvoyer le code</button> : <span />}
        <button type="button" onClick={() => start(async () => { await cancelTwoFactorAction(); window.location.assign("/compte"); })}
          className="font-semibold text-muted hover:text-ink">Annuler</button>
      </div>
    </div>
  );
}
