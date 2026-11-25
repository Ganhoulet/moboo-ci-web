import Link from "next/link";
import { SiteIcon } from "@/components/site-icon";
import type { Section } from "@/lib/page-blocks";
import { BaseTabs } from "./base-tabs";

// Rendu des éléments de base (lib/base-blocks.ts) : titre, paragraphe, image, boutons…

export const BASE_TYPES = new Set(["heading", "paragraph", "image", "buttons", "columns", "box", "icon", "youtube", "divider", "tabs", "checklist", "quote", "numbers", "gallery", "map"]);

/** Couleur saisie au back-office : seulement #rgb / #rrggbb. */
export const color = (v: unknown) => (typeof v === "string" && /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v.trim()) ? v.trim() : undefined);
const RATIO = (v: unknown) => (typeof v === "string" && /^\d+\/\d+$/.test(v) ? v.replace("/", " / ") : undefined);

export const ELEMENT_PAD: Record<string, string> = { none: "py-0", small: "py-4 sm:py-6", normal: "py-10 sm:py-14", large: "py-16 sm:py-24" };
export const ELEMENT_BG: Record<string, string> = { white: "bg-white", soft: "bg-slate-50", brand: "bg-brand-900 text-white", accent: "bg-accent-50", dark: "bg-slate-900 text-white", custom: "" };
const WIDTH: Record<string, string> = { narrow: "max-w-3xl", normal: "max-w-6xl", full: "max-w-none" };
const ALIGN: Record<string, string> = { left: "text-left", center: "text-center", right: "text-right" };
const JUSTIFY: Record<string, string> = { left: "justify-start", center: "justify-center", right: "justify-end" };
const MX: Record<string, string> = { left: "mr-auto", center: "mx-auto", right: "ml-auto" };

const BTN: Record<string, string> = {
  primary: "bg-accent-600 text-white hover:bg-accent-700", dark: "bg-ink text-white hover:bg-slate-800", brand: "bg-brand-700 text-white hover:bg-brand-800",
  outline: "ring-1 ring-current hover:bg-black/5", light: "bg-white text-ink ring-1 ring-slate-200 hover:bg-slate-50", link: "underline underline-offset-4 hover:opacity-80",
};
const BTN_SIZE: Record<string, string> = { small: "px-4 py-2 text-sm", normal: "px-6 py-3 text-sm", large: "px-8 py-4 text-base" };

function A({ href, newTab, className, children }: { href: string; newTab?: boolean; className?: string; children: React.ReactNode }) {
  return /^https?:/.test(href) || newTab
    ? <a href={href} target={newTab ? "_blank" : undefined} rel="noopener noreferrer" className={className}>{children}</a>
    : <Link href={href} className={className}>{children}</Link>;
}

/** Identifiant de vidéo YouTube (watch, youtu.be, shorts, embed). */
export function youtubeId(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const m = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/);
  return m ? m[1] : null;
}

/** Contenu d'un élément de base (le cadre de section est posé par HomeSection). */
export function BaseElement({ s }: { s: Section }) {
  const p = s.props ?? {};
  const align = String(p.align || "left");
  const box = `${WIDTH[p.width] ?? WIDTH.normal} ${MX[align] ?? "mx-auto"} ${ALIGN[align] ?? ""}`;
  const items: any[] = Array.isArray(p.items) ? p.items : [];

  switch (s.type) {
    case "heading": {
      const Tag = (["h1", "h2", "h3", "h4"].includes(p.level) ? p.level : "h2") as "h2";
      const size = { small: "text-xl", normal: "text-2xl sm:text-3xl", large: "text-3xl sm:text-4xl", xl: "text-4xl sm:text-5xl" }[String(p.size)] ?? "text-3xl";
      return (
        <div className={box}>
          {p.eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-widest opacity-70">{p.eyebrow}</p> : null}
          <Tag className={`font-display font-black leading-tight ${size}`} style={{ color: color(p.color) }}>{p.text}</Tag>
        </div>
      );
    }
    case "paragraph": {
      const size = { small: "text-sm", normal: "text-base", large: "text-lg", xl: "text-xl" }[String(p.size)] ?? "text-base";
      return <p className={`${box} whitespace-pre-line leading-relaxed ${size}`} style={{ color: color(p.color) }}>{p.text}</p>;
    }
    case "image": {
      if (!p.image) return <div className={`${box} rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-muted`}>Image à choisir</div>;
      const w = { small: "max-w-xs", medium: "max-w-md", large: "max-w-3xl", full: "max-w-none w-full" }[String(p.size)] ?? "max-w-3xl";
      // eslint-disable-next-line @next/next/no-img-element
      const img = <img src={p.image} alt={p.alt || ""} loading="lazy" className={`w-full object-cover ${p.rounded ? "rounded-2xl" : ""} ${p.shadow ? "shadow-xl" : ""}`} style={{ aspectRatio: RATIO(p.ratio) }} />;
      return (
        <figure className={`${w} ${MX[align] ?? "mx-auto"}`}>
          {p.href ? <A href={p.href}>{img}</A> : img}
          {p.caption ? <figcaption className={`mt-2 text-sm text-muted ${ALIGN[align] ?? ""}`}>{p.caption}</figcaption> : null}
        </figure>
      );
    }
    case "buttons":
      return (
        <div className={`${WIDTH[p.width] ?? WIDTH.normal} mx-auto flex flex-wrap gap-3 ${JUSTIFY[align] ?? ""}`}>
          {items.filter((b) => b?.label && b?.href).map((b, i) => (
            <A key={i} href={b.href} newTab={b.newTab} className={`inline-flex items-center rounded-full font-semibold transition ${BTN[b.style] ?? BTN.primary} ${b.style === "link" ? "" : BTN_SIZE[p.size] ?? BTN_SIZE.normal}`}>{b.label}</A>
          ))}
        </div>
      );
    case "columns": {
      const cols = { "2": "sm:grid-cols-2", "3": "sm:grid-cols-2 lg:grid-cols-3", "4": "sm:grid-cols-2 lg:grid-cols-4" }[String(p.columns)] ?? "sm:grid-cols-3";
      const card = { none: "", border: "rounded-2xl border border-slate-200 p-6", shadow: "rounded-2xl bg-white p-6 text-ink shadow-card", soft: "rounded-2xl bg-slate-50 p-6 text-ink" }[String(p.card)] ?? "";
      return (
        <div className={`${WIDTH[p.width] ?? WIDTH.normal} mx-auto grid gap-6 ${cols} ${ALIGN[align] ?? ""}`}>
          {items.map((c, i) => (
            <div key={i} className={`flex flex-col ${card}`}>
              {c.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt="" loading="lazy" className="mb-4 aspect-[4/3] w-full rounded-xl object-cover" />
              ) : c.icon ? <span className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-800 ${align === "center" ? "mx-auto" : ""}`}><SiteIcon value={c.icon} size={24} /></span> : null}
              {c.title ? <h3 className="font-display text-lg font-bold">{c.title}</h3> : null}
              {c.text ? <p className="mt-1 flex-1 whitespace-pre-line text-sm opacity-80">{c.text}</p> : null}
              {c.buttonLabel && c.buttonHref ? <A href={c.buttonHref} className="mt-4 text-sm font-semibold underline underline-offset-4">{c.buttonLabel} →</A> : null}
            </div>
          ))}
        </div>
      );
    }
    case "box": {
      const pos = String(p.imagePosition || "right");
      return (
        <div className={`${WIDTH[p.width] ?? WIDTH.normal} mx-auto overflow-hidden rounded-3xl ${p.border ? "border border-slate-200" : ""}`} style={{ background: color(p.boxColor), color: color(p.textColor) }}>
          <div className={`grid items-center gap-6 ${p.image && pos !== "top" ? "md:grid-cols-2" : ""}`}>
            {p.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image} alt="" loading="lazy" className={`h-full w-full object-cover ${pos === "top" ? "max-h-72" : "min-h-[220px]"} ${pos === "right" ? "md:order-2" : ""}`} />
            ) : null}
            <div className={`p-6 sm:p-10 ${ALIGN[align] ?? ""}`}>
              {p.title ? <h3 className="font-display text-2xl font-black">{p.title}</h3> : null}
              {p.text ? <p className="mt-2 whitespace-pre-line opacity-90">{p.text}</p> : null}
              {p.buttonLabel && p.buttonHref ? <A href={p.buttonHref} className="mt-5 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">{p.buttonLabel}</A> : null}
            </div>
          </div>
        </div>
      );
    }
    case "icon": {
      const size = Math.min(160, Math.max(16, Number(p.iconSize) || 48));
      return (
        <div className={box}>
          <div className={`inline-flex ${align === "center" ? "mx-auto" : ""}`} style={{ color: color(p.color) }}>
            {p.svg
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={p.svg} alt="" style={{ width: size, height: size }} className="object-contain" />
              : p.icon ? <SiteIcon value={p.icon} size={size} /> : null}
          </div>
          {p.title ? <h3 className="mt-3 font-display text-lg font-bold">{p.title}</h3> : null}
          {p.text ? <p className="mt-1 whitespace-pre-line text-sm opacity-80">{p.text}</p> : null}
        </div>
      );
    }
    case "youtube": {
      const id = youtubeId(p.url);
      return (
        <div className={`${p.ratio === "9/16" ? "max-w-sm" : WIDTH[p.width] ?? "max-w-4xl"} ${MX[align] ?? "mx-auto"}`}>
          {p.title ? <h3 className={`mb-3 font-display text-xl font-bold ${ALIGN[align] ?? ""}`}>{p.title}</h3> : null}
          {id ? (
            <iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title={p.title || "Vidéo"} loading="lazy" allowFullScreen
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" className="w-full rounded-2xl bg-black" style={{ aspectRatio: RATIO(p.ratio) ?? "16 / 9" }} />
          ) : <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-muted">Collez un lien YouTube valide</div>}
        </div>
      );
    }
    case "divider": {
      if (p.kind === "space") return <div aria-hidden style={{ height: Math.min(200, Math.max(0, Number(p.height) || 0)) }} />;
      return <hr className={`${WIDTH[p.width] ?? WIDTH.normal} mx-auto border-t-2 ${p.kind === "dashed" ? "border-dashed" : p.kind === "dotted" ? "border-dotted" : ""}`} style={{ borderColor: color(p.color) ?? "rgb(226 232 240)" }} />;
    }
    case "tabs":
      return <div className={`${WIDTH[p.width] ?? WIDTH.normal} mx-auto`}><BaseTabs mode={p.mode === "accordion" ? "accordion" : "tabs"} items={items.map((x) => ({ title: String(x?.title ?? ""), text: String(x?.text ?? ""), image: String(x?.image ?? "") }))} /></div>;
    case "checklist":
      return (
        <div className={box}>
          {p.title ? <h3 className="mb-4 font-display text-xl font-bold">{p.title}</h3> : null}
          <ul className={`grid gap-3 text-left ${p.columns === "2" ? "sm:grid-cols-2" : ""} ${align === "center" ? "mx-auto w-fit" : ""}`}>
            {items.filter((x) => x?.text).map((x, i) => (
              <li key={i} className="flex items-start gap-3"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">✓</span><span>{x.text}</span></li>
            ))}
          </ul>
        </div>
      );
    case "quote":
      return (
        <figure className={box}>
          <blockquote className="font-display text-2xl font-bold leading-snug">« {p.text} »</blockquote>
          <figcaption className={`mt-5 flex items-center gap-3 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : ""}`}>
            {p.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : null}
            <span className="text-left"><span className="block font-semibold">{p.author}</span>{p.role ? <span className="block text-sm opacity-70">{p.role}</span> : null}</span>
          </figcaption>
        </figure>
      );
    case "numbers":
      return (
        <div className={`${WIDTH[p.width] ?? WIDTH.normal} mx-auto grid grid-cols-2 gap-6 ${items.length >= 4 ? "sm:grid-cols-4" : items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} ${ALIGN[align] ?? ""}`}>
          {items.map((x, i) => (
            <div key={i}><p className="font-display text-4xl font-black" style={{ color: color(p.color) }}>{x?.value}</p><p className="mt-1 text-sm opacity-75">{x?.label}</p></div>
          ))}
        </div>
      );
    case "gallery": {
      const cols = { "2": "sm:grid-cols-2", "3": "sm:grid-cols-3", "4": "sm:grid-cols-2 lg:grid-cols-4" }[String(p.columns)] ?? "sm:grid-cols-3";
      const imgs = items.filter((x) => x?.image);
      if (!imgs.length) return <div className={`${box} rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-muted`}>Ajoutez des images à la galerie</div>;
      return (
        <div className={`${WIDTH[p.width] ?? WIDTH.normal} mx-auto grid grid-cols-2 gap-3 ${cols}`}>
          {imgs.map((x, i) => (
            <figure key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.image} alt={x.caption || ""} loading="lazy" className="w-full rounded-xl object-cover" style={{ aspectRatio: RATIO(p.ratio) ?? "4 / 3" }} />
              {x.caption ? <figcaption className="mt-1 text-xs text-muted">{x.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      );
    }
    case "map": {
      const q = String(p.address || "").trim();
      if (!q) return null;
      const zoom = Math.min(20, Math.max(1, Number(p.zoom) || 14));
      return (
        <iframe title={`Carte : ${q}`} loading="lazy" className={`${WIDTH[p.width] ?? WIDTH.normal} mx-auto block w-full rounded-2xl border-0`}
          style={{ height: Math.min(700, Math.max(200, Number(p.height) || 360)) }}
          src={`https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`} />
      );
    }
    default:
      return null;
  }
}
