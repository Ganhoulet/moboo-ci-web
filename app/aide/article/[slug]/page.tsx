import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHelpArticle, helpPlain } from "@/lib/help";
import { HelpBody, helpHeadings, slugify } from "@/components/help/help-body";
import { HelpFeedback } from "@/components/help/help-feedback";
import { HelpContact } from "@/components/help/help-contact";
import { HelpSearch } from "@/components/help/help-search";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const a = await getHelpArticle(params.slug);
  if (!a) return { title: "Centre d’aide — Moboo.ci" };
  const desc = (a.summary || helpPlain(a.body)).slice(0, 160);
  return { title: `${a.title} — Aide Moboo.ci`, description: desc, alternates: { canonical: `/aide/article/${a.slug}` }, openGraph: { title: a.title, description: desc } };
}

/** Article du centre d'aide : guide pas à pas (sommaire, captures) ou réponse d'une question fréquente. */
export default async function HelpArticlePage({ params }: { params: { slug: string } }) {
  const a = await getHelpArticle(params.slug);
  if (!a) notFound();
  const toc = a.kind === "guide" ? helpHeadings(a.body) : [];
  const ld = a.kind === "faq"
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: a.title, acceptedAnswer: { "@type": "Answer", text: helpPlain(a.body) } }] }
    : { "@context": "https://schema.org", "@type": "HowTo", name: a.title, description: a.summary || helpPlain(a.body).slice(0, 200) };
  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-4">
          <nav className="text-sm text-muted">
            <Link href="/aide" className="hover:text-ink hover:underline">Centre d’aide</Link> <span className="mx-1">›</span>
            <Link href={`/aide/${a.audience}`} className="hover:text-ink hover:underline">{a.audienceTitle}</Link>
            {a.category ? <><span className="mx-1">›</span><span>{a.category}</span></> : null}
          </nav>
          <div className="w-full max-w-sm"><HelpSearch initial="" /></div>
        </div>
      </div>
      <div className="container-page grid gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="min-w-0 max-w-3xl">
          <p className="text-sm font-semibold text-accent-700">{a.kind === "faq" ? "Question fréquente" : "Guide"}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{a.title}</h1>
          {a.summary ? <p className="mt-3 text-lg text-slate-600">{a.summary}</p> : null}
          <p className="mt-2 text-xs text-muted">Mis à jour le {new Date(a.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
          <div className="mt-6"><HelpBody body={a.body} /></div>
          <HelpFeedback slug={a.slug} />
        </article>
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {toc.length > 1 ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Dans ce guide</p>
              <ul className="mt-2 space-y-1 border-l-2 border-slate-200 text-sm">
                {toc.map((h) => <li key={h}><a href={`#${slugify(h)}`} className="-ml-0.5 block border-l-2 border-transparent py-1 pl-3 text-slate-600 hover:border-brand-700 hover:text-ink">{h}</a></li>)}
              </ul>
            </div>
          ) : null}
          {a.related.length ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Guides liés</p>
              <ul className="mt-2 space-y-2">
                {a.related.map((r) => <li key={r.slug}><Link href={`/aide/article/${r.slug}`} className="block rounded-xl bg-white p-3 text-sm font-semibold text-ink ring-1 ring-slate-200 hover:ring-brand-300">{r.title}</Link></li>)}
              </ul>
            </div>
          ) : null}
          <Link href={`/aide/${a.audience}`} className="inline-block text-sm font-semibold text-brand-700 hover:underline">← Tous les guides « {a.audienceTitle} »</Link>
        </aside>
      </div>
      <div className="container-page pt-14"><HelpContact /></div>
    </div>
  );
}
