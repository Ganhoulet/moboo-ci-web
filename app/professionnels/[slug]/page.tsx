import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProPage } from "@/components/pros/pro-page";
import { getProPage } from "@/lib/pros";
import { PRO_PAGES, type ProSlug } from "@/lib/pro-blocks";

export const dynamic = "force-dynamic";

const slugOf = (path: string) => PRO_PAGES.find((p) => p.path === `/professionnels/${path}`)?.slug as ProSlug | undefined;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = slugOf(params.slug);
  if (!slug) return {};
  const { meta } = await getProPage(slug);
  return { title: meta.title, description: meta.description, alternates: { canonical: `/professionnels/${params.slug}` }, openGraph: { title: meta.title, description: meta.description } };
}

/** Page d'un profil professionnel (agents, agences, propriétaires, résidences, espaces). */
export default function ProfessionnelsPage({ params, searchParams }: { params: { slug: string }; searchParams: { apercu?: string } }) {
  const slug = slugOf(params.slug);
  if (!slug) notFound();
  return <ProPage slug={slug} preview={searchParams.apercu === "1"} />;
}
