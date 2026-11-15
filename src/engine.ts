import { FLIGHT_DURATION_SEC, MISSION_PRICES, initialExpedition, landingSite, validExpedition } from './expedition';
import { newTutorial, ROCKET, requestedBuilding, rocketOverlap, dispatch, tickTutorial, checkMissionFailure, TUTORIAL_COSTS, MISSION_REWARD, type TutorialBuilding } from './surfaceTutorial';
import { craterOverlaps, nearestWalkable, layoutFor, POLAR_RESEARCH_SITE } from './lunarTerrain';
import { initialCampaign, campaignOf, allEquipmentOwned, polarMission, crewCount, missionReward, EQUIPMENT, EQUIPMENT_PRICE, POLAR_MISSION_PRICE, type EquipmentId } from './campaign';
import {
  ARTEMIS_BADGES,
  ARTEMIS_RANKS,
  BUILDING_DEFS,
  CLASSROOM_MATCH_SEC,
  DONKI_EDU_CARDS,
  INITIAL_RESOURCES,
  MAP_SIZE,
  SAVE_STORAGE_KEY,
  SOL_DURATION_SEC,
  SPACE_TRIVIA_FACTS,
  TICK_RATE,
  UNIT_DEFS,
  getBuildingUpgradeCost,
} from './constants';
import type {
  ActiveCrisis,
  AstronautRank,
  BadgeId,
  Building,
  BuildingType,
  GameMode,
  GameStateSnapshot,
  MapClickableEvent,
  NasaDonkiAlert,
  PowerPriority,
  ResourceKey,
  ResourceNode,
  Resources,
  SpaceFactPopup,
  Unit,
  UnitType,
} from './types';
import { ARCHIVED_ALERTS, SCIENCE, lunarIceSites, terrainExposure, LUNAR_ONE_WAY_LIGHT_SEC } from './science';

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

class SeededRng {
  private state: number;
  constructor(seed: string) {
    this.state = hashSeed(seed) || 123456789;
  }
  snapshot(): number { return this.state; }
  restore(state: number): void { this.state = state >>> 0; }
  next(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 4294967296;
  }
}

export interface EngineCallbacks {
  onSolEnd: () => void;
  onCrisisStart: (crisis: ActiveCrisis) => void;
  onSound: (kind: 'build' | 'alert' | 'success' | 'harvest') => void;
  onRankUp?: (rank: AstronautRank) => void;
  onBadgeUnlocked?: (id: BadgeId) => void;
}

export class ArtemisEngine {
  state: GameStateSnapshot;
  private rng: SeededRng;
  private nextEntityId = 100;
  private callbacks: EngineCallbacks;
  private pausedForModal = false;
  private saveTickCounter = 0;
  private dropSpawnTimer = 16;
  saveSlot = 'guest';
  onSave?: (state: GameStateSnapshot) => void;

  constructor(callbacks: EngineCallbacks, mode: GameMode = 'campaign', seedCode = 'ARTEMIS-7A') {
    this.callbacks = callbacks;
    this.rng = new SeededRng(seedCode);
    this.state = this.createInitialState(mode, seedCode);
  }

  private createInitialState(mode: GameMode, seedCode: string): GameStateSnapshot {
    this.rng = new SeededRng(seedCode);
    this.nextEntityId = 100;
    this.dropSpawnTimer = 16;
    const center = Math.floor(MAP_SIZE / 2);

    const nodes: ResourceNode[] = [];
    for (const site of lunarIceSites()) {
      nodes.push({
        id: this.nextEntityId++,
        type: 'ice_crater',
        x: site.x,
        y: site.y,
        sourceSiteId: site.id,
        amount: 450,
        maxAmount: 450,
      });
    }
    const regOffsets = [
      [-3, 5],
      [5, 3],
      [-6, -5],
      [6, -6],
      [-9, 4],
      [9, -4],
      [2, -8],
      [-2, 8],
    ];
    for (const [dx, dy] of regOffsets) {
      nodes.push({
        id: this.nextEntityId++,
        type: 'regolith_vein',
        x: center + dx,
        y: center + dy,
        amount: 550,
        maxAmount: 550,
      });
    }

    const buildings: Building[] = [
      this.makeBuilding('command_center', center - 1, center - 1, true),
      this.makeBuilding('solar_array', center + 3, center - 1, true),
      this.makeBuilding('hydroponics', center - 4, center - 1, true),
    ];

    const units: Unit[] = [
      this.makeUnit('astronaut', center + 1.5, center + 2.2),
      this.makeUnit('astronaut', center - 1.5, center + 2.5),
      this.makeUnit('viper_rover', center + 2.5, center + 1.2),
    ];

    units[0].targetNodeId = nodes[0].id;
    units[0].state = 'moving';
    units[1].targetNodeId = nodes[8].id;
    units[1].state = 'moving';
    units[2].targetNodeId = nodes[1].id;
    units[2].state = 'moving';


    return {
      scienceVersion: SCIENCE.version,
      radiationTerrainId: 'terrain-b',
      pendingTrade: null,
      mode,
      seedCode,
      sol: 1,
      solTimerSec: SOL_DURATION_SEC,
      solDurationSec: SOL_DURATION_SEC,
      expedition: initialExpedition(),
      campaign: initialCampaign(),
      resources: { ...INITIAL_RESOURCES },
      shieldIntegrity: 100,
      radiationLevel: 0,
      lifeSupportHealth: 100,
      powerPriority: 'balanced',
      powerNetPerSec: 0,
      pop: units.length,
      popCap: BUILDING_DEFS.command_center.popProvided,
      score: 0,
      xp: 0,
      rank: 'cadet',
      stormsSurvived: 0,
      activeCards: [],
      activeCrisis: null,
      classroomTimeLeftSec: CLASSROOM_MATCH_SEC,
      gameOver: false,
      victory: false,
      lossReason: null,
      nodes,
      buildings,
      units,
      floatingTexts: [],
      donkiAlerts: ARCHIVED_ALERTS.map(a => ({ ...a })),
      nasaAlerts: ARCHIVED_ALERTS.map(a => ({ ...a })),
      unlockedBadges: [],
      readDonkiCardIds: [],
      discoveredFactIds: [],
      clickableEvents: [],
      dayNightCycle: 1.0,
      screenShakeSec: 0,
    };
  }

  private makeBuilding(type: BuildingType, x: number, y: number, built: boolean): Building {
    const def = BUILDING_DEFS[type];
    return {
      id: this.nextEntityId++,
      type,
      x,
      y,
      size: def.size,
      hp: def.hp,
      maxHp: def.hp,
      level: 1,
      progress: built ? 1 : 0,
      built,
      garrisonedIds: [],
    };
  }

  private makeUnit(type: UnitType, x: number, y: number): Unit {
    const def = UNIT_DEFS[type];
    return {
      id: this.nextEntityId++,
      type,
      x,
      y,
      hp: def.hp,
      maxHp: def.hp,
      targetX: null,
      targetY: null,
      state: 'idle',
      targetNodeId: null,
      targetBuildingId: null,
      carryType: null,
      carryAmount: 0,
      shelterBuildingId: null,
      radiationDose: 0,
    };
  }

  setPausedForModal(v: boolean): void {
    this.pausedForModal = v;
  }

  setDonkiAlerts(alerts: NasaDonkiAlert[]): void {
    this.state.donkiAlerts = alerts;
    this.state.nasaAlerts = alerts;
  }

  loadSavedCampaign(mode: GameMode = 'campaign', seedCode?: string): boolean {
    try {
      const storage = mode === 'classroom' ? sessionStorage : localStorage;
      const key = mode === 'classroom' ? `${SAVE_STORAGE_KEY}_class_${seedCode}_${this.saveSlot}` : `${SAVE_STORAGE_KEY}_${this.saveSlot}`;
      const raw = storage.getItem(key);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as GameStateSnapshot;
      if (!parsed || !Array.isArray(parsed.buildings) || !validExpedition(parsed.expedition)) return false;
      if (parsed.mode !== mode || (mode === 'classroom' && parsed.seedCode !== seedCode)) return false;
      this.state = parsed;
      this.state.resources.water ??= INITIAL_RESOURCES.water;
      if (this.state.tutorial) {
        const t=this.state.tutorial;
        this.state.nodes=[];
        // Retired currency only exists for compatibility with the archived free engine.
        this.state.resources.regolith=0;
        if(t.version===1){
          this.state.xp=Math.min(20,Math.floor((this.state.xp??0)/5));
          if(t.rewardPaid){this.state.expedition.coins+=MISSION_REWARD.coins-200;this.state.xp+=MISSION_REWARD.knowledge;}
          if(t.step==='radiation'){t.step='warning';t.elapsed=0;}
          if(t.step==='data-home')t.step='level-up';
          t.version=2;
        }
        this.migrateCraterPositions();
      }
      campaignOf(this.state);
      this.rng = new SeededRng(parsed.seedCode);
      if (Number.isInteger(parsed.rngState) && parsed.rngState! > 0 && parsed.rngState! <= 0xffffffff) this.rng.restore(parsed.rngState!);
      if (Number.isFinite(parsed.nextDropInSec) && parsed.nextDropInSec! >= 0 && parsed.nextDropInSec! <= 40) this.dropSpawnTimer = parsed.nextDropInSec!;
      // Preserve old village layouts. Do not retroactively label synthetic nodes as M3 points.
      this.state.pendingTrade ??= null;
      this.state.radiationTerrainId ??= 'terrain-b';
      this.state.donkiAlerts = ARCHIVED_ALERTS.map(a => ({ ...a }));
      this.state.nasaAlerts = this.state.donkiAlerts;
      this.state.floatingTexts = [];
      if (this.state.xp === undefined) this.state.xp = 0;
      if (!this.state.rank) this.state.rank = 'cadet';
      if (!Array.isArray(this.state.unlockedBadges)) this.state.unlockedBadges = [];
      if (!Array.isArray(this.state.readDonkiCardIds)) this.state.readDonkiCardIds = [];
      if (!Array.isArray(this.state.discoveredFactIds)) this.state.discoveredFactIds = [];
      if (!Array.isArray(this.state.clickableEvents)) this.state.clickableEvents = [];
      if (this.state.dayNightCycle === undefined) this.state.dayNightCycle = 1.0;
      if (this.state.screenShakeSec === undefined) this.state.screenShakeSec = 0;

      let maxId = 100;
      for (const b of this.state.buildings) maxId = Math.max(maxId, b.id + 1);
      for (const u of this.state.units) maxId = Math.max(maxId, u.id + 1);
      for (const n of this.state.nodes) maxId = Math.max(maxId, n.id + 1);
      for (const event of this.state.clickableEvents) maxId = Math.max(maxId, event.id + 1);
      if (Number.isSafeInteger(parsed.entitySequence)) maxId = Math.max(maxId, parsed.entitySequence!);
      this.nextEntityId = maxId;
      return true;
    } catch {
      return false;
    }
  }

  saveCampaign(): void {
    try {
      this.state.rngState = this.rng.snapshot();
      this.state.nextDropInSec = this.dropSpawnTimer;
      this.state.entitySequence = this.nextEntityId;
      const classroom = this.state.mode === 'classroom';
      const storage = classroom ? sessionStorage : localStorage;
      const key = classroom ? `${SAVE_STORAGE_KEY}_class_${this.state.seedCode}_${this.saveSlot}` : `${SAVE_STORAGE_KEY}_${this.saveSlot}`;
      storage.setItem(key, JSON.stringify(this.state));
      this.onSave?.(this.state);
    } catch {
      // ignora erro de quota
    }
  }

  resetMission(mode: GameMode, seedCode: string): void {
    this.state = this.createInitialState(mode, seedCode);
    this.pausedForModal = false;
    this.saveCampaign();
  }

  acceptInvestment(): boolean {
    const e = this.state.expedition;
    if (e.stage !== 'briefing') return false;
    e.coins = 100;
    e.stage = 'missions';
    this.saveCampaign();
    return true;
  }

  bookMission(destination: 'moon' | 'mars'): boolean {
    const e = this.state.expedition;
    const campaign=campaignOf(this.state),polar=campaign.completed.some(m=>m.id==='first-steps');
    const price=polar?POLAR_MISSION_PRICE:MISSION_PRICES.moon;
    if (e.stage !== 'missions' || e.coins < price) return false;
    // The tutorial's investment funds the Moon. Mars is a future expedition.
    if (destination !== 'moon') return false;
    if(polar&&(!allEquipmentOwned(this.state)||campaign.completed.some(m=>m.id==='polar-craters')))return false;
    delete this.state.tutorial;
    e.missionId=polar?'polar-craters':'first-steps';e.crewSize=3;
    e.coins -= price;
    e.destination = destination;
    e.landingSiteId=null;e.flightElapsedSec=0;
    this.state.victory=false;this.state.gameOver=false;this.state.lossReason=null;
    if(polar)this.state.resources={...INITIAL_RESOURCES,regolith:0};
    e.stage = 'landing';
    this.saveCampaign();
    return true;
  }

  previewLandingSite(id: string): boolean {
    if (this.state.expedition.stage !== 'landing' || !landingSite(id)) return false;
    this.state.expedition.landingSiteId = id;
    this.saveCampaign();
    return true;
  }

  launchExpedition(): boolean {
    const e = this.state.expedition;
    const site = landingSite(e.landingSiteId);
    if (e.stage !== 'landing' || !site) return false;
    if(polarMission(this.state)) {
      if(site.id!=='south-polar')return false;
      e.stage='crew';this.saveCampaign();return true;
    }
    if(e.coins<site.extraCost)return false;
    e.coins -= site.extraCost;
    e.flightElapsedSec = 0;
    e.stage = 'flight';
    this.saveCampaign();
    return true;
  }

  completeLanding(): boolean {
    const e = this.state.expedition;
    if (e.stage !== 'flight' || e.flightElapsedSec < FLIGHT_DURATION_SEC) return false;
    if (e.landingSiteId === 'equatorial') {
      // Polar detections must not be moved to an equatorial landing site.
      this.state.nodes = this.state.nodes.filter(n => n.type !== 'ice_crater');
      for (const u of this.state.units) {
        u.targetNodeId = null; u.targetX = null; u.targetY = null;
        u.state = 'idle';
      }
    }
    e.stage = 'surface';
    this.state.tutorial = newTutorial();
    this.state.buildings = [];
    this.state.units = [0,1,2].map(() => {
      const u = this.makeUnit('astronaut', ROCKET.x, ROCKET.y);
      u.state = 'sheltered'; u.shelterBuildingId = -1; return u;
    });
    this.state.nodes = [];
    this.state.resources.regolith = 0;
    this.state.radiationLevel = 0;
    if(polarMission(this.state))this.state.units=Array.from({length:crewCount(this.state)},()=>{
      const u=this.makeUnit('astronaut',ROCKET.x,ROCKET.y);u.state='sheltered';u.shelterBuildingId=-1;return u;
    });
    if(!polarMission(this.state))this.state.xp=0;
    this.state.pop = this.state.units.length; this.state.popCap = 6;
    this.pausedForModal = false;
    this.saveCampaign();
    return true;
  }

  openCampaignScreen(screen:'hub'|'profile'|'science-center'|'missions'):boolean {
    if(!campaignOf(this.state).completed.length || !['completed','hub','profile','science-center','missions'].includes(this.state.expedition.stage))return false;
    if(this.state.replay)return screen==='hub'?this.returnToMenu():false;
    this.state.victory=false;this.state.gameOver=false;
    this.state.expedition.stage=screen;
    if(screen==='missions'){
      delete this.state.tutorial;
      this.state.expedition.destination=null;this.state.expedition.landingSiteId=null;
      this.state.expedition.missionId='polar-craters';this.state.expedition.flightElapsedSec=0;
    }
    this.saveCampaign();return true;
  }

  returnToMenu():boolean {
    if(this.state.replay){
      const saved=this.state.replay,mode=this.state.mode,seed=this.state.seedCode;
      this.state=this.createInitialState(mode,seed);
      this.state.campaign=saved.campaign;this.state.xp=saved.knowledge;this.state.score=saved.score;
      this.state.expedition={...initialExpedition(),stage:'hub',coins:saved.coins};
      this.pausedForModal=false;this.saveCampaign();return true;
    }
    return this.openCampaignScreen('hub');
  }

  replayTutorial():boolean {
    if(!['completed','hub'].includes(this.state.expedition.stage)||this.state.gameOver)return false;
    const checkpoint=this.state.replay??{campaign:structuredClone(campaignOf(this.state)),coins:this.state.expedition.coins,knowledge:this.state.xp,score:this.state.score};
    this.state=this.createInitialState(this.state.mode,this.state.seedCode);
    this.state.replay=checkpoint;this.pausedForModal=false;this.saveCampaign();return true;
  }

  renamePlayer(name:string):boolean {
    const clean=name.trim().replace(/\s+/g,' ');
    if(this.state.expedition.stage!=='profile'||clean.length<2||clean.length>24||!/^[\p{L}\p{N} ._-]+$/u.test(clean))return false;
    campaignOf(this.state).displayName=clean;this.saveCampaign();return true;
  }

  buyEquipment(id:EquipmentId):boolean {
    if(this.state.expedition.stage!=='science-center'||!EQUIPMENT.some(i=>i.id===id))return false;
    const c=campaignOf(this.state),owned=c.equipment[id],level=1+Math.floor(this.state.xp/20);
    if(owned>=2||level<owned+2||this.state.expedition.coins<EQUIPMENT_PRICE)return false;
    this.state.expedition.coins-=EQUIPMENT_PRICE;c.equipment[id]++;
    this.callbacks.onSound('success');this.saveCampaign();return true;
  }

  setCrewSize(count:number):boolean {
    if(this.state.expedition.stage!=='crew'||!Number.isInteger(count)||count<1||count>6)return false;
    this.state.expedition.crewSize=count;this.saveCampaign();return true;
  }

  launchPreparedExpedition():boolean {
    const e=this.state.expedition;
    if(e.stage!=='crew'||!polarMission(this.state)||e.landingSiteId!=='south-polar'||!allEquipmentOwned(this.state))return false;
    e.stage='flight';e.flightElapsedSec=0;this.saveCampaign();return true;
  }

  retryTutorial():boolean {
    if(!this.state.gameOver)return false;
    if(polarMission(this.state)){
      delete this.state.tutorial;
      this.state.gameOver=false;this.state.victory=false;this.state.lossReason=null;
      this.state.expedition.stage='crew';this.state.expedition.flightElapsedSec=0;
      this.state.resources={...INITIAL_RESOURCES,regolith:0};
      this.state.xp=campaignOf(this.state).completed.reduce((n,m)=>n+m.knowledge,0);
      this.saveCampaign();return true;
    }
    const replay=this.state.replay;
    this.resetMission(this.state.mode,this.state.seedCode);this.state.replay=replay;this.saveCampaign();return true;
  }

  canAfford(cost: Partial<Resources>): boolean {
    for (const [k, v] of Object.entries(cost)) {
      if ((v ?? 0) > this.state.resources[k as ResourceKey]) return false;
    }
    return true;
  }

  buildTutorial(type: TutorialBuilding, x: number, y: number): boolean {
    const t = this.state.tutorial;
    if (!t || this.state.gameOver || requestedBuilding(this.state) !== type || !Number.isInteger(x) || !Number.isInteger(y)) return false;
    const cost = TUTORIAL_COSTS[type];
    if (!this.canAfford(cost) || !this.canPlaceBuilding(type, x, y)) return false;
    this.spend(cost);
    const b = this.makeBuilding(type, x, y, false);
    this.state.buildings.push(b);
    if (type === 'command_center') { t.baseId = b.id; t.step = 'base-build'; }
    else if(type==='dsn_antenna') { t.antennaId = b.id; t.step = 'antenna-build'; }
    else {t.activeBuildingId=b.id;t.step='equipment-build';}
    t.elapsed = 0;
    dispatch(this.state, x + b.size / 2, y + b.size + .3);
    checkMissionFailure(this.state);
    this.callbacks.onSound('build'); this.saveCampaign(); return true;
  }

  sendTutorialData(): boolean {
    const t = this.state.tutorial;
    if (!t || t.step !== 'antenna-ready' || this.state.gameOver) return false;
    t.step = 'transmitting'; t.elapsed = 0; t.transmitStartKnowledge=this.state.xp; this.saveCampaign(); return true;
  }

  acknowledgeKnowledge(): boolean {
    const t = this.state.tutorial;
    if (!t || t.step !== 'level-up' || this.state.gameOver) return false;
    t.step = 'data-home'; t.elapsed = 0; this.saveCampaign(); return true;
  }

  private migrateCraterPositions():void {
    let relocated=false;
    for(const b of this.state.buildings){
      if(!craterOverlaps(b.x,b.y,b.size,layoutFor(this.state)))continue;
      let target:{x:number;y:number}|null=null,distance=Infinity;
      for(let y=1;y<MAP_SIZE-b.size;y++)for(let x=1;x<MAP_SIZE-b.size;x++){
        const d=Math.hypot(x-b.x,y-b.y);
        if(d<distance&&this.canPlaceBuilding(b.type,x,y)){target={x,y};distance=d;}
      }
      if(target){b.x=target.x;b.y=target.y;relocated=true;}
    }
    for(const u of this.state.units){
      if(u.state==='sheltered'){
        const b=this.state.buildings.find(b=>b.id===u.shelterBuildingId);
        if(b){u.x=b.x+b.size/2;u.y=b.y+b.size/2;}
      }
      const p=nearestWalkable(u,layoutFor(this.state));u.x=p.x;u.y=p.y;
      if(u.targetX!==null&&u.targetY!==null){
        const home=this.state.buildings.find(b=>b.id===u.shelterBuildingId);
        const destination=nearestWalkable(home?{x:home.x+home.size/2,y:home.y+home.size/2}:{x:u.targetX,y:u.targetY},layoutFor(this.state));u.targetX=destination.x;u.targetY=destination.y;
      }
      // Replan from the restored position using current obstacles.
      delete u.route;
    }
    const t=this.state.tutorial!;
    if(relocated && ['base-build','antenna-build','equipment-build'].includes(t.step)){
      const b=this.state.buildings.find(b=>b.id===(t.step==='base-build'?t.baseId:t.step==='antenna-build'?t.antennaId:t.activeBuildingId));
      if(b)dispatch(this.state,b.x+b.size/2,b.y+b.size+.3);
    }
  }

  shelterTutorialCrew(): boolean {
    const t = this.state.tutorial;
    if (!t || !['radiation','warning','storm','return-ready'].includes(t.step)) return false;
    const b = this.state.buildings.find(b => b.id === t.baseId)!;
    if (this.state.units.every(u => u.state === 'sheltered')) return true;
    dispatch(this.state, b.x + b.size / 2, b.y + b.size / 2, b.id);
    this.saveCampaign(); return true;
  }

  prepareReturn(): boolean {
    const t = this.state.tutorial;
    if (!t || t.step !== 'return-ready' || this.state.gameOver) return false;
    t.step = 'boarding'; dispatch(this.state, ROCKET.x, ROCKET.y, -1);
    this.saveCampaign(); return true;
  }

  private spend(cost: Partial<Resources>): void {
    for (const [k, v] of Object.entries(cost)) {
      this.state.resources[k as ResourceKey] -= v ?? 0;
    }
  }

  private hasCard(effectId: string): boolean {
    return this.state.activeCards.includes(effectId);
  }

  addXp(amount: number): void {
    this.state.xp += amount;
    let highestRank: AstronautRank = 'cadet';
    for (const r of ARTEMIS_RANKS) {
      if (this.state.xp >= r.minXp) {
        highestRank = r.id;
      }
    }
    if (highestRank !== this.state.rank) {
      this.state.rank = highestRank;
      this.state.score += 300;
      const rDef = ARTEMIS_RANKS.find((r) => r.id === highestRank);
      const cc = this.state.buildings.find((b) => b.type === 'command_center');
      if (cc) {
        this.addFloatingText(cc.x, cc.y, `RANK: ${rDef?.icon || '🏆'}!`, '#facc15');
      }
      this.callbacks.onSound('success');
      if (this.callbacks.onRankUp) {
        this.callbacks.onRankUp(highestRank);
      }
    }
  }

  checkBadges(): void {
    const bBuilt = this.state.buildings.filter((b) => b.built);
    const uList = this.state.units;
    const hasHabitat = bBuilt.some((b) => b.type === 'habitat_pod');
    const hasPrinter = bBuilt.some((b) => b.type === 'regolith_printer');
    const hasKilopower = bBuilt.some((b) => b.type === 'kilopower');
    const roverCount = uList.filter((u) => u.type === 'viper_rover').length;

    const tryUnlock = (id: BadgeId): void => {
      if (this.state.unlockedBadges.includes(id)) return;
      this.state.unlockedBadges.push(id);
      const bDef = ARTEMIS_BADGES.find((b) => b.id === id);
      if (bDef) {
        this.addXp(bDef.xpReward);
        this.state.score += bDef.xpReward * 2;
        const cc = this.state.buildings.find((b) => b.type === 'command_center');
        if (cc) {
          this.addFloatingText(cc.x, cc.y, `MEDALHA: ${bDef.icon}!`, '#facc15');
        }
        this.callbacks.onSound('success');
        if (this.callbacks.onBadgeUnlocked) {
          this.callbacks.onBadgeUnlocked(id);
        }
      }
    };

    if (hasHabitat) tryUnlock('badge_shackleton');
    if (this.state.resources.oxygen >= 250 || this.state.score >= 500) tryUnlock('badge_water_hunter');
    if (hasPrinter && this.state.shieldIntegrity >= 80) tryUnlock('badge_regolith_master');
    if (this.state.sol >= 3 && this.state.lifeSupportHealth >= 95) tryUnlock('badge_eclss_guardian');
    if (this.state.stormsSurvived >= 1 && this.state.lifeSupportHealth >= 80) tryUnlock('badge_donki_survivor');
    if (roverCount >= 2) tryUnlock('badge_viper_navigator');
    if (hasKilopower && this.state.activeCrisis?.kind === 'lunar_night') tryUnlock('badge_kilopower_pioneer');
    if (this.state.sol >= 6 && this.state.stormsSurvived >= 3) tryUnlock('badge_artemis_legend');
  }

  findBuildingAt(wx: number, wy: number): Building | null {
    for (const b of this.state.buildings) {
      const s = BUILDING_DEFS[b.type].size;
      if (wx >= b.x - 0.2 && wx <= b.x + s + 0.2 && wy >= b.y - 0.2 && wy <= b.y + s + 0.2) {
        return b;
      }
    }
    return null;
  }

  findClickableEventAt(wx: number, wy: number): MapClickableEvent | null {
    for (const ev of this.state.clickableEvents) {
      if (Math.hypot(ev.x - wx, ev.y - wy) < 1.4) {
        return ev;
      }
    }
    return null;
  }

  upgradeBuilding(buildingId: number): boolean {
    const b = this.state.buildings.find((item) => item.id === buildingId);
    if (!b || !b.built || b.level >= 3) return false;

    const nextLevel = b.level + 1;
    const cost = getBuildingUpgradeCost(b.type, nextLevel);
    if (!this.canAfford(cost)) return false;

    this.spend(cost);
    b.level = nextLevel;
    b.maxHp = Math.round(b.maxHp * 1.5);
    b.hp = b.maxHp;

    this.state.score += 150;
    this.addXp(80);
    this.callbacks.onSound('success');
    const stars = nextLevel === 2 ? '★★☆' : '★★★';
    this.addFloatingText(b.x + 0.5, b.y + 0.5, `EVOLUIU: ${stars}!`, '#facc15');

    this.checkBadges();
    return true;
  }

  claimClickableEvent(id: number): boolean {
    const idx = this.state.clickableEvents.findIndex((e) => e.id === id);
    if (idx < 0) return false;
    const ev = this.state.clickableEvents[idx];
    this.state.clickableEvents.splice(idx, 1);

    if (ev.type === 'supply_pod') {
      this.state.resources.energy = Math.min(999, this.state.resources.energy + 30);
      this.state.resources.oxygen = Math.min(999, this.state.resources.oxygen + 30);
      this.state.resources.food = Math.min(999, this.state.resources.food + 30);
      this.state.resources.regolith = Math.min(999, this.state.resources.regolith + 30);
      this.addFloatingText(ev.x, ev.y, '+30 TUDO!', '#38bdf8');
      this.addXp(60);
    } else {
      this.state.resources.regolith = Math.min(999, this.state.resources.regolith + 55);
      this.state.score += 120;
      this.addFloatingText(ev.x, ev.y, '+55 REG & conhecimento!', '#fb923c');
      this.addXp(80);
    }
    this.state.score += 80;
    this.callbacks.onSound('success');
    return true;
  }

  readDonkiCard(cardId: string): boolean {
    if (this.state.readDonkiCardIds.includes(cardId)) return false;
    this.state.readDonkiCardIds.push(cardId);
    const card = DONKI_EDU_CARDS.find((c) => c.id === cardId);
    const xp = card?.xpBonus || 80;
    const sci = card?.scienceBonus || 40;
    this.addXp(xp);
    this.state.score += sci * 3;
    this.state.resources.energy = Math.min(999, this.state.resources.energy + 20);
    this.state.resources.oxygen = Math.min(999, this.state.resources.oxygen + 20);
    this.callbacks.onSound('success');
    return true;
  }

  discoverFact(factId: string): SpaceFactPopup | null {
    if (this.state.discoveredFactIds.includes(factId)) return null;
    this.state.discoveredFactIds.push(factId);
    const fact = SPACE_TRIVIA_FACTS.find((f) => f.id === factId);
    if (fact) {
      this.addXp(fact.xpBonus);
      this.state.score += fact.xpBonus * 2;
      const cc = this.state.buildings.find((b) => b.type === 'command_center');
      if (cc) {
        this.addFloatingText(cc.x, cc.y, `CIÊNCIA NASA: ${fact.icon}!`, '#38bdf8');
      }
    }
    return fact || null;
  }

  applyCrisisIntervention(action: 'boost_shields' | 'shelter_all'): boolean {
    if (!this.state.activeCrisis) return false;
    if (action === 'boost_shields') {
      if (this.state.resources.energy < 25) return false;
      this.state.resources.energy -= 25;
      this.state.shieldIntegrity = Math.min(100, this.state.shieldIntegrity + 35);
      this.addXp(30);
      this.callbacks.onSound('success');
      const cc = this.state.buildings.find((b) => b.type === 'command_center');
      if (cc) this.addFloatingText(cc.x, cc.y, 'ESCUDO REFORÇADO!', '#38bdf8');
      return true;
    }
    if (action === 'shelter_all') {
      this.toggleShelterAll();
      this.state.shieldIntegrity = Math.min(100, this.state.shieldIntegrity + 15);
      this.addXp(30);
      return true;
    }
    return false;
  }

  canPlaceBuilding(type: BuildingType, gx: number, gy: number): boolean {
    if (this.state.tutorial && rocketOverlap(type, gx, gy)) return false;
    const def = BUILDING_DEFS[type];
    if(this.state.tutorial && craterOverlaps(gx,gy,def.size,layoutFor(this.state)))return false;
    if(this.state.tutorial && polarMission(this.state) && type==='ice_extractor' && Math.hypot(gx+def.size/2-POLAR_RESEARCH_SITE.x,gy+def.size/2-POLAR_RESEARCH_SITE.y)>5)return false;
    if (gx < 1 || gy < 1 || gx + def.size > MAP_SIZE - 1 || gy + def.size > MAP_SIZE - 1) return false;

    for (const b of this.state.buildings) {
      const bDef = BUILDING_DEFS[b.type];
      const overlapX = gx < b.x + bDef.size && gx + def.size > b.x;
      const overlapY = gy < b.y + bDef.size && gy + def.size > b.y;
      if (overlapX && overlapY) return false;
    }
    for (const n of this.state.nodes) {
      if (n.amount <= 0) continue;
      if (
        n.x >= gx - 0.5 &&
        n.x < gx + def.size + 0.5 &&
        n.y >= gy - 0.5 &&
        n.y < gy + def.size + 0.5
      ) {
        return false;
      }
    }
    return true;
  }

  placeBuilding(type: BuildingType, gx: number, gy: number): boolean {
    if (this.state.tutorial) return false;
    const def = BUILDING_DEFS[type];
    if (!this.canAfford(def.cost) || !this.canPlaceBuilding(type, gx, gy)) {
      return false;
    }
    this.spend(def.cost);
    const b = this.makeBuilding(type, gx, gy, false);
    this.state.buildings.push(b);

    const builder = this.findNearestAvailableUnit(gx + def.size / 2, gy + def.size / 2);
    if (builder) {
      builder.targetBuildingId = b.id;
      builder.targetNodeId = null;
      builder.state = 'building';
    }
    this.callbacks.onSound('build');
    this.addFloatingText(gx, gy, `+${def.icon}`, '#38bdf8');

    // Quests e fatos pedagogicos
    if (type === 'solar_array') {
      this.discoverFact('fact_solar');
    } else if (type === 'ice_extractor') {
      this.discoverFact('fact_water');
    } else if (type === 'hydroponics') {
      this.discoverFact('fact_eclss');
    } else if (type === 'radiation_bunker') {
      this.discoverFact('fact_bunker');
    } else if (type === 'regolith_printer') {
      this.discoverFact('fact_regolith_o2');
    } else if (type === 'habitat_pod') {
      this.discoverFact('fact_viper');
    } else if (type === 'kilopower') {
      this.discoverFact('fact_kilopower');
    }

    this.checkBadges();
    return true;
  }

  trainUnit(type: UnitType): boolean {
    const def = UNIT_DEFS[type];
    if (this.state.pop + def.pop > this.state.popCap) return false;
    if (!this.canAfford(def.cost)) return false;

    const cc =
      this.state.buildings.find((b) => b.type === 'command_center' && b.built) ??
      this.state.buildings[0];
    if (!cc) return false;

    this.spend(def.cost);
    const u = this.makeUnit(
      type,
      cc.x + 1 + (this.rng.next() - 0.5),
      cc.y + 2.5 + (this.rng.next() - 0.5)
    );
    const nearestNode = this.findNearestNode(u.x, u.y);
    if (nearestNode) {
      u.targetNodeId = nearestNode.id;
      u.state = 'moving';
    }
    this.state.units.push(u);
    this.recomputePop();
    this.callbacks.onSound('build');
    this.addFloatingText(u.x, u.y, `${def.icon}`, '#4ade80');

    if (type === 'astronaut') {
    }
    this.checkBadges();
    return true;
  }

  tradeViaDsn(sell: ResourceKey, buy: ResourceKey): boolean {
    if (sell === buy || this.state.pendingTrade) return false;
    const hasDsn = this.state.buildings.some((b) => b.type === 'dsn_antenna' && b.built);
    const costAmount = hasDsn ? 40 : 50;
    const gainAmount = 35;
    if (this.state.resources[sell] < costAmount) return false;
    this.state.resources[sell] -= costAmount;
    // Radio delay only. Supplies are a teaching abstraction, not instant rocket delivery.
    this.state.pendingTrade = { buy, amount: gainAmount,
      remainingSec: this.state.expedition.destination === 'mars' ? 24 : LUNAR_ONE_WAY_LIGHT_SEC * 2 };
    this.callbacks.onSound('build');
    return true;
  }

  setPowerPriority(prio: PowerPriority): void {
    this.state.powerPriority = prio;
  }

  selectRadiationTerrain(id: string): boolean {
    if(this.state.tutorial)return false;
    if (this.state.expedition.destination === 'mars' || this.state.expedition.landingSiteId === 'equatorial' || !SCIENCE.radiationSamples.some(s => s.id === id) || this.state.radiationTerrainId === id) return false;
    if (!this.canAfford({energy:15,regolith:10})) return false;
    this.spend({energy:15,regolith:10});
    this.state.radiationTerrainId = id;
    return true;
  }

  toggleShelterAll(): boolean {
    if (this.state.tutorial) return this.shelterTutorialCrew();
    const anySheltered = this.state.units.some((u) => u.state === 'sheltered');
    if (anySheltered) {
      for (const b of this.state.buildings) b.garrisonedIds = [];
      for (const u of this.state.units) {
        if (u.state === 'sheltered') {
          u.state = 'idle';
          u.shelterBuildingId = null;
          const node = this.findNearestNode(u.x, u.y);
          if (node) {
            u.targetNodeId = node.id;
            u.state = 'moving';
          }
        }
      }
      return false;
    }

    const shelters = this.state.buildings.filter(
      (b) => b.built && BUILDING_DEFS[b.type].garrisonCap > 0
    );
    if (shelters.length === 0) return false;

    for (const u of this.state.units) {
      if (u.type === 'viper_rover') continue;
      for (const sh of shelters) {
        const cap = BUILDING_DEFS[sh.type].garrisonCap;
        if (sh.garrisonedIds.length < cap) {
          u.shelterBuildingId = sh.id;
          u.targetBuildingId = sh.id;
          u.targetNodeId = null;
          u.state = 'moving';
          break;
        }
      }
    }
    this.callbacks.onSound('alert');
    return true;
  }

  commandWorldTap(wx: number, wy: number): void {
    if (this.state.tutorial) return;
    // 1. Verifica se clicou em um predio em construcao (toque ajuda a construir estilo Stardew!)
    const bHit = this.state.buildings.find((b) => {
      const s = BUILDING_DEFS[b.type].size;
      return wx >= b.x - 0.3 && wx <= b.x + s + 0.3 && wy >= b.y - 0.3 && wy <= b.y + s + 0.3;
    });
    if (bHit && !bHit.built) {
      bHit.progress = Math.min(1, bHit.progress + 0.16);
      if (bHit.progress >= 1) {
        bHit.built = true;
        this.state.score += 80;
        this.addXp(40);
        this.addFloatingText(bHit.x + 0.5, bHit.y, '✅ Pronto!', '#4ade80');
        this.callbacks.onSound('success');
        this.checkBadges();
      } else {
        this.addFloatingText(bHit.x + 0.5, bHit.y, '🔨 +16%', '#facc15');
        this.callbacks.onSound('harvest');
      }
      const u = this.findNearestAvailableUnit(wx, wy);
      if (u && !bHit.built) {
        u.targetBuildingId = bHit.id;
        u.targetNodeId = null;
        u.state = 'building';
      }
      return;
    }

    // 2. Verifica se tocou em um deposito de gelo ou cristal (coleta direta + envia tripulacao!)
    const nHit = this.state.nodes.find((n) => n.amount > 0 && Math.hypot(n.x - wx, n.y - wy) < 1.25);
    if (nHit) {
      const take = Math.min(nHit.amount, 4);
      nHit.amount -= take;
      if (nHit.type === 'ice_crater') {
        this.state.resources.oxygen = Math.min(999, this.state.resources.oxygen + take);
        this.addFloatingText(nHit.x, nHit.y, `+${take} 💧`, '#38bdf8');
      } else {
        this.state.resources.regolith = Math.min(999, this.state.resources.regolith + take);
        this.addFloatingText(nHit.x, nHit.y, `+${take} 🪨`, '#fbbf24');
      }
      this.state.score += 8;
      this.addXp(4);
      this.callbacks.onSound('harvest');

      const u = this.findNearestAvailableUnit(wx, wy);
      if (u && nHit.amount > 0) {
        u.targetNodeId = nHit.id;
        u.targetBuildingId = null;
        u.state = 'moving';
      }
      return;
    }

    // 3. Tocar em um astronauta ou rover faz cumprimento divertido (+XP / carinho)
    const unitHit = this.state.units.find(
      (u) => u.state !== 'sheltered' && Math.hypot(u.x - wx, u.y - wy) < 0.85
    );
    if (unitHit) {
      this.addFloatingText(unitHit.x, unitHit.y - 0.3, unitHit.type === 'astronaut' ? '❤️!' : '⚡!', '#f472b6');
      this.addXp(2);
      this.callbacks.onSound('harvest');
      return;
    }

    // 4. Move unidade livre mais proxima ate a coordenada
    const u = this.findNearestAvailableUnit(wx, wy);
    if (u) {
      u.targetX = Math.max(1.5, Math.min(MAP_SIZE - 2.5, wx));
      u.targetY = Math.max(1.5, Math.min(MAP_SIZE - 2.5, wy));
      u.targetNodeId = null;
      u.targetBuildingId = null;
      u.state = 'moving';
      this.addFloatingText(u.targetX, u.targetY, '🐾', '#fde047');
    }
  }

  applyRoguelikeCard(cardId: string): void {
    if (!this.state.activeCards.includes(cardId)) {
      this.state.activeCards.push(cardId);
    }
    if (cardId === 'solid_state_battery') {
      this.state.resources.energy += 80;
    } else if (cardId === 'regolith_shield') {
      this.state.shieldIntegrity = Math.min(100, this.state.shieldIntegrity + 25);
    }
    this.state.score += 120;
    this.addXp(50);
    this.callbacks.onSound('success');
  }

  step(): void {
    if (this.pausedForModal || this.state.gameOver || this.state.victory) return;
    const dt = 1 / TICK_RATE;
    const expedition = this.state.expedition;
    if (expedition.stage === 'flight' || expedition.stage === 'returning') {
      expedition.flightElapsedSec = Math.min(FLIGHT_DURATION_SEC, expedition.flightElapsedSec + dt);
      if (expedition.stage === 'returning' && expedition.flightElapsedSec >= FLIGHT_DURATION_SEC) {
        expedition.stage = 'completed';
        if (this.state.tutorial && !this.state.tutorial.rewardPaid) {
          const reward=missionReward(this.state);
          this.state.tutorial.rewardPaid = true; expedition.coins += reward.coins;
          this.state.xp += reward.knowledge;
          campaignOf(this.state);
        }
        this.state.victory = true; this.saveCampaign();
      }
      if (++this.saveTickCounter >= 10) { this.saveTickCounter = 0; this.saveCampaign(); }
      return;
    }
    if (expedition.stage !== 'surface') return;
    if (this.state.tutorial) {
      const previous = this.state.tutorial.step;
      tickTutorial(this.state, dt);
      if(previous!==this.state.tutorial.step){
        if(this.state.tutorial.step==='warning')this.callbacks.onSound('alert');
        if(this.state.tutorial.step==='level-up')this.callbacks.onSound('success');
      }
      if (++this.saveTickCounter >= 10 || previous !== this.state.tutorial.step || this.state.gameOver) {
        this.saveTickCounter = 0; this.saveCampaign();
      }
      return;
    }
    if (this.state.pendingTrade) {
      this.state.pendingTrade.remainingSec -= dt;
      if (this.state.pendingTrade.remainingSec <= 0) {
        const order = this.state.pendingTrade;
        this.state.resources[order.buy] = Math.min(999, this.state.resources[order.buy] + order.amount);
        this.state.pendingTrade = null;
      }
    }

    if (this.state.mode === 'classroom') {
      this.state.classroomTimeLeftSec = Math.max(0, this.state.classroomTimeLeftSec - dt);
      if (this.state.classroomTimeLeftSec <= 0) {
        this.state.victory = true;
        return;
      }
    }

    // Ciclo dia/noite e screen shake
    this.state.screenShakeSec = Math.max(0, this.state.screenShakeSec - dt);
    const cycleProgress = (this.state.solDurationSec - this.state.solTimerSec) / this.state.solDurationSec;
    this.state.dayNightCycle = 0.5 + 0.5 * Math.sin(cycleProgress * Math.PI * 2);

    // Gestao de drops espaciais
    this.dropSpawnTimer -= dt;
    if (this.dropSpawnTimer <= 0) {
      this.dropSpawnTimer = 25 + this.rng.next() * 15;
      this.spawnMapEvent();
    }
    for (let i = this.state.clickableEvents.length - 1; i >= 0; i--) {
      this.state.clickableEvents[i].lifeSec -= dt;
      if (this.state.clickableEvents[i].lifeSec <= 0) {
        this.state.clickableEvents.splice(i, 1);
      }
    }

    this.updateEconomy(dt);
    this.updateUnits(dt);
    checkMissionFailure(this.state);
    this.updateCrisesAndSol(dt);
    this.updateFloatingTexts(dt);

    this.saveTickCounter++;
    if (this.saveTickCounter >= 30) {
      this.saveTickCounter = 0;
      this.saveCampaign();
      this.checkBadges();
    }
  }

  private spawnMapEvent(): void {
    if (this.state.clickableEvents.length >= 4) return;
    const isPod = this.rng.next() > 0.45;
    const center = Math.floor(MAP_SIZE / 2);
    const rx = center + Math.round((this.rng.next() - 0.5) * 16);
    const ry = center + Math.round((this.rng.next() - 0.5) * 16);
    const clampedX = Math.max(2, Math.min(MAP_SIZE - 3, rx));
    const clampedY = Math.max(2, Math.min(MAP_SIZE - 3, ry));

    const ev: MapClickableEvent = {
      id: this.nextEntityId++,
      type: isPod ? 'supply_pod' : 'meteorite_crystal',
      x: clampedX,
      y: clampedY,
      lifeSec: 35,
      rewardType: isPod ? 'oxygen' : 'regolith',
      amount: isPod ? 35 : 50,
      icon: isPod ? '📦' : '☄️',
    };
    this.state.clickableEvents.push(ev);
    if (!isPod) {
      this.state.screenShakeSec = 0.45;
      this.callbacks.onSound('alert');
    }
  }

  private updateEconomy(dt: number): void {
    let eRate = 0;
    let oRate = 0;
    let fRate = 0;
    let rRate = 0;
    let shieldCap = 15;
    let popCap = 0;

    const crisis = this.state.activeCrisis;
    const solarMult =
      crisis?.kind === 'lunar_night'
        ? 0
        : crisis?.kind === 'dust_storm'
          ? 0.5
          : this.state.dayNightCycle;

    const generatedPower = this.state.buildings.filter(b => b.built).reduce((sum,b) => {
      const output = Math.max(0,BUILDING_DEFS[b.type].energyPerSec);
      return sum + output * (b.type === 'solar_array' ? solarMult : 1) * (b.level === 2 ? 1.4 : b.level >= 3 ? 2 : 1);
    },0);
    const requestedPower = this.state.buildings.filter(b => b.built).reduce((sum,b) => sum + Math.max(0,-BUILDING_DEFS[b.type].energyPerSec),0)
      + (this.hasCard('eclss_98') ? 1.2 : 0) + (this.hasCard('veggie_led') ? 1 : 0)
      + this.state.units.filter(u=>u.type==='viper_rover').length*0.35;
    const poweredFraction = requestedPower ? Math.min(1,(generatedPower+this.state.resources.energy/dt)/requestedPower) : 1;

    const prio = this.state.powerPriority;
    const prodMult = prio === 'production' ? 1.3 : prio === 'life_support' || prio === 'shield' ? 0.78 : 1.0;
    const lifeMult = prio === 'life_support' ? 1.32 : prio === 'production' ? 0.85 : 1.0;
    const shieldMult = prio === 'shield' ? 1.35 : 1.0;

    for (const b of this.state.buildings) {
      if (!b.built) continue;
      const def = BUILDING_DEFS[b.type];
      const levelMult = b.level === 2 ? 1.4 : b.level >= 3 ? 2.0 : 1.0;

      popCap += def.popProvided;
      shieldCap += Math.round(def.shieldBonus * levelMult);

      if (b.type === 'solar_array') {
        eRate += def.energyPerSec * solarMult * levelMult;
      } else if (def.energyPerSec > 0) {
        eRate += def.energyPerSec * levelMult;
      } else {
        eRate += def.energyPerSec;
      }
      const powered = def.energyPerSec < 0 ? poweredFraction : 1;
      const nearbyIce = this.state.nodes.find(n => n.type === 'ice_crater' && n.amount > 0 && Math.hypot(n.x-b.x,n.y-b.y) <= 3);
      const extract = b.type !== 'ice_extractor' || nearbyIce ? 1 : 0;
      oRate += def.oxygenPerSec * lifeMult * levelMult * powered * extract;
      fRate += def.foodPerSec * lifeMult * levelMult * powered;
      rRate += def.regolithPerSec * prodMult * levelMult * powered;
      if (b.type === 'ice_extractor' && nearbyIce) nearbyIce.amount = Math.max(0,nearbyIce.amount-def.oxygenPerSec*levelMult*powered*dt);
    }

    if (this.hasCard('eclss_98')) {
      oRate += 2.5 * lifeMult * poweredFraction;
      eRate -= 1.2;
    }
    if (this.hasCard('veggie_led')) {
      fRate += 2.5 * lifeMult * poweredFraction;
      oRate += 1.0 * lifeMult * poweredFraction;
      eRate -= 1.0;
    }
    if (this.hasCard('regolith_shield')) {
      shieldCap += 30;
    }

    const astroCount = this.state.units.filter((u) => u.type === 'astronaut').length;
    const roverCount = this.state.units.filter((u) => u.type === 'viper_rover').length;
    oRate -= astroCount * 0.85;
    fRate -= astroCount * 0.75;
    eRate -= roverCount * 0.35;

    if (crisis?.kind === 'eclss_leak') {
      oRate -= 2.2;
    }

    if (this.state.resources.energy <= 0 && eRate < 0) {
      oRate -= 1.5;
      fRate -= 0.8;
    }

    this.state.powerNetPerSec = eRate;
    this.state.popCap = Math.max(4, popCap);
    this.recomputePop();

    this.state.resources.energy = Math.max(0, Math.min(999, this.state.resources.energy + eRate * dt));
    this.state.resources.oxygen = Math.max(0, Math.min(999, this.state.resources.oxygen + oRate * dt));
    this.state.resources.food = Math.max(0, Math.min(999, this.state.resources.food + fRate * dt));
    this.state.resources.regolith = Math.max(0, Math.min(999, this.state.resources.regolith + rRate * dt));

    const targetShield = Math.min(100, shieldCap * shieldMult);
    this.state.shieldIntegrity += (targetShield - this.state.shieldIntegrity) * 0.12 * dt;

    let incomingRad = 6;
    if (crisis?.kind === 'solar_storm') {
      const donkiCut = this.hasCard('donki_early_warning') ? 0.6 : 1.0;
      incomingRad = (28 + crisis.severity * 10) * donkiCut;
    }
    const netRad = Math.max(2, incomingRad - this.state.shieldIntegrity * 0.48);
    // The HUD records cumulative exposure. Shelter never subtracts received dose.
    this.state.radiationLevel = Math.min(100, this.state.radiationLevel + netRad * .001 * dt);

    const hasAirAndFood = this.state.resources.oxygen > 2 && this.state.resources.food > 2;
    if (hasAirAndFood && this.state.radiationLevel < 45) {
      this.state.lifeSupportHealth = Math.min(100, this.state.lifeSupportHealth + 1.8 * dt);
    } else {
      let dmg = 0;
      if (this.state.resources.oxygen <= 2) dmg += 4.2;
      if (this.state.resources.food <= 2) dmg += 2.6;
      if (this.state.radiationLevel >= 45) dmg += 2.4;
      this.state.lifeSupportHealth = Math.max(0, this.state.lifeSupportHealth - dmg * dt);
    }

    if (this.state.lifeSupportHealth <= 0) {
      this.state.gameOver = true;
      this.state.lossReason = this.state.resources.oxygen <= 2 ? 'oxygen_depleted' : 'life_support_failure';
    }
  }

  private updateUnits(dt: number): void {
    const speedCardMult = this.hasCard('viper_ai') ? 1.35 : 1.0;
    const dustMult = this.state.activeCrisis?.kind === 'dust_storm' ? 0.72 : 1.0;
    const prodPrioMult = this.state.powerPriority === 'production' ? 1.2 : 1.0;

    for (const u of this.state.units) {
      const def = UNIT_DEFS[u.type];
      if (u.state === 'sheltered') {
        u.radiationDose = Math.min(100, u.radiationDose + .002 * dt);
        this.state.radiationLevel = Math.max(this.state.radiationLevel, u.radiationDose);
        continue;
      }

      if (this.state.activeCrisis?.kind === 'solar_storm' && u.type === 'astronaut') {
        const terrain = this.state.expedition.destination !== 'mars' && this.state.expedition.landingSiteId !== 'equatorial' ? terrainExposure(this.state.radiationTerrainId) : 1;
        const exposure = (1 - def.radiationResistance) * (28 + this.state.activeCrisis.severity * 10) / 12 * terrain * dt;
        u.radiationDose = Math.min(100, u.radiationDose + exposure);
        if (u.radiationDose > 75) {
          this.state.lifeSupportHealth = Math.max(0, this.state.lifeSupportHealth - 0.8 * dt);
        }
      } else {
        u.radiationDose = Math.min(100, u.radiationDose + .06 * dt);
      }
      if (u.type === 'astronaut') this.state.radiationLevel = Math.max(this.state.radiationLevel, u.radiationDose);

      const speed = def.speed * speedCardMult * (u.type === 'astronaut' ? dustMult : 1.0);

      if (u.shelterBuildingId) {
        const sh = this.state.buildings.find((b) => b.id === u.shelterBuildingId);
        if (sh) {
          const cx = sh.x + sh.size / 2;
          const cy = sh.y + sh.size / 2;
          if (this.moveToward(u, cx, cy, speed * 1.25, dt)) {
            u.state = 'sheltered';
            if (!sh.garrisonedIds.includes(u.id)) sh.garrisonedIds.push(u.id);
          }
          continue;
        }
        u.shelterBuildingId = null;
      }

      if (u.state === 'building' && u.targetBuildingId) {
        const b = this.state.buildings.find((item) => item.id === u.targetBuildingId);
        if (!b || b.built) {
          u.targetBuildingId = null;
          u.state = 'idle';
          continue;
        }
        const cx = b.x + b.size / 2;
        const cy = b.y + b.size / 2;
        if (Math.hypot(cx - u.x, cy - u.y) > b.size * 0.85) {
          this.moveToward(u, cx, cy, speed, dt);
        } else {
          const buildTime = BUILDING_DEFS[b.type].buildTimeSec;
          b.progress = Math.min(1, b.progress + (dt / buildTime) * speedCardMult);
          if (b.progress >= 1) {
            b.built = true;
            this.state.score += 80;
            this.addXp(40);
            this.addFloatingText(b.x, b.y, '✅', '#4ade80');
            this.callbacks.onSound('success');
            u.targetBuildingId = null;
            u.state = 'idle';
            this.checkBadges();
          }
        }
        continue;
      }

      if (u.state === 'returning') {
        const cc =
          this.state.buildings.find((b) => b.type === 'command_center') ?? this.state.buildings[0];
        if (!cc) {
          u.state = 'idle';
          continue;
        }
        const cx = cc.x + cc.size / 2;
        const cy = cc.y + cc.size / 2;
        if (this.moveToward(u, cx, cy, speed, dt, 1.3)) {
          if (u.carryType && u.carryAmount > 0) {
            this.state.resources[u.carryType] = Math.min(
              999,
              this.state.resources[u.carryType] + u.carryAmount
            );
            this.state.score += Math.round(u.carryAmount * 2);
            this.addXp(Math.round(u.carryAmount * 0.4));
            const label =
              u.carryType === 'oxygen'
                ? `+${Math.round(u.carryAmount)} O2`
                : `+${Math.round(u.carryAmount)} Reg`;
            this.addFloatingText(cx, cy, label, u.carryType === 'oxygen' ? '#22d3ee' : '#fb923c');
          }
          u.carryAmount = 0;
          u.carryType = null;
          if (u.targetNodeId) {
            u.state = 'moving';
          } else {
            u.state = 'idle';
          }
        }
        continue;
      }

      if (u.targetNodeId) {
        const node = this.state.nodes.find((n) => n.id === u.targetNodeId && n.amount > 0);
        if (!node) {
          const next = this.findNearestNode(u.x, u.y);
          u.targetNodeId = next ? next.id : null;
          if (!next) u.state = 'idle';
          continue;
        }
        if (Math.hypot(node.x - u.x, node.y - u.y) > 1.05) {
          u.state = 'moving';
          this.moveToward(u, node.x, node.y, speed, dt);
        } else {
          u.state = 'gathering';
          const rate = def.gatherRate * speedCardMult * prodPrioMult;
          const amount = Math.min(rate * dt, node.amount, def.carryCapacity - u.carryAmount);
          node.amount -= amount;
          u.carryAmount += amount;
          u.carryType = node.type === 'ice_crater' ? 'oxygen' : 'regolith';
          if (u.carryAmount >= def.carryCapacity || node.amount <= 0) {
            u.state = 'returning';
          }
        }
        continue;
      }

      if (u.state === 'moving' && u.targetX !== null && u.targetY !== null) {
        if (this.moveToward(u, u.targetX, u.targetY, speed, dt, 0.2)) {
          u.targetX = null;
          u.targetY = null;
          u.state = 'idle';
        }
      }
    }
  }

  private moveToward(
    u: Unit,
    tx: number,
    ty: number,
    speed: number,
    dt: number,
    arriveDist = 0.4
  ): boolean {
    const dx = tx - u.x;
    const dy = ty - u.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= arriveDist) return true;
    const step = Math.min(dist, speed * dt);
    u.x += (dx / dist) * step;
    u.y += (dy / dist) * step;
    return dist - step <= arriveDist;
  }

  private updateCrisesAndSol(dt: number): void {
    if (this.state.activeCrisis) {
      this.state.activeCrisis.remainingSec -= dt;
      if (this.state.activeCrisis.remainingSec <= 0) {
        this.state.activeCrisis = null;
        this.state.stormsSurvived += 1;
        this.state.score += 150;
        this.addXp(60);
        this.checkBadges();
      }
    }

    this.state.solTimerSec -= dt;
    if (this.state.solTimerSec <= 0) {
      this.state.sol += 1;
      this.state.solTimerSec = this.state.solDurationSec;
      this.state.score += 250;
      this.addXp(50);

      this.triggerNextCrisis();

      this.callbacks.onSolEnd();
      this.checkBadges();
    }
  }

  private triggerNextCrisis(): void {
    // Classroom events stay reproducible even when a live response arrives mid-session.
    // RBE and GST are Earth environment events, not lunar radiation measurements.
    const alerts = (this.state.mode === 'classroom' ? ARCHIVED_ALERTS : this.state.donkiAlerts).filter(a => a.messageType === 'SEP');
    const donkiRef = alerts.length > 0 ? alerts[(this.state.sol - 1) % alerts.length] : undefined;
    const roll = this.rng.next();

    let crisis: ActiveCrisis;
    if (roll < 0.42) {
      crisis = {
        kind: 'solar_storm',
        titleKey: 'crisis_solar_title',
        descKey: 'crisis_solar_desc',
        remainingSec: 18,
        totalSec: 18,
        severity: donkiRef?.severity ?? 2,
        donkiRef: donkiRef
          ? `Replay SEP (${donkiRef.issueTime.slice(0, 10)})`
          : 'Simulação / Simulation',
      };
      this.state.screenShakeSec = 0.5;
    } else if (roll < 0.72) {
      crisis = {
        kind: 'lunar_night',
        titleKey: 'crisis_night_title',
        descKey: 'crisis_night_desc',
        remainingSec: 20,
        totalSec: 20,
        severity: 2,
      };
    } else if (roll < 0.88 && this.state.expedition.destination === 'mars') {
      crisis = {
        kind: 'dust_storm',
        titleKey: 'crisis_dust_title',
        descKey: 'crisis_dust_desc',
        remainingSec: 16,
        totalSec: 16,
        severity: 1,
      };
    } else {
      crisis = {
        kind: 'eclss_leak',
        titleKey: 'crisis_leak_title',
        descKey: 'crisis_leak_desc',
        remainingSec: 14,
        totalSec: 14,
        severity: 2,
      };
    }
    this.state.activeCrisis = crisis;
    this.callbacks.onSound('alert');
    this.callbacks.onCrisisStart(crisis);
  }

  private updateFloatingTexts(dt: number): void {
    for (const ft of this.state.floatingTexts) {
      ft.life -= dt;
      ft.y -= 0.35 * dt;
    }
    this.state.floatingTexts = this.state.floatingTexts.filter((ft) => ft.life > 0);
  }

  private addFloatingText(x: number, y: number, text: string, color: string): void {
    // Escalonamento vertical para notificacoes simultaneas proximas
    const offsetCount = this.state.floatingTexts.filter(
      (ft) =>
        ft.life > 0.3 &&
        (Math.hypot(ft.x - x, ft.y - y) < 0.6 ||
          (Math.abs(ft.x - x) < 0.5 && ft.y <= y && y - ft.y < 1.8))
    ).length;
    const staggeredY = y - offsetCount * 0.45;

    this.state.floatingTexts.push({
      id: this.nextEntityId++,
      x,
      y: staggeredY,
      text,
      color,
      life: 1.5,
    });
  }

  private findNearestNode(x: number, y: number): ResourceNode | null {
    let best: ResourceNode | null = null;
    let bestD = Infinity;
    for (const n of this.state.nodes) {
      if (n.amount <= 0) continue;
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }

  private findNearestAvailableUnit(x: number, y: number): Unit | null {
    let best: Unit | null = null;
    let bestD = Infinity;
    for (const u of this.state.units) {
      if (u.state === 'sheltered') continue;
      const d = Math.hypot(u.x - x, u.y - y);
      if (d < bestD) {
        bestD = d;
        best = u;
      }
    }
    return best;
  }

  private recomputePop(): void {
    let p = 0;
    for (const u of this.state.units) p += UNIT_DEFS[u.type].pop;
    this.state.pop = p;
  }
}
