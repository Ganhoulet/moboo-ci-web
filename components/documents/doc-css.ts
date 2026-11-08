import { PAPER, type DocFormat } from "@/lib/documents/types";

/**
 * Charte Moboo des documents imprimables : couleurs et polices fixes, non
 * modifiables depuis l'éditeur (bleu #1E40AF / #1E3A8A, orange #EA580C,
 * encre #0F172A, Poppins pour les titres, Inter pour le texte).
 */
const BASE = `
.page { position: relative; overflow: hidden; background: #fff; color: #0f172a; font-family: var(--font-inter), Inter, system-ui, sans-serif; font-size: 9.6pt; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
.page *, .page *::before, .page *::after { box-sizing: border-box; }
.ph { position: absolute; top: 0; left: 0; right: 0; height: 16mm; padding: 0 16mm; display: flex; align-items: center; justify-content: space-between; border-bottom: .3mm solid #e2e8f0; font-size: 8pt; color: #64748b; font-weight: 600; letter-spacing: .02em; text-transform: uppercase; }
.pf { position: absolute; bottom: 0; left: 0; right: 0; height: 13mm; padding: 0 16mm; display: flex; align-items: center; justify-content: space-between; gap: 6mm; font-size: 7.8pt; color: #64748b; }
.pf b { font-family: var(--font-poppins), Poppins, sans-serif; font-size: 10pt; color: #1e40af; }
.pc { position: absolute; top: 22mm; left: 16mm; right: 16mm; bottom: 16mm; overflow: hidden; }
.logo { display: inline-flex; align-items: center; gap: 2mm; }
.logo svg { width: 7mm; height: 6.4mm; }
.logo .word { font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 900; font-size: 12pt; letter-spacing: -.02em; text-transform: none; }
.logo .ci { font-weight: 700; opacity: .85; }
.logo.big svg { width: 13mm; height: 12mm; }
.logo.big .word { font-size: 22pt; }
.kicker, h1, h2, h3, h4, .bt, .ct, .spec-t { font-family: var(--font-poppins), Poppins, sans-serif; }
.kicker { margin: 0 0 1mm; color: #ea580c; font-weight: 700; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .08em; }
h2 { margin: 0 0 3mm; font-size: 21pt; line-height: 1.15; font-weight: 800; color: #0f172a; letter-spacing: -.01em; }
h3 { margin: 5mm 0 2mm; font-size: 12.5pt; line-height: 1.25; font-weight: 700; color: #1e3a8a; }
h4 { margin: 3mm 0 1mm; font-size: 10pt; font-weight: 700; color: #0f172a; }
p { margin: 0 0 2mm; }
b, strong { font-weight: 700; }
em, i { font-style: italic; }
a { color: #1e40af; text-decoration: underline; }
.lead { font-size: 10.6pt; color: #334155; margin-bottom: 4mm; }
.small { font-size: 8pt; } .muted { color: #64748b; }
.rt ul, .rt ol { margin: 0 0 2mm; padding-left: 4.5mm; }
.rt ul { list-style: disc; } .rt ol { list-style: decimal; }
.rt li { margin-bottom: .8mm; }
.shot { position: relative; overflow: hidden; border-radius: 2.5mm; border: .3mm solid #e2e8f0; background: #fff; box-shadow: 0 1mm 4mm rgba(15,23,42,.08); }
.shot.none { border: 0; border-radius: 0; box-shadow: none; background: none; }
.shot.phone { border: 1.6mm solid #0f172a; border-radius: 6mm; }
.shot img { position: absolute; display: block; max-width: none; }
.shot img.static { position: static; width: 100%; height: auto; }
.shot .empty { display: grid; place-items: center; height: 40mm; color: #94a3b8; font-size: 9pt; background: #f8fafc; }
.mk, .legend .n { display: grid; place-items: center; border-radius: 50%; background: #ea580c; color: #fff; font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 800; font-size: 7.4pt; line-height: 1; }
.mk { position: absolute; transform: translate(-50%, -50%); width: 5.4mm; height: 5.4mm; border: .5mm solid #fff; box-shadow: 0 .5mm 1.5mm rgba(0,0,0,.25); }
figure { margin: 0 0 3mm; }
figcaption { font-size: 8pt; color: #64748b; margin-top: 2mm; }
.imgl { display: grid; gap: 6mm; align-items: start; }
.legend { list-style: none; padding: 0; margin: 0; }
.legend li { display: flex; align-items: center; gap: 2.5mm; font-size: 9pt; font-weight: 600; margin-bottom: 1.6mm; }
.legend .n { flex: none; width: 5.6mm; height: 5.6mm; }
.legend.below { margin-top: 3mm; display: grid; grid-template-columns: 1fr 1fr; column-gap: 6mm; }
.cover-wrap { position: absolute; inset: 0; background: #1e40af; color: #fff; padding: 18mm 16mm; }
.cover-top { display: flex; justify-content: space-between; align-items: center; gap: 5mm; }
.cover-tag { font-size: 8.5pt; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; border: .3mm solid rgba(255,255,255,.45); padding: 1.5mm 3.5mm; border-radius: 10mm; }
.cover-h { font-family: var(--font-poppins), Poppins, sans-serif; font-size: 44pt; line-height: 1.02; font-weight: 900; margin: 26mm 0 7mm; letter-spacing: -.02em; color: #fff; white-space: pre-line; }
.cover-bar { display: block; width: 22mm; height: 1.6mm; background: #ea580c; margin: 0 0 6mm; }
.cover-sub { font-size: 13pt; line-height: 1.45; max-width: 150mm; color: #dbe6fe; }
.cover-shot { position: absolute; left: 16mm; right: -30mm; bottom: 30mm; height: 127mm; overflow: hidden; border: 1.2mm solid #fff; border-radius: 4mm; box-shadow: 0 6mm 18mm rgba(0,0,0,.35); background: #fff; }
.cover-shot img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: top left; }
.cover-foot { position: absolute; left: 16mm; right: 16mm; bottom: 12mm; display: flex; justify-content: space-between; font-size: 9pt; color: #bfd3fe; font-weight: 600; }
.back-wrap { position: absolute; inset: 0; background: #1e40af; color: #fff; padding: 22mm 18mm; }
.back-wrap h2 { color: #fff; font-size: 26pt; margin-top: 40mm; white-space: pre-line; }
.back-wrap p { color: #dbe6fe; font-size: 11pt; max-width: 150mm; white-space: pre-line; }
.back-wrap .cta { display: inline-block; margin-top: 6mm; background: #ea580c; color: #fff; font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 700; font-size: 12pt; padding: 3.5mm 7mm; border-radius: 2.5mm; }
.back-wrap .links { position: absolute; left: 18mm; right: 18mm; bottom: 18mm; display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; font-size: 9pt; color: #bfd3fe; }
.back-wrap .links b { display: block; color: #fff; font-family: var(--font-poppins), Poppins, sans-serif; margin-bottom: 1mm; }
.kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; margin: 2mm 0; }
.kpis div { background: #eff4ff; border-radius: 2.5mm; padding: 3.5mm 4mm; }
.kpis b { display: block; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 20pt; color: #1e40af; line-height: 1.1; }
.kpis span { font-size: 8.3pt; color: #334155; }
.benefits { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 6mm; }
.back-qr { position: absolute; right: 18mm; top: 22mm; width: 30mm; height: 30mm; background: #fff; padding: 2mm; border-radius: 2mm; }
.back-qr svg, .qrb svg { display: block; width: 100%; height: 100%; }
.qrb { display: flex; align-items: center; gap: 4mm; font-size: 9pt; font-weight: 600; margin: 3mm 0; }
.qrb svg { width: 24mm; height: 24mm; flex: none; }
.lcards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; margin-top: 2mm; }
.lcard { border: .3mm solid #e2e8f0; border-radius: 2.5mm; overflow: hidden; padding-bottom: 2mm; break-inside: avoid; }
.lph { position: relative; height: 33mm; background: #f1f5f9; }
.lph img { display: block; width: 100%; height: 100%; object-fit: cover; }
.ltag { position: absolute; left: 1.5mm; bottom: 1.5mm; background: #ea580c; color: #fff; font-size: 6.8pt; font-weight: 700; padding: .4mm 1.5mm; border-radius: 1mm; }
.lprice { margin: 1.5mm 2.2mm 0; font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 800; font-size: 10pt; color: #1e40af; }
.lprice small { font-size: 7.5pt; font-weight: 600; }
.ltitle { margin: .5mm 2.2mm 0; font-size: 8.3pt; font-weight: 600; line-height: 1.25; height: 7.2mm; overflow: hidden; }
.lbot { margin: 1mm 2.2mm 0; display: flex; justify-content: space-between; align-items: flex-end; gap: 2mm; font-size: 7.3pt; color: #64748b; line-height: 1.25; }
.lbot svg { flex: none; width: 12mm; height: 12mm; }
.pcards { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin-top: 2mm; }
.pcard { display: flex; gap: 3mm; align-items: center; border: .3mm solid #e2e8f0; border-radius: 2.5mm; padding: 2.5mm; break-inside: avoid; }
.pav { flex: none; width: 15mm; height: 15mm; border-radius: 50%; overflow: hidden; background: #eff4ff; display: grid; place-items: center; color: #1e40af; font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 800; font-size: 14pt; }
.pav img { display: block; width: 100%; height: 100%; object-fit: cover; }
.pbody { flex: 1; min-width: 0; }
.pbody p { margin: 0; }
.ptitle { font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 700; font-size: 9.2pt; line-height: 1.2; }
.pok { margin-left: 1.5mm; background: #ecfdf5; color: #059669; font-size: 6.8pt; padding: .2mm 1.2mm; border-radius: 1mm; }
.pqr { flex: none; width: 13mm; height: 13mm; }
.benefits.one { grid-template-columns: 1fr; }
.step { display: inline-flex; align-items: center; background: #ea580c; color: #fff; font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 700; font-size: 8pt; text-transform: uppercase; letter-spacing: .06em; padding: 1mm 3mm; border-radius: 1mm; margin-bottom: 2mm; }
.zone-head { display: flex; align-items: center; gap: 3mm; margin-bottom: 2mm; }
.zone-head .n { flex: none; width: 9mm; height: 9mm; border-radius: 50%; background: #ea580c; color: #fff; font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 800; font-size: 12pt; display: grid; place-items: center; }
.zone-head h2 { margin: 0; font-size: 17pt; }
.back-wrap .note { font-size: 8.5pt; margin-top: 8mm; color: #bfd3fe; }
.benefits > div { border-left: .8mm solid #1e40af; padding: .5mm 0 .5mm 3.5mm; }
.bt { font-weight: 700; color: #0f172a; font-size: 10pt; margin: 0 0 .8mm; }
.benefits p:not(.bt) { font-size: 8.8pt; color: #334155; margin: 0; }
.callout { background: #eff4ff; border-radius: 2.5mm; padding: 3.5mm 4.5mm; margin-top: 4mm; }
.callout .ct { margin: 0 0 1mm; font-weight: 700; color: #1e3a8a; font-size: 9.6pt; }
.callout p:not(.ct) { font-size: 8.8pt; margin: 0; white-space: pre-line; }
.callout.warn { background: #fff7ed; }
.callout.warn .ct { color: #c2410c; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; align-items: start; }
.cols.w { grid-template-columns: 1.15fr .85fr; }
.cols.a { grid-template-columns: 56% 1fr; }
.cols.n { grid-template-columns: 39% 1fr; }
.dv { margin: 6mm 0 5mm; border-top: .3mm solid #e2e8f0; }
.where { display: flex; gap: 2.5mm; align-items: baseline; font-size: 8.8pt; margin: 0 0 3mm; }
.where span { flex: none; background: #1e40af; color: #fff; font-weight: 700; font-size: 7.4pt; text-transform: uppercase; letter-spacing: .05em; padding: .6mm 2mm; border-radius: 1mm; }
.why { font-size: 8.9pt; color: #334155; }
.why b { color: #0f172a; }
ul.why, ol.why { padding-left: 4.5mm; }
.ba-t { font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 700; font-size: 10pt; margin: 0 0 2mm; }
.ba-t.bad { color: #dc2626; } .ba-t.good { color: #059669; }
.faq h4 { color: #1e3a8a; margin-top: 3.5mm; }
.faq p { font-size: 8.9pt; color: #334155; }
.fields { width: 100%; border-collapse: collapse; font-size: 7.9pt; line-height: 1.38; margin-top: 2mm; }
.fields th { text-align: left; background: #eff4ff; color: #1e3a8a; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 8pt; padding: 1.6mm 2.5mm; }
.fields td { padding: 1.5mm 2.5mm; border-bottom: .2mm solid #e2e8f0; vertical-align: top; }
.fields td:first-child { font-weight: 700; width: 25mm; }
.spec { border: .4mm solid #1e40af; border-radius: 2.5mm; overflow: hidden; margin: 3mm 0; }
.spec-t { margin: 0; background: #1e40af; color: #fff; font-weight: 700; font-size: 8.6pt; padding: 1.6mm 3.5mm; letter-spacing: .02em; }
.spec table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
.spec th { text-align: left; font-weight: 600; color: #64748b; padding: 1.4mm 3.5mm; width: 36%; vertical-align: top; border-top: .2mm solid #e2e8f0; }
.spec td { padding: 1.4mm 3.5mm; font-weight: 600; border-top: .2mm solid #e2e8f0; }
.dd { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin-top: 3mm; }
.dd > div { border-radius: 2.5mm; padding: 2.8mm 3.5mm; font-size: 8.5pt; }
.dd p { font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 700; font-size: 9pt; margin: 0 0 1mm; }
.dd ul { margin: 0; padding-left: 4.5mm; list-style: disc; }
.dd li { margin-bottom: .8mm; }
.dd .do { background: #ecfdf5; } .dd .do p { color: #059669; }
.dd .dont { background: #fef2f2; } .dd .dont p { color: #dc2626; }
.ex { background: #f8fafc; border: .3mm dashed #cbd5e1; border-radius: 2mm; padding: 2.5mm 3.5mm; font-size: 8.6pt; margin: 2mm 0; white-space: pre-line; }
.ex .lab { display: block; font-size: 7.3pt; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .6mm; }
.ex.good .lab { color: #059669; } .ex.bad .lab { color: #dc2626; }
.toc { list-style: none; padding: 0; margin: 4mm 0 0; }
.toc li { display: flex; align-items: baseline; gap: 2mm; padding: 1.2mm 0; font-size: 10.5pt; font-weight: 600; }
.toc li i { flex: 1; border-bottom: .3mm dotted #94a3b8; transform: translateY(-1mm); }
.toc li b { font-family: var(--font-poppins), Poppins, sans-serif; color: #1e40af; }
.toc li.l0 { font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 700; font-size: 11pt; margin-top: 1mm; border-top: .3mm solid #e2e8f0; padding-top: 2mm; }
.toc li.l1 { padding-left: 6mm; font-size: 9pt; color: #334155; padding-top: .2mm; padding-bottom: .2mm; }
.dims { width: 100%; border-collapse: collapse; font-size: 8.4pt; margin: 2mm 0; }
.dims th { background: #1e40af; color: #fff; text-align: left; padding: 2mm 2.5mm; font-family: var(--font-poppins), Poppins, sans-serif; font-size: 8pt; }
.dims td { padding: 2mm 2.5mm; border-bottom: .2mm solid #e2e8f0; vertical-align: top; }
.dims tr:nth-child(even) td { background: #f8fafc; }
.dims td:first-child { font-weight: 700; }
.check { list-style: none; padding: 0; margin: 0; }
.check li { display: flex; gap: 3mm; align-items: flex-start; padding: 2mm 0; border-bottom: .2mm solid #e2e8f0; font-size: 9pt; }
.check li .box { flex: none; width: 4.5mm; height: 4.5mm; border: .5mm solid #1e40af; border-radius: 1mm; margin-top: .4mm; }
.check li .t { flex: none; width: 13mm; font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 700; color: #ea580c; font-size: 8.5pt; }
.check .grp { font-family: var(--font-poppins), Poppins, sans-serif; font-weight: 700; color: #1e3a8a; font-size: 10pt; border-bottom: .4mm solid #1e40af; padding-top: 4mm; }
`;

/** Réduit les dimensions pour le format A5 (texte peu réduit, marges plus serrées). */
const scaled = (css: string, kPt: number, kMm: number) =>
  css.replace(/(\d*\.?\d+)(pt|mm)/g, (_, n, u) => `${+(Number(n) * (u === "pt" ? kPt : kMm)).toFixed(2)}${u}`);

/** Préfixe chaque sélecteur par .mdoc pour ne pas toucher au reste du site. */
const scope = (css: string) =>
  css.replace(/([^{}]+)\{/g, (_, sel: string) => sel.split(",").map((s) => `.mdoc ${s.trim()}`).join(", ") + " {");

const A5_EXTRA = `
.page { font-size: 10pt; line-height: 1.5; }
h2 { font-size: 17pt; }
.cover-h { font-size: 28pt; margin-top: 18mm; }
.cover-sub { font-size: 11pt; }
.back-wrap h2 { font-size: 20pt; margin-top: 24mm; }
.kpis { grid-template-columns: 1fr 1fr; }
.kpis b { font-size: 15pt; }
.lcards { grid-template-columns: 1fr 1fr; }
.pcards { grid-template-columns: 1fr; }
.ph { font-size: 7pt; }
`;

export function docCss(format: DocFormat): string {
  const p = PAPER[format];
  const body = format === "A5" ? scaled(BASE, 0.95, 0.72) + A5_EXTRA : BASE;
  return `${scope(body)}\n.mdoc .page { width: ${p.w}mm; height: ${p.h}mm; }`;
}
