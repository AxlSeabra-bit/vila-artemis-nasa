import { BUILDING_DEFS, MAP_SIZE } from './constants';
import { ROCKET } from './surfaceTutorial';
import { cratersFor, layoutFor, POLAR_ROCKS, POLAR_RESEARCH_SITE } from './lunarTerrain';
import {
  getAstronautSprite,
  getBuildingSprite,
  getCarryIconSprite,
  getCraterCliffSprite,
  getDropSprite,
  getEarthSprite,
  getEmoteBubbleSprite,
  getNodeSprite,
  getPathTileSprite,
  getRoverSprite,
  getTerrainTileSprite,
} from './pixelSprites';
import type { Building, BuildingType, GameStateSnapshot } from './types';

export const TILE_PX = 44;

export interface CameraView {
  x: number; // world center x
  y: number; // world center y
  zoom: number;
}

export interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const activeParticles: SparkleParticle[] = [];

export function emitSparkles(wx: number, wy: number, count = 16, color = '#facc15'): void {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 1.0 + Math.random() * 1.9;
    activeParticles.push({
      x: wx,
      y: wy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.7 + Math.random() * 0.45,
      maxLife: 1.15,
      size: 3 + (i % 3),
      color,
    });
  }
}

// Projecao 3/4 Top-Down estilo Stardew Valley (nitidez pixelada)
export function worldToScreen(
  wx: number,
  wy: number,
  cam: CameraView,
  canvasW: number,
  canvasH: number
): { sx: number; sy: number } {
  const tile = TILE_PX * cam.zoom;
  return {
    sx: Math.round(canvasW / 2 + (wx - cam.x) * tile),
    sy: Math.round(canvasH / 2 + (wy - cam.y) * tile),
  };
}

export function screenToWorld(
  sx: number,
  sy: number,
  cam: CameraView,
  canvasW: number,
  canvasH: number
): { wx: number; wy: number } {
  const tile = TILE_PX * cam.zoom;
  return {
    wx: cam.x + (sx - canvasW / 2) / tile,
    wy: cam.y + (sy - canvasH / 2) / tile,
  };
}

function tileHash(gx: number, gy: number): number {
  return Math.abs((gx * 73856093) ^ (gy * 19349663)) % 17;
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  state: GameStateSnapshot,
  cam: CameraView,
  w: number,
  h: number,
  placementType: BuildingType | null,
  hoverWorld: { wx: number; wy: number } | null,
  canPlaceFn: (type: BuildingType, gx: number, gy: number) => boolean,
  timeSec: number
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Screen shake suave em tempestades e coleta de meteoritos
  if (state.screenShakeSec > 0) {
    const shakeMag = 3 * Math.min(1, state.screenShakeSec);
    const shakeX = Math.round((Math.random() - 0.5) * 2 * shakeMag);
    const shakeY = Math.round((Math.random() - 0.5) * 2 * shakeMag);
    ctx.translate(shakeX, shakeY);
  }

  const isMars = state.expedition.destination === 'mars';
  const tilePx = Math.max(16, Math.round(TILE_PX * cam.zoom));
  const animSlow = Math.floor(timeSec * 2.2) % 2;
  const animWalk = Math.floor(timeSec * 6.5) % 2;

  // Fundo estrelado estilo Stardew noite espacial
  ctx.fillStyle = isMars ? '#2a120d' : '#121329';
  ctx.fillRect(-10, -10, w + 20, h + 20);

  for (let i = 0; i < 42; i++) {
    const sx = (i * 197 + 19) % Math.max(1, w);
    const sy = (i * 113 + 11) % Math.max(1, h);
    const twinkle = Math.sin(timeSec * 2.5 + i) > 0.2 ? 0.85 : 0.3;
    ctx.fillStyle = `rgba(255, 250, 220, ${twinkle.toFixed(2)})`;
    const sz = i % 3 === 0 ? 3 : 2;
    ctx.fillRect(sx, sy, sz, sz);
  }

  // Planeta Terra Pixelado no topo esquerdo ou direito do vale
  if (!isMars) {
    const topEdge = worldToScreen(MAP_SIZE / 2, -0.6, cam, w, h);
    const earthY = Math.max(22, Math.min(topEdge.sy - 26, Math.round(h * 0.14)));
    const earthX = Math.round(w * 0.84);
    const earthSize = Math.round(48 * Math.max(0.85, Math.min(1.15, cam.zoom)));
    ctx.drawImage(getEarthSprite(), earthX - earthSize / 2, earthY - earthSize / 2, earthSize, earthSize);
  }

  // Mapa de pisos de pedra (caminhos ligando a base)
  const pathSet = new Set<string>();
  for (let x = 11; !state.tutorial && x <= 17; x++) {
    pathSet.add(`${x},14`);
    pathSet.add(`${x},15`);
  }
  for (let y = 11; !state.tutorial && y <= 17; y++) {
    pathSet.add(`14,${y}`);
    pathSet.add(`15,${y}`);
  }
  for (const b of state.buildings) {
    const sz = BUILDING_DEFS[b.type].size;
    for (let dx = 0; dx < sz; dx++) {
      for (let dy = 0; dy < sz; dy++) {
        pathSet.add(`${b.x + dx},${b.y + dy}`);
      }
    }
    // Calcada aconchegante na porta frontal
    pathSet.add(`${b.x},${b.y + sz}`);
    if (sz > 1) pathSet.add(`${b.x + 1},${b.y + sz}`);
  }

  // Ciclo dia / entardecer / noite lunar
  const nightDarkness = state.activeCrisis?.kind === 'lunar_night' ? 0.42 : 0.78 + 0.22 * state.dayNightCycle;
  const isNight = nightDarkness < 0.72;

  const pathSprite = getPathTileSprite();
  const cliffSprite = getCraterCliffSprite();

  // Desenha apenas tiles visiveis na viewport para 60 FPS garantidos
  const topLeftWorld = screenToWorld(-tilePx, -tilePx, cam, w, h);
  const botRightWorld = screenToWorld(w + tilePx, h + tilePx, cam, w, h);
  const minGx = Math.max(0, Math.floor(topLeftWorld.wx));
  const maxGx = Math.min(MAP_SIZE - 1, Math.ceil(botRightWorld.wx));
  const minGy = Math.max(0, Math.floor(topLeftWorld.wy));
  const maxGy = Math.min(MAP_SIZE - 1, Math.ceil(botRightWorld.wy));

  for (let gy = minGy; gy <= maxGy; gy++) {
    for (let gx = minGx; gx <= maxGx; gx++) {
      const p = worldToScreen(gx, gy, cam, w, h);
      const isBorder = gx === 0 || gy === 0 || gx === MAP_SIZE - 1 || gy === MAP_SIZE - 1;
      let sprite: HTMLCanvasElement;
      if (isBorder) {
        sprite = cliffSprite;
      } else if (pathSet.has(`${gx},${gy}`)) {
        sprite = pathSprite;
      } else {
        sprite = getTerrainTileSprite(tileHash(gx, gy), isMars);
      }
      ctx.drawImage(sprite, p.sx, p.sy, tilePx + 1, tilePx + 1);
      if (isMars && !isBorder && !pathSet.has(`${gx},${gy}`) && tileHash(gx,gy)===7) {
        ctx.fillStyle='#713d31';ctx.fillRect(p.sx+tilePx*.6,p.sy+tilePx*.5,8,5);
        ctx.fillStyle='#cf8858';ctx.fillRect(p.sx+tilePx*.6,p.sy+tilePx*.5,6,2);
      }
    }
  }

  if(state.tutorial)for(const crater of cratersFor(layoutFor(state))){
    const p=worldToScreen(crater.x,crater.y,cam,w,h);
    ctx.save();ctx.translate(p.sx,p.sy);ctx.scale(TILE_PX*cam.zoom*crater.size/48,TILE_PX*cam.zoom*crater.size/48);
    const shape=(points:number[][],color:string)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
    const cut=Math.floor(crater.size/4)*48/crater.size,far=48-cut;
    shape([[cut,0],[far,0],[far,cut],[48,cut],[48,far],[far,far],[far,48],[cut,48],[cut,far],[0,far],[0,cut],[cut,cut]],'#9f9bad');
    shape([[14,5],[34,5],[34,14],[43,14],[43,34],[34,34],[34,43],[14,43],[14,34],[5,34],[5,14],[14,14]],'#55546c');
    shape([[16,10],[32,10],[32,16],[38,16],[38,32],[32,32],[32,38],[16,38],[16,32],[10,32],[10,16],[16,16]],'#292a42');
    ctx.fillStyle='#383950';ctx.fillRect(16,26,16,10);ctx.fillStyle='#c2bac7';ctx.fillRect(12,0,24,3);ctx.fillRect(0,12,3,18);ctx.fillStyle='#77788c';ctx.fillRect(14,43,20,4);ctx.fillRect(43,16,4,16);
    ctx.restore();
  }
  if(state.tutorial&&layoutFor(state)==='polar'){
    for(const rock of POLAR_ROCKS){
      const p=worldToScreen(rock.x,rock.y,cam,w,h);
      ctx.fillStyle='#292a3b';ctx.fillRect(p.sx,p.sy,tilePx,tilePx);
      ctx.fillStyle='#676b80';ctx.fillRect(p.sx+3*cam.zoom,p.sy+3*cam.zoom,tilePx-6*cam.zoom,tilePx-9*cam.zoom);
      ctx.fillStyle='#a6a6b6';ctx.fillRect(p.sx+6*cam.zoom,p.sy+4*cam.zoom,tilePx*.45,7*cam.zoom);
      ctx.fillStyle='#41485c';ctx.fillRect(p.sx+tilePx*.55,p.sy+tilePx*.4,tilePx*.35,tilePx*.4);
    }
    const flag=worldToScreen(POLAR_RESEARCH_SITE.x,POLAR_RESEARCH_SITE.y,cam,w,h);
    ctx.fillStyle='#c3d6e1';ctx.fillRect(flag.sx-2,flag.sy-34*cam.zoom,3*cam.zoom,34*cam.zoom);
    ctx.fillStyle='#3794c4';ctx.fillRect(flag.sx+1,flag.sy-34*cam.zoom,24*cam.zoom,18*cam.zoom);
    ctx.fillStyle='#b3ebed';ctx.fillRect(flag.sx+8*cam.zoom,flag.sy-29*cam.zoom,8*cam.zoom,9*cam.zoom);
    ctx.fillStyle='#e8fbec';ctx.fillRect(flag.sx+10*cam.zoom,flag.sy-31*cam.zoom,4*cam.zoom,4*cam.zoom);
  }

  // Sombreamento suave de anoitecer lunar (Stardew twilight tint)
  if (isMars && state.activeCrisis?.kind==='dust_storm') {
    ctx.fillStyle='rgba(216,132,73,0.23)';
    ctx.fillRect(0,0,w,h);
    for(let i=0;i<28;i++) ctx.fillRect((i*71+timeSec*37)%w,(i*43)%h,5,2);
  }
  if (nightDarkness < 0.96) {
    const shadeAlpha = Math.max(0, Math.min(0.42, (1 - nightDarkness) * 0.75));
    const mapTopLeft = worldToScreen(0, 0, cam, w, h);
    ctx.fillStyle = `rgba(15, 23, 58, ${shadeAlpha.toFixed(3)})`;
    ctx.fillRect(mapTopLeft.sx, mapTopLeft.sy, MAP_SIZE * tilePx, MAP_SIZE * tilePx);
  }

  // Previa de posicionamento de modulo (ghost placement nitido)
  if (placementType && hoverWorld) {
    const gx = Math.floor(hoverWorld.wx);
    const gy = Math.floor(hoverWorld.wy);
    const size = BUILDING_DEFS[placementType].size;
    const valid = canPlaceFn(placementType, gx, gy);
    const p = worldToScreen(gx, gy, cam, w, h);
    const bw = size * tilePx;

    ctx.save();
    ctx.fillStyle = valid ? 'rgba(74, 222, 128, 0.38)' : 'rgba(248, 113, 113, 0.42)';
    ctx.fillRect(p.sx, p.sy, bw, bw);
    ctx.strokeStyle = valid ? '#4ade80' : '#f87171';
    ctx.lineWidth = 3;
    ctx.strokeRect(p.sx + 1, p.sy + 1, bw - 2, bw - 2);
    ctx.globalAlpha = 0.78;
    const ghostSprite = getBuildingSprite(placementType, 0, isNight);
    ctx.drawImage(ghostSprite, p.sx, p.sy - Math.round(bw * 0.12), bw, bw);
    ctx.restore();
  }

  // Ordenacao Top-Down por eixo Y (profundidade Stardew Valley)
  type DrawItem = { depth: number; draw: () => void };
  const drawList: DrawItem[] = [];
  if (state.tutorial) drawList.push({ depth: ROCKET.y, draw: () => {
    const p = worldToScreen(ROCKET.x, ROCKET.y, cam, w, h);
    ctx.save(); ctx.translate(p.sx, p.sy); ctx.scale(cam.zoom * 1.8, cam.zoom * 1.8);
    const r=(x:number,y:number,a:number,b:number,color:string)=>{ctx.fillStyle=color;ctx.fillRect(x,y,a,b);};
    r(-23,-1,46,5,'#555769');r(-6,-49,12,6,'#efc477');r(-10,-43,20,9,'#fff0d4');
    r(-12,-34,24,29,'#f8efdb');r(5,-34,7,29,'#b4c1ce');r(-7,-31,14,11,'#263e61');r(-4,-29,7,5,'#80d6e1');
    r(-12,-15,24,4,'#b94f4e');r(-19,-14,7,15,'#c26052');r(12,-14,7,15,'#c26052');r(-6,-8,12,11,'#657387');
    r(-5,-3,10,2,'#e8d9b7');r(-6,1,12,2,'#e8d9b7');
    ctx.restore();
  }});

  // Lagos de gelo e cristais de regolito
  for (const n of state.nodes) {
    if (n.amount <= 0) continue;
    drawList.push({
      depth: n.y + 0.45,
      draw: () => {
        const pos = worldToScreen(n.x - 0.5, n.y - 0.5, cam, w, h);
        if (pos.sx < -tilePx * 2 || pos.sx > w + tilePx * 2 || pos.sy < -tilePx * 2 || pos.sy > h + tilePx * 2) return;
        const sz = Math.round(tilePx * 1.15);
        const sprite = getNodeSprite(n.type, animSlow + (n.id % 2));
        // Sombra pixelada leve
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.fillRect(pos.sx + 4, pos.sy + sz - 8, sz - 8, 6);
        ctx.drawImage(sprite, pos.sx, pos.sy, sz, sz);
      },
    });
  }

  // Eventos clicaveis no mapa (Capsulas de presente & meteoritos dourados)
  for (const drop of state.clickableEvents) {
    drawList.push({
      depth: drop.y + 0.6,
      draw: () => {
        const pos = worldToScreen(drop.x - 0.5, drop.y - 0.5, cam, w, h);
        const bob = Math.round(Math.sin(timeSec * 5 + drop.id) * 4 * cam.zoom);
        const sz = Math.round(tilePx * 1.05);

        ctx.save();
        // Moldura pixel pulsante amarela para chamar atencao das criancas
        const ringPad = animSlow === 0 ? 3 : 5;
        ctx.strokeStyle = drop.type === 'supply_pod' ? '#38bdf8' : '#facc15';
        ctx.lineWidth = 2;
        ctx.strokeRect(pos.sx - ringPad, pos.sy - ringPad + bob, sz + ringPad * 2, sz + ringPad * 2);

        // Sombra fixa no chao
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.fillRect(pos.sx + 6, pos.sy + sz - 5, sz - 12, 6);

        ctx.drawImage(getDropSprite(drop.type, animSlow), pos.sx, pos.sy + bob, sz, sz);
        ctx.restore();
      },
    });
  }

  // Construcoes Pixel Art
  for (const b of state.buildings) {
    const def = BUILDING_DEFS[b.type];
    drawList.push({
      depth: b.y + def.size - 0.1,
      draw: () => drawPixelBuilding(ctx, b, cam, w, h, timeSec, animSlow, isNight, !!state.activeCrisis),
    });
  }

  // Astronautas e Rover VIPER animados
  for (const u of state.units) {
    if (u.state === 'sheltered') continue;
    drawList.push({
      depth: u.y + 0.3,
      draw: () => {
        const pos = worldToScreen(u.x, u.y, cam, w, h);
        if (pos.sx < -tilePx * 2 || pos.sx > w + tilePx * 2 || pos.sy < -tilePx * 2 || pos.sy > h + tilePx * 2) return;

        const isMoving = u.state === 'moving' || u.state === 'returning';
        const isWorking = u.state === 'gathering' || u.state === 'building';
        const frame = isMoving || isWorking ? (animWalk + (u.id % 2)) % 2 : 0;
        const hop = isMoving ? (frame === 0 ? -2 : 0) : 0;
        const facingRight = u.route?.[0] ? u.route[0].x>=u.x : u.targetX === null ? u.id % 2 === 0 : u.targetX >= u.x;

        const charW = Math.round(tilePx * 0.86);
        const charH = Math.round(tilePx * 0.86);
        const drawX = Math.round(pos.sx - charW / 2);
        const drawY = Math.round(pos.sy - charH * 0.72 + hop);

        ctx.save();
        // Sombra pixelada no chao
        ctx.fillStyle = 'rgba(10, 14, 30, 0.45)';
        ctx.fillRect(drawX + Math.round(charW * 0.18), Math.round(pos.sy - 2), Math.round(charW * 0.64), 5);

        if (u.type === 'astronaut') {
          ctx.drawImage(getAstronautSprite(facingRight, frame, u.carryType, isWorking), drawX, drawY, charW, charH);
        } else {
          ctx.drawImage(getRoverSprite(facingRight, frame), drawX, drawY + 4, charW, Math.round(charH * 0.78));
        }

        // Item carregado acima da cabeca (pose classica Stardew Valley!)
        if (u.carryAmount > 0 && u.carryType) {
          const carrySprite = getCarryIconSprite(u.carryType);
          const cs = Math.round(charW * 0.48);
          ctx.drawImage(carrySprite, Math.round(pos.sx - cs / 2), drawY - cs + 4, cs, Math.round(cs * 0.75));
        } else if (isWorking) {
          // Balao de emote pixelado enquanto colhe ou constroi
          const emoteType = u.state === 'building' ? 'pick' : u.targetNodeId ? 'water' : 'star';
          const eb = getEmoteBubbleSprite(emoteType);
          const es = Math.round(charW * 0.46);
          const floatE = animSlow === 0 ? 0 : -2;
          ctx.drawImage(eb, Math.round(pos.sx + 2), drawY - es + 2 + floatE, es, Math.round(es * 0.85));
        }
        ctx.restore();
      },
    });
  }

  drawList.sort((a, b) => a.depth - b.depth);
  for (const item of drawList) item.draw();
  if (state.tutorial?.step === 'storm') {
    const progress = state.tutorial.elapsed / 12;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ctx.save();
    ctx.fillStyle='rgba(255,167,48,0.12)';ctx.fillRect(0,0,w,h);
    if (!reduced) for (let i=0;i<6;i++) {
      ctx.fillStyle=`rgba(255,${180-i*10},40,${.05+i*.018})`;
      const x=(progress*(w+400)*2-i*35)%(w+400)-180;
      for(let y=0;y<h;y+=12)ctx.fillRect(x+Math.round(Math.sin(y/80)*22/6)*6,y,55,12);
    }
    ctx.restore();
  }

  // Brilho aconchegante das janelas/lanternas a noite (Golden Stardew Warmth)
  if (isNight) {
    ctx.save();
    for (const b of state.buildings) {
      if (!b.built) continue;
      const sz = BUILDING_DEFS[b.type].size;
      const center = worldToScreen(b.x + sz / 2, b.y + sz / 2, cam, w, h);
      const r = tilePx * sz * 1.1;
      const glow = ctx.createRadialGradient(center.sx, center.sy, r * 0.1, center.sx, center.sy, r);
      glow.addColorStop(0, 'rgba(253, 224, 71, 0.22)');
      glow.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(center.sx - r, center.sy - r, r * 2, r * 2);
    }
    ctx.restore();
  }

  // Particulas quadradas pixel art
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    p.life -= 0.016;
    if (p.life <= 0) {
      activeParticles.splice(i, 1);
      continue;
    }
    p.x += p.vx * 0.016;
    p.y += p.vy * 0.016;
    const pos = worldToScreen(p.x, p.y, cam, w, h);
    const alpha = Math.max(0, p.life / p.maxLife);
    const pxSz = Math.max(3, Math.round(p.size * cam.zoom));
    ctx.save();
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(pos.sx - pxSz / 2, pos.sy - pxSz / 2, pxSz, pxSz);
    ctx.restore();
  }

  // Vinheta sutil em tempestades
  if (state.activeCrisis?.kind === 'solar_storm') {
    const pulse = 0.09 + 0.06 * Math.sin(timeSec * 6);
    ctx.fillStyle = `rgba(239, 68, 68, ${pulse.toFixed(3)})`;
    ctx.fillRect(-10, -10, w + 20, h + 20);
  } else if (state.activeCrisis?.kind === 'dust_storm') {
    ctx.fillStyle = 'rgba(217, 119, 6, 0.14)';
    ctx.fillRect(-10, -10, w + 20, h + 20);
  }

  // Textos flutuantes pixelados (+4 O2, +XP, estrelas) com leitura limpa
  ctx.save();
  for (const ft of state.floatingTexts) {
    const pos = worldToScreen(ft.x, ft.y, cam, w, h);
    const progress = Math.max(0, Math.min(1, 1 - ft.life / 1.5));
    const scale = progress < 0.25 ? 0.85 + 0.35 * Math.sin((progress * 4 * Math.PI) / 2) : 1.0;
    const bounceY = Math.round(pos.sy - 14 - progress * 26);

    ctx.font = `800 ${Math.round(13 * Math.max(0.95, Math.min(1.25, cam.zoom)) * scale)}px "Trebuchet MS", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.globalAlpha = Math.max(0, Math.min(1, ft.life));
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1e1b4b';
    ctx.strokeText(ft.text, pos.sx, bounceY);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, pos.sx, bounceY);
  }
  ctx.restore();

  ctx.restore();
}

function drawPixelBuilding(
  ctx: CanvasRenderingContext2D,
  b: Building,
  cam: CameraView,
  w: number,
  h: number,
  timeSec: number,
  animFrame: number,
  isNight: boolean,
  hasCrisis: boolean
): void {
  const def = BUILDING_DEFS[b.type];
  const s = def.size;
  const tilePx = Math.max(16, Math.round(TILE_PX * cam.zoom));
  const pos = worldToScreen(b.x, b.y, cam, w, h);
  const bw = s * tilePx;
  const bh = s * tilePx;

  if (pos.sx + bw < -40 || pos.sx > w + 40 || pos.sy + bh < -40 || pos.sy > h + 40) return;

  ctx.save();
  ctx.globalAlpha = b.built ? 1 : 0.7;

  // Sombra suave da base do modulo
  ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
  ctx.fillRect(pos.sx + 4, pos.sy + bh - 6, bw - 8, 8);

  // Sprite pixel art animado
  const sprite = getBuildingSprite(b.type, animFrame, isNight);
  const liftY = Math.round(bh * 0.14);
  const drawH = Math.round(bh * 1.12);
  ctx.drawImage(sprite, pos.sx, pos.sy - liftY, bw, drawH);

  // Escudo pulsante pixelado ao redor de Bunker ou Centro apenas durante tempestades espaciais
  if (b.built && (b.type === 'radiation_bunker' || (b.type === 'command_center' && hasCrisis))) {
    const pulse = Math.round((Math.sin(timeSec * 3) + 1) * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(pos.sx - pulse, pos.sy - liftY - pulse, bw + pulse * 2, drawH + pulse);
  }

  // Barra de construcao ou estrelas douradas de nivel Clash
  if (!b.built) {
    const barW = bw - 8;
    const bx = pos.sx + 4;
    const by = pos.sy + bh - 10;
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(bx - 1, by - 1, barW + 2, 8);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(bx, by, Math.round(barW * b.progress), 6);
  } else if (b.level > 1) {
    const starBob = Math.round(Math.sin(timeSec * 4 + b.id) * 2);
    const stars = b.level === 2 ? '★★' : '★★★';
    const cx = Math.round(pos.sx + bw / 2);
    const sy = pos.sy - liftY - 2 + starBob;
    ctx.font = `900 ${Math.round(12 * Math.max(0.9, cam.zoom))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1e1b4b';
    ctx.strokeText(stars, cx, sy);
    ctx.fillStyle = '#fde047';
    ctx.fillText(stars, cx, sy);
  }

  // Astronautas abrigados (escudo no canto)
  if (b.built && b.garrisonedIds.length > 0) {
    const bx = pos.sx + bw - 14;
    const by = pos.sy - liftY + 2;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(bx - 8, by - 6, 20, 14);
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx - 8, by - 6, 20, 14);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${b.garrisonedIds.length}`, bx + 2, by + 1);
  }

  ctx.restore();
}
