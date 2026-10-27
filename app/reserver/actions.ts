"use server";

import { authedFetch } from "@/lib/server-api";
import { getSession } from "@/lib/session";
import "@/lib/client-ip";
import { guestPhoneOk, GUEST_PHONE_ERROR } from "@/lib/guest-phone";

export type ReserveState = {
  ok: boolean;
  message: string;
  bookingId?: string;
  /** Compte obligatoire pour réserver (réglage du back-office) : proposer la connexion. */
  loginRequired?: boolean;
} | null;

/** Envoie la demande de réservation au moteur (server-side → pas de souci CORS). */
const LOGIN_MESSAGE = "Connectez-vous pour réserver : vous suivez la réponse de l'hôte et payez l'acompte depuis « Mes réservations ».";
const errMessage = (d: any, fb: string): string => (typeof d?.error?.message === "string" ? d.error.message : typeof d?.message === "string" ? d.message : fb);

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
  // Connecté : le moteur prend le numéro du compte.
  if (!getSession() && !guestPhoneOk(payload.guestPhone)) return { ok: false, message: GUEST_PHONE_ERROR };

  try {
    const { ok, status, data } = await authedFetch("/marketplace/reserve", { method: "POST", body: JSON.stringify(payload) });
    if (status === 401) return { ok: false, loginRequired: true, message: errMessage(data, LOGIN_MESSAGE) };
    if (!ok) {
      return { ok: false, message: errMessage(data, "La demande a échoué. Réessayez.") };
    }
    return {
      ok: true,
      bookingId: data.bookingId,
      message:
        getSession()
          ? "Demande envoyée ! L'hôte va confirmer la disponibilité : vous serez prévenu dans Mon espace, puis vous payez l'acompte depuis Mon espace → Mes réservations."
          : "Demande envoyée ! L'hôte va confirmer la disponibilité — vous recevrez alors sur ce numéro, par WhatsApp ou SMS, le lien pour payer l'acompte. Vous pouvez aussi la suivre dans Mon espace → Mes réservations (connexion avec ce numéro).",
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
  // Connecté : le moteur prend le numéro du compte.
  if (!getSession() && !guestPhoneOk(payload.guestPhone)) return { ok: false, message: GUEST_PHONE_ERROR };
  try {
    const { ok, status, data } = await authedFetch(`/marketplace/espaces/${encodeURIComponent(espaceId)}/reserve`, { method: "POST", body: JSON.stringify(payload) });
    if (status === 401) return { ok: false, loginRequired: true, message: errMessage(data, LOGIN_MESSAGE) };
    if (!ok) {
      return { ok: false, message: errMessage(data, "La demande a échoué. Réessayez.") };
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
