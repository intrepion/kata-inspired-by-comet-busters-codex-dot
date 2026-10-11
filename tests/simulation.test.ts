import {expect, it} from 'vitest';
import {Simulation, IDLE} from '../src/simulation';
it('starts protected with three hulls and responds to thrust after launch countdown', () => {
  const game = new Simulation(1, 42);
  for(let i=0;i<250;i++) game.step([IDLE]);
  const before=game.snapshot().pilots[0];
  game.step([{...IDLE,thrust:true,fire:true}]);
  const after=game.snapshot();
  expect(after.pilots[0].hulls).toBe(3);
  expect(after.pilots[0].vy).toBeLessThan(before.vy);
  expect(after.bolts.length).toBe(1);
});
import type {Threat,Bolt} from '../src/simulation';
import {FixedClock} from '../src/geometry';
const comet=(values:Partial<Threat>={}):Threat=>({id:100,kind:'comet',size:1,x:100,y:100,vx:0,vy:0,radius:13,angle:0,spin:0,shotCooldown:0,...values});
const shot=(values:Partial<Bolt>={}):Bolt=>({id:200,x:80,y:100,vx:2400,vy:0,radius:3,owner:1,ttl:1,...values});
const advance=(game:Simulation,seconds:number,inputs=[IDLE])=>{for(let i=0;i<Math.round(seconds*120);i++)game.step(inputs);};
it('scores a split once even if two shots hit its former location',()=>{
 const game=new Simulation(1,3,{countdown:0,threats:[comet({size:3,radius:44})],bolts:[shot(),shot({id:201})]});
 game.step([IDLE]);const state=game.snapshot();
 expect(state.score).toBe(80);expect(state.kills).toBe(1);expect(state.threats).toHaveLength(2);expect(state.threats.every(t=>t.size===2)).toBe(true);
});
it('wraps ships, comets and bolts through the same seam',()=>{
 const game=new Simulation(1,3,{countdown:0,pilots:[{x:1099,y:300,vx:300}],threats:[comet({x:1099,vx:300})],bolts:[shot({x:1099,y:500,vx:300})]});
 game.step([IDLE]);const state=game.snapshot();
 expect(state.pilots[0].x).toBeLessThan(2);expect(state.threats[0].x).toBeCloseTo(1.5);expect(state.bolts[0].x).toBeCloseTo(1.5);
});
it('protects spawns then consumes exactly one hull, respawning safely',()=>{
 const game=new Simulation(1,1,{countdown:0,pilots:[{x:100,y:100,grace:.02}],threats:[comet()]});
 game.step([IDLE]);expect(game.snapshot().pilots[0].hulls).toBe(3);
 advance(game,.1);const state=game.snapshot();expect(state.pilots[0].hulls).toBe(2);expect(state.pilots[0].grace).toBeGreaterThan(2.6);
 expect(Math.hypot(state.pilots[0].x-100,state.pilots[0].y-100)).toBeGreaterThan(150);
});
it('expires bolts without scoring and does not allow friendly fire',()=>{
 const game=new Simulation(2,1,{countdown:0,pilots:[{x:500,y:400,grace:0},{x:100,y:100,grace:0}],threats:[comet({x:500,y:100})],bolts:[shot({ttl:.001}),shot({id:201})]});
 game.step([IDLE,IDLE]);expect(game.snapshot().pilots[1].hulls).toBe(3);expect(game.snapshot().score).toBe(0);expect(game.snapshot().bolts).toHaveLength(1);
});
it('spends pulse energy once during cooldown and clears hostile bolts in range',()=>{
 const game=new Simulation(1,1,{countdown:0,pilots:[{x:100,y:100}],threats:[comet({x:200,size:3,radius:44})],bolts:[shot({owner:-1})]});
 game.step([{...IDLE,pulse:true}]);const state=game.snapshot();
 expect(state.pilots[0].energy).toBe(40);expect(state.bolts).toHaveLength(0);expect(state.kills).toBe(1);
 game.step([{...IDLE,pulse:true}]);expect(game.snapshot().kills).toBe(1);expect(game.snapshot().pilots[0].energy).toBeLessThan(41);
});
it('rejects abilities without energy and gives shield protection for the paid duration',()=>{
 const low=new Simulation(1,1,{countdown:0,pilots:[{energy:0,grace:0}],threats:[comet()]});
 low.step([{...IDLE,pulse:true,blink:true,shield:true}]);expect(low.snapshot().pilots[0].grace).toBe(0);
 const game=new Simulation(1,1,{countdown:0,pilots:[{x:100,y:100,grace:0}],threats:[comet()]});
 game.step([{...IDLE,shield:true}]);expect(game.snapshot().pilots[0].hulls).toBe(3);expect(game.snapshot().pilots[0].energy).toBe(75);
 advance(game,1.6);expect(game.snapshot().pilots[0].hulls).toBe(2);
});
it('blinks away from danger with a cost, cooldown and grace',()=>{
 const game=new Simulation(1,3,{countdown:0,pilots:[{x:100,y:100,grace:0}],threats:[comet()]});
 game.step([{...IDLE,blink:true}]);const p=game.snapshot().pilots[0];
 expect(p.hulls).toBe(3);expect(p.energy).toBe(65);expect(p.blinkCooldown).toBe(3);expect(p.grace).toBe(1.2);expect(Math.hypot(p.x-100,p.y-100)).toBeGreaterThan(170);
});
it('advances sectors with a bonus and countdown then wins the fifth',()=>{
 const game=new Simulation(1,1,{countdown:0,threats:[comet()],bolts:[shot()]});game.step([IDLE]);
 expect(game.snapshot().sector).toBe(2);expect(game.snapshot().score).toBe(680);expect(game.snapshot().countdown).toBe(2.5);
 const final=new Simulation(1,1,{sector:5,countdown:0,threats:[comet()],bolts:[shot()]});final.step([IDLE]);expect(final.snapshot().status).toBe('won');expect(final.snapshot().score).toBe(2680);
 final.step([{...IDLE,fire:true}]);expect(final.snapshot().score).toBe(2680);
});
it('handles simultaneous final-hull losses and a fresh restart',()=>{
 const game=new Simulation(2,1,{countdown:0,pilots:[{x:100,y:100,hulls:1,grace:0},{x:400,y:400,hulls:1,grace:0}],threats:[comet(),comet({id:101,x:400,y:400})]});
 game.step([IDLE,IDLE]);expect(game.snapshot().status).toBe('lost');expect(game.snapshot().pilots.map(p=>p.hulls)).toEqual([0,0]);
 advance(game,1);expect(game.snapshot().pilots.map(p=>p.hulls)).toEqual([0,0]);
 const fresh=new Simulation(2,1);expect(fresh.snapshot().score).toBe(0);expect(fresh.snapshot().pilots.map(p=>p.hulls)).toEqual([3,3]);
});
it('keeps co-op alive after one pilot is lost and respects independent simultaneous inputs',()=>{
 const game=new Simulation(2,1,{countdown:0,pilots:[{hulls:0},{grace:0}],threats:[comet()]});
 game.step([{...IDLE,fire:true},{...IDLE,fire:true,turn:1,thrust:true}]);const state=game.snapshot();
 expect(state.status).toBe('playing');expect(state.bolts).toHaveLength(1);expect(state.bolts[0].owner).toBe(state.pilots[1].id);expect(state.pilots[1].angle).toBeGreaterThan(-Math.PI/2);
});
it('keeps seeded outcomes equal across rendering frequencies and storage-safe snapshots',()=>{
 const outcomes=[30,60,144].map(hz=>{const game=new Simulation(2,87);const clock=new FixedClock();for(let i=0;i<hz*12;i++)clock.advance(1/hz,()=>game.step([{...IDLE,turn:1,fire:true,thrust:true},{...IDLE,turn:-1,fire:true}]));return game.snapshot();});
 expect(outcomes[0]).toEqual(outcomes[1]);expect(outcomes[1]).toEqual(outcomes[2]);
 const game=new Simulation();const snapshot=game.snapshot();snapshot.pilots[0].hulls=0;expect(game.snapshot().pilots[0].hulls).toBe(3);
});
it('fires spread bolts starting in sector three',()=>{
 const game=new Simulation(1,4,{sector:3,countdown:0});game.step([{...IDLE,fire:true}]);expect(game.snapshot().bolts.filter(b=>b.owner>=0)).toHaveLength(3);
});
it('blink retains longer protection from spawn and shield',()=>{
 const spawned=new Simulation(1,3,{countdown:0});spawned.step([{...IDLE,blink:true}]);expect(spawned.snapshot().pilots[0].grace).toBeGreaterThan(2.7);
 const shielded=new Simulation(1,3,{countdown:0,pilots:[{grace:0}]});shielded.step([{...IDLE,shield:true}]);shielded.step([{...IDLE,blink:true}]);expect(shielded.snapshot().pilots[0].grace).toBeGreaterThan(1.4);
});
