import type { Metadata } from "next";
import Link from "next/link";
import { getEspace, getResidence } from "@/lib/api";

export const metadata: Metadata = { title: "Réserver" };

export default async function ReserverPage({
  searchParams,
}: {
  searchParams: { type?: string; id?: string };
}) {
  const { type, id } = searchParams;
  let title = "votre bien";
  let back = "/annonces?reservable=1";
  if (id && type === "residence") {
    const r = await getResidence(id);
    if (r) title = r.name;
    back = `/residence/${id}`;
  } else if (id && type === "espace") {
    const e = await getEspace(id);
    if (e) title = e.nom;
    back = `/espace/${id}`;
  }

  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
        <span className="chip mx-auto bg-brand-50 text-brand-800">Réservation en ligne</span>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-ink">Réserver — {title}</h1>
        <p className="mt-2 text-muted">
          Le tunnel de réservation (choix des dates, acompte sécurisé, code
          d'arrivée) arrive très bientôt.
        </p>

        <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
          {[
            { n: "1", t: "Vos dates", d: "Sélectionnez la période." },
            { n: "2", t: "L'hôte confirme", d: "Acompte après accord." },
            { n: "3", t: "Code d'arrivée", d: "À présenter sur place." },
          ].map((s) => (
            <div key={s.n} className="rounded-xl bg-slate-50 p-4">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-800 text-sm font-bold text-white">
                {s.n}
              </span>
              <p className="mt-2 font-semibold text-ink">{s.t}</p>
              <p className="text-sm text-muted">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href={back} className="btn-ghost">← Retour au bien</Link>
          <Link href="/annonces" className="btn-primary bg-accent-600 hover:bg-accent-700">
            Voir d'autres biens
          </Link>
        </div>
      </div>
    </div>
  );
}
