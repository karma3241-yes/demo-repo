// ================================================================
// Key hints: "L Mouse" under the clock, and the Lock on pill by the crosshair
// ================================================================
// L (free the mouse) is shown on desktop all the time: "L Mouse" while it is locked, "L / click to lock" once you have freed it.
// An enemy within 60 m and in front of you with nothing locked shows a gold "Z Lock on" pill (touch: the Lock button pulses and the
// pill says "Tap Lock"); once you have locked on at least once the pill shrinks to a quiet one. Locked, a small "Z Release" shows.
// The first time a foe is near you also get a toast (save.guide.lockNear).
let hintT=-9,foeNear=false;
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
}
// hush: the hint pills (#lockon, #lhint, #goal, the guide) hide during cutscenes, the QTE, zone fades and popups; the guide also in story zones and boss fights.
// (a CSS class so it works while a popup has the game paused)
function hushSync(){
  const h=!!(CUT||ASK||(KQ&&KQ.on)||ZF.phase>0),g=h||!!zone||KA.on||PF.on||invActive()||SOV.on||!$('bossbar').hidden;
  const b=document.body.classList;if(b.contains('hush')!==h)b.toggle('hush',h);if(b.contains('hushg')!==g)b.toggle('hushg',g);
}
