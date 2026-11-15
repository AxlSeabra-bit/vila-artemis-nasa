import { landOnMoon } from './mission-test-helpers';
import assert from 'node:assert/strict';
import { ArtemisEngine } from '../src/engine.ts';

let solEnded = false;
let ranksObserved: string[] = [];

const engine = new ArtemisEngine(
  {
    onSolEnd: () => {
      solEnded = true;
      engine.setPausedForModal(false);
    },
    onCrisisStart: () => undefined,
    onSound: () => undefined,
    onRankUp: (r) => {
      ranksObserved.push(r);
    },
  },
  'classroom',
  'TEST-SEED'
);

landOnMoon(engine);
assert.equal(engine.state.expedition.stage, 'surface');
assert.equal(engine.state.units.length, 3);
assert.equal(engine.state.rank, 'cadet', 'Initial rank should be cadet');
assert.equal(engine.state.unlockedBadges.length, 0, 'No badges unlocked initially');

// 1. Testa posicionamento de modulo solar
const placed = engine.placeBuilding('solar_array', 20, 20);
assert.equal(placed, true, 'Should place solar array');


// 2. Testa simulacao por 50 segundos virtuais (500 ticks) para validar coleta e virada de Sol
for (let i = 0; i < 500; i++) {
  engine.step();
}

assert.equal(solEnded, true, 'Sol 1 should complete within 500 ticks');
assert.ok(engine.state.sol >= 2, 'Sol counter should increment');
assert.ok(engine.state.score > 0, 'Score should increase after gathering and Sol survival');
assert.ok(engine.state.xp > 0, 'XP should increase with activities');

// 3. Testa abrigo no bunker e saida
const sheltered = engine.toggleShelterAll();
assert.equal(sheltered, true, 'Should send astronauts to shelter');
for (let i = 0; i < 40; i++) engine.step();
assert.ok(
  engine.state.units.some((u) => u.state === 'sheltered'),
  'At least one astronaut should reach shelter'
);
engine.toggleShelterAll(); // Libera tripulacao

// 4. Testa inspecao e evolucao de modulos (Clash style)
const bArray = engine.state.buildings.find((b) => b.type === 'solar_array' && b.built);
assert.ok(bArray, 'Built solar array should exist');
const foundBuilding = engine.findBuildingAt(bArray.x, bArray.y);
assert.equal(foundBuilding?.id, bArray.id, 'findBuildingAt should locate building by world coordinates');

assert.equal(bArray.level, 1, 'Initial building level should be 1');
// Garante recursos para evolucao de teste
engine.state.resources.regolith = 300;
engine.state.resources.energy = 300;
const upgradedLvl2 = engine.upgradeBuilding(bArray.id);
assert.equal(upgradedLvl2, true, 'Should upgrade building to Level 2');
assert.equal(bArray.level, 2, 'Building level should now be 2');

const upgradedLvl3 = engine.upgradeBuilding(bArray.id);
assert.equal(upgradedLvl3, true, 'Should upgrade building to Level 3');
assert.equal(bArray.level, 3, 'Building level should now be 3');

const upgradedLvl4 = engine.upgradeBuilding(bArray.id);
assert.equal(upgradedLvl4, false, 'Building should not upgrade past Level 3');

// 5. Testa eventos interativos no mapa (drops de suprimentos e meteoritos)
engine.state.clickableEvents.push({
  id: 999,
  type: 'supply_pod',
  x: 14,
  y: 14,
  lifeSec: 30,
  rewardType: 'oxygen',
  amount: 30,
  icon: '📦',
});
const foundDrop = engine.findClickableEventAt(14, 14);
assert.ok(foundDrop && foundDrop.id === 999, 'findClickableEventAt should find drop event');

const claimed = engine.claimClickableEvent(999);
assert.equal(claimed, true, 'Should successfully claim drop event');
assert.equal(engine.findClickableEventAt(14, 14), null, 'Claimed drop should be removed from map');

// 6. Testa progressao de ranks de astronauta Artemis
assert.ok(engine.state.xp >= 250, 'Simulation activities should have generated base XP');

const rankEngine = new ArtemisEngine(
  {
    onSolEnd: () => undefined,
    onCrisisStart: () => undefined,
    onSound: () => undefined,
    onRankUp: (r) => ranksObserved.push(r),
  },
  'campaign',
  'RANK-SEED'
);
assert.equal(rankEngine.state.rank, 'cadet', 'Initial rank should be cadet');

rankEngine.addXp(250);
assert.equal(rankEngine.state.rank, 'payload_specialist', 'Should advance to payload_specialist at 250 XP');

rankEngine.addXp(350); // total 600
assert.equal(rankEngine.state.rank, 'base_engineer', 'Should advance to base_engineer at 600 XP');

rankEngine.addXp(600); // total 1200
assert.equal(rankEngine.state.rank, 'flight_director', 'Should advance to flight_director at 1200 XP');

rankEngine.addXp(800); // total 2000
assert.equal(rankEngine.state.rank, 'artemis_commander', 'Should advance to artemis_commander at 2000 XP');
assert.ok(ranksObserved.length >= 4, 'Callbacks should have registered all 4 rank advancements');

// 7. Testa leitura e recompensa de card didatico NASA DONKI
const readOk1 = engine.readDonkiCard('donki_edu_cme');
assert.equal(readOk1, true, 'Should successfully read didactic DONKI card');
assert.ok(engine.state.readDonkiCardIds.includes('donki_edu_cme'), 'Card ID should be in readDonkiCardIds');

const readOk2 = engine.readDonkiCard('donki_edu_cme');
assert.equal(readOk2, false, 'Should not claim duplicate reward for same DONKI card');

// 8. Testa descoberta de fatos cientificos da NASA
const fact = engine.discoverFact('fact_shackleton');
assert.ok(fact && fact.id === 'fact_shackleton', 'Should discover NASA science fact');
assert.ok(engine.state.discoveredFactIds.includes('fact_shackleton'));

// 9. Testa desbloqueio de medalhas e conquistas NASA
engine.checkBadges();
assert.ok(engine.state.unlockedBadges.length > 0, 'At least one badge should unlock with high resources and score');

// 10. Testa contramedida de crise
engine.state.activeCrisis = {
  kind: 'solar_storm',
  titleKey: 'crisis_solar_title',
  descKey: 'crisis_solar_desc',
  remainingSec: 15,
  totalSec: 18,
  severity: 3,
};
engine.state.resources.energy = 100;
engine.state.shieldIntegrity = 30;
const boosted = engine.applyCrisisIntervention('boost_shields');
assert.equal(boosted, true, 'Should successfully boost shields during solar crisis');
assert.ok(engine.state.shieldIntegrity >= 60, 'Shield integrity should jump after power boost');

// 11. Testa escalonamento vertical de notificacoes flutuantes (floating texts)
(engine as any).addFloatingText(15, 15, 'NOTIF 1', '#fff');
(engine as any).addFloatingText(15, 15, 'NOTIF 2', '#facc15');
(engine as any).addFloatingText(15, 15, 'NOTIF 3', '#4ade80');
const recentFts = engine.state.floatingTexts.slice(-3);
assert.equal(recentFts.length, 3, 'Should have created 3 floating texts');
assert.equal(recentFts[0].y, 15, 'First notification should be at base y coordinate');
assert.ok(recentFts[1].y < recentFts[0].y, 'Second simultaneous notification should stagger upward');
assert.ok(recentFts[2].y < recentFts[1].y, 'Third simultaneous notification should stagger further upward');

// 12. Testa telemetria de alertas NASA DONKI no estado do jogo
engine.setDonkiAlerts([
  {
    id: 'CME-TEST-001',
    messageType: 'CME',
    issueTime: '2026-11-14T18:00Z',
    summary: 'Test coronal mass ejection for simulation verification.',
    severity: 2,
    source: 'live',
  },
]);
assert.equal(engine.state.donkiAlerts.length, 1);
assert.equal(engine.state.nasaAlerts?.length, 1);
assert.equal(engine.state.nasaAlerts?.[0].id, 'CME-TEST-001');

console.log('SIMULATION TESTS PASSED:', {
  sol: engine.state.sol,
  score: engine.state.score,
  xp: engine.state.xp,
  rank: engine.state.rank,
  unlockedBadges: engine.state.unlockedBadges.length,
  readCards: engine.state.readDonkiCardIds.length,
  energy: Math.round(engine.state.resources.energy),
  oxygen: Math.round(engine.state.resources.oxygen),
  food: Math.round(engine.state.resources.food),
  regolith: Math.round(engine.state.resources.regolith),
});
