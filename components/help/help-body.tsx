import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Rendu du texte des articles d'aide (sans HTML : pas d'injection possible).
 * « ## » / « ### » titres, « 1. » / « - » listes (sous-liste : deux espaces),
 * **gras**, [lien](/page), ![légende](/aide/x.webp), « > » encadré
 * (« > Attention » : orange ; « > Astuce » : bleu).
 */
function inline(text: string, key = ""): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${key}b${i++}`} className="font-semibold text-ink">{m[1]}</strong>);
    else {
      const href = m[3];
      const internal = href.startsWith("/");
      out.push(internal
        ? <Link key={`${key}l${i++}`} href={href} className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-700">{m[2]}</Link>
        : /^https:\/\//.test(href) ? <a key={`${key}l${i++}`} href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">{m[2]}</a> : m[2]);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Titres « ## » d'un article (sommaire). */
export const helpHeadings = (body: string) => body.split("\n").filter((l) => /^##\s/.test(l)).map((l) => l.replace(/^##\s+/, "").trim());

export function HelpBody({ body, compact = false }: { body: string; compact?: boolean }) {
  const blocks = body.replace(/\r/g, "").split(/\n{2,}/);
  const nodes: ReactNode[] = [];
  blocks.forEach((raw, bi) => {
    const block = raw.trimEnd();
    if (!block.trim()) return;
    const lines = block.split("\n");
    const k = `k${bi}`;
    const img = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(block.trim());
    if (img) {
      nodes.push(
        <figure key={k} className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img[2]} alt={img[1]} loading="lazy" className="w-full rounded-xl border border-slate-200 shadow-card" />
          {img[1] ? <figcaption className="mt-2 text-center text-xs text-muted">{img[1]}</figcaption> : null}
        </figure>,
      );
    } else if (/^###?\s/.test(lines[0]) && lines.length === 1) {
      const level = lines[0].startsWith("###") ? 3 : 2;
      const text = lines[0].replace(/^###?\s+/, "");
      nodes.push(level === 2
        ? <h2 key={k} id={slugify(text)} className="mt-8 scroll-mt-24 font-display text-xl font-bold text-ink">{inline(text, k)}</h2>
        : <h3 key={k} className="mt-6 font-display text-lg font-bold text-ink">{inline(text, k)}</h3>);
    } else if (lines.every((l) => /^>\s?/.test(l))) {
      const text = lines.map((l) => l.replace(/^>\s?/, "")).join(" ");
      const warn = /^attention/i.test(text);
      nodes.push(
        <div key={k} className={"my-5 flex gap-3 rounded-xl p-4 text-sm " + (warn ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200" : "bg-brand-50 text-brand-900 ring-1 ring-brand-100")}>
          <span aria-hidden className="text-lg leading-5">{warn ? "⚠️" : "💡"}</span>
          <p>{inline(text, k)}</p>
        </div>,
      );
    } else if (lines.every((l) => /^(\s{2,})?(\d+\.|-)\s/.test(l))) {
      const ordered = /^\d+\./.test(lines[0]);
      const items: { text: string; sub: string[] }[] = [];
      for (const l of lines) {
        if (/^\s{2,}/.test(l) && items.length) items[items.length - 1].sub.push(l.replace(/^\s+-\s+/, ""));
        else items.push({ text: l.replace(/^(\d+\.|-)\s+/, ""), sub: [] });
      }
      const li = items.map((it, j) => (
        <li key={j} className={ordered ? "relative pl-10" : "relative pl-6"}>
          {ordered
            ? <span className="absolute left-0 top-0 grid h-7 w-7 place-items-center rounded-full bg-brand-800 text-xs font-bold text-white">{j + 1}</span>
            : <span className="absolute left-1.5 top-2.5 h-1.5 w-1.5 rounded-full bg-accent-500" />}
          <span className={ordered ? "block pt-0.5" : ""}>{inline(it.text, `${k}-${j}`)}</span>
          {it.sub.length ? <ul className="mt-2 space-y-1.5">{it.sub.map((s, x) => <li key={x} className="relative pl-5 text-slate-600"><span className="absolute left-1 top-2.5 h-1 w-1 rounded-full bg-slate-400" />{inline(s, `${k}-${j}-${x}`)}</li>)}</ul> : null}
        </li>
      ));
      nodes.push(ordered ? <ol key={k} className="my-4 space-y-3">{li}</ol> : <ul key={k} className="my-4 space-y-2">{li}</ul>);
    } else {
      nodes.push(<p key={k} className="my-3">{lines.map((l, j) => <span key={j}>{j ? <br /> : null}{inline(l, `${k}-${j}`)}</span>)}</p>);
    }
  });
  return <div className={(compact ? "text-sm" : "text-[15px]") + " leading-relaxed text-slate-700"}>{nodes}</div>;
}
