import { ImageResponse } from "next/og";

// Image de partage par défaut (accueil et pages sans photo) ; les fiches utilisent leur première photo.
export const alt = "Moboo.ci : louer, acheter et réserver en Côte d’Ivoire";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 90, background: "#1e40af", color: "#ffffff" }}>
        <div style={{ fontSize: 110, fontWeight: 800 }}>Moboo.ci</div>
        <div style={{ fontSize: 48, marginTop: 24 }}>Louer, acheter et réserver en Côte d’Ivoire</div>
      </div>
    ),
    size,
  );
}
