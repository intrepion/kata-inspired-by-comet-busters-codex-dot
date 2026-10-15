import {expect,it} from 'vitest';
import {Simulation,IDLE,type Scenario,type Bolt,type Threat} from '../src/simulation';
import {Tournament} from '../src/tournament';
const bolt=(values:Partial<Bolt>={}):Bolt=>({id:200,x:80,y:100,vx:2400,vy:0,radius:3,owner:1,ttl:1,...values});
const comet=(values:Partial<Threat>={}):Threat=>({id:100,kind:'comet',size:1,x:100,y:100,vx:0,vy:0,radius:13,angle:0,spin:0,shotCooldown:0,...values});
const duel:Scenario={countdown:0,threats:[],pilots:[{x:500,y:400,grace:0},{x:100,y:100,grace:0}],bolts:[bolt()]};
it('enables opposing pilot hits only in tournament; own bolts and grace remain safe',()=>{
 const battle=new Simulation(2,1,duel,'tournament');battle.step([IDLE,IDLE]);
 expect(battle.snapshot().pilots.map(p=>p.hulls)).toEqual([1,0]);expect(battle.snapshot().status).toBe('won');
 const own=new Simulation(2,1,{...duel,bolts:[bolt({owner:2})]},'tournament');own.step([IDLE,IDLE]);expect(own.snapshot().pilots.map(p=>p.hulls)).toEqual([1,1]);
 const protectedGame=new Simulation(2,1,{...duel,pilots:[{x:500,y:400,grace:0},{x:100,y:100,grace:1}]},'tournament');protectedGame.step([IDLE,IDLE]);expect(protectedGame.snapshot().status).toBe('playing');
 const coop=new Simulation(2,1,duel);coop.step([IDLE,IDLE]);expect(coop.snapshot().pilots.map(p=>p.hulls)).toEqual([3,3]);
});
it('settles a round once, resets ships but retains points, and ends at three wins',()=>{
 const match=new Tournament(1,duel);expect(match.nextRound()).toBe(false);
 for(let round=1;round<=3;round++) {
  match.step([IDLE,IDLE]);match.step([IDLE,IDLE]);
  expect(match.scorecard().scores).toEqual([round,0]);expect(match.scorecard().round).toBe(round);
  if(round<3){expect(match.nextRound()).toBe(true);expect(match.snapshot().pilots.map(p=>p.hulls)).toEqual([1,1]);}
 }
 expect(match.scorecard().matchWinner).toBe(0);expect(match.nextRound()).toBe(false);
});
it('draws simultaneous losses and does not win a round by clearing rocks',()=>{
 const match=new Tournament(1,{countdown:0,pilots:[{x:100,y:100,grace:0},{x:400,y:400,grace:0}],threats:[comet(),comet({id:101,x:400,y:400})]});
 match.step([IDLE,IDLE]);expect(match.scorecard()).toMatchObject({scores:[0,0],roundWinner:-1,settled:true,matchWinner:-1});expect(match.nextRound()).toBe(true);
 const empty=new Simulation(2,1,{countdown:0,threats:[]},'tournament');empty.step([IDLE,IDLE]);expect(empty.snapshot().status).toBe('playing');expect(empty.snapshot().sector).toBe(1);
});
it('starts facing the opponent and ordinary fire can win without fixture hit injection',()=>{
 const match=new Tournament(37,{threats:[]});
 for(let i=0;i<120*9;i++)match.step([{...IDLE,fire:true},IDLE]);
 expect(match.scorecard()).toMatchObject({scores:[1,0],roundWinner:0,settled:true});
});
