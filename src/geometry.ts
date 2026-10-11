export const WIDTH = 1100;
export const HEIGHT = 680;
export const STEP = 1 / 120;
export interface Vec { x: number; y: number }
export const wrap = (value: number, extent: number) => ((value % extent) + extent) % extent;
export const delta = (a: number, b: number, extent: number) => wrap(b - a + extent / 2, extent) - extent / 2;
export const distance = (a: Vec, b: Vec) => Math.hypot(delta(a.x,b.x,WIDTH), delta(a.y,b.y,HEIGHT));
/** Relative swept circles, including neighboring images of the torus. Displacement is unwrapped. */
export function sweptHit(start: Vec, movement: Vec, target: Vec, targetMovement: Vec, radius: number): boolean {
  const vx = movement.x - targetMovement.x, vy = movement.y - targetMovement.y;
  const len = vx * vx + vy * vy;
  for (const ox of [-WIDTH, 0, WIDTH]) for (const oy of [-HEIGHT, 0, HEIGHT]) {
    const dx = target.x + ox - start.x, dy = target.y + oy - start.y;
    const t = len ? Math.max(0, Math.min(1, (dx * vx + dy * vy) / len)) : 0;
    if ((dx-vx*t)**2 + (dy-vy*t)**2 <= radius**2) return true;
  }
  return false;
}
export class FixedClock {
  private remainder = 0;
  advance(seconds: number, tick: () => void): number {
    this.remainder += Math.max(0, Math.min(.25, seconds));
    let count = 0;
    while (this.remainder + 1e-10 >= STEP) { tick(); this.remainder -= STEP; count++; }
    return count;
  }
  reset() { this.remainder = 0; }
}
