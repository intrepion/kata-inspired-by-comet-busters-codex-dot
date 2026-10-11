import {WIDTH,HEIGHT} from './geometry';
import type {Snapshot,Pilot,Threat} from './simulation';
const colors=['#80f5dc','#ffb179'];
/** Entirely procedural art; rendering never consumes gameplay randomness. */
export class Renderer {
 private ctx:CanvasRenderingContext2D;
 private stars=Array.from({length:180},(_,i)=>({x:((i*719+43)%1100),y:((i*313+67)%680),r:i%11===0?1.6:.7,alpha:.15+(i%7)*.07}));
 constructor(private canvas:HTMLCanvasElement) { this.ctx=canvas.getContext('2d')!; }
 resize() {
  const ratio=Math.min(window.devicePixelRatio||1,2);
  const bounds=this.canvas.getBoundingClientRect();
  this.canvas.width=Math.round(bounds.width*ratio); this.canvas.height=Math.round(bounds.height*ratio);
 }
 private ghost(x:number,y:number,radius:number,draw:()=>void) {
  const offsetsX=[0],offsetsY=[0];
  if(x<radius) offsetsX.push(WIDTH); if(x>WIDTH-radius) offsetsX.push(-WIDTH);
  if(y<radius) offsetsY.push(HEIGHT); if(y>HEIGHT-radius) offsetsY.push(-HEIGHT);
  for(const ox of offsetsX) for(const oy of offsetsY) { this.ctx.save(); this.ctx.translate(ox,oy); draw(); this.ctx.restore(); }
 }
 draw(state:Snapshot,time:number,reduced:boolean,attract=false) {
  const c=this.ctx;
  c.setTransform(this.canvas.width/WIDTH,0,0,this.canvas.height/HEIGHT,0,0);
  c.fillStyle='#071217'; c.fillRect(0,0,WIDTH,HEIGHT);
  const nebula=c.createRadialGradient(760,310,20,760,310,600);
  nebula.addColorStop(0,'#123b3933');nebula.addColorStop(.6,'#18322e18');nebula.addColorStop(1,'#07121700');
  c.fillStyle=nebula;c.fillRect(0,0,WIDTH,HEIGHT);
  c.strokeStyle='#8bc5b008';c.lineWidth=1;
  for(let x=0;x<WIDTH;x+=55) { c.beginPath();c.moveTo(x,0);c.lineTo(x,HEIGHT);c.stroke(); }
  for(let y=0;y<HEIGHT;y+=55) { c.beginPath();c.moveTo(0,y);c.lineTo(WIDTH,y);c.stroke(); }
  for(const s of this.stars) { c.globalAlpha=s.alpha*(reduced?1:.8+Math.sin(time*.6+s.x)*.2);c.fillStyle='#b3d6d6';c.beginPath();c.arc(s.x,s.y,s.r,0,Math.PI*2);c.fill(); }
  c.globalAlpha=1;
  // Celestial navigation arcs, subdued behind combat.
  c.strokeStyle='#93cbbc0c';c.lineWidth=1;
  for(const r of [200,310,430]) { c.beginPath();c.arc(830,240,r,0,Math.PI*2);c.stroke(); }
  for(const t of state.threats) this.ghost(t.x,t.y,t.radius+15,()=>this.threat(t,time,reduced));
  for(const b of state.bolts) this.ghost(b.x,b.y,14,()=>{
    c.strokeStyle=b.owner<0?'#ff756f':colors[state.pilots.findIndex(p=>p.id===b.owner)]??colors[0];
    c.shadowColor=c.strokeStyle;c.shadowBlur=reduced?0:9;c.lineWidth=b.owner<0?3:2.5;
    const angle=Math.atan2(b.vy,b.vx);c.beginPath();c.moveTo(b.x-Math.cos(angle)*11,b.y-Math.sin(angle)*11);c.lineTo(b.x,b.y);c.stroke();c.shadowBlur=0;
  });
  state.pilots.forEach((p,i)=>{if(p.hulls>0&&!attract)this.ghost(p.x,p.y,45,()=>this.pilot(p,i,time,reduced));});
  for(const e of state.effects) this.ghost(e.x,e.y,e.radius+30,()=>{
    const progress=e.age/.8;
    c.globalAlpha=1-progress;c.strokeStyle=e.color;c.fillStyle=e.color;c.lineWidth=e.kind==='pulse'?3:1.5;
    if(e.kind==='pulse'||e.kind==='blink') { c.beginPath();c.arc(e.x,e.y,e.radius*(.1+progress*.9),0,Math.PI*2);c.stroke(); }
    else if(!reduced) for(let i=0;i<12;i++) {
      const angle=i*Math.PI/6+e.x,spread=(20+e.radius*1.4)*progress;
      c.fillRect(e.x+Math.cos(angle)*spread,e.y+Math.sin(angle)*spread,2+2*(1-progress),2+2*(1-progress));
    }
    else { c.beginPath();c.arc(e.x,e.y,e.radius,0,Math.PI*2);c.stroke(); }
    c.globalAlpha=1;
  });
  if(attract) {
    const ship={...state.pilots[0],x:785,y:365,angle:-.5,grace:0,thrusting:true};
    c.save();c.translate(ship.x,ship.y);c.scale(3.7,3.7);c.translate(-ship.x,-ship.y);this.pilot(ship,0,time,reduced);c.restore();
    c.strokeStyle='#80f5dc33';c.lineWidth=1;c.beginPath();c.arc(785,365,120,-.6,3.5);c.stroke();
    c.fillStyle='#7a9999';c.font='11px monospace';c.fillText('VB–01 / CORRIDOR CLASS',665,530);
    c.strokeStyle='#42615c';c.beginPath();c.moveTo(790,415);c.lineTo(790,500);c.lineTo(675,500);c.stroke();
  }
 }
 private pilot(p:Pilot,index:number,time:number,reduced:boolean) {
  const c=this.ctx,color=colors[index];
  if(p.grace>0) {
    c.strokeStyle=color+'80';c.lineWidth=1.5;c.beginPath();c.arc(p.x,p.y,25,0,Math.PI*2);c.stroke();
    c.strokeStyle=color;c.beginPath();c.arc(p.x,p.y,27,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,p.grace/2.8));c.stroke();
  }
  c.save();c.translate(p.x,p.y);c.rotate(p.angle);
  if(p.thrusting) {
    const flame=reduced?16:14+Math.sin(time*44)*5;
    c.fillStyle='#ffb179';c.beginPath();c.moveTo(-11,-4);c.lineTo(-11-flame,0);c.lineTo(-11,4);c.fill();
    c.fillStyle='#fcead7';c.beginPath();c.moveTo(-10,-2);c.lineTo(-18,0);c.lineTo(-10,2);c.fill();
  }
  c.shadowColor=color;c.shadowBlur=reduced?0:9;c.strokeStyle=color;c.lineWidth=1.4;c.fillStyle=index===0?'#153b37':'#3e2c24';
  c.beginPath();c.moveTo(19,0);c.lineTo(-12,-11);c.lineTo(-6,0);c.lineTo(-12,11);c.closePath();c.fill();c.stroke();
  c.shadowBlur=0;c.strokeStyle='#d1fff5';c.beginPath();c.moveTo(9,0);c.lineTo(-2,-3);c.lineTo(-2,3);c.closePath();c.stroke();
  c.restore();
 }
 private threat(t:Threat,time:number,reduced:boolean) {
  const c=this.ctx;c.save();c.translate(t.x,t.y);c.rotate(t.angle);
  if(t.kind==='raider') {
    c.strokeStyle='#ff7d77';c.fillStyle='#3d2327';c.shadowColor='#ff7d77';c.shadowBlur=reduced?0:10;
    c.lineWidth=1.7;c.beginPath();c.moveTo(0,-21);c.lineTo(24,0);c.lineTo(0,21);c.lineTo(-24,0);c.closePath();c.fill();c.stroke();
    c.shadowBlur=0;c.fillStyle='#ffc3ad';c.fillRect(-5,-5,10,10);
    c.strokeStyle='#ff7d7770';c.beginPath();c.arc(0,0,29,0,Math.PI*1.3);c.stroke();
  } else {
    c.fillStyle=t.size===3?'#263132':'#303736';c.strokeStyle=t.size===3?'#b9a185':'#a08e78';c.lineWidth=1.4;
    c.beginPath();
    for(let i=0;i<11;i++) {const a=i*Math.PI*2/11,r=t.radius*(.79+.21*Math.sin(t.id*19+i*7)**2); const x=Math.cos(a)*r,y=Math.sin(a)*r;i===0?c.moveTo(x,y):c.lineTo(x,y);}
    c.closePath();c.fill();c.stroke();
    c.strokeStyle='#c5aa8135';c.beginPath();c.moveTo(-t.radius*.6,-t.radius*.2);c.lineTo(0,0);c.lineTo(t.radius*.25,t.radius*.5);c.moveTo(0,0);c.lineTo(t.radius*.5,-t.radius*.4);c.stroke();
    c.fillStyle='#efb977';c.globalAlpha=.5+(reduced?0:Math.sin(time+t.id)*.15);c.beginPath();c.arc(0,0,t.size===3?4:2,0,Math.PI*2);c.fill();c.globalAlpha=1;
  }
  c.restore();
 }
}
