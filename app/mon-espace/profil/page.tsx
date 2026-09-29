import Link from "next/link";
import { getSession } from "@/lib/session";
import { accountLabel, isPublisher } from "@/lib/accounts";
import { PageHeader } from "@/components/dashboard-ui";
import { ProfileForm } from "@/components/profile-form";

export default function Profil() {
  const a = getSession()!;
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Mon profil"
        sub={accountLabel(a)}
        action={<Link href="/inscription?profil=modifier" className="btn-ghost text-sm">Changer de type de compte</Link>}
      />
      <ProfileForm account={a} publicProfile={isPublisher(a.accountType)} />
    </div>
  );
}
