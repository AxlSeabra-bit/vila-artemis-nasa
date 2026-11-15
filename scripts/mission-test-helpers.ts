import { ArtemisEngine } from '../src/engine';
import { FLIGHT_DURATION_SEC } from '../src/expedition';
/** Fixtures for the retained free simulation, independent of the guided tutorial. */
export function landOnMoon(engine: ArtemisEngine): ArtemisEngine {
  const buildings=structuredClone(engine.state.buildings), units=structuredClone(engine.state.units);
  const nodes=structuredClone(engine.state.nodes),resources={...engine.state.resources};
  engine.acceptInvestment();
  engine.bookMission('moon');
  engine.previewLandingSite('equatorial');
  engine.launchExpedition();
  for(let i=0;i<FLIGHT_DURATION_SEC*10+1;i++)engine.step();
  if(!engine.completeLanding())throw new Error('Test mission failed to land');
  delete engine.state.tutorial;
  engine.state.nodes=nodes.filter(n=>n.type!=='ice_crater');
  engine.state.resources=resources;
  engine.state.buildings=buildings;
  engine.state.units=units;
  for(const u of engine.state.units){u.targetNodeId=null;u.state='idle';}
  engine.saveCampaign();
  return engine;
}
