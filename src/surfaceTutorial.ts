import { BUILDING_DEFS } from './constants';
import type { BuildingType, GameStateSnapshot, Unit } from './types';
import { findRoute, nearestWalkable, layoutFor, type TerrainLayout } from './lunarTerrain';
import { campaignOf, polarMission, crewCount, crewConsumption, constructionSeconds, type EquipmentId } from './campaign';

export type TutorialStep = 'base-site' | 'base-build' | 'base-home' | 'equipment-site' | 'equipment-build' | 'equipment-home' | 'antenna-site' | 'antenna-build' | 'antenna-ready' | 'transmitting' | 'level-up' | 'data-home' | 'radiation' | 'warning' | 'storm' | 'return-ready' | 'boarding';
export interface SurfaceTutorial {
  version: 1 | 2;
  step: TutorialStep;
  elapsed: number;
  baseId: number | null;
  antennaId: number | null;
  rewardPaid: boolean;
  activeBuildingId?:number;
  transmitStartKnowledge?:number;
}
export const ROCKET = { x: 14, y: 17 };
export const BUILD_SECONDS = 15;
export const TRANSMIT_SECONDS = 20;
export const KNOWLEDGE_PER_LEVEL = 20;
export const MISSION_REWARD = { coins:350, knowledge:5 } as const;
export const WARNING_SECONDS = 8;
export const WARNING_BEFORE_EXPLANATION = 3;
export const TUTORIAL_COSTS = {
  command_center: { energy: 30, oxygen: 20 },
  dsn_antenna: { energy: 25, oxygen: 15 },
  solar_array: { energy:10, oxygen:10 },
  ice_extractor: { energy:15, oxygen:10 },
  hydroponics: { energy:15, oxygen:10 },
} as const;
export type TutorialBuilding = keyof typeof TUTORIAL_COSTS;
export const newTutorial = (): SurfaceTutorial => ({ version: 2, step: 'base-site', elapsed: 0, baseId: null, antennaId: null, rewardPaid: false });
export const tutorialLevel = (knowledge: number): number => 1 + Math.floor(knowledge / KNOWLEDGE_PER_LEVEL);
export const levelProgress = (knowledge:number):number => knowledge % KNOWLEDGE_PER_LEVEL;
export function requestedBuilding(state: GameStateSnapshot): TutorialBuilding | null {
  if(state.tutorial?.step==='equipment-site')return nextEquipment(state);
  return state.tutorial?.step === 'base-site' ? 'command_center' : state.tutorial?.step === 'antenna-site' ? 'dsn_antenna' : null;
}
function nextEquipment(state:GameStateSnapshot):EquipmentId|null {
  return (['solar_array','ice_extractor','hydroponics'] as EquipmentId[]).find(type=>campaignOf(state).equipment[type]>0&&!state.buildings.some(b=>b.type===type&&b.built))??null;
}
export function rocketOverlap(type: BuildingType, x: number, y: number): boolean {
  const size = BUILDING_DEFS[type].size;
  return x < ROCKET.x + 1.5 && x + size > ROCKET.x - 1.5 && y < ROCKET.y + 1 && y + size > ROCKET.y - 2;
}
export function dispatch(state: GameStateSnapshot, x: number, y: number, shelter: number | null = null): void {
  state.buildings.forEach(b => b.garrisonedIds = []);
  state.units.forEach((u, i) => {
    const destination=nearestWalkable({x:x+(shelter===null?(i-(state.units.length-1)/2)*.45:0),y},layoutFor(state));
    const origin=nearestWalkable(u,layoutFor(state));
    u.x=origin.x;u.y=origin.y;
    u.targetX = destination.x;
    u.targetY = destination.y;
    u.route=findRoute(u,destination,layoutFor(state))??[];
    u.targetBuildingId = null;
    u.targetNodeId = null;
    u.shelterBuildingId = shelter;
    u.state = 'moving';
  });
}
function home(state: GameStateSnapshot): void {
  const base = state.buildings.find(b => b.id === state.tutorial!.baseId)!;
  dispatch(state, base.x + base.size / 2, base.y + base.size / 2, base.id);
}
function move(u: Unit, dt: number, layout:TerrainLayout): void {
  if (u.targetX === null || u.targetY === null) return;
  u.route??=findRoute(u,{x:u.targetX,y:u.targetY},layout)??[];
  let distance=2.4*dt;
  while(u.route.length && distance>0){
    const next=u.route[0],dx=next.x-u.x,dy=next.y-u.y,d=Math.hypot(dx,dy);
    if(d<=distance){u.x=next.x;u.y=next.y;distance-=d;u.route.shift();}
    else{u.x+=dx/d*distance;u.y+=dy/d*distance;distance=0;}
  }
  if(!u.route.length && Math.hypot(u.x-u.targetX,u.y-u.targetY)<1e-6){
    u.targetX=null;u.targetY=null;u.state=u.shelterBuildingId!==null?'sheltered':'idle';
  }
}
export function checkMissionFailure(state: GameStateSnapshot): void {
  if (state.gameOver || state.victory) return;
  const exhausted = (['oxygen', 'water', 'food', 'energy'] as const).find(k => state.resources[k] <= 0);
  if (state.radiationLevel >= 100 || exhausted) {
    state.gameOver = true;
    state.lossReason = state.radiationLevel >= 100 ? 'radiation_limit' : `${exhausted}_depleted`;
  }
}
/** Mission budget percentages and timing are educational rules, never physical dose units. */
export function tickTutorial(state: GameStateSnapshot, dt: number): void {
  const t = state.tutorial!;
  checkMissionFailure(state);
  if (state.gameOver) return;
  if (t.step === 'level-up') return;
  state.resources.energy = Math.max(0, state.resources.energy - .08 * dt);
  const consumption=crewConsumption(crewCount(state));
  state.resources.oxygen = Math.max(0, state.resources.oxygen - consumption.oxygen * dt);
  state.resources.water = Math.max(0, state.resources.water - consumption.water * dt);
  state.resources.food = Math.max(0, state.resources.food - consumption.food * dt);
  state.powerNetPerSec = -.08;
  if(polarMission(state)){
    const c=campaignOf(state),active=(type:EquipmentId)=>state.buildings.some(b=>b.type===type&&b.built);
    const efficiency=(type:EquipmentId)=>1+(c.equipment[type]-1)*.5;
    if(active('solar_array')){state.resources.energy=Math.min(999,state.resources.energy+.30*efficiency('solar_array')*dt);state.powerNetPerSec+=.30*efficiency('solar_array');}
    if(active('ice_extractor')&&state.resources.energy>=.10*dt){state.resources.energy-=.10*dt;state.resources.water=Math.min(999,state.resources.water+.20*efficiency('ice_extractor')*dt);state.powerNetPerSec-=.10;}
    if(active('hydroponics')&&state.resources.energy>=.04*dt&&state.resources.water>=.01*dt){state.resources.energy-=.04*dt;state.resources.water-=.01*dt;state.resources.food=Math.min(999,state.resources.food+.12*efficiency('hydroponics')*dt);state.powerNetPerSec-=.04;}
  }
  for (const u of state.units) {
    const sheltered = u.state === 'sheltered';
    const rate = t.step === 'storm' ? (sheltered ? .015 : 6) : (sheltered ? .002 : .06);
    u.radiationDose = Math.min(100, u.radiationDose + rate * dt);
    state.radiationLevel = Math.max(state.radiationLevel, u.radiationDose);
    move(u, dt, layoutFor(state));
    if (u.state === 'sheltered') {
      const b = state.buildings.find(b => b.id === u.shelterBuildingId);
      if (b && !b.garrisonedIds.includes(u.id)) b.garrisonedIds.push(u.id);
    }
  }
  checkMissionFailure(state);
  if (state.gameOver) return;
  const settled = state.units.every(u => u.state !== 'moving');
  const sheltered = state.units.every(u => u.state === 'sheltered');
  if (['base-build','antenna-build','equipment-build'].includes(t.step) && settled) {
    const b = state.buildings.find(b => b.id === (t.step === 'base-build' ? t.baseId : t.step==='antenna-build'?t.antennaId:t.activeBuildingId))!;
    state.units.forEach(u => u.state = 'building');
    const buildSeconds=constructionSeconds(crewCount(state));
    t.elapsed = Math.min(buildSeconds, t.elapsed + dt);
    b.progress = t.elapsed / buildSeconds;
    if (t.elapsed >= buildSeconds - 1e-8) {
      b.built = true; b.progress = 1; t.elapsed = 0;
      if (t.step === 'base-build') { t.step = 'base-home'; home(state); }
      else if(t.step==='equipment-build'){t.step='equipment-home';home(state);}
      else { t.step = 'antenna-ready'; state.units.forEach(u => u.state = 'idle'); }
    }
  } else if ((t.step === 'base-home'||t.step==='equipment-home') && sheltered) { t.step = polarMission(state)&&nextEquipment(state)?'equipment-site':'antenna-site'; }
  else if (t.step === 'transmitting') {
    t.elapsed = Math.min(TRANSMIT_SECONDS, t.elapsed + dt);
    state.xp = (t.transmitStartKnowledge??0)+Math.min(KNOWLEDGE_PER_LEVEL, Math.floor(t.elapsed + 1e-8));
    if (t.elapsed >= TRANSMIT_SECONDS - 1e-8) {
      state.xp = (t.transmitStartKnowledge??0)+KNOWLEDGE_PER_LEVEL; state.score += KNOWLEDGE_PER_LEVEL; t.elapsed = 0; t.step = 'level-up'; home(state);
    }
  } else if (t.step === 'data-home' && sheltered) { t.step = 'warning'; t.elapsed = 0; }
  else if (t.step === 'warning' || t.step === 'storm') {
    t.elapsed += dt;
    if (t.step === 'warning' && t.elapsed >= WARNING_SECONDS - 1e-8) { t.elapsed = 0; t.step = 'storm'; }
    else if (t.step === 'storm' && t.elapsed >= 12) { t.elapsed = 0; t.step = 'return-ready'; state.stormsSurvived++; }
  } else if (t.step === 'boarding' && sheltered) {
    state.expedition.stage = 'returning'; state.expedition.flightElapsedSec = 0;
  }
}
