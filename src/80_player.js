// ================================================================
// Input: keyboard, mouse, pointer lock, touch
// ================================================================
const keys={};let mouseL=false,mmbLook=false,rmbLook=false,locked=false,lockFailed=false,manualUnlock=false,helpTimer=0,lockHint=false,gHeld=0;
const touchIn={x:0,y:0};let lookT=-9;
const sensK=()=>0.0023*save.settings.sens;
function look(dx,dy,k=1){P.yaw-=dx*sensK()*k;P.pitch=clamp(P.pitch+(save.settings.invertY?1:-1)*dy*sensK()*k,-1.3,1.25);lookT=time;}
const SLOT_CODES={Digit1:0,KeyQ:0,Digit2:1,KeyE:1,Digit3:2,KeyR:2,Digit4:3,Digit5:4};
const DIAL_CODES={Digit1:0,Digit2:1,Digit3:2,Digit4:3,Digit5:4,Digit6:5,Digit7:6};
addEventListener('keydown',e=>{
  const tag=e.target&&e.target.tagName;if(tag==='INPUT'||tag==='TEXTAREA')return;
  if(e.code==='Tab'&&(sheetOpen||state!=='play'||creating))return;
  if(['Space','ArrowUp','ArrowDown','Tab'].includes(e.code))e.preventDefault();
  if(oathOpen&&!oathFree&&!touchOn()&&state==='play'&&!paused){oathKey(e);return;} // the typed oath takes every key; the spoken one leaves them to you
  const was=keys[e.code];keys[e.code]=true;if(was)return;
  if(dialOpen){if(e.code in DIAL_CODES){setDialSel(DIAL_CODES[e.code]);dialConfirm();}else if(e.code==='KeyQ'||e.code==='KeyE'||e.code==='Tab'){e.preventDefault();dialPageTurn(e.code==='KeyQ'?-1:1);}else if(e.code==='Escape'||e.code==='KeyV')closeDial();return;}
  if(e.code==='Escape'){if(sheetOpen){closeSheet();return;}if(ringLocked()&&state==='play'&&!paused){closeOath();return;}if(creating&&creatorMode==='rechoose'){closeCreator();return;}if(state==='play'&&!locked)setPaused(!paused);return;}
  if(state!=='play')return;
  if(e.code==='Tab'||e.code==='KeyK'){if(sheetOpen==='skills')closeSheet();else openSheet('skills');return;}
  if(e.code==='KeyP'){setPaused(!paused);return;}
  if(e.code==='KeyL'){toggleLock();return;}
  if(e.code==='KeyM'){toast(SFX.toggleMute()?'Sound off':'Sound on','','cyan');return;}
  if(e.code==='KeyH'){hud.keys.classList.toggle('fade');return;}
  if(P.dead&&!paused&&e.code==='KeyR'&&reviveReady()){revive();return;}
  if(paused||P.dead)return;
  if(voidbornLocked()){if(voidbornAway()&&e.code in XQ_CODES)voidbornAnswer(XQ_CODES[e.code]);return;} // Voidborn: only the masks' question can be answered
  if(e.code==='KeyG'){interact();return;}
  if(e.code==='KeyZ'){lockToggle();return;}
  if(e.code==='KeyU'){suitToggle();return;}
  if(e.code==='KeyV'){if(isRing()){if(ringLocked())oathBusy();else if(P.construct)vHoldStart(e.timeStamp);else openDial('construct');}else if(armorForms()&&!hasPower('morphBand'))openDial('armor');else bandPress();return;}
  if(e.code==='KeyN'&&armorForms()){openDial('armor');return;}
  if(e.code==='KeyO'&&isRing()){if(ringLocked())closeOath();else openOath();return;}
  if(e.code==='KeyY'&&isRing()){ringRebuild();return;}
  if(e.code==='KeyB'&&(isRing()||armorForms())&&!P.car){summonConstruct();return;}
  if(P.car)return;
  if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&P.web){swingBoost();return;}
  if(e.code==='KeyC'&&hasWeb()&&!P.grounded&&!P.flying&&spiderAirTrick())return;
  if(e.code in SLOT_CODES){heldSlot=SLOT_CODES[e.code];abilityDown(heldSlot);guideDone('ability');return;}
  if(e.code==='KeyX'){if(P.construct&&constructX())return;dashPress();return;}
  if((e.code==='BracketRight'||e.code==='Equal'||e.code==='BracketLeft'||e.code==='Minus')&&growStep(e.code==='BracketRight'||e.code==='Equal'?1:-1))return;
  if(isSpeed()){if(e.code==='KeyF'){toggleFastMode();return;}if(e.code==='KeyC'){togglePhase();return;}if(e.code==='BracketRight'||e.code==='Equal'){turnDial(1);return;}if(e.code==='BracketLeft'||e.code==='Minus'){turnDial(-1);return;}}
  if(e.code==='KeyF'){if(!flyChargeStart())toggleFlight();}else if(e.code==='Space')pressJump();
});
// Ring Bearer in a construct: tap V to step out of it, hold V to open the construct wheel (let go on a construct to switch to it)
const V_HOLD=0.3;let vHoldTimer=0,vHoldAt=0,vHeldOpen=false;
const vHoldOk=()=>state==='play'&&!paused&&!P.dead&&isRing()&&!ringLocked();
// the press length comes from the key events' own timestamps, so a slow frame can't turn a tap into a hold (or back)
function vHoldStart(ts){clearTimeout(vHoldTimer);vHeldOpen=false;vHoldAt=ts;vHoldTimer=setTimeout(()=>{vHoldTimer=0;if(!keys.KeyV||!vHoldOk())return;vHeldOpen=true;openDial('construct');},V_HOLD*1000);}
function vHoldEnd(ts){
  if(!vHoldAt)return;const tap=ts-vHoldAt<V_HOLD*1000,opened=vHeldOpen;clearTimeout(vHoldTimer);vHoldTimer=0;vHoldAt=0;vHeldOpen=false;
  if(tap){if(opened&&dialOpen)closeDial();if(vHoldOk()&&P.construct&&!dialOpen)dismissConstruct();return;}
  if(!opened){if(vHoldOk()&&!dialOpen)openDial('construct');return;}
  if(dialOpen&&dialSel>=0)dialConfirm();
}
addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='KeyV')vHoldEnd(e.timeStamp);if(e.code in SLOT_CODES&&heldSlot===SLOT_CODES[e.code])heldSlot=-1;if(state!=='play')return;if(e.code in SLOT_CODES)abilityUp(SLOT_CODES[e.code]);if(e.code==='Space')releaseJump();if(e.code==='KeyF')flyChargeRelease();});
addEventListener('blur',()=>{clearTimeout(vHoldTimer);vHoldTimer=0;vHoldAt=0;vHeldOpen=false;heldSlot=-1;for(const k in keys)keys[k]=false;mouseL=false;mmbLook=rmbLook=false;for(let i=0;i<5;i++)abilityUp(i,true);webRelease();P.charging=false;});
canvas.addEventListener('mousedown',e=>{
  if(state!=='play'||touchOn())return;
  if(paused){if(!sheetOpen&&!creating)resume();return;}
  if(dialOpen){if(e.button===0)dialConfirm();else closeDial();return;}
  if(e.button===1){mmbLook=true;e.preventDefault();return;}
  if(e.button===0){if(!locked&&!lockFailed&&save.settings.autoLock)requestLock();if(P.car||(oathOpen&&!oathFree))return;if(P.construct){constructPrimary();return;}if(P.tk&&tkSlam())return;if(chargeStart())return;mouseL=true;punch();}
  else if(e.button===2){if(P.car)return;if(P.construct){constructAlt(true);return;}if(P.tk&&tkGrabMore())return;if(hasPower('webSwing')&&!P.alien)webPress();else rmbLook=true;}
});
addEventListener('mouseup',e=>{if(e.button===0){mouseL=false;if(P.cp)chargeRelease();constructPrimaryUp();}if(e.button===1)mmbLook=false;if(e.button===2){rmbLook=false;webRelease();constructAlt(false);}});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('wheel',e=>{if(state!=='play'||paused||Math.abs(e.deltaY)<=1)return;if(dialOpen){dialPageTurn(e.deltaY<0?-1:1);return;}if(growStep(e.deltaY<0?1:-1))return;if(isSpeed())turnDial(e.deltaY<0?1:-1);},{passive:true});
// the wheel (or [ ]) grows whatever you are holding: the power whose key is held down, else the construct you are in
function growStep(dir){if(heldSlot>=0&&save.character&&!P.alien&&save.character.abilities[heldSlot])return skillGrowStep(heldSlot,dir);if(P.construct)return conGrowStep(dir);return false;}
addEventListener('mousemove',e=>{if(state!=='play'||paused||touchOn())return;if(dialOpen){if(locked)dialMove(e.movementX,e.movementY);return;}if(locked||mmbLook||rmbLook)look(e.movementX,e.movementY);});
function requestLock(){if(touchOn())return;try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>lockFail());}catch(e){lockFail();}}
function lockFail(){lockFailed=true;if(!lockHint){lockHint=true;toast('Mouse lock not available here','Hold the middle mouse button and drag to look','cyan');}}
function toggleLock(){if(touchOn())return;if(locked){manualUnlock=true;document.exitPointerLock();toast('Mouse unlocked','Middle-drag to look · press L to lock again','cyan');}else{lockFailed=false;requestLock();}}
document.addEventListener('pointerlockchange',()=>{const now=document.pointerLockElement===canvas;
  if(!now&&locked&&state==='play'&&!paused&&!manualUnlock&&!sheetOpen&&!dialOpen&&!creating)setPaused(true);
  if(!now)manualUnlock=false;locked=now;});
document.addEventListener('pointerlockerror',()=>lockFail());
function setPaused(v){
  paused=v;$('pause').hidden=!v||creating;if(v)renderPortalButtons();{const on=v&&MP.online();$('pause-title').textContent=on?'Menu':'Paused';$('pause-note').hidden=!on;}if(dialOpen)closeDial();
  if(v){mouseL=false;for(const k in keys)keys[k]=false;touchIn.x=touchIn.y=0;for(let i=0;i<5;i++)abilityUp(i,true);heldSlot=-1;webRelease();SFX.setLaser(false);SFX.setWind(0);SFX.setEngine(false,0);if(locked)document.exitPointerLock();persist();}
}
function resume(){if(sheetOpen)closeSheet();setPaused(false);Portal.midgame();if(save.settings.autoLock&&!touchOn())requestLock();}
function closeCreator(){creating=false;draft=null;creator.hidden=true;applyLook();if(state==='play')setPaused(true);else $('menu').hidden=false;}
function pressJump(){if(!canAct()||P.flying||P.car)return;if(P.wallRun){wallRunLeap();return;}if(P.web){swingJump();return;}if(P.wall){wallJump();return;}if(P.grounded){P.charging=true;P.chargeT=0;}else if(hasPower('flight')&&!P.alien)toggleFlight();else if(hasWeb())P.spaceT=time;else webZip();}
// web-slingers: tap Space in the air to web-zip, hold it to open the web wings
function releaseJump(){if(P.charging&&canAct())doJump();P.charging=false;
  if(P.spaceT&&!P.wings&&time-P.spaceT<0.22&&!P.grounded&&canAct())webZip();P.spaceT=0;}
function doJump(){
  let k=clamp(P.chargeT/1.0,0,1);const jm=P.alien?alienDef().jump:P.construct?1.25:1;P.charging=false;if(!P.grounded||P.flying)return;
  if(isRing()&&save.ring<=0)k=0; // an empty ring leaves you an ordinary jump
  if(hasWeb()&&k>0.35){slingLaunch(k);return;}
  P.vel.y=(CONFIG.move.jump+k*k*(CONFIG.move.superJump*(1+0.45*mk('jump'))-CONFIG.move.jump))*jm;P.grounded=false;if(k>0.35)addMastery('jump',k*6);
  if(k<0.35&&(keys.ShiftLeft||keys.ShiftRight||P.speeding)){P.vel.x*=1.35;P.vel.z*=1.35;P.vel.y*=1.1;} // parkour leap
  if(k>0.35){SFX.boom(0.5*k,0.7);ringFx(P.pos.x,P.pos.y+0.4,P.pos.z,1,14*k,0.5,[1,.9,.6]);burst(P.pos.x,P.pos.y+0.4,P.pos.z,40,26*k,0.8,DUST,2.2,-3,2.5);addShake(0.3*k);hitProps(P.pos.x,P.pos.y,P.pos.z,3*k,P,8);}
}
function wallJump(){const w=P.wall;P.wall=null;P.wallCd=0.5;P.vel.set(w.nx*16,24,w.nz*16);P.grounded=false;SFX.whoosh();}
// ---- G: context interaction (cars, injured people) ----
function nearestInteract(){
  if(P.car)return {kind:'exit'};
  let best=null,bd=4.2;
  for(const h of humans)if(h.alive&&h.downed>0){const d=Math.hypot(h.pos.x-P.pos.x,h.pos.z-P.pos.z);if(d<bd&&Math.abs(h.pos.y-P.pos.y)<2){bd=d;best={kind:'help',h};}}
  if(!P.alien||alienDef().scale<2)for(const v of vehicles){if(!v.alive||!['road','parked','stolen','flee','chase'].includes(v.state)||v.vtype==='truck')continue;
    const d=Math.hypot(v.pos.x-P.pos.x,v.pos.z-P.pos.z);if(d<bd+0.6&&Math.abs(v.pos.y-P.pos.y)<2.5){bd=d-0.6;best={kind:'car',v};}}
  if(!best){const s=nearestShopToEat();if(s)best={kind:'eat',s};else if(meterPrompt())best={kind:'storm'};}
  return best;
}
function interact(){
  if(giantGrab())return;
  const it=nearestInteract();if(!it)return;
  if(it.kind==='exit')exitCar(false);
  else if(it.kind==='car')enterCar(it.v);
  else if(it.kind==='eat')eatAt(it.s);
  else if(it.kind==='storm')callStorm();
  else if(it.kind==='help'){const h=it.h;if(playerFaction()==='villain'){Damage.apply(P,h,5,'punch');return;}
    h.downed=0;h.hp=Math.max(h.hp,30);h.state='flee';h.fx=h.pos.x+rr(-1,1);h.fz=h.pos.z+rr(-1,1);h.st=3;h.rx=0;
    burst(h.pos.x,h.pos.y+1,h.pos.z,30,6,1,[[.5,1,.7],[1,1,1]],1.2,-3,1.5);SFX.chime();addXP(15);addRep(5);feed('+15 XP · +5 rep','You helped someone back up');}
}
function enterCar(v){
  if(v.net)WS.take(v);
  if(P.alien&&alienDef().flies)return;
  if(v.state==='road'||v.state==='chase'){const h=spawnHuman(v.vtype==='police'?'police':'civilian',v.pos.x+Math.cos(v.yaw)*2,v.pos.z-Math.sin(v.yaw)*2);
    if(h.role==='police')h.target=P;else npcFlee(h,P.pos.x,P.pos.z);
    addRep(v.vtype==='police'?-10:-5);addWanted(v.vtype==='police'?4:1.5,150);feed('Carjacked',v.vtype==='police'?'-10 rep · the police want their car back':'-5 rep');}
  if(v.driver)ejectDriver(v);if(v.crime&&v.state==='flee'){v.escaped=false;}
  stopAllPowers();P.car=v;v.state='player';v.spd=v.state==='road'?v.maxSpd*0.5:0;v.siren=false;P.flying=false;P.charging=false;
  if(!save.guide.car){save.guide.car=true;toast('Driving','W and S to drive, A and D to steer, Space to drift, G to get out','cyan');}
  SFX.tone('square',120,90,0.2,0.08);
}
function exitCar(forced){
  const v=P.car;if(!v)return;P.car=null;
  if(v.alive){v.state='parked';v.parkT=undefined;}
  const c=Math.cos(v.yaw),s=Math.sin(v.yaw);P.pos.set(v.pos.x-c*2.4,v.pos.y+0.3,v.pos.z+s*2.4);
  const sp=v.spd||0;P.vel.set(Math.sin(v.yaw)*sp*0.5,forced?10:2,Math.cos(v.yaw)*sp*0.5);v.spd=0;P.grounded=false;SFX.setEngine(false,0);
}
// touch controls
const tl=$('tlayer'),stick=$('stick'),knob=$('knob'),tbtns=$('tbtns');let stickId=null,lookId=null,sx0=0,sy0=0,lx=0,ly=0;
tl.addEventListener('pointerdown',e=>{if(state!=='play'||paused)return;e.preventDefault();
  if(e.clientX<innerWidth*0.42&&stickId===null){stickId=e.pointerId;sx0=e.clientX;sy0=e.clientY;stick.style.left=sx0+'px';stick.style.top=sy0+'px';stick.classList.add('on');}
  else if(lookId===null){lookId=e.pointerId;lx=e.clientX;ly=e.clientY;}
  try{tl.setPointerCapture(e.pointerId);}catch(err){}});
tl.addEventListener('pointermove',e=>{
  if(e.pointerId===stickId){let dx=e.clientX-sx0,dy=e.clientY-sy0;const l=Math.hypot(dx,dy),R=56;if(l>R){dx*=R/l;dy*=R/l;}knob.style.transform=`translate(${dx}px,${dy}px)`;touchIn.x=dx/R;touchIn.y=-dy/R;}
  else if(e.pointerId===lookId){look(e.clientX-lx,e.clientY-ly,2.2);lx=e.clientX;ly=e.clientY;}});
const endTouch=e=>{if(e.pointerId===stickId){stickId=null;touchIn.x=touchIn.y=0;knob.style.transform='';stick.style.left='';stick.style.top='';stick.classList.remove('on');}if(e.pointerId===lookId)lookId=null;};
tl.addEventListener('pointerup',endTouch);tl.addEventListener('pointercancel',endTouch);
const SHORT={sonicScream:'SCREAM',quakeStomp:'QUAKE',meteorStrike:'METEOR',forcePush:'PUSH',chainLightning:'CHAIN',healingPulse:'HEAL',invisibility:'CLOAK',vineSnare:'SNARE',shadowStep:'STEP',plasmaWhip:'WHIP',bladeLeap:'LEAP',metalForms:'METAL',stretchStrike:'STRETCH',giantForm:'GIANT',webStrike:'STRIKE',webBomb:'BOMB',webWhip:'WHIP',lightningThrow:'BOLT',phaseStrike:'PHASE',speedTornado:'TWISTER',slowTime:'SLOW',timeStop:'STOP',ringBlast:'BLAST',hammerSmash:'HAMMER',chainLasso:'LASSO',ringShield:'SHIELD',blackHole:'HOLE',stormHammer:'HAMMER',repulsors:'REPULS',coreBeam:'BEAM',ricochetShield:'DISC',bladeClaws:'CLAWS',blink:'BLINK',gravityWell:'WELL',spiritWave:'WAVE',timeDilation:'TIME',laserVision:'LASER',fireball:'FIRE',iceCloud:'ICE',lightning:'BOLT',energyBlast:'BLAST',telekinesis:'LIFT',shockwave:'SHOCK',metalSkin:'METAL',energyShield:'SHIELD',morphBand:'MORPH'};
function bindTouchBtn(b,act){
  b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();try{b.setPointerCapture(e.pointerId);}catch(err){}b.classList.add('down');touchAct(act,true);});
  const up=()=>{if(!b.classList.contains('down'))return;b.classList.remove('down');touchAct(act,false);};
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('contextmenu',e=>e.preventDefault());
}
bindTouchBtn($('tpause'),'pause');
function buildTouchButtons(){
  tbtns.textContent='';if(!save.character)return;
  const B=(label,act,cls='')=>{const b=el('button',{type:'button',class:'tb '+cls,text:label});bindTouchBtn(b,act);tbtns.appendChild(b);return b;};
  if(P.alien){ALIENS[P.alien.id].abilities.forEach((ab,i)=>B(ab.name.split(' ').pop().toUpperCase().slice(0,7),'a'+i,'ab alien'));B('PUNCH','punch','big');B('REVERT','band','dn2');}
  else{save.character.abilities.forEach((id,i)=>B(SHORT[id]||'A'+(i+1),'a'+i,'ab'));B('PUNCH','punch','big');
    for(const id of save.character.movement){if(id==='flight'||['stormFlight','armorFlight','solarFlight'].includes(id))B('FLY','fly');else if(id==='superSpeed'){B('SPEED','speed');B('FAST','fast');B('PHASE','phase');B('DIAL+','dialup');B('DIAL-','dialdn');}else if(id==='webSwing')B('WEB','web');else if(id==='powerRing'){B('FLY','fly');B('BUILD','con');B('PICK','conpick');B('ALT','alt');B('OATH','oath');B('REBUILD','rebuild');}}}
  if(!P.alien){B('GROW','grow');B('SHRINK','shrink');} // hold a power button (or sit in a construct) and tap these to change its size
  if(!P.alien&&save.character.movement[0]==='armorFlight'){B('FORM','con');B('FORMS','conpick');if(P.construct)B('ALT','alt');}
  if(!P.alien&&hasPower('telekinesis'))B('GRAB+','tkmore');
  if(hasPower('flight')||(P.alien&&alienDef().flies))B('DOWN','down','dn');
  B('SUIT','suit');B('USE','use','use');B('LOCK','lock','lk');B('DASH','dash','ds');B('JUMP','jump','wide');
}
function touchAct(a,down){
  if(a==='pause'){if(down&&state==='play')setPaused(true);return;}
  if(down&&!canAct())return;
  if(dialOpen)return;
  if(a==='punch'){if(P.car)return;if(P.construct){if(down)constructPrimary();else constructPrimaryUp();return;}if(down&&P.tk&&tkSlam())return;if(down&&chargeStart())return;if(!down&&P.cp){chargeRelease();mouseL=false;return;}mouseL=down;if(down)punch();}
  else if(/^a[0-4]$/.test(a)){if(P.car)return;if(down){heldSlot=+a[1];abilityDown(+a[1]);guideDone('ability');}else{if(heldSlot===+a[1])heldSlot=-1;abilityUp(+a[1]);}}
  else if(a==='con'){if(down)summonConstruct();}
  else if(a==='conpick'){if(down){if(isRing()&&ringLocked())oathBusy();else openDial(isRing()?'construct':'armor');}}
  else if(a==='oath'){if(down){if(ringLocked())closeOath();else openOath();}}
  else if(a==='alt'){constructAlt(down);}
  else if(a==='cx'){if(down)constructX();}
  else if(a==='rebuild'){if(down)ringRebuild();}
  else if(a==='grow'||a==='shrink'){if(down)growStep(a==='grow'?1:-1);}
  else if(a==='jump'){keys.Space=down;if(down)pressJump();else releaseJump();}
  else if(a==='speed')keys.ShiftLeft=down;
  else if(a==='down')keys.KeyC=down;
  else if(a==='fly'){if(down){if(!flyChargeStart())toggleFlight();}else flyChargeRelease();}
  else if(a==='web'){if(down)webPress();else webRelease();}
  else if(a==='use'){if(down)interact();}
  else if(a==='band'){if(down)bandPress();}
  else if(a==='fast'){if(down)toggleFastMode();}
  else if(a==='tkmore'){if(down)tkGrabMore();}
  else if(a==='suit'){if(down)suitToggle();}
  else if(a==='phase'){if(down)togglePhase();}
  else if(a==='dialup'){if(down)turnDial(1);}
  else if(a==='dialdn'){if(down)turnDial(-1);}
  else if(a==='lock'){if(down)lockToggle();}
  else if(a==='dash'){if(down)dashPress();}
}
function applyTouchUI(){const t=touchOn();document.body.classList.toggle('touch',t);$('touch').hidden=!(t&&state==='play');$('menu-controls').hidden=t;$('menu-touch').hidden=!t;}

// ================================================================
// Player controller: Grounded | Airborne | Flying | Speeding | WallClimbing | Swinging | Driving
// ================================================================
function playerLook(){
  const t=creating&&draft?draft:save.character;
  if(!t)return {suit:c4(SUIT_OPTS[0]),suit2:[...hex(SUIT_OPTS[0],0.6),1],cape:c4(CAPE_OPTS[0]),acc:c4(ACC_OPTS[0]),capeOn:true,metal:false};
  const m={suit:c4(SUIT_OPTS[t.suit]),suit2:[...hex(SUIT_OPTS[t.suit],0.6),1],cape:c4(CAPE_OPTS[t.cape]),acc:c4(ACC_OPTS[t.accent]),capeOn:t.capeOn,metal:P.metal,armor:!creating&&t===save.character&&hasPower('armorSuit')};
  return P.suited===false&&!creating&&sheetOpen!=='look'?civLook(m):m;
}
let LOOK=playerLook();
function applyLook(){LOOK=playerLook();if(save.character)hud.hname.textContent=save.character.name;}
function driveCar(dt,inF,inR){
  const v=P.car,D=CONFIG.drive;
  if(!v.alive){exitCar(true);return;}
  const hb=!!keys.Space;
  if(inF>0.1)v.spd+=(v.spd<-0.5?D.brake:D.accel)*inF*dt;
  else if(inF<-0.1)v.spd-=(v.spd>0.5?D.brake:D.accel*0.7)*(-inF)*dt;
  else v.spd*=1-0.5*dt;
  if(hb)v.spd*=1-1.2*dt;
  v.spd=clamp(v.spd,-D.reverse,D.maxSpeed);
  const turn=inR*D.steer*clamp(v.spd/9,-1,1)*(hb?1.7:1);v.yaw-=turn*dt; // D steers right
  const fx=Math.sin(v.yaw),fz=Math.cos(v.yaw),prevY=v.pos.y;
  v.pos.x+=fx*v.spd*dt;v.pos.z+=fz*v.spd*dt;
  // buildings: push out and bounce
  const R=v.hl*0.75;const before=v.spd;const col=collideBody(v.pos,v.vel,prevY+0.7,R,1.6);v.pos.y=Math.max(v.pos.y,groundY(v.pos.x,v.pos.z,prevY+0.7));
  if(col.wall){const imp=Math.abs(before);if(imp>7){Damage.apply(null,v,imp*1.1,'crash');SFX.crash(clamp(imp/30,0.3,1));burst(v.pos.x+fx*2,1,v.pos.z+fz*2,20,imp*0.5,0.5,SPARK,0.9,15,1);addShake(clamp(imp/40,0.1,0.6));
      if(imp>24)crater(v.pos.x+fx*2.2,1.2,v.pos.z+fz*2.2,col.wall.nx||0,0,col.wall.nz||0,2,col.wall.b.col);if(imp>18)breakWindowAt(col.wall.b,v.pos.x+fx*2.5,1.5+Math.random()*3,v.pos.z+fz*2.5);}v.spd*=-0.25;}
  // other cars
  for(const o of vehicles){if(o===v||o.state==='held'||o.state==='thrown'||o.state==='wreckAir')continue;const dx=o.pos.x-v.pos.x,dz=o.pos.z-v.pos.z,d=Math.hypot(dx,dz),min=v.hl*0.75+o.hl*0.75;
    if(d<min&&d>0.01){const push=min-d;o.pos.x+=dx/d*push*0.6;o.pos.z+=dz/d*push*0.6;v.pos.x-=dx/d*push*0.4;v.pos.z-=dz/d*push*0.4;
      const imp=Math.abs(v.spd-(o.spd||0)*Math.cos(o.yaw-v.yaw));
      if(imp>6&&time-(o.bumpT||-9)>0.4){o.bumpT=time;Damage.apply(P,o,imp*1.2,'crash');Damage.apply(null,v,imp*0.6,'crash');SFX.crash(clamp(imp/30,0.2,1));burst((o.pos.x+v.pos.x)/2,1,(o.pos.z+v.pos.z)/2,16,8,0.5,SPARK,0.8,15,1);
        if(o.state==='road'||o.state==='chase'){o.state='parked';o.spd=0;o.parkT=8;}if(o.state==='stolen'&&o.alive){o.spd=0;}}
      v.spd*=0.6;}}
  // people and street furniture
  const sp=Math.abs(v.spd);
  for(const h of humans){if(!h.alive||h.air||h.hidden)continue;const dx=h.pos.x-v.pos.x,dz=h.pos.z-v.pos.z;if(Math.abs(dx)>3.2||Math.abs(dz)>3.2)continue;
    if(Math.hypot(dx,dz)<v.hl*0.8&&sp>3&&time-(h.bumpT||-9)>0.6){h.bumpT=time;Damage.apply(P,h,sp*1.6,'crash',{knock:sp*0.9});}}
  if(sp>4)hitProps(v.pos.x+fx*v.hl*0.7,0.6,v.pos.z+fz*v.hl*0.7,v.hw+0.2,P,sp);
  P.pos.set(v.pos.x,v.pos.y,v.pos.z);P.vel.set(fx*v.spd,0,fz*v.spd);P.grounded=true;P.heroYaw=v.yaw;
  if(sp>3&&time-lookT>1.2)P.yaw=angLerp(P.yaw,v.yaw+Math.PI,damp(2.5,dt));
  if(hb&&sp>12&&Math.random()<0.6)smoke(v.pos.x-fx*2,0.3,v.pos.z-fz*2,1,0.6,1.8,0.8,0.5);
  SFX.setEngine(true,clamp(sp/D.maxSpeed,0,1));
}
function playerBodies(prevY){
  const sp=Math.hypot(P.vel.x,P.vel.z),big=(P.alien&&alienDef().scale>2)||P.giantS>2;
  for(const h of humans){if(!h.alive||h.air||h.held||h.hidden)continue;const dx=h.pos.x-P.pos.x,dz=h.pos.z-P.pos.z;
    if(Math.abs(dx)>P.radius+1||Math.abs(dz)>P.radius+1||Math.abs(h.pos.y-P.pos.y)>P.height)continue;
    const d=Math.hypot(dx,dz)||0.01,min=P.radius+0.45;if(d>=min)continue;
    if((sp>16||big&&sp>4)&&!P.speeding&&time-(h.bumpT||-9)>0.6){h.bumpT=time;Damage.apply(P,h,sp*0.5,'bump',{knock:Math.max(10,sp*0.8)});}
    else{const push=min-d;h.pos.x+=dx/d*push*0.8;h.pos.z+=dz/d*push*0.8;P.pos.x-=dx/d*push*0.2;P.pos.z-=dz/d*push*0.2;}}
  for(const v of vehicles){if(v===P.car||v.state==='thrown'||v.state==='held'||v.state==='wreckAir')continue;if(Math.abs(v.pos.x-P.pos.x)>6||Math.abs(v.pos.z-P.pos.z)>6)continue;
    const c=Math.cos(v.yaw),s=Math.sin(v.yaw),dx=P.pos.x-v.pos.x,dz=P.pos.z-v.pos.z;const lx=dx*c-dz*s,lz=dx*s+dz*c;
    const hw=v.hw+P.radius*0.6,hl=v.hl+P.radius*0.6,top=VEH_S*(v.vtype==='truck'?3.4:v.vtype==='van'?3:(v.state==='wreck'&&Math.abs(v.rz)>1?1.4:1.75));
    if(Math.abs(lx)<hw&&Math.abs(lz)<hl&&P.pos.y<v.pos.y+top&&P.pos.y+P.height>v.pos.y){
      if(prevY>=v.pos.y+top-0.7){P.pos.y=v.pos.y+top;if(P.vel.y<0)P.vel.y=0;P.grounded=true;
        if(v.state==='road'||v.state==='chase'){P.pos.x+=Math.sin(v.yaw)*v.spd*(1/60);P.pos.z+=Math.cos(v.yaw)*v.spd*(1/60);}}
      else if(big){if(v.alive&&time-(v.bumpT||-9)>0.5){v.bumpT=time;Damage.apply(P,v,40,'crash');}}
      else{let nlx=lx,nlz=lz;if(hw-Math.abs(lx)<hl-Math.abs(lz))nlx=Math.sign(lx||1)*hw;else nlz=Math.sign(lz||1)*hl;
        P.pos.x=v.pos.x+nlx*c+nlz*s;P.pos.z=v.pos.z-nlx*s+nlz*c;
        if(sp>24&&v.alive&&time-(v.bumpT||-9)>0.5){v.bumpT=time;Damage.apply(P,v,sp*0.8,'crash');SFX.crash(0.6);burst(P.pos.x,1.2,P.pos.z,12,8,0.4,SPARK,0.8,15,1);}
        P.vel.x*=0.4;P.vel.z*=0.4;}}}
  if(P.pos.y<9)for(const p of propsNear(P.pos.x,P.pos.z,P.radius+0.5).slice()){if(P.pos.y>p.y+3.5)continue;const dx=P.pos.x-p.x,dz=P.pos.z-p.z,d=Math.hypot(dx,dz)||0.01,min=P.radius*0.8+p.r;if(d>=min)continue;
    if(sp>18||big||P.dashT>0){breakProp(p,P,P.vel.x*0.6,P.vel.z*0.6);}else{P.pos.x=p.x+dx/d*min;P.pos.z=p.z+dz/d*min;}}
}
function separateHumans(){
  for(let i=0;i<humans.length;i++){const a=humans[i];if(!a.alive||a.air||a.held||a.hidden)continue;
    for(let j=i+1;j<humans.length;j++){const b=humans[j];if(!b.alive||b.air||b.held||b.hidden)continue;const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z;
      if(Math.abs(dx)>0.9||Math.abs(dz)>0.9)continue;const d=Math.hypot(dx,dz)||0.01;if(d<0.85){const p=(0.85-d)*0.5;a.pos.x-=dx/d*p;a.pos.z-=dz/d*p;b.pos.x+=dx/d*p;b.pos.z+=dz/d*p;}}}
}
let moved=0;
function updatePlayer(dt){
  const a=P.anim;
  if(P.dead){P.deadT-=dt;if(P.deadT<=0)respawn();return;}
  updateCombat(dt);if(P.floatT>0)P.floatT-=dt;if(P.grounded||P.flying||P.web||P.wall)P.airHangs=0;
  if(P.heldBy){const H=P.heldBy;if(time-H.t>0.6)P.heldBy=null;else{if(!H.said){H.said=true;feed((H.by&&H.by.name||'Someone')+' has you','Held by telekinesis');}
    const k=damp(8,dt);P.pos.x+=(H.x-P.pos.x)*k;P.pos.y+=(H.y-1-P.pos.y)*k;P.pos.z+=(H.z-P.pos.z)*k;P.vel.set(0,0,0);P.flying=false;P.web=null;P.wallRun=null;P.wall=null;P.grounded=false;P.stun=Math.max(P.stun,0.25);
    if(Math.random()<0.5)emit(P.pos.x+rr(-1,1),P.pos.y+rr(0,2),P.pos.z+rr(-1,1),0,rr(0,2),0,0.5,[.7,.45,1],1.1,0,0);return;}}
  if(P.wallCd>0)P.wallCd-=dt;
  const fwdX=-Math.sin(P.yaw),fwdZ=-Math.cos(P.yaw),rX=Math.cos(P.yaw),rZ=-Math.sin(P.yaw);
  const inF=clamp((keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)+touchIn.y,-1,1);
  const inR=clamp((keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+touchIn.x,-1,1);
  if(P.car){driveCar(dt,inF,inR);return;}
  if(voidbornLocked()){P.vel.set(0,0,0);return;} // Voidborn stands frozen until the masks agree
  if(P.lantern&&!oathFree&&!P.dead){P.vel.set(0,0,0);if(P.construct&&P.construct.spd)P.construct.spd=0;return;} // typing the oath: suspended where you are, construct and all (saying it leaves you free)
  spiderTick(dt);
  const shift=!!(keys.ShiftLeft||keys.ShiftRight),AL=alienDef();
  const slowMul=(1-(P.slow||0))*(P.metal?1-pstat('metalSkin','slow'):1)*(P.stun>0?0:1);
  const wasGrounded=P.grounded,vyBefore=P.vel.y,phasing=(P.alien&&P.alien.phase>0)||P.phasing;
  P.speeding=false;
  if(P.wallRun)wallRunStep(dt,inF,inR);
  else if(P.wall){
    const w=P.wall,cs=(AL&&AL.climb?18:pstat('wallClimb','speed'))*slowMul;let tx=-w.nz,tz=w.nx;if(tx*camR.x+tz*camR.z<0){tx=-tx;tz=-tz;}
    P.vel.set(tx*inR*cs*0.8,inF*cs,tz*inR*cs*0.8);P.pos.addS(P.vel,dt);
    if(w.nx!==0)P.pos.x=w.nx>0?w.b.x1+P.radius:w.b.x0-P.radius;else P.pos.z=w.nz>0?w.b.z1+P.radius:w.b.z0-P.radius;
    const along=w.nx!==0?P.pos.z:P.pos.x,lo=w.nx!==0?w.b.z0:w.b.x0,hi=w.nx!==0?w.b.z1:w.b.x1;
    P.heroYaw=Math.atan2(-w.nx,-w.nz);P.grounded=false;
    if(P.pos.y>=w.b.y1-1&&inF>0){P.pos.y=w.b.y1;P.pos.x-=w.nx*1.6;P.pos.z-=w.nz*1.6;P.wall=null;P.grounded=true;P.vel.set(0,0,0);P.wallCd=0.4;}
    else if(along<lo-0.4||along>hi+0.4){P.wall=null;P.wallCd=0.4;}
    else if(P.pos.y<=0.05&&inF<0){P.pos.y=0;P.wall=null;P.wallCd=0.5;P.grounded=true;}
    P.pos.y=Math.max(0,P.pos.y);
  }else{
    if(P.dashT>0){P.dashT-=dt;const m=alienMul();for(const q of actors){if(!q.alive||q.kind==='prop'||time-(q.dashHit||-9)<0.5)continue;const c=center(q);if(Math.hypot(c.x-P.pos.x,c.y-P.pos.y-1,c.z-P.pos.z)<3.5){q.dashHit=time;Damage.apply(P,q,25*m,'wind',{knock:20});}}
      if(Math.random()<0.8)emit(P.pos.x,P.pos.y+1.3,P.pos.z,0,0,0,0.4,[.8,1,1],1.4,0,0);}
    else if(P.burstT>0){P.burstT-=dt;if(!P.flying&&!P.grounded)P.vel.y-=CONFIG.move.gravity*0.35*dt;}
    else if(P.zip)zipStep(dt);
    else if(P.web)swingStep(dt,inF,inR,fwdX,fwdZ,rX,rZ);else if(P.wings)wingStep(dt);else if(conDrive()&&!P.flying)driveConstruct(dt,inF,inR,shift);else if(P.flying){
      const cp=Math.cos(P.pitch),sp=Math.sin(P.pitch);
      let tx=fwdX*cp*inF+rX*inR,ty=sp*inF+((keys.Space?1:0)-(keys.KeyC?1:0)),tz=fwdZ*cp*inF+rZ*inR;const l=Math.hypot(tx,ty,tz);if(l>1){tx/=l;ty/=l;tz/=l;}
      const base=(AL&&AL.flies?AL.flySpeed:flySpeed()*conSpeedMul())*slowMul*spaceSpeedMul(),spd=shift?base*(AL&&AL.flies?1.5:flyBoost()):base,k=damp(shift?1.8:3,dt);
      const lk=P.launchT>0?k*0.06:k;if(P.launchT>0)P.launchT-=dt; // a charged launch keeps its momentum for a moment
      P.vel.x+=(tx*spd-P.vel.x)*lk;P.vel.y+=(ty*spd-P.vel.y)*lk;P.vel.z+=(tz*spd-P.vel.z)*lk;
    }else{
      let tx=fwdX*inF+rX*inR,tz=fwdZ*inF+rZ*inR;const l=Math.hypot(tx,tz);if(l>1){tx/=l;tz/=l;}
      const am=AL?AL.speed:P.construct&&!P.flying?conSpeedMul():1;
      const canSpeed=hasPower('superSpeed')&&(shift||P.fastMode)&&P.grounded&&l>0.1&&P.en>1;P.speeding=canSpeed;
      let spd=(hasteT>0?1.6:1)*(P.charging?6:canSpeed?CONFIG.move.run*speedMult():shift?CONFIG.move.sprint*am:CONFIG.move.run*am);spd*=slowMul;
      const hsp=Math.hypot(P.vel.x,P.vel.z);
      if(!P.grounded&&hsp>spd+2){ // keep swing / leap momentum: steer it instead of braking
        if(l>0.1){const turn=damp(1.8,dt),nx=P.vel.x+(tx*hsp-P.vel.x)*turn,nz=P.vel.z+(tz*hsp-P.vel.z)*turn,nl=Math.hypot(nx,nz)||1;P.vel.x=nx/nl*hsp;P.vel.z=nz/nl*hsp;}
        const drag=1-0.22*dt;P.vel.x*=drag;P.vel.z*=drag;}
      else{const k=P.grounded?damp(12,dt):damp(1.6,dt);P.vel.x+=(tx*spd-P.vel.x)*k;P.vel.z+=(tz*spd-P.vel.z)*k;}P.vel.y-=(P.slam?30:CONFIG.move.gravity)*(P.floatT>0&&P.vel.y<3?0.12:1)*(1-0.85*spaceK(P.pos.y))*dt; // out in space you only drift slowly back down
      if(hasWeb()&&!P.grounded&&P.pitch<-0.5&&inF>0){P.vel.y-=30*dt;P.vel.x+=fwdX*12*dt;P.vel.z+=fwdZ*12*dt;} // dive
      if(P.charging){P.chargeT+=dt;if(!P.grounded)P.charging=false;}
    }
    const prevY=P.pos.y;P.pos.addS(P.vel,dt);
    if(P.web){const W=P.web;let dx=P.pos.x-W.x,dy=P.pos.y+1.6-W.y,dz=P.pos.z-W.z;const d=Math.hypot(dx,dy,dz)||1;
      if(d>W.L){dx/=d;dy/=d;dz/=d;P.pos.x-=dx*(d-W.L);P.pos.y-=dy*(d-W.L);P.pos.z-=dz*(d-W.L);const vr=P.vel.x*dx+P.vel.y*dy+P.vel.z*dz;if(vr>0){P.vel.x-=dx*vr;P.vel.y-=dy*vr;P.vel.z-=dz*vr;}}}
    if(phasing){const gb=baseY(P.pos.x,P.pos.z);P.grounded=false;if(P.pos.y<=gb){P.pos.y=gb;if(P.vel.y<0)P.vel.y=0;P.grounded=true;}}
    else{const pvx=P.vel.x,pvy=P.vel.y,pvz=P.vel.z,vpre=Math.hypot(pvx,pvy,pvz);const col=collideBody(P.pos,P.vel,prevY,P.radius,P.height);P.grounded=col.grounded;
      if(col.wall&&(P.flying||P.rush||(P.alien&&P.alien.dashing))&&vpre>70&&!P.car){const w=col.wall;
        if(damageBuilding(w.b.bld,vpre*vpre*0.08*(P.rush?3:1),P.pos.x,P.pos.y+1,P.pos.z,-(w.nx||0),-(w.nz||0))){P.vel.set(pvx*0.85,pvy*0.85,pvz*0.85);addShake(0.5);}
        else if(time-(P.wallHitT||-9)>0.5){P.wallHitT=time;crater(P.pos.x,P.pos.y+1.2,P.pos.z,w.nx||0,0,w.nz||0,clamp(vpre*0.025,1.5,4),w.b.col);}}
      if(col.wall&&P.construct&&P.construct.id==='titan'&&vpre>5){const w=col.wall;damageBuilding(w.b.bld,vpre*60*dt*conGrow('titan'),P.pos.x,P.pos.y+2,P.pos.z,-(w.nx||0),-(w.nz||0));if(Math.random()<dt*4)crater(P.pos.x-(w.nx||0)*P.radius,P.pos.y+rr(2,8),P.pos.z-(w.nz||0)*P.radius,w.nx||0,0,w.nz||0,2.5,w.b.col);}
      if(P.flungT&&time-P.flungT<2&&col.wall&&Math.hypot(P.vel.x,P.vel.z)+15>COMBAT.slamMin*2){crater(P.pos.x,P.pos.y+1.2,P.pos.z,col.wall.nx||0,0,col.wall.nz||0,2.2,col.wall.b.col);P.flungT=-9;P.vel.set(0,-4,0);P.stun=Math.max(P.stun,0.6);}
      const canClimb=(hasPower('wallClimb')&&!P.alien)||(AL&&AL.climb);
      if(col.wall&&canClimb&&!shift&&!P.flying&&!P.web&&!P.zip&&P.wallCd<=0&&col.wall.b.y1>P.pos.y+2.5){
        const ix=fwdX*inF+rX*inR,iz=fwdZ*inF+rZ*inR;if(-(ix*col.wall.nx+iz*col.wall.nz)>0.5){P.wall=col.wall;P.vel.set(0,0,0);P.charging=false;P.grounded=false;}}
      if(!P.wall&&col.wall&&!(P.flungT&&time-P.flungT<2)&&!phasing)tryWallRun(col,inF,inR,fwdX,fwdZ,rX,rZ,shift);
      if(P.zip&&col.wall&&P.zip.t>0.15){P.zip=null;P.vel.set(col.wall.nx*4,14,col.wall.nz*4);}
      playerBodies(prevY);}
  }
  // free roam: the ocean goes on past the city and nothing pulls you back (only the edge of the solar system stops you)
  P.pos.x=clamp(P.pos.x,-SPACE.lim,SPACE.lim);P.pos.z=clamp(P.pos.z,-SPACE.lim,SPACE.lim);
  if(!P.flying&&P.vel.y>0&&P.pos.y>CEIL&&P.pos.y-P.vel.y*dt<=CEIL){P.pos.y=CEIL;P.vel.y=0;} // without flight you can't jump or get thrown out of the sky
  else if(P.pos.y>SPACE.lim){P.pos.y=SPACE.lim;P.vel.y=Math.min(P.vel.y,0);} // fliers can climb into space; letting go up there just drifts you back down
  if(!onIsland(P.pos.x,P.pos.z)&&P.grounded&&P.pos.y<-0.5&&Math.random()<0.3)emit(P.pos.x,-0.8,P.pos.z,rr(-2,2),rr(2,4),rr(-2,2),0.6,WATER[0],1,15,1);
  if(!wasGrounded&&P.grounded&&!P.flying){
    const impact=-vyBefore;
    if(P.slam){P.slam=false;shockAt(P.pos.x,P.pos.y+0.6,P.pos.z,1.3);burst(P.pos.x,P.pos.y+0.3,P.pos.z,80,40,1.1,DUST,3,-2,2);crater(P.pos.x,P.pos.y+0.02,P.pos.z,0,1,0,5,[.42,.41,.4]);}
    else if(hasWeb()&&impact>25&&impact<130)landingRoll(impact);
    else if(hasPower('elasticBody')&&!P.alien&&impact>40&&!keys.KeyC){P.vel.y=impact*0.5;P.grounded=false;SFX.tone('sine',180,420,0.25,0.1);burst(P.pos.x,P.pos.y+0.2,P.pos.z,14,6,0.4,DUST,1,-2,2);} // rubber body bounces
    else if(impact>58||(AL&&AL.scale>2&&impact>25)||(P.construct&&P.construct.id==='titan'&&impact>18)){ringFx(P.pos.x,P.pos.y+0.3,P.pos.z,1,16,0.45,[1,.9,.7]);burst(P.pos.x,P.pos.y+0.3,P.pos.z,50,26,0.9,DUST,2.6,-3,2.4);SFX.boom(0.55,0.7);addShake(0.45);
      areaDamage(P.pos.x,P.pos.y+0.5,P.pos.z,10,25*strengthMul(),P,{knock:14});crater(P.pos.x,P.pos.y+0.02,P.pos.z,0,1,0,3.5,[.42,.41,.4]);}
  }
  if(P.flying&&P.grounded&&keys.KeyC&&!(AL&&AL.flies))P.flying=false;
  if(P.speeding){for(const h of humans){if(!h.alive||h.air||time-(h.bumpT||-9)<0.6)continue;if(Math.abs(h.pos.x-P.pos.x)<1.8&&Math.abs(h.pos.z-P.pos.z)<1.8&&Math.abs(h.pos.y-P.pos.y)<2){h.bumpT=time;Damage.apply(P,h,pstat('superSpeed','hitDmg'),'bump',{knock:20});}}
    if(Math.random()<0.8)emit(P.pos.x,P.pos.y+rr(0.3,2.4),P.pos.z,0,0,0,0.35,[.55,.8,1],1.3,0,0);}
  moved+=Math.hypot(P.vel.x,P.vel.z)*dt;if(moved>25)guideDone('move');
  if(!P.alien&&save.character){const sp=P.vel.len();if(P.flying)addMastery(save.character.movement[0],sp*dt*0.015);else if(P.speeding)addMastery('superSpeed',sp*dt*0.012);}
  // facing, tilt, limbs
  const hs=Math.hypot(P.vel.x,P.vel.z),sp3=P.vel.len();
  const aiming=time-castT<0.6||beam||PS.iceCloud.holding||P.tk||(P.alien&&P.alien.channel)||(lockT&&!P.web&&!P.flying);let yawRate=0;
  if(!P.wall&&time-P.punchT>0.3&&!conDrive()){let ty=P.heroYaw;if(lockT&&!P.web&&!P.flying){const c=center(lockT);ty=Math.atan2(c.x-P.pos.x,c.z-P.pos.z);}else if(aiming)ty=Math.atan2(camF.x,camF.z);else if(hs>1.5)ty=Math.atan2(P.vel.x,P.vel.z);
    const prev=P.heroYaw;P.heroYaw=angLerp(P.heroYaw,ty,damp(P.flying?5:12,dt));yawRate=angLerp(0,P.heroYaw-prev,1)/Math.max(dt,1e-3);}
  let tilt=0,bank=0;
  if((P.flying||P.web||P.wings)&&sp3>8){tilt=clamp(Math.atan2(hs,P.vel.y),0,1.5)*clamp(sp3/40,0,1);bank=clamp(-yawRate*0.25,-0.7,0.7);}
  if(P.speeding)tilt=0.35;if(aiming)tilt=Math.min(tilt,0.5);if(P.web)tilt*=0.5;
  P.tilt=lerp(P.tilt,tilt,damp(6,dt));P.bank=lerp(P.bank,bank,damp(4,dt));
  let tl=0,tr=0,kl=0,kr=0,al=0,ar=0,el=-0.25,er=-0.25,alz=-0.12,arz=0.12,cape=0.15;
  if(P.wallRun){const c=Math.sin(time*16);tl=c*0.9;tr=-c*0.9;kl=Math.max(0,-c)*1.3+0.2;kr=Math.max(0,c)*1.3+0.2;al=-c*0.9-0.3;ar=c*0.9-0.3;el=er=-1.2;cape=0.9;
    if(P.wallRun.mode==='side'){bank=0;}}
  else if(P.zip){ar=-3.0;er=0;al=-3.0;el=0;tl=0.2;tr=-0.1;kl=0.4;kr=0.2;cape=1.2;}
  else if(P.wall){const c=Math.sin(time*8)*(Math.abs(inF)+Math.abs(inR)>0.1?1:0);al=-2.6+c*0.4;ar=-2.6-c*0.4;tl=0.4+c*0.3;tr=0.4-c*0.3;kl=0.9-c*0.4;kr=0.9+c*0.4;el=er=-0.6;cape=0.1;}
  else if(P.web){ar=-3.0;er=0;al=-0.6;el=-0.9;tl=0.3;tr=-0.2;kl=0.6;kr=0.3;cape=clamp(sp3/30,0.3,1.4);}
  else if(P.wings){al=ar=-0.1;alz=-1.45;arz=1.45;el=er=0;tl=0.12;tr=-0.12;kl=kr=0.15;cape=1.2;}
  else if(P.flying){if(sp3>20){ar=-2.95;er=0;al=-0.15;el=-0.2;tl=0.05;tr=0.22;kl=0.1;kr=0.5;cape=0.12+Math.sin(time*18)*0.06;}
    else{al=-0.3+Math.sin(time*2)*0.1;ar=-0.3-Math.sin(time*2)*0.1;alz=-0.35;arz=0.35;el=er=-0.5;tl=0.15+Math.sin(time*1.7)*0.1;tr=-0.05+Math.sin(time*1.7+1)*0.1;kl=0.3;kr=0.5;cape=0.35+Math.sin(time*3)*0.12;}}
  else if(P.grounded){P.phase+=dt*hs*(P.speeding?0.18:0.3)/(AL?Math.max(1,AL.scale*0.7):1);const k=Math.min(hs/14,1.25),sw=Math.sin(P.phase)*k*0.95;
    tl=sw;tr=-sw;kl=Math.max(0,-Math.sin(P.phase))*k*1.2+0.05;kr=Math.max(0,Math.sin(P.phase))*k*1.2+0.05;al=-sw*0.85;ar=sw*0.85;el=er=-0.3-k*0.5;cape=clamp(hs/40,0,1.3)+Math.sin(time*9)*0.05*Math.min(hs/20,1);
    if(P.speeding){al=0.9;ar=0.9;el=er=-1.4;}
    if(P.charging){const q=Math.min(P.chargeT,1);tl=-0.9*q;tr=-0.9*q;kl=kr=1.6*q;al=0.5*q;ar=0.5*q;alz=-0.5*q;arz=0.5*q;}}
  else{if(P.vel.y>0){al=-2.7;ar=-2.7;el=er=-0.1;tl=0.5;tr=-0.3;kl=0.9;kr=0.3;cape=0.4;}else{al=-1.2;ar=-1.2;alz=-0.9;arz=0.9;el=er=-0.4;tl=0.3;tr=-0.2;kl=0.5;kr=0.4;cape=clamp(-P.vel.y/35,0.3,2.6);}
    if(P.slam){al=-3;ar=-3;alz=-0.2;arz=0.2;tl=0.9;tr=0.9;kl=kr=1.5;cape=2.8;}}
  if(P.tk){ar=-1.7;al=-1.7;alz=-0.3;arz=0.3;el=er=-0.2;}
  if(hasPower('stormBody')&&!P.alien&&P.suited!==false&&!thrown.some(t=>t.kind==='hammer')){ // the storm god's hammer arm
    if(P.fCharge){ar=-2.9;arz=0.25;er=0;al=-0.6;}else if(time-(P.hammerUpT||-9)<0.6){ar=-3.1;arz=0.05;er=0;}else if(P.flying&&sp3>12){ar=-2.95;er=0;arz=0.05;}}
  if(time-castT<0.25&&!beam){ar=-1.6;er=0;}
  const k=damp(14,dt);a.legL=lerp(a.legL,tl,k);a.legR=lerp(a.legR,tr,k);a.kneeL=lerp(a.kneeL||0,kl,k);a.kneeR=lerp(a.kneeR||0,kr,k);a.armL=lerp(a.armL,al,k);a.armR=lerp(a.armR,ar,k);
  a.elbL=lerp(a.elbL||0,el,k);a.elbR=lerp(a.elbR||0,er,k);a.armLz=lerp(a.armLz,alz,k);a.armRz=lerp(a.armRz,arz,k);a.cape=lerp(a.cape,cape,damp(8,dt));
  const pt=time-P.punchT;
  if(pt<0.22){const kd=P.punchKind||'jab';
    if(kd==='kick'){a.legR=-1.5;a.kneeR=0.1;a.legL=0.3;a.armL=-0.6;a.armR=0.4;}
    else if(kd==='up'){a.armR=-3.0;a.elbR=-0.2;a.legL=-0.4;a.kneeL=0.9;}
    else if(kd==='down'){const q=pt/0.22;a.armR=a.armL=lerp(-3.0,-0.8,q);a.elbR=a.elbL=-0.1;a.kneeL=a.kneeR=1.2;}
    else if(kd==='fin'){a.armR=-1.7;a.elbR=0;a.armL=0.5;a.legL=-0.5;a.kneeL=0.6;}
    else if(P.punchArm>0){a.armR=-1.65;a.elbR=0;}else{a.armL=-1.65;a.elbL=0;}}
  if(P.flying&&sp3>150){if(!P.boomed){P.boomed=true;SFX.boom(0.8,1.4);addShake(0.5);ringFx(P.pos.x+P.vel.x*0.05,P.pos.y+1.2+P.vel.y*0.05,P.pos.z+P.vel.z*0.05,1,16,0.5,[.8,.95,1],[P.vel.x,P.vel.y,P.vel.z]);}}
  else if(sp3<110)P.boomed=false;
  if(sp3>70&&P.flying){const n=Math.floor(sp3/35);for(let i=0;i<n;i++)emit(P.pos.x+P.vel.x*0.35+rr(-14,14),P.pos.y+1+P.vel.y*0.35+rr(-9,9),P.pos.z+P.vel.z*0.35+rr(-14,14),0,0,0,0.45,[.75,.85,1],0.35,0,0);}
  if(P.grounded&&hs>30&&Math.random()<0.6)emit(P.pos.x,P.pos.y+0.2,P.pos.z,rr(-3,3),rr(1,4),rr(-3,3),0.6,DUST[0],1.8,-1,2);
  if(AL&&AL.id!=='x'&&P.alien.id==='umbra'&&Math.random()<0.5)smoke(P.pos.x,P.pos.y+1,P.pos.z,1,0.4,2,0.8,0.05);
  if(AL&&P.alien.id==='magmaw'&&Math.random()<0.3)emit(P.pos.x+rr(-.6,.6),P.pos.y+rr(0.5,3),P.pos.z+rr(-.6,.6),0,rr(1,3),0,0.6,FIRE[1],1,-2,1);
  SFX.setWind(clamp((sp3-20)/170,0,1));
}
