"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { getSession } from "@/lib/session";

export interface MyListing {
  id: string;
  title: string;
  transaction: "rent" | "sale";
  price: number;
  city: string;
  commune: string | null;
  status: string;
  views: number;
  inquiries: number;
  photo: string | null;
  createdAt: string;
}

export interface MyListings {
  totalListings: number;
  totalViews: number;
  totalInquiries: number;
  items: MyListing[];
}

export interface MyInquiry {
  id: string;
  listingId: string | null;
  listingTitle: string | null;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  kind: string;
  preferredDate: string | null;
  createdAt: string;
}

/** Annonces publiées par le compte connecté (pour /compte). */
export async function listMyListings(): Promise<MyListings | null> {
  if (!getSession()) return null;
  const { ok, data } = await authedFetch("/site/me/listings", { method: "GET" });
  return ok ? (data as MyListings) : null;
}

export async function listMyInquiries(): Promise<MyInquiry[]> {
  if (!getSession()) return [];
  const { ok, data } = await authedFetch("/site/me/inquiries", { method: "GET" });
  return ok && Array.isArray(data?.items) ? (data.items as MyInquiry[]) : [];
}

/** Vendu / loué / remis en ligne. */
export async function setListingStatusAction(id: string, status: string): Promise<void> {
  await authedFetch(`/site/me/listings/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  revalidatePath("/compte");
}
