import Link from "next/link";
import { SignalPreview } from "@/components/backoffice/marketing-center";
import { getCenterOverview } from "./actions";

export const dynamic = "force-dynamic";

const CHANNEL: Record<string, string> = { MOBOO_CI: "Site Moboo.ci", DIRECT: "Moboo Resi (saisie)", LINK: "Lien de réservation", WHATSAPP: "WhatsApp", BOOKING_COM: "Booking.com", AIRBNB: "Airbnb", FACEBOOK: "Facebook", INSTAGRAM: "Instagram", TIKTOK: "TikTok", OTHER: "Autre" };

function Tile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-ink">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

const SIGNALS = [
  ["Meublés", "« Réservé 5 fois ces 7 derniers jours », « Dernière réservation il y a 3 h », « Plus que 2 logements pour vos dates », « Complet pour vos dates », « 80 % des nuits réservées »"],
  ["Espaces", "« Plus que 2 samedis libres d’ici le 28 novembre », « Réservé 6 fois ces 30 derniers jours », « Dernière réservation il y a 2 h »"],
  ["Locations / ventes", "« Prix en baisse : −10 000 FCFA », « 4 personnes ont contacté l’annonceur cette semaine », « Bien rare : seulement 2 studios à louer à Cocody », « 3 biens loués à Cocody ce mois-ci », « Vu 129 fois cette semaine »"],
  ["Partout", "« 3 personnes consultent ce logement en ce moment », promotions avec compte à rebours, notifications « Un logement vient d’être réservé à Cocody »"],
];

/** Back-office → Centre marketing (conversion façon Booking, sur données réelles). */
export default async function MarketingCenter() {
  const o = await getCenterOverview();
  if (!o) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Centre marketing indisponible.</p>;
  const w = o.week;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Centre marketing</h1>
          <p className="max-w-3xl text-sm text-muted">Messages de conversion façon Booking sur les fiches, les cartes et en notification. Ils sont calculés <strong>uniquement sur des données réelles</strong> : réservations de Moboo Resi, Moboo Event et du site, réservations déclarées par l’équipe, vues, demandes, favoris, disponibilités et prix.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/centre-marketing/reservations" className="rounded-md bg-brand-700 px-3 py-2 font-semibold text-white hover:bg-brand-800">Déclarer une réservation</Link>
          <Link href="/admin/centre-marketing/promotions" className="rounded-md bg-white px-3 py-2 font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Promotions</Link>
          <Link href="/admin/centre-marketing/reglages" className="rounded-md bg-white px-3 py-2 font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Réglages</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Meublés réservés (7 j)" value={w.furnished} hint={Object.entries(w.furnishedByChannel).map(([k, v]) => `${CHANNEL[k] ?? k} : ${v}`).join(" · ") || "Moboo Resi + site"} />
        <Tile label="Espaces réservés (7 j)" value={w.events} hint="Moboo Event + site" />
        <Tile label="Déclarées par l’équipe (7 j)" value={w.declared} hint="confirmées avec les propriétaires" />
        <Tile label="Visiteurs sur les fiches" value={o.onlineNow} hint="en ce moment" />
        <Tile label="Demandes (7 j)" value={w.inquiries} hint="contacts et visites" />
        <Tile label="Loués / vendus (7 j)" value={w.closed} />
        <Tile label="Promotions en cours" value={o.activePromotions} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold text-ink">Activité récente (notifications du site)</h2>
          <div className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            {o.activity.length ? (
              <ul className="divide-y divide-slate-100 text-sm">
                {o.activity.map((a, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <span>{a.kind === "event" ? "🎉" : a.kind === "closed" ? "🔑" : "✅"} {a.href ? <Link href={a.href} className="hover:underline">{a.text}</Link> : a.text}</span>
                    <span className="shrink-0 text-xs text-muted">{a.ago}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="p-4 text-sm text-muted">Aucune activité récente.</p>}
          </div>
        </section>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold text-ink">Aperçu d’une fiche</h2>
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200"><SignalPreview /></div>
          <div className="rounded-lg bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200">
            <p className="font-semibold text-ink">Messages possibles</p>
            <dl className="mt-2 space-y-2">
              {SIGNALS.map(([k, v]) => <div key={k}><dt className="font-semibold text-slate-700">{k}</dt><dd className="text-slate-600">{v}</dd></div>)}
            </dl>
            <p className="mt-3 text-xs text-muted">Pas de message inventé (« quelqu’un vient de réserver » sans réservation) : c’est une pratique commerciale trompeuse, sanctionnée, et elle détruit la confiance.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
