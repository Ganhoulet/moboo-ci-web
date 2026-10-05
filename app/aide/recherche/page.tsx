import type { Metadata } from "next";
import Link from "next/link";
import { searchHelp } from "@/lib/help";
import { HelpSearch } from "@/components/help/help-search";
import { HelpContact } from "@/components/help/help-contact";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recherche — Centre d’aide Moboo.ci", robots: { index: false } };

/** Résultats de recherche du centre d'aide. */
export default async function HelpSearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = String(searchParams.q ?? "").trim().slice(0, 120);
  const r = q ? await searchHelp(q) : { q, results: [] };
  return (
    <div className="pb-16">
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page py-8">
          <nav className="text-sm text-muted"><Link href="/aide" className="hover:text-ink hover:underline">Centre d’aide</Link> <span className="mx-1">›</span> Recherche</nav>
          <div className="mt-4 max-w-2xl"><HelpSearch initial={q} /></div>
        </div>
      </div>
      <div className="container-page max-w-3xl space-y-6 pt-8">
        {q ? <h1 className="font-display text-2xl font-extrabold text-ink">{r.results.length ? `${r.results.length} résultat${r.results.length > 1 ? "s" : ""} pour « ${q} »` : `Aucun résultat pour « ${q} »`}</h1> : null}
        {r.results.length ? (
          <ul className="space-y-3">
            {r.results.map((a) => (
              <li key={a.slug}>
                <Link href={`/aide/article/${a.slug}`} className="block rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 hover:ring-brand-300">
                  <span className="text-xs font-semibold text-accent-700">{a.kind === "faq" ? "Question fréquente" : "Guide"} · {a.audienceTitle}</span>
                  <span className="mt-1 block font-display text-lg font-bold text-ink">{a.title}</span>
                  {a.excerpt ? <span className="mt-1 block text-sm text-slate-600">{a.excerpt}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : q ? (
          <p className="rounded-2xl bg-white p-6 text-slate-600 shadow-card">Essayez avec d’autres mots (par exemple « publier », « acompte », « alerte »), ou parcourez les rubriques depuis l’<Link href="/aide" className="font-semibold text-brand-700 underline">accueil du centre d’aide</Link>. Votre recherche nous aide à compléter l’aide.</p>
        ) : null}
        <HelpContact />
      </div>
    </div>
  );
}
