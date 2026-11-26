/* eslint-disable @next/next/no-img-element */
import QRCode from "qrcode";
import { DocLogo } from "@/components/documents/doc-render";
import { BASE, cellMetrics, faces, fillLine, formatAmount, pageScale, TX_LABEL, type FicheData, type FicheItem, type FicheSettings } from "@/lib/fiches/fiche";

/**
 * Feuilles imprimables des fiches d'annonces. Chaque face est dessinée à
 * l'échelle d'une A4 puis mise à la taille de la feuille (A3, A5, A6…).
 * Charte Moboo fixe : bleu #1E40AF / #1E3A8A, orange #EA580C, Poppins / Inter.
 */

const qrCache = new Map<string, string>();
function qrPath(url: string) {
  let d = qrCache.get(url);
  if (d === undefined) {
    const m = QRCode.create(url, { errorCorrectionLevel: "M" }).modules;
    d = `${m.size}|`;
    for (let y = 0; y < m.size; y++) for (let x = 0; x < m.size; x++) if (m.get(y, x)) d += `M${x} ${y}h1v1h-1z`;
    qrCache.set(url, d);
  }
  return d;
}
/** QR noir sur blanc avec sa zone de silence (2 modules), lisible une fois imprimé. */
export function Qr({ url, size }: { url: string; size: number }) {
  const [n, d] = qrPath(url).split("|");
  const s = Number(n);
  return (
    <svg className="fz-qr" style={{ width: `${size}mm`, height: `${size}mm` }} viewBox={`-2 -2 ${s + 4} ${s + 4}`} shapeRendering="crispEdges" aria-hidden="true">
      <rect x={-2} y={-2} width={s + 4} height={s + 4} fill="#fff" /><path d={d} fill="#000" />
    </svg>
  );
}

const Pin = () => <svg className="fz-pin" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12z" fill="#ea580c" /><circle cx="12" cy="10" r="2.6" fill="#fff" /></svg>;
const ref = (id: string) => id.replace(/-/g, "").slice(0, 6).toUpperCase();

interface Ctx { s: FicheSettings; qr: number; base: string; fs: number }
const urlOf = (c: Ctx, it: FicheItem) => c.base + it.path;
const Price = ({ it }: { it: FicheItem }) => <>{formatAmount(it.price)} <small>FCFA {it.unit}</small></>;

function CardCartes({ it, n, c }: { it: FicheItem; n: number; c: Ctx }) {
  return (
    <div className="fz-c fz-cartes">
      <div className="fz-ph">{it.image ? <img src={it.image} alt="" /> : null}{c.s.showTag ? <span className="fz-tag">{TX_LABEL[it.tx]}</span> : null}{c.s.showNumber ? <span className="fz-num">{n}</span> : null}</div>
      <div className="fz-bd">
        <div className="fz-pr"><Price it={it} /></div>
        <div className="fz-ti">{it.title}</div>
        <div className="fz-bt">
          <div className="fz-meta"><div className="fz-zn"><Pin />{it.zone}</div>{c.s.showRef ? <div className="fz-ref">Réf. {ref(it.id)}</div> : null}</div>
          <Qr url={urlOf(c, it)} size={c.qr} />
        </div>
      </div>
    </div>
  );
}

function CardPhoto({ it, n, c }: { it: FicheItem; n: number; c: Ctx }) {
  return (
    <div className="fz-c fz-photo">
      {it.image ? <img className="fz-bg" src={it.image} alt="" /> : null}
      {c.s.showNumber ? <span className="fz-num">{n}</span> : null}
      {c.s.showTag ? <span className="fz-tag fz-tag-r">{TX_LABEL[it.tx]}</span> : null}
      <div className="fz-band">
        <div className="fz-pp"><b>{formatAmount(it.price)}</b><small>FCFA {it.unit}</small></div>
        <div className="fz-mid" style={{ paddingRight: `${c.qr + 3}mm` }}><div className="fz-ti">{it.title}</div><div className="fz-zn"><Pin />{it.zone}</div>{c.s.showRef ? <div className="fz-ref">Réf. {ref(it.id)}</div> : null}</div>
      </div>
      <div className="fz-qbox"><Qr url={urlOf(c, it)} size={c.qr} /></div>
    </div>
  );
}

function CardListe({ it, n, c }: { it: FicheItem; n: number; c: Ctx }) {
  return (
    <div className="fz-c fz-liste">
      <div className="fz-ph">{it.image ? <img src={it.image} alt="" /> : null}{c.s.showNumber ? <span className="fz-num">{n}</span> : null}</div>
      <div className="fz-bd"><div className="fz-ti">{it.title}</div><div className="fz-zn"><Pin />{it.zone}</div>{c.s.showRef || c.s.showTag ? <div className="fz-ref">{[c.s.showTag ? TX_LABEL[it.tx] : "", c.s.showRef ? `Réf. ${ref(it.id)}` : ""].filter(Boolean).join(" · ")}</div> : null}</div>
      <div className="fz-pr"><Price it={it} /></div>
      <Qr url={urlOf(c, it)} size={c.qr} />
    </div>
  );
}

const CARDS = { cartes: CardCartes, photo: CardPhoto, liste: CardListe };

/** Ligne d'édition : la partie avant « — » en orange. */
function EdLine({ text }: { text: string }) {
  const i = text.indexOf(" — ");
  return i < 0 ? <b>{text}</b> : <><b>{text.slice(0, i)}</b>{text.slice(i)}</>;
}

export interface SheetMeta { edition: number; editionDate: string }

/** Toutes les faces de la fiche. `base` : adresse du site pour les QR (sans / final). */
export function FicheSheets({ data, meta, base }: { data: FicheData; meta: SheetMeta; base: string }) {
  const s = data.settings;
  const { w, h, k, bw, bh } = pageScale(s);
  const m = cellMetrics(s);
  const c: Ctx = { s, qr: m.qrBase, base, fs: Math.min(1.7, Math.max(0.8, Math.min(m.rowH / 44, m.colW / 88) )) };
  const list = faces(data.items, s);
  const Card = CARDS[s.design] ?? CardCartes;
  const scan = s.scanUrl.trim() || `${base}/annonces`;
  const grouped = s.design === "liste" && s.groupByCommune && s.cols === 1;
  let n = 0;
  return (
    <>
      {list.map((items, i) => {
        const side = !s.showSide ? "" : list.length === 2 ? (i === 0 ? "Recto" : "Verso") : list.length > 2 ? `Page ${i + 1}` : "";
        const title = s.pageTitles[i]?.trim() || s.title;
        const cells = items.map((it) => <Card key={it.key + i} it={it} n={++n} c={c} />);
        let body;
        if (grouped) {
          const out: JSX.Element[] = [];
          let prev = "";
          items.forEach((it, j) => {
            if (it.commune !== prev) { out.push(<div key={"h" + j} className="fz-zh"><span>{it.commune}</span><i /></div>); prev = it.commune; }
            out.push(<div key={"r" + j} className="fz-lrow">{cells[j]}</div>);
          });
          const heads = out.length - items.length;
          body = <div className="fz-glist" style={{ ["--rowh" as string]: `calc((100% - ${heads} * 7mm - ${Math.max(0, s.rows - 1)} * ${BASE.gap}mm) / ${Math.max(1, s.rows)})` }}>{out}</div>;
        } else {
          body = <div className="fz-grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, s.cols)}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${Math.max(1, s.rows)}, minmax(0, 1fr))` }}>{cells}</div>;
        }
        return (
          <section key={i} className="fz-page" style={{ width: `${w}mm`, height: `${h}mm` }}>
            <div className="fz-base" style={{ width: `${bw}mm`, height: `${bh}mm`, transform: `scale(${k})`, ["--fs" as string]: c.fs }}>
              <div className="fz-in" style={{ padding: `${BASE.mt}mm ${BASE.mx}mm ${BASE.mb}mm` }}>
                <header className="fz-h">
                  <DocLogo big />
                  <div className="fz-ht"><h1>{title}</h1><div className="fz-ed"><EdLine text={fillLine(s.editionLine, meta.edition, meta.editionDate)} />{side ? ` · ${side}` : ""}</div></div>
                  <div className="fz-scan"><div className="fz-lab">{s.scanTitle}<small>{s.scanText}</small></div><Qr url={scan} size={22} /></div>
                </header>
                <div className={"fz-box" + (s.frame ? " fz-framed" : "")}>{body}</div>
                <footer className="fz-f"><span><b>{s.footerSite}</b>{s.footerPowered ? <> · <span className="fz-p">{s.footerPowered}</span></> : null}</span><span className="fz-hint">{s.footerHint}</span><span>{i + 1}/{list.length}</span></footer>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}

/** Feuille de style des fiches (écran et impression). */
export function ficheCss(s: FicheSettings) {
  const { w, h } = pageScale(s);
  return `
@page { size: ${w}mm ${h}mm; margin: 0; }
.fz-page { position: relative; overflow: hidden; background: #fff; color: #0f172a; font-family: var(--font-inter), Inter, system-ui, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
.fz-page *, .fz-page *::before, .fz-page *::after { box-sizing: border-box; }
.fz-base { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
.fz-in { position: absolute; inset: 0; display: flex; flex-direction: column; }
.fz-page .logo { display: inline-flex; align-items: center; gap: 2mm; flex: none; }
.fz-page .logo svg { width: 11mm; height: 10mm; }
.fz-page .logo .word { font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 900; font-size: 20pt; letter-spacing: -.02em; }
.fz-page .logo .ci { font-weight: 700; opacity: .85; }
.fz-h { display: flex; align-items: center; justify-content: space-between; gap: 5mm; height: ${BASE.header}mm; margin-bottom: ${BASE.headerGap}mm; flex: none; }
.fz-ht { flex: 1; min-width: 0; text-align: center; }
.fz-ht h1 { margin: 0; font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 800; font-size: 16.5pt; line-height: 1.1; color: #0f172a; }
.fz-ed { margin-top: 1.2mm; font-size: 8.5pt; color: #475569; font-weight: 600; }
.fz-ed b { color: #ea580c; }
.fz-scan { display: flex; align-items: center; gap: 2mm; flex: none; }
.fz-lab { font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 800; font-size: 9pt; line-height: 1.15; text-align: right; color: #1e40af; max-width: 26mm; }
.fz-lab small { display: block; font-family: var(--font-inter), Inter, sans-serif; font-weight: 500; font-size: 7pt; color: #64748b; }
.fz-qr { display: block; flex: none; }
.fz-box { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.fz-framed { border: ${BASE.frame}mm solid #ea580c; border-radius: 4mm; padding: ${BASE.pad}mm; }
.fz-f { flex: none; height: ${BASE.footer}mm; margin-top: ${BASE.footerGap}mm; display: flex; align-items: center; justify-content: space-between; gap: 4mm; font-size: 8pt; color: #475569; }
.fz-f b { font-family: var(--font-poppins), Poppins, sans-serif; color: #1e40af; font-size: 11pt; }
.fz-p { color: #ea580c; font-weight: 700; }
.fz-hint { flex: 1; text-align: center; }
.fz-pin { width: 1.15em; height: 1.15em; flex: none; }
.fz-grid { flex: 1; min-height: 0; display: grid; gap: ${BASE.gap}mm; }
.fz-glist { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.fz-lrow { height: var(--rowh); flex: none; margin-bottom: ${BASE.gap}mm; }
.fz-lrow:last-child { margin-bottom: 0; }
.fz-zh { flex: none; height: 7mm; display: flex; align-items: center; gap: 2mm; font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 800; font-size: 10pt; color: #fff; }
.fz-zh span { background: #1e40af; padding: .6mm 3mm; border-radius: 1mm; }
.fz-zh i { flex: 1; height: .5mm; background: #ea580c; }
.fz-c { font-size: calc(var(--fs) * 10pt); position: relative; min-height: 0; min-width: 0; height: 100%; overflow: hidden; }
.fz-num { position: absolute; left: 1.8mm; top: 1.8mm; width: 1.9em; height: 1.9em; border-radius: 50%; background: #1e40af; color: #fff; font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 800; font-size: .78em; display: grid; place-items: center; border: .4mm solid #fff; }
.fz-tag { position: absolute; left: 1.5mm; bottom: 1.5mm; background: #ea580c; color: #fff; font-size: .64em; font-weight: 700; padding: .15em .55em; border-radius: 1mm; text-transform: uppercase; letter-spacing: .03em; }
.fz-ti { font-weight: 700; line-height: 1.25; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.fz-zn { display: flex; align-items: center; gap: .25em; font-weight: 600; color: #334155; line-height: 1.2; }
.fz-ref { font-size: .6em; color: #94a3b8; margin-top: .3em; }
.fz-pr { font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 800; color: #1e40af; line-height: 1.1; }
.fz-pr small { font-size: .56em; font-weight: 600; color: #64748b; }
/* Cartes */
.fz-cartes { display: flex; border: .35mm solid #e2e8f0; border-radius: 2.5mm; background: #fff; }
.fz-cartes .fz-ph { position: relative; width: 40%; flex: none; background: #f1f5f9; }
.fz-cartes .fz-ph img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.fz-cartes .fz-tag { left: 1.5mm; top: 1.5mm; bottom: auto; }
.fz-cartes .fz-num { left: auto; right: 1.5mm; }
.fz-cartes .fz-bd { flex: 1; min-width: 0; padding: .55em .6em; display: flex; flex-direction: column; }
.fz-cartes .fz-pr { font-size: 1.25em; }
.fz-cartes .fz-ti { font-size: .84em; margin-top: .25em; }
.fz-cartes .fz-bt { margin-top: auto; display: flex; align-items: flex-end; justify-content: space-between; gap: 1.5mm; }
.fz-cartes .fz-meta { min-width: 0; }
.fz-cartes .fz-zn { font-size: .76em; }
/* Grande photo */
.fz-photo { border-radius: 3mm; background: #0f172a; }
.fz-photo .fz-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.fz-photo .fz-tag-r { left: auto; right: 1.8mm; top: 1.8mm; bottom: auto; }
.fz-photo .fz-band { position: absolute; left: 0; right: 0; bottom: 0; min-height: 34%; background: #fff; display: flex; align-items: stretch; }
.fz-photo .fz-pp { background: #ea580c; color: #fff; padding: .4em .6em; display: flex; flex-direction: column; justify-content: center; flex: none; max-width: 45%; }
.fz-photo .fz-pp b { font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 800; font-size: 1.15em; line-height: 1.05; }
.fz-photo .fz-pp small { font-size: .66em; font-weight: 600; }
.fz-photo .fz-mid { flex: 1; min-width: 0; padding: .35em .5em; display: flex; flex-direction: column; justify-content: center; }
.fz-photo .fz-ti { font-size: .78em; }
.fz-photo .fz-zn { font-size: .72em; margin-top: .15em; }
.fz-photo .fz-qbox { position: absolute; right: 1.6mm; bottom: 1.6mm; background: #fff; border-radius: 1.5mm; padding: .6mm; box-shadow: 0 .5mm 2mm rgba(0,0,0,.25); }
/* Liste */
.fz-liste { display: flex; align-items: center; gap: 3mm; border-bottom: .3mm dashed #cbd5e1; padding: .6mm 0; }
.fz-liste .fz-ph { position: relative; width: 24%; max-width: 34mm; height: 100%; flex: none; }
.fz-liste .fz-ph img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 1.8mm; display: block; }
.fz-liste .fz-bd { flex: 1; min-width: 0; }
.fz-liste .fz-ti { font-size: .96em; }
.fz-liste .fz-zn { font-size: .8em; margin-top: .3em; color: #475569; }
.fz-liste .fz-pr { text-align: right; font-size: 1.3em; color: #ea580c; flex: none; }
.fz-liste .fz-pr small { display: block; }
`;
}
