import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
import {createServer} from 'vite';
const server=await createServer({server:{host:'127.0.0.1',port:5174,strictPort:true}});
await server.listen();
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:5174');
  const icons=await page.evaluate(async()=>{
    const {getBuildingSprite}=await import('/src/pixelSprites.ts');
    const result={};
    for(const [file,size,scale] of [['icon-192.png',192,.68],['icon-512.png',512,.68],['icon-maskable-512.png',512,.58]]) {
      const c=document.createElement('canvas');c.width=c.height=size;
      const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
      ctx.fillStyle='#4a2511';ctx.fillRect(0,0,size,size);
      ctx.fillStyle='#8e83ac';ctx.fillRect(size*.12,size*.62,size*.76,size*.22);
      const sprite=getBuildingSprite('command_center',0,true);
      ctx.drawImage(sprite,size*(1-scale)/2,size*(1-scale)/2,size*scale,size*scale);
      result[file]=c.toDataURL('image/png').split(',')[1];
    }
    return result;
  });
  for(const [file,data] of Object.entries(icons))writeFileSync('public/icons/'+file,Buffer.from(data,'base64'));
  console.log('Three v3 pixel icons created');
} finally {await browser.close();await server.close()}
