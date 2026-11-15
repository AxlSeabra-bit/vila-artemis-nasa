import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ArtemisEngine } from '../src/engine';
import { callbacks, advanceUntil, untilStep, finishFirstTutorial } from './campaign-test-helpers';
import { SAVE_STORAGE_KEY } from '../src/constants';
import { campaignOf, crewConsumption, constructionSeconds, EQUIPMENT } from '../src/campaign';
import { POLAR_CRATERS, POLAR_ROCKS, canWalk, findRoute, clearSegment, obstaclesFor } from '../src/lunarTerrain';
const memory=new Map<string,string>();const storage={getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v)};
Object.defineProperty(globalThis,'localStorage',{value:storage,configurable:true});Object.defineProperty(globalThis,'sessionStorage',{value:storage,configurable:true});
const reload=(state:typeof e.state)=>{storage.setItem(`${SAVE_STORAGE_KEY}_guest`,JSON.stringify(state));const engine=new ArtemisEngine(callbacks);assert.ok(engine.loadSavedCampaign());return engine;};
const e=finishFirstTutorial();assert.equal(campaignOf(e.state).completed.length,1);assert.equal(e.state.expedition.coins,350);assert.equal(e.state.xp,25);
assert.ok(e.returnToMenu());assert.ok(e.openCampaignScreen('profile'));assert.ok(e.renamePlayer('Axl e Hiroki'));assert.equal(e.renamePlayer('<script>'),false);
assert.equal(reload(e.state).state.campaign!.displayName,'Axl e Hiroki');
assert.ok(e.openCampaignScreen('missions'));assert.equal(e.bookMission('moon'),false,'All equipment is required before polar mission');
assert.ok(e.openCampaignScreen('science-center'));
for(const item of EQUIPMENT){assert.ok(e.buyEquipment(item.id));assert.equal(e.buyEquipment(item.id),false,'Level 2 cannot purchase the same item twice or upgrade early');}
assert.equal(e.state.expedition.coins,260);assert.equal(reload(e.state).state.expedition.coins,260);
assert.ok(e.returnToMenu());assert.ok(e.openCampaignScreen('missions'));assert.equal(e.bookMission('mars'),false);assert.ok(e.bookMission('moon'));assert.equal(e.state.expedition.coins,140);
assert.ok(e.previewLandingSite('equatorial'));assert.equal(e.launchExpedition(),false,'Polar mission requires a specific target');
e.previewLandingSite('south-polar');assert.ok(e.launchExpedition());assert.equal(e.state.expedition.stage,'crew');assert.equal(e.state.expedition.coins,140,'No polar surcharge');
assert.equal(e.setCrewSize(0),false);assert.equal(e.setCrewSize(7),false);assert.equal(e.setCrewSize(2.5),false);
assert.equal(constructionSeconds(6)*6,constructionSeconds(1));
for(const key of ['water','food','oxygen'] as const)assert.equal(crewConsumption(6)[key],crewConsumption(3)[key]*2);
const prepared=structuredClone(e.state);
for(const crew of [1,3,6]){
  const run=reload(prepared);assert.ok(run.setCrewSize(crew));run.saveCampaign();assert.equal(reload(run.state).state.expedition.crewSize,crew);
  assert.ok(run.launchPreparedExpedition());assert.equal(run.launchPreparedExpedition(),false);
  advanceUntil(run,()=>run.state.expedition.flightElapsedSec===12);assert.ok(run.completeLanding());assert.equal(run.state.units.length,crew);assert.equal(run.state.xp,25);
  assert.equal(run.state.nodes.length,0);assert.equal(POLAR_CRATERS.length,7);assert.equal(POLAR_ROCKS.length,6);
  for(const cell of obstaclesFor('polar'))assert.equal(run.canPlaceBuilding('dsn_antenna',cell.x,cell.y),false);
  const initial={...run.state.resources};for(let i=0;i<100;i++)run.step();
  for(const key of ['water','food','oxygen'] as const)assert.ok(Math.abs(initial[key]-run.state.resources[key]-crewConsumption(crew)[key]*10)<1e-7);
  assert.ok(run.buildTutorial('command_center',12,12));advanceUntil(run,()=>run.state.tutorial!.elapsed>0);
  const elapsed=run.state.tutorial!.elapsed;let ticks=0;
  while(!run.state.buildings[0].built){run.step();ticks++;}
  assert.ok(Math.abs(elapsed+ticks*.1-constructionSeconds(crew))<.101,'Construction work scales exactly with crew size');
  untilStep(run,'equipment-site');assert.equal(run.buildTutorial('ice_extractor',12,10),false);
  assert.ok(run.buildTutorial('solar_array',15,10));untilStep(run,'equipment-site');
  assert.equal(run.canPlaceBuilding('ice_extractor',9,9),false,'Extractor needs the research area');
  assert.ok(run.buildTutorial('ice_extractor',19,17));
  for(let i=0;i<5;i++)run.step();run.saveCampaign();assert.ok(run.loadSavedCampaign());untilStep(run,'equipment-site');
  assert.ok(run.buildTutorial('hydroponics',10,14));untilStep(run,'antenna-site');
  const food=run.state.resources.food,water=run.state.resources.water,energy=run.state.resources.energy;
  for(let i=0;i<100;i++)run.step();assert.ok(run.state.resources.food>food);assert.ok(run.state.resources.water>water);assert.ok(run.state.resources.energy>energy);
  assert.ok(run.buildTutorial('dsn_antenna',16,14));untilStep(run,'antenna-ready');assert.ok(run.sendTutorialData());untilStep(run,'level-up');assert.equal(run.state.xp,45);
  run.acknowledgeKnowledge();untilStep(run,'return-ready');run.prepareReturn();advanceUntil(run,()=>run.state.expedition.stage==='completed');
  assert.equal(run.state.expedition.coins,140);assert.equal(campaignOf(run.state).completed.length,2);assert.equal(campaignOf(run.state).completed[1].crew,crew);assert.equal(reload(run.state).state.campaign!.completed.length,2);
  if(crew===6){
    const permanent=structuredClone(campaignOf(run.state));assert.ok(run.replayTutorial());assert.ok(run.state.replay);finishFirstTutorial(run);
    assert.equal(run.state.expedition.coins,350);run.saveCampaign();assert.ok(run.loadSavedCampaign());assert.ok(run.returnToMenu());
    assert.deepEqual(campaignOf(run.state),permanent);assert.equal(run.state.expedition.coins,140);assert.equal(run.state.xp,45);assert.equal(run.state.replay,undefined);
    assert.ok(run.openCampaignScreen('science-center'));assert.ok(run.buyEquipment('solar_array'));assert.equal(run.state.campaign!.equipment.solar_array,2);assert.equal(run.buyEquipment('solar_array'),false);
    assert.equal(run.state.expedition.coins,110);
  }
}
for(const [a,b] of [[{x:1.5,y:5.5},{x:9.5,y:5.5}],[{x:17.5,y:10.5},{x:19.5,y:10.5}],[{x:18.5,y:23.5},{x:26.5,y:23.5}]]){
  assert.equal(clearSegment(a,b,'polar'),false);const route=findRoute(a,b,'polar');assert.ok(route&&route.length>1);let last=a;
  for(const p of route){assert.ok(clearSegment(last,p,'polar'));last=p;}
}
for(let y=1;y<27;y++)for(let x=1;x<27;x++){
  const p={x:x+.5,y:y+.5};if(canWalk(p,'polar'))assert.ok(findRoute({x:14,y:17},p,'polar'),'All walkable ground is reachable');
}
const legacy=structuredClone(finishFirstTutorial().state);delete legacy.campaign;
const migrated=reload(legacy);assert.equal(migrated.state.campaign!.completed.length,1);assert.equal(migrated.state.expedition.coins,350);migrated.saveCampaign();assert.equal(reload(migrated.state).state.campaign!.completed.length,1);
assert.deepEqual(JSON.parse(readFileSync('public/data/polar-mission.json','utf8')),JSON.parse(readFileSync('data/derived/polar-mission.json','utf8')));
console.log('CAMPAIGN TESTS PASSED: menu, profile, purchases, no duplicate charges, polar target, crew proportions, production, all terrain routes, completion, migrations and isolated replay');
