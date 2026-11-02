import type { Metadata } from "next";
import Link from "next/link";
import { KIND_LABEL, listPrograms } from "@/lib/programs";
import { ProgramCard } from "@/components/program-card";

export const metadata: Metadata = {
  title: "Programmes immobiliers neufs à Abidjan et en Côte d’Ivoire",
  description: "Appartements, villas et lotissements neufs à Abidjan, Bingerville, Grand-Bassam… Prix, plans de paiement, avancement des travaux et statut foncier vérifié.",
  alternates: { canonical: "/programmes-neufs" },
};
export const revalidate = 60;

/** Programmes neufs : liste filtrable (commune, type), mis en avant d'abord. */
export default async function ProgramsPage({ searchParams }: { searchParams: { commune?: string; kind?: string } }) {
  const all = await listPrograms();
  const communes = [...new Set(all.map((p) => p.commune).filter(Boolean))].sort();
  const items = all.filter((p) => (!searchParams.commune || p.commune === searchParams.commune) && (!searchParams.kind || p.kind === searchParams.kind));
  const href = (k: string, v: string) => { const q = new URLSearchParams({ ...(searchParams.commune ? { commune: searchParams.commune } : {}), ...(searchParams.kind ? { kind: searchParams.kind } : {}) }); if (v) q.set(k, v); else q.delete(k); return `/programmes-neufs${q.toString() ? `?${q}` : ""}`; };
  const chip = (on: boolean) => "rounded-full px-3 py-1.5 text-sm font-semibold " + (on ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300");
  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="font-display text-3xl font-extrabold text-ink">Programmes neufs</h1>
      <p className="mt-1 max-w-3xl text-muted">Achetez sur plan ou en fin de chantier, directement auprès des promoteurs : prix, plans de paiement, avancement des travaux et statut foncier. Diaspora : visites vidéo sur demande.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={href("kind", "")} className={chip(!searchParams.kind)}>Tous</Link>
        {Object.entries(KIND_LABEL).map(([k, l]) => <Link key={k} href={href("kind", k)} className={chip(searchParams.kind === k)}>{l}</Link>)}
      </div>
      {communes.length > 1 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href={href("commune", "")} className={chip(!searchParams.commune)}>Toutes les communes</Link>
          {communes.map((c) => <Link key={c} href={href("commune", c)} className={chip(searchParams.commune === c)}>{c}</Link>)}
        </div>
      ) : null}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => <ProgramCard key={p.id} p={p} sponsored={p.featured} />)}
      </div>
      {!items.length ? <p className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-muted">Aucun programme pour ces critères pour le moment.</p> : null}
      <p className="mt-10 rounded-2xl bg-brand-50 p-4 text-sm text-brand-900">Vous êtes promoteur ? Présentez votre programme à des milliers d’acheteurs en Côte d’Ivoire et dans la diaspora : <Link href="/professionnels" className="font-bold underline">découvrez l’offre professionnels</Link>.</p>
    </div>
  );
}
