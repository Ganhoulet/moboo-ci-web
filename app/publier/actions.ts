"use server";

import { API_URL } from "@/lib/api";

export type SubmitState = { ok: boolean; message: string; id?: string } | null;

/** Dépose une annonce (à louer / à vendre) via le moteur (server-side). */
export async function submitListing(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const transaction = String(formData.get("transaction") || "");
  const photos = String(formData.get("photos") || "")
    .split(/\s*\n\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  const num = (k: string) => {
    const v = formData.get(k);
    return v != null && String(v).trim() !== "" ? Number(v) : undefined;
  };

  // Le site ne publie que le rail « contact direct » (vente / location longue
  // durée). Meublés et espaces se publient depuis Moboo Resi / Moboo Event.
  const payload = {
    transaction,
    propertyType: String(formData.get("propertyType") || "autre"),
    title: String(formData.get("title") || "").trim(),
    price: Number(formData.get("price") || 0),
    priceUnit: transaction === "rent" ? "month" : undefined,
    city: String(formData.get("city") || "").trim(),
    commune: String(formData.get("commune") || "").trim() || undefined,
    quartier: String(formData.get("quartier") || "").trim() || undefined,
    bedrooms: num("bedrooms"),
    surface: num("surface"),
    description: String(formData.get("description") || "").trim() || undefined,
    contactName: String(formData.get("contactName") || "").trim() || undefined,
    contactPhone: String(formData.get("contactPhone") || "").trim(),
    photos,
  };

  if (
    !["rent", "sale"].includes(transaction) ||
    !payload.title ||
    !payload.city ||
    !payload.price ||
    !payload.contactPhone
  ) {
    return {
      ok: false,
      message: "Merci de remplir : type d'offre, titre, ville, prix et téléphone.",
    };
  }

  try {
    const res = await fetch(`${API_URL}/marketplace/properties/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, message: (data && data.message) || "La publication a échoué. Réessayez." };
    }
    return {
      ok: true,
      id: data.id,
      message: "Votre annonce est publiée ! Elle apparaît maintenant dans le catalogue.",
    };
  } catch {
    return { ok: false, message: "Service indisponible pour le moment. Réessayez plus tard." };
  }
}
