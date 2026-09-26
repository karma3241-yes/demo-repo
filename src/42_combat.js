// ================================================================
// Melee combat: lock-on, 4-hit chains, finishers, dash, wall slams
// ================================================================
// Battlegrounds-style: click four times for a chain. Hits 1-3 stun and keep the target
// close; hit 4 is a finisher: a launch (default), an uppercut (hold Space) or a spike
// (while airborne). Launched targets crater walls, the ground, cars and street props.
const COMBAT={chain:1.0,gap:0.26,endlag:0.65,reach:3.6,lunge:9,stun:0.75,finStun:1.3,finMul:2.3,launch:40,upper:34,spike:48,
  dashSpeed:40,dashTime:0.24,dashCd:1.1,iframe:0.3,lockRange:110,slamMin:15};
let lockT=null,comboN=0,comboT=-9,dashCd=0,airDash=true;
const lockMark=(()=>{const e=document.createElement('div');e.id='lockmark';e.hidden=true;return e;})();
const comboEl=(()=>{const e=document.createElement('div');e.id='combo';e.hidden=true;return e;})();
function lockable(a){
  if(!a||!a.alive||a.held||a===P)return false;
  if(a.kind==='remote')return !(a.flags&FLAG.invis)&&!(a.flags&FLAG.dead);
  return a.kind==='human'||a.kind==='drone'||a.kind==='rival'||a.kind==='boss'||a.kind==='heli';
}
function lockValid(a){if(!lockable(a))return false;const c=center(a);return Math.hypot(c.x-P.pos.x,c.y-P.pos.y,c.z-P.pos.z)<COMBAT.lockRange*1.3;}
function pickLock(){
  let best=null,bs=1e9;const ox=camPos.x,oy=camPos.y,oz=camPos.z;
  for(const a of actors){if(!lockable(a)||a.hidden)continue;const c=center(a);const dx=c.x-ox,dy=c.y-oy,dz=c.z-oz,d=Math.hypot(dx,dy,dz)||1;
    const dot=(dx*camF.x+dy*camF.y+dz*camF.z)/d;if(dot<0.55)continue;const dp=Math.hypot(c.x-P.pos.x,c.z-P.pos.z);if(dp>COMBAT.lockRange)continue;
    // favour whoever is closest to the crosshair, then distance; hostile targets first
    const hostile=a.kind==='heli'||a.kind==='remote'||a.kind==='boss'||a.kind==='rival'||a.kind==='drone'||(a.kind==='human'&&(a.role!=='civilian'||a.target===P));
    const s=(1-dot)*400+dp*0.6+(hostile?0:60);if(s<bs){bs=s;best=a;}}
  return best;
}
function lockToggle(){
  if(state!=='play'||P.dead||P.car)return;
  if(lockT){lockT=null;SFX.tone('sine',700,400,0.08,0.05);return;}
  lockT=pickLock();if(lockT){SFX.tone('sine',500,900,0.08,0.06);if(!save.guide.lock){save.guide.lock=true;toast('Locked on','Your camera and attacks now follow this target. Z again to let go.','cyan');}}
  else feed('Nothing to lock on to','Face a target within '+COMBAT.lockRange+' m');
}
function updateLock(dt){
  if(lockT&&(!lockValid(lockT)||P.car||P.dead))lockT=null;
  if(!lockT)return;
  const c=center(lockT),dx=c.x-P.pos.x,dy=c.y-(P.pos.y+1.8),dz=c.z-P.pos.z,h=Math.hypot(dx,dz)||1;
  const wantYaw=Math.atan2(-dx,-dz),wantPitch=clamp(Math.atan2(dy,h)-0.12,-1.1,0.9),k=damp(time-lookT<0.25?3:9,dt);
  P.yaw=angLerp(P.yaw,wantYaw,k);P.pitch=lerp(P.pitch,wantPitch,k);
}
function drawLockMark(){
  if(!lockMark.parentNode){hud.root.appendChild(lockMark);hud.root.appendChild(comboEl);}
  if(!lockT||state!=='play'){lockMark.hidden=true;}
  else{const c=center(lockT);const p=project(c.x,c.y,c.z);if(!p)lockMark.hidden=true;else{lockMark.hidden=false;lockMark.style.transform=`translate(${p[0].toFixed(1)}px,${p[1].toFixed(1)}px) translate(-50%,-50%) rotate(${(time*90%360).toFixed(0)}deg)`;}}
  const show=comboN>0&&time-comboT<COMBAT.chain;comboEl.hidden=!show;if(show){const t=comboN+' HIT'+(comboN>1?'S':'');if(comboEl.textContent!==t){comboEl.textContent=t;comboEl.classList.remove('pop');void comboEl.offsetWidth;comboEl.classList.add('pop');}}
}
// ---- the chain ----
function meleeTargets(fx,fy,fz,reach){
  const out=[];const cx=P.pos.x,cy=P.pos.y+1.3,cz=P.pos.z;
  if(lockT&&lockT.alive){const c=center(lockT);if(Math.hypot(c.x-cx,(c.y-cy)*0.7,c.z-cz)<reach+(lockT.radius||1)+0.8)out.push(lockT);}
  for(const a of actors){
    if(!a.alive||a.held||a===lockT||a.kind==='prop')continue;const c=center(a);const dx=c.x-cx,dy=c.y-cy,dz=c.z-cz,d=Math.hypot(dx,dy*(a.ys||1),dz);
    if(d>reach+(a.radius||1)*0.7)continue;if((dx*fx+dy*fy+dz*fz)/(d||1)<0.3&&d>1.3)continue;out.push(a);
  }
  return out;
}
function punch(){
  if(!canAct()||P.punchCd>0||P.tk||P.car)return;
  if(time-comboT>COMBAT.chain||comboN>=4)comboN=0;
  comboN++;comboT=time;const fin=comboN===4;P.punchCd=fin?COMBAT.endlag:COMBAT.gap;
  P.punchN=comboN;P.punchT=time;P.punchArm=comboN%2?1:-1;
  const air=!P.grounded&&!P.flying&&!P.web,upper=fin&&!air&&(keys.Space||touchJump()),spike=fin&&(air||(P.flying&&P.pitch<-0.35));
  P.punchKind=fin?(upper?'up':spike?'down':'fin'):comboN===3?'kick':'jab';
  // aim: the lock target, else the camera direction
  let fx=camF.x,fy=P.flying?camF.y:0,fz=camF.z;
  if(lockT&&lockT.alive){const c=center(lockT);fx=c.x-P.pos.x;fy=P.flying||air?c.y-(P.pos.y+1.3):0;fz=c.z-P.pos.z;}
  const fl=Math.hypot(fx,fy,fz)||1;fx/=fl;fy/=fl;fz/=fl;P.heroYaw=Math.atan2(fx,fz);
  // close the gap to a locked target (lunge), like a battlegrounds M1
  if(lockT&&lockT.alive){const c=center(lockT),d=Math.hypot(c.x-P.pos.x,c.z-P.pos.z);if(d>COMBAT.reach&&d<COMBAT.lunge+COMBAT.reach){const s=Math.min(34,(d-COMBAT.reach+1)*6);
    P.vel.x=fx*s;P.vel.z=fz*s;if(air||P.flying)P.vel.y=fy*s;P.burstT=0.14;}}
  if(air){P.vel.y=Math.max(P.vel.y,fin?4:2.5);P.floatT=fin?0.2:0.45;}
  const AL=P.alien?ALIENS[P.alien.id]:null,am=AL?(AL.scale>2?3.5:1.6):1;
  const dmg=CONFIG.punch.damage*strengthMul()*am*speedPunchMul()*(fin?COMBAT.finMul:comboN===3?1.25:1);
  const hits=meleeTargets(fx,fy,fz,COMBAT.reach*(AL?Math.max(1,AL.scale*0.8):1));let hx=0,hy=0,hz=0;
  for(const a of hits){
    const c=center(a);hx=c.x;hy=c.y;hz=c.z;const dx=c.x-P.pos.x,dz=c.z-P.pos.z,l=Math.hypot(dx,dz)||1,ux=dx/l,uz=dz/l;
    const opt={stun:fin?COMBAT.finStun:COMBAT.stun,flung:fin,combo:comboN};
    if(fin){const s=Math.sqrt(strengthMul())*am;
      if(upper)opt.kv=[ux*3,COMBAT.upper*Math.min(1.4,s),uz*3];
      else if(spike)opt.kv=[ux*5,-COMBAT.spike,uz*5];
      else opt.kv=[ux*COMBAT.launch*Math.min(1.6,s),9,uz*COMBAT.launch*Math.min(1.6,s)];
      if(upper)opt.apex=true;}
    else if(a.air||(a.kind==='rival'&&a.pos.y>groundY(a.pos.x,a.pos.z,a.pos.y+1)+1)||(a.kind==='remote'&&!(a.flags&FLAG.fly)&&a.pos.y>1.5)){opt.kv=[ux*2+P.vel.x*0.9,Math.max(2.5,P.vel.y+1),uz*2+P.vel.z*0.9];opt.float=0.6;}
    else opt.nudge=[ux*0.5,uz*0.5];
    if(a.kind==='vehicle'){hitVehicle(a,dmg,fin,ux,uz,opt.kv);continue;}
    Damage.apply(P,a,dmg,'punch',opt);
  }
  hitProps(P.pos.x+fx*1.8,P.pos.y+1.3,P.pos.z+fz*1.8,(fin?2.2:1.4)*am,P,(fin?22:10)*am);
  if(hits.length){SFX.punch(fin?1.3:1);addShake(fin?0.4:0.1);burst(hx,hy,hz,fin?30:14,fin?18:10,0.35,SPARK,fin?1.3:0.9,0,3);ringFx(hx,hy,hz,0.3,fin?7:2.5,0.22,[1,.95,.8]);
    if(fin){slowT=Math.max(slowT,0.09);ringFx(hx,hy,hz,0.5,10,0.3,[1,1,1],[fx,fy,fz]);}}
  else{SFX.swish();
    if(fin){const t=rayCity(P.pos.x,P.pos.y+1.3,P.pos.z,fx,fy,fz,2.8);if(t<2.8){crater(P.pos.x+fx*t,P.pos.y+1.3+fy*t,P.pos.z+fz*t,RAYHIT.nx,RAYHIT.ny,RAYHIT.nz,1.8*am,RAYHIT.b&&RAYHIT.b.col);SFX.punch(1.3);addShake(0.3);}comboN=0;}}
}
const touchJump=()=>!!keys.Space;
// finishers also send cars flying (anything but the armored truck)
function hitVehicle(v,dmg,fin,ux,uz,kv){
  if(v.net){Damage.apply(P,v,dmg*1.2,'punch');if(fin&&v.vtype!=='truck')WS.sendHit(v,0,'punch',{fling:kv||[ux*30,8,uz*30]});return;}
  Damage.apply(P,v,dmg*1.2,'punch');if(!fin||!v.alive||v.vtype==='truck'||v===P.car)return;
  if(v.driver)ejectDriver(v);v.state='thrown';const k=kv||[ux*30,8,uz*30];v.vel.set(k[0]*0.7,Math.max(6,k[1]*0.6),k[2]*0.7);v.sx=rr(-3,3);v.sy=rr(-2,2);v.sz=rr(-3,3);v.life=4;v.thrower=P;v.throwDmg=40*strengthMul();
  SFX.crash(1);addShake(0.4);
}
// ---- dash (X): a burst with a moment of invulnerability ----
function dashPress(){
  if(!canAct()||P.car||dashCd>0||P.wall)return;
  if(!P.grounded&&!P.flying&&!P.web){if(!airDash)return;airDash=false;}
  const fwdX=-Math.sin(P.yaw),fwdZ=-Math.cos(P.yaw),rX=Math.cos(P.yaw),rZ=-Math.sin(P.yaw);
  const inF=clamp((keys.KeyW?1:0)-(keys.KeyS?1:0)+touchIn.y,-1,1),inR=clamp((keys.KeyD?1:0)-(keys.KeyA?1:0)+touchIn.x,-1,1);
  let dx=fwdX*inF+rX*inR,dz=fwdZ*inF+rZ*inR;if(Math.hypot(dx,dz)<0.1){dx=fwdX;dz=fwdZ;}const l=Math.hypot(dx,dz);dx/=l;dz/=l;
  const s=COMBAT.dashSpeed*(P.speeding?1.4:1);P.vel.x=dx*s;P.vel.z=dz*s;if(!P.flying)P.vel.y=Math.max(P.vel.y,P.grounded?2:4);
  P.burstT=COMBAT.dashTime;P.iframeT=COMBAT.iframe;dashCd=COMBAT.dashCd;P.web=null;
  SFX.whoosh();for(let i=0;i<14;i++)emit(P.pos.x,P.pos.y+rr(0.3,2.2),P.pos.z,-dx*rr(4,10),rr(0,2),-dz*rr(4,10),0.35,[.85,.9,1],1.2,0,2);
}
function updateCombat(dt){
  updateCharge(dt);
  if(dashCd>0)dashCd-=dt;if(P.iframeT>0)P.iframeT-=dt;if(P.grounded||P.wall||P.web||P.flying)airDash=true;
  updateLock(dt);
}
// ---- impacts: launched bodies crater whatever they hit ----
function crater(x,y,z,nx,ny,nz,r,col){
  addScorch(x,y,z,r,nx,ny,nz,true);col=col||[.55,.55,.55];
  for(let i=0;i<Math.round(4+r*3);i++){const s=rr(0.25,0.7)*Math.min(2,r*0.5);spawnPiece(x+nx*0.3+rr(-r,r)*0.4,y+ny*0.3+rr(-r,r)*0.4,z+nz*0.3+rr(-r,r)*0.4,MESH.box,s,s*rr(0.5,1),s,col,nx*rr(4,12)+rr(-5,5),ny*rr(4,10)+rr(2,8),nz*rr(4,12)+rr(-5,5),10);}
  burst(x,y,z,Math.round(20+r*10),10+r*4,0.9,DUST,2.4,-2,2);ringFx(x,y,z,0.5,r*3,0.35,[1,.95,.85],[nx,ny,nz]);
  const v=SFX.vol(x,y,z);SFX.boom(v*Math.min(1,0.3+r*0.15),1.2);addShake(Math.min(0.6,r*0.12)*v);scare(x,z,25);
  const b=inBuilding(x-nx*0.6,y,z-nz*0.6,0.8);if(b&&b.bld)damageBuilding(b.bld,r*r*30,x,y,z,-nx,-nz);if(b&&b.y1>3){breakWindowAt(b,x-nx*0.3,y,z-nz*0.3);if(r>2)breakWindowAt(b,x-nx*0.3,y+4,z-nz*0.3);}
  hitProps(x,y,z,r,null,12);MP.world&&MP.world.destroyed('cr',{x,y,z,nx,ny,nz,r});
}
function slamWall(a,w,spd,pv){
  if(!w||!w.b)return;const src=a.flungBy||null;
  const x=a.pos.x+(w.nx||0)*0.1,z=a.pos.z+(w.nz||0)*0.1,y=a.pos.y+1.1;
  // hard enough and the whole building gives way; the body keeps flying through it
  if(damageBuilding(w.b.bld,spd*spd*0.05*(1+(a.heavy||0)*3),x,y,z,-(w.nx||0),-(w.nz||0))){if(pv)a.vel.set(pv[0]*0.8,pv[1],pv[2]*0.8);if(a.alive)Damage.apply(src,a,spd*0.5,'slam');return;}
  crater(x,y,z,w.nx||0,0,w.nz||0,clamp(spd*0.07,1.2,4),w.b.col||[.5,.5,.52]);
  if(a.alive)Damage.apply(src,a,spd*0.9,'slam',{stun:1.2});
  a.vel.set((w.nx||0)*3,-3,(w.nz||0)*3);a.flungT=-9;
}
function slamGround(a,spd){
  const src=a.flungBy||null;crater(a.pos.x,a.pos.y+0.05,a.pos.z,0,1,0,clamp(spd*0.06,1.2,4),[.45,.44,.42]);
  if(a.alive)Damage.apply(src,a,spd*0.7,'slam',{stun:1.2});a.flungT=-9;
}
// flung bodies smash into cars and street furniture on the way
function flungSweep(a,spd){
  if(spd<COMBAT.slamMin)return;hitProps(a.pos.x,a.pos.y+1,a.pos.z,1.2,a.flungBy||null,spd*0.6);
  for(const v of vehicles){if(!v.alive||v.state==='thrown'||v.state==='wreckAir'||v===a)continue;
    if(Math.abs(v.pos.x-a.pos.x)<v.hl+0.6&&Math.abs(v.pos.z-a.pos.z)<v.hl+0.6&&a.pos.y<v.pos.y+2.6){
      Damage.apply(a.flungBy||null,v,spd*1.3,'slam');if(a.alive)Damage.apply(a.flungBy||null,a,spd*0.5,'slam');v.flash=1;
      burst(a.pos.x,a.pos.y+1,a.pos.z,24,12,0.5,SPARK,1,15,1);SFX.crash(SFX.vol(v.pos.x,1,v.pos.z));addShake(0.25);
      if(v.state==='road'||v.state==='chase'){v.state='parked';v.spd=0;v.parkT=8;}
      a.vel.mul(0.25);a.flungT=-9;return;}}
}
// ---- charged punch: hold click while flying at a locked target ----
// Charge up, rocket into them and send them flying hundreds of meters (Invincible-style).
const canChargePunch=()=>!!(lockT&&lockT.alive&&!P.car&&(P.flying||(P.alien&&ALIENS[P.alien.id].flies)));
function chargeStart(){if(!canAct()||!canChargePunch()||P.cp||P.rush)return false;P.cp={t:0};SFX.tone('sawtooth',110,520,1.2,0.05);return true;}
function chargeRelease(){const c=P.cp;if(!c)return;P.cp=null;if(!canAct()||!lockT||!lockT.alive)return;P.rush={t:0,k:clamp(c.t/1.2,0.2,1),tg:lockT};SFX.whoosh();addShake(0.15);}
function updateCharge(dt){
  if(P.cp){P.cp.t+=dt;if(!canChargePunch()||!canAct()){P.cp=null;}else{const h=handPoint(),k=Math.min(1,P.cp.t/1.2);P.vel.mul(1-2.5*dt);
    if(Math.random()<0.4+k*0.6){const a=rr(0,TAU),r=rr(1.5,3);emit(h.x+Math.cos(a)*r,h.y+rr(-1,1),h.z+Math.sin(a)*r,-Math.cos(a)*r*3,0,-Math.sin(a)*r*3,0.3,[1,.9,.6],0.8+k,0,0);}}}
  const R=P.rush;if(!R)return;R.t+=dt;const t=R.tg;
  if(!t||!t.alive||R.t>1.3||!canAct()){P.rush=null;return;}
  const c=center(t),dx=c.x-P.pos.x,dy=c.y-(P.pos.y+1.3),dz=c.z-P.pos.z,d=Math.hypot(dx,dy,dz)||1;let ux=dx/d,uy=dy/d,uz=dz/d,ux0,uy0,uz0;
  const s=110+80*R.k;P.vel.set(ux*s,uy*s,uz*s);P.burstT=0.05;P.heroYaw=Math.atan2(ux,uz);
  if(d>2)R.dir=[ux,uy,uz]; // launch along the approach, not whatever angle you overshoot at
  if(Math.random()<0.9)emit(P.pos.x,P.pos.y+1.3,P.pos.z,0,0,0,0.4,[.9,.95,1],1.6,0,0);
  if(d>3.4)return;
  // impact
  P.rush=null;if(R.dir){[ux0,uy0,uz0]=R.dir;const hl=Math.hypot(ux0,uz0)||1;ux=ux0/hl*Math.cos(Math.asin(clamp(uy0,-0.7,0.7)));uz=uz0/hl*Math.cos(Math.asin(clamp(uy0,-0.7,0.7)));uy=clamp(uy0,-0.7,0.7);}const k=R.k,AL=P.alien?ALIENS[P.alien.id]:null,am=AL?(AL.scale>2?3:1.5):1;
  const dmg=CONFIG.punch.damage*strengthMul()*(3+9*k)*am,sp=(70+130*k)*Math.min(1.5,Math.sqrt(strengthMul()));
  Damage.apply(P,t,dmg,'punch',{kv:[ux*sp,uy*sp*0.6+8+14*k,uz*sp],stun:2.5,flung:true,heavy:k});
  P.vel.set(-ux*6,2,-uz*6);P.burstT=0.15;P.punchT=time;P.punchKind='fin';P.punchArm=1;comboN=0;
  flashWhite=Math.max(flashWhite,0.2*k);slowT=Math.max(slowT,0.12+0.2*k);addShake(0.5+0.7*k);SFX.boom(1,0.8+k*0.6);SFX.punch(1.4);
  ringFx(c.x,c.y,c.z,0.5,12+18*k,0.35,[1,1,1],[ux,uy,uz]);ringFx(c.x,c.y,c.z,0.5,6+8*k,0.25,[1,.8,.4],[ux,uy,uz]);
  burst(c.x,c.y,c.z,40+60*k,20+20*k,0.5,SPARK,1.6,0,2);hitProps(c.x,c.y,c.z,3,P,40);
}
