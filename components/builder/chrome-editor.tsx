"use client";

import { useState, useTransition } from "react";
import type { BlockField, ChromeContent } from "@/lib/page-blocks";
import { publishAction } from "@/app/admin/accueil/actions";
import { FieldEditor } from "./field-editor";

const LINK: BlockField[] = [{ key: "label", label: "Texte", type: "text" }, { key: "href", label: "Lien", type: "url" }];
const MENU: BlockField = { key: "menu", label: "Menu principal (en-tête)", type: "list", itemLabel: "Lien", fields: LINK };
const COLUMNS: BlockField = {
  key: "columns", label: "Colonnes de liens", type: "list", itemLabel: "Colonne",
  fields: [{ key: "title", label: "Titre de la colonne", type: "text" }, { key: "links", label: "Liens", type: "list", itemLabel: "Lien", fields: LINK }],
};

/** Menu de l'en-tête et pied de page (publiés directement). */
export function ChromeEditor({ initial }: { initial: ChromeContent }) {
  const [c, setC] = useState<ChromeContent>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const f = (patch: Partial<ChromeContent["footer"]>) => setC((x) => ({ ...x, footer: { ...x.footer, ...patch } }));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Menu et pied de page</h1>
          <p className="text-sm text-muted">Liens de l’en-tête et colonnes du pied de page, sur toutes les pages du site.</p>
        </div>
        <div className="flex items-center gap-3">
          {msg ? <span className={"text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</span> : null}
          <button type="button" disabled={pending} onClick={() => start(async () => {
            const r = await publishAction("chrome", c);
            setMsg(r.ok ? { ok: true, text: "Publié sur le site." } : { ok: false, text: r.error ?? "Publication impossible." });
          })} className="rounded-md bg-accent-600 px-5 py-2 text-sm font-bold text-white hover:bg-accent-700 disabled:opacity-60">{pending ? "…" : "Publier"}</button>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="h-fit space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="font-semibold text-ink">{MENU.label}</p>
          <FieldEditor f={MENU} value={c.menu} onChange={(v) => setC((x) => ({ ...x, menu: v }))} types={[]} />
        </section>
        <section className="space-y-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="font-semibold text-ink">Pied de page</p>
          <div><p className="mb-1 text-sm font-semibold">Présentation</p><FieldEditor f={{ key: "about", label: "", type: "textarea" }} value={c.footer.about} onChange={(v) => f({ about: v })} types={[]} /></div>
          <div><p className="mb-1 text-sm font-semibold">{COLUMNS.label}</p><FieldEditor f={COLUMNS} value={c.footer.columns} onChange={(v) => f({ columns: v })} types={[]} /></div>
          <FieldEditor f={{ key: "showApps", label: "Boutons de l’application mobile", type: "bool" }} value={c.footer.showApps} onChange={(v) => f({ showApps: v })} types={[]} />
          <div><p className="mb-1 text-sm font-semibold">Lien Google Play</p><FieldEditor f={{ key: "playStoreUrl", label: "", type: "url" }} value={c.footer.playStoreUrl} onChange={(v) => f({ playStoreUrl: v })} types={[]} /></div>
          <div><p className="mb-1 text-sm font-semibold">Lien App Store</p><FieldEditor f={{ key: "appStoreUrl", label: "", type: "url" }} value={c.footer.appStoreUrl} onChange={(v) => f({ appStoreUrl: v })} types={[]} /></div>
          <div><p className="mb-1 text-sm font-semibold">Mention du bas</p><FieldEditor f={{ key: "bottomText", label: "", type: "text" }} value={c.footer.bottomText} onChange={(v) => f({ bottomText: v })} types={[]} /><p className="mt-1 text-xs text-muted">{"{year}"} = année en cours. Réseaux sociaux : En-têtes et barre du haut.</p></div>
        </section>
      </div>
    </div>
  );
}
