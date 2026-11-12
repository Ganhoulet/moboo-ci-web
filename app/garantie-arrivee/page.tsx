import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbLd, ldJson } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: { absolute: "Garantie d’arrivée : votre acompte protégé jusqu’à votre arrivée | Moboo.ci" },
  description: "Sur Moboo.ci, l’acompte de votre résidence meublée reste chez Moboo jusqu’à votre arrivée. Logement non conforme, accès impossible, panne d’eau ou d’électricité : signalez-le, le versement à l’hôte est gelé.",
  alternates: { canonical: "/garantie-arrivee" },
};

const FAQ = [
  { q: "Quand l’hôte reçoit-il mon acompte ?", a: "Pas avant votre arrivée. L’acompte payé par Wave, Orange Money, MTN ou Moov reste chez Moboo ; il n’est versé à l’hôte qu’après la confirmation de votre arrivée (code d’arrivée), puis un délai de 48 heures." },
  { q: "Que faire si le logement ne correspond pas à l’annonce ?", a: "Ouvrez un signalement depuis « Mes réservations », avec des photos. Le versement à l’hôte est aussitôt gelé, l’hôte est invité à répondre et l’équipe Moboo décide." },
  { q: "Quels problèmes sont couverts ?", a: "Logement non conforme à l’annonce, propreté, accès impossible ou hôte injoignable, équipements en panne (eau, électricité, climatisation…), sécurité, annulation par l’hôte, caution retenue à tort." },
  { q: "Quelles sont les décisions possibles ?", a: "Remboursement total ou partiel de votre acompte, ou versement à l’hôte si le problème n’est pas avéré. Vous êtes informé à chaque étape." },
];

/** Garantie d'arrivée : explication de l'acompte séquestré et du signalement (litiges existants). */
export default function ArrivalGuarantee() {
  const ld = [
    breadcrumbLd([{ label: "Accueil", href: "/" }, { label: "Garantie d’arrivée" }]),
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) },
  ];
  return (
    <div className="container-page max-w-3xl py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Réservation protégée</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Garantie d’arrivée</h1>
      <p className="mt-3 text-lg text-muted">Quand vous réservez une résidence meublée sur Moboo.ci, votre acompte n’est pas envoyé à l’hôte : il reste chez Moboo jusqu’à votre arrivée. Si quelque chose ne va pas, vous le signalez et l’argent ne part pas.</p>
      <ol className="mt-8 space-y-4">
        {[
          ["Vous payez l’acompte", "30 % du séjour, par Wave, Orange Money, MTN ou Moov. Il est conservé par Moboo."],
          ["Vous arrivez", "Vous donnez votre code d’arrivée à l’hôte. Le versement de l’acompte à l’hôte n’intervient que 48 heures plus tard."],
          ["Un problème ? Signalez-le", "Depuis « Mes réservations », avec des photos : le versement à l’hôte est gelé immédiatement."],
          ["Moboo tranche", "Après les explications de l’hôte : remboursement total ou partiel, ou versement à l’hôte si tout est conforme."],
        ].map(([t, d], i) => (
          <li key={t} className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink font-bold text-white">{i + 1}</span>
            <div><p className="font-semibold text-ink">{t}</p><p className="mt-1 text-muted">{d}</p></div>
          </li>
        ))}
      </ol>
      <section className="mt-10">
        <h2 className="font-display text-xl font-bold text-ink">Questions fréquentes</h2>
        {FAQ.map((x) => <details key={x.q} className="mt-3 rounded-xl bg-white p-4 ring-1 ring-slate-200"><summary className="cursor-pointer font-semibold text-ink">{x.q}</summary><p className="mt-2 text-muted">{x.a}</p></details>)}
      </section>
      <div className="mt-8 flex flex-wrap gap-2 text-sm">
        <Link href="/annonces?transaction=furnished" className="btn-primary bg-ink hover:bg-black">Voir les résidences meublées</Link>
        <Link href="/mon-espace/reservations" className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-ink hover:border-ink">Mes réservations</Link>
      </div>
    </div>
  );
}
