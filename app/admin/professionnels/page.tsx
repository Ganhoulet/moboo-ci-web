import Link from "next/link";
import { PRO_PAGES } from "@/lib/pro-blocks";
import { getAdminPage } from "@/app/admin/accueil/actions";
import { authedFetch } from "@/lib/server-api";

export const dynamic = "force-dynamic";

/** Back-office → Espace professionnels : les 6 pages (constructeur) et les demandes de rappel. */
export default async function ProsAdmin() {
  const [pages, count] = await Promise.all([
    Promise.all(PRO_PAGES.map((p) => getAdminPage(p.slug))),
    authedFetch("/site/admin/pro-leads/count", { method: "GET" }).then((r) => (r.ok ? Number(r.data?.new) || 0 : 0)).catch(() => 0),
  ]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Espace professionnels</h1>
          <p className="max-w-3xl text-sm text-muted">Les pages « Moboo.ci pour les professionnels » (façon Zillow Partners) : elles montrent aux agents, agences, propriétaires, résidences et espaces comment profiter de la plateforme. Chaque page se compose de sections modifiables, avec brouillon, aperçu et publication, et son titre / sa description pour Google.</p>
        </div>
        <Link href="/admin/professionnels/demandes" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Demandes de rappel{count ? ` (${count} nouvelle${count > 1 ? "s" : ""})` : ""}</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PRO_PAGES.map((p, i) => {
          const a = pages[i];
          return (
            <div key={p.slug} className="flex flex-col rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="font-display text-lg font-bold text-ink">{p.label}</p>
              <a href={p.path} target="_blank" className="text-sm text-brand-700 hover:underline">moboo.ci{p.path} ↗</a>
              <p className="mt-2 flex-1 text-xs text-muted">
                {a?.publishedAt ? `Publiée le ${new Date(a.publishedAt).toLocaleDateString("fr-FR")}` : "Contenu par défaut (jamais modifié)"}
                {a?.dirty ? <span className="ml-1 font-semibold text-amber-700">· modifications non publiées</span> : null}
              </p>
              <Link href={`/admin/professionnels/${p.slug}`} className="mt-4 w-fit rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Modifier la page</Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
