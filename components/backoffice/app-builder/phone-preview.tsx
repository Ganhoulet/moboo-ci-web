"use client";

import { useEffect, useState } from "react";
import { CARD_DESIGNS, DETAIL_LABEL, DRAWER_LABEL, FILTER_KIND, HOOK_LABEL, iconName, ligature, navTypeOf, toCss, type Cfg } from "./catalog";

export type PreviewScreen = "home" | "results" | "detail" | "drawer" | "filters";

const PHOTOS = ["#cbd5e1", "#bfdbfe", "#fed7aa", "#bbf7d0", "#e9d5ff"];

/** Police « Material Icons » chargée ? (sinon : pastille, jamais le nom brut). */
function useIconFont() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let live = true;
    // « check » répond vrai quand la police n'est pas déclarée : on cherche la police réellement chargée.
    const loaded = () => {
      try { return Array.from(document.fonts as unknown as Iterable<FontFace>).some((f) => f.family.replace(/["']/g, "") === "Material Icons" && f.status === "loaded"); } catch { return false; }
    };
    const check = () => { if (live) setOk(loaded()); };
    check();
    document.fonts?.load('20px "Material Icons"', "home").then(check).catch(() => {});
    const t = setTimeout(check, 2500);
    return () => { live = false; clearTimeout(t); };
  }, []);
  return ok;
}

/** Icône Material (nom de l'application, ex. « home_rounded »). */
export function MIcon({ name, color = "currentColor", size = 20 }: { name: string; color?: string; size?: number }) {
  const ok = useIconFont();
  if (!ok) return <span aria-hidden="true" className="inline-block rounded-full" style={{ width: size * 0.7, height: size * 0.7, margin: size * 0.15, background: color, opacity: 0.55 }} />;
  return (
    <span className="material-icons select-none overflow-hidden leading-none" style={{ color, fontSize: size, width: size, height: size, display: "inline-block" }} aria-hidden="true">
      {ligature(name)}
    </span>
  );
}
const Icon = MIcon;

/** Aperçu d'un téléphone : reprend couleurs, police, logo, accueil, barre du bas, fiche, menu et filtres. */
export function PhonePreview({ cfg, screen, dark }: { cfg: Cfg; screen: PreviewScreen; dark: boolean }) {
  const c = (k: string, f: string) => toCss(cfg[k], f);
  const primary = c("primary_color", "#0555CC");
  const secondary = c("secondary_color", "#FE6600");
  const accent = c("slider_tint_color", "#00AEFF");
  const bg = dark ? c("app_background_color_dark_mode", "#18191B") : c("app_background_color_light_mode", "#FFFFFF");
  const text = dark ? c("headings_color_dark_mode", "#FFFFFF") : c("headings_color_light_mode", "#1A1A1A");
  const card = dark ? c("property_item_design_container_bg_color_dark_mode", "#242527") : c("property_item_design_container_bg_color_light_mode", "#FFFFFF");
  const navBg = dark ? c("bottom_tab_bar_background_color_dark", "#303030") : c("bottom_tab_bar_background_color_light", "#FAFAFA");
  const navOn = c("bottom_tab_bar_tint_color", primary);
  const navOff = c("un_selected_bottom_tab_bar_tint_color", "#737373");
  const icon = dark ? c("icon_tint_color_dark_mode", "#868A8D") : c("icon_tint_color", primary);
  const tagBg = dark ? c("tag_background_color_dark_mode", "#3A3B3D") : c("tag_background_color", "#F5F5F5");
  const featured = c("featured_label_background_color", accent);
  const divider = dark ? c("divider_color_dark_mode", "rgba(255,255,255,.15)") : c("divider_color_light_mode", "rgba(0,0,0,.12)");
  const font = cfg.moboo_font_family || "Rubik";
  const nav: Cfg[] = Array.isArray(cfg.bottom_navigation_bar_layout) ? cfg.bottom_navigation_bar_layout : [];
  const floating = cfg.default_bottom_navbar_design === "design_02";
  const title =
    screen === "home" ? null : screen === "results" ? "Résultats" : screen === "detail" ? "Villa 4 pièces – Cocody" : screen === "drawer" ? "Menu" : "Filtres";

  /** Carte d'annonce : capture du rendu réel de l'application pour ce modèle. */
  const Card = ({ design, wide }: { design: string; wide?: boolean; i?: number }) => (
    <img src={`/app-builder/cards/${/^design_(0[1-9]|1[0-3])$/.test(design) ? design : "design_01"}.png`} alt="" draggable={false}
      className="shrink-0 rounded-lg" style={{ width: wide ? "100%" : 150, background: card }} />
  );

  const Section = ({ s, i }: { s: Cfg; i: number }) => {
    const head = (t: string) => <p className="mb-1.5 px-3 text-[11px] font-bold" style={{ color: text }}>{t}</p>;
    switch (s.section_type) {
      case "term_with_icons":
        return (
          <div>
            {s.title ? head(s.title) : null}
            <div className="flex gap-2 overflow-hidden px-3">
              {(Array.isArray(s.terms_with_icon_layout) && s.terms_with_icon_layout.length ? s.terms_with_icon_layout : [{ title: "Logements" }, { title: "Meublés" }, { title: "Espaces" }, { title: "Bureaux" }]).slice(0, 5).map((t: Cfg, j: number) => (
                <div key={j} className="flex w-12 shrink-0 flex-col items-center gap-1">
                  <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: tagBg }}><Icon name={t.icon_data ? iconName(t.icon_data) : "home"} color={icon} size={18} /></span>
                  <span className="w-full truncate text-center text-[8px]" style={{ color: text }}>{t.title}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case "place_holder":
        return (
          <div className="mx-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-semibold text-white" style={{ background: s.title === "qr_scanner" ? secondary : s.title === "estimation" ? primary : accent }}>
            <Icon name={s.title === "qr_scanner" ? "qr_code_scanner" : s.title === "estimation" ? "payments" : "campaign"} color="#fff" size={16} />
            {HOOK_LABEL[s.title] ?? s.title}
          </div>
        );
      case "ad":
        return <div className="mx-3 grid h-12 place-items-center rounded-lg text-[9px] opacity-60" style={{ background: tagBg, color: text }}>Publicité</div>;
      case "agents":
      case "agencies":
      case "partners":
        return (
          <div>
            {head(s.title || s.section_type)}
            <div className="flex gap-2 overflow-hidden px-3">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="flex w-14 shrink-0 flex-col items-center gap-1">
                  <span className="h-11 w-11 rounded-full" style={{ background: PHOTOS[(j + 1) % 5] }} />
                  <span className="h-1.5 w-10 rounded" style={{ background: tagBg }} />
                </div>
              ))}
            </div>
          </div>
        );
      case "term":
        return (
          <div>
            {head(s.title || "Explorer")}
            <div className="flex gap-2 overflow-hidden px-3">
              {["Abidjan", "Bouaké", "Yamoussoukro", "San-Pédro"].map((v, j) => (
                <div key={v} className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg" style={{ background: PHOTOS[(j + 2) % 5] }}>
                  <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white drop-shadow">{v}</span>
                </div>
              ))}
            </div>
          </div>
        );
      default: {
        const list = s.section_listing_view === "list";
        const slider = s.section_listing_view === "slider";
        return (
          <div>
            {head(s.title || "Annonces")}
            <div className={list ? "space-y-2 px-3" : "flex gap-2 overflow-hidden px-3"}>
              {(list ? [0, 1] : slider ? [0] : [0, 1, 2]).map((j) => <Card key={j} design={s.layout_design || "design_01"} wide={list || slider} i={j + i} />)}
            </div>
          </div>
        );
      }
    }
  };

  let body: React.ReactNode = null;
  if (screen === "home") {
    const home: Cfg[] = Array.isArray(cfg.home_layout) ? cfg.home_layout : [];
    body = (
      <div className="space-y-4 pb-4">
        <div className="px-3 pt-1" style={{ background: primary }}>
          <p className="pb-2 text-[10px] text-white/90">{cfg.quote || "Trouvez votre bien idéal"}</p>
          <div className="-mb-4 flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow">
            <Icon name="search" color="#64748b" size={14} /><span className="text-[10px] text-slate-500">Ville, quartier, type de bien…</span>
          </div>
        </div>
        <div className="h-2" />
        {home.map((s, i) => <Section key={i} s={s} i={i} />)}
        {!home.length ? <p className="px-3 text-center text-[10px] opacity-60" style={{ color: text }}>Aucune section.</p> : null}
      </div>
    );
  } else if (screen === "results") {
    const d = cfg.moboo_results_list_design || "design_12";
    body = (
      <div className="space-y-2 p-3">
        <div className="flex gap-1.5">
          {["À louer", "Meublés", "Prix"].map((t, j) => <span key={t} className="rounded-full px-2 py-1 text-[9px]" style={{ background: j === 0 ? c("selected_item_background_color", accent) : tagBg, color: j === 0 ? "#fff" : text }}>{t}</span>)}
        </div>
        <p className="text-[9px] opacity-60" style={{ color: text }}>{CARD_DESIGNS.find((x) => x.v === d)?.l}</p>
        {[0, 1].map((j) => <Card key={j} design={d} wide i={j} />)}
      </div>
    );
  } else if (screen === "detail") {
    const blocks: Cfg[] = (Array.isArray(cfg.property_detail_page_layout) ? cfg.property_detail_page_layout : []).filter((b: Cfg) => b.widget_enable !== false);
    const btns = [
      ["show_call_button", "call", c("property_details_call_button_bg_color", secondary)],
      ["show_whatsapp_button", "chat", c("property_details_whatsapp_button_bg_color", "#25D366")],
      ["show_email_button", "mail", c("property_details_email_button_bg_color", primary)],
      ["show_message_button", "forum", c("message_button_bg_color", primary)],
    ].filter(([k]) => cfg[k as string] !== false);
    body = (
      <div className="relative min-h-full pb-12">
        {blocks.map((b, i) =>
          b.widget_type === "article_images" ? <div key={i} className="h-28" style={{ background: PHOTOS[1] }} /> : (
            <div key={i} className="mx-3 border-b py-2" style={{ borderColor: divider }}>
              <p className="text-[10px] font-semibold" style={{ color: text }}>{b.widget_title || DETAIL_LABEL[b.widget_type] || b.widget_type}</p>
              {b.widget_type === "article_status_price" ? <p className="text-[11px] font-extrabold" style={{ color: primary }}>450 000 FCFA / mois</p> : <div className="mt-1 h-1.5 w-3/4 rounded" style={{ background: tagBg }} />}
            </div>
          ))}
        <div className="absolute inset-x-0 bottom-0 flex gap-1.5 p-2" style={{ background: card }}>
          {btns.map(([k, n, col]) => <span key={k} className="grid h-7 flex-1 place-items-center rounded-md" style={{ background: col as string }}><Icon name={n as string} color="#fff" size={14} /></span>)}
        </div>
      </div>
    );
  } else if (screen === "drawer") {
    const items: Cfg[] = (Array.isArray(cfg.drawer_layout) ? cfg.drawer_layout : []).filter((d: Cfg) => d.enable !== false);
    body = (
      <div>
        <div className="flex items-center gap-2 p-3" style={{ background: primary }}>
          {cfg.moboo_logo_url ? <img src={cfg.moboo_logo_url} alt="" className="h-9 w-9 rounded bg-white object-contain p-0.5" /> : <span className="grid h-9 w-9 place-items-center rounded bg-white text-xs font-black" style={{ color: primary }}>M</span>}
          <span className="text-[11px] font-bold text-white">{cfg.app_name || "Moboo.ci"}</span>
        </div>
        {items.map((d, i) => <p key={i} className="border-b px-3 py-2 text-[10px]" style={{ color: text, borderColor: divider }}>{d.title || DRAWER_LABEL[d.section_type] || d.section_type}{d.check_login ? <span className="ml-1 opacity-40">🔒</span> : null}</p>)}
      </div>
    );
  } else {
    const f: Cfg[] = Array.isArray(cfg.filter_page_layout) ? cfg.filter_page_layout : [];
    body = (
      <div className="space-y-3 p-3">
        {f.map((x, i) => (
          <div key={i}>
            <p className="mb-1 text-[10px] font-semibold" style={{ color: dark ? c("filter_page_headings_color_dark_mode", text) : c("filter_page_headings_color_light_mode", text) }}>{x.title} <span className="opacity-40">· {FILTER_KIND[x.section_type] ?? x.section_type}</span></p>
            {x.section_type === "range_picker" ? (
              <div className="relative h-1 rounded" style={{ background: tagBg }}><span className="absolute left-[15%] right-[30%] h-1 rounded" style={{ background: accent }} /></div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {(x.section_type === "string_picker" ? ["1", "2", "3", "4+"] : x.section_type === "location_picker" ? ["Abidjan", `Rayon ${x.default_radius || 50} km`] : ["Choix 1", "Choix 2", "Choix 3"]).map((v, j) => (
                  <span key={v} className="rounded-full px-2 py-0.5 text-[9px]" style={{ background: j === 0 ? c("selected_item_background_color", accent) : tagBg, color: j === 0 ? "#fff" : text }}>{v}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="rounded-lg py-2 text-center text-[10px] font-bold text-white" style={{ background: secondary }}>Voir les résultats</div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-[280px] rounded-[2.4rem] bg-slate-900 p-2.5 shadow-xl">
      <div className="relative flex h-[560px] flex-col overflow-hidden rounded-[1.9rem]" style={{ background: bg, fontFamily: `${font}, system-ui, sans-serif` }}>
        <div className="flex h-6 shrink-0 items-center justify-between px-5 text-[9px] font-semibold text-white" style={{ background: primary }}>
          <span>9:41</span><span className="h-3 w-14 rounded-full bg-slate-900" /><span>●●● 100%</span>
        </div>
        <div className="flex h-10 shrink-0 items-center gap-2 px-3 text-white" style={{ background: primary }}>
          <Icon name={screen === "home" ? "menu" : "arrow_back"} color="#fff" size={18} />
          {screen === "home" ? (
            cfg.moboo_logo_url ? <img src={cfg.moboo_logo_url} alt="" className="h-6 max-w-[120px] object-contain" /> : <span className="text-[13px] font-extrabold">{cfg.app_name || "Moboo.ci"}</span>
          ) : <span className="truncate text-[12px] font-bold">{title}</span>}
          <span className="ml-auto"><Icon name="notifications_none" color="#fff" size={18} /></span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
        {nav.length ? (
          <div className={floating ? "absolute inset-x-3 bottom-3 flex rounded-full px-1 py-1.5 shadow-lg" : "flex shrink-0 border-t px-1 py-1.5"} style={{ background: navBg, borderColor: divider }}>
            {nav.slice(0, floating ? 5 : 8).map((n, i) => {
              const on = i === 0;
              const t = navTypeOf(n);
              return (
                <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-0.5" title={t?.l}>
                  <Icon name={iconName(n.icon_data)} color={on ? navOn : navOff} size={18} />
                  {!floating || on ? <span className="max-w-full truncate text-[8px] font-semibold" style={{ color: on ? navOn : navOff }}>{n.title}</span> : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
