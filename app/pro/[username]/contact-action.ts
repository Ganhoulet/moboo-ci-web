"use server";

import { submitInquiry } from "@/lib/api";
import { getAccessToken, getSession } from "@/lib/session";

export type ProInquiryState = { ok: boolean; message: string; link?: { href: string; label: string } } | null;

/** Demande envoyée depuis la page d'un pro (sans annonce) : e-mail / WhatsApp au pro + fil « Messages ». */
export async function sendProInquiryAction(_prev: ProInquiryState, formData: FormData): Promise<ProInquiryState> {
  const toUsername = String(formData.get("toUsername") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!toUsername) return { ok: false, message: "Professionnel introuvable." };
  if (!name || phone.replace(/[^0-9]/g, "").length < 8) return { ok: false, message: "Entrez votre nom et un numéro de téléphone valide." };
  const loggedIn = !!getSession();
  try {
    const { ok, data } = await submitInquiry({
      toUsername, name, phone,
      email: String(formData.get("email") || "").trim() || undefined,
      message: String(formData.get("message") || "").trim() || undefined,
      userType: String(formData.get("userType") || "") || undefined,
    }, loggedIn ? getAccessToken() : null);
    if (!ok) return { ok: false, message: (data && (data.error?.message || data.message)) || "Envoi impossible. Réessayez." };
    if (data?.conversationId && loggedIn) return { ok: true, message: "Le professionnel est prévenu. Sa réponse arrivera dans vos messages.", link: { href: `/mon-espace/messages/${data.conversationId}`, label: "Voir la conversation" } };
    return { ok: true, message: "Le professionnel est prévenu et va vous recontacter." };
  } catch {
    return { ok: false, message: "Service indisponible. Réessayez plus tard." };
  }
}
