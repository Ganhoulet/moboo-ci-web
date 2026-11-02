import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceProvider, zoneLabel } from "@/lib/service-ads";
import { ServiceLeadForm } from "@/components/service-lead-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getServiceProvider(params.slug);
  if (!p) return { title: "Prestataire" };
  return { title: `${p.name} — ${p.category}`, description: p.tagline ?? p.description?.slice(0, 155) ?? undefined, robots: { index: true } };
}

const digits = (s: string | null) => (s ?? "").replace(/\D/g, "");

/** Mini-page d'un prestataire (cartes « Sponsorisé » des résultats) : présentation, appel, WhatsApp, demande de devis. */
export default async function ProviderPage({ params, searchParams }: { params: { slug: string }; searchParams: { ad?: string } }) {
  const p = await getServiceProvider(params.slug);
  if (!p) notFound();
  const adId = /^[0-9a-f-]{36}$/i.test(searchParams.ad ?? "") ? searchParams.ad : undefined;
  const wa = digits(p.whatsapp || p.phone);
  const tel = digits(p.phone || p.whatsapp);
  const waText = `Bonjour ${p.name}, je vous contacte depuis Moboo.ci pour un devis.`;
  return (
    <div className="pb-16">
      <div className="relative h-44 bg-slate-200 sm:h-64">
        {p.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : <div className="h-full w-full bg-gradient-to-br from-brand-800 to-brand-900" />}
        <span className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">Partenaire sponsorisé</span>
      </div>
      <div className="container-page">
        <div className="-mt-12 flex items-end gap-4">
          {p.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.logoUrl} alt="" className="h-24 w-24 rounded-2xl bg-white object-cover shadow-lg ring-4 ring-white" />
          ) : <span className="grid h-24 w-24 place-items-center rounded-2xl bg-brand-800 text-3xl font-extrabold text-white ring-4 ring-white">{p.name.charAt(0)}</span>}
          <div className="pb-1">
            <p className="text-sm font-semibold text-brand-800">{p.category}</p>
            <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{p.name}</h1>
          </div>
        </div>
        {p.tagline ? <p className="mt-3 text-lg text-ink">{p.tagline}</p> : null}

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {tel ? <a href={`/api/service-ads/contact?s=${p.slug}&to=tel&n=${tel}`} className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 font-bold text-white">📞 Appeler</a> : null}
              {wa ? <a href={`/api/service-ads/contact?s=${p.slug}&to=wa&n=${wa}&t=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 font-bold text-white">WhatsApp</a> : null}
              {p.website ? <a href={p.website} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-ink ring-1 ring-slate-300">Site web ↗</a> : null}
            </div>
            {p.description ? <div className="whitespace-pre-line rounded-2xl bg-white p-5 text-sm leading-relaxed text-ink shadow-card">{p.description}</div> : null}
            {p.zones.length ? (
              <div>
                <h2 className="font-bold text-ink">Zones d’intervention</h2>
                <div className="mt-2 flex flex-wrap gap-2">{p.zones.map((z) => <span key={z} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-ink">{zoneLabel(z)}</span>)}</div>
              </div>
            ) : null}
            {p.photos.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.photos.map((u) => <img key={u} src={u} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" />)}
              </div>
            ) : null}
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200">
              <h2 className="font-display text-lg font-extrabold text-ink">Demander un devis</h2>
              <p className="mb-4 text-sm text-muted">Gratuit et sans engagement.</p>
              <ServiceLeadForm slug={p.slug} providerName={p.name} adId={adId} />
            </div>
          </aside>
        </div>

        {p.others.length ? (
          <section className="mt-12">
            <h2 className="font-display text-xl font-extrabold text-ink">Autres prestataires · {p.category}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {p.others.map((o) => (
                <Link key={o.slug} href={`/prestataires/${o.slug}`} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-200 hover:ring-brand-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {o.logoUrl ? <img src={o.logoUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-800 font-bold text-white">{o.name.charAt(0)}</span>}
                  <span className="min-w-0"><span className="block truncate font-bold text-ink">{o.name}</span><span className="block truncate text-xs text-muted">{o.tagline}</span></span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <p className="mt-12 rounded-2xl bg-brand-50 p-4 text-sm text-brand-900">
          Vous êtes prestataire (déménagement, nettoyage, aménagement…) ? <Link href="/mon-espace/publicite-services" className="font-bold underline">Faites votre publicité sur Moboo.ci</Link>
        </p>
      </div>
    </div>
  );
}
