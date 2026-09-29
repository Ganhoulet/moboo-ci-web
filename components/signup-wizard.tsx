"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ACCOUNT_TYPES, COMMUNES, accountTypeDef, type AccountType } from "@/lib/accounts";
import {
  checkAvailabilityAction,
  completeProfileAction,
  sendSignupCodeAction,
  verifySignupAction,
} from "@/app/inscription/actions";

/* ─── Illustrations des types de compte ───────────────────────────────── */

const sv = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9 } as const;
const lj = { strokeLinecap: "round", strokeLinejoin: "round" } as const;
const TYPE_ICONS: Record<AccountType, React.ReactNode> = {
  particulier: <svg {...sv}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" {...lj} /></svg>,
  proprietaire: <svg {...sv}><path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" {...lj} /><path d="M10 21v-5h4v5" {...lj} /></svg>,
  agent: <svg {...sv}><circle cx="12" cy="7.5" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0M12 14v4" {...lj} /></svg>,
  entreprise: <svg {...sv}><path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M14 9h5a1 1 0 0 1 1 1v11M3 21h18M8 8h2M8 12h2M8 16h2M17 13h.01M17 17h.01" {...lj} /></svg>,
  etablissement: <svg {...sv}><path d="M3 21h18M5 21V9l7-5 7 5v12" {...lj} /><path d="M9 21v-6h6v6M9 11h.01M15 11h.01" {...lj} /></svg>,
};

const STEPS_SIGNUP = ["Profil", "Précisions", "Identité", "Téléphone", "Code"];
const STEPS_COMPLETE = ["Profil", "Précisions", "Identité"];

type Data = {
  accountType?: AccountType;
  accountSubtype?: string;
  accountRole?: string;
  companyName: string;
  commune: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  code: string;
};

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);
}

export function SignupWizard({
  mode = "signup",
  initial,
}: {
  /** signup = création ; complete = compte connecté qui choisit / change son type. */
  mode?: "signup" | "complete";
  initial?: Partial<Data>;
}) {
  const router = useRouter();
  const steps = mode === "signup" ? STEPS_SIGNUP : STEPS_COMPLETE;
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [pending, startTransition] = useTransition();
  const [d, setD] = useState<Data>({
    companyName: "", commune: "", firstName: "", lastName: "", username: "", email: "", phone: "", code: "",
    ...initial,
  });
  const set = (patch: Partial<Data>) => { setD((p) => ({ ...p, ...patch })); setError(null); };
  const def = d.accountType ? accountTypeDef(d.accountType) : null;

  // Nom d'utilisateur proposé à partir du prénom / nom tant qu'il n'a pas été modifié.
  const usernameTouched = useRef(!!initial?.username);
  useEffect(() => {
    if (usernameTouched.current) return;
    const base = slug(d.companyName && def?.key !== "particulier" ? d.companyName : `${d.firstName} ${d.lastName}`);
    setD((p) => ({ ...p, username: base }));
  }, [d.firstName, d.lastName, d.companyName, def?.key]);

  // Disponibilité en direct du nom d'utilisateur / de l'e-mail.
  const [avail, setAvail] = useState<{ username?: boolean; email?: boolean }>({});
  useEffect(() => {
    if (step !== 2) return;
    const username = d.username.trim();
    const email = d.email.trim();
    if (!username && !email) return;
    const t = setTimeout(async () => {
      const r = await checkAvailabilityAction({ username: username || undefined, email: email || undefined });
      if (r) setAvail({ username: username ? r.usernameAvailable : undefined, email: email ? r.emailAvailable : undefined });
    }, 450);
    return () => clearTimeout(t);
  }, [d.username, d.email, step]);

  const profile = useMemo(() => ({
    accountType: d.accountType,
    accountSubtype: d.accountSubtype || undefined,
    accountRole: d.accountRole || undefined,
    companyName: d.companyName.trim() || undefined,
    commune: d.commune || undefined,
    firstName: d.firstName.trim() || undefined,
    lastName: d.lastName.trim() || undefined,
    username: d.username.trim() || undefined,
    email: d.email.trim() || undefined,
  }), [d]);

  function validate(s: number): string | null {
    if (s === 0 && !d.accountType) return "Choisissez votre profil pour continuer.";
    if (s === 1 && def) {
      if (def.subtypes.length && !d.accountSubtype) return "Choisissez une option.";
      if (def.roles && !d.accountRole) return "Précisez si vous êtes propriétaire ou gérant.";
      if (def.company?.required && d.companyName.trim().length < 2) return `Indiquez : ${def.company.label.toLowerCase()}.`;
    }
    if (s === 2) {
      if (d.firstName.trim().length < 2) return "Indiquez votre prénom.";
      if (!/^[a-z0-9._-]{3,30}$/.test(d.username.trim())) return "Nom d'utilisateur : 3 à 30 caractères (lettres minuscules, chiffres, . _ -).";
      if (avail.username === false) return "Ce nom d'utilisateur est déjà pris.";
      if (def?.emailRequired && !d.email.trim()) return "L'e-mail est requis pour un compte professionnel.";
      if (d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) return "Adresse e-mail invalide.";
      if (avail.email === false) return "Cette adresse e-mail est déjà utilisée.";
    }
    return null;
  }

  function next() {
    const err = validate(step);
    if (err) return setError(err);
    if (mode === "complete" && step === 2) return save();
    if (step === 3) return sendCode();
    if (step === 4) return verify();
    setStep((s) => s + 1);
  }

  function sendCode() {
    startTransition(async () => {
      const r = await sendSignupCodeAction({ phone: d.phone, username: profile.username, email: profile.email });
      if (!r.ok) return setError(r.error ?? "Erreur.");
      setDevCode(r.devCode);
      setAlreadyRegistered(!!r.phoneRegistered);
      setStep(4);
    });
  }

  function verify() {
    startTransition(async () => {
      const r = await verifySignupAction({ phone: d.phone, code: d.code, ...profile });
      if (!r.ok) return setError(r.error ?? "Erreur.");
      router.replace("/mon-espace?bienvenue=1");
      router.refresh();
    });
  }

  function save() {
    startTransition(async () => {
      const r = await completeProfileAction(profile);
      if (!r.ok) return setError(r.error ?? "Erreur.");
      router.replace("/mon-espace?bienvenue=1");
      router.refresh();
    });
  }

  return (
    <div>
      {/* Progression */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-muted">
          <span>Étape {step + 1} sur {steps.length}</span>
          <span className="text-brand-800">{steps[step]}</span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {steps.map((_, i) => (
            <span key={i} className={"h-1.5 flex-1 rounded-full transition-colors duration-300 " + (i <= step ? "bg-accent-600" : "bg-slate-200")} />
          ))}
        </div>
      </div>

      <div key={step} className="animate-[stepIn_.28s_ease-out]">
        {step === 0 ? (
          <>
            <StepTitle title={mode === "signup" ? "Bienvenue ! Qui êtes-vous ?" : "Quel est votre profil ?"} sub="Votre espace Moboo.ci s'adapte à votre activité." />
            <div className="grid gap-3">
              {ACCOUNT_TYPES.map((t) => {
                const on = d.accountType === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => { set({ accountType: t.key, accountSubtype: undefined, accountRole: undefined }); }}
                    className={
                      "group flex items-center gap-4 rounded-2xl border-2 bg-white p-4 text-left transition " +
                      (on ? "border-accent-600 shadow-card" : "border-slate-200 hover:border-slate-300 hover:shadow-card")
                    }
                  >
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm transition group-hover:scale-105 ${t.color}`}>
                      {TYPE_ICONS[t.key]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display font-bold text-ink">{t.title}</span>
                      <span className="block text-sm text-muted">{t.tagline}</span>
                    </span>
                    <span className={"grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition " + (on ? "border-accent-600 bg-accent-600 text-white" : "border-slate-300")}>
                      {on ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 13 4 4L19 7" {...lj} /></svg> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {step === 1 && def ? (
          <>
            <StepTitle title={def.question} sub={`${def.title} — ${def.tagline}`} />
            {def.subtypes.length ? (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {def.subtypes.map((s) => (
                  <Pill key={s.key} on={d.accountSubtype === s.key} onClick={() => set({ accountSubtype: s.key })} label={s.label} hint={s.hint} />
                ))}
              </div>
            ) : null}
            {def.roles ? (
              <>
                <p className="mb-2 mt-5 text-sm font-semibold text-ink">Vous êtes…</p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {def.roles.map((r) => (
                    <Pill key={r.key} on={d.accountRole === r.key} onClick={() => set({ accountRole: r.key })} label={r.label} />
                  ))}
                </div>
              </>
            ) : null}
            {def.company ? (
              <Field label={def.company.label} className="mt-5">
                <input className="input" value={d.companyName} placeholder={def.company.placeholder}
                  onChange={(e) => set({ companyName: e.target.value })} />
              </Field>
            ) : null}
            {def.key !== "particulier" ? (
              <Field label="Commune d'activité (optionnel)" className="mt-4">
                <select className="input" value={d.commune} onChange={(e) => set({ commune: e.target.value })}>
                  <option value="">— Choisir —</option>
                  {COMMUNES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            ) : null}
            {def.key === "etablissement" ? (
              <div className="mt-5 rounded-xl bg-brand-50 p-4 text-sm text-brand-900">
                <p className="font-semibold">Bon à savoir</p>
                <p className="mt-1">
                  Vos logements et espaces se publient depuis les applis gratuites{" "}
                  <strong>Moboo Resi</strong> (meublés) et <strong>Moboo Event</strong> (espaces) : ils
                  apparaissent ensuite sur Moboo.ci, et les réservations venues du site sont gérées gratuitement.
                </p>
              </div>
            ) : null}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <StepTitle title="Faisons connaissance" sub="Ces informations apparaissent sur votre profil." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prénom *">
                <input className="input" value={d.firstName} autoComplete="given-name" onChange={(e) => set({ firstName: e.target.value })} />
              </Field>
              <Field label="Nom">
                <input className="input" value={d.lastName} autoComplete="family-name" onChange={(e) => set({ lastName: e.target.value })} />
              </Field>
            </div>
            <Field label="Nom d'utilisateur *" className="mt-4">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                <input className="input pl-7 pr-10" value={d.username} autoCapitalize="none" spellCheck={false}
                  onChange={(e) => { usernameTouched.current = true; set({ username: e.target.value.toLowerCase().replace(/\s/g, "") }); }} />
                <AvailIcon state={d.username.length >= 3 ? avail.username : undefined} />
              </div>
            </Field>
            <Field label={`E-mail${def?.emailRequired ? " *" : " (optionnel)"}`} className="mt-4">
              <div className="relative">
                <input className="input pr-10" type="email" value={d.email} autoComplete="email" onChange={(e) => set({ email: e.target.value })} />
                <AvailIcon state={d.email.includes("@") ? avail.email : undefined} />
              </div>
            </Field>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <StepTitle title="Votre numéro de téléphone" sub="Il sert à vous connecter : pas de mot de passe à retenir." />
            <Field label="Numéro (WhatsApp de préférence)">
              <input className="input text-lg tracking-wide" type="tel" inputMode="tel" autoComplete="tel"
                placeholder="07 07 12 34 56" value={d.phone} onChange={(e) => set({ phone: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") next(); }} />
            </Field>
            <p className="mt-2 text-xs text-muted">Vous recevrez un code à 6 chiffres par WhatsApp ou SMS.</p>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <StepTitle title="Entrez le code reçu" sub={`Envoyé au ${d.phone}.`} />
            {alreadyRegistered ? (
              <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                Ce numéro a déjà un compte Moboo.ci : il sera complété avec votre nouveau profil.
              </p>
            ) : null}
            <input
              className="input text-center font-display text-2xl font-bold tracking-[0.5em]"
              inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••"
              value={d.code} onChange={(e) => set({ code: e.target.value.replace(/[^0-9]/g, "") })}
              onKeyDown={(e) => { if (e.key === "Enter") next(); }}
              autoFocus
            />
            {devCode ? <p className="mt-2 text-center text-xs text-muted">Code de test : <strong>{devCode}</strong></p> : null}
            <button type="button" onClick={() => { setStep(3); set({ code: "" }); }} className="mt-3 w-full text-center text-sm font-semibold text-brand-800 hover:underline">
              Changer de numéro / renvoyer le code
            </button>
          </>
        ) : null}
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}

      <div className="mt-6 flex gap-3">
        {step > 0 ? (
          <button type="button" onClick={() => { setStep((s) => s - 1); setError(null); }} disabled={pending} className="btn-ghost">
            Retour
          </button>
        ) : null}
        <button type="button" onClick={next} disabled={pending}
          className="btn-primary flex-1 bg-accent-600 hover:bg-accent-700 disabled:opacity-60">
          {pending ? "Un instant…"
            : step === 3 ? "Recevoir mon code"
            : step === 4 ? "Créer mon compte"
            : mode === "complete" && step === 2 ? "Enregistrer mon profil"
            : "Continuer"}
        </button>
      </div>

      {mode === "signup" && step === 0 ? (
        <p className="mt-5 text-center text-sm text-muted">
          Déjà inscrit ? <Link href="/compte" className="font-semibold text-brand-800 hover:underline">Se connecter</Link>
        </p>
      ) : null}
    </div>
  );
}

/* ─── Petits composants ───────────────────────────────────────────────── */

function StepTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-xl font-extrabold text-ink sm:text-2xl">{title}</h2>
      {sub ? <p className="mt-1 text-sm text-muted">{sub}</p> : null}
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={"block " + className}>
      <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

function Pill({ on, onClick, label, hint }: { on: boolean; onClick: () => void; label: string; hint?: string }) {
  return (
    <button type="button" onClick={onClick}
      className={"rounded-xl border-2 px-4 py-3 text-left transition " + (on ? "border-accent-600 bg-accent-50" : "border-slate-200 bg-white hover:border-slate-300")}>
      <span className={"block font-semibold " + (on ? "text-accent-700" : "text-ink")}>{label}</span>
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </button>
  );
}

function AvailIcon({ state }: { state?: boolean }) {
  if (state === undefined) return null;
  return (
    <span className={"absolute right-3 top-1/2 -translate-y-1/2 " + (state ? "text-emerald-600" : "text-red-600")}
      title={state ? "Disponible" : "Déjà utilisé"}>
      {state ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="m5 13 4 4L19 7" {...lj} /></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M6 6l12 12M18 6 6 18" {...lj} /></svg>
      )}
    </span>
  );
}
