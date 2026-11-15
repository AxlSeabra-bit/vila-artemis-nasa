import { ArtemisEngine } from '../src/engine';
export const callbacks={onSolEnd:()=>{},onCrisisStart:()=>{},onSound:()=>{}};
export function advanceUntil(e:ArtemisEngine,predicate:()=>boolean,limit=6000):void {
  for(let i=0;i<limit&&!predicate()&&!e.state.gameOver;i++)e.step();
  if(!predicate())throw new Error(`State not reached: ${e.state.expedition.stage}/${e.state.tutorial?.step}; ${e.state.lossReason}`);
}
export const untilStep=(e:ArtemisEngine,step:string)=>advanceUntil(e,()=>e.state.tutorial?.step===step);
export function finishFirstTutorial(e=new ArtemisEngine(callbacks)):ArtemisEngine {
  e.acceptInvestment();e.bookMission('moon');e.previewLandingSite('equatorial');e.launchExpedition();
  advanceUntil(e,()=>e.state.expedition.flightElapsedSec===12);e.completeLanding();
  if(!e.buildTutorial('command_center',12,12))throw new Error('Could not build base');
  untilStep(e,'antenna-site');e.buildTutorial('dsn_antenna',16,14);untilStep(e,'antenna-ready');
  e.sendTutorialData();untilStep(e,'level-up');e.acknowledgeKnowledge();untilStep(e,'return-ready');e.prepareReturn();
  advanceUntil(e,()=>e.state.expedition.stage==='completed');return e;
}
