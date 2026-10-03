"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { sendOtpAction, verifyOtpAction, type OtpState } from "@/app/compte/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-60"
    >
      {pending ? "Un instant…" : label}
    </button>
  );
}

/**
 * Connexion par code reçu sur le numéro. `googleTicket` : première connexion
 * Google, le numéro confirmé est relié au compte Google.
 */
export function LoginFlow({ googleTicket, next }: { googleTicket?: string; next?: string } = {}) {
  const router = useRouter();
  const [phoneState, sendOtp] = useFormState<OtpState, FormData>(sendOtpAction, { step: "phone", googleTicket });
  const [codeState, verifyOtp] = useFormState<OtpState, FormData>(verifyOtpAction, null);

  // Connexion réussie → on rafraîchit pour afficher le profil.
  useEffect(() => {
    if (codeState?.step !== "done") return;
    // Double authentification : étape « code de sécurité ».
    if (codeState.redirectTo) window.location.assign(codeState.redirectTo);
    else router.refresh();
  }, [codeState, router]);

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

  if (!onCodeStep) {
    // ── Étape 1 : numéro ──
    return (
      <form action={sendOtp} className="space-y-4">
        {ticketInput}
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
            Vous recevrez un code par WhatsApp (ou par e-mail si votre compte en a un).
          </p>
        </div>
        {phoneState?.step === "phone" && phoneState.error ? (
          <p className="text-sm font-medium text-red-600">{phoneState.error}</p>
        ) : null}
        <SubmitButton label="Recevoir un code" />
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
            : <>Envoyé par WhatsApp au <span className="font-semibold text-ink">{phone}</span>.</>}
        </p>
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
