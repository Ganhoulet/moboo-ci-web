import { NextResponse, type NextRequest } from "next/server";
import { apiPost } from "@/lib/api";
import { setSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Lien d'auto-connexion créé par l'application (« gérer mon compte », e-mail
 * d'évolution du compte) : ouvre la session sur le site puis affiche la page
 * demandée (forfaits par défaut). Jeton à usage unique, valable quelques minutes.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t") ?? "";
  const raw = req.nextUrl.searchParams.get("next") ?? "/forfaits";
  // Redirection limitée au site lui-même (chemin relatif).
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/forfaits";
  const { ok, data } = await apiPost<any>("/site/auth/login-link/exchange", { token });
  if (!ok || !data?.accessToken) {
    // Lien expiré ou déjà utilisé : connexion habituelle.
    return NextResponse.redirect(new URL("/compte", req.nextUrl.origin));
  }
  setSession(data, data.account);
  return NextResponse.redirect(new URL(next, req.nextUrl.origin));
}
