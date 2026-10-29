import Link from "next/link";
import { getQuickLinks } from "../studio/actions";
import { QuickLinksManager } from "@/components/backoffice/quick-links-manager";

export const dynamic = "force-dynamic";

/** Liens de publication rapide : à partager dans les groupes WhatsApp d'agents. */
export default async function QuickLinksPage() {
  const links = await getQuickLinks<any[]>();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Liens de publication rapide</h1>
          <p className="max-w-3xl text-sm text-muted">Un lien par groupe WhatsApp ou campagne. L’agent ouvre le lien, publie son bien en moins d’une minute depuis son téléphone et crée son compte au moment de publier. Les agents arrivés par votre lien entrent dans votre portefeuille.</p>
        </div>
        <Link href="/admin/comptes/liens-rapides/reglages" className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-slate-300">Réglages</Link>
      </div>
      {links ? <QuickLinksManager links={links} /> : <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Liste indisponible.</p>}
    </div>
  );
}
