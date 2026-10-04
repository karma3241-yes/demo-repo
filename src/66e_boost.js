// ================================================================
// UFO boosts: what taking the UFO item gives every hero (save.story.ufo>=2, see ufoBoost / boostMul in 20_core.js)
// ================================================================
// Every hero keeps its boost for good, and it is picked by the hero you play right now. Where each one is wired:
//  all heroes       +20% max health (maxHp) · the reward panel (boostPanel) and the "UFO boosts" list in the Unlocks sheet (70_ui.js renderUnlocks)
//  Shifter          shiftMaster() (45_aliens.js): every alien, no limit, no recharge, V switches aliens directly
//  Ring Bearer      ringInf() / meterInf() (49e_meters.js): the ring never drains; conMaxGrow (49_ring.js) has no cap
//  Tempest          stormAxe(): the Storm Axe look (axeBlade), +60% hammer damage (boostMul 'dmg'), a bolt on every hit (47_abilities.js), lightning never drains
//  Speedster        Rewind (X / touch button / extra hotbar slot): rewindRecord, rewind, rewindStep below
//  Web Runner       the UFO reel (ufoWebReel in 66d_ufo.js, reelStep below) and sky anchors (skyAnchor) + 25% swing speed cap
//  Sun Titan        sgVDur / sgVCd (49k_sungod.js): Sun God 90 s from V, 20 s wait
//  Armored Inventor battery never drains (meterInf), +50% repulsor / blast / core beam damage (boostMul 'dmg' in pstat)
//  Ironclad, Nightblade, Slingshot, Goliath  boostMul 'dmgAll' (Damage.apply), 'speed' (flySpeed), 'cost' (spend and per-second drains), 'cd' (cdMul)
const BOOST_TXT={
  bandFlight:'All aliens unlocked. The Morph Band never runs out and never needs to recharge. Press V in any form to switch straight to another alien (pick your own form again to turn back).',
  powerRing:'Constructs grow without a size limit and the ring never loses charge.',
  stormFlight:'Your hammer is now the Storm Axe: 60% more damage, lightning on every hit, and your lightning never runs out.',
  superSpeed:'Rewind: press X to turn back the last 10 seconds, taking everyone and everything back with you. 20 s to recharge.',
  webSwing:'Graviton Web Gland: webs can hold on to the open sky when no building is near, and swings reach a 25% higher top speed.',
  solarFlight:'Sun God lasts 90 s when you press V, and comes back after only 20 s.',
  armorFlight:'The suit battery never drains, and your repulsors, energy blast and core beam hit 50% harder.',
};
const BOOST_ALL_TXT='50% more damage, 30% faster flight, half the energy cost and powers that come back 30% sooner.';
const boostText=h=>BOOST_TXT[h]||(BOOST_ALL.includes(h)?BOOST_ALL_TXT:BOOST_TXT.powerRing);
const stormAxe=()=>ufoBoost()&&hasTrav('stormFlight');
// ---- the reward ----
function boostGranted(id){
  const it=UFO_ITEMS[id]||ufoItem();
  boostNames();P.hp=maxHp();P.en=maxEn();
  if(id==='bandFlight')toast('All aliens unlocked','Switch freely','gold');
  else if(id==='superSpeed')toast('Rewind unlocked','Press '+(touchOn()?'the REWIND button':'X'),'gold');
  else toast('Reward: '+it.name,'Every hero got stronger','gold');
  buildHotbar();buildTouchButtons();later(0.9,()=>boostPanel(id,0));
}
function boostPanel(id,n){
  const it=UFO_ITEMS[id]||ufoItem();
  if(askInfo('You found the '+it.name,[{b:boostText(id)},'Max health +20% for every hero.','Every hero got stronger. Switch heroes with J to try theirs.'],'Got it'))return;
  if(n<20)later(1,()=>boostPanel(id,n+1)); // a cutscene or another popup is up: try again in a moment
}
// the Unlocks sheet (key 8): one row per hero, gold once the boost is yours
function boostList(B){
  B.append(el('h3',{text:'UFO boosts'}),el('p',{class:'muted',text:ufoBoost()?'Every hero got these when you took the UFO item. Switch heroes with J to try them.':'Take the item inside the UFO and every hero gets its own boost for good.'}));
  const cur=save.character&&save.character.movement[0],got=ufoBoost();
  for(const id in PRESETS){const m=UFO_ITEMS[id];if(!m)continue;
    B.append(el('div',{class:'unl'+(got?' got':'')},el('span',{class:'lvb',text:'UFO'}),POWERS[id]?powerIcon(id):el('i'),el('div',{},el('b',{text:PRESETS[id].name+' · '+(id==='stormFlight'&&got?'Storm Axe Core':m.name)+(id===cur?' (you)':'')}),el('span',{class:'s',text:boostText(id)}))));}
  B.append(el('div',{class:'unl'+(got?' got':'')},el('span',{class:'lvb',text:'UFO'}),el('i'),el('div',{},el('b',{text:'Every hero'}),el('span',{class:'s',text:'+20% max health'}))));
}
// the Storm Axe replaces the name of the hammer on every screen
let _bn='';
function boostNames(){
  const k=ufoBoost()?'1':'0';if(_bn===k)return;const first=_bn==='';_bn=k;const p=POWERS.stormHammer;if(!p)return;
  if(!p._n0){p._n0=p.name;p._d0=p.desc;}
  p.name=k==='1'?'Storm Axe':p._n0;p.desc=k==='1'?'Hurl the Storm Axe. Lightning strikes down on everything it hits, it cuts through whatever is in its path and flies back to your hand. 60% more damage.':p._d0;
  if(!first&&state==='play'){buildHotbar();buildTouchButtons();}
}
// the axe: a steel blade on one side of the head, its edge crackling (M is the head's parent matrix, x/y/z where the head sits, s its size, ry turns the blade round the handle)
function axeBlade(M,x,y,z,s,ry){
  const B=child(M,x,y,z,0,ry||0,0),k=0.52*s;
  queue(MESH.mbox,child(B,k+0.1*s,0,0,0,0,Math.PI/4,0.62*s,0.62*s,0.08*s),STEEL,F_SH);   // the blade (a diamond)
  queue(MESH.mbox,child(B,-(k+0.02*s),0,0,0,0,Math.PI/4,0.17*s,0.17*s,0.17*s),STEEL2,F_SH); // a spike on the other side
  const p=0.65+0.35*Math.sin(time*30);
  queue(MESH.glowBox,child(B,k+0.1*s,0,0,0,0,Math.PI/4,0.7*s,0.7*s,0.1*s),[.45,.75,1,0.2*p],F_ADD); // lightning glow along the edge
  const t=child(B,k+0.1*s+0.44*s,0,0);queue(MESH.glowSphere,at(t[12],t[13],t[14],0,0,0,0.22*s,0.22*s,0.22*s),[.7,.9,1,0.35*p],F_ADD);
  if(Math.random()<0.6){const q=child(B,k+0.1*s+rr(-0.25,0.3)*s,rr(-0.3,0.3)*s,0);tracer(q[12],q[13],q[14],q[12]+rr(-1,1),q[13]+rr(-1,1),q[14]+rr(-1,1),[.65,.85,1],0.04,0.1);}
}
// ---- Web Runner: sky anchors and the reel up to the UFO ----
// Graviton Web Gland: when no building is in reach and you are in the air, the web holds on to a point 40 m up and ahead
function skyAnchor(){
  if(!ufoBoost()||!hasTrav('webSwing')||P.grounded||P.pos.y<12||P.pos.y>SPACE.y-120)return null;
  const [dx,dz]=intentDir();return {x:P.pos.x+dx*26,y:P.pos.y+1.6+40,z:P.pos.z+dz*26,t:48,side:0};
}
function reelStop(){P.reel=null;}
// steady 45 m/s toward the saucer's belly: the speed eases in (never a snap), the body is still collided as usual, and it gives up when something blocks the way
function reelStep(dt){
  const R=P.reel;R.t+=dt;R.x=UFO.x;R.y=UFO.y-26;R.z=UFO.z;
  const dx=R.x-P.pos.x,dy=R.y-(P.pos.y+0.6),dz=R.z-P.pos.z,d=Math.hypot(dx,dy,dz)||1,e=clamp(R.t/0.8,0,1),sp=45*(0.15+0.85*e*e*(3-2*e)),k=damp(6,dt);
  P.vel.x+=(dx/d*sp-P.vel.x)*k;P.vel.y+=(dy/d*sp-P.vel.y)*k;P.vel.z+=(dz/d*sp-P.vel.z)*k;P.grounded=false;P.flying=false;
  if(time-R.pt>1){if(R.pd-d<10){P.reel=null;feed('The web slipped','Something is in the way · find a clear line to the UFO');return;}R.pd=d;R.pt=time;}
  if(Math.random()<dt*20)emit(P.pos.x,P.pos.y+1.3,P.pos.z,rr(-1,1),rr(-1,1),rr(-1,1),0.3,[.9,.95,1],0.5,0,2);
}
function reelCheck(){
  if(!P.reel)return;
  if(P.dead||P.car||P.swim||P.wall||P.wallRun||P.alien||CUT||zone||ASK||!webHeld||!UFO.on||save.story.ufo!==1)P.reel=null;
}
// ================================================================
// Speedster: Rewind (Chrono Core)
// ================================================================
// Every 0.1 s the last 10 s of play are kept: the player (position, velocity, yaw, hp) and every live human, drone, rival and alien within 150 m (position, alive, hp).
// X plays them backwards over about 1.5 s: you and everyone glide back along their paths, anyone recorded alive comes back to life, and your hp is restored to what it
// was at the start of the buffer (never lowered). 20 s to recharge. Solo only. The screen goes blue and grey (#gl.rewind) and you are locked like in a cutscene (cutLocked).
const REW={buf:[],acc:0,cd:0,on:false,t:0,dur:1.5,snap:null,hp0:0,zid:'',KIND:{human:1,drone:1,rival:1,alien:1}};
const REW_CD=20,REW_SPAN=10,REW_R=150;
const rewindOn=()=>ufoBoost()&&hasTrav('superSpeed')&&!P.alien;
function rewindRecord(dt){
  const zid=zone?zone.id:'';if(zid!==REW.zid){REW.zid=zid;REW.buf.length=0;REW.acc=0;}
  REW.acc+=dt;if(REW.acc<0.1)return;REW.acc=Math.min(REW.acc-0.1,0.1);
  const s={p:[P.pos.x,P.pos.y,P.pos.z,P.vel.x,P.vel.y,P.vel.z,P.yaw,P.hp,P.heroYaw],a:new Map()},px=P.pos.x,py=P.pos.y,pz=P.pos.z,R2=REW_R*REW_R;
  for(const a of actors){if(!REW.KIND[a.kind]||!a.alive||a.net||a.held)continue;const dx=a.pos.x-px,dy=a.pos.y-py,dz=a.pos.z-pz;if(dx*dx+dy*dy+dz*dz>R2)continue;s.a.set(a,[a.pos.x,a.pos.y,a.pos.z,1,a.hp]);}
  REW.buf.push(s);if(REW.buf.length>REW_SPAN*10+1)REW.buf.shift();
}
function rewind(){
  if(!rewindOn()||REW.on||state!=='play'||paused||P.dead)return false;
  if(!storySolo()){feed('Rewind works in solo play only','');return false;}
  if(cutLocked()||ASK||P.car)return false;
  if(REW.cd>0){feed('Rewind is recharging',Math.ceil(REW.cd)+' s left');SFX.tone('square',300,200,0.12,0.06);return false;}
  if(REW.buf.length<6){feed('Rewind','Not enough history yet · keep playing');return false;}
  stopAllPowers();webRelease(false);P.reel=null;
  REW.snap=REW.buf.slice();REW.buf.length=0;REW.acc=0;REW.on=true;REW.t=0;REW.hp0=REW.snap[0].p[7];
  REW.dur=clamp((REW.snap.length-1)*0.15,0.6,1.5);REW.cd=REW_CD;
  canvas.classList.add('rewind');SFX.tone('sine',1700,180,REW.dur,0.13);SFX.tone('triangle',900,120,REW.dur,0.06);flashWhite=Math.max(flashWhite,0.2);
  return true;
}
const rwAng=(a,b,k)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*k;
function rewindStep(dt){
  const S=REW.snap,N=S.length;REW.t+=dt;const u=clamp(REW.t/REW.dur,0,1),e=u*u*(3-2*u)*0.5+u*0.5,fi=(N-1)*(1-e),i0=Math.floor(fi),i1=Math.min(N-1,i0+1),f=fi-i0,A=S[i0],B=S[i1];
  if(P.dead){rewindEnd(false);return;}
  const a=A.p,b=B.p;P.pos.set(lerp(a[0],b[0],f),lerp(a[1],b[1],f),lerp(a[2],b[2],f));P.vel.set(0,0,0);P.yaw=rwAng(a[6],b[6],f);P.heroYaw=rwAng(a[8],b[8],f);P.grounded=false;P.web=null;P.wall=null;P.wallRun=null;
  for(const [q,r0] of A.a){const r1=B.a.get(q)||r0;
    if(!q.alive||!actors.includes(q))rewindRevive(q,r0[4]); // recorded alive at this moment: it comes back (also if it was already removed)
    q.pos.set(lerp(r0[0],r1[0],f),lerp(r0[1],r1[1],f),lerp(r0[2],r1[2],f));if(q.vel)q.vel.set(0,0,0);q.air=false;q.stun=Math.max(q.stun||0,0.3);}
  if(Math.random()<0.7){const c=center(P);emit(c.x+rr(-1.5,1.5),c.y+rr(-1,1.5),c.z+rr(-1.5,1.5),0,rr(2,8),0,0.5,[.55,.8,1],rr(0.6,1.2),0,0);}
  if(u>=1)rewindEnd(true);
}
function rewindRevive(q,hp){
  if(q.rag){const i=ragdolls.indexOf(q.rag);if(i>=0)ragdolls.splice(i,1);q.rag=null;}
  q.alive=true;q.hp=Math.max(1,hp);q.deadT=6;q.rx=0;q.tilt=0;q.tumble=0;q.downed=0;q.burn=0;q.stun=0;q.flash=0;q.hidden=false;q.air=false;
  if(!actors.includes(q)){actors.push(q);const L=q.kind==='human'?humans:q.kind==='drone'?drones:q.kind==='rival'?rivals:q.kind==='alien'?ualiens:null;if(L&&!L.includes(q))L.push(q);}
  if(q.kind==='human'&&q.state==='downed')q.state=q.role==='civilian'||q.role==='police'?'walk':'idle';
}
function rewindEnd(ok){
  const S=REW.snap;REW.on=false;REW.snap=null;REW.buf.length=0;REW.acc=0;canvas.classList.remove('rewind');if(!S||!ok)return;
  const p=S[0].p;P.pos.set(p[0],p[1],p[2]);P.vel.set(p[3],p[4],p[5]);P.yaw=p[6];P.heroYaw=p[8];P.hp=Math.min(maxHp(),Math.max(P.hp,REW.hp0));P.lastHit=-99;
  const c=center(P);ringFx(c.x,c.y,c.z,1,10,0.5,[.5,.8,1]);burst(c.x,c.y,c.z,50,14,0.8,[[.5,.8,1],[1,1,1]],1.4,0,2);flashWhite=Math.max(flashWhite,0.35);SFX.chime();
  feed('Rewound','Back 10 seconds · '+REW_CD+' s to recharge');
}
// X (or the touch button): true when the key was taken
function rewindKey(){if(!rewindOn())return false;rewind();return true;}
// ---- once per frame (storyTick) ----
function boostTick(dt){
  try{
    boostNames();reelCheck();
    if(REW.cd>0)REW.cd=Math.max(0,REW.cd-dt);
    if(REW.on){if(state==='play')rewindStep(dt);else rewindEnd(false);return;}
    if(state==='play'&&!P.dead&&rewindOn()&&storySolo())rewindRecord(dt);else if(REW.buf.length)REW.buf.length=0;
    if(canvas.classList.contains('rewind'))canvas.classList.remove('rewind');
  }catch(e){logErr(e);REW.on=false;canvas.classList.remove('rewind');}
}
