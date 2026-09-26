// ================================================================
// Ring Bearer: ring charge, hard-light constructs, ring moves, the black hole and the oath
// ================================================================
// Everything the ring does costs charge (save.ring, 0-100). It never refills on its own:
// press O to hold up the lantern and type the oath. At zero charge you can only walk.
// B builds your default construct (the last one you picked), V opens the construct wheel.
// Inside a construct, left click / right click / X are its attacks.
const RING_C=[.36,1,.52],RING_C4=[.36,1,.52,1];
const CONSTRUCTS={
  bubble:{name:'Bubble',unlock:1,cost:3,drain:0.3,fly:true,speed:0.8,attacks:'LMB spikes · RMB ram',blurb:'A spiked shield bubble'},
  jet:{name:'Jet',unlock:1,cost:5,drain:0.5,fly:true,speed:1.9,attacks:'LMB guns · RMB missiles',blurb:'A fighter jet'},
  mech:{name:'Mech',unlock:3,cost:8,drain:0.6,fly:false,speed:1.35,scale:2.2,attacks:'LMB punch · RMB guns · X missiles',blurb:'A walking battle mech'},
  titan:{name:'Huge Mech',unlock:5,cost:14,drain:1,fly:false,speed:1.8,scale:4.6,attacks:'LMB punch · RMB guns · X missiles',blurb:'A mech as tall as a house'},
  dragon:{name:'Dragon',unlock:7,cost:18,drain:1,fly:true,speed:1.5,attacks:'LMB strike · RMB breath · X roar',blurb:'Ride a hard-light dragon'},
};
const CON_IDS=Object.keys(CONSTRUCTS);
const OATH='Through fear and doubt my will holds fast. What I imagine, I make last. Let every foe who stands to fight be humbled by my ring of light.';
let conPick='bubble',oathOpen=false,oathStart=0;
const isRing=()=>hasTrav('powerRing')&&!P.alien;
const ringMk=()=>mk('powerRing');
const conSize=()=>0.8+0.45*ringMk(); // constructs grow with ring mastery
const conUnlocked=()=>{const l=masteryLevel('powerRing');return CON_IDS.filter(id=>CONSTRUCTS[id].unlock<=l);};
const conDef=()=>P.construct?CONSTRUCTS[P.construct.id]:null;
const conScale=id=>(CONSTRUCTS[id].scale||1)*(CONSTRUCTS[id].scale?conSize():1);
const conSpeedMul=()=>{const c=conDef();return c?c.speed:1;};
const conCam=()=>{const c=conDef();return !c?1:P.construct.id==='dragon'?1.8:P.construct.id==='jet'?1.35:P.construct.id==='bubble'?1.2:1;};
function ringOut(){feed('Ring charge is empty','Press O to recite the oath');SFX.tone('square',220,140,0.15,0.06);}
function summonConstruct(id){
  if(!isRing()||!canAct()||P.car)return;
  if(!id&&P.construct){dismissConstruct();return;}
  id=id||conPick;const C=CONSTRUCTS[id];if(!C)return;
  if(P.construct&&P.construct.id===id){dismissConstruct();return;}
  if(!conUnlocked().includes(id)){feed(C.name+' is locked','Ring mastery '+C.unlock+' builds it · you are '+Math.floor(masteryLevel('powerRing')));return;}
  if(save.ring<C.cost){ringOut();return;}
  if(P.construct)dismissConstruct(true);
  save.ring-=C.cost;conPick=id;P.construct={id,t:0,cd:0,cd2:0,cdx:0,gun:0,breath:false,alt:false,side:1};P.web=null;P.wall=null;P.wallRun=null;P.charging=false;P.zip=null;
  if(C.fly){P.flying=true;P.grounded=false;if(P.vel.y<6)P.vel.y=8;}else P.flying=false;
  const sc=conScale(id);if(C.scale){P.radius=0.8*Math.max(1,sc*0.7);P.height=2.7*sc;}
  const c=center(P);ringFx(c.x,c.y,c.z,1,6*Math.max(1,sc),0.5,RING_C);burst(c.x,c.y,c.z,60,10*Math.max(1,sc*0.6),0.7,[RING_C,[.8,1,.85]],1.4,0,2);
  SFX.tone('sine',300,900,0.35,0.12);feed(C.name,C.attacks);addMastery('powerRing',8);MP.bump();
}
function dismissConstruct(quiet){
  const K=P.construct;if(!K)return;const C=CONSTRUCTS[K.id];P.construct=null;
  if(C.scale){P.radius=0.8;P.height=2.7;const b=inBuilding(P.pos.x,P.pos.y+1,P.pos.z,0.5);if(b)P.pos.y=b.y1+0.1;}
  if(!quiet){const c=center(P);burst(c.x,c.y,c.z,40,8,0.6,[RING_C],1.2,-2,2);SFX.tone('sine',800,300,0.25,0.08);}
  if(C.fly&&save.ring<=0)P.flying=false;MP.bump();
}
function ringCast(){faceAim();castT=time;}
function ringProj(o,d,sp,dmg,extra){fireProj(Object.assign({kind:'ring',owner:P,x:o.x,y:o.y,z:o.z,vx:d[0]*sp,vy:d[1]*sp,vz:d[2]*sp,dmg,knock:10,r:0.5,life:2.2},extra||{}));}
// where construct weapons fire from
function conMuzzle(side){
  const K=P.construct,sc=K&&CONSTRUCTS[K.id].scale?conScale(K.id):1,s=Math.sin(P.heroYaw),c=Math.cos(P.heroYaw);
  if(K&&K.id==='jet')return {x:P.pos.x+s*3+c*side*1.6,y:P.pos.y+1.1,z:P.pos.z+c*3-s*side*1.6};
  if(K&&K.id==='dragon')return {x:P.pos.x+s*5.5,y:P.pos.y+1.4,z:P.pos.z+c*5.5};
  return {x:P.pos.x+s*0.9*sc+c*side*0.9*sc,y:P.pos.y+2.1*sc,z:P.pos.z+c*0.9*sc-s*side*0.9*sc};
}
function conTarget(){if(lockT&&lockT.alive)return lockT;return aim.actor&&aim.actor.kind!=='prop'&&aim.hitAny?aim.actor:nearestFoe(aim.x,aim.y,aim.z,14);}
function fireMissiles(n){const K=P.construct,t=conTarget();for(let i=0;i<n;i++){const side=i%2?1:-1,o=conMuzzle(side),d=dirTo(o,aim.x,aim.y,aim.z);
    fireProj({kind:'rocket',owner:P,x:o.x,y:o.y+0.4,z:o.z,vx:d[0]*50+side*8,vy:d[1]*50+10,vz:d[2]*50,dmg:70*(0.8+ringMk()),r:0.6,life:4,seek:t,col:1});}
  SFX.whoosh();void K;}
function fireGun(){const K=P.construct;K.side=-K.side;const o=conMuzzle(K.side),d=dirTo(o,aim.x,aim.y,aim.z),j=0.02;
  fireProj({kind:'ring',owner:P,x:o.x,y:o.y,z:o.z,vx:(d[0]+rr(-j,j))*170,vy:(d[1]+rr(-j,j))*170,vz:(d[2]+rr(-j,j))*170,dmg:9*(1+ringMk()),knock:2,r:0.35,life:1.2,small:true});
  SFX.tone('square',900,500,0.04,0.035);}
// a construct fist / claw: hits everything in a cone in front
function conSmash(range,dmg,kvF,kvU,col){
  const fx=Math.sin(P.heroYaw),fz=Math.cos(P.heroYaw),o=center(P);let n=0;
  for(const a of actors.slice()){if(!a.alive||a===P||a.held||a.kind==='prop')continue;const c=center(a),dx=c.x-o.x,dz=c.z-o.z,d=Math.hypot(dx,dz);
    if(d>range+(a.radius||1)||(dx*fx+dz*fz)/(d||1)<0.35||Math.abs(c.y-o.y)>range)continue;
    Damage.apply(P,a,dmg,'punch',{kv:a.kind==='vehicle'?null:[fx*kvF,kvU,fz*kvF],flung:kvF>30,stun:0.8,heavy:1});n++;
    if(a.kind==='vehicle'&&!a.net&&a!==P.car){if(a.driver)ejectDriver(a);a.state='thrown';a.vel.set(fx*kvF,kvU,fz*kvF);a.sx=rr(-3,3);a.sy=rr(-2,2);a.sz=rr(-3,3);a.life=5;a.thrower=P;a.throwDmg=dmg*0.5;}}
  const hx=o.x+fx*range*0.7,hz=o.z+fz*range*0.7,t=rayCity(o.x,o.y,o.z,fx,0,fz,range);
  if(t<range&&RAYHIT.b&&RAYHIT.b.bld){damageBuilding(RAYHIT.b.bld,dmg*6,o.x+fx*t,o.y,o.z+fz*t,fx,fz);crater(o.x+fx*t,o.y,o.z+fz*t,RAYHIT.nx,RAYHIT.ny,RAYHIT.nz,Math.min(5,range*0.25),RAYHIT.b.col);}
  hitProps(hx,o.y,hz,range*0.5,P,20);burst(hx,o.y,hz,24,10,0.4,[col||RING_C],1.4,0,2);SFX.punch(1.3);addShake(0.25);return n;
}
// ---- construct controls (called from the input handlers) ----
function constructPrimary(){
  const K=P.construct;if(!K||!canAct())return false;const id=K.id;
  if(id==='jet'){K.gunning=true;return true;}
  if(K.cd>0)return true;
  if(!ringSpend(id==='bubble'?1:0.5)){ringOut();return true;}
  ringCast();const sc=CONSTRUCTS[id].scale?conScale(id):1;
  if(id==='bubble'){K.cd=0.7;K.spikeT=0.35;const R=6*conSize();areaDamage(P.pos.x,P.pos.y+1.3,P.pos.z,R,45*(1+ringMk()),P,{knock:24,type:'blast'});ringFx(P.pos.x,P.pos.y+1.3,P.pos.z,1,R,0.3,RING_C);SFX.tone('square',500,1200,0.12,0.08);hitProps(P.pos.x,P.pos.y,P.pos.z,R*0.6,P,18);}
  else if(id==='mech'||id==='titan'){K.cd=id==='titan'?0.9:0.55;K.punchT=time;K.arm=-(K.arm||1);conSmash(3.2*sc,(id==='titan'?160:80)*(1+ringMk()),id==='titan'?60:36,14,RING_C);}
  else if(id==='dragon'){K.cd=0.6;K.biteT=time;conSmash(8,90*(1+ringMk()),40,18,RING_C);}
  return true;
}
function constructPrimaryUp(){const K=P.construct;if(K)K.gunning=false;}
function constructAlt(down){
  const K=P.construct;if(!K)return false;const id=K.id;
  if(!down){K.gunning2=false;K.breath=false;return true;}
  if(!canAct())return true;
  if(id==='jet'){if(K.cd2>0)return true;if(!ringSpend(2)){ringOut();return true;}K.cd2=1.1;ringCast();fireMissiles(2);}
  else if(id==='bubble'){if(K.cd2>0)return true;if(!ringSpend(1.5)){ringOut();return true;}K.cd2=1.2;K.ramT=0.45;P.vel.set(camF.x*70,camF.y*70,camF.z*70);SFX.whoosh();}
  else if(id==='mech'||id==='titan')K.gunning2=true;
  else if(id==='dragon')K.breath=true;
  return true;
}
function constructX(){
  const K=P.construct;if(!K||!canAct())return false;const id=K.id;
  if(K.cdx>0)return true;
  if(id==='mech'||id==='titan'){if(!ringSpend(3)){ringOut();return true;}K.cdx=2.5;ringCast();fireMissiles(id==='titan'?8:4);}
  else if(id==='dragon'){if(!ringSpend(2)){ringOut();return true;}K.cdx=4;K.roarT=time;const c=center(P);ringFx(c.x,c.y,c.z,1,26,0.5,RING_C);areaDamage(c.x,c.y,c.z,22,60*(1+ringMk()),P,{knock:30,type:'blast'});SFX.boom(0.7,0.6);addShake(0.4);scare(c.x,c.z,80);}
  else return false;
  return true;
}
// ---- ring moves ----
const ringFxList=[];   // hammers and lassos in the air
const holes=[];        // black holes
Object.assign(POWER_FN,{
  ringBlast(){ringCast();const h=handPoint(),d=dirTo(h,aim.x,aim.y,aim.z),w=1+ringMk();ringProj(h,d,120,pstat('ringBlast','damage')*strengthMul(),{knock:14,big:w});SFX.tone('sine',700,1500,0.12,0.09);addMastery('powerRing',1);},
  hammerSmash(){ringCast();let x=aim.x,y=aim.y,z=aim.z;const t=lockT&&lockT.alive?lockT:null;if(t){const c=center(t);x=c.x;y=c.y;z=c.z;}
    if(!aim.hitAny&&!t){x=P.pos.x+camF.x*30;z=P.pos.z+camF.z*30;y=groundY(x,z,P.pos.y+10);}
    const R=pstat('hammerSmash','radius')*(1+0.3*ringMk());ringFxList.push({kind:'hammer',x,y,z,t:0,R,dmg:pstat('hammerSmash','damage')*strengthMul(),yaw:Math.atan2(x-P.pos.x,z-P.pos.z),hit:false,nx:aim.nx,ny:aim.ny,nz:aim.nz,surf:aim.surface&&!t});
    MP.fx('rg',{g:'h',x:Math.round(x),y:Math.round(y),z:Math.round(z),r:Math.round(R)});SFX.tone('sine',200,600,0.3,0.1);addMastery('powerRing',2);},
  chainLasso(){ringCast();const t=lockT&&lockT.alive?lockT:aim.actor&&aim.actor.kind!=='prop'?aim.actor:nearestFoe(aim.x,aim.y,aim.z,10);
    if(!t||Math.hypot(t.pos.x-P.pos.x,t.pos.z-P.pos.z)>70){PS.chainLasso.cd=0;save.ring+=POWERS.chainLasso.ring;feed('Nothing to lasso','Aim at someone or lock on (Z)');return;}
    ringFxList.push({kind:'lasso',a:t,t:0,dmg:pstat('chainLasso','damage')*strengthMul(),stage:0});SFX.tone('triangle',400,900,0.2,0.08);addMastery('powerRing',2);},
  blackHole(){ringCast();let x=aim.x,y=aim.y,z=aim.z;const d=Math.hypot(x-P.pos.x,z-P.pos.z);
    if(!aim.hitAny||d>90||d<25){const k=45;x=P.pos.x+camF.x*k;z=P.pos.z+camF.z*k;}
    y=Math.max(groundY(x,z,200)+12,y);const R=pstat('blackHole','radius')*(1+0.25*ringMk());
    holes.push({x,y,z,t:0,dur:pstat('blackHole','duration'),R,next:0,hitT:0,own:true});MP.fx('rg',{g:'b',x:Math.round(x),y:Math.round(y),z:Math.round(z),r:Math.round(R)});
    SFX.tone('sine',60,30,3,0.2);SFX.boom(0.8,0.4);addShake(0.6);flashWhite=0.3;feed('Black hole','Everything nearby is falling in');addMastery('powerRing',20);},
});
TOGGLE_FN.ringShield=()=>{if(P.ringShield){P.ringShield=false;SFX.tone('sine',900,300,0.2,0.08);return;}
  if(PS.ringShield.cd>0){PS.ringShield.flash=0.3;feed('Shield is rebuilding',Math.ceil(PS.ringShield.cd)+' s');return;}
  if(save.ring<1){ringOut();return;}const mx=pstat('ringShield','absorb');if(!(P.rsHp>0))P.rsHp=mx;P.rsHp=Math.min(P.rsHp,mx);
  P.ringShield=true;ringFx(P.pos.x,P.pos.y+1.3,P.pos.z,0.5,3.5,0.3,RING_C);SFX.tone('sine',300,900,0.3,0.1);};
// the shield soaks every hit with its own health; each hit costs a little ring charge, and it breaks if it runs out
function ringAbsorb(amount){if(!P.ringShield||!isRing())return amount;
  P.rsHp-=amount;P.rsHitT=time;save.ring=Math.max(0,save.ring-amount*0.01);ringFx(P.pos.x,P.pos.y+1.3,P.pos.z,2.5,3.6,0.2,RING_C);
  if(P.rsHp<=0){P.rsHp=0;P.ringShield=false;PS.ringShield.cd=pstat('ringShield','cooldown');SFX.tone('square',600,120,0.3,0.1);burst(P.pos.x,P.pos.y+1.3,P.pos.z,40,10,0.5,[RING_C],1.2,0,2);feed('Shield broken','It rebuilds in '+Math.round(PS.ringShield.cd)+' s');}
  else if(save.ring<=0){P.ringShield=false;ringOut();}return 0;}
function onRingFx(d,n){
  if(d.g==='h')ringFxList.push({kind:'hammer',x:n(d.x),y:n(d.y),z:n(d.z),t:0,R:clamp(n(d.r),2,30),dmg:0,yaw:0,visual:true,hit:false});
  else if(d.g==='b')holes.push({x:n(d.x),y:n(d.y),z:n(d.z),t:0,dur:6,R:clamp(n(d.r),10,100),next:0,hitT:0,visual:true});
}
// extra presence slots other players need to draw you: [ring shield, speedster phase, time stop, suit]
function presExtra(){return [P.ringShield?1:0,P.phasing?1:0,P.giantS>1.02?Math.round(P.giantS*100)/100:0,P.suited===false?1:0,hasPower('armorSuit')?1:0];}
// ---- per-frame ----
function updateRing(dt){
  if(isRing()){
    const K=P.construct;
    if(P.flying&&!K)save.ring=Math.max(0,save.ring-0.08*dt);
    if(K){const C=CONSTRUCTS[K.id];K.t+=dt;save.ring=Math.max(0,save.ring-C.drain*dt);addMastery('powerRing',dt*1.2);
      for(const k of ['cd','cd2','cdx'])if(K[k]>0)K[k]-=dt;if(K.spikeT>0)K.spikeT-=dt;
      if(C.fly&&!P.flying&&!P.dead)P.flying=true;
      if(K.gunning||K.gunning2){K.gun-=dt;if(K.gun<=0&&canAct()){if(ringSpend(0.12)){ringCast();fireGun();}else ringOut();K.gun=K.id==='titan'?0.06:0.08;}}
      if(K.breath&&canAct()){if(!ringSpend(1.6*dt)){K.breath=false;ringOut();}else{ringCast();const o=conMuzzle(0),d=dirTo(o,aim.x,aim.y,aim.z);
        for(let i=0;i<4;i++){const s=rr(30,45);emit(o.x,o.y,o.z,(d[0]+rr(-.12,.12))*s,(d[1]+rr(-.1,.1))*s,(d[2]+rr(-.12,.12))*s,0.6,[rr(.3,.6),1,rr(.4,.7)],rr(1.2,2.4),0,0.5);}
        for(const a of actors){if(!a.alive||a===P||a.kind==='prop'||a.held)continue;const c=center(a),vx=c.x-o.x,vy=c.y-o.y,vz=c.z-o.z,s=vx*d[0]+vy*d[1]+vz*d[2];if(s<0||s>26)continue;
          if(Math.hypot(vx-d[0]*s,vy-d[1]*s,vz-d[2]*s)>2+s*0.25)continue;Damage.apply(P,a,70*(1+ringMk())*dt,'fire',{burn:{dps:10,time:2}});}
        hitProps(o.x+d[0]*12,o.y+d[1]*12,o.z+d[2]*12,4,P,10);if(Math.random()<dt*4)addScorch(aim.x,aim.y,aim.z,2,aim.nx,aim.ny,aim.nz);}}
      if(K.ramT>0){K.ramT-=dt;for(const a of actors){if(!a.alive||a===P||a.kind==='prop'||time-(a.ramHit||-9)<0.5)continue;const c=center(a);if(Math.hypot(c.x-P.pos.x,c.y-P.pos.y-1.3,c.z-P.pos.z)<3.2*conSize()){a.ramHit=time;Damage.apply(P,a,60*(1+ringMk()),'punch',{kv:[P.vel.x*0.6,14,P.vel.z*0.6],flung:true});}}}
      if(save.ring<=0){dismissConstruct();ringOut();}}
    if(P.ringShield){save.ring=Math.max(0,save.ring-pstat('ringShield','ringDrain')*dt);if(save.ring<=0){P.ringShield=false;ringOut();}}
    {const mx=pstat('ringShield','absorb');if(P.rsHp==null)P.rsHp=mx;if(time-(P.rsHitT||-9)>2.5)P.rsHp=Math.min(mx,P.rsHp+mx*0.12*dt);}
    if(save.ring<=0&&P.flying&&!P.alien){P.flying=false;}
  }else{if(P.construct)dismissConstruct(true);P.ringShield=false;}
  for(let i=ringFxList.length-1;i>=0;i--){const F=ringFxList[i];F.t+=dt;
    if(F.kind==='hammer'){if(!F.hit&&F.t>=0.38){F.hit=true;const R=F.R;
        if(!F.visual){areaDamage(F.x,F.y,F.z,R,F.dmg,P,{knock:30,type:'blast'});hitProps(F.x,F.y,F.z,R*0.8,P,24);
          const b=inBuilding(F.x-(F.nx||0)*0.8,F.y-(F.ny||0)*0.8,F.z-(F.nz||0)*0.8,0.5);if(b&&b.bld)damageBuilding(b.bld,F.dmg*10,F.x,F.y,F.z,Math.sin(F.yaw),Math.cos(F.yaw));}
        crater(F.x,F.y+0.05,F.z,F.surf?F.nx:0,F.surf?F.ny:1,F.surf?F.nz:0,Math.min(6,R*0.45),[.45,.45,.45]);ringFx(F.x,F.y+0.3,F.z,1,R*1.3,0.4,RING_C);burst(F.x,F.y+1,F.z,40,R*2,0.6,[RING_C,[1,1,1]],1.8,0,2);SFX.boom(0.8*SFX.vol(F.x,F.y,F.z),0.7);addShake(0.5*SFX.vol(F.x,F.y,F.z));}
      if(F.t>0.8)ringFxList.splice(i,1);}
    else if(F.kind==='lasso'){const a=F.a;if(!a.alive||P.dead){ringFxList.splice(i,1);continue;}const c=center(a),dx=P.pos.x-c.x,dz=P.pos.z-c.z,l=Math.hypot(dx,dz)||1;
      if(F.stage===0&&F.t>0.12){F.stage=1;Damage.apply(P,a,F.dmg*0.3,'ring',{kv:[dx/l*Math.min(l*1.4,40),26,dz/l*Math.min(l*1.4,40)],stun:1.5});
        if(a.kind==='vehicle'&&!a.net&&a!==P.car){if(a.driver)ejectDriver(a);a.state='thrown';a.vel.set(dx/l*20,24,dz/l*20);a.life=5;a.thrower=P;a.throwDmg=F.dmg;}}
      if(F.stage===1&&F.t>0.75){F.stage=2;Damage.apply(P,a,F.dmg,'slam',{kv:[-dx/l*6,-55,-dz/l*6],flung:true,stun:1.2});if(a.kind==='vehicle'&&a.state==='thrown'&&!a.net)a.vel.set(0,-50,0);SFX.whoosh();}
      if(F.t>1.1)ringFxList.splice(i,1);}}
  for(let i=holes.length-1;i>=0;i--){const H=holes[i];H.t+=dt;const k=Math.min(1,H.t/0.8),fade=H.t>H.dur-0.6?Math.max(0,(H.dur-H.t)/0.6):1,R=H.R;
    if(!H.visual){H.hitT-=dt;const netTick=H.hitT<=0;if(netTick)H.hitT=0.35;
      for(const a of actors){if(!a.alive||a===P||a.held||a.kind==='prop')continue;const c=center(a),dx=H.x-c.x,dy=H.y-c.y,dz=H.z-c.z,d=Math.hypot(dx,dy,dz)||1;if(d>R)continue;
        const resist=a.kind==='boss'?0.1:a.kind==='rival'||a.kind==='drone'?0.45:1,f=(1-d/R)*90*k*resist+10;
        if(a.kind==='remote'){if(netTick&&!(a.flags&FLAG.speed)&&!((a.flags&FLAG.fly)&&a.vel.len()>45))Damage.apply(P,a,d<5?25:3,'gravity',{kv:[dx/d*f*0.5,dy/d*f*0.5+6,dz/d*f*0.5]});continue;}
        if(a.net){if(netTick)Damage.apply(P,a,d<5?60:4,'gravity',{kv:[dx/d*f*0.5,dy/d*f*0.5+6,dz/d*f*0.5]});continue;}
        if(a.kind==='human'){if(!a.air){a.air=true;a.vel.set(0,6,0);}a.vel.x+=(dx/d*f-dz/d*f*0.5)*dt;a.vel.y+=(dy/d*f+14)*dt;a.vel.z+=(dz/d*f+dx/d*f*0.5)*dt;a.tumble=6;a.floatT=0.2;}
        else if(a.kind==='vehicle'&&a!==P.car){if(a.state!=='thrown'){if(a.driver)ejectDriver(a);a.state='thrown';a.vel.set(0,8,0);a.sx=rr(-2,2);a.sy=rr(-2,2);a.sz=rr(-2,2);a.thrower=P;a.throwDmg=40;}a.life=8;
          a.vel.x+=(dx/d*f*0.8-dz/d*f*0.4)*dt;a.vel.y+=(dy/d*f*0.8+30)*dt;a.vel.z+=(dz/d*f*0.8+dx/d*f*0.4)*dt;}
        else if(a.vel){a.vel.x+=dx/d*f*dt;a.vel.y+=dy/d*f*dt;a.vel.z+=dz/d*f*dt;}
        if(d<4.5)Damage.apply(P,a,(a.kind==='boss'?40:220)*dt,'gravity');}
      hitProps(H.x,Math.min(H.y,4),H.z,R*0.4*k,P,8);
      // pull down the buildings around it, one at a time, leaning into the hole
      H.next-=dt;if(H.t>0.8&&H.t<H.dur-1&&H.next<=0){H.next=0.5;let best=null,bd=R*0.9;
        for(const b of bldgs){if(b.state!=='up')continue;const d=Math.hypot(Math.max(b.x0-H.x,0,H.x-b.x1),Math.max(b.z0-H.z,0,H.z-b.z1));if(d<bd){bd=d;best=b;}}
        if(best){const cx=(best.x0+best.x1)/2,cz=(best.z0+best.z1)/2;collapseBuilding(best,H.x-cx,H.z-cz,true);H.bl=(H.bl||[]).concat([best]);}}}
    // chunks from falling and fallen buildings stream into the hole
    for(const b of H.bl||bldActive){if(!b.rubble&&b.state!=='fall')continue;const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2;if(Math.hypot(cx-H.x,cz-H.z)>R)continue;
      if(Math.random()<dt*10){const x=rr(b.x0,b.x1),z=rr(b.z0,b.z1),y=rr(1,Math.max(3,b.h+b.off)),dx=H.x-x,dy=H.y-y,dz=H.z-z,l=Math.hypot(dx,dy,dz)||1,s=rr(1.5,4);
        spawnPiece(x,y,z,MESH.box,s,s*rr(0.4,1),s,b.col.map(q=>q*rr(0.6,1)),dx/l*40,dy/l*40+10,dz/l*40,Math.min(3,l/40+0.3));}
      if(b.rubble&&b.rubble.length&&Math.random()<dt*3)b.rubble.pop();}
    for(const p of debris)if(!p.rest){const dx=H.x-p.x,dy=H.y-p.y,dz=H.z-p.z,d=Math.hypot(dx,dy,dz)||1;if(d<R){p.vx+=dx/d*120*dt*k;p.vy+=(dy/d*120+20)*dt*k;p.vz+=dz/d*120*dt*k;if(d<3)p.life=Math.min(p.life,0.05);}}
    for(let j=0;j<3;j++){const a=rr(0,TAU),r=R*rr(0.2,0.9);emit(H.x+Math.cos(a)*r,H.y+rr(-4,4),H.z+Math.sin(a)*r,-Math.cos(a)*r*1.2-Math.sin(a)*r,0,-Math.sin(a)*r*1.2+Math.cos(a)*r,0.7,[rr(.5,1),rr(.3,.6),1],rr(1,2.5),0,0);}
    if(Math.random()<dt*6)addShake(0.2*SFX.vol(H.x,H.y,H.z));void fade;
    if(H.t>=H.dur){holes.splice(i,1);explode(H.x,H.y,H.z,2);if(!H.visual)areaDamage(H.x,H.y,H.z,R*0.5,200,P,{knock:50,type:'blast'});ringFx(H.x,H.y,H.z,1,R*1.5,0.6,[.7,.5,1]);flashWhite=Math.max(flashWhite,0.35);}}
}
// ---- the oath ----
let oathEl=null,oathIn=null,oathText=null; // wired on first use (the UI helpers load after this module)
const oathNorm=s=>s.toLowerCase().replace(/[^a-z ]/g,'').replace(/\s+/g,' ');
function openOath(){
  oathWire();
  if(!isRing()||P.dead||state!=='play'||oathOpen)return;
  if(save.ring>=99.5){feed('Your ring is fully charged','');return;}
  if(P.construct)dismissConstruct(true);
  // the game keeps running and the mouse stays locked: on a keyboard your keys type straight into the oath
  oathOpen=true;oathStart=save.ring;oathIn.value='';oathEl.hidden=false;oathEl.classList.toggle('mini',!!save.oathKnown);renderOath(0);
  const tch=touchOn();oathIn.readOnly=!tch;oathIn.placeholder=tch?'Type the oath to recharge your ring':'Just start typing';
  $('oath-note').textContent=save.oathKnown?(tch?'NEXT WORD fills in each word':'Tab fills in the next word · Enter to put the lantern away')
    :'Type it once. From then on it sits in the bottom-right corner and '+(tch?'NEXT WORD':'Tab')+' fills in each word for you.'+(tch?'':' Enter puts the lantern away.');
  $('oath-next').hidden=!save.oathKnown||!tch;P.lantern=true;P.flying=false;
  for(const k in keys)keys[k]=false;mouseL=false;if(tch)setTimeout(()=>oathIn.focus(),30);
  SFX.tone('sine',200,400,0.6,0.08);
}
function closeOath(){if(!oathOpen||!oathEl)return;oathOpen=false;oathEl.hidden=true;P.lantern=false;oathIn.blur();}
// keyboard typing while the lantern is out (called from the main key handler before anything else)
function oathKey(e){
  e.preventDefault();const k=e.key;
  if(e.code==='Escape'||e.code==='Enter'||e.code==='NumpadEnter'){closeOath();return;}
  if(e.code==='Tab'){oathNextWord();return;}
  if(k==='Backspace')oathIn.value=oathIn.value.slice(0,-1);else if(k.length===1&&!e.ctrlKey&&!e.metaKey)oathIn.value+=k;else return;
  oathIn.dispatchEvent(new Event('input'));
}
function oathWire(){if(oathEl)return;oathEl=$('oath');oathIn=$('oath-in');oathText=$('oath-text');
oathIn.addEventListener('input',()=>{
  const want=oathNorm(OATH),got=oathNorm(oathIn.value);let n=0;while(n<got.length&&got[n]===want[n])n++;
  renderOath(n);const k=n/want.length;save.ring=Math.max(save.ring,oathStart+(100-oathStart)*k);
  if(n<got.length){oathIn.style.borderColor='#ff4d5e';}else oathIn.style.borderColor='';
  if(n>=want.length){save.ring=100;closeOath();const c=center(P);flashWhite=0.5;ringFx(c.x,c.y,c.z,1,24,0.7,RING_C);ringFx(c.x,c.y,c.z,1,12,0.5,[1,1,1]);
    burst(c.x,c.y,c.z,120,24,1,[RING_C,[1,1,1]],1.8,0,2);SFX.transform();addShake(0.4);toast('Ring fully charged','Your will is the only limit','cyan');MP.fx('rg',{g:'o'});save.oathKnown=true;persist();}
});
oathIn.addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();closeOath();}else if(e.code==='Tab'){e.preventDefault();oathNextWord();}e.stopPropagation();});
$('oath-next').addEventListener('pointerdown',e=>{e.preventDefault();oathNextWord();});}
// once you have said the oath in full, Tab (or NEXT WORD) fills in the next word for you
function oathNextWord(){
  if(!save.oathKnown||!oathOpen)return;
  const want=oathNorm(OATH),got=oathNorm(oathIn.value);let n=0;while(n<got.length&&got[n]===want[n])n++;
  const words=OATH.split(' ');let acc=0,i=0;for(;i<words.length;i++){const wn=oathNorm(words[i]).length;if(acc+wn>n)break;acc+=wn+1;}
  oathIn.value=words.slice(0,i+1).join(' ')+(i+1<words.length?' ':'');oathIn.dispatchEvent(new Event('input'));
}
function renderOath(n){oathText.textContent='';const words=OATH.split(' ');let used=0;
  for(const w of words){const wn=oathNorm(w).length;const on=used+wn<=n;oathText.appendChild(on?el('b',{text:w+' '}):document.createTextNode(w+' '));used+=wn+(wn?1:0);}}
// ---- drawing ----
const glowQ=(M,a)=>{queue(MESH.glowBox,M,[RING_C[0]*0.7,RING_C[1],RING_C[2]*0.8,Math.min(0.85,a*1.5)],F_BL);};
function drawConstruct(s,id,isPlayer){
  const C=CONSTRUCTS[id];if(!C)return;const K=isPlayer?P.construct:null,sz=isPlayer?conSize():1,yaw=s.heroYaw||0,x=s.pos.x,y=s.pos.y,z=s.pos.z,pulse=0.85+Math.sin(time*6)*0.08;
  if(id==='bubble'){const r=2.3*sz;queue(MESH.glowSphere,at(x,y+1.3,z,0,0,0,r,r,r),[RING_C[0]*0.7,RING_C[1],RING_C[2]*0.8,0.25*pulse],F_BL);
    queue(MESH.ring,M4.alignY(tmpM(),x,y+1.3,z,Math.sin(time),1,Math.cos(time*0.8),r),[RING_C[0],RING_C[1],RING_C[2],0.6],F_ADD);
    if(K&&K.spikeT>0||!isPlayer&&Math.sin(time*3)>0.9)for(let i=0;i<14;i++){const a=i*2.4,b=Math.acos(1-2*(i+0.5)/14),dx=Math.sin(b)*Math.cos(a),dy=Math.cos(b),dz=Math.sin(b)*Math.sin(a);
      glowQ(M4.beam(tmpM(),x+dx*r,y+1.3+dy*r,z+dz*r,x+dx*r*1.6,y+1.3+dy*r*1.6,z+dz*r*1.6,0.18),0.8);}
    return;}
  const tilt=s.tilt||0,pitch=isPlayer&&P.flying?-P.pitch*0.6:0;
  if(id==='jet'){const R=at(x,y+1.1,z,pitch,yaw,s.bank||0);
    glowQ(child(R,0,0,0.5,0,0,0,1.4,1.2,7.5),0.35);glowQ(child(R,0,0.5,-0.5,0,0,0,1,0.7,3),0.25);
    glowQ(child(R,0,-0.1,-0.8,0,0,0,9,0.18,2.6),0.4);glowQ(child(R,0,0.1,-3.3,0,0,0,3.6,0.14,1.3),0.35);glowQ(child(R,0,1.1,-3.3,0,0,0,0.14,2,1.3),0.35);
    for(const sd of [-1,1])queue(MESH.glowSphere,child(R,sd*0.5,0,-3.9,0,0,0,0.5,0.5,0.9),[.7,1,.8,0.6],F_ADD);return;}
  if(id==='dragon'){const R=at(x,y,z,pitch*0.5,yaw,s.bank||0),fl=Math.sin(time*(isPlayer&&P.vel.len()>30?6:3.5));
    for(let i=0;i<9;i++){const zz=2.5-i*1.6,w=Math.sin(time*3-i*0.7)*0.6*i/8,sc=i<2?1.5:1.6-i*0.13;queue(MESH.glowSphere,child(R,w,-0.3-(i>5?(i-5)*0.2:0),zz,0,0,0,sc,sc*0.9,sc*1.1),[RING_C[0]*0.7,RING_C[1],RING_C[2]*0.8,0.5],F_BL);}
    const bite=K&&time-(K.biteT||-9)<0.25?0.5:0.15;const Hd=child(R,0,0.6,5,0.2,0,0);glowQ(child(Hd,0,0,0,0,0,0,1.3,1.1,2.4),0.45);glowQ(child(Hd,0,-0.6,0.9,bite,0,0,1.1,0.3,1.8),0.45);
    for(const sd of [-1,1]){glowQ(child(Hd,sd*0.5,0.8,-0.6,-0.6,0,0,0.2,0.2,1.4),0.5);queue(MESH.glowSphere,child(Hd,sd*0.45,0.3,0.6,0,0,0,0.18,0.18,0.18),[1,1,1,0.9],F_ADD);
      const W=child(R,sd*1.2,0.4,0.5,0,0,sd*(0.3+fl*0.5));glowQ(child(W,sd*3.2,0,0,0,0,0,6.4,0.12,3.2),0.3);glowQ(child(W,sd*6,0,-1.4,0,0,0,1,0.14,4.2),0.35);}
    return;}
  // mech / huge mech
  const sc=(C.scale||2)*sz,ph=s.phase||0,moving=Math.hypot(s.vel?s.vel.x:0,s.vel?s.vel.z:0)>1,sw=moving?Math.sin(ph)*0.5:0,R=at(x,y,z,0,yaw,0);
  const B=child(R,0,1.3*sc,0,tilt*0.2,0,0);
  for(const sd of [-1,1]){const hip=child(B,sd*0.35*sc,0,0,sw*sd,0,0);glowQ(child(hip,0,-0.33*sc,0,0,0,0,0.3*sc,0.66*sc,0.34*sc),0.35);
    const kn=child(hip,0,-0.66*sc,0,Math.max(0,-sw*sd)*0.8,0,0);glowQ(child(kn,0,-0.3*sc,0,0,0,0,0.26*sc,0.6*sc,0.3*sc),0.35);glowQ(child(kn,0,-0.62*sc,0.08*sc,0,0,0,0.34*sc,0.1*sc,0.52*sc),0.45);}
  glowQ(child(B,0,0.55*sc,0,0,0,0,1.05*sc,0.95*sc,0.7*sc),0.25);glowQ(child(B,0,1.1*sc,0.05*sc,0,0,0,0.45*sc,0.3*sc,0.4*sc),0.4);
  queue(MESH.glowBox,child(B,0,1.12*sc,0.26*sc,0,0,0,0.3*sc,0.06*sc,0.02*sc),[1,1,1,0.9],F_ADD);
  const pt=K?time-(K.punchT||-9):9;
  for(const sd of [-1,1]){const punching=pt<0.3&&K.arm===sd;const sh=child(B,sd*0.68*sc,0.85*sc,0,punching?-1.6:(moving?-sw*sd*0.6:-0.1),0,sd*0.12);
    glowQ(child(sh,0,-0.35*sc,0,0,0,0,0.3*sc,0.7*sc,0.3*sc),0.35);const el=child(sh,0,-0.7*sc,0,punching?0:-0.4,0,0);glowQ(child(el,0,-0.3*sc,0,0,0,0,0.26*sc,0.6*sc,0.26*sc),0.35);
    glowQ(child(el,0,-0.68*sc,0,0,0,0,0.4*sc,0.32*sc,0.4*sc),0.5);glowQ(child(sh,sd*0.2*sc,0.1*sc,0,0,0,0,0.18*sc,0.3*sc,0.18*sc),0.5);}
}
// the rider sits inside the construct; mechs raise the hero into the cockpit
function riderOffset(id){const C=CONSTRUCTS[id];if(!C||!C.scale)return 0;return 1.3*C.scale*conSize()+0.2*C.scale;}
function drawRing(){
  for(const F of ringFxList){
    if(F.kind==='hammer'){const k=Math.min(1,F.t/0.38),R=F.R,alpha=F.t>0.5?Math.max(0,1-(F.t-0.5)/0.3):1;
      // pivots behind the target and swings from overhead down onto it
      const px=F.x-Math.sin(F.yaw)*R*1.3,pz=F.z-Math.cos(F.yaw)*R*1.3,rot=at(px,F.y+R*0.3,pz,-(1-k*k)*1.5,F.yaw,0);
      glowQ(child(rot,0,0,R*0.65,0,0,0,0.35,0.35,R*1.3),0.5*alpha);glowQ(child(rot,0,0,R*1.3,0,0,0,R*0.9,R*0.6,R*0.6),0.55*alpha);}
    else if(F.kind==='lasso'){const c=center(F.a),h=handPoint();for(let i=0;i<8;i++){const t0=i/8,t1=(i+1)/8,sag=Math.sin(t0*Math.PI)*1.5,sag1=Math.sin(t1*Math.PI)*1.5;
        queue(MESH.glowBox,M4.beam(tmpM(),lerp(h.x,c.x,t0),lerp(h.y,c.y,t0)-sag,lerp(h.z,c.z,t0),lerp(h.x,c.x,t1),lerp(h.y,c.y,t1)-sag1,lerp(h.z,c.z,t1),0.12),RING_C4,F_ADD);}
      queue(MESH.ring,at(c.x,c.y,c.z,0,time*6,0,1.3,1,1.3),[RING_C[0],RING_C[1],RING_C[2],0.9],F_ADD);}}
  for(const H of holes){const k=Math.min(1,H.t/0.8),f=H.t>H.dur-0.6?Math.max(0,(H.dur-H.t)/0.6):1,s=(3+H.R*0.06)*k*f*(1+Math.sin(time*12)*0.03);
    queue(MESH.sphere,at(H.x,H.y,H.z,0,0,0,s,s,s),[0,0,0,1],F_UN);queue(MESH.glowSphere,at(H.x,H.y,H.z,0,0,0,s*1.5,s*1.5,s*1.5),[.45,.25,1,0.4*f],F_ADD);
    for(let i=0;i<4;i++)queue(MESH.ring,M4.alignY(tmpM(),H.x,H.y,H.z,Math.sin(i*0.9)*0.35,1,Math.cos(i*1.3)*0.35,s*(2+i*0.9)),[1,.55+i*0.08,.25,0.55*k*f],F_ADD);}
  if(state!=='play'||P.dead)return;
  if(P.ringShield){const r=3.2;queue(MESH.glowSphere,at(P.pos.x,P.pos.y+1.3,P.pos.z,0,0,0,r,r,r),[RING_C[0],RING_C[1],RING_C[2],0.14],F_ADD);queue(MESH.ring,M4.alignY(tmpM(),P.pos.x,P.pos.y+1.3,P.pos.z,0,1,0,r),[RING_C[0],RING_C[1],RING_C[2],0.5],F_ADD);}
  if(P.lantern){const s=Math.sin(P.heroYaw),c=Math.cos(P.heroYaw),x=P.pos.x+s*1.2,z=P.pos.z+c*1.2,y=P.pos.y+1.2,g=0.6+(save.ring/100)*0.8;
    queue(MESH.box,at(x,y,z,0,P.heroYaw,0,0.55,0.8,0.55),[.12,.14,.13,1],F_SH);queue(MESH.glowBox,at(x,y+0.05,z,0,P.heroYaw,0,0.42,0.5,0.42),RING_C4,0);
    queue(MESH.glowSphere,at(x,y,z,0,0,0,g,g,g),[RING_C[0],RING_C[1],RING_C[2],0.35],F_ADD);queue(MESH.box,at(x,y+0.5,z,0,P.heroYaw,0,0.2,0.2,0.2),[.12,.14,.13,1],0);}
  if(isRing()&&P.hand&&!P.alien&&!P.rag)queue(MESH.glowBox,child(P.hand,0,-0.05,0.05,0,0,0,0.13,0.1,0.13),RING_C4,0);
  if(P.construct)drawConstruct(P,P.construct.id,true);
}
