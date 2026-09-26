// ================================================================
// Player, damage, energy, progression, reputation
// ================================================================
let state='menu',paused=false,time=0,tod=0.64,timeFast=false,shake=0,hurtFlash=0,flashWhite=0,lastHurtSfx=0,slowT=0;
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
const actors=[];
const P={isPlayer:true,kind:'player',alive:true,pos:new V3(0,0,20),vel:new V3(),yaw:0,pitch:-0.12,heroYaw:Math.PI,tilt:0,bank:0,
  mstate:'ground',grounded:true,charging:false,chargeT:0,hp:100,en:100,lastHit:-99,lastSpend:-99,dead:false,deadT:0,
  flying:false,speeding:false,wall:null,wallCd:0,web:null,tk:null,metal:false,shield:0,shieldOn:false,slam:false,
  punchCd:0,punchN:0,punchT:-9,punchArm:1,alien:null,invisible:0,dashT:0,car:null,boomed:false,phase:0,heat:0,stun:0,slow:0,radius:0.8,height:2.7,
  eye:new V3(0,2.5,20),anim:{legL:0,legR:0,armL:0,armR:0,armLz:-0.12,armRz:0.12,cape:0.2}};
P.hp=maxHp();P.en=maxEn();
const _c={x:0,y:0,z:0};
function center(a){if(a===P){_c.x=P.pos.x;_c.y=P.pos.y+1.3;_c.z=P.pos.z;}else{_c.x=a.pos.x;_c.y=a.pos.y+(a.cy||0);_c.z=a.pos.z;}return _c;}
function spend(n){if(P.en<n)return false;P.en-=n;P.lastSpend=time;return true;}
function addShake(v){shake=Math.min(1.5,shake+v*(REDUCED?0.2:1));}

function knock(t,src,power,up=0.45){
  let dx=0,dz=0;if(src&&src.pos){dx=t.pos.x-src.pos.x;dz=t.pos.z-src.pos.z;}
  let l=Math.hypot(dx,dz);if(l<1e-3){dx=rr(-1,1);dz=rr(-1,1);l=Math.hypot(dx,dz)||1;}dx/=l;dz/=l;
  if(t===P){P.vel.x+=dx*power;P.vel.z+=dz*power;if(!P.flying){P.vel.y=Math.max(P.vel.y,power*up);P.grounded=false;}return;}
  if(t.kind==='human'){t.air=true;t.vel.set(dx*power,power*up+3,dz*power);t.tumble=rr(4,9)*(Math.random()<0.5?-1:1);}
  else if(t.kind==='drone'||t.kind==='rival'){t.vel.x+=dx*power;t.vel.z+=dz*power;t.vel.y+=power*up;}
}
// combo hits: explicit launch velocity, a small nudge, air-juggle float, and 'flung' so impacts crater
function hitMotion(t,src,opt){
  if(opt.nudge&&!opt.kv){if(t.kind==='human'&&!t.air&&!t.hidden){t.pos.x+=opt.nudge[0];t.pos.z+=opt.nudge[1];}else if(t.kind==='rival'){t.pos.x+=opt.nudge[0];t.pos.z+=opt.nudge[1];}return;}
  const k=opt.kv;if(!k)return;
  if(t.kind==='human'){if(t.hidden||t.held)return;t.air=true;t.vel.set(k[0],k[1],k[2]);t.tumble=(opt.flung?rr(6,11):rr(1,3))*(Math.random()<0.5?-1:1);}
  else if(t.kind==='drone'||t.kind==='rival'){t.vel.set(k[0],k[1],k[2]);}
  else return;
  if(opt.float)t.floatT=opt.float;if(opt.apex)t.apexT=time;
  if(opt.flung){t.flungT=time;t.flungBy=src;t.heavy=opt.heavy||0;if(t.kind!=='drone')startRagdoll(t,k[0],k[1],k[2]);}
}
const Damage={
  apply(src,t,amount,type='hit',opt={}){
    if(!t||!(amount>0))return 0;
    if(tsIntercept(src,t,amount,type,opt))return amount;
    if(t===P){
      if(P.dead||state!=='play')return 0;
      if(P.iframeT>0){if(time-(P.dodgeT||-9)>0.4){P.dodgeT=time;feed('Dodged','');}return 0;}
      if(spiderSense(src,type))return 0;
      if(src&&src.kind!=='remote'&&type!=='pvp')amount*=CONFIG.health.npcTaken;
      amount=ringAbsorb(amount);if(amount<=0)return 0;
      if(P.shield>0){const a=Math.min(P.shield,amount);P.shield-=a;amount-=a;ringFx(P.pos.x,P.pos.y+1.3,P.pos.z,1.5,2.6,0.25,[.4,.85,1]);if(P.shield<=0)breakShield();}
      if(P.metal)amount*=1-pstat('metalSkin','dr');amount*=bodyDamageMul();
      if(P.alien&&P.alien.armor>0)amount*=0.4;if(P.car)amount*=0.5;
      if(amount<=0)return 0;
      P.hp-=amount;P.lastHit=time;hurtFlash=Math.min(1,hurtFlash+0.2+amount/40);
      if(time-lastHurtSfx>0.15){lastHurtSfx=time;SFX.hit();}
      if(opt.kv){P.vel.set(opt.kv[0]*0.85,opt.kv[1]*0.85,opt.kv[2]*0.85);P.grounded=false;P.web=null;P.wall=null;P.wallRun=null;if(Math.hypot(...opt.kv)>20){P.flying=false;P.flungT=time;if(!P.alien)startRagdoll(P,P.vel.x,P.vel.y,P.vel.z);}}
      else if(opt.knock)knock(P,src,opt.knock*0.6);
      if(type==='pvp'&&opt.stun)P.stun=Math.max(P.stun,Math.min(1.4,opt.stun));
      Bus.emit('damaged',{source:src,target:P,amount,type});
      if(P.hp<=0){P.hp=0;playerDown(src);}
      return amount;
    }
    if(t.net&&WS.mirror){if(src!==P||!t.alive)return 0;WS.sendHit(t,amount,type,opt);dmgNum(t,amount);hitMarkT=time;t.flash=1;t.lastHit=time;Bus.emit('damaged',{source:P,target:t,amount,type});return amount;}
    if(!t.alive)return 0;
    if(t.kind==='prop'&&src!==P&&!(src&&src.kind==='remote'))return 0;
    if(t.kind==='remote')return src===P?MP.hit(t,amount,type,opt):(WS.host&&src?WS.npcHit(t,src,amount,type,opt):0);
    if(src===P){dmgNum(t,amount);hitMarkT=time;}
    if(t.kind==='human'&&t.role==='civilian'&&t.hp-amount<=0&&src!==P&&!t.downed){t.hp=1;t.downed=25;t.flash=1;t.state='downed';if(opt.knock)knock(t,src,opt.knock);Bus.emit('damaged',{source:src,target:t,amount,type});return amount;}
    t.hp-=amount;t.flash=1;t.lastHit=time;
    if(opt.stun)t.stun=Math.max(t.stun||0,opt.stun);
    if(opt.burn){t.burn=opt.burn.time;t.burnDps=opt.burn.dps;t.burnSrc=src;}
    if(src&&src!==t){t.grudge=src;t.grudgeT=time;}
    if(opt.kv||opt.nudge)hitMotion(t,src,opt);else if(opt.knock&&t.hp>0)knock(t,src,opt.knock);
    if(t.onHit)t.onHit(src,amount);
    Bus.emit('damaged',{source:src,target:t,amount,type});
    if(t.hp<=0){t.hp=0;t.alive=false;if(opt.kv)hitMotion(t,src,opt);else if(opt.knock)knock(t,src,opt.knock);if(t.onDefeat)t.onDefeat(src);Bus.emit('defeated',{target:t,killer:src});}
    return amount;
  }
};
let hitMarkT=-9;
function breakShield(){P.shield=0;P.shieldOn=false;PS.energyShield.cd=POWERS.energyShield.cooldown;ringFx(P.pos.x,P.pos.y+1.3,P.pos.z,2,6,0.4,[.4,.85,1]);SFX.tone('square',900,200,0.3,0.12);feed('Shield broken','Recharging for '+POWERS.energyShield.cooldown+' s');}
function playerDown(killer){
  P.dead=true;P.deadT=CONFIG.health.respawn;stopAllPowers();
  explode(P.pos.x,P.pos.y+1.2,P.pos.z,0.8);
  $('dead').hidden=false;$('deads').textContent=(killer&&killer.name?killer.name+' took you down. ':'')+'Back in '+CONFIG.health.respawn+' seconds. You keep your level, powers and reputation.';
  MP.sendDown(killer);Bus.emit('playerDefeated',{killer});
}
function respawn(){
  const s=SPAWNS[(Math.random()*SPAWNS.length)|0];if(P.alien)revertAlien(true);
  P.dead=false;P.pos.set(s[0],0,s[1]);P.vel.set(0,0,0);P.hp=maxHp();P.en=maxEn();P.heat=0;P.stun=0;P.lastHit=-99;
  $('dead').hidden=true;
}

// ---- progression ----
const xpNeed=()=>CONFIG.progression.xpToNext(save.level);
function addXP(n){
  if(!(n>0)||save.level>=CONFIG.progression.levelCap)return;
  save.xp+=n;let ups=0;
  while(save.level<CONFIG.progression.levelCap&&save.xp>=xpNeed()){save.xp-=xpNeed();save.level++;save.sp+=CONFIG.progression.spPerLevel;ups++;}
  if(ups){
    P.hp=maxHp();P.en=maxEn();
    toast('Level '+save.level,'+'+ups*CONFIG.progression.spPerLevel+' skill points · '+(touchOn()?'open Skills from the pause menu':'press Tab to spend them'),'gold');
    SFX.levelUp();ringFx(P.pos.x,P.pos.y+1,P.pos.z,1,30,0.8,[1,.8,.3]);burst(P.pos.x,P.pos.y+1.2,P.pos.z,60,20,1,GOLD,1.6,-4,1.5);
    persist();Bus.emit('levelUp',save.level);
  }
}
function addRep(n){
  if(!n)return;const before=repTier(save.reputation).name;
  save.reputation=clamp(Math.round(save.reputation+n),REP.min,REP.max);
  const t=repTier(save.reputation);
  if(t.name!==before){toast(t.name,t.faction==='hero'?'The city respects you':t.faction==='villain'?'The city fears you':'Nobody is sure whose side you are on',t.faction==='villain'?'red':t.faction==='hero'?'cyan':'');persist();}
}
Bus.on('damaged',({source,target,amount})=>{
  if(source!==P||target===P)return;
  if(target.kind!=='vehicle'&&target.kind!=='prop')addXP(amount*CONFIG.progression.dmgXp);
  if(target.crime)target.crime.helped=true;
  if(target.kind==='human'&&(target.role==='civilian'||target.role==='police')){
    if(time-(target.repT||-9)>0.4){target.repT=time;if(target.role==='civilian')addRep(REP.civHit);P.heat=Math.min(10,P.heat+(target.role==='police'?4:1.5));}
  }
});
Bus.on('defeated',({target,killer})=>{
  if(target.crime)target.crime.helped=target.crime.helped||killer===P;
  if(killer!==P)return;
  let xp=0,rep=0,label='';
  if(target.kind==='human'){const c=NPCS[target.role];xp=c.xp;rep=c.rep;label={civilian:'Civilian down',thug:'Thug defeated',boss:'Crime boss defeated',police:'Police officer down'}[target.role];
    if(target.role==='police')P.heat=10;}
  else if(target.kind==='drone'){xp=NPCS.drone.xp;rep=NPCS.drone.rep;label='Drone destroyed';}
  else if(target.kind==='heli'){xp=150;rep=-40;label='Police helicopter down';P.heat=10;}
  else if(target.kind==='rival'){xp=NPCS.rival.xp+NPCS.rival.xpPerLvl*target.level;rep=target.faction==='villain'?NPCS.rival.rep:-NPCS.rival.rep;if(target.bounty){xp*=2;rep*=2;}label=target.name+' defeated'+(target.bounty?' · bounty claimed':'');}
  else if(target.kind==='boss'){const c=NPCS[target.type];xp=c.xp;rep=c.rep;label=(target.type==='ship'?'Mothership':'Titan mech')+' destroyed';}
  else return;
  save.stats.defeated++;addXP(xp);addRep(rep);
  feed('+'+Math.round(xp)+' XP'+(rep?' · '+(rep>0?'+':'')+rep+' rep':''),label);
});

// ---- XP orbs ----
const orbs=orbSpots.map(s=>({x:s.x,y:s.y,z:s.z,roof:s.roof,type:'yellow',active:true,t:0,ph:Math.random()*TAU}));
function rollOrb(o){const r=Math.random();o.type=o.roof?(r<0.14?'red':r<0.5?'blue':'yellow'):(r<0.2?'blue':'yellow');}
orbs.forEach(rollOrb);
const ORB_COL={yellow:[1,.82,.2],blue:[.3,.7,1],red:[1,.22,.22]};
function updateOrbs(dt){
  const R=CONFIG.progression.orbRadius+P.radius;
  for(const o of orbs){
    if(!o.active){o.t-=dt;if(o.t<=0){o.active=true;rollOrb(o);}continue;}
    if(P.dead||state!=='play')continue;
    if(Math.abs(o.x-P.pos.x)<R&&Math.abs(o.z-P.pos.z)<R&&Math.hypot(o.x-P.pos.x,o.y-(P.pos.y+1.3),o.z-P.pos.z)<R+0.6){
      o.active=false;o.t=rr(CONFIG.progression.orbRespawn[0],CONFIG.progression.orbRespawn[1]);
      const xp=CONFIG.progression.orbs[o.type];addXP(xp);feed('+'+xp+' XP',o.type[0].toUpperCase()+o.type.slice(1)+' orb');
      SFX.chime();const c=ORB_COL[o.type];burst(o.x,o.y,o.z,40,14,0.8,[c,[1,1,1]],1.4,-2,1.5);ringFx(o.x,o.y,o.z,0.5,6,0.35,c);
    }
  }
}

// ================================================================
// Effects: rings, debris, scorch marks, fires, tracers, explosions
// ================================================================
const rings=[],timers=[],debris=[],scorches=[],fires=[],tracers=[],wrecks=[],windows=[],fountains=[],dmgNums=[];
const METAL=hex('#3a3f48');
function ringFx(x,y,z,r0,r1,dur,col,dir=null){rings.push({x,y,z,r0,r1,dur,t:0,col,dir});}
function later(t,fn){timers.push({t,fn});}
function tracer(ax,ay,az,bx,by,bz,col,w=0.06,life=0.07){tracers.push({ax,ay,az,bx,by,bz,col,w,life,max:life});}
function spawnPiece(x,y,z,mesh,sx,sy,sz,col,vx,vy,vz,life=8,rot=null){
  if(debris.length>=220)debris.shift();
  debris.push({x,y,z,vx,vy,vz,rx:rot?rot[0]:0,ry:rot?rot[1]:0,rz:rot?rot[2]:0,wx:rr(-6,6),wy:rr(-6,6),wz:rr(-6,6),mesh,dx:sx,dy:sy,dz:sz,s:Math.min(sx,sy,sz),h:sy,tint:[col[0],col[1],col[2],1],life:life*rr(0.8,1.2),rest:false});
}
function spawnDebris(x,y,z,n,col,spd){
  for(let k=0;k<n;k++){const s=rr(0.25,0.9);spawnPiece(x,y,z,MESH.box,s,s*0.7,s*1.1,col,rr(-1,1)*spd,rr(0.3,1.2)*spd,rr(-1,1)*spd,rr(5,8));}
}
// floating damage numbers (merged per target so beams don't spam)
function dmgNum(t,amount){
  for(const d of dmgNums)if(d.t===t&&d.age<0.35){d.v+=amount;d.age=0;return;}
  if(dmgNums.length>=24)dmgNums.shift();const c=center(t);dmgNums.push({t,v:amount,x:c.x,y:c.y+(t.kind==='boss'?8:1.4),z:c.z,age:0,life:0});
}
// glass: shards, a dark broken-window patch and a tinkle
function shatter(x,y,z,nx,nz,big=false){
  const n=big?40:18;for(let k=0;k<n;k++)emit(x,y,z,nx*rr(2,8)+rr(-4,4),rr(-1,5),nz*rr(2,8)+rr(-4,4),rr(0.8,1.6),GLASSC[(Math.random()*3)|0],rr(0.3,0.7),18,0.3);
  for(let k=0;k<(big?8:3);k++){const s=rr(0.15,0.45);spawnPiece(x+rr(-1,1),y+rr(-1,1),z+rr(-1,1),MESH.box,s,0.03,s*1.3,[.7,.85,.95],nx*rr(2,6)+rr(-2,2),rr(0,4),nz*rr(2,6)+rr(-2,2),4);}
  SFX.glass(SFX.vol(x,y,z));
}
function breakWindowAt(b,x,y,z){
  const n=faceNormal(b,x,y,z);if(n[1]!==0||y<4||y>b.y1-1)return;
  // snap to the facade window grid so the hole lines up with a window
  const gx=Math.round(y/4)*4+2;if(gx>b.y1-1)return;
  const fx=n[0]>0?b.x1:n[0]<0?b.x0:x,fz=n[2]>0?b.z1:n[2]<0?b.z0:z;
  for(const w of windows)if(Math.abs(w.x-fx)<1.5&&Math.abs(w.y-gx)<1&&Math.abs(w.z-fz)<1.5){return;}
  WS.destroyed('wb',{ci:colliders.indexOf(b),x,y,z});
  if(windows.length>=90)windows.shift();windows.push({x:fx+n[0]*0.03,y:gx,z:fz+n[2]*0.03,nx:n[0],nz:n[2],life:CONFIG.destruction.windowLife});
  shatter(fx+n[0]*0.5,gx,fz+n[2]*0.5,n[0],n[2]);
}
// street furniture destruction
function breakProp(p,src,ix=0,iz=0){
  if(!p.alive)return;WS.destroyed('pb',{bi:p.bi,i:blockProps[p.bi].indexOf(p)});p.alive=false;p.respawn=CONFIG.destruction.propRespawn;propDirty.add(p.bi);
  const d=PROP_DEF[p.type],spd=Math.hypot(ix,iz);
  for(const part of d.parts){const M=propPartM(p,part);const mesh=part[0]==='cyl'?MESH.cyl:part[0]==='sphere'?MESH.sphere:MESH.box;
    const col=part[0]==='sphere'&&p.tint?p.tint:part[7];
    spawnPiece(M[12],M[13],M[14],mesh,part[4],part[5],part[6],col,ix*0.6+rr(-3,3),rr(2,6)+spd*0.15,iz*0.6+rr(-3,3),9,[part[9]||0,p.yaw+(part[10]||0),part[11]||0]);}
  const v=SFX.vol(p.x,1,p.z);
  if(d.glass)shatter(p.x,1.5,p.z,Math.sin(p.yaw),Math.cos(p.yaw),true);
  if(p.type==='hydrant'){fountains.push({x:p.x,z:p.z,t:22});SFX.splash(v);}
  if(d.leaf)burst(p.x,3.5,p.z,40,8,1.6,LEAF,1.4,6,1.2);
  burst(p.x,1,p.z,14,8,0.6,DUST,1.6,-2,2);if(p.type==='lamp'||p.type==='tlight')burst(p.x,6,p.z,16,10,0.5,SPARK,0.8,15,1);
  SFX.crash(v*0.5);scare(p.x,p.z,15);
}
const propDirty=new Set();
function hitProps(x,y,z,R,src,force=12){
  if(y>9)return;for(const p of propsNear(x,z,R).slice()){const dx=p.x-x,dz=p.z-z,l=Math.hypot(dx,dz)||1;if(l<R+p.r)breakProp(p,src,dx/l*force,dz/l*force);}
}
function updateStreetProps(dt){
  let n=0;for(const bi of propDirty){buildBlockProps(bi);propDirty.delete(bi);if(++n>3)break;}
  for(const list of blockProps)for(const p of list)if(!p.alive){p.respawn-=dt;if(p.respawn<=0&&Math.hypot(p.x-P.pos.x,p.z-P.pos.z)>110){p.alive=true;p.hp=p.maxHp;propDirty.add(p.bi);}}
}
function addScorch(x,y,z,r,nx=0,ny=1,nz=0,cr=false){if(scorches.length>=110)scorches.shift();scorches.push({x:x+nx*0.07,y:y+ny*0.07,z:z+nz*0.07,r,nx,ny,nz,life:cr?150:60,cr});}
function addFire(x,y,z,t,r,big=false){if(fires.length>=24)fires.shift();const f={x,y,z,t,r,big};fires.push(f);return f;}
function explode(x,y,z,s=1){
  burst(x,y,z,Math.round(55*s),26*s,1.0,FIRE,3.2*s,-4,1.8);
  burst(x,y,z,Math.round(26*s),48*s,0.7,SPARK,1.0,20,0.6);
  smoke(x,y,z,Math.max(2,Math.round(5*s)),2*s,5*s,3,0.22);
  ringFx(x,y,z,1,14*s,0.45,[1,.6,.25]);
  const v=SFX.vol(x,y,z);SFX.boom(v*Math.min(1,0.6*s),0.9+s*0.3);addShake(0.5*s*v);
  scare(x,z,45*s);
  spawnDebris(x,y,z,Math.max(1,Math.round(3*s)),METAL,16*s);
  const b=inBuilding(x,y,z,4);if(b&&b.bld)damageBuilding(b.bld,120*s,x,y,z,0,0);if(b&&b.y1>3){spawnDebris(x,y,z,Math.round(7*s),b.col||WALK,13*s);breakWindowAt(b,x,y,z);if(s>0.9)breakWindowAt(b,x,y+4,z);if(s>=0.7){const n=faceNormal(b,x,y,z);if(n[1]===0)addScorch(x,y,z,2.2*s,n[0],0,n[2],true);}}
  hitProps(x,y,z,4*s,null,14*s);
}
function areaDamage(x,y,z,R,dmg,src,opt={}){
  if(dmg>=15)hitProps(x,y,z,R*0.6,src,10);
  for(const a of actors){
    if(!a.alive||a===src||a.held||a===opt.exclude)continue;if(a.kind==='prop'&&!opt.props)continue;
    if(src&&src!==P&&src.faction&&a.faction===src.faction)continue;
    const c=center(a);const d=Math.hypot(c.x-x,c.y-y,c.z-z);
    if(d<R+(a.radius||1))Damage.apply(src,a,dmg*clamp(1-d/(R*1.3),0.25,1),opt.type||'blast',opt);
  }
  if(src!==P&&!P.dead){const d=Math.hypot(P.pos.x-x,P.pos.y+1.3-y,P.pos.z-z);if(d<R+0.8)Damage.apply(src,P,dmg*clamp(1-d/(R*1.3),0.25,1),opt.type||'blast',opt);}
}
function faceNormal(b,x,y,z){
  const d=[x-b.x0,b.x1-x,y-b.y0,b.y1-y,z-b.z0,b.z1-z];let m=0;for(let i=1;i<6;i++)if(d[i]<d[m])m=i;
  return [[-1,0,0],[1,0,0],[0,-1,0],[0,1,0],[0,0,-1],[0,0,1]][m];
}
function updateFx(dt){
  for(let i=rings.length-1;i>=0;i--){rings[i].t+=dt;if(rings[i].t>=rings[i].dur)rings.splice(i,1);}
  for(let i=timers.length-1;i>=0;i--){timers[i].t-=dt;if(timers[i].t<=0){const f=timers[i].fn;timers.splice(i,1);f();}}
  for(let i=tracers.length-1;i>=0;i--){tracers[i].life-=dt;if(tracers[i].life<=0)tracers.splice(i,1);}
  for(let i=debris.length-1;i>=0;i--){const d=debris[i];d.life-=dt;if(d.life<=0){debris.splice(i,1);continue;}
    if(d.rest)continue;d.vy-=40*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.z+=d.vz*dt;d.rx+=d.wx*dt;d.ry+=d.wy*dt;d.rz+=d.wz*dt;
    const b=inBuilding(d.x,d.y,d.z);if(b&&b.y1>1){const n=faceNormal(b,d.x,d.y,d.z);if(n[1]>0.5){d.y=b.y1+d.s*0.5;d.vy=Math.abs(d.vy)*0.3;}else{d.x+=n[0]*0.3;d.z+=n[2]*0.3;if(n[0])d.vx=-d.vx*0.4;if(n[2])d.vz=-d.vz*0.4;}}
    const g=groundY(d.x,d.z,d.y+1);if(d.y-d.s*0.5<=g){d.y=g+d.s*0.5;if(Math.abs(d.vy)<5){d.rest=true;d.rx=Math.round(d.rx/(Math.PI/2))*(Math.PI/2);d.rz=Math.round(d.rz/(Math.PI/2))*(Math.PI/2);}d.vy*=-0.35;d.vx*=0.55;d.vz*=0.55;d.wx*=0.5;d.wy*=0.5;d.wz*=0.5;}}
  for(let i=windows.length-1;i>=0;i--){windows[i].life-=dt;if(windows[i].life<=0)windows.splice(i,1);}
  for(let i=fountains.length-1;i>=0;i--){const f=fountains[i];f.t-=dt;if(f.t<=0){fountains.splice(i,1);continue;}
    if(Math.abs(f.x-camPos.x)<150&&Math.abs(f.z-camPos.z)<150)for(let k=0;k<3;k++)emit(f.x+rr(-.2,.2),0.9,f.z+rr(-.2,.2),rr(-2,2),rr(11,15)*Math.min(1,f.t/4),rr(-2,2),rr(1,1.5),WATER[(Math.random()*2)|0],rr(0.6,1.2),22,0.2);}
  for(let i=dmgNums.length-1;i>=0;i--){const d=dmgNums[i];d.age+=dt;d.life+=dt;d.y+=dt*1.5;if(d.life>1.1)dmgNums.splice(i,1);}
  for(let i=scorches.length-1;i>=0;i--){scorches[i].life-=dt;if(scorches[i].life<=0)scorches.splice(i,1);}
  for(let i=fires.length-1;i>=0;i--){const f=fires[i];f.t-=dt;if(f.t<=0){fires.splice(i,1);continue;}
    const k=Math.min(1,f.t/3),n=f.big?4:1;
    for(let j=0;j<n;j++)if(Math.random()<k)emit(f.x+rr(-f.r,f.r),f.y+rr(0,0.5),f.z+rr(-f.r,f.r),rr(-1,1),rr(4,9)*(f.big?1.4:1),rr(-1,1),rr(0.45,0.9),FIRE[(Math.random()*FIRE.length)|0],rr(1.4,2.8)*(f.big?1.5:1),-3,1);
    if(Math.random()<(f.big?0.5:0.18)*k)smoke(f.x,f.y+1.5,f.z,1,f.r*0.5,f.big?9:4,f.big?5:3,0.16);}
  for(let i=wrecks.length-1;i>=0;i--){const w=wrecks[i];w.vy-=40*dt;w.x+=w.vx*dt;w.y+=w.vy*dt;w.z+=w.vz*dt;w.rx+=w.sx*dt;w.ry+=w.sy*dt;w.rz+=w.sz*dt;
    if(Math.random()<0.7)emit(w.x,w.y,w.z,rr(-2,2),rr(1,4),rr(-2,2),0.5,FIRE[(Math.random()*3)|0],1.8,-2,1);
    if(Math.random()<0.4)smoke(w.x,w.y,w.z,1,0.3,2.2,1.6,0.18);
    const g=groundY(w.x,w.z,w.y+1);const b=inBuilding(w.x,w.y,w.z);
    if(w.y<=g+0.4||b){explode(w.x,w.y+0.4,w.z,0.7);if(b){const n=faceNormal(b,w.x,w.y,w.z);addScorch(w.x,w.y,w.z,2.5,n[0],n[1],n[2]);}else{addScorch(w.x,g,w.z,3);addFire(w.x,g+0.3,w.z,5,0.7);}wrecks.splice(i,1);}}
  shake=Math.max(0,shake-dt*2.2);hurtFlash=Math.max(0,hurtFlash-dt*1.6);flashWhite=Math.max(0,flashWhite-dt*3);
}

// ================================================================
// Projectiles
// ================================================================
const projs=[];
function fireProj(p){projs.push(Object.assign({life:4,grav:0,r:0.6,age:0,homing:false},p));if(p.owner===P&&!p.visual)MP.fx('p',{pk:p.kind,x:Math.round(p.x*10)/10,y:Math.round(p.y*10)/10,z:Math.round(p.z*10)/10,vx:Math.round(p.vx),vy:Math.round(p.vy),vz:Math.round(p.vz)});}
function updateProjs(dt){
  for(let i=projs.length-1;i>=0;i--){
    const p=projs[i];p.age+=dt;p.life-=dt;
    if(p.homing&&p.age>0.6&&!P.dead){const tx=P.pos.x-p.x,ty=P.pos.y+1.3-p.y,tz=P.pos.z-p.z,l=Math.hypot(tx,ty,tz)||1;const k=damp(1.8,dt),sp=46;
      p.vx+=(tx/l*sp-p.vx)*k;p.vy+=(ty/l*sp-p.vy)*k;p.vz+=(tz/l*sp-p.vz)*k;}
    if(p.seek&&p.age>0.25){if(!p.seek.alive)p.seek=null;else{const c=center(p.seek),tx=c.x-p.x,ty=c.y-p.y,tz=c.z-p.z,l=Math.hypot(tx,ty,tz)||1,k=damp(4,dt),sp=Math.max(60,Math.hypot(p.vx,p.vy,p.vz));p.vx+=(tx/l*sp-p.vx)*k;p.vy+=(ty/l*sp-p.vy)*k;p.vz+=(tz/l*sp-p.vz)*k;}}
    p.vy-=p.grav*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
    if(p.kind==='fire'){emit(p.x,p.y,p.z,rr(-2,2),rr(-2,2),rr(-2,2),0.35,FIRE[(Math.random()*4)|0],1.6,-3,1);if(Math.random()<0.3)smoke(p.x,p.y,p.z,1,0.2,1.5,0.8,0.2);}
    else if(p.kind==='blast'&&Math.random()<0.7)emit(p.x,p.y,p.z,0,0,0,0.25,CYAN[(Math.random()*3)|0],1.2,0,0);
    else if(p.kind==='ring'&&!p.small&&Math.random()<0.7)emit(p.x,p.y,p.z,0,0,0,0.25,RING_C,1.2*(p.big||1),0,0);
    else if(p.kind==='web'&&Math.random()<0.6)emit(p.x,p.y,p.z,0,0,0,0.3,[.95,.95,1],0.8,0,0);
    else if(p.kind==='rocket'){emit(p.x,p.y,p.z,rr(-1,1),rr(-1,1),rr(-1,1),0.3,FIRE[1],1.2,0,1);if(Math.random()<0.5)smoke(p.x,p.y,p.z,1,0.2,1.6,1.0,0.35);}
    let hit=null,done=p.life<=0;
    if(!done){
      for(const a of actors){
        if(!a.alive||a===p.owner||a.held)continue;
        if(p.owner!==P&&a.kind==='prop')continue;
        if(p.owner&&p.owner!==P&&p.owner.faction&&a.faction===p.owner.faction)continue;
        const c=center(a);const R=(a.radius||1)+p.r;
        // swept test along this frame's movement so fast shots can't skip past a target
        const sx=p.vx*dt,sy=p.vy*dt,sz=p.vz*dt,ox=p.x-sx,oy=p.y-sy,oz=p.z-sz,L2=sx*sx+sy*sy+sz*sz;
        const k=L2>1e-6?clamp(((c.x-ox)*sx+(c.y-oy)*sy+(c.z-oz)*sz)/L2,0,1):1,qx=ox+sx*k,qy=oy+sy*k,qz=oz+sz*k;
        if(Math.abs(c.x-qx)<R&&Math.abs(c.z-qz)<R&&Math.hypot(c.x-qx,(c.y-qy)*(a.ys||1),c.z-qz)<R){hit=a;break;}
      }
      if(!hit&&p.owner!==P&&!P.dead&&Math.hypot(P.pos.x-p.x,P.pos.y+1.3-p.y,P.pos.z-p.z)<1.2+p.r)hit=P;
    }
    if(!done&&!hit){const b=inBuilding(p.x,p.y,p.z);if(b){done=true;const n=faceNormal(b,p.x,p.y,p.z);p.nx=n[0];p.ny=n[1];p.nz=n[2];}else if(p.y<0.05){done=true;p.nx=0;p.ny=1;p.nz=0;}}
    if(hit||done){projImpact(p,hit);projs.splice(i,1);}
  }
}
function projImpact(p,hit){
  if(p.visual){burst(p.x,p.y,p.z,20,12,0.5,p.kind==='fire'?FIRE:CYAN,1.4,0,2);ringFx(p.x,p.y,p.z,0.5,4,0.3,p.kind==='fire'?[1,.5,.2]:[.4,.85,1]);return;}
  const onSurface=!hit&&p.life>0;
  if(p.kind==='fire'){
    explodeSmall(p.x,p.y,p.z,FIRE,p.radius);
    if(hit&&hit!==P)Damage.apply(p.owner,hit,p.dmg,'fire',{knock:10,burn:p.burn});
    areaDamage(p.x,p.y,p.z,p.radius,p.dmg,p.owner,{type:'fire',knock:10,burn:p.burn,exclude:hit});
    if(onSurface){addScorch(p.x,p.y,p.z,p.radius*0.6,p.nx,p.ny,p.nz);if(p.ny>0.5)addFire(p.x,p.y+0.2,p.z,3,0.6);}
    SFX.boom(0.5*SFX.vol(p.x,p.y,p.z),0.6);
  }else if(p.kind==='blast'){
    if(hit)Damage.apply(p.owner,hit,p.dmg,'blast',{knock:p.knock});
    burst(p.x,p.y,p.z,20,14,0.4,CYAN,1.2,0,2);ringFx(p.x,p.y,p.z,0.5,4,0.25,[.4,.85,1]);
  }else if(p.kind==='bolt'){
    if(hit)Damage.apply(p.owner,hit,p.dmg,'shock',{stun:0.8,knock:14});areaDamage(p.x,p.y,p.z,3.5,p.dmg*0.35,p.owner,{type:'shock',exclude:hit});
    for(let i=0;i<6;i++){const a=rr(0,TAU);tracer(p.x,p.y,p.z,p.x+Math.cos(a)*rr(2,5),p.y+rr(-1,3),p.z+Math.sin(a)*rr(2,5),SPD_C,0.08,0.2);}burst(p.x,p.y,p.z,24,14,0.4,[SPD_C,[1,1,1]],1.2,0,2);SFX.tone('sawtooth',1600,120,0.2,0.08);
  }else if(p.kind==='ring'){
    if(hit)Damage.apply(p.owner,hit,p.dmg,'ring',{knock:p.knock});
    burst(p.x,p.y,p.z,p.small?6:18,p.small?6:14,0.35,[RING_C,[.8,1,.85]],1.1,0,2);if(!p.small)ringFx(p.x,p.y,p.z,0.5,3*(p.big||1),0.25,RING_C);
  }else if(p.kind==='web'){
    if(p.webBomb&&p.owner===P)webBurst(p.x,p.y,p.z);else burst(p.x,p.y,p.z,20,8,0.5,[[.95,.95,1]],1,4,2);
  }else if(p.kind==='rocket'){
    explode(p.x,p.y,p.z,0.6);areaDamage(p.x,p.y,p.z,4.5,p.dmg,p.owner,{knock:10});
    if(onSurface)addScorch(p.x,p.y,p.z,2,p.nx,p.ny,p.nz);
  }else{
    if(hit)Damage.apply(p.owner,hit,p.dmg,'shot',{knock:p.knock||0});
    burst(p.x,p.y,p.z,10,10,0.35,p.col===1?CYAN:RED,1,8,2);
  }
}
function explodeSmall(x,y,z,cols,r){burst(x,y,z,Math.round(18+r*6),r*5,0.7,cols,2.2,-3,2);ringFx(x,y,z,0.5,r*1.6,0.35,cols[1]||cols[0]);smoke(x,y,z,2,r*0.4,3,2,0.22);scare(x,z,30);}
