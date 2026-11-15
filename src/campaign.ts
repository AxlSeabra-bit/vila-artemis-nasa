import type { GameStateSnapshot, Lang } from './types';

export type MissionId = 'first-steps' | 'polar-craters';
export type EquipmentId = 'hydroponics' | 'ice_extractor' | 'solar_array';
export interface MissionRecord { id:MissionId; crew:number; radiation:number; knowledge:number }
export interface CampaignProgress {
  version:1;
  displayName:string;
  completed:MissionRecord[];
  equipment:Record<EquipmentId,number>;
}
export const EQUIPMENT: {id:EquipmentId;name:Record<Lang,string>;description:Record<Lang,string>}[] = [
  {id:'hydroponics',name:{pt:'Estufa de alimentos',en:'Food greenhouse',es:'Invernadero de alimentos'},description:{pt:'Cultiva alimentos dentro de um ambiente protegido. Precisa de água e energia.',en:'Grows food in a protected environment. Requires water and energy.',es:'Cultiva alimentos en un ambiente protegido. Necesita agua y energía.'}},
  {id:'ice_extractor',name:{pt:'Extrator de água',en:'Water extractor',es:'Extractor de agua'},description:{pt:'Equipamento experimental para obter e tratar água de gelo polar. Precisa de energia e de uma área de pesquisa.',en:'Experimental equipment to obtain and treat water from polar ice. Requires power and a research area.',es:'Equipo experimental para obtener y tratar agua del hielo polar. Necesita energía y un área de investigación.'}},
  {id:'solar_array',name:{pt:'Placas solares',en:'Solar panels',es:'Paneles solares'},description:{pt:'Geram energia em terreno iluminado. No fundo de uma cratera sempre na sombra, não funcionariam.',en:'Generate energy on illuminated ground. They would not work inside a permanently shadowed crater.',es:'Generan energía en terreno iluminado. No funcionarían en un cráter siempre en sombra.'}},
];
export const EQUIPMENT_PRICE=30;
export const POLAR_MISSION_PRICE=120;
export const initialCampaign=():CampaignProgress=>({version:1,displayName:'Explorador',completed:[],equipment:{hydroponics:0,ice_extractor:0,solar_array:0}});
export function campaignOf(s:GameStateSnapshot):CampaignProgress {
  s.campaign??=initialCampaign();
  // Completed saves from before the menu retain their single mission record.
  if(s.tutorial?.rewardPaid && !s.campaign.completed.some(m=>m.id===(s.expedition.missionId??'first-steps'))) {
    s.campaign.completed.push({id:s.expedition.missionId??'first-steps',crew:s.expedition.crewSize??3,radiation:s.radiationLevel,knowledge:s.expedition.missionId==='polar-craters'?20:25});
  }
  return s.campaign;
}
export const polarMission=(s:GameStateSnapshot)=>s.expedition.missionId==='polar-craters';
export const allEquipmentOwned=(s:GameStateSnapshot)=>EQUIPMENT.every(item=>campaignOf(s).equipment[item.id]>=1);
export const crewCount=(s:GameStateSnapshot)=>s.expedition.crewSize??3;
export const constructionSeconds=(crew:number)=>45/crew;
export const crewConsumption=(crew:number)=>({oxygen:.05*crew/3,water:.04*crew/3,food:.02*crew/3});
export const missionReward=(s:GameStateSnapshot)=>polarMission(s)?{coins:0,knowledge:0}:{coins:350,knowledge:5};
