// ================================================================
// NPCs: people, drones, vehicles, rival supers, shops
// ================================================================
const humans=[],drones=[],vehicles=[],rivals=[],props=[],crimes=[],gangs=[];
let boss=null;
const pick=a=>a[(Math.random()*a.length)|0];
function removeFrom(list,x){const i=list.indexOf(x);if(i>=0)list.splice(i,1);}
function removeActor(a){removeFrom(actors,a);removeFrom(helis,a);removeFrom(humans,a);removeFrom(drones,a);removeFrom(vehicles,a);removeFrom(rivals,a);if(P.tk){if(P.tk.a===a)P.tk.a=null;P.tk.more=P.tk.more.filter(m=>m!==a);}}
const d2h=(a,b)=>{const dx=a.pos.x-b.pos.x,dz=a.pos.z-b.pos.z;return dx*dx+dz*dz;};
const c4=h=>[...hex(h),1];
const SKINS=['#f1c7a5','#d9a27a','#a8744f','#6e4a33','#e8b48f'].map(c4);
const CIV_SHIRT=['#d94f3d','#3d7dd9','#e0c23a','#3aa66b','#8a4fd9','#ececec','#2b2b33','#f08a3c','#48b6c9'].map(c4);
const CIV_PANTS=['#2a3346','#3b3b3b','#5a4632','#1d2433','#6b6f78','#7a5c3e'].map(c4);
const LOOKS={
  civilian:()=>({shirt:pick(CIV_SHIRT),pants:pick(CIV_PANTS),skin:pick(SKINS),hat:null}),
  thug:()=>({shirt:pick(['#26262c','#3a1e1e','#1e2a22','#33302a'].map(c4)),pants:pick(['#1b1b20','#2a2a30','#34373d'].map(c4)),skin:pick(SKINS),hat:c4('#141417'),mask:true}),
  boss:()=>({shirt:c4('#4b1f6b'),pants:c4('#1d1d24'),skin:pick(SKINS),hat:c4('#101012'),gold:true}),
  police:()=>({shirt:c4('#1d2f5e'),pants:c4('#141c33'),skin:pick(SKINS),hat:c4('#141c33'),badge:true}),
};
function spawnHuman(role,x,z,opt={}){
  const c=NPCS[role];
  const h={kind:'human',role,faction:role==='civilian'?'civilian':role==='police'?'police':'criminal',alive:true,hp:c.hp,maxHp:c.hp,
    pos:new V3(x,groundY(x,z,2),z),vel:new V3(),yaw:rr(0,TAU),state:(role==='civilian'||role==='police')?'walk':'idle',st:0,target:null,grudge:null,grudgeT:-99,
    path:opt.path||pathFor(x,z),walk:c.walk*rr(0.85,1.15),run:c.run*rr(0.9,1.1),look:LOOKS[role](),phase:rr(0,TAU),air:false,tumble:0,rx:0,moving:0,
    stun:0,slow:0,slowT:0,burn:0,burnDps:0,flash:0,held:false,hidden:false,thrown:null,deadT:6,
    gun:role==='police'||role==='boss'||(role==='thug'&&Math.random()<0.5),fireCd:rr(0.5,1.5),meleeCd:0,blastCd:3,
    crime:opt.crime||null,home:opt.home||null,gang:opt.gang||null,scanT:rr(0,0.5),radius:0.55,cy:1.1,ys:0.6,armsUp:0,punchT:-9,goal:null,wanted:0,fx:0,fz:0};
  if(role==='boss')h.name='Boss '+pick(['Vince','Marla','Knuckles','Silk','Duke','Ruby']);
  h.onDefeat=()=>{h.deadT=6;if(!h.air){h.air=true;h.vel.set(0,3,0);h.tumble=rr(3,5);}startRagdoll(h,h.vel.x,h.vel.y,h.vel.z);scare(h.pos.x,h.pos.z,18);};
  h.onHit=src=>{if(h.role==='civilian'){if(src)npcFlee(h,src.pos.x,src.pos.z);}else if(src&&src!==h)h.target=src;};
  humans.push(h);actors.push(h);return h;
}
function npcFlee(h,x,z){if(h.role!=='civilian'||!h.alive||h.state==='victim'&&h.crime)return;h.state='flee';h.fx=x;h.fz=z;h.st=rr(4,7);}
function scare(x,z,r){for(const h of humans)if(h.alive&&h.role==='civilian'&&Math.abs(h.pos.x-x)<r&&Math.abs(h.pos.z-z)<r)npcFlee(h,x,z);}
function validTarget(t){if(t===P)return !P.dead&&state==='play';if(t&&t.kind==='remote')return WS.host&&t.alive&&MP.peers.has(t.peer);return !!t&&t.alive&&!t.held;}
function wantsToFight(h,t){
  if(t===P&&P.invisible>0)return false;
  if(t===P){if(P.dead||state!=='play')return false;const f=playerFaction();
    if(h.role==='police')return f==='villain'||P.heat>0;
    if(h.faction==='criminal')return f==='hero';return false;}
  if(t.kind==='remote'){if(!WS.host||!t.alive)return false;if(h.role==='police')return t.faction==='villain'||!!(t.flags&FLAG.wanted);return h.faction==='criminal'&&t.faction==='hero';}
  if(t.kind==='rival')return h.role==='police'?t.faction==='villain':h.faction==='criminal'?t.faction==='hero':false;
  if(h.role==='police'&&t.kind==='human')return t.faction==='criminal'&&t.wanted>0;
  if(h.role==='police'&&t.kind==='drone')return !!t.crime;
  return false;
}
function npcScan(h){
  if(h.role==='civilian'){
    if(!P.dead&&state==='play'&&playerFaction()==='villain'&&d2h(h,P)<196&&h.state!=='flee')npcFlee(h,P.pos.x,P.pos.z);
    return;
  }
  if(h.target&&validTarget(h.target))return;
  h.target=null;
  if(h.grudge&&time-h.grudgeT<25&&validTarget(h.grudge)){h.target=h.grudge;return;}
  const sight=NPCS[h.role].sight||30;let best=null,bd=sight*sight;
  if(wantsToFight(h,P)){const d=d2h(h,P);if(d<bd){bd=d;best=P;}}
  for(const r of rivals)if(r.alive&&wantsToFight(h,r)){const d=d2h(h,r);if(d<bd){bd=d;best=r;}}
  if(WS.host)for(const r of MP.peers.values())if(wantsToFight(h,r)){const d=d2h(h,r);if(d<bd){bd=d;best=r;}}
  if(h.role==='police'){
    for(const o of humans)if(o.alive&&!o.held&&wantsToFight(h,o)){const d=d2h(h,o);if(d<bd){bd=d;best=o;}}
    for(const o of drones)if(o.alive&&wantsToFight(h,o)){const d=d2h(h,o);if(d<bd){bd=d;best=o;}}
  }
  h.target=best;
}
function stepHuman(h,dx,dz,speed,dt){
  const s=speed*(1-(h.slow||0));h.pos.x+=dx*s*dt;h.pos.z+=dz*s*dt;
  collideBody(h.pos,h.vel,h.pos.y,0.45,1.9);h.pos.y=groundY(h.pos.x,h.pos.z,h.pos.y+0.5);
  h.pos.x=clamp(h.pos.x,-LIMIT,LIMIT);h.pos.z=clamp(h.pos.z,-LIMIT,LIMIT);
  h.yaw=angLerp(h.yaw,Math.atan2(dx,dz),damp(10,dt));h.moving=s;h.phase+=s*dt*2.2;
}
function moveTo(h,x,z,speed,dt){const dx=x-h.pos.x,dz=z-h.pos.z,l=Math.hypot(dx,dz);if(l<0.7){h.moving=0;return true;}stepHuman(h,dx/l,dz/l,Math.min(speed,l/dt),dt);return false;}
function losClear(ax,ay,az,bx,by,bz){const dx=bx-ax,dy=by-ay,dz=bz-az,l=Math.hypot(dx,dy,dz)||1;return rayCity(ax,ay,az,dx/l,dy/l,dz/l,l)>=l-0.5;}
function npcShoot(h,t,dmg){
  const s=Math.sin(h.yaw),c=Math.cos(h.yaw);const ox=h.pos.x+s*0.5,oy=h.pos.y+1.4,oz=h.pos.z+c*0.5;
  const tc=center(t),tx=tc.x,ty=tc.y,tz=tc.z;const d=Math.hypot(tx-ox,ty-oy,tz-oz);
  const tv=t.vel?Math.hypot(t.vel.x,t.vel.y,t.vel.z):0;
  const hit=Math.random()<clamp(0.78-d/70-tv/90,0.08,0.8);
  const ex=tx+(hit?rr(-.3,.3):rr(-3,3)),ey=ty+(hit?rr(-.3,.3):rr(-2,2)),ez=tz+(hit?rr(-.3,.3):rr(-3,3));
  const dx=ex-ox,dy=ey-oy,dz=ez-oz,L=Math.hypot(dx,dy,dz)||1;const tb=rayCity(ox,oy,oz,dx/L,dy/L,dz/L,L),end=Math.min(tb,L);
  tracer(ox,oy,oz,ox+dx/L*end,oy+dy/L*end,oz+dz/L*end,[1,.85,.5],0.05,0.06);
  emit(ox,oy,oz,0,0,0,0.06,[1,.85,.4],1.2,0,0);SFX.gun(SFX.vol(ox,oy,oz));scare(ox,oz,22);
  h.shotN=(h.shotN||0)+1;if(hit&&tb>=L)Damage.apply(h,t,dmg,'bullet');
}
function npcCombat(h,dt){
  const t=h.target;
  if(!validTarget(t)){h.target=null;if(h.home){h.state='goto';h.goal=h.home;h.onArrive='idle';}else{h.path=pathFor(h.pos.x,h.pos.z);h.state='return';}return;}
  const c=NPCS[h.role],tc=center(t),tx=tc.x,ty=tc.y,tz=tc.z;
  const dx=tx-h.pos.x,dz=tz-h.pos.z,d=Math.hypot(dx,dz)||1,alt=ty-(h.pos.y+1.1);
  if(d>70){h.target=null;return;}
  h.yaw=angLerp(h.yaw,Math.atan2(dx,dz),damp(10,dt));h.moving=0;
  if(h.gun){
    const want=h.role==='boss'?14:16;
    if(d>want+4)stepHuman(h,dx/d,dz/d,h.run,dt);else if(d<want-8)stepHuman(h,-dx/d,-dz/d,h.walk*2,dt);
    h.fireCd-=dt;
    if(h.fireCd<=0&&d<c.range*1.3+Math.max(0,alt)*0.5){h.fireCd=h.role==='police'?rr(0.8,1.3):rr(0.9,1.6);
      if(losClear(h.pos.x,h.pos.y+1.4,h.pos.z,tx,ty,tz)){npcShoot(h,t,c.gun);h.punchT=time;}}
    if(h.role==='boss'){h.blastCd-=dt;if(h.blastCd<=0&&d<40){h.blastCd=rr(2.5,4);const o={x:h.pos.x,y:h.pos.y+1.5,z:h.pos.z};const v=dirTo(o,tx,ty,tz);
      fireProj({kind:'blast',owner:h,x:o.x,y:o.y,z:o.z,vx:v[0]*60,vy:v[1]*60,vz:v[2]*60,dmg:c.blast,knock:12,r:0.5,life:2});SFX.tone('square',600,1200,0.12,0.06*SFX.vol(o.x,o.y,o.z));}}
  }else{
    if(alt>3.5){if(d<6)stepHuman(h,-dx/d,-dz/d,h.walk,dt);return;}
    if(d>1.7)stepHuman(h,dx/d,dz/d,h.run,dt);
    h.meleeCd-=dt;
    if(d<2.4&&h.meleeCd<=0){h.meleeCd=rr(0.8,1.2);h.punchT=time;Damage.apply(h,t,c.melee,'punch',{knock:5});SFX.punch(SFX.vol(h.pos.x,h.pos.y,h.pos.z)*0.5);}
  }
}
function airGrav(a,g,dt){
  if(a.apexT&&time-a.apexT<2&&a.vel.y<0){a.apexT=0;a.floatT=0.9;}
  if(a.floatT>0){a.floatT-=dt;a.vel.y-=g*0.1*dt;a.vel.x*=1-3*dt;a.vel.z*=1-3*dt;if(a.vel.y<-3)a.vel.y=-3;}else a.vel.y-=g*dt;
}
function humanAir(h,dt){
  const prevY=h.pos.y;airGrav(h,40,dt);h.pos.addS(h.vel,dt);h.rx+=h.tumble*dt;
  const flung=h.flungT&&time-h.flungT<2.5,spd=flung?Math.hypot(h.vel.x,h.vel.y,h.vel.z):0;if(flung)flungSweep(h,spd);
  if(h.thrown){
    for(const a of actors){if(a===h||!a.alive||a.kind==='prop'||a.kind==='vehicle'||a.held)continue;const c=center(a);
      if(Math.hypot(c.x-h.pos.x,c.y-(h.pos.y+1),c.z-h.pos.z)<(a.radius||1)+0.8){Damage.apply(h.thrown.by,a,h.thrown.dmg,'throw',{knock:14});Damage.apply(h.thrown.by,h,h.thrown.dmg,'throw');h.thrown=null;break;}}
  }
  const vyb=h.vel.y,pv=[h.vel.x,h.vel.y,h.vel.z];const col=collideBody(h.pos,h.vel,prevY,0.45,1.9);
  if(flung&&col.wall&&spd>COMBAT.slamMin)slamWall(h,col.wall,spd,pv);
  else if(flung&&col.grounded&&vyb<-COMBAT.slamMin){slamGround(h,-vyb);h.air=false;h.vel.set(0,0,0);if(h.alive)h.stun=1.2;return;}
  if(col.wall&&h.thrown){Damage.apply(h.thrown.by,h,h.thrown.dmg,'throw');h.thrown=null;burst(h.pos.x,h.pos.y+1,h.pos.z,12,8,0.5,DUST,1.6,-2,2);}
  if(col.grounded){
    if(h.alive&&vyb<-24)Damage.apply(h.thrown?h.thrown.by:null,h,(-vyb-22)*1.5,'fall');
    if(h.alive&&h.thrown)Damage.apply(h.thrown.by,h,h.thrown.dmg*0.6,'throw');
    h.air=false;h.thrown=null;h.vel.set(0,0,0);if(h.alive)h.stun=0.9;
    burst(h.pos.x,h.pos.y+0.3,h.pos.z,8,6,0.5,DUST,1.4,-2,2);
  }
  if(h.pos.y<-6)removeActor(h);
}
function updateHuman(h,dt){
  if(h.flash>0)h.flash=Math.max(0,h.flash-dt*5);
  if(h.slowT>0){h.slowT-=dt;if(h.slowT<=0)h.slow=0;}
  if(h.burn>0&&h.alive){h.burn-=dt;Damage.apply(h.burnSrc,h,h.burnDps*dt,'burn');if(Math.random()<0.5)emit(h.pos.x+rr(-.4,.4),h.pos.y+rr(0.5,1.8),h.pos.z+rr(-.4,.4),0,rr(2,4),0,0.5,FIRE[(Math.random()*3)|0],1.2,-2,1);if(h.role==='civilian'&&h.state!=='flee')npcFlee(h,h.pos.x+rr(-1,1),h.pos.z+rr(-1,1));}
  if(h.held)return;
  if(h.air){humanAir(h,dt);return;}
  if(!h.alive){h.rx=lerp(h.rx,Math.PI/2*(h.tumble<0?-1:1),damp(8,dt));h.deadT-=dt;if(h.deadT<1.5)h.pos.y-=dt*0.8;if(h.deadT<=0)removeActor(h);return;}
  if(h.downed>0){h.downed-=dt;h.rx=lerp(h.rx,Math.PI/2,damp(6,dt));h.moving=0;h.armsUp=0;
    if(h.downed<=0){h.downed=0;h.hp=15;h.state='flee';h.fx=h.pos.x+rr(-1,1);h.fz=h.pos.z+rr(-1,1);h.st=5;}return;}
  h.rx=lerp(h.rx,0,damp(6,dt));h.armsUp=Math.max(0,h.armsUp-dt*2);
  if(h.stun>0){h.stun-=dt;h.moving=0;return;}
  if(h.wanted>0&&!h.crime)h.wanted=Math.max(0,h.wanted-dt*0.05);
  h.scanT-=dt;if(h.scanT<=0){h.scanT=0.45;npcScan(h);}
  if(h.role!=='civilian'&&h.target&&h.state!=='hidden'){npcCombat(h,dt);return;}
  switch(h.state){
    case 'walk':{h.path.u+=h.path.dir*h.walk*(1-(h.slow||0))*dt;const q=pathPos(h.path);if(moveTo(h,q.x,q.z,h.walk*1.6,dt))h.moving=h.walk;break;}
    case 'return':{const q=pathPos(h.path);if(moveTo(h,q.x,q.z,h.run*0.6,dt))h.state='walk';break;}
    case 'flee':{h.st-=dt;h.armsUp=1;const dx=h.pos.x-h.fx,dz=h.pos.z-h.fz,l=Math.hypot(dx,dz)||1;stepHuman(h,dx/l,dz/l,h.run,dt);
      if(h.st<=0){h.path=pathFor(h.pos.x,h.pos.z);h.state='return';}break;}
    case 'goto':{if(moveTo(h,h.goal.x,h.goal.z,h.goalRun?h.run:h.walk*1.5,dt))h.state=h.onArrive||'idle';break;}
    case 'escape':{h.st-=dt;const dx=h.pos.x-h.fx,dz=h.pos.z-h.fz,l=Math.hypot(dx,dz)||1;stepHuman(h,dx/l,dz/l,h.run,dt);break;}
    case 'victim':h.armsUp=1;h.moving=0;break;
    case 'idle':{h.moving=0;if(h.home){const dx=h.home.fx-h.pos.x,dz=h.home.fz-h.pos.z;h.yaw=angLerp(h.yaw,Math.atan2(dx,dz),damp(3,dt));}break;}
    default:h.moving=0;
  }
}
// ---- drones (robot thieves) ----
function spawnDrone(x,y,z,role,crime){
  const d={kind:'drone',role,faction:'criminal',alive:true,hp:NPCS.drone.hp,maxHp:NPCS.drone.hp,pos:new V3(x,y,z),vel:new V3(),yaw:0,
    flash:0,stun:0,slow:0,slowT:0,burn:0,burnDps:0,held:false,thrown:null,crime,cy:0,radius:1.7,shootT:rr(1,3),bag:false,orbit:rr(0,TAU),odir:Math.random()<0.5?1:-1,
    seed:rr(0,100),target:null,grudge:null,grudgeT:-99,home:new V3(x,y,z),goal:null,leave:false,leaveDir:null,scanT:0};
  d.onDefeat=()=>{removeFrom(drones,d);removeFrom(actors,d);
    wrecks.push({x:d.pos.x,y:d.pos.y,z:d.pos.z,vx:d.vel.x*0.5+rr(-4,4),vy:rr(2,8),vz:d.vel.z*0.5+rr(-4,4),rx:0,ry:d.yaw,rz:0,sx:rr(-5,5),sy:rr(-3,3),sz:rr(-5,5)});
    explode(d.pos.x,d.pos.y,d.pos.z,0.55);if(d.bag)burst(d.pos.x,d.pos.y,d.pos.z,30,10,1.2,CASH,1.2,6,1.5);};
  d.onHit=src=>{if(src&&src!==d&&src!==null)d.target=src;};
  drones.push(d);actors.push(d);return d;
}
function droneWants(d){
  if(P.invisible>0&&d.grudge===P)return null;
  if(d.grudge&&time-d.grudgeT<25&&validTarget(d.grudge))return d.grudge;
  if(!P.dead&&state==='play'&&playerFaction()==='hero'&&d2h(d,P)<55*55)return P;
  return null;
}
function updateDrone(d,dt){
  d.flash=Math.max(0,d.flash-dt*6);if(d.slowT>0){d.slowT-=dt;if(d.slowT<=0)d.slow=0;}
  if(d.burn>0){d.burn-=dt;Damage.apply(d.burnSrc,d,d.burnDps*dt,'burn');if(!d.alive)return;}
  if(d.held)return;
  if(d.thrown){d.vel.y-=30*dt;d.pos.addS(d.vel,dt);
    let hit=null;for(const a of actors){if(a===d||!a.alive||a.kind==='prop'||a.held)continue;const c=center(a);if(Math.hypot(c.x-d.pos.x,c.y-d.pos.y,c.z-d.pos.z)<(a.radius||1)+1.5){hit=a;break;}}
    if(hit||d.pos.y<0.8||inBuilding(d.pos.x,d.pos.y,d.pos.z)){const t=d.thrown;d.thrown=null;if(hit)Damage.apply(t.by,hit,t.dmg,'throw',{knock:12});Damage.apply(t.by,d,t.dmg,'throw');d.vel.set(0,0,0);}
    return;}
  if(d.stun>0){d.stun-=dt;d.vel.y-=10*dt;d.pos.addS(d.vel,dt);d.vel.mul(0.96);d.pos.y=Math.max(d.pos.y,1);return;}
  d.scanT-=dt;if(d.scanT<=0){d.scanT=0.5;if(!validTarget(d.target))d.target=null;if(!d.target&&!d.leave)d.target=droneWants(d);}
  let gx,gy,gz,maxSp=34;
  if(d.leave){if(!d.leaveDir){const a=rr(0,TAU);d.leaveDir={x:Math.cos(a),z:Math.sin(a)};}gx=d.pos.x+d.leaveDir.x*80;gy=d.pos.y+50;gz=d.pos.z+d.leaveDir.z*80;
    if(d.pos.y>170||Math.abs(d.pos.x)>EDGE+100||Math.abs(d.pos.z)>EDGE+100){removeActor(d);return;}}
  else if(d.target){const t=center(d.target),tx=t.x,ty=t.y,tz=t.z;d.orbit+=dt*0.5*d.odir;const R=16+Math.sin(time*0.7+d.seed)*6;
    gx=tx+Math.cos(d.orbit)*R;gz=tz+Math.sin(d.orbit)*R;gy=Math.max(ty+7+Math.sin(time*1.3+d.seed)*4,4);}
  else if(d.goal){gx=d.goal.x;gy=d.goal.y;gz=d.goal.z;maxSp=d.goal.sp||14;}
  else{gx=d.home.x+Math.cos(time*0.5+d.seed)*8;gz=d.home.z+Math.sin(time*0.5+d.seed)*8;gy=d.home.y+Math.sin(time+d.seed)*2;}
  const sx=gx-d.pos.x,sy=gy-d.pos.y,sz=gz-d.pos.z,l=Math.hypot(sx,sy,sz)||1,sp=Math.min(l*1.6,maxSp)*(1-(d.slow||0));
  const k=damp(2.6,dt);d.vel.x+=(sx/l*sp-d.vel.x)*k;d.vel.y+=(sy/l*sp-d.vel.y)*k;d.vel.z+=(sz/l*sp-d.vel.z)*k;
  d.pos.addS(d.vel,dt);
  const b=inBuilding(d.pos.x,d.pos.y,d.pos.z,1.5);if(b){d.pos.y=lerp(d.pos.y,b.y1+3,damp(6,dt));d.vel.y=Math.max(d.vel.y,10);}
  d.pos.y=Math.max(d.pos.y,1.2);
  if(d.target){const t=center(d.target);d.yaw=angLerp(d.yaw,Math.atan2(t.x-d.pos.x,t.z-d.pos.z),damp(6,dt));}
  else if(Math.hypot(d.vel.x,d.vel.z)>1)d.yaw=angLerp(d.yaw,Math.atan2(d.vel.x,d.vel.z),damp(4,dt));
  if(d.target&&!d.leave){d.shootT-=dt;if(d.shootT<=0){d.shootT=rr(1.3,2.4);const t=center(d.target);const dist=Math.hypot(t.x-d.pos.x,t.y-d.pos.y,t.z-d.pos.z);
    if(dist<110){const tv=d.target.vel||{x:0,y:0,z:0},lead=dist/80*0.5;const o={x:d.pos.x,y:d.pos.y-0.3,z:d.pos.z};const v=dirTo(o,t.x+tv.x*lead+rr(-1.5,1.5),t.y+tv.y*lead+rr(-1,1),t.z+tv.z*lead+rr(-1.5,1.5));
      d.shotN=(d.shotN||0)+1;fireProj({kind:'shot',owner:d,x:o.x,y:o.y,z:o.z,vx:v[0]*80,vy:v[1]*80,vz:v[2]*80,dmg:NPCS.drone.shot,r:0.45,life:3});SFX.zap(SFX.vol(d.pos.x,d.pos.y,d.pos.z));}}}
  if(d.hp<d.maxHp*0.5&&Math.random()<0.25)smoke(d.pos.x,d.pos.y,d.pos.z,1,0.3,2,1.2,0.15);
}
// ---- vehicles ----
const CAR_COLS=['#f2c230','#e8e8ea','#9aa3ad','#c0262d','#1f5fbf','#15171c','#1f9e8e','#e86a1a','#5a6b7c','#7a1f2b'].map(c4);
const VDIM={sedan:[0.95,2.35],compact:[0.9,1.95],suv:[1.03,2.45],taxi:[0.95,2.35],police:[0.98,2.4],van:[1.15,2.95],truck:[1.5,3.6]};
for(const k in VDIM)VDIM[k]=VDIM[k].map(v=>v*VEH_S);
function makeVehicle(vtype,model){
  model=model||(vtype==='car'?pick(CAR_KINDS):vtype);const hp=vtype==='police'?90:NPCS[vtype==='car'?'car':vtype].hp;
  const v={kind:'vehicle',vtype,model,faction:'object',alive:true,hp,maxHp:hp,pos:new V3(),vel:new V3(),yaw:0,ty:0,rx:0,rz:0,state:'road',axis:0,dir:1,lane:0,s:0,spd:0,maxSpd:rr(13,22),
    flash:0,held:false,cy:1.1*VEH_S,radius:(vtype==='truck'?3:vtype==='van'?2.8:2.3)*VEH_S,ys:1.4,tint:[1,1,1,1],burn:0,stun:0,slow:0,slowT:0,crime:null,temp:false,driver:null,
    mesh:vtype==='van'?vanMesh:vtype==='truck'?truckMesh:CARS[model],hw:VDIM[model][0],hl:VDIM[model][1],burnT:0,escaped:false,sx:0,sy:0,sz:0,life:0,stalled:0,siren:false,chaseT:0,honkT:0};
  if(model==='taxi'||model==='police')v.tint=[1,1,1,1];
  v.onDefeat=src=>vehicleDestroyed(v,src);
  vehicles.push(v);actors.push(v);return v;
}
const laneOff=d=>d>0?-4.5:4.5;
function setVehiclePos(v){if(v.axis===0){v.pos.set(v.lane,0,v.s);v.ty=v.dir>0?0:Math.PI;}else{v.pos.set(v.s,0,v.lane);v.ty=v.dir>0?Math.PI/2:-Math.PI/2;}if(v.state==='parked')v.yaw=v.ty;}
// the road graph: axis 0 runs along z on an x grid line, axis 1 runs along x on a z grid line (see zEdge / xEdge in the world)
const lineOrigin=ax=>ax===0?X0:Z0,sOrigin=ax=>ax===0?Z0:X0,nodeMax=ax=>ax===0?GZ:GX;
const edgeOK=(ax,line,n)=>ax===0?zEdge(line,n):xEdge(line,n); // the stretch of road between node n and n+1
function placeTraffic(v){
  let ax=0,line=0,n=0;for(let t=0;t<200;t++){ax=Math.random()<0.5?0:1;line=Math.floor(Math.random()*((ax===0?GX:GZ)+1));n=Math.floor(Math.random()*nodeMax(ax));if(edgeOK(ax,line,n))break;}
  v.axis=ax;v.dir=Math.random()<0.5?1:-1;v.lane=lineOrigin(ax)+line*CELL+laneOff(v.dir);
  v.s=sOrigin(ax)+(n+rr(0.2,0.8))*CELL;v.maxSpd=rr(13,22);v.spd=v.maxSpd*0.6;v.hp=v.maxHp;v.alive=true;v.state='road';v.rx=v.rz=0;v.flash=0;v.stalled=0;v.siren=false;v.driver=null;
  if(v.model!=='taxi'&&v.model!=='police')v.tint=pick(CAR_COLS).slice();setVehiclePos(v);v.yaw=v.ty;
}
function awayDir(v){const along=v.axis===0?v.pos.z:v.pos.x,pl=v.axis===0?P.pos.z:P.pos.x;return along>=pl?1:-1;}
function ejectDriver(v){const h=v.driver;if(!h)return;v.driver=null;h.held=false;h.hidden=false;h.inCar=null;h.pos.set(v.pos.x+rr(-2,2),v.pos.y+1,v.pos.z+rr(-2,2));h.air=true;h.vel.set(rr(-6,6),9,rr(-6,6));h.tumble=rr(-5,5);h.state='idle';h.wanted=1;if(playerFaction()!=='villain')h.target=P;}
function vehicleDestroyed(v){
  if(v.state==='wreck'||v.state==='wreckAir')return;v.alive=false;v.held=false;v.siren=false;
  if(v===P.car)exitCar(true);
  const s=v.vtype==='truck'?1.5:v.vtype==='van'?1.3:0.95;
  explode(v.pos.x,v.pos.y+1.2,v.pos.z,s);
  for(let k=0;k<3;k++)spawnPiece(v.pos.x,v.pos.y+0.6,v.pos.z,MESH.cyl,0.38,0.3,0.38,BLACK_C,rr(-9,9),rr(6,12),rr(-9,9),10,[0,0,Math.PI/2]);
  spawnPiece(v.pos.x,v.pos.y+1.2,v.pos.z,MESH.box,0.08,0.9,1.2,v.tint,rr(-8,8),rr(6,10),rr(-8,8),10);
  v.state='wreckAir';v.vel.set(rr(-3,3),rr(8,12),rr(-3,3));v.sx=rr(-4,4);v.sz=rr(-4,4);v.sy=rr(-1,1);v.burnT=14;
  addFire(v.pos.x,v.pos.y+1,v.pos.z,12,1.2);
  if(v.driver)ejectDriver(v);
}
function nodeAhead(v){const o=sOrigin(v.axis),f=(v.s-o)/CELL;const k=v.dir>0?Math.floor(f+1e-4)+1:Math.ceil(f-1e-4)-1;return {k,ns:o+k*CELL};}
function roadIndexOf(v){return Math.round((v.lane-laneOff(v.dir)-lineOrigin(v.axis))/CELL);}
// reaching node k: carry on, turn, or turn around at a dead end (toward: an optional [dx,dz] to head for)
function atNode(v,k,ns,turnChance,toward){
  const line=roadIndexOf(v),straight=edgeOK(v.axis,line,v.dir>0?k:k-1),turns=[1,-1].filter(nd=>edgeOK(1-v.axis,k,nd>0?line:line-1));
  if(toward){const want=v.axis===0?Math.sign(toward[0]):Math.sign(toward[1]),big=v.axis===0?Math.abs(toward[0])>Math.abs(toward[1]):Math.abs(toward[1])>Math.abs(toward[0]);
    if(big&&turns.includes(want)){turnAtNode(v,ns,1-v.axis,want);return;}}
  if(straight&&!(turns.length&&Math.random()<turnChance))return;
  if(turns.length){turnAtNode(v,ns,1-v.axis,pick(turns));return;}
  v.dir=-v.dir;v.lane=lineOrigin(v.axis)+line*CELL+laneOff(v.dir); // dead end: turn around
}
// never drive on a stretch of road that doesn't exist (off the shore): head back to the last intersection
function keepOnRoad(v){const o=sOrigin(v.axis),f=(v.s-o)/CELL,n=Math.floor(f),line=roadIndexOf(v);
  if(Math.abs(f-Math.round(f))*CELL<7||edgeOK(v.axis,line,n))return; // turning through an intersection puts you a lane's width past it
  v.dir=-v.dir;v.lane=lineOrigin(v.axis)+line*CELL+laneOff(v.dir);}
function obstacleAhead(v){
  const fx=v.axis===0?0:v.dir,fz=v.axis===0?v.dir:0;let best=99;
  const test=(x,z,w)=>{const dx=x-v.pos.x,dz=z-v.pos.z,f=dx*fx+dz*fz,l=Math.abs(dx*fz-dz*fx);if(f>0.5&&f<20&&l<1.4+w&&f<best)best=f;};
  for(const o of vehicles)if(o!==v&&o.state!=='held'&&o.state!=='thrown'&&o.state!=='wreckAir'&&Math.abs(o.pos.x-v.pos.x)<22&&Math.abs(o.pos.z-v.pos.z)<22)test(o.pos.x,o.pos.z,o.hw);
  for(const h of humans)if(h.alive&&!h.hidden&&Math.abs(h.pos.x-v.pos.x)<16&&Math.abs(h.pos.z-v.pos.z)<16&&h.pos.y<1)test(h.pos.x,h.pos.z,0.4);
  if(!P.car&&P.pos.y<3&&!P.dead){const d0=best;test(P.pos.x,P.pos.z,0.8);if(best<d0&&best<10&&time>v.honkT){v.honkT=time+rr(2,4);SFX.honk(SFX.vol(v.pos.x,1,v.pos.z));}}
  return best;
}
function turnAtNode(v,ns,newAxis,newDir){
  const x=v.pos.x,z=v.pos.z;v.axis=newAxis;v.dir=newDir;v.lane=ns+laneOff(newDir);v.s=newAxis===0?z:x;
  if(newAxis===0)v.s=z;else v.s=x;
}
function driveTraffic(v,dt){
  const chasing=v.state==='chase';
  let want=v.maxSpd*(chasing?1.7:1);
  if(v.stalled>0){v.stalled-=dt;want=0;}
  const {k,ns}=nodeAhead(v),dn=(ns-v.s)*v.dir;
  if(!chasing&&k>=0&&k<=nodeMax(v.axis)){const ri=roadIndexOf(v);const L=v.axis===0?lightFor(ri,k,0):lightFor(k,ri,1);
    if(L!=='g'&&dn>CONFIG.traffic.stopLine-2)want=Math.min(want,Math.max(0,(dn-CONFIG.traffic.stopLine)*1.3));}
  const ob=obstacleAhead(v);if(ob<19)want=Math.min(want,Math.max(0,(ob-8.5)*1.6));
  v.spd+=clamp(want-v.spd,-28*dt,9*dt);
  const prev=v.s;v.s+=v.dir*v.spd*dt;
  if((ns-prev)*v.dir>0&&(ns-v.s)*v.dir<=0){
    // at an intersection: carry on, turn (police head for you) or turn around at a dead end
    let toward=null;if(chasing&&!P.dead){const tx=P.car?P.car.pos.x:P.pos.x,tz=P.car?P.car.pos.z:P.pos.z,dx=tx-v.pos.x,dz=tz-v.pos.z;if(Math.hypot(dx,dz)>20)toward=[dx,dz];}
    atNode(v,k,ns,chasing?0:0.28,toward);
  }
  keepOnRoad(v);setVehiclePos(v);v.yaw=angLerp(v.yaw,v.ty,damp(8,dt));
}
function updateVehicle(v,dt){
  v.flash=Math.max(0,v.flash-dt*5);
  switch(v.state){
    case 'road':driveTraffic(v,dt);break;
    case 'chase':driveTraffic(v,dt);v.chaseT-=dt;{const tx=P.car?P.car.pos.x:P.pos.x,tz=P.car?P.car.pos.z:P.pos.z,d=Math.hypot(tx-v.pos.x,tz-v.pos.z);
      if(P.heat<=0||P.dead||v.chaseT<=0){v.state='road';v.siren=false;}
      else if(d<24&&!P.car&&P.pos.y<8){v.state='parked';v.parkT=18;v.spd=0;for(let i=0;i<2;i++){const h=spawnHuman('police',v.pos.x+rr(-2.5,2.5),v.pos.z+rr(-2.5,2.5));h.target=P;h.fromCar=v;}}}
      break;
    case 'parked':if(v.parkT!==undefined){v.parkT-=dt;if(v.parkT<=0){v.parkT=undefined;v.siren=false;v.state='road';}}break;
    case 'flee':case 'stolen':{const na=nodeAhead(v),pv=v.s;v.s+=v.dir*v.maxSpd*1.5*dt;if((na.ns-pv)*v.dir>0&&(na.ns-v.s)*v.dir<=0)atNode(v,na.k,na.ns,0.2,null);keepOnRoad(v);setVehiclePos(v);v.yaw=angLerp(v.yaw,v.ty+(v.state==='stolen'?Math.sin(time*3+v.lane)*0.1:0),damp(6,dt));
      if(Math.hypot(v.pos.x-P.pos.x,v.pos.z-P.pos.z)>380)v.escaped=true;if(Math.random()<0.3)smoke(v.pos.x,0.6,v.pos.z,1,0.4,1.4,0.8,0.3);
      hitProps(v.pos.x,0.5,v.pos.z,2,null,v.maxSpd);break;}
    case 'thrown':{v.vel.y-=30*dt;v.pos.addS(v.vel,dt);v.rx+=v.sx*dt;v.yaw+=v.sy*dt;v.rz+=v.sz*dt;v.life-=dt;
      for(const a of actors){if(a===v||!a.alive||a.kind==='prop'||a.held||a.hitBy===v)continue;const c=center(a);
        if(Math.hypot(c.x-v.pos.x,c.y-(v.pos.y+1),c.z-v.pos.z)<(a.radius||1)+2.2){a.hitBy=v;Damage.apply(v.thrower,a,v.throwDmg*1.4,'throw',{knock:18});}}
      hitProps(v.pos.x,v.pos.y,v.pos.z,2.5,v.thrower,Math.hypot(v.vel.x,v.vel.z));
      const b=inBuilding(v.pos.x,v.pos.y+1,v.pos.z,0.5);const g=groundY(v.pos.x,v.pos.z,v.pos.y+1);
      if(b||v.pos.y<=g+0.4||v.life<=0){if(b){v.pos.x-=v.vel.x*0.06;v.pos.z-=v.vel.z*0.06;breakWindowAt(b,v.pos.x+v.vel.x*0.06,v.pos.y+1,v.pos.z+v.vel.z*0.06);const n=faceNormal(b,v.pos.x,v.pos.y+1,v.pos.z);crater(v.pos.x,v.pos.y+1,v.pos.z,n[0],n[1],n[2],3,b.col);}
        areaDamage(v.pos.x,v.pos.y+1,v.pos.z,6,v.throwDmg,v.thrower,{knock:14});v.hp=0;vehicleDestroyed(v);}
      break;}
    case 'wreckAir':{v.vel.y-=32*dt;v.pos.addS(v.vel,dt);v.rx+=v.sx*dt;v.rz+=v.sz*dt;v.yaw+=v.sy*dt;const g=groundY(v.pos.x,v.pos.z,v.pos.y+1);
      if(v.pos.y<=g&&v.vel.y<0){v.pos.y=g;v.state='wreck';v.rx=Math.round(v.rx/Math.PI)*Math.PI;v.rz=Math.round(v.rz/Math.PI)*Math.PI;burst(v.pos.x,0.5,v.pos.z,20,10,0.6,DUST,2,-2,2);SFX.crash(SFX.vol(v.pos.x,0,v.pos.z)*0.7);}
      break;}
    case 'wreck':{v.burnT-=dt;if(v.burnT<=0){if(v.temp)removeActor(v);else placeTraffic(v);}break;}
  }
}
function updatePolice(dt){
  if(state!=='play'||P.dead||P.heat<=0)return;
  let chasing=0;for(const v of vehicles)if(v.state==='chase')chasing++;
  if(chasing>=2)return;
  let best=null,bd=380;const tx=P.car?P.car.pos.x:P.pos.x,tz=P.car?P.car.pos.z:P.pos.z;
  for(const v of vehicles)if(v.vtype==='police'&&v.state==='road'&&v.alive){const d=Math.hypot(v.pos.x-tx,v.pos.z-tz);if(d<bd){bd=d;best=v;}}
  if(best){best.state='chase';best.siren=true;best.chaseT=60;}
}
// ---- rival supers (stand-ins for other players until multiplayer exists) ----
const RIVAL_NAMES={hero:['Captain Volt','Night Warden','Aurora','Bulwark','Starfall','Blue Comet'],villain:['Doctor Hex','Blackout','Magma','Razorwing','The Vandal','Cryo Queen']};
function rivalLook(f){
  const suit=f==='hero'?pick(['#2a6fd6','#e8e8ee','#1f9e8e','#f2c230']):pick(['#2b1b3a','#3a0f14','#1b1b1f','#4a3a12']);
  const cape=f==='hero'?pick(['#f2c230','#c8102e','#1fb8d6']):pick(['#6b1fa0','#a3122a','#17181f']);
  const acc=f==='hero'?'#e9f3ff':pick(['#ff3d5e','#a64dff','#39ff88']);
  return {suit:c4(suit),suit2:[...hex(suit,0.6),1],cape:c4(cape),acc:c4(acc),capeOn:Math.random()<0.7,metal:false};
}
function spawnRival(fac){
  const a=rr(0,TAU),x=clamp(P.pos.x+Math.cos(a)*170,X0,X1),z=clamp(P.pos.z+Math.sin(a)*170,Z0,Z1);
  const lvl=clamp(save.level+Math.round(rr(-2,2)),1,CONFIG.progression.levelCap),hp=NPCS.rival.hp+NPCS.rival.hpPerLvl*lvl;
  const r={kind:'rival',faction:fac,name:pick(RIVAL_NAMES[fac]),level:lvl,alive:true,hp,maxHp:hp,pos:new V3(x,55,z),vel:new V3(),heroYaw:0,tilt:0,bank:0,
    flash:0,stun:0,slow:0,slowT:0,burn:0,burnDps:0,held:false,thrown:null,cy:1.3,radius:0.9,ys:0.55,target:null,grudge:null,grudgeT:-99,attackT:rr(1,2),orbit:rr(0,TAU),
    bounty:fac==='villain'&&Math.random()<0.3,anim:{legL:0,legR:0,armL:0,armR:0,armLz:-0.12,armRz:0.12,cape:0.2},look:rivalLook(fac),deadT:6,air:false,scanT:0,firing:false,eye:new V3()};
  r.onDefeat=()=>{r.air=true;r.vel.set(r.vel.x*0.3,2,r.vel.z*0.3);r.deadT=7;explodeSmall(r.pos.x,r.pos.y+1,r.pos.z,SPARK,2);};
  r.onHit=src=>{if(src&&src!==r)r.target=src;};
  rivals.push(r);actors.push(r);return r;
}
function rivalScan(r){
  if(P.invisible>0&&r.target===P)r.target=null;
  if(r.target&&validTarget(r.target))return;r.target=null;
  if(r.grudge&&time-r.grudgeT<30&&validTarget(r.grudge)){r.target=r.grudge;return;}
  const pf=playerFaction();
  if(!P.dead&&state==='play'){if(r.faction==='hero'&&(pf==='villain'||hasBounty())){r.target=P;return;}if(r.faction==='villain'&&pf==='hero'){r.target=P;return;}}
  if(WS.host)for(const q of MP.peers.values())if(q.alive&&((r.faction==='hero'&&q.faction==='villain')||(r.faction==='villain'&&q.faction==='hero'))&&d2h(r,q)<150*150){r.target=q;return;}
  let best=null,bd=150*150;
  if(r.faction==='hero'){for(const d of drones)if(d.alive){const q=d2h(r,d);if(q<bd){bd=q;best=d;}}for(const h of humans)if(h.alive&&h.faction==='criminal'&&h.wanted>0){const q=d2h(r,h);if(q<bd){bd=q;best=h;}}}
  else{bd=90*90;for(const h of humans)if(h.alive&&(h.role==='civilian'||h.role==='police')&&!h.held){const q=d2h(r,h);if(q<bd&&Math.random()<0.5){bd=q;best=h;}}}
  r.target=best;
}
function updateRival(r,dt){
  r.flash=Math.max(0,r.flash-dt*5);if(r.slowT>0){r.slowT-=dt;if(r.slowT<=0)r.slow=0;}
  if(r.burn>0&&r.alive){r.burn-=dt;Damage.apply(r.burnSrc,r,r.burnDps*dt,'burn');}
  if(r.held)return;
  if(!r.alive||r.thrown||r.stun>0){
    const prevY=r.pos.y,vyb=r.vel.y;airGrav(r,35,dt);r.pos.addS(r.vel,dt);const pv=[r.vel.x,r.vel.y,r.vel.z];const col=collideBody(r.pos,r.vel,prevY,0.6,2.4);
    const flung=r.flungT&&time-r.flungT<2.5,spd=flung?Math.hypot(r.vel.x,vyb,r.vel.z):0;
    if(flung){flungSweep(r,spd);if(col.wall&&spd>COMBAT.slamMin)slamWall(r,col.wall,spd,pv);else if(col.grounded&&vyb<-COMBAT.slamMin)slamGround(r,-vyb);}
    if(r.thrown&&(col.grounded||col.wall)){const t=r.thrown;r.thrown=null;Damage.apply(t.by,r,t.dmg,'throw');}
    if(col.grounded){r.vel.x*=0.8;r.vel.z*=0.8;}
    if(!r.alive){r.tilt=lerp(r.tilt,1.5,damp(3,dt));r.deadT-=dt;if(r.deadT<=0)removeActor(r);}
    else if(r.stun>0)r.stun-=dt;
    return;
  }
  if(r.hunter&&hunterBrain(r,dt))return;
  r.scanT-=dt;if(r.scanT<=0){r.scanT=0.6;rivalScan(r);}
  let gx,gy,gz;
  if(r.target){const t=center(r.target),tx=t.x,ty=t.y,tz=t.z;r.orbit+=dt*0.45;const R=22;gx=tx+Math.cos(r.orbit)*R;gz=tz+Math.sin(r.orbit)*R;gy=Math.max(ty+7,5);}
  else{r.orbit+=dt*0.1;gx=P.pos.x+Math.cos(r.orbit)*90;gz=P.pos.z+Math.sin(r.orbit)*90;gy=45;}
  const sx=gx-r.pos.x,sy=gy-r.pos.y,sz=gz-r.pos.z,l=Math.hypot(sx,sy,sz)||1,sp=Math.min(l*1.4,34)*(1-(r.slow||0));const k=damp(2,dt);
  r.vel.x+=(sx/l*sp-r.vel.x)*k;r.vel.y+=(sy/l*sp-r.vel.y)*k;r.vel.z+=(sz/l*sp-r.vel.z)*k;r.pos.addS(r.vel,dt);
  const b=inBuilding(r.pos.x,r.pos.y,r.pos.z,1.5);if(b){r.pos.y=lerp(r.pos.y,b.y1+3,damp(6,dt));r.vel.y=Math.max(r.vel.y,8);}
  r.pos.x=clamp(r.pos.x,-LIMIT,LIMIT);r.pos.z=clamp(r.pos.z,-LIMIT,LIMIT);r.pos.y=clamp(r.pos.y,1,CEIL);
  const hs=Math.hypot(r.vel.x,r.vel.z);r.firing=false;
  if(r.target){const t=center(r.target);r.heroYaw=angLerp(r.heroYaw,Math.atan2(t.x-r.pos.x,t.z-r.pos.z),damp(5,dt));
    r.attackT-=dt;const dist=Math.hypot(t.x-r.pos.x,t.y-r.pos.y,t.z-r.pos.z);
    if(r.attackT<=0&&dist<75){r.attackT=rr(1.0,1.7);const o={x:r.pos.x,y:r.pos.y+1.9,z:r.pos.z};
      if(losClear(o.x,o.y,o.z,t.x,t.y,t.z)){const v=dirTo(o,t.x,t.y,t.z);fireProj({kind:'blast',owner:r,x:o.x,y:o.y,z:o.z,vx:v[0]*70,vy:v[1]*70,vz:v[2]*70,dmg:NPCS.rival.blast+NPCS.rival.blastPerLvl*r.level,knock:10,r:0.5,life:2});
        SFX.tone('square',650,1300,0.12,0.07*SFX.vol(o.x,o.y,o.z));r.castT=time;}}}
  else if(hs>2)r.heroYaw=angLerp(r.heroYaw,Math.atan2(r.vel.x,r.vel.z),damp(4,dt));
  r.tilt=lerp(r.tilt,clamp(hs/30,0,1)*1.2,damp(4,dt));
  const a=r.anim,kk=damp(8,dt);a.armR=lerp(a.armR,hs>15?-2.9:-0.4,kk);a.armL=lerp(a.armL,-0.3,kk);a.legL=lerp(a.legL,0.1,kk);a.legR=lerp(a.legR,0.25,kk);a.cape=0.15+Math.sin(time*14)*0.06;
}
// ---- shops and ATMs as damageable props (villains rob them) ----
for(const s of shops){const p={kind:'prop',role:'shop',ref:s,faction:'object',alive:true,hp:NPCS.shop.hp,maxHp:NPCS.shop.hp,pos:new V3(s.fx,0,s.fz),cy:1.8,radius:2.4,ys:0.8,flash:0,reopen:0,crime:null,stun:0,slow:0,slowT:0,burn:0};
  p.onDefeat=src=>robProp(p,src);s.prop=p;props.push(p);actors.push(p);}
for(const s of atms){const p={kind:'prop',role:'atm',ref:s,faction:'object',alive:true,hp:NPCS.atm.hp,maxHp:NPCS.atm.hp,pos:new V3(s.fx,0,s.fz),cy:1.4,radius:1,ys:0.9,flash:0,reopen:0,crime:null,stun:0,slow:0,slowT:0,burn:0};
  p.onDefeat=src=>robProp(p,src);s.prop=p;props.push(p);actors.push(p);}
const CASH=[[.3,.9,.4],[1,.85,.3]];
function robProp(p,src){
  const c=NPCS[p.role];p.reopen=c.reopen;burst(p.pos.x,p.pos.y+1.5,p.pos.z,50,12,1.4,CASH,1.3,8,1.2);SFX.chime();
  if(src===P){addXP(c.xp);addRep(c.rep);addWanted(5,1000);save.stats.crimesCommitted++;
    feed('+'+c.xp+' XP · '+c.rep+' rep',p.role==='shop'?'You robbed the '+p.ref.name:'You cracked an ATM');scare(p.pos.x,p.pos.z,40);}
}
function updateProps(dt){for(const p of props){if(p.flash>0)p.flash=Math.max(0,p.flash-dt*5);if(!p.alive){p.reopen-=dt;if(p.reopen<=0){p.alive=true;p.hp=p.maxHp;}}}}

// ================================================================
// Bosses (heists)
// ================================================================
function spawnShip(x,y,z,crime){
  const b={kind:'boss',type:'ship',name:'Mothership',faction:'criminal',alive:true,hp:NPCS.ship.hp,maxHp:NPCS.ship.hp,pos:new V3(x,y,z),vel:new V3(),home:new V3(x,y,z),
    cy:0,radius:18,ys:18/5,spin:0,volT:4,spawnT:6,flash:0,stun:0,slow:0,slowT:0,burn:0,crime,leave:false,held:false};
  b.onDefeat=()=>bossDown(b);actors.push(b);boss=b;return b;
}
function spawnMech(x,z,crime){
  const b={kind:'boss',type:'mech',name:'Titan Mech',faction:'criminal',alive:true,hp:NPCS.mech.hp,maxHp:NPCS.mech.hp,pos:new V3(x,0,z),vel:new V3(),yaw:0,
    cy:22,radius:11,ys:0.55,phase:0,flash:0,stun:0,slow:0,slowT:0,burn:0,crime,gunT:2,rocketT:4,punchT:1.5,punchAnim:0,leave:false,truck:null,held:false,stepSide:1};
  b.onDefeat=()=>bossDown(b);actors.push(b);boss=b;return b;
}
function bossCenter(b){return {x:b.pos.x,y:b.pos.y+b.cy,z:b.pos.z};}
function bossDown(b){
  const c=bossCenter(b);removeFrom(actors,b);if(boss===b)boss=null;
  for(let i=0;i<7;i++)later(i*0.22,()=>explode(c.x+rr(-12,12),c.y+rr(-6,6),c.z+rr(-12,12),1.4));
  later(1.6,()=>{explode(c.x,c.y,c.z,3);ringFx(c.x,c.y,c.z,2,90,1.1,[1,.7,.3]);spawnDebris(c.x,c.y,c.z,20,METAL,30);});
}
function updateShip(b,dt){
  b.flash=Math.max(0,b.flash-dt*5);b.spin+=dt*0.35;
  if(b.leave){b.pos.y+=dt*25;if(b.pos.y>600){removeFrom(actors,b);if(boss===b)boss=null;}return;}
  b.pos.x=lerp(b.pos.x,b.home.x+Math.sin(time*0.3)*6,damp(1,dt));b.pos.z=lerp(b.pos.z,b.home.z+Math.cos(time*0.27)*6,damp(1,dt));b.pos.y=lerp(b.pos.y,b.home.y,damp(1,dt));
  const dist=Math.hypot(P.pos.x-b.pos.x,P.pos.y-b.pos.y,P.pos.z-b.pos.z);
  if(!P.dead&&state==='play'&&dist<260){b.volT-=dt;if(b.volT<=0){b.volT=rr(2.6,3.6);
    for(let i=0;i<10;i++)later(i*0.05,()=>{if(!b.alive)return;const o={x:b.pos.x+rr(-6,6),y:b.pos.y-4,z:b.pos.z+rr(-6,6)};const v=dirTo(o,P.pos.x+rr(-7,7),P.pos.y+1.3+rr(-3,3),P.pos.z+rr(-7,7));
      fireProj({kind:'shot',owner:b,x:o.x,y:o.y,z:o.z,vx:v[0]*62,vy:v[1]*62,vz:v[2]*62,dmg:9,r:0.5,life:5});});
    SFX.zap(1.4);SFX.tone('sawtooth',220,60,0.6,0.12);}}
  b.spawnT-=dt;if(b.spawnT<=0){b.spawnT=12;const n=drones.filter(d=>d.crime===b.crime).length;
    if(n<5)for(let i=0;i<2;i++){const d=spawnDrone(b.pos.x+rr(-8,8),b.pos.y-6,b.pos.z+rr(-8,8),'guard',b.crime);d.home.set(b.home.x+rr(-30,30),b.home.y-40,b.home.z+rr(-30,30));b.crime.actors.push(d);}}
}
function mechPoint(b,lx,ly,lz){const c=Math.cos(b.yaw),s=Math.sin(b.yaw);return {x:b.pos.x+lx*c+lz*s,y:b.pos.y+ly,z:b.pos.z-lx*s+lz*c};}
function updateMech(b,dt){
  b.flash=Math.max(0,b.flash-dt*5);b.punchAnim=Math.max(0,b.punchAnim-dt*2);
  const dP=Math.hypot(P.pos.x-b.pos.x,P.pos.z-b.pos.z);
  const fightPlayer=!P.dead&&state==='play'&&dP<160&&(playerFaction()!=='villain'||b.grudge===P);
  let tx,tz,moving=false;
  if(b.leave){tx=b.pos.x+Math.sin(b.yaw)*50;tz=b.pos.z+Math.cos(b.yaw)*50;if(Math.abs(b.pos.x)>EDGE||Math.abs(b.pos.z)>EDGE){removeFrom(actors,b);if(boss===b)boss=null;return;}}
  else if(b.truck&&b.truck.alive&&!fightPlayer){tx=b.truck.pos.x;tz=b.truck.pos.z;}
  else if(fightPlayer){tx=P.pos.x;tz=P.pos.z;}
  if(tx!==undefined){const dx=tx-b.pos.x,dz=tz-b.pos.z,l=Math.hypot(dx,dz)||1;b.yaw=angLerp(b.yaw,Math.atan2(dx,dz),damp(1.5,dt));
    const keep=b.leave?0:(fightPlayer&&!(b.truck&&b.truck.alive)?30:9);
    const anchor=b.truck?Math.hypot(b.pos.x-b.truck.pos.x,b.pos.z-b.truck.pos.z):0;
    if(l>keep&&(b.leave||anchor<40||!(fightPlayer))){const sp=9*(1-(b.slow||0));b.pos.x+=Math.sin(b.yaw)*sp*dt;b.pos.z+=Math.cos(b.yaw)*sp*dt;moving=true;}}
  if(moving){const prev=Math.sin(b.phase);b.phase+=dt*2.2;const cur=Math.sin(b.phase);if(prev*cur<=0){b.stepSide=-b.stepSide;mechStep(b);}}
  if(b.truck&&b.truck.alive&&!fightPlayer&&!b.leave&&Math.hypot(b.truck.pos.x-b.pos.x,b.truck.pos.z-b.pos.z)<12){b.punchT-=dt;if(b.punchT<=0){b.punchT=1.6;b.punchAnim=1;
    Damage.apply(b,b.truck,26,'punch');const t=b.truck.pos;burst(t.x,2,t.z,20,14,0.5,SPARK,1.2,10,1);SFX.boom(0.5*SFX.vol(t.x,2,t.z),0.4);addShake(0.2*SFX.vol(t.x,2,t.z));}}
  if(fightPlayer&&!b.leave){
    b.gunT-=dt;if(b.gunT<=0&&dP<220){b.gunT=rr(1.4,2.2);for(const side of [-1,1]){const m=mechPoint(b,side*9.8,26,8);const v=dirTo(m,P.pos.x+rr(-2,2),P.pos.y+1.3,P.pos.z+rr(-2,2));
      fireProj({kind:'shot',owner:b,x:m.x,y:m.y,z:m.z,vx:v[0]*70,vy:v[1]*70,vz:v[2]*70,dmg:9,r:0.5,life:4});}SFX.zap(1);}
    b.rocketT-=dt;if(b.rocketT<=0&&dP<300){b.rocketT=rr(4.5,6);for(let i=0;i<6;i++)later(i*0.12,()=>{if(!b.alive)return;const m=mechPoint(b,(i%2?1:-1)*8,40,-1);
      fireProj({kind:'rocket',owner:b,x:m.x,y:m.y,z:m.z,vx:rr(-8,8),vy:rr(25,35),vz:rr(-8,8),dmg:14,r:0.7,life:7,homing:true});});SFX.tone('sawtooth',200,500,0.5,0.1);}
  }
}
function mechStep(b){
  const f=mechPoint(b,b.stepSide*4,0,1);const v=SFX.vol(f.x,0,f.z);
  ringFx(f.x,0.3,f.z,1,14,0.45,[1,.9,.7]);burst(f.x,0.4,f.z,24,16,0.8,DUST,2.4,-3,2.4);SFX.boom(0.6*v,0.5);addShake(0.35*v);scare(f.x,f.z,50);
  if(!P.dead&&P.grounded&&Math.hypot(P.pos.x-f.x,P.pos.z-f.z)<18)Damage.apply(b,P,12,'stomp',{knock:16});
  for(const a of actors)if(a.kind==='vehicle'&&a.alive&&a!==b.truck&&Math.hypot(a.pos.x-f.x,a.pos.z-f.z)<7)Damage.apply(b,a,80,'stomp');
}

// ================================================================
// Crimes: scripted scenes that play out in the world (map only, no alerts)
// ================================================================
let crimeT=6,heistT=CRIMES.heistFirst,rivalT=CRIMES.rivalGap[0],popT=0;
let vaultY=bank?bank.vault.y:0,vaultGoneT=0;
function newCrime(type,x,z,label,icon){const c={type,x,z,label,icon,helped:false,age:0,actors:[],heist:false,stage:'start'};crimes.push(c);return c;}
function pickNear(list,minD,maxD){
  const C=pick(WS.centers());const ok=list.filter(o=>{const d=Math.hypot(o.x-C.x,o.z-C.z);return d>=minD&&d<=maxD;});
  if(!ok.length)return null;return pick(ok);
}
function curbPlace(v,x,z,nx,nz){const [cx,cz]=blockCenter(x,z);if(nx!==0){v.axis=0;v.lane=cx+nx*33.5;v.s=z;}else{v.axis=1;v.lane=cz+nz*33.5;v.s=x;}v.dir=Math.random()<0.5?1:-1;setVehiclePos(v);}
function startShopRobbery(){
  const s=pickNear(shops.filter(s=>s.prop.alive&&!s.busy),CRIMES.minDist,CRIMES.maxDist);if(!s)return false;s.busy=true;
  const c=newCrime('shop',s.x,s.z,'Robbery at the '+s.name,'$');c.shop=s;c.bags=0;c.need=6;
  const v=makeVehicle('van');v.temp=true;v.state='parked';v.tint=c4('#2a2d33');v.crime=c;curbPlace(v,s.x,s.z,s.nx,s.nz);c.van=v;c.actors.push(v);
  for(let i=0;i<2;i++){const d=spawnDrone(s.x+rr(-2,2),rr(2,4),s.z+rr(-2,2),'thief',c);d.carry=false;c.actors.push(d);}
  for(let i=0;i<2;i++){const d=spawnDrone(s.x+s.nx*6+rr(-6,6),rr(9,14),s.z+s.nz*6+rr(-6,6),'guard',c);c.actors.push(d);}
  c.update=dt=>{
    const alive=c.actors.filter(a=>a.kind==='drone'&&a.alive);
    if(c.stage!=='escape'){
      for(const d of alive){if(d.role!=='thief'||d.target)continue;
        const door={x:s.x,y:1.8,z:s.z},van={x:v.pos.x,y:2.8,z:v.pos.z};
        if(!v.alive){d.goal=null;d.target=droneWants(d)||d.target;continue;}
        if(!d.carry){d.goal={...door,sp:10};if(Math.hypot(d.pos.x-door.x,d.pos.y-door.y,d.pos.z-door.z)<1.8){d.carry=true;d.bag=true;}}
        else{d.goal={...van,sp:9};if(Math.hypot(d.pos.x-van.x,d.pos.y-van.y,d.pos.z-van.z)<2.2){d.carry=false;d.bag=false;c.bags++;}}}
      if(c.bags>=c.need&&v.alive){c.stage='escape';v.state='flee';v.dir=awayDir(v);v.maxSpd=14;}
    }else{for(const d of alive)if(!d.target)d.goal={x:v.pos.x,y:7,z:v.pos.z,sp:30};if(v.escaped)return 'escaped';}
    if(!alive.length&&(!v.alive||c.stage!=='escape'))return 'cleared';
    return 'active';
  };
  c.cleanup=esc=>{s.busy=false;if(esc&&s.prop.alive){s.prop.alive=false;s.prop.reopen=60;}if(esc||v.alive){if(v.alive&&!esc){v.state='flee';v.dir=awayDir(v);v.maxSpd=11;}}};
  return true;
}
function startAtmHack(){
  const a=pickNear(atms.filter(a=>a.prop.alive&&!a.busy),CRIMES.minDist,CRIMES.maxDist);if(!a)return false;a.busy=true;
  const c=newCrime('atm',a.x,a.z,'ATM being hacked','$');c.timer=45;
  const d=spawnDrone(a.fx+a.nx*1.1,2,a.fz+a.nz*1.1,'hacker',c);d.goal={x:a.fx+a.nx*1.1,y:2,z:a.fz+a.nz*1.1,sp:6};c.actors.push(d);
  c.update=dt=>{if(!d.alive)return 'cleared';
    if(!d.target){c.timer-=dt;if(Math.random()<0.5)emit(a.fx,1.8,a.fz,rr(-3,3),rr(2,6),rr(-3,3),0.4,SPARK[0],0.8,20,1);if(Math.random()<0.05)burst(a.fx,1.6,a.fz,4,5,1,CASH,1,6,1);
      if(c.timer<=0){d.leave=true;d.bag=true;return 'escaped';}}
    return 'active';};
  c.cleanup=()=>{a.busy=false;};
  return true;
}
function startMugging(){
  const p=sidewalkPointNear(P.pos.x,P.pos.z,CRIMES.minDist,300);
  const c=newCrime('mug',p.x,p.z,'Mugging','!');
  const victim=spawnHuman('civilian',p.x,p.z,{path:p.path,crime:c});
  const q=pathPos({...p.path,u:p.path.u+14*p.path.dir});
  const thug=spawnHuman('thug',q.x,q.z,{crime:c});thug.gun=false;thug.wanted=1;thug.state='goto';thug.goal={x:p.x,z:p.z};thug.goalRun=true;thug.onArrive='mug';
  c.actors.push(victim,thug);c.hitT=1.5;
  c.update=dt=>{
    if(!thug.alive)return 'cleared';
    if(thug.state==='goto'&&victim.alive)thug.goal={x:victim.pos.x,z:victim.pos.z};
    if(thug.state==='mug'){
      if(c.stage!=='mug'){c.stage='mug';c.timer=10;if(victim.alive)victim.state='victim';}
      thug.yaw=Math.atan2(victim.pos.x-thug.pos.x,victim.pos.z-thug.pos.z);c.timer-=dt;c.hitT-=dt;
      if(c.hitT<=0&&victim.alive){c.hitT=2.5;thug.punchT=time;Damage.apply(thug,victim,3,'punch');if(victim.alive)victim.state='victim';}
      if(c.timer<=0){thug.state='escape';thug.fx=victim.pos.x;thug.fz=victim.pos.z;thug.st=22;if(victim.alive)npcFlee(victim,thug.pos.x,thug.pos.z);victim.crime=null;}
    }
    if(thug.state==='escape'&&thug.st<=0)return 'escaped';
    if(c.age>90)return 'escaped';
    return 'active';};
  c.cleanup=esc=>{victim.crime=null;if(victim.alive&&victim.state==='victim'){victim.state='return';victim.path=pathFor(victim.pos.x,victim.pos.z);}if(esc&&thug.alive&&!thug.target)removeActor(thug);else thug.crime=null;};
  return true;
}
function startCarTheft(){
  const spot=pickNear(curbSpots,CRIMES.minDist,320);if(!spot)return false;
  const c=newCrime('car',spot.x,spot.z,'Car theft','C');
  const car=makeVehicle('car');car.temp=true;car.state='parked';car.tint=pick(CAR_COLS).slice();car.axis=spot.axis;car.lane=spot.axis===0?spot.x:spot.z;car.s=spot.axis===0?spot.z:spot.x;car.dir=Math.random()<0.5?1:-1;setVehiclePos(car);car.crime=c;
  const side=spot.axis===0?[Math.sign(-spot.x+blockCenter(spot.x,spot.z)[0])*1.8,0]:[0,Math.sign(-spot.z+blockCenter(spot.x,spot.z)[1])*1.8];
  const p=sidewalkPointNear(spot.x,spot.z,8,16);
  const thief=spawnHuman('thug',p.x,p.z,{crime:c});thief.wanted=1;thief.state='goto';thief.goal={x:car.pos.x+side[0],z:car.pos.z+side[1]};thief.onArrive='break';
  c.actors.push(car,thief);c.timer=5;
  c.update=dt=>{
    if(!thief.alive)return 'cleared';
    if(thief.state==='break'&&!thief.inCar){c.timer-=dt;thief.moving=0;thief.armsUp=0.6;thief.yaw=Math.atan2(car.pos.x-thief.pos.x,car.pos.z-thief.pos.z);
      if(Math.random()<0.4)emit(car.pos.x-side[0]*0.5,1.5,car.pos.z-side[1]*0.5,rr(-3,3),rr(1,4),rr(-3,3),0.3,SPARK[0],0.6,15,1);
      if(c.timer<=0&&car.alive){thief.inCar=car;thief.held=true;thief.hidden=true;car.driver=thief;car.state='stolen';car.maxSpd=19;car.dir=awayDir(car);SFX.tone('sawtooth',90,160,0.6,0.1*SFX.vol(car.pos.x,1,car.pos.z));}}
    if(thief.inCar){thief.pos.set(car.pos.x,car.pos.y,car.pos.z);if(car.escaped)return 'escaped';}
    if(c.age>120)return 'escaped';
    return 'active';};
  c.cleanup=esc=>{if(esc){if(thief.inCar){car.driver=null;}removeActor(thief);if(car.alive)removeActor(car);}else{thief.crime=null;if(car.alive&&car.state==='parked'){}}};
  return true;
}
function startVaultHeist(){
  if(!bank||vaultGoneT>0)return false;
  const c=newCrime('vault',bank.cx,bank.cz,'The mothership is stealing the bank vault','!!');c.heist=true;
  const b=spawnShip(bank.vault.x,bank.roof+95,bank.vault.z,c);c.boss=b;c.actors.push(b);
  c.update=dt=>{
    if(!b.alive){vaultY=Math.max(bank.vault.y,vaultY-dt*40);return vaultY<=bank.vault.y?'cleared':'active';}
    vaultY+=dt*0.55;if(vaultY>=b.pos.y-6)return 'escaped';return 'active';};
  c.cleanup=esc=>{if(esc){b.leave=true;vaultGoneT=90;vaultY=-999;}else vaultY=bank.vault.y;
    for(const d of drones)if(d.crime===c)d.leave=true;};
  return true;
}
function startTruckHeist(){
  let x=0,z=0;for(let t=0;t<80;t++){const k=1+Math.floor(Math.random()*(GX-1)),m=1+Math.floor(Math.random()*(GZ-2));if(!zEdge(k,m))continue;x=X0+k*CELL;z=Z0+m*CELL;const d=Math.hypot(x-P.pos.x,z-P.pos.z);if(d>160&&d<430)break;}
  const c=newCrime('truck',x,z,'Titan mech is breaking into an armored truck','!!');c.heist=true;
  const t=makeVehicle('truck');t.temp=true;t.state='parked';t.axis=0;t.lane=x+4.5;t.s=z+18;t.dir=1;setVehiclePos(t);t.crime=c;
  const m=spawnMech(x-14,z+18,c);m.truck=t;m.yaw=Math.PI/2;c.boss=m;c.actors.push(t,m);
  c.update=dt=>{if(!m.alive)return 'cleared';
    if(!t.alive&&!c.looted){c.looted=true;c.escT=30;m.leave=true;burst(t.pos.x,2,t.pos.z,60,14,1.6,CASH,1.4,8,1);}
    if(c.looted){c.escT-=dt;if(c.escT<=0||!actors.includes(m))return 'escaped';}
    return 'active';};
  c.cleanup=esc=>{if(esc&&m.alive)m.leave=true;};
  return true;
}
const CRIME_STARTERS=[[startShopRobbery,0.32],[startAtmHack,0.22],[startMugging,0.26],[startCarTheft,0.2]];
function startRandomCrime(){
  let r=Math.random();for(const [f,w] of CRIME_STARTERS){if(r<w){if(f())return true;break;}r-=w;}
  for(const [f] of CRIME_STARTERS.slice().sort(()=>Math.random()-0.5))if(f())return true;return false;
}
function updateCrimes(dt){
  for(let i=crimes.length-1;i>=0;i--){const c=crimes[i];c.age+=dt;const r=c.update(dt);
    if(r==='cleared'||r==='escaped'){crimes.splice(i,1);c.cleanup&&c.cleanup(r==='escaped');
      for(const a of c.actors)if(a.crime===c&&a.kind!=='boss'){a.crime=null;if(a.kind==='drone'&&a.alive)a.leave=true;}
      if(r==='cleared'&&c.helped){const xp=c.heist?CRIMES.clearXp*3:CRIMES.clearXp;addXP(xp);addRep(c.heist?CRIMES.clearRep*3:CRIMES.clearRep);save.stats.crimesStopped++;guideDone('crime');
        if(c.heist){toast('Heist stopped','+'+xp+' XP · '+c.label.replace(/^The /,'the '),'gold');Portal.happy();}else feed('+'+xp+' XP','Crime stopped: '+c.label);persist();}
      if(r==='cleared'&&WS.host)WS.crimeReward(c);}}
  if(state!=='play')return;
  const small=crimes.filter(c=>!c.heist).length;
  if(small<CRIMES.maxActive&&ROOM.crimes){crimeT-=dt;if(crimeT<=0){crimeT=rr(CRIMES.spawnGap[0],CRIMES.spawnGap[1]);startRandomCrime();}}
  if(vaultGoneT>0){vaultGoneT-=dt;if(vaultGoneT<=0&&bank)vaultY=bank.vault.y;}
  if(!crimes.some(c=>c.heist)&&save.level>=CRIMES.heistMinLevel){heistT-=dt;if(heistT<=0){heistT=rr(CRIMES.heistGap[0],CRIMES.heistGap[1]);if(!(Math.random()<0.5&&startVaultHeist()))startTruckHeist();}}
}
function manageGangs(){
  for(let i=gangs.length-1;i>=0;i--){const g=gangs[i];const live=g.members.filter(h=>h.alive&&actors.includes(h));
    const far=Math.hypot(g.spot.x-P.pos.x,g.spot.z-P.pos.z)>300;
    if(!live.length||far){if(far)for(const h of live)removeActor(h);g.spot.used=false;gangs.splice(i,1);}}
  if(gangs.length>=CRIMES.population.gangs)return;
  const spot=pickNear(alleys.filter(a=>!a.used),70,250);if(!spot)return;spot.used=true;
  const g={spot,members:[]};const n=2+Math.floor(Math.random()*3);
  const home={fx:spot.x-spot.nx*6,fz:spot.z-spot.nz*6};
  for(let i=0;i<n;i++){const x=spot.x+rr(-2.5,2.5)+spot.nx*1.5,z=spot.z+rr(-2.5,2.5)+spot.nz*1.5;const role=i===0&&Math.random()<0.18?'boss':'thug';
    const h=spawnHuman(role,x,z,{gang:g});h.home={x,z,fx:home.fx,fz:home.fz};g.members.push(h);}
  gangs.push(g);
}
function managePopulation(dt){
  popT-=dt;if(popT>0)return;popT=1;
  const k=touchOn()?0.6:1,D=CRIMES.despawn,PL=WS.players(),C=PL.map(a=>a.pos);
  const far=(p,d)=>C.every(c=>Math.abs(p.x-c.x)>d||Math.abs(p.z-c.z)>d);
  for(const h of humans.slice())if(!h.crime&&!h.gang&&!h.held&&far(h.pos,D))removeActor(h);
  const countNear=(r,c)=>{let n=0;for(const h of humans)if(h.alive&&h.role===r&&!h.crime&&!h.gang&&Math.abs(h.pos.x-c.x)<150&&Math.abs(h.pos.z-c.z)<150)n++;return n;};
  C.forEach((c,ci)=>{const me=ci===0,who=PL[ci],heat=me?P.heat>0:!!(who.flags&FLAG.wanted);
    let civ=countNear('civilian',c);for(let i=0;civ<CRIMES.population.civilians*k*(me?1:0.7)&&i<3;i++,civ++){const p=sidewalkPointNear(c.x,c.z,45,150);spawnHuman('civilian',p.x,p.z,{path:p.path});}
    const stars=me?P.stars:heat?2:0,wantPolice=ROOM.police?Math.round(CRIMES.population.police*k*(me?1:0.7))+(heat?1+Math.round(stars*1.5):0):0;
    let pol=countNear('police',c);for(let i=0;pol<wantPolice&&i<2;i++,pol++){const p=sidewalkPointNear(c.x,c.z,heat?55:60,heat?90:150);const h=spawnHuman('police',p.x,p.z,{path:p.path});if(heat&&(me?!P.dead&&state==='play':who.alive))h.target=who;}});
  manageGangs();
  for(const r of rivals.slice())if(r.alive&&!r.hunter&&far(r.pos,450))removeActor(r);
  for(const v of vehicles.slice())if(v.temp&&!v.crime&&(v.state==='flee'||v.state==='parked')&&(v.escaped||far(v.pos,250)))removeActor(v);
}
function manageRivals(dt){
  if(state!=='play'||P.dead)return;
  const live=rivals.filter(r=>r.alive).length,want=hasBounty()?2:1;
  if(live<want){rivalT-=dt*(hasBounty()?2:1);if(rivalT<=0){rivalT=rr(CRIMES.rivalGap[0],CRIMES.rivalGap[1]);const pf=playerFaction();spawnRival(pf==='villain'?'hero':pf==='hero'?'villain':(Math.random()<0.5?'hero':'villain'));}}
}
function updateWorld(dt){
  if(WS.mirror){WS.updateMirrors(dt);for(const h of humans.slice())if(!h.net)updateHuman(h,dt);for(const v of vehicles.slice())if(!v.net)updateVehicle(v,dt);
    updateProps(dt);updateStreetProps(dt);updateAliens(dt);SFX.setSiren(Math.max(0,...vehicles.filter(v=>v.siren).map(v=>SFX.vol(v.pos.x,1,v.pos.z)),0));return;}
  for(const h of humans.slice())updateHuman(h,dt);
  for(const d of drones.slice())updateDrone(d,dt);
  for(const v of vehicles.slice())updateVehicle(v,dt);
  updateHunters(dt);
  for(const r of rivals.slice())updateRival(r,dt);
  if(boss){if(boss.type==='ship')updateShip(boss,dt);else updateMech(boss,dt);}
  updateProps(dt);updateStreetProps(dt);updateCrimes(dt);managePopulation(dt);manageRivals(dt);updatePolice(dt);updateHelis(dt);updateAmbient(dt);updateAliens(dt);
  SFX.setSiren(Math.max(0,...vehicles.filter(v=>v.siren).map(v=>SFX.vol(v.pos.x,1,v.pos.z)),0));
}
function seedTraffic(){
for(let i=0;i<CONFIG.traffic.cars;i++)placeTraffic(makeVehicle('car'));
for(let i=0;i<CONFIG.traffic.police;i++)placeTraffic(makeVehicle('police','police'));
for(const sp of curbSpots.filter((_,i)=>i%5===0)){const v=makeVehicle('car');v.state='parked';v.axis=sp.axis;v.lane=sp.axis===0?sp.x:sp.z;v.s=sp.axis===0?sp.z:sp.x;v.dir=Math.random()<0.5?1:-1;v.tint=pick(CAR_COLS).slice();setVehiclePos(v);v.yaw=v.ty;}
}
seedTraffic();
