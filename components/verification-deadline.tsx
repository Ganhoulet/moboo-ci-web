import { getSession } from "@/lib/session";
import { getSiteSettings } from "@/lib/settings";
import { getMyVerification } from "@/app/mon-espace/actions";
import { VerificationDeadlineBar } from "./verification-deadline-bar";

/**
 * Barre du haut : décompte du délai pour s'identifier (back-office → Vérification des comptes → Réglages).
 * Seulement pour les comptes concernés, connectés et pas encore vérifiés ; rien à charger pour les autres.
 */
export async function VerificationDeadline() {
  const s = getSession();
  if (!s) return null;
  const v = (await getSiteSettings()).verification;
  if (!v.enabled || !(v.types ?? []).includes(s.accountType ?? "")) return null;
  const mine = await getMyVerification().catch(() => null);
  const d = mine?.deadline;
  if (!d) return null;
  return <VerificationDeadlineBar d={d} docs={(mine?.identity.docTypes ?? []).slice(0, 3)} />;
}
