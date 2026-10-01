// ================================================================
// HUD update
// ================================================================
const lastHud={};
function setText(e,k,v){if(lastHud[k]!==v){lastHud[k]=v;e.textContent=v;}}
function setW(e,k,v){v=Math.round(clamp(v,0,1)*1000)/10;if(lastHud[k]!==v){lastHud[k]=v;e.style.width=v+'%';}}
function updateHud(dt){
  if(state!=='play')return;
  buildHudbar();updateHudbar();updateTouchHud();
  const t=repTier(save.reputation);
  setText(hud.htier,'tier',t.name);if(lastHud.tf!==t.faction){lastHud.tf=t.faction;hud.htier.style.color=FACTION_COL[t.faction];}
  setText(hud.lvl,'lvl','LV '+save.level);setW(hud.xpb,'xp',save.xp/xpNeed());
  setText(hud.rep,'rep',(save.reputation>0?'+':'')+save.reputation.toLocaleString('en-US'));setText(hud.sp,'sp',String(save.sp));
  hud.spwrap.classList.toggle('glow',save.sp>0);hud.bounty.hidden=!(save.bounty>0);if(save.bounty>0)setText(hud.bounty,'bty','BOUNTY $'+save.bounty.toLocaleString('en-US'));
  hud.wanted.hidden=!P.stars;if(P.stars){setText(hud.wanted,'wstar',starText(P.stars));hud.wanted.classList.toggle('blink',unseenT>2);}
  setW(hud.hpb,'hp',P.hp/maxHp());{const rg=isRing(),hm=heroMeter(),mode=rg?'ring':hm?hm.cls:'';if(lastHud.rg!==mode){lastHud.rg=mode;const e=$('enm');for(const k of ['ring','bat','bolt','cal'])e.classList.toggle(k,k===mode);e.firstElementChild.firstChild.nodeValue=rg?'RING ':hm?hm.label+' ':'ENERGY ';}
    {const ov=rg&&save.ring>100;if(lastHud.ov!==ov){lastHud.ov=ov;$('enm').classList.toggle('over',ov);}}
    if(rg){setW(hud.enb,'en',save.ring/100);setW(hud.enb2,'en2',(save.ring-100)/100);setText(hud.ent,'ent',String(Math.floor(save.ring))+'%');}
    else if(hm){const f=meterFrac(hm);setW(hud.enb,'en',f);setText(hud.ent,'ent',hm.key==='battery'&&save.battery<=0?'STANDBY':String(Math.floor(f*100))+'%');$('enm').classList.toggle('low',f<0.15);}else{setW(hud.enb,'en',P.en/maxEn());setText(hud.ent,'ent',String(Math.floor(P.en)));}}setText(hud.hpt,'hpt',String(Math.ceil(P.hp)));
  hud.shbar.hidden=!P.shieldOn&&!P.ringShield;if(P.shieldOn)setW(hud.shb,'sh',P.shield/pstat('energyShield','absorb'));else if(P.ringShield)setW(hud.shb,'sh',P.rsHp/pstat('ringShield','absorb'));
  const mins=Math.floor(tod*24*60);setText(hud.clock,'clock',String(Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0'));
  const sp=P.vel.len();
  setText(hud.mode,'mode',P.dead?'Down':inSpace()?spaceMode():P.car?'Driving · '+Math.round(Math.abs(P.car.spd||0)*3.6)+' km/h':P.alien?ALIENS[P.alien.id].name+(P.alien.phase>0?' · Phasing':P.invisible>0?' · Veiled':''):P.wall?'Wall-climbing':P.web?'Swinging':P.flying?(sp>150?'Flight · Mach':'Flight'):P.phasing?'Phasing':timeStopT>0?'Time stopped':frozenT>0?'Frozen in time':P.speeding?'Super speed x'+Math.min(P.dial,dialMax()):isSpeed()?'On foot · dial x'+Math.min(P.dial,dialMax())+(P.fastMode?' · fast mode':''):P.charging?'Charging':P.swim?(P.pos.y<SWIM_Y-1?'Diving':'Swimming'):P.wade?'Wading':P.grounded?'On foot':'Airborne');
  for(const s of slotEls){
    if(s.bandTimer){setW(s.bandTimer,'bt',P.alien?P.alien.t/P.alien.max:0);s.s.classList.toggle('bad',!!P.alien&&P.alien.t<5);continue;}
    if(s.alien!==undefined){if(!P.alien)continue;const ab=ALIENS[P.alien.id].abilities[s.alien],f=ab.cd?P.alien.cds[s.alien]/ab.cd:0,v=Math.round(f*100);
      if(s.cdv!==v){s.cdv=v;s.cd.style.setProperty('--p',v+'%');s.cd.hidden=v<=0;}
      s.s.classList.toggle('on',(ab.channel&&P.alien.channel)||(ab.id==='phase'&&P.alien.phase>0)||(ab.id==='veil'&&P.invisible>0)||(ab.id==='crystalArmor'&&P.alien.armor>0));continue;}
    if(s.i!=null&&PBAL){const L=slotLocked(s.i);s.s.classList.toggle('locked',L);s.s.classList.toggle('next',L&&s.i===nextLockedSlot());if(L){const t='Unlocks at LV '+KIT_LV[s.i];if(s.lvt!==t){s.lvt=t;s.lv.textContent=t;}continue;}}
    const st=PS[s.id],c=POWERS[s.id];
    if(s.id==='morphBand'){s.s.classList.toggle('on',!!P.alien||dialOpen);s.s.classList.toggle('bad',st.flash>0);const f=band.cd>0?band.cd/pstat('morphBand','recharge'):0,v=Math.round(clamp(f,0,1)*100);
      if(s.cdv!==v){s.cdv=v;s.cd.style.setProperty('--p',v+'%');s.cd.hidden=v<=0;}const lv='LV '+powerLevel(s.id);if(s.lvt!==lv){s.lvt=lv;s.lv.textContent=lv;}continue;}
    const active=st.holding||((s.id==='metalSkin'||s.id==='metalForms')&&P.metal)||(s.id==='energyShield'&&P.shieldOn)||(s.id==='telekinesis'&&!!P.tk)||(s.id==='flight'&&P.flying)||(s.trav&&P.flying)||(s.id==='ringShield'&&P.ringShield)||(s.id==='invisibility'&&P.cloak)||(s.id==='slowTime'&&P.slowOn)||(s.id==='superSpeed'&&P.speeding)||(s.id==='webSwing'&&!!P.web)||(s.id==='wallClimb'&&!!P.wall);
    s.s.classList.toggle('on',active);s.s.classList.toggle('bad',st.flash>0);s.s.classList.toggle('dim',meterBlocks(s.id));
    if(s.cd){const f=c.cooldown?st.cd/pstat(s.id,'cooldown'):0;const v=Math.round(f*100);if(s.cdv!==v){s.cdv=v;s.cd.style.setProperty('--p',v+'%');s.cd.hidden=v<=0;}}
    const gz=skillSize(s.id),lv='LV '+powerLevel(s.id)+(gz>1.01?' · ×'+(gz<10?gz.toFixed(1):Math.round(gz)):'');if(s.lvt!==lv){s.lvt=lv;s.lv.textContent=lv;}}
  hud.cross.classList.toggle('hot',!!(aim.actor&&aim.actor.kind!=='prop'&&aim.actor.kind!=='vehicle'));
  let prompt='';
  const it=P.dead?null:nearestInteract();
  if(!P.dead){if(it)prompt=it.kind==='exit'?'G · Get out':it.kind==='car'?'G · '+(it.v.driver?'Take this car':'Get in'):it.kind==='eat'?'G · Eat at the '+it.s.name:it.kind==='storm'?meterPrompt():'G · Help them up';
    else if(P.wall)prompt='W/S climb · Space to leap off';else if(aim.actor&&aim.actor.kind==='prop'&&aim.t<30)prompt=aim.actor.alive?(aim.actor.role==='shop'?'Shop':'ATM')+' · hitting it is a crime':'Closed';}
  setText(hud.prompt,'prompt',touchOn()?'':prompt);
  hud.charge.hidden=!P.charging&&!P.cp;if(P.charging||P.cp){setText(hud.charge.firstChild,'chl',P.cp?'CHARGED PUNCH':'SUPER JUMP');setW(hud.chargeb,'charge',P.cp?P.cp.t/1.2:P.chargeT/1.0);}
  hud.vig.style.opacity=(hurtFlash*0.9+(P.hp/maxHp()<0.3?0.35+Math.sin(time*6)*0.1:0)).toFixed(3);
  hud.flash.style.opacity=flashWhite.toFixed(3);
  if(boss&&!boss.leave){hud.bossbar.hidden=false;setText(hud.bossname,'bn',boss.name);setW(hud.bossb,'boss',boss.hp/boss.maxHp);}else hud.bossbar.hidden=true;
  updateMoves();
  updateGrowTut();
  // the touch buttons follow what you're doing in updateTouchHud (81_touch.js)
  if(lastHud.alien!==(P.alien?P.alien.id:'')){lastHud.alien=P.alien?P.alien.id:'';buildHotbar();buildTouchButtons();}
  setText($('online'),'online',MP.status());
  drawMinimap(P.yaw);drawLockMark();
}

// ================================================================
// Main loop
// ================================================================
function refreshMenu(){const b=$('start');menuButtons();b.textContent=save.character?'Continue as '+save.character.name:'Play';$('menu-sub').textContent=save.character?'LV '+save.level+' · '+repTier(save.reputation).name:'You start as the Ring Bearer · change powers any time';}
function startPlay(first){
  if(P.showcase||first||!P.placed){const s=SPAWNS[0];P.pos.set(s[0],0,s[1]);P.yaw=s[2];P.pitch=-0.12;P.vel.set(0,0,0);P.showcase=false;P.placed=true;}
  SFX.init();SFX.setVolume(save.settings.volume);state='play';$('menu').hidden=true;hud.root.hidden=false;
  applyLook();buildHotbar();buildTouchButtons();applyTouchUI();applyTravStyle(false);
  if(save.settings.autoLock&&!touchOn())requestLock();
  P.hp=maxHp();P.en=maxEn();
  toast(first?'Welcome to Nova Bay':'Welcome back, '+save.character.name,first?'Crimes show up on your minimap. Stop them, or join in.':'LV '+save.level+' · '+repTier(save.reputation).name,'gold');
  syncPlayerDoc(true);renderGuide();Portal.onPlay();
  if(save.migrated)later(3,()=>toast('Powers updated','You now pick one traversal and one body mod. Your hero was converted; Change powers in the pause menu is free right now.','gold'));
  askMic();
}
$('start').addEventListener('click',()=>{SFX.init();if(!save.character)startAsRingBearer();else startPlay(false);});
$('m-lb').addEventListener('click',()=>openSheet('lb'));$('m-mp').addEventListener('click',()=>openSheet('mp'));$('p-mp').addEventListener('click',()=>openSheet('mp'));$('m-set').addEventListener('click',()=>openSheet('set'));
$('resume').addEventListener('click',resume);
$('p-skills').addEventListener('click',()=>openSheet('skills'));$('p-look').addEventListener('click',()=>openSheet('look'));
$('p-lb').addEventListener('click',()=>openSheet('lb'));if(PBAL)$('m-lb').hidden=$('p-lb').hidden=true; // no leaderboard on CrazyGames (see 67_hudbar.js)$('p-set').addEventListener('click',()=>openSheet('set'));
$('create-x').addEventListener('click',closeCreator);
$('p-powers').addEventListener('click',tryRechoose);

let last=performance.now(),saveT=0;
function frame(now){
  requestAnimationFrame(frame);
  const real=clamp((now-last)/1000,0,0.05);last=Math.max(last,now);const dt=real*(slowT>0?0.35:1)*(dialOpen?0.25:1);if(slowT>0)slowT-=real;
  mpi=0;
  const live=(!paused||(state==='play'&&MP.online()))&&!Portal.inAd; // in a room the world never stops (except while a portal ad plays)
  if(live){
    time+=dt;timeFast=!!keys.KeyT&&state==='play';updateEnv(dt);
    if(state==='play'&&!(frozenT>0)){if(mouseL)punch();updatePlayer(dt);}
    updateTimeStop(dt);const wdt=dt*worldTimeK();
    updateWorld(wdt);separateHumans();updateRemotes(dt);updateProjs(wdt);updateOrbs(dt);updateFx(wdt);updateRagdolls(wdt);updateBuildings(wdt);FX.update(wdt);SMOKE.update(wdt);
    if(state==='play'){saveT+=dt;if(saveT>CONFIG.autosave){saveT=0;persist();syncPlayerDoc();}}
  }
  updateCamera(live?dt:0);
  if(state==='play'&&live){computeAim(150);updatePowers(dt);}
  buildDrawList();render();
  if(live)updateHud(dt);
  if(state==='play')MP.flush(real);
  Portal.tick();if(state==='play'&&PBAL&&time-(P.trialT||0)>1){P.trialT=time;updateTrials();}
  WS.update(real);
  updateTags();updateMarkers();updateUnderwater();
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
  tlights,lightFor,P2P,WS,ROOM,hostSet,kickPeer,rebuildCity,get tod(){return tod;},addWanted,get feedLog(){return document.getElementById("feed")?document.getElementById("feed").textContent:"";},PS,projs,thrown,wells,get bigBeam(){return bigBeam;},get timeDil(){return timeDil;},helis,spawnHeli,bldgs,damageBuilding,collapseBuilding,chargeStart,chargeRelease,ragdolls,startRagdoll,lockToggle,dashPress,webZip,swingJump,findAnchor,COMBAT,get lockT(){return lockT;},set lockT(v){lockT=v;},get comboN(){return comboN;},scorches,tryWallRun,get camPos(){return camPos;},get dlN(){return dlN;},stats:()=>({city:cityMesh.n/3,props:propMeshes.reduce((a,m)=>a+(m?m.n/3:0),0)}),buildDrawList,render,setPaused,get paused(){return paused;},updateCamera,camF,explode,spawnHuman,makeVehicle,Damage,renderGuide,blockProps,gatherLights,tryRechoose,tkGrabMore,tkSlam,turnDial,togglePhase,toggleFastMode,startTimeStop,get timeStopT(){return timeStopT;},get frozenT(){return frozenT;},get tsQueue(){return tsQueue;},worldTimeK,onIsland,zEdge,xEdge,cellAt,roadIndexOf,nodeAhead,get bank(){return bank;},PLANETS,SPACE,inSpace,spaceSpeedMul,nearestBody,spawnHunter,hunts,get myStreak(){return myStreak;},set myStreak(v){myStreak=v;},updateHunters,tetherShielded,constructPrimaryUp,dialPageTurn,dialItems,conDrive,heroMeter,payEn,standby,hungry,atInventorTower,get invTower(){return invTower;},callStorm,eatAt,nearestShopToEat,shops,roofTops,dialMax,summonConstruct,titanGrow,conGrowStep,skillGrowStep,voiceMatch,get voiceBlocked(){return voiceBlocked;},ringRebuild,get heldSlot(){return heldSlot;},dialItems,openDial,skillSize,conMaxGrow,conBase,CON_GROW,CON_PAGES,get camDist(){return camDist;},dismissConstruct,constructPrimary,constructPrimaryUp,constructAlt,constructX,holes,ringFxList,openOath,closeOath,CONSTRUCTS,conUnlocked,get oathOpen(){return oathOpen;},get oathFree(){return oathFree;},ringLocked,oathLoud,MIC,micOn,micOff,get voicePeak(){return voicePeak;},RING_MAX,pressJump,releaseJump,spiderAirTrick,swingBoost,updrafts,POWER_FN,mk,masteryLevel,addMastery,pstat,hasPower,get time(){return time;},
  Portal,SFX,applyLook,rings,makeRemote,applyPresence,FLAG,updateTags,spawnMech,fireProj,mechPoint,get parks(){return typeof parks!=="undefined"?parks:null;},travStyle,setTravStyle,hasTravWheel,masteryLevel,PRESETS,get growTutOn(){return growTutOn;},respawn,resume,startTrial,refill,slotLocked,flySpeed,dialMax,conMaxGrow,skillGrowMax,playerDown,spaceSpeedMul,flyBoost,summonConstruct,voidbornAnswer,voidbornStage,XQS,XQ,cityVisible,vHoldStart,vHoldEnd,planes,boats,flocks,pigeonGroups,fountainSpots,lakes,rechargeGoal,toggleMoves,movesShown,fitMoves,updateMarkers,inLake,get locked(){return locked;},blimp,get camPos(){return camPos;},get comboN(){return comboN;},
  sim(sec){const dt=1/30;for(let t=0;t<sec;t+=dt){time+=dt;updateEnv(dt);if(state==='play')updatePlayer(dt);updateTimeStop(dt);const wdt=dt*worldTimeK();updateWorld(wdt);separateHumans();updateRemotes(dt);updateProjs(wdt);updateOrbs(dt);updateFx(wdt);updateRagdolls(wdt);updateBuildings(wdt);FX.update(wdt);SMOKE.update(wdt);if(state==='play')MP.flush(dt);WS.update(dt);if(state==='play'&&!paused){updateCamera(dt);computeAim(150);updatePowers(dt);}}}};
if(window.__SKYLINE_TEST__)Object.defineProperties(window.__skyline,Object.getOwnPropertyDescriptors({validCharacter,newHero,buildTouchButtons,layoutTouch,tbWanted,get TB(){return TB;},applyTouchUI,checkOrient,openOath,closeOath,suitToggle,transformInto}));
