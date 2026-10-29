import Link from "next/link";
import { getAdminSettings } from "../../actions";
import { getGrowth } from "./actions";
import { GrowthStudio } from "@/components/backoffice/growth-studio";

export const dynamic = "force-dynamic";

/** Studio de publication : publier pour un agent les biens reçus par WhatsApp. */
export default async function StudioPage({ searchParams }: { searchParams: { agent?: string } }) {
  const [agents, settings] = await Promise.all([getGrowth<any>("/agents?scope=mine"), getAdminSettings()]);
  const g = (settings?.values?.growth ?? {}) as Record<string, unknown>;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Studio de publication</h1>
          <p className="max-w-3xl text-sm text-muted">Publiez pour un agent ou une agence les biens qu’il vous envoie sur WhatsApp : collez le message, ajoutez les photos, l’IA remplit la fiche. L’annonce est en ligne à son nom, les clients l’appellent directement.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/comptes/studio/annonces" className="rounded-md bg-white px-3 py-1.5 font-semibold ring-1 ring-slate-300">Annonces publiées</Link>
          <Link href="/admin/comptes/studio/reglages" className="rounded-md bg-white px-3 py-1.5 font-semibold ring-1 ring-slate-300">Réglages</Link>
        </div>
      </div>
      {g.enabled === false ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Le Studio est désactivé dans les réglages.</p> : null}
      <GrowthStudio initialAgents={agents?.items ?? []} mode={agents?.mode ?? "link_or_declared"} allowUnclaimed={agents?.allowUnclaimed !== false} preselect={searchParams.agent ?? null} />
    </div>
  );
}
