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

export interface SeoTexts { kicker: string; headline: string; text: string; cta: string; contactLabel: string; contactPhone: string; footer: string; bgColor: string; accentColor: string; textColor: string }

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
export function SeoPoster({ d }: { d: Extract<PosterData, { kind: "seo" }> }) {
  const t = d.t;
  const long = t.headline.length > 40;
  return (
    <Sheet bg={t.bgColor}>
      <div style={{ height: "100%", boxSizing: "border-box", padding: `${pt(40)} ${pt(40)} ${pt(30)}`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", color: t.textColor }}>
        {t.kicker.trim() ? (
          <p style={{ margin: 0, background: t.accentColor, color: "#fff", borderRadius: pt(30), padding: `${pt(6)} ${pt(18)}`, fontSize: pt(14), fontWeight: 700, letterSpacing: pt(1.5) }}>{t.kicker}</p>
        ) : null}
        <p style={{ margin: `${pt(16)} 0 0`, fontSize: pt(long ? 38 : 48), fontWeight: 800, lineHeight: 1.08 }}>{t.headline}</p>
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
