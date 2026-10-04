import QRCode from "qrcode";

/**
 * QR code en SVG, noir sur blanc, sans marge : comme le QrPainter de
 * l'application Moboo.ci (niveau de correction L par défaut) — même motif.
 */
export function qrSvg(url: string) {
  return QRCode.toString(url || "https://moboo.ci", { type: "svg", margin: 0, errorCorrectionLevel: "L", color: { dark: "#000000", light: "#ffffff" } });
}
