import Link from "next/link";
import { getInvitation } from "./actions";
import { ActivateForm } from "./activate-form";
import { ProStoreButtons } from "./store-buttons";
import { SiteIcon } from "@/components/site-icon";

const LABELS: Record<string, [string, string]> = {
  locataire: ["Espace locataire", "votre bail, vos loyers et vos états des lieux"],
  proprietaire: ["Espace propriétaire", "vos biens, vos reversements et vos états des lieux"],
  rattachement: ["Espace locataire", "votre nouveau logement, votre bail et vos loyers"],
};

/** Page d'invitation Moboo Pro (ex-page WordPress) : le destinataire crée son mot de passe. */
export async function InvitationPage({ token }: { token: string }) {
  const inv = await getInvitation(token);
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-card ring-1 ring-slate-200">
        {!inv ? (
          <div className="text-center">
            <p className="text-4xl" aria-hidden="true"><SiteIcon value="⚠" size={16} className="mr-1 inline-block align-[-3px]" /></p>
            <h1 className="mt-3 font-display text-xl font-extrabold text-ink">Invitation introuvable</h1>
            <p className="mt-2 text-sm text-muted">Ce lien est invalide ou a déjà été utilisé. Contactez la personne qui vous a invité.</p>
            <Link href="/" className="mt-5 inline-block text-sm font-semibold text-brand-800 underline">Retour à l’accueil</Link>
          </div>
        ) : (
          <>
            <h1 className="text-center font-display text-xl font-extrabold text-ink">Bonjour {inv.prenom}</h1>
            <p className="mt-2 text-center text-sm text-muted">
              Vous êtes invité(e) à rejoindre votre <strong>{(LABELS[inv.type] ?? LABELS.locataire)[0]}</strong> sur Moboo Pro — suivez {(LABELS[inv.type] ?? LABELS.locataire)[1]}.
            </p>
            <div className="mt-5 space-y-1 rounded-xl bg-slate-50 p-4 text-sm">
              {inv.prenom || inv.nom ? <p>Nom : <strong className="text-brand-900">{[inv.prenom, inv.nom].filter(Boolean).join(" ")}</strong></p> : null}
              {inv.email ? <p>E-mail : <strong className="text-brand-900">{inv.email}</strong></p> : null}
              {inv.bien ? <p>Bien : <strong className="text-brand-900">{inv.bien}</strong></p> : null}
            </div>
            <ActivateForm token={token} pending={inv.pending} login={inv.email} />
          </>
        )}
        <ProStoreButtons />
        <p className="mt-6 text-center text-xs text-muted">Besoin d’aide ? WhatsApp : +225 07 89 31 13 23</p>
      </div>
    </div>
  );
}
