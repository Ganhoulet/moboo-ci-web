"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { getSession, setProfile } from "@/lib/session";
import type { Property } from "@/lib/property";

const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message) || fallback;

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
  photo: string | null;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MyListings {
  totalListings: number;
  activeListings: number;
  totalViews: number;
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

export type SaveResult = { ok: boolean; id?: string; error?: string };

/** Création (id absent) ou modification d'une annonce. */
export async function saveListingAction(id: string | null, payload: Record<string, any>): Promise<SaveResult> {
  if (!getSession()) return { ok: false, error: "Connectez-vous d'abord." };
  const { ok, data } = await authedFetch(id ? `/site/me/listings/${encodeURIComponent(id)}` : "/site/me/listings", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
  if (!ok) return { ok: false, error: errMsg(data, "Enregistrement impossible. Réessayez.") };
  revalidatePath("/mon-espace", "layout");
  return { ok: true, id: data?.id ?? id ?? undefined };
}

export async function setListingStatusAction(id: string, status: string): Promise<void> {
  await authedFetch(`/site/me/listings/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
  revalidatePath("/mon-espace", "layout");
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

export interface Stats {
  days: number;
  totals: { views: number; inquiries: number };
  series: { day: string; views: number; inquiries: number }[];
  top: { id: string; title: string; status: string; totalViews: number; views: number; inquiries: number }[];
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
