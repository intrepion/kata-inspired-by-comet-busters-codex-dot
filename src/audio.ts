import type {GameEvent} from './simulation';
export class Sound {
 private context:AudioContext|null=null;
 muted=false;
 unlock() {
  try { this.context??=new AudioContext(); void this.context.resume(); } catch { /* Silent fallback on unsupported platforms. */ }
 }
 play(event:GameEvent) {
  if(this.muted||!this.context||this.context.state!=='running') return;
  const ctx=this.context,now=ctx.currentTime;
  const oscillator=ctx.createOscillator(),gain=ctx.createGain();
  const tones={shot:[700,180,.055],burst:[130,35,.19],pulse:[190,850,.36],blink:[350,1400,.2],shield:[600,1000,.15],hit:[90,22,.38],sector:[500,1000,.5],won:[700,1400,.6],lost:[250,40,.7]} as const;
  const [start,end,duration]=tones[event.kind];
  oscillator.type=event.kind==='shot'?'triangle':event.kind==='burst'||event.kind==='hit'?'sawtooth':'sine';
  oscillator.frequency.setValueAtTime(start,now); oscillator.frequency.exponentialRampToValueAtTime(end,now+duration);
  gain.gain.setValueAtTime(event.kind==='shot'?.025:.06,now); gain.gain.exponentialRampToValueAtTime(.001,now+duration);
  oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(now); oscillator.stop(now+duration);
 }
}
