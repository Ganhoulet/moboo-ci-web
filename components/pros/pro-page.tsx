import Link from "next/link";
import { getSession } from "@/lib/session";
import { getProPage, getProStats } from "@/lib/pros";
import { proPage, type ProSlug } from "@/lib/pro-blocks";
import { ProSection } from "./pro-sections";

/** Page de l'espace professionnels (publiée, ou brouillon en aperçu pour l'administrateur). */
export async function ProPage({ slug, preview }: { slug: ProSlug; preview: boolean }) {
  const isAdmin = !!getSession()?.isAdmin;
  const draft = isAdmin && preview;
  const [page, stats] = await Promise.all([getProPage(slug, draft), getProStats()]);
  const faqs = page.sections.filter((s) => s.enabled && s.type === "proFaq").flatMap((s) => s.props.items ?? []);
  const ld = faqs.length ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f: any) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) } : null;
  return (
    <div>
      {ld ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} /> : null}
      {draft ? (
        <div className="sticky top-16 z-30 bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-amber-950">
          Aperçu du brouillon — non visible des visiteurs. <Link href={`/admin/professionnels/${slug}`} className="underline">Retour au constructeur</Link>
        </div>
      ) : null}
      {page.sections.filter((s) => s.enabled).map((s) => <ProSection key={s.id} s={s} stats={stats} slug={slug} />)}
      {isAdmin && !draft ? (
        <Link href={`/admin/professionnels/${slug}`} className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-2xl hover:bg-slate-800 print:hidden">
          ✎ Modifier « {proPage(slug)?.label} »
        </Link>
      ) : null}
    </div>
  );
}
