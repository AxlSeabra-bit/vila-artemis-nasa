import { MAP_SIZE } from './constants';

export interface Waypoint { x:number; y:number }
export type TerrainLayout = 'equatorial' | 'polar';
export interface Crater { id:string; x:number; y:number; size:number }
/** Illustrated terrain obstacles, not surveyed NASA landing hazards. */
export const LUNAR_CRATERS = [
  {id:'northwest',x:3,y:3,size:4},
  {id:'southeast',x:21,y:21,size:4},
] as const;
export const ASTRONAUT_RADIUS = .22;
export const POLAR_CRATERS:Crater[] = [
  {id:'polar-nw',x:2,y:2,size:6},{id:'polar-n',x:11,y:2,size:6},
  {id:'polar-ne',x:20,y:2,size:6},{id:'polar-w',x:2,y:11,size:6},
  {id:'polar-e',x:21,y:11,size:6},{id:'polar-sw',x:2,y:21,size:6},
  {id:'polar-se',x:19,y:20,size:6},
];
export const POLAR_ROCKS:Waypoint[] = [{x:9,y:10},{x:18,y:10},{x:10,y:19},{x:18,y:17},{x:15,y:23},{x:8,y:16}];
export const POLAR_RESEARCH_SITE:Waypoint={x:20.5,y:18.5};
export const cratersFor=(layout:TerrainLayout):readonly Crater[]=>layout==='polar'?POLAR_CRATERS:LUNAR_CRATERS;
export const layoutFor=(state:{expedition:{missionId?:string}}):TerrainLayout=>state.expedition.missionId==='polar-craters'?'polar':'equatorial';
const craterCells=(craters:readonly Crater[]):Waypoint[]=>craters.flatMap(c=>{
  const cells:Waypoint[]=[];
  const cut=Math.floor(c.size/4);
  for(let y=0;y<c.size;y++)for(let x=0;x<c.size;x++) {
    if((x<cut||x>=c.size-cut)&&(y<cut||y>=c.size-cut))continue;
    cells.push({x:c.x+x,y:c.y+y});
  }
  return cells;
});
export const CRATER_CELLS=craterCells(LUNAR_CRATERS);
const POLAR_CELLS=[...craterCells(POLAR_CRATERS),...POLAR_ROCKS];
export const obstaclesFor=(layout:TerrainLayout)=>layout==='polar'?POLAR_CELLS:CRATER_CELLS;
export function craterOverlaps(x:number,y:number,size:number,layout:TerrainLayout='equatorial'):boolean {
  return obstaclesFor(layout).some(c=>x<c.x+1 && x+size>c.x && y<c.y+1 && y+size>c.y);
}
export function canWalk(p:Waypoint,layout:TerrainLayout='equatorial'):boolean {
  const r=ASTRONAUT_RADIUS;
  return Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=1+r&&p.y>=1+r&&p.x<=MAP_SIZE-1-r&&p.y<=MAP_SIZE-1-r &&
    !obstaclesFor(layout).some(c=>p.x>=c.x-r&&p.x<=c.x+1+r&&p.y>=c.y-r&&p.y<=c.y+1+r);
}
/** Slab intersection includes clearance so diagonal routes never cut crater corners. */
export function clearSegment(a:Waypoint,b:Waypoint,layout:TerrainLayout='equatorial'):boolean {
  if(!canWalk(a,layout)||!canWalk(b,layout))return false;
  return !obstaclesFor(layout).some(c=>{
    let low=0,high=1;
    for(const axis of ['x','y'] as const){
      const d=b[axis]-a[axis],min=c[axis]-ASTRONAUT_RADIUS,max=c[axis]+1+ASTRONAUT_RADIUS;
      if(Math.abs(d)<1e-9){if(a[axis]<min||a[axis]>max)return false;}
      else {const p=(min-a[axis])/d,q=(max-a[axis])/d;low=Math.max(low,Math.min(p,q));high=Math.min(high,Math.max(p,q));if(low>high)return false;}
    }
    return low<=high;
  });
}
export function nearestWalkable(p:Waypoint,layout:TerrainLayout='equatorial'):Waypoint {
  if(canWalk(p,layout))return {...p};
  let best:Waypoint={x:14.5,y:14.5},distance=Infinity;
  for(let y=1;y<MAP_SIZE-1;y++)for(let x=1;x<MAP_SIZE-1;x++){
    const candidate={x:x+.5,y:y+.5},d=Math.hypot(candidate.x-p.x,candidate.y-p.y);
    if(d<distance&&canWalk(candidate,layout)){distance=d;best=candidate;}
  }
  return best;
}
export function findRoute(start:Waypoint,goal:Waypoint,layout:TerrainLayout='equatorial'):Waypoint[]|null {
  if(!canWalk(start,layout)||!canWalk(goal,layout))return null;
  if(clearSegment(start,goal,layout))return [{...goal}];
  const key=(p:Waypoint)=>Math.floor(p.y)*MAP_SIZE+Math.floor(p.x);
  const point=(id:number)=>({x:id%MAP_SIZE+.5,y:Math.floor(id/MAP_SIZE)+.5});
  const initial=key(start),end=key(goal),open=new Set([initial]),came=new Map<number,number>(),cost=new Map([[initial,0]]);
  const estimate=(id:number)=>{const p=point(id);return (cost.get(id)??Infinity)+Math.abs(p.x-goal.x)+Math.abs(p.y-goal.y);};
  while(open.size){
    let current=-1,best=Infinity;
    for(const id of open){const f=estimate(id);if(f<best){best=f;current=id;}}
    if(current===end){
      const path:Waypoint[]=[goal];let cursor=current;
      path.unshift(point(cursor));while(came.has(cursor)){cursor=came.get(cursor)!;path.unshift(point(cursor));}
      path.unshift(start);
      const smooth:Waypoint[]=[];let from=0;
      while(from<path.length-1){let to=path.length-1;while(to>from+1&&!clearSegment(path[from],path[to],layout))to--;if(!clearSegment(path[from],path[to],layout))return null;smooth.push(path[to]);from=to;}
      return smooth;
    }
    open.delete(current);
    const p=point(current);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const next={x:p.x+dx,y:p.y+dy};if(!clearSegment(p,next,layout))continue;
      const id=key(next),g=cost.get(current)!+1;
      if(g<(cost.get(id)??Infinity)){cost.set(id,g);came.set(id,current);open.add(id);}
    }
  }
  return null;
}
