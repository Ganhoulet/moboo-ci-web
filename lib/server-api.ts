// Appels authentifiés au moteur, côté serveur. Rafraîchit le jeton d'accès
// automatiquement en cas de 401 (via le refresh token en cookie). À n'utiliser
// que dans des server actions / route handlers (il peut réécrire les cookies).
import { API_URL } from "./api";
import { cookies } from "next/headers";
import { getAccessToken, getRefreshToken, setTokens, clearSession } from "./session";

async function doFetch(path: string, init: RequestInit, token: string | null) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
}

/**
 * Les cookies ne sont modifiables que dans une server action / un route handler.
 * Pendant l'affichage d'une page (server component), c'est le middleware qui a
 * déjà renouvelé la session : on ne rafraîchit donc pas ici (le jeton de
 * rafraîchissement tourne à chaque usage — le consommer sans pouvoir enregistrer
 * le nouveau casserait la session).
 */
function cookiesWritable(): boolean {
  try {
    cookies().set("moboo_probe", "", { maxAge: 0, path: "/" });
    return true;
  } catch {
    return false;
  }
}

/** Fetch authentifié avec rafraîchissement transparent du jeton sur 401 (actions). */
export async function authedFetch(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: any }> {
  let token = getAccessToken();
  let res = await doFetch(path, init, token);

  if (res.status === 401 && cookiesWritable()) {
    const rt = getRefreshToken();
    if (rt) {
      const r = await fetch(`${API_URL}/site/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
        cache: "no-store",
      });
      if (r.ok) {
        const t = await r.json().catch(() => ({}));
        if (t?.accessToken && t?.refreshToken) {
          setTokens(t.accessToken, t.refreshToken, t.expiresIn);
          token = t.accessToken;
          res = await doFetch(path, init, token);
        }
      } else {
        clearSession();
      }
    }
  }

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
