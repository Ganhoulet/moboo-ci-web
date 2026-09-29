import { getGatewayInfo } from "../actions";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  "touch-base": "Démarrage (listes, configuration)", "get-terms": "Listes (types, villes…)", "create-nonce": "Jetons de sécurité",
  "search-properties": "Recherche, vedettes, dernières annonces", "all-properties": "Toutes les annonces", "my-properties": "Mes annonces",
  "similar-properties": "Biens similaires", property: "Fiche d’une annonce", "property-by-permalink": "Lien partagé → fiche",
  signin: "Connexion", signup: "Inscription", "reset-password": "Mot de passe oublié", "update-password": "Changer de mot de passe",
  profile: "Profil", "update-profile": "Modifier le profil", "delete-user-account": "Suppression du compte",
  "favorite-properties": "Favoris", "like-property": "Ajouter / retirer un favori", "is-fav-property": "Favori ?",
  "contact-property-agent": "Contacter l’annonceur", "contact-realtor": "Contacter un agent", "schedule-tour": "Demande de visite",
  "add-review": "Laisser un avis", "report-content": "Signaler", "all-notifications": "Notifications", "check-notifications": "Nouvelles notifications",
  "user-current-package": "Forfait en cours",
};

export default async function Gateway() {
  const g = await getGatewayInfo();
  if (!g) return <p className="text-muted">Informations indisponibles.</p>;
  const domain = g.config.wordpress_url_domain, path = g.config.wordpress_url_path;
  const switchJson = JSON.stringify({ api_config_version: "<version actuelle + 1>", wordpress_url_scheme: "https", wordpress_url_domain: domain, wordpress_url_path: path }, null, 2);
  const missing = g.calls.filter((c) => !c.implemented);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Passerelle Houzi</h1>
        <p className="text-sm text-muted">
          Même rôle que le plugin WordPress « Houzi API », mais avec les données du nouveau site. L’application reste branchée sur WordPress tant que vous ne basculez pas.
        </p>
      </div>

      <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold text-ink">Adresse de la passerelle</h2>
        <p className="mt-1 font-mono text-sm text-brand-800">https://{domain}{path}/wp-json/…</p>
        <h3 className="mt-4 text-sm font-semibold text-ink">Basculer l’application (le jour venu)</h3>
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>Vérifiez ci-dessous que les fonctions utilisées par l’application sont reprises (colonne « Reprise »).</li>
          <li>Dans WordPress → <strong>Houzi Api → Settings → App Config</strong>, remplacez ces quatre valeurs, puis enregistrez :</li>
        </ol>
        <pre className="mt-2 overflow-x-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">{switchJson}</pre>
        <p className="mt-2 text-sm text-slate-700">
          Au lancement suivant, chaque téléphone relit la configuration et parle à la nouvelle plateforme — aucune mise à jour sur les boutiques.
          Retour arrière : dans « Réglages », mettez le domaine <code>moboo.ci</code>, un chemin vide et une version de configuration supérieure — les téléphones repartent vers WordPress au lancement suivant.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <h2 className="border-b border-slate-100 px-4 py-3 font-semibold text-ink">Fonctions reprises ({g.implemented.length})</h2>
          <ul className="max-h-[480px] divide-y divide-slate-100 overflow-y-auto text-sm">
            {g.implemented.map((p) => {
              const short = p.split("/").pop()!;
              return (
                <li key={p} className="flex items-center justify-between gap-3 px-4 py-2">
                  <span className="text-ink">{LABELS[short] ?? short}</span>
                  <code className="truncate text-xs text-slate-500">{p}</code>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <h2 className="border-b border-slate-100 px-4 py-3 font-semibold text-ink">Appels reçus de l’application (30 jours)</h2>
          {g.calls.length ? (
            <div className="max-h-[480px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white text-left text-xs uppercase text-muted"><tr><th className="px-4 py-2">Route</th><th className="px-4 py-2 text-right">Appels</th><th className="px-4 py-2 text-right">Erreurs</th><th className="px-4 py-2">Reprise</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {g.calls.map((c) => (
                    <tr key={c.path}>
                      <td className="px-4 py-2"><code className="text-xs">{c.path}</code></td>
                      <td className="px-4 py-2 text-right">{c.hits.toLocaleString("fr-FR")}</td>
                      <td className="px-4 py-2 text-right">{c.errors}</td>
                      <td className="px-4 py-2">{c.implemented ? <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-800">✓ Oui</span> : <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-800">À faire</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="p-6 text-center text-sm text-muted">Aucun appel pour l’instant : l’application parle encore à WordPress.</p>}
          {missing.length ? <p className="border-t border-slate-100 px-4 py-3 text-xs text-amber-800">{missing.length} route(s) appelée(s) pas encore reprise(s) : elles répondent « fonction pas encore disponible ».</p> : null}
        </section>
      </div>
    </div>
  );
}
