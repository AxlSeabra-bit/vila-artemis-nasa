import { landOnMoon } from './mission-test-helpers';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ArtemisEngine} from '../src/engine';
import {ARCHIVED_ALERTS,SCIENCE,RADLAB,terrainExposure} from '../src/science';
import {normalizeDonki,fetchNasaDonkiAlerts,safeNasaUrl} from '../src/nasaApi';
import {STEM_QUESTIONS} from '../src/questions';

const callbacks={onSolEnd:()=>{},onCrisisStart:()=>{},onSound:()=>{}};
const fresh=()=>landOnMoon(new ArtemisEngine(callbacks,'classroom','SCIENCE-TEST')); 
const engine=new ArtemisEngine(callbacks,'classroom','SCIENCE-TEST');
assert.equal(SCIENCE.iceSites.length,8);
assert.equal(engine.state.nodes.filter(n=>n.sourceSiteId).length,8);
for(const site of SCIENCE.iceSites) {
  assert.ok(site.bluePixels>0 && site.x>=0 && site.x<28 && site.y>=0 && site.y<28);
  assert.ok(!engine.state.buildings.some(b=>site.x>=b.x && site.x<b.x+b.size && site.y>=b.y && site.y<b.y+b.size));
}
for(const [name,meta] of Object.entries(SCIENCE.files)) assert.equal(createHash('sha256').update(readFileSync(`data/raw/${name}`)).digest('hex'),meta.sha256);
const missionMap=JSON.parse(readFileSync('data/derived/mission-map.json','utf8'));
assert.equal(createHash('sha256').update(readFileSync('public/data/lunar-global-lroc.jpg')).digest('hex'),missionMap.sha256);
assert.equal(readFileSync('data/derived/mission-map.json','utf8'),readFileSync('public/data/mission-map.json','utf8'));
assert.equal(RADLAB.records.length,16);
assert.equal(RADLAB.records[0].absorbed_dose_rate,10.2160856666667);
assert.ok(RADLAB.records.every(r=>r.spacecraft==='ISS'));
assert.ok(ARCHIVED_ALERTS.some(a=>a.messageType==='SEP'));
assert.ok(ARCHIVED_ALERTS.every(a=>a.source==='archive'&&a.issueTime.startsWith('2024-05-')&&safeNasaUrl(a.sourceUrl)));
assert.ok(terrainExposure('terrain-a')<terrainExposure('terrain-c'));

// Event validation and corrupt/old cache paths cannot fabricate notifications.
const now=Date.parse('2026-11-15T12:00:00Z');
const records=[{messageID:'real',messageType:'SEP',messageIssueTime:'2026-11-14T12:00Z',messageURL:'https://ccmc.gsfc.nasa.gov/DONKI/'},
  {messageID:'future',messageType:'SEP',messageIssueTime:'2099-01-01'},
  {messageID:'unknown',messageType:'IPS',messageIssueTime:'2026-11-14'},
  {messageID:'bad',messageType:'SEP',messageIssueTime:'not-a-date'}];
assert.deepEqual(normalizeDonki(records,now).map(a=>a.id),['real']);
assert.equal(safeNasaUrl('javascript:alert(1)'),undefined);
assert.equal(safeNasaUrl('https://nasa.gov.evil.example/'),undefined);
let cache='';
const storage={getItem:()=>cache,setItem:(_k:string,v:string)=>{cache=v}} as Storage;
const online=(async()=>new Response(JSON.stringify(records))) as typeof fetch;
const offline=(async()=>{throw new Error('Offline')}) as typeof fetch;
assert.equal((await fetchNasaDonkiAlerts({fetcher:online,storage,now}))[0].source,'live');
assert.equal((await fetchNasaDonkiAlerts({fetcher:offline,storage,now:now+1}))[0].source,'cache');
assert.equal((await fetchNasaDonkiAlerts({fetcher:offline,storage,now:now+2*86400000}))[0].source,'archive');
cache='{"savedAt":0,"alerts":[{}]}';
assert.equal((await fetchNasaDonkiAlerts({fetcher:offline,storage,now}))[0].source,'archive');
assert.deepEqual(await fetchNasaDonkiAlerts({fetcher:(async()=>new Response('[]')) as typeof fetch,storage,now}),[]);
const blockedStorage={getItem:()=>{throw new Error('blocked')},setItem:()=>{throw new Error('blocked')}} as unknown as Storage;
assert.equal((await fetchNasaDonkiAlerts({fetcher:online,storage:blockedStorage,now}))[0].source,'live');

// Terrain factor changes exposure with a real cost; no free reduction in risk.
const low=fresh(),high=fresh();
low.state.expedition.landingSiteId='south-polar';high.state.expedition.landingSiteId='south-polar';
assert.equal(low.selectRadiationTerrain('unknown'),false);
const before=low.state.resources.energy;
assert.equal(low.selectRadiationTerrain('terrain-a'),true);
assert.equal(low.state.resources.energy,before-15);
assert.equal(low.selectRadiationTerrain('terrain-a'),false);
high.selectRadiationTerrain('terrain-c');
for(const e of [low,high]) {
  e.state.activeCrisis={kind:'solar_storm',titleKey:'',descKey:'',remainingSec:18,totalSec:18,severity:3};
  e.state.units.forEach(u=>{u.state='idle';u.targetNodeId=null});
  e.step();
}
assert.ok(low.state.units[0].radiationDose<high.state.units[0].radiationDose);

const light=fresh(),dark=fresh();
dark.state.activeCrisis={kind:'lunar_night',titleKey:'',descKey:'',remainingSec:20,totalSec:20,severity:2};
light.step();dark.step();
assert.ok(light.state.powerNetPerSec>dark.state.powerNetPerSec);
const unpowered=fresh();
unpowered.state.buildings=unpowered.state.buildings.filter(b=>b.type==='hydroponics');
unpowered.state.units=[];unpowered.state.resources.energy=0;
const food=unpowered.state.resources.food;unpowered.step();
assert.ok(unpowered.state.resources.food<=food,'No food creation without power');

const radio=fresh();
assert.ok(radio.tradeViaDsn('regolith','oxygen'));
const oxygen=radio.state.resources.oxygen;
assert.equal(radio.state.resources.oxygen,oxygen);
assert.ok(radio.state.pendingTrade);
assert.equal(radio.tradeViaDsn('regolith','oxygen'),false);
radio.state.units=[];radio.state.buildings=[];
for(let i=0;i<27;i++)radio.step();
assert.equal(radio.state.pendingTrade,null);
assert.equal(radio.state.resources.oxygen,oxygen+35);

// Same class seed, same replay, regardless of online data availability.
const a=fresh(),b=fresh();
b.setDonkiAlerts(normalizeDonki(records,now));
for(let i=0;i<460;i++){a.step();b.step()}
assert.deepEqual(a.state.activeCrisis,b.state.activeCrisis);
assert.deepEqual(a.state.resources,b.state.resources);
assert.equal(STEM_QUESTIONS.length,12);
assert.equal(new Set(STEM_QUESTIONS.map(q=>q.id)).size,12);
for(const q of STEM_QUESTIONS) for(const l of ['pt','en','es'] as const) {
  assert.equal(q.options[l].length,3);assert.ok(q.options[l][q.correctIndex]);
  assert.ok(q.explanation[l] && q.question[l]);
}
for(const f of readdirSync('src').filter(f=>/\.(ts|css)$/.test(f))) assert.ok(!readFileSync('src/'+f,'utf8').includes('\u2014'),`No long dash: ${f}`);
assert.ok(!readFileSync('src/nasaApi.ts','utf8').match(/api_key=[A-Za-z0-9]{30}/));
console.log('SCIENCE TESTS PASSED: source hashes, M3 mapping, historical DONKI, RadLab, cache, no-power economy, terrain exposure, radio delay, classroom determinism, archived learning bank');
