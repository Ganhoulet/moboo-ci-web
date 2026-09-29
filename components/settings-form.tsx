"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { resetSectionAction, saveSettingsAction, type SettingField, type SettingSection } from "@/app/admin/actions";
import { uploadImageAction } from "@/app/mon-espace/actions";
import { EmailPreview } from "./email-preview";
import { VisualThumb } from "./visual-thumbs";

type Values = Record<string, unknown>;

/** Logo / favicon : réduit dans le navigateur (600 px), transparence gardée (PNG). */
export async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
    });
    const scale = Math.min(1, 600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * scale)); c.height = Math.max(1, Math.round(img.height * scale));
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return file.type === "image/jpeg" ? c.toDataURL("image/jpeg", 0.85) : c.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Toggle({ value, onChange, yes = "Oui", no = "Non" }: { value: boolean; onChange: (v: boolean) => void; yes?: string; no?: string }) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-slate-300 text-sm font-semibold">
      <button type="button" onClick={() => onChange(true)} aria-pressed={value}
        className={"px-4 py-2 transition " + (value ? "bg-brand-700 text-white" : "bg-white text-ink hover:bg-slate-50")}>{yes}</button>
      <button type="button" onClick={() => onChange(false)} aria-pressed={!value}
        className={"border-l border-slate-300 px-4 py-2 transition " + (!value ? "bg-slate-600 text-white" : "bg-white text-ink hover:bg-slate-50")}>{no}</button>
    </div>
  );
}

type TextEl = HTMLInputElement | HTMLTextAreaElement;

function Field({ f, value, onChange, onFocusText }: {
  f: SettingField; value: unknown; onChange: (v: unknown) => void;
  /** Champ texte actif : les variables {{…}} cliquées s'y insèrent. */
  onFocusText?: (el: TextEl) => void;
}) {
  const focus = (e: React.FocusEvent<TextEl>) => onFocusText?.(e.currentTarget);
  const [uploading, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  switch (f.type) {
    case "bool":
      return <Toggle value={value === true} onChange={onChange} />;
    case "enum":
      return (
        <div className="inline-flex flex-wrap overflow-hidden rounded-md border border-slate-300 text-sm font-semibold">
          {f.options?.map((o, i) => (
            <button key={o.value} type="button" onClick={() => onChange(o.value)} aria-pressed={value === o.value}
              className={(i ? "border-l border-slate-300 " : "") + "px-4 py-2 transition " + (value === o.value ? "bg-brand-700 text-white" : "bg-white text-ink hover:bg-slate-50")}>
              {o.label}
            </button>
          ))}
        </div>
      );
    case "visual":
      // Choix par vignette (style d'en-tête, bannière, recherche…), comme Houzez.
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {f.options?.map((o) => (
            <button key={o.value} type="button" onClick={() => onChange(o.value)} aria-pressed={value === o.value}
              className={"overflow-hidden rounded-md border-2 bg-slate-50 p-1.5 text-left transition " + (value === o.value ? "border-brand-600 ring-2 ring-brand-200" : "border-slate-200 hover:border-slate-400")}>
              <VisualThumb field={f.key} value={o.value} />
              <span className={"mt-1.5 block px-1 text-sm font-semibold " + (value === o.value ? "text-brand-800" : "text-ink")}>{o.label}</span>
            </button>
          ))}
        </div>
      );
    case "number": {
      const n = Number(value) || 0;
      const clamp = (x: number) => Math.min(f.max ?? Infinity, Math.max(f.min ?? -Infinity, x));
      return (
        <div>
          <div className="inline-flex items-stretch overflow-hidden rounded-md border border-slate-300">
            <button type="button" onClick={() => onChange(clamp(n - 1))} className="bg-brand-700 px-3 text-lg font-bold text-white hover:bg-brand-800" aria-label="Moins">−</button>
            <input type="number" value={n} min={f.min} max={f.max} onChange={(e) => onChange(Number(e.target.value))}
              className="w-20 border-0 text-center text-sm font-semibold text-ink focus:ring-0" />
            <button type="button" onClick={() => onChange(clamp(n + 1))} className="bg-brand-700 px-3 text-lg font-bold text-white hover:bg-brand-800" aria-label="Plus">+</button>
          </div>
          {f.min != null || f.max != null ? <p className="mt-1 text-xs text-muted">Entre {f.min} et {f.max} · défaut : {String(f.default)}</p> : null}
        </div>
      );
    }
    case "multi": {
      const list = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-2">
          {f.options?.map((o) => {
            const on = list.includes(o.value);
            return (
              <label key={o.value} className={"inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold " + (on ? "border-brand-700 bg-brand-50 text-brand-900" : "border-slate-300 bg-white text-ink")}>
                <input type="checkbox" checked={on} className="rounded text-brand-700"
                  onChange={() => onChange(on ? list.filter((x) => x !== o.value) : [...list, o.value])} />
                {o.label}
              </label>
            );
          })}
        </div>
      );
    }
    case "textarea":
      return <textarea className="input min-h-[90px] max-w-xl text-sm" maxLength={f.maxLength} value={String(value ?? "")} onFocus={focus} onChange={(e) => onChange(e.target.value)} />;
    case "html":
      return (
        <textarea className="input min-h-[220px] w-full font-mono text-[13px] leading-relaxed" spellCheck={false}
          value={String(value ?? "")} onFocus={focus} onChange={(e) => onChange(e.target.value)} />
      );
    case "color": {
      const hex = /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : "#000000";
      return (
        <label className="inline-flex items-center overflow-hidden rounded-md border border-slate-300 bg-white">
          <input type="color" value={hex} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer border-0 bg-transparent p-1" />
          <input className="w-28 border-0 border-l border-slate-300 py-2 text-sm font-semibold uppercase text-ink focus:ring-0" value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)} maxLength={7} />
        </label>
      );
    }
    case "image":
      return (
        <div className="max-w-xl space-y-2">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={String(value)} alt="" className="max-h-16 rounded border border-slate-200 bg-[repeating-conic-gradient(#f1f5f9_0_25%,#fff_0_50%)] bg-[length:12px_12px] p-1" />
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <input className="input flex-1 text-sm" placeholder="https://…" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
            <label className={"cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50 " + (uploading ? "opacity-60" : "")}>
              {uploading ? "Envoi…" : "Téléverser"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]; e.target.value = "";
                  if (!file) return;
                  start(async () => {
                    setErr(null);
                    const r = await uploadImageAction(await shrink(file), "annonce");
                    if (r.ok && r.url) onChange(r.url); else setErr(r.error ?? "Envoi impossible.");
                  });
                }} />
            </label>
            {value ? <button type="button" onClick={() => onChange("")} className="text-sm font-semibold text-red-600 hover:underline">Retirer</button> : null}
          </div>
          {err ? <p className="text-xs font-medium text-red-600">{err}</p> : null}
        </div>
      );
    default:
      return <input className="input max-w-xl text-sm" type={f.type === "url" ? "url" : "text"} maxLength={f.maxLength}
        placeholder={f.type === "url" ? "https://…" : f.type === "emails" ? "admin@moboo.ci, direction@moboo.ci" : undefined}
        value={String(value ?? "")} onFocus={focus} onChange={(e) => onChange(e.target.value)} />;
  }
}

/** Une section du back-office : champs du schéma, « Enregistrer » et « Réinitialiser la section ». */
export function SettingsForm({ section, initial, updatedAt, smtpConfigured = false }: {
  section: SettingSection; initial: Values; updatedAt?: string | null; smtpConfigured?: boolean;
}) {
  const [values, setValues] = useState<Values>(initial);
  // Champ texte actif (objet / contenu) pour insérer une variable au curseur.
  const active = useRef<{ key: string; el: TextEl } | null>(null);
  const insertVar = (name: string) => {
    const a = active.current;
    const token = `{{${name}}}`;
    if (!a) { navigator.clipboard?.writeText(token).catch(() => undefined); return; }
    const cur = String(values[a.key] ?? "");
    const at = a.el.selectionStart ?? cur.length;
    const end = a.el.selectionEnd ?? at;
    setMsg(null);
    setValues((v) => ({ ...v, [a.key]: cur.slice(0, at) + token + cur.slice(end) }));
    requestAnimationFrame(() => { a.el.focus(); a.el.setSelectionRange(at + token.length, at + token.length); });
  };
  const isEmail = !!section.email || section.id === "emails";
  const [saved, setSaved] = useState<Values>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(saved), [values, saved]);

  const save = () => start(async () => {
    setMsg(null);
    const r = await saveSettingsAction(section.id, values);
    if (r.ok && r.values) { setValues(r.values); setSaved(r.values); setMsg({ ok: true, text: "Réglages enregistrés : le site est à jour." }); }
    else setMsg({ ok: false, text: r.error ?? "Enregistrement impossible." });
  });
  const reset = () => {
    if (!window.confirm(`Remettre « ${section.label} » aux valeurs par défaut ?`)) return;
    start(async () => {
      const r = await resetSectionAction(section.id);
      if (r.ok && r.values) { setValues(r.values); setSaved(r.values); setMsg({ ok: true, text: "Section réinitialisée." }); }
      else setMsg({ ok: false, text: r.error ?? "Réinitialisation impossible." });
    });
  };

  let lastGroup: string | undefined;
  const form = (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-ink">{section.label}</h1>
          <p className="text-sm text-muted">
            {msg ? <span className={"font-semibold " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</span>
              : dirty ? <span className="font-semibold text-accent-700">Modifications non enregistrées</span>
              : updatedAt ? `Modifié le ${new Date(updatedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}` : "Valeurs par défaut"}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={save} disabled={pending || !dirty}
            className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button type="button" onClick={reset} disabled={pending}
            className="rounded-md border border-brand-700 bg-white px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-50">
            Réinitialiser la section
          </button>
        </div>
      </div>

      <div className="px-4 pb-6 sm:px-6">
        {section.description ? <p className="pt-4 text-sm text-muted">{section.description}</p> : null}
        {section.email ? (
          <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-3">
            <p className="text-sm font-semibold text-sky-900">Variables disponibles</p>
            <p className="text-xs text-sky-800">Cliquez pour l’insérer dans l’objet ou le contenu (à l’endroit du curseur).</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {section.email.placeholders.map((p) => (
                <button key={p} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertVar(p)}
                  className="rounded bg-white px-2 py-1 font-mono text-xs text-sky-900 ring-1 ring-sky-200 hover:bg-sky-100">{`{{${p}}}`}</button>
              ))}
            </div>
          </div>
        ) : null}
        {section.fields.map((f) => {
          const header = f.group && f.group !== lastGroup ? f.group : null;
          lastGroup = f.group;
          return (
            <div key={f.key}>
              {header ? (isEmail
                ? <h2 className="mt-6 rounded-md border border-sky-200 bg-sky-100/70 px-4 py-3 font-display text-lg font-bold text-sky-900">{header}</h2>
                : <h2 className="mt-6 border-b border-slate-200 pb-2 font-display text-lg font-bold text-ink">{header}</h2>) : null}
              <div className={"grid gap-3 border-b border-slate-100 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-8 " + (f.group ? "md:pl-6" : "")}>
                <div>
                  <p className="font-semibold text-ink">{f.label}</p>
                  {f.help ? <p className="mt-0.5 text-sm text-muted">{f.help}</p> : null}
                  {f.public === false && !isEmail ? <p className="mt-1 text-xs font-semibold text-slate-400">Réglage interne (non visible sur le site)</p> : null}
                </div>
                <div><Field f={f} value={values[f.key]} onFocusText={(el) => { active.current = { key: f.key, el }; }}
                  onChange={(v) => { setMsg(null); setValues((s) => ({ ...s, [f.key]: v })); }} /></div>
              </div>
            </div>
          );
        })}
        <div className="flex items-center justify-end gap-3 pt-5">
          {msg ? <p className={"text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
          <button type="button" onClick={save} disabled={pending || !dirty}
            className="rounded-md bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {pending ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </div>
      </div>
    </div>
  );

  if (!isEmail) return form;
  // Gestion des emails : aperçu à côté (écran large) ou dessous.
  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
      {form}
      <div className="2xl:sticky 2xl:top-20 2xl:self-start">
        {section.email ? (
          <EmailPreview template={section.id.replace(/^email_/, "")} hasAdmin={section.email.admin} section={values} smtpConfigured={smtpConfigured} />
        ) : (
          <EmailPreview template="welcome" hasAdmin={false} emails={values} smtpConfigured={smtpConfigured} />
        )}
      </div>
    </div>
  );
}
