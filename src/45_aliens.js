// ================================================================
// Morph Band: transform into alien forms (original designs)
// ================================================================
// Each alien replaces your abilities with its own three while the band is active.
// Band level unlocks more aliens, lengthens transformations and boosts alien damage.
const ALIENS={
  magmaw:{name:'Magmaw',blurb:'Molten rock brute. Burning fists and a volcanic slam.',unlock:1,scale:1.3,hp:1.8,speed:0.85,jump:1.1,
    body:'#35261f',glow:'#ff6a1a',abilities:[{id:'lavaFist',name:'Lava Fist',cd:0.9},{id:'magmaSlam',name:'Magma Slam',cd:6},{id:'lavaRock',name:'Molten Hurl',cd:1.8}]},
  zephyrix:{name:'Zephyrix',blurb:'Storm sprite. Always flying, throws tornadoes.',unlock:1,scale:0.95,hp:0.85,speed:1.2,jump:1.2,flies:true,flySpeed:80,
    body:'#bfeff0',glow:'#35f0dc',abilities:[{id:'gale',name:'Gale Blast',cd:1},{id:'tornado',name:'Tornado',cd:10},{id:'dash',name:'Slipstream',cd:2.5}]},
  cryolith:{name:'Cryolith',blurb:'Living glacier. Freezes crowds solid.',unlock:3,scale:1.25,hp:1.5,speed:0.9,jump:1,
    body:'#8fcaf0',glow:'#e4f8ff',abilities:[{id:'iceSpikes',name:'Ice Spikes',cd:4},{id:'frostBreath',name:'Frost Breath',cd:0,channel:true},{id:'crystalArmor',name:'Crystal Armor',cd:12}]},
  voltwing:{name:'Voltwing',blurb:'Electric hunter. Blinding speed, climbs anything.',unlock:5,scale:0.95,hp:1,speed:2.4,jump:1.4,climb:true,
    body:'#26261a',glow:'#ffe83a',abilities:[{id:'arcChain',name:'Arc Chain',cd:1.6},{id:'emp',name:'EMP Burst',cd:12},{id:'blink',name:'Static Blink',cd:3}]},
  colossus:{name:'Colossus',blurb:'Towering titan. Throws cars like pebbles.',unlock:7,scale:3.2,hp:3,speed:0.8,jump:1.6,
    body:'#6b6f7a',glow:'#ff9a3a',abilities:[{id:'stomp',name:'Titan Stomp',cd:4},{id:'carToss',name:'Car Toss',cd:3},{id:'megaPunch',name:'Mega Punch',cd:1.4}]},
  umbra:{name:'Umbra',blurb:'Shadow phaser. Turns invisible and walks through walls.',unlock:9,scale:1,hp:0.9,speed:1.3,jump:1.2,
    body:'#141018',glow:'#b04dff',abilities:[{id:'veil',name:'Shadow Veil',cd:15},{id:'phase',name:'Phase',cd:1,toggle:true},{id:'shadowStrike',name:'Shadow Strike',cd:4}]},
};
const ALIEN_IDS=Object.keys(ALIENS);
const BAND_COL=[.62,.36,1];
const band={cd:0};
const tornados=[],spikes=[];
const aliensUnlocked=()=>ALIEN_IDS.filter(id=>ALIENS[id].unlock<=powerLevel('morphBand'));
const alienDef=()=>P.alien?ALIENS[P.alien.id]:null;
const alienMul=()=>pstat('morphBand','power');
function bandPress(){
  if(!hasPower('morphBand')||!canAct())return;
  if(P.alien){revertAlien(false);return;}
  if(band.cd>0){PS.morphBand.flash=0.4;feed('Morph Band recharging',Math.ceil(band.cd)+' s left');SFX.tone('square',300,200,0.12,0.06);return;}
  openDial();
}
function transformInto(id){
  const a=ALIENS[id];if(!a||!aliensUnlocked().includes(id)||P.alien)return;
  const frac=P.hp/maxHp();stopAllPowers();
  P.alien={id,t:pstat('morphBand','duration'),max:pstat('morphBand','duration'),cds:[0,0,0],armor:0,veil:0,phase:0,channel:false,warn:0};
  P.radius=0.8*Math.max(1,a.scale*0.8);P.height=2.7*a.scale;P.hp=frac*maxHp();
  if(a.flies){P.flying=true;P.grounded=false;}
  const c=center(P);ringFx(c.x,c.y,c.z,1,10*a.scale,0.6,BAND_COL);ringFx(c.x,c.y,c.z,1,6,0.4,[1,1,1]);
  burst(c.x,c.y,c.z,90,18,1,[BAND_COL,[.85,.7,1],[1,1,1]],1.6,0,2);flashWhite=0.45;SFX.transform();addShake(0.3);
  toast(a.name,a.blurb,'purple');MP.fx('t',{});buildHotbar();buildTouchButtons();MP.bump();
}
function revertAlien(silent){
  if(!P.alien)return;const frac=P.hp/maxHp();const a=alienDef();
  if(P.alien.phase>0)unphase();
  P.alien=null;P.radius=0.8;P.height=2.7;P.hp=Math.max(1,frac*maxHp());P.invisible=0;
  if(a&&a.flies&&!hasPower('flight'))P.flying=false;
  band.cd=pstat('morphBand','recharge');
  if(!silent){const c=center(P);ringFx(c.x,c.y,c.z,1,6,0.4,BAND_COL);burst(c.x,c.y,c.z,40,10,0.8,[BAND_COL,[1,1,1]],1.2,0,2);SFX.tone('sine',1200,300,0.4,0.1);}
  buildHotbar();buildTouchButtons();MP.bump();
}
function unphase(){if(!P.alien)return;P.alien.phase=0;const b=inBuilding(P.pos.x,P.pos.y+1,P.pos.z,0.5);if(b){P.pos.y=b.y1+0.1;P.vel.set(0,0,0);}}
// hits every living actor in a cone in front of the player
function coneHit(range,dot,dmg,opt,type='hit'){
  const f=[camF.x,0,camF.z],fl=Math.hypot(f[0],f[2])||1;f[0]/=fl;f[2]/=fl;const c0=center(P),cx=c0.x,cy=c0.y,cz=c0.z;let n=0;
  for(const a of actors.slice()){if(!a.alive||a.held||a.kind==='prop')continue;const c=center(a);const dx=c.x-cx,dy=c.y-cy,dz=c.z-cz,d=Math.hypot(dx,dy,dz);
    if(d>range+(a.radius||1))continue;if((dx*f[0]+dz*f[2])/(Math.hypot(dx,dz)||1)<dot&&d>2)continue;Damage.apply(P,a,dmg,type,opt);n++;}
  return n;
}
function alienAbilityDown(slot){
  const a=alienDef();if(!a||!canAct())return;const ab=a.abilities[slot];if(!ab)return;
  if(ab.channel){P.alien.channel=true;return;}
  if(P.alien.cds[slot]>0){feed(ab.name,'Ready in '+P.alien.cds[slot].toFixed(1)+' s');return;}
  P.alien.cds[slot]=ab.cd;faceAim();ALIEN_FN[ab.id]();
}
function alienAbilityUp(slot){const a=alienDef();if(!a)return;const ab=a.abilities[slot];if(ab&&ab.channel)P.alien.channel=false;}
const ALIEN_FN={
  lavaFist(){const m=alienMul();P.punchT=time;P.punchArm=-P.punchArm||1;const n=coneHit(4.2,0.3,45*m,{knock:26,burn:{dps:8*m,time:3},stun:0.3},'fire');
    const h=handPoint();burst(h.x,h.y,h.z,30,12,0.5,FIRE,1.8,-2,2);hitProps(h.x,h.y,h.z,2.5,P,18);SFX.punch(1);if(n)addShake(0.25);},
  magmaSlam(){const m=alienMul(),x=P.pos.x,z=P.pos.z,y=P.pos.y+0.5;ringFx(x,y,z,1,16,0.6,[1,.45,.1]);burst(x,y,z,90,26,1,FIRE,2.6,-3,1.6);
    areaDamage(x,y,z,14,70*m,P,{knock:24,burn:{dps:10*m,time:4},type:'fire'});for(let k=0;k<6;k++){const a=k/6*TAU;addFire(x+Math.cos(a)*6,groundY(x,z,y+2)+0.3,z+Math.sin(a)*6,5,1);}
    addScorch(x,groundY(x,z,y+2),z,8);SFX.boom(1,1.2);addShake(0.7);},
  lavaRock(){const h=handPoint(),d=dirTo(h,aim.x,aim.y,aim.z),m=alienMul();
    fireProj({kind:'fire',rock:true,owner:P,x:h.x,y:h.y,z:h.z,vx:d[0]*55,vy:d[1]*55+4,vz:d[2]*55,dmg:50*m,radius:4.5,burn:{dps:8*m,time:3},r:0.9,life:3,grav:9});SFX.whoosh();},
  gale(){const m=alienMul();coneHit(26,0.55,15*m,{knock:32},'wind');const c=center(P);
    for(let k=0;k<50;k++){const s=rr(20,45),sp=rr(-0.3,0.3);emit(c.x,c.y,c.z,(camF.x+sp)*s,camF.y*s+rr(-3,3),(camF.z-sp)*s,0.6,[.85,.97,1],1,0,1);}
    hitProps(c.x+camF.x*8,c.y,c.z+camF.z*8,8,P,24);SFX.whoosh();},
  tornado(){const x=aim.hitAny?aim.x:P.pos.x+camF.x*30,z=aim.hitAny?aim.z:P.pos.z+camF.z*30;tornados.push({x,z,t:6,y:groundY(x,z,40),m:alienMul(),a:0});SFX.boom(0.6,2);},
  dash(){P.vel.set(camF.x*120,camF.y*120,camF.z*120);P.dashT=0.28;SFX.whoosh();},
  iceSpikes(){const m=alienMul();let dx=camF.x,dz=camF.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
    for(let k=1;k<=9;k++)later(k*0.06,()=>{const x=P.pos.x+dx*k*3,z=P.pos.z+dz*k*3,y=groundY(x,z,P.pos.y+3);spikes.push({x,y,z,t:3,s:rr(0.8,1.3)});
      areaDamage(x,y+1,z,2.6,35*m,P,{stun:1.5,knock:8,type:'ice'});for(const a of actors)if(a.alive&&Math.hypot(a.pos.x-x,a.pos.z-z)<3){a.slow=0.9;a.slowT=2.5;}
      burst(x,y+0.5,z,10,6,0.6,[[.7,.9,1],[1,1,1]],1,6,1);hitProps(x,y,z,1.5,P,8);});
    SFX.glass(0.8);},
  crystalArmor(){P.alien.armor=8;ringFx(P.pos.x,P.pos.y+1.5,P.pos.z,1,5,0.4,[.7,.9,1]);SFX.glass(1);},
  arcChain(){const m=alienMul();let from=handPoint(),cur=aim.actor&&aim.actor.kind!=='prop'?aim.actor:null;
    if(!cur){let bd=35;for(const a of actors){if(!a.alive||a.kind==='prop')continue;const d=Math.hypot(a.pos.x-aim.x,a.pos.z-aim.z);if(d<bd){bd=d;cur=a;}}}
    const hit=new Set();for(let k=0;k<5&&cur;k++){hit.add(cur);const c=center(cur),cx=c.x,cy=c.y,cz=c.z;zig(from.x,from.y,from.z,cx,cy,cz,[1,.95,.4]);
      Damage.apply(P,cur,30*m,'shock',{stun:0.5});from={x:cx,y:cy,z:cz};let nx=null,nd=16;
      for(const a of actors){if(!a.alive||hit.has(a)||a.kind==='prop'||a.kind==='vehicle')continue;const d=Math.hypot(a.pos.x-cx,a.pos.z-cz);if(d<nd){nd=d;nx=a;}}cur=nx;}
    SFX.tone('sawtooth',1500,300,0.25,0.1);},
  emp(){const m=alienMul(),c=center(P);ringFx(c.x,c.y,c.z,1,28,0.5,[1,.95,.4]);burst(c.x,c.y,c.z,60,30,0.6,SPARK,1,0,2);flashWhite=0.25;
    for(const a of actors){if(!a.alive)continue;const d=Math.hypot(a.pos.x-c.x,a.pos.z-c.z);if(d>28)continue;
      if(a.kind==='drone'){a.stun=4;Damage.apply(P,a,20*m,'shock');}else if(a.kind==='vehicle'){a.stalled=6;}else if(a.kind==='boss'){a.flash=1;Damage.apply(P,a,40*m,'shock');}else if(a.kind!=='prop')a.stun=Math.max(a.stun||0,1.5);}
    SFX.boom(0.7,1);},
  blink(){const m=alienMul(),d=Math.min(26,(aim.hitAny?aim.t:40)-2);const ox=P.pos.x,oy=P.pos.y+1.3,oz=P.pos.z;
    let tx=ox+camF.x*d,tz=oz+camF.z*d,ty=Math.max(groundY(tx,tz,oy+camF.y*d+2),oy-1.3+camF.y*d);
    if(inBuilding(tx,ty+1,tz,0.8))return;zig(ox,oy,oz,tx,ty+1.3,tz,[1,.95,.4]);P.pos.set(tx,ty,tz);P.vel.set(0,0,0);
    areaDamage(tx,ty+1,tz,4,20*m,P,{stun:0.6,type:'shock'});SFX.tone('square',2000,400,0.15,0.1);},
  stomp(){const m=alienMul(),x=P.pos.x,z=P.pos.z,y=P.pos.y+0.5;ringFx(x,y,z,2,30,0.6,[1,.85,.6]);burst(x,y,z,100,34,1.2,DUST,3.4,-3,2);
    areaDamage(x,y,z,24,80*m,P,{knock:30});hitProps(x,y,z,14,P,28);addShake(1.2);SFX.boom(1,1.4);
    for(const a of actors)if(a.kind==='vehicle'&&a.alive&&a.state!=='wreck'&&Math.hypot(a.pos.x-x,a.pos.z-z)<18){a.state='thrown';a.vel.set(rr(-4,4),rr(8,14),rr(-4,4));a.sx=rr(-3,3);a.sy=rr(-2,2);a.sz=rr(-3,3);a.life=4;a.thrower=P;a.throwDmg=30*m;if(a.driver)ejectDriver(a);}},
  carToss(){const m=alienMul();let best=null,bd=16;for(const v of vehicles){if(!v.alive||v.state==='wreck'||v===P.car)continue;const d=Math.hypot(v.pos.x-P.pos.x,v.pos.z-P.pos.z);if(d<bd){bd=d;best=v;}}
    if(!best){feed('Car Toss','No car within reach');P.alien.cds[1]=0;return;}if(best.driver)ejectDriver(best);
    best.state='thrown';best.pos.set(P.pos.x,P.pos.y+P.height+1,P.pos.z);best.vel.set(camF.x*65,camF.y*65+10,camF.z*65);best.sx=rr(-2,2);best.sy=rr(-2,2);best.sz=rr(-2,2);best.life=6;best.thrower=P;best.throwDmg=90*m;SFX.whoosh();addShake(0.3);},
  megaPunch(){const m=alienMul();P.punchT=time;P.punchArm=1;const n=coneHit(8,0.3,90*m,{knock:40,stun:0.5},'punch');const h=handPoint();
    hitProps(P.pos.x+camF.x*5,P.pos.y+2,P.pos.z+camF.z*5,4,P,30);ringFx(h.x,h.y,h.z,1,6,0.3,[1,.95,.8]);SFX.punch(1.2);if(n)addShake(0.5);
    const b=inBuilding(P.pos.x+camF.x*5,P.pos.y+4,P.pos.z+camF.z*5,1.5);if(b)breakWindowAt(b,P.pos.x+camF.x*5,P.pos.y+4,P.pos.z+camF.z*5);},
  veil(){P.invisible=7;for(const a of actors)if(a.target===P)a.target=null;burst(P.pos.x,P.pos.y+1.5,P.pos.z,40,6,1,[[.5,.2,.8],[.2,.1,.3]],2,0,1);SFX.tone('sine',600,150,0.6,0.1);},
  phase(){if(P.alien.phase>0){unphase();return;}P.alien.phase=6;SFX.tone('sine',300,900,0.4,0.08);},
  shadowStrike(){const m=alienMul();let t=aim.actor&&aim.actor.kind!=='prop'&&aim.actor.kind!=='vehicle'?aim.actor:null;
    if(!t){let bd=30;for(const a of actors){if(!a.alive||a.kind==='prop'||a.kind==='vehicle')continue;const d=Math.hypot(a.pos.x-P.pos.x,a.pos.z-P.pos.z);if(d<bd&&((a.pos.x-P.pos.x)*camF.x+(a.pos.z-P.pos.z)*camF.z)>0){bd=d;t=a;}}}
    if(!t){P.alien.cds[2]=0;feed('Shadow Strike','No target in front of you');return;}
    burst(P.pos.x,P.pos.y+1.5,P.pos.z,30,8,0.8,[[.6,.3,1],[.1,.05,.15]],2,0,1);
    const dx=t.pos.x-P.pos.x,dz=t.pos.z-P.pos.z,l=Math.hypot(dx,dz)||1;P.pos.set(t.pos.x+dx/l*2,t.pos.y,t.pos.z+dz/l*2);P.heroYaw=Math.atan2(-dx,-dz);
    Damage.apply(P,t,70*m,'punch',{stun:1,knock:12});burst(t.pos.x,t.pos.y+1.5,t.pos.z,30,10,0.6,[[.7,.35,1],[1,1,1]],1.4,0,2);SFX.punch(1);},
};
function zig(ax,ay,az,bx,by,bz,col){let px=ax,py=ay,pz=az;const n=6;
  for(let i=1;i<=n;i++){const k=i/n,j=i<n?1.2:0;const qx=lerp(ax,bx,k)+rr(-j,j),qy=lerp(ay,by,k)+rr(-j,j),qz=lerp(az,bz,k)+rr(-j,j);tracer(px,py,pz,qx,qy,qz,col,0.18,0.18);tracer(px,py,pz,qx,qy,qz,[1,1,1],0.06,0.18);px=qx;py=qy;pz=qz;}}
function updateAliens(dt){
  if(band.cd>0)band.cd=Math.max(0,band.cd-dt);
  if(P.alien){const A=P.alien,a=alienDef();
    for(let i=0;i<3;i++)if(A.cds[i]>0)A.cds[i]=Math.max(0,A.cds[i]-dt);
    if(state==='play'&&!P.dead){A.t-=dt;if(A.t<5&&A.t>0){A.warn-=dt;if(A.warn<=0){A.warn=1;SFX.tone('square',900,900,0.08,0.06);}}if(A.t<=0){revertAlien(false);feed('Morph Band timed out','Recharging for '+Math.ceil(band.cd)+' s');}}
    if(A.armor>0)A.armor-=dt;if(P.invisible>0)P.invisible-=dt;
    if(A.phase>0){A.phase-=dt;if(A.phase<=0)unphase();}
    if(A.channel&&a.abilities.some(x=>x.id==='frostBreath')){const m=alienMul(),c=center(P);coneHit(18,0.75,25*m*dt,{},'ice');
      for(const q of actors)if(q.alive&&Math.hypot(q.pos.x-c.x,q.pos.z-c.z)<18&&((q.pos.x-c.x)*camF.x+(q.pos.z-c.z)*camF.z)>0){q.slow=0.8;q.slowT=0.4;}
      const e=P.eye;for(let k=0;k<4;k++){const s=rr(14,24);emit(e.x,e.y-0.2,e.z,(camF.x+rr(-.15,.15))*s,(camF.y+rr(-.1,.1))*s,(camF.z+rr(-.15,.15))*s,0.7,[.8,.93,1],rr(0.8,1.6),0,1);}castT=time;}
    if(a.flies&&!P.flying&&!P.dead)P.flying=true;
  }
  for(let i=tornados.length-1;i>=0;i--){const T=tornados[i];T.t-=dt;T.a+=dt*6;if(T.t<=0){tornados.splice(i,1);continue;}
    const tx=P.pos.x,tz=P.pos.z;T.x+=Math.sin(time*0.7+i)*dt*3;T.z+=Math.cos(time*0.6+i)*dt*3;
    for(let k=0;k<6;k++){const a=rr(0,TAU),h=rr(0,24),r=1+h*0.35;emit(T.x+Math.cos(a)*r,T.y+h,T.z+Math.sin(a)*r,-Math.sin(a)*14,rr(3,8),Math.cos(a)*14,0.8,[.8,.85,.85],rr(1,2.2),0,0.5);}
    if(Math.random()<0.4)smoke(T.x,T.y+1,T.z,1,3,5,1.5,0.45);
    for(const a of actors){if(!a.alive||a.kind==='prop'||a.kind==='boss'||a===P.car)continue;const dx=T.x-a.pos.x,dz=T.z-a.pos.z,d=Math.hypot(dx,dz);if(d>13)continue;
      if(a.kind==='human'){a.air=true;a.vel.set(dx/d*6-dz/d*10,Math.min(a.vel.y+30*dt,14),dz/d*6+dx/d*10);a.tumble=6;}
      else if(a.kind==='drone'||a.kind==='rival'){a.vel.x+=(dx*2-dz*4)*dt;a.vel.z+=(dz*2+dx*4)*dt;a.vel.y+=20*dt;}
      else if(a.kind==='vehicle'&&a.state!=='wreck'&&a.state!=='held'){if(a.driver)ejectDriver(a);a.state='thrown';a.vel.set(dx/d*4-dz/d*12,10,dz/d*4+dx/d*12);a.sx=rr(-3,3);a.sy=3;a.sz=rr(-3,3);a.life=3;a.thrower=P;a.throwDmg=40*T.m;}
      Damage.apply(P,a,10*T.m*dt,'wind');}
    hitProps(T.x,T.y,T.z,8,P,20);}
  for(let i=spikes.length-1;i>=0;i--){spikes[i].t-=dt;if(spikes[i].t<=0)spikes.splice(i,1);}
}
