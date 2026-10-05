import Link from "next/link";
import { NOTICE_TONE } from "@/lib/notice-tone";
import { listNotices } from "./actions";

export const dynamic = "force-dynamic";

const STATUS: Record<string, [string, string]> = {
  draft: ["Brouillon", "bg-slate-100 text-slate-600"],
  published: ["Publié", "bg-emerald-100 text-emerald-700"],
  archived: ["Archivé", "bg-slate-200 text-slate-500"],
};
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : "—");

/** Centre marketing → Informations ciblées (agents, propriétaires, locataires, acheteurs…). */
export default async function Notices() {
  const d = await listNotices();
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Informations indisponibles.</p>;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Informations ciblées</h1>
          <p className="max-w-3xl text-sm text-muted">Informez les agents, agences, propriétaires, locataires, acheteurs ou simples visiteurs directement sur Moboo.ci : bandeau en haut du site, fenêtre à l’ouverture, ou boîte « Infos Moboo » de leur espace (avec pastille « nouveau »). Choisissez le public, la ville ou la commune et la période d’affichage.</p>
        </div>
        <Link href="/admin/centre-marketing/informations/nouvelle" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Nouveau message</Link>
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-2">Message</th><th className="px-3 py-2">Public</th><th className="px-3 py-2">Emplacement</th><th className="px-3 py-2">Statut</th><th className="px-3 py-2 text-right">Vues</th><th className="px-3 py-2 text-right">Clics</th><th className="px-3 py-2 text-right">Lus (espace)</th></tr>
          </thead>
          <tbody>
            {d.items.map((n) => {
              const [l, cls] = STATUS[n.status] ?? STATUS.draft;
              const tone = NOTICE_TONE[n.kind] ?? NOTICE_TONE.info;
              return (
                <tr key={n.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-2">
                    <Link href={`/admin/centre-marketing/informations/${n.id}`} className="font-semibold text-ink hover:underline">{tone.icon} {n.title}</Link>
                    {n.places.length ? <p className="text-xs text-muted">📍 {n.places.join(", ")}</p> : null}
                  </td>
                  <td className="px-3 py-2 text-xs">{n.audiences.length ? n.audiences.map((a) => d.audiences[a] ?? a).join(", ") : "Tout le monde"}</td>
                  <td className="px-3 py-2 text-xs">{n.placements.map((p) => d.placements[p] ?? p).join(", ")}</td>
                  <td className="px-3 py-2">
                    <span className={"rounded px-1.5 py-0.5 text-[11px] font-semibold " + cls}>{l}</span>
                    {n.status === "published" && !n.live ? <p className="mt-1 text-[11px] text-amber-700">hors période</p> : null}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{n.views}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{n.clicks} <span className="text-xs text-muted">({pct(n.clicks, n.views)})</span></td>
                  <td className="px-3 py-2 text-right tabular-nums">{n.placements.includes("espace") ? n.reads : "—"}</td>
                </tr>
              );
            })}
            {!d.items.length ? <tr><td colSpan={7} className="p-6 text-center text-muted">Aucun message pour le moment.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
