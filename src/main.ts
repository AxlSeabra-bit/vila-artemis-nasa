import { MissionFlow } from './missionFlow';
import { polarMission } from './campaign';
import { POLAR_RESEARCH_SITE } from './lunarTerrain';
import { siteName } from './expedition';
import './mission.css';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/silkscreen/latin-400.css';
import '@fontsource/silkscreen/latin-700.css';
import './style.css';
import './tutorial.css';
import { TutorialView } from './tutorialView';
import { tutorialLevel, levelProgress, KNOWLEDGE_PER_LEVEL, WARNING_SECONDS } from './surfaceTutorial';
import { Accounts } from './accounts';
import {
  ARTEMIS_BADGES,
  ARTEMIS_RANKS,
  BUILDING_DEFS,
  DONKI_EDU_CARDS,
  MAP_SIZE,
  TICK_MS,
  UNIT_DEFS,
  getBuildingUpgradeCost,
} from './constants';
import { ArtemisEngine } from './engine';
import { tr } from './i18n';
import { enrichDonkiAlert, fetchNasaDonkiAlerts } from './nasaApi';
import { SCIENCE, escapeHtml } from './science';
import { renderSciencePanel } from './scienceView';
import { sfx } from './audio';
import { TILE_PX, CameraView, emitSparkles, renderWorld, screenToWorld } from './renderer';
import { getBuildingPixelIconUrl } from './pixelSprites';
import type {
  ActiveCrisis,
  AstronautRank,
  BadgeId,
  Building,
  BuildingType,
  Lang,
  ResourceKey,
} from './types';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let lang: Lang = 'pt';
let activeTab: 'build' | 'crew' = 'build';
let placementType: BuildingType | null = null;
let hoverWorld: { wx: number; wy: number } | null = null;
let lastDockSig = '';

const cam: CameraView = {
  x: MAP_SIZE / 2,
  y: MAP_SIZE / 2,
  zoom: 1.05,
};

const keysDown = new Set<string>();
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

function L(pt: string, en: string, es: string): string {
  if (lang === 'en') return en;
  if (lang === 'es') return es;
  return pt;
}

const BUILDING_KID_DESC: Record<BuildingType, { pt: string; en: string; es: string }> = {
  command_center: {
    pt: 'Coração da vila! Abriga a turma e guarda os itens coletados.',
    en: 'Village heart! Shelters crew and stores supplies.',
    es: 'Corazón de la aldea! Guarda recursos y protege al equipo.',
  },
  solar_array: {
    pt: 'Captura luz do Sol para gerar bastante Energia (⚡).',
    en: 'Captures sunlight to make clean Power (⚡).',
    es: 'Captura luz solar para generar Energía (⚡).',
  },
  ice_extractor: {
    pt: 'Usa energia e gelo próximo para produzir Água e Ar (💧).',
    en: 'Uses power and nearby ice for Water & Air (💧).',
    es: 'Usa energía y hielo cercano para Agua y Aire (💧).',
  },
  hydroponics: {
    pt: 'Estufa que usa energia para cultivar alimentos (🌱 + 💧).',
    en: 'Cozy greenhouse growing tasty veggies (🌱 + 💧).',
    es: 'Invernadero que cultiva comida fresca (🌱 + 💧).',
  },
  regolith_printer: {
    pt: 'Impressora 3D que transforma pó lunar em blocos (🪨).',
    en: '3D printer shaping moon dust into building blocks (🪨).',
    es: 'Impresora 3D que crea bloques lunares (🪨).',
  },
  habitat_pod: {
    pt: 'Casinha espacial quentinha para caber mais astronautas!',
    en: 'Warm space cottage making room for more astronauts!',
    es: 'Casita espacial para alojar más astronautas!',
  },
  radiation_bunker: {
    pt: 'Abrigo super forte contra tempestades do Sol (🛡️).',
    en: 'Strong shelter protecting crew during solar storms (🛡️).',
    es: 'Refugio fuerte contra tormentas solares (🛡️).',
  },
  kilopower: {
    pt: 'Mini reator que gera Energia até na Noite Lunar (⚡)!',
    en: 'Mini reactor producing Power even in lunar night (⚡)!',
    es: 'Mini reactor que da Energía incluso de noche (⚡)!',
  },
  dsn_antenna: {
    pt: 'Antena gigante da NASA para trocar itens com a Terra!',
    en: 'Giant NASA dish improving supply swaps with Earth!',
    es: 'Antena gigante de la NASA para intercambios con la Tierra!',
  },
};

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const modalBackdrop = document.getElementById('modal-backdrop')!;
const modalTitle = document.getElementById('modal-title')!;
const modalBody = document.getElementById('modal-body')!;
const modalCloseBtn = document.getElementById('modal-close')!;
const dockContent = document.getElementById('dock-content')!;
const placementBar = document.getElementById('placement-bar')!;
const placementLabel = document.getElementById('placement-label')!;
const btnCancelPlace = document.getElementById('btn-cancel-place')!;
const btnDonki = document.getElementById('btn-donki')!;
const btnBadges = document.getElementById('btn-badges')!;
const btnSettings = document.getElementById('btn-settings')!;
const btnInstall = document.getElementById('btn-install')!;
const rankBadge = document.getElementById('rank-badge')!;
const btnCrisisShelter = document.getElementById('btn-crisis-shelter')!;

const engine = new ArtemisEngine({
  onSolEnd: () => { updateHud(); },
  onCrisisStart: (crisis: ActiveCrisis) => {
    if (crisis.kind === 'solar_storm') {
      sfx.crisisSiren();
    } else {
      sfx.alert();
    }
    updateHud();
  },
  onSound: (kind) => {
    if (kind === 'build') sfx.build();
    else if (kind === 'alert') sfx.alert();
    else if (kind === 'harvest') sfx.harvestPop('oxygen');
    else sfx.success();
  },
  onRankUp: (_rank: AstronautRank) => {
    emitSparkles(cam.x, cam.y, 26, '#facc15');
  },
  onBadgeUnlocked: (_id: BadgeId) => {
    emitSparkles(cam.x, cam.y, 24, '#4ade80');
  },
});

// Parametros de URL para modo sala de aula
const urlParams = new URLSearchParams(window.location.search);
const urlMode = urlParams.get('mode');
const urlSeed = urlParams.get('seed');
if (urlMode === 'classroom') {
  const seed = (urlSeed || 'TURMA-4A').toUpperCase();
  if (!engine.loadSavedCampaign('classroom', seed)) engine.resetMission('classroom', seed);
} else {
  engine.loadSavedCampaign();
}

// Registra PWA Service Worker e evento de instalacao
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => undefined);
}
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e as BeforeInstallPromptEvent;
  btnInstall.classList.remove('hidden');
});

btnInstall.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  await deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  btnInstall.classList.add('hidden');
});

// Telemetria espacial NASA DONKI em tempo real com cache offline
fetchNasaDonkiAlerts().then((alerts) => {
  engine.setDonkiAlerts(alerts);
  if (alerts.some((a) => a.source === 'live')) {
    btnDonki.classList.add('live');
  }
});

document.getElementById('btn-science')!.addEventListener('click', () => openScienceModal());
function openScienceModal(tab: 'ice'|'radiation'|'lab' = 'ice'): void {
  modalTitle.textContent = L('Mapas e dados NASA', 'NASA maps and data', 'Mapas y datos NASA');
  renderSciencePanel(modalBody,lang,engine.state,(id)=>{
    const node=engine.state.nodes.find(n=>n.sourceSiteId===id);
    if(node) { cam.x=node.x; cam.y=node.y; emitSparkles(node.x,node.y,16,'#67e8f9'); closeModal(); }
  },(id)=>{
    if(engine.selectRadiationTerrain(id)) { sfx.success(); updateHud(); }
    else sfx.errorBuzz();
    openScienceModal('radiation');
  },tab);
  engine.setPausedForModal(true);
  modalBackdrop.classList.remove('hidden');
}
const missionFlow = new MissionFlow(engine, () => lang, () => {
  if(engine.state.expedition.stage==='surface'){cam.x=MAP_SIZE/2;cam.y=MAP_SIZE/2;placementType=null;}
  sfx.click(); lastDockSig = ''; updateHud(); renderDock();
}, (next) => {
  lang = next; lastDockSig = ''; updateHud(); renderDock();
});

const tutorialView = new TutorialView(engine, () => lang, (type)=>{
  setPlacementType(type);
  if(type==='ice_extractor'&&polarMission(engine.state)){cam.x=POLAR_RESEARCH_SITE.x;cam.y=POLAR_RESEARCH_SITE.y;}
}, (title, html, bind) => {
  modalTitle.textContent = title; modalBody.innerHTML = html;
  modalBackdrop.classList.remove('hidden'); engine.setPausedForModal(true); bind();
}, closeModal);
new Accounts(engine, () => { placementType=null; lastDockSig=''; updateHud();renderDock();resizeCanvas(); });

function resizeCanvas(): void {
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resizeCanvas);
new ResizeObserver(resizeCanvas).observe(document.getElementById('canvas-wrap')!);
resizeCanvas();

function setPlacementType(next: BuildingType | null): void {
  placementType = next;
  if (next) {
    placementBar.classList.remove('hidden');
    placementLabel.textContent = L(
      `Toque no chão para construir: ${tr(lang, 'b_' + next)}`,
      `Tap ground to build: ${tr(lang, 'b_' + next)}`,
      `Toca el suelo para construir: ${tr(lang, 'b_' + next)}`
    );
  } else {
    placementBar.classList.add('hidden');
  }
  lastDockSig = '';
  renderDock();
}

btnCancelPlace.addEventListener('click', () => {
  sfx.click();
  setPlacementType(null);
});

// Controles de camera e toque no mapa Top-Down 3/4
const pointers = new Map<number, { x: number; y: number }>();
let isDragging = false;
let dragMoved = false;
let dragStartX = 0;
let dragStartY = 0;
let camStartX = cam.x;
let camStartY = cam.y;
let pinchStartDist = 0;
let pinchStartZoom = cam.zoom;

function getPinchDist(): number {
  const pts = Array.from(pointers.values());
  if (pts.length < 2) return 0;
  return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
}

function panCameraByScreenDelta(dx: number, dy: number): void {
  cam.x = Math.max(2, Math.min(MAP_SIZE - 2, camStartX - dx / (TILE_PX * cam.zoom)));
  cam.y = Math.max(2, Math.min(MAP_SIZE - 2, camStartY - dy / (TILE_PX * cam.zoom)));
}

function handleWorldTap(clientX: number, clientY: number): void {
  const rect = canvas.getBoundingClientRect();
  const sx = clientX - rect.left;
  const sy = clientY - rect.top;
  const w = screenToWorld(sx, sy, cam, rect.width, rect.height);
  if (tutorialView.tap(w.wx, w.wy, placementType)) return;

  if (placementType) {
    const gx = Math.floor(w.wx);
    const gy = Math.floor(w.wy);
    if (engine.placeBuilding(placementType, gx, gy)) {
      emitSparkles(gx + 0.5, gy + 0.5, 20, '#4ade80');
      setPlacementType(null);
      updateHud();
    } else {
      sfx.errorBuzz();
    }
    return;
  }

  // 1. Caixas de presente e cristais clicaveis no chao
  const ev = engine.findClickableEventAt(w.wx, w.wy);
  if (ev && engine.claimClickableEvent(ev.id)) {
    emitSparkles(ev.x, ev.y, 26, '#facc15');
    updateHud();
    return;
  }

  // 2. Toque em construcao: se pronta, abre inspecao; se em obra, acelera (+16%)!
  const bHit = engine.findBuildingAt(w.wx, w.wy);
  if (bHit && bHit.built) {
    sfx.click();
    openInspectionModal(bHit);
    return;
  }

  // 3. Toque em deposito de gelo/cristal, obra, astronauta ou chao livre
  engine.commandWorldTap(w.wx, w.wy);
  emitSparkles(w.wx, w.wy, 6, '#fef08a');
  updateHud();
}

canvas.addEventListener('pointerdown', (e) => {
  sfx.startAmbientHum();
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 1) {
    isDragging = true;
    dragMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    camStartX = cam.x;
    camStartY = cam.y;
  } else if (pointers.size === 2) {
    isDragging = false;
    pinchStartDist = getPinchDist();
    pinchStartZoom = cam.zoom;
  }
});

canvas.addEventListener('pointermove', (e) => {
  const rect = canvas.getBoundingClientRect();
  hoverWorld = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, cam, rect.width, rect.height);

  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 2 && pinchStartDist > 0) {
    const d = getPinchDist();
    cam.zoom = Math.max(0.65, Math.min(2.2, pinchStartZoom * (d / pinchStartDist)));
    return;
  }

  if (isDragging && pointers.size === 1) {
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.hypot(dx, dy) > 10) {
      dragMoved = true;
    }
    if (dragMoved) {
      panCameraByScreenDelta(dx, dy);
    }
  }
});

canvas.addEventListener('pointerup', (e) => {
  const wasSingle = pointers.size === 1 && !dragMoved;
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchStartDist = 0;
  if (pointers.size === 0) isDragging = false;

  if (wasSingle) {
    handleWorldTap(e.clientX, e.clientY);
  }
});

canvas.addEventListener('pointercancel', (e) => {
  pointers.delete(e.pointerId);
  isDragging = false;
  pinchStartDist = 0;
});

canvas.addEventListener('pointerleave', () => {
  hoverWorld = null;
});

canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    cam.zoom = Math.max(0.65, Math.min(2.2, cam.zoom * factor));
  },
  { passive: false }
);

window.addEventListener('keydown', (e) => {
  if (!document.getElementById('level-up-notice')!.classList.contains('hidden')) return;
  if (!document.getElementById('account-dialog')?.classList.contains('hidden') || (e.target instanceof HTMLElement && ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))) return;
  if (engine.state.expedition.stage !== 'surface') return;
  keysDown.add(e.key.toLowerCase());
  if (e.key === 'Escape') {
    setPlacementType(null);
    closeModal();
  }
});
window.addEventListener('keyup', (e) => {
  keysDown.delete(e.key.toLowerCase());
});

document.getElementById('btn-zoom-in')!.addEventListener('click', () => {
  cam.zoom = Math.min(2.2, cam.zoom + 0.2);
  sfx.click();
});
document.getElementById('btn-zoom-out')!.addEventListener('click', () => {
  cam.zoom = Math.max(0.65, cam.zoom - 0.2);
  sfx.click();
});
document.getElementById('btn-center')!.addEventListener('click', () => {
  cam.x = MAP_SIZE / 2;
  cam.y = MAP_SIZE / 2;
  cam.zoom = 1.05;
  sfx.click();
});

// Troca de abas da hotbar Stardew
document.querySelectorAll('.dock-tab').forEach((tabBtn) => {
  tabBtn.addEventListener('click', () => {
    sfx.click();
    const t = (tabBtn as HTMLElement).dataset.tab as 'build' | 'crew';
    activeTab = t;
    document.querySelectorAll('.dock-tab').forEach((el) => el.classList.remove('active'));
    tabBtn.classList.add('active');
    lastDockSig = '';
    renderDock();
  });
});

// Botoes do cabecalho
btnDonki.addEventListener('click', () => {
  sfx.click();
  openDonkiModal();
});
btnBadges.addEventListener('click', () => {
  sfx.click();
  openBadgesModal();
});
rankBadge.addEventListener('click', () => {
  sfx.click();
  openRankModal();
});
btnSettings.addEventListener('click', () => {
  sfx.click();
  openSettingsModal();
});
btnCrisisShelter.addEventListener('click', () => {
  if (engine.applyCrisisIntervention('shelter_all')) {
    emitSparkles(cam.x, cam.y, 18, '#38bdf8');
  } else {
    engine.toggleShelterAll();
  }
  updateHud();
  lastDockSig = '';
  renderDock();
});

modalCloseBtn.addEventListener('click', () => {
  sfx.click();
  closeModal();
});
modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) {
    closeModal();
  }
});

function closeModal(): void {
  modalBackdrop.classList.add('hidden');
  engine.setPausedForModal(false);
}

function formatCostShort(cost: Partial<Record<ResourceKey, number>>): string {
  const icons: Record<ResourceKey, string> = {
    water: '💧',
    energy: '⚡',
    oxygen: '💧',
    food: '🌱',
    regolith: '🪨',
  };
  return Object.entries(cost)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([k, v]) => `${icons[k as ResourceKey]}${v}`)
    .join(' ');
}

function renderDock(): void {
  if (tutorialView.render()) return;
  const st = engine.state;
  const anySheltered = st.units.some((u) => u.state === 'sheltered');
  const sig = `${lang}|${activeTab}|${placementType ?? ''}|${st.expedition.destination}|${st.pop}/${st.popCap}|${anySheltered}|${!!st.activeCrisis}|${Math.floor(st.resources.energy)}|${Math.floor(st.resources.oxygen)}|${Math.floor(st.resources.food)}|${Math.floor(st.resources.regolith)}`;
  if (sig === lastDockSig) return;
  lastDockSig = sig;

  dockContent.innerHTML = '';

  if (activeTab === 'build') {
    // Slot 0: Maozinha de Colher / Tocar (Ferramenta padrao estilo Stardew)
    const handCard = document.createElement('button');
    handCard.type = 'button';
    handCard.id = 'slot-hand-tool';
    handCard.className = `action-card hand-slot ${placementType === null ? 'selected' : ''}`;
    handCard.innerHTML = `
      <div style="font-size:24px;line-height:1.2">👆</div>
      <div class="ac-top">${tr(lang, 'tool_hand')}</div>
      <div class="ac-cost">${L('Livre', 'Ready', 'Libre')}</div>
    `;
    handCard.addEventListener('click', () => {
      sfx.click();
      setPlacementType(null);
    });
    dockContent.appendChild(handCard);

    // Módulos disponíveis para a expedição, sem desbloqueio por fases
    const unlockedDefs = Object.values(BUILDING_DEFS).filter(
      (def) => def.type !== 'command_center'
    );
    for (const def of unlockedDefs) {
      const affordable = engine.canAfford(def.cost);
      const isSelected = placementType === def.type;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.buildingType = def.type;
      btn.className = `action-card ${isSelected ? 'selected' : ''}`;
      btn.disabled = !affordable;
      btn.innerHTML = `
        <img class="pixel-thumb" src="${getBuildingPixelIconUrl(def.type)}" alt="" />
        <div class="ac-top">${tr(lang, `b_${def.type}`)}</div>
        <div class="ac-cost">${formatCostShort(def.cost)}</div>
      `;
      btn.addEventListener('click', () => {
        sfx.click();
        setPlacementType(placementType === def.type ? null : def.type);
      });
      dockContent.appendChild(btn);
    }

    return;
  }

  // Aba Turma & Base
  const astroCost = UNIT_DEFS.astronaut.cost;
  const btnAstro = document.createElement('button');
  btnAstro.type = 'button';
  btnAstro.className = 'action-card';
  btnAstro.disabled = !engine.canAfford(astroCost) || st.pop >= st.popCap;
  btnAstro.innerHTML = `
    <div style="font-size:24px">🧑‍🚀</div>
    <div class="ac-top">${L('+1 Astronauta', '+1 Astronaut', '+1 Astronauta')}</div>
    <div class="ac-cost">${formatCostShort(astroCost)}</div>
  `;
  btnAstro.addEventListener('click', () => {
    if (engine.trainUnit('astronaut')) {
      emitSparkles(cam.x, cam.y, 14, '#4ade80');
      lastDockSig = '';
      updateHud();
      renderDock();
    } else {
      sfx.errorBuzz();
    }
  });
  dockContent.appendChild(btnAstro);

  const roverCost = UNIT_DEFS.viper_rover.cost;
  const btnRover = document.createElement('button');
  btnRover.type = 'button';
  btnRover.className = 'action-card';
  btnRover.disabled = !engine.canAfford(roverCost) || st.pop >= st.popCap;
  btnRover.innerHTML = `
    <div style="font-size:24px">🤖</div>
    <div class="ac-top">${L('+1 Rover VIPER', '+1 VIPER Rover', '+1 Rover VIPER')}</div>
    <div class="ac-cost">${formatCostShort(roverCost)}</div>
  `;
  btnRover.addEventListener('click', () => {
    if (engine.trainUnit('viper_rover')) {
      emitSparkles(cam.x, cam.y, 14, '#fbbf24');
      lastDockSig = '';
      updateHud();
      renderDock();
    } else {
      sfx.errorBuzz();
    }
  });
  dockContent.appendChild(btnRover);

  // Abrigar turma
  const btnShelter = document.createElement('button');
  btnShelter.type = 'button';
  btnShelter.className = `action-card ${anySheltered ? 'selected' : st.activeCrisis ? 'danger' : ''}`;
  btnShelter.innerHTML = `
    <div style="font-size:24px">${anySheltered ? '☀️' : '🛡️'}</div>
    <div class="ac-top">${anySheltered ? L('Liberar Turma', 'Exit Shelter', 'Salir Refugio') : L('Abrigar Turma!', 'Shelter Crew!', 'Refugiar!')}</div>
    <div class="ac-cost">${anySheltered ? L('Em segurança', 'Protected', 'Seguros') : L('Proteger todos', 'Safe inside', 'Todos dentro')}</div>
  `;
  btnShelter.addEventListener('click', () => {
    sfx.click();
    engine.toggleShelterAll();
    lastDockSig = '';
    renderDock();
  });
  dockContent.appendChild(btnShelter);

  // Trocar itens (Comercio Terra-Lua)
  const btnTrade = document.createElement('button');
  btnTrade.type = 'button';
  btnTrade.className = 'action-card';
  btnTrade.innerHTML = `
    <div style="font-size:24px">📦</div>
    <div class="ac-top">${L('Trocar Itens', 'Supply Swap', 'Intercambiar')}</div>
    <div class="ac-cost">${L('Base ↔ Terra', 'Moon ↔ Earth', 'Base ↔ Tierra')}</div>
  `;
  btnTrade.addEventListener('click', () => {
    sfx.click();
    openTradeModal();
  });
  dockContent.appendChild(btnTrade);

  // Relatorio escolar
  const btnReport = document.createElement('button');
  btnReport.type = 'button';
  btnReport.className = 'action-card';
  btnReport.innerHTML = `
    <div style="font-size:24px">📊</div>
    <div class="ac-top">${L('Meu Progresso', 'Progress', 'Mi Progreso')}</div>
    <div class="ac-cost">${L('Ver Medalhas', 'View Score', 'Ver Puntos')}</div>
  `;
  btnReport.addEventListener('click', () => {
    sfx.click();
    openReportModal();
  });
  dockContent.appendChild(btnReport);
}

// Modal de Inspecao e Evolucao Stardew
function openInspectionModal(b: Building): void {
  const def = BUILDING_DEFS[b.type];
  const stars = b.level === 1 ? '★☆☆' : b.level === 2 ? '★★☆' : '★★★';
  const nextLevel = b.level + 1;
  const upCost = getBuildingUpgradeCost(b.type, nextLevel);
  const canUp = b.level < 3 && engine.canAfford(upCost);
  const bName = tr(lang, `b_${b.type}`);
  const bDesc = BUILDING_KID_DESC[b.type]?.[lang] || '';

  modalTitle.textContent = `${bName} ${stars}`;
  modalBody.innerHTML = `
    <div class="inspect-card">
      <div class="inspect-header">
        <img class="pixel-thumb-lg" src="${getBuildingPixelIconUrl(b.type)}" alt="" />
        <div>
          <div style="font-size:17px;font-weight:700">${bName}</div>
          <div class="inspect-stars">${tr(lang, 'inspect_level')} ${b.level} (${stars})</div>
          <div style="font-size:13px;color:var(--ink-soft);margin-top:2px">${bDesc}</div>
        </div>
      </div>

      <div class="inspect-stat-grid">
        <div class="stat-pill">❤️ ${L('Resistência', 'Health', 'Salud')}: <b>${Math.round(b.hp)} / ${b.maxHp}</b></div>
        <div class="stat-pill">⚡ ${L('Energia', 'Energy', 'Energía')}: <b>${def.energyPerSec >= 0 ? '+' : ''}${def.energyPerSec.toFixed(1)}/s</b></div>
        <div class="stat-pill">💧 ${L('Água/Ar', 'Water/Air', 'Agua/Aire')}: <b>+${def.oxygenPerSec.toFixed(1)}/s</b></div>
        <div class="stat-pill">🌱 ${L('Comida', 'Food', 'Comida')}: <b>+${def.foodPerSec.toFixed(1)}/s</b></div>
        <div class="stat-pill">🪨 ${L('Pedras', 'Moon Rock', 'Piedras')}: <b>+${def.regolithPerSec.toFixed(1)}/s</b></div>
        <div class="stat-pill">🛡️ ${L('Escudo', 'Shield', 'Escudo')}: <b>+${Math.round(def.shieldBonus * (b.level === 2 ? 1.4 : b.level >= 3 ? 2.0 : 1.0))}%</b></div>
      </div>

      ${
        b.level < 3
          ? `<button id="btn-inspect-upgrade" class="btn-upgrade" type="button" ${canUp ? '' : 'style="opacity:0.65"'}>
              ⬆️ ${tr(lang, 'inspect_upgrade_btn')} ★${nextLevel} (${formatCostShort(upCost)})
            </button>`
          : `<div class="stat-pill" style="text-align:center;font-weight:700;background:#fef3c7">🏆 ${tr(lang, 'inspect_max_level')}</div>`
      }
      <button id="btn-inspect-close" class="btn-chip" type="button">${tr(lang, 'inspect_close')}</button>
    </div>
  `;

  document.getElementById('btn-inspect-close')?.addEventListener('click', () => {
    sfx.click();
    closeModal();
  });

  const upBtn = document.getElementById('btn-inspect-upgrade');
  if (upBtn) {
    upBtn.addEventListener('click', () => {
      if (engine.upgradeBuilding(b.id)) {
        sfx.fanfare();
        emitSparkles(b.x + b.size / 2, b.y + b.size / 2, 26, '#facc15');
        openInspectionModal(b);
        updateHud();
        lastDockSig = '';
        renderDock();
      } else {
        sfx.errorBuzz();
      }
    });
  }

  engine.setPausedForModal(true);
  modalBackdrop.classList.remove('hidden');
}

function formatAlertDate(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
  } catch {
    return isoStr;
  }
}

const DONKI_ALERT_KID_STATUS: Record<string, { label: string; icon: string; kidDesc: string }> = {
  CME: {
    label: 'CME (Onda de Plasma Solar)',
    icon: '☀️💥',
    kidDesc: 'Uma nuvem gigante solta pelo Sol! Hora de deixar o escudo ligado e proteger os astronautas.',
  },
  SEP: {
    label: 'SEP (Raios Rápidos do Sol)',
    icon: '⚡🛡️',
    kidDesc: 'Partículas rápidas viajando pelo espaço. Abrigue a turma dentro das casinhas ou bunker!',
  },
  FLR: {
    label: 'FLR (Clarão Solar)',
    icon: '🔥📡',
    kidDesc: 'Um flash forte de luz no Sol! Pode fazer o sinal de rádio dar umas falhadinhas.',
  },
  RBE: {
    label: 'RBE (Cinturão Espacial Forte)',
    icon: '🧲🌌',
    kidDesc: 'Muitos elétrons voando lá fora. A base lunar acompanha tudo pelos sensores!',
  },
  GST: {
    label: 'GST (Tempestade Magnética)',
    icon: '🌐⚡',
    kidDesc: 'Vento solar balançando o espaço e criando auroras coloridas no céu da Terra!',
  },
};

function openDonkiModal(): void {
  modalTitle.textContent = `📡 ${tr(lang, 'donki_modal_title')}`;
  const st = engine.state;
  const rawAlerts = st.nasaAlerts && st.nasaAlerts.length > 0 ? st.nasaAlerts : st.donkiAlerts;

  const alertsHtml =
    rawAlerts.length > 0
      ? rawAlerts
          .map((raw) => {
            const enriched = enrichDonkiAlert(raw);
            const info = DONKI_ALERT_KID_STATUS[enriched.messageType] || {
              label: `${enriched.messageType} (Espaço)`,
              icon: '🛰️',
              kidDesc: 'Evento espacial detectado pelos sensores reais da NASA!',
            };
            return `
              <div class="telemetry-alert sev-${enriched.severity}">
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;flex-wrap:wrap;gap:4px">
                  <strong>${info.icon} ${info.label}</strong>
                  <span style="font-size:11px;color:var(--ink-soft)">📅 ${formatAlertDate(enriched.issueTime)}</span>
                </div>
                <div style="font-size:12px;margin-top:4px;color:var(--ink)">${info.kidDesc}</div>
                <div style="font-size:11px;margin-top:3px;color:var(--ink-soft);font-style:italic">
                  ${enriched.source === 'archive' ? L('Arquivo histórico', 'Historical archive', 'Archivo histórico') : enriched.source === 'cache' ? 'Cache' : L('Consulta online', 'Online query', 'Consulta online')}: ${escapeHtml(enriched.id)}
                  ${enriched.sourceUrl ? `<a href="${escapeHtml(enriched.sourceUrl)}" target="_blank" rel="noopener noreferrer">NASA</a>` : ''}
                </div>
              </div>
            `;
          })
          .join('')
      : `<p>${L('Nenhuma notificação compatível na consulta. Isso não significa ausência de risco lunar.','No matching notifications in this query. This does not mean there is no lunar risk.','No hay notificaciones compatibles. Esto no significa ausencia de riesgo lunar.')}</p>`;

  modalBody.innerHTML = `
    <p style="font-size:13px;margin-top:0">${tr(lang, 'donki_modal_subtitle')}</p>
    <div class="telemetry-panel">
      <div class="telemetry-panel-hdr">
        <strong>🛰️ NASA DONKI</strong>
        <span class="telemetry-badge">${rawAlerts.some((a) => a.source === 'live') ? L('Consulta online', 'Online query', 'Consulta online') : rawAlerts.some(a=>a.source==='cache') ? 'Cache' : L('Arquivo histórico', 'Historical archive', 'Archivo histórico')}</span>
      </div>
      <div>${alertsHtml}</div>
    </div>
    <p class="science-note">${L('As tempestades da partida são replays educativos. As estrelas indicam dificuldade do jogo, não dose medida. RBE e GST descrevem o ambiente da Terra e não determinam o risco do solo lunar.','Game storms are educational replays. Stars mean game difficulty, not measured dose. RBE and GST describe the Earth environment, not lunar surface risk.','Las tormentas son repeticiones educativas. Las estrellas indican dificultad, no dosis medida. RBE y GST describen el entorno terrestre, no el riesgo lunar.')}</p>
    <div style="font-weight:700;font-size:14px;margin-bottom:8px">
      📚 ${L('Conheça o clima espacial:', 'Learn about space weather:', 'Conoce el clima espacial:')}
    </div>
    <div id="donki-cards-list"></div>
  `;

  const listEl = document.getElementById('donki-cards-list')!;
  for (const card of DONKI_EDU_CARDS) {
    const cardEl = document.createElement('div');
    cardEl.className = `donki-card-junior severity-${card.severity}`;
    cardEl.innerHTML = `
      <div class="dc-header">
        <span class="dc-title">${tr(lang, card.titleKey)}</span>
        <span class="dc-stars">${'⭐'.repeat(card.severity)}</span>
      </div>
      <div class="dc-desc"><b>${L('O que é:', 'What is it:', 'Qué es:')}</b> ${tr(lang, card.whatIsKey)}</div>
      <div class="dc-impact"><b>${L('O que muda na base:', 'Base impact:', 'Impacto:')}</b> ${tr(lang, card.impactKey)}</div>
      <div class="dc-action"><b>${L('Dica do Astronauta:', 'Astronaut Tip:', 'Consejo:')}</b> ${tr(lang, card.actionKey)}</div>
    `;
    listEl.appendChild(cardEl);
  }

  engine.setPausedForModal(true);
  modalBackdrop.classList.remove('hidden');
}

function openBadgesModal(): void {
  modalTitle.textContent = `🏅 ${L('Medalhas da Base Lunar', 'Lunar Outpost Badges', 'Medallas Lunares')}`;
  const st = engine.state;

  modalBody.innerHTML = `
    <p style="font-size:13px;margin-top:0">${L('Explore a Lua e cuide da sua base para conquistar medalhas!', 'Complete missions and build your space village to unlock every badge!', 'Completa misiones y desbloquea todas las medallas!')}</p>
    <div class="badges-grid" id="badges-slot"></div>
  `;

  const slot = document.getElementById('badges-slot')!;
  for (const b of ARTEMIS_BADGES) {
    const unlocked = st.unlockedBadges.includes(b.id);
    const el = document.createElement('div');
    el.className = `badge-item ${unlocked ? 'unlocked' : 'locked'}`;
    el.innerHTML = `
      <span class="bi-icon">${b.icon}</span>
      <div class="bi-info">
        <span class="bi-title">${tr(lang, b.titleKey)} ${unlocked ? '✅' : '🔒'}</span>
        <span class="bi-desc">${tr(lang, b.descKey)}</span>
        <span class="bi-fact">💡 ${tr(lang, b.factKey)}</span>
      </div>
    `;
    slot.appendChild(el);
  }

  engine.setPausedForModal(true);
  modalBackdrop.classList.remove('hidden');
}

function openRankModal(): void {
  const st = engine.state;
  if (st.tutorial) {
    modalTitle.textContent = L('Conhecimento da missão','Mission knowledge','Conocimiento de la misión');
    modalBody.innerHTML = `<h3>${L('Nível','Level','Nivel')} ${tutorialLevel(st.xp)} · ${levelProgress(st.xp)}/20 ${L('conhecimento','knowledge','conocimiento')}</h3><p>${L('Compartilhar descobertas com a Terra gera conhecimento. Complete a transmissão para chegar ao nível 2, com 20 de conhecimento. Cada segundo de envio vale 1.','Sharing discoveries with Earth earns knowledge. Finish the transmission to reach level 2 with 20 knowledge points. Each second of transmission earns 1.','Compartir descubrimientos con la Tierra genera conocimiento. Completa la transmisión para alcanzar el nivel 2 con 20 de conocimiento. Cada segundo de envío vale 1.')}</p>`;
    engine.setPausedForModal(true); modalBackdrop.classList.remove('hidden'); return;
  }
  modalTitle.textContent = `🎖️ ${L('Patente Espacial da Turma', 'Crew Space Rank', 'Rango Espacial')}`;
  const nextRank = ARTEMIS_RANKS.find((r) => r.minXp > st.xp);
  const progressPct = nextRank ? Math.min(100, Math.round((st.xp / nextRank.minXp) * 100)) : 100;

  modalBody.innerHTML = `
    <div class="telemetry-panel">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <strong>${L('Conhecimento total','Total knowledge','Conocimiento total')}: ${st.xp}</strong>
        <span>${nextRank ? `${L('Próximo nível:', 'Next rank:', 'Siguiente:')} ${nextRank.minXp} ${L('conhecimento','knowledge','conocimiento')}` : '🏆 Nível Máximo!'}</span>
      </div>
      <div class="bar-track" style="width:100%;height:12px;margin-top:8px">
        <div class="bar-fill green" style="width:${progressPct}%"></div>
      </div>
    </div>
    <div id="ranks-list" style="display:flex;flex-direction:column;gap:8px"></div>
  `;

  const list = document.getElementById('ranks-list')!;
  for (const r of ARTEMIS_RANKS) {
    const unlocked = st.xp >= r.minXp;
    const isCurrent = st.rank === r.id;
    const row = document.createElement('div');
    row.className = `badge-item ${unlocked ? 'unlocked' : 'locked'}`;
    row.innerHTML = `
      <span class="bi-icon">${r.icon}</span>
      <div class="bi-info" style="flex:1">
        <span class="bi-title">${tr(lang, r.nameKey)} (${r.minXp} ${L('conhecimento','knowledge','conocimiento')}) ${isCurrent ? '⭐ ATUAL' : unlocked ? '✅' : '🔒'}</span>
        <span class="bi-desc">${tr(lang, r.descKey)}</span>
        <span class="bi-fact">✨ ${tr(lang, r.perkKey)}</span>
      </div>
    `;
    list.appendChild(row);
  }

  engine.setPausedForModal(true);
  modalBackdrop.classList.remove('hidden');
}

function openTradeModal(): void {
  const hasDsn = engine.state.buildings.some((b) => b.type === 'dsn_antenna' && b.built);
  const costAmt = hasDsn ? 40 : 50;
  modalTitle.textContent = `📦 ${L('Trocar Itens com a Terra', 'Earth Supply Swap', 'Intercambio Terra-Luna')}`;
  modalBody.innerHTML = `
    <p style="font-size:13px;margin-top:0">${L(
      `Envie ${costAmt} itens que estão sobrando e receba +35 do que falta na base!`,
      `Send ${costAmt} extra supplies and receive +35 of what you need!`,
      `Envía ${costAmt} recursos extra y recibe +35 necesarios!`
    )}</p>
    <p class="science-note">${L('O rádio leva cerca de 1,3 s por sentido entre Terra e Lua. Em Marte, cerca de 4 a 24 minutos. Aqui a espera marciana vira 24 s de treino; a troca de itens é uma simplificação. Foguetes de suprimentos levam muito mais tempo.','Radio takes about 1.3 s each way between Earth and Moon, and about 4 to 24 minutes for Mars. Mars waiting is compressed to 24 training seconds; trading is an abstraction. Supply rockets take much longer.','La radio tarda unos 1,3 s por sentido entre Tierra y Luna y de 4 a 24 minutos para Marte. Aquí Marte usa 24 s de entrenamiento; el intercambio es una simplificación. Los cohetes de suministros tardan mucho más.')}</p>
    ${engine.state.pendingTrade ? `<p role="status">${L('Pedido enviado. Feche esta janela para esperar a resposta.','Order sent. Close this window to wait for the reply.','Pedido enviado. Cierra esta ventana para esperar la respuesta.')} (${Math.ceil(engine.state.pendingTrade.remainingSec)} s)</p>` : ''}
    <div class="cards-grid">
      <button class="rogue-card" data-sell="regolith" data-buy="oxygen" type="button">
        <span class="rc-icon">🪨 ➔ 💧</span>
        <span class="rc-title">${costAmt} 🪨 ➔ +35 💧</span>
      </button>
      <button class="rogue-card" data-sell="energy" data-buy="food" type="button">
        <span class="rc-icon">⚡ ➔ 🌱</span>
        <span class="rc-title">${costAmt} ⚡ ➔ +35 🌱</span>
      </button>
      <button class="rogue-card" data-sell="oxygen" data-buy="energy" type="button">
        <span class="rc-icon">💧 ➔ ⚡</span>
        <span class="rc-title">${costAmt} 💧 ➔ +35 ⚡</span>
      </button>
      <button class="rogue-card" data-sell="food" data-buy="regolith" type="button">
        <span class="rc-icon">🌱 ➔ 🪨</span>
        <span class="rc-title">${costAmt} 🌱 ➔ +35 🪨</span>
      </button>
    </div>
  `;

  modalBody.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sell = btn.dataset.sell as ResourceKey;
      const buy = btn.dataset.buy as ResourceKey;
      if (engine.tradeViaDsn(sell, buy)) {
        emitSparkles(cam.x, cam.y, 16, '#4ade80');
        updateHud();
        openTradeModal();
      } else {
        sfx.errorBuzz();
      }
    });
  });

  engine.setPausedForModal(true);
  modalBackdrop.classList.remove('hidden');
}

function openSettingsModal(): void {
  const st = engine.state;
  modalTitle.textContent = `⚙️ ${L('Ajustes & Sala de Aula', 'Settings & Classroom', 'Ajustes y Aula')}`;
  modalBody.innerHTML = `
    <div class="settings-group">
      <div class="settings-row">
        <strong>🗣️ ${L('Idioma do Jogo:', 'Language:', 'Idioma:')}</strong>
        <select id="modal-lang-select" class="px-select">
          <option value="pt" ${lang === 'pt' ? 'selected' : ''}>🇧🇷 Português</option>
          <option value="en" ${lang === 'en' ? 'selected' : ''}>🇺🇸 English</option>
          <option value="es" ${lang === 'es' ? 'selected' : ''}>🇪🇸 Español</option>
        </select>
      </div>
      <div class="settings-row">
        <strong>🔊 ${L('Efeitos Sonoros:', 'Sound Effects:', 'Sonido:')}</strong>
        <button id="modal-btn-mute" class="btn-chip" type="button">
          ${sfx.muted ? L('🔇 Som Desligado', '🔇 Sound Off', '🔇 Sin Sonido') : L('🔊 Som Ligado', '🔊 Sound On', '🔊 Sonido Activado')}
        </button>
      </div>
    </div>

    <div class="settings-group">
      <strong>🏫 ${L('Modo Sala de Aula (Para Professores)', 'Classroom Mode (For Teachers)', 'Modo Aula (Profesores)')}</strong>
      <p style="margin:0;font-size:12px;color:var(--ink-soft)">${L(
        'Todo mundo usa o mesmo Código da Turma para realizar a mesma expedição de 10 minutos!',
        'Everyone uses the same Class Seed for a 10-minute expedition!',
        '¡Todos usan el mismo código para la expedición escolar de 10 minutos!'
      )}</p>
      <div class="settings-row">
        <input id="seed-input" value="${escapeHtml(st.seedCode)}" style="flex:1;min-width:130px;padding:7px;border-radius:6px;border:2px solid var(--wood-dark);background:#fff;font-family:Silkscreen,monospace;font-size:13px" />
        <button id="btn-start-classroom" class="btn-chip accent" type="button">${L('Iniciar Aula (10 min)', 'Start Class (10m)', 'Iniciar Aula')}</button>
        <button id="btn-start-campaign" class="btn-chip" type="button">${L('Modo Livre', 'Free Play', 'Modo Libre')}</button>
      </div>
    </div>

    <div class="settings-row">
      <button id="btn-open-report" class="btn-chip" type="button">📊 ${L('Ver Pontuação da Turma', 'View Score Report', 'Ver Informe')}</button>
      <button id="btn-restart-mission" class="btn-chip danger" type="button">🔄 ${L('Recomeçar Vila', 'Reset Village', 'Reiniciar Aldea')}</button>
    </div>
  `;

  document.getElementById('modal-lang-select')?.addEventListener('change', (e) => {
    lang = (e.target as HTMLSelectElement).value as Lang;
    sfx.click();
    updateHud();
    lastDockSig = '';
    renderDock();
    openSettingsModal();
  });

  document.getElementById('modal-btn-mute')?.addEventListener('click', () => {
    sfx.muted = !sfx.muted;
    openSettingsModal();
  });

  document.getElementById('btn-start-classroom')?.addEventListener('click', () => {
    const seed = ((document.getElementById('seed-input') as HTMLInputElement).value || 'TURMA-4A').trim().toUpperCase();
    engine.resetMission('classroom', seed);
    sfx.success();
    closeModal();
    lastDockSig = '';
    updateHud();
    renderDock();
  });

  document.getElementById('btn-start-campaign')?.addEventListener('click', () => {
    engine.resetMission('campaign', 'ARTEMIS-7A');
    sfx.click();
    closeModal();
    lastDockSig = '';
    updateHud();
    renderDock();
  });

  document.getElementById('btn-open-report')?.addEventListener('click', () => {
    sfx.click();
    openReportModal();
  });

  document.getElementById('btn-restart-mission')?.addEventListener('click', () => {
    engine.resetMission(st.mode, st.seedCode);
    sfx.click();
    closeModal();
    lastDockSig = '';
    updateHud();
    renderDock();
  });

  engine.setPausedForModal(true);
  modalBackdrop.classList.remove('hidden');
}

function openReportModal(): void {
  const s = engine.state;
  const stars = s.score >= 2500 ? '⭐⭐⭐' : s.score >= 1200 ? '⭐⭐' : '⭐';
  if (!modalTitle.textContent || !modalTitle.textContent.includes('VICT') && !modalTitle.textContent.includes('MISS')) {
    modalTitle.textContent = `📊 ${L('Relatório da Vila Lunar', 'Lunar Outpost Report', 'Informe de la Aldea')}`;
  }

  modalBody.innerHTML = `
    <div style="text-align:center;font-size:30px;margin-bottom:6px">${stars}</div>
    <p style="text-align:center;font-size:15px;font-weight:700;margin-top:0">${L('Pontos Totais', 'Total Score', 'Puntos')}: ${s.score}</p>
    <div class="cards-grid">
      <div class="stat-pill"><b>${L('Modo / Turma', 'Mode / Seed', 'Modo / Código')}:</b><br/>${s.mode.toUpperCase()} • ${escapeHtml(s.seedCode)}</div>
      <div class="stat-pill"><b>${L('Dia Lunar', 'Lunar Day', 'Día Lunar')}:</b><br/>${s.sol}</div>
      <div class="stat-pill"><b>${L('Tempestades Vencidas', 'Storms Survived', 'Tormentas')}:</b><br/>${s.stormsSurvived}</div>
      <div class="stat-pill"><b>${L('Patente', 'Rank', 'Rango')}:</b><br/>${s.xp} ${L('conhecimento','knowledge','conocimiento')}</div>
      <div class="stat-pill"><b>${L('Medalhas', 'Badges', 'Medallas')}:</b><br/>${s.unlockedBadges.length} / ${ARTEMIS_BADGES.length}</div>
    </div>
    <div style="margin-top:14px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
      <button id="btn-play-again" class="btn-chip accent" type="button">🔄 ${L('Nova Partida', 'Play Again', 'Jugar de Nuevo')}</button>
      <button id="btn-report-close" class="btn-chip" type="button">${tr(lang, 'close')}</button>
    </div>
  `;

  document.getElementById('btn-play-again')?.addEventListener('click', () => {
    engine.resetMission(s.mode, s.seedCode);
    closeModal();
    lastDockSig = '';
    updateHud();
    renderDock();
  });
  document.getElementById('btn-report-close')?.addEventListener('click', closeModal);

  engine.setPausedForModal(true);
  modalBackdrop.classList.remove('hidden');
}

function updateHud(): void {
  const st = engine.state;
  missionFlow.sync();
  document.getElementById('vitals-strip')!.classList.toggle('tutorial-vitals',!!st.tutorial);
  document.getElementById('hud-mission')!.textContent = polarMission(st)?L('Missão: polo sul','Mission: south pole','Misión: polo sur'):L('Missão: Lua', 'Mission: Moon', 'Misión: Luna');
  document.getElementById('val-coins')!.textContent = String(st.expedition.coins);
  document.getElementById('hud-sol')!.textContent = `☀️ ${L('Dia', 'Day', 'Día')} ${st.sol}`;

  const rankObj = ARTEMIS_RANKS.find((r) => r.id === st.rank) || ARTEMIS_RANKS[0];
  document.getElementById('rank-icon')!.textContent = rankObj.icon;
  document.getElementById('rank-name')!.textContent = st.tutorial ? `${L('Nível','Level','Nivel')} ${tutorialLevel(st.xp)}` : tr(lang, rankObj.nameKey);

  // Atualiza aba de construcao/turma conforme idioma
  const tabBuild = document.querySelector('.dock-tab[data-tab="build"]');
  const tabCrew = document.querySelector('.dock-tab[data-tab="crew"]');
  if (tabBuild) tabBuild.textContent = L('🔨 Construir', '🔨 Build', '🔨 Construir');
  if (tabCrew) tabCrew.textContent = L('🧑‍🚀 Turma & Base', '🧑‍🚀 Crew & Base', '🧑‍🚀 Equipo');

  const timerEl = document.getElementById('hud-classroom-timer')!;
  if (st.mode === 'classroom') {
    timerEl.classList.remove('hidden');
    const mins = Math.floor(st.classroomTimeLeftSec / 60);
    const secs = Math.floor(st.classroomTimeLeftSec % 60);
    timerEl.textContent = `⏱️ ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  } else {
    timerEl.classList.add('hidden');
  }

  document.getElementById('val-energy')!.textContent = String(Math.round(st.resources.energy));
  document.getElementById('val-oxygen')!.textContent = String(Math.round(st.resources.oxygen));
  document.getElementById('val-food')!.textContent = String(Math.round(st.resources.food));
  document.getElementById('val-water')!.textContent = String(Math.round(st.resources.water));
  document.getElementById('val-pop')!.textContent = `${st.pop}/${st.popCap}`;
  document.getElementById('val-score')!.textContent = String(st.score);
  const progress=levelProgress(st.xp),meter=document.getElementById('knowledge-meter')!;
  document.getElementById('knowledge-fill')!.style.width=`${progress/KNOWLEDGE_PER_LEVEL*100}%`;
  document.getElementById('knowledge-number')!.textContent=`${progress}/${KNOWLEDGE_PER_LEVEL}`;
  document.getElementById('knowledge-label')!.textContent=L('Conhecimento','Knowledge','Conocimiento');
  meter.setAttribute('aria-valuenow',String(progress));
  meter.setAttribute('aria-label',L('Conhecimento para o próximo nível','Knowledge toward the next level','Conocimiento para el siguiente nivel'));
  meter.title=L(`Faltam ${KNOWLEDGE_PER_LEVEL-progress} de conhecimento para o nível ${tutorialLevel(st.xp)+1}. Total: ${st.xp}.`,`${KNOWLEDGE_PER_LEVEL-progress} knowledge points to level ${tutorialLevel(st.xp)+1}. Total: ${st.xp}.`,`Faltan ${KNOWLEDGE_PER_LEVEL-progress} de conocimiento para el nivel ${tutorialLevel(st.xp)+1}. Total: ${st.xp}.`);

  (document.getElementById('bar-life') as HTMLElement).style.width = `${Math.round(st.lifeSupportHealth)}%`;
  (document.getElementById('bar-shield') as HTMLElement).style.width = `${Math.round(st.shieldIntegrity)}%`;
  (document.getElementById('bar-rad') as HTMLElement).style.width = `${Math.round(st.radiationLevel)}%`;
  document.getElementById('num-life')!.textContent = `${Math.round(st.lifeSupportHealth)}%`;
  document.getElementById('num-shield')!.textContent = `${Math.round(st.shieldIntegrity)}%`;
  document.getElementById('num-rad')!.textContent = `${Math.round(st.radiationLevel)}%`;

  const radChip = document.getElementById('rad-chip')!;
  radChip.classList.remove('hidden');
  radChip.dataset.label = L('Radiação acumulada','Accumulated radiation','Radiación acumulada');
  radChip.title = L('Radiação acumulada. Limite educativo: 100%.','Accumulated radiation. Educational limit: 100%.','Radiación acumulada. Límite educativo: 100%.');

  const banner = document.getElementById('crisis-banner')!;
  const vignette = document.getElementById('crisis-vignette')!;
  const trainingAlert=st.tutorial?.step==='warning'||st.tutorial?.step==='storm';
  banner.classList.toggle('tutorial-alert',trainingAlert);
  if(trainingAlert){
    banner.classList.remove('hidden');vignette.classList.add('hidden');
    const arriving=st.tutorial!.step==='warning';
    document.getElementById('crisis-title')!.textContent=arriving?L('⚠ TEMPESTADE SOLAR A CAMINHO','⚠ SOLAR STORM APPROACHING','⚠ SE ACERCA UNA TORMENTA SOLAR'):L('⚠ TEMPESTADE SOLAR','⚠ SOLAR STORM','⚠ TORMENTA SOLAR');
    document.getElementById('crisis-desc')!.textContent=L('Treinamento: permaneça no abrigo.','Training: stay sheltered.','Entrenamiento: permanece en el refugio.');
    const seconds=Math.max(0,Math.ceil((arriving?WARNING_SECONDS:12)-st.tutorial!.elapsed));
    document.getElementById('crisis-timer')!.textContent=arriving?L(`Chega em ${seconds}s`,`Arrives in ${seconds}s`,`Llega en ${seconds}s`):`${seconds}s`;
    btnCrisisShelter.textContent=L('Abrigar equipe','Shelter crew','Refugiar equipo');
  } else if (st.activeCrisis) {
    banner.classList.remove('hidden');
    vignette.classList.remove('hidden');
    const refText = st.activeCrisis.donkiRef ? ` [${st.activeCrisis.donkiRef}]` : '';
    document.getElementById('crisis-title')!.textContent = tr(lang, st.activeCrisis.titleKey) + refText;
    document.getElementById('crisis-desc')!.textContent = tr(lang, st.activeCrisis.descKey);
    document.getElementById('crisis-timer')!.textContent = `${Math.ceil(st.activeCrisis.remainingSec)}s`;
    btnCrisisShelter.textContent = `🚨 ${L('Abrigar!', 'Shelter!', 'Refugiar!')}`;
  } else {
    banner.classList.add('hidden');
    vignette.classList.add('hidden');
  }

  if (!st.tutorial && (st.gameOver || st.victory) && modalBackdrop.classList.contains('hidden')) {
    modalTitle.textContent = st.victory ? tr(lang, 'victory_title') : tr(lang, 'gameover_title');
    openReportModal();
  }
}

// Loop de Simulacao (10 ticks/s) + Loop de Renderizacao (60fps)
let uiRefreshTick = 0;
window.setInterval(() => {
  engine.step();
  uiRefreshTick++;
  if (uiRefreshTick >= 3) {
    uiRefreshTick = 0;
    updateHud();
    renderDock();
  }
}, TICK_MS);

function renderLoop(nowMs: number): void {
  const camSpeed = 0.14;
  if (keysDown.has('w') || keysDown.has('arrowup')) cam.y -= camSpeed;
  if (keysDown.has('s') || keysDown.has('arrowdown')) cam.y += camSpeed;
  if (keysDown.has('a') || keysDown.has('arrowleft')) cam.x -= camSpeed;
  if (keysDown.has('d') || keysDown.has('arrowright')) cam.x += camSpeed;
  cam.x = Math.max(2, Math.min(MAP_SIZE - 2, cam.x));
  cam.y = Math.max(2, Math.min(MAP_SIZE - 2, cam.y));

  const rect = canvas.getBoundingClientRect();
  renderWorld(
    ctx,
    engine.state,
    cam,
    rect.width,
    rect.height,
    placementType,
    hoverWorld,
    (t, gx, gy) => engine.canPlaceBuilding(t, gx, gy),
    nowMs / 1000
  );
  requestAnimationFrame(renderLoop);
}

renderDock();
updateHud();
requestAnimationFrame(renderLoop);
