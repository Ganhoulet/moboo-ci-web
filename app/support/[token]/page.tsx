import type { Metadata } from "next";
import { getSupportThread } from "./actions";
import { SupportChat } from "./support-chat";

export const metadata: Metadata = { title: "Assistance Moboo.ci", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Lien support envoyé par un account manager : le client décrit son problème et joint une capture, sans se connecter. */
export default async function SupportLinkPage({ params }: { params: { token: string } }) {
  const t = await getSupportThread(params.token);
  if (!t) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold text-ink">Lien invalide</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">Ce lien d’assistance n’existe pas ou n’est plus valable. Demandez un nouveau lien à votre conseiller Moboo.</p>
      </div>
    );
  }
  return (
    <div className="bg-slate-50 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl px-4">
        <SupportChat token={params.token} initial={t} />
      </div>
    </div>
  );
}
