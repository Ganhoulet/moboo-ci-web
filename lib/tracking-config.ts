/** Identifiants des outils de mesure (back-office → Centre marketing → Pixels) : un format strict avant toute injection. */
export interface TrackingSettings { enabled: boolean; ga4Id: string; metaPixelId: string; tiktokPixelId: string; consentText: string }
export interface TrackingIds { ga4: string | null; meta: string | null; tiktok: string | null }

export const TRACKING_FORMATS = {
  ga4: /^G-[A-Z0-9]{4,20}$/,
  meta: /^\d{10,20}$/,
  tiktok: /^[A-Z0-9]{15,30}$/,
};

const pick = (value: string | undefined, format: RegExp) => {
  const v = (value ?? "").trim();
  return format.test(v) ? v : null;
};

export function trackingIds(t: TrackingSettings): TrackingIds {
  if (!t.enabled) return { ga4: null, meta: null, tiktok: null };
  return { ga4: pick(t.ga4Id, TRACKING_FORMATS.ga4), meta: pick(t.metaPixelId, TRACKING_FORMATS.meta), tiktok: pick(t.tiktokPixelId, TRACKING_FORMATS.tiktok) };
}

export const trackingOn = (ids: TrackingIds) => !!(ids.ga4 || ids.meta || ids.tiktok);
