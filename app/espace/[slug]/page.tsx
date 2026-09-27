import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatXOF, getEspace, getEspaceOccupied } from "@/lib/api";
import { PhotoGrid } from "@/components/photo-grid";
import { EspaceBooking } from "@/components/espace-booking";

export const revalidate = 60;

const TYPE_LABEL: Record<string, string> = {
  salle_mariage: "Salle de mariage",
  rooftop: "Rooftop",
  villa: "Villa",
  jardin: "Jardin",
  corporate: "Corporate",
  club: "Club",
  conference: "Conférence",
  culturel: "Culturel",
  maquis: "Maquis",
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const e = await getEspace(params.slug);
  return { title: e ? e.nom : "Espace" };
}

export default async function EspacePage({ params }: { params: { slug: string } }) {
  const e = await getEspace(params.slug);
  if (!e) notFound();

  const zone = [e.quartier, e.commune].filter(Boolean).join(", ") || "Côte d'Ivoire";
  const prices = (e.tarifs ?? []).map((t) => t.prix ?? 0).filter((p) => p > 0);
  const aPartir = prices.length ? Math.min(...prices) : null;
  const photos = [e.photoPrincipaleUrl, ...(e.photos ?? [])].filter(Boolean) as string[];
  const occupied = await getEspaceOccupied(e.id);

  return (
    <div className="container-page py-8">
      <Link href="/annonces?transaction=event" className="text-sm font-semibold text-muted hover:text-ink">
        ← Retour aux espaces
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-ink/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          {TYPE_LABEL[e.type] ?? "Espace"}
        </span>
        <span className="chip">{e.capaciteMin}–{e.capaciteMax} pers.</span>
      </div>
      <h1 className="mt-2 font-display text-2xl font-extrabold text-ink sm:text-3xl">{e.nom}</h1>
      <p className="mt-1 flex items-center gap-1 text-muted">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        {zone}
      </p>

      <div className="mt-6">
        <PhotoGrid photos={photos} alt={e.nom} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          {e.description ? (
            <section>
              <h2 className="font-display text-lg font-bold text-ink">Description</h2>
              <p className="mt-2 whitespace-pre-line text-slate-600">{e.description}</p>
            </section>
          ) : null}

          {e.equipementsInclus?.length ? (
            <section>
              <h2 className="font-display text-lg font-bold text-ink">Équipements inclus</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {e.equipementsInclus.map((a) => (
                  <span key={a} className="chip">{a}</span>
                ))}
              </div>
            </section>
          ) : null}

          {e.tarifs?.length ? (
            <section>
              <h2 className="font-display text-lg font-bold text-ink">Formules</h2>
              <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {e.tarifs.map((t, i) => (
                  <div key={t.id ?? i} className="flex items-center justify-between gap-4 p-4">
                    <p className="font-semibold text-ink">{t.nom ?? "Formule"}</p>
                    <p className="shrink-0 font-bold text-ink">{formatXOF(t.prix ?? null)}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {e.reglesInternes ? (
            <section>
              <h2 className="font-display text-lg font-bold text-ink">Règlement intérieur</h2>
              <p className="mt-2 whitespace-pre-line text-slate-600">{e.reglesInternes}</p>
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <EspaceBooking espaceId={e.id} occupied={occupied} fromPrice={aPartir} />
        </aside>
      </div>
    </div>
  );
}
