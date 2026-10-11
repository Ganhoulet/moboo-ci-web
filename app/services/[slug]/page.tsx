import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EdlForm, FoncierForm, LoyerForm, SolvencyForm } from "@/components/services/service-forms";
import { MissionForm } from "@/components/services/mission-form";
import { MISSION_POINTS } from "@/lib/missions";
import { getServiceZones, getSiteServices, isMissionKey, serviceBySlug, serviceHref, type ServiceKey, type ServiceTile, type ToolKey } from "@/lib/site-services";

export const revalidate = 120;

const POINTS: Record<ToolKey, string[]> = {
  edl: ["Agent Moboo formé, rapport photo pièce par pièce", "Entrée ou sortie, à la date qui vous convient", "Un document clair pour éviter les litiges sur la caution"],
  loyer: ["Calculé sur les loyers réels de votre quartier", "Fourchette du marché et annonces comparables", "Gratuit et sans inscription"],
  foncier: ["Prix du marché et valeur fiscale (DGI)", "Frais de notaire et d’ACD estimés", "Niveau de risque selon le statut du terrain"],
  solvabilite: ["Avec l’accord du candidat (code par SMS)", "Ponctualité des loyers suivis sur Moboo Pro", "Rapport revenus / loyer et conseils pratiques"],
};

async function tile(slug: string): Promise<{ key: ServiceKey; t: ServiceTile; all: ServiceTile[]; solvency: { incomeMultiple: number; codeTtlMin: number } } | null> {
  const key = serviceBySlug(slug);
  if (!key) return null;
  const data = await getSiteServices();
  const t = data.items.find((x) => x.key === key);
  return t ? { key, t, all: data.items, solvency: data.solvency } : null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const r = await tile(params.slug);
  if (!r) return { title: "Service indisponible", robots: { index: false } };
  return { title: r.t.landingTitle || r.t.title, description: r.t.landingIntro.slice(0, 160), alternates: { canonical: serviceHref(r.key) } };
}

/** Page dédiée d'un service Moboo : présentation (textes du back-office) et formulaire. */
export default async function ServicePage({ params }: { params: { slug: string } }) {
  const r = await tile(params.slug);
  if (!r) notFound();
  const { key, t } = r;
  const zones = key === "loyer" || key === "foncier" ? await getServiceZones(key) : [];
  const others = r.all.filter((x) => x.key !== key);
  return (
    <div className="bg-slate-50">
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 text-white">
        <div className="container-page grid gap-8 py-12 sm:py-16 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div>
            <nav className="text-xs text-white/70"><Link href="/" className="hover:underline">Accueil</Link> › Services</nav>
            <p className="mt-4 text-5xl" aria-hidden>{t.icon}</p>
            <h1 className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl">{t.landingTitle || t.title}</h1>
            <p className="mt-4 text-white/85">{t.landingIntro}</p>
            {t.price ? <p className="mt-4 inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold">{t.price}</p> : null}
            <ul className="mt-6 space-y-2 text-sm">
              {(isMissionKey(key) ? MISSION_POINTS[key] : POINTS[key]).map((p) => <li key={p} className="flex gap-2"><span className="text-accent-400">✓</span>{p}</li>)}
            </ul>
          </div>
          <div className="rounded-3xl bg-white p-5 text-ink shadow-2xl sm:p-7">
            {key === "edl" ? <EdlForm /> : null}
            {key === "loyer" ? <LoyerForm zones={zones} /> : null}
            {key === "foncier" ? <FoncierForm zones={zones} /> : null}
            {key === "solvabilite" ? <SolvencyForm {...r.solvency} /> : null}
            {isMissionKey(key) ? <MissionForm service={key} price={t.price} /> : null}
          </div>
        </div>
      </section>
      {others.length ? (
        <section className="container-page py-12">
          <h2 className="font-display text-2xl font-extrabold text-ink">Nos autres services</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((o) => (
              <Link key={o.key} href={serviceHref(o.key)} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-card-hover">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-100 text-2xl">{o.icon}</span>
                <span><span className="block font-display font-bold text-ink">{o.title}</span><span className="block text-sm text-muted">{o.tagline}</span>{o.price ? <span className="mt-1 block text-xs font-semibold text-brand-700">{o.price}</span> : null}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
