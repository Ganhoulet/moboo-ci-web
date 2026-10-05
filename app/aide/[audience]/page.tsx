import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHelpAudience, helpPlain } from "@/lib/help";
import { HelpSearch } from "@/components/help/help-search";
import { HelpIcon } from "@/components/help/help-icon";
import { HelpContact } from "@/components/help/help-contact";
import { FaqList } from "@/components/help/faq-list";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { audience: string } }): Promise<Metadata> {
  const d = await getHelpAudience(params.audience);
  if (!d) return { title: "Centre d’aide — Moboo.ci" };
  return { title: `${d.audience.title} — Centre d’aide Moboo.ci`, description: d.audience.description, alternates: { canonical: `/aide/${d.audience.key}` } };
}

/** Rubrique d'un public : guides par thème, questions fréquentes, autres publics. */
export default async function HelpAudiencePage({ params }: { params: { audience: string } }) {
  const d = await getHelpAudience(params.audience);
  if (!d) notFound();
  const faqLd = d.faqs.length ? {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: d.faqs.map((f) => ({ "@type": "Question", name: f.title, acceptedAnswer: { "@type": "Answer", text: helpPlain(f.body ?? "") } })),
  } : null;
  return (
    <div className="pb-16">
      {faqLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }} /> : null}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-8">
          <nav className="text-sm text-muted"><Link href="/aide" className="hover:text-ink hover:underline">Centre d’aide</Link> <span className="mx-1">›</span> <span className="text-ink">{d.audience.title}</span></nav>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-6">
            <div className="flex max-w-2xl items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-800 text-white"><HelpIcon name={d.audience.icon} size={30} /></span>
              <div>
                <h1 className="font-display text-3xl font-extrabold text-ink">{d.audience.title}</h1>
                <p className="mt-1 text-muted">{d.audience.description}</p>
              </div>
            </div>
            <div className="w-full max-w-md"><HelpSearch /></div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-10 pt-10 lg:grid-cols-[1fr_260px]">
        <div className="space-y-12">
          {d.sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-display text-xl font-bold text-ink">{s.title}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {s.guides.map((g) => (
                  <Link key={g.slug} href={`/aide/article/${g.slug}`} className="group rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 transition hover:ring-brand-300">
                    <span className="block font-semibold text-ink group-hover:text-brand-800">{g.title}</span>
                    <span className="mt-1 block text-sm text-muted">{g.summary}</span>
                    <span className="mt-3 inline-block text-xs font-semibold text-brand-700">Lire le guide →</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
          {d.faqs.length ? (
            <section>
              <h2 className="font-display text-xl font-bold text-ink">Questions fréquentes</h2>
              <div className="mt-4"><FaqList items={d.faqs} /></div>
            </section>
          ) : null}
        </div>
        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Autres profils</p>
          <nav className="space-y-1">
            {d.others.map((o) => (
              <Link key={o.key} href={`/aide/${o.key}`} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-ink">
                <span className="text-slate-400"><HelpIcon name={o.icon} size={18} /></span>{o.title}
              </Link>
            ))}
          </nav>
        </aside>
      </div>
      <div className="container-page pt-14"><HelpContact /></div>
    </div>
  );
}
