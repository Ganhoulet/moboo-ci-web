"use client";

import { createContext, useContext, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Section } from "@/lib/page-blocks";
import { PAGE_CONTENT_TYPE } from "@/lib/site-editable";
import { discardAction, publishAction, saveDraftAction, type AdminPage } from "@/app/admin/accueil/actions";
import { FieldEditor, type Opt } from "./field-editor";
import { CATALOGS, type CatalogKey } from "./catalogs";

/**
 * Modification directe sur le site (façon Elementor) : l'administrateur voit le
 * brouillon de la page, clique sur un bloc pour changer ses textes et images, le
 * masque, le déplace ou en ajoute un, puis publie, sans passer par le back-office.
 */
interface Live {
  sections: Section[]; selected: string | null; busy: boolean;
  select: (id: string | null) => void; toggle: (id: string) => void; move: (id: string, dir: -1 | 1) => void;
  label: (s: Section) => string;
}
const Ctx = createContext<Live | null>(null);

type Status = { tone: "ok" | "err" | "info"; text: string } | null;

export function LiveEditor({ slug, catalogKey, initial, meta, types, exitHref, builderHref, children }: {
  slug: string; catalogKey: CatalogKey; initial: Section[]; meta: AdminPage | null; types: Opt[];
  exitHref: string; builderHref: string; children: React.ReactNode;
}) {
  const router = useRouter();
  const catalog = CATALOGS[catalogKey];
  const [sections, setSections] = useState<Section[]>(initial);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any> | null>(null);
  const [library, setLibrary] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [dirty, setDirty] = useState(!!meta?.dirty);
  const [busy, start] = useTransition();
  const current = sections.find((s) => s.id === selected) ?? null;
  const def = current ? catalog.def(current.type) : null;

  // La page rechargée renvoie le brouillon enregistré : on repart de lui.
  useEffect(() => { setSections(initial); }, [initial]);
  useEffect(() => { setForm(current ? structuredClone(current.props) : null); setLibrary(false); }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = (next: Section[], text = "Brouillon enregistré : visible ici seulement, pas encore par les visiteurs.") => start(async () => {
    setSections(next);
    const r = await saveDraftAction(slug, { sections: next });
    if (r.ok) { setDirty(true); setStatus({ tone: "info", text }); router.refresh(); }
    else setStatus({ tone: "err", text: r.error ?? "Enregistrement impossible." });
  });
  const label = (s: Section) => catalog.def(s.type)?.label ?? s.type;
  const toggle = (id: string) => save(sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  const move = (id: string, dir: -1 | 1) => {
    const i = sections.findIndex((s) => s.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= sections.length) return;
    const a = [...sections]; [a[i], a[j]] = [a[j], a[i]]; save(a);
  };
  const apply = () => current && form && save(sections.map((s) => (s.id === current.id ? { ...s, props: form } : s)));
  const remove = () => {
    if (!current || !window.confirm(`Supprimer le bloc « ${label(current)} » ? (Pour le cacher sans le perdre, utilisez « Masquer ».)`)) return;
    save(sections.filter((s) => s.id !== current.id)); setSelected(null);
  };
  const add = (type: string) => {
    const s = catalog.create(type);
    const i = current ? sections.findIndex((x) => x.id === current.id) : sections.length - 1;
    const a = [...sections]; a.splice(i + 1, 0, s); save(a); setSelected(s.id);
  };
  const publish = () => start(async () => {
    const r = await publishAction(slug, { sections });
    if (r.ok) { setDirty(false); setStatus({ tone: "ok", text: "Publié : les visiteurs voient maintenant cette version." }); router.refresh(); }
    else setStatus({ tone: "err", text: r.error ?? "Publication impossible." });
  });
  const discard = () => {
    if (!window.confirm("Abandonner toutes les modifications non publiées ?")) return;
    start(async () => {
      const r = await discardAction(slug);
      if (r.ok) { setDirty(false); setSelected(null); setStatus({ tone: "ok", text: "Modifications abandonnées." }); router.refresh(); }
      else setStatus({ tone: "err", text: r.error ?? "Action impossible." });
    });
  };

  return (
    <Ctx.Provider value={{ sections, selected, busy, select: setSelected, toggle, move, label }}>
      <div className={current ? "lg:mr-[380px]" : ""}>{children}</div>

      {/* Barre du mode modification */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center gap-2 border-t border-slate-200 bg-white/95 px-4 py-2.5 shadow-2xl backdrop-blur print:hidden">
        <span className="rounded-full bg-accent-600 px-2.5 py-1 text-xs font-bold text-white">MODE MODIFICATION</span>
        <span className="mr-auto text-xs text-slate-600">
          {status ? <span className={status.tone === "err" ? "text-red-600" : status.tone === "ok" ? "text-emerald-700" : ""}>{status.text}</span>
            : dirty ? "Modifications non publiées (visibles ici seulement)." : "Cliquez sur un bloc pour le modifier."}
          {busy ? " · enregistrement…" : ""}
        </span>
        <a href={builderHref} className="rounded-md px-3 py-1.5 text-sm font-semibold text-ink ring-1 ring-slate-300 hover:bg-slate-50">Constructeur complet</a>
        {dirty ? <button type="button" onClick={discard} disabled={busy} className="rounded-md px-3 py-1.5 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50">Annuler les modifications</button> : null}
        <a href={exitHref} className="rounded-md px-3 py-1.5 text-sm font-semibold text-ink ring-1 ring-slate-300 hover:bg-slate-50">Quitter</a>
        <button type="button" onClick={publish} disabled={busy || !dirty} className="rounded-md bg-ink px-4 py-1.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-40">Publier</button>
      </div>

      {/* Panneau du bloc choisi */}
      {current && def && form ? (
        <aside className="fixed bottom-14 right-0 top-16 z-50 flex w-full max-w-[380px] flex-col border-l border-slate-200 bg-white shadow-2xl print:hidden">
          <div className="flex items-start gap-2 border-b border-slate-100 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{def.icon} {def.label}</p>
              <p className="text-xs text-muted">{def.description}</p>
            </div>
            <button type="button" onClick={() => setSelected(null)} aria-label="Fermer" className="rounded px-2 text-lg text-slate-500 hover:bg-slate-100">×</button>
          </div>
          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 p-3 text-xs font-semibold">
            <button type="button" onClick={() => toggle(current.id)} disabled={busy} className="rounded-md px-2.5 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50">{current.enabled ? "Masquer" : "Afficher"}</button>
            <button type="button" onClick={() => move(current.id, -1)} disabled={busy} className="rounded-md px-2.5 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50">▲ Monter</button>
            <button type="button" onClick={() => move(current.id, 1)} disabled={busy} className="rounded-md px-2.5 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50">▼ Descendre</button>
            <button type="button" onClick={() => setLibrary((v) => !v)} className="rounded-md px-2.5 py-1.5 text-brand-800 ring-1 ring-brand-200 hover:bg-brand-50">+ Bloc en dessous</button>
            {current.type !== PAGE_CONTENT_TYPE ? <button type="button" onClick={remove} disabled={busy} className="rounded-md px-2.5 py-1.5 text-red-700 ring-1 ring-red-200 hover:bg-red-50">Supprimer</button> : null}
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {library ? (
              <div className="grid gap-1.5">
                {catalog.blocks.map((b) => (
                  <button key={b.type} type="button" onClick={() => add(b.type)} className="flex items-start gap-2 rounded-md p-2 text-left ring-1 ring-slate-200 hover:bg-brand-50">
                    <span className="text-xl">{b.icon}</span>
                    <span><span className="block text-sm font-semibold text-ink">{b.label}</span><span className="block text-xs text-muted">{b.description}</span></span>
                  </button>
                ))}
              </div>
            ) : def.fields.length ? def.fields.map((f) => (
              <div key={f.key}>
                {f.type !== "bool" ? <p className="mb-1 text-sm font-semibold text-ink">{f.label}</p> : null}
                <FieldEditor f={f} value={form[f.key]} onChange={(v) => setForm((x) => ({ ...(x ?? {}), [f.key]: v }))} types={types} />
                {f.help ? <p className="mt-1 text-xs text-muted">{f.help}</p> : null}
              </div>
            )) : <p className="text-sm text-muted">Ce bloc n’a pas de texte à modifier ici : vous pouvez le masquer ou le déplacer.</p>}
          </div>
          {!library && def.fields.length ? (
            <div className="border-t border-slate-100 p-3">
              <button type="button" onClick={apply} disabled={busy} className="w-full rounded-md bg-brand-700 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-50">{busy ? "Enregistrement…" : "Appliquer sur la page"}</button>
            </div>
          ) : null}
        </aside>
      ) : null}
      <div className="h-16" aria-hidden />
    </Ctx.Provider>
  );
}

/** Cadre cliquable autour d'un bloc de la page, avec sa barre d'outils. */
export function LiveSection({ id, children }: { id: string; children: React.ReactNode }) {
  const live = useContext(Ctx);
  if (!live) return <>{children}</>;
  const s = live.sections.find((x) => x.id === id);
  if (!s) return <>{children}</>;
  const active = live.selected === id;
  return (
    <div data-live-section={id} className="group/live relative">
      <div className={"pointer-events-none absolute inset-0 z-20 rounded-sm ring-inset " + (active ? "ring-4 ring-accent-500" : "ring-0 group-hover/live:ring-2 group-hover/live:ring-accent-500/70")} />
      <div className={"absolute left-3 top-3 z-30 items-center gap-1 rounded-full bg-ink/95 p-1 text-xs font-semibold text-white shadow-lg " + (active ? "flex" : "hidden group-hover/live:flex")}>
        <button type="button" onClick={() => live.select(id)} className="rounded-full px-3 py-1 hover:bg-white/15">✎ Modifier « {live.label(s)} »</button>
        <button type="button" onClick={() => live.toggle(id)} disabled={live.busy} className="rounded-full px-2.5 py-1 hover:bg-white/15">{s.enabled ? "Masquer" : "Afficher"}</button>
        <button type="button" onClick={() => live.move(id, -1)} disabled={live.busy} aria-label="Monter" className="rounded-full px-2 py-1 hover:bg-white/15">▲</button>
        <button type="button" onClick={() => live.move(id, 1)} disabled={live.busy} aria-label="Descendre" className="rounded-full px-2 py-1 hover:bg-white/15">▼</button>
      </div>
      {s.enabled ? (
        <div className="cursor-pointer" onClickCapture={(e) => {
          // Clic n'importe où sur le bloc : on le choisit (les liens et boutons ne quittent pas la page).
          if ((e.target as HTMLElement).closest("a, button")) e.preventDefault();
          if (live.selected !== id) live.select(id);
        }}>{children}</div>
      ) : (
        <div className="border-y border-dashed border-slate-300 bg-slate-50 px-4 pb-5 pt-14 text-center text-sm text-slate-500">
          Bloc masqué : « {live.label(s)} » (les visiteurs ne le voient pas)
        </div>
      )}
    </div>
  );
}
