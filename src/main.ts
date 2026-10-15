import './style.css';
import {FixedClock} from './geometry';
import {Simulation,IDLE,type Input,type Snapshot} from './simulation';
import {Tournament} from './tournament';
import {Renderer} from './render';
import {loadSave,writeSave} from './storage';
import {Sound} from './audio';

const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`
<header class="masthead"><a class="brand" href="./" aria-label="Vesper Breakers home"><span class="brand-mark">✦</span><span>VESPER <b>FLIGHT SYSTEMS</b></span></a><nav aria-label="Game settings"><button id="mute" class="utility" aria-pressed="false">Sound on</button><button id="motion" class="utility" aria-pressed="false">Motion full</button><button id="manual" class="utility">Flight manual <span>↗</span></button></nav></header>
<main><div class="intro-line"><span>EXPEDITION 001 / THE DEBRIS CORRIDOR</span><span class="online-dot">LOCAL ARCADE · 1–2 PILOTS</span></div>
<section class="arena" aria-label="Game arena">
<canvas id="space" tabindex="0" aria-label="Vesper flight arena. Keyboard controls in the flight manual."></canvas>
<div class="hud" id="hud" hidden><div class="mission-readout"><span id="sector">SECTOR 01 / 05</span><strong id="score">000000</strong><span id="threats">THREATS 00</span></div><div id="pilots" class="pilots"></div><button id="pause" class="utility pause-button">Pause <kbd>Esc</kbd></button></div>
<div id="launch" class="launch">
<div class="launch-copy"><div class="eyebrow"><i></i> THE CORRIDOR IS CALLING</div><h1>Vesper<br><em>Breakers.</em></h1><p class="lede">A little ship. A very big sky.<br>Cut a path through the chaos.</p><p class="brief">Ride your momentum. Break the comet cores.<br>Bring a wingmate, or carve your own way home.</p><div class="launch-actions"><button id="solo" class="primary">Launch solo <span>↗</span></button><button id="coop" class="secondary">Local co-op <span>+1</span></button></div><button id="tournament" class="secondary">Local tournament · first to 3</button><div class="records"><span>SOLO BEST <b id="solo-best">000000</b></span><span>CO-OP BEST <b id="coop-best">000000</b></span></div></div>
<div class="coordinates" aria-hidden="true"><span>Δ 07.31 / VESPER</span><span>FLIGHT-READY<br>ION DRIVE ACTIVE</span></div>
<div class="launch-footer"><span><b>01</b> FIVE SECTORS</span><span><b>02</b> THREE HULLS</span><span><b>03</b> ONE WAY THROUGH</span></div>
</div>
<div id="countdown" class="countdown" hidden></div>
<div id="end-panel" class="modal-layer" hidden><div class="panel"><span class="eyebrow" id="end-eyebrow">FLIGHT LOG</span><h2 id="end-title">Expedition paused</h2><p id="end-text"></p><div class="panel-actions"><button id="continue" class="primary">Resume flight <span>↗</span></button><button id="return" class="secondary">Return to hangar</button></div></div></div>
<div id="status" class="sr-only" role="status" aria-live="polite"></div>
</section>
<div class="touch-controls" aria-label="Touch solo flight controls"><div class="touch-steer"><button data-action="left" aria-label="Turn left">↶</button><button data-action="thrust" aria-label="Thrust">↑</button><button data-action="right" aria-label="Turn right">↷</button><button data-action="brake" aria-label="Brake">↓</button></div><div class="touch-combat"><button data-action="blink">Blink</button><button data-action="shield">Shield</button><button data-action="pulse">Pulse</button><button class="touch-fire" data-action="fire">Fire</button></div></div>
<section class="control-strip" aria-label="Quick flight controls"><div><span class="control-title">YOUR FLIGHT KIT</span><p>Turn. Thrust. Let it drift.</p></div><div id="quick-controls"><span><kbd>W A D</kbd> fly <kbd>S</kbd> brake</span><span><kbd>Space</kbd> fire</span><span><kbd>Shift</kbd> shield</span><span><kbd>Q</kbd> blink <kbd>E</kbd> pulse</span></div></section>
<footer><span>AN ORIGINAL ARCADE EXPEDITION</span><span>NO DOWNLOADS. JUST STARDUST.</span></footer>
</main>
<dialog id="help"><div class="manual-header"><span class="eyebrow">VESPER / PILOT HANDBOOK</span><button id="close-help" class="utility">Close ✕</button></div><h2>Make the sky yours.</h2><p>Destroy every comet fragment and raider to clear a sector. Clear all five to open the corridor. Core → two shards → four fragments. Each break scores once; sector clearance earns a bonus.</p><div class="manual-grid"><section><h3>Solo pilot</h3><p><kbd>W / ↑</kbd> thrust · <kbd>A D / ← →</kbd> turn<br><kbd>S / ↓</kbd> brake · <kbd>Space / F</kbd> fire<br><kbd>Shift</kbd> shield · <kbd>Q</kbd> blink · <kbd>E</kbd> pulse</p></section><section><h3>Local wingmates</h3><p><b>Mint pilot:</b> <kbd>W A S D</kbd> flight, <kbd>F</kbd> fire,<br><kbd>Shift</kbd> shield, <kbd>Q</kbd> blink, <kbd>E</kbd> pulse.<br><b>Copper pilot:</b> arrows fly, <kbd>/</kbd> fire,<br><kbd>Enter</kbd> shield, <kbd>,</kbd> blink, <kbd>.</kbd> pulse.</p></section><section><h3>Energy is a choice</h3><p><b>Shield / 25</b> — protect for 1.5s. Recharges in 4s.<br><b>Blink / 35</b> — jump to clear space. Recharges in 3s.<br><b>Pulse / 60</b> — split nearby threats. Recharges in 6s.<br>Energy restores at 8 per second, up to 100.</p></section><section><h3>Stay in the fight</h3><p>Three hulls per pilot. Grace rings protect new spawns. Screen edges wrap. Expedition shots cannot hurt your wingmate. Tournament shots can eliminate the other pilot. Sector 3 unlocks spread fire. <kbd>Esc / P</kbd> pauses. Switching away pauses automatically.</p></section></div><p class="manual-note">Two-player co-op shares a keyboard and a score. Tournament uses the same two keyboard sets: one hull each, last survivor wins the round, first to 3 round wins takes the match. Simultaneous losses draw; no point is awarded. Clearing rocks does not end a tournament round. Match progress lasts until you return to hangar or reload. No online play. Some keyboards limit simultaneous keys; adjust who fires if a key gets blocked. On touch screens, use the solo flight pad below the arena; landscape gives you more room.</p></dialog>`;

const get=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const canvas=get<HTMLCanvasElement>('space');
const renderer=new Renderer(canvas),sound=new Sound(),clock=new FixedClock();
const storage={getItem:(key:string)=>localStorage.getItem(key),setItem:(key:string,value:string)=>localStorage.setItem(key,value)};
let save=loadSave(storage);
try { if(storage.getItem('vesper-breakers-v1')===null) save.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { save.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches; }
let game:Simulation|Tournament=new Simulation(1,3107),tournament:Tournament|undefined,mode:1|2=1,screen:'hangar'|'flight'|'paused'|'result'='hangar';
let lastFrame=0,lastHud='',lastCountdown='',lastAnnouncement='';
const keys=new Set<string>(),pendingKeys=new Set<string>(),touches=new Map<number,string>();
const help=get<HTMLDialogElement>('help');
function clearInput() {keys.clear();pendingKeys.clear();touches.clear();document.querySelectorAll('[data-action]').forEach(b=>b.classList.remove('pressed'));}
function persist() { writeSave(storage,save); }
function refreshPreferences() {
 sound.muted=save.muted;
 get('mute').textContent=save.muted?'Sound off':'Sound on';get('mute').setAttribute('aria-pressed',String(save.muted));
 get('motion').textContent=save.reduced?'Motion reduced':'Motion full';get('motion').setAttribute('aria-pressed',String(save.reduced));
 document.documentElement.classList.toggle('reduced',save.reduced);
 get('solo-best').textContent=String(save.solo).padStart(6,'0');get('coop-best').textContent=String(save.coop).padStart(6,'0');
}
function record() { if(tournament)return; const score=game.snapshot().score; if(mode===1) save.solo=Math.max(save.solo,score); else save.coop=Math.max(save.coop,score); persist();refreshPreferences(); }
function announce(text:string) { if(lastAnnouncement!==text) {get('status').textContent=text;lastAnnouncement=text;} }
function launch(players:1|2,competitive=false) {
 sound.unlock();clearInput();clock.reset();mode=players;const seed=crypto.getRandomValues(new Uint32Array(1))[0];tournament=competitive?new Tournament(seed):undefined;game=tournament??new Simulation(players,seed);screen='flight';lastHud='';
 get('launch').hidden=true;get('hud').hidden=false;get('end-panel').hidden=true;
 document.body.dataset.mode=String(mode);document.body.dataset.screen=screen;
 get('quick-controls').innerHTML=players===1?'<span><kbd>W A D / arrows</kbd> fly <kbd>S / ↓</kbd> brake</span><span><kbd>Space</kbd> fire</span><span><kbd>Shift</kbd> shield</span><span><kbd>Q</kbd> blink <kbd>E</kbd> pulse</span>':'<span><b>MINT</b> <kbd>WASD</kbd> <kbd>F</kbd> fire · <kbd>Q E Shift</kbd> abilities</span><span><b>COPPER</b> <kbd>arrows</kbd> <kbd>/</kbd> fire · <kbd>, . Enter</kbd> abilities</span>';
 canvas.focus();announce(tournament?'Tournament launched. One hull each. First to three round wins.':'Expedition launched. Sector one.');
}
function pause() {
 if(screen!=='flight') return;
 screen='paused';clock.reset();clearInput();get('countdown').hidden=true;
 showPanel('FLIGHT ON HOLD','Take a breath.','Your hulls, energy and sector are waiting right here.','Resume flight');
 document.body.dataset.screen=screen;announce('Expedition paused.');
}
function showPanel(eyebrow:string,title:string,text:string,action:string) {
 get('end-eyebrow').textContent=eyebrow;get('end-title').textContent=title;get('end-text').textContent=text;get('continue').textContent=action+' ↗';get('end-panel').hidden=false;get('continue').focus();
}
function resume() { clearInput();clock.reset();screen='flight';get('end-panel').hidden=true;document.body.dataset.screen=screen;canvas.focus();announce('Flight resumed.'); }
function result(state:Snapshot) {
 screen='result';clearInput();record();get('countdown').hidden=true;document.body.dataset.screen=screen;
 if(tournament) {
  const card=tournament.scorecard(),name=(index:number)=>index===0?'Mint':'Copper';
  const winner=card.matchWinner,round=card.roundWinner;
  showPanel(winner>=0?'TOURNAMENT COMPLETE':`ROUND ${card.round} COMPLETE`,winner>=0?`${name(winner)} wins the match!`:round>=0?`${name(round)} survives!`:'A draw. Both signals lost.',`Mint ${card.scores[0]} : ${card.scores[1]} Copper. ${winner>=0?'First to three round wins.':round<0?'No point awarded. Next round starts with fresh ships and energy.':'Next round starts with fresh ships and energy.'}`,winner>=0?'New tournament':'Next round');
  announce(get('end-title').textContent+' '+get('end-text').textContent);return;
 }
 const won=state.status==='won';
 showPanel(won?'CORRIDOR OPEN / 05 OF 05':'FLIGHT RECORDER / SIGNAL LOST',won?'The sky is yours.':'Every flight leaves a mark.',`${state.score.toLocaleString()} points · ${state.kills} threats broken · Sector ${state.sector} of 5. ${won?'Vesper is clear. Ready for another expedition?':'Your next flight starts with three fresh hulls.'}`,'Launch again');
 announce(won?'Expedition complete. All five sectors cleared.':'Expedition ended. Launch again to restart.');
}
function hangar() {
 record();screen='hangar';clearInput();clock.reset();get('launch').hidden=false;get('hud').hidden=true;get('end-panel').hidden=true;get('countdown').hidden=true;
 game=new Simulation(1,3107);tournament=undefined;document.body.dataset.screen=screen;get('solo').focus();announce('Returned to hangar.');
}
get('solo').onclick=()=>launch(1);get('coop').onclick=()=>launch(2);get('tournament').onclick=()=>launch(2,true);
get('pause').onclick=pause;get('continue').onclick=()=>{if(screen==='paused'){resume();return;}if(tournament?.nextRound()){lastHud='';resume();return;}launch(mode,!!tournament);};get('return').onclick=hangar;
get('mute').onclick=()=>{save.muted=!save.muted;sound.unlock();persist();refreshPreferences();};
get('motion').onclick=()=>{save.reduced=!save.reduced;persist();refreshPreferences();};
get('manual').onclick=()=>{if(screen==='flight')pause();clearInput();help.showModal();};
get('close-help').onclick=()=>help.close();help.addEventListener('close',clearInput);
const flightKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyF','KeyQ','KeyE','ShiftLeft','ShiftRight','Slash','Comma','Period','Enter']);
window.addEventListener('keydown',event=>{
 if(help.open) return;
 if(event.code==='Escape'||event.code==='KeyP') { if(screen==='flight'||screen==='paused') {event.preventDefault(); if(!event.repeat)screen==='flight'?pause():resume();} return; }
 if(event.target instanceof Element && event.target.closest('button,a,input,select,textarea')) return;
 if(screen==='flight'&&flightKeys.has(event.code)) {event.preventDefault();keys.add(event.code);pendingKeys.add(event.code);}
});
window.addEventListener('keyup',event=>keys.delete(event.code));
document.addEventListener('focusin',event=>{if(event.target instanceof Element&&event.target.closest('button,a,input,select,textarea'))clearInput();});
window.addEventListener('blur',()=>{clearInput();pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();pause();}});
for(const button of document.querySelectorAll<HTMLButtonElement>('[data-action]')) {
 button.addEventListener('pointerdown',event=>{if(screen!=='flight'||mode!==1)return;event.preventDefault();button.setPointerCapture(event.pointerId);touches.set(event.pointerId,button.dataset.action!);button.classList.add('pressed');sound.unlock();});
 const release=(event:PointerEvent)=>{touches.delete(event.pointerId);button.classList.remove('pressed');};
 button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
}
function input(index:number):Input {
 const down=(...codes:string[])=>codes.some(k=>keys.has(k)||pendingKeys.has(k));
 if(index===1) return {...IDLE,turn:Number(down('ArrowRight'))-Number(down('ArrowLeft')),thrust:down('ArrowUp'),brake:down('ArrowDown'),fire:down('Slash'),shield:down('Enter'),blink:down('Comma'),pulse:down('Period')};
 const touch=(action:string)=>mode===1&&[...touches.values()].includes(action);
 return {...IDLE,turn:Number(down('KeyD',...(mode===1?['ArrowRight']:[]))||touch('right'))-Number(down('KeyA',...(mode===1?['ArrowLeft']:[]))||touch('left')),thrust:down('KeyW',...(mode===1?['ArrowUp']:[]))||touch('thrust'),brake:down('KeyS',...(mode===1?['ArrowDown']:[]))||touch('brake'),fire:down('KeyF',...(mode===1?['Space']:[]))||touch('fire'),shield:down('ShiftLeft','ShiftRight')||touch('shield'),blink:down('KeyQ')||touch('blink'),pulse:down('KeyE')||touch('pulse')};
}
function updateHud(state:Snapshot) {
 const card=tournament?.scorecard();
 const signature=[card?.round,card?.scores.join('-'),state.score,state.sector,state.threats.length,...state.pilots.flatMap(p=>[p.hulls,Math.floor(p.energy),Math.ceil(p.pulseCooldown),Math.ceil(p.blinkCooldown),Math.ceil(p.shieldCooldown)])].join(':');
 if(signature!==lastHud) {
  get('score').textContent=card?`${card.scores[0]} : ${card.scores[1]}`:String(state.score).padStart(6,'0');get('sector').textContent=card?`TOURNAMENT ROUND ${card.round} / FIRST TO 3`:`SECTOR ${String(state.sector).padStart(2,'0')} / 05`;get('threats').textContent=`THREATS ${String(state.threats.length).padStart(2,'0')}`;
  get('pilots').innerHTML=state.pilots.map((p,i)=>`<div class="pilot-readout ${i?'copper':''}"><span>${i?'COPPER':'MINT'} <b aria-label="${p.hulls} hulls">${'◆'.repeat(p.hulls)}${'◇'.repeat((card?1:3)-p.hulls)}</b></span><div class="energy"><i style="width:${p.energy}%"></i></div><span class="ability-status">${p.hulls===0?'SIGNAL LOST':`ENERGY ${Math.floor(p.energy)} · SHIELD ${p.shieldCooldown?Math.ceil(p.shieldCooldown)+'s':p.energy>=25?'READY':'LOW'}<br>BLINK ${p.blinkCooldown?Math.ceil(p.blinkCooldown)+'s':p.energy>=35?'READY':'LOW'} · PULSE ${p.pulseCooldown?Math.ceil(p.pulseCooldown)+'s':p.energy>=60?'READY':'LOW'}`}</span></div>`).join('');lastHud=signature;
 }
 const countdown=card&&state.countdown>0?`<span>ROUND ${card.round} · ${card.scores[0]} : ${card.scores[1]}</span><strong>${Math.ceil(state.countdown)}</strong><p>ONE HULL · LAST SURVIVOR</p>`:state.countdown>0?`<span>SECTOR ${String(state.sector).padStart(2,'0')}</span><strong>${Math.ceil(state.countdown)}</strong><p>${state.sector>=3?'SPREAD FIRE ONLINE':'CLEAR EVERY FRAGMENT'}</p>`:'';
 if(lastCountdown!==countdown) {get('countdown').innerHTML=countdown;lastCountdown=countdown;}
 get('countdown').hidden=screen!=='flight'||!countdown;
 if(screen==='flight'&&state.countdown>0)announce(card?`Tournament round ${card.round}. Last survivor wins.`:`Sector ${state.sector}. ${state.sector>=3?'Spread fire online.':''}`);
}
function frame(timestamp:number) {
 const elapsed=lastFrame?(timestamp-lastFrame)/1000:0;lastFrame=timestamp;
 if(screen==='flight') clock.advance(elapsed,()=>{ for(const event of game.step([input(0),input(1)]))sound.play(event);pendingKeys.clear(); });
 const state=game.snapshot();
 if(screen==='flight'&&state.status!=='playing')result(state);
 if(screen!=='hangar')updateHud(state);
 renderer.draw(state,save.reduced?0:timestamp/1000,save.reduced,screen==='hangar');
 requestAnimationFrame(frame);
}
new ResizeObserver(()=>renderer.resize()).observe(canvas);refreshPreferences();renderer.resize();document.body.dataset.screen=screen;requestAnimationFrame(frame);
