import manifest from '../data/derived/science-manifest.json';
import archive from '../data/derived/donki-archive.json';
import radlab from '../data/derived/radlab-iss.json';
import type { NasaDonkiAlert } from './types';

export const SCIENCE = manifest;
export const RADLAB = radlab;
export const ARCHIVED_ALERTS: NasaDonkiAlert[] = archive as NasaDonkiAlert[];
export const LUNAR_ONE_WAY_LIGHT_SEC = 1.3;
export const MARS_ONE_WAY_MINUTES = [4, 24] as const;
export function terrainExposure(id: string | undefined): number {
  return SCIENCE.radiationSamples.find(s => s.id === id)?.relativeExposure ?? 1;
}
// These points are a layout derived from a published illustration, not survey coordinates.
export function lunarIceSites() {
  return SCIENCE.iceSites.map(site => ({ ...site }));
}
export function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
