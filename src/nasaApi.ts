import { DONKI_EDU_CARDS } from './constants';
import { ARCHIVED_ALERTS } from './science';
import type { DonkiEduCard, NasaDonkiAlert } from './types';

const CACHE_KEY = 'age_of_artemis_donki_cache_v2';
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000;
const allowedTypes = new Set(['SEP', 'CME', 'FLR', 'GST', 'RBE']);
export function getDonkiEduCard(alertType: string): DonkiEduCard {
  return DONKI_EDU_CARDS.find(c => c.type === alertType) || DONKI_EDU_CARDS[0];
}
export function enrichDonkiAlert(alert: NasaDonkiAlert) {
  return { ...alert, eduCard: getDonkiEduCard(alert.messageType) };
}
export function safeNasaUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'nasa.gov' || url.hostname.endsWith('.nasa.gov')) ? url.href : undefined;
  } catch { return undefined; }
}
export function normalizeDonki(data: unknown, now = Date.now()): NasaDonkiAlert[] {
  if (!Array.isArray(data)) throw new Error('Invalid DONKI response');
  return data.flatMap((item): NasaDonkiAlert[] => {
    if (!item || typeof item !== 'object' || !allowedTypes.has(item.messageType) ||
        typeof item.messageID !== 'string' || typeof item.messageIssueTime !== 'string' ||
        !Number.isFinite(Date.parse(item.messageIssueTime)) || Date.parse(item.messageIssueTime) > now + 60000) return [];
    const type = item.messageType as NasaDonkiAlert['messageType'];
    return [{ id: item.messageID.slice(0, 120), messageType: type, issueTime: item.messageIssueTime,
      summary: `NASA DONKI: ${type} (${item.messageIssueTime.slice(0,10)})`,
      // Difficulty is authored, never a measured dose or NASA severity.
      severity: type === 'SEP' ? 3 : type === 'CME' || type === 'FLR' ? 2 : 1,
      source: 'live', sourceUrl: safeNasaUrl(item.messageURL), fetchedAt: new Date(now).toISOString() }];
  }).sort((a,b) => Date.parse(b.issueTime)-Date.parse(a.issueTime)).slice(0,12);
}

export async function fetchNasaDonkiAlerts(options: { fetcher?: typeof fetch; storage?: Storage; now?: number } = {}): Promise<NasaDonkiAlert[]> {
  const now = options.now ?? Date.now();
  const fetcher = options.fetcher ?? fetch;
  let storage = options.storage;
  try { storage ??= globalThis.localStorage; } catch { /* Storage can be blocked. */ }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const end = new Date(now).toISOString().slice(0,10);
    const start = new Date(now-7*86400000).toISOString().slice(0,10);
    // Public CCMC endpoint needs no personal key. VITE values are public browser configuration.
    const key = import.meta.env?.VITE_NASA_API_KEY || '';
    const url = key
      ? `https://api.nasa.gov/DONKI/notifications?startDate=${start}&endDate=${end}&type=all&api_key=${encodeURIComponent(key)}`
      : `https://ccmc.gsfc.nasa.gov/DONKI/WS/get/notifications?startDate=${start}&endDate=${end}&type=all`;
    const response = await fetcher(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`DONKI HTTP ${response.status}`);
    const alerts = normalizeDonki(await response.json(), now);
    // Empty is valid. It never implies that the Moon is safe.
    try { storage?.setItem(CACHE_KEY, JSON.stringify({ savedAt: now, alerts })); } catch { /* Keep usable data. */ }
    return alerts;
  } catch {
    try {
      const cached = JSON.parse(storage?.getItem(CACHE_KEY) || 'null');
      if (cached && Number.isFinite(cached.savedAt) && now >= cached.savedAt && now-cached.savedAt <= MAX_CACHE_AGE && Array.isArray(cached.alerts)) {
        const valid = normalizeDonki(cached.alerts.map((a: NasaDonkiAlert) => ({ messageID:a.id, messageType:a.messageType, messageIssueTime:a.issueTime, messageURL:a.sourceUrl })),now);
        if (valid.length === cached.alerts.length) return valid.map(a=>({...a,source:'cache',fetchedAt:new Date(cached.savedAt).toISOString()}));
      }
    } catch { /* Corrupt cache cannot become a real alert. */ }
    return ARCHIVED_ALERTS.map(a=>({...a}));
  } finally { clearTimeout(timer); }
}
