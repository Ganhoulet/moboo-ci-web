import { AssistantPanel } from "@/components/stays/admin-assistant";
import { getAssistant } from "../actions";

export const dynamic = "force-dynamic";

/** Back-office → Séjours → Assistant WhatsApp. */
export default async function AdminStaysAssistant() {
  const s = await getAssistant();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Assistant WhatsApp des séjours</h1>
        <p className="max-w-3xl text-sm text-muted">Quand un voyageur écrit sur le WhatsApp Business de Moboo, l’assistant répond à partir des vraies résidences : quartier, repère, budget, prix, logements libres ce soir quand le calendrier est suivi. Il envoie le lien de la fiche pour réserver, et passe la main à l’équipe pour tout le reste (litige, remboursement, demande d’un conseiller). Commencez en mode test avec vos propres numéros.</p>
      </div>
      {s ? <AssistantPanel initial={s} /> : <p className="rounded-lg bg-white p-6 text-muted ring-1 ring-slate-200">Chargement impossible (droits « Pages SEO » requis).</p>}
    </div>
  );
}
