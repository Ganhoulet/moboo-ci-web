"use server";

import { submitInquiry } from "@/lib/api";

export type InquiryState = { ok: boolean; message: string } | null;

export async function sendInquiryAction(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  const listingId = String(formData.get("listingId") || "") || undefined;
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const message = String(formData.get("message") || "").trim() || undefined;

  if (!name || phone.replace(/[^0-9]/g, "").length < 8) {
    return { ok: false, message: "Entrez votre nom et un numéro de téléphone valide." };
  }
  try {
    const { ok, data } = await submitInquiry({ listingId, name, phone, message });
    if (!ok) return { ok: false, message: (data && data.message) || "Envoi impossible. Réessayez." };
    return { ok: true, message: "Demande envoyée ! L'annonceur vous recontactera bientôt." };
  } catch {
    return { ok: false, message: "Service indisponible. Réessayez plus tard." };
  }
}

/** Demande de réservation (meublé/événementiel) avec plage de dates. */
export async function requestReservationAction(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  const listingId = String(formData.get("listingId") || "") || undefined;
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const checkIn = String(formData.get("checkIn") || "").trim();
  const checkOut = String(formData.get("checkOut") || "").trim();
  const guests = String(formData.get("guests") || "").trim();

  if (!name || phone.replace(/[^0-9]/g, "").length < 8) {
    return { ok: false, message: "Entrez votre nom et un numéro de téléphone valide." };
  }
  if (!checkIn || !checkOut) {
    return { ok: false, message: "Choisissez vos dates sur le calendrier." };
  }
  const parts = [`Réservation du ${checkIn} au ${checkOut}`];
  if (guests) parts.push(`${guests} personne(s)`);
  try {
    const { ok, data } = await submitInquiry({
      listingId, name, phone, kind: "reservation",
      preferredDate: checkIn, message: parts.join(" · "),
    });
    if (!ok) return { ok: false, message: (data && data.message) || "Envoi impossible. Réessayez." };
    return { ok: true, message: "Demande de réservation envoyée ! L'annonceur confirme la disponibilité et vous recontacte." };
  } catch {
    return { ok: false, message: "Service indisponible. Réessayez plus tard." };
  }
}

/** Demande de visite (avec date souhaitée). */
export async function requestVisitAction(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  const listingId = String(formData.get("listingId") || "") || undefined;
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const preferredDate = String(formData.get("preferredDate") || "").trim() || undefined;

  if (!name || phone.replace(/[^0-9]/g, "").length < 8) {
    return { ok: false, message: "Entrez votre nom et un numéro de téléphone valide." };
  }
  try {
    const { ok, data } = await submitInquiry({
      listingId, name, phone, kind: "visit", preferredDate,
      message: preferredDate ? `Demande de visite pour le ${preferredDate}` : "Demande de visite",
    });
    if (!ok) return { ok: false, message: (data && data.message) || "Envoi impossible. Réessayez." };
    return { ok: true, message: "Demande de visite envoyée ! L'annonceur vous recontactera pour confirmer." };
  } catch {
    return { ok: false, message: "Service indisponible. Réessayez plus tard." };
  }
}
