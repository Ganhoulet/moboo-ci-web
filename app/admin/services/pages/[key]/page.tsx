import Link from "next/link";
import { notFound } from "next/navigation";
import { getServices } from "../../actions";
import type { ServicesConfig } from "@/lib/moboo-services";
import { SERVICE_LABEL, SERVICE_SLUG, serviceHref, type ServiceKey } from "@/lib/site-services";
import { ServicePageEditor } from "@/components/backoffice/service-page-editor";

export const dynamic = "force-dynamic";

export default async function ServicePageEdit({ params }: { params: { key: string } }) {
  if (!(params.key in SERVICE_SLUG)) notFound();
  const key = params.key as ServiceKey;
  const cfg = await getServices<ServicesConfig>("/config");
  const page = cfg?.site.pages?.[key];
  if (!cfg || !page) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Page indisponible.</p>;
  const title = cfg.site.tiles[key]?.title || SERVICE_LABEL[key];
  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/services/pages" className="text-sm text-brand-700">← Pages des services</Link>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">{title}</h1>
      </div>
      <ServicePageEditor serviceKey={key} title={title} initial={page} href={serviceHref(key)} />
    </div>
  );
}
