/** Fichier choisi dans le navigateur → data URI (images réduites à `max` px en JPEG ; PDF tel quel, 5 Mo max). */
export async function fileToDataUri(file: File, max = 1600): Promise<string> {
  if (file.type === "application/pdf") {
    if (file.size > 5 * 1024 * 1024) throw new Error("PDF trop lourd (5 Mo maximum).");
    return await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file); });
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  } finally { URL.revokeObjectURL(url); }
}
