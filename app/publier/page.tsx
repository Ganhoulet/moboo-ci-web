import type { Metadata } from "next";
import Link from "next/link";
import { PublishStarter } from "@/components/publish/publish-starter";
import { Faq } from "@/components/home/faq";
import { getProStats } from "@/lib/pros";
import { getSiteSettings } from "@/lib/settings";
import { getSession } from "@/lib/session";
import { SiteIcon } from "@/components/site-icon";

export const metadata: Metadata = {
  title: "Publier une annonce gratuite — louer ou vendre votre bien",
  description: "Publiez gratuitement votre appartement, villa, terrain ou bureau à louer ou à vendre en Côte d’Ivoire. Contact direct avec les intéressés, sans commission.",
  alternates: { canonical: "/publier" },
};

export const dynamic = "force-dynamic";

const nf = (n: number) => n.toLocaleString("fr-FR").replace(/[  ]/g, " ");

const WHY = [
  { i: "💸", t: "Zéro commission", d: "Publier est gratuit. Les intéressés vous appellent ou vous écrivent directement, sans intermédiaire imposé." },
  { i: "⚡", t: "Des contacts rapides", d: "Votre annonce est vue sur le site et dans l’application Moboo.ci par des milliers de chercheurs de logement chaque mois." },
  { i: "✅", t: "Des annonces de confiance", d: "Badge vérifié, avis certifiés, signalement des fraudes : les acheteurs et locataires savent à qui ils parlent." },
  { i: "📊", t: "Suivi en temps réel", d: "Vues, appels, messages et favoris de chaque annonce dans votre espace, et des conseils pour mieux louer." },
];

const STEPS = [
  { n: "1", t: "Décrivez votre bien", d: "Type, commune, quartier, pièces, surface et prix : quelques champs suffisent." },
  { n: "2", t: "Ajoutez vos photos", d: "De belles photos lumineuses, une par pièce : les annonces avec photos reçoivent beaucoup plus de contacts." },
  { n: "3", t: "Recevez les demandes", d: "Votre annonce est en ligne ; les intéressés vous contactent par téléphone, WhatsApp ou messagerie." },
];

const FAQ = [
  { q: "Publier une annonce est-il vraiment gratuit ?", a: "Oui. La publication d’une annonce de location ou de vente est gratuite. Des options payantes (mise en vedette, forfaits pro) permettent seulement d’être vu davantage." },
  { q: "Dois-je créer un compte ?", a: "C’est recommandé : avec un compte, vous modifiez vos annonces, suivez leurs vues et retrouvez les demandes reçues. La création prend une minute avec votre numéro." },
  { q: "Combien de temps mon annonce reste-t-elle en ligne ?", a: "Tant que le bien est disponible. Pensez à la marquer louée ou vendue depuis votre espace pour ne plus être dérangé." },
  { q: "Je suis agent ou agence : y a-t-il une offre adaptée ?", a: "Oui : les forfaits pro donnent plus d’annonces, la mise en avant, une page agence et l’application Moboo Pro pour gérer mandats, baux et loyers." },
  { q: "Et les meublés ou les espaces événementiels ?", a: "Ils se gèrent avec réservation en ligne via les applications Moboo Resi (meublés) et Moboo Event (espaces) : calendrier, acompte sécurisé et code d’arrivée." },
  { q: "Moboo peut-il s’occuper de tout ?", a: "Oui, avec le service « Louer mon bien » : un agent Moboo prend les photos, publie l’annonce, organise les visites et prépare le bail." },
];

/** Page « Publier une annonce » (façon post.magicbricks.com) : accroche + carte de démarrage, avantages, étapes, chiffres, offres pro, FAQ. */
export default async function PublierLanding() {
  const account = getSession();
  const [stats, settings] = await Promise.all([getProStats(), getSiteSettings()]);
  const mobile = (settings as unknown as Record<string, Record<string, string>>).mobile_app ?? {};
  const play = mobile.playStoreUrl || "https://play.google.com/store/search?q=moboo.ci";
  const figures = [
    stats?.listings ? [nf(stats.listings), "annonces en ligne"] : null,
    stats?.views30 ? [nf(stats.views30), "vues d’annonces ce mois-ci"] : null,
    stats?.searches30 ? [nf(stats.searches30), "recherches ce mois-ci"] : null,
    stats?.pros ? [nf(stats.pros), "agents et agences"] : null,
  ].filter(Boolean) as [string, string][];

  return (
    <div>
      {/* Accroche + carte de démarrage */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 text-white">
        <div className="container-page grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">100 % gratuit · Contact direct</span>
            <h1 className="mt-4 font-display text-4xl font-black leading-tight sm:text-5xl">Louez ou vendez votre bien <span className="text-accent-400">plus vite</span>, sans commission</h1>
            <p className="mt-4 max-w-xl text-lg text-white/85">Publiez votre appartement, villa, terrain ou bureau sur Moboo.ci et recevez directement les appels des locataires et acheteurs sérieux.</p>
            <ul className="mt-6 space-y-2 text-white/90">
              {["Annonce en ligne en quelques minutes", "Visible sur le site et l’application Moboo.ci", "Vous gardez la main : pas d’intermédiaire imposé"].map((x) => (
                <li key={x} className="flex gap-2"><span className="text-accent-400">✓</span>{x}</li>
              ))}
            </ul>
            {figures.length ? (
              <div className="mt-8 flex flex-wrap gap-6">
                {figures.slice(0, 3).map(([v, l]) => <div key={l}><p className="font-display text-2xl font-black">{v}</p><p className="text-xs text-white/70">{l}</p></div>)}
              </div>
            ) : null}
          </div>
          <div id="commencer" className="lg:pl-6"><PublishStarter phone={account?.phone} loggedIn={!!account} /></div>
        </div>
      </section>

      {/* Pourquoi publier sur Moboo */}
      <section className="bg-white py-14">
        <div className="container-page">
          <h2 className="text-center font-display text-3xl font-extrabold text-ink">Pourquoi publier sur Moboo.ci ?</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((x) => (
              <div key={x.t} className="rounded-2xl border border-slate-200 p-6">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-800"><SiteIcon value={x.i} size={24} /></span>
                <p className="mt-4 font-display text-lg font-bold text-ink">{x.t}</p>
                <p className="mt-1 text-sm text-muted">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 étapes */}
      <section className="bg-slate-50 py-14">
        <div className="container-page">
          <h2 className="text-center font-display text-3xl font-extrabold text-ink">Publiez en 3 étapes simples</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-600 font-display text-lg font-black text-white">{s.n}</span>
                <p className="mt-4 font-display text-lg font-bold text-ink">{s.t}</p>
                <p className="mt-1 text-sm text-muted">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center"><Link href="#commencer" className="inline-block rounded-full bg-accent-600 px-8 py-3.5 font-bold text-white hover:bg-accent-700">Publier mon annonce gratuitement</Link></div>
        </div>
      </section>

      {/* Chiffres */}
      {figures.length ? (
        <section className="bg-brand-900 py-12 text-white">
          <div className="container-page grid gap-6 text-center sm:grid-cols-2 lg:grid-cols-4">
            {figures.map(([v, l]) => <div key={l}><p className="font-display text-4xl font-black">{v}</p><p className="mt-1 text-sm text-white/75">{l}</p></div>)}
          </div>
        </section>
      ) : null}

      {/* Offres : particulier / pro / Moboo s'en occupe */}
      <section className="bg-white py-14">
        <div className="container-page">
          <h2 className="text-center font-display text-3xl font-extrabold text-ink">Une formule pour chaque besoin</h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <div className="flex flex-col rounded-2xl border border-slate-200 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Particulier</p>
              <p className="mt-2 font-display text-2xl font-black text-ink">Gratuit</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-700">{["Annonce de location ou de vente", "Photos et description complètes", "Contact direct par téléphone et WhatsApp"].map((x) => <li key={x}>✓ {x}</li>)}</ul>
              <Link href="#commencer" className="mt-6 rounded-full border border-ink py-3 text-center text-sm font-bold text-ink hover:bg-ink hover:text-white">Publier gratuitement</Link>
            </div>
            <div className="flex flex-col rounded-2xl border-2 border-accent-600 p-6 shadow-lg">
              <p className="text-xs font-bold uppercase tracking-wider text-accent-700">Agents et agences</p>
              <p className="mt-2 font-display text-2xl font-black text-ink">Forfaits pro</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-700">{["Plus d’annonces et mise en vedette", "Page agence, badge vérifié et avis", "Application Moboo Pro : mandats, baux, loyers"].map((x) => <li key={x}>✓ {x}</li>)}</ul>
              <Link href="/forfaits" className="mt-6 rounded-full bg-accent-600 py-3 text-center text-sm font-bold text-white hover:bg-accent-700">Voir les forfaits</Link>
            </div>
            <div className="flex flex-col rounded-2xl border border-slate-200 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Pas le temps ?</p>
              <p className="mt-2 font-display text-2xl font-black text-ink">Moboo s’en occupe</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-700">{["Photos et annonce par un agent", "Visites et dossier du locataire", "Bail préparé · vous payez une fois loué"].map((x) => <li key={x}>✓ {x}</li>)}</ul>
              <Link href="/services/mettre-en-location" className="mt-6 rounded-full border border-ink py-3 text-center text-sm font-bold text-ink hover:bg-ink hover:text-white">Confier mon bien</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Conseils */}
      <section className="bg-slate-50 py-14">
        <div className="container-page grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-ink">Conseils pour une annonce qui marche</h2>
            <p className="mt-2 text-muted">Les annonces complètes reçoivent jusqu’à 3 fois plus de demandes.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[["📸", "5 photos ou plus, en journée, une par pièce"], ["📍", "Commune et quartier précis"], ["💰", "Un prix juste : comparez avec l’estimation de loyer"], ["📝", "Équipements, eau, électricité, accès : tout ce qui rassure"]].map(([i, t]) => (
              <li key={t} className="flex gap-3 rounded-xl bg-white p-4 text-sm text-ink ring-1 ring-slate-200"><span className="text-brand-700"><SiteIcon value={i} size={20} /></span>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-14">
        <div className="container-page">
          <h2 className="mb-6 text-center font-display text-3xl font-extrabold text-ink">Questions fréquentes</h2>
          <Faq items={FAQ} />
        </div>
      </section>

      {/* Application + rappel */}
      <section className="bg-brand-900 py-12 text-white">
        <div className="container-page flex flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-left">
          <div>
            <p className="font-display text-2xl font-black">Publiez aussi depuis votre téléphone</p>
            <p className="mt-1 text-white/75">Application Moboo.ci pour les particuliers, Moboo Pro pour les agents et agences.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={play} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white px-6 py-3 text-sm font-bold text-ink hover:bg-slate-100">▶ Google Play</a>
            <Link href="#commencer" className="rounded-full bg-accent-600 px-6 py-3 text-sm font-bold text-white hover:bg-accent-700">Publier maintenant</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
