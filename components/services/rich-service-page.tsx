import Link from "next/link";
import { SiteIcon } from "@/components/site-icon";
import { ServiceTabs } from "./service-tabs";
import { serviceHref, type ServicePage, type ServiceTile } from "@/lib/site-services";

const wa = (p: string) => `https://wa.me/${p.replace(/\D/g, "")}`;
const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, "")}`;

/* eslint-disable @next/next/no-img-element -- photos réglées au back-office (tout hébergeur https) */

/**
 * Page détaillée d'un service Moboo (nettoyage, conciergerie, état des lieux…) :
 * grande photo, points forts, onglets, étapes, formules, galerie, formulaire et
 * questions fréquentes. Tout le contenu vient du back-office (Services Moboo ›
 * Pages des services) ; une rubrique vide n'est pas affichée.
 */
export function RichServicePage({ tile, page: p, others, form }: { tile: ServiceTile; page: ServicePage; others: ServiceTile[]; form: React.ReactNode }) {
  const title = tile.landingTitle || tile.title;
  const cta = p.cta || "Commander";
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Service", name: tile.title, description: tile.landingIntro, areaServed: "Côte d’Ivoire", provider: { "@type": "Organization", name: "Moboo.ci", url: "https://moboo.ci" }, ...(p.heroImage ? { image: p.heroImage } : {}) },
      ...(p.faq.length ? [{ "@type": "FAQPage", mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }] : []),
    ],
  };
  return (
    <div className="bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />

      {/* Couverture */}
      <section className="relative isolate overflow-hidden bg-brand-900 text-white">
        {p.heroImage ? <img src={p.heroImage} alt={p.heroAlt || tile.title} className="absolute inset-0 -z-10 h-full w-full object-cover" fetchPriority="high" /> : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0b1640]/95 via-brand-900/80 to-brand-900/20" aria-hidden />
        <div className="container-page py-14 sm:py-20 lg:py-28">
          <nav className="text-xs text-white/70"><Link href="/" className="hover:underline">Accueil</Link> › <span>Services</span> › <span className="text-white">{tile.title}</span></nav>
          <div className="mt-6 max-w-2xl">
            {p.badge ? <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur"><span className="h-2 w-2 rounded-full bg-accent-400" aria-hidden />{p.badge}</p> : null}
            <h1 className="mt-4 font-display text-4xl font-black leading-[1.05] sm:text-5xl lg:text-6xl">{title}</h1>
            {tile.landingIntro ? <p className="mt-5 text-lg leading-relaxed text-white/90">{tile.landingIntro}</p> : null}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#reserver" className="rounded-full bg-accent-600 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-accent-700/30 hover:bg-accent-700">{cta}</a>
              {p.contactWhatsapp ? <a href={wa(p.contactWhatsapp)} target="_blank" rel="noreferrer" className="rounded-full bg-white/15 px-6 py-3.5 text-base font-bold text-white ring-1 ring-white/40 backdrop-blur hover:bg-white/25">WhatsApp</a> : null}
              {tile.price ? <span className="text-sm font-semibold text-white/85">{tile.price}</span> : null}
            </div>
          </div>
        </div>
      </section>

      {/* Points forts */}
      {p.highlights.length ? (
        <section className="container-page relative z-10 -mt-10 sm:-mt-12">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {p.highlights.map((h) => (
              <div key={h.title} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-800"><SiteIcon value={h.icon} fallback="etoile" size={22} /></span>
                <p className="mt-3 font-display font-bold text-ink">{h.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{h.text}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Onglets */}
      {p.tabs.length ? (
        <section className="container-page py-14 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">{p.tabsTitle || "Nos prestations"}</h2>
            {p.tabsIntro ? <p className="mt-3 text-lg text-slate-600">{p.tabsIntro}</p> : null}
          </div>
          <div className="mt-8"><ServiceTabs tabs={p.tabs} /></div>
        </section>
      ) : null}

      {/* Étapes */}
      {p.steps.length ? (
        <section className="bg-white py-14 sm:py-20">
          <div className="container-page">
            <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">{p.stepsTitle || "Comment ça marche"}</h2>
            <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {p.steps.map((st, k) => (
                <li key={st.title} className="relative">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink font-display text-lg font-black text-white">{k + 1}</span>
                    {k < p.steps.length - 1 ? <span className="hidden h-px flex-1 bg-slate-200 lg:block" aria-hidden /> : null}
                  </div>
                  <p className="mt-4 font-display text-lg font-bold text-ink">{st.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{st.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Formules */}
      {p.offers.length ? (
        <section className="container-page py-14 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">{p.offersTitle || "Tarifs"}</h2>
            {p.offersIntro ? <p className="mt-3 text-slate-600">{p.offersIntro}</p> : null}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {p.offers.map((o) => (
              <div key={o.name} className={"relative flex flex-col rounded-3xl p-7 " + (o.featured ? "bg-ink text-white shadow-xl ring-2 ring-accent-500" : "bg-white text-ink ring-1 ring-slate-200")}>
                {o.featured ? <span className="absolute -top-3 left-7 rounded-full bg-accent-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Le plus choisi</span> : null}
                <p className={"font-display text-lg font-bold " + (o.featured ? "text-white" : "text-ink")}>{o.name}</p>
                <p className="mt-3"><span className="font-display text-4xl font-black">{o.price}</span>{o.period ? <span className={"ml-1 text-sm " + (o.featured ? "text-white/70" : "text-muted")}>{o.period}</span> : null}</p>
                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {o.items.map((it) => <li key={it} className="flex gap-2"><span aria-hidden className={o.featured ? "text-accent-400" : "text-emerald-600"}>✓</span>{it}</li>)}
                </ul>
                <a href="#reserver" className={"mt-6 rounded-full px-5 py-3 text-center text-sm font-bold " + (o.featured ? "bg-accent-600 text-white hover:bg-accent-700" : "bg-slate-100 text-ink hover:bg-slate-200")}>{cta}</a>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Galerie */}
      {p.gallery.length ? (
        <section className="container-page pb-14 sm:pb-20">
          <div className="grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[220px] md:grid-cols-4">
            {p.gallery.slice(0, 9).map((src, k, all) => (
              <div key={src} className={"overflow-hidden rounded-2xl bg-slate-200 " + (k === 0 && all.length % 2 === 1 && all.length > 2 ? "col-span-2 row-span-2" : "")}>
                <img src={src} alt={`${tile.title} — photo ${k + 1}`} loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Formulaire */}
      <section id="reserver" className="scroll-mt-20 bg-gradient-to-b from-brand-50 to-slate-50 py-14 sm:py-20">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_1.5fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">{p.formTitle || cta}</h2>
            {p.formIntro ? <p className="mt-3 text-lg text-slate-600">{p.formIntro}</p> : null}
            {tile.price ? <p className="mt-5 inline-block rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-900 ring-1 ring-brand-200">{tile.price}</p> : null}
            {p.contactPhone || p.contactWhatsapp ? (
              <div className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                <p className="font-display font-bold text-ink">Parler à un conseiller</p>
                <p className="mt-1 text-sm text-slate-600">Du lundi au samedi, de 8 h à 19 h.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.contactPhone ? <a href={tel(p.contactPhone)} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-white"><SiteIcon value="📞" size={16} />{p.contactPhone}</a> : null}
                  {p.contactWhatsapp ? <a href={wa(p.contactWhatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white"><SiteIcon value="💬" size={16} />WhatsApp</a> : null}
                </div>
              </div>
            ) : null}
          </div>
          <div className="min-w-0 rounded-3xl bg-white p-5 shadow-xl ring-1 ring-slate-200 sm:p-8">{form}</div>
        </div>
      </section>

      {/* Questions fréquentes */}
      {p.faq.length ? (
        <section className="container-page py-14 sm:py-20">
          <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">{p.faqTitle || "Questions fréquentes"}</h2>
          <div className="mt-8 divide-y divide-slate-200 rounded-3xl bg-white ring-1 ring-slate-200">
            {p.faq.map((f) => (
              <details key={f.q} className="group p-5 sm:p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold text-ink">
                  {f.q}<span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-lg transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {/* Autres services */}
      {others.length ? (
        <section className="container-page pb-16">
          <h2 className="font-display text-2xl font-extrabold text-ink">Nos autres services</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((o) => (
              <Link key={o.key} href={serviceHref(o.key)} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-card-hover">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-800"><SiteIcon value={o.icon} fallback="outils" size={24} /></span>
                <span><span className="block font-display font-bold text-ink">{o.title}</span><span className="block text-sm text-muted">{o.tagline}</span></span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Barre d'action sur téléphone */}
      <style>{`@media (max-width: 1023px) { body { padding-bottom: 5rem; } }`}</style>
      <div className="fixed inset-x-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden" style={{ bottom: "var(--mobile-tabbar-h, 0px)" }}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1"><p className="truncate font-display font-bold text-ink">{tile.title}</p>{tile.price ? <p className="truncate text-xs text-muted">{tile.price}</p> : null}</div>
          <a href="#reserver" className="shrink-0 rounded-full bg-accent-600 px-5 py-3 text-sm font-bold text-white">{cta}</a>
        </div>
      </div>
    </div>
  );
}
