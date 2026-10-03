import Link from "next/link";
import { getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";
import { accountLabel, isPublisher } from "@/lib/accounts";
import type { SiteAccount } from "@/lib/api";
import { PageHeader } from "@/components/dashboard-ui";
import { ProfileForm } from "@/components/profile-form";
import { SecuritySettings } from "@/components/security-settings";
import { TwoFactorSettings } from "@/components/two-factor-settings";
import { GOOGLE_CLIENT_ID } from "@/lib/google";
import { getSiteSettings, roleNames } from "@/lib/settings";

export default async function Profil() {
  // Profil à jour (mot de passe / Google reliés depuis un autre appareil).
  const me = await authedFetch("/site/auth/me", { method: "GET" });
  const a: SiteAccount = me.ok ? me.data : getSession()!;
  const settings = await getSiteSettings();
  const tf = await authedFetch("/site/auth/2fa", { method: "GET" });
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Mon profil"
        sub={accountLabel(a, roleNames(settings))}
        action={<Link href="/inscription?profil=modifier" className="btn-ghost text-sm">{settings.auth.profileRoleChange ? "Changer de type de compte" : "Modifier mon activité"}</Link>}
      />
      <ProfileForm account={a} publicProfile={isPublisher(a.accountType)} />
      <SecuritySettings
        hasPassword={!!a.hasPassword}
        googleLinked={!!a.googleLinked}
        username={a.username ?? null}
        email={a.email}
        phone={a.phone}
        googleClientId={GOOGLE_CLIENT_ID}
      />
      {tf.ok ? <div id="2fa"><TwoFactorSettings initial={tf.data} /></div> : null}
      <section className="mt-8 rounded-2xl border border-red-100 bg-red-50/40 p-5">
        <h2 className="font-display text-base font-bold text-ink">Supprimer mon compte</h2>
        <p className="mt-1 text-sm text-muted">Votre compte, vos annonces et vos données personnelles seront supprimés. Vous pourrez annuler pendant {settings.legal.deletionGraceDays} jours.</p>
        <Link href="/suppression-compte" className="mt-3 inline-flex rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Supprimer mon compte…</Link>
      </section>
    </div>
  );
}
