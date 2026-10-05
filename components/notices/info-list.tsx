"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { readAllNotices, trackNotice } from "@/app/notice-actions";
import { NOTICE_TONE } from "@/lib/notice-tone";
import { NoticeBody } from "./notice-body";

interface Item { id: string; title: string; body: string; kind: string; ctaLabel: string; ctaUrl: string; dismissible: boolean; date: string; personal?: boolean; read?: boolean }

const when = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Boîte « Infos » : tout est marqué comme lu à l'ouverture (les nouveaux restent signalés). */
export function InfoList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [list, setList] = useState(items);
  useEffect(() => {
    if (items.some((i) => !i.read)) void readAllNotices().then(() => router.refresh()).catch(() => {});
  }, [items, router]);

  if (!list.length) {
    return <p className="rounded-2xl bg-white p-8 text-center text-sm text-muted shadow-card">Aucun message pour le moment.</p>;
  }
  return (
    <ul className="space-y-3">
      {list.map((n) => {
        const tone = NOTICE_TONE[n.kind] ?? NOTICE_TONE.info;
        const cta = n.ctaUrl ? (/^https?:/.test(n.ctaUrl)
          ? <a href={n.ctaUrl} target="_blank" rel="noopener noreferrer" onClick={() => void trackNotice(n.id, "click")} className="btn-primary px-4 py-2 text-sm">{n.ctaLabel || "En savoir plus"}</a>
          : <Link href={n.ctaUrl} onClick={() => void trackNotice(n.id, "click")} className="btn-primary px-4 py-2 text-sm">{n.ctaLabel || "En savoir plus"}</Link>) : null;
        return (
          <li key={n.id} className={"rounded-2xl bg-white p-5 shadow-card " + (n.read ? "" : "ring-2 ring-accent-200")}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={"rounded-full px-2.5 py-1 font-bold " + tone.chip}>{tone.icon} {n.personal ? "Pour vous" : tone.label}</span>
              {!n.read ? <span className="rounded-full bg-accent-600 px-2 py-0.5 font-bold text-white">Nouveau</span> : null}
              <span className="text-muted">{when(n.date)}</span>
              {n.dismissible ? (
                <button type="button" onClick={() => { void trackNotice(n.id, "dismiss"); setList((l) => l.filter((x) => x.id !== n.id)); }}
                  className="ml-auto rounded-full px-2 py-1 font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-600">Masquer</button>
              ) : null}
            </div>
            <h2 className="mt-2 font-display text-lg font-bold text-ink">{n.title}</h2>
            <NoticeBody text={n.body} className="mt-1 text-sm text-slate-600" />
            {cta ? <div className="mt-4">{cta}</div> : null}
          </li>
        );
      })}
    </ul>
  );
}
