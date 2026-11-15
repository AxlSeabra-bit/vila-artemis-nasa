const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export function drawFlight(canvas:HTMLCanvasElement, elapsed:number, returning=false):void {
  const c=canvas.getContext('2d')!;
  c.imageSmoothingEnabled=false;
  const rect=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)};
  const disk=(x:number,y:number,r:number,color:string)=>{
    for(let dy=-r;dy<r;dy+=3){const dx=Math.floor(Math.sqrt(Math.max(0,r*r-dy*dy))/3)*3;rect(x-dx,y+dy,dx*2,3,color)}
  };
  const earth=(x:number,y:number,r:number)=>{
    disk(x,y,r,'#166295');disk(x-3,y-4,r-4,'#329cc7');
    rect(x-r*.65,y-r*.3,r*.7,r*.23,'#7fbb84');rect(x-r*.4,y-r*.05,r*.3,r*.65,'#579a75');rect(x+r*.2,y-r*.5,r*.5,r*.35,'#90c687');rect(x+r*.3,y+r*.2,r*.35,r*.35,'#75b584');
    rect(x-r*.55,y-r*.5,r*.6,4,'#d8eee4');rect(x+r*.1,y+r*.1,r*.7,3,'#d8eee4');
  };
  const moon=(x:number,y:number,r:number)=>{disk(x,y,r,'#a9b0bb');disk(x-3,y-4,r-4,'#d4d4d0');disk(x-r*.3,y-r*.24,r*.25,'#949bab');disk(x+r*.25,y+r*.3,r*.2,'#b0b5be');disk(x+r*.3,y-r*.45,r*.12,'#8994a5')};
  const rocket=(x:number,y:number,angle=0,flame=true)=>{
    c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);
    rect(-5,-24,10,4,'#f9ce7f');rect(-8,-20,16,7,'#faf0da');rect(-10,-13,20,25,'#fff7e2');rect(4,-13,6,25,'#b6c2cb');rect(-6,-10,12,8,'#274b73');rect(-3,-9,6,4,'#76d4e4');
    rect(-10,5,20,3,'#da6659');rect(-16,7,6,12,'#c5584f');rect(10,7,6,12,'#c5584f');rect(-6,12,12,6,'#586179');
    if(flame){const length=reducedMotion?13:12+Math.floor(elapsed*8)%3*4;rect(-5,18,10,length,'#ed9750');rect(-3,18,6,length-3,'#ffdf82');rect(-1,18,2,6,'#fff8cc')}
    c.restore();
  };
  rect(0,0,384,216,'#192b49');
  for(let i=0;i<47;i++){const x=(i*73+19)%384,y=(i*43+13)%176;rect(x,y,i%9===0?3:1,i%9===0?3:1,i%3?'#829aaf':'#ecdfaa')}
  const t=Math.min(12,elapsed);
  if(t<4){
    (returning?earth:moon)(328,39,17);
    rect(0,174,384,42,returning?'#b3bac4':'#4b787a');rect(0,190,384,26,returning?'#8d96a3':'#354e5c');rect(130,170,124,7,'#87969b');rect(157,177,73,5,'#263d55');
    rect(145,96,5,76,'#697b8d');rect(145,102,42,4,'#8e9da4');rect(145,133,35,4,'#8e9da4');
    const p=Math.max(0,(t-1.3)/2.7);const y=reducedMotion?135:147-p*p*206;
    if(t>1.1)for(let i=0;i<9;i++){rect(159+i*8-(t*6)%8,167+(i%2)*3,12,6,'#cbd1c6')}
    rocket(194,y,0,t>1.3);
    if(t<1.3){c.font='bold 16px monospace';c.fillStyle='#ffdf82';c.fillText(String(Math.max(1,3-Math.floor(t/.44))),254,118)}
  }else if(t<8){
    (returning?moon:earth)(46,164,38);(returning?earth:moon)(327,48,31);
    const p=reducedMotion?.5:(t-4)/4;
    for(let i=0;i<9;i++)rect(101+i*22,143-i*9,4,2,'#5c7392');
    rocket(98+p*194,139-p*76,Math.PI/3,true);
  }else{
    (returning?moon:earth)(61,43,17);
    rect(0,178,384,38,returning?'#4b787a':'#b3bac4');rect(0,174,72,4,returning?'#6c9f85':'#c8cdd1');rect(255,170,129,8,returning?'#6c9f85':'#c8cdd1');
    rect(22,186,38,6,'#929cad');rect(29,192,26,3,'#8b96a7');rect(289,190,51,7,'#959eac');rect(295,197,39,3,'#cbd0d3');rect(100,201,12,4,'#8994a4');
    const p=Math.min(1,(t-8)/3.3),y=reducedMotion?(t<11.3?90:155):37+118*(1-Math.pow(1-p,2));
    rocket(194,y,0,p<1);
    if(p>=1){rect(177,171,4,5,'#586179');rect(207,171,4,5,'#586179');rect(240,148,2,28,'#f1ede0');rect(242,148,20,12,'#426eac');rect(246,152,8,3,'#fff1bd')}
  }
  rect(16,201,352,3,'#3d5069');rect(16,201,Math.round(352*t/12),3,'#efca77');
}
