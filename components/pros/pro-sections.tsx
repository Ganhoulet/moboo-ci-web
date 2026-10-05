import Link from "next/link";
import type { Section } from "@/lib/page-blocks";
import { PRO_PAGES } from "@/lib/pro-blocks";
import type { ProStats } from "@/lib/pros";
import { getHelpAudience } from "@/lib/help";
import { ProLeadForm } from "./pro-lead-form";

/* Rendu des blocs de l'espace professionnels (façon Zillow Partners). */

const BG: Record<string, string> = {
  white: "bg-white", soft: "bg-slate-50", brand: "bg-gradient-to-br from-brand-800 to-brand-900 text-white", dark: "bg-[#0f1b33] text-white",
};
const isDark = (b?: string) => b === "brand" || b === "dark";
const fmt = (n: number) => n.toLocaleString("fr-FR");

function Btn({ href, label, kind = "primary", dark = false }: { href?: string; label?: string; kind?: "primary" | "secondary"; dark?: boolean }) {
  if (!href || !label) return null;
  const cls = kind === "primary"
    ? "rounded-full bg-accent-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-accent-600/20 hover:bg-accent-700"
    : dark ? "rounded-full px-6 py-3 text-sm font-bold text-white ring-1 ring-white/40 hover:bg-white/10" : "rounded-full bg-white px-6 py-3 text-sm font-bold text-ink ring-1 ring-slate-300 hover:bg-slate-50";
  return /^https?:/.test(href) ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{label}</a> : <Link href={href} className={cls}>{label}</Link>;
}

function Head({ title, subtitle, dark, center = true }: { title?: string; subtitle?: string; dark?: boolean; center?: boolean }) {
  if (!title && !subtitle) return null;
  return (
    <div className={(center ? "mx-auto max-w-3xl text-center " : "") + "mb-10"}>
      {title ? <h2 className={"font-display text-3xl font-extrabold leading-tight sm:text-4xl " + (dark ? "text-white" : "text-ink")}>{title}</h2> : null}
      {subtitle ? <p className={"mt-3 text-lg " + (dark ? "text-white/80" : "text-slate-600")}>{subtitle}</p> : null}
    </div>
  );
}

function Shot({ src, alt }: { src?: string; alt: string }) {
  if (!src) return null;
  return (
    <div className="relative">
      <div className="absolute -inset-3 -z-10 rounded-[28px] bg-gradient-to-br from-brand-100 via-white to-accent-100 blur-sm" />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-2"><span className="h-2.5 w-2.5 rounded-full bg-red-300" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" /></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className="block w-full" />
      </div>
    </div>
  );
}

export async function ProSection({ s, stats, slug }: { s: Section; stats: ProStats | null; slug: string }) {
  const p = s.props ?? {};
  const dark = isDark(p.background);
  const wrap = (children: React.ReactNode, pad = "py-16 sm:py-20") => (
    <section id={`section-${s.id}`} className={`${BG[p.background] ?? BG.white} ${pad} scroll-mt-20`}><div className="container-page">{children}</div></section>
  );

  switch (s.type) {
    case "proHero":
      return (
        <section id={`section-${s.id}`} className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white">
          <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-accent-500/25 blur-3xl" />
          <div className="absolute -bottom-40 left-0 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="container-page relative py-14 sm:py-20">
            {p.showTabs ? (
              <nav className="mb-10 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Profils professionnels">
                {PRO_PAGES.map((x) => (
                  <Link key={x.slug} href={x.path} className={"shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition " + (x.slug === slug ? "bg-white text-brand-900" : "bg-white/10 text-white hover:bg-white/20")}>{x.short}</Link>
                ))}
              </nav>
            ) : null}
            <div className={"grid items-center gap-12 " + (p.image ? "lg:grid-cols-[1.05fr_1fr]" : "")}>
              <div className={p.image ? "" : "mx-auto max-w-3xl text-center"}>
                {p.eyebrow ? <p className="text-sm font-bold uppercase tracking-widest text-accent-300">{p.eyebrow}</p> : null}
                <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">{p.title}</h1>
                {p.subtitle ? <p className="mt-5 max-w-xl text-lg text-white/85 sm:text-xl">{p.subtitle}</p> : null}
                <div className={"mt-8 flex flex-wrap gap-3 " + (p.image ? "" : "justify-center")}>
                  <Btn href={p.primaryHref} label={p.primaryLabel} />
                  <Btn href={p.secondaryHref} label={p.secondaryLabel} kind="secondary" dark />
                </div>
              </div>
              {p.image ? <div className="hidden lg:block"><Shot src={p.image} alt={p.title} /></div> : null}
            </div>
          </div>
        </section>
      );

    case "proStats": {
      const items = (p.items ?? []).map((i: any) => ({ label: i.label, value: i.source && i.source !== "text" && stats ? (stats as any)[i.source] : i.value }))
        .filter((i: any) => i.value !== undefined && i.value !== null && i.value !== "" && i.value !== 0);
      if (!items.length) return null;
      return wrap(
        <>
          <Head title={p.title} dark={dark} />
          <div className={"grid gap-6 text-center " + (items.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
            {items.map((i: any, k: number) => (
              <div key={k}>
                <p className={"font-display text-4xl font-extrabold sm:text-5xl " + (dark ? "text-white" : "text-brand-800")}>{typeof i.value === "number" ? fmt(i.value) : i.value}</p>
                <p className={"mt-1 text-sm " + (dark ? "text-white/75" : "text-slate-600")}>{i.label}</p>
              </div>
            ))}
          </div>
          {p.note ? <p className={"mt-6 text-center text-xs " + (dark ? "text-white/60" : "text-muted")}>{p.note}</p> : null}
        </>, "py-12",
      );
    }

    case "proFeatures":
    case "proAudiences": {
      const cols = s.type === "proAudiences" ? "sm:grid-cols-2 lg:grid-cols-5" : p.columns === "4" ? "sm:grid-cols-2 lg:grid-cols-4" : p.columns === "2" ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
      return wrap(
        <>
          <Head title={p.title} subtitle={p.subtitle} dark={dark} />
          <div className={`grid gap-5 ${cols}`}>
            {(p.items ?? []).map((i: any, k: number) => {
              const body = (
                <>
                  {i.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.image} alt="" className="mb-4 h-32 w-full rounded-xl object-cover" />
                  ) : i.icon ? <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-2xl">{i.icon}</span> : null}
                  <h3 className="mt-4 font-display text-lg font-bold text-ink">{i.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{i.text}</p>
                  {i.href ? <span className="mt-4 inline-block text-sm font-semibold text-brand-700 group-hover:underline">{s.type === "proAudiences" ? "Découvrir →" : "En savoir plus →"}</span> : null}
                </>
              );
              const card = "group block h-full rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100 transition";
              return i.href
                ? <Link key={k} href={i.href} className={card + " hover:-translate-y-0.5 hover:shadow-lg hover:ring-brand-200"}>{body}</Link>
                : <div key={k} className={card}>{body}</div>;
            })}
          </div>
        </>,
      );
    }

    case "proSplit": {
      const left = p.imageSide === "left";
      return wrap(
        <div className={"grid items-center gap-12 lg:grid-cols-2"}>
          <div className={left ? "lg:order-2" : ""}>
            {p.eyebrow ? <p className={"text-sm font-bold uppercase tracking-widest " + (dark ? "text-accent-300" : "text-accent-700")}>{p.eyebrow}</p> : null}
            <h2 className={"mt-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl " + (dark ? "text-white" : "text-ink")}>{p.title}</h2>
            {p.text ? <p className={"mt-4 text-lg leading-relaxed " + (dark ? "text-white/80" : "text-slate-600")}>{p.text}</p> : null}
            {p.bullets?.length ? (
              <ul className="mt-6 space-y-3">
                {p.bullets.map((b: any, k: number) => (
                  <li key={k} className={"flex items-start gap-3 " + (dark ? "text-white" : "text-ink")}>
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-xs font-bold text-white">✓</span>
                    <span className="font-medium">{b.text}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {p.ctaLabel ? <div className="mt-8"><Btn href={p.ctaHref} label={p.ctaLabel} /></div> : null}
          </div>
          <div className={left ? "lg:order-1" : ""}><Shot src={p.image} alt={p.title} /></div>
        </div>,
      );
    }

    case "proProducts":
      return wrap(
        <>
          <Head title={p.title} subtitle={p.subtitle} dark={dark} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(p.items ?? []).map((i: any, k: number) => (
              <div key={k} className={"relative flex flex-col rounded-2xl bg-white p-6 shadow-card ring-1 " + (i.badge ? "ring-2 ring-accent-500" : "ring-slate-100")}>
                {i.badge ? <span className="absolute -top-3 left-6 rounded-full bg-accent-600 px-3 py-1 text-xs font-bold text-white">{i.badge}</span> : null}
                <span className="text-3xl">{i.icon}</span>
                <h3 className="mt-3 font-display text-xl font-bold text-ink">{i.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{i.text}</p>
                {i.price ? <p className="mt-4 font-display text-lg font-extrabold text-brand-800">{i.price}</p> : null}
                {i.ctaLabel && i.href ? <Link href={i.href} className="mt-5 inline-flex w-fit rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-800 hover:bg-brand-100">{i.ctaLabel} →</Link> : null}
              </div>
            ))}
          </div>
        </>,
      );

    case "proSteps":
      return wrap(
        <>
          <Head title={p.title} dark={dark} />
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(p.items ?? []).map((i: any, k: number) => (
              <li key={k} className="relative rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-800 font-display text-lg font-extrabold text-white">{k + 1}</span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{i.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{i.text}</p>
              </li>
            ))}
          </ol>
          {p.ctaLabel ? <div className="mt-10 text-center"><Btn href={p.ctaHref} label={p.ctaLabel} /></div> : null}
        </>,
      );

    case "proTestimonials":
      if (!(p.items ?? []).length) return null;
      return wrap(
        <>
          <Head title={p.title} dark={dark} />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {p.items.map((i: any, k: number) => (
              <figure key={k} className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
                <blockquote className="text-slate-700">« {i.quote} »</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  {i.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 font-bold text-brand-800">{String(i.name || "?").charAt(0)}</span>}
                  <span><span className="block font-semibold text-ink">{i.name}</span><span className="block text-xs text-muted">{i.role}</span></span>
                </figcaption>
              </figure>
            ))}
          </div>
        </>,
      );

    case "proGuides": {
      const auto = p.helpAudience ? await getHelpAudience(p.helpAudience) : null;
      const guides = [
        ...(p.items ?? []).filter((i: any) => i.title && i.href),
        ...(auto?.sections.flatMap((x) => x.guides) ?? []).slice(0, Math.max(0, Number(p.limit) || 0)).map((g) => ({ title: g.title, text: g.summary, href: `/aide/article/${g.slug}` })),
      ];
      if (!guides.length) return null;
      return wrap(
        <>
          <Head title={p.title} subtitle={p.subtitle} dark={dark} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((g: any, k: number) => (
              <Link key={k} href={g.href} className="group flex h-full flex-col rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 transition hover:ring-brand-300">
                <span className="text-xs font-bold uppercase tracking-wide text-accent-700">Guide</span>
                <span className="mt-1 font-display text-lg font-bold text-ink group-hover:text-brand-800">{g.title}</span>
                {g.text ? <span className="mt-1 flex-1 text-sm text-slate-600">{g.text}</span> : null}
                <span className="mt-3 text-sm font-semibold text-brand-700">Lire →</span>
              </Link>
            ))}
          </div>
          {p.helpAudience ? <p className="mt-8 text-center"><Link href={`/aide/${p.helpAudience}`} className="font-semibold text-brand-700 hover:underline">Tous les guides dans le centre d’aide →</Link></p> : null}
        </>,
      );
    }

    case "proFaq":
      if (!(p.items ?? []).length) return null;
      return wrap(
        <div className="mx-auto max-w-3xl">
          <Head title={p.title} dark={dark} />
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100">
            {p.items.map((i: any, k: number) => (
              <details key={k} className="group px-6 py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {i.q}<span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-45">+</span>
                </summary>
                <p className="pb-5 text-slate-600">{i.a}</p>
              </details>
            ))}
          </div>
        </div>,
      );

    case "proLeadForm":
      return (
        <section id="contact" className={`${BG[p.background] ?? BG.brand} scroll-mt-20 py-16 sm:py-20`}>
          <div className="container-page grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className={"font-display text-3xl font-extrabold leading-tight sm:text-4xl " + (dark ? "text-white" : "text-ink")}>{p.title}</h2>
              {p.text ? <p className={"mt-4 text-lg " + (dark ? "text-white/80" : "text-slate-600")}>{p.text}</p> : null}
              <ul className={"mt-6 space-y-2 text-sm " + (dark ? "text-white/85" : "text-slate-700")}>
                <li>✓ Présentation des solutions adaptées à votre activité</li>
                <li>✓ Aide à la création du compte et des premières annonces</li>
                <li>✓ Sans engagement</li>
              </ul>
            </div>
            <ProLeadForm audience={p.audience || "agents"} button={p.button || "Être rappelé"} dark={dark} />
          </div>
        </section>
      );

    case "proCta":
      return wrap(
        <div className="mx-auto max-w-3xl text-center">
          <h2 className={"font-display text-3xl font-extrabold leading-tight sm:text-4xl " + (dark ? "text-white" : "text-ink")}>{p.title}</h2>
          {p.text ? <p className={"mt-3 text-lg " + (dark ? "text-white/80" : "text-slate-600")}>{p.text}</p> : null}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Btn href={p.primaryHref} label={p.primaryLabel} />
            <Btn href={p.secondaryHref} label={p.secondaryLabel} kind="secondary" dark={dark} />
          </div>
        </div>,
      );

    default:
      return null;
  }
}
