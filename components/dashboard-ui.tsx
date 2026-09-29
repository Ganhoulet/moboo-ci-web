import Link from "next/link";
import { MOBOO_APPS } from "@/lib/accounts";

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
        {sub ? <p className="mt-1 text-sm text-muted">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "brand", href }: {
  label: string; value: string | number; hint?: string; tone?: "brand" | "accent" | "emerald" | "violet"; href?: string;
}) {
  const tones = {
    brand: "from-brand-50 to-white text-brand-800",
    accent: "from-accent-50 to-white text-accent-700",
    emerald: "from-emerald-50 to-white text-emerald-700",
    violet: "from-violet-50 to-white text-violet-700",
  } as const;
  const body = (
    <div className={`h-full rounded-2xl bg-gradient-to-br p-4 shadow-card transition ${tones[tone]} ${href ? "hover:shadow-card-hover" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold text-ink">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/** Histogramme des vues par jour (+ points = demandes), en SVG pur. */
export function ViewsChart({ series }: { series: { day: string; views: number; inquiries: number; calls?: number; whatsapp?: number }[] }) {
  const W = 700, H = 180, pad = 24;
  const max = Math.max(4, ...series.map((s) => s.views));
  const bw = (W - pad * 2) / Math.max(1, series.length);
  const fmt = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="mb-2 flex items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-600" /> Vues</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent-600" /> Demandes</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Appels / WhatsApp</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="h-auto w-full" role="img" aria-label="Vues, demandes et clics de contact par jour">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={pad} x2={W - pad} y1={H - (H - 10) * f} y2={H - (H - 10) * f} stroke="#e2e8f0" strokeDasharray="3 4" />
        ))}
        {series.map((s, i) => {
          const h = (s.views / max) * (H - 10);
          const x = pad + i * bw;
          const direct = (s.calls ?? 0) + (s.whatsapp ?? 0);
          return (
            <g key={s.day}>
              <rect x={x + bw * 0.15} y={H - h} width={bw * 0.7} height={Math.max(h, s.views ? 2 : 0)} rx={Math.min(3, bw * 0.3)} className="fill-brand-600">
                <title>{`${fmt(s.day)} : ${s.views} vue(s), ${s.inquiries} demande(s), ${s.calls ?? 0} appel(s), ${s.whatsapp ?? 0} WhatsApp`}</title>
              </rect>
              {s.inquiries ? <circle cx={x + bw / 2} cy={H - h - 7} r={3.5} className="fill-accent-600" /> : null}
              {direct ? <circle cx={x + bw / 2} cy={H - h - (s.inquiries ? 16 : 7)} r={3.5} className="fill-emerald-500" /> : null}
            </g>
          );
        })}
        <line x1={pad} x2={W - pad} y1={H} y2={H} stroke="#cbd5e1" />
        {series.length ? (
          <>
            <text x={pad} y={H + 16} className="fill-slate-400 text-[11px]">{fmt(series[0].day)}</text>
            <text x={W - pad} y={H + 16} textAnchor="end" className="fill-slate-400 text-[11px]">{fmt(series[series.length - 1].day)}</text>
            <text x={pad} y={12} className="fill-slate-400 text-[11px]">{max}</text>
          </>
        ) : null}
      </svg>
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/** Hôtes (résidences meublées / espaces) : publication et réservations via les applis. */
export function HostApps({ subtype }: { subtype?: string | null }) {
  const apps = subtype === "residences" ? [MOBOO_APPS.resi] : subtype === "espaces" ? [MOBOO_APPS.event] : [MOBOO_APPS.resi, MOBOO_APPS.event];
  return (
    <section>
      <h2 className="font-display text-xl font-extrabold text-ink">Vos logements et espaces</h2>
      <p className="mt-1 text-sm text-muted">
        Ils se publient et se gèrent dans nos applis gratuites. Dès que vous activez « Visible sur
        Moboo.ci », ils apparaissent sur le site et les voyageurs réservent en ligne.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {apps.map((a) => (
          <div key={a.name} className="rounded-2xl bg-white p-5 shadow-card">
            <p className="font-display text-lg font-bold text-ink">{a.name}</p>
            <p className="mt-1 text-sm text-muted">Pour vos {a.what}.</p>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
              {["Réservations Moboo.ci reçues et confirmées gratuitement", "Calendrier et dates bloquées synchronisés", "Acompte sécurisé et code d'arrivée"].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <svg className="mt-0.5 shrink-0 text-accent-600" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="m5 12 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={a.play} target="_blank" rel="noopener noreferrer" className="btn-primary bg-accent-600 px-4 hover:bg-accent-700">Android</a>
              <a href={a.page} target="_blank" rel="noopener noreferrer" className="btn-ghost px-4">iPhone, ordinateur…</a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "En ligne", cls: "bg-emerald-50 text-emerald-700" },
  SOLD: { label: "Vendu", cls: "bg-slate-100 text-slate-600" },
  RENTED: { label: "Loué", cls: "bg-slate-100 text-slate-600" },
  DISABLED: { label: "Masquée", cls: "bg-amber-50 text-amber-700" },
};

export const fmtXOF = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
