/**
 * En-têtes de relais « serveur du site → API ». Sans eux, tous les visiteurs
 * partageraient l'adresse du serveur (Vercel) et donc une seule limite de
 * requêtes côté API. Clé partagée : SITE_RELAY_KEY (Vercel + Render).
 *
 * Module universel (importé aussi par des composants client via lib/api) :
 * dans le navigateur, rien n'est ajouté. L'adresse du visiteur est fournie par
 * lib/client-ip (serveur uniquement), enregistrée au chargement.
 */
type IpProvider = () => string | undefined;

export function relayHeaders(withClientIp: boolean): Record<string, string> {
  if (typeof window !== "undefined") return {};
  const key = process.env.SITE_RELAY_KEY;
  if (!key) return {};
  const provider = (globalThis as { __mobooClientIp?: IpProvider }).__mobooClientIp;
  const ip = withClientIp && provider ? provider() : undefined;
  return { "X-Moboo-Relay-Key": key, ...(ip ? { "X-Moboo-Client-IP": ip } : {}) };
}
