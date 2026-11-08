import type { ReactNode } from "react";
import { buildToc, fillVars, type Block, type DocData, type DocMeta, type DocPage, type ImageBlock, type TocEntry } from "@/lib/documents/types";

export type Wrap = (b: Block, node: ReactNode) => ReactNode;
interface Ctx { meta: Pick<DocMeta, "title" | "edition" | "editionDate">; toc: TocEntry[]; wrap?: Wrap }

/** Logo Moboo : trois anneaux et wordmark (non modifiable). */
export function DocLogo({ ring = "#1e40af", word = "#1e3a8a", big = false }: { ring?: string; word?: string; big?: boolean }) {
  return (
    <span className={"logo" + (big ? " big" : "")}>
      <svg viewBox="0 0 48 44" aria-hidden="true"><g fill="none" stroke={ring} strokeWidth="5"><circle cx="24" cy="13" r="10" /><circle cx="15" cy="29" r="10" /><circle cx="33" cy="29" r="10" /></g></svg>
      <span className="word" style={{ color: word }}>Moboo<span className="ci">.ci</span></span>
    </span>
  );
}

/** Image recadrée (coordonnées de la page d'origine) ou entière, avec repères numérotés (en % du cadre). */
export function DocShot({ b, children }: { b: ImageBlock; children?: ReactNode }) {
  const c = b.crop;
  return (
    <div className={"shot " + b.frame} style={c ? { aspectRatio: `${c.w} / ${c.h}` } : undefined}>
      {!b.src ? <div className="empty">Choisissez une image</div>
        : c ? <img src={b.src} alt={b.caption} style={{ width: `${(c.pageW / c.w) * 100}%`, left: `${(-c.x / c.w) * 100}%`, top: `${(-c.y / c.h) * 100}%` }} />
          : <img src={b.src} alt={b.caption} className="static" />}
      {children ?? b.markers.map((m) => <span key={m.n} className="mk" style={{ left: `${m.x}%`, top: `${m.y}%` }}>{m.n}</span>)}
    </div>
  );
}

function Legend({ b, below }: { b: ImageBlock; below?: boolean }) {
  return <ol className={"legend" + (below ? " below" : "")}>{b.markers.map((m) => <li key={m.n}><span className="n">{m.n}</span>{m.label}</li>)}</ol>;
}

function ImageView({ b }: { b: ImageBlock }) {
  const shot = <div style={{ width: b.legend === "right" ? "100%" : `${b.width}%` }}><DocShot b={b} /></div>;
  const caption = b.caption ? <figcaption>{b.caption}</figcaption> : null;
  if (b.legend === "right" && b.markers.length) {
    return <figure><div className="imgl" style={{ gridTemplateColumns: `${b.width}% 1fr` }}>{shot}<div><Legend b={b} />{caption}</div></div></figure>;
  }
  return <figure>{shot}{caption}{b.legend === "below" && b.markers.length ? <Legend b={b} below /> : null}</figure>;
}

function Blocks({ blocks, ctx }: { blocks: Block[]; ctx: Ctx }) {
  return <>{blocks.map((b) => <BlockView key={b.id} b={b} ctx={ctx} />)}</>;
}

function BlockView({ b, ctx }: { b: Block; ctx: Ctx }) {
  const node = render(b, ctx);
  return <>{ctx.wrap ? ctx.wrap(b, node) : node}</>;
}

function render(b: Block, ctx: Ctx): ReactNode {
  switch (b.type) {
    case "cover": return (
      <div className="cover-wrap">
        <div className="cover-top"><DocLogo ring="#ffffff" word="#ffffff" big />{b.tag ? <span className="cover-tag">{b.tag}</span> : null}</div>
        <h1 className="cover-h">{b.title}</h1><span className="cover-bar" />
        <p className="cover-sub">{b.subtitle}</p>
        {b.image ? <div className="cover-shot"><img src={b.image} alt="" /></div> : null}
        <div className="cover-foot"><span>{fillVars(b.footLeft, ctx.meta)}</span><span>{fillVars(b.footRight, ctx.meta)}</span></div>
      </div>
    );
    case "back": return (
      <div className="back-wrap">
        <DocLogo ring="#ffffff" word="#ffffff" big />
        <h2>{b.title}</h2><p>{b.text}</p>{b.cta ? <span className="cta">{b.cta}</span> : null}
        {b.links.length ? <div className="links">{b.links.map((l, i) => <div key={i}><b>{l.title}</b>{l.text}</div>)}</div> : null}
      </div>
    );
    case "heading": return <div>{b.kicker ? <p className="kicker">{b.kicker}</p> : null}<h2>{b.title}</h2>{b.lead ? <p className="lead">{b.lead}</p> : null}</div>;
    case "subheading": return <h3>{b.text}</h3>;
    case "text": return <div className="rt" dangerouslySetInnerHTML={{ __html: b.html }} />;
    case "html": return <div className="rt" dangerouslySetInnerHTML={{ __html: b.html }} />;
    case "image": return <ImageView b={b} />;
    case "callout": return <div className={"callout" + (b.tone === "warn" ? " warn" : "")}><p className="ct">{b.title}</p><p>{b.text}</p></div>;
    case "spec": return <div className="spec">{b.title ? <p className="spec-t">{b.title}</p> : null}<table><tbody>{b.rows.map((r, i) => <tr key={i}><th>{r.a}</th><td>{r.b}</td></tr>)}</tbody></table></div>;
    case "dodont": return (
      <div className="dd">
        <div className="do"><p>À faire</p><ul>{b.good.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
        <div className="dont"><p>À éviter</p><ul>{b.bad.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
      </div>
    );
    case "example": return <div className={"ex " + b.tone}><span className="lab">{b.label}</span>{b.text}</div>;
    case "table": return <table className="dims"><thead><tr>{b.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead><tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>;
    case "checklist": return <ul className="check">{b.items.map((it, i) => it.group ? <li key={i} className="grp">{it.text}</li> : <li key={i}><span className="box" />{it.tag ? <span className="t">{it.tag}</span> : null}<span>{it.text}</span></li>)}</ul>;
    case "columns": return <div className={"cols" + (b.ratio === "wide" ? " w" : "")}><div><Blocks blocks={b.left} ctx={ctx} /></div><div><Blocks blocks={b.right} ctx={ctx} /></div></div>;
    case "toc": return (
      <div>
        {b.kicker ? <p className="kicker">{b.kicker}</p> : null}<h2>{b.title}</h2>
        <ol className="toc">{ctx.toc.map((t, i) => <li key={i} className={"l" + t.level}><span>{t.label}</span><i /><b>{String(t.page).padStart(2, "0")}</b></li>)}</ol>
      </div>
    );
    case "kpis": return <div className="kpis">{b.items.map((k, i) => <div key={i}><b>{k.value}</b><span>{k.label}</span></div>)}</div>;
    case "benefits": return <div className="benefits">{b.items.map((k, i) => <div key={i}><p className="bt">{k.title}</p><p>{k.text}</p></div>)}</div>;
  }
}

/** Une page imprimée : mêmes éléments dans l'éditeur, l'aperçu et le PDF. */
export function DocPageView({ page, index, meta, data, wrap, toc }: { page: DocPage; index: number; meta: Ctx["meta"]; data: DocData; wrap?: Wrap; toc?: TocEntry[] }) {
  const ctx: Ctx = { meta, toc: toc ?? buildToc(data.pages), wrap };
  const full = page.noChrome || page.blocks.some((b) => b.type === "cover" || b.type === "back");
  if (full) return <section className="page"><Blocks blocks={page.blocks} ctx={ctx} /></section>;
  return (
    <section className="page">
      <header className="ph"><DocLogo /><span>{page.section}</span></header>
      <div className="pc"><Blocks blocks={page.blocks} ctx={ctx} /></div>
      <footer className="pf"><span>{fillVars(data.settings.footer, meta)}</span><b>{String(index + 1).padStart(2, "0")}</b></footer>
    </section>
  );
}
