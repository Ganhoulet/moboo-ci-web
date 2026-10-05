"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

export interface MessagingConfig {
  sms: {
    provider: "auto" | "orange" | "twilio" | "infobip" | "http" | "none"; marketing: boolean; plainText: boolean; optOut: boolean;
    orange: { clientId: string; clientSecret: string; sender: string; senderName: string };
    twilio: { accountSid: string; authToken: string; from: string };
    infobip: { baseUrl: string; apiKey: string; from: string };
    http: { url: string; method: "POST" | "GET"; headers: string; body: string; okPattern: string };
  };
  whatsapp: { phoneId: string; accessToken: string; apiVersion: string; wabaId: string; language: string; verifyToken: string };
}
export interface MessagingStatus {
  email: { ready: boolean };
  sms: { provider: string | null; label: string | null; marketing: boolean; plainText: boolean; optOut: boolean };
  whatsapp: { ready: boolean };
  optouts: Record<string, number>;
}
export interface MessagingView {
  config: MessagingConfig; status: MessagingStatus; webhookUrl: string; stopUrl: string;
  waSuggestions: { name: string; usage: string; category: string; body: string; vars: string[] }[];
  smsSuggestions: { usage: string; text: string }[];
}

const err = (d: any) => (Array.isArray(d?.error?.message) ? d.error.message.join(" ") : d?.error?.message ?? d?.message) || "Action impossible.";

export async function getMessaging(): Promise<MessagingView | null> {
  const r = await authedFetch("/site/admin/messaging", { method: "GET" });
  return r.ok ? r.data : null;
}
export async function saveMessagingAction(config: MessagingConfig): Promise<{ ok: boolean; error?: string; config?: MessagingConfig; status?: MessagingStatus }> {
  const r = await authedFetch("/site/admin/messaging", { method: "PUT", body: JSON.stringify(config) });
  if (r.ok) revalidatePath("/admin/centre-marketing", "layout");
  return r.ok ? { ok: true, ...r.data } : { ok: false, error: err(r.data) };
}
export async function testSmsAction(to: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch("/site/admin/messaging/test-sms", { method: "POST", body: JSON.stringify({ to, text }) });
  return r.ok ? r.data : { ok: false, error: err(r.data) };
}
export async function testWhatsappAction(to: string, template: string, vars: string[]): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch("/site/admin/messaging/test-whatsapp", { method: "POST", body: JSON.stringify({ to, template, vars }) });
  return r.ok ? r.data : { ok: false, error: err(r.data) };
}
export async function listWaTemplatesAction(): Promise<{ ok: boolean; error?: string; items: { name: string; status: string; language: string; category: string; body: string; variables: number }[] }> {
  const r = await authedFetch("/site/admin/messaging/whatsapp-templates", { method: "GET" });
  return r.ok ? r.data : { ok: false, error: err(r.data), items: [] };
}
