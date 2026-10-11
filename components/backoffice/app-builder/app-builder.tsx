"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { uploadImageAction } from "@/app/mon-espace/actions";
import { shrink } from "@/components/settings-form";
import {
  getAppConfigVersionAction, publishAppConfigAction, resetAppConfigAction, restoreAppConfigAction, type BuilderState,
} from "@/app/admin/application/builder/actions";
import {
  CARD_DESIGNS, COLORS_BUTTONS, COLORS_DARK, COLORS_LIGHT, COLORS_MAIN, DETAIL_LABEL, DETAIL_TYPES, DRAWER_LABEL, FILTER_KIND, FILTER_TYPES,
  FONTS, HOME_DESIGNS, HOME_TYPES, ICONS, LISTING_VIEWS, NAV_TYPES, NAVBAR_DESIGNS, PICKER_TYPES, PRESETS, SORTS, SUB_TYPES, TOGGLES,
  alphaOf, applyPreset, homeLabel, iconJson, iconName, navTypeOf, newNavItem, toCss, toHex6, type Cfg,
} from "./catalog";
import { MIcon, PhonePreview, type PreviewScreen } from "./phone-preview";

type Tab = "theme" | "home" | "nav" | "drawer" | "results" | "filters" | "features" | "advanced";
const TABS: { id: Tab; l: string; screen: PreviewScreen }[] = [
  { id: "theme", l: "Thème et couleurs", screen: "home" },
  { id: "home", l: "Accueil", screen: "home" },
  { id: "nav", l: "Barre du bas", screen: "home" },
  { id: "drawer", l: "Menu", screen: "drawer" },
  { id: "results", l: "Résultats et fiche", screen: "results" },
  { id: "filters", l: "Filtres", screen: "filters" },
  { id: "features", l: "Fonctions et liens", screen: "detail" },
  { id: "advanced", l: "Avancé et versions", screen: "home" },
];
const DRAFT_KEY = "moboo-app-builder-draft";
const fmt = (d: string) => new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
const list = (cfg: Cfg, k: string): Cfg[] => (Array.isArray(cfg[k]) ? cfg[k] : []);

// ───────────────────────── Petits champs ─────────────────────────

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-ink">{label}</span>
      {children}
      {help ? <span className="block text-[11px] text-muted">{help}</span> : null}
    </label>
  );
}
function Select({ value, options, onChange, className = "" }: { value: string; options: { v: string; l: string }[]; onChange: (v: string) => void; className?: string }) {
  const known = options.some((o) => o.v === value);
  return (
    <select className={"input text-sm " + className} value={value} onChange={(e) => onChange(e.target.value)}>
      {!known ? <option value={value}>{value || "—"}</option> : null}
      {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}
function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-50" aria-pressed={on}>
      <span className="text-ink">{label}</span>
      <span className={"relative h-5 w-9 shrink-0 rounded-full transition " + (on ? "bg-brand-600" : "bg-slate-300")}>
        <span className={"absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition " + (on ? "left-[18px]" : "left-0.5")} />
      </span>
    </button>
  );
}
function ColorField({ k, label, cfg, set }: { k: string; label: string; cfg: Cfg; set: (k: string, v: unknown) => void }) {
  const v = cfg[k];
  const alpha = alphaOf(v);
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md ring-1 ring-slate-300 bg-[repeating-conic-gradient(#e2e8f0_0_25%,#fff_0_50%)] bg-[length:8px_8px]">
        <span className="absolute inset-0" style={{ background: toCss(v, "transparent") }} />
        <input type="color" aria-label={label} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={toHex6(v)} onChange={(e) => set(k, `#${alpha}${e.target.value.slice(1)}`.toUpperCase())} />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-ink">{label}</span>
      <input className="input w-28 font-mono text-xs uppercase" value={String(v ?? "")} maxLength={9}
        onChange={(e) => set(k, e.target.value.trim().toUpperCase())} />
    </div>
  );
}
function IconPicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 text-sm" title={value}>
        <span className="text-brand-700"><MIcon name={value} /></span>
        <span className="text-xs text-muted">▾</span>
      </button>
      {open ? (
        <div className="absolute left-0 z-30 mt-1 grid w-72 grid-cols-7 gap-1 rounded-lg bg-white p-2 shadow-xl ring-1 ring-slate-200">
          {ICONS.map(([n]) => (
            <button key={n} type="button" title={n} onClick={() => { onChange(n); setOpen(false); }}
              className={"grid h-8 place-items-center rounded hover:bg-brand-50 " + (n === value ? "bg-brand-100" : "")}>
              <span className="text-ink"><MIcon name={n} /></span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Modèles de carte tels que rendus par l'application (captures de l'app Flutter). */
function DesignPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const cur = CARD_DESIGNS.find((d) => d.v === value) ?? CARD_DESIGNS[0];
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 rounded-md border border-slate-300 bg-white p-1.5 text-left hover:border-brand-500">
        <img src={`/app-builder/cards/${cur.v}.png`} alt="" className="h-14 w-20 shrink-0 rounded object-cover object-top ring-1 ring-slate-200" />
        <span className="min-w-0 flex-1 text-sm font-semibold text-ink">{cur.l}</span>
        <span className="pr-1 text-xs text-muted">{open ? "Fermer" : "Changer"}</span>
      </button>
      {open ? (
        <div className="mt-2 grid max-h-[32rem] grid-cols-2 gap-2 overflow-y-auto rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200 sm:grid-cols-3">
          {CARD_DESIGNS.map((d) => (
            <button key={d.v} type="button" onClick={() => { onChange(d.v); setOpen(false); }}
              className={"rounded-lg bg-white p-1.5 text-left ring-1 hover:ring-brand-500 " + (d.v === value ? "ring-2 ring-brand-600" : "ring-slate-200")}>
              <img src={`/app-builder/cards/${d.v}.png`} alt={d.l} loading="lazy" className="w-full rounded" />
              <span className="mt-1 block text-[11px] font-semibold leading-tight text-ink">{d.l}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Liste réordonnable : glisser-déposer (souris) ou flèches (téléphone). */
function SortableList({ items, onChange, render, title, disabled }: {
  items: Cfg[]; onChange: (next: Cfg[]) => void; render: (item: Cfg, update: (p: Cfg) => void, i: number) => React.ReactNode;
  title: (item: Cfg) => React.ReactNode; disabled?: (item: Cfg) => boolean;
}) {
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
    setOpen((o) => (o === from ? to : o));
  };
  return (
    <ol className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} draggable onDragStart={() => setDrag(i)} onDragEnd={() => { setDrag(null); setOver(null); }}
          onDragOver={(e) => { e.preventDefault(); setOver(i); }} onDrop={(e) => { e.preventDefault(); if (drag != null) move(drag, i); setDrag(null); setOver(null); }}
          className={"rounded-lg bg-white ring-1 transition " + (over === i && drag !== i ? "ring-2 ring-brand-500" : "ring-slate-200") + (drag === i ? " opacity-50" : "") + (disabled?.(item) ? " opacity-60" : "")}>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="cursor-grab select-none px-1 text-slate-400" title="Glisser pour déplacer" aria-hidden="true">⠿</span>
            <button type="button" className="min-w-0 flex-1 truncate text-left text-sm" onClick={() => setOpen(open === i ? null : i)}>{title(item)}</button>
            <button type="button" className="rounded px-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Monter">↑</button>
            <button type="button" className="rounded px-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" disabled={i === items.length - 1} onClick={() => move(i, i + 1)} aria-label="Descendre">↓</button>
            <button type="button" className="rounded px-1.5 text-red-500 hover:bg-red-50" onClick={() => { onChange(items.filter((_, j) => j !== i)); setOpen(null); }} aria-label="Supprimer">✕</button>
          </div>
          {open === i ? (
            <div className="space-y-2 border-t border-slate-100 p-3">{render(item, (p) => onChange(items.map((x, j) => (j === i ? { ...x, ...p } : x))), i)}</div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function AddMenu<T extends { l: string; d?: string }>({ label, options, onPick }: { label: string; options: T[]; onPick: (o: T) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="rounded-md border border-dashed border-brand-400 px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50">+ {label}</button>
      {open ? (
        <div className="absolute left-0 z-30 mt-1 max-h-80 w-80 overflow-y-auto rounded-lg bg-white p-1 shadow-xl ring-1 ring-slate-200">
          {options.map((o, i) => (
            <button key={i} type="button" className="block w-full rounded px-3 py-2 text-left hover:bg-slate-50" onClick={() => { onPick(o); setOpen(false); }}>
              <span className="block text-sm font-semibold text-ink">{o.l}</span>
              {o.d ? <span className="block text-xs text-muted">{o.d}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ───────────────────────── Le builder ─────────────────────────

export function AppBuilder({ initial }: { initial: BuilderState }) {
  const [state, setState] = useState(initial);
  const [cfg, setCfg] = useState<Cfg>(initial.config);
  const [tab, setTab] = useState<Tab>("theme");
  const [screen, setScreen] = useState<PreviewScreen>("home");
  const [dark, setDark] = useState(false);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [json, setJson] = useState("");
  const restored = useRef(false);

  const dirty = useMemo(() => JSON.stringify(cfg) !== JSON.stringify(state.config), [cfg, state.config]);
  const set = (k: string, v: unknown) => setCfg((c) => ({ ...c, [k]: v }));
  const setList = (k: string, v: Cfg[]) => set(k, v);

  // Brouillon local : retrouvé si la page est rechargée avant publication.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d?.base === initial.version && d.cfg && JSON.stringify(d.cfg) !== JSON.stringify(initial.config)) {
        setCfg(d.cfg);
        setMsg({ ok: true, text: "Brouillon non publié retrouvé sur cet ordinateur." });
      }
    } catch { /* stockage indisponible */ }
  }, [initial]);
  useEffect(() => {
    try {
      if (dirty) localStorage.setItem(DRAFT_KEY, JSON.stringify({ base: state.version, cfg }));
      else localStorage.removeItem(DRAFT_KEY);
    } catch { /* stockage indisponible */ }
  }, [cfg, dirty, state.version]);
  useEffect(() => { if (tab === "advanced") setJson(JSON.stringify(cfg, null, 2)); }, [tab, cfg]);

  const done = (r: { ok: boolean; error?: string; state?: BuilderState }, okText: string) => {
    if (r.ok && r.state) {
      setState(r.state);
      setCfg(r.state.config);
      setNote("");
      setMsg({ ok: true, text: okText.replace("{v}", String(r.state.version)) });
    } else setMsg({ ok: false, text: r.error ?? "Action impossible." });
  };
  const publish = () => start(async () => done(await publishAppConfigAction(cfg, note), "Version {v} publiée : les téléphones l'appliquent au prochain lancement de l'application."));
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ ...cfg, api_config_version: state.version }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `configurations-v${state.version}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const pickTab = (t: (typeof TABS)[number]) => { setTab(t.id); setScreen(t.screen); };

  return (
    <div className="space-y-4">
      {/* Material Icons + polices de l'application pour l'aperçu */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;600;800&family=Ubuntu:wght@400;700&family=Cairo:wght@400;700&display=swap" />

      <div className="sticky top-16 z-20 flex flex-wrap items-center gap-2 rounded-lg bg-white/95 px-3 py-2 shadow-sm ring-1 ring-slate-200 backdrop-blur">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-ink">Version publiée : {state.version}</span>
        {dirty ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">Modifications non publiées</span> : <span className="text-xs text-muted">À jour</span>}
        <input className="input ml-auto w-full text-sm sm:w-64" placeholder="Note (ex. thème Noël, nouvel onglet)" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
        <button type="button" disabled={!dirty || pending} onClick={() => { setCfg(state.config); setMsg(null); }} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-ink disabled:opacity-40">Annuler</button>
        <button type="button" disabled={!dirty || pending} onClick={publish} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-40">{pending ? "Publication…" : "Publier dans l'application"}</button>
      </div>
      {msg ? <p className={"rounded-md px-3 py-2 text-sm " + (msg.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800")}>{msg.text}</p> : null}

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => pickTab(t)}
            className={"shrink-0 border-b-2 px-3 py-2 text-sm font-semibold " + (tab === t.id ? "border-brand-600 text-brand-800" : "border-transparent text-muted hover:text-ink")}>{t.l}</button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          {tab === "theme" ? <ThemeTab cfg={cfg} set={set} setCfg={setCfg} /> : null}
          {tab === "home" ? <HomeTab cfg={cfg} set={set} setList={setList} /> : null}
          {tab === "nav" ? <NavTab cfg={cfg} set={set} setList={setList} /> : null}
          {tab === "drawer" ? <DrawerTab cfg={cfg} setList={setList} /> : null}
          {tab === "results" ? <ResultsTab cfg={cfg} set={set} setList={setList} setScreen={setScreen} /> : null}
          {tab === "filters" ? <FiltersTab cfg={cfg} setList={setList} /> : null}
          {tab === "features" ? <FeaturesTab cfg={cfg} set={set} /> : null}
          {tab === "advanced" ? (
            <AdvancedTab json={json} setJson={setJson} apply={(c) => { setCfg(c); setMsg({ ok: true, text: "JSON appliqué au brouillon (pas encore publié)." }); }} state={state}
              exportJson={exportJson} pending={pending}
              preview={async (id) => { const r = await getAppConfigVersionAction(id); if (r.ok && r.config) { setCfg(r.config); setMsg({ ok: true, text: "Version chargée dans le brouillon : vérifiez l'aperçu puis publiez." }); } else setMsg({ ok: false, text: r.error ?? "Version introuvable." }); }}
              restore={(id) => start(async () => done(await restoreAppConfigAction(id), "Version restaurée et republiée (version {v})."))}
              reset={() => { if (confirm("Revenir à la configuration d'origine de l'application ? Elle sera publiée immédiatement.")) start(async () => done(await resetAppConfigAction(), "Configuration d'origine republiée (version {v})."));}} />
          ) : null}
        </div>

        <aside className="space-y-2 lg:sticky lg:top-32 lg:self-start">
          <div className="flex flex-wrap justify-center gap-1">
            {([["home", "Accueil"], ["results", "Résultats"], ["detail", "Fiche"], ["drawer", "Menu"], ["filters", "Filtres"]] as [PreviewScreen, string][]).map(([s, l]) => (
              <button key={s} type="button" onClick={() => setScreen(s)} className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (screen === s ? "bg-ink text-white" : "bg-slate-100 text-ink")}>{l}</button>
            ))}
            <button type="button" onClick={() => setDark(!dark)} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-ink">{dark ? "☾ Sombre" : "☀ Clair"}</button>
          </div>
          <PhonePreview cfg={cfg} screen={screen} dark={dark} />
          <p className="text-center text-[11px] text-muted">Aperçu indicatif, mis à jour à chaque modification.</p>
        </aside>
      </div>
    </div>
  );
}

// ───────────────────────── Onglets ─────────────────────────

function Box({ title, help, children, action }: { title: string; help?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div><h2 className="font-semibold text-ink">{title}</h2>{help ? <p className="text-xs text-muted">{help}</p> : null}</div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ThemeTab({ cfg, set, setCfg }: { cfg: Cfg; set: (k: string, v: unknown) => void; setCfg: (f: (c: Cfg) => Cfg) => void }) {
  const [uploading, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <Box title="Thèmes prêts à l'emploi" help="Un clic applique un jeu de couleurs complet (clair et sombre). Vous pouvez ensuite ajuster chaque couleur.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {PRESETS.map((p) => {
            const on = String(cfg.primary_color).toUpperCase() === `#FF${p.primary}`;
            return (
              <button key={p.id} type="button" onClick={() => setCfg((c) => applyPreset(c, p))}
                className={"rounded-lg p-2 text-left ring-1 hover:ring-brand-500 " + (on ? "ring-2 ring-brand-600" : "ring-slate-200")}>
                <span className="flex h-10 overflow-hidden rounded-md">
                  <span className="flex-[3]" style={{ background: `#${p.primary}` }} /><span className="flex-[2]" style={{ background: `#${p.secondary}` }} />
                  <span className="flex-1" style={{ background: `#${p.accent}` }} /><span className="flex-1" style={{ background: `#${p.dark}` }} />
                </span>
                <span className="mt-1 block text-xs font-semibold text-ink">{p.l}</span>
              </button>
            );
          })}
        </div>
      </Box>
      <Box title="Identité" help="Nom, logo du menu et police de toute l'application.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nom de l'application"><input className="input text-sm" maxLength={40} value={cfg.app_name ?? ""} onChange={(e) => set("app_name", e.target.value)} /></Field>
          <Field label="Police"><Select value={cfg.moboo_font_family ?? ""} options={FONTS.map((f) => ({ v: f.v, l: f.l }))} onChange={(v) => set("moboo_font_family", v)} /></Field>
          <Field label="Phrase d'accueil"><input className="input text-sm" maxLength={120} value={cfg.quote ?? ""} onChange={(e) => set("quote", e.target.value)} /></Field>
          <Field label="Logo (menu et en-tête)" help="PNG transparent conseillé. Vide : logo intégré à l'application.">
            <div className="flex items-center gap-2">
              {cfg.moboo_logo_url ? <img src={cfg.moboo_logo_url} alt="" className="h-9 w-9 rounded bg-slate-100 object-contain p-0.5" /> : null}
              <label className={"cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50 " + (uploading ? "opacity-60" : "")}>
                {uploading ? "Envoi…" : "Téléverser"}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading} onChange={(e) => {
                  const file = e.target.files?.[0]; e.target.value = "";
                  if (!file) return;
                  start(async () => { setErr(null); const r = await uploadImageAction(await shrink(file), "annonce"); if (r.ok && r.url) set("moboo_logo_url", r.url); else setErr(r.error ?? "Envoi impossible."); });
                }} />
              </label>
              {cfg.moboo_logo_url ? <button type="button" className="text-sm font-semibold text-red-600" onClick={() => set("moboo_logo_url", "")}>Retirer</button> : null}
            </div>
            {err ? <span className="text-xs text-red-600">{err}</span> : null}
          </Field>
        </div>
      </Box>
      <Box title="Couleurs principales">
        <div className="grid gap-x-6 sm:grid-cols-2">{COLORS_MAIN.map(([k, l]) => <ColorField key={k} k={k} label={l} cfg={cfg} set={set} />)}</div>
      </Box>
      <Box title="Boutons de contact">
        <div className="grid gap-x-6 sm:grid-cols-2">{COLORS_BUTTONS.map(([k, l]) => <ColorField key={k} k={k} label={l} cfg={cfg} set={set} />)}</div>
      </Box>
      <div className="grid gap-5 xl:grid-cols-2">
        <Box title="Mode clair">{COLORS_LIGHT.map(([k, l]) => <ColorField key={k} k={k} label={l} cfg={cfg} set={set} />)}</Box>
        <Box title="Mode sombre">{COLORS_DARK.map(([k, l]) => <ColorField key={k} k={k} label={l} cfg={cfg} set={set} />)}</Box>
      </div>
    </>
  );
}

function HomeTab({ cfg, set, setList }: { cfg: Cfg; set: (k: string, v: unknown) => void; setList: (k: string, v: Cfg[]) => void }) {
  const items = list(cfg, "home_layout");
  return (
    <>
      <Box title="Modèle d'accueil">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Modèle"><Select value={cfg.default_home ?? "home_0"} options={HOME_DESIGNS.map((h) => ({ v: h.v, l: h.l }))} onChange={(v) => set("default_home", v)} /></Field>
          <Field label="Onglets de recherche affichés" help="Nombre de statuts proposés en tête (À louer, À vendre…).">
            <input type="number" min={0} max={6} className="input text-sm" value={cfg.show_total_search_type_options ?? 2} onChange={(e) => set("show_total_search_type_options", Math.max(0, Math.min(6, Number(e.target.value) || 0)))} />
          </Field>
        </div>
      </Box>
      <Box title="Sections de l'accueil" help="Glissez-déposez pour réordonner, cliquez une section pour la régler." action={<AddMenu label="Ajouter une section" options={HOME_TYPES} onPick={(o) => setList("home_layout", [...items, o.make()])} />}>
        <SortableList items={items} onChange={(v) => setList("home_layout", v)}
          title={(s) => <><span className="font-semibold text-ink">{s.section_type === "place_holder" ? homeLabel(s) : s.title || homeLabel(s)}</span> <span className="text-xs text-muted">· {homeLabel(s)}</span></>}
          render={(s, up) => s.section_type === "place_holder" ? (
            <p className="text-xs text-muted">Bloc Moboo intégré à l'application : il se place où vous voulez, sans réglage.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Titre"><input className="input text-sm" value={s.title ?? ""} onChange={(e) => up({ title: e.target.value })} /></Field>
              {s.section_type === "property" ? (
                <div className="sm:col-span-2"><Field label="Modèle de carte (rendu de l'application)"><DesignPicker value={s.layout_design || "design_01"} onChange={(v) => up({ layout_design: v })} /></Field></div>
              ) : ["term", "agents", "agencies", "blogs"].includes(s.section_type) ? (
                <Field label="Modèle"><Select value={s.layout_design || "design_01"} options={[{ v: "design_01", l: "Modèle 1" }, { v: "design_02", l: "Modèle 2" }]} onChange={(v) => up({ layout_design: v })} /></Field>
              ) : null}
              {s.section_type !== "ad" && s.section_type !== "term_with_icons" ? (
                <Field label="Affichage"><Select value={s.section_listing_view || "carousel"} options={LISTING_VIEWS} onChange={(v) => up({ section_listing_view: v })} /></Field>
              ) : null}
              {s.section_type === "property" || s.section_type === "term" ? (
                <>
                  <Field label="Contenu"><Select value={s.sub_type ?? ""} options={SUB_TYPES} onChange={(v) => up({ sub_type: v, show_featured: v === "property_feature", sub_type_value: v ? s.sub_type_value || "all" : "" })} /></Field>
                  {s.sub_type && s.sub_type !== "property_feature" ? (
                    <Field label="Valeur (slug)" help="Ex. abidjan, residence-meublee, a-louer. « all » : toutes.">
                      <input className="input text-sm" value={s.sub_type_value ?? ""} onChange={(e) => {
                        const v = e.target.value.trim().toLowerCase();
                        const route = s.sub_type === "property_city" && v && v !== "all" ? { search_api_map: { "location[]": v }, search_route_map: { property_city_slug: [v], property_city: [v] } } : {};
                        up({ sub_type_value: v, ...route });
                      }} />
                    </Field>
                  ) : null}
                </>
              ) : null}
              {s.section_type === "property" ? (
                <div className="sm:col-span-2"><Toggle on={!!s.show_nearby} onChange={(v) => up({ show_nearby: v })} label="Seulement autour de la position du téléphone" /></div>
              ) : null}
            </div>
          )} />
      </Box>
    </>
  );
}

function NavTab({ cfg, set, setList }: { cfg: Cfg; set: (k: string, v: unknown) => void; setList: (k: string, v: Cfg[]) => void }) {
  const items = list(cfg, "bottom_navigation_bar_layout");
  const max = 5;
  return (
    <>
      <Box title="Style de la barre">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Modèle"><Select value={cfg.default_bottom_navbar_design ?? "design_01"} options={NAVBAR_DESIGNS} onChange={(v) => set("default_bottom_navbar_design", v)} /></Field>
          <div className="pt-5"><Toggle on={!!cfg.show_bottom_navbar_add_button} onChange={(v) => set("show_bottom_navbar_add_button", v)} label="Bouton « + Publier » au centre" /></div>
        </div>
      </Box>
      <Box title={`Onglets (${items.length}/${max})`} help="De 2 à 5 onglets ; « Accueil » est obligatoire. Les onglets Moboo (Réserver, Mon espace…) s'ouvrent dans l'application."
        action={items.length < max ? <AddMenu label="Ajouter un onglet" options={NAV_TYPES.filter((t) => !items.some((x) => navTypeOf(x) === t))} onPick={(t) => setList("bottom_navigation_bar_layout", [...items, newNavItem(t)])} /> : null}>
        <SortableList items={items} onChange={(v) => setList("bottom_navigation_bar_layout", v)}
          title={(n) => (
            <span className="flex items-center gap-2">
              <span className="text-brand-700"><MIcon name={iconName(n.icon_data)} /></span>
              <span className="font-semibold text-ink">{n.title}</span><span className="text-xs text-muted">· {navTypeOf(n)?.l ?? n.section_type}</span>
            </span>
          )}
          render={(n, up) => (
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Icône"><IconPicker value={iconName(n.icon_data)} onChange={(name) => up({ icon_data: iconJson(name) })} /></Field>
              <Field label="Libellé"><input className="input text-sm" maxLength={18} value={n.title ?? ""} onChange={(e) => up({ title: e.target.value })} /></Field>
              {n.section_type === "web_url" ? <Field label="Adresse"><input className="input text-sm" value={n.url ?? ""} onChange={(e) => up({ url: e.target.value })} /></Field> : null}
              <div className="min-w-48"><Toggle on={!!n.check_login} onChange={(v) => up({ check_login: v })} label="Connexion requise" /></div>
            </div>
          )} />
      </Box>
    </>
  );
}

function DrawerTab({ cfg, setList }: { cfg: Cfg; setList: (k: string, v: Cfg[]) => void }) {
  const items = list(cfg, "drawer_layout");
  return (
    <Box title="Menu latéral" help="Ordre, libellés et visibilité des entrées du menu (☰).">
      <SortableList items={items} onChange={(v) => setList("drawer_layout", v)} disabled={(d) => d.enable === false}
        title={(d) => <><span className="font-semibold text-ink">{d.title || DRAWER_LABEL[d.section_type]}</span> <span className="text-xs text-muted">· {DRAWER_LABEL[d.section_type] ?? d.section_type}{d.enable === false ? " · masqué" : ""}</span></>}
        render={(d, up) => (
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Libellé"><input className="input text-sm" value={d.title ?? ""} onChange={(e) => up({ title: e.target.value })} /></Field>
            <div className="pt-5"><Toggle on={d.enable !== false} onChange={(v) => up({ enable: v })} label="Visible" /></div>
            <div className="pt-5"><Toggle on={!!d.check_login} onChange={(v) => up({ check_login: v })} label="Connexion requise" /></div>
          </div>
        )} />
    </Box>
  );
}

function ResultsTab({ cfg, set, setList, setScreen }: { cfg: Cfg; set: (k: string, v: unknown) => void; setList: (k: string, v: Cfg[]) => void; setScreen: (s: PreviewScreen) => void }) {
  const rules = list(cfg, "moboo_results_design_rules");
  const blocks = list(cfg, "property_detail_page_layout");
  const missing = DETAIL_TYPES.filter((t) => !blocks.some((b) => b.widget_type === t));
  const RULE_KEYS = [
    { v: "property_status_slug", l: "Statut" }, { v: "property_type_slug", l: "Type de bien" },
    { v: "city_slug", l: "Ville" }, { v: "property_label_slug", l: "Étiquette" },
  ];
  return (
    <>
      <Box title="Résultats de recherche" help="Modèle des cartes d'annonce de la liste et des carrousels.">
        <div className="grid gap-3 sm:grid-cols-2" onClick={() => setScreen("results")}>
          <Field label="Cartes de la liste"><DesignPicker value={cfg.moboo_results_list_design || "design_12"} onChange={(v) => set("moboo_results_list_design", v)} /></Field>
          <Field label="Cartes du carrousel (sur la carte)"><DesignPicker value={cfg.default_results_item_design || "design_06"} onChange={(v) => set("default_results_item_design", v)} /></Field>
          <Field label="Tri par défaut"><Select value={cfg.default_sort_by || "newest"} options={SORTS} onChange={(v) => set("default_sort_by", v)} /></Field>
        </div>
      </Box>
      <Box title="Modèle selon la recherche" help="Ex. les meublés en grandes cartes, les terrains en liste compacte. La première règle qui correspond l'emporte."
        action={<button type="button" className="rounded-md border border-dashed border-brand-400 px-3 py-2 text-sm font-semibold text-brand-800" onClick={() => setList("moboo_results_design_rules", [...rules, { key: "property_type_slug", value: "", design: "design_12" }])}>+ Ajouter une règle</button>}>
        {rules.length ? (
          <SortableList items={rules} onChange={(v) => setList("moboo_results_design_rules", v)}
            title={(r) => <span className="text-ink">Si <b>{RULE_KEYS.find((k) => k.v === r.key)?.l}</b> = <b>{r.value || "…"}</b> → {CARD_DESIGNS.find((d) => d.v === r.design)?.l}</span>}
            render={(r, up) => (
              <div className="grid gap-2 sm:grid-cols-3">
                <Field label="Critère"><Select value={r.key} options={RULE_KEYS} onChange={(v) => up({ key: v })} /></Field>
                <Field label="Valeur (slug)" help="Ex. a-louer, residence-meublee, abidjan"><input className="input text-sm" value={r.value ?? ""} onChange={(e) => up({ value: e.target.value.trim().toLowerCase() })} /></Field>
                <div className="sm:col-span-3"><Field label="Modèle"><DesignPicker value={r.design} onChange={(v) => up({ design: v })} /></Field></div>
              </div>
            )} />
        ) : <p className="text-sm text-muted">Aucune règle : le même modèle partout.</p>}
      </Box>
      <Box title="Fiche d'un bien" help="Ordre et affichage des blocs (galerie, visite 3D, carte, plans, agent…)."
        action={missing.length ? <AddMenu label="Ajouter un bloc" options={missing.map((t) => ({ l: DETAIL_LABEL[t], t }))} onPick={(o) => setList("property_detail_page_layout", [...blocks, { widget_type: o.t, widget_title: DETAIL_LABEL[o.t], widget_enable: true, widget_view_type: "" }])} /> : null}>
        <div onClick={() => setScreen("detail")}>
          <SortableList items={blocks} onChange={(v) => setList("property_detail_page_layout", v)} disabled={(b) => b.widget_enable === false}
            title={(b) => <><span className="font-semibold text-ink">{b.widget_title || DETAIL_LABEL[b.widget_type]}</span> <span className="text-xs text-muted">· {DETAIL_LABEL[b.widget_type] ?? b.widget_type}{b.widget_enable === false ? " · masqué" : ""}</span></>}
            render={(b, up) => (
              <div className="grid gap-2 sm:grid-cols-3">
                <Field label="Titre affiché"><input className="input text-sm" value={b.widget_title ?? ""} onChange={(e) => up({ widget_title: e.target.value })} /></Field>
                <div className="pt-5"><Toggle on={b.widget_enable !== false} onChange={(v) => up({ widget_enable: v })} label="Affiché" /></div>
                {["article_multi_units", "article_related_posts"].includes(b.widget_type) ? (
                  <Field label="Présentation"><Select value={b.widget_view_type || "list"} options={[{ v: "list", l: "Liste" }, { v: "carousel", l: "Carrousel" }]} onChange={(v) => up({ widget_view_type: v })} /></Field>
                ) : null}
              </div>
            )} />
        </div>
      </Box>
    </>
  );
}

function FiltersTab({ cfg, setList }: { cfg: Cfg; setList: (k: string, v: Cfg[]) => void }) {
  const items = list(cfg, "filter_page_layout");
  return (
    <Box title="Filtres de recherche" help="Critères proposés dans l'écran Filtres, dans l'ordre." action={<AddMenu label="Ajouter un filtre" options={FILTER_TYPES} onPick={(o) => setList("filter_page_layout", [...items, o.make()])} />}>
      <SortableList items={items} onChange={(v) => setList("filter_page_layout", v)}
        title={(f) => <><span className="font-semibold text-ink">{f.title}</span> <span className="text-xs text-muted">· {FILTER_KIND[f.section_type] ?? f.section_type} ({f.data_type})</span></>}
        render={(f, up) => (
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Titre"><input className="input text-sm" value={f.title ?? ""} onChange={(e) => up({ title: e.target.value })} /></Field>
            {PICKER_TYPES[f.section_type] ? <Field label="Présentation"><Select value={f.picker_type ?? ""} options={PICKER_TYPES[f.section_type]} onChange={(v) => up({ picker_type: v })} /></Field> : null}
            {f.section_type === "range_picker" ? (
              <>
                <Field label="Minimum"><input className="input text-sm" inputMode="numeric" value={f.min_range_value ?? "0"} onChange={(e) => up({ min_range_value: e.target.value.replace(/\D/g, "") })} /></Field>
                <Field label="Maximum"><input className="input text-sm" inputMode="numeric" value={f.max_range_value ?? "0"} onChange={(e) => up({ max_range_value: e.target.value.replace(/\D/g, "") })} /></Field>
                <Field label="Pas"><input className="input text-sm" inputMode="numeric" value={f.div_range_value ?? "1000"} onChange={(e) => up({ div_range_value: e.target.value.replace(/\D/g, "") })} /></Field>
              </>
            ) : null}
            {f.section_type === "location_picker" ? (
              <>
                <Field label="Rayon par défaut (km)"><input className="input text-sm" inputMode="numeric" value={f.default_radius ?? "50"} onChange={(e) => up({ default_radius: e.target.value.replace(/\D/g, "") })} /></Field>
                <div className="pt-5"><Toggle on={f.show_search_by_location !== false} onChange={(v) => up({ show_search_by_location: v })} label="Autour de ma position" /></div>
                <div className="pt-5"><Toggle on={f.show_search_by_city !== false} onChange={(v) => up({ show_search_by_city: v })} label="Par ville" /></div>
              </>
            ) : null}
            {f.section_type === "term_picker" ? <Field label="Combinaison"><Select value={f.query_type ?? ""} options={[{ v: "", l: "Par défaut" }, { v: "OR", l: "Au moins un (OU)" }, { v: "AND", l: "Tous (ET)" }]} onChange={(v) => up({ query_type: v || null })} /></Field> : null}
          </div>
        )} />
    </Box>
  );
}

function FeaturesTab({ cfg, set }: { cfg: Cfg; set: (k: string, v: unknown) => void }) {
  const LINKS: [string, string][] = [
    ["company_url", "Site de l'entreprise"], ["app_terms_url", "Conditions générales"], ["app_terms_of_use_url", "Conditions d'utilisation"],
    ["app_privacy_url", "Politique de confidentialité"], ["wordpress_url_gdpr_agreement", "Protection des données (RGPD)"],
  ];
  return (
    <>
      <div className="grid gap-5 xl:grid-cols-2">
        {TOGGLES.map((g) => (
          <Box key={g.group} title={g.group}>{g.items.map((t) => <Toggle key={t.k} on={!!cfg[t.k]} onChange={(v) => set(t.k, v)} label={t.l} />)}</Box>
        ))}
        <Box title="Annonces">
          <Field label="Photos maximum par annonce"><input type="number" min={1} max={40} className="input w-28 text-sm" value={cfg.max_prop_images ?? 10} onChange={(e) => set("max_prop_images", Math.max(1, Math.min(40, Number(e.target.value) || 10)))} /></Field>
        </Box>
      </div>
      <Box title="Pages légales et liens" help="Ouverts depuis les réglages et l'inscription de l'application.">
        <div className="grid gap-3 sm:grid-cols-2">
          {LINKS.map(([k, l]) => <Field key={k} label={l}><input className="input text-sm" type="url" placeholder="https://moboo.ci/…" value={cfg[k] ?? ""} onChange={(e) => set(k, e.target.value.trim())} /></Field>)}
        </div>
      </Box>
      <Box title="Connexion au site" help="Gérée par la passerelle du nouveau site : adresse, App Secret et sécurité NONCE se règlent dans Application mobile › Réglages.">
        <a href="/admin/application/reglages" className="text-sm font-semibold text-brand-800 hover:underline">Ouvrir les réglages de la passerelle →</a>
      </Box>
    </>
  );
}

function AdvancedTab({ json, setJson, apply, state, exportJson, preview, restore, reset, pending }: {
  json: string; setJson: (s: string) => void; apply: (c: Cfg) => void; state: BuilderState; exportJson: () => void;
  preview: (id: string) => void; restore: (id: string) => void; reset: () => void; pending: boolean;
}) {
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const tryApply = (text: string) => {
    try {
      const o = JSON.parse(text);
      if (!o || typeof o !== "object" || Array.isArray(o)) throw new Error();
      setErr(null);
      apply(o);
    } catch { setErr("JSON invalide : un objet { … } est attendu."); }
  };
  return (
    <>
      <Box title="Historique des publications" help="Chaque publication est gardée : chargez-la dans le brouillon pour la comparer, ou republiez-la directement.">
        {state.history.length ? (
          <ul className="divide-y divide-slate-100">
            {state.history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs">v{h.version}</span>
                <span className="text-ink">{h.note || "—"}</span>
                <span className="text-xs text-muted">{fmt(h.createdAt)}</span>
                <span className="ml-auto flex gap-2">
                  <button type="button" className="text-xs font-semibold text-brand-800 hover:underline" onClick={() => preview(h.id)}>Charger</button>
                  {h.version !== state.version ? <button type="button" disabled={pending} className="text-xs font-semibold text-amber-800 hover:underline" onClick={() => { if (confirm(`Republier la version ${h.version} ?`)) restore(h.id); }}>Republier</button> : <span className="text-xs text-emerald-700">en ligne</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">Aucune publication depuis le builder pour l'instant.</p>}
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          <button type="button" onClick={exportJson} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-ink">Exporter config.json</button>
          <button type="button" onClick={() => fileRef.current?.click()} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-ink">Importer un fichier (Houzi Builder)</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) tryApply(await f.text()); }} />
          <button type="button" disabled={pending} onClick={reset} className="ml-auto rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Configuration d'origine</button>
        </div>
      </Box>
      <Box title="Éditeur JSON" help="Pour les réglages non couverts par les onglets. « Appliquer » met à jour le brouillon et l'aperçu ; rien n'est publié avant « Publier »."
        action={<button type="button" onClick={() => tryApply(json)} className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white">Appliquer</button>}>
        <textarea className="input h-[28rem] w-full font-mono text-xs" spellCheck={false} value={json} onChange={(e) => setJson(e.target.value)} />
        {err ? <p className="mt-1 text-xs font-medium text-red-600">{err}</p> : null}
      </Box>
    </>
  );
}
