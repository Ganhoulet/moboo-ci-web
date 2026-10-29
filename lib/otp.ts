/**
 * Code de vérification (6 chiffres). Le remplissage automatique du navigateur y colle parfois le
 * numéro de téléphone enregistré (« +225 07… ») : tout ce qui ressemble à un numéro est refusé.
 */
export function otpDigits(value: string): string {
  const s = String(value ?? "");
  const d = s.replace(/\D/g, "");
  return /\+/.test(s) || d.length > 6 ? "" : d;
}
