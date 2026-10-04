// ================================================================
// Story core: active play time, cutscenes, the objective pill, the yes/no popup
// ================================================================
// The story events (UFO, Kathana, invasion, cyber world, tower) share this file. save.story={act,ufo,item,destroy,kathana,invasion,cyber,tower}
// (see freshSave): the ints are stage numbers, 0 = not started; act = seconds of ACTIVE play (see storyActiveNow).
// Story events are solo only: in a multiplayer room (MP.online()) they wait, their visuals and objectives hide, and a story zone is left.
// Zones (separate playable areas) are in 66c_zones.js, the UFO event in 66d_ufo.js. storyTick(dt) runs once per frame from 99_main.js (only while the game is live).
const ST={inputT:-99,mx:0,my:0,graceT:-1};
const storySolo=()=>!MP.online();
// ---- active time: real play only. The clock stops while paused, in a menu, dead, in a portal ad, in a multiplayer room, or after 6 s with no input ----
const storyPoke=()=>{ST.inputT=time;};
addEventListener('keydown',storyPoke,true);addEventListener('pointerdown',storyPoke,true);addEventListener('wheel',storyPoke,{passive:true,capture:true});
addEventListener('touchstart',storyPoke,{passive:true,capture:true});addEventListener('touchmove',storyPoke,{passive:true,capture:true});
addEventListener('mousemove',e=>{let d=Math.hypot(e.movementX||0,e.movementY||0);if(!d)d=Math.hypot(e.clientX-ST.mx,e.clientY-ST.my);ST.mx=e.clientX;ST.my=e.clientY;if(d>2)storyPoke();},true); // only real movement (>2 px) counts
function storyHeld(){for(const k in keys)if(keys[k])return true;return Math.abs(touchIn.x)+Math.abs(touchIn.y)>0.1;} // a key or the stick held down is input too (key repeat aside)
function storyActiveNow(){return state==='play'&&!paused&&!sheetOpen&&!creating&&!P.dead&&!Portal.inAd&&storySolo()&&!cutLocked()&&(time-ST.inputT<=6||storyHeld());}
function storyTick(dt){
  try{
    const solo=storySolo();
    if(!solo){if(CUT)cutEnd(false);if(ASK)askClose(null);if(zone)zoneAbort();}
    zoneFadeTick(dt);cutTick(dt);boostTick(dt);
    if(solo&&state==='play'&&!P.dead){
      if(storyActiveNow())save.story.act+=dt;
      ufoTick(dt);kathanaTick(dt);
      if(zone&&zone.update)zone.update(dt*worldTimeK());
    }else if(PR.on&&(P.dead||!solo))prismEnd('lost');
    objRefresh();
  }catch(e){logErr(e);}
}
// ---- cutscenes ----
// cutscene({dur,from,to,look,text,letterbox,control,onTick,onEnd,fov,skippable}): from/to are camera positions {x,y,z} (or functions of 0..1 progress), look is the point to face
// (an object or a function of progress). The camera glides from -> to over dur seconds. The player stands still and takes no damage, the world keeps running; Space,
// Esc, Enter or a tap skips it after 1 s (onEnd still runs). With control:true the player keeps playing: only the bars and the caption show.
let CUT=null;
function cutLocked(){return !!(CUT&&!CUT.control)||ZF.phase>0||REW.on||time<ST.graceT||!!(KQ&&KQ.on);} // the player frozen: no powers, no moving, no damage (also for a moment after a skip, so the tap isn't a punch)
function cutscene(o){
  o=o||{};if(CUT)cutEnd(false);
  CUT={dur:Math.max(0.3,o.dur||5),t:0,from:o.from,to:o.to||o.from,look:o.look,text:o.text||'',lb:o.letterbox!==false,control:!!o.control,skippable:!o.control&&o.skippable!==false,fov:o.fov||0,onTick:o.onTick,onEnd:o.onEnd,capOn:false,skipOn:false};
  const c=$('cut');c.hidden=false;void c.offsetWidth;c.classList.toggle('on',CUT.lb);$('cut-cap').textContent=CUT.text;$('cut-cap').classList.remove('on');$('cut-skip').classList.remove('on');
  document.body.classList.toggle('cutfull',!CUT.control);
  if(!CUT.control){mouseL=false;for(let i=0;i<4;i++)abilityUp(i,true);heldSlot=-1;if(P.web)webRelease(false);}
  return CUT;
}
function cutEnd(run){
  const C=CUT;if(!C)return;CUT=null;ST.graceT=time+(C.control?0:0.2);
  const c=$('cut');c.classList.remove('on');$('cut-cap').classList.remove('on');$('cut-skip').classList.remove('on');document.body.classList.remove('cutfull');
  setTimeout(()=>{if(!CUT)c.hidden=true;},800);
  if(run&&C.onEnd){try{C.onEnd(C);}catch(e){logErr(e);}}
}
function cutTick(dt){
  const C=CUT;if(!C)return;C.t+=dt;const k=clamp(C.t/C.dur,0,1);
  if(C.onTick){try{C.onTick(k,dt,C);}catch(e){logErr(e);}}
  const cap=!!C.text&&C.t>0.5&&C.t<C.dur-0.7;if(cap!==C.capOn){C.capOn=cap;$('cut-cap').classList.toggle('on',cap);}
  const sk=C.skippable&&C.t>1;if(sk!==C.skipOn){C.skipOn=sk;$('cut-skip').classList.toggle('on',sk);}
  if(C.t>=C.dur&&CUT===C)cutEnd(true);
}
// the scripted camera (called by updateCamera in 90_render.js): returns true when it set camPos / camF / fov
function cutCamera(dt){
  const C=CUT;if(!C||C.control||state!=='play'||!C.from)return false;
  const k=clamp(C.t/C.dur,0,1),e=k*k*(3-2*k),ev=v=>typeof v==='function'?v(k):v,a=ev(C.from),b=ev(C.to)||a,l=ev(C.look)||{x:P.pos.x,y:P.pos.y+1.5,z:P.pos.z};
  camPos.set(lerp(a.x,b.x,e),lerp(a.y,b.y,e),lerp(a.z,b.z,e));
  const fx=l.x-camPos.x,fy=l.y-camPos.y,fz=l.z-camPos.z,L=Math.hypot(fx,fy,fz)||1;camF.set(fx/L,fy/L,fz/L);fov=lerp(fov,C.fov||60,damp(4,dt));
  return true;
}
addEventListener('keydown',e=>{
  if(ASK){askKey(e);return;}
  if(CUT&&CUT.skippable&&CUT.t>1&&(e.code==='Space'||e.code==='Escape'||e.code==='Enter')){e.preventDefault();e.stopImmediatePropagation();cutEnd(true);}
},true);
addEventListener('pointerdown',e=>{if(!ASK&&CUT&&CUT.skippable&&CUT.t>1)cutEnd(true);},true);
// ---- the objective pill and its pin ----
// objective('Find the Master Control') shows a gold pill at the top; objective(null) hides it. objectiveMark(x,y,z,label) adds a pin in the world and a diamond on the
// minimap (objectiveMark(null) removes it). The pin only shows while there is an objective and no cutscene.
const OBJ={text:'',mark:null,shown:null};
function objective(t){OBJ.text=t?String(t):'';}
function objectiveMark(x,y,z,label){OBJ.mark=x===null||x===undefined?null:{x,y,z,label:label||''};}
function objRefresh(){
  const e=$('objective');if(!e)return;const show=!!OBJ.text&&storySolo()&&state==='play'&&!(CUT&&!CUT.control);
  if(e.hidden===show)e.hidden=!show;if(show&&OBJ.shown!==OBJ.text){OBJ.shown=OBJ.text;$('obj-t').textContent=OBJ.text;}
  const bu=!$('bossbar').hidden;if(document.body.classList.contains('bossup')!==bu)document.body.classList.toggle('bossup',bu);
  if(show)objFit(e);
}
// on a phone the pill goes into the gap between the player panel and the icon bar (it truncates when the gap is small)
function objFit(e){
  if(!touchOn()){if(e.style.left){e.style.left=e.style.maxWidth=e.style.transform='';}return;}
  const hb=$('hudbar').getBoundingClientRect(),lefty=save.settings.tHand==='l',L=lefty?(hb.width?hb.right+8:200):200,R=lefty?innerWidth-200:(hb.width?hb.left-8:innerWidth-130),k=Math.round(L)+'|'+Math.round(R);
  if(e.dataset.fit===k)return;e.dataset.fit=k;e.style.left=L+'px';e.style.transform='none';e.style.maxWidth=Math.max(140,R-L)+'px';
}
function objectivePin(n){
  const m=OBJ.mark;if(!m||!OBJ.text||!storySolo()||(CUT&&!CUT.control))return n;
  const d=fmtDist(Math.hypot(m.x-P.pos.x,m.y-P.pos.y,m.z-P.pos.z));placeMark(n,m.x,m.y,m.z,'◆','#ffc93c',(m.label?m.label+' · ':'')+d,'goal',d);return n+1;
}
function objMapMark(plot,c){
  const m=OBJ.mark;if(!m||!OBJ.text||!storySolo())return;const q=plot(m.x,m.z,true);if(!q)return;
  c.fillStyle='#ffc93c';c.strokeStyle='#0b0f1a';c.lineWidth=2;c.beginPath();c.moveTo(q[0],q[1]-11);c.lineTo(q[0]+9,q[1]);c.lineTo(q[0],q[1]+11);c.lineTo(q[0]-9,q[1]);c.closePath();c.fill();c.stroke();
}
// ---- a yes / no popup ----
// askYesNo(title,text,yesLabel,noLabel,onYes,onNo): a modal that pauses the game like a sheet (Y / Enter = yes, N / Esc = no, or click / tap). Returns false when it can't open.
let ASK=null;
function askYesNo(title,text,yesLabel,noLabel,onYes,onNo){
  if(ASK||state!=='play'||paused||!storySolo())return false;
  const root=el('div',{id:'ask',role:'dialog','aria-modal':'true'},el('div',{class:'ask-card panel'},el('div',{class:'ask-head',text:title}),el('p',{text}),
    el('div',{class:'ask-btns'},el('button',{type:'button',class:'go',onclick:()=>askClose(true)},el('kbd',{text:'Y'}),yesLabel||'Yes'),el('button',{type:'button',class:'ghost',onclick:()=>askClose(false)},el('kbd',{text:'N'}),noLabel||'No'))));
  return askShow(root,onYes,onNo);
}
// a gold info panel with one button (the UFO reward): askInfo(title,[text or {b:'bold line'} ...],buttonLabel,onClose)
function askInfo(title,lines,btn,onClose){
  if(ASK||state!=='play'||paused||!storySolo())return false;
  const ps=lines.map(l=>typeof l==='string'?el('p',{text:l}):el('p',{class:'bold',text:l.b}));
  return askShow(el('div',{id:'ask',role:'dialog','aria-modal':'true'},el('div',{class:'ask-card panel'},el('div',{class:'ask-head',text:title}),...ps,
    el('div',{class:'ask-btns'},el('button',{type:'button',class:'go',onclick:()=>askClose(true)},el('kbd',{text:'Y'}),btn||'Got it')))),onClose,onClose);
}
function askShow(root,onYes,onNo){
  document.body.appendChild(root);ASK={root,onYes,onNo};
  paused=true;mouseL=false;for(const k in keys)keys[k]=false;touchIn.x=touchIn.y=0;for(let i=0;i<4;i++)abilityUp(i,true);heldSlot=-1;webRelease();SFX.setLaser(false);SFX.setWind(0);SFX.setEngine(false,0);
  if(locked){manualUnlock=true;document.exitPointerLock();} // paused is set first, so letting go of the mouse doesn't open the pause menu
  const b=root.querySelector('.go');if(b)b.focus({preventScroll:true});
  return true;
}
function askClose(yes){ // yes: true / false / null (closed without an answer)
  const A=ASK;if(!A)return;ASK=null;A.root.remove();paused=false;if(save.settings.autoLock&&!touchOn())requestLock();
  try{if(yes===true&&A.onYes)A.onYes();else if(yes===false&&A.onNo)A.onNo();}catch(e){logErr(e);}
}
function askKey(e){
  if(e.ctrlKey||e.metaKey||e.altKey)return; // browser shortcuts pass
  if(e.repeat){e.preventDefault();e.stopImmediatePropagation();return;} // a held key (Enter opened this popup) must not answer it
  if(e.code==='KeyY'||e.code==='Enter'||e.code==='NumpadEnter')askClose(true);else if(e.code==='KeyN'||e.code==='Escape')askClose(false);
  if(['Space','Tab','Enter','Escape','ArrowUp','ArrowDown','KeyY','KeyN'].includes(e.code))e.preventDefault();e.stopImmediatePropagation(); // the game gets no keys while the popup is open
}
