import Link from "next/link";
import { getAm } from "../actions";
import { HealthBadge, Health } from "@/components/backoffice/am-health";

export const dynamic = "force-dynamic";

type Item = {
  id: string; name: string; city: string | null; phone: string | null; whatsappUrl: string | null;
  priority: number; why: string[]; action: string; message: string;
  offer: { code: string; label: string; detail: string } | null;
  health: Pick<Health, "score" | "level" | "label"> | null;
  stage: { key: string; label: string; rank: number; stuck: boolean; days: number } | null;
};

/** Appels du jour : les hôtes à appeler aujourd'hui, du plus urgent au moins urgent, avec l'offre à proposer. */
export default async function AmToday({ searchParams }: { searchParams: { scope?: string } }) {
  const scope = searchParams.scope === "all" ? "all" : "mine";
  const d = await getAm<{ scope: string; items: Item[] }>(`/today?scope=${scope}`);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Appels du jour indisponibles.</p>;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Appels du jour</h1>
        <p className="max-w-3xl text-sm text-muted">Les hôtes Moboo Resi à appeler aujourd’hui, du plus urgent au moins urgent : demandes Moboo.ci sans réponse, hôtes bloqués dans leur démarrage, santé à risque, comptes jamais contactés. Après l’appel, notez-le sur la fiche : l’hôte sort de la liste pendant 2 jours.</p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="?scope=mine" className={"rounded-full px-3 py-1 font-semibold " + (d.scope === "mine" ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>Mon portefeuille</Link>
        <Link href="?scope=all" className={"rounded-full px-3 py-1 font-semibold " + (d.scope === "all" ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>Toute l’équipe</Link>
        <span className="self-center text-xs text-muted">{d.items.length} appel{d.items.length > 1 ? "s" : ""}</span>
      </div>
      <ol className="space-y-3">
        {d.items.map((a, i) => (
          <li key={a.id} className={"rounded-lg bg-white p-4 ring-1 " + (a.priority >= 100 ? "ring-red-300" : "ring-slate-200")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted">#{i + 1}{a.city ? ` · ${a.city}` : ""}{a.stage && a.stage.key !== "done" ? ` · étape ${a.stage.rank}/5 : ${a.stage.label}` : ""}</p>
                <Link href={`/admin/comptes/org/${a.id}`} className="font-display text-lg font-bold text-brand-800 hover:underline">{a.name}</Link>
                {a.health ? <span className="ml-2 align-middle"><HealthBadge h={{ ...a.health, isNew: false, signals: [], actions: [] }} /></span> : null}
                <div className="mt-1 flex flex-wrap gap-1">{a.why.map((w) => <span key={w} className={"rounded-full px-2 py-0.5 text-[11px] font-semibold " + (/sans réponse|Bloqué|risque/i.test(w) ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800")}>{w}</span>)}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {a.phone ? <a href={`tel:${a.phone}`} className="rounded-full bg-brand-800 px-3 py-1.5 text-sm font-bold text-white">📞 Appeler</a> : null}
                {a.whatsappUrl ? <a href={a.whatsappUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[#25D366] px-3 py-1.5 text-sm font-bold text-white">WhatsApp</a> : null}
                <Link href={`/admin/comptes/org/${a.id}`} className="rounded-full px-3 py-1.5 text-sm font-semibold text-brand-800 ring-1 ring-slate-300">Noter l’appel</Link>
              </div>
            </div>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
              <p><span className="text-xs font-semibold uppercase tracking-wide text-muted">À faire</span><br />{a.action}</p>
              {a.offer ? <p><span className="text-xs font-semibold uppercase tracking-wide text-muted">Offre à proposer</span><br /><b>{a.offer.label}</b> — {a.offer.detail}</p> : null}
            </div>
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-xs font-semibold text-brand-800">Message WhatsApp proposé</summary>
              <p className="mt-1 whitespace-pre-line rounded-md bg-slate-50 p-3 text-slate-700">{a.message}</p>
            </details>
          </li>
        ))}
        {!d.items.length ? <li className="rounded-lg bg-white p-6 text-center text-sm text-muted ring-1 ring-slate-200">Personne à appeler en priorité aujourd’hui.</li> : null}
      </ol>
    </div>
  );
}
