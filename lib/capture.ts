import { API_URL } from "./api";
import { relayHeaders } from "./relay";

/** Conseiller derrière un lien public de capture (Moboo Pro), ou null si le lien est invalide. */
export async function getCaptureAgent(token: string | undefined): Promise<{ agentName: string } | null> {
  const t = String(token ?? "").replace(/[^a-zA-Z0-9]/g, "");
  if (!t) return null;
  try {
    const r = await fetch(`${API_URL}/pro-public/capture/info?token=${encodeURIComponent(t)}`, { cache: "no-store", headers: { Accept: "application/json", ...relayHeaders(true) } });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.valid ? { agentName: String(d.agentName || "Votre conseiller") } : null;
  } catch {
    return null;
  }
}
