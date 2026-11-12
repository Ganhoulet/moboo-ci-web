import Link from "next/link";
import { getServices } from "../actions";
import type { ServicesConfig } from "@/lib/moboo-services";
import { SERVICE_LABEL, SERVICE_SLUG, type ServiceKey } from "@/lib/site-services";

export const dynamic = "force-dynamic";

/** Services Moboo → Pages des services : la page détaillée de chaque service (photos, onglets, tarifs, formulaire). */
export default async function ServicePages() {
  const cfg = await getServices<ServicesConfig>("/config");
  if (!cfg) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Réglages indisponibles.</p>;
  const keys = cfg.site.order.filter((k) => k in SERVICE_SLUG) as ServiceKey[];
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Pages des services</h1>
        <p className="max-w-3xl text-sm text-muted">Chaque service du carrousel « Nos services » ouvre sa page. Une page détaillée ajoute une grande photo, des onglets, les étapes, les tarifs, une galerie, des questions fréquentes et les questions du formulaire. Nettoyage à domicile, Conciergerie et État des lieux sont déjà remplis : modifiez-les à votre goût.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {keys.map((k) => {
          const t = cfg.site.tiles[k];
          const p = cfg.site.pages?.[k];
          return (
            <Link key={k} href={`/admin/services/pages/${k}`} className="flex gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-brand-400">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p?.heroImage ? <img src={p.heroImage} alt="" className="h-16 w-20 shrink-0 rounded-md object-cover" /> : <span className="grid h-16 w-20 shrink-0 place-items-center rounded-md bg-slate-100 text-2xl">{t?.icon}</span>}
              <span className="min-w-0">
                <span className="block font-display font-bold text-ink">{t?.title || SERVICE_LABEL[k]}</span>
                <span className="mt-1 flex flex-wrap gap-1 text-[11px] font-semibold">
                  <span className={"rounded-full px-2 py-0.5 " + (p?.enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600")}>{p?.enabled ? "Page détaillée" : "Page simple"}</span>
                  {!t?.enabled ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">Service masqué</span> : null}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
      <p className="text-xs text-muted">Pour afficher ou masquer un service dans le carrousel, changer son ordre, son titre ou son prix : <Link href="/admin/services/reglages?tab=site" className="font-semibold underline">Réglages › Services du site</Link>.</p>
    </div>
  );
}
