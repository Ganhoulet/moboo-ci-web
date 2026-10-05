// Serveur uniquement : adresse (et appareil) du visiteur de la requête en cours (actions,
// route handlers), transmise à l'API par lib/relay.
import { headers } from "next/headers";

function clientIp(): string | undefined {
  try {
    const h = headers();
    const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "";
    return ip || undefined;
  } catch {
    return undefined; // hors requête (build, cache ISR)
  }
}

/** Identifiant anonyme du navigateur (cookie moboo_did posé par le middleware). */
function deviceId(): string | undefined {
  try {
    const v = headers().get("x-moboo-did") || "";
    return /^[\w-]{16,64}$/.test(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

(globalThis as { __mobooClientIp?: () => string | undefined }).__mobooClientIp = clientIp;
(globalThis as { __mobooDeviceId?: () => string | undefined }).__mobooDeviceId = deviceId;

export {};
