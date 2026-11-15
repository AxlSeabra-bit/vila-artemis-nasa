import type { Lang } from './types';

export type ExpeditionStage = 'briefing' | 'hub' | 'profile' | 'science-center' | 'missions' | 'landing' | 'crew' | 'flight' | 'surface' | 'returning' | 'completed';
export interface Expedition {
  version: 1;
  missionId?: import('./campaign').MissionId;
  crewSize?: number;
  stage: ExpeditionStage;
  coins: number;
  destination: 'moon' | 'mars' | null;
  landingSiteId: string | null;
  flightElapsedSec: number;
}
export const FLIGHT_DURATION_SEC = 12;
export const MISSION_PRICES = { moon: 100, mars: 400 } as const;
export const initialExpedition = (): Expedition => ({version:1, stage:'briefing', coins:0, destination:null, landingSiteId:null, flightElapsedSec:0});
export const LANDING_SITES = [
  { id:'equatorial', lat:0, lon:24, extraCost:0, polar:false,
    name:{pt:'Planície equatorial',en:'Equatorial plain',es:'Llanura ecuatorial'},
    short:{pt:'Expedição curta',en:'Short expedition',es:'Expedición corta'},
    water:{pt:'Levamos água da Terra. Não contamos com gelo neste local.',en:'We bring water from Earth. We do not count on ice at this site.',es:'Llevamos agua de la Tierra. No contamos con hielo aquí.'},
    radiation:{pt:'Terreno aberto: precisamos de abrigo contra a radiação.',en:'Open terrain: we need shelter from radiation.',es:'Terreno abierto: necesitamos refugio contra la radiación.'},
    radio:{pt:'Face voltada para a Terra, com ligação direta mais simples.',en:'Earth-facing region, with a simpler direct radio link.',es:'Región orientada a la Tierra, con enlace directo más sencillo.'} },
  { id:'south-polar', lat:-82, lon:20, extraCost:50, polar:true,
    name:{pt:'Região do polo sul',en:'South polar region',es:'Región del polo sur'},
    short:{pt:'Planejar uma estadia longa',en:'Plan a longer stay',es:'Planear una estancia larga'},
    water:{pt:'Há gelo em algumas áreas sempre na sombra. Encontrar e extrair é difícil!',en:'Some permanently shadowed areas contain ice. Finding and extracting it is difficult!',es:'Hay hielo en algunas zonas siempre en sombra. ¡Encontrarlo y extraerlo es difícil!'},
    radiation:{pt:'O relevo pode bloquear parte da radiação. O polo não é um escudo: ainda precisamos de abrigo.',en:'Terrain can block some radiation. The pole is not a shield: we still need shelter.',es:'El relieve puede bloquear parte de la radiación. El polo no es un escudo: necesitamos refugio.'},
    radio:{pt:'Montanhas podem esconder a Terra. Pode ser preciso esperar ou usar um satélite de retransmissão.',en:'Mountains can hide Earth. We may need to wait or use a relay satellite.',es:'Las montañas pueden ocultar la Tierra. Puede ser necesario esperar o usar un satélite repetidor.'} },
] as const;
export const landingSite = (id: string | null) => LANDING_SITES.find(site => site.id === id);
export const siteName = (id: string | null, lang: Lang) => landingSite(id)?.name[lang] ?? '';

export function validExpedition(value: unknown): value is Expedition {
  if (!value || typeof value !== 'object') return false;
  const e = value as Expedition;
  if (e.version!==1 || !Number.isInteger(e.coins) || e.coins<0 || !Number.isFinite(e.flightElapsedSec) || e.flightElapsedSec<0 || e.flightElapsedSec>FLIGHT_DURATION_SEC) return false;
  if (e.stage==='briefing') return e.coins===0 && e.destination===null;
  if(e.missionId!==undefined&&!['first-steps','polar-craters'].includes(e.missionId))return false;
  if(e.crewSize!==undefined&&(!Number.isInteger(e.crewSize)||e.crewSize<1||e.crewSize>6))return false;
  if(['hub','profile','science-center'].includes(e.stage))return true;
  if (e.stage==='missions') return e.destination===null;
  if(e.stage==='crew')return e.destination==='moon'&&e.missionId==='polar-craters'&&e.landingSiteId==='south-polar';
  if (!['landing','flight','surface','returning','completed'].includes(e.stage) || e.destination!=='moon') return false;
  return e.stage==='landing' ? e.landingSiteId===null || !!landingSite(e.landingSiteId) : !!landingSite(e.landingSiteId);
}
