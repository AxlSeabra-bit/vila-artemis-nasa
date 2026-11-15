import type { ArtemisEngine } from './engine';
import type { GameStateSnapshot } from './types';
import { SAVE_STORAGE_KEY } from './constants';
import { escapeHtml } from './science';
import './accounts.css';

type User = {id:number;username:string};
type Draft = {revision:number;state:GameStateSnapshot;dirty:boolean};
export class Accounts {
  private user:User|null=null;
  private revision=0;
  private pending:GameStateSnapshot|null=null;
  private inFlight:Promise<boolean>|null=null;
  private blocked=false;
  private ready=false;
  private serverAvailable=sessionStorage.getItem('artemis-static-host')!=='1';
  private root=document.createElement('div');
  private status=document.createElement('span');
  private button=document.createElement('button');
  constructor(private engine:ArtemisEngine,private refresh:()=>void) {
    this.root.id='account-dialog';this.root.className='hidden';this.root.setAttribute('role','dialog');this.root.setAttribute('aria-modal','true');this.root.setAttribute('aria-label','Conta de explorador');document.body.append(this.root);
    const strip=document.createElement('div');strip.id='account-strip';this.button.id='account-button';this.button.textContent='Conta de explorador';this.button.onclick=()=>this.show();
    this.status.id='save-status';this.status.setAttribute('role','status');strip.append(this.status,this.button);document.body.append(strip);
    this.engine.setPausedForModal(true);
    this.engine.onSave=(state)=>{
      if(!this.ready || this.blocked)return;
      if(this.user){this.pending=structuredClone(state);this.writeDraft(true);this.status.textContent='Salvo neste aparelho. Sincronizando...';}
      else this.status.textContent=this.serverAvailable?'Visitante: salvo neste aparelho':'Progresso salvo neste aparelho';
    };
    setInterval(()=>{void this.flush();},2500);
    window.addEventListener('online',()=>{void this.flush();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){this.engine.saveCampaign();void this.flush();}});
    void this.initialize();
  }
  private async request(path:string,method='GET',data?:unknown):Promise<any> {
    const r=await fetch(`/api/${path}`,{method,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-Artemis-Client':'1'},body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(6000)});
    if(r.status===404||r.status===405){this.serverAvailable=false;sessionStorage.setItem('artemis-static-host','1');}
    let b;try{b=await r.json();}catch{throw new Error('Contas disponíveis no servidor local. Você pode jogar como visitante.');}
    if(!r.ok)throw Object.assign(new Error(b.error??'Falha na conexão.'),{status:r.status});
    if(path==='me'&&b&&'user' in b){this.serverAvailable=true;sessionStorage.removeItem('artemis-static-host');}
    return b;
  }
  private draftKey():string{return `artemis-account-${this.user!.id}`;}
  private writeDraft(dirty:boolean):void {
    if(!this.user)return;
    try{localStorage.setItem(this.draftKey(),JSON.stringify({revision:this.revision,state:this.pending??this.engine.state,dirty}));}catch{this.status.textContent='Armazenamento do aparelho cheio. Mantenha a conexão.';}
  }
  private restore(state:GameStateSnapshot):void {
    const classroom=state.mode==='classroom';
    const key=classroom?`${SAVE_STORAGE_KEY}_class_${state.seedCode}_${this.engine.saveSlot}`:`${SAVE_STORAGE_KEY}_${this.engine.saveSlot}`;
    (classroom?sessionStorage:localStorage).setItem(key,JSON.stringify(state));
    if(!this.engine.loadSavedCampaign(state.mode,state.seedCode))throw new Error('Não foi possível abrir esse progresso.');
  }
  private async initialize():Promise<void> {
    try {
      const {user}=await this.request('me');
      if(user){await this.activate(user);return;}
      localStorage.removeItem('artemis-last-account');
    }catch{
      const raw=localStorage.getItem('artemis-last-account');
      if(raw) {
        try{
          this.user=JSON.parse(raw);this.engine.saveSlot=`user-${this.user!.id}`;
          const draft:Draft=JSON.parse(localStorage.getItem(this.draftKey())??'null');
          if(draft){this.revision=draft.revision;this.restore(draft.state);this.pending=draft.dirty?draft.state:null;this.ready=true;this.close();this.status.textContent='Sem conexão: progresso salvo neste aparelho';return;}
        }catch{this.user=null;}
      }
    }
    this.user=null;
    if(sessionStorage.getItem('artemis-guest'))this.guest();else this.show();
  }
  private async activate(user:User):Promise<void> {
    this.ready=false;this.user=user;this.engine.saveSlot=`user-${user.id}`;
    const remote=await this.request('save');
    let draft:Draft|null=null;
    try{draft=JSON.parse(localStorage.getItem(this.draftKey())??'null');}catch{}
    this.revision=remote.revision;this.pending=null;this.blocked=false;
    if(draft?.dirty && draft.revision===remote.revision){this.restore(draft.state);this.pending=draft.state;}
    else if(remote.state)this.restore(remote.state);
    else this.engine.resetMission('campaign','ARTEMIS-7A');
    localStorage.setItem('artemis-last-account',JSON.stringify(user));
    sessionStorage.removeItem('artemis-guest');
    this.ready=true;
    if(draft?.dirty && draft.revision!==remote.revision){
      // Keep the local draft separately; never silently overwrite another device's save.
      localStorage.setItem(`${this.draftKey()}-conflict`,JSON.stringify(draft));
      this.pending=null;this.writeDraft(false);
    }
    this.close();this.button.textContent=`${user.username} · conta`;
    this.status.textContent='Progresso carregado da conta';
    // Persist schema migrations too, including accounts that already finished the tutorial.
    this.engine.saveCampaign();await this.flush();
  }
  private guest():void {
    this.user=null;this.pending=null;this.blocked=false;this.engine.saveSlot='guest';
    const query=new URLSearchParams(location.search);
    const mode=query.get('mode')==='classroom'?'classroom':'campaign';
    const seed=mode==='classroom'?(query.get('seed')||'TURMA-4A').toUpperCase():'ARTEMIS-7A';
    if(!this.engine.loadSavedCampaign(mode,seed))this.engine.resetMission(mode,seed);
    sessionStorage.setItem('artemis-guest','1');this.ready=true;this.close();this.button.textContent=this.serverAvailable?'Entrar / criar conta':'Meu progresso';this.status.textContent=this.serverAvailable?'Visitante: salvo neste aparelho':'Progresso salvo neste aparelho';
  }
  private close():void {this.root.classList.add('hidden');this.engine.setPausedForModal(!document.getElementById('modal-backdrop')!.classList.contains('hidden'));this.refresh();}
  async flush():Promise<boolean> {
    if(this.inFlight)return this.inFlight;
    if(!this.user || !this.pending || this.blocked || !this.ready)return !this.blocked;
    const saving=this.pending, user=this.user;
    this.inFlight=(async()=>{
      try {
        const current=await this.request('me');
        if(current.user?.id!==user.id)throw Object.assign(new Error('Sua sessão mudou. Entre novamente para sincronizar.'),{status:401});
        const result=await this.request('save','PUT',{revision:this.revision,state:saving});
        this.revision=result.revision;
        if(this.pending===saving)this.pending=null;
        this.writeDraft(!!this.pending);this.status.textContent='Progresso salvo na conta';return true;
      }catch(e){
        const error=e as Error&{status?:number};
        if(error.status===409 || error.status===401){this.blocked=true;this.engine.setPausedForModal(true);this.show(error.message);}
        else this.status.textContent='Sem conexão: salvo neste aparelho. Sincroniza ao voltar.';
        return false;
      }finally{this.inFlight=null;}
    })();
    return this.inFlight;
  }
  private show(message=''):void {
    this.engine.setPausedForModal(true);this.root.classList.remove('hidden');
    if(!this.serverAvailable&&!this.user){
      this.root.innerHTML=`<section class="account-card"><img src="/icons/moon-coin.svg" width="40" height="40" alt=""/><h1>Sua aventura fica salva aqui</h1><p>Missões, nome e equipamentos ficam guardados neste navegador. Volte neste mesmo aparelho para continuar!</p><button id="account-guest" class="mission-primary">Continuar neste aparelho</button><small>Apagar os dados do navegador também apaga esse progresso.</small></section>`;
      this.root.querySelector('#account-guest')!.addEventListener('click',()=>{this.guest();this.button.textContent='Meu progresso';this.status.textContent='Progresso salvo neste aparelho';});return;
    }
    this.root.innerHTML=`<section class="account-card"><img src="/icons/moon-coin.svg" width="40" height="40" alt=""/><h1>${this.user?'Sua conta de explorador':'Guarde sua aventura'}</h1><p>${this.user?`Explorador: <strong>${escapeHtml(this.user.username)}</strong>`:'Crie um apelido e uma senha para continuar em outro aparelho neste Wi-Fi. Não precisamos do seu nome real nem de e-mail.'}</p><p id="account-error" role="alert">${escapeHtml(message)}</p>${this.user?`<p>O progresso da conta fica salvo no computador que hospeda o jogo.</p><button id="account-resume" class="mission-primary">${this.blocked?'Carregar progresso do servidor':'Continuar jogando'}</button><button id="account-logout" class="account-secondary">Salvar e sair da conta</button>`:`<form id="account-form"><label for="account-name">Apelido</label><input id="account-name" name="username" autocomplete="username" pattern="[a-zA-Z0-9_]{3,20}" minlength="3" maxlength="20" required placeholder="Ex.: lua_exploradora"/><label for="account-password">Senha do jogo</label><input id="account-password" name="password" autocomplete="current-password" type="password" minlength="8" maxlength="128" required placeholder="Pelo menos 8 caracteres"/><div class="account-buttons"><button class="mission-primary" type="submit" name="action" value="login">Entrar</button><button id="account-register" class="account-secondary" type="submit" name="action" value="register">Criar conta</button></div></form><button id="account-guest" class="account-secondary">Jogar como visitante</button><small>Visitantes salvam só neste aparelho. Use uma senha exclusiva deste jogo.</small>`}</section>`;
    const error=(e:unknown)=>{this.root.querySelector('#account-error')!.textContent=e instanceof Error?e.message:'Não foi possível conectar.';};
    this.root.querySelector('#account-guest')?.addEventListener('click',()=>this.guest());
    this.root.querySelector('#account-resume')?.addEventListener('click',async()=>{
      try{if(this.blocked)await this.activate(this.user!);else this.close();}catch(e){error(e);}
    });
    this.root.querySelector('#account-logout')?.addEventListener('click',async()=>{
      try{
        if(this.blocked)throw new Error('Carregue primeiro o progresso do servidor.');
        this.engine.saveCampaign();
        do { if(!await this.flush())throw new Error('Conecte-se ao Wi-Fi para salvar e sair.'); } while(this.pending);
        await this.request('logout','POST',{});localStorage.removeItem('artemis-last-account');this.ready=false;this.user=null;this.pending=null;this.show();
      }catch(e){error(e);}
    });
    this.root.querySelector<HTMLFormElement>('#account-form')?.addEventListener('submit',async(event)=>{
      event.preventDefault();const form=event.currentTarget as HTMLFormElement;
      const action=(event.submitter as HTMLButtonElement)?.value??'login';
      const buttons=form.querySelectorAll<HTMLButtonElement>('button');buttons.forEach(b=>b.disabled=true);
      try{
        const {user}=await this.request(action,'POST',{username:(form.elements.namedItem('username') as HTMLInputElement).value,password:(form.elements.namedItem('password') as HTMLInputElement).value});
        await this.activate(user);
      }catch(e){error(e);}finally{buttons.forEach(b=>b.disabled=false);}
    });
  }
}
