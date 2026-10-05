// ================================================================
// Prism Ascension: the rainbow form every hero can enter, anywhere
// ================================================================
// Hold T (or the ASCEND button, on touch too) for 3 s; letting go early cancels. No cooldown. In the form you cannot be hurt (godSafe in 30_systems.js, the Kathana arena included),
// you fly, and the hotbar is 1 Time Stop, 2 Barrage, 3 Erase (4 Destroy while the story allows it). A rainbow energy bar (PR.e, 0..100) pays for them:
//   Time Stop: a toggle, 3.5/s. Everything but you stands still until you press it again. A boss breaks out after a while: Kathana 10 s, the Sovereign 6 s, the twins 20 s.
//   Barrage:   hold, 40 shots a second, 12/s. Hitscan, own pooled beams (the world's effects stand still during Time Stop). Bosses take capped damage per shot.
//   Erase:     40 energy, needs a locked target. It dissolves in rainbow light and counts as a kill; on a boss it is one big capped hit and the form ends.
// The form ends when a boss is defeated, when Erase hits a boss, after 100 simple kills, or (the opener) when a twin falls. Nothing else ends it.
// Time Stop does not work in multiplayer rooms (it would freeze the host's shared world); Barrage and Erase never touch real players there.
const PR_HOLD=3,PR_KILLS=100,PR_TS_DRAIN=3.5,PR_BAR_DRAIN=12,PR_REGEN=9,PR_ERASE=40,PR_SHOTS=40,PR_BREAK={kathana:10,sov:6,twins:20},PR_NAMES={kathana:'Kathana',sov:'The Sovereign',twins:'The twins'};
const PR_KEY='T',prKeyHint=()=>touchOn()?'the ASCEND button':'T';
const prDestroyOk=()=>PR.on&&!kathanaDone()&&(destroyAvail()||PR.sun); // the story's Destroy, or the Sun route's (which never needed the story)
const prHoldOk=()=>state==='play'&&!paused&&!P.dead&&!cutLocked()&&!(frozenT>0)&&!voidbornLocked()&&!dialOpen&&!ASK&&!oathOpen;
function prEnc(){ // which boss fight Time Stop is holding back right now
  if(KA.on&&inVoid())return 'kathana';
  if(typeof SOV!=='undefined'&&SOV.fight&&SOV.a&&SOV.a.alive)return 'sov';
  if(OPN.on&&OPN.twins.some(a=>a.alive))return 'twins';
  return '';
}
function prEncPos(enc){
  if(enc==='sov'&&SOV.a)return {x:SOV.a.pos.x,y:SOV.a.pos.y+3,z:SOV.a.pos.z};
  if(enc==='twins'){const a=OPN.twins.find(t=>t.alive);if(a)return {x:a.pos.x,y:a.pos.y+a.cy,z:a.pos.z};}
  if(enc==='kathana'){let n=0,x=0,y=0,z=0;for(const o of KA.orbs)if(!o.dead&&o.a.alive){n++;x+=o.a.pos.x;y+=o.a.pos.y;z+=o.a.pos.z;}if(n)return {x:x/n,y:y/n,z:z/n};return {x:KA.bx,y:70,z:KA.bz};}
  return {x:P.pos.x,y:P.pos.y+1.5,z:P.pos.z};
}
// 1 when this boss has broken out of Time Stop, else the world clock (the boss fights call this where they used worldTimeK)
const prBossK=id=>PR.ts&&PR.free&&PR.enc===id&&!(timeStopT>0)&&!(frozenT>0)?1:worldTimeK();
// the clock for projectiles and effects: they stand still with the world, but a boss that broke out gets its attacks and sparks back
const prFreeDt=dt=>PR.on&&PR.ts&&PR.free&&!(timeStopT>0)&&!(frozenT>0)?dt:0;
// ---- the effects Time Stop must not freeze: Barrage beams, Erase rings and shards (aged by real time) ----
function prFx(o){if(PR.fx.length>=60)PR.fx.shift();PR.fx.push(o);}
function prRing(x,y,z,r1,life,h,tilt){prFx({k:'ring',x,y,z,r0:0.5,r1,t:0,life,h,tilt:tilt||0});}
function prShards(x,y,z,n,spd,life,size){for(let i=0;i<n;i++){const a=rr(0,TAU),u=rr(-1,1),r=Math.sqrt(1-u*u),s=spd*rr(0.3,1);prFx({k:'orb',x,y,z,vx:Math.cos(a)*r*s,vy:u*s,vz:Math.sin(a)*r*s,t:0,life:life*rr(0.6,1),s:size*rr(0.6,1.3),h:Math.random()});}}
// ---- the hold: T (or the button) fills a ring in 3 s ----
function prismHoldStart(src){
  if(PR.on||PR.hold>0||!prHoldOk()||!save.character)return false;
  PR.hold=0.0001;PR.holdSrc=src;SFX.tone('sine',200,700,PR_HOLD,0.05);return true;
}
function prismHoldEnd(){if(PR.hold>0&&!PR.on){PR.hold=0;SFX.tone('sine',500,200,0.12,0.05);}PR.hold=0;}
function prismHoldTick(real){
  if(PR.on){PR.hold=0;return;}
  if(!(PR.hold>0))return;
  if(!prHoldOk()){PR.hold=0;return;}
  PR.hold+=real;
  if(Math.random()<0.8){const c=center(P),a=rr(0,TAU),r=rr(2,4),h=hue(Math.random(),1,1);emit(c.x+Math.cos(a)*r,c.y+rr(-1.2,1.2),c.z+Math.sin(a)*r,-Math.cos(a)*r*2.2,rr(-1,1),-Math.sin(a)*r*2.2,0.45,h,rr(0.5,1),0,0);}
  P.flash=Math.max(P.flash,0.1+0.25*(PR.hold/PR_HOLD));
  if(PR.hold>=PR_HOLD){PR.hold=0;prismStart('hold');}
}
// ---- going in and coming out ----
function prismStart(src){
  if(PR.on||state!=='play'||P.dead||!save.character)return false;
  const arena=SG.on&&SG.src==='arena';
  if(SG.on)sunGodEnd(true,true); // (stay: don't push the hero out of the Sun)
  if(timeStopT>0){timeStopT=0;endTimeStop();}
  stopAllPowers();if(P.car)exitCar(true);if(P.alien)revertAlien(true);
  PR.on=true;PR.sun=src==='sun';PR.e=100;PR.ts=false;PR.free=false;PR.enc='';PR.encT=0;PR.rumble=false;PR.bar=false;PR.dry=false;PR.kills=0;PR.fireAcc=0;PR.hold=0;PR.beams.length=0;PR.bi=0;PR.used={ts:false,bar:false,er:false};PR.sound=0;
  P.flying=true;P.grounded=false;P.hp=maxHp();P.en=maxEn();P.stun=0;
  const c=center(P);ringFx(c.x,c.y,c.z,1,30,0.8,[1,.5,.9]);ringFx(c.x,c.y,c.z,1,20,0.6,[.5,1,.9]);burst(c.x,c.y,c.z,140,36,1.3,[[1,.3,.5],[1,.9,.3],[.3,1,.6],[.4,.6,1],[.8,.4,1]],2.2,0,1.5);
  flashWhite=0.9;SFX.transform();SFX.chime();addShake(0.5);
  toast('PRISM ASCENSION',touchOn()?'Time Stop · Barrage (hold) · Erase':'1 Time Stop · 2 Barrage (hold) · 3 Erase','purple');
  if(!save.guide.prismSeen){save.guide.prismSeen=true;persist();}
  buildHotbar();buildTouchButtons();prHud(true);Bus.emit('prismStart',{arena});return true;
}
function prismEnd(why){
  if(!PR.on)return;
  if(PR.ts)prismTsEnd(true);
  PR.on=false;PR.bar=false;PR.hold=0;SFX.setLaser(false);
  const c=center(P);ringFx(c.x,c.y,c.z,1,26,0.7,[1,.5,.9]);burst(c.x,c.y,c.z,100,26,1.1,[[1,.3,.5],[1,.9,.3],[.3,1,.6],[.4,.6,1],[.8,.4,1]],2,0,1.5);flashWhite=Math.max(flashWhite,0.6);SFX.tone('sine',1400,200,0.6,0.1);
  if(SUN_B&&P.pos.y>CEIL){const dx=P.pos.x-SUN_B.x,dy=P.pos.y-SUN_B.y,dz=P.pos.z-SUN_B.z,d=Math.hypot(dx,dy,dz);
    if(d<SUN_B.r+900){const k=(SUN_B.r+1100)/(d||1),nx=d>1e-3?dx*k:0,ny=d>1e-3?dy*k:SUN_B.r+1100,nz=d>1e-3?dz*k:0;P.pos.set(SUN_B.x+nx,SUN_B.y+ny,SUN_B.z+nz);P.vel.set(0,0,0);P.sunT=time+3;}}
  P.flash=0;sgTint(0,0);
  if(why!=='destroy'&&why!=='lost'&&KA.on&&inVoid()&&(KA.fight||PF.fight)&&!KA.lost&&!SG.on)sunGodStart('arena',true); // Kathana's arena: back to the Sun God you fight as there
  buildHotbar();buildTouchButtons();prHud(false);
  if(why!=='destroy'&&why!=='lost')toast('The rainbow fades',why==='kills'?'100 down · '+(touchOn()?'hold ASCEND':'hold T')+' to ascend again':'Hold '+prKeyHint()+' to ascend again','purple');
  Bus.emit('prismEnd',{why});
}
// ---- 1 Time Stop ----
function prismTsStart(){
  if(MP.online()){feed('Time Stop','It does not work in a shared room');SFX.tone('square',300,200,0.1,0.06);return;}
  if(PR.e<8){prNoEnergy();return;}
  PR.ts=true;PR.free=false;PR.encT=0;PR.rumble=false;PR.enc=prEnc();PR.used.ts=true;
  flashWhite=Math.max(flashWhite,0.45);SFX.tone('sine',1200,80,0.8,0.15);SFX.boom(0.5,0.3);addShake(0.2);
  prRing(P.pos.x,P.pos.y+1.3,P.pos.z,60,0.9,0.1,0);prRing(P.pos.x,P.pos.y+1.3,P.pos.z,40,0.7,0.5,0.6);
  feed('Time stopped',touchOn()?'Tap Time Stop again to resume':'Press 1 again to resume');
}
function prismTsEnd(silent){
  if(!PR.ts)return;PR.ts=false;PR.free=false;PR.rumble=false;
  if(!silent){flashWhite=Math.max(flashWhite,0.35);SFX.tone('sine',200,1200,0.5,0.1);feed('Time resumes','');}
}
function prNoEnergy(){hud.en.classList.add('warn');setTimeout(()=>hud.en.classList.remove('warn'),300);SFX.tone('square',220,150,0.1,0.06);feed('Out of energy','It comes back while you rest');}
// ---- 2 Barrage: 40 shots a second, held ----
function prismBarrageDown(){if(!PR.on)return;if(PR.e<4){prNoEnergy();return;}PR.bar=true;PR.used.bar=true;}
function prismBarrageUp(){PR.bar=false;}
let prCand=[];
function prHostile(a){return a.alive&&!a.held&&a!==P&&a.kind!=='remote'&&a.kind!=='prop'&&a.kind!=='vehicle'&&lockable(a)&&hostileTo(a);}
function prShots(real){
  PR.fireAcc+=real*PR_SHOTS;const n=Math.min(6,PR.fireAcc|0);PR.fireAcc-=n;if(!n)return;
  const e=P.eye,h=handPoint();faceAim();
  let dx=camF.x,dy=camF.y,dz=camF.z;
  const lk=lockT&&prHostile(lockT)?lockT:null;
  if(lk){const c=center(lk);dx=c.x-e.x;dy=c.y-e.y;dz=c.z-e.z;}else if(aim.hitAny){dx=aim.x-e.x;dy=aim.y-e.y;dz=aim.z-e.z;}
  const l0=Math.hypot(dx,dy,dz)||1;dx/=l0;dy/=l0;dz/=l0;
  // one target for the whole frame's shots: the lock, else the first hostile on the line (walls stop an unlocked shot)
  let L=220,tgt=lk,tt=lk?Math.hypot(center(lk).x-e.x,center(lk).y-e.y,center(lk).z-e.z):0;
  if(!lk){
    const w=rayCity(e.x,e.y,e.z,dx,dy,dz,L);if(w<L-0.3)L=w;if(dy<-0.001){const tg=-e.y/dy;if(tg>0&&tg<L)L=tg;}
    tt=L+2;for(const a of actors){if(!prHostile(a))continue;const c=center(a),vx=c.x-e.x,vy=c.y-e.y,vz=c.z-e.z,t=vx*dx+vy*dy+vz*dz;if(t<0||t>=tt)continue;
      const px=vx-dx*t,py=vy-dy*t,pz=vz-dz*t,rad=(a.radius||1)+0.9;if(px*px+py*py+pz*pz<=rad*rad){tgt=a;tt=t;}}
    if(!tgt)tt=L;
  }
  for(let i=0;i<n;i++){
    const sp=0.014,len=tgt?tt:L,hx=e.x+(dx+rr(-sp,sp))*len,hy=e.y+(dy+rr(-sp,sp))*len,hz=e.z+(dz+rr(-sp,sp))*len;
    const b=PR.beams[PR.bi=(PR.bi+1)%28]||(PR.beams[PR.bi]={});b.ax=h.x;b.ay=h.y;b.az=h.z;b.bx=hx;b.by=hy;b.bz=hz;b.t=0;b.life=0.1;b.h=(time*0.9+PR.bi/28)%1;b.hit=!!tgt;
    if(tgt&&tgt.alive)prShotHit(tgt);
  }
  if(PR.sound<=0){PR.sound=0.07;SFX.tone('square',1100+rr(-100,100),600,0.06,0.025);}
  SFX.setLaser(true);
}
function prShotHit(a){
  const big=sgBig(a),cap=a.sgCap&&a.sgCap.prism;
  Damage.apply(P,a,big?14*(cap||1):30+save.level*0.5,'prism',{stun:big?0:0.2});
}
// ---- 3 Erase ----
function prismErase(){
  if(!PR.on||!canAct())return;
  const a=lockT;
  if(!a||!a.alive||a.kind==='remote'||!lockable(a)){feed('Erase needs a locked target',touchOn()?'Tap LOCK first':'Press Z first');SFX.tone('square',300,200,0.1,0.06);return;}
  if(PR.e<PR_ERASE){prNoEnergy();return;}
  PR.e-=PR_ERASE;PR.used.er=true;faceAim();
  const c=center(a),x=c.x,y=c.y,z=c.z,big=sgBig(a)||a.kind==='kperfect',boss=big||a.kind==='korb';
  const h0=Math.random();
  prRing(x,y,z,boss?46:14,0.8,h0,0);prRing(x,y,z,boss?36:10,0.65,h0+0.3,0.9);prRing(x,y,z,boss?26:7,0.5,h0+0.6,-0.9);
  prShards(x,y,z,boss?40:22,boss?30:14,0.9,boss?2.4:1.2);
  const hp=handPoint();prFx({k:'beam',x:hp.x,y:hp.y,z:hp.z,bx:x,by:y,bz:z,t:0,life:0.3,h:h0});
  flashWhite=Math.max(flashWhite,boss?0.8:0.4);SFX.boom(boss?1:0.6,boss?1.6:0.9);SFX.chime();addShake(boss?0.9:0.35);
  if(a.dec){pfPop(a);return;}
  if(boss){
    if(a.kind==='korb')Damage.apply(P,a,1e9,'prism',{});else Damage.apply(P,a,Math.min(a.maxHp*0.18,7000)*(a.sgCap&&a.sgCap.prism||1),'prism',{stun:1});
    feed('ERASED',boss&&a.kind!=='korb'?'A reality-breaking hit':'Gone from existence');prismEnd('erase');return;
  }
  Damage.apply(P,a,(a.hp||50)*2+100,'prism',{});prVanish(a);
}
// the target leaves no body: out of the world and out of the list that kept it
function prVanish(a){
  if(a.alive)return;
  a.erased=true;
  if(a.kind==='invader')invRemove(a);
  else if(a.kind==='cyborg'&&typeof cbRemove==='function')cbRemove(a);
  else if(a.twin){openerRemoveTwin(a);removeFrom(OPN.twins,a);}
  else{removeActor(a);if(typeof ualiens!=='undefined')removeFrom(ualiens,a);}
  if(lockT===a){lockT=null;const n=nextLock(a);if(n)lockT=n;}
}
function prismAbilityDown(slot){
  if(!PR.on)return;
  if(slot===3){if(prDestroyOk()&&canAct())destroyStart(true);return;}
  if(!canAct())return;
  if(slot===0){if(PR.ts)prismTsEnd(false);else prismTsStart();}
  else if(slot===1)prismBarrageDown();
  else if(slot===2)prismErase();
}
function prismAbilityUp(slot){if(slot===1)prismBarrageUp();}
// ---- the end conditions ----
function prKillCount(){
  if(!PR.on)return;PR.kills++;
  if(PR.kills>=PR_KILLS)prismEnd('kills');
  else if(PR.kills===PR_KILLS-10)feed('10 to go','The rainbow is running out');
}
Bus.on('defeated',({target,killer})=>{
  if(!PR.on||killer!==P||!target)return;
  const boss=(sgBig(target)||target.kind==='kperfect')&&!target.dec&&target.kind!=='korb'&&target.kind!=='pforb';
  if(target.twin){if(OPN.on)prismEnd('twin');return;} // the opener (71_opener.js): the first twin down ends the form
  if(boss)prismEnd('boss');
  else if(hostileTo(target)&&!target.dec)prKillCount();
});
// ---- per frame (frameBody in 99_main.js, real time) ----
let prDiscT=0;
function prismFrame(real,dt){
  prismHoldTick(real);
  if(!PR.on){
    // the old way in: a Sun God from V that flies into the Sun
    if(SG.on&&SG.src==='v'&&hasTrav('solarFlight')&&SUN_B&&P.pos.y>CEIL&&!zone&&!KA.on&&Math.hypot(P.pos.x-SUN_B.x,P.pos.y-SUN_B.y,P.pos.z-SUN_B.z)<SUN_B.r)prismStart('sun');
    // a gentle nudge once, a minute into a session that has never ascended
    if(!save.guide.prismSeen&&!PR.nudged&&save.character&&state==='play'&&!paused&&!P.dead&&!cutLocked()&&!OPN.on&&!KA.on&&(prDiscT+=real)>=60){PR.nudged=true;save.guide.prismSeen=true;persist();toast('Hold '+prKeyHint()+' to ascend',touchOn()?'The ASCEND button: three seconds, every hero':'Three seconds, every hero · it never runs out of time','gold');}
    prHud(false);return;
  }
  if(P.dead){prismEnd('lost');return;}
  if(frozenT>0){frozenT=0;tsBy=null;}
  P.hp=maxHp();P.en=maxEn();P.lastSpend=time;P.stun=0;
  PR.sound-=real;
  // energy: Time Stop and Barrage drain it, resting fills it
  let firing=false;
  if(PR.bar&&!PR.dry&&canAct())firing=true;
  if(PR.dry&&!PR.bar)PR.dry=false;
  if(PR.ts)PR.e-=PR_TS_DRAIN*real;
  if(firing){PR.e-=PR_BAR_DRAIN*real;prShots(real);if(!PR.on)return;}else{PR.fireAcc=0;if(!PR.bar||PR.dry)SFX.setLaser(false);}
  if(!PR.ts&&!firing)PR.e=Math.min(100,PR.e+PR_REGEN*real);
  if(PR.e<=0){PR.e=0;if(PR.ts){prismTsEnd(true);feed('Time resumes','Out of energy');SFX.tone('sine',200,900,0.4,0.1);}if(firing){PR.dry=true;SFX.setLaser(false);feed('Barrage','Out of energy');}}
  if(PR.dry&&PR.e>=15&&!PR.bar)PR.dry=false;
  // bosses break out of Time Stop
  if(PR.ts){
    const enc=prEnc();if(enc!==PR.enc){PR.enc=enc;PR.encT=0;PR.free=false;PR.rumble=false;}
    if(enc&&!PR.free){
      PR.encT+=real;const lim=PR_BREAK[enc],p=prEncPos(enc);
      if(PR.encT>=lim-2.5&&!PR.rumble){PR.rumble=true;toast(PR_NAMES[enc]+' strains against the stop','Time is cracking',enc==='sov'?'purple':'red');SFX.tone('sawtooth',50,30,2.6,0.2);}
      if(PR.rumble&&PR.encT<lim){addShake(0.1+0.4*(PR.encT-(lim-2.5))/2.5);PR.rumbleT=(PR.rumbleT||0)-real;if(PR.rumbleT<=0){PR.rumbleT=0.3;SFX.boom(0.25,2.4);prRing(p.x,p.y,p.z,10+rr(0,10),0.5,Math.random(),rr(-1,1));prShards(p.x,p.y,p.z,6,8,0.5,0.8);}}
      if(PR.encT>=lim){PR.free=true;flashWhite=Math.max(flashWhite,0.7);addShake(1);SFX.boom(1,2);SFX.tone('sawtooth',300,40,1,0.15);prRing(p.x,p.y,p.z,70,1,0.1,0);prRing(p.x,p.y,p.z,50,0.8,0.5,0.7);prShards(p.x,p.y,p.z,36,40,1.1,2.2);toast(PR_NAMES[enc]+' breaks free','Everything else is still frozen','gold');}
    }
  }
  // the beams and rings age on real time
  for(const b of PR.beams)if(b)b.t+=real;
  for(let i=PR.fx.length-1;i>=0;i--){const f=PR.fx[i];f.t+=real;if(f.t>=f.life){PR.fx.splice(i,1);continue;}if(f.k==='orb'){f.x+=f.vx*real;f.y+=f.vy*real;f.z+=f.vz*real;f.vx*=0.96;f.vy*=0.96;f.vz*=0.96;}}
  // the glow and the colours
  P.flash=0.16+0.06*Math.sin(time*6);
  if(!PR.ts){const c=center(P);for(let i=0;i<3;i++){const h=hue(time*0.4+rr(0,1),1,1);emit(c.x+rr(-1,1),c.y+rr(-1.3,1.3),c.z+rr(-1,1),rr(-2,2),rr(1,5),rr(-2,2),rr(0.5,1),h,rr(0.7,1.5),-1,0.6);}}
  let tint=0;if(SUN_B&&P.pos.y>CEIL){const d=Math.hypot(P.pos.x-SUN_B.x,P.pos.y-SUN_B.y,P.pos.z-SUN_B.z);tint=clamp((SUN_B.r+2500-d)/(2500+SUN_B.r*0.2),0,1)*0.6;}
  sgTint(0,tint);
  prHud(true);
}
// ---- the HUD: the energy pill, the hotbar slots and the ASCEND button ----
let prBar=null,prAsc=null; // built on first use (the HUD helpers load after this file)
function prInit(){
  if(prBar)return;
  prBar=el('div',{id:'prbar',hidden:true},el('span',{id:'prbar-t'},'PRISM'),el('i',{class:'e'},el('b',{id:'prbar-e'})),el('em',{id:'prbar-k'},'0/100'));
  prAsc=el('button',{id:'asc',type:'button',hidden:true,'aria-label':'Hold to ascend (T)'},el('i',{class:'ring'}),el('kbd',{text:'T'}),el('span',{text:'ASCEND'}));
  const hb=$('sgbar');if(hb)hb.after(prBar);const h=$('hud');if(h)h.appendChild(prAsc);
  const dn=e=>{e.preventDefault();e.stopPropagation();try{prAsc.setPointerCapture(e.pointerId);}catch(err){}prismHoldStart('btn');},up=()=>prismHoldEnd();
  prAsc.addEventListener('pointerdown',dn);prAsc.addEventListener('pointerup',up);prAsc.addEventListener('pointercancel',up);prAsc.addEventListener('contextmenu',e=>e.preventDefault());
}
let prHudSig='';
function prHud(on){
  prInit();
  const vis=state==='play'&&(on||PR.on);
  prBar.hidden=!(vis&&PR.on);
  // the side button: desktop only (touch has its own ASCEND button in the ring of buttons); it shows whenever the form can be entered
  const showAsc=state==='play'&&!PR.on&&!!save.character&&!touchOn()&&!cutLocked();
  if(prAsc.hidden===showAsc)prAsc.hidden=!showAsc;
  const hp=PR.hold>0?clamp(PR.hold/PR_HOLD,0,1):0;
  prAsc.style.setProperty('--p',(hp*100).toFixed(1)+'%');prAsc.classList.toggle('hold',hp>0);
  if(touchOn()){const t=TB.asc;if(t&&t.b){const ring=t.b.querySelector('.cd');if(ring){ring.hidden=!(hp>0);if(hp>0)ring.style.background='conic-gradient(transparent '+(hp*100).toFixed(1)+'%,rgba(0,0,0,.62) 0)';}t.b.classList.toggle('on',hp>0);}}
  if(!PR.on)return;
  const sig=Math.round(PR.e)+'|'+PR.kills+'|'+(PR.ts?1:0)+'|'+(PR.rumble?1:0)+'|'+(PR.dry?1:0)+'|'+(PR.free?1:0);
  if(sig!==prHudSig){prHudSig=sig;$('prbar-e').style.width=clamp(PR.e,0,100).toFixed(1)+'%';$('prbar-k').textContent=PR.kills+' / '+PR_KILLS;
    $('prbar-t').textContent=PR.ts?(PR.free?'TIME STOP · BROKEN':'TIME STOP'):'PRISM';prBar.classList.toggle('ts',PR.ts);prBar.classList.toggle('low',PR.e<20);}
  for(const s of slotEls){if(s.prx===undefined)continue;const i=s.prx;
    s.s.classList.toggle('on',i===0?PR.ts:i===1?PR.bar&&!PR.dry&&PR.e>0:false);
    const cant=i===2?PR.e<PR_ERASE:i===1?PR.dry:false;s.s.classList.toggle('dim',cant);}
}
// ---- the hotbar and the touch buttons ----
function prBuildHotbar(){
  const defs=[['Time Stop','toggle · 3.5/s'],['Barrage','hold · 12/s'],['Erase','40 energy · lock on']];
  defs.forEach((d,i)=>{const s=el('div',{class:'slot prx'},el('kbd',{text:touchOn()?'':String(i+1)}),el('span',{class:'nm',text:d[0]}),el('small',{text:d[1]}));
    s.addEventListener('pointerdown',e=>{if(touchOn())return;e.preventDefault();prismAbilityDown(i);});s.addEventListener('pointerup',()=>prismAbilityUp(i));hud.hotbar.appendChild(s);slotEls.push({pr:true,prx:i,s});});
  if(prDestroyOk()){const s=el('div',{class:'slot prism'},el('kbd',{text:touchOn()?'':'4'}),el('span',{class:'nm',text:'DESTROY'}),el('small',{text:'Prism'}));s.addEventListener('click',()=>{if(canAct())destroyStart(true);});hud.hotbar.appendChild(s);slotEls.push({pr:true,s});}
}
function prTouchButtons(){
  tbMake('p0','a0','clockStop','Time Stop','B','ab prismb').prepend(el('i',{class:'cd',hidden:true}));
  tbMake('p1','a1','beam','Barrage','B','ab prismb').prepend(el('i',{class:'cd',hidden:true}));
  tbMake('p2','a2','eyeOff','Erase','B','ab prismb').prepend(el('i',{class:'cd',hidden:true}));
  if(prDestroyOk())tbMake('p3','a3','burst','DESTROY','B','ab prismb').prepend(el('i',{class:'cd',hidden:true}));
}
// ---- drawing: the ring of rainbow light, the Barrage beams and the Erase effects ----
function prismDraw(){
  if(!PR.on||P.dead||(state!=='play'&&state!=='menu'))return;
  const x=P.pos.x,y=P.pos.y+1.35,z=P.pos.z,t=time;
  queue(KGS,at(x,y,z,0,0,0,2.3,2.5,2.3),[...hue(t*0.3,0.8,1),0.07],F_ADD);
  for(let i=0;i<5;i++){const a=t*(0.9+i*0.17)*(i%2?1:-1),r=1.75+0.22*i,h=hue(t*0.25+i/5,1,1);
    queue(KTORP,at(x,y+Math.sin(t*1.7+i)*0.25,z,Math.sin(a)*0.9,a*0.7+i,Math.cos(a*0.9)*0.9,r,r,r),[h[0],h[1],h[2],0.7],F_ADD);}
  for(let i=0;i<10;i++){const a=t*1.6+i*TAU/10,h=hue(t*0.4+i/10,1,1),r=1.9;queue(KGS,at(x+Math.cos(a)*r,y+Math.sin(a*2+t)*0.5,z+Math.sin(a)*r,0,0,0,0.12,0.12,0.12),[h[0],h[1],h[2],0.95],F_ADD);}
  for(const b of PR.beams){if(!b||b.t>=b.life)continue;const k=1-b.t/b.life,c=hue(b.h,1,1);
    queue(MESH.glowBox,M4.beam(tmpM(),b.ax,b.ay,b.az,b.bx,b.by,b.bz,0.07),[1,1,1,k],F_ADD);queue(MESH.glowBox,M4.beam(tmpM(),b.ax,b.ay,b.az,b.bx,b.by,b.bz,0.26),[c[0],c[1],c[2],0.5*k],F_ADD);
    if(b.hit){const q=0.5+0.7*k;queue(MESH.glowSphere,at(b.bx,b.by,b.bz,0,0,0,q,q,q),[c[0],c[1],c[2],0.7*k],F_ADD);}}
  for(const f of PR.fx){const k=f.t/f.life,c=hue(f.h+t*0.2,1,1);
    if(f.k==='ring'){const r=lerp(f.r0,f.r1,1-(1-k)*(1-k));queue(MESH.ring,M4.alignY(tmpM(),f.x,f.y,f.z,Math.sin(f.tilt*3)*0.8,1,Math.cos(f.tilt*3)*0.8,r),[c[0],c[1],c[2],0.9*(1-k)],F_ADD);}
    else if(f.k==='orb'){const s=f.s*(1-k*0.7);queue(MESH.glowSphere,at(f.x,f.y,f.z,0,0,0,s,s,s),[c[0],c[1],c[2],0.9*(1-k)],F_ADD);}
    else if(f.k==='beam'){const w=1.4*(1-k);queue(MESH.glowBox,M4.beam(tmpM(),f.x,f.y,f.z,f.bx,f.by,f.bz,w*0.4),[1,1,1,1-k],F_ADD);queue(MESH.glowBox,M4.beam(tmpM(),f.x,f.y,f.z,f.bx,f.by,f.bz,w),[c[0],c[1],c[2],0.5*(1-k)],F_ADD);}}
}
