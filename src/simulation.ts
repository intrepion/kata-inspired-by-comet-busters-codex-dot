import {WIDTH, HEIGHT, STEP, wrap, distance, delta, sweptHit, type Vec} from './geometry';
export interface Input { turn: number; thrust: boolean; brake: boolean; fire: boolean; pulse: boolean; blink: boolean; shield: boolean }
export const IDLE: Input = {turn:0,thrust:false,brake:false,fire:false,pulse:false,blink:false,shield:false};
interface Body extends Vec { id:number; vx:number; vy:number; radius:number }
export interface Pilot extends Body { angle:number; hulls:number; energy:number; grace:number; shotCooldown:number; pulseCooldown:number; blinkCooldown:number; shieldCooldown:number; thrusting:boolean }
export interface Threat extends Body { kind:'comet'|'raider'; size:number; angle:number; spin:number; shotCooldown:number }
export interface Bolt extends Body { owner:number; ttl:number }
export interface Effect extends Vec { kind:'burst'|'pulse'|'blink'|'hit'; age:number; color:string; radius:number }
export interface GameEvent { kind:'shot'|'burst'|'pulse'|'blink'|'shield'|'hit'|'sector'|'won'|'lost'; x:number; y:number }
export interface Snapshot { pilots:Pilot[]; threats:Threat[]; bolts:Bolt[]; effects:Effect[]; sector:number; score:number; countdown:number; status:'playing'|'won'|'lost'; elapsed:number; kills:number }
/** Optional initial scenarios are a headless fixture seam, never exposed to the browser UI. */
export interface Scenario { threats?:Threat[]; pilots?:Partial<Pilot>[]; countdown?:number; sector?:number; bolts?:Bolt[] }
export class Simulation {
  private state:Snapshot;
  private randomState:number;
  private nextId=1;
  private events:GameEvent[]=[];
  private children:Threat[]=[];
  constructor(players:1|2=1,seed=1,scenario?:Scenario) {
    this.randomState=seed>>>0;
    this.state={pilots:[],threats:[],bolts:[],effects:[],sector:scenario?.sector??1,score:0,countdown:scenario?.countdown??2,status:'playing',elapsed:0,kills:0};
    for(let i=0;i<players;i++) this.state.pilots.push({id:this.nextId++,x:WIDTH/2+(players===2?(i===0?-70:70):0),y:HEIGHT/2,vx:0,vy:0,radius:11,angle:-Math.PI/2,hulls:3,energy:100,grace:2.8,shotCooldown:0,pulseCooldown:0,blinkCooldown:0,shieldCooldown:0,thrusting:false,...scenario?.pilots?.[i]});
    this.spawnSector();
    scenario?.pilots?.forEach((pilot,i)=>Object.assign(this.state.pilots[i],pilot));
    if(scenario?.threats) this.state.threats=structuredClone(scenario.threats);
    if(scenario?.bolts) this.state.bolts=structuredClone(scenario.bolts);
    const ids=[...this.state.pilots,...this.state.threats,...this.state.bolts].map(b=>b.id);
    this.nextId=Math.max(this.nextId,...ids.map(id=>id+1));
  }
  snapshot():Snapshot { return structuredClone(this.state); }
  private random() { this.randomState=(Math.imul(this.randomState,1664525)+1013904223)>>>0; return this.randomState/4294967296; }
  private event(kind:GameEvent['kind'],body:Vec) { this.events.push({kind,x:body.x,y:body.y}); }
  private effect(kind:Effect['kind'],body:Vec,radius:number,color='#72f0dc') { this.state.effects.push({kind,x:body.x,y:body.y,age:0,radius,color}); }
  private comet(x:number,y:number,size:number):Threat {
    const angle=this.random()*Math.PI*2,speed=(36+this.random()*35+this.state.sector*5)*(1+(3-size)*.25);
    return {id:this.nextId++,kind:'comet',size,x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:[0,13,25,44][size],angle,spin:(this.random()-.5)*1.2,shotCooldown:0};
  }
  private spawnSector() {
    this.state.bolts=[];
    this.state.threats=[];
    for(let i=0;i<2+this.state.sector;i++) {
      const position=this.safePosition(200);
      this.state.threats.push(this.comet(position.x,position.y,3));
    }
    const count=this.state.sector<2?0:this.state.sector<4?1:this.state.sector===4?2:3;
    for(let i=0;i<count;i++) {
      const position=this.safePosition(220);
      this.state.threats.push({id:this.nextId++,kind:'raider',size:1,...position,vx:(i%2?1:-1)*(58+this.state.sector*7),vy:35,radius:21,angle:0,spin:.8,shotCooldown:1.5+i});
    }
    for(const pilot of this.state.pilots) { pilot.grace=2.8; pilot.energy=Math.min(100,pilot.energy+25); }
  }
  private safePosition(clearance:number,forPilot=false):Vec {
    let best={x:WIDTH/2,y:HEIGHT/2},bestMargin=-Infinity;
    for(let i=0;i<80;i++) {
      const point={x:this.random()*WIDTH,y:this.random()*HEIGHT};
      const obstacles=forPilot?[...this.state.threats,...this.state.bolts.filter(b=>b.owner<0)]:this.state.pilots.filter(p=>p.hulls>0);
      const margin=obstacles.reduce((min,b)=>Math.min(min,distance(point,b)-b.radius),Infinity);
      if(margin>bestMargin) { best=point; bestMargin=margin; }
      if(margin>=clearance) break;
    }
    return best;
  }
  private destroy(threat:Threat) {
    const index=this.state.threats.findIndex(t=>t.id===threat.id);
    if(index<0) return;
    this.state.threats.splice(index,1);
    this.state.kills++;
    this.state.score+=threat.kind==='raider'?350:threat.size===3?80:threat.size===2?120:180;
    this.event('burst',threat); this.effect('burst',threat,threat.radius,'#efae79');
    if(threat.kind==='comet'&&threat.size>1) for(let i=0;i<2;i++) {
      const child=this.comet(threat.x,threat.y,threat.size-1);
      child.vx+=threat.vx*.3; child.vy+=threat.vy*.3;
      this.children.push(child);
    }
  }
  private damage(pilot:Pilot) {
    if(pilot.grace>0||pilot.hulls<=0) return;
    pilot.hulls--; this.event('hit',pilot); this.effect('hit',pilot,45,'#ff776e');
    if(pilot.hulls>0) { Object.assign(pilot,this.safePosition(170,true),{vx:0,vy:0,grace:2.8}); pilot.energy=Math.max(55,pilot.energy); }
  }
  private move(body:Body) { body.x=wrap(body.x+body.vx*STEP,WIDTH); body.y=wrap(body.y+body.vy*STEP,HEIGHT); }
  private bolt(body:Body,angle:number,owner:number,speed:number,ttl:number) {
    if(this.state.bolts.length>=250) return;
    this.state.bolts.push({id:this.nextId++,x:wrap(body.x+Math.cos(angle)*(body.radius+4),WIDTH),y:wrap(body.y+Math.sin(angle)*(body.radius+4),HEIGHT),vx:Math.cos(angle)*speed+body.vx*.4,vy:Math.sin(angle)*speed+body.vy*.4,owner,ttl,radius:owner<0?5:3});
  }
  step(inputs:readonly Input[]):GameEvent[] {
    this.events=[];
    if(this.state.status!=='playing') return [];
    for(const effect of this.state.effects) effect.age+=STEP;
    this.state.effects=this.state.effects.filter(e=>e.age<.8).slice(-100);
    if(this.state.countdown>0) { this.state.countdown=Math.max(0,this.state.countdown-STEP); return []; }
    this.state.elapsed+=STEP;
    this.children=[];
    const oldThreats=new Map(this.state.threats.map(t=>[t.id,{x:t.x,y:t.y}]));
    const oldPilots=new Map(this.state.pilots.map(p=>[p.id,{x:p.x,y:p.y}]));
    for(let i=0;i<this.state.pilots.length;i++) {
      const p=this.state.pilots[i],input=inputs[i]??IDLE;
      if(p.hulls<=0) continue;
      p.grace=Math.max(0,p.grace-STEP);
      p.energy=Math.min(100,p.energy+8*STEP);
      for(const key of ['shotCooldown','pulseCooldown','blinkCooldown','shieldCooldown'] as const) p[key]=Math.max(0,p[key]-STEP);
      p.angle+=Math.max(-1,Math.min(1,input.turn))*3.9*STEP;
      p.thrusting=input.thrust;
      if(input.thrust) { p.vx+=Math.cos(p.angle)*255*STEP; p.vy+=Math.sin(p.angle)*255*STEP; }
      const drag=Math.exp(-(input.brake?4.5:.2)*STEP);
      p.vx*=drag; p.vy*=drag;
      const speed=Math.hypot(p.vx,p.vy);
      if(speed>310) { p.vx*=310/speed; p.vy*=310/speed; }
      this.move(p);
      if(input.fire&&p.shotCooldown===0) {
        this.bolt(p,p.angle,p.id,650,1.3);
        if(this.state.sector>=3) for(const offset of [-.13,.13]) this.bolt(p,p.angle+offset,p.id,650,1.1);
        p.shotCooldown=.16; this.event('shot',p);
      }
      if(input.shield&&p.shieldCooldown===0&&p.energy>=25) { p.energy-=25; p.grace=Math.max(p.grace,1.5); p.shieldCooldown=4; this.event('shield',p); this.effect('blink',p,35); }
      if(input.blink&&p.blinkCooldown===0&&p.energy>=35) {
        p.energy-=35; p.blinkCooldown=3;
        this.effect('blink',p,50); Object.assign(p,this.safePosition(160,true),{vx:0,vy:0,grace:1.2});
        oldPilots.set(p.id,{x:p.x,y:p.y});
        this.effect('blink',p,50); this.event('blink',p);
      }
      if(input.pulse&&p.pulseCooldown===0&&p.energy>=60) {
        p.energy-=60; p.pulseCooldown=6;
        this.event('pulse',p); this.effect('pulse',p,235);
        for(const threat of [...this.state.threats]) if(distance(p,threat)<=235+threat.radius) this.destroy(threat);
        this.state.bolts=this.state.bolts.filter(b=>b.owner>=0||distance(p,b)>235);
      }
    }
    for(const t of this.state.threats) {
      t.angle+=t.spin*STEP;
      if(t.kind==='raider') {
        t.shotCooldown-=STEP;
        if(t.shotCooldown<=0) {
          const target=this.state.pilots.filter(p=>p.hulls>0).sort((a,b)=>distance(a,t)-distance(b,t))[0];
          if(target) this.bolt(t,Math.atan2(delta(t.y,target.y,HEIGHT),delta(t.x,target.x,WIDTH)),-1,200+this.state.sector*10,3.1);
          t.shotCooldown=Math.max(.9,2.4-this.state.sector*.2);
        }
      }
      this.move(t);
    }
    const surviving:Bolt[]=[];
    for(const b of this.state.bolts) {
      b.ttl-=STEP;
      if(b.ttl<=0) continue;
      const start={x:b.x,y:b.y},movement={x:b.vx*STEP,y:b.vy*STEP};
      this.move(b);
      let hit=false;
      if(b.owner>=0) {
        for(const t of [...this.state.threats]) {
          const old=oldThreats.get(t.id)??t;
          if(sweptHit(start,movement,old,{x:t.vx*STEP,y:t.vy*STEP},b.radius+t.radius)) { this.destroy(t); hit=true; break; }
        }
      } else for(const p of this.state.pilots) {
        if(p.hulls<=0||p.grace>0) continue;
        const old=oldPilots.get(p.id)??p;
        if(sweptHit(start,movement,old,{x:p.vx*STEP,y:p.vy*STEP},p.radius+b.radius)) { this.damage(p); hit=true; break; }
      }
      if(!hit) surviving.push(b);
    }
    this.state.bolts=surviving;
    for(const p of this.state.pilots) if(p.hulls>0&&p.grace===0) {
      const old=oldPilots.get(p.id)??p;
      for(const t of this.state.threats) if(sweptHit(old,{x:p.vx*STEP,y:p.vy*STEP},oldThreats.get(t.id)??t,{x:t.vx*STEP,y:t.vy*STEP},p.radius+t.radius)) { this.damage(p); break; }
    }
    this.state.threats.push(...this.children);
    if(this.state.pilots.every(p=>p.hulls<=0)) { this.state.status='lost'; this.event('lost',{x:WIDTH/2,y:HEIGHT/2}); }
    else if(this.state.threats.length===0) {
      this.state.score+=500*this.state.sector;
      if(this.state.sector===5) { this.state.status='won'; this.event('won',{x:WIDTH/2,y:HEIGHT/2}); }
      else { this.state.sector++; this.state.countdown=2.5; this.spawnSector(); this.event('sector',{x:WIDTH/2,y:HEIGHT/2}); }
    }
    return this.events;
  }
}
