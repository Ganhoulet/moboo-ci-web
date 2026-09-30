"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatXOF } from "@/lib/api";
import {
  deleteListingAdminAction, duplicateListingAdminAction, quickListingAction, type AdminListingRow,
} from "@/app/admin/immobilier/actions";

const STATUS: Record<string, { label: string; dot: string }> = {
  ACTIVE: { label: "En ligne", dot: "bg-emerald-500" },
  DISABLED: { label: "Masquée", dot: "bg-slate-400" },
  SOLD: { label: "Vendue", dot: "bg-rose-500" },
  RENTED: { label: "Louée", dot: "bg-amber-500" },
};
const sv = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const I = {
  edit: <svg {...sv}><path d="M4 20h4L19 9l-4-4L4 16v4ZM13 7l4 4" /></svg>,
  view: <svg {...sv}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>,
  star: (on: boolean) => <svg {...sv} fill={on ? "currentColor" : "none"}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z" /></svg>,
  sold: <svg {...sv}><path d="M3 11 12 4l9 7M5 10v10h14V10" /><path d="M8.5 15h7" /></svg>,
  toggle: (on: boolean) => <svg {...sv}><rect x="2" y="7" width="20" height="10" rx="5" /><circle cx={on ? 17 : 7} cy="12" r="3" fill="currentColor" /></svg>,
  copy: <svg {...sv}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>,
  trash: <svg {...sv}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>,
};

function Row({ l, labels }: { l: AdminListingRow; labels: Record<string, { label: string; color: string | null }> }) {
  const router = useRouter();
  const [row, setRow] = useState(l);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const st = STATUS[row.status] ?? STATUS.ACTIVE;
  const expired = row.expiresAt ? new Date(row.expiresAt) < new Date() : false;

  const patch = (p: Partial<AdminListingRow>) => start(async () => {
    setErr(null);
    const prev = row; setRow({ ...row, ...p });
    const r = await quickListingAction(row.id, p);
    if (!r.ok) { setRow(prev); setErr(r.error ?? "Action impossible."); }
  });
  const btn = "grid h-9 w-9 place-items-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-ink disabled:opacity-40";

  return (
    <tr className={"align-top " + (pending ? "opacity-60" : "")}>
      <td className="max-w-[16rem] px-4 py-4">
        <Link href={`/admin/immobilier/${row.id}`} className="font-semibold text-brand-800 hover:underline">{row.title}</Link>
        {row.labels.length ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {row.labels.map((s) => labels[s] ? <span key={s} className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white" style={{ background: labels[s].color ?? "#334155" }}>{labels[s].label}</span> : null)}
          </div>
        ) : null}
        {err ? <p className="mt-1 text-xs font-medium text-red-600">{err}</p> : null}
      </td>
      <td className="px-4 py-4">
        <div className="flex gap-3">
          {row.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.photo} alt="" className="h-20 w-24 shrink-0 rounded object-cover ring-1 ring-slate-200" />
          ) : <span className="grid h-20 w-24 shrink-0 place-items-center rounded bg-slate-100 text-xs text-slate-400">Sans photo</span>}
          <div className="text-[13px] leading-5 text-slate-600">
            <p>Ville : <span className="text-brand-800">{[row.commune, row.city].filter(Boolean).join(", ")}</span></p>
            <p>Type : <span className="text-brand-800">{row.propertyType}</span></p>
            <p>Statut : <span className="text-brand-800">{row.transaction === "rent" ? "À louer" : "En vente"}</span></p>
            <p>Réf. : {row.reference ?? row.id.slice(0, 8)}</p>
            <p>Expire : {row.expiresAt ? <span className={expired ? "font-semibold text-red-600" : "text-emerald-700"}>{new Date(row.expiresAt).toLocaleDateString("fr-FR")}</span> : <span className="text-slate-400">jamais</span>}</p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 font-semibold text-ink">
        {formatXOF(row.price)}{row.transaction === "rent" ? <span className="block text-xs font-normal text-slate-500">/ {row.priceUnit === "day" ? "jour" : "mois"}</span> : null}
      </td>
      <td className="px-4 py-4 text-center">
        <button type="button" className={btn + (row.featured ? " text-amber-500" : "")} title={row.featured ? "Retirer de la vedette" : "Mettre en vedette"}
          onClick={() => patch({ featured: !row.featured })} disabled={pending}>{I.star(row.featured)}</button>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-[13px] text-slate-600">
        {new Date(row.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        <br />{new Date(row.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        <p className="mt-1">par {row.owner.username ? <Link href={`/pro/${row.owner.username}`} target="_blank" className="text-brand-800 hover:underline">{row.owner.name}</Link> : <span className="text-brand-800">{row.owner.name}</span>}</p>
        <p className="text-xs text-slate-400">{row.owner.kind === "agent" ? "reprise moboo.ci" : row.owner.kind === "site" ? "compte du site" : "contact"}</p>
        <p className="mt-1 text-xs">👁 {row.views} · 💬 {row.inquiries}</p>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm">
        <span className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${st.dot}`} />{st.label}</span>
        {row.moderation && row.moderation !== "approved" ? (
          <a href="/admin/moderation" className={"mt-1 block w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold " + (row.moderation === "pending" ? "bg-amber-100 text-amber-800" : row.moderation === "changes" ? "bg-sky-100 text-sky-800" : "bg-red-100 text-red-700")}>
            {row.moderation === "pending" ? "À valider" : row.moderation === "changes" ? "À corriger" : row.moderation === "rejected" ? "Refusée" : "Compte suspendu"}
          </a>
        ) : null}
        {expired ? <p className="mt-1 text-xs font-semibold text-red-600">Expirée</p> : null}
      </td>
      <td className="px-3 py-3">
        <div className="grid w-[8.5rem] grid-cols-4 gap-0.5">
          <Link href={`/admin/immobilier/${row.id}`} className={btn} title="Modifier">{I.edit}</Link>
          <a href={`/annonce/${row.id}`} target="_blank" rel="noopener" className={btn} title="Voir sur le site">{I.view}</a>
          <button type="button" className={btn} title={row.transaction === "rent" ? "Marquer louée" : "Marquer vendue"} disabled={pending || row.status !== "ACTIVE"}
            onClick={() => patch({ status: row.transaction === "rent" ? "RENTED" : "SOLD" })}>{I.sold}</button>
          <button type="button" className={btn + (row.status === "ACTIVE" ? " text-emerald-600" : "")} title={row.status === "ACTIVE" ? "Masquer" : "Mettre en ligne"} disabled={pending}
            onClick={() => patch({ status: row.status === "ACTIVE" ? "DISABLED" : "ACTIVE" })}>{I.toggle(row.status === "ACTIVE")}</button>
          <button type="button" className={btn} title="Dupliquer (copie masquée)" disabled={pending}
            onClick={() => start(async () => { const r = await duplicateListingAdminAction(row.id); if (r.ok && r.id) router.push(`/admin/immobilier/${r.id}`); else setErr(r.error ?? "Duplication impossible."); })}>{I.copy}</button>
          <button type="button" className={btn + " hover:text-red-600"} title="Supprimer" disabled={pending}
            onClick={() => window.confirm(`Supprimer « ${row.title} » du site ?`) && start(async () => { const r = await deleteListingAdminAction(row.id); if (r.ok) router.refresh(); else setErr(r.error ?? "Suppression impossible."); })}>{I.trash}</button>
        </div>
      </td>
    </tr>
  );
}

/** Tableau des annonces du back-office (façon Houzez « Properties »). */
type SortLink = { href: string; arrow: string };

export function AdminListingsTable({ items, labels, sorts }: {
  items: AdminListingRow[];
  labels: Record<string, { label: string; color: string | null }>;
  /** Liens de tri calculés par la page (serveur). */
  sorts: Record<"title" | "price" | "date", SortLink>;
}) {
  const head = "px-4 py-3 text-left text-sm font-semibold";
  const sortable = (key: "title" | "price" | "date", label: string) => {
    const s = sorts[key];
    return <Link href={s.href} className="inline-flex items-center gap-1 text-brand-800 hover:underline">{label} <span className="text-xs text-slate-400">{s.arrow}</span></Link>;
  };
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full min-w-[68rem]">
        <thead className="border-b border-slate-200 bg-white">
          <tr>
            <th className={head}>{sortable("title", "Titre")}</th>
            <th className={head}>Infos</th>
            <th className={head}>{sortable("price", "Prix")}</th>
            <th className={head + " text-center"}>Vedette</th>
            <th className={head}>{sortable("date", "Publiée")}</th>
            <th className={head}>Statut</th>
            <th className={head}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 [&>tr:nth-child(even)]:bg-slate-50/60">
          {items.map((l) => <Row key={l.id} l={l} labels={labels} />)}
        </tbody>
      </table>
    </div>
  );
}
