import {describe, expect, it} from 'vitest';
import {wrap, sweptHit, FixedClock} from '../src/geometry';
describe('toroidal flight', () => {
  it('wraps negative positions and detects a shot crossing the right seam', () => {
    expect(wrap(-3, 1100)).toBe(1097);
    expect(sweptHit({x:1090,y:100},{x:30,y:0},{x:5,y:100},{x:0,y:0},8)).toBe(true);
    expect(sweptHit({x:1090,y:100},{x:30,y:0},{x:5,y:120},{x:0,y:0},8)).toBe(false);
  });
});
it('detects moving targets and diagonal corner wrapping without tunneling',()=>{
 expect(sweptHit({x:1095,y:675},{x:20,y:20},{x:5,y:5},{x:0,y:0},3)).toBe(true);
 expect(sweptHit({x:0,y:50},{x:100,y:0},{x:50,y:0},{x:0,y:100},2)).toBe(true);
});
it('accepts the same flight time at 30, 60 and 144 Hz',()=>{
 const counts=[30,60,144].map(hz=>{const clock=new FixedClock();let ticks=0;for(let f=0;f<hz*5;f++)clock.advance(1/hz,()=>ticks++);return ticks;});
 expect(counts).toEqual([600,600,600]);
});
it('caps stalled frames and resets unconsumed time',()=>{
 const clock=new FixedClock();let ticks=0;clock.advance(10,()=>ticks++);expect(ticks).toBe(30);
 clock.advance(.004,()=>ticks++);clock.reset();clock.advance(.005,()=>ticks++);expect(ticks).toBe(30);
});
