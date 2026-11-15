import assert from 'node:assert/strict';
import { ArtemisEngine } from '../src/engine';
import { dispatch, ROCKET, tutorialLevel, levelProgress } from '../src/surfaceTutorial';
import { canWalk, clearSegment, findRoute, LUNAR_CRATERS, craterOverlaps } from '../src/lunarTerrain';
import { MISSION_PRICES } from '../src/expedition';
const store=new Map<string,string>();
const storage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v)};
Object.defineProperty(globalThis,'localStorage',{value:storage,configurable:true});
Object.defineProperty(globalThis,'sessionStorage',{value:storage,configurable:true});
const callbacks={onSolEnd:()=>{},onCrisisStart:()=>{},onSound:()=>{}};
const tick=(e:ArtemisEngine,seconds:number)=>{for(let i=0;i<seconds*10;i++)e.step();};
function landed(){const e=new ArtemisEngine(callbacks);e.acceptInvestment();e.bookMission('moon');e.previewLandingSite('equatorial');e.launchExpedition();tick(e,12.1);assert.ok(e.completeLanding());return e;}
function until(e:ArtemisEngine,step:string){for(let i=0;i<1500&&e.state.tutorial?.step!==step&&!e.state.gameOver;i++)e.step();assert.equal(e.state.tutorial?.step,step);assert.equal(e.state.gameOver,false);}
const e=landed();
assert.equal(e.state.buildings.length,0);assert.ok(e.state.units.every(u=>u.state==='sheltered'&&u.shelterBuildingId===-1));
assert.equal(e.state.nodes.length,0,'No collectible yellow rocks on the lunar map');
assert.equal(MISSION_PRICES.mars,400);
assert.equal(LUNAR_CRATERS.length,2);
assert.equal(e.buildTutorial('command_center',3,3),false,'Crater footprint blocks construction');
assert.equal(e.buildTutorial('command_center',22,22),false);
const waterBefore=e.state.resources.water,oxygenBefore=e.state.resources.oxygen;
tick(e,1);assert.ok(e.state.resources.water<waterBefore);assert.ok(e.state.resources.oxygen<oxygenBefore);
assert.equal(e.sendTutorialData(),false);assert.equal(e.prepareReturn(),false);
assert.equal(e.buildTutorial('dsn_antenna',16,14),false);
assert.equal(e.buildTutorial('command_center',ROCKET.x,ROCKET.y),false);
const before={...e.state.resources};
assert.equal(e.buildTutorial('command_center',12,12),true);
assert.equal(e.state.resources.energy,before.energy-30);assert.equal(e.state.resources.oxygen,before.oxygen-20);
assert.equal(e.buildTutorial('command_center',9,12),false);
assert.ok(e.state.units.every(u=>u.state==='moving'));
tick(e,1);assert.ok(e.state.units.some(u=>u.y<ROCKET.y));assert.equal(e.state.buildings[0].progress,0);
for(let i=0;i<30;i++)e.commandWorldTap(12.5,12.5);
assert.equal(e.state.buildings[0].progress,0,'Tapping cannot bypass construction time');
until(e,'base-build');tick(e,10);assert.equal(e.state.buildings[0].built,false);
e.saveCampaign();const resumed=new ArtemisEngine(callbacks);assert.ok(resumed.loadSavedCampaign());assert.equal(resumed.state.buildings[0].progress,e.state.buildings[0].progress);
until(resumed,'antenna-site');assert.ok(resumed.state.units.every(u=>u.state==='sheltered'));
assert.ok(resumed.buildTutorial('dsn_antenna',16,14));tick(resumed,12);assert.equal(resumed.state.buildings[1].built,false);until(resumed,'antenna-ready');
assert.equal(resumed.state.xp,0);assert.ok(resumed.sendTutorialData());assert.equal(resumed.sendTutorialData(),false);
tick(resumed,.9);assert.equal(resumed.state.xp,0);tick(resumed,.1);assert.equal(resumed.state.xp,1,'Exactly one knowledge point per completed second');
tick(resumed,9);assert.equal(resumed.state.xp,10);assert.equal(tutorialLevel(resumed.state.xp),1);
resumed.saveCampaign();const dataReload=new ArtemisEngine(callbacks);assert.ok(dataReload.loadSavedCampaign());assert.equal(dataReload.state.tutorial!.elapsed,resumed.state.tutorial!.elapsed);
tick(dataReload,9.8);assert.equal(dataReload.state.xp,19);assert.equal(tutorialLevel(dataReload.state.xp),1);tick(dataReload,.3);assert.equal(dataReload.state.xp,20);assert.equal(tutorialLevel(dataReload.state.xp),2);
assert.equal(dataReload.state.tutorial!.step,'level-up');assert.equal(levelProgress(dataReload.state.xp),0);
tick(dataReload,20);assert.equal(dataReload.state.tutorial!.step,'level-up','Level-up notice awaits acknowledgement');
dataReload.saveCampaign();const noticeReload=new ArtemisEngine(callbacks);assert.ok(noticeReload.loadSavedCampaign());assert.equal(noticeReload.state.tutorial!.step,'level-up');
assert.ok(dataReload.acknowledgeKnowledge());assert.equal(dataReload.acknowledgeKnowledge(),false);
until(dataReload,'warning');assert.ok(dataReload.state.units.every(u=>u.state==='sheltered'));
const dose=dataReload.state.radiationLevel;
tick(dataReload,7.9);assert.equal(dataReload.state.tutorial!.step,'warning');assert.ok(dataReload.state.radiationLevel>=dose);tick(dataReload,.2);assert.equal(dataReload.state.tutorial!.step,'storm');
const stormDose=dataReload.state.radiationLevel;until(dataReload,'return-ready');assert.ok(dataReload.state.radiationLevel-stormDose<1,'Shelter strongly reduces storm exposure');
const stranded=landed();stranded.state.tutorial!.step='storm';stranded.state.radiationLevel=40;stranded.state.units.forEach(u=>{u.radiationDose=40;u.state='idle';u.shelterBuildingId=null;});tick(stranded,11);
assert.equal(stranded.state.gameOver,true);assert.equal(stranded.state.lossReason,'radiation_limit');assert.equal(stranded.state.radiationLevel,100);
stranded.saveCampaign();const failedReload=new ArtemisEngine(callbacks);assert.ok(failedReload.loadSavedCampaign());assert.ok(failedReload.state.gameOver,'Failure cannot be erased by reloading');
for(const resource of ['food','oxygen','water','energy'] as const){const f=landed();f.state.resources[resource]=0;tick(f,.1);assert.ok(f.state.gameOver);assert.equal(f.state.lossReason,`${resource}_depleted`);}
assert.ok(dataReload.prepareReturn());assert.equal(dataReload.prepareReturn(),false);assert.ok(dataReload.state.units.every(u=>u.state==='moving'));
for(let i=0;i<150&&dataReload.state.expedition.stage==='surface';i++)dataReload.step();
assert.equal(dataReload.state.expedition.stage,'returning');tick(dataReload,6);dataReload.saveCampaign();
const returnReload=new ArtemisEngine(callbacks);assert.ok(returnReload.loadSavedCampaign());tick(returnReload,7);
assert.equal(returnReload.state.expedition.stage,'completed');assert.equal(returnReload.state.expedition.coins,350);assert.equal(returnReload.state.victory,true);
assert.equal(returnReload.state.xp,25);assert.equal(tutorialLevel(returnReload.state.xp),2);assert.equal(levelProgress(returnReload.state.xp),5);
tick(returnReload,100);returnReload.saveCampaign();const finished=new ArtemisEngine(callbacks);assert.ok(finished.loadSavedCampaign());tick(finished,20);assert.equal(finished.state.expedition.coins,350,'Reward is paid exactly once, including after reload');assert.equal(finished.state.xp,25);
const isolated=new ArtemisEngine(callbacks);isolated.saveSlot='user-999';assert.equal(isolated.loadSavedCampaign(),false,'Account slots do not expose guest progress');
for(const [start,goal] of [[{x:2,y:5},{x:8,y:5}],[{x:20,y:23},{x:26,y:23}]]){
  assert.equal(clearSegment(start,goal),false);
  const route=findRoute(start,goal)!;assert.ok(route?.length>1,'Route detours around the crater');
  let previous=start;for(const point of route){assert.ok(clearSegment(previous,point));previous=point;}
  const walking=landed();walking.state.units.forEach(u=>{u.x=start.x;u.y=start.y;u.state='idle';u.shelterBuildingId=null;});
  dispatch(walking.state,goal.x,goal.y);
  for(let i=0;i<120;i++){
    const before=walking.state.units.map(u=>({x:u.x,y:u.y}));walking.step();
    walking.state.units.forEach((u,j)=>{assert.ok(canWalk(u));assert.ok(clearSegment(before[j],u),'No movement segment crosses a crater');});
    if(i===20){walking.saveCampaign();assert.ok(walking.loadSavedCampaign());}
  }
  assert.ok(walking.state.units.every(u=>u.state==='idle'));assert.ok(Math.abs(walking.state.units[1].x-goal.x)<.01);
}
assert.equal(findRoute({x:2,y:5},{x:5,y:5}),null,'Blocked destination cannot be reached');
const legacy=structuredClone(finished.state);legacy.tutorial!.version=1;legacy.xp=100;legacy.expedition.coins=200;delete (legacy.resources as any).water;
store.set('age_of_artemis_save_v3_tutorial_guest',JSON.stringify(legacy));const upgraded=new ArtemisEngine(callbacks);assert.ok(upgraded.loadSavedCampaign());assert.equal(upgraded.state.xp,25);assert.equal(upgraded.state.expedition.coins,350);assert.equal(upgraded.state.resources.water,120);
upgraded.saveCampaign();assert.ok(upgraded.loadSavedCampaign());assert.equal(upgraded.state.expedition.coins,350,'Old rewards migrate only once');assert.equal(upgraded.state.xp,25);
const relocated=landed();relocated.buildTutorial('command_center',12,12);relocated.state.buildings[0].x=4;relocated.state.buildings[0].y=4;relocated.saveCampaign();assert.ok(relocated.loadSavedCampaign());assert.ok(relocated.state.buildings.every(b=>!craterOverlaps(b.x,b.y,b.size)),'Existing buildings are preserved outside new craters');until(relocated,'antenna-site');
console.log('TUTORIAL TESTS PASSED: empty landing, crew travel, fixed construction, costs, transmission, XP, cumulative radiation, all failure conditions, shelter, return, reward and resumable stages');
