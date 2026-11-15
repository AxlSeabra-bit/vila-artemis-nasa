import type { ArtemisEngine } from './engine';
import type { BuildingType, Lang } from './types';
import { EQUIPMENT, polarMission, crewCount, constructionSeconds } from './campaign';
import { requestedBuilding, TUTORIAL_COSTS, tutorialLevel, WARNING_BEFORE_EXPLANATION, type TutorialStep } from './surfaceTutorial';

const messages: Record<TutorialStep, [string,string,string]> = {
  'equipment-site': ['Vamos montar os equipamentos comprados no Centro Científico.','Let’s assemble the devices bought at the Science Center.','Montemos los equipos comprados en el Centro Científico.'],
  'equipment-build': ['A equipe está montando o equipamento.','The crew is assembling the device.','El equipo está montando el dispositivo.'],
  'equipment-home': ['Equipamento pronto! A equipe volta à base.','Device ready! The crew is returning to base.','¡Equipo listo! La tripulación vuelve a la base.'],
  'base-site': ['Vamos construir nosso abrigo! Escolha um terreno livre. Você verá o custo antes de confirmar. Arraste o mapa para explorar e use + e - para aproximar.', 'Let’s build our shelter! Choose free ground and review the cost before confirming. Drag the map to explore; use + and - to zoom.', '¡Construyamos el refugio! Elige terreno libre y revisa el costo antes de confirmar. Arrastra el mapa y usa + y - para acercar.'],
  'base-build': ['A equipe saiu do foguete! Ao chegar ao local, trabalhará por 15 segundos. Construir consome oxigênio e energia.', 'The crew left the rocket! After reaching the site, they will work for 15 seconds. Building uses oxygen and energy.', '¡El equipo salió del cohete! Al llegar, trabajará 15 segundos. Construir consume oxígeno y energía.'],
  'base-home': ['Base pronta! Vamos acompanhar todos entrando no abrigo.', 'Base complete! Watch everyone enter the shelter.', '¡Base lista! Observa cómo todos entran al refugio.'],
  'antenna-site': ['Todos estão na base. Agora precisamos de antenas para enviar nossas descobertas à Terra. Escolha um local livre para construir.', 'Everyone is inside. Now we need antennas to send our discoveries to Earth. Choose a free spot to build.', 'Todos están dentro. Necesitamos antenas para enviar nuestros descubrimientos a la Tierra. Elige un lugar libre.'],
  'antenna-build': ['A equipe saiu da base para montar as antenas. O trabalho leva 15 segundos após a chegada.', 'The crew left the base to assemble the antennas. Work takes 15 seconds after arrival.', 'El equipo salió de la base para montar las antenas. El trabajo dura 15 segundos después de llegar.'],
  'antenna-ready': ['Antenas prontas! Toque nas antenas no mapa e escolha Enviar informações.', 'Antennas ready! Tap them on the map and choose Send information.', '¡Antenas listas! Tócalas en el mapa y elige Enviar información.'],
  'transmitting': ['Cada segundo de transmissão gera 1 de conhecimento! Com 20 de conhecimento você completa a barra e passa do nível 1 para o nível 2.', 'Each second of transmission earns 1 knowledge point! Collect 20 to fill the bar and advance from level 1 to level 2.', '¡Cada segundo de transmisión genera 1 de conocimiento! Con 20 completas la barra y pasas del nivel 1 al nivel 2.'],
  'level-up': ['Você chegou ao nível 2!', 'You reached level 2!', '¡Llegaste al nivel 2!'],
  'data-home': ['Dados enviados! Nível 2 alcançado. Agora a equipe está voltando para a base.', 'Data sent! Level 2 reached. The crew is returning to the base.', '¡Datos enviados! Nivel 2 alcanzado. El equipo vuelve a la base.'],
  'radiation': ['Esse alerta avisa que uma tempestade solar está chegando. Fora da nave ou da base, recebemos mais radiação. Mantenha a equipe abrigada! A radiação se acumula e não desaparece no abrigo.', 'This alert warns us that a solar storm is approaching. Exposure is greater outside the ship or base. Keep the crew sheltered! Radiation accumulates and does not disappear in shelter.', 'Esta alerta avisa que llega una tormenta solar. Fuera de la nave o base recibimos más radiación. ¡Mantén al equipo refugiado! La radiación se acumula y no desaparece en el refugio.'],
  'warning': ['Alerta de treinamento: tempestade solar chegando! Mantenha todos dentro da base ou da nave. No exterior, a radiação sobe rapidamente.', 'Training alert: a solar storm is approaching! Keep everyone inside the base or ship. Exposure rises quickly outside.', '¡Alerta de entrenamiento: llega una tormenta solar! Mantén a todos dentro de la base o nave. La exposición sube rápido afuera.'],
  'storm': ['A onda laranja representa partículas solares, que não são visíveis assim na realidade. O abrigo reduz a exposição. Aos 100% do limite educativo, a missão termina para proteger a equipe.', 'The orange wave represents solar particles, which are not visible like this in reality. Shelter reduces exposure. At 100% of our educational limit, the mission ends to protect the crew.', 'La onda naranja representa partículas solares, que no se ven así en realidad. El refugio reduce la exposición. Al 100% del límite educativo, la misión termina para proteger al equipo.'],
  'return-ready': ['Tempestade encerrada, dados na Terra e tripulação protegida! Objetivo concluído. Vamos preparar o retorno para casa?', 'Storm over, data on Earth and crew protected! Objective complete. Let’s prepare our return home.', '¡Terminó la tormenta, los datos llegaron y el equipo está protegido! Objetivo cumplido. Preparemos el regreso.'],
  'boarding': ['Todos a bordo! Vamos da base até o foguete para voltar à Terra.', 'All aboard! Walk from the base to the rocket for the journey to Earth.', '¡Todos a bordo! Vamos de la base al cohete para volver a la Tierra.'],
};

export class TutorialView {
  private signature = '';
  constructor(private engine: ArtemisEngine, private lang:()=>Lang, private place:(type:BuildingType|null)=>void,
    private dialog:(title:string,html:string,bind:()=>void)=>void, private close:()=>void) {}
  private L(pt:string,en:string,es:string):string { return this.lang()==='en'?en:this.lang()==='es'?es:pt; }
  render(): boolean {
    const s=this.engine.state, t=s.tutorial, dock=document.getElementById('dock-content')!;
    const notice=document.getElementById('level-up-notice')!;
    notice.classList.toggle('hidden',t?.step!=='level-up');
    document.querySelector<HTMLElement>('.dock-tabs')!.hidden=!!t;
    if (!t) return false;
    const duration=constructionSeconds(crewCount(s)),level=tutorialLevel(s.xp);
    const seconds=Math.ceil((t.step==='transmitting'?20:t.step==='warning'?8:t.step==='storm'?12:duration)-t.elapsed);
    const sig=[t.step,seconds,Math.floor(s.xp),this.lang(),s.units.filter(u=>u.state==='sheltered').length].join('|');
    if (sig===this.signature) return true;
    this.signature=sig;
    if(t.step==='level-up'){
      notice.innerHTML=`<section class="level-up-card"><img class="level-up-book" src="/icons/knowledge.svg" alt=""/><h2 id="level-up-heading">${this.L(`Nível ${level} alcançado!`,`Level ${level} reached!`,`¡Nivel ${level} alcanzado!`)}</h2><div class="level-up-scientist"><img src="/icons/scientist.png" alt="Dra. Bruna"/><p>${this.L(`Parabéns! Você enviou dados por 20 segundos e ganhou 20 de conhecimento. Com isso, chegou ao nível ${level}! A barra agora mostra o progresso para o próximo nível.`,`Congratulations! You sent data for 20 seconds and earned 20 knowledge points. You reached level ${level}! The bar now tracks progress toward the next level.`,`¡Felicidades! Enviaste datos durante 20 segundos y ganaste 20 de conocimiento. ¡Llegaste al nivel ${level}! La barra muestra el progreso al siguiente nivel.`)}</p></div><button id="acknowledge-level" class="mission-primary">${this.L('Continuar a missão','Continue the mission','Continuar la misión')}</button></section>`;
      const button=notice.querySelector<HTMLButtonElement>('#acknowledge-level')!;
      button.onclick=()=>{this.engine.acknowledgeKnowledge();this.render();};button.focus({preventScroll:true});
      notice.onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();button.focus();}};
    }
    if(t.step==='warning'&&t.elapsed<WARNING_BEFORE_EXPLANATION){
      dock.innerHTML=`<div class="alarm-instruction"><strong>${this.L('⚠ Atenção ao alerta vermelho!','⚠ Watch the red alert!','⚠ ¡Atención a la alerta roja!')}</strong><span>${s.units.filter(u=>u.state==='sheltered').length}/${s.units.length} ${this.L('astronautas no abrigo','astronauts sheltered','astronautas en el refugio')}</span></div>`;return true;
    }
    const index=this.lang()==='en'?1:this.lang()==='es'?2:0;
    const building=requestedBuilding(s);
    const equipment=EQUIPMENT.find(i=>i.id===building);
    const label=equipment?this.L(`Construir ${equipment.name.pt}`,`Build ${equipment.name.en}`,`Construir ${equipment.name.es}`):building==='command_center'?this.L('Escolher local da base','Choose base location','Elegir lugar de la base'):this.L('Escolher local das antenas','Choose antenna location','Elegir lugar de las antenas');
    const timed=['base-build','antenna-build','equipment-build','transmitting','warning','storm'].includes(t.step);
    let message=messages[t.step==='warning'?'radiation':t.step][index];
    if(polarMission(s)){
      if(t.step==='base-site')message=this.L('Polo sul! Arraste o mapa para ver as crateras maiores e as pedras. Elas bloqueiam construção e passagem. Escolha terreno livre para o abrigo.','South pole! Drag the map to see larger craters and rocks. They block construction and walking. Choose free ground for shelter.','¡Polo sur! Arrastra el mapa para ver los grandes cráteres y rocas. Bloquean construcciones y pasos. Elige terreno libre para el refugio.');
      if(['base-build','antenna-build','equipment-build'].includes(t.step))message=this.L(`Nossa equipe de ${s.units.length} astronautas leva ${duration.toLocaleString('pt',{maximumFractionDigits:2})} segundos de trabalho após chegar. Mais pessoas constroem mais rápido e consomem mais recursos.`,`Our ${s.units.length}-astronaut crew needs ${duration.toLocaleString('en',{maximumFractionDigits:2})} seconds of work after arrival. More people build faster and consume more resources.`,`Nuestro equipo de ${s.units.length} astronautas necesita ${duration.toLocaleString('es',{maximumFractionDigits:2})} segundos de trabajo tras llegar. Más personas construyen más rápido y consumen más recursos.`);
      if(t.step==='equipment-site')message=building==='solar_array'?this.L('Comece pelas placas solares, em terreno livre e iluminado. Elas produzirão energia para os equipamentos.','Start with solar panels on free, illuminated ground. They will produce power for the devices.','Empieza por los paneles solares en terreno libre e iluminado. Producirán energía para los equipos.'):building==='ice_extractor'?this.L('Monte o extrator perto da bandeira azul, junto à cratera no lado direito. Ele simula a coleta e o tratamento de gelo com energia. A produção é uma regra do jogo.','Place the extractor near the blue flag by the right-hand crater. It simulates powered collection and treatment of ice. Output is a game rule.','Monta el extractor cerca de la bandera azul junto al cráter de la derecha. Simula recolección y tratamiento de hielo con energía. La producción es una regla del juego.'):this.L('Agora monte a estufa. As plantas precisam de água, energia e um ambiente protegido para produzir alimentos.','Now assemble the greenhouse. Plants need water, power and a protected environment to produce food.','Ahora monta el invernadero. Las plantas necesitan agua, energía y un ambiente protegido para producir alimentos.');
      if(t.step==='transmitting')message=this.L('Compartilhe a pesquisa sobre gelo polar! Cada segundo de envio acrescenta 1 de conhecimento ao seu perfil.','Share your polar ice research! Each transmission second adds 1 knowledge point to your profile.','¡Comparte la investigación del hielo polar! Cada segundo de envío añade 1 de conocimiento a tu perfil.');
      if(t.step==='level-up'||t.step==='data-home')message=this.L(`Dados enviados! Você chegou ao nível ${level}. A equipe volta para a base.`,`Data sent! You reached level ${level}. The crew returns to base.`,`¡Datos enviados! Llegaste al nivel ${level}. El equipo vuelve a la base.`);
    }
    const transmitted=Math.min(20,Math.floor(t.elapsed+1e-8));
    dock.innerHTML=`<section class="tutorial-guide" aria-label="${this.L('Orientação da cientista','Scientist guidance','Guía de la científica')}"><div class="tutorial-portrait"><img src="/icons/scientist.png" alt="Dra. Bruna"/></div><div class="tutorial-copy"><strong>DRA. BRUNA <span id="tutorial-level">${this.L('Nível','Level','Nivel')} ${tutorialLevel(s.xp)}</span></strong><p id="tutorial-message">${message}</p><div class="tutorial-actions">${building?`<button id="tutorial-place" class="mission-primary">${label}</button>`:''}${['warning','storm'].includes(t.step)?`<button id="tutorial-shelter" class="mission-primary">${this.L('Manter equipe abrigada','Keep crew sheltered','Mantener equipo refugiado')}</button>`:''}${t.step==='return-ready'?`<button id="tutorial-return" class="mission-primary">${this.L('Preparar retorno à Terra','Prepare return to Earth','Preparar regreso a la Tierra')}</button>`:''}${timed?`<b id="tutorial-timer">${seconds}s</b>`:''}<small>${s.units.filter(u=>u.state==='sheltered').length}/${s.units.length} ${this.L('no abrigo','sheltered','en el refugio')}</small></div>${['transmitting'].includes(t.step)?`<div class="knowledge-track" role="progressbar" aria-label="${this.L('Conhecimento','Knowledge','Conocimiento')}" aria-valuemin="0" aria-valuemax="20" aria-valuenow="${transmitted}"><span style="width:${transmitted/20*100}%"></span><b>${transmitted}/20 ${this.L('conhecimento','knowledge','conocimiento')}</b></div>`:''}</div></section>`;
    dock.querySelector('#tutorial-place')?.addEventListener('click',()=>this.place(building));
    dock.querySelector('#tutorial-shelter')?.addEventListener('click',()=>this.engine.shelterTutorialCrew());
    dock.querySelector('#tutorial-return')?.addEventListener('click',()=>this.engine.prepareReturn());
    return true;
  }
  tap(wx:number,wy:number,placing:BuildingType|null):boolean {
    const s=this.engine.state;
    if(!s.tutorial)return false;
    const building=requestedBuilding(s), x=Math.floor(wx),y=Math.floor(wy);
    if(placing && building===placing) {
      if(!this.engine.canPlaceBuilding(building,x,y)) {
        this.dialog(this.L('Escolha terreno livre','Choose free ground','Elige terreno libre'),`<p>${this.L(building==='ice_extractor'?'Escolha terreno livre perto da bandeira azul de pesquisa. Crateras e pedras bloqueiam a construção.':'Esse espaço está ocupado ou contém uma cratera ou pedra. Escolha outro ponto no chão.',building==='ice_extractor'?'Choose free ground near the blue research flag. Craters and rocks block construction.':'This space is occupied or contains a crater or rock. Choose another point on the ground.',building==='ice_extractor'?'Elige terreno libre cerca de la bandera azul. Cráteres y rocas bloquean la construcción.':'Este espacio está ocupado o contiene un cráter o roca. Elige otro punto en el suelo.')}</p>`,()=>{});return true;
      }
      const cost=TUTORIAL_COSTS[building];
      const equipment=EQUIPMENT.find(i=>i.id===building),duration=constructionSeconds(crewCount(s));
      const affordable=this.engine.canAfford(cost);
      this.dialog(this.L('Confirmar construção','Confirm construction','Confirmar construcción'),`<p>${equipment?equipment.name[this.lang()]:building==='command_center'?this.L('Base lunar','Lunar base','Base lunar'):this.L('Antenas de comunicação','Communication antennas','Antenas de comunicación')}</p><div class="tutorial-cost">⚡ ${cost.energy} ${this.L('energia','energy','energía')}<br/>🫧 ${cost.oxygen} ${this.L('oxigênio','oxygen','oxígeno')}</div><p>${this.L(`${duration.toLocaleString('pt',{maximumFractionDigits:2})} segundos de trabalho após a equipe chegar.`,`${duration.toLocaleString('en',{maximumFractionDigits:2})} seconds of work after the crew arrives.`,`${duration.toLocaleString('es',{maximumFractionDigits:2})} segundos de trabajo después de que llegue el equipo.`)}</p><button id="confirm-tutorial-build" class="mission-primary" ${affordable?'':'disabled'}>${affordable?this.L('Confirmar e construir','Confirm and build','Confirmar y construir'):this.L('Recursos insuficientes','Not enough resources','Recursos insuficientes')}</button>`,()=>{
        document.getElementById('confirm-tutorial-build')!.onclick=()=>{if(this.engine.buildTutorial(building,x,y)){this.close();this.place(null);}};
      });
    } else {
      const hit=this.engine.findBuildingAt(wx,wy);
      if(hit?.id===s.tutorial.antennaId && s.tutorial.step==='antenna-ready') {
        this.dialog(this.L('Enviar descobertas à Terra','Send discoveries to Earth','Enviar descubrimientos a la Tierra'),`<p>${this.L('Vamos compartilhar os dados da missão. A transmissão leva 20 segundos e rende 1 de conhecimento por segundo, 20 ao todo.','Share our mission data. The transmission takes 20 seconds and earns 1 knowledge point per second, 20 in total.','Compartamos los datos de la misión. La transmisión dura 20 segundos y da 1 de conocimiento por segundo, 20 en total.')}</p><button id="send-tutorial-data" class="mission-primary">${this.L('Enviar informações','Send information','Enviar información')}</button>`,()=>{
          document.getElementById('send-tutorial-data')!.onclick=()=>{if(this.engine.sendTutorialData())this.close();};
        });
      }
    }
    return true;
  }
}
