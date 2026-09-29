"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { safeHref, type MenuItem, type MenuStyle } from "@/lib/menus";

type Tone = "light" | "dark";
const ALIGN = { left: "justify-start", center: "justify-center", right: "justify-end" } as const;

function A({ item, className, children, onClick }: { item: Pick<MenuItem, "href" | "newTab">; className?: string; children: React.ReactNode; onClick?: () => void }) {
  const href = safeHref(item.href);
  const ext = /^https?:/i.test(href) || item.newTab;
  return ext
    ? <a href={href} className={className} onClick={onClick} {...(item.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{children}</a>
    : <Link href={href} className={className} onClick={onClick}>{children}</Link>;
}

const Badge = ({ text }: { text?: string }) => text ? <span className="ml-1.5 rounded-full bg-accent-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-700">{text}</span> : null;
const Caret = ({ open }: { open: boolean }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={"transition " + (open ? "rotate-180" : "")}><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/** Lien d'un sous-menu (icône, libellé, pastille, description). */
function SubLink({ it, close, strong = false }: { it: MenuItem; close: () => void; strong?: boolean }) {
  return (
    <A item={it} onClick={close} className="group/l flex items-start gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-50">
      {it.icon ? <span className="mt-0.5 text-lg leading-none">{it.icon}</span> : null}
      <span className="min-w-0">
        <span className={"flex items-center text-sm text-ink group-hover/l:text-brand-800 " + (strong ? "font-semibold" : "font-medium")}>{it.label}<Badge text={it.badge} /></span>
        {it.description ? <span className="mt-0.5 block text-xs text-muted">{it.description}</span> : null}
      </span>
    </A>
  );
}

function MegaPanel({ item, close, full }: { item: MenuItem; close: () => void; full: boolean }) {
  const cols = Math.max(1, Math.min(5, item.megaColumns || (item.children?.length ?? 1)));
  const promo = item.promoTitle || item.promoImage;
  return (
    <div className={"overflow-hidden bg-white shadow-2xl ring-1 ring-slate-900/5 " + (full ? "w-full rounded-b-3xl" : "w-[min(1120px,calc(100vw-32px))] rounded-3xl")}>
      <div className={"grid gap-6 p-6 " + (full ? "container-page" : "")} style={{ gridTemplateColumns: promo ? "1fr 280px" : "1fr" }}>
        <div className="grid gap-x-6 gap-y-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {(item.children ?? []).map((col) =>
            col.children?.length ? (
              <div key={col.id} className="min-w-0">
                <A item={col} onClick={close} className="mb-1 flex items-center px-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-ink">
                  {col.icon ? <span className="mr-1.5 text-sm">{col.icon}</span> : null}{col.label}<Badge text={col.badge} />
                </A>
                <div>{col.children.map((l) => <SubLink key={l.id} it={l} close={close} />)}</div>
              </div>
            ) : (
              <div key={col.id} className="min-w-0"><SubLink it={col} close={close} strong /></div>
            ),
          )}
        </div>
        {promo ? (
          <A item={{ href: item.promoHref || item.href }} onClick={close} className="group/p relative flex min-h-[220px] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 to-ink p-5 text-white">
            {item.promoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.promoImage} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover/p:scale-105" />
            ) : null}
            {item.promoImage ? <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" /> : null}
            <span className="relative">
              {item.promoTitle ? <span className="block font-display text-lg font-bold leading-snug">{item.promoTitle}</span> : null}
              {item.promoText ? <span className="mt-1 block text-sm text-white/80">{item.promoText}</span> : null}
              {item.promoCta ? <span className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold text-ink">{item.promoCta} →</span> : null}
            </span>
          </A>
        ) : null}
      </div>
    </div>
  );
}

function Dropdown({ item, close }: { item: MenuItem; close: () => void }) {
  return (
    <div className="w-72 rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-slate-900/5">
      {(item.children ?? []).map((c) => (
        <div key={c.id}>
          <SubLink it={c} close={close} strong={!!c.children?.length} />
          {c.children?.length ? <div className="mb-1 ml-4 border-l border-slate-100 pl-1">{c.children.map((g) => <SubLink key={g.id} it={g} close={close} />)}</div> : null}
        </div>
      ))}
    </div>
  );
}

/**
 * Menu principal de l'en-tête : liens, menus déroulants et méga menus.
 * Composé dans le back-office (Apparence → Menus).
 */
export function NavMenu({ items, style, tone, align = "left", className = "" }: {
  items: MenuItem[]; style: MenuStyle; tone: Tone; align?: keyof typeof ALIGN; className?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [top, setTop] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const root = useRef<HTMLElement>(null);
  const hover = style.trigger === "hover";

  const show = (id: string, el: HTMLElement) => {
    clearTimeout(timer.current);
    const header = el.closest("header");
    setTop(Math.round((header ?? el).getBoundingClientRect().bottom));
    setOpen(id);
  };
  const hide = (delay = 140) => { clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(null), delay); };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(null); };
    const onScroll = () => setOpen(null);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); window.removeEventListener("scroll", onScroll); };
  }, [open]);

  const dark = tone === "dark";
  const base = "inline-flex items-center gap-1 whitespace-nowrap text-sm transition " + (style.uppercase ? "uppercase tracking-wide text-[13px] " : "");
  const variant = (active: boolean) => {
    switch (style.variant) {
      case "underline":
        return `relative py-2 font-semibold after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:transition ${dark ? "after:bg-white" : "after:bg-ink"} ${active ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"} ${dark ? "text-white" : "text-ink"}`;
      case "pill":
        return `rounded-full px-3.5 py-2 font-semibold ${active ? (dark ? "bg-white/15 text-white" : "bg-slate-100 text-ink") : dark ? "text-white/85 hover:bg-white/10 hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-ink"}`;
      case "bold":
        return `py-2 text-[15px] font-extrabold ${dark ? "text-white hover:text-white/80" : "text-ink hover:text-brand-800"}`;
      default:
        return `py-2 font-semibold ${active ? (dark ? "text-white" : "text-brand-800") : dark ? "text-white/85 hover:text-white" : "text-slate-600 hover:text-brand-800"}`;
    }
  };
  const gap = style.variant === "pill" ? "gap-1" : "gap-6";

  return (
    <nav ref={root} className={`flex flex-1 items-center ${gap} ${ALIGN[align]} ${className}`} aria-label="Menu principal">
      {items.map((it) => {
        const has = !!it.children?.length;
        const isOpen = open === it.id;
        const label = <>{it.icon ? <span>{it.icon}</span> : null}{it.label}<Badge text={it.badge} />{has && style.showCaret ? <Caret open={isOpen} /> : null}</>;
        if (it.highlight) {
          return <A key={it.id} item={it} className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-accent-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-accent-700">{label}</A>;
        }
        if (!has) return <A key={it.id} item={it} className={base + variant(false)}>{label}</A>;
        return (
          <div key={it.id} className={it.mega ? "" : "relative"}
            onMouseEnter={hover ? (e) => show(it.id, e.currentTarget) : undefined}
            onMouseLeave={hover ? () => hide() : undefined}>
            <button type="button" aria-expanded={isOpen} aria-haspopup="true"
              onClick={(e) => (isOpen && !hover ? setOpen(null) : show(it.id, e.currentTarget))}
              className={base + variant(isOpen)}>{label}</button>
            {isOpen ? (
              it.mega ? (
                <div className={"fixed z-50 pt-2 " + (style.megaWidth === "full" ? "inset-x-0" : "left-1/2 -translate-x-1/2")} style={{ top: top - 4 }}
                  onMouseEnter={hover ? () => clearTimeout(timer.current) : undefined} onMouseLeave={hover ? () => hide() : undefined}>
                  <div className="animate-[fadeIn_.15s_ease-out]"><MegaPanel item={it} close={() => setOpen(null)} full={style.megaWidth === "full"} /></div>
                </div>
              ) : (
                <div className="absolute left-0 top-full z-50 pt-2">
                  <div className="animate-[fadeIn_.15s_ease-out]"><Dropdown item={it} close={() => setOpen(null)} /></div>
                </div>
              )
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

/** Menu du téléphone : bouton ☰ + panneau avec sous-menus en accordéon. */
export function MobileMenu({ items, tone }: { items: MenuItem[]; tone: Tone }) {
  const [open, setOpen] = useState(false);
  const [exp, setExp] = useState<string | null>(null);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!items.length) return null;
  const close = () => setOpen(false);
  return (
    <>
      <button type="button" aria-label="Ouvrir le menu" onClick={() => setOpen(true)}
        className={"grid h-10 w-10 place-items-center rounded-full border transition md:hidden " + (tone === "dark" ? "border-white/25 text-white" : "border-slate-200 text-ink")}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" /></svg>
      </button>
      {open ? (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label="Fermer" onClick={close} className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <span className="font-display text-lg font-bold text-ink">Menu</span>
              <button type="button" onClick={close} aria-label="Fermer le menu" className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {items.map((it) => {
                const has = !!it.children?.length;
                return (
                  <div key={it.id} className="border-b border-slate-100 last:border-0">
                    {has ? (
                      <button type="button" onClick={() => setExp(exp === it.id ? null : it.id)} className="flex w-full items-center justify-between px-2 py-3.5 text-left font-semibold text-ink">
                        <span className="flex items-center gap-2">{it.icon}{it.label}<Badge text={it.badge} /></span><Caret open={exp === it.id} />
                      </button>
                    ) : (
                      <A item={it} onClick={close} className={"flex items-center gap-2 px-2 py-3.5 font-semibold " + (it.highlight ? "text-accent-700" : "text-ink")}>{it.icon}{it.label}<Badge text={it.badge} /></A>
                    )}
                    {has && exp === it.id ? (
                      <div className="pb-3">
                        <A item={it} onClick={close} className="block px-3 py-2 text-sm font-semibold text-brand-800">Tout voir — {it.label}</A>
                        {it.children!.map((c) => (
                          <div key={c.id}>
                            {c.children?.length ? <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">{c.label}</p> : null}
                            {(c.children?.length ? c.children : [c]).map((l) => <SubLink key={l.id} it={l} close={close} />)}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
