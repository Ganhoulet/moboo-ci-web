import type { Metadata } from "next";
import Link from "next/link";
import { dateRange, getEvents } from "@/lib/stays";
import { breadcrumbLd, ldJson } from "@/lib/structured-data";

export const revalidate = 600;

export const metadata: Metadata = {
  title: { absolute: "Où dormir pendant un événement en Côte d’Ivoire : résidences meublées près du lieu | Moboo.ci" },
  description: "Concerts, festivals, salons, matchs à Abidjan et en Côte d’Ivoire : les résidences meublées les plus proches du lieu, avec les dates déjà remplies et les logements libres.",
  alternates: { canonical: "/ou-dormir" },
};

/** Sommaire des événements à venir. */
export default async function WhereToSleepIndex() {
  const events = (await getEvents()) ?? [];
  return (
    <div className="container-page py-8 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson([breadcrumbLd([{ label: "Accueil", href: "/" }, { label: "Où dormir pendant un événement" }])]) }} />
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Où dormir pendant un événement ?</h1>
      <p className="mt-3 max-w-3xl text-muted">Pour chaque concert, festival, salon ou match, les résidences meublées les plus proches du lieu, avec les dates de séjour déjà remplies.</p>
      {events.length ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {events.map((e) => (
            <li key={e.slug}><Link href={`/ou-dormir/${e.slug}`} className="block rounded-xl bg-white p-4 ring-1 ring-slate-200 hover:ring-ink">
              <span className="font-display text-lg font-bold text-ink">{e.name}</span>
              <span className="mt-1 block text-sm text-muted">{e.venue}, {e.city} · {dateRange(e.startDate, e.endDate)}</span>
            </Link></li>
          ))}
        </ul>
      ) : <p className="mt-8 rounded-xl bg-white p-6 text-muted ring-1 ring-slate-200">Aucun événement annoncé pour le moment. <Link href="/meuble-pres-de" className="font-semibold text-ink underline">Chercher près d’un repère</Link></p>}
    </div>
  );
}
