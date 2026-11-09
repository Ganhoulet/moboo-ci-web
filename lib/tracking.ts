import type { TrackingIds } from "./tracking-config";

/** Mesure côté navigateur : rien n'est chargé ni envoyé avant l'accord du visiteur. */
const CONSENT_KEY = "moboo_consent_v1";
export const OPEN_CONSENT_EVENT = "moboo:consent-open";
export type Consent = "granted" | "denied" | null;

export type TrackEvent =
  | { name: "search"; term: string }
  | { name: "view_listing"; id: string }
  | { name: "contact"; channel: "call" | "whatsapp" }
  | { name: "signup" }
  | { name: "publish_listing" }
  | { name: "purchase"; id: string; value: number };

const CURRENCY = "XOF";
let ids: TrackingIds | null = null;
let queue: TrackEvent[] = [];

export function getConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch { return null; }
}

export function saveConsent(v: "granted" | "denied") {
  try { localStorage.setItem(CONSENT_KEY, v); } catch { /* navigation privée : la question reviendra */ }
}

function loadScript(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function loadGa(id: string) {
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() { w.dataLayer.push(arguments); };
  w.gtag("js", new Date());
  w.gtag("config", id, { send_page_view: false });
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
}

function loadMeta(id: string) {
  const w = window as any;
  if (!w.fbq) {
    const n: any = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    w.fbq = n;
    w._fbq = n;
    n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    loadScript("https://connect.facebook.net/en_US/fbevents.js");
  }
  w.fbq("set", "autoConfig", false, id); // pas de lecture automatique des boutons et formulaires
  w.fbq("init", id);
}

function loadTiktok(id: string) {
  const w = window as any;
  const ttq: any = (w.ttq = w.ttq || []);
  w.TiktokAnalyticsObject = "ttq";
  ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
  ttq.setAndDefer = (t: any, e: string) => { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
  ttq.methods.forEach((m: string) => ttq.setAndDefer(ttq, m));
  ttq._i = ttq._i || {};
  ttq._i[id] = [];
  ttq._i[id]._u = "https://analytics.tiktok.com/i18n/pixel/events.js";
  ttq._t = ttq._t || {};
  ttq._t[id] = +new Date();
  ttq._o = ttq._o || {};
  ttq._o[id] = {};
  loadScript(`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(id)}&lib=ttq`);
}

function send(e: TrackEvent) {
  const w = window as any;
  const fire = (ga: string, gaParams: object, meta: [string, string], tiktok: string, params: object = {}) => {
    if (ids?.ga4) w.gtag("event", ga, gaParams);
    if (ids?.meta) w.fbq(meta[0], meta[1], params);
    if (ids?.tiktok) w.ttq.track(tiktok, params);
  };
  const std = (name: string): [string, string] => ["track", name];
  switch (e.name) {
    case "search": return fire("search", { search_term: e.term }, std("Search"), "Search", { search_string: e.term, query: e.term });
    case "view_listing": return fire("view_item", { items: [{ item_id: e.id }] }, std("ViewContent"), "ViewContent", { content_ids: [e.id], content_id: e.id, content_type: "product" });
    case "contact": return fire("generate_lead", { method: e.channel }, std("Contact"), "Contact", { channel: e.channel });
    case "signup": return fire("sign_up", {}, std("CompleteRegistration"), "CompleteRegistration");
    case "publish_listing": return fire("publish_listing", {}, ["trackCustom", "PublishListing"], "SubmitForm");
    case "purchase": {
      if (alreadySent(e.id)) return;
      return fire("purchase", { transaction_id: e.id, value: e.value, currency: CURRENCY }, std("Purchase"), "CompletePayment", { value: e.value, currency: CURRENCY });
    }
  }
}

/** Une facture payée n'est comptée qu'une fois, même si la page de retour est rechargée. */
function alreadySent(invoiceId: string) {
  const key = `moboo_purchase_${invoiceId}`;
  try {
    if (localStorage.getItem(key)) return true;
    localStorage.setItem(key, "1");
  } catch { /* compté tel quel */ }
  return false;
}

export function activateTracking(next: TrackingIds) {
  if (ids) return;
  ids = next;
  if (next.ga4) loadGa(next.ga4);
  if (next.meta) loadMeta(next.meta);
  if (next.tiktok) loadTiktok(next.tiktok);
  const pending = queue;
  queue = [];
  pending.forEach(send);
}

export function trackEvent(e: TrackEvent) {
  if (getConsent() === "denied") return;
  if (ids) send(e);
  else if (queue.length < 20) queue.push(e);
}

export function trackPageView() {
  if (!ids) return;
  const w = window as any;
  if (ids.ga4) w.gtag("event", "page_view", { page_location: location.href, page_title: document.title });
  if (ids.meta) w.fbq("track", "PageView");
  if (ids.tiktok) w.ttq.page();
}

/** Retire les cookies de mesure quand le visiteur retire son accord. */
export function clearTrackingCookies() {
  const names = document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter((n) => /^(_ga|_gid|_gat|_fbp|_fbc|_ttp|_tt_|ttcsid)/.test(n));
  const parts = location.hostname.split(".");
  const domains = [""];
  for (let i = 0; i < parts.length - 1; i++) domains.push(`;domain=.${parts.slice(i).join(".")}`);
  for (const n of names) for (const d of domains) document.cookie = `${n}=;path=/;max-age=0${d}`;
}
