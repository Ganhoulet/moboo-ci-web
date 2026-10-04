import Link from "next/link";
import { getScanStats } from "../actions";

export const dynamic = "force-dynamic";

const KIND: Record<string, string> = { agent: "Agents", agency: "Agences", listing: "Annonces", seo: "Pages SEO", unknown: "QR inconnus" };
const DEVICE: Record<string, string> = { android: "Android", ios: "iPhone", autre: "Autres" };

function Tile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-ink">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

/** Marketing terrain → Scans QR : combien de personnes scannent nos affiches, quoi, où. */
export default async function QrScans({ searchParams }: { searchParams: { days?: string } }) {
  const days = [7, 30, 90, 365].includes(Number(searchParams.days)) ? Number(searchParams.days) : 30;
  const s = await getScanStats(days);
  if (!s) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Statistiques indisponibles.</p>;
  const max = Math.max(1, ...s.series.map((d) => d.scans));
  const per = s.series.length ? (s.total / s.series.length).toFixed(1).replace(".", ",") : "0";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Scans QR</h1>
          <p className="max-w-3xl text-sm text-muted">Chaque scan d’un QR code Moboo (affiches d’agents, d’agences, d’annonces, de pages SEO, et QR imprimés depuis l’application) est compté. Les robots et aperçus de liens sont écartés ; un même téléphone n’est compté qu’une fois par 10 minutes et par affiche.</p>
        </div>
        <div className="flex overflow-hidden rounded-md ring-1 ring-slate-300">
          {[7, 30, 90, 365].map((d) => (
            <Link key={d} href={`/admin/affiches-qr/scans?days=${d}`} className={"px-3 py-1.5 text-sm font-semibold " + (d === days ? "bg-brand-700 text-white" : "bg-white text-slate-700 hover:bg-slate-50")}>{d === 365 ? "1 an" : `${d} j`}</Link>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Tile label="Scans" value={s.total} hint={`${per} par jour en moyenne`} />
        <Tile label="Téléphones différents" value={s.phones} hint={Object.entries(s.byDevice).map(([k, n]) => `${DEVICE[k] ?? k} ${n}`).join(" · ") || "—"} />
        <Tile label="Agents et agences" value={(s.byKind.agent ?? 0) + (s.byKind.agency ?? 0)} hint="profils" />
        <Tile label="Annonces" value={s.byKind.listing ?? 0} />
        <Tile label="Pages SEO" value={s.byKind.seo ?? 0} hint="affiches de rue" />
      </div>
      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Scans par jour</h2>
        <div className="flex h-40 items-end gap-[2px]" role="img" aria-label="Scans par jour">
          {s.series.map((d) => (
            <div key={d.day} title={`${d.day} : ${d.scans} scan(s)`} className="flex-1 rounded-t bg-[#0555CC]/80 hover:bg-[#FE6600]" style={{ height: `${Math.max(d.scans ? 4 : 1, (d.scans / max) * 100)}%`, opacity: d.scans ? 1 : 0.25 }} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted"><span>{s.series[0]?.day}</span><span>{s.series[s.series.length - 1]?.day}</span></div>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-2 font-display text-lg font-bold text-ink">Emplacements les plus scannés</h2>
          {s.placements.length ? (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-slate-500"><th className="py-1">Emplacement</th><th>Affiche</th><th className="text-right">Scans</th></tr></thead>
              <tbody>
                {s.placements.map((p) => (
                  <tr key={p.code} className="border-t border-slate-100">
                    <td className="py-1.5 pr-2 font-semibold text-ink">{p.placement}<span className="ml-1 font-mono text-[11px] font-normal text-slate-400">{p.code}</span></td>
                    <td className="pr-2 text-muted">{KIND[p.kind]?.replace(/s$/, "") ?? p.kind} · {p.label}</td>
                    <td className="text-right font-bold tabular-nums text-ink">{p.scans}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-sm text-muted">Aucun scan d’affiche avec emplacement sur la période. Indiquez l’emplacement au moment d’imprimer.</p>}
        </section>
        <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-2 font-display text-lg font-bold text-ink">QR codes les plus scannés</h2>
          {s.top.length ? (
            <ol className="space-y-1.5 text-sm">
              {s.top.map((t) => (
                <li key={`${t.kind}:${t.ref}`} className="flex items-center gap-2">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{KIND[t.kind]?.replace(/s$/, "") ?? t.kind}</span>
                  {t.href ? <Link href={t.href} className="min-w-0 flex-1 truncate font-semibold text-ink hover:underline">{t.label}</Link> : <span className="min-w-0 flex-1 truncate font-semibold text-ink">{t.label}</span>}
                  <span className="font-bold tabular-nums text-ink">{t.scans}</span>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-muted">Aucun scan sur la période.</p>}
        </section>
      </div>
    </div>
  );
}
