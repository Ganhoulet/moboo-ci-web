// Appels authentifiés au moteur, côté serveur. Rafraîchit le jeton d'accès
// automatiquement en cas de 401 (via le refresh token en cookie). À n'utiliser
// que dans des server actions / route handlers (il peut réécrire les cookies).
import { API_URL } from "./api";
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

/** Fetch authentifié avec rafraîchissement transparent du jeton sur 401. */
export async function authedFetch(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: any }> {
  let token = getAccessToken();
  let res = await doFetch(path, init, token);

  if (res.status === 401) {
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
