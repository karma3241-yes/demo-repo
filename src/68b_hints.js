// ================================================================
// Key hints: "L Mouse" under the clock, and the Lock on pill by the crosshair
// ================================================================
// L (free the mouse) is shown on desktop all the time: "L Mouse" while it is locked, "L / click to lock" once you have freed it.
// An enemy within 60 m and in front of you with nothing locked shows a gold "Z Lock on" pill (touch: the Lock button pulses and the
// pill says "Tap Lock"); once you have locked on at least once the pill shrinks to a quiet one. Locked, a small "Z Release" shows.
// The first time a foe is near you also get a toast (save.guide.lockNear).
let hintT=-9,foeNear=false,flyG=0,flyShown=0,flyEver=false,flyOkSeen=null,flyLastT=0; // fly hint: seconds grounded, seconds shown, has flown this session, can-fly watcher
const canFlyKey=()=>!!save.character&&!P.alien&&(hasPower('flight')||invFlyOk()); // F flies (the invasion lets every hero fly)
function nearFoe(){ // same view cone as pickLock, so a press of Z really does lock something
  for(const a of actors){if(!lockable(a)||a.hidden||!hostileTo(a))continue;const c=center(a);
    if(Math.hypot(c.x-P.pos.x,c.y-P.pos.y,c.z-P.pos.z)>60)continue;
    const dx=c.x-camPos.x,dy=c.y-camPos.y,dz=c.z-camPos.z,d=Math.hypot(dx,dy,dz)||1;if((dx*camF.x+dy*camF.y+dz*camF.z)/d>=0.55)return true;}
  return false;
}
function updateHints(){
  const lh=$('lhint'),lo=$('lockon');if(!lh||!lo)return;
  const touch=touchOn(),live=state==='play'&&!paused&&!P.dead;
  lh.hidden=touch||!live;
  if(!lh.hidden){setText($('lhint-t'),'lht',locked?'Mouse':'/ click to lock');lh.classList.toggle('free',!locked);}
  if(time-hintT>0.2||time<hintT){hintT=time;foeNear=live&&!P.car&&!dialOpen&&!lockT?nearFoe():false;}
  const lk=!!lockT&&lockT.alive&&live;let txt='';
  if(live&&lk&&!touch)txt='Release';
  else if(live&&!lk&&foeNear){txt=touch?'Tap Lock':'Lock on';
    if(!save.guide.lockNear){save.guide.lockNear=true;if(!save.guide.lock)toast(touch?'Tap Lock to lock on':'Press Z to lock on','','gold');}}
  lo.hidden=!txt;
  if(txt){setText($('lockon-t'),'lot',txt);$('lockon-k').hidden=touch;lo.classList.toggle('sm',lk||!!save.guide.lock);}
  if(TB.lock)TB.lock.b.classList.toggle('hint',touch&&live&&!lk&&foeNear);
  flyHint(live,touch);
}
// "F to fly" under the lock-on pill: a flying hero who stands on the ground for 5 s and has not flown yet this session sees it (14 s at most, once per session); touch pulses the Fly button instead
function flyHint(live,touch){
  const fh=$('flyhint');if(!fh)return;
  const ok=canFlyKey();if(ok!==flyOkSeen){const first=flyOkSeen===null;flyOkSeen=ok;if(!first)buildHotbar();} // the move list and hotbar follow when flying turns on (the invasion) or off
  const dt=clamp(time-flyLastT,0,0.25);flyLastT=time;
  if(P.flying)flyEver=true;
  const able=live&&hasPower('flight')&&!P.alien&&!P.car&&P.grounded&&!P.flying&&!zone&&!flyEver&&!sheetOpen&&!creating&&!dialOpen;
  flyG=able?flyG+dt:0;const show=able&&flyG>5&&flyShown<14;if(show)flyShown+=dt;
  if(fh.hidden===show)fh.hidden=!show;
  if(show){$('flyhint-k').hidden=touch;setText($('flyhint-t'),'fht',touch?'Tap Fly':'to fly');}
  if(TB.fly)TB.fly.b.classList.toggle('hint',touch&&show);
}
// hush: the hint pills (#lockon, #lhint, #goal, the guide) hide during cutscenes, the QTE, zone fades and popups; the guide also in story zones and boss fights.
// (a CSS class so it works while a popup has the game paused)
function hushSync(){
  const h=!!(CUT||ASK||(KQ&&KQ.on)||ZF.phase>0),g=h||!!zone||KA.on||PF.on||invActive()||SOV.on||!$('bossbar').hidden;
  const b=document.body.classList;if(b.contains('hush')!==h)b.toggle('hush',h);if(b.contains('hushg')!==g)b.toggle('hushg',g);
}
