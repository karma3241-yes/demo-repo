// ================================================================
// Water: swimming, diving and splashes
// ================================================================
// Off the island the player swims instead of standing on the sea: you float with your head above the surface, move
// at swimming pace, hold C to dive and let go (or hold Space) to come back up. Space at the surface jumps out as
// before (hold it for a super jump), and swimming into the shore climbs you out. Crossing the surface splashes (bigger
// the faster you hit it), a blue tint covers the screen while the camera is under, and bubbles rise as you swim.
// Cars, constructs, giants and a speedster running fast still skim the surface like before. Park ponds are shallow:
// walking through one splashes and slows you down.
const SEA_Y=-1.2,SWIM_Y=-3.0,SEABED=-18; // the sea surface, where your feet float, and the sea floor
const seabedMesh=new Geo().prim(PRIM.quad,0,SEABED,0,0,0,0,9000,1,9000,[.16,.21,.18],5).mesh();
SFX.water=function(v=1){if(!this.ctx||v<=0.02)return;const c=this.ctx,t=c.currentTime,len=0.3+0.5*Math.min(1,v);
  const s=c.createBufferSource();s.buffer=this.noise;const f=c.createBiquadFilter();f.type='bandpass';f.Q.value=0.9;
  f.frequency.setValueAtTime(2600,t);f.frequency.exponentialRampToValueAtTime(320,t+len);
  const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.55*Math.min(1.4,v),t+0.02);g.gain.exponentialRampToValueAtTime(0.001,t+len);
  s.connect(f).connect(g).connect(this.master);s.start(t,Math.random());s.stop(t+len+0.05);this.tone('sine',700,160,0.14,0.06*Math.min(1,v));};
function splashAt(x,y,z,k){ // k: 0.2 a ripple ... 1 a big dive
  const n=Math.round(10+k*40),s=0.5+k;
  for(let i=0;i<n;i++){const a=rr(0,TAU),o=rr(0.2,1.2)*s;emit(x+Math.cos(a)*o,y+0.1,z+Math.sin(a)*o,Math.cos(a)*rr(1,4)*s,rr(5,13)*s,Math.sin(a)*rr(1,4)*s,rr(0.5,1.1),WATER[(Math.random()*2)|0],rr(0.5,1.3)*(0.7+k*0.5),22,0.3);}
  ringFx(x,y+0.05,z,0.4,3+k*7,0.9,[.75,.9,1]);SFX.water(SFX.vol(x,y,z)*(0.35+k*0.8));
}
// can the player swim here at all (else the old sea "floor" holds them up)
function swimOk(shift){
  if(P.car||P.construct||P.dead||inSpace())return false;const AL=alienDef();if(AL&&AL.scale>2)return false; // giants wade
  if(!AL&&hasPower('superSpeed')&&(shift||P.fastMode)&&P.pos.y>SWIM_Y-0.5)return false; // a speedster at speed runs across the water
  return true;
}
let swimShift=false;
const swimFloor=()=>!onIsland(P.pos.x,P.pos.z)&&swimOk(swimShift)?SEABED:undefined;
// the camera may follow you under once you dive; floating at the surface it stays above the water
function camFloorY(x,z){if(state!=='play'||swimFloor()===undefined)return baseY(x,z)+0.6;return P.pos.y<SWIM_Y-0.8?SEABED+1:SEA_Y+0.3;}
function swimCheck(shift,phasing){
  swimShift=shift;const was=P.swim,wet=!onIsland(P.pos.x,P.pos.z);
  P.swim=wet&&!phasing&&!P.flying&&!P.wall&&P.pos.y<SEA_Y+0.4&&swimOk(shift);
  if(P.swim&&!was){if(P.web)webRelease(false);P.zip=null;P.wings=false;P.wallRun=null;}
  const under=wet&&!P.car&&P.pos.y<SEA_Y;
  if(under!==!!P.wetFeet){P.wetFeet=under;
    if(under&&!phasing)splashAt(P.pos.x,SEA_Y,P.pos.z,clamp(-P.vel.y/40,0.25,1));
    else if(!under&&P.vel.y>4)splashAt(P.pos.x,SEA_Y,P.pos.z,0.2);}
  const wade=!P.swim&&!P.flying&&!P.car&&P.pos.y<0.9&&!!inLake(P.pos.x,P.pos.z);
  if(wade&&!P.wade)splashAt(P.pos.x,0.47,P.pos.z,clamp(-P.vel.y/40,0.15,0.8));
  P.wade=wade;
  if(wade&&Math.hypot(P.vel.x,P.vel.z)>2&&Math.random()<0.3)emit(P.pos.x+rr(-.5,.5),0.5,P.pos.z+rr(-.5,.5),rr(-1.5,1.5),rr(2,4),rr(-1.5,1.5),0.5,WATER[0],0.8,15,1);
}
const wadeMul=()=>P.wade?0.55:1;
function swimStep(dt,inF,inR,fwdX,fwdZ,rX,rZ,slowMul,shift){
  let tx=fwdX*inF+rX*inR,tz=fwdZ*inF+rZ*inR;const l=Math.hypot(tx,tz);if(l>1){tx/=l;tz/=l;}
  const AL=alienDef(),spd=(AL?AL.speed:1)*CONFIG.move.run*(shift?0.62:0.4)*slowMul,k=damp(2.5,dt);
  P.vel.x+=(tx*spd-P.vel.x)*k;P.vel.z+=(tz*spd-P.vel.z)*k;
  const depth=SWIM_Y-P.pos.y,dive=!!keys.KeyC,up=!!keys.Space;
  if(dive)P.vel.y+=(-6-P.vel.y)*damp(3,dt);
  else if(depth>0.3)P.vel.y+=((up?8:Math.min(4.5,1.5+depth*0.6))-P.vel.y)*damp(P.vel.y<-3?5:2.5,dt); // the water brakes a dive, then floats you up
  else if(depth<-0.05||P.vel.y>1.5)P.vel.y-=CONFIG.move.gravity*dt;           // jumping out, or dropping in from above
  else P.vel.y+=(depth*5-P.vel.y)*damp(6,dt);                                // bobbing at the surface
  if(P.charging){P.chargeT+=dt;if(!P.grounded)P.charging=false;}
  if(depth>1.5&&Math.random()<dt*6)emit(P.pos.x+rr(-.3,.3),P.pos.y+2.2,P.pos.z+rr(-.3,.3),rr(-.3,.3),rr(1.5,2.5),rr(-.3,.3),rr(0.8,1.4),[.75,.9,1],rr(0.15,0.3),-4,0.5); // bubbles
}
// floating at the surface counts as standing (so Space jumps out, and holding it charges a super jump)
const swimFloats=()=>Math.abs(SWIM_Y-P.pos.y)<0.45&&!keys.KeyC&&Math.abs(P.vel.y)<3;
// deep down the shore is a wall; at the surface swimming into it climbs you out
function swimShore(px,pz){
  if(!onIsland(P.pos.x,P.pos.z))return;
  if(P.pos.y<SWIM_Y-1){P.pos.x=px;P.pos.z=pz;P.vel.x=0;P.vel.z=0;return;}
  if(P.pos.y<-0.3){P.pos.x=px;P.pos.z=pz;if(P.vel.y<5){P.vel.y=22;splashAt(P.pos.x,SEA_Y,P.pos.z,0.3);}}
}
let uwOn=false;
function updateUnderwater(){const on=state==='play'&&camPos.y<SEA_Y&&!onIsland(camPos.x,camPos.z);if(on!==uwOn){uwOn=on;$('uw').style.opacity=on?'1':'0';}}
