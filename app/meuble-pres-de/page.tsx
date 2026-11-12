import type { Metadata } from "next";
import Link from "next/link";
import { getLandmarks } from "@/lib/stays";
import { breadcrumbLd, ldJson } from "@/lib/structured-data";

export const revalidate = 600;

export const metadata: Metadata = {
  title: { absolute: "Résidences meublées près de l’aéroport, du Plateau, du CHU… | Moboo.ci" },
  description: "Trouvez une résidence meublée près de votre point de rendez-vous à Abidjan et en Côte d’Ivoire : aéroport, Plateau, CHU de Cocody, université, ambassades, Grand-Bassam, Assinie.",
  alternates: { canonical: "/meuble-pres-de" },
};

/** Sommaire des repères des voyageurs. */
export default async function LandmarksIndex() {
  const rows = (await getLandmarks()) ?? [];
  const byCity = new Map<string, typeof rows>();
  for (const r of rows) byCity.set(r.city, [...(byCity.get(r.city) ?? []), r]);
  return (
    <div className="container-page py-8 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd([{ label: "Accueil", href: "/" }, { label: "Meublés par repère" }])) }} />
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Une résidence meublée près de là où vous allez</h1>
      <p className="mt-3 max-w-3xl text-muted">Rendez-vous à l’ambassade, vol tôt le matin, proche hospitalisé, concert au stade : choisissez votre repère, nous classons les résidences de la plus proche à la plus éloignée, avec les logements libres ce soir.</p>
      {[...byCity].map(([city, list]) => (
        <section key={city} className="mt-8">
          <h2 className="font-display text-xl font-bold text-ink">{city}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((l) => (
              <li key={l.slug}>
                <Link href={`/meuble-pres-de/${l.slug}`} className="block rounded-xl bg-white p-4 ring-1 ring-slate-200 hover:ring-ink">
                  <span className="font-semibold text-ink">Meublés {l.near}</span>
                  <span className="mt-1 block text-sm text-muted">{l.residences ? `${l.residences} résidence${l.residences > 1 ? "s" : ""}` : "Bientôt des résidences"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
