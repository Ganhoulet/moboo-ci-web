import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KIND_LABEL, getProgram, priceRange } from "@/lib/programs";
import { ProgramLeadForm } from "@/components/program-lead-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getProgram(params.slug);
  if (!p) return { title: "Programme neuf" };
  return { title: `${p.name} — ${KIND_LABEL[p.kind] ?? "Programme neuf"} à ${p.commune || p.city}`, description: (p.description ?? `${p.name} par ${p.developer}. ${priceRange(p)}.`).slice(0, 160), alternates: { canonical: `/programmes-neufs/${p.slug}` } };
}

const digits = (s: string | null) => (s ?? "").replace(/\D/g, "");
const n = (v: number) => v.toLocaleString("fr-FR");

/** Page d'un programme neuf : photos, chiffres clés, lots, plan de paiement, statut foncier, contact. */
export default async function ProgramPage({ params }: { params: { slug: string } }) {
  const p = await getProgram(params.slug);
  if (!p) notFound();
  const wa = digits(p.whatsapp || p.phone);
  const facts: [string, string | null][] = [["Prix", priceRange(p)], ["Livraison", p.delivery], ["Avancement", p.progress], ["Statut foncier", p.legalStatus], ["Type", KIND_LABEL[p.kind] ?? p.kind], ["Localisation", [p.address, p.commune, p.city].filter(Boolean).join(", ")]];
  return (
    <div className="pb-16">
      <div className="relative h-56 bg-slate-200 sm:h-80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.coverUrl ? <img src={p.coverUrl} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-brand-800 to-brand-900" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="container-page absolute inset-x-0 bottom-0 pb-5 text-white">
          <p className="text-sm font-semibold opacity-90">Programme neuf · {KIND_LABEL[p.kind] ?? p.kind} · {p.commune || p.city}</p>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{p.name}</h1>
          <p className="mt-1 font-semibold">{priceRange(p)}</p>
        </div>
      </div>
      <div className="container-page mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.developerLogo ? <img src={p.developerLogo} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200" /> : null}
            <span className="text-sm text-muted">Promoteur : <b className="text-ink">{p.developer}</b></span>
            {p.verified ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">✓ Documents fonciers vérifiés par Moboo</span> : null}
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {facts.filter(([, v]) => v).map(([k, v]) => <div key={k} className="rounded-xl bg-white p-3 shadow-card"><dt className="text-xs text-muted">{k}</dt><dd className="text-sm font-bold text-ink">{v}</dd></div>)}
          </dl>
          {p.highlights.length ? <ul className="grid gap-2 sm:grid-cols-2">{p.highlights.map((h) => <li key={h} className="flex gap-2 text-sm text-ink"><span className="text-emerald-600">✓</span>{h}</li>)}</ul> : null}
          {p.description ? <div className="whitespace-pre-line rounded-2xl bg-white p-5 text-sm leading-relaxed text-ink shadow-card">{p.description}</div> : null}
          {p.units.length ? (
            <section>
              <h2 className="font-display text-xl font-extrabold text-ink">Les lots</h2>
              <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-card">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="text-left text-xs uppercase text-muted"><tr><th className="p-3">Lot</th><th className="p-3">Pièces</th><th className="p-3">Surface</th><th className="p-3">Prix</th><th className="p-3" /></tr></thead>
                  <tbody>{p.units.map((u) => <tr key={u.label} className="border-t border-slate-100"><td className="p-3 font-semibold text-ink">{u.label}</td><td className="p-3">{u.rooms ?? "—"}</td><td className="p-3">{u.surface ? `${u.surface} m²` : "—"}</td><td className="p-3 font-bold">{u.price ? `${n(u.price)} F` : "Sur demande"}</td><td className="p-3 text-xs">{u.available ? <span className="text-emerald-700">Disponible</span> : <span className="text-muted">Vendu</span>}</td></tr>)}</tbody>
                </table>
              </div>
            </section>
          ) : null}
          {p.paymentPlan ? <section className="rounded-2xl bg-brand-50 p-5"><h2 className="font-bold text-brand-900">Plan de paiement</h2><p className="mt-1 whitespace-pre-line text-sm text-brand-900">{p.paymentPlan}</p></section> : null}
          {p.photos.length ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{/* eslint-disable-next-line @next/next/no-img-element */}{p.photos.map((u) => <img key={u} src={u} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" />)}</div> : null}
          <div className="flex flex-wrap gap-2">
            {p.videoUrl ? <a href={p.videoUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-ink ring-1 ring-slate-300">▶ Voir la vidéo</a> : null}
            {p.brochureUrl ? <a href={p.brochureUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-ink ring-1 ring-slate-300">📄 Brochure</a> : null}
          </div>
          <p className="text-xs text-muted">Moboo.ci met en relation acheteurs et promoteurs. Vérifiez toujours les documents (ACD, titre foncier, permis de construire) et versez les paiements sur le compte officiel du promoteur. <Link href="/programmes-neufs" className="underline">Autres programmes</Link></p>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200">
            <h2 className="font-display text-lg font-extrabold text-ink">Brochure, prix et disponibilités</h2>
            <p className="mb-4 text-sm text-muted">Le promoteur vous répond directement.</p>
            <ProgramLeadForm slug={p.slug} units={p.units.filter((u) => u.available).map((u) => u.label)} />
            {wa ? <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par le programme ${p.name} vu sur Moboo.ci.`)}`} target="_blank" rel="noopener noreferrer" className="mt-3 block rounded-xl bg-[#25D366] py-3 text-center font-bold text-white">WhatsApp du promoteur</a> : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
