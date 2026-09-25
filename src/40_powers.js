// ================================================================
// Powers
// ================================================================
const PS={};for(const k in POWERS)PS[k]={cd:0,holding:false,flash:0};
const aim={x:0,y:0,z:0,t:0,actor:null,surface:false,hitAny:false,nx:0,ny:1,nz:0};
let beam=null,ice=null,lastScorch=0,castT=-9;
const camPos=new V3(),camF=new V3(0,0,-1),camR=new V3(1,0,0),camU=new V3(0,1,0);
function computeAim(range){
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
const canAct=()=>state==='play'&&!paused&&!P.dead&&P.stun<=0;
function noEnergy(id){if(id)PS[id].flash=0.4;SFX.tone('square',220,150,0.1,0.06);hud.en.classList.add('warn');setTimeout(()=>hud.en.classList.remove('warn'),300);}
function faceAim(){P.heroYaw=Math.atan2(camF.x,camF.z);castT=time;}
function handPoint(){const s=Math.sin(P.heroYaw),c=Math.cos(P.heroYaw);return {x:P.pos.x+s*0.8+c*0.45,y:P.pos.y+1.95,z:P.pos.z+c*0.8-s*0.45};}
function dirTo(from,x,y,z){const dx=x-from.x,dy=y-from.y,dz=z-from.z,l=Math.hypot(dx,dy,dz)||1;return [dx/l,dy/l,dz/l];}
function abilityDown(slot){
  if(P.alien){alienAbilityDown(slot);return;}
  const id=save.character&&save.character.abilities[slot];if(!id||!canAct())return;
  if(id==='morphBand'){bandPress();return;}
  const c=POWERS[id],s=PS[id];
  if(c.type==='channel'){s.holding=true;return;}
  if(c.type==='hold'){if(id==='telekinesis')tkGrab();return;}
  if(c.type==='toggle'){togglePower(id);return;}
  if(s.cd>0){s.flash=0.3;return;}
  if(!spend(c.energy)){noEnergy(id);return;}
  s.cd=c.cooldown;POWER_FN[id]();
}
function abilityUp(slot){
  if(P.alien){alienAbilityUp(slot);return;}
  const id=save.character&&save.character.abilities[slot];if(!id)return;
  if(POWERS[id].type==='channel')PS[id].holding=false;
  if(id==='telekinesis')tkThrow();
}
function togglePower(id){
  if(id==='metalSkin'){P.metal=!P.metal;ringFx(P.pos.x,P.pos.y+1.3,P.pos.z,1,4,0.3,[.8,.85,.9]);SFX.tone('sawtooth',P.metal?300:500,P.metal?120:900,0.3,0.1);return;}
  if(id==='energyShield'){
    const s=PS.energyShield;
    if(P.shieldOn){P.shieldOn=false;P.shield=0;s.cd=3;return;}
    if(s.cd>0){s.flash=0.3;return;}
    if(!spend(POWERS.energyShield.energy)){noEnergy(id);return;}
    P.shieldOn=true;P.shield=pstat('energyShield','absorb');ringFx(P.pos.x,P.pos.y+1.3,P.pos.z,0.5,3,0.3,[.4,.85,1]);SFX.tone('sine',400,900,0.3,0.12);
  }
}
function toggleFlight(){
  if(!hasPower('flight')||!canAct()||P.car)return;
  if(P.alien&&ALIENS[P.alien.id].flies)return;
  if(!P.flying&&P.en<5){noEnergy();return;}
  P.flying=!P.flying;P.charging=false;P.web=null;P.wall=null;
  if(P.flying){if(P.grounded)P.vel.y=22;P.grounded=false;SFX.whoosh();burst(P.pos.x,P.pos.y+0.3,P.pos.z,24,14,0.7,DUST,1.6,-2,2);}
}
function bolt(x,y,z,remote){
  if(!remote)MP.fx('b',{x:Math.round(x),y:Math.round(y),z:Math.round(z)});
  let px=x+rr(-12,12),py=y+150,pz=z+rr(-12,12);const n=11;
  for(let i=1;i<=n;i++){const k=i/n,j=(1-k)*6;const qx=lerp(px,x,1/(n-i+1))+(i<n?rr(-j,j):0),qy=lerp(py,y,1/(n-i+1)),qz=lerp(pz,z,1/(n-i+1))+(i<n?rr(-j,j):0);
    tracer(px,py,pz,qx,qy,qz,[.6,.75,1],0.45,0.25);tracer(px,py,pz,qx,qy,qz,[1,1,1],0.14,0.25);
    if(i>3&&Math.random()<0.25){const bx=qx+rr(-10,10),bz=qz+rr(-10,10);tracer(qx,qy,qz,bx,qy-rr(6,14),bz,[.6,.75,1],0.15,0.18);}
    px=qx;py=qy;pz=qz;}
  burst(x,y,z,50,30,0.6,CYAN,1.4,6,1.5);ringFx(x,y+0.2,z,1,12,0.4,[.7,.85,1]);flashWhite=0.55;
  SFX.boom(0.9,1.6);SFX.tone('sawtooth',1800,80,0.4,0.15);addShake(0.4);scare(x,z,40);
}
const POWER_FN={
  fireball(){faceAim();const h=handPoint(),d=dirTo(h,aim.x,aim.y,aim.z),sp=POWERS.fireball.speed;
    fireProj({kind:'fire',owner:P,x:h.x,y:h.y,z:h.z,vx:d[0]*sp,vy:d[1]*sp,vz:d[2]*sp,dmg:pstat('fireball','damage'),radius:pstat('fireball','radius'),
      burn:{dps:pstat('fireball','burnDps'),time:POWERS.fireball.burnTime},r:0.7,life:3});SFX.whoosh();},
  energyBlast(){faceAim();const h=handPoint(),d=dirTo(h,aim.x,aim.y,aim.z),sp=POWERS.energyBlast.speed;
    fireProj({kind:'blast',owner:P,x:h.x,y:h.y,z:h.z,vx:d[0]*sp,vy:d[1]*sp,vz:d[2]*sp,dmg:pstat('energyBlast','damage'),knock:pstat('energyBlast','knock'),r:0.5,life:2});
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
function tkGrab(){
  if(P.tk)return;const a=aim.actor;const R=pstat('telekinesis','range');
  if(!a||a.kind==='boss'||a.kind==='prop'||(a.kind==='vehicle'&&a.state!=='road'&&a.state!=='parked')){PS.telekinesis.flash=0.3;return;}
  if(Math.hypot(a.pos.x-P.pos.x,a.pos.y-P.pos.y,a.pos.z-P.pos.z)>R){PS.telekinesis.flash=0.3;feed('Too far','Telekinesis reaches '+Math.round(R)+' m');return;}
  if(!spend(POWERS.telekinesis.energy)){noEnergy('telekinesis');return;}
  P.tk={a};a.held=true;if(a.kind==='vehicle'){a.state='held';if(a.driver)ejectDriver(a);}if(a.kind==='human')a.air=false;
  faceAim();SFX.tone('sine',200,520,0.4,0.1);ringFx(a.pos.x,a.pos.y+1,a.pos.z,0.5,4,0.3,[.75,.5,1]);
}
function tkTick(dt){
  const a=P.tk.a;
  if(a.kind!=='vehicle'&&!a.alive&&!a.air&&a.kind!=='human'){tkDrop();return;}
  const cost=POWERS.telekinesis.energyPerSec*dt;if(P.en<cost){tkThrow();return;}P.en-=cost;P.lastSpend=time;
  const far=a.kind==='vehicle'?8:6.5;const hx=P.pos.x+camF.x*far,hy=P.pos.y+2.6+camF.y*far,hz=P.pos.z+camF.z*far;
  const k=damp(9,dt);a.pos.x+=(hx-a.pos.x)*k;a.pos.y+=(Math.max(hy,0.5)-a.pos.y)*k;a.pos.z+=(hz-a.pos.z)*k;
  if(a.vel)a.vel.set(0,0,0);a.stun=Math.max(a.stun||0,0.3);
  if(Math.random()<0.6)emit(a.pos.x+rr(-1.5,1.5),a.pos.y+rr(0,2),a.pos.z+rr(-1.5,1.5),0,rr(0,2),0,0.5,[.7,.45,1],1.1,0,0);
}
function tkThrow(){
  if(!P.tk)return;const a=P.tk.a;P.tk=null;a.held=false;faceAim();
  const sp=55,vx=camF.x*sp+P.vel.x*0.5,vy=camF.y*sp+6,vz=camF.z*sp+P.vel.z*0.5,dmg=pstat('telekinesis','throwDmg')*throwMul();
  if(a.kind==='vehicle'){a.state='thrown';a.vel.set(vx,vy,vz);a.sx=rr(-3,3);a.sy=rr(-2,2);a.sz=rr(-3,3);a.life=6;a.thrower=P;a.throwDmg=dmg;}
  else if(a.kind==='human'){a.air=true;a.vel.set(vx,vy,vz);a.tumble=rr(6,10);a.thrown={by:P,dmg};}
  else{a.vel.set(vx,vy,vz);a.thrown={by:P,dmg};a.stun=1;}
  SFX.whoosh();
}
function tkDrop(){if(!P.tk)return;const a=P.tk.a;P.tk=null;a.held=false;if(a.kind==='vehicle'){a.state='thrown';a.vel.set(0,0,0);a.sx=a.sy=a.sz=0;a.life=6;a.thrower=P;a.throwDmg=10;}else if(a.kind==='human'){a.air=true;a.vel.set(0,0,0);}}
function webPress(){
  if(!hasPower('webSwing')||!canAct())return;
  const R=pstat('webSwing','range'),h=handPoint();
  if(aim.actor&&aim.actor.kind!=='boss'&&aim.actor.kind!=='prop'){
    const a=aim.actor,c=center(a);if(Math.hypot(c.x-P.pos.x,c.y-P.pos.y,c.z-P.pos.z)>R)return;
    if(!spend(POWERS.webSwing.energy)){noEnergy();return;}
    tracer(h.x,h.y,h.z,c.x,c.y,c.z,[.95,.95,1],0.08,0.2);Damage.apply(P,a,5,'web',{stun:pstat('webSwing','stun')});
    if(a.kind==='human'&&a.alive){const dx=P.pos.x-a.pos.x,dz=P.pos.z-a.pos.z,l=Math.hypot(dx,dz)||1;a.air=true;a.vel.set(dx/l*Math.min(l,18),7,dz/l*Math.min(l,18));a.tumble=2;}
    SFX.tone('triangle',1300,500,0.12,0.08);return;
  }
  if(!aim.hitAny||!aim.surface)return;
  if(aim.ny>0.5&&aim.y<2)return;
  const d=Math.hypot(aim.x-h.x,aim.y-h.y,aim.z-h.z);if(d>R){PS.webSwing.flash=0.3;return;}
  if(!spend(POWERS.webSwing.energy)){noEnergy();return;}
  P.web={x:aim.x,y:aim.y,z:aim.z,L:d*0.9};P.flying=false;P.wall=null;P.charging=false;
  SFX.tone('triangle',1200,500,0.12,0.08);
}
function webRelease(){if(!P.web)return;P.web=null;if(!P.grounded){P.vel.mul(1.08);P.vel.y+=6;}}
function punch(){
  if(!canAct()||P.punchCd>0||P.tk)return;
  P.punchCd=CONFIG.punch.cooldown;if(time-P.punchT>0.8)P.punchN=0;P.punchN=P.punchN%3+1;P.punchT=time;P.punchArm=P.punchN===2?-1:1;
  let fx=camF.x,fy=P.flying?camF.y:0,fz=camF.z;const fl=Math.hypot(fx,fy,fz)||1;fx/=fl;fy/=fl;fz/=fl;
  P.heroYaw=Math.atan2(fx,fz);
  const am=P.alien?(ALIENS[P.alien.id].scale>2?3.5:1.6):1;
  const combo=P.punchN===3,dmg=CONFIG.punch.damage*strengthMul()*am*(combo?CONFIG.punch.comboMul:1);
  const cx=P.pos.x,cy=P.pos.y+1.3,cz=P.pos.z;let hits=0,hx=0,hy=0,hz=0;
  for(const a of actors){
    if(!a.alive||a.held)continue;const c=center(a);const dx=c.x-cx,dy=c.y-cy,dz=c.z-cz,d=Math.hypot(dx,dy*(a.ys||1),dz);
    if(d>CONFIG.punch.range+(a.radius||1)*0.7)continue;
    if((dx*fx+dy*fy+dz*fz)/(d||1)<0.3&&d>1.3)continue;
    Damage.apply(P,a,dmg,'punch',{knock:CONFIG.punch.knock*(combo?1.8:1)*Math.sqrt(strengthMul()),stun:0.3});hits++;hx=c.x;hy=c.y;hz=c.z;
  }
  hitProps(cx+fx*1.8,cy,cz+fz*1.8,1.4*am,P,10*am);
  if(hits){SFX.punch(1);addShake(combo?0.25:0.1);burst(hx,hy,hz,14,10,0.3,SPARK,0.9,0,3);ringFx(hx,hy,hz,0.3,combo?5:2.5,0.2,[1,.95,.8]);}
  else SFX.swish();
}
function stopAllPowers(){
  for(const k in PS)PS[k].holding=false;
  if(P.alien)P.alien.channel=false;
  P.flying=false;P.metal=false;P.shieldOn=false;P.shield=0;P.web=null;P.wall=null;P.charging=false;P.slam=false;P.speeding=false;
  if(P.tk)tkDrop();beam=null;SFX.setLaser(false);SFX.setWind(0);
}
function updatePowers(dt){
  for(const k in PS){const s=PS[k];if(s.cd>0)s.cd=Math.max(0,s.cd-dt);if(s.flash>0)s.flash-=dt;}
  if(P.punchCd>0)P.punchCd-=dt;
  beam=null;let lasering=false;
  if(!canAct()){for(const k in PS)PS[k].holding=false;}
  if(save.character)for(const id of save.character.abilities){
    const c=POWERS[id],s=PS[id];if(c.type!=='channel'||!s.holding)continue;
    const cost=c.energyPerSec*dt;if(P.en<cost){s.holding=false;noEnergy(id);continue;}
    P.en-=cost;P.lastSpend=time;
    if(id==='laserVision'){laserTick(dt);lasering=true;}else iceTick(dt);
  }
  if(ice){iceVisuals();if(!PS.iceCloud.holding){ice.t-=dt;if(ice.t<=0)ice=null;}}
  SFX.setLaser(lasering);
  if(P.tk)tkTick(dt);
  const drainT=(n)=>{P.en=Math.max(0,P.en-n*dt);if(CONFIG.energy.togglesBlockRegen)P.lastSpend=time;return P.en>0;};
  if(P.flying&&!drainT(pstat('flight','drain'))){P.flying=false;feed('Out of energy','You stopped flying');}
  if(P.metal&&!drainT(POWERS.metalSkin.drain)){P.metal=false;feed('Out of energy','Metal Skin wore off');}
  if(P.speeding&&!drainT(pstat('superSpeed','drain')))P.speeding=false;
  if(time-P.lastSpend>CONFIG.energy.delay)P.en=Math.min(maxEn(),P.en+enRegen()*dt);
  if(time-P.lastHit>CONFIG.health.healDelay)P.hp=Math.min(maxHp(),P.hp+hpRegen()*dt);
  P.heat=Math.max(0,P.heat-dt*0.35);
  if(P.stun>0)P.stun-=dt;
}
