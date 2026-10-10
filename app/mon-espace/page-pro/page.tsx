import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";
import { canAccess } from "@/lib/accounts";
import { PageHeader } from "@/components/dashboard-ui";
import { ProPageEditor } from "@/components/pro-page/pro-page-editor";

export const metadata: Metadata = { title: "Ma page pro", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Mon espace → Ma page pro : informations façon Zillow, photos et vidéos de présentation. */
export default async function ProPageSettings() {
  const account = getSession()!;
  if (!canAccess(account.accountType, "pagepro")) redirect("/mon-espace");
  const r = await authedFetch("/site/me/pro-profile", { method: "GET" });
  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Ma page pro"
        sub="Votre vitrine publique sur Moboo.ci : présentez-vous en vidéo, montrez votre agence, indiquez votre référence, vos langues et vos spécialités. Votre photo, votre bio et vos réseaux se règlent dans « Mon profil »."
      />
      {r.ok ? <ProPageEditor initial={r.data} /> : <p className="rounded-xl bg-white p-6 text-sm text-red-600 shadow-card">Page pro indisponible.</p>}
    </div>
  );
}
