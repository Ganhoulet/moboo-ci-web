import { getAssist } from "@/lib/assist";
import { endAssistAction } from "@/app/assist-actions";
import { AssistCountdown } from "./assist-countdown";
import { SiteIcon } from "@/components/site-icon";

/** Bandeau permanent pendant un accès assisté : pour qui, jusqu'à quand, « Terminer ». */
export function AssistBanner() {
  const a = getAssist();
  if (!a) return null;
  return (
    <div className="sticky top-0 z-[60] bg-red-700 text-white shadow-lg print:hidden" role="alert" data-assist-banner>
      <div className="container-page flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm">
        <span className="font-bold"><SiteIcon value="🛟" size={16} className="mr-1 inline-block align-[-3px]" />Accès assisté : vous agissez pour {a.name}</span>
        <span className="text-white/85">Paiements, mot de passe, numéro et suppression du compte sont bloqués. Chaque modification est notée.</span>
        <AssistCountdown endsAt={a.endsAt} />
        <form action={endAssistAction} className="ml-auto">
          <button className="rounded-full bg-white px-4 py-1 font-bold text-red-700 hover:bg-red-50">Terminer</button>
        </form>
      </div>
    </div>
  );
}
