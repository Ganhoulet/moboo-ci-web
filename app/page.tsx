import Link from "next/link";
import { getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";
import { getHomeData, getHomePage } from "@/lib/pages";
import { normalizeHome } from "@/lib/page-blocks";
import { HomeSection } from "@/components/home/sections";

export const dynamic = "force-dynamic";

/**
 * Page d'accueil composée dans le back-office (Apparence → Page d'accueil).
 * Administrateur : bouton « Modifier » sur chaque section et aperçu du brouillon (?apercu=1).
 */
export default async function HomePage({ searchParams }: { searchParams: { apercu?: string } }) {
  const account = getSession();
  const isAdmin = !!account?.isAdmin;
  const preview = isAdmin && searchParams.apercu === "1";
  let page = await getHomePage();
  if (preview) {
    const r = await authedFetch("/site/admin/pages/home", { method: "GET" });
    if (r.ok && r.data?.draft) page = normalizeHome(r.data.draft);
  }
  const data = await getHomeData();

  return (
    <div>
      {preview ? (
        <div className="sticky top-16 z-30 bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-amber-950">
          Aperçu du brouillon — non visible des visiteurs. <Link href="/admin/accueil" className="underline">Retour au constructeur</Link>
        </div>
      ) : null}
      {page.sections.map((s) => <HomeSection key={s.id} s={s} data={data} edit={isAdmin && !preview} />)}
      {isAdmin && !preview ? (
        <Link href="/admin/accueil" className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-2xl hover:bg-slate-800 print:hidden">
          ✎ Personnaliser la page d’accueil
        </Link>
      ) : null}
    </div>
  );
}
