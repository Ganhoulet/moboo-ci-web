/** Envoi discret vers /api/track (sendBeacon survit au changement de page). Client uniquement. */
export function beacon(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "text/plain" }))) return;
  } catch { /* repli ci-dessous */ }
  fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => undefined);
}

/** Identifiant d'annonce classique depuis l'identifiant de carte (« lst-<uuid> »), sinon null. */
export const listingUuid = (cardId: string) => (/^lst-([0-9a-f-]{36})$/i.exec(cardId)?.[1] ?? null);
