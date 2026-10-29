"use client";

import { useState } from "react";
import { otpDigits } from "@/lib/otp";

/**
 * Champ du code reçu, pour les formulaires envoyés tels quels : la saisie visible n'a pas de nom
 * (le navigateur n'y propose pas le numéro enregistré) et le code part dans un champ caché `name`.
 */
export function OtpInput({ id, name = "code", placeholder = "6 chiffres", className = "", autoFocus }: { id?: string; name?: string; placeholder?: string; className?: string; autoFocus?: boolean }) {
  const [code, setCode] = useState("");
  return (
    <>
      <input type="hidden" name={name} value={code} />
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        placeholder={placeholder}
        className={className}
        value={code}
        onChange={(e) => setCode(otpDigits(e.target.value))}
        autoFocus={autoFocus}
        required
      />
    </>
  );
}
