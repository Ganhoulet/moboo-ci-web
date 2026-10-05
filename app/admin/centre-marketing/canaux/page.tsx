import { ChannelsSettings } from "@/components/backoffice/channels-settings";
import { getMessaging } from "./actions";

export const dynamic = "force-dynamic";

/** Centre marketing → Canaux d'envoi : SMS (fournisseurs), WhatsApp Business, e-mail. */
export default async function Channels() {
  const d = await getMessaging();
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Canaux d’envoi indisponibles (permission « Réglages du site » requise).</p>;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Canaux d’envoi</h1>
        <p className="max-w-3xl text-sm text-muted">Branchez ici les services qui envoient les relances et les campagnes : <strong>SMS</strong> (Orange, Twilio, Infobip ou votre fournisseur local) et <strong>WhatsApp Business</strong>. Les clés sont chiffrées et ne sont plus jamais affichées après enregistrement.</p>
      </div>
      <ChannelsSettings initial={d} />
    </div>
  );
}
