"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { getSession, setProfile } from "@/lib/session";
import { siteRequestOtp } from "@/lib/api";
import type { Property } from "@/lib/property";
import type { Invoice } from "@/app/admin/immobilier/actions";

const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;

/* ─── Mes annonces ─────────────────────────────────────────────────────── */

export interface MyListing {
  id: string;
  title: string;
  transaction: "rent" | "sale";
  propertyType: string;
  price: number;
  city: string;
  commune: string | null;
  status: string;
  views: number;
  inquiries: number;
  callClicks: number;
  whatsappClicks: number;
  photo: string | null;
  photoCount: number;
  featured?: boolean;
  awaitingPayment?: boolean;
  moderation?: "pending" | "approved" | "rejected" | "changes" | "suspended";
  moderationNote?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MyListings {
  totalListings: number;
  activeListings: number;
  totalViews: number;
  totalCalls: number;
  totalWhatsapp: number;
  totalInquiries: number;
  items: MyListing[];
}

export async function listMyListings(): Promise<MyListings | null> {
  if (!getSession()) return null;
  const { ok, data } = await authedFetch("/site/me/listings", { method: "GET" });
  return ok ? (data as MyListings) : null;
}

export async function getMyListing(id: string): Promise<Record<string, any> | null> {
  if (!getSession()) return null;
  const { ok, data } = await authedFetch(`/site/me/listings/${encodeURIComponent(id)}`, { method: "GET" });
  return ok ? data : null;
}

export type SaveResult = { ok: boolean; id?: string; error?: string; paymentUrl?: string | null };

/** Création (id absent) ou modification d'une annonce. */
export async function saveListingAction(id: string | null, payload: Record<string, any>): Promise<SaveResult> {
  if (!getSession()) return { ok: false, error: "Connectez-vous d'abord." };
  const { ok, data } = await authedFetch(id ? `/site/me/listings/${encodeURIComponent(id)}` : "/site/me/listings", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
  if (!ok) return { ok: false, error: errMsg(data, "Enregistrement impossible. Réessayez.") };
  revalidatePath("/mon-espace", "layout");
  // Publication payante : paiement Money Fusion (ou facture réglée d'office si gratuit).
  const pay = data?.payment;
  if (pay && !pay.paid) return { ok: true, id: data?.id, paymentUrl: pay.paymentUrl ?? `/mon-espace/annonces?facture=${pay.invoiceId}` };
  return { ok: true, id: data?.id ?? id ?? undefined };
}

/** Payer la publication d'une annonce en attente (mode « payante à l'annonce »). */
export async function payListingAction(id: string): Promise<{ ok: boolean; paymentUrl?: string | null; error?: string }> {
  const { ok, data } = await authedFetch(`/site/me/listings/${encodeURIComponent(id)}/pay`, { method: "POST" });
  if (!ok) return { ok: false, error: errMsg(data, "Paiement impossible pour le moment.") };
  revalidatePath("/mon-espace", "layout");
  return { ok: true, paymentUrl: data.paid ? null : data.paymentUrl ?? `/mon-espace/annonces?facture=${data.invoiceId}` };
}

export async function setListingStatusAction(id: string, status: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch(`/site/me/listings/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
  revalidatePath("/mon-espace", "layout");
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Action impossible.") };
}

/** Mettre en vedette (crédit du forfait) ou retirer. */
export async function featureListingAction(id: string, on: boolean, pay = false): Promise<{ ok: boolean; error?: string; paymentUrl?: string | null }> {
  const { ok, data } = await authedFetch(`/site/me/listings/${encodeURIComponent(id)}/feature`, { method: "POST", body: JSON.stringify({ on, pay }) });
  revalidatePath("/", "layout");
  if (!ok) return { ok: false, error: errMsg(data, "Action impossible.") };
  const p = data?.payment;
  return { ok: true, paymentUrl: p && !p.paid ? p.paymentUrl ?? `/mon-espace/annonces?facture=${p.invoiceId}` : null };
}

/* ─── Forfait et factures ──────────────────────────────────────────────── */

export interface MySubscription {
  enabled: boolean; submissionMode: "free" | "membership" | "per_listing"; requirePackage: boolean; freeListings: number;
  listingPrice: number; featuredPrice: number; limit: number; used: number; remaining: number;
  subscription: { id: string; packageName: string; listings: number; featured: number; featuredUsed: number; featuredLeft: number; startsAt: string; endsAt: string } | null;
}

export async function getMySubscription(): Promise<MySubscription | null> {
  if (!getSession()) return null;
  const { ok, data } = await authedFetch("/site/me/subscription", { method: "GET" });
  return ok ? data : null;
}

export async function listMyInvoices(): Promise<Invoice[]> {
  if (!getSession()) return [];
  const { ok, data } = await authedFetch("/site/me/invoices", { method: "GET" });
  return ok && Array.isArray(data?.items) ? data.items : [];
}

export async function getMyInvoice(id: string): Promise<Invoice | null> {
  if (!getSession()) return null;
  const { ok, data } = await authedFetch(`/site/me/invoices/${encodeURIComponent(id)}`, { method: "GET" });
  return ok ? data : null;
}

/** Achat d'un forfait : lien de paiement Money Fusion (ou activation immédiate si gratuit). */
export async function checkoutPackageAction(packageId: string): Promise<{ ok: boolean; paymentUrl?: string | null; invoiceId?: string; paid?: boolean; error?: string }> {
  if (!getSession()) return { ok: false, error: "Connectez-vous d'abord." };
  const { ok, data } = await authedFetch(`/site/me/packages/${encodeURIComponent(packageId)}/checkout`, { method: "POST" });
  if (!ok) return { ok: false, error: errMsg(data, "Paiement impossible pour le moment.") };
  revalidatePath("/mon-espace", "layout");
  return { ok: true, paymentUrl: data.paymentUrl, invoiceId: data.invoiceId, paid: data.paid };
}

export async function duplicateListingAction(id: string): Promise<void> {
  await authedFetch(`/site/me/listings/${encodeURIComponent(id)}/duplicate`, { method: "POST" });
  revalidatePath("/mon-espace", "layout");
}

export async function deleteListingAction(id: string): Promise<void> {
  await authedFetch(`/site/me/listings/${encodeURIComponent(id)}`, { method: "DELETE" });
  revalidatePath("/mon-espace", "layout");
}

/** Image compressée côté navigateur (data URI) → URL publique du stockage Moboo. */
export async function uploadImageAction(image: string, kind: "annonce" | "avatar" = "annonce"): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!getSession()) return { ok: false, error: "Connectez-vous d'abord." };
  const { ok, data } = await authedFetch("/site/me/uploads", { method: "POST", body: JSON.stringify({ image, kind }) });
  return ok && data?.url ? { ok: true, url: data.url } : { ok: false, error: errMsg(data, "Envoi de la photo impossible.") };
}

/* ─── Statistiques ─────────────────────────────────────────────────────── */

export interface StatPoint { day: string; views: number; inquiries: number; calls: number; whatsapp: number }

export interface Stats {
  days: number;
  totals: { views: number; inquiries: number; calls: number; whatsapp: number };
  series: StatPoint[];
  top: {
    id: string; title: string; status: string; totalViews: number; totalCalls: number; totalWhatsapp: number;
    views: number; inquiries: number; calls: number; whatsapp: number;
  }[];
}

export async function getStats(days = 30): Promise<Stats | null> {
  if (!getSession()) return null;
  const { ok, data } = await authedFetch(`/site/me/stats?days=${days}`, { method: "GET" });
  return ok ? (data as Stats) : null;
}

/* ─── Demandes (suivi) ─────────────────────────────────────────────────── */

export interface Inquiry {
  id: string;
  listingId: string | null;
  listingTitle: string | null;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  kind: string;
  preferredDate: string | null;
  status: string;
  note: string | null;
  createdAt: string;
}

export async function listMyInquiries(): Promise<Inquiry[]> {
  if (!getSession()) return [];
  const { ok, data } = await authedFetch("/site/me/inquiries", { method: "GET" });
  return ok && Array.isArray(data?.items) ? (data.items as Inquiry[]) : [];
}

export async function updateInquiryAction(id: string, patch: { status?: string; note?: string }): Promise<{ ok: boolean }> {
  const { ok } = await authedFetch(`/site/me/inquiries/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) });
  if (ok) revalidatePath("/mon-espace", "layout");
  return { ok };
}

/* ─── Messages ─────────────────────────────────────────────────────────── */

export interface ConversationSummary {
  id: string;
  role: "owner" | "client";
  listingId: string | null;
  listingTitle: string | null;
  listingPhoto: string | null;
  counterpart: { name: string; avatarUrl: string | null };
  lastMessage: string | null;
  lastMessageAt: string;
  unread: number;
}

export interface ChatMessage { id: string; mine: boolean; body: string; createdAt: string }

export interface Conversation {
  id: string;
  role: "owner" | "client";
  listingId: string | null;
  listingTitle: string | null;
  listingPhoto: string | null;
  inquiryId: string | null;
  counterpart: { name: string; avatarUrl: string | null; phone?: string; username?: string | null };
  messages: ChatMessage[];
}

export async function listConversations(): Promise<ConversationSummary[]> {
  if (!getSession()) return [];
  const { ok, data } = await authedFetch("/site/me/conversations", { method: "GET" });
  return ok && Array.isArray(data?.items) ? (data.items as ConversationSummary[]) : [];
}

export async function unreadMessages(): Promise<number> {
  if (!getSession()) return 0;
  const { ok, data } = await authedFetch("/site/me/conversations/unread", { method: "GET" });
  return ok ? Number(data?.count) || 0 : 0;
}

export async function getConversation(id: string): Promise<Conversation | null> {
  if (!getSession()) return null;
  const { ok, data } = await authedFetch(`/site/me/conversations/${encodeURIComponent(id)}`, { method: "GET" });
  return ok ? (data as Conversation) : null;
}

/** Recharge le fil (sondage périodique de la page ouverte). */
export async function refreshConversationAction(id: string): Promise<ChatMessage[] | null> {
  return (await getConversation(id))?.messages ?? null;
}

export async function sendMessageAction(id: string, body: string): Promise<{ ok: boolean; message?: ChatMessage; error?: string }> {
  if (!getSession()) return { ok: false, error: "Connectez-vous d'abord." };
  const { ok, data } = await authedFetch(`/site/me/conversations/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  if (!ok) return { ok: false, error: errMsg(data, "Envoi impossible. Réessayez.") };
  revalidatePath("/mon-espace/messages");
  return { ok: true, message: data as ChatMessage };
}

/** Annonceur : ouvre (ou retrouve) le fil d'une demande reçue. */
export async function openInquiryConversationAction(inquiryId: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { ok, data } = await authedFetch(`/site/me/conversations/from-inquiry/${encodeURIComponent(inquiryId)}`, { method: "POST" });
  return ok && data?.id ? { ok: true, id: data.id } : { ok: false, error: errMsg(data, "Conversation indisponible pour cette demande.") };
}

/* ─── Favoris ──────────────────────────────────────────────────────────── */

export async function listAccountFavorites(): Promise<Property[]> {
  if (!getSession()) return [];
  const { ok, data } = await authedFetch("/site/me/favorites", { method: "GET" });
  return ok && Array.isArray(data) ? (data as Property[]) : [];
}

/** Appelé par le bouton ♥ : sans compte connecté, rien n'est envoyé (favoris locaux). */
export async function toggleAccountFavoriteAction(item: Property, on: boolean): Promise<void> {
  if (!getSession()) return;
  if (on) await authedFetch("/site/me/favorites", { method: "POST", body: JSON.stringify({ item }) });
  else await authedFetch(`/site/me/favorites/${encodeURIComponent(item.id)}`, { method: "DELETE" });
}

/** Fusionne les favoris de l'appareil avec ceux du compte, renvoie la liste complète. */
export async function syncFavoritesAction(items: Property[]): Promise<Property[] | null> {
  if (!getSession()) return null;
  const { ok, data } = await authedFetch("/site/me/favorites/sync", { method: "POST", body: JSON.stringify({ items }) });
  return ok && Array.isArray(data) ? (data as Property[]) : null;
}

/* ─── Profil ───────────────────────────────────────────────────────────── */

export async function saveProfileAction(payload: Record<string, string>): Promise<{ ok: boolean; error?: string }> {
  if (!getSession()) return { ok: false, error: "Connectez-vous d'abord." };
  const { ok, data } = await authedFetch("/site/auth/me", { method: "PATCH", body: JSON.stringify(payload) });
  if (!ok) return { ok: false, error: errMsg(data, "Enregistrement impossible.") };
  setProfile(data);
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ─── Connexion & sécurité ─────────────────────────────────────────────── */

export async function setPasswordAction(input: { newPassword: string; currentPassword?: string; code?: string }): Promise<{ ok: boolean; error?: string }> {
  if (!getSession()) return { ok: false, error: "Connectez-vous d'abord." };
  const { ok, data } = await authedFetch("/site/auth/password", { method: "POST", body: JSON.stringify(input) });
  if (!ok) return { ok: false, error: errMsg(data, "Enregistrement impossible.") };
  setProfile(data);
  revalidatePath("/mon-espace/profil");
  return { ok: true };
}

/** Mot de passe oublié : code envoyé sur le numéro du compte. */
export async function sendPasswordCodeAction(): Promise<{ ok: boolean; error?: string; devCode?: string }> {
  const account = getSession();
  if (!account) return { ok: false, error: "Connectez-vous d'abord." };
  const { ok, data } = await siteRequestOtp(account.phone);
  return ok ? { ok: true, devCode: data?.devCode } : { ok: false, error: errMsg(data, "Envoi impossible. Réessayez.") };
}

export async function linkGoogleAction(credential: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch("/site/auth/google/link", { method: "POST", body: JSON.stringify({ credential }) });
  if (!ok) return { ok: false, error: errMsg(data, "Liaison Google impossible.") };
  setProfile(data);
  revalidatePath("/mon-espace/profil");
  return { ok: true };
}

export async function unlinkGoogleAction(): Promise<{ ok: boolean }> {
  const { ok, data } = await authedFetch("/site/auth/google/link", { method: "DELETE" });
  if (ok) { setProfile(data); revalidatePath("/mon-espace/profil"); }
  return { ok };
}

/* ─── Vérification du compte ───────────────────────────────────────────── */

export interface MyVerification {
  enabled: boolean; concerned: boolean; required: boolean; verified: boolean; verifiedAt: string | null;
  docTypes: string[]; intro: string;
  last: { id: string; docType: string; fullName: string; status: string; statusLabel: string; adminNote: string | null; createdAt: string } | null;
}

export async function getMyVerification(): Promise<MyVerification | null> {
  if (!getSession()) return null;
  const { ok, data } = await authedFetch("/site/me/verification", { method: "GET" });
  return ok ? data : null;
}

export async function submitVerificationAction(input: { docType: string; fullName: string; front: string; back?: string; note?: string }): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch("/site/me/verification", { method: "POST", body: JSON.stringify(input) });
  revalidatePath("/mon-espace/verification");
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Envoi impossible.") };
}
