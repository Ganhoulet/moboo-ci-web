import type { ReactNode } from "react";
import QRCode from "qrcode";
import { formatPrice } from "@/lib/documents/zone";
import { buildToc, fillVars, type Block, type DocData, type DocMeta, type DocPage, type ImageBlock, type TocEntry } from "@/lib/documents/types";

export type Wrap = (b: Block, node: ReactNode) => ReactNode;
interface Ctx { meta: Pick<DocMeta, "title" | "edition" | "editionDate"> & { zoneName?: string }; toc: TocEntry[]; wrap?: Wrap }

/** Texte simple avec **gras** (retours à la ligne gardés par le CSS du bloc). */
function Rich({ t }: { t: string }) {
  const parts = String(t ?? "").split("**");
  return <>{parts.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : <span key={i}>{p}</span>))}</>;
}

/** QR code dessiné en SVG, noir sur blanc. */
function Qr({ url, className }: { url: string; className?: string }) {
  const m = QRCode.create(url || "https://moboo.ci", { errorCorrectionLevel: "M" }).modules;
  let d = "";
  for (let y = 0; y < m.size; y++) for (let x = 0; x < m.size; x++) if (m.get(y, x)) d += `M${x} ${y}h1v1h-1z`;
  return <svg className={className} viewBox={`0 0 ${m.size} ${m.size}`} aria-hidden="true"><path d={d} fill="#000" /></svg>;
}

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

/** Bloc de données encore vide. */
function Empty({ text = "Choisissez une zone puis actualisez les données." }: { text?: string }) {
  return <p className="small muted">{text}</p>;
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
        <div className="cover-top"><DocLogo ring="#ffffff" word="#ffffff" big />{b.tag ? <span className="cover-tag">{fillVars(b.tag, ctx.meta)}</span> : null}</div>
        <h1 className={"cover-h" + (b.small ? " sm" : "")}>{fillVars(b.title, ctx.meta)}</h1><span className="cover-bar" />
        <p className="cover-sub">{fillVars(b.subtitle, ctx.meta)}</p>
        {b.image ? <div className="cover-shot"><img src={b.image} alt="" /></div> : null}
        <div className="cover-foot"><span>{fillVars(b.footLeft, ctx.meta)}</span><span>{fillVars(b.footRight, ctx.meta)}</span></div>
      </div>
    );
    case "back": return (
      <div className="back-wrap">
        <DocLogo ring="#ffffff" word="#ffffff" big />
        <h2>{fillVars(b.title, ctx.meta)}</h2><p>{fillVars(b.text, ctx.meta)}</p>{b.cta ? <span className="cta">{b.cta}</span> : null}
        {b.note ? <p className="note">{fillVars(b.note, ctx.meta)}</p> : null}
        {b.qr ? <div className="back-qr"><Qr url={b.qr} /></div> : null}
        {b.links.length ? <div className="links">{b.links.map((l, i) => <div key={i}><b>{l.title}</b>{l.text}</div>)}</div> : null}
      </div>
    );
    case "heading": return (
      <div>
        {b.kicker ? (b.kickerTag ? <span className="step">{fillVars(b.kicker, ctx.meta)}</span> : <p className="kicker">{fillVars(b.kicker, ctx.meta)}</p>) : null}
        {b.badge ? <div className="zone-head"><span className="n">{b.badge}</span><h2>{fillVars(b.title, ctx.meta)}</h2></div> : <h2>{fillVars(b.title, ctx.meta)}</h2>}
        {b.lead ? <p className="lead">{fillVars(b.lead, ctx.meta)}</p> : null}
      </div>
    );
    case "subheading": return <h3>{fillVars(b.text, ctx.meta)}</h3>;
    case "text": return <div className="rt" dangerouslySetInnerHTML={{ __html: b.html }} />;
    case "html": return <div className="rt" dangerouslySetInnerHTML={{ __html: b.html }} />;
    case "image": return <ImageView b={b} />;
    case "callout": return <div className={"callout" + (b.tone === "warn" ? " warn" : "")}><p className="ct">{fillVars(b.title, ctx.meta)}</p><p><Rich t={fillVars(b.text, ctx.meta)} /></p></div>;
    case "spec": return <div className="spec">{b.title ? <p className="spec-t">{b.title}</p> : null}<table><tbody>{b.rows.map((r, i) => <tr key={i}><th><Rich t={r.a} /></th><td><Rich t={r.b} /></td></tr>)}</tbody></table></div>;
    case "dodont": return (
      <div className="dd">
        <div className="do"><p>À faire</p><ul>{b.good.filter(Boolean).map((x, i) => <li key={i}><Rich t={x} /></li>)}</ul></div>
        <div className="dont"><p>À éviter</p><ul>{b.bad.filter(Boolean).map((x, i) => <li key={i}><Rich t={x} /></li>)}</ul></div>
      </div>
    );
    case "example": return <div className={"ex " + b.tone}><span className="lab">{b.label}</span><Rich t={b.text} /></div>;
    case "table": return <table className={b.dense ? "fields" : "dims" + (b.small ? " sm" : "")}><thead><tr>{b.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead><tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}><Rich t={c} /></td>)}</tr>)}</tbody></table>;
    case "checklist": return <ul className="check">{b.items.map((it, i) => it.group ? <li key={i} className="grp">{it.text}</li> : <li key={i}><span className="box" />{it.tag ? <span className="t">{it.tag}</span> : null}<span><Rich t={it.text} /></span></li>)}</ul>;
    case "columns": return <div className={"cols" + (b.ratio === "wide" ? " w" : b.ratio === "anat" ? " a" : b.ratio === "narrow" ? " n" : "")}><div><Blocks blocks={b.left} ctx={ctx} /></div><div><Blocks blocks={b.right} ctx={ctx} /></div></div>;
    case "toc": return (
      <div>
        {b.kicker ? <p className="kicker">{b.kicker}</p> : null}<h2>{b.title}</h2>
        <ol className="toc">{ctx.toc.map((t, i) => <li key={i} className={"l" + t.level}><span>{fillVars(t.label, ctx.meta)}</span><i /><b>{String(t.page).padStart(2, "0")}</b></li>)}</ol>
      </div>
    );
    case "kpis": return <div className="kpis">{b.items.map((k, i) => <div key={i}><b>{k.value}</b><span><Rich t={k.label} /></span></div>)}</div>;
    case "benefits": return <div className={"benefits" + (b.single ? " one" : "")}>{b.items.map((k, i) => <div key={i}><p className="bt">{k.title}</p><p><Rich t={k.text} /></p></div>)}</div>;
    case "legend": return <ol className="legend">{b.items.map((m, i) => <li key={i}><span className="n">{m.n}</span>{m.text}</li>)}</ol>;
    case "divider": return <div className="dv" />;
    case "bars": return <div className="bars">{b.items.map((r, i) => <div key={i} className="bar"><span className="bl">{r.label}</span><span className="bt"><i style={{ width: `${Math.max(0, Math.min(100, r.pct))}%` }} /></span><span className="bv">{r.value}{r.sub ? <small> · {r.sub}</small> : null}</span></div>)}</div>;
    case "sources": return <p className="srcline"><Rich t={fillVars(b.text, ctx.meta)} /></p>;
    case "qr": return <div className="qrb"><Qr url={b.url} /><span>{fillVars(b.caption, ctx.meta)}</span></div>;
    case "zoneStats": return b.items.length ? <div className="kpis">{b.items.map((k, i) => <div key={i}><b>{k.value}</b><span>{k.label}</span></div>)}</div> : <Empty />;
    case "zonePrices": return (
      <div>
        <h3>{fillVars(b.title, ctx.meta)}</h3>
        {b.rows.length ? <>
          <table className="dims"><thead><tr><th>Type de bien</th><th>Médian</th><th>Fourchette</th>{b.entry ? <th>Pour entrer*</th> : null}<th>Annonces</th></tr></thead>
            <tbody>{b.rows.map((r, i) => <tr key={i}><td style={{ textTransform: "capitalize" }}>{r.label}</td><td>{r.median === null ? "—" : formatPrice(r.median)}</td><td>{r.p25 === null || r.p75 === null ? "—" : `${formatPrice(r.p25)} à ${formatPrice(r.p75)}`}</td>{b.entry ? <td>{r.median === null ? "—" : formatPrice(r.median * 4)}</td> : null}<td>{r.n}</td></tr>)}</tbody></table>
          {b.entry ? <p className="small muted">* Estimation : 2 mois de caution, 1 mois d’avance et 1 mois de frais d’agence, sur le loyer médian.</p> : null}
        </> : <Empty text="Pas encore assez d’annonces pour calculer ces prix." />}
      </div>
    );
    case "zoneListings": return b.items.length ? (
      <div className="lcards">{b.items.map((l) => (
        <div key={l.id} className="lcard">
          <div className="lph">{l.image ? <img src={l.image} alt="" /> : null}{l.pct ? <span className="ltag">{l.pct} % sous la médiane</span> : null}</div>
          <p className="lprice">{formatPrice(l.price)}{l.priceUnit === "month" ? <small> / mois</small> : null}</p>
          <p className="ltitle">{l.title}</p>
          <div className="lbot"><span>{[l.place, l.bedrooms ? `${l.bedrooms} ch.` : "", l.surface ? `${l.surface} m²` : ""].filter(Boolean).join(" · ")}</span><Qr url={l.url} /></div>
        </div>
      ))}</div>
    ) : <Empty />;
    case "zonePros": return b.items.length ? (
      <div className="pcards">{b.items.map((p, i) => (
        <div key={i} className="pcard">
          <div className="pav">{p.image ? <img src={p.image} alt="" /> : <span>{p.name.slice(0, 1)}</span>}</div>
          <div className="pbody">
            <p className="ptitle">{p.name}{p.verified ? <span className="pok">Vérifié</span> : null}</p>
            {p.company ? <p className="small muted">{p.company}</p> : null}
            <p className="small">{[p.reviews ? `${String(p.rating).replace(".", ",")} / 5 (${p.reviews} avis)` : "", p.listings ? `${p.listings} annonce${p.listings > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · ")}</p>
            {p.phone ? <p className="small"><b>{p.phone}</b></p> : null}
          </div>
          <Qr url={p.url} className="pqr" />
        </div>
      ))}</div>
    ) : <Empty />;
    case "zoneText": return b.html ? <div className="rt faq" dangerouslySetInnerHTML={{ __html: b.html }} /> : <Empty />;
  }
}

/** Une page imprimée : mêmes éléments dans l'éditeur, l'aperçu et le PDF. */
export function DocPageView({ page, index, meta, data, wrap, toc }: { page: DocPage; index: number; meta: Ctx["meta"]; data: DocData; wrap?: Wrap; toc?: TocEntry[] }) {
  const m = { ...meta, zoneName: data.settings.zoneName };
  const ctx: Ctx = { meta: m, toc: toc ?? buildToc(data.pages), wrap };
  const full = page.noChrome || page.blocks.some((b) => b.type === "cover" || b.type === "back");
  if (full) return <section className="page"><Blocks blocks={page.blocks} ctx={ctx} /></section>;
  return (
    <section className="page">
      <header className="ph"><DocLogo /><span>{fillVars(page.section, m)}</span></header>
      <div className="pc"><Blocks blocks={page.blocks} ctx={ctx} /></div>
      <footer className="pf"><span>{fillVars(data.settings.footer, m)}</span><b>{String(index + 1).padStart(2, "0")}</b></footer>
    </section>
  );
}
