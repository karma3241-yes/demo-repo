// ================================================================
// Powers
// ================================================================
const PS={};for(const k in POWERS)PS[k]={cd:0,holding:false,flash:0};
const aim={x:0,y:0,z:0,t:0,actor:null,surface:false,hitAny:false,nx:0,ny:1,nz:0};
let beam=null,ice=null,lastScorch=0,castT=-9;
// ---- skill size: hold a power key and scroll to grow or shrink what it makes, up to the size of the Earth ----
// Growing a step costs a little energy (ring charge for the Ring Bearer); shrinking gives back a quarter of it.
// castK is the size of the power being cast right now: radius and range scale with it, damage with its square root.
const SKILL_GROW={mul:1.2,max:12000,ring:0.9,energy:3,refund:0.25};
let castK=1,heldSlot=-1;
const skillSize=id=>(PS[id]&&PS[id].grow)||1;
function withCast(id,fn){const was=castK;castK=skillSize(id);try{return fn();}finally{castK=was;}}
function skillGrowStep(slot,dir){
  const id=save.character&&!P.alien&&save.character.abilities[slot];if(!id||!PS[id]||!canAct())return false;
  const s=PS[id],g=s.grow||1,ng=dir>0?Math.min(SKILL_GROW.max,g*SKILL_GROW.mul):Math.max(1,g/SKILL_GROW.mul);
  if(Math.abs(ng-g)<1e-6){if(time-(s.maxMsg||-9)>3){s.maxMsg=time;feed(POWERS[id].name+(dir>0?' is as big as the Earth':' is back to normal size'),'');}return true;}
  const ring=hasTrav('powerRing'),cost=ring?SKILL_GROW.ring:SKILL_GROW.energy;
  if(ng>g){if(ring?save.ring<cost:!spend(cost,id)){noEnergy(id);return true;}if(ring)save.ring-=cost;}
  else{const back=cost*SKILL_GROW.refund,m=heroMeter();if(ring)save.ring=Math.min(100,save.ring+back);else if(m)save[m.key]=Math.min(meterCap(m),save[m.key]+back*(m.rate||1));else P.en=Math.min(maxEn(),P.en+back);}
  s.grow=ng;if(time-(s.sizeMsg||-9)>0.35){s.sizeMsg=time;feed(POWERS[id].name+' · size ×'+(ng<10?ng.toFixed(1):Math.round(ng)),dir>0?'Keep scrolling to grow it':'Shrinking gives back a quarter of the cost');}
  SFX.tone('sine',ng>g?300:600,ng>g?160:1000,0.15,0.06);return true;
}
const camPos=new V3(),camF=new V3(0,0,-1),camR=new V3(1,0,0),camU=new V3(0,1,0);
function computeAim(range){
  if(lockT&&lockT.alive){const c=center(lockT),d=Math.hypot(c.x-camPos.x,c.y-camPos.y,c.z-camPos.z);{
    aim.t=d;aim.x=c.x;aim.y=c.y;aim.z=c.z;aim.actor=lockT;aim.surface=false;aim.nx=0;aim.ny=1;aim.nz=0;aim.hitAny=true;return aim;}}
  const ox=camPos.x,oy=camPos.y,oz=camPos.z,dx=camF.x,dy=camF.y,dz=camF.z;
  const t0=Math.max(0,(P.pos.x-ox)*dx+(P.pos.y+1.5-oy)*dy+(P.pos.z-oz)*dz);
  let best=range+t0,actor=null,surface=false,nx=0,ny=1,nz=0;
  const tc=rayCity(ox,oy,oz,dx,dy,dz,best);if(tc<best){best=tc;surface=true;nx=RAYHIT.nx;ny=RAYHIT.ny;nz=RAYHIT.nz;}
  if(dy<0){const t=-oy/dy;if(t<best){best=t;surface=true;nx=0;ny=1;nz=0;}}
  for(const a of actors){
    if(!a.alive||a.held)continue;const c=center(a);
    if(Math.abs((c.x-ox)*dz-(c.z-oz)*dx)>(a.radius||1)*3+2)continue;
    const t=raySphere(ox,oy,oz,dx,dy,dz,c.x,c.y,c.z,(a.radius||1)+0.25,a.ys||1);
    if(t>t0*0.6&&t<best){best=t;actor=a;surface=false;}
  }
  aim.t=best;aim.x=ox+dx*best;aim.y=oy+dy*best;aim.z=oz+dz*best;aim.actor=actor;aim.surface=surface;aim.nx=nx;aim.ny=ny;aim.nz=nz;aim.hitAny=best<range+t0-0.01;
  return aim;
}
const canAct=()=>state==='play'&&!paused&&!P.dead&&P.stun<=0&&!(frozenT>0);
function noEnergy(id){if(id)PS[id].flash=0.4;SFX.tone('square',220,150,0.1,0.06);hud.en.classList.add('warn');setTimeout(()=>hud.en.classList.remove('warn'),300);}
function faceAim(){P.heroYaw=Math.atan2(camF.x,camF.z);castT=time;}
function handPoint(){const s=Math.sin(P.heroYaw),c=Math.cos(P.heroYaw);return {x:P.pos.x+s*0.8+c*0.45,y:P.pos.y+1.95,z:P.pos.z+c*0.8-s*0.45};}
function dirTo(from,x,y,z){const dx=x-from.x,dy=y-from.y,dz=z-from.z,l=Math.hypot(dx,dy,dz)||1;return [dx/l,dy/l,dz/l];}
function abilityDown(slot){
  if(P.alien){alienAbilityDown(slot);return;}
  const id=save.character&&save.character.abilities[slot];if(!id||!canAct())return;
  if(id==='morphBand'){bandPress();return;}
  const c=POWERS[id],s=PS[id];
  if(id==='metalForms'){metalDown();return;}
  if(c.type==='channel'){s.holding=true;return;}
  if(c.type==='charge'){if(s.cd>0){s.flash=0.3;return;}s.holding=true;s.chargeT=0;SFX.tone('sawtooth',90,420,1.5,0.05);return;}
  if(c.type==='hold'){if(id==='telekinesis')tkGrab();return;}
  if(c.type==='toggle'){togglePower(id);return;}
  if(s.cd>0){s.flash=0.3;return;}
  if(c.ring!=null){if(!ringSpend(c.ring*(id==='blackHole'?1:1))){noEnergy(id);return;}}else if(!spend(c.energy||0,id)){noEnergy(id);return;}
  if(!POWER_FN[id])return;
  s.cd=(pstat(id,'cooldown')||0)*cdMul();withCast(id,POWER_FN[id]);
}
function abilityUp(slot){
  if(P.alien){alienAbilityUp(slot);return;}
  const id=save.character&&save.character.abilities[slot];if(!id)return;
  if(POWERS[id].type==='channel')PS[id].holding=false;
  if(POWERS[id].type==='charge'&&PS[id].holding){PS[id].holding=false;withCast(id,()=>chargeFire(id));}
  if(id==='telekinesis')tkThrow();
  if(id==='metalForms')metalUp();
}
function togglePower(id){
  if(TOGGLE_FN[id]){TOGGLE_FN[id]();return;}
  if(id==='metalSkin'||id==='metalForms'){P.metal=!P.metal;ringFx(P.pos.x,P.pos.y+1.3,P.pos.z,1,4,0.3,[.8,.85,.9]);SFX.tone('sawtooth',P.metal?300:500,P.metal?120:900,0.3,0.1);return;}
  if(id==='energyShield'){
    const s=PS.energyShield;
    if(P.shieldOn){P.shieldOn=false;P.shield=0;s.cd=3;return;}
    if(s.cd>0){s.flash=0.3;return;}
    if(!spend(POWERS.energyShield.energy,'energyShield')){noEnergy(id);return;}
    P.shieldOn=true;P.shield=pstat('energyShield','absorb');ringFx(P.pos.x,P.pos.y+1.3,P.pos.z,0.5,3,0.3,[.4,.85,1]);SFX.tone('sine',400,900,0.3,0.12);
  }
}
const flySpeed=()=>{const m=save.character&&save.character.movement[0];return POWERS[m]&&POWERS[m].preset&&POWERS[m].speed?pstat(m,'speed'):pstat('flight','speed');};
// hold F on the ground to charge, let go to blast off into the sky (a tap still just toggles flight)
function flyChargeStart(){
  if(!hasPower('flight')||isSpeed()||P.alien||P.car||P.flying||!P.grounded||!canAct()||P.construct)return false;
  if(isRing()&&save.ring<=0)return false;
  P.charging=true;P.chargeT=0;P.fCharge=true;return true;
}
function flyChargeRelease(){
  if(!P.fCharge)return false;P.fCharge=false;const t=P.chargeT||0,on=P.charging&&P.grounded;P.charging=false;
  if(!on||t<0.25){if(!P.flying)toggleFlight();return true;}
  const k=clamp(t/1.5,0,1);toggleFlight();if(!P.flying)return true;
  P.vel.set(camF.x*25*k,70+170*k,camF.z*25*k);P.launchT=0.5+1.3*k;P.pos.y+=0.3;P.hammerUpT=time;if(hasPower('stormBody')&&k>0.4&&!boltEmpty()){bolt(P.pos.x,P.pos.y,P.pos.z,true);if(heroMeter())payEn(6,'lightning');}
  ringFx(P.pos.x,P.pos.y+0.3,P.pos.z,1,10+22*k,0.5,[1,.9,.7]);burst(P.pos.x,P.pos.y+0.3,P.pos.z,Math.round(30+60*k),14+24*k,0.9,DUST,2.4,-3,2.5);
  if(k>0.5)crater(P.pos.x,P.pos.y+0.02,P.pos.z,0,1,0,2+3*k,[.42,.41,.4]);SFX.boom(0.4+0.5*k,0.8);addShake(0.2+0.5*k);hitProps(P.pos.x,P.pos.y,P.pos.z,3+4*k,P,12);
  addMastery(save.character.movement[0],10*k);return true;
}
function flyChargeTick(){
  if(!P.fCharge)return;if(!P.charging||!P.grounded){P.fCharge=false;P.charging=false;return;}
  const k=clamp(P.chargeT/1.5,0,1);
  if(Math.random()<0.3+k)emit(P.pos.x+rr(-1.2,1.2),P.pos.y+0.1,P.pos.z+rr(-1.2,1.2),rr(-2,2),rr(1,3+6*k),rr(-2,2),0.5,DUST[0],1+k,-1,1.5);
  if(k>=1&&Math.random()<0.15)addShake(0.05);
}
function toggleFlight(){
  if(!hasPower('flight')||!canAct()||P.car)return;
  if(P.alien)return; // alien forms fly (or not) on their own
  if(isRing()){if(!P.flying&&save.ring<=0){ringOut();return;}if(P.construct&&CONSTRUCTS[P.construct.id].drive)return;}
  else if(!P.flying&&P.en<5){noEnergy();return;}
  P.flying=!P.flying;P.charging=false;P.web=null;P.wall=null;
  if(P.flying){if(P.grounded)P.vel.y=22;P.grounded=false;SFX.whoosh();burst(P.pos.x,P.pos.y+0.3,P.pos.z,24,14,0.7,DUST,1.6,-2,2);}
}
function bolt(x,y,z,remote,k=remote?0.5:lvlK('lightning')){const bw=0.55+0.9*k;
  if(!remote)MP.fx('b',{x:Math.round(x),y:Math.round(y),z:Math.round(z)});
  let px=x+rr(-12,12),py=y+150,pz=z+rr(-12,12);const n=11;
  for(let i=1;i<=n;i++){const k=i/n,j=(1-k)*6;const qx=lerp(px,x,1/(n-i+1))+(i<n?rr(-j,j):0),qy=lerp(py,y,1/(n-i+1)),qz=lerp(pz,z,1/(n-i+1))+(i<n?rr(-j,j):0);
    tracer(px,py,pz,qx,qy,qz,[.6,.75,1],0.45*bw,0.25);tracer(px,py,pz,qx,qy,qz,[1,1,1],0.14*bw,0.25);
    if(i>3&&Math.random()<0.25){const bx=qx+rr(-10,10),bz=qz+rr(-10,10);tracer(qx,qy,qz,bx,qy-rr(6,14),bz,[.6,.75,1],0.15,0.18);}
    px=qx;py=qy;pz=qz;}
  burst(x,y,z,50,30,0.6,CYAN,1.4,6,1.5);ringFx(x,y+0.2,z,1,12,0.4,[.7,.85,1]);flashWhite=0.55;
  SFX.boom(0.9,1.6);SFX.tone('sawtooth',1800,80,0.4,0.15);addShake(0.4);scare(x,z,40);
}
const TOGGLE_FN={},CHANNEL_FN={};
// ring charge: the Ring Bearer spends this instead of energy, and it only refills with the oath
function ringSpend(n){if(!hasTrav('powerRing'))return spend(n);if(save.ring<n)return false;save.ring-=n;return true;}
const POWER_FN={
  fireball(){faceAim();const h=handPoint(),d=dirTo(h,aim.x,aim.y,aim.z),sp=POWERS.fireball.speed;
    fireProj({kind:'fire',owner:P,x:h.x,y:h.y,z:h.z,vx:d[0]*sp,vy:d[1]*sp,vz:d[2]*sp,dmg:pstat('fireball','damage'),radius:pstat('fireball','radius'),
      burn:{dps:pstat('fireball','burnDps'),time:POWERS.fireball.burnTime},r:0.7,life:3});SFX.whoosh();},
  energyBlast(){faceAim();const h=handPoint(),d=dirTo(h,aim.x,aim.y,aim.z),sp=POWERS.energyBlast.speed;
    fireProj({kind:'blast',owner:P,x:h.x,y:h.y,z:h.z,vx:d[0]*sp,vy:d[1]*sp,vz:d[2]*sp,dmg:pstat('energyBlast','damage'),knock:pstat('energyBlast','knock'),r:0.5,life:2,big:0.65+0.8*lvlK('energyBlast')});
    SFX.tone('square',700,1400,0.12,0.08);},
  lightning(){faceAim();let x=aim.x,y=aim.y,z=aim.z;const R=POWERS.lightning.range;
    if(!aim.hitAny||Math.hypot(x-P.pos.x,z-P.pos.z)>R){const k=Math.min(R,60);x=P.pos.x+camF.x*k;z=P.pos.z+camF.z*k;y=groundY(x,z,P.pos.y+20);}
    bolt(x,y,z);const direct=aim.actor&&aim.actor.kind!=='prop'?aim.actor:null;
    if(direct)Damage.apply(P,direct,pstat('lightning','damage'),'shock',{stun:pstat('lightning','stun'),knock:6});
    areaDamage(x,y,z,pstat('lightning','radius'),pstat('lightning','damage'),P,{type:'shock',stun:pstat('lightning','stun'),knock:6,exclude:direct});
    if(aim.surface)addScorch(x,y,z,1.8,aim.nx,aim.ny,aim.nz);},
  shockwave(){
    if(!P.grounded&&!P.flying&&!P.slam){P.slam=true;P.vel.set(P.vel.x*0.25,-170,P.vel.z*0.25);return;}
    shockAt(P.pos.x,P.pos.y+1,P.pos.z,1);},
};
function shockAt(x,y,z,m){
  const R=pstat('shockwave','radius')*m,D=pstat('shockwave','damage')*m;MP.fx('s',{x:Math.round(x),y:Math.round(y),z:Math.round(z),r:Math.round(R)});
  ringFx(x,y,z,1,R,0.5,[.45,.85,1]);ringFx(x,y+0.4,z,1,R*0.7,0.4,[1,1,1]);
  burst(x,y,z,50,R*1.1,0.7,CYAN,1.1,0,2.2);SFX.boom(0.9,1.2);addShake(0.6);scare(x,z,R*2);
  areaDamage(x,y,z,R,D,P,{knock:24,type:'blast'});
}
function laserTick(dt){
  faceAim();const range=pstat('laserVision','range'),e=P.eye;
  let tx=aim.x,ty=aim.y,tz=aim.z,actor=aim.actor,surf=aim.surface,nx=aim.nx,ny=aim.ny,nz=aim.nz;
  let dx=tx-e.x,dy=ty-e.y,dz=tz-e.z,l=Math.hypot(dx,dy,dz)||1;
  if(l>range){tx=e.x+dx/l*range;ty=e.y+dy/l*range;tz=e.z+dz/l*range;l=range;actor=null;surf=false;}
  const tb=rayCity(e.x,e.y,e.z,dx/l,dy/l,dz/l,l);
  let hb=null;if(tb<l-0.3){tx=e.x+dx/l*tb;ty=e.y+dy/l*tb;tz=e.z+dz/l*tb;actor=null;surf=true;nx=RAYHIT.nx;ny=RAYHIT.ny;nz=RAYHIT.nz;hb=RAYHIT.b;}
  beam={x:tx,y:ty,z:tz};
  if(hb&&Math.random()<dt*2.5)breakWindowAt(hb,tx,ty,tz);
  if(!actor&&ty<9&&Math.random()<dt*3)hitProps(tx,ty,tz,0.8,P,6);
  if(actor)Damage.apply(P,actor,pstat('laserVision','dps')*dt,'laser');
  if(actor||surf){for(let i=0;i<3;i++)emit(tx,ty,tz,rr(-9,9),rr(2,14),rr(-9,9),rr(0.25,0.6),Math.random()<0.5?SPARK[0]:FIRE[1],rr(0.5,1.1),22,0.5);}
  if(surf&&time-lastScorch>0.12){lastScorch=time;addScorch(tx,ty,tz,0.8,nx,ny,nz);}
}
function iceTick(dt){
  const R=POWERS.iceCloud.range;let x=aim.x,z=aim.z,y;
  const d=Math.hypot(x-P.pos.x,z-P.pos.z);
  if(!aim.hitAny||d>R){const k=Math.min(1,R/Math.max(d,1));x=P.pos.x+(aim.x-P.pos.x)*k;z=P.pos.z+(aim.z-P.pos.z)*k;}
  if(aim.actor){const c=center(aim.actor);y=c.y;}else y=groundY(x,z,Math.max(aim.y,0)+1)+2;
  if(!ice)ice={x,y,z,t:0.4};
  ice.x=lerp(ice.x,x,damp(8,dt));ice.y=lerp(ice.y,y,damp(8,dt));ice.z=lerp(ice.z,z,damp(8,dt));ice.t=0.4;faceAim();
  const r=pstat('iceCloud','radius'),slow=pstat('iceCloud','slow'),dps=pstat('iceCloud','dps');
  for(const a of actors){if(!a.alive||a.kind==='prop'||a.kind==='vehicle')continue;const c=center(a);
    if(Math.hypot(c.x-ice.x,c.z-ice.z)<r+(a.radius||1)&&Math.abs(c.y-ice.y)<r){a.slow=Math.max(a.slow||0,slow);a.slowT=0.3;Damage.apply(P,a,dps*dt,'ice');}}
}
function iceVisuals(){
  if(!ice)return;const r=pstat('iceCloud','radius');
  for(let i=0;i<3;i++){const a=rr(0,TAU),q=Math.sqrt(Math.random())*r;emit(ice.x+Math.cos(a)*q,ice.y+rr(-1.5,1.5),ice.z+Math.sin(a)*q,rr(-1,1),rr(-1,1),rr(-1,1),rr(0.5,1),[.55,.8,1],rr(0.5,1.2),1,0.5);}
  if(Math.random()<0.35)smoke(ice.x,ice.y-1,ice.z,1,r*0.7,6,1.6,0.85);
}
// ---- telekinesis: grab (hold the key), right click grabs more, left click slams, let go to throw ----
// Level decides what you can lift: people and drones from the start, cars at 3, trucks at 6,
// chunks of rubble at 5 and slabs torn out of buildings at 9. More objects at once every 3 levels.
const tkLevel=()=>powerLevel('telekinesis');
const tkMax=()=>1+Math.floor((tkLevel()-1)/3);
function tkCanLift(a,quiet){
  if(!a||a.kind==='boss'||a.kind==='prop'||a.kind==='heli'||a.held||a===P.car)return false;
  if(a.kind==='remote'&&!MP.net())return false;
  if(a.kind==='vehicle'){if(a.state!=='road'&&a.state!=='parked')return false;const need=a.vtype==='truck'?6:3;
    if(tkLevel()<need&&!(P.tk&&P.tk.giant)){if(!quiet)feed('Too heavy for now','Telekinesis LV '+need+' lifts '+(a.vtype==='truck'?'trucks':'cars'));return false;}}
  return true;
}
function tkAttach(a){
  a.held=true;
  if(a.kind==='remote')feed('Holding '+a.name,'Let go to throw them');
  else if(a.net)P2P.emit('tg',{id:a.nid});
  else{if(a.kind==='vehicle'){a.state='held';if(a.driver)ejectDriver(a);}if(a.kind==='human')a.air=false;}
  ringFx(a.pos.x,a.pos.y+1,a.pos.z,0.5,4,0.3,[.75,.5,1]);
}
function tkGrab(){
  if(P.tk)return;const a=aim.actor,R=pstat('telekinesis','range');
  if(!a||a.kind==='prop'){if(!tkRip(R))PS.telekinesis.flash=0.3;return;}
  if(!tkCanLift(a)){PS.telekinesis.flash=0.3;return;}
  if(Math.hypot(a.pos.x-P.pos.x,a.pos.y-P.pos.y,a.pos.z-P.pos.z)>R){PS.telekinesis.flash=0.3;feed('Too far','Telekinesis reaches '+Math.round(R)+' m');return;}
  if(!spend(POWERS.telekinesis.energy)){noEnergy('telekinesis');return;}
  P.tk={a,more:[],sendT:0};tkAttach(a);faceAim();SFX.tone('sine',200,520,0.4,0.1);
}
// right click while holding: add whatever you aim at
function tkGrabMore(){
  const T=P.tk;if(!T||T.giant)return false;const a=aim.actor,R=pstat('telekinesis','range');
  if(1+T.more.length+(T.slab&&T.a?1:0)>=tkMax()){feed('Hands full','Telekinesis LV '+(tkMax()*3+1)+' holds one more');return true;}
  if(!a||a===T.a||T.more.includes(a)||!tkCanLift(a)||a.kind==='remote'||Math.hypot(a.pos.x-P.pos.x,a.pos.z-P.pos.z)>R){PS.telekinesis.flash=0.3;return true;}
  if(!spend(4)){noEnergy('telekinesis');return true;}
  T.more.push(a);tkAttach(a);SFX.tone('sine',300,700,0.25,0.08);return true;
}
// rip a chunk of rubble (LV 5) or a slab of a building (LV 9) out of where you aim
function tkRip(R){
  if(!aim.hitAny||Math.hypot(aim.x-P.pos.x,aim.y-P.pos.y,aim.z-P.pos.z)>R)return false;const lv=tkLevel();
  if(lv>=5)for(const b of bldActive){if(!b.rubble||!b.rubble.length)continue;let bi=-1,bd=10;b.rubble.forEach((r,i)=>{const d=Math.hypot(r.x-aim.x,r.z-aim.z);if(d<bd){bd=d;bi=i;}});
    if(bi>=0){if(!spend(POWERS.telekinesis.energy)){noEnergy('telekinesis');return true;}const r=b.rubble.splice(bi,1)[0];
      P.tk={a:null,more:[],sendT:0,slab:{x:r.x,y:r.y,z:r.z,sx:r.sx,sy:r.sy,sz:r.sz,col:[b.col[0]*r.k,b.col[1]*r.k,b.col[2]*r.k,1],rx:r.rx,ry:r.ry,rz:r.rz}};faceAim();SFX.tone('sine',120,400,0.5,0.12);return true;}}
  if(aim.surface&&aim.ny<0.5){const b=inBuilding(aim.x-aim.nx*0.8,aim.y,aim.z-aim.nz*0.8,0.3);
    if(b&&b.bld){if(lv<9){feed('Too heavy for now','Telekinesis LV 9 tears pieces out of buildings');return true;}
      if(!spend(POWERS.telekinesis.energy*2)){noEnergy('telekinesis');return true;}const s=rr(4,6);
      P.tk={a:null,more:[],sendT:0,slab:{x:aim.x+aim.nx*s*0.5,y:aim.y,z:aim.z+aim.nz*s*0.5,sx:s,sy:s*0.8,sz:s,col:b.col.concat([1]).slice(0,4),rx:0,ry:rr(0,TAU),rz:0}};
      damageBuilding(b.bld,900,aim.x,aim.y,aim.z,-aim.nx,-aim.nz);crater(aim.x,aim.y,aim.z,aim.nx,aim.ny,aim.nz,s*0.6,b.col);faceAim();SFX.boom(0.5,0.6);addShake(0.3);return true;}}
  return false;
}
function tkPoints(){ // where each held object floats: the first at the hold point, the rest in a ring around it
  const T=P.tk,h=T.hold,out=[];const n=T.more.length,sx=-camF.z,sz=camF.x,sl=Math.hypot(sx,sz)||1;
  T.more.forEach((a,i)=>{const an=(i+1)/(n+1)*Math.PI-Math.PI/2+time*0.6,r=3.2;out.push([h[0]+sx/sl*Math.sin(an)*r,h[1]+Math.cos(an)*r*0.6+1,h[2]+sz/sl*Math.sin(an)*r]);});
  return out;
}
function tkMove(a,x,y,z,dt){
  if(a.kind==='remote'){if(!a.alive||!MP.peers.has(a.peer))return false;P.tk.sendT-=dt;if(P.tk.sendT<=0){P.tk.sendT=0.1;MP.fx('hold',{to:a.peer,x:Math.round(x*10)/10,y:Math.round(y*10)/10,z:Math.round(z*10)/10});}return true;}
  if(a.net)return true;
  const k=damp(9,dt);a.pos.x+=(x-a.pos.x)*k;a.pos.y+=(y-a.pos.y)*k;a.pos.z+=(z-a.pos.z)*k;if(a.vel)a.vel.set(0,0,0);a.stun=Math.max(a.stun||0,0.3);
  const n=1+Math.floor(tkLevel()/4);for(let i=0;i<n;i++)if(Math.random()<0.6)emit(a.pos.x+rr(-1.5,1.5),a.pos.y+rr(0,2),a.pos.z+rr(-1.5,1.5),0,rr(0,2),0,0.5,[.7,.45,1],0.9+tkLevel()*0.08,0,0);
  return true;
}
function tkTick(dt){
  const T=P.tk,a=T.a;
  if(a&&a.kind!=='vehicle'&&!a.alive&&!a.air&&a.kind!=='human'&&a.kind!=='remote'){tkDrop();return;}
  if(!T.giant){const cost=POWERS.telekinesis.energyPerSec*(1.3-0.1*tkLevel())*(1+T.more.length*0.5+(T.slab?1:0))*dt;if(heroMeter()?!payEn(cost,'telekinesis',true):P.en<cost){tkThrow();return;}if(!heroMeter())P.en-=cost;P.lastSpend=time;}
  const gs=P.giantS||1,far=T.giant?2.4*gs:T.slab?10:a&&a.kind==='vehicle'?8:6.5,hx=P.pos.x+camF.x*far,hy=P.pos.y+(T.giant?3*gs:2.6)+camF.y*far,hz=P.pos.z+camF.z*far;
  T.hold=[hx,Math.max(hy,0.5),hz];
  if(a&&!tkMove(a,hx,Math.max(hy,0.5),hz,dt)){T.a=null;a.held=false;}
  const pts=tkPoints();T.more=T.more.filter((m,i)=>{if(!m.alive&&m.kind!=='vehicle'&&m.kind!=='human'){m.held=false;return false;}return tkMove(m,pts[i][0],Math.max(pts[i][1],0.5),pts[i][2],dt);});
  if(T.slab){const S=T.slab,k=damp(7,dt),y=Math.max(hy,S.sy*0.5+0.3)+(a?S.sy+2:0);S.x+=(hx-S.x)*k;S.y+=(y-S.y)*k;S.z+=(hz-S.z)*k;S.ry+=dt*0.5;if(Math.random()<0.7)emit(S.x+rr(-S.sx,S.sx)*0.5,S.y-S.sy*0.5,S.z+rr(-S.sz,S.sz)*0.5,0,-2,0,0.6,[.7,.45,1],1.4,0,0);}
  if(!T.a&&!T.more.length&&!T.slab)P.tk=null;
}
function tkFling(a,vx,vy,vz,dmg){
  a.held=false;
  if(a.kind==='remote'){MP.hit(a,dmg,'throw',{kv:[vx,vy,vz],stun:1});return;}
  if(a.net){P2P.emit('tt',{id:a.nid,v:[vx,vy,vz].map(Math.round),d:Math.round(dmg)});return;}
  if(a.kind==='vehicle'){a.state='thrown';a.vel.set(vx,vy,vz);a.sx=rr(-3,3);a.sy=rr(-2,2);a.sz=rr(-3,3);a.life=6;a.thrower=P;a.throwDmg=dmg;}
  else if(a.kind==='human'){a.air=true;a.vel.set(vx,vy,vz);a.tumble=rr(6,10);a.thrown={by:P,dmg};}
  else{a.vel.set(vx,vy,vz);a.thrown={by:P,dmg};a.stun=1;}
}
function tkThrow(){
  if(!P.tk)return;const T=P.tk;P.tk=null;faceAim();
  const sp=55+tkLevel()*2,dmg=pstat('telekinesis','throwDmg')*throwMul()*(T.giant?2:1),vx=camF.x*sp+P.vel.x*0.5,vy=camF.y*sp+6,vz=camF.z*sp+P.vel.z*0.5;
  if(T.a)tkFling(T.a,vx,vy,vz,dmg);
  T.more.forEach((m,i)=>tkFling(m,vx+rr(-6,6),vy+rr(-2,4),vz+rr(-6,6),dmg));
  if(T.slab)throwSlab(T.slab,vx,vy,vz,dmg*2.5);
  SFX.whoosh();
}
// left click while holding: drive everything into the ground
function tkSlam(){
  if(!P.tk||P.tk.giant)return false;const T=P.tk;P.tk=null;const dmg=pstat('telekinesis','throwDmg')*throwMul()*1.4,vx=camF.x*8,vz=camF.z*8;
  if(T.a)tkFling(T.a,vx,-70,vz,dmg);T.more.forEach(m=>tkFling(m,vx,-70,vz,dmg));if(T.slab)throwSlab(T.slab,vx,-80,vz,dmg*2.5);
  SFX.tone('sine',400,80,0.3,0.12);addShake(0.2);return true;
}
function tkDrop(){if(!P.tk)return;const T=P.tk;P.tk=null;for(const a of [T.a,...T.more]){if(!a)continue;a.held=false;if(a.kind==='remote')continue;if(a.net){P2P.emit('tt',{id:a.nid,v:[0,0,0],d:0});continue;}if(a.kind==='vehicle'){a.state='thrown';a.vel.set(0,0,0);a.sx=a.sy=a.sz=0;a.life=6;a.thrower=P;a.throwDmg=10;}else if(a.kind==='human'){a.air=true;a.vel.set(0,0,0);}}if(T.slab)throwSlab(T.slab,0,0,0,50);}
function stopAllPowers(){
  for(const k in PS)PS[k].holding=false;
  if(P.alien)P.alien.channel=false;
  P.flying=false;P.metal=false;P.shieldOn=false;P.shield=0;P.web=null;P.wall=null;P.charging=false;P.slam=false;P.speeding=false;P.wallRun=null;P.zip=null;
  if(P.tk)tkDrop();beam=null;SFX.setLaser(false);SFX.setWind(0);if(P.construct)dismissConstruct(true);P.ringShield=false;P.cloak=false;closeOath();endGiant();
}
function updatePowers(dt){
  for(const k in PS){const s=PS[k];if(s.cd>0)s.cd=Math.max(0,s.cd-dt);if(s.flash>0)s.flash-=dt;}
  if(P.punchCd>0)P.punchCd-=dt;
  beam=null;let lasering=false;
  if(!canAct()){for(const k in PS)PS[k].holding=false;}
  if(save.character)for(const id of save.character.abilities){
    const c=POWERS[id],s=PS[id];if(c.type!=='channel'||!s.holding)continue;
    const cost=c.energyPerSec*dt;
    if(heroMeter()){if(!payEn(cost,id,true)){s.holding=false;noEnergy(id);continue;}}
    else{if(P.en<cost){s.holding=false;noEnergy(id);continue;}P.en-=cost;P.lastSpend=time;}
    withCast(id,()=>{if(id==='laserVision'){laserTick(dt);lasering=true;}else if(id==='repulsors')repulsorTick(dt);else if(CHANNEL_FN[id])CHANNEL_FN[id](dt);else iceTick(dt);});
  }
  if(ice){iceVisuals();if(!PS.iceCloud.holding){ice.t-=dt;if(ice.t<=0)ice=null;}}
  SFX.setLaser(lasering);
  if(P.tk)tkTick(dt);
  const drainT=(n)=>{if(heroMeter())return true;P.en=Math.max(0,P.en-n*dt);if(CONFIG.energy.togglesBlockRegen)P.lastSpend=time;return P.en>0;};
  if(P.flying&&!P.alien&&!isRing()&&!drainT(pstat('flight','drain'))){P.flying=false;feed('Out of energy','You stopped flying');}
  if(P.metal&&!drainT(POWERS.metalSkin.drain)){P.metal=false;feed('Out of energy','Metal Skin wore off');}
  if(P.speeding&&!drainT(pstat('superSpeed','drain')))P.speeding=false;
  if(time-P.lastSpend>CONFIG.energy.delay)P.en=Math.min(maxEn(),P.en+enRegen()*dt);
  if(time-P.lastHit>CONFIG.health.healDelay)P.hp=Math.min(maxHp(),P.hp+hpRegen()*dt);
  updateWanted(dt);
  if(P.stun>0)P.stun-=dt;
  updateHeroAbilities(dt);updateWebbed(dt);updateRing(dt);updateMeters(dt);updateSpace(dt);updatePool(dt);updateSpeed(dt);updateBody(dt);updateSuit(dt);flyChargeTick();remoteStreaks();
}
