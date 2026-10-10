import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";
import { canAccess } from "@/lib/accounts";
import { PageHeader } from "@/components/dashboard-ui";
import { TeamManager } from "@/components/pro-page/team-manager";

export const metadata: Metadata = { title: "Mon équipe", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Mon espace → Mon équipe (agences) : agents et agents commerciaux de l'agence. */
export default async function Equipe() {
  const account = getSession()!;
  if (!canAccess(account.accountType, "equipe")) redirect("/mon-espace");
  const r = await authedFetch("/site/me/team", { method: "GET" });
  return (
    <div className="max-w-4xl">
      <PageHeader title="Mon équipe" sub="Ajoutez les agents de votre agence. Un agent qui a un compte Moboo est relié à sa page (« Membre de votre agence ») ; vous pouvez aussi ajouter des membres sans compte, comme vos agents commerciaux. L’équipe s’affiche sur votre page publique et dans l’application." />
      {r.ok ? <TeamManager initial={r.data.members} /> : <p className="rounded-xl bg-white p-6 text-sm text-red-600 shadow-card">Équipe indisponible.</p>}
    </div>
  );
}
