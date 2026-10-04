"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { sendOtpAction, verifyFirebaseAction, verifyOtpAction, type OtpState } from "@/app/compte/actions";
import { confirmFirebaseCode, firebaseErrorMessage, sendFirebaseSms, type FirebaseWebConfig } from "@/lib/firebase-phone";

function SubmitButton({ label, busy = false }: { label: string; busy?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || busy}
      className="btn-primary w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-60"
    >
      {pending || busy ? "Un instant…" : label}
    </button>
  );
}

/**
 * Connexion par code reçu sur le numéro. `googleTicket` : première connexion
 * Google, le numéro confirmé est relié au compte Google.
 * `firebase` : SMS envoyé et vérifié par Firebase (Google) ; en cas d'échec,
 * le code part par WhatsApp / SMS / e-mail comme d'habitude.
 */
export function LoginFlow({ googleTicket, next, firebase }: { googleTicket?: string; next?: string; firebase?: FirebaseWebConfig | null } = {}) {
  const router = useRouter();
  const [phoneState, sendOtp] = useFormState<OtpState, FormData>(sendOtpAction, { step: "phone", googleTicket });
  const [codeState, verifyOtp] = useFormState<OtpState, FormData>(verifyOtpAction, null);
  const [fbPhone, setFbPhone] = useState<string | null>(null);
  const [fbState, setFbState] = useState<OtpState>(null);
  const [fbBusy, setFbBusy] = useState(false);
  const [fbNotice, setFbNotice] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Connexion réussie → on rafraîchit pour afficher le profil.
  useEffect(() => {
    const done = codeState?.step === "done" ? codeState : fbState?.step === "done" ? fbState : null;
    if (!done) return;
    // Double authentification : étape « code de sécurité ».
    if (done.redirectTo) window.location.assign(done.redirectTo);
    else router.refresh();
  }, [codeState, fbState, router]);

  const onCodeStep = phoneState?.step === "code";
  const phone = onCodeStep ? phoneState.phone : "";
  const devCode = onCodeStep ? phoneState.devCode : undefined;
  const channel = onCodeStep ? phoneState.channel : undefined;
  const emailHint = onCodeStep ? phoneState.emailHint : undefined;
  const codeError = (codeState?.step === "code" && codeState.error) || (onCodeStep && phoneState.error) || null;
  const ticket = (phoneState && "googleTicket" in phoneState ? phoneState.googleTicket : undefined) ?? googleTicket;
  const ticketInput = <>
    {ticket ? <input type="hidden" name="googleTicket" value={ticket} /> : null}
    {next ? <input type="hidden" name="next" value={next} /> : null}
  </>;
  const recaptcha = <div id="fb-recaptcha" />;

  /** Repli : code par WhatsApp / SMS du serveur / e-mail. */
  const fallback = (rawPhone: string, channelValue?: "email") => {
    const fd = new FormData();
    fd.set("phone", rawPhone);
    if (ticket) fd.set("googleTicket", ticket);
    if (channelValue) fd.set("channel", channelValue);
    setFbPhone(null);
    startTransition(() => sendOtp(fd));
  };

  // ── SMS Firebase : étape du code ──
  if (fbPhone && !onCodeStep) {
    const err = fbState?.step === "code" ? fbState.error : null;
    return (
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setFbBusy(true);
        setFbState(null);
        try {
          const idToken = await confirmFirebaseCode(fbPhone, String(fd.get("code") || ""));
          setFbState(await verifyFirebaseAction({ phone: fbPhone, idToken, firstName: String(fd.get("firstName") || ""), googleTicket: ticket, next }));
        } catch (x) {
          setFbState({ step: "code", phone: fbPhone, error: firebaseErrorMessage(x) });
        } finally {
          setFbBusy(false);
        }
      }}>
        {recaptcha}
        <div>
          <label htmlFor="code" className="mb-1 block text-sm font-semibold text-ink">Code de vérification</label>
          <input id="code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6 chiffres" className="input tracking-[0.4em]" required />
          <p className="mt-1 text-xs text-muted">Envoyé par SMS au <span className="font-semibold text-ink">{fbPhone}</span>.</p>
        </div>
        <div>
          <label htmlFor="firstName" className="mb-1 block text-sm font-semibold text-ink">
            Prénom <span className="font-normal text-muted">(optionnel)</span>
          </label>
          <input id="firstName" name="firstName" type="text" placeholder="Votre prénom" className="input" />
        </div>
        {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
        <SubmitButton label="Se connecter" busy={fbBusy} />
        <button type="button" onClick={() => fallback(fbPhone)} className="w-full text-center text-sm font-semibold text-brand-800 hover:underline">
          SMS non reçu ? Recevoir le code par WhatsApp ou e-mail
        </button>
        <button type="button" onClick={() => window.location.assign("/compte")} className="w-full text-center text-sm font-semibold text-muted hover:text-ink">
          Changer de numéro
        </button>
      </form>
    );
  }

  if (!onCodeStep) {
    // ── Étape 1 : numéro ──
    return (
      <form
        action={firebase ? undefined : sendOtp}
        onSubmit={firebase ? async (e) => {
          e.preventDefault();
          const raw = String(new FormData(e.currentTarget).get("phone") || "");
          if (raw.replace(/[^0-9]/g, "").length < 8) { setFbNotice("Entrez un numéro de téléphone valide."); return; }
          setFbBusy(true);
          setFbNotice(null);
          try {
            setFbPhone(await sendFirebaseSms(firebase, raw, "fb-recaptcha"));
          } catch (x) {
            // SMS Google indisponible (quota, réseau…) : le code part par les canaux habituels.
            setFbNotice(`${firebaseErrorMessage(x)} Nous vous envoyons le code autrement.`);
            fallback(raw);
          } finally {
            setFbBusy(false);
          }
        } : undefined}
        className="space-y-4"
      >
        {ticketInput}
        {recaptcha}
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-ink">
            Numéro de téléphone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="07 07 12 34 56"
            className="input"
            required
          />
          <p className="mt-1 text-xs text-muted">
            Vous recevrez un code par SMS{firebase ? "" : " ou WhatsApp"} (ou par e-mail si votre compte en a un).
          </p>
        </div>
        {fbNotice ? <p className="text-sm font-medium text-amber-700">{fbNotice}</p> : null}
        {phoneState?.step === "phone" && phoneState.error ? (
          <p className="text-sm font-medium text-red-600">{phoneState.error}</p>
        ) : null}
        <SubmitButton label="Recevoir un code" busy={fbBusy} />
      </form>
    );
  }

  // ── Étape 2 : code + prénom (à la 1re connexion) ──
  return (
    <form action={verifyOtp} className="space-y-4">
      <input type="hidden" name="phone" value={phone} />
      {ticketInput}
      <div>
        <label htmlFor="code" className="mb-1 block text-sm font-semibold text-ink">
          Code de vérification
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="6 chiffres"
          className="input tracking-[0.4em]"
          required
        />
        <p className="mt-1 text-xs text-muted">
          {channel === "email" && emailHint
            ? <>Envoyé par e-mail à <span className="font-semibold text-ink">{emailHint}</span> (pensez aux courriers indésirables).</>
            : <>Envoyé par {channel === "sms" ? "SMS" : "WhatsApp"} au <span className="font-semibold text-ink">{phone}</span>.</>}
        </p>
        {fbNotice ? <p className="mt-1 text-xs text-amber-700">{fbNotice}</p> : null}
        {devCode ? (
          <p className="mt-1 text-xs font-semibold text-accent-700">
            Code de test : {devCode}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="firstName" className="mb-1 block text-sm font-semibold text-ink">
          Prénom <span className="font-normal text-muted">(optionnel)</span>
        </label>
        <input id="firstName" name="firstName" type="text" placeholder="Votre prénom" className="input" />
      </div>
      {codeError ? <p className="text-sm font-medium text-red-600">{codeError}</p> : null}
      <SubmitButton label="Se connecter" />
      {channel !== "email" && emailHint ? (
        // Pas de message WhatsApp ? Le code peut arriver à l'adresse e-mail du compte.
        <button type="submit" formAction={sendOtp} formNoValidate name="channel" value="email"
          className="w-full text-center text-sm font-semibold text-brand-800 hover:underline">
          Pas reçu ? Recevoir le code par e-mail ({emailHint})
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => window.location.assign("/compte")}
        className="w-full text-center text-sm font-semibold text-muted hover:text-ink"
      >
        Changer de numéro
      </button>
    </form>
  );
}
