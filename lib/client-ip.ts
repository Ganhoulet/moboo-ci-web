// Serveur uniquement : adresse du visiteur de la requête en cours (actions,
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

(globalThis as { __mobooClientIp?: () => string | undefined }).__mobooClientIp = clientIp;

export {};
