// ================================================================
// The Prism form, Destroy, and Kathana's first stage
// ================================================================
// Prism (PR): a Sun Titan whose Sun God came from V (SG.src==='v') and flies into the Sun becomes a rainbow being for 120 s or until Destroy: invincible, flying, colours
// carousel (prismLook, called by sgLook), a ring of rainbow light (prismDraw), and the hotbar holds one skill, DESTROY (key 1, a big touch button).
// Destroy: Prism form (no question), or every hero once save.story.ufo>=2 (Enter, a hotbar slot after V/Rewind, a touch button, with a yes/no popup).
// destroyStart -> kathanaBegin: enterZone('void') into a pitch-black arena where only the hero is lit (about 2.5 s, a low rumble), then the light floods in: ZONES.void,
// an endless all-white floor (local origin KAR at z=9000, soft wall of radius 500 m), Sun God for every hero with no timer (SG.src==='arena', you CAN be hurt, big
// health pool: arenaHp=6) and a cutscene where Kathana, the Seer of All, rises. Stage 1: her body can't be hurt, her four orbs (actors kind 'korb') can; she slams the
// ground (shockwave rings: jump or fly over), sweeps a gaze beam across the floor, and every orb fires slow homing bolts (actors 'kshot', any hit destroys them).
// Knocked out: back to the city (save.story.kathana stays/sets 1). All four orbs gone: kathanaStage2() (a stub for the next phase).
// For the next phase: the body is drawn from KA (position KA.bx/KA.bz, yaw, KA.by height offset, KA.vis hides her whole body, KA.split 0..1 opens the torso along a
// vertical seam with a glow inside at kCore()), the hands are KA.hands[i] (local x,y,z, dead) and orbs KA.orbs[i] ({a: the actor, dead, col}).
const PR={on:false,t:0,max:120};
const KAR={x:0,y:0,z:9000};
const KORB_COL=[[1,.04,.1],[.04,.32,1],[.04,.85,.2],[.62,.08,1]],KO_HP=12000,KA_REACH=148,KA_L1=72,KA_L2=82;
const KS=[[-40,132,0],[40,132,0],[-30,98,6],[30,98,6]],KR=[[-108,122,92],[108,122,92],[-64,74,112],[64,74,112]]; // shoulders and resting hands (local: x right, y up, z toward the player)
const KA={on:false,stage:0,phase:'',t:0,rise:0,open:0,fight:false,lost:false,vis:true,split:0,yaw:0,bx:KAR.x,bz:KAR.z-280,by:-215,ret:null,hands:[],orbs:[],shots:[],waves:[],fx:[],atk:null,cd:2.5,last:'',eyeGlow:0,gz:null,beam:null,dead:0,flood:0,src:{kind:'korb',name:'Kathana',alive:true,faction:'kathana',pos:new V3()},availSeen:null,
  hint:0,markers:[],shadow:true};
const arenaSG=()=>SG.on&&SG.src==='arena';
const godSafe=()=>PR.on||(SG.on&&SG.src!=='arena');
const kathanaDone=()=>!!save.story&&save.story.kathana>=2; // Destroy and Kathana are one-time only: once she is beaten the button is gone for every hero, the Prism form's too
const destroyAvail=()=>!!save.story&&!kathanaDone()&&(save.story.ufo===2||save.story.ufo===3||save.story.destroy===true);
const kDmg=f=>maxHp()*f/CONFIG.health.npcTaken; // damage that takes a fraction f of your (arena) health pool
const inVoid=()=>!!(zone&&zone.id==='void');
// ---- colours ----
function hue(h,s,v){h=(((h%1)+1)%1)*6;const i=Math.floor(h),f=h-i,p=v*(1-s),q=v*(1-s*f),t=v*(1-s*(1-f));switch(i){case 0:return [v,t,p];case 1:return [q,v,p];case 2:return [p,v,t];case 3:return [p,q,v];case 4:return [t,p,v];default:return [v,p,q];}}
function prismLook(m){const h=time*0.3,c=(o)=>{const r=hue(h+o,0.95,0.55);r.push(1);return r;};
  return Object.assign(SGL,m,{suit:c(0),suit2:c(0.33),cape:c(0.66),acc:[.8,.8,.8,1],metal:false,armor:false,capeOn:true});}
// ================================================================
// Prism form
// ================================================================
function prismStart(){
  if(PR.on||state!=='play'||P.dead||zone||KA.on||!storySolo())return false;
  if(SG.on)sunGodEnd(true,true); // (stay: don't push the hero out of the Sun)
  stopAllPowers();PR.on=true;PR.t=PR.max;P.flying=true;P.grounded=false;P.hp=maxHp();P.en=maxEn();P.alien&&revertAlien(true);
  const c=center(P);ringFx(c.x,c.y,c.z,1,30,0.8,[1,.5,.9]);ringFx(c.x,c.y,c.z,1,20,0.6,[.5,1,.9]);burst(c.x,c.y,c.z,140,36,1.3,[[1,.3,.5],[1,.9,.3],[.3,1,.6],[.4,.6,1],[.8,.4,1]],2.2,0,1.5);
  flashWhite=0.9;SFX.transform();SFX.chime();addShake(0.5);
  cutscene({dur:4,control:true,letterbox:true,text:'You are something else now'});
  buildHotbar();buildTouchButtons();return true;
}
function prismEnd(why){
  if(!PR.on)return;PR.on=false;
  if(why==='time'||why==='lost'){toast('The rainbow fades','Fly into the Sun again to return to it','purple');
    if(SUN_B&&P.pos.y>CEIL){const dx=P.pos.x-SUN_B.x,dy=P.pos.y-SUN_B.y,dz=P.pos.z-SUN_B.z,d=Math.hypot(dx,dy,dz);
      if(d<SUN_B.r+900){const k=(SUN_B.r+1100)/(d||1),nx=d>1e-3?dx*k:0,ny=d>1e-3?dy*k:SUN_B.r+1100,nz=d>1e-3?dz*k:0;P.pos.set(SUN_B.x+nx,SUN_B.y+ny,SUN_B.z+nz);P.vel.set(0,0,0);P.sunT=time+3;}}}
  P.flash=0;sgTint(0,0);buildHotbar();buildTouchButtons();
}
function prismTick(dt){
  if(PR.on){
    PR.t-=dt;
    if(P.dead){prismEnd('lost');return;}
    if(!KA.on||KA.phase!=='dark'){P.hp=maxHp();P.en=maxEn();P.lastSpend=time;}
    P.flash=0.16+0.06*Math.sin(time*6);
    const c=center(P);for(let i=0;i<3;i++){const h=hue(time*0.4+rr(0,1),1,1);emit(c.x+rr(-1,1),c.y+rr(-1.3,1.3),c.z+rr(-1,1),rr(-2,2),rr(1,5),rr(-2,2),rr(0.5,1),h,rr(0.7,1.5),-1,0.6);}
    let tint=0;if(SUN_B&&P.pos.y>CEIL){const d=Math.hypot(P.pos.x-SUN_B.x,P.pos.y-SUN_B.y,P.pos.z-SUN_B.z);tint=clamp((SUN_B.r+2500-d)/(2500+SUN_B.r*0.2),0,1)*0.6;}
    sgTint(0,tint);
    if(PR.t<=0&&!KA.on)prismEnd('time');
    return;
  }
  // a Sun God from V that flies into the Sun becomes the Prism Being
  if(SG.on&&SG.src==='v'&&hasTrav('solarFlight')&&SUN_B&&P.pos.y>CEIL&&!zone&&!KA.on){
    if(Math.hypot(P.pos.x-SUN_B.x,P.pos.y-SUN_B.y,P.pos.z-SUN_B.z)<SUN_B.r)prismStart();}
}
// the ring of rainbow light around the Prism Being (additive, so it is only for the dark phase and the city/space)
const KGS=primMesh(primSphere(24,16),6),KTORP=primMesh(primTorus(1,0.03,56,6),6);
function prismDraw(){
  if(!PR.on||P.dead||(state!=='play'&&state!=='menu'))return;
  const x=P.pos.x,y=P.pos.y+1.35,z=P.pos.z,t=time;
  queue(KGS,at(x,y,z,0,0,0,2.3,2.5,2.3),[...hue(t*0.3,0.8,1),0.07],F_ADD);
  for(let i=0;i<5;i++){const a=t*(0.9+i*0.17)*(i%2?1:-1),r=1.75+0.22*i,h=hue(t*0.25+i/5,1,1);
    queue(KTORP,at(x,y+Math.sin(t*1.7+i)*0.25,z,Math.sin(a)*0.9,a*0.7+i,Math.cos(a*0.9)*0.9,r,r,r),[h[0],h[1],h[2],0.7],F_ADD);}
  for(let i=0;i<10;i++){const a=t*1.6+i*TAU/10,h=hue(t*0.4+i/10,1,1),r=1.9;queue(KGS,at(x+Math.cos(a)*r,y+Math.sin(a*2+t)*0.5,z+Math.sin(a)*r,0,0,0,0.12,0.12,0.12),[h[0],h[1],h[2],0.95],F_ADD);}
}
// once per frame from storyTick (solo, playing, alive)
function kathanaTick(dt){
  prismTick(dt);superTick(dt);
  const a=destroyAvail(),sig=a+(kathanaDone()?'d':''); // the Prism skill goes with kathana>=2 too, so rebuild on that flip as well
  if(sig!==KA.availSeen){const first=KA.availSeen===null;KA.availSeen=sig;if(!SG.on&&(!PR.on||!first)){buildHotbar();buildTouchButtons();}if(a&&!first)feed('Destroy unlocked',touchOn()?'The DESTROY button':'Press Enter');}
}
// ---- the hotbar and touch button of the Prism form, and the Destroy slot ----
function prBuildHotbar(){
  if(kathanaDone())return; // the form stays, its DESTROY skill is gone
  const s=el('div',{class:'slot prism'},el('kbd',{text:touchOn()?'':'1'}),el('span',{class:'nm',text:'DESTROY'}),el('small',{text:'Prism'}));s.addEventListener('click',()=>{if(canAct())destroyStart(true);});
  hud.hotbar.appendChild(s);slotEls.push({pr:true,s});
}
function prTouchButtons(){if(kathanaDone())return;const b=tbMake('p0','a0','burst','DESTROY','B','ab prismb');b.prepend(el('i',{class:'cd',hidden:true}));}
function prDestroySlot(){
  const s=el('div',{class:'slot dz'},el('kbd',{text:touchOn()?'':'Enter'}),el('span',{class:'nm',text:'DESTROY'}),el('small',{text:'Kathana'}));s.addEventListener('click',()=>destroyKey());
  hud.hotbar.appendChild(s);slotEls.push({pr:true,s});
}
// ================================================================
// Destroy
// ================================================================
// Enter / the slot / the touch button: Prism form goes straight in; the others (UFO done) get the popup. Returns true when it took the key.
function destroyKey(){
  if(kathanaDone())return false;
  if(state!=='play'||paused||P.dead||ASK||dialOpen||cutLocked()||zone||KA.on||!storySolo())return false;
  if(PR.on){destroyStart(true);return true;}
  if(!destroyAvail())return false;
  destroyStart(false);return true;
}
function destroyStart(skipAsk){
  if(kathanaDone())return false; // safety net: she can only be fought once
  if(!storySolo()||state!=='play'||P.dead||zone||cutLocked()||ASK||ZF.phase||KA.on||P.car)return false;
  if(skipAsk){kathanaBegin();return true;}
  return askYesNo('Destroy everything?','This starts the hardest fight in the game.','Destroy','Not yet',kathanaBegin);
}
function kathanaBegin(){
  if(kathanaDone())return false;
  if(KA.on||zone||ZF.phase||state!=='play'||P.dead)return false;
  KA.on=true;KA.phase='enter';KA.lost=false;KA.stage=1;
  KA.ret=P.pos.y>CEIL?{x:-80,y:44,z:0,yaw:Math.PI/2,fly:true}:null; // from space (the Prism form's Sun) the way back is above the city
  if(!enterZone('void',{x:0,y:0,z:70,yaw:0},kathanaDark)){KA.on=false;KA.phase='';return false;}
  return true;
}
// the dark: only the hero is lit, a low rumble, then the light floods in (4.6 s, no control)
// in the arena you start in the air: Sun God flies, and the white floor is only the place the rings and the slams hit. snap = place you there now (the screen is dark), else rise to it
function kFly(y,snap){
  if(!(SG.on&&SG.src==='arena')||P.dead)return;P.flying=true;P.grounded=false;P.web=null;P.wall=null;P.charging=false;
  if(P.pos.y<y){if(snap){P.pos.y=y;P.vel.y=0;}else P.vel.y=Math.max(P.vel.y,(y-P.pos.y)*3.4+2);}
}
function kathanaDark(){
  if(!inVoid())return;KA.phase='dark';
  cutscene({dur:4.6,control:false,letterbox:true,skippable:false,onTick:kDarkTick,onEnd:kRiseStart});
  SFX.tone('sawtooth',46,24,2.6,0.2);SFX.boom(0.5,1.6);
}
function kDarkTick(k,dt,C){
  const t=C.t;if(!inVoid())return;
  if(!C.rb1&&t>1.2){C.rb1=true;SFX.boom(0.7,2.2);addShake(0.3);}
  if(!C.rb2&&t>2.0){C.rb2=true;SFX.tone('sawtooth',34,18,1.6,0.22);addShake(0.4);}
  if(!C.fl&&t>=2.6){C.fl=true;
    if(PR.on)prismEnd('destroy'); // the Prism Being's Destroy is used
    arenaHp=6;sunGodStart('arena',true);kFly(12,true);P.hp=maxHp();SFX.boom(1,2.4);SFX.chime();SFX.tone('sine',200,1400,1.2,0.14);addShake(0.6);}
  KA.flood=clamp((t-2.6)/1.6,0,1);KA.flood=KA.flood*KA.flood*(3-2*KA.flood);kLight();
  if(SG.on)P.flash=Math.max(P.flash,0.3);
}
// ---- the zone: a white floor to the horizon, no fog, soft wall of radius 500 ----
const KLD={dir:[.35,1,.4],lcol:[.95,.92,.88],sky:[.5,.5,.58],gnd:[.2,.2,.26],fogC:[0,0,0],fog:[300,1600]};
const KLW={dir:[.3,1,.45],lcol:[.78,.74,.66],sky:[.5,.52,.6],gnd:[.26,.26,.33],fogC:[2.42,2.42,2.42],fog:[1000,3200]};
const KLL={dir:[.3,1,.4],lcol:[0,0,0],sky:[0,0,0],gnd:[0,0,0],fogC:[0,0,0],fog:[300,1600]},KSKY=[0,0,0],KTINT=[0,0,0,1];
function kLight(){
  const f=KA.flood,Z=ZONES.void,m=(a,b)=>lerp(a,b,f);
  for(const k of ['dir','lcol','sky','gnd','fogC','fog']){const A=KLD[k],B=KLW[k],o=KLL[k];for(let i=0;i<o.length;i++)o[i]=m(A[i],B[i]);}
  const s=0.97*f;KSKY[0]=KSKY[1]=KSKY[2]=s;Z.sky=KSKY;Z.light=KLL;KTINT[0]=KTINT[1]=KTINT[2]=f;Z.tint=KTINT;Z.hide=f<0.002;
}
const KZ=zoneNew({id:'void',name:'The White',origin:KAR,spawn:{x:0,y:0,z:70,yaw:0},stars:false,white:true,sky:[0,0,0],bounds:{x0:-520,x1:520,z0:-520,z1:520,y1:360},light:KLL,lights:[],
  plan:[[-500,500,-500,500]],planCol:'#c9cfe0',
  build(){kBuild(KZ);},enter(){kathanaEnter();},leave(){kathanaLeave();},update(dt){kathanaUpdate(dt);},draw(){kathanaDraw();},
  mapMarks(plot,c){
    for(const o of KA.orbs){if(o.dead)continue;const q=plot(o.a.pos.x,o.a.pos.z,true);if(!q)continue;c.fillStyle='rgb('+o.col.map(v=>Math.round(v*255)).join(',')+')';c.strokeStyle='#0b0f1a';c.lineWidth=2;c.beginPath();c.arc(q[0],q[1],6,0,TAU);c.fill();c.stroke();}
    const q=plot(KA.bx,KA.bz,true);if(q){c.fillStyle='#ffc93c';c.strokeStyle='#0b0f1a';c.lineWidth=2;c.beginPath();c.moveTo(q[0],q[1]-10);c.lineTo(q[0]+9,q[1]+8);c.lineTo(q[0]-9,q[1]+8);c.closePath();c.fill();c.stroke();}
  }});
function kBuild(Z){
  zoneBox(Z,-1800,-6,-1800,1800,0,1800,[1.515,1.515,1.515],6,{col:false}); // unlit white (mat 6): the same white as the sky at the horizon
  const L=[.7,.72,.8];
  for(let v=-1000;v<=1000;v+=50){zoneBox(Z,v-0.35,0,-1000,v+0.35,0.3,1000,L,6,{col:false});zoneBox(Z,-1000,0,v-0.35,1000,0.3,v+0.35,L,6,{col:false});}
  zoneBake(Z);
}
function kathanaEnter(){
  KA.t=0;KA.rise=0;KA.open=0;KA.fight=false;KA.vis=true;KA.split=0;KA.dead=0;KA.flood=0;KA.atk=null;KA.cd=2.5;KA.last='';KA.eyeGlow=0;KA.beam=null;KA.yaw=0;KA.by=-215;KA.stage=1;KA.shots.length=0;KA.waves.length=0;KA.fx.length=0;KA.sink=0;KA.gone=false;KA.scream=0;KA.jit=0;KA.cracks=[];pfClear();
  KA.bx=KAR.x;KA.bz=KAR.z-280;
  kHandsInit();kLight();
}
function kathanaLeave(){
  pfClear();KA.cracks=[];KA.gone=false;KA.sink=0;KA.split=0;KA.scream=0;KA.jit=0;
  for(const o of KA.orbs)if(o.a)removeActor(o.a);KA.orbs.length=0;kClearShots();
  if(SG.on&&SG.src==='arena')sunGodEnd(true);
  if(PR.on)prismEnd('lost');
  arenaHp=1;P.hp=Math.min(P.hp,maxHp());lockT=null;
  KA.on=false;KA.fight=false;KA.phase='';KA.atk=null;KA.beam=null;objective(null);objectiveMark(null);
  const f=$('fade');if(f&&!ZF.phase)f.style.opacity='0';
}
// Kathana rises (7.5 s cutscene), then the fight starts
function kRiseStart(){
  if(!inVoid())return;KA.phase='rise';
  const S=save.story;if(S.kathana<1){S.kathana=1;persist();}
  if(S.kp===1&&S.kathana<2){pfRetryStart();return;} // a retry starts at the Perfect Form: no orbs to redo
  const o=KAR;kOrbsMake();
  cutscene({dur:7.6,control:false,letterbox:true,skippable:true,fov:76,text:'KATHANA, THE SEER OF ALL',
    from:{x:o.x-20,y:6,z:o.z+105},to:{x:o.x-70,y:46,z:o.z-70},look:k=>({x:o.x,y:22+135*k*k*(3-2*k),z:KA.bz+10}),
    onTick:(k,dt,C)=>{const r=clamp(k/0.82,0,1);KA.rise=r*r*(3-2*r);KA.open=clamp((k-0.72)/0.22,0,1);
      if(k<0.85&&Math.random()<dt*14)smoke(KA.bx+rr(-60,60),2,KA.bz+rr(-50,50),1,8,16,4,0.7);
      if(!C.sh&&k>0.04){C.sh=true;SFX.tone('sawtooth',40,22,3.2,0.24);}
      if(KA.rise<0.85)addShake(0.05);if(!C.sh2&&k>0.7){C.sh2=true;SFX.boom(1,2.6);SFX.tone('sine',90,400,1.6,0.12);addShake(0.7);}},
    onEnd:kFightStart});
}
function kOrbsMake(){
  for(const o of KA.orbs)if(o.a)removeActor(o.a);KA.orbs.length=0;
  for(let i=0;i<4;i++){const a={kind:'korb',faction:'kathana',zid:'void',name:'Orb',alive:true,hp:KO_HP,maxHp:KO_HP,pos:new V3(),vel:new V3(),yaw:0,heroYaw:0,flash:0,stun:0,slow:0,slowT:0,burn:0,burnDps:0,held:false,thrown:null,cy:0,radius:11,ys:1,lastHit:-99,grudge:null,grudgeT:-99,idx:i,bigBoss:true};
    a.onDefeat=()=>korbBreak(i);actors.push(a);KA.orbs.push({a,col:KORB_COL[i],dead:false,i,r:11});}
  KA.dead=0;kSyncOrbs();
}
function kFightStart(){
  if(!inVoid())return;KA.phase='fight';KA.rise=1;KA.open=1;
  for(const h of KA.hands){h.x=h.rx;h.y=h.ry;h.z=h.rz;}
  if(KA.orbs.length!==4)kOrbsMake();kSyncOrbs();
  KA.fight=true;KA.atk=null;KA.cd=2.2;kFly(12);
  objective('Shatter the four orbs · 4 left');
  toast('Kathana, the Seer of All','Her body cannot be hurt. Shatter the four orbs · '+(touchOn()?'Attack':'Click')+' fires the Solar Lance','red');
  later(1.3,()=>{if(KA.fight&&inVoid())toast('Lock onto the orbs',touchOn()?'Tap the Lock button, tap again for the next orb':'Press Z (or the Lock button) to lock on, Z again for the next orb','gold');});
}
// the boss bar (99_main.js updateHud): the four orbs' health together. true = I drew it
function kathanaBar(){
  if(pfBar())return true;
  if(!(KA.on&&KA.fight&&inVoid()))return false;
  hud.bossbar.hidden=false;setText(hud.bossname,'bn','KATHANA, THE SEER OF ALL');setW(hud.bossb,'boss',kHpFrac());return true;
}
function kHpFrac(){let h=0;for(const o of KA.orbs)if(!o.dead)h+=Math.max(0,o.a.hp);return h/(4*KO_HP);}
// ---- lock-on: Z steps from orb to orb in the arena ----
function kathanaPickAny(){
  if(inVoid()&&PF.fight)return pfPickLock(null);
  if(!inVoid()||!KA.fight)return null;let best=null,bd=1e9;
  for(const o of KA.orbs){if(o.dead||!o.a.alive)continue;const d=Math.hypot(o.a.pos.x-P.pos.x,o.a.pos.z-P.pos.z);if(d<bd){bd=d;best=o.a;}}return best;
}
function kathanaNextLock(cur){
  if(inVoid()&&cur&&cur.kind==='kperfect')return pfPickLock(cur);
  if(!inVoid()||!cur||cur.kind!=='korb')return null;
  const l=KA.orbs.filter(o=>!o.dead&&o.a.alive).map(o=>o.a),i=l.indexOf(cur);return i>=0&&i+1<l.length?l[i+1]:null;
}
// ================================================================
// Losing, winning
// ================================================================
Bus.on('playerDefeated',()=>{if(KA.on&&inVoid()&&!KA.lost)kathanaLose();});
function kathanaLose(){
  KA.lost=true;KA.fight=false;KA.atk=null;KA.beam=null;kClearShots();
  P.dead=false;$('dead').hidden=true;P.hp=maxHp();P.vel.set(0,0,0);lockT=null;
  const S=save.story;if(S.kathana<1){S.kathana=1;persist();}
  if(KA.stage===2&&S.kathana<2){S.kp=1;persist();} // knocked out at the Perfect Form: the retry starts there
  pfStop();
  if(!leaveZone(KA.ret,()=>toast('Kathana casts you out','Destroy again when ready.','red'))){KA.lost=false;zoneAbort();}
}
function korbBreak(i){
  const o=KA.orbs[i];if(!o||o.dead)return;o.dead=true;KA.dead++;const a=o.a,x=a.pos.x,y=a.pos.y,z=a.pos.z,c=o.col;
  for(let k=0;k<26;k++){const s=rr(0.9,2.6);spawnPiece(x+rr(-5,5),y+rr(-5,5),z+rr(-5,5),MESH.box,s,s*0.8,s*1.2,[c[0]*0.9+0.1,c[1]*0.9+0.1,c[2]*0.9+0.1],rr(-24,24),rr(4,26),rr(-24,24),9);}
  smoke(x,y,z,10,8,14,3,0.2);KA.fx.push({x,y,z,t:0,dur:1.1,r0:8,r1:90,col:c},{x,y,z,t:0,dur:0.7,r0:4,r1:50,col:[1,1,1]});
  SFX.boom(1,2.4);SFX.chime();addShake(1.1);toast(KA.dead+'/4 orbs shattered',KA.dead<4?'Kathana grows desperate':'','gold');
  for(const s of KA.shots)if(s.orb===i)kShotKill(s);
  objective(KA.dead<4?'Shatter Kathana\'s four orbs · '+(4-KA.dead)+' left':null);
  if(lockT===a){lockT=null;if(KA.dead<4)lockT=kathanaPickAny();if(lockT)SFX.tone('sine',500,900,0.08,0.05);} // the lock moves on to the nearest orb left
  if(KA.dead>=4){KA.fight=false;KA.atk=null;KA.beam=null;kClearShots();later(1.8,()=>{if(KA.on&&inVoid()&&!KA.lost)kathanaStage2();});}
}
// kathanaStage2() (the scream, the split, the Perfect Form) is in 66g_kperfect.js
// test hook: every orb gone at once
function kathanaWinStage1(){for(const o of KA.orbs){if(o.dead)continue;o.a.hp=0;o.a.alive=false;korbBreak(o.i);}}
// ================================================================
// The fight
// ================================================================
function kHandsInit(){
  KA.hands.length=0;
  for(let i=0;i<4;i++){const r=KR[i];KA.hands.push({i,x:r[0],y:r[1]-90,z:r[2],rx:r[0],ry:r[1],rz:r[2],s:KS[i],side:i%2?1:-1,ph:i*1.9,busy:false,k:2.2,tx:r[0],ty:r[1],tz:r[2],dead:false,slam:0});}
}
// world <-> local (Kathana's frame: y is up, +z faces the way she looks)
function kwa(x,y,z){const s=Math.sin(KA.yaw),c=Math.cos(KA.yaw);return [KA.bx+x*c+z*s,KA.by+y,KA.bz-x*s+z*c];}
function kla(wx,wz){const s=Math.sin(KA.yaw),c=Math.cos(KA.yaw),dx=wx-KA.bx,dz=wz-KA.bz;return [dx*c-dz*s,dx*s+dz*c];}
function kReach(h,x,y,z){const S=h.s,dx=x-S[0],dy=y-S[1],dz=z-S[2],L=Math.hypot(dx,dy,dz)||1;if(L<=KA_REACH)return [x,y,z];const k=KA_REACH/L;return [S[0]+dx*k,S[1]+dy*k,S[2]+dz*k];}
function kElbow(S,H,side){
  const dx=H[0]-S[0],dy=H[1]-S[1],dz=H[2]-S[2],D=Math.min(Math.hypot(dx,dy,dz)||1,KA_L1+KA_L2-1),ux=dx/(Math.hypot(dx,dy,dz)||1),uy=dy/(Math.hypot(dx,dy,dz)||1),uz=dz/(Math.hypot(dx,dy,dz)||1);
  const a=(KA_L1*KA_L1-KA_L2*KA_L2+D*D)/(2*D),h=Math.sqrt(Math.max(0,KA_L1*KA_L1-a*a));
  let px=side*0.9,py=-0.5,pz=-0.6;const dp=px*ux+py*uy+pz*uz;px-=dp*ux;py-=dp*uy;pz-=dp*uz;const pl=Math.hypot(px,py,pz)||1;
  return [S[0]+ux*a+px/pl*h,S[1]+uy*a+py/pl*h,S[2]+uz*a+pz/pl*h];
}
const kEase=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
function kCore(){return kwa(0,114,8);} // where the heart is (the next phase's being appears here)
function kathanaUpdate(dt){
  KA.t+=dt;const d=KA.dead,I=1+0.28*d;
  // she turns to face you and drifts closer when you keep away
  const px=P.pos.x,pz=P.pos.z,dxp=px-KA.bx,dzp=pz-KA.bz,dist=Math.hypot(dxp,dzp);
  if(KA.rise>=1||KA.phase==='fight'){KA.yaw=angLerp(KA.yaw,Math.atan2(dxp,dzp),damp(0.8,dt));
    if(dist>230&&KA.fight){const sp=Math.min(10,(dist-230)*0.5)*dt;KA.bx+=dxp/dist*sp;KA.bz+=dzp/dist*sp;}}
  else KA.yaw=angLerp(KA.yaw,Math.atan2(dxp,dzp),damp(1.2,dt));
  KA.by=-215*(1-KA.rise)+Math.sin(KA.t*0.5)*1.4*KA.rise-KA.sink*290+(KA.jit?Math.sin(KA.t*73)*KA.jit:0);
  KA.src.pos.set(KA.bx,60,KA.bz);
  // arms: slow drift, or what the attack asks for
  const hs=KA.hands;
  for(const h of hs){
    let wx=h.rx+Math.sin(KA.t*0.37+h.ph)*13*I,wy=h.ry+Math.sin(KA.t*0.51+h.ph*1.7)*9*I,wz=h.rz+Math.sin(KA.t*0.29+h.ph*0.6)*13*I,k=1.6;
    if(h.dead){wy=h.ry-26+Math.sin(KA.t*0.4+h.ph)*4;wx=h.rx*0.92;wz=h.rz*0.9;k=0.9;}
    if(KA.rise<1)wy-=60*(1-KA.rise);
    if(h.busy){wx=h.tx;wy=h.ty;wz=h.tz;k=h.k;}
    const r=kReach(h,wx,wy,wz);h.x+=(r[0]-h.x)*damp(k,dt);h.y+=(r[1]-h.y)*damp(k,dt);h.z+=(r[2]-h.z)*damp(k,dt);
  }
  kSyncOrbs();
  if(KA.fight&&!P.dead&&!KA.lost)kAttacks(dt);
  kWaves(dt);kShots(dt);if(KA.lost)KA.beam=null;
  for(let i=KA.fx.length-1;i>=0;i--){const f=KA.fx[i];f.t+=dt;if(f.t>=f.dur)KA.fx.splice(i,1);}
  KA.eyeGlow=KA.atk&&KA.atk.type==='gaze'?KA.atk.glow:Math.max(KA.scream||0,KA.eyeGlow-dt*1.5);
  pfUpdate(dt);
  if(SG.on&&SG.src==='arena'&&!P.dead){ // a hit that throws you out of the air puts you back in it once you have landed on your feet (F still lands you for good)
    if(P.flungT!==KA.fl0){KA.fl0=P.flungT;KA.reFly=!!KA.wf;}if(P.flying)KA.reFly=false;
    else if(KA.reFly&&!P.rag&&!KQ.on&&time-P.flungT>0.8){KA.reFly=false;kFly(12);}KA.wf=P.flying;}
  // the arena's wall (a soft push, then a hard stop) and her body (you can't stand inside her)
  if(!P.dead){const ox=P.pos.x-KAR.x,oz=P.pos.z-KAR.z,r=Math.hypot(ox,oz);
    if(r>455){const push=(r-455)*1.6*dt;P.vel.x-=ox/r*push*30;P.vel.z-=oz/r*push*30;if(r>498){P.pos.x=KAR.x+ox/r*498;P.pos.z=KAR.z+oz/r*498;}}
    const bx=P.pos.x-KA.bx,bz=P.pos.z-KA.bz,br=Math.hypot(bx,bz);if(br<48&&P.pos.y<92&&KA.rise>0.5&&!KA.gone&&KA.sink<0.3){P.pos.x=KA.bx+bx/(br||1)*48;P.pos.z=KA.bz+bz/(br||1)*48;}}
}
function kSyncOrbs(){
  for(const o of KA.orbs){if(o.dead)continue;const h=KA.hands[o.i],w=kwa(h.x,h.y+17,h.z);o.a.pos.set(w[0],w[1],w[2]);o.a.vel.set(0,0,0);o.a.held=false;o.a.stun=0;o.a.alive=o.a.hp>0;o.a.radius=11*(0.72+0.28*clamp(o.a.hp/KO_HP,0,1));}
}
// ---- the three attacks: hand slam, gaze, orb barrage ----
function kAttacks(dt){
  const d=KA.dead;
  if(!KA.atk){KA.cd-=dt;if(KA.cd<=0)kPick();}
  const A=KA.atk;if(!A)return;A.t+=dt;
  if(A.type==='slam'){
    for(const S of A.s){
      const h=KA.hands[S.h];S.t+=dt;
      if(S.ph===0){ // the hand rises over you; the mark on the floor follows you, then holds
        if(S.t<0.95){const lead=0.35;S.x=P.pos.x+P.vel.x*lead;S.z=P.pos.z+P.vel.z*lead;}
        const l=kla(S.x,S.z),r=kReach(h,l[0],150,l[1]);h.busy=true;h.tx=r[0];h.ty=r[1];h.tz=r[2];h.k=3.2;
        const m=kReach(h,l[0],6,l[1]),wm=kwa(m[0],0,m[2]);S.mx=wm[0];S.mz=wm[2];
        if(S.t>=1.45){S.ph=1;S.t=0;const q=kReach(h,l[0],5,l[1]);h.tx=q[0];h.ty=q[1];h.tz=q[2];h.k=26;}
      }else if(S.ph===1){
        const w=kwa(h.x,h.y,h.z);
        if(h.y<14||S.t>0.45){S.ph=2;S.t=0;kImpact(w[0],w[2],d);}
      }else if(S.ph===2){if(S.t>0.9){S.ph=3;h.busy=false;}}
    }
    if(A.s.every(S=>S.ph===3)){KA.atk=null;KA.cd=Math.max(1.2,3-0.45*d);}
  }else if(A.type==='gaze'){
    if(A.ph===0){A.glow=Math.min(1,A.t/1.6);const lx=A.gx=P.pos.x,lz=A.gz=P.pos.z;if(A.t>=1.6){A.ph=1;A.t=0;A.fx=lx;A.fz=lz;const hx=KA.bx-lx,hz=KA.bz-lz,l=Math.hypot(hx,hz)||1;A.px=-hz/l;A.pz=hx/l;A.sw=80+14*d;A.dur=2.5-0.25*d;SFX.tone('sawtooth',90,500,A.dur,0.2);SFX.boom(0.8,1.4);addShake(0.4);}}
    else if(A.ph===1){
      A.glow=1;const u=clamp(A.t/A.dur,0,1),dir=A.rev?1-u:u,off=-A.sw+2*A.sw*dir,tx=A.fx+A.px*off,tz=A.fz+A.pz*off,hd=kwa(0,172,24);
      KA.beam={ax:hd[0],ay:hd[1],az:hd[2],bx:tx,bz:tz};
      // the player is hit when close to the beam (a segment from the head to the floor)
      const c=center(P),abx=tx-hd[0],aby=-hd[1],abz=tz-hd[2],L2=abx*abx+aby*aby+abz*abz,k=clamp(((c.x-hd[0])*abx+(c.y-hd[1])*aby+(c.z-hd[2])*abz)/L2,0,1),qx=hd[0]+abx*k,qy=hd[1]+aby*k,qz=hd[2]+abz*k;
      if(Math.hypot(c.x-qx,c.y-qy,c.z-qz)<6&&time-(A.hitT||-9)>0.18){A.hitT=time;Damage.apply(KA.src,P,kDmg(0.022),'fire',{knock:6});}
      if(Math.random()<dt*40)smoke(tx,1,tz,1,3,7,1.2,0.35);
      if(Math.random()<dt*30)KA.fx.push({x:tx+rr(-3,3),y:0.4,z:tz+rr(-3,3),t:0,dur:2.2,r0:4,r1:3,col:[.25,.2,.2],flat:true});
      if(A.t>=A.dur){if(d>=3&&!A.rev){A.rev=true;A.t=0;}else{A.ph=2;A.t=0;KA.beam=null;}}
    }else{A.glow=Math.max(0,1-A.t/0.8);if(A.t>=0.8){KA.atk=null;KA.cd=Math.max(1.2,3.2-0.45*d);}}
  }else if(A.type==='barrage'){
    A.n-=dt;if(A.n<=0&&A.round<A.rounds){A.n=0.55;A.round++;let first=true;
      for(const o of KA.orbs){if(o.dead||o.a.hp<=0)continue;kShot(o,first?0:rr(-1,1));first=false;}SFX.tone('square',300,900,0.18,0.08);}
    if(A.round>=A.rounds&&A.t>A.rounds*0.55+0.8){KA.atk=null;KA.cd=Math.max(1.3,3.2-0.45*d);}
  }
}
function kPick(){
  const d=KA.dead,alive=KA.orbs.filter(o=>!o.dead).length,pool=[['slam',40],['gaze',30],['barrage',alive?30:0]].filter(p=>p[0]!==KA.last);let tot=0;for(const p of pool)tot+=p[1];let r=Math.random()*tot,type=pool[0][0];
  for(const p of pool){r-=p[1];if(r<=0){type=p[0];break;}}
  KA.last=type;
  if(type==='slam'){const free=KA.hands.filter(h=>!h.busy),n=Math.min(free.length,d>=2?2:1),s=[];
    for(let i=0;i<n;i++){const j=(Math.random()*free.length)|0,h=free.splice(j,1)[0];s.push({h:h.i,ph:0,t:-i*0.35,x:P.pos.x,z:P.pos.z,mx:0,mz:0});}
    KA.atk={type,t:0,s};}
  else if(type==='gaze'){KA.atk={type,t:0,ph:0,glow:0};SFX.tone('sine',300,900,1.5,0.1);}
  else{KA.atk={type,t:0,n:0,round:0,rounds:Math.min(6,3+d)};}
}
function kImpact(x,z,d){
  KA.waves.push({x,z,r:8,spd:80+8*d,max:200,hit:false});KA.fx.push({x,y:0.5,z,t:0,dur:0.7,r0:6,r1:40,col:[1,.6,.2]});
  smoke(x,2,z,14,10,16,3,0.3);SFX.boom(1,1.8);addShake(0.9);flashWhite=Math.max(flashWhite,0.0);
  for(let k=0;k<12;k++){const a=rr(0,TAU),s=rr(14,30),w=rr(1,3.4);spawnPiece(x+Math.cos(a)*8,1,z+Math.sin(a)*8,MESH.box,w,w*0.7,w*1.2,[.75,.71,.64],Math.cos(a)*s,rr(10,26),Math.sin(a)*s,7);}
}
function kWaves(dt){
  for(let i=KA.waves.length-1;i>=0;i--){const w=KA.waves[i];if(!w)continue;w.r+=w.spd*dt;
    if(!w.hit&&!P.dead){const dd=Math.hypot(P.pos.x-w.x,P.pos.z-w.z);
      if(Math.abs(dd-w.r)<5&&P.pos.y<9){w.hit=true;const l=dd||1,nx=(P.pos.x-w.x)/l,nz=(P.pos.z-w.z)/l;Damage.apply(KA.src,P,kDmg(0.1),'blast',{knock:22});P.vel.x+=nx*18;P.vel.z+=nz*18;}}
    if(w.r>w.max)KA.waves.splice(i,1);}
}
// ---- orb bolts: slow, homing, any hit destroys them ----
function kShot(o,spread){
  if(KA.shots.length>=26)return;const a0=o.a,sp=26+2*KA.dead;
  const a={kind:'kshot',faction:'kathana',zid:'void',name:'Orb bolt',alive:true,hp:1,maxHp:1,pos:new V3(a0.pos.x,a0.pos.y,a0.pos.z),vel:new V3(),yaw:0,heroYaw:0,flash:0,stun:0,slow:0,slowT:0,burn:0,burnDps:0,held:false,thrown:null,cy:0,radius:2.4,ys:1,lastHit:-99,grudge:null,grudgeT:-99,orb:o.i,life:9,deadT:0,col:o.col};
  const dx=P.pos.x-a.pos.x,dy=P.pos.y+1.3-a.pos.y,dz=P.pos.z-a.pos.z,l=Math.hypot(dx,dy,dz)||1;a.vel.set(dx/l*sp+spread*14,dy/l*sp+rr(2,10),dz/l*sp+spread*14);a.sp=sp;
  a.onDefeat=()=>kShotBurst(a);actors.push(a);KA.shots.push(a);
}
function kShotBurst(a){
  const c=a.col;for(let k=0;k<5;k++){const s=rr(0.4,1);spawnPiece(a.pos.x,a.pos.y,a.pos.z,MESH.box,s,s,s,c,rr(-12,12),rr(2,12),rr(-12,12),3);}
  smoke(a.pos.x,a.pos.y,a.pos.z,3,1.5,5,1.5,0.35);SFX.tone('triangle',700,200,0.18,0.07*SFX.vol(a.pos.x,a.pos.y,a.pos.z));
}
function kShotKill(a){if(a.alive){a.alive=false;a.hp=0;kShotBurst(a);}}
function kShots(dt){
  for(let i=KA.shots.length-1;i>=0;i--){const a=KA.shots[i];if(!a)continue; // (a hit that knocks you out clears the list while we loop)
    if(!a.alive){a.deadT+=dt;if(a.deadT>0.05){removeActor(a);KA.shots.splice(i,1);}continue;}
    a.life-=dt;
    if(!P.dead){const dx=P.pos.x-a.pos.x,dy=P.pos.y+1.3-a.pos.y,dz=P.pos.z-a.pos.z,l=Math.hypot(dx,dy,dz)||1,k=damp(1.25,dt),sp=a.sp;
      a.vel.x+=(dx/l*sp-a.vel.x)*k;a.vel.y+=(dy/l*sp-a.vel.y)*k;a.vel.z+=(dz/l*sp-a.vel.z)*k;
      if(l<3.2){a.alive=false;a.hp=0;kShotBurst(a);Damage.apply(KA.src,P,kDmg(0.045),'blast',{knock:12});continue;}}
    a.pos.addS(a.vel,dt);if(a.pos.y<1.2){a.pos.y=1.2;a.vel.y=Math.abs(a.vel.y)*0.3;}
    if(a.life<=0)kShotKill(a);}
}
function kClearShots(){for(const a of KA.shots)removeActor(a);KA.shots.length=0;KA.waves.length=0;KA.beam=null;}
// ================================================================
// Drawing: Kathana, the markers, the shadows
// ================================================================
const KST=[.58,.54,.47,1],KST2=[.4,.37,.34,1],KDK=[.05,.04,.08,1],KGD=[1,.74,.22,1],KGD2=[.85,.55,.14,1],KTOR=primMesh(primTorus(1,0.07,72,8),6);
function kb(x,y,z,sx,sy,sz,col,ry,mesh){const w=kwa(x,y,z);queue(mesh||MESH.box,at(w[0],w[1],w[2],0,KA.yaw+(ry||0),0,sx,sy,sz),col,0);}
function kc(x,y,z,rx,h,rz,col){const w=kwa(x,y,z);queue(MESH.cyl,at(w[0],w[1],w[2],0,KA.yaw,0,rx,h,rz),col,0);}
function ks(x,y,z,rx,ry,rz,col,mesh){const w=kwa(x,y,z);queue(mesh||MESH.sphere,at(w[0],w[1],w[2],0,KA.yaw,0,rx,ry,rz),col,0);}
function kbeam(a,b,w,col,mesh,fl){queue(mesh||MESH.box,M4.beam(tmpM(),a[0],a[1],a[2],b[0],b[1],b[2],w),col,fl||0);}
function kathanaDraw(){
  const Z=ZONES.void,t=time;
  if(KA.gone){}else if(KA.split>0.004)kSplitDraw(t);else{if(KA.vis&&KA.rise>0.001)kBody(t);if(KA.rise>0.001)kHandsDraw(t);}
  kCracksDraw();pfDraw(t);
  if(KA.eyeGlow>0.02&&KA.vis&&!KA.gone&&KA.split<0.004){const g=KA.eyeGlow,w=kwa(0,176,28),r=2+13*g;queue(MESH.glowSphere,at(w[0],w[1],w[2],0,0,0,r,r,r),[1,.35,.1,1],0);queue(KGS,at(w[0],w[1],w[2],0,0,0,r*2.4,r*2.4,r*2.4),[1,.5,.15,0.3],F_BL);} // the gaze charging
  kMarkers(t);
  // soft shadows (blobs on the floor): under you, under her, under her hands
  if(KA.flood>0.4){
    const sh=(x,z,r,a)=>queue(MESH.disc,at(x,0.12,z,0,0,0,r,1,r),[0.05,0.05,0.12,a*KA.flood],F_BL);
    {const h=Math.max(0,P.pos.y),r=1.3+h*0.04;sh(P.pos.x,P.pos.z,r,Math.max(0.1,0.32-h*0.004));}
    if(KA.vis&&KA.rise>0.5&&!KA.gone){sh(KA.bx,KA.bz,62*(1-KA.sink),0.26*(1-KA.sink));for(const hd of KA.hands){const w=kwa(hd.x,hd.y,hd.z),h=Math.max(0,w[1]),r=16+h*0.05;sh(w[0],w[2],r,Math.max(0.07,0.24-h*0.0016));}}
    for(const s of KA.shots)if(s.alive)sh(s.pos.x,s.pos.z,2.4,0.2);
  }
  // shockwaves: a low orange ring on the floor, tall enough that you must jump or fly over it
  for(const w of KA.waves){const f=clamp(1-w.r/w.max,0,1);queue(KTOR,at(w.x,3.2,w.z,0,0,0,w.r,0.6,w.r),[1,.4,.08,1],0);queue(KTOR,at(w.x,3.6,w.z,0,0,0,w.r*0.99,0.3,w.r*0.99),[1,.85,.4,1],0);queue(KTOR,at(w.x,3.2,w.z,0,0,0,w.r*0.97,1.1,w.r*0.97),[1,.5,.1,0.25*f],F_BL);}
  // the gaze beam
  if(KA.beam){const B=KA.beam,a=[B.ax,B.ay,B.az],b=[B.bx,0.3,B.bz],pu=1+Math.sin(t*50)*0.1;
    kbeam(a,b,2.2*pu,[1,.25,.1,1],MESH.glowBox);kbeam(a,b,5.5*pu,[1,.7,.2,0.55],MESH.glowBox,F_BL);kbeam(a,b,10*pu,[1,.5,.15,0.2],MESH.glowBox,F_BL);
    queue(MESH.glowSphere,at(B.bx,1,B.bz,0,0,0,8*pu,3,8*pu),[1,.55,.15,0.7],F_BL);}
  // effects: expanding colour spheres (orbs shattering, shockwave flashes) and the burnt trail of the beam
  for(const f of KA.fx){const k=f.t/f.dur,r=lerp(f.r0,f.r1,f.flat?k:Math.sqrt(k));
    if(f.flat)queue(MESH.disc,at(f.x,0.16,f.z,0,0,0,r,1,r),[f.col[0],f.col[1],f.col[2],0.35*(1-k)],F_BL);
    else queue(MESH.glowSphere,at(f.x,f.y,f.z,0,0,0,r,r,r),[f.col[0],f.col[1],f.col[2],0.5*(1-k)],F_BL);}
  // bolts
  for(const s of KA.shots){if(!s.alive)continue;const c=s.col,p=1+Math.sin(t*14+s.orb)*0.12,r=2.1*p;
    queue(MESH.glowSphere,at(s.pos.x,s.pos.y,s.pos.z,0,0,0,r,r,r),[c[0],c[1],c[2],1],0);queue(MESH.glowSphere,at(s.pos.x,s.pos.y,s.pos.z,0,0,0,r*1.7,r*1.7,r*1.7),[c[0],c[1],c[2],0.3],F_BL);
    queue(MESH.sphere,at(s.pos.x,s.pos.y,s.pos.z,0,0,0,r*0.5,r*0.5,r*0.5),[1,1,1,1],0);}
}
// the floor marks of the attacks
function kMarkers(t){
  const A=KA.atk;if(!A)return;
  if(A.type==='slam')for(const S of A.s){if(S.ph>1||S.t<0)continue;const lock=S.ph===1||S.t>0.95,f=lock?(0.5+0.5*Math.sin(t*28)):0.6,r=16;
    queue(MESH.ring,at(S.mx,0.2,S.mz,0,0,0,r,1,r),[1,.2,.1,0.5+0.4*f],F_BL);queue(MESH.disc,at(S.mx,0.18,S.mz,0,0,0,r,1,r),[1,.25,.1,0.18+0.14*f],F_BL);
    queue(MESH.ring,at(S.mx,0.22,S.mz,0,0,0,r*1.6,1,r*1.6),[1,.4,.1,0.25],F_BL);queue(MESH.glowCyl,at(S.mx,45,S.mz,0,0,0,r*0.85,90,r*0.85),[1,.25,.1,0.07+0.1*f],F_BL);}
  if(A.type==='gaze'&&A.ph===0){const hd=kwa(0,172,24),l=Math.hypot(A.gx-hd[0],A.gz-hd[2])||1,mx=(A.gx+hd[0])/2,mz=(A.gz+hd[2])/2,ang=Math.atan2(A.gx-hd[0],A.gz-hd[2]);
    queue(MESH.box,at(mx,0.2,mz,0,ang,0,3+9*A.glow,0.05,l),[1,.2,.1,0.12+0.3*A.glow],F_BL);
    queue(MESH.ring,at(A.gx,0.22,A.gz,0,0,0,7,1,7),[1,.25,.1,0.4+0.4*A.glow],F_BL);}
  if(A.type==='gaze'&&A.ph===1){const hd=kwa(0,172,24);for(const sgn of [-1,1]){const off=sgn*A.sw,tx=A.fx+A.px*off,tz=A.fz+A.pz*off;queue(MESH.ring,at(tx,0.2,tz,0,0,0,5,1,5),[1,.3,.1,0.3],F_BL);}}
}
// ---- the body ----
const KIN=[.06,.04,.14,1],KIN2=[.03,.02,.08,1];
function kbz(x,y,z,sx,sy,sz,col,rz){const w=kwa(x,y,z);queue(MESH.box,at(w[0],w[1],w[2],0,KA.yaw,rz||0,sx,sy,sz),col,0);}
function kBody(t){
  const e=KA.open,g=KA.eyeGlow,sp=0; // (the split is drawn by kSplitDraw)
  // the robe: six ink-dark tiers with gold bands, a bone panel down the front
  for(let k=0;k<6;k++){const r=54-k*3.6,y=6+k*14;kc(0,y,0,r,14.2,r,k%2?KIN2:KIN);kc(0,y+7.2,0,r+0.9,1.8,r+0.9,KGD);}
  kb(0,44,53,22,84,3,KST);kb(0,44,54.8,2.6,80,1,KGD);kb(-8,44,54.8,1.2,80,1,KGD2);kb(8,44,54.8,1.2,80,1,KGD2);
  for(let k=0;k<12;k++){const a=k*TAU/12+0.2;kb(Math.sin(a)*52,16,Math.cos(a)*52,3.4,22,3.4,KGD,a);}
  // the torso: two halves that can part along the middle (KA.split) around a glowing core
  const so=sp*26,sy=sp*0.5;
  for(const sd of [-1,1]){
    const ox=sd*(17.5+so),w=kwa(ox,112,0);queue(MESH.box,at(w[0],w[1],w[2],0,KA.yaw+sd*sy,0,34,60,40),KST,0);
    kb(ox+sd*sp*0.6,112,20.6,30,50,1.4,KIN,sd*sy);
    for(const yy of [128,116,104,92])kb(ox+sd*sp*0.6,yy,21.4,31,2.4,1,KGD,sd*sy);
    kb(ox,112,-20.5,33,52,1,KIN2,sd*sy);
  }
  if(sp>0.01){kb(0,112,0,10+so*1.5,56,34,[1,.78,.3,1],0,MESH.glowBox);ks(0,112,6,18+so*0.6,24,14,[1,.9,.55,1],MESH.glowSphere);}
  else{ // the chest sigil: two gold rings round a dark eye with a glowing pupil
    const w=kwa(0,112,22.4);queue(KTOR,at(w[0],w[1],w[2],Math.PI/2,KA.yaw,0,15,15,15),KGD,0);queue(KTOR,at(w[0],w[1],w[2],Math.PI/2,KA.yaw,0,8.5,8.5,8.5),KGD,0);
    ks(0,112,22,6,10,1.6,KDK);ks(0,112,23,2.2,4.4,0.9,[1,.85,.4,1],MESH.glowSphere);}
  // shoulders (bone, gold collars, gold spikes) and neck
  for(const sd of [-1,1]){ks(sd*43,134,0,18,16,18,KST2);kc(sd*43,148,0,14,4,14,KGD);ks(sd*43,143,0,13,9,13,KST);
    for(let k=0;k<3;k++){const w=kwa(sd*(48+k*7),140+k*6,0),w2=kwa(sd*(58+k*14),160+k*11,0);kbeam(w,w2,5-k,KGD,MESH.box);}}
  kc(0,148,0,10,16,10,KIN2);kb(0,142,0,40,6,34,KGD2);
  // the head: a tall bone mask with a black vertical mouth and many eyes
  ks(0,174,0,17,32,16,KST);kb(0,204,1,24,4,20,KST2);
  kb(0,153,14.4,7.4,30,3,KDK);kb(0,153,15.9,3.2,27,1.4,[1,.2,.1,1],0,MESH.glowBox);
  for(let k=0;k<5;k++){kb(-4.8,142+k*6,15.8,1.6,2.6,1.6,KGD);kb(4.8,142+k*6,15.8,1.6,2.6,1.6,KGD);}
  const eye=(x,y,z,r,o)=>{const oo=Math.max(0.06,e*o),ec=[1,1-0.55*g,0.72-0.62*g,1],r2=r*(1+0.9*g*(r>3?0.4:1));
    ks(x,y,z-r*0.3,r2*1.14,r2*1.14*Math.max(oo,0.3),r2*0.7,KIN2);ks(x,y,z,r2,r2*oo,r2*0.7,ec,MESH.glowSphere);ks(x,y,z+r2*0.5,r2*0.62,r2*0.62*oo,r2*0.3,KGD,MESH.glowSphere);ks(x,y,z+r2*0.66,r2*0.17,r2*0.6*oo,r2*0.2,KDK);};
  eye(-7.5,176,13.2,4.6,1);eye(7.5,176,13.2,4.6,1);
  kbz(-8.4,182.4,14.6,11,2.2,2,KIN2,-0.32);kbz(8.4,182.4,14.6,11,2.2,2,KIN2,0.32); // brows, slanted in: it glares
  for(let k=0;k<5;k++)eye((k-2)*5.4,190-Math.abs(k-2)*1.8,10.4,2.1,0.9);
  for(const sd of [-1,1]){eye(sd*12.5,162,10.4,2.5,0.95);eye(sd*15.2,174,7.4,2.1,0.9);eye(sd*13.5,150,8.4,2,0.9);}
  // the crown: a gold ring of eyes behind the head with gold spikes between them, turning slowly
  { const w=kwa(0,174,-12);queue(KTOR,at(w[0],w[1],w[2],Math.PI/2,KA.yaw,0,40,40,40),KGD,0);queue(KTOR,at(w[0],w[1],w[2],Math.PI/2,KA.yaw,0,52,52,52),KGD2,0);}
  for(let k=0;k<13;k++){const a=t*0.1+k*TAU/13,b=a+TAU/26,cx=Math.sin(a)*40,cy=174+Math.cos(a)*40;
    eye(cx,cy,-9,3.1,1);
    const w1=kwa(Math.sin(b)*40,174+Math.cos(b)*40,-12),w2=kwa(Math.sin(b)*70,174+Math.cos(b)*70,-12);kbeam(w1,w2,6,KGD,MESH.box);}
  // stone fragments turning about her
  for(let k=0;k<12;k++){const a=t*0.07+k*TAU/12,r=118+(k%3)*18,y=40+(k*37%150)+Math.sin(t*0.4+k)*4,s=5+(k%4)*2.4,w=kwa(Math.sin(a)*r,y,Math.cos(a)*r);
    queue(MESH.box,at(w[0],w[1],w[2],t*0.2+k,t*0.3+k*2,0,s,s*1.4,s*0.9),k%2?KST2:KST,0);}
}
function kHandsDraw(t,side){
  for(const h of KA.hands){
    if(side&&h.side!==side)continue;
    const S=h.s,H=[h.x,h.y,h.z],E=kElbow(S,H,h.side),dead=h.dead,sc=dead?KDK:KST,sc2=dead?[.12,.11,.15,1]:KST2,
      ws=kwa(S[0],S[1],S[2]),we=kwa(E[0],E[1],E[2]),wh=kwa(H[0],H[1],H[2]);
    kbeam(ws,we,16,sc,MESH.box);kbeam(we,wh,12,sc2,MESH.box);
    queue(MESH.sphere,at(we[0],we[1],we[2],0,0,0,10,10,10),dead?KDK:KGD2,0);
    // the hand: a wide palm and five curled fingers cupping the orb
    queue(MESH.box,at(wh[0],wh[1],wh[2],0,KA.yaw,0,24,5,26),sc,0);queue(MESH.cyl,at(wh[0],wh[1]-2,wh[2],0,KA.yaw,0,7,6,7),dead?KDK:KGD,0);
    for(let f=0;f<5;f++){const a=KA.yaw+f*TAU/5+0.4,r0=10,r1=dead?14:15.5,up=dead?3+f%2*2:18,b0=[wh[0]+Math.sin(a)*r0,wh[1]+2,wh[2]+Math.cos(a)*r0],b1=[wh[0]+Math.sin(a)*r1,wh[1]+up,wh[2]+Math.cos(a)*r1];
      kbeam(b0,b1,3.8,sc2,MESH.box);queue(MESH.sphere,at(b1[0],b1[1],b1[2],0,0,0,2.4,2.4,2.4),sc,0);}
    if(dead){for(let c=0;c<4;c++){const a=KA.yaw+c*1.6,b0=[wh[0]+Math.sin(a)*3,wh[1]+3,wh[2]+Math.cos(a)*3],b1=[wh[0]+Math.sin(a)*12,wh[1]+3.2,wh[2]+Math.cos(a)*12];kbeam(b0,b1,0.8,[1,.35,.15,1],MESH.glowBox);}
      kbeam(kwa(E[0],E[1],E[2]),kwa(E[0]+3,E[1]-6,E[2]),1.1,[1,.35,.15,1],MESH.glowBox);continue;}
    queue(MESH.disc,at(wh[0],wh[1]+2.6,wh[2],0,0,0,8,1,8),KGD,0);
    const o=KA.orbs[h.i];if(!o||o.dead)continue;
    // the orb: a bright core in the colour of the hand, a halo, three gold rings
    const a=o.a,c=o.col,p=1+Math.sin(t*3+h.i)*0.04,r=a.radius*p,fl=a.flash*0.7,cc=[Math.min(1,c[0]+fl),Math.min(1,c[1]+fl),Math.min(1,c[2]+fl),1];
    queue(MESH.glowSphere,at(a.pos.x,a.pos.y,a.pos.z,0,0,0,r,r,r),cc,0);
    queue(MESH.glowSphere,at(a.pos.x,a.pos.y,a.pos.z,0,0,0,r*0.55,r*0.55,r*0.55),[c[0]*0.4+0.6,c[1]*0.4+0.6,c[2]*0.4+0.6,1],0);
    queue(MESH.glowSphere,at(a.pos.x,a.pos.y,a.pos.z,0,0,0,r*1.45,r*1.45,r*1.45),[c[0],c[1],c[2],0.22],F_BL);
    for(let k=0;k<3;k++){const ang=t*(0.8+k*0.3)*(k%2?-1:1);queue(MESH.ring,M4.alignY(tmpM(),a.pos.x,a.pos.y,a.pos.z,Math.sin(ang+k)*0.9,1,Math.cos(ang*0.8+k)*0.9,r*(1.3+k*0.12)),[1,.78,.28,0.95],F_BL);}
  }
}
