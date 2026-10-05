import Link from "next/link";
import { authedFetch } from "@/lib/server-api";

interface Opp {
  pro: boolean; zone: string; zoneSearches: number; top: { label: string; count: number }[];
  active: number; views30: number; inquiries30: number; pending: number; expiring: number; daysSinceLast: number | null;
  tips: { text: string; href: string; cta: string; tone: "urgent" | "info" }[];
}

/** Mon espace (professionnels) : la demande de leur quartier et les actions qui rapportent. */
export async function OpportunityCard() {
  const r = await authedFetch("/site/me/opportunities", { method: "GET" }).catch(() => null);
  const o: Opp | null = r?.ok ? r.data : null;
  if (!o?.pro) return null;
  const max = Math.max(1, ...o.top.map((t) => t.count));
  return (
    <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-900 p-5 text-white shadow-card">
        <p className="text-xs font-bold uppercase tracking-wide text-white/70">Demande dans votre zone · 7 jours</p>
        {o.zoneSearches >= 5 ? (
          <>
            <p className="mt-1 font-display text-2xl font-extrabold">{o.zoneSearches.toLocaleString("fr-FR")} recherches à {o.zone}</p>
            <ul className="mt-3 space-y-2">
              {o.top.map((t) => (
                <li key={t.label} className="text-sm">
                  <div className="flex justify-between gap-3"><span className="first-letter:uppercase">{t.label}</span><span className="tabular-nums text-white/80">{t.count}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/15"><div className="h-1.5 rounded-full bg-accent-400" style={{ width: `${Math.round((t.count / max) * 100)}%` }} /></div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-1 font-display text-xl font-extrabold">Des clients cherchent chaque jour sur Moboo.ci{o.zone ? ` et autour de ${o.zone}` : ""}.</p>
        )}
        <Link href="/mon-espace/annonces/nouvelle" className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-900 hover:bg-brand-50">+ Publier un bien qui correspond</Link>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-card">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">À faire pour recevoir plus de demandes</p>
        {o.tips.length ? (
          <ul className="mt-3 space-y-2.5">
            {o.tips.slice(0, 4).map((t) => (
              <li key={t.href + t.text} className="flex items-start gap-3 text-sm">
                <span className={"mt-1.5 h-2 w-2 shrink-0 rounded-full " + (t.tone === "urgent" ? "bg-red-500" : "bg-brand-500")} />
                <span className="flex-1 text-slate-700">{t.text}</span>
                <Link href={t.href} className="shrink-0 font-semibold text-brand-800 hover:underline">{t.cta} →</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">Tout est à jour, bravo ! Continuez à publier régulièrement : les annonces récentes remontent en tête des résultats.</p>
        )}
      </div>
    </section>
  );
}
