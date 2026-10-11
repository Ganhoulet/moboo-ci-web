import Link from "next/link";
import { notFound } from "next/navigation";
import { ZoneGuideEditor } from "@/components/backoffice/zone-guide-editor";
import { getGuide } from "../../generateur/actions";

export const dynamic = "force-dynamic";

export default async function ZoneGuidePage({ params }: { params: { slug: string } }) {
  const g = await getGuide(params.slug);
  if (!g) notFound();
  return (
    <div className="space-y-4">
      <Link href="/admin/seo/quartiers" className="text-sm font-semibold text-brand-800 hover:underline">← Guides de quartier</Link>
      <h1 className="font-display text-2xl font-extrabold text-ink">Guide : {g.name}</h1>
      <ZoneGuideEditor initial={g} />
    </div>
  );
}
