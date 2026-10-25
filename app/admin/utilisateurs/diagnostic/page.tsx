import { authedFetch } from "@/lib/server-api";
import { LoginTest } from "@/components/backoffice/login-test";

export const dynamic = "force-dynamic";

type Diagnose = {
  error?: string; identifier: string; cause: string; wordpressRemoteLogin: string; linkedLegacy: number;
  account: null | { id: string; foundBy: string; phone: string; email: string | null; username: string | null; active: boolean; hasPassword: boolean; twoFactor: boolean; createdAt: string };
  legacy: { login: string; email: string | null; phone: string | null; status: string; passwordFormat: string | null; linkedToThisAccount: boolean; linkedElsewhere: boolean }[];
};

const yes = (b: boolean) => (b ? "oui" : "non");

/** Utilisateurs → Diagnostic de connexion : pourquoi l'application répond « mot de passe incorrect ». */
export default async function LoginDiagnose({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const r = q ? await authedFetch(`/site/admin/login-diagnose?identifier=${encodeURIComponent(q)}`, { method: "GET" }) : null;
  const d = r?.ok ? (r.data as Diagnose) : null;
  // Dernières tentatives de connexion reçues de l'application (passerelle), sans mot de passe.
  const log = await authedFetch("/site/admin/mobile/signin-log", { method: "GET" }).then((x) => (x.ok ? ((x.data as any)?.items ?? []) : [])).catch(() => []) as { at: string; who: string; via: string; ok: boolean; status: number; code: string; message: string; ms: number; passwordLength: number }[];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Diagnostic de connexion</h1>
        <p className="max-w-3xl text-sm text-muted">
          Saisissez l’identifiant utilisé dans l’application (e-mail, numéro ou nom d’utilisateur) : la cause probable de « mot de passe incorrect » s’affiche.
          Aucun mot de passe n’est montré.
        </p>
      </div>
      <form className="flex max-w-xl gap-2">
        <input name="q" defaultValue={q} placeholder="ex. nom@exemple.com, 0707070707 ou identifiant" className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button className="rounded-md bg-brand-800 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900">Vérifier</button>
      </form>
      <LoginTest initialIdentifier={q} />
      <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
        <h2 className="font-semibold text-ink">Dernières tentatives de connexion depuis l’application</h2>
        <p className="text-xs text-muted">Reçues par la nouvelle plateforme (directement ou par le relais moboo.ci). Rechargez la page après un essai sur le téléphone. Aucun mot de passe n’est enregistré.</p>
        {log.length ? (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-1 pr-3">Heure</th><th className="pr-3">Identifiant</th><th className="pr-3">Résultat</th><th className="pr-3">Réponse envoyée à l’application</th><th className="pr-3">Mot de passe</th><th>Durée</th></tr></thead>
              <tbody>
                {log.map((x, i) => (
                  <tr key={i} className="border-t border-slate-100 align-top">
                    <td className="py-1 pr-3 whitespace-nowrap">{new Date(x.at).toLocaleTimeString("fr-FR")}</td>
                    <td className="pr-3">{x.who}</td>
                    <td className={"pr-3 font-semibold " + (x.ok ? "text-emerald-700" : "text-red-700")}>{x.ok ? "Accepté" : `Refusé (${x.status}, ${x.code})`}</td>
                    <td className="pr-3">{x.message}</td>
                    <td className="pr-3">{x.passwordLength} caractères</td>
                    <td>{x.ms} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="mt-2 text-sm text-muted">Aucune tentative reçue depuis le dernier redémarrage du serveur.</p>}
      </section>
      {q && !d ? <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">Diagnostic indisponible.</p> : null}
      {d?.error ? <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">{d.error}</p> : null}
      {d && !d.error ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-brand-50 p-4 ring-1 ring-brand-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">Cause probable</p>
            <p className="mt-1 text-sm font-medium text-ink">{d.cause}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
              <h2 className="font-semibold text-ink">Compte du nouveau site</h2>
              {d.account ? (
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                  <dt className="text-muted">Trouvé par</dt><dd>{d.account.foundBy}</dd>
                  <dt className="text-muted">Téléphone</dt><dd>{d.account.phone}</dd>
                  <dt className="text-muted">E-mail</dt><dd>{d.account.email ?? "—"}</dd>
                  <dt className="text-muted">Identifiant</dt><dd>{d.account.username ?? "—"}</dd>
                  <dt className="text-muted">Actif</dt><dd>{yes(d.account.active)}</dd>
                  <dt className="text-muted">A un mot de passe</dt><dd>{yes(d.account.hasPassword)}</dd>
                  <dt className="text-muted">Double authentification</dt><dd>{yes(d.account.twoFactor)}</dd>
                  <dt className="text-muted">Créé le</dt><dd>{new Date(d.account.createdAt).toLocaleDateString("fr-FR")}</dd>
                </dl>
              ) : <p className="mt-2 text-sm text-muted">Aucun compte avec cet identifiant.</p>}
              {d.account ? <a href={`/admin/utilisateurs/${d.account.id}`} className="mt-3 inline-block text-sm font-semibold text-brand-800 hover:underline">Ouvrir la fiche →</a> : null}
            </section>
            <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
              <h2 className="font-semibold text-ink">Ancien compte moboo.ci (WordPress repris)</h2>
              {d.legacy.length ? d.legacy.map((w) => (
                <dl key={w.login} className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-slate-100 pt-2 text-sm first:border-0 first:pt-0">
                  <dt className="text-muted">Identifiant</dt><dd>{w.login}</dd>
                  <dt className="text-muted">E-mail / téléphone</dt><dd>{w.email ?? "—"} · {w.phone ?? "—"}</dd>
                  <dt className="text-muted">Mot de passe repris</dt><dd>{w.passwordFormat ?? "non"}</dd>
                  <dt className="text-muted">Relié à ce compte</dt><dd>{yes(w.linkedToThisAccount)}{w.linkedElsewhere ? " (relié à un autre compte)" : ""}</dd>
                </dl>
              )) : <p className="mt-2 text-sm text-muted">Aucun ancien compte moboo.ci trouvé.</p>}
              <p className="mt-3 text-xs text-muted">Vérification par l’ancien WordPress : {d.wordpressRemoteLogin}</p>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
