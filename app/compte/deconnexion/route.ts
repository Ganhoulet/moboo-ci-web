import { NextResponse, type NextRequest } from "next/server";

/** Session devenue invalide (compte supprimé, jeton révoqué) : on nettoie et on renvoie vers la connexion. */
export function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/compte", req.url));
  for (const c of ["moboo_at", "moboo_rt", "moboo_profile"]) res.cookies.delete(c);
  return res;
}
