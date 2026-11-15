import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { scrypt, randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync, createReadStream, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { networkInterfaces } from 'node:os';

const option=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const port=Number(option('--port','4176')), host=option('--host','0.0.0.0');
const dataDir=resolve(option('--data-dir','.local-data')), root=resolve('dist');
mkdirSync(dataDir,{recursive:true});
const db=new DatabaseSync(resolve(dataDir,'artemis.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
  CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, password_hash TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id), expires INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS saves(user_id INTEGER PRIMARY KEY REFERENCES users(id), revision INTEGER NOT NULL DEFAULT 0, state TEXT);`);
const derive=promisify(scrypt), hash=v=>createHash('sha256').update(v).digest('hex');
const interfaces=Object.values(networkInterfaces()).flat().filter(Boolean);
const privateIPv4=address=>/^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(address);
const lanInterfaces=interfaces.filter(n=>n.family==='IPv4'&&privateIPv4(n.address));
const allowedHosts=new Set(['localhost','127.0.0.1','[::1]',...lanInterfaces.map(n=>n.address)]);
const ipNumber=address=>address.split('.').reduce((n,part)=>(n<<8)|Number(part),0);
function localClient(address='') {
  const ip=address.replace(/^::ffff:/,'');
  if(ip==='::1'||ip==='127.0.0.1')return true;
  if(!/^\d+\.\d+\.\d+\.\d+$/.test(ip))return false;
  return lanInterfaces.some(n=>(ipNumber(ip)&ipNumber(n.netmask))===(ipNumber(n.address)&ipNumber(n.netmask)));
}
const limits=new Map();
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
function session(req) {
  const token=(req.headers.cookie??'').match(/(?:^|;\s*)artemis_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  return token?db.prepare('SELECT users.id, username, token_hash FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires>?').get(hash(token),Date.now()):null;
}
function cookie(res,token,age=604800){res.setHeader('Set-Cookie',`artemis_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${process.env.ARTEMIS_HTTPS==='1'?'; Secure':''}`);}
async function body(req) {
  if(!req.headers['content-type']?.startsWith('application/json'))throw Object.assign(new Error('Envie JSON.'),{status:415});
  let chunks=[],size=0;
  for await(const chunk of req){size+=chunk.length;if(size>256*1024)throw Object.assign(new Error('Dados grandes demais.'),{status:413});chunks.push(chunk);}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Object.assign(new Error('Dados inválidos.'),{status:400});}
}
function validSave(s) {
  const stages=['briefing','hub','profile','science-center','missions','landing','crew','flight','surface','returning','completed'];
  if(!s || !s.expedition || !stages.includes(s.expedition.stage) || s.expedition.version!==1 || !['campaign','classroom'].includes(s.mode) || typeof s.seedCode!=='string')return false;
  if(!Number.isInteger(s.expedition.coins) || s.expedition.coins<0 || s.expedition.coins>100000 || !Number.isFinite(s.xp) || s.xp<0)return false;
  if(s.expedition.crewSize!==undefined&&(!Number.isInteger(s.expedition.crewSize)||s.expedition.crewSize<1||s.expedition.crewSize>6))return false;
  if(s.campaign && (s.campaign.version!==1 || typeof s.campaign.displayName!=='string' || s.campaign.displayName.length>24 || !Array.isArray(s.campaign.completed) || s.campaign.completed.length>2 || !s.campaign.equipment || !['solar_array','ice_extractor','hydroponics'].every(k=>Number.isInteger(s.campaign.equipment[k])&&s.campaign.equipment[k]>=0&&s.campaign.equipment[k]<=2)))return false;
  if(!s.resources || !['energy','oxygen','food','regolith'].every(k=>Number.isFinite(s.resources[k])&&s.resources[k]>=0&&s.resources[k]<=999))return false;
  if((s.tutorial?.version===2 || 'water' in s.resources) && (!Number.isFinite(s.resources.water)||s.resources.water<0||s.resources.water>999))return false;
  if(!['buildings','units','nodes','clickableEvents'].every(k=>Array.isArray(s[k])&&s[k].length<=500))return false;
  return Number.isFinite(s.radiationLevel)&&s.radiationLevel>=0&&s.radiationLevel<=100;
}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');
  try {
    if(!localClient(req.socket.remoteAddress))return json(res,403,{error:'Disponível somente na rede local.'});
    const base=new URL(`http://${req.headers.host}`);
    if(!allowedHosts.has(base.hostname))return json(res,403,{error:'Endereço não permitido.'});
    const url=new URL(req.url,base), path=url.pathname;
    if(path.startsWith('/api/')) {
      res.setHeader('Cache-Control','no-store');
      if(!['GET','POST','PUT'].includes(req.method))return json(res,405,{error:'Método não permitido.'});
      if(req.method!=='GET' && (req.headers['x-artemis-client']!=='1' || (req.headers.origin && req.headers.origin!==base.origin) || req.headers['sec-fetch-site']==='cross-site'))return json(res,403,{error:'Origem não permitida.'});
      if(path==='/api/health' && req.method==='GET')return json(res,200,{ok:true});
      if(['/api/register','/api/login'].includes(path) && req.method==='POST') {
        const ip=req.socket.remoteAddress, now=Date.now();
        const bucket=limits.get(ip)??{count:0,until:now+60000};
        if(now>bucket.until){bucket.count=0;bucket.until=now+60000;}
        bucket.count++;limits.set(ip,bucket);
        if(bucket.count>20){res.setHeader('Retry-After','60');return json(res,429,{error:'Muitas tentativas. Espere um minuto.'});}
        const b=await body(req), username=String(b.username??'').trim().toLowerCase(), password=b.password;
        if(!/^[a-z0-9_]{3,20}$/.test(username) || typeof password!=='string' || password.length<8 || password.length>128)return json(res,400,{error:'Use apelido com 3 a 20 letras, números ou _. A senha precisa de 8 a 128 caracteres.'});
        let user=db.prepare('SELECT * FROM users WHERE username=?').get(username);
        if(path==='/api/register') {
          if(user)return json(res,409,{error:'Esse apelido já existe. Escolha outro ou entre na conta.'});
          const salt=randomBytes(16).toString('hex'), digest=await derive(password,salt,64);
          try{const r=db.prepare('INSERT INTO users(username,salt,password_hash) VALUES(?,?,?)').run(username,salt,digest.toString('hex'));user={id:Number(r.lastInsertRowid),username};}
          catch{return json(res,409,{error:'Esse apelido já existe.'});}
        } else {
          const digest=await derive(password,user?.salt??'00000000000000000000000000000000',64);
          if(!user || !timingSafeEqual(digest,Buffer.from(user.password_hash,'hex')))return json(res,401,{error:'Apelido ou senha incorretos.'});
        }
        const old=session(req);if(old)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(old.token_hash);
        db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
        const token=randomBytes(32).toString('hex');
        db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),user.id,Date.now()+604800000);
        cookie(res,token);return json(res,200,{user:{id:user.id,username:user.username}});
      }
      const user=session(req);
      if(path==='/api/me' && req.method==='GET')return json(res,200,{user:user?{id:user.id,username:user.username}:null});
      if(!user)return json(res,401,{error:'Entre na sua conta para salvar.'});
      if(path==='/api/logout' && req.method==='POST'){db.prepare('DELETE FROM sessions WHERE token_hash=?').run(user.token_hash);cookie(res,'',0);return json(res,200,{ok:true});}
      if(path==='/api/save' && req.method==='GET'){
        const save=db.prepare('SELECT revision,state FROM saves WHERE user_id=?').get(user.id);
        return json(res,200,{revision:save?.revision??0,state:save?.state?JSON.parse(save.state):null});
      }
      if(path==='/api/save' && req.method==='PUT'){
        const b=await body(req);
        if(!Number.isSafeInteger(b.revision)||b.revision<0||!validSave(b.state))return json(res,400,{error:'Progresso inválido.'});
        db.prepare('INSERT OR IGNORE INTO saves(user_id,revision,state) VALUES(?,0,NULL)').run(user.id);
        const result=db.prepare('UPDATE saves SET revision=revision+1,state=? WHERE user_id=? AND revision=?').run(JSON.stringify(b.state),user.id,b.revision);
        if(!result.changes)return json(res,409,{error:'O progresso mudou em outro aparelho. Recarregue para continuar.'});
        return json(res,200,{revision:b.revision+1});
      }
      return json(res,404,{error:'Rota não encontrada.'});
    }
    if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Método não permitido.'});
    let decoded;try{decoded=decodeURIComponent(path);}catch{return json(res,400,{error:'Endereço inválido.'});}
    let file=resolve(root,`.${decoded==='/'?'/index.html':decoded}`);
    if(!file.startsWith(root+sep))return json(res,403,{error:'Arquivo não permitido.'});
    let stat;try{stat=statSync(file);}catch{return json(res,404,{error:'Arquivo não encontrado.'});}
    if(!stat.isFile())return json(res,404,{error:'Arquivo não encontrado.'});
    res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream','Content-Length':stat.size,'Cache-Control':file.endsWith('sw.js')||file.endsWith('index.html')?'no-cache':'public, max-age=3600'});
    if(req.method==='HEAD')res.end();else createReadStream(file).on('error',()=>res.destroy()).pipe(res);
  }catch(error){if(!res.headersSent)json(res,error.status??500,{error:error.status?error.message:'Não foi possível concluir. Tente novamente.'});else res.destroy();}
});
server.requestTimeout=15000;server.headersTimeout=10000;
server.listen(port,host,()=>{console.log(`Vila Artemis pronta em http://127.0.0.1:${port}`);for(const ip of allowedHosts)if(/^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(ip))console.log(`Wi-Fi/rede local: http://${ip}:${port}`);});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{db.close();process.exit(0);}));
