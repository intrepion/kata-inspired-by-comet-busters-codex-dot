import {Simulation,type Input,type Scenario} from './simulation';
/** Match progress is transient. The optional scenario is the existing headless test seam. */
export class Tournament {
 private game:Simulation;
 private scores:[number,number]=[0,0];
 private round=1;
 private settled=false;
 constructor(private seed=1,private readonly fixture?:Scenario) {this.game=this.fresh();}
 private fresh() {return new Simulation(2,this.seed,this.fixture,'tournament');}
 snapshot() {return this.game.snapshot();}
 scorecard() {
  const state=this.game.snapshot();
  const survivor=state.pilots.findIndex(p=>p.hulls>0);
  return {scores:[...this.scores] as [number,number],round:this.round,settled:this.settled,roundWinner:this.settled?survivor:-1,matchWinner:this.scores.findIndex(n=>n>=3)};
 }
 step(inputs:readonly Input[]) {
  if(this.settled)return [];
  const events=this.game.step(inputs),state=this.game.snapshot();
  if(state.status!=='playing') {
   this.settled=true;
   const winner=state.pilots.findIndex(p=>p.hulls>0);
   if(winner>=0)this.scores[winner]++;
  }
  return events;
 }
 nextRound() {
  if(!this.settled||this.scores.some(n=>n>=3))return false;
  this.round++;this.seed=(this.seed+997)>>>0;this.game=this.fresh();this.settled=false;return true;
 }
}
