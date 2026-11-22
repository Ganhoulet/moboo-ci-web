"use server";

import { authedFetch } from "@/lib/server-api";

const BASE = "/site/admin/pro-agences";

export type BasculeModeKey = "off" | "pilot" | "on";
export interface ProAgencyRow {
  id: string; name: string; createdAt: string; contact: string | null; members: number; plan: string | null; wpAdmin: boolean;
  lastSeen: string | null; tokens: number; demandes: number; demandes7: number; lastDemande: string | null; mandats: number; invitesPending: number;
  bascule: { render: string[]; waiting: string[]; total: number };
}
export interface ProAgencies {
  page: number; pageSize: number; total: number;
  totals: { orgs: number; tokens: number; demandes: number; demandes7: number; mandats: number; invitesPending: number };
  wordpress: { off: boolean; at: string | null };
  domains: { key: string; label: string; mode: BasculeModeKey }[];
  orgs: ProAgencyRow[];
}
export interface ProAgencyDetail {
  org: { id: string; name: string; createdAt: string; phone: string | null; email: string | null; city: string | null; plan: string };
  members: {
    userId: string; name: string; email: string | null; phone: string | null; role: string; active: boolean; wpId: number | null; login: string | null;
    wpRoles: string[]; teamRole: string | null; suspended: boolean; plan: string | null; planExpires: string | null; lastSeen: string | null; lastLogin: string | null; accountCode: string | null;
  }[];
  links: { token: string; createdAt: string; owner: string; demande: string; mandat: string; objectifs: { key: string; label: string; link: string }[] }[];
  invitations: { id: number; type: string; name: string; bien: string | null; contact: string | null; by: string | null; status: "en_attente" | "acceptee"; createdAt: string; usedAt: string | null; link: string | null }[];
  demandes: {
    total: number;
    byObjectif: { objectif: string; label: string; total: number }[];
    latest: { id: number; client: string; contact: string; email: string | null; objectif: string; typeTransaction: string; typeBien: string; ville: string | null; quartier: string | null; budgetMax: number | null; statut: string; source: string; createdAt: string }[];
  };
  mandats: { id: number; proprietaire_nom: string; proprietaire_tel: string | null; proprietaire_email: string | null; bien_type: string; bien_adresse: string | null; type_mandat: string; statut: string; created_at: string; fichiers: { name: string; url: string | null }[] }[];
  bascule: { key: string; label: string; mode: BasculeModeKey; open: boolean; noReprise: boolean; migrated: boolean; migratedAt: string | null; render: boolean }[];
}

export async function getProAgencies(q?: string, page?: number): Promise<ProAgencies | null> {
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (page && page > 1) qs.set("page", String(page));
  const { ok, data } = await authedFetch(`${BASE}${qs.size ? `?${qs}` : ""}`, { method: "GET" });
  return ok ? (data as ProAgencies) : null;
}

export async function getProAgency(orgId: string): Promise<ProAgencyDetail | null> {
  const { ok, data } = await authedFetch(`${BASE}/${encodeURIComponent(orgId)}`, { method: "GET" });
  return ok ? (data as ProAgencyDetail) : null;
}
