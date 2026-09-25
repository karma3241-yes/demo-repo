// ================================================================
// HUD update
// ================================================================
const lastHud={};
function setText(e,k,v){if(lastHud[k]!==v){lastHud[k]=v;e.textContent=v;}}
function setW(e,k,v){v=Math.round(clamp(v,0,1)*1000)/10;if(lastHud[k]!==v){lastHud[k]=v;e.style.width=v+'%';}}
function updateHud(dt){
  if(state!=='play')return;
  const t=repTier(save.reputation);
  setText(hud.htier,'tier',t.name);if(lastHud.tf!==t.faction){lastHud.tf=t.faction;hud.htier.style.color=FACTION_COL[t.faction];}
  setText(hud.lvl,'lvl','LV '+save.level);setW(hud.xpb,'xp',save.xp/xpNeed());
  setText(hud.rep,'rep',(save.reputation>0?'+':'')+save.reputation.toLocaleString('en-US'));setText(hud.sp,'sp',String(save.sp));
  hud.spwrap.classList.toggle('glow',save.sp>0);hud.bounty.hidden=!hasBounty();hud.wanted.hidden=!(P.heat>0);
  setW(hud.hpb,'hp',P.hp/maxHp());setW(hud.enb,'en',P.en/maxEn());setText(hud.hpt,'hpt',String(Math.ceil(P.hp)));setText(hud.ent,'ent',String(Math.floor(P.en)));
  hud.shbar.hidden=!P.shieldOn;if(P.shieldOn)setW(hud.shb,'sh',P.shield/pstat('energyShield','absorb'));
  const mins=Math.floor(tod*24*60);setText(hud.clock,'clock',String(Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0'));
  const sp=P.vel.len();
  setText(hud.mode,'mode',P.dead?'Down':P.car?'Driving · '+Math.round(Math.abs(P.car.spd||0)*3.6)+' km/h':P.alien?ALIENS[P.alien.id].name+(P.alien.phase>0?' · Phasing':P.invisible>0?' · Veiled':''):P.wall?'Wall-climbing':P.web?'Swinging':P.flying?(sp>150?'Flight · Mach':'Flight'):P.speeding?'Super speed':P.charging?'Charging':P.grounded?'On foot':'Airborne');
  for(const s of slotEls){
    if(s.bandTimer){setW(s.bandTimer,'bt',P.alien?P.alien.t/P.alien.max:0);s.s.classList.toggle('bad',!!P.alien&&P.alien.t<5);continue;}
    if(s.alien!==undefined){if(!P.alien)continue;const ab=ALIENS[P.alien.id].abilities[s.alien],f=ab.cd?P.alien.cds[s.alien]/ab.cd:0,v=Math.round(f*100);
      if(s.cdv!==v){s.cdv=v;s.cd.style.setProperty('--p',v+'%');s.cd.hidden=v<=0;}
      s.s.classList.toggle('on',(ab.channel&&P.alien.channel)||(ab.id==='phase'&&P.alien.phase>0)||(ab.id==='veil'&&P.invisible>0)||(ab.id==='crystalArmor'&&P.alien.armor>0));continue;}
    const st=PS[s.id],c=POWERS[s.id];
    if(s.id==='morphBand'){s.s.classList.toggle('on',!!P.alien||dialOpen);s.s.classList.toggle('bad',st.flash>0);const f=band.cd>0?band.cd/pstat('morphBand','recharge'):0,v=Math.round(clamp(f,0,1)*100);
      if(s.cdv!==v){s.cdv=v;s.cd.style.setProperty('--p',v+'%');s.cd.hidden=v<=0;}const lv='LV '+powerLevel(s.id);if(s.lvt!==lv){s.lvt=lv;s.lv.textContent=lv;}continue;}
    const active=st.holding||(s.id==='metalSkin'&&P.metal)||(s.id==='energyShield'&&P.shieldOn)||(s.id==='telekinesis'&&!!P.tk)||(s.id==='flight'&&P.flying)||(s.id==='superSpeed'&&P.speeding)||(s.id==='webSwing'&&!!P.web)||(s.id==='wallClimb'&&!!P.wall);
    s.s.classList.toggle('on',active);s.s.classList.toggle('bad',st.flash>0);
    if(s.cd){const f=c.cooldown?st.cd/c.cooldown:0;const v=Math.round(f*100);if(s.cdv!==v){s.cdv=v;s.cd.style.setProperty('--p',v+'%');s.cd.hidden=v<=0;}}
    const lv='LV '+powerLevel(s.id);if(s.lvt!==lv){s.lvt=lv;s.lv.textContent=lv;}}
  hud.cross.classList.toggle('hot',!!(aim.actor&&aim.actor.kind!=='prop'&&aim.actor.kind!=='vehicle'));
  let prompt='';
  const it=P.dead?null:nearestInteract();
  if(!P.dead){if(it)prompt=it.kind==='exit'?'G · Get out':it.kind==='car'?'G · '+(it.v.driver?'Take this car':'Get in'):'G · Help them up';
    else if(P.wall)prompt='W/S climb · Space to leap off';else if(aim.actor&&aim.actor.kind==='prop'&&aim.t<30)prompt=aim.actor.alive?(aim.actor.role==='shop'?'Shop':'ATM')+' · hitting it is a crime':'Closed';}
  setText(hud.prompt,'prompt',touchOn()?'':prompt);
  hud.charge.hidden=!P.charging;if(P.charging)setW(hud.chargeb,'charge',P.chargeT/1.0);
  hud.vig.style.opacity=(hurtFlash*0.9+(P.hp/maxHp()<0.3?0.35+Math.sin(time*6)*0.1:0)).toFixed(3);
  hud.flash.style.opacity=flashWhite.toFixed(3);
  if(boss&&!boss.leave){hud.bossbar.hidden=false;setText(hud.bossname,'bn',boss.name);setW(hud.bossb,'boss',boss.hp/boss.maxHp);}else hud.bossbar.hidden=true;
  if(helpTimer>0){helpTimer-=dt;if(helpTimer<=0)hud.keys.classList.add('fade');}
  const tb=$('touch');if(!tb.hidden){const dn=tbtns.querySelector('.dn');if(dn)dn.hidden=!P.flying;const u=tbtns.querySelector('.use');if(u){u.classList.toggle('dim',!it);const t=it?it.kind==='exit'?'EXIT':it.kind==='car'?'CAR':'HELP':'USE';if(u.textContent!==t)u.textContent=t;}}
  if(lastHud.alien!==(P.alien?P.alien.id:'')){lastHud.alien=P.alien?P.alien.id:'';buildHotbar();buildTouchButtons();}
  setText($('online'),'online',MP.status());
  drawMinimap(P.yaw);
}

// ================================================================
// Main loop
// ================================================================
function refreshMenu(){const b=$('start');b.textContent=save.character?'Continue as '+save.character.name:'Create your hero';$('menu-sub').textContent=save.character?'LV '+save.level+' · '+repTier(save.reputation).name:'Pick your powers, then take the city.';}
function startPlay(first){
  if(P.showcase||first){const s=SPAWNS[0];P.pos.set(s[0],0,s[1]);P.vel.set(0,0,0);P.showcase=false;}
  SFX.init();SFX.setVolume(save.settings.volume);state='play';$('menu').hidden=true;hud.root.hidden=false;
  applyLook();buildHotbar();buildTouchButtons();applyTouchUI();
  if(save.settings.autoLock&&!touchOn())requestLock();
  helpTimer=18;P.hp=maxHp();P.en=maxEn();
  toast(first?'Welcome to Nova Bay':'Welcome back, '+save.character.name,first?'Crimes show up on your minimap. Stop them, or join in.':'LV '+save.level+' · '+repTier(save.reputation).name,'gold');
  syncPlayerDoc(true);renderGuide();
}
$('start').addEventListener('click',()=>{SFX.init();if(!save.character)openCreator();else startPlay(false);});
$('m-lb').addEventListener('click',()=>openSheet('lb'));$('m-mp').addEventListener('click',()=>openSheet('mp'));$('p-mp').addEventListener('click',()=>openSheet('mp'));$('m-set').addEventListener('click',()=>openSheet('set'));
$('resume').addEventListener('click',resume);
$('p-skills').addEventListener('click',()=>openSheet('skills'));$('p-look').addEventListener('click',()=>openSheet('look'));
$('p-lb').addEventListener('click',()=>openSheet('lb'));$('p-set').addEventListener('click',()=>openSheet('set'));
$('create-x').addEventListener('click',closeCreator);
$('p-powers').addEventListener('click',tryRechoose);
$('dial').addEventListener('click',e=>{if(e.target.id==='dial')closeDial();});
let last=performance.now(),saveT=0;
function frame(now){
  requestAnimationFrame(frame);
  const real=Math.min((now-last)/1000,0.05);last=now;const dt=real*(slowT>0?0.35:1)*(dialOpen?0.25:1);if(slowT>0)slowT-=real;
  mpi=0;
  if(!paused){
    time+=dt;timeFast=!!keys.KeyT&&state==='play';updateEnv(dt);
    if(state==='play'){if(mouseL)punch();updatePlayer(dt);}
    updateWorld(dt);separateHumans();updateRemotes(dt);updateProjs(dt);updateOrbs(dt);updateFx(dt);FX.update(dt);SMOKE.update(dt);
    if(state==='play'){saveT+=dt;if(saveT>CONFIG.autosave){saveT=0;persist();syncPlayerDoc();}}
  }
  updateCamera(paused?0:dt);
  if(state==='play'&&!paused){computeAim(150);updatePowers(dt);}
  buildDrawList();render();
  if(!paused)updateHud(dt);
  if(state==='play')MP.flush(real);
  updateTags();
  if(state!=='play')setText($('menu-online'),'monline',MP.status());
}
applyTouchUI();refreshMenu();updateEnv(0);applyLook();MP.init();
{const m=/^#room=([A-Za-z0-9]{4,8})$/.exec(location.hash);if(m&&P2P.available())P2P.join(m[1]);}
requestAnimationFrame(frame);
if(window.__SKYLINE_TEST__)window.__skyline={P,save,get state(){return state;},actors,humans,drones,vehicles,rivals,crimes,orbs,keys,
  start:()=>$('start').click(),look:(y,p)=>{P.yaw=y;P.pitch=p;},setTod:v=>{tod=v;},abilityDown,abilityUp,punch,toggleFlight,webPress,webRelease,
  startShopRobbery,startAtmHack,startMugging,startCarTheft,startVaultHeist,startTruckHeist,spawnRival,addXP,addRep,get boss(){return boss;},aim,finishCreator:()=>finishCreator(),
  get draft(){return draft;},openSheet,closeSheet,setMouse:v=>{mouseL=v;},get car(){return P.car;},enterCar,exitCar,interact,nearestInteract,transformInto,revertAlien,bandPress,openDial,closeDial,
  get dialOpen(){return dialOpen;},band,ALIENS,aliensUnlocked,blockProps,propsNear,breakProp,hitProps,windows,debris,breakWindowAt,MP,tryRechoose,openCreator,closeCreator,spentPoints,
  tlights,lightFor,P2P,get camPos(){return camPos;},get dlN(){return dlN;},stats:()=>({city:cityMesh.n/3,props:propMeshes.reduce((a,m)=>a+(m?m.n/3:0),0)}),buildDrawList,render,setPaused,get paused(){return paused;},updateCamera,camF,explode,spawnHuman,makeVehicle,Damage,renderGuide,
  sim(sec){const dt=1/30;for(let t=0;t<sec;t+=dt){time+=dt;updateEnv(dt);if(state==='play')updatePlayer(dt);updateWorld(dt);separateHumans();updateRemotes(dt);updateProjs(dt);updateOrbs(dt);updateFx(dt);FX.update(dt);SMOKE.update(dt);if(state==='play'&&!paused){updateCamera(dt);computeAim(150);updatePowers(dt);}}}};
