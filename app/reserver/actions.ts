"use server";

import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";
import "@/lib/client-ip";

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
      headers: { "Content-Type": "application/json", Accept: "application/json", ...relayHeaders(true) },
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
        "Demande envoyée ! L'hôte va confirmer la disponibilité — vous recevrez alors le lien de paiement de l'acompte par WhatsApp/SMS. Suivez-la dans Mon espace → Mes réservations (connexion avec ce numéro).",
    };
  } catch {
    return { ok: false, message: "Service indisponible pour le moment. Réessayez plus tard." };
  }
}

/** Demande de réservation d'un espace événementiel. */
export async function submitEventReservation(
  _prev: ReserveState,
  formData: FormData,
): Promise<ReserveState> {
  const espaceId = String(formData.get("espaceId") || "");
  const payload = {
    guestName: String(formData.get("guestName") || "").trim(),
    guestPhone: String(formData.get("guestPhone") || "").trim(),
    dateDebut: String(formData.get("dateDebut") || ""),
    dateFin: String(formData.get("dateFin") || ""),
    nbInvites: Number(formData.get("nbInvites") || 1),
    typeEvenement: String(formData.get("typeEvenement") || "") || undefined,
    nomEvenement: String(formData.get("nomEvenement") || "") || undefined,
  };
  if (!espaceId || !payload.guestName || !payload.guestPhone || !payload.dateDebut || !payload.dateFin) {
    return { ok: false, message: "Merci de remplir les dates, vos nom et téléphone." };
  }
  try {
    const res = await fetch(
      `${API_URL}/marketplace/espaces/${encodeURIComponent(espaceId)}/reserve`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...relayHeaders(true) },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, message: (data && data.message) || "La demande a échoué. Réessayez." };
    }
    return {
      ok: true,
      message:
        "Demande envoyée ! Le propriétaire va vous recontacter pour confirmer la date et le devis. Suivez-la dans Mon espace → Mes réservations (connexion avec ce numéro).",
    };
  } catch {
    return { ok: false, message: "Service indisponible pour le moment. Réessayez plus tard." };
  }
}

/** Nom et téléphone du compte connecté, pour pré-remplir les formulaires de réservation (fiches en cache). */
export async function myBookingContact(): Promise<{ name: string; phone: string } | null> {
  const { getSession, displayName } = await import("@/lib/session");
  const a = getSession();
  if (!a) return null;
  const name = displayName(a);
  return { name: name === a.phone ? "" : name, phone: a.phone ?? "" };
}
