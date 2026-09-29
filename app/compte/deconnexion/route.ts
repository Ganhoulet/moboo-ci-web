import { NextResponse, type NextRequest } from "next/server";

/** Session devenue invalide (compte supprimé, jeton révoqué) : on nettoie et on renvoie vers la connexion. */
export function GET(req: NextRequest) {
  const next = req.nextUrl.searchParams.get("next");
  const to = next === "/administration" ? "/administration" : "/compte";
  const res = NextResponse.redirect(new URL(to, req.url));
  for (const c of ["moboo_at", "moboo_rt", "moboo_profile"]) res.cookies.delete(c);
  return res;
}
