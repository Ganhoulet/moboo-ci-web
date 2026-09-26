"use server";

import { API_URL } from "@/lib/api";

export type ReserveState = {
  ok: boolean;
  message: string;
  bookingId?: string;
} | null;

/** Envoie la demande de réservation au moteur (server-side → pas de souci CORS). */
export async function submitReservation(
  _prev: ReserveState,
  formData: FormData,
): Promise<ReserveState> {
  const payload = {
    apartmentId: String(formData.get("apartmentId") || ""),
    guestName: String(formData.get("guestName") || "").trim(),
    guestPhone: String(formData.get("guestPhone") || "").trim(),
    checkIn: String(formData.get("checkIn") || ""),
    checkOut: String(formData.get("checkOut") || "") || undefined,
    personsCount: Number(formData.get("personsCount") || 1),
  };

  if (!payload.apartmentId || !payload.guestName || !payload.guestPhone || !payload.checkIn) {
    return { ok: false, message: "Merci de remplir le logement, vos nom et téléphone, et la date d'arrivée." };
  }

  try {
    const res = await fetch(`${API_URL}/marketplace/reserve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, message: (data && data.message) || "La demande a échoué. Réessayez." };
    }
    return {
      ok: true,
      bookingId: data.bookingId,
      message:
        "Demande envoyée ! L'hôte va confirmer la disponibilité — vous recevrez alors le lien de paiement de l'acompte par WhatsApp/SMS.",
    };
  } catch {
    return { ok: false, message: "Service indisponible pour le moment. Réessayez plus tard." };
  }
}
