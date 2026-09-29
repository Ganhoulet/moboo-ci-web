import type { Metadata } from "next";
import Link from "next/link";
import { getPendingTwoFactor } from "@/lib/two-factor";
import { TwoFactorForm } from "@/components/two-factor-form";

export const metadata: Metadata = { title: "Vérification en deux étapes", robots: { index: false } };
export const dynamic = "force-dynamic";

/** 2e étape de la connexion (double authentification). */
export default function TwoFactorPage() {
  const p = getPendingTwoFactor();
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-md">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-ink text-white">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3 4 6v6c0 4.6 3.4 8.4 8 9 4.6-.6 8-4.4 8-9V6l-8-3Z" strokeLinejoin="round" /><path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h1 className="text-center font-display text-2xl font-extrabold text-ink">Vérification en deux étapes</h1>
        <p className="mt-2 text-center text-muted">Votre compte est protégé : confirmez qu’il s’agit bien de vous.</p>
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-card">
          {p ? (
            <TwoFactorForm methods={p.methods} preferred={p.preferred} email={p.email} emailSent={p.emailSent} />
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted">La vérification a expiré (10 minutes). Reconnectez-vous.</p>
              <Link href="/compte" className="btn-primary mt-4 inline-flex bg-ink hover:bg-black">Se connecter</Link>
            </div>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-muted">Téléphone perdu ? Utilisez un code de secours, ou demandez à un administrateur de réinitialiser votre double authentification.</p>
      </div>
    </div>
  );
}
