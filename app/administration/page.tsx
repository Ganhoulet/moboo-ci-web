import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, displayName } from "@/lib/session";
import { LoginPanel } from "@/components/login-panel";
import { GOOGLE_CLIENT_ID } from "@/lib/google";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Espace administrateur", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const POINTS = [
  ["Page d’accueil et menus", "Constructeur par blocs, méga menu, pied de page."],
  ["Annonces et professionnels", "Modération, agences, forfaits et factures."],
  ["Connexion protégée", "Double authentification par application ou e-mail."],
];

/** Connexion au back-office : identifiant (ou téléphone / Google) puis 2e facteur. */
export default async function AdminLogin() {
  const account = getSession();
  if (account?.isAdmin) redirect("/admin");
  const { auth, branding } = await getSiteSettings();

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent-600/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">{branding.siteName}</p>
          <h1 className="mt-4 max-w-md font-display text-4xl font-extrabold leading-tight">Espace administrateur</h1>
          <p className="mt-4 max-w-md text-white/70">Pilotez tout le site depuis un seul endroit, en toute sécurité.</p>
        </div>
        <ul className="relative space-y-5">
          {POINTS.map(([t, d]) => (
            <li key={t} className="flex gap-4">
              <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10">✓</span>
              <span><span className="block font-semibold">{t}</span><span className="text-sm text-white/60">{d}</span></span>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-ink text-white lg:hidden">🔐</div>
          <h2 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">Connexion administrateur</h2>
          <p className="mt-2 text-muted">Connectez-vous avec votre compte administrateur. Un code de sécurité vous sera ensuite demandé.</p>

          {account ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              <p>Vous êtes connecté en tant que <strong>{displayName(account)}</strong>, qui n’est pas administrateur.</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link href="/compte/deconnexion?next=/administration" className="font-semibold underline">Changer de compte</Link>
                <Link href="/mon-espace" className="font-semibold underline">Retour à mon espace</Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
              <LoginPanel
                next="/admin"
                initialMode={auth.loginPassword ? "identifiant" : "telephone"}
                googleClientId={auth.loginGoogle ? GOOGLE_CLIENT_ID : undefined}
                methods={{ phone: auth.loginPhone, password: auth.loginPassword }}
              />
            </div>
          )}
          <p className="mt-6 flex items-center gap-2 text-xs text-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3 4 6v6c0 4.6 3.4 8.4 8 9 4.6-.6 8-4.4 8-9V6l-8-3Z" /></svg>
            Accès réservé. Les tentatives sont limitées et journalisées.
          </p>
          <Link href="/" className="mt-2 inline-block text-sm font-semibold text-brand-800 hover:underline">← Retour au site</Link>
        </div>
      </div>
    </div>
  );
}
