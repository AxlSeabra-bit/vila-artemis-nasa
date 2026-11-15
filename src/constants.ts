import type {
  ArtemisBadgeDef,
  ArtemisRankDef,
  BuildingType,
  DonkiEduCard,
  Resources,
  RoguelikeCard,
  SpaceFactPopup,
  UnitType,
} from './types';

export const MAP_SIZE = 28;
export const TICK_RATE = 10;
export const TICK_MS = 1000 / TICK_RATE;
export const SAVE_STORAGE_KEY = 'age_of_artemis_save_v3_tutorial';
export const SOL_DURATION_SEC = 45;
export const CLASSROOM_MATCH_SEC = 600; // 10 minutos para sala de aula

export const INITIAL_RESOURCES: Resources = {
  energy: 140,
  water: 120,
  oxygen: 120,
  food: 110,
  regolith: 130,
};

export interface BuildingDef {
  type: BuildingType;
  icon: string;
  size: number;
  hp: number;
  cost: Partial<Resources>;
  buildTimeSec: number;
  popProvided: number;
  energyPerSec: number; // positivo gera, negativo consome
  oxygenPerSec: number;
  foodPerSec: number;
  regolithPerSec: number;
  shieldBonus: number;
  garrisonCap: number;
  color: string;
}

export const BUILDING_DEFS: Record<BuildingType, BuildingDef> = {
  command_center: {
    type: 'command_center',
    icon: '🛸',
    size: 2,
    hp: 600,
    cost: { regolith: 180, energy: 80 },
    buildTimeSec: 12,
    popProvided: 4,
    energyPerSec: 1.5,
    oxygenPerSec: 0.6,
    foodPerSec: 0,
    regolithPerSec: 0,
    shieldBonus: 20,
    garrisonCap: 6,
    color: '#38bdf8',
  },
  solar_array: {
    type: 'solar_array',
    icon: '☀️',
    size: 1,
    hp: 160,
    cost: { regolith: 40 },
    buildTimeSec: 4,
    popProvided: 0,
    energyPerSec: 5.5,
    oxygenPerSec: 0,
    foodPerSec: 0,
    regolithPerSec: 0,
    shieldBonus: 0,
    garrisonCap: 0,
    color: '#facc15',
  },
  ice_extractor: {
    type: 'ice_extractor',
    icon: '💧',
    size: 1,
    hp: 200,
    cost: { regolith: 55, energy: 25 },
    buildTimeSec: 5,
    popProvided: 0,
    energyPerSec: -2.0,
    oxygenPerSec: 3.8,
    foodPerSec: 0,
    regolithPerSec: 0,
    shieldBonus: 0,
    garrisonCap: 0,
    color: '#22d3ee',
  },
  hydroponics: {
    type: 'hydroponics',
    icon: '🌱',
    size: 2,
    hp: 220,
    cost: { regolith: 65, oxygen: 30, energy: 30 },
    buildTimeSec: 6,
    popProvided: 0,
    energyPerSec: -2.2,
    oxygenPerSec: 1.2,
    foodPerSec: 3.8,
    regolithPerSec: 0,
    shieldBonus: 0,
    garrisonCap: 0,
    color: '#4ade80',
  },
  regolith_printer: {
    type: 'regolith_printer',
    icon: '🏗️',
    size: 2,
    hp: 280,
    cost: { energy: 45, regolith: 50 },
    buildTimeSec: 6,
    popProvided: 0,
    energyPerSec: -2.0,
    oxygenPerSec: 0,
    foodPerSec: 0,
    regolithPerSec: 3.4,
    shieldBonus: 6,
    garrisonCap: 0,
    color: '#fb923c',
  },
  habitat_pod: {
    type: 'habitat_pod',
    icon: '🏠',
    size: 1,
    hp: 220,
    cost: { regolith: 55, oxygen: 25 },
    buildTimeSec: 5,
    popProvided: 3,
    energyPerSec: -0.8,
    oxygenPerSec: 0,
    foodPerSec: 0,
    regolithPerSec: 0,
    shieldBonus: 5,
    garrisonCap: 2,
    color: '#e2e8f0',
  },
  radiation_bunker: {
    type: 'radiation_bunker',
    icon: '🛡️',
    size: 2,
    hp: 450,
    cost: { regolith: 95, energy: 35 },
    buildTimeSec: 7,
    popProvided: 0,
    energyPerSec: -1.8,
    oxygenPerSec: 0,
    foodPerSec: 0,
    regolithPerSec: 0,
    shieldBonus: 32,
    garrisonCap: 8,
    color: '#f87171',
  },
  kilopower: {
    type: 'kilopower',
    icon: '⚛️',
    size: 2,
    hp: 360,
    cost: { regolith: 120, oxygen: 50 },
    buildTimeSec: 9,
    popProvided: 0,
    energyPerSec: 12.0,
    oxygenPerSec: 0,
    foodPerSec: 0,
    regolithPerSec: 0,
    shieldBonus: 0,
    garrisonCap: 0,
    color: '#a78bfa',
  },
  dsn_antenna: {
    type: 'dsn_antenna',
    icon: '📡',
    size: 1,
    hp: 240,
    cost: { regolith: 85, energy: 50 },
    buildTimeSec: 7,
    popProvided: 0,
    energyPerSec: -1.5,
    oxygenPerSec: 0,
    foodPerSec: 0,
    regolithPerSec: 0,
    shieldBonus: 8,
    garrisonCap: 0,
    color: '#60a5fa',
  },
};

export interface UnitDef {
  type: UnitType;
  icon: string;
  hp: number;
  speed: number;
  carryCapacity: number;
  gatherRate: number;
  cost: Partial<Resources>;
  pop: number;
  radiationResistance: number; // 0..1
}

export const UNIT_DEFS: Record<UnitType, UnitDef> = {
  astronaut: {
    type: 'astronaut',
    icon: '🧑‍🚀',
    hp: 100,
    speed: 2.8,
    carryCapacity: 14,
    gatherRate: 5.5,
    cost: { food: 45, oxygen: 35 },
    pop: 1,
    radiationResistance: 0.25,
  },
  viper_rover: {
    type: 'viper_rover',
    icon: '🤖',
    hp: 160,
    speed: 3.6,
    carryCapacity: 24,
    gatherRate: 8.5,
    cost: { regolith: 60, energy: 45 },
    pop: 1,
    radiationResistance: 0.85,
  },
};

export const ROGUELIKE_CARDS: RoguelikeCard[] = [
  {
    id: 'eclss_98',
    category: 'eclss',
    icon: '♻️',
    titleKey: 'card_eclss_title',
    descKey: 'card_eclss_desc',
    tradeoffKey: 'card_eclss_trade',
    effectId: 'eclss_98',
  },
  {
    id: 'regolith_shield',
    category: 'shield',
    icon: '🧱',
    titleKey: 'card_shield_title',
    descKey: 'card_shield_desc',
    tradeoffKey: 'card_shield_trade',
    effectId: 'regolith_shield',
  },
  {
    id: 'solid_state_battery',
    category: 'power',
    icon: '🔋',
    titleKey: 'card_battery_title',
    descKey: 'card_battery_desc',
    tradeoffKey: 'card_battery_trade',
    effectId: 'solid_state_battery',
  },
  {
    id: 'veggie_led',
    category: 'science',
    icon: '🥬',
    titleKey: 'card_veggie_title',
    descKey: 'card_veggie_desc',
    tradeoffKey: 'card_veggie_trade',
    effectId: 'veggie_led',
  },
  {
    id: 'viper_ai',
    category: 'science',
    icon: '🛰️',
    titleKey: 'card_viper_title',
    descKey: 'card_viper_desc',
    tradeoffKey: 'card_viper_trade',
    effectId: 'viper_ai',
  },
  {
    id: 'donki_early_warning',
    category: 'shield',
    icon: '🌞',
    titleKey: 'card_donki_title',
    descKey: 'card_donki_desc',
    tradeoffKey: 'card_donki_trade',
    effectId: 'donki_early_warning',
  },
];

export { STEM_QUESTIONS } from './questions';

export function getBuildingUpgradeCost(type: BuildingType, targetLevel: number): Partial<Resources> {
  const def = BUILDING_DEFS[type];
  const mult = targetLevel === 2 ? 0.6 : 1.2;
  const regBase = def.cost.regolith || 50;
  const energyBase = def.cost.energy || 30;
  return {
    regolith: Math.max(20, Math.round(regBase * mult)),
    energy: Math.max(15, Math.round(energyBase * mult)),
  };
}

export const ARTEMIS_RANKS: ArtemisRankDef[] = [
  {
    id: 'cadet',
    nameKey: 'rank_cadet_name',
    icon: '🧑‍🚀',
    minXp: 0,
    perkKey: 'rank_cadet_perk',
    descKey: 'rank_cadet_desc',
  },
  {
    id: 'payload_specialist',
    nameKey: 'rank_specialist_name',
    icon: '📦',
    minXp: 250,
    perkKey: 'rank_specialist_perk',
    descKey: 'rank_specialist_desc',
  },
  {
    id: 'base_engineer',
    nameKey: 'rank_engineer_name',
    icon: '🔧',
    minXp: 600,
    perkKey: 'rank_engineer_perk',
    descKey: 'rank_engineer_desc',
  },
  {
    id: 'flight_director',
    nameKey: 'rank_director_name',
    icon: '📡',
    minXp: 1200,
    perkKey: 'rank_director_perk',
    descKey: 'rank_director_desc',
  },
  {
    id: 'artemis_commander',
    nameKey: 'rank_commander_name',
    icon: '🏆',
    minXp: 2000,
    perkKey: 'rank_commander_perk',
    descKey: 'rank_commander_desc',
  },
];

export const ARTEMIS_BADGES: ArtemisBadgeDef[] = [
  {
    id: 'badge_shackleton',
    titleKey: 'badge_shackleton_title',
    descKey: 'badge_shackleton_desc',
    factKey: 'badge_shackleton_fact',
    icon: '🏔️',
    category: 'exploration',
    xpReward: 100,
  },
  {
    id: 'badge_water_hunter',
    titleKey: 'badge_water_title',
    descKey: 'badge_water_desc',
    factKey: 'badge_water_fact',
    icon: '💧',
    category: 'isru',
    xpReward: 120,
  },
  {
    id: 'badge_regolith_master',
    titleKey: 'badge_regolith_title',
    descKey: 'badge_regolith_desc',
    factKey: 'badge_regolith_fact',
    icon: '🧱',
    category: 'engineering',
    xpReward: 140,
  },
  {
    id: 'badge_eclss_guardian',
    titleKey: 'badge_eclss_title',
    descKey: 'badge_eclss_desc',
    factKey: 'badge_eclss_fact',
    icon: '🌱',
    category: 'life_support',
    xpReward: 150,
  },
  {
    id: 'badge_donki_survivor',
    titleKey: 'badge_donki_title',
    descKey: 'badge_donki_desc',
    factKey: 'badge_donki_fact',
    icon: '☀️',
    category: 'space_weather',
    xpReward: 160,
  },
  {
    id: 'badge_viper_navigator',
    titleKey: 'badge_viper_title',
    descKey: 'badge_viper_desc',
    factKey: 'badge_viper_fact',
    icon: '🤖',
    category: 'robotics',
    xpReward: 140,
  },
  {
    id: 'badge_kilopower_pioneer',
    titleKey: 'badge_kilopower_title',
    descKey: 'badge_kilopower_desc',
    factKey: 'badge_kilopower_fact',
    icon: '⚛️',
    category: 'power',
    xpReward: 180,
  },
  {
    id: 'badge_artemis_legend',
    titleKey: 'badge_legend_title',
    descKey: 'badge_legend_desc',
    factKey: 'badge_legend_fact',
    icon: '🚀',
    category: 'mission',
    xpReward: 300,
  },
];

export const DONKI_EDU_CARDS: DonkiEduCard[] = [
  {
    id: 'donki_edu_cme',
    type: 'CME',
    titleKey: 'donki_cme_title',
    whatIsKey: 'donki_cme_what',
    impactKey: 'donki_cme_impact',
    actionKey: 'donki_cme_action',
    quizQuestionKey: 'donki_cme_q',
    quizAnswerKey: 'donki_cme_a',
    severity: 3,
    scienceBonus: 50,
    xpBonus: 100,
  },
  {
    id: 'donki_edu_flr',
    type: 'FLR',
    titleKey: 'donki_flr_title',
    whatIsKey: 'donki_flr_what',
    impactKey: 'donki_flr_impact',
    actionKey: 'donki_flr_action',
    quizQuestionKey: 'donki_flr_q',
    quizAnswerKey: 'donki_flr_a',
    severity: 2,
    scienceBonus: 40,
    xpBonus: 80,
  },
  {
    id: 'donki_edu_sep',
    type: 'SEP',
    titleKey: 'donki_sep_title',
    whatIsKey: 'donki_sep_what',
    impactKey: 'donki_sep_impact',
    actionKey: 'donki_sep_action',
    quizQuestionKey: 'donki_sep_q',
    quizAnswerKey: 'donki_sep_a',
    severity: 3,
    scienceBonus: 60,
    xpBonus: 120,
  },
  {
    id: 'donki_edu_rbe',
    type: 'RBE',
    titleKey: 'donki_rbe_title',
    whatIsKey: 'donki_rbe_what',
    impactKey: 'donki_rbe_impact',
    actionKey: 'donki_rbe_action',
    quizQuestionKey: 'donki_rbe_q',
    quizAnswerKey: 'donki_rbe_a',
    severity: 2,
    scienceBonus: 45,
    xpBonus: 90,
  },
  {
    id: 'donki_edu_gst',
    type: 'GST',
    titleKey: 'donki_gst_title',
    whatIsKey: 'donki_gst_what',
    impactKey: 'donki_gst_impact',
    actionKey: 'donki_gst_action',
    quizQuestionKey: 'donki_gst_q',
    quizAnswerKey: 'donki_gst_a',
    severity: 1,
    scienceBonus: 35,
    xpBonus: 70,
  },
];

export const SPACE_TRIVIA_FACTS: SpaceFactPopup[] = [
  { id: 'fact_shackleton', triggerType: 'phase', triggerKey: '1', factKey: 'fact_shackleton_text', icon: '🏔️', xpBonus: 40 },
  { id: 'fact_solar', triggerType: 'building', triggerKey: 'solar_array', factKey: 'fact_solar_text', icon: '☀️', xpBonus: 35 },
  { id: 'fact_water', triggerType: 'building', triggerKey: 'ice_extractor', factKey: 'fact_water_text', icon: '💧', xpBonus: 40 },
  { id: 'fact_eclss', triggerType: 'building', triggerKey: 'hydroponics', factKey: 'fact_eclss_text', icon: '🌱', xpBonus: 45 },
  { id: 'fact_regolith_o2', triggerType: 'building', triggerKey: 'regolith_printer', factKey: 'fact_regolith_text', icon: '🧱', xpBonus: 40 },
  { id: 'fact_viper', triggerType: 'building', triggerKey: 'habitat_pod', factKey: 'fact_viper_text', icon: '🤖', xpBonus: 40 },
  { id: 'fact_bunker', triggerType: 'building', triggerKey: 'radiation_bunker', factKey: 'fact_bunker_text', icon: '🛡️', xpBonus: 50 },
  { id: 'fact_kilopower', triggerType: 'building', triggerKey: 'kilopower', factKey: 'fact_kilopower_text', icon: '⚛️', xpBonus: 55 },
  { id: 'fact_gateway', triggerType: 'phase', triggerKey: '3', factKey: 'fact_gateway_text', icon: '🛰️', xpBonus: 60 },
  { id: 'fact_mars', triggerType: 'phase', triggerKey: '4', factKey: 'fact_mars_text', icon: '🪐', xpBonus: 80 },
];

