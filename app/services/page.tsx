import type { Metadata } from "next";
import Link from "next/link";
import { getSiteServices, serviceHref } from "@/lib/site-services";

export const revalidate = 120;
export const metadata: Metadata = { title: "Services Moboo", description: "État des lieux, estimation de loyer ou de terrain, solvabilité du locataire : les services Moboo pour louer et acheter sereinement." };

export default async function ServicesIndex() {
  const { items } = await getSiteServices();
  return (
    <div className="container-page py-12">
      <h1 className="font-display text-3xl font-black text-ink">Services Moboo</h1>
      <p className="mt-2 text-muted">Des outils et des professionnels pour louer, acheter et gérer en toute confiance.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.map((o) => (
          <Link key={o.key} href={serviceHref(o.key)} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-card-hover">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-100 text-3xl">{o.icon}</span>
            <span><span className="block font-display text-lg font-bold text-ink">{o.title}</span><span className="block text-sm text-muted">{o.tagline}</span></span>
          </Link>
        ))}
        {!items.length ? <p className="text-muted">Aucun service disponible pour le moment.</p> : null}
      </div>
    </div>
  );
}
