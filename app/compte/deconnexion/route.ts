import { NextResponse, type NextRequest } from "next/server";

/** Session devenue invalide (compte supprimé, jeton révoqué) : on nettoie et on renvoie vers la connexion. */
export function GET(req: NextRequest) {
  // Fin (ou expiration) d'un accès assisté : l'account manager retrouve sa session.
  const stash = req.cookies.get("moboo_am_at")?.value;
  if (stash) {
    let accountId = "";
    try { accountId = JSON.parse(req.cookies.get("moboo_assist")?.value ?? "{}").accountId ?? ""; } catch { /* rien */ }
    const res = NextResponse.redirect(new URL(accountId ? `/admin/comptes/site/${accountId}?assist=fin` : "/admin/comptes", req.url));
    const opts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 };
    for (const [from, to] of [["moboo_am_at", "moboo_at"], ["moboo_am_rt", "moboo_rt"], ["moboo_am_profile", "moboo_profile"]]) {
      const v = req.cookies.get(from)?.value;
      if (v) res.cookies.set(to, v, opts); else res.cookies.delete(to);
      res.cookies.delete(from);
    }
    res.cookies.delete("moboo_assist");
    return res;
  }
  const next = req.nextUrl.searchParams.get("next");
  const to = next === "/administration" ? "/administration" : "/compte";
  const res = NextResponse.redirect(new URL(to, req.url));
  for (const c of ["moboo_at", "moboo_rt", "moboo_profile"]) res.cookies.delete(c);
  return res;
}
