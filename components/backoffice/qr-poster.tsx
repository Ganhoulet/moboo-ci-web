/* eslint-disable @next/next/no-img-element */
/**
 * Affiches QR — reproduction à l'identique des PDF de l'application Moboo.ci
 * (lib/qr_property_widget.dart) : mêmes textes, couleurs, proportions et QR code.
 * Les mesures sont celles du PDF (points sur une page A4 de 595 pt de large) et
 * s'adaptent au format choisi grâce à --u (mm par point) : A3, A4 ou A5.
 */
import type { CSSProperties } from "react";

export type PaperFormat = "A3" | "A4" | "A5";
export const PAPER: Record<PaperFormat, { w: number; h: number; label: string }> = {
  A3: { w: 297, h: 420, label: "A3 (29,7 × 42 cm) — vitrine, mur" },
  A4: { w: 210, h: 297, label: "A4 (21 × 29,7 cm) — comptoir, porte" },
  A5: { w: 148, h: 210, label: "A5 (14,8 × 21 cm) — chevalet, bureau" },
};

/** Taille en points du PDF de l'application → longueur CSS au format choisi. */
const pt = (n: number) => `calc(var(--u) * ${n}mm)`;
const FONT = "Helvetica, Arial, sans-serif"; // police par défaut du PDF de l'application
/** Affiches de rue : police grasse et ronde (lisible de loin), repli Arial Black. */
const FONT_BOLD = "'Nunito', 'Arial Rounded MT Bold', 'Arial Black', Helvetica, Arial, sans-serif";

export interface SeoTexts { template?: string; kicker: string; headline: string; text: string; cta: string; contactLabel: string; contactPhone: string; footer: string; bgColor: string; accentColor: string; textColor: string }

export type PosterData =
  | { kind: "agent" | "agency"; title: string; phone: string; url: string; qrSvg: string }
  | { kind: "listing"; title: string; price: string; url: string; qrSvg: string }
  | { kind: "seo"; t: SeoTexts; url: string; qrSvg: string };

export function Sheet({ children, bg = "#ffffff" }: { children: React.ReactNode; bg?: string }) {
  return (
    <section className="qr-sheet" style={{ background: bg, fontFamily: FONT }}>
      {children}
    </section>
  );
}

function Qr({ svg, size, style }: { svg: string; size: number; style?: CSSProperties }) {
  return <div style={{ width: pt(size), height: pt(size), ...style }} className="qr-box" dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Affiche agent / agence : fond bleu, « SCANNEZ » en orange, QR, nom, téléphone, logo Moboo.ci. */
export function RealtorPoster({ d }: { d: Extract<PosterData, { kind: "agent" | "agency" }> }) {
  const header = d.kind === "agency" ? "SCANNEZ ET TROUVEZ NOS ANNONCES" : "SCANNEZ ET TROUVEZ MES ANNONCES";
  const i = header.indexOf(" ");
  return (
    <Sheet bg="#0555CC">
      <div style={{ height: "100%", boxSizing: "border-box", padding: `${pt(50)} ${pt(40)} ${pt(36)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", color: "#fff" }}>
        <p style={{ margin: 0, textAlign: "center", fontSize: pt(40), fontWeight: 700, lineHeight: 1.25 }}>
          <span style={{ color: "#FE6600" }}>{header.slice(0, i)}</span>{header.slice(i)}
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Qr svg={d.qrSvg} size={460} style={{ background: "#fff", borderRadius: pt(18), padding: pt(16), boxSizing: "border-box" }} />
          {d.title.trim() ? <p style={{ margin: `${pt(18)} 0 0`, fontSize: pt(28), fontWeight: 700, textAlign: "center" }}>{d.title}</p> : null}
          {d.phone.trim() ? (
            <p style={{ margin: `${pt(18)} 0 0`, background: "#FE6600", borderRadius: pt(12), padding: `${pt(14)} ${pt(36)}`, fontSize: pt(36), fontWeight: 700, whiteSpace: "nowrap" }}>{d.phone}</p>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: pt(10) }}>
          <img src="/qr/moboo-icon.png" alt="" style={{ width: pt(40), height: pt(40), objectFit: "contain" }} />
          <span style={{ fontSize: pt(24), fontWeight: 700 }}>Moboo.ci</span>
        </div>
      </div>
    </Sheet>
  );
}

/** Fiche annonce : bandeau noir (titre), prix encadré, QR, « SCANNEZ POUR VOIR L'ANNONCE », MOBOO.CI. */
export function ListingPoster({ d }: { d: Extract<PosterData, { kind: "listing" }> }) {
  // Mise en page adaptative de l'application selon la longueur du titre.
  const n = d.title.trim().length;
  const veryLong = n > 80, long = n > 50, medium = n > 25;
  const titleSize = veryLong ? 22 : long ? 28 : medium ? 36 : 48;
  const priceSize = veryLong ? 36 : long ? 44 : medium ? 52 : 60;
  const qrSize = veryLong ? 260 : long ? 300 : 360;
  const headPad = veryLong ? 14 : long ? 18 : 24;
  const gapHead = veryLong ? 10 : long ? 14 : 20;
  const gapDiv = veryLong ? 12 : long ? 18 : 24;
  const rule = <div style={{ width: "100%", height: pt(3), background: "#000" }} />;
  return (
    <Sheet>
      <div style={{ height: "100%", boxSizing: "border-box", padding: `${pt(32)} ${pt(40)}`, display: "flex", flexDirection: "column", alignItems: "center", color: "#000" }}>
        <div style={{ width: "100%", background: "#000", color: "#fff", padding: `${pt(headPad)} ${pt(20)}`, boxSizing: "border-box" }}>
          <p style={{ margin: 0, textAlign: "center", fontSize: pt(titleSize), fontWeight: 700, lineHeight: 1.2, display: "-webkit-box", WebkitLineClamp: veryLong ? 5 : long ? 4 : 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{d.title}</p>
        </div>
        {d.price.trim() ? (
          <div style={{ width: "100%", marginTop: pt(gapHead), border: `${pt(4)} solid #000`, padding: `${pt(long ? 12 : 16)} ${pt(24)}`, boxSizing: "border-box" }}>
            <p style={{ margin: 0, textAlign: "center", fontSize: pt(priceSize), fontWeight: 700, lineHeight: 1.15 }}>{d.price}</p>
          </div>
        ) : null}
        <div style={{ height: pt(gapDiv) }} />
        {rule}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <Qr svg={d.qrSvg} size={qrSize} style={{ background: "#fff", border: `${pt(4)} solid #000`, padding: pt(12), boxSizing: "border-box" }} />
        </div>
        <p style={{ margin: `${pt(long ? 8 : 14)} 0 0`, fontSize: pt(long ? 16 : 20), fontWeight: 700, letterSpacing: pt(1.5), textAlign: "center" }}>SCANNEZ POUR VOIR L&apos;ANNONCE</p>
        <p style={{ margin: `${pt(4)} 0 0`, fontSize: pt(10), color: "#616161", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", maxWidth: "100%" }}>{d.url}</p>
        <div style={{ height: pt(long ? 14 : 22) }} />
        {rule}
        <p style={{ margin: `${pt(10)} 0 0`, fontSize: pt(long ? 18 : 22), fontWeight: 700, letterSpacing: pt(3), textAlign: "center" }}>MOBOO.CI</p>
      </div>
    </Sheet>
  );
}

/**
 * Affiche de rue d'une page SEO (« Maisons à louer à Yopougon ») : texte en haut,
 * QR code au centre, contact Moboo en bas. Tous les textes et couleurs sont modifiables.
 */
/** Modèles d'affiche de rue des pages SEO (choix dans le builder ou le modèle par défaut). */
export const SEO_TEMPLATES: { v: string; l: string; d: string; preset: Partial<SeoTexts> }[] = [
  { v: "rue", l: "Affiche de rue", d: "Fond bleu, titre en gras, numéro dans un cadre rouge",
    preset: { kicker: "", text: "", cta: "", contactLabel: "ou appelez", footer: "Moboo.ci", bgColor: "#2F4FD8", accentColor: "#E8553D", textColor: "#FFFFFF" } },
  { v: "classique", l: "Classique", d: "Petit titre, cadre orange, encart contact blanc",
    preset: { kicker: "NOUVEAU SUR MOBOO.CI", cta: "SCANNEZ-MOI", contactLabel: "Besoin d’aide pour trouver ? Appelez Moboo", footer: "www.moboo.ci", bgColor: "#0555CC", accentColor: "#FE6600", textColor: "#FFFFFF" } },
  { v: "clair", l: "Clair", d: "Fond blanc : économise l’encre, lisible de loin",
    preset: { kicker: "", text: "", cta: "", contactLabel: "ou appelez", footer: "Moboo.ci", bgColor: "#1E2F8F", accentColor: "#E8553D", textColor: "#0F172A" } },
  { v: "bandeau", l: "Bandeau", d: "Titre sur un bandeau de couleur, bas blanc",
    preset: { kicker: "", cta: "", contactLabel: "Appelez-nous", footer: "Moboo.ci", bgColor: "#0555CC", accentColor: "#FE6600", textColor: "#FFFFFF" } },
];

/** Assombrit (#RRGGBB, amount < 0) ou éclaircit une couleur. */
function shade(hex: string, amount: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amount / 100) * 255)));
  return `#${[ch(n >> 16), ch((n >> 8) & 255), ch(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Titre : mots entre *étoiles* en couleur ; sans étoiles, le premier mot si autoFirst. */
function Rich({ text, accent, autoFirst }: { text: string; accent: string; autoFirst?: boolean }) {
  const t = text.trim();
  if (!t.includes("*")) {
    if (!autoFirst) return <>{t}</>;
    const i = t.search(/\s/);
    return i < 0 ? <span style={{ color: accent }}>{t}</span> : <><span style={{ color: accent }}>{t.slice(0, i)}</span>{t.slice(i)}</>;
  }
  return <>{t.split(/(\*[^*]+\*)/).map((part, i) => (/^\*[^*]+\*$/.test(part) ? <span key={i} style={{ color: accent }}>{part.slice(1, -1)}</span> : <span key={i}>{part}</span>))}</>;
}

const plain = (s: string) => s.replace(/\*/g, "");
const titleSize = (s: string, big: number) => { const n = plain(s).length; return n > 70 ? big * 0.66 : n > 52 ? big * 0.76 : n > 38 ? big * 0.88 : big; };

/** Symbole Moboo (trois anneaux), en tracé : blanc sur fond foncé, couleur du texte sinon. */
function MobooMark({ size, color }: { size: number; color: string }) {
  return (
    <svg viewBox="0 0 100 92" style={{ width: pt(size), height: pt(size * 0.92) }} aria-hidden="true">
      {[[50, 28], [27, 64], [73, 64]].map(([cx, cy]) => <circle key={`${cx}`} cx={cx} cy={cy} r={19} fill="none" stroke={color} strokeWidth={11} />)}
    </svg>
  );
}

function Logo({ footer, size = 28 }: { footer: string; white?: boolean; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: pt(10) }}>
      <MobooMark size={size * 1.35} color="currentColor" />
      <span style={{ fontSize: pt(size), fontWeight: 900, letterSpacing: pt(0.3) }}>{footer || "Moboo.ci"}</span>
    </div>
  );
}

function PhonePill({ phone, bg, size = 44 }: { phone: string; bg: string; size?: number }) {
  return (
    <p style={{ margin: 0, background: bg, color: "#fff", borderRadius: pt(14), padding: `${pt(6)} ${pt(22)}`, fontSize: pt(size), fontWeight: 900, letterSpacing: pt(1), whiteSpace: "nowrap", lineHeight: 1.15 }}>{phone}</p>
  );
}

/** Affiche de rue (comme celles posées à Yopougon) : fond bleu, titre gras, QR, « ou appelez », numéro en rouge, logo. */
function SeoStreetPoster({ d }: { d: Extract<PosterData, { kind: "seo" }> }) {
  const t = d.t;
  return (
    <Sheet bg={t.bgColor}>
      <div style={{ height: "100%", boxSizing: "border-box", padding: `${pt(46)} ${pt(38)} ${pt(30)}`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", color: t.textColor, fontFamily: FONT_BOLD,
        background: `radial-gradient(ellipse at 50% 35%, ${shade(t.bgColor, 8)} 0%, ${t.bgColor} 45%, ${shade(t.bgColor, -16)} 100%)` }}>
        {t.kicker.trim() ? <p style={{ margin: `0 0 ${pt(10)}`, fontSize: pt(16), fontWeight: 800, letterSpacing: pt(2), opacity: 0.9 }}>{t.kicker}</p> : null}
        <p style={{ margin: 0, fontSize: pt(titleSize(t.headline, 66)), fontWeight: 900, lineHeight: 1.04 }}><Rich text={t.headline} accent={t.accentColor} autoFirst /></p>
        {t.text.trim() ? <p style={{ margin: `${pt(12)} 0 0`, fontSize: pt(17), lineHeight: 1.3, fontWeight: 600, opacity: 0.95, maxWidth: pt(480) }}>{t.text}</p> : null}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: `${pt(18)} 0` }}>
          <div style={{ background: "#fff", borderRadius: pt(24), padding: pt(22) }}><Qr svg={d.qrSvg} size={320} /></div>
        </div>
        {t.cta.trim() ? <p style={{ margin: `0 0 ${pt(6)}`, fontSize: pt(26), fontWeight: 900, color: t.accentColor }}>{t.cta}</p> : null}
        {t.contactLabel.trim() ? <p style={{ margin: `0 0 ${pt(10)}`, fontSize: pt(38), fontWeight: 900 }}>{t.contactLabel}</p> : null}
        {t.contactPhone.trim() ? <PhonePill phone={t.contactPhone} bg={t.accentColor} size={46} /> : null}
        <div style={{ marginTop: pt(18) }}><Logo footer={t.footer} white /></div>
      </div>
    </Sheet>
  );
}

/** Clair : fond blanc, titre bleu foncé, QR encadré, numéro dans un cadre de couleur (économise l'encre). */
function SeoLightPoster({ d }: { d: Extract<PosterData, { kind: "seo" }> }) {
  const t = d.t;
  return (
    <Sheet bg="#ffffff">
      <div style={{ height: "100%", boxSizing: "border-box", padding: `${pt(46)} ${pt(38)} ${pt(30)}`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", color: t.textColor, fontFamily: FONT_BOLD, borderTop: `${pt(14)} solid ${t.bgColor}`, borderBottom: `${pt(14)} solid ${t.bgColor}` }}>
        {t.kicker.trim() ? <p style={{ margin: `0 0 ${pt(10)}`, fontSize: pt(16), fontWeight: 800, letterSpacing: pt(2), color: t.accentColor }}>{t.kicker}</p> : null}
        <p style={{ margin: 0, fontSize: pt(titleSize(t.headline, 62)), fontWeight: 900, lineHeight: 1.04, color: t.bgColor }}><Rich text={t.headline} accent={t.accentColor} autoFirst /></p>
        {t.text.trim() ? <p style={{ margin: `${pt(12)} 0 0`, fontSize: pt(17), lineHeight: 1.3, fontWeight: 600, maxWidth: pt(480) }}>{t.text}</p> : null}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: `${pt(18)} 0` }}>
          <div style={{ background: "#fff", borderRadius: pt(22), padding: pt(18), border: `${pt(6)} solid ${t.bgColor}` }}><Qr svg={d.qrSvg} size={310} /></div>
        </div>
        {t.cta.trim() ? <p style={{ margin: `0 0 ${pt(6)}`, fontSize: pt(26), fontWeight: 900, color: t.accentColor }}>{t.cta}</p> : null}
        {t.contactLabel.trim() ? <p style={{ margin: `0 0 ${pt(10)}`, fontSize: pt(36), fontWeight: 900, color: t.bgColor }}>{t.contactLabel}</p> : null}
        {t.contactPhone.trim() ? <PhonePill phone={t.contactPhone} bg={t.accentColor} size={46} /> : null}
        <div style={{ marginTop: pt(18), color: t.bgColor }}><Logo footer={t.footer} /></div>
      </div>
    </Sheet>
  );
}

/** Bandeau : titre sur un bandeau de couleur en haut, QR et numéro sur fond blanc. */
function SeoBandPoster({ d }: { d: Extract<PosterData, { kind: "seo" }> }) {
  const t = d.t;
  return (
    <Sheet bg="#ffffff">
      <div style={{ height: "100%", display: "flex", flexDirection: "column", textAlign: "center", fontFamily: FONT_BOLD }}>
        <div style={{ background: `linear-gradient(160deg, ${t.bgColor}, ${shade(t.bgColor, -14)})`, color: t.textColor, padding: `${pt(42)} ${pt(36)} ${pt(34)}`, borderBottom: `${pt(10)} solid ${t.accentColor}` }}>
          {t.kicker.trim() ? <p style={{ margin: `0 0 ${pt(10)}`, fontSize: pt(16), fontWeight: 800, letterSpacing: pt(2), opacity: 0.9 }}>{t.kicker}</p> : null}
          <p style={{ margin: 0, fontSize: pt(titleSize(t.headline, 50)), fontWeight: 900, lineHeight: 1.06 }}><Rich text={t.headline} accent={t.accentColor} autoFirst /></p>
          {t.text.trim() ? <p style={{ margin: `${pt(10)} 0 0`, fontSize: pt(16), lineHeight: 1.3, fontWeight: 600, opacity: 0.95 }}>{t.text}</p> : null}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-evenly", padding: `${pt(20)} ${pt(36)} ${pt(26)}`, color: "#0f172a" }}>
          <div style={{ background: "#fff", borderRadius: pt(20), padding: pt(16), boxShadow: `0 0 0 ${pt(5)} ${t.bgColor}` }}><Qr svg={d.qrSvg} size={260} /></div>
          {t.cta.trim() ? <p style={{ margin: 0, fontSize: pt(24), fontWeight: 900, color: t.accentColor }}>{t.cta}</p> : null}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: pt(8) }}>
            {t.contactLabel.trim() ? <p style={{ margin: 0, fontSize: pt(30), fontWeight: 900, color: t.bgColor }}>{t.contactLabel}</p> : null}
            {t.contactPhone.trim() ? <PhonePill phone={t.contactPhone} bg={t.accentColor} size={42} /> : null}
          </div>
          <div style={{ color: t.bgColor }}><Logo footer={t.footer} /></div>
        </div>
      </div>
    </Sheet>
  );
}

export function SeoPoster({ d }: { d: Extract<PosterData, { kind: "seo" }> }) {
  const tpl = d.t.template || "classique";
  if (tpl === "rue") return <SeoStreetPoster d={d} />;
  if (tpl === "clair") return <SeoLightPoster d={d} />;
  if (tpl === "bandeau") return <SeoBandPoster d={d} />;
  return <SeoClassicPoster d={d} />;
}

/** Classique (premier modèle) : petit titre, cadre orange, encart contact blanc. */
function SeoClassicPoster({ d }: { d: Extract<PosterData, { kind: "seo" }> }) {
  const t = d.t;
  const long = t.headline.length > 40;
  return (
    <Sheet bg={t.bgColor}>
      <div style={{ height: "100%", boxSizing: "border-box", padding: `${pt(40)} ${pt(40)} ${pt(30)}`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", color: t.textColor }}>
        {t.kicker.trim() ? (
          <p style={{ margin: 0, background: t.accentColor, color: "#fff", borderRadius: pt(30), padding: `${pt(6)} ${pt(18)}`, fontSize: pt(14), fontWeight: 700, letterSpacing: pt(1.5) }}>{t.kicker}</p>
        ) : null}
        <p style={{ margin: `${pt(16)} 0 0`, fontSize: pt(long ? 38 : 48), fontWeight: 800, lineHeight: 1.08 }}><Rich text={t.headline} accent={t.accentColor} /></p>
        {t.text.trim() ? <p style={{ margin: `${pt(12)} 0 0`, fontSize: pt(16), lineHeight: 1.35, opacity: 0.95, maxWidth: pt(470) }}>{t.text}</p> : null}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <div style={{ background: "#fff", borderRadius: pt(22), padding: pt(16), border: `${pt(6)} solid ${t.accentColor}` }}>
            <Qr svg={d.qrSvg} size={long ? 280 : 300} />
          </div>
          {t.cta.trim() ? <p style={{ margin: `${pt(12)} 0 0`, color: t.accentColor === t.bgColor ? t.textColor : t.accentColor, fontSize: pt(30), fontWeight: 900, letterSpacing: pt(2) }}>{t.cta}</p> : null}
        </div>
        {t.contactPhone.trim() || t.contactLabel.trim() ? (
          <div style={{ width: "100%", background: "#fff", color: "#0f172a", borderRadius: pt(16), padding: `${pt(12)} ${pt(16)}`, boxSizing: "border-box" }}>
            {t.contactLabel.trim() ? <p style={{ margin: 0, fontSize: pt(15), fontWeight: 700 }}>{t.contactLabel}</p> : null}
            {t.contactPhone.trim() ? <p style={{ margin: `${pt(2)} 0 0`, fontSize: pt(34), fontWeight: 900, color: t.bgColor, whiteSpace: "nowrap" }}>☎ {t.contactPhone}</p> : null}
          </div>
        ) : null}
        <div style={{ marginTop: pt(14), display: "flex", alignItems: "center", gap: pt(8) }}>
          <img src="/qr/moboo-icon.png" alt="" style={{ width: pt(30), height: pt(30), objectFit: "contain" }} />
          <span style={{ fontSize: pt(20), fontWeight: 700 }}>{t.footer || "Moboo.ci"}</span>
        </div>
      </div>
    </Sheet>
  );
}

export function Poster({ d }: { d: PosterData }) {
  return d.kind === "listing" ? <ListingPoster d={d} /> : d.kind === "seo" ? <SeoPoster d={d} /> : <RealtorPoster d={d} />;
}
