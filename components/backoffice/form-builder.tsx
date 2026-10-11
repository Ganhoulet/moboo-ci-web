"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveSettingsAction } from "@/app/admin/actions";
import {
  BUILTIN_FIELDS, CUSTOM_TYPE_LABEL, FORM_STEPS, MODE_LABEL,
  type CustomField, type CustomType, type FieldMode, type FieldRule, type ListingFormConfig, type MemberSpaceConfig, type StepId,
} from "@/lib/listing-form";

const input = "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-600 focus:outline-none";
const PUBLISHERS: [string, string][] = [["proprietaire", "Propriétaires"], ["agent", "Agents"], ["entreprise", "Agences / promoteurs"]];
const ALL_TYPES: [string, string][] = [["particulier", "Particuliers"], ...PUBLISHERS, ["etablissement", "Résidences / espaces"]];
const TX: [string, string][] = [["rent", "Location"], ["sale", "Vente"]];
const MODES: FieldMode[] = ["optional", "required", "hidden", "team"];
const MODE_STYLE: Record<FieldMode, string> = {
  optional: "bg-slate-100 text-slate-700", required: "bg-accent-50 text-accent-800", hidden: "bg-red-50 text-red-700", team: "bg-violet-50 text-violet-800",
};

function Chips({ options, value, onChange, allLabel = "Tous" }: { options: [string, string][]; value: string[] | undefined; onChange: (v: string[] | undefined) => void; allLabel?: string }) {
  const cur = value ?? [];
  return (
    <div className="flex flex-wrap gap-1.5">
      <button type="button" onClick={() => onChange(undefined)} className={"rounded-full px-2.5 py-1 text-xs font-semibold ring-1 " + (!cur.length ? "bg-ink text-white ring-ink" : "bg-white text-slate-600 ring-slate-300")}>{allLabel}</button>
      {options.map(([k, l]) => {
        const on = cur.includes(k);
        return (
          <button key={k} type="button" onClick={() => { const n = on ? cur.filter((x) => x !== k) : [...cur, k]; onChange(n.length ? n : undefined); }}
            className={"rounded-full px-2.5 py-1 text-xs font-semibold ring-1 " + (on ? "bg-brand-50 text-brand-800 ring-brand-300" : "bg-white text-slate-600 ring-slate-300")}>
            {on ? "✓ " : ""}{l}
          </button>
        );
      })}
    </div>
  );
}

/** Règle commune (intégré ou créé) : mode, libellé, profils, conditions. */
function RuleRow({ title, hint, core, rule, onChange, types, propertyTypes, extra, onRemove, onMove }: {
  title: string; hint?: string; core?: boolean; rule: FieldRule; onChange: (r: FieldRule) => void; types: [string, string][]; propertyTypes: [string, string][];
  extra?: React.ReactNode; onRemove?: () => void; onMove?: (dir: -1 | 1) => void;
}) {
  const [open, setOpen] = useState(false);
  const mode = rule.mode ?? "optional";
  const conditions = (rule.types?.length ?? 0) + (rule.transactions?.length ?? 0) + (rule.propertyTypes?.length ?? 0);
  return (
    <li className="py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[10rem] flex-1">
          <p className="text-sm font-semibold text-ink">{rule.label || title}{rule.label ? <span className="ml-1 text-xs font-normal text-muted">(au lieu de « {title} »)</span> : null}</p>
          {hint ? <p className="text-xs text-muted">{hint}</p> : null}
        </div>
        {core ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">Toujours obligatoire</span>
        ) : (
          <select aria-label={`Statut de ${title}`} value={mode} onChange={(e) => onChange({ ...rule, mode: e.target.value as FieldMode })}
            className={"rounded-full border-0 px-3 py-1 text-xs font-bold ring-1 ring-slate-200 " + MODE_STYLE[mode]}>
            {MODES.map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
          </select>
        )}
        {conditions ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{conditions} condition(s)</span> : null}
        {onMove ? (
          <span className="flex gap-1">
            <button type="button" aria-label="Monter" onClick={() => onMove(-1)} className="rounded px-1.5 text-xs ring-1 ring-slate-200">▲</button>
            <button type="button" aria-label="Descendre" onClick={() => onMove(1)} className="rounded px-1.5 text-xs ring-1 ring-slate-200">▼</button>
          </span>
        ) : null}
        <button type="button" onClick={() => setOpen((o) => !o)} className="rounded-md px-2 py-1 text-xs font-semibold text-brand-800 ring-1 ring-slate-200 hover:bg-slate-50">{open ? "Fermer" : "Modifier"}</button>
      </div>
      {open ? (
        <div className="mt-2 grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-ink">Libellé affiché
            <input className={input + " mt-1"} value={rule.label ?? ""} placeholder={title} maxLength={80} onChange={(e) => onChange({ ...rule, label: e.target.value || undefined })} />
          </label>
          {extra}
          {!core ? (
            <>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-ink">Réservé à certains profils</p>
                <Chips options={types} value={rule.types} onChange={(v) => onChange({ ...rule, types: v })} allLabel="Tous les profils" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">Transaction</p>
                <Chips options={TX} value={rule.transactions} onChange={(v) => onChange({ ...rule, transactions: v })} allLabel="Les deux" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">Types de bien</p>
                <Chips options={propertyTypes} value={rule.propertyTypes} onChange={(v) => onChange({ ...rule, propertyTypes: v })} allLabel="Tous" />
              </div>
            </>
          ) : null}
          {onRemove ? <button type="button" onClick={onRemove} className="justify-self-start text-xs font-semibold text-red-600 sm:col-span-2">Supprimer ce champ</button> : null}
        </div>
      ) : null}
    </li>
  );
}

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/^(\d)/, "c_$1").slice(0, 40);

export function ListingFormBuilder({ initial, propertyTypes }: { initial: ListingFormConfig; propertyTypes: { key: string; label: string }[] }) {
  const ptypes: [string, string][] = propertyTypes.map((t) => [t.key, t.label]);
  const [cfg, setCfg] = useState<ListingFormConfig>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState<StepId | null>(null);
  const [draft, setDraft] = useState<{ label: string; type: CustomType; options: string; visibility: "public" | "private" }>({ label: "", type: "text", options: "", visibility: "public" });

  const change = (c: ListingFormConfig) => { setCfg(c); setMsg(null); };
  const setRule = (key: string, r: FieldRule) => change({ ...cfg, fields: { ...cfg.fields, [key]: r } });
  const setCustom = (key: string, c: CustomField) => change({ ...cfg, custom: cfg.custom.map((x) => (x.key === key ? c : x)) });
  const moveCustom = (key: string, dir: -1 | 1) => {
    const list = [...cfg.custom]; const i = list.findIndex((x) => x.key === key); const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]]; change({ ...cfg, custom: list });
  };
  const addCustom = (step: StepId) => {
    const label = draft.label.trim();
    if (!label) return;
    let key = slug(label) || "champ"; let n = 2;
    while (cfg.custom.some((c) => c.key === key) || BUILTIN_FIELDS.some((b) => b.key === key)) key = `${slug(label)}_${n++}`;
    const options = draft.options.split(/\n|;/).map((x) => x.trim()).filter(Boolean);
    change({ ...cfg, custom: [...cfg.custom, { key, label, type: draft.type, step, options, visibility: draft.visibility, mode: "optional" }] });
    setDraft({ label: "", type: "text", options: "", visibility: "public" }); setAdding(null);
  };
  const save = () => start(async () => {
    const r = await saveSettingsAction("forms", { listingForm: JSON.stringify(cfg) });
    setMsg(r.ok ? { ok: true, text: "Formulaire enregistré : il s’applique tout de suite sur le site et dans l’API." } : { ok: false, text: r.error ?? "Erreur." });
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 text-xs ring-1 ring-slate-200">
        {MODES.map((m) => <span key={m} className={"rounded-full px-2.5 py-1 font-bold " + MODE_STYLE[m]}>{MODE_LABEL[m]}</span>)}
        <span className="text-muted">« Réservé à l’équipe » : visible seulement dans le back-office (Immobilier → annonce) ; l’annonceur ne le voit pas et ne peut pas le remplir.</span>
      </div>
      {FORM_STEPS.map((st) => {
        const stepCfg = cfg.steps[st.id] ?? {};
        const builtins = BUILTIN_FIELDS.filter((f) => f.step === st.id);
        const customs = cfg.custom.filter((c) => c.step === st.id);
        return (
          <section key={st.id} className={"rounded-lg bg-white ring-1 ring-slate-200 " + (stepCfg.hidden ? "opacity-70" : "")}>
            <header className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
              <input aria-label={`Nom de l’étape ${st.label}`} className="w-48 rounded-md border border-transparent px-1.5 py-1 font-display text-base font-bold text-ink hover:border-slate-200 focus:border-brand-600 focus:outline-none"
                value={stepCfg.label ?? st.label} onChange={(e) => change({ ...cfg, steps: { ...cfg.steps, [st.id]: { ...stepCfg, label: e.target.value === st.label ? undefined : e.target.value } } })} />
              {st.lockable ? <span className="text-xs text-muted">Étape toujours affichée</span> : (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4" checked={!stepCfg.hidden} onChange={(e) => change({ ...cfg, steps: { ...cfg.steps, [st.id]: { ...stepCfg, hidden: !e.target.checked || undefined } } })} />
                  Afficher cette étape
                </label>
              )}
            </header>
            <ul className="divide-y divide-slate-100 px-4">
              {builtins.map((f) => (
                <RuleRow key={f.key} title={f.label} hint={f.hint} core={f.core} types={PUBLISHERS} propertyTypes={ptypes}
                  rule={{ ...(f.defaultMode ? { mode: f.defaultMode } : {}), ...(cfg.fields[f.key] ?? {}) }} onChange={(r) => setRule(f.key, r)} />
              ))}
              {customs.map((c) => (
                <RuleRow key={c.key} title={c.label} hint={`Champ créé · ${CUSTOM_TYPE_LABEL[c.type]}${c.visibility === "private" ? " · privé (non publié)" : " · affiché sur l’annonce"}`}
                  types={PUBLISHERS} propertyTypes={ptypes} rule={{ ...c, label: undefined }}
                  onChange={(r) => setCustom(c.key, { ...c, ...r, label: r.label || c.label })}
                  onRemove={() => change({ ...cfg, custom: cfg.custom.filter((x) => x.key !== c.key) })}
                  onMove={(d) => moveCustom(c.key, d)}
                  extra={
                    <>
                      <label className="block text-xs font-semibold text-ink">Type
                        <select className={input + " mt-1"} value={c.type} onChange={(e) => setCustom(c.key, { ...c, type: e.target.value as CustomType })}>
                          {Object.entries(CUSTOM_TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                      </label>
                      {c.type === "select" || c.type === "multiselect" ? (
                        <label className="block text-xs font-semibold text-ink sm:col-span-2">Choix (un par ligne)
                          <textarea className={input + " mt-1"} rows={3} value={c.options.join("\n")} onChange={(e) => setCustom(c.key, { ...c, options: e.target.value.split("\n") })} />
                        </label>
                      ) : null}
                      <label className="block text-xs font-semibold text-ink">Aide sous le champ
                        <input className={input + " mt-1"} value={c.help ?? ""} maxLength={200} onChange={(e) => setCustom(c.key, { ...c, help: e.target.value || undefined })} />
                      </label>
                      <label className="block text-xs font-semibold text-ink">Exemple (dans la case)
                        <input className={input + " mt-1"} value={c.placeholder ?? ""} maxLength={80} onChange={(e) => setCustom(c.key, { ...c, placeholder: e.target.value || undefined })} />
                      </label>
                      {c.type === "number" || c.type === "text" ? (
                        <label className="block text-xs font-semibold text-ink">Unité (facultatif)
                          <input className={input + " mt-1"} value={c.unit ?? ""} maxLength={15} placeholder="Ex. m, km, FCFA" onChange={(e) => setCustom(c.key, { ...c, unit: e.target.value || undefined })} />
                        </label>
                      ) : null}
                      <label className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <input type="checkbox" className="h-4 w-4" checked={c.visibility === "private"} onChange={(e) => setCustom(c.key, { ...c, visibility: e.target.checked ? "private" : "public" })} />
                        Privé : jamais affiché sur l’annonce publique
                      </label>
                    </>
                  } />
              ))}
            </ul>
            <div className="border-t border-slate-100 px-4 py-3">
              {adding === st.id ? (
                <div className="grid gap-2 sm:grid-cols-[1fr_12rem_auto]">
                  <input className={input} autoFocus placeholder="Nom du champ (ex. Numéro du titre foncier)" value={draft.label} maxLength={80} onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(st.id); } }} />
                  <select className={input} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as CustomType })}>
                    {Object.entries(CUSTOM_TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => addCustom(st.id)} className="rounded-md bg-brand-800 px-3 py-1.5 text-sm font-semibold text-white">Ajouter</button>
                    <button type="button" onClick={() => setAdding(null)} className="rounded-md px-3 py-1.5 text-sm ring-1 ring-slate-300">Annuler</button>
                  </div>
                  {draft.type === "select" || draft.type === "multiselect" ? (
                    <textarea className={input + " sm:col-span-3"} rows={3} placeholder={"Choix, un par ligne\nEx. ACD\nLettre d’attribution\nAttestation villageoise"} value={draft.options} onChange={(e) => setDraft({ ...draft, options: e.target.value })} />
                  ) : null}
                  <label className="flex items-center gap-2 text-xs text-ink sm:col-span-3">
                    <input type="checkbox" className="h-4 w-4" checked={draft.visibility === "private"} onChange={(e) => setDraft({ ...draft, visibility: e.target.checked ? "private" : "public" })} />
                    Privé (connu de l’annonceur et de Moboo, jamais publié)
                  </label>
                </div>
              ) : (
                <button type="button" onClick={() => setAdding(st.id)} className="text-sm font-semibold text-brand-800 hover:underline">＋ Ajouter un champ dans « {stepCfg.label ?? st.label} »</button>
              )}
            </div>
          </section>
        );
      })}
      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-lg bg-white/95 p-3 shadow ring-1 ring-slate-200 backdrop-blur">
        <button type="button" disabled={pending} onClick={save} className="rounded-md bg-brand-800 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900 disabled:opacity-60">{pending ? "Enregistrement…" : "Enregistrer le formulaire"}</button>
        <Link href="/admin/immobilier/nouvelle" target="_blank" className="text-sm font-semibold text-brand-800 hover:underline">Voir le formulaire (vue équipe) ↗</Link>
        {msg ? <span className={"text-sm font-semibold " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</span> : null}
      </div>
    </div>
  );
}

export function MemberSpaceBuilder({ initial, items }: { initial: MemberSpaceConfig; items: { key: string; label: string; types: string[] | "all"; locked?: boolean; app?: boolean }[] }) {
  const [cfg, setCfg] = useState<MemberSpaceConfig>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (key: string, v: MemberSpaceConfig["items"][string]) => { setCfg({ items: { ...cfg.items, [key]: v } }); setMsg(null); };
  const save = () => start(async () => {
    const r = await saveSettingsAction("forms", { memberSpace: JSON.stringify(cfg) });
    setMsg(r.ok ? { ok: true, text: "Espace membre enregistré (site et application Moboo.ci)." } : { ok: false, text: r.error ?? "Erreur." });
  });
  return (
    <div className="space-y-4">
      <ul className="divide-y divide-slate-100 rounded-lg bg-white px-4 ring-1 ring-slate-200">
        {items.map((it) => {
          const c = cfg.items[it.key] ?? {};
          const allowed = it.types === "all" ? ALL_TYPES : ALL_TYPES.filter(([k]) => (it.types as string[]).includes(k));
          return (
            <li key={it.key} className="grid gap-2 py-3 sm:grid-cols-[14rem_1fr]">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <input type="checkbox" className="h-4 w-4" disabled={it.locked} checked={it.locked || c.enabled !== false} onChange={(e) => set(it.key, { ...c, enabled: e.target.checked ? undefined : false })} />
                  {c.label || it.label}
                </label>
                <p className="ml-6 text-xs text-muted">{it.locked ? "Toujours actif" : c.enabled === false ? "Coupé pour tous" : "Actif"}{it.app ? " · aussi dans l’application" : ""}</p>
              </div>
              <div className={"grid gap-2 sm:grid-cols-[14rem_1fr] " + (c.enabled === false ? "opacity-50" : "")}>
                <input className={input} placeholder={it.label} value={c.label ?? ""} maxLength={40} aria-label={`Renommer ${it.label}`} onChange={(e) => set(it.key, { ...c, label: e.target.value || undefined })} />
                {it.locked ? <span className="self-center text-xs text-muted">Visible par tous les profils</span> : (
                  <Chips options={allowed} value={c.types} onChange={(v) => set(it.key, { ...c, types: v })} allLabel={`Tous (${allowed.map(([, l]) => l.toLowerCase()).join(", ")})`} />
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-lg bg-white/95 p-3 shadow ring-1 ring-slate-200 backdrop-blur">
        <button type="button" disabled={pending} onClick={save} className="rounded-md bg-brand-800 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900 disabled:opacity-60">{pending ? "Enregistrement…" : "Enregistrer l’espace membre"}</button>
        {msg ? <span className={"text-sm font-semibold " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</span> : null}
      </div>
    </div>
  );
}
