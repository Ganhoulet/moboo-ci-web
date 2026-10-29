import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getQuickPage } from "./actions";
import { QuickPublish } from "@/components/quick-publish";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Publier mon bien en 1 minute", robots: { index: false } };

/** Lien de publication rapide partagé dans les groupes WhatsApp. */
export default async function QuickPage({ params }: { params: { slug: string } }) {
  const page = await getQuickPage(params.slug);
  if (!page) notFound();
  const s = getSession();
  return (
    <QuickPublish page={page} account={s ? { firstName: s.firstName ?? null, accountType: s.accountType ?? "particulier", onboarded: !!s.onboarded } : null} />
  );
}
