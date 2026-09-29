"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreativeView, type Creative } from "./creative";
import { PLACEMENTS } from "./campaign-editor";
import { deleteCampaignAction, duplicateCampaignAction, toggleCampaignAction, type Campaign } from "@/app/admin/marketing/actions";

const state = (c: Campaign) => {
  const now = Date.now();
  if (!c.active) return { label: "En pause", cls: "bg-slate-100 text-slate-600" };
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return { label: "Programmée", cls: "bg-amber-100 text-amber-800" };
  if (c.endsAt && new Date(c.endsAt).getTime() <= now) return { label: "Terminée", cls: "bg-slate-100 text-slate-500" };
  return { label: "En ligne", cls: "bg-emerald-100 text-emerald-800" };
};
const d = (s: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "");

/** Campagnes marketing : aperçu, statut, période, statistiques, actions. */
export function CampaignList({ items }: { items: Campaign[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });
  const totals = items.reduce((t, c) => ({ views: t.views + c.views, clicks: t.clicks + c.clicks }), { views: 0, clicks: 0 });
  const live = items.filter((c) => state(c).label === "En ligne").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Marketing</h1>
          <p className="text-sm text-muted">Bannières, flyers et pop-ups diffusés dans l’application Moboo.ci et sur le site.</p>
        </div>
        <Link href="/admin/marketing/nouvelle" className="rounded-md bg-accent-600 px-5 py-2 text-sm font-bold text-white hover:bg-accent-700">+ Nouvelle campagne</Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[["Campagnes en ligne", live], ["Vues", totals.views], ["Clics", totals.clicks], ["Taux de clic", totals.views ? `${((totals.clicks / totals.views) * 100).toFixed(1)} %` : "—"]].map(([l, v]) => (
          <div key={l as string} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{l}</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink">{typeof v === "number" ? v.toLocaleString("fr-FR") : v}</p>
          </div>
        ))}
      </div>

      {!items.length ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-semibold text-ink">Aucune campagne</p>
          <p className="mt-1 text-sm text-muted">Créez une bannière ou un pop-up pour annoncer un événement, une offre ou une nouveauté.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {items.map((c) => {
            const s = state(c);
            const popup = c.placements.some((p) => p.endsWith("popup")) && !c.placements.some((p) => p.endsWith("banner"));
            return (
              <div key={c.id} className="flex flex-col overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                <Link href={`/admin/marketing/${c.id}`} className={"block bg-slate-50 p-4 " + (popup ? "px-16" : "")}>
                  <CreativeView c={c as Creative} variant={popup ? "popup" : "banner"} />
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/admin/marketing/${c.id}`} className="font-semibold text-ink hover:underline">{c.name}</Link>
                    <span className={"shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold " + s.cls}>{s.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {c.placements.map((p) => <span key={p} className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-800">{PLACEMENTS.find((x) => x.id === p)?.label ?? p}</span>)}
                  </div>
                  <p className="text-xs text-muted">{c.startsAt || c.endsAt ? `Du ${d(c.startsAt) || "maintenant"} au ${d(c.endsAt) || "—"}` : "Sans limite de date"}</p>
                  <p className="text-sm text-slate-700"><strong>{c.views.toLocaleString("fr-FR")}</strong> vues · <strong>{c.clicks.toLocaleString("fr-FR")}</strong> clics{c.views ? ` (${((c.clicks / c.views) * 100).toFixed(1)} %)` : ""}{c.dismissals ? ` · ${c.dismissals} « ne plus afficher »` : ""}</p>
                  <div className="mt-auto flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-sm font-semibold">
                    <Link href={`/admin/marketing/${c.id}`} className="text-brand-800">Modifier</Link>
                    <button type="button" disabled={pending} onClick={() => run(() => toggleCampaignAction(c.id, !c.active))} className="text-slate-700">{c.active ? "Mettre en pause" : "Activer"}</button>
                    <button type="button" disabled={pending} onClick={() => run(() => duplicateCampaignAction(c.id))} className="text-slate-700">Dupliquer</button>
                    <button type="button" disabled={pending} onClick={() => window.confirm("Supprimer cette campagne ?") && run(() => deleteCampaignAction(c.id))} className="ml-auto text-red-600">Supprimer</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
