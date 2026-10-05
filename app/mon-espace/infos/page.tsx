import type { Metadata } from "next";
import { authedFetch } from "@/lib/server-api";
import type { SiteNotice } from "@/lib/notices";
import { InfoList } from "@/components/notices/info-list";

export const metadata: Metadata = { title: "Infos Moboo", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Mon espace → Infos Moboo : messages de l'équipe Moboo.ci et conseils personnalisés. */
export default async function Infos() {
  const r = await authedFetch("/site/me/notices", { method: "GET" });
  const items: SiteNotice[] = r.ok ? r.data.items : [];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Infos Moboo</h1>
        <p className="mt-1 text-sm text-muted">Nouveautés, conseils et messages de l’équipe Moboo.ci pour vous.</p>
      </div>
      <InfoList items={items} />
    </div>
  );
}
