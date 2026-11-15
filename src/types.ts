import type { Expedition } from './expedition';
export type Lang = 'pt' | 'en' | 'es';

export type ResourceKey = 'energy' | 'water' | 'oxygen' | 'food' | 'regolith';

export type Resources = Record<ResourceKey, number>;

export type BuildingType =
  | 'command_center'
  | 'solar_array'
  | 'ice_extractor'
  | 'hydroponics'
  | 'regolith_printer'
  | 'radiation_bunker'
  | 'kilopower'
  | 'dsn_antenna'
  | 'habitat_pod';

export type UnitType = 'astronaut' | 'viper_rover';

export type NodeType = 'ice_crater' | 'regolith_vein';

export type PowerPriority = 'balanced' | 'life_support' | 'shield' | 'production';

export type GameMode = 'campaign' | 'classroom';

export interface ResourceNode {
  id: number;
  type: NodeType;
  x: number;
  y: number;
  amount: number;
  maxAmount: number;
  sourceSiteId?: string;
}

export interface Building {
  id: number;
  type: BuildingType;
  x: number;
  y: number;
  size: number;
  hp: number;
  maxHp: number;
  level: number;
  progress: number; // 0..1 enquanto em construcao
  built: boolean;
  garrisonedIds: number[];
}

export interface Unit {
  route?: import('./lunarTerrain').Waypoint[];
  id: number;
  type: UnitType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  targetX: number | null;
  targetY: number | null;
  state: 'idle' | 'moving' | 'gathering' | 'returning' | 'building' | 'sheltered';
  targetNodeId: number | null;
  targetBuildingId: number | null;
  carryType: ResourceKey | null;
  carryAmount: number;
  shelterBuildingId: number | null;
  radiationDose: number; // 0..100
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export interface NasaDonkiAlert {
  id: string;
  messageType: 'RBE' | 'SEP' | 'FLR' | 'CME' | 'GST';
  issueTime: string;
  summary: string;
  severity: 1 | 2 | 3;
  source: 'live' | 'cache' | 'archive' | 'simulation';
  sourceUrl?: string;
  fetchedAt?: string;
}

export interface RoguelikeCard {
  id: string;
  category: 'eclss' | 'power' | 'shield' | 'science';
  icon: string;
  titleKey: string;
  descKey: string;
  tradeoffKey: string;
  effectId: string;
}

export interface StemQuestion {
  id: string;
  question: Record<Lang, string>;
  options: Record<Lang, string[]>;
  correctIndex: number;
  explanation: Record<Lang, string>;
}

export interface ActiveCrisis {
  kind: 'solar_storm' | 'lunar_night' | 'dust_storm' | 'eclss_leak';
  titleKey: string;
  descKey: string;
  remainingSec: number;
  totalSec: number;
  severity: number;
  donkiRef?: string;
}

// Ranks de Carreira da NASA Artemis
export type AstronautRank =
  | 'cadet'
  | 'payload_specialist'
  | 'base_engineer'
  | 'flight_director'
  | 'artemis_commander';

export interface ArtemisRankDef {
  id: AstronautRank;
  nameKey: string;
  icon: string;
  minXp: number;
  perkKey: string;
  descKey: string;
}

// Medalhas e Conquistas Educativas da NASA
export type BadgeId =
  | 'badge_shackleton'
  | 'badge_water_hunter'
  | 'badge_regolith_master'
  | 'badge_eclss_guardian'
  | 'badge_donki_survivor'
  | 'badge_viper_navigator'
  | 'badge_kilopower_pioneer'
  | 'badge_artemis_legend';

export type BadgeCategory =
  | 'exploration'
  | 'isru'
  | 'engineering'
  | 'life_support'
  | 'space_weather'
  | 'robotics'
  | 'power'
  | 'mission';

export interface ArtemisBadgeDef {
  id: BadgeId;
  titleKey: string;
  descKey: string;
  factKey: string;
  icon: string;
  category: BadgeCategory;
  xpReward: number;
}

// Cards Didaticos NASA DONKI para 7 a 13 anos
export interface DonkiEduCard {
  id: string;
  type: 'CME' | 'FLR' | 'SEP' | 'RBE' | 'GST';
  titleKey: string;
  whatIsKey: string;
  impactKey: string;
  actionKey: string;
  quizQuestionKey: string;
  quizAnswerKey: string;
  severity: 1 | 2 | 3;
  scienceBonus: number;
  xpBonus: number;
}

// Fatos Cientificos da NASA para Popups
export interface SpaceFactPopup {
  id: string;
  triggerType: 'building' | 'phase' | 'crisis' | 'sol';
  triggerKey: string;
  factKey: string;
  icon: string;
  xpBonus: number;
}

// Eventos Clicaveis no Mapa (Drops Espaciais)
export interface MapClickableEvent {
  id: number;
  type: 'supply_pod' | 'meteorite_crystal';
  x: number;
  y: number;
  lifeSec: number;
  rewardType: ResourceKey | 'xp';
  amount: number;
  icon: string;
}

export interface GameStateSnapshot {
  campaign?: import('./campaign').CampaignProgress;
  replay?: { campaign:import('./campaign').CampaignProgress; coins:number; knowledge:number; score:number };
  tutorial?: import('./surfaceTutorial').SurfaceTutorial;
  rngState?: number;
  nextDropInSec?: number;
  entitySequence?: number;
  scienceVersion?: number;
  radiationTerrainId?: string;
  pendingTrade?: { buy: ResourceKey; amount: number; remainingSec: number } | null;
  mode: GameMode;
  seedCode: string;
  sol: number;
  solTimerSec: number;
  solDurationSec: number;
  expedition: Expedition;
  resources: Resources;
  shieldIntegrity: number; // 0..100
  radiationLevel: number; // 0..100
  lifeSupportHealth: number; // 0..100
  powerPriority: PowerPriority;
  powerNetPerSec: number;
  pop: number;
  popCap: number;
  score: number;
  xp: number;
  rank: AstronautRank;
  stormsSurvived: number;
  activeCards: string[];
  activeCrisis: ActiveCrisis | null;
  classroomTimeLeftSec: number;
  gameOver: boolean;
  victory: boolean;
  lossReason: string | null;
  nodes: ResourceNode[];
  buildings: Building[];
  units: Unit[];
  floatingTexts: FloatingText[];
  donkiAlerts: NasaDonkiAlert[];
  nasaAlerts?: NasaDonkiAlert[];
  unlockedBadges: BadgeId[];
  readDonkiCardIds: string[];
  discoveredFactIds: string[];
  clickableEvents: MapClickableEvent[];
  dayNightCycle: number; // 0..1 fator solar
  screenShakeSec: number;
}
