"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import type { BlockField, ChromeContent } from "@/lib/page-blocks";
import {
  MAX_DEPTH, MENU_LOCATIONS, MENU_VARIANTS, flatten, menuId, unflatten,
  type FlatItem, type MenuItem, type MenuLocation, type SiteMenu,
} from "@/lib/menus";
import { publishAction } from "@/app/admin/accueil/actions";
import { FieldEditor, type Opt } from "./field-editor";
import { NavMenu } from "../nav-menu";

const LINK: BlockField[] = [{ key: "label", label: "Texte", type: "text" }, { key: "href", label: "Lien", type: "url" }];
const COLUMNS: BlockField = {
  key: "columns", label: "Colonnes de liens", type: "list", itemLabel: "Colonne",
  fields: [{ key: "title", label: "Titre de la colonne", type: "text" }, { key: "links", label: "Liens", type: "list", itemLabel: "Lien", fields: LINK }],
};

/** Pages du site proposées dans « Ajouter des éléments ». */
const PAGES: Opt[] = [
  { value: "/", label: "Accueil" },
  { value: "/annonces", label: "Toutes les annonces" },
  { value: "/annonces?transaction=rent", label: "À louer" },
  { value: "/annonces?transaction=sale", label: "À vendre" },
  { value: "/annonces?transaction=furnished", label: "Meublés" },
  { value: "/annonces?transaction=event", label: "Espaces événementiels" },
  { value: "/annonces?propertyType=terrain", label: "Terrains" },
  { value: "/reserver", label: "Réserver" },
  { value: "/publier", label: "Publier une annonce" },
  { value: "/forfaits", label: "Forfaits" },
  { value: "/favoris", label: "Favoris" },
  { value: "/compte", label: "Se connecter" },
  { value: "/inscription", label: "Créer un compte" },
  { value: "/mon-espace", label: "Mon espace" },
  { value: "/administration", label: "Espace administrateur" },
];

type Tab = "menus" | "locations" | "footer";

function Section({ title, children, open: initial = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-ink">
        {title}<span className="text-slate-400">{open ? "▴" : "▾"}</span>
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

/** Liste à cocher + « Ajouter au menu » (façon WordPress). */
function Picker({ options, onAdd }: { options: Opt[]; onAdd: (o: Opt[]) => void }) {
  const [sel, setSel] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const list = options.filter((o) => !q || o.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      {options.length > 8 ? <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="input mb-2 text-sm" /> : null}
      <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
        {list.map((o) => (
          <label key={o.value + o.label} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-slate-50">
            <input type="checkbox" className="accent-brand-700" checked={sel.includes(o.value)} onChange={(e) => setSel(e.target.checked ? [...sel, o.value] : sel.filter((x) => x !== o.value))} />
            {o.label}
          </label>
        ))}
        {!list.length ? <p className="text-xs text-muted">Aucun résultat.</p> : null}
      </div>
      <div className="mt-2 flex justify-between">
        <button type="button" onClick={() => setSel(sel.length === list.length ? [] : list.map((o) => o.value))} className="text-xs font-semibold text-muted">{sel.length === list.length && list.length ? "Tout décocher" : "Tout cocher"}</button>
        <button type="button" disabled={!sel.length} onClick={() => { onAdd(options.filter((o) => sel.includes(o.value))); setSel([]); }}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40">Ajouter au menu</button>
      </div>
    </div>
  );
}

function Txt({ label, value, onChange, placeholder }: { label: string; value?: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      <input className="input text-sm" value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/** Une ligne de la structure du menu (glisser, décaler, modifier). */
function Row({ it, i, flat, set, remove, move, indent, dragging, onDragStart, onDrop, open, toggle }: {
  it: FlatItem; i: number; flat: FlatItem[]; set: (patch: Partial<FlatItem>) => void; remove: () => void;
  move: (d: -1 | 1) => void; indent: (d: -1 | 1) => void; dragging: boolean;
  onDragStart: () => void; onDrop: () => void; open: boolean; toggle: () => void;
}) {
  const parent = flat.slice(0, i).reverse().find((x) => x.depth < it.depth);
  const inMega = (it.depth === 1 && parent?.mega) || (it.depth === 2 && flat.slice(0, i).reverse().find((x) => x.depth === 0)?.mega);
  const kind = it.depth === 0 ? (it.mega ? "Méga menu" : "") : inMega ? (it.depth === 1 ? "Colonne" : "Lien de colonne") : "Sous-élément";
  const canIn = i > 0 && it.depth < Math.min(MAX_DEPTH, flat[i - 1].depth + 1);
  return (
    <div style={{ marginLeft: it.depth * 28 }} draggable onDragStart={onDragStart} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}
      className={"rounded-xl border bg-white transition " + (dragging ? "opacity-40 " : "") + (open ? "border-brand-300 shadow-sm" : "border-slate-200")}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="cursor-grab select-none text-slate-400" title="Glisser pour déplacer">⋮⋮</span>
        <button type="button" onClick={toggle} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className="truncate text-sm font-semibold text-ink">{it.icon ? `${it.icon} ` : ""}{it.label || "(sans titre)"}</span>
          {kind ? <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">{kind}</span> : null}
          {it.highlight ? <span className="shrink-0 rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-bold uppercase text-accent-700">Bouton</span> : null}
        </button>
        <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
          <button type="button" title="Remonter d’un niveau" disabled={it.depth === 0} onClick={() => indent(-1)} className="rounded px-1.5 py-1 hover:bg-slate-100 disabled:opacity-25">◀</button>
          <button type="button" title="Mettre en sous-élément" disabled={!canIn} onClick={() => indent(1)} className="rounded px-1.5 py-1 hover:bg-slate-100 disabled:opacity-25">▶</button>
          <button type="button" title="Monter" disabled={i === 0} onClick={() => move(-1)} className="rounded px-1.5 py-1 hover:bg-slate-100 disabled:opacity-25">▲</button>
          <button type="button" title="Descendre" disabled={i === flat.length - 1} onClick={() => move(1)} className="rounded px-1.5 py-1 hover:bg-slate-100 disabled:opacity-25">▼</button>
        </span>
      </div>
      {open ? (
        <div className="space-y-3 border-t border-slate-100 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Txt label="Libellé" value={it.label} onChange={(v) => set({ label: v })} />
            <Txt label="Lien" value={it.href} onChange={(v) => set({ href: v })} placeholder="/annonces?… ou https://…" />
            <Txt label="Icône (emoji)" value={it.icon} onChange={(v) => set({ icon: v.slice(0, 4) })} placeholder="🏡" />
            <Txt label="Pastille" value={it.badge} onChange={(v) => set({ badge: v.slice(0, 16) })} placeholder="Nouveau" />
          </div>
          <Txt label="Description (sous le libellé)" value={it.description} onChange={(v) => set({ description: v.slice(0, 120) })} />
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-brand-700" checked={!!it.newTab} onChange={(e) => set({ newTab: e.target.checked })} />Ouvrir dans un nouvel onglet</label>
            {it.depth === 0 ? <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-brand-700" checked={!!it.highlight} onChange={(e) => set({ highlight: e.target.checked })} />Afficher comme un bouton</label> : null}
            {it.depth === 0 ? <label className="inline-flex items-center gap-2 font-semibold"><input type="checkbox" className="accent-brand-700" checked={!!it.mega} onChange={(e) => set({ mega: e.target.checked })} />Méga menu</label> : null}
          </div>
          {it.depth === 0 && it.mega ? (
            <div className="space-y-3 rounded-xl bg-brand-50/60 p-3">
              <p className="text-xs text-brand-900">Les sous-éléments deviennent des <strong>colonnes</strong> ; leurs propres sous-éléments sont les liens de chaque colonne. Une carte mise en avant peut s’afficher à droite.</p>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Nombre de colonnes</span>
                <select className="input w-32 text-sm" value={it.megaColumns ?? 3} onChange={(e) => set({ megaColumns: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Txt label="Carte : titre" value={it.promoTitle} onChange={(v) => set({ promoTitle: v })} />
                <Txt label="Carte : bouton" value={it.promoCta} onChange={(v) => set({ promoCta: v })} />
                <Txt label="Carte : texte" value={it.promoText} onChange={(v) => set({ promoText: v })} />
                <Txt label="Carte : lien" value={it.promoHref} onChange={(v) => set({ promoHref: v })} />
              </div>
              <div>
                <span className="mb-1 block text-xs font-semibold text-slate-600">Carte : image</span>
                <FieldEditor f={{ key: "promoImage", label: "", type: "image" }} value={it.promoImage} onChange={(v) => set({ promoImage: v })} types={[]} />
              </div>
            </div>
          ) : null}
          <div className="flex justify-end">
            <button type="button" onClick={remove} className="text-sm font-semibold text-red-600">Supprimer{flat[i + 1]?.depth > it.depth ? " (et ses sous-éléments)" : ""}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Apparence → Menus (plusieurs menus, emplacements, style, méga menus) et pied de page. */
export function ChromeEditor({ initial, types = [], cities = [] }: { initial: ChromeContent; types?: Opt[]; cities?: Opt[] }) {
  const [c, setC] = useState<ChromeContent>(initial);
  const [tab, setTab] = useState<Tab>("menus");
  const [menuSel, setMenuSel] = useState(initial.locations.header || initial.menus[0]?.id || "");
  const [openId, setOpenId] = useState<string | null>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const [custom, setCustom] = useState({ label: "", href: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const firstLoad = useRef(true);

  const menu = c.menus.find((m) => m.id === menuSel) ?? c.menus[0];
  const flat = useMemo(() => flatten(menu?.items ?? []), [menu]);
  const update = (next: ChromeContent) => { setC(next); setDirty(true); setMsg(null); firstLoad.current = false; };
  const setMenus = (fn: (m: SiteMenu[]) => SiteMenu[]) => update({ ...c, menus: fn(c.menus) });
  const setFlat = (f: FlatItem[]) => setMenus((ms) => ms.map((m) => (m.id === menu?.id ? { ...m, items: unflatten(f) } : m)));
  const f = (patch: Partial<ChromeContent["footer"]>) => update({ ...c, footer: { ...c.footer, ...patch } });

  // Opérations sur la liste à plat (un élément emporte ses sous-éléments).
  const blockEnd = (i: number) => { let j = i + 1; while (j < flat.length && flat[j].depth > flat[i].depth) j++; return j; };
  const moveBlock = (i: number, d: -1 | 1) => {
    const end = blockEnd(i); const block = flat.slice(i, end); const rest = [...flat.slice(0, i), ...flat.slice(end)];
    let at: number;
    if (d < 0) { let k = i - 1; while (k > 0 && flat[k].depth > flat[i].depth) k--; at = Math.max(0, k); }
    else { if (end >= flat.length) return; at = i + (blockEnd(end) - end); }
    rest.splice(at, 0, ...block); setFlat(rest);
  };
  const indent = (i: number, d: -1 | 1) => {
    const end = blockEnd(i);
    setFlat(flat.map((x, k) => (k >= i && k < end ? { ...x, depth: Math.max(0, Math.min(MAX_DEPTH, x.depth + d)) } : x)));
  };
  const dropOn = (target: number) => {
    if (drag === null || drag === target) return;
    const end = blockEnd(drag);
    if (target >= drag && target < end) return;
    const block = flat.slice(drag, end); const rest = [...flat.slice(0, drag), ...flat.slice(end)];
    const at = target > drag ? target - block.length + 1 : target;
    const depth0 = rest[at - 1] ? Math.min(block[0].depth, rest[at - 1].depth + 1) : 0;
    const shift = depth0 - block[0].depth;
    rest.splice(at, 0, ...block.map((x) => ({ ...x, depth: Math.max(0, x.depth + shift) })));
    setFlat(rest); setDrag(null);
  };
  const add = (items: Opt[]) => {
    const created = items.map((o) => ({ id: menuId(), label: o.label, href: o.value, depth: 0 }));
    setFlat([...flat, ...created]);
    if (created.length === 1) setOpenId(created[0].id);
  };

  const newMenu = () => {
    const name = window.prompt("Nom du nouveau menu", "Nouveau menu");
    if (!name) return;
    const m: SiteMenu = { id: menuId(), name: name.slice(0, 60), items: [] };
    update({ ...c, menus: [...c.menus, m] }); setMenuSel(m.id);
  };
  const usedAt = (id: string) => MENU_LOCATIONS.filter((l) => c.locations[l.id] === id).map((l) => l.label);
  const deleteMenu = () => {
    if (!menu || c.menus.length < 2) return;
    const used = usedAt(menu.id);
    if (!window.confirm(`Supprimer le menu « ${menu.name} » ?${used.length ? `\nIl est utilisé : ${used.join(", ")}.` : ""}`)) return;
    const locations = Object.fromEntries(Object.entries(c.locations).map(([k, v]) => [k, v === menu.id ? "" : v])) as ChromeContent["locations"];
    const menus = c.menus.filter((m) => m.id !== menu.id);
    update({ ...c, menus, locations }); setMenuSel(menus[0].id);
  };

  const publish = () => start(async () => {
    const r = await publishAction("chrome", c);
    if (r.ok) setDirty(false);
    setMsg(r.ok ? { ok: true, text: "Publié sur le site." } : { ok: false, text: r.error ?? "Publication impossible." });
  });

  const TABS: [Tab, string][] = [["menus", "Menus"], ["locations", "Emplacements et style"], ["footer", "Pied de page"]];

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-30 -mx-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-100/95 px-3 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Menus et pied de page</h1>
          <p className="text-sm text-muted">Comme dans WordPress : créez vos menus, placez-les, ajoutez des sous-menus et des méga menus.</p>
        </div>
        <div className="flex items-center gap-3">
          {msg ? <span className={"text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</span>
            : dirty ? <span className="text-sm text-amber-700">Modifications non publiées</span> : null}
          <button type="button" disabled={pending} onClick={publish} className="rounded-md bg-accent-600 px-5 py-2 text-sm font-bold text-white hover:bg-accent-700 disabled:opacity-60">{pending ? "…" : "Publier"}</button>
        </div>
      </div>

      <div className="flex gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200 sm:w-fit">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={"flex-1 rounded-full px-4 py-2 text-sm font-semibold transition sm:flex-none " + (tab === id ? "bg-ink text-white" : "text-slate-600 hover:text-ink")}>{label}</button>
        ))}
      </div>

      {/* Aperçu en direct du menu (survolez un élément) */}
      {tab !== "footer" && menu ? (
        <div className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <p className="border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Aperçu — {menu.name} {c.menuStyle.trigger === "hover" ? "(survolez)" : "(cliquez)"}</p>
          <header className="flex h-16 items-center gap-6 px-5">
            <span className="font-display text-lg font-black text-brand-900">Moboo</span>
            <NavMenu items={menu.items} style={c.menuStyle} tone="light" />
          </header>
        </div>
      ) : null}

      {tab === "menus" && menu ? (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <label className="text-sm font-semibold text-ink">Menu à modifier</label>
            <select className="input w-auto text-sm" value={menu.id} onChange={(e) => { setMenuSel(e.target.value); setOpenId(null); }}>
              {c.menus.map((m) => <option key={m.id} value={m.id}>{m.name}{usedAt(m.id).length ? ` (${usedAt(m.id).join(", ")})` : ""}</option>)}
            </select>
            <button type="button" onClick={newMenu} className="text-sm font-semibold text-brand-800 hover:underline">+ Créer un menu</button>
          </div>
          <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
            <aside className="h-fit overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
              <p className="border-b border-slate-100 px-4 py-3 font-semibold text-ink">Ajouter des éléments</p>
              <Section title="Pages du site" open><Picker options={PAGES} onAdd={add} /></Section>
              {types.length ? <Section title="Types de bien"><Picker options={types.map((t) => ({ value: `/annonces?propertyType=${encodeURIComponent(t.value)}`, label: t.label }))} onAdd={add} /></Section> : null}
              {cities.length ? <Section title="Villes et communes"><Picker options={cities.map((t) => ({ value: `/annonces?q=${encodeURIComponent(t.value)}`, label: t.label }))} onAdd={add} /></Section> : null}
              <Section title="Lien personnalisé">
                <div className="space-y-2">
                  <Txt label="URL" value={custom.href} onChange={(v) => setCustom({ ...custom, href: v })} placeholder="https://… ou /page" />
                  <Txt label="Texte du lien" value={custom.label} onChange={(v) => setCustom({ ...custom, label: v })} />
                  <div className="flex justify-end">
                    <button type="button" disabled={!custom.label || !custom.href} onClick={() => { add([{ value: custom.href, label: custom.label }]); setCustom({ label: "", href: "" }); }}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40">Ajouter au menu</button>
                  </div>
                </div>
              </Section>
            </aside>

            <section className="space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <Txt label="Nom du menu" value={menu.name} onChange={(v) => setMenus((ms) => ms.map((m) => (m.id === menu.id ? { ...m, name: v.slice(0, 60) } : m)))} />
                {c.menus.length > 1 ? <button type="button" onClick={deleteMenu} className="text-sm font-semibold text-red-600">Supprimer ce menu</button> : null}
              </div>
              <p className="text-xs text-muted">Glissez les éléments pour les réordonner. ▶ place un élément sous le précédent (sous-menu), ◀ le remonte d’un niveau. {MAX_DEPTH + 1} niveaux maximum.</p>
              <div className="space-y-2">
                {flat.map((it, i) => (
                  <Row key={it.id} it={it} i={i} flat={flat} open={openId === it.id} toggle={() => setOpenId(openId === it.id ? null : it.id)}
                    set={(patch) => setFlat(flat.map((x, k) => (k === i ? { ...x, ...patch } : x)))}
                    remove={() => setFlat([...flat.slice(0, i), ...flat.slice(blockEnd(i))])}
                    move={(d) => moveBlock(i, d)} indent={(d) => indent(i, d)}
                    dragging={drag === i} onDragStart={() => setDrag(i)} onDrop={() => dropOn(i)} />
                ))}
                {!flat.length ? <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-muted">Menu vide : ajoutez des pages ou des liens depuis la colonne de gauche.</p> : null}
              </div>
            </section>
          </div>
        </>
      ) : null}

      {tab === "locations" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="h-fit space-y-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="font-semibold text-ink">Emplacements des menus</p>
            {MENU_LOCATIONS.map((l) => (
              <label key={l.id} className="block">
                <span className="block text-sm font-semibold text-ink">{l.label}</span>
                <span className="mb-1 block text-xs text-muted">{l.help}</span>
                <select className="input text-sm" value={c.locations[l.id] ?? ""} onChange={(e) => update({ ...c, locations: { ...c.locations, [l.id]: e.target.value } as Record<MenuLocation, string> })}>
                  <option value="">{l.id === "mobile" ? "— Même menu que l’en-tête —" : "— Aucun —"}</option>
                  {c.menus.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </label>
            ))}
          </section>
          <section className="h-fit space-y-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="font-semibold text-ink">Style du menu</p>
            <div>
              <span className="mb-2 block text-sm font-semibold text-ink">Présentation des liens</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MENU_VARIANTS.map((v) => (
                  <button key={v.value} type="button" onClick={() => update({ ...c, menuStyle: { ...c.menuStyle, variant: v.value } })}
                    className={"rounded-xl border p-3 text-center text-sm transition " + (c.menuStyle.variant === v.value ? "border-ink ring-2 ring-ink/10" : "border-slate-200 hover:border-slate-300")}>
                    <span className={"mx-auto mb-2 block w-fit text-xs " + ({ simple: "font-semibold text-slate-600", underline: "border-b-2 border-ink font-semibold", pill: "rounded-full bg-slate-100 px-2 py-0.5 font-semibold", bold: "font-black" } as const)[v.value]}>Louer</span>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-ink">Ouverture des sous-menus</span>
              <select className="input text-sm" value={c.menuStyle.trigger} onChange={(e) => update({ ...c, menuStyle: { ...c.menuStyle, trigger: e.target.value as "hover" | "click" } })}>
                <option value="hover">Au survol de la souris</option>
                <option value="click">Au clic</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-ink">Largeur du méga menu</span>
              <select className="input text-sm" value={c.menuStyle.megaWidth} onChange={(e) => update({ ...c, menuStyle: { ...c.menuStyle, megaWidth: e.target.value as "container" | "full" } })}>
                <option value="container">Centrée (carte flottante)</option>
                <option value="full">Toute la largeur de l’écran</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-700" checked={c.menuStyle.uppercase} onChange={(e) => update({ ...c, menuStyle: { ...c.menuStyle, uppercase: e.target.checked } })} />Libellés en majuscules</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-700" checked={c.menuStyle.showCaret} onChange={(e) => update({ ...c, menuStyle: { ...c.menuStyle, showCaret: e.target.checked } })} />Flèche ▾ sur les éléments à sous-menu</label>
            <p className="text-xs text-muted">Couleurs, style d’en-tête et alignement : Réglages → En-têtes et barre du haut.</p>
          </section>
        </div>
      ) : null}

      {tab === "footer" ? (
        <section className="space-y-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div><p className="mb-1 text-sm font-semibold">Présentation</p><FieldEditor f={{ key: "about", label: "", type: "textarea" }} value={c.footer.about} onChange={(v) => f({ about: v })} types={[]} /></div>
          <div><p className="mb-1 text-sm font-semibold">{COLUMNS.label}</p><FieldEditor f={COLUMNS} value={c.footer.columns} onChange={(v) => f({ columns: v })} types={[]} /></div>
          <FieldEditor f={{ key: "showApps", label: "Boutons de l’application mobile", type: "bool" }} value={c.footer.showApps} onChange={(v) => f({ showApps: v })} types={[]} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="mb-1 text-sm font-semibold">Lien Google Play</p><FieldEditor f={{ key: "playStoreUrl", label: "", type: "url" }} value={c.footer.playStoreUrl} onChange={(v) => f({ playStoreUrl: v })} types={[]} /></div>
            <div><p className="mb-1 text-sm font-semibold">Lien App Store</p><FieldEditor f={{ key: "appStoreUrl", label: "", type: "url" }} value={c.footer.appStoreUrl} onChange={(v) => f({ appStoreUrl: v })} types={[]} /></div>
          </div>
          <div><p className="mb-1 text-sm font-semibold">Mention du bas</p><FieldEditor f={{ key: "bottomText", label: "", type: "text" }} value={c.footer.bottomText} onChange={(v) => f({ bottomText: v })} types={[]} /><p className="mt-1 text-xs text-muted">{"{year}"} = année en cours. Liens à côté : emplacement « Liens du bas de page ». Réseaux sociaux : En-têtes et barre du haut.</p></div>
        </section>
      ) : null}
    </div>
  );
}
