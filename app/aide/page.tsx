import type { Metadata } from "next";
import Link from "next/link";
import { getHelpHome } from "@/lib/help";
import { HelpSearch } from "@/components/help/help-search";
import { HelpIcon } from "@/components/help/help-icon";
import { HelpContact } from "@/components/help/help-contact";
import { FaqList } from "@/components/help/faq-list";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Centre d’aide — Moboo.ci",
  description: "Toutes les réponses pour louer, acheter, réserver un meublé ou un espace, publier vos biens et utiliser Moboo.ci : guides pas à pas et questions fréquentes.",
  alternates: { canonical: "/aide" },
};

/** Centre d'aide (façon Airbnb / Booking) : recherche, publics, guides populaires, FAQ, contact. */
export default async function HelpHome() {
  const d = await getHelpHome();
  return (
    <div className="pb-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-800 to-brand-900 text-white">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent-500/25 blur-3xl" />
        <div className="container-page relative py-14 text-center sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/70">Centre d’aide</p>
          <h1 className="mx-auto mt-2 max-w-2xl font-display text-3xl font-extrabold sm:text-5xl">Comment pouvons-nous vous aider ?</h1>
          <div className="mx-auto mt-8 max-w-2xl"><HelpSearch big /></div>
        </div>
      </section>

      <div className="container-page space-y-14 pt-10">
        <section>
          <h2 className="font-display text-2xl font-extrabold text-ink">Choisissez votre profil</h2>
          <p className="mt-1 text-muted">Des guides adaptés à ce que vous faites sur Moboo.ci.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(d?.audiences ?? []).map((a) => (
              <Link key={a.key} href={`/aide/${a.key}`} className="group flex gap-4 rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-brand-200">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-800 transition group-hover:bg-brand-800 group-hover:text-white"><HelpIcon name={a.icon} /></span>
                <span className="min-w-0">
                  <span className="block font-display text-lg font-bold text-ink">{a.title}</span>
                  <span className="block text-sm text-muted">{a.short}</span>
                  <span className="mt-2 block text-xs font-semibold text-brand-700">{a.guides} guide{a.guides === 1 ? "" : "s"} · {a.faqs} question{a.faqs === 1 ? "" : "s"}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {d?.popular.length ? (
          <section>
            <h2 className="font-display text-2xl font-extrabold text-ink">Guides les plus consultés</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {d.popular.map((a) => (
                <Link key={a.slug} href={`/aide/article/${a.slug}`} className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 transition hover:ring-brand-300">
                  <span className="mt-0.5 text-brand-700">📘</span>
                  <span><span className="block font-semibold text-ink">{a.title}</span><span className="block text-sm text-muted">{a.summary}</span></span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {d?.faqs.length ? (
          <section>
            <h2 className="font-display text-2xl font-extrabold text-ink">Questions fréquentes</h2>
            <div className="mt-6"><FaqList items={d.faqs} /></div>
          </section>
        ) : null}

        {!d ? <p className="rounded-2xl bg-white p-8 text-center text-muted shadow-card">Le centre d’aide est momentanément indisponible. Réessayez dans quelques instants.</p> : null}

        <HelpContact />
      </div>
    </div>
  );
}
