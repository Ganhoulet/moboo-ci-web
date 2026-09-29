import { authedFetch } from "@/lib/server-api";
import { TwoFactorSettings } from "@/components/two-factor-settings";

export const dynamic = "force-dynamic";

/** Double authentification de l'administrateur connecté. */
export default async function AdminSecurity() {
  const tf = await authedFetch("/site/auth/2fa", { method: "GET" });
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-extrabold text-ink">Ma sécurité</h1>
      <p className="text-sm text-muted">Double authentification de votre compte administrateur. Les règles (obligatoire, méthodes proposées) se trouvent dans Réglages → Connexion et inscription.</p>
      {tf.ok ? <TwoFactorSettings initial={tf.data} /> : <p className="mt-6 text-sm text-red-600">Statut indisponible.</p>}
    </div>
  );
}
