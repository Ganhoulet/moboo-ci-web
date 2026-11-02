import type { Metadata } from "next";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { DiasporaForm } from "@/components/diaspora-form";

export const metadata: Metadata = {
  title: "Diaspora : acheter, construire ou louer en Côte d’Ivoire en toute sécurité",
  description: "Ivoiriens de l’étranger : biens vérifiés sur place, visites en vidéo, vérification des documents (ACD, titre foncier) et accompagnement jusqu’au notaire avec Moboo.",
  alternates: { canonical: "/diaspora" },
};
export const revalidate = 300;

type Page = { enabled: boolean; intro: string; packs: { name: string; price: string; description: string }[] };

async function getPage(): Promise<Page | null> {
  try { const r = await fetch(`${API_URL}/site/diaspora`, { next: { revalidate: 300 } }); return r.ok ? await r.json() : null; } catch { return null; }
}

const STEPS = [
  ["1", "Dites-nous votre projet", "Achat, construction, location ou gestion : votre conseiller Moboo vous rappelle sur WhatsApp."],
  ["2", "Biens vérifiés, visites vidéo", "Nous sélectionnons des biens vérifiés sur place et vous les faisons visiter en direct, en vidéo."],
  ["3", "Documents contrôlés", "ACD, titre foncier, permis : vérifiés avec un notaire partenaire avant tout paiement."],
  ["4", "Jusqu’à la remise des clés", "Signature, paiement sécurisé, suivi des travaux ou mise en location : on s’occupe de tout."],
];

/** Page Diaspora : accompagnement des Ivoiriens de l'étranger (achat, construction, location, gestion). */
export default async function DiasporaPage() {
  const p = await getPage();
  if (p && !p.enabled) return <div className="container-page py-16 text-center text-muted">Le service diaspora rouvre bientôt.</div>;
  return (
    <div className="pb-16">
      <section className="bg-gradient-to-br from-brand-900 to-brand-800 py-12 text-white sm:py-16">
        <div className="container-page max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">Moboo Diaspora</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-5xl">Investir au pays, sans mauvaise surprise</h1>
          <p className="mt-4 max-w-2xl text-lg text-brand-50">{p?.intro || "Achetez, construisez ou louez en Côte d’Ivoire : biens vérifiés, visites vidéo, accompagnement jusqu’au notaire."}</p>
        </div>
      </section>
      <div className="container-page mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-10">
          <ol className="grid gap-4 sm:grid-cols-2">
            {STEPS.map(([n, t, d]) => <li key={n} className="rounded-2xl bg-white p-5 shadow-card"><span className="grid h-8 w-8 place-items-center rounded-full bg-brand-800 font-bold text-white">{n}</span><p className="mt-3 font-bold text-ink">{t}</p><p className="mt-1 text-sm text-muted">{d}</p></li>)}
          </ol>
          {p?.packs.length ? (
            <section>
              <h2 className="font-display text-2xl font-extrabold text-ink">Nos offres</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {p.packs.map((k) => <div key={k.name} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200"><p className="font-bold text-ink">{k.name}</p><p className="mt-1 text-xl font-extrabold text-brand-800">{k.price}</p><p className="mt-2 text-sm text-muted">{k.description}</p></div>)}
              </div>
            </section>
          ) : null}
          <section className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
            <h2 className="font-bold text-emerald-900">Commencez par les biens vérifiés</h2>
            <p className="mt-1 text-sm text-emerald-900">Les annonces marquées « ✓ Vérifié Moboo » ont été visitées par notre équipe : le bien existe et correspond à l’annonce.</p>
            <div className="mt-3 flex flex-wrap gap-2"><Link href="/annonces?transaction=sale" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-ink ring-1 ring-emerald-300">Biens à vendre</Link><Link href="/programmes-neufs" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-ink ring-1 ring-emerald-300">Programmes neufs</Link></div>
          </section>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start"><div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200"><h2 className="mb-4 font-display text-lg font-extrabold text-ink">Parlez à un conseiller</h2><DiasporaForm packs={(p?.packs ?? []).map((k) => k.name)} /></div></aside>
      </div>
    </div>
  );
}
