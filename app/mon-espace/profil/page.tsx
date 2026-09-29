import Link from "next/link";
import { getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";
import { accountLabel, isPublisher } from "@/lib/accounts";
import type { SiteAccount } from "@/lib/api";
import { PageHeader } from "@/components/dashboard-ui";
import { ProfileForm } from "@/components/profile-form";
import { SecuritySettings } from "@/components/security-settings";
import { GOOGLE_CLIENT_ID } from "@/lib/google";
import { getSiteSettings, roleNames } from "@/lib/settings";

export default async function Profil() {
  // Profil à jour (mot de passe / Google reliés depuis un autre appareil).
  const me = await authedFetch("/site/auth/me", { method: "GET" });
  const a: SiteAccount = me.ok ? me.data : getSession()!;
  const settings = await getSiteSettings();
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
    </div>
  );
}
