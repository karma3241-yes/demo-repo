// ================================================================
// Touch controls (phones and tablets, played sideways)
// ================================================================
// Left thumb: a joystick that appears wherever it lands (a faint one shows where to start). Right thumb: drag anywhere
// free to look. The buttons sit in rings around PUNCH in the bottom-right corner, like Roblox:
//   ring A (closest): JUMP, your traversal (FLY, WEB, RUN, DIVE), BOOST (hold = Shift) and LOCK. While flying JUMP turns into UP
//                     and FLY into LAND (same spot), DOWN takes LOCK's slot and LOCK moves to the outer ring.
//   ring B: your four powers (the next locked one greyed out with its level), or an alien's powers.
//   ring C (and D when it fills up): buttons that come and go with what you're doing: the Build button (ring / suit, always on top), USE (get in a car, help
//                     someone up, eat...), the wheel (V on a keyboard), OATH, GROW/SHRINK while you hold a power or
//                     sit in a construct, and so on.
// Settings has the button size and a left-handed layout (everything mirrored). In portrait a "turn your phone" screen
// covers the game.
// no page zoom: pinch (iOS gesture events) and ctrl+wheel; the viewport meta and touch-action in the CSS cover the rest
for(const g of ['gesturestart','gesturechange','gestureend'])addEventListener(g,e=>e.preventDefault());
addEventListener('wheel',e=>{if(e.ctrlKey)e.preventDefault();},{passive:false});
const tl=$('tlayer'),stick=$('stick'),knob=$('knob'),tbtns=$('tbtns');let stickId=null,lookId=null,sx0=0,sy0=0,lx=0,ly=0;
const tHand=()=>save.settings.tHand==='l'?'l':'r',tSizeMul=()=>({s:0.86,m:1,l:1.16})[save.settings.tSize]||1;
// the phone's notch and rounded corners (CrazyGames app, iOS): read from a probe padded by env(safe-area-inset-*)
const safeIn=k=>{const p=$('safeprobe');if(!p)return 0;const v=parseFloat(getComputedStyle(p)['padding'+{t:'Top',r:'Right',b:'Bottom',l:'Left'}[k]]);return isFinite(v)?v:0;};
// how big the controls are on this screen (phones ~0.9, tablets up to 1.3), times the Settings size
const tScale=()=>clamp(Math.min(innerHeight/400,innerWidth/760),0.8,1.3)*tSizeMul();
tl.addEventListener('pointerdown',e=>{if(state!=='play'||paused)return;e.preventDefault();audioWake();
  const left=tHand()==='l'?e.clientX>innerWidth*0.55:e.clientX<innerWidth*0.45;
  if(left&&stickId===null){stickId=e.pointerId;sx0=e.clientX;sy0=e.clientY;stick.style.left=sx0+'px';stick.style.top=sy0+'px';stick.classList.add('on');}
  else if(lookId===null){lookId=e.pointerId;lx=e.clientX;ly=e.clientY;}
  try{tl.setPointerCapture(e.pointerId);}catch(err){}});
tl.addEventListener('pointermove',e=>{
  if(e.pointerId===stickId){let dx=e.clientX-sx0,dy=e.clientY-sy0;const l=Math.hypot(dx,dy),R=56*tScale();if(l>R){dx*=R/l;dy*=R/l;}knob.style.transform=`translate(${dx}px,${dy}px)`;touchIn.x=dx/R;touchIn.y=-dy/R;}
  else if(e.pointerId===lookId){look(e.clientX-lx,e.clientY-ly,2.2);lx=e.clientX;ly=e.clientY;}});
const endTouch=e=>{if(e.pointerId===stickId){stickId=null;touchIn.x=touchIn.y=0;knob.style.transform='';stick.classList.remove('on');placeStick();}if(e.pointerId===lookId)lookId=null;};
tl.addEventListener('pointerup',endTouch);tl.addEventListener('pointercancel',endTouch);
// the faint resting joystick (bottom-left, or bottom-right when left-handed)
function placeStick(){const k=tScale(),R=54*k;stick.style.width=stick.style.height=R*2+'px';stick.style.margin=-R+'px 0 0 '+(-R)+'px';knob.style.width=knob.style.height=52*k+'px';knob.style.margin=-26*k+'px 0 0 '+(-26*k)+'px';
  if(stickId!==null)return;const x=(tHand()==='l'?safeIn('r'):safeIn('l'))+R+30*k,y=innerHeight-safeIn('b')-R-26*k;stick.style.left=(tHand()==='l'?innerWidth-x:x)+'px';stick.style.top=y+'px';}
function bindTouchBtn(b,act){
  b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();audioWake();try{b.setPointerCapture(e.pointerId);}catch(err){}b.classList.add('down');touchAct(b.dataset.act||act,true);});
  const up=()=>{if(!b.classList.contains('down'))return;b.classList.remove('down');touchAct(b.dataset.act||act,false);};
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('contextmenu',e=>e.preventDefault());b._up=up;
}
bindTouchBtn($('tpause'),'pause');
// ---- the buttons ----
// every button this hero could need is made once (buildTouchButtons); layoutTouch shows the ones that fit what you're
// doing right now and places them on the rings
let TB={},tbSig='',tbT=-9;
function tbMake(id,act,icon,label,ring,cls,col){
  const b=el('button',{type:'button',class:'tb '+(cls||''),'aria-label':label||id,'data-act':act});
  if(icon instanceof Element)b.appendChild(icon);else if(icon){const g=glyph(icon);if(col)g.style.color=col;b.appendChild(g);}
  if(label)b.appendChild(el('small',{text:label,class:label.length>5?'long':null}));
  b.hidden=true;bindTouchBtn(b,act);tbtns.appendChild(b);TB[id]={b,ring,id};return b;}
function buildTouchButtons(){
  for(const k in TB){const t=TB[k];if(t.b.classList.contains('down'))t.b._up();}
  tbtns.textContent='';TB={};tbSig='';if(!save.character)return;
  tbMake('punch','punch','fist','','P','big');
  tbMake('jump','jump','jump','','A0','jmp');tbMake('down','down','down','','A3','jmp');tbMake('drift','jump','drift','Drift','A0','jmp');tbMake('exit','use','hand','Get out','A1','use');
  tbMake('up','jump','up','','A0','jmp');tbMake('fly','fly','wing','Fly','A1','trav');tbMake('web','web','web','Web','A1','trav');
  tbMake('run','speed','run','Run','A1','trav');tbMake('dive','down','dive','Dive','A1','trav');
  tbMake('boost','speed','run','Boost','A2','trav');tbMake('lock','lock','target','Lock','A3','lk');
  if(PR.on)prTouchButtons();
  else if(SG.on)sgTouchButtons();
  else if(P.alien)ALIENS[P.alien.id].abilities.forEach((ab,i)=>tbMake('p'+i,'a'+i,'burst',ab.name.split(' ').pop(),'B','ab alien','#c89bff'));
  else save.character.abilities.forEach((id,i)=>{const lk=PBAL&&slotLocked(i);
    if(lk&&i!==nextLockedSlot())return;
    const b=tbMake('p'+i,'a'+i,powerIcon(id),lk?'LV '+KIT_LV[i]:SHORT[id]||POWERS[id].name.split(' ')[0],'B','ab'+(lk?' lockd':''));b.prepend(el('i',{class:'cd',hidden:true}));});
  // ring C, in the order they should sit (nearest the top first)
  tbMake('land','fly','land','Land','A1','trav');tbMake('flyx','fly','wing','Fly','C');tbMake('use','use','hand','Use','C','use');
  tbMake('grow','grow','grow','Grow','C');tbMake('shrink','shrink','shrink','Shrink','C');
  tbMake('alt','alt','star','Alt','C');tbMake('cx','cx','burst','Special','C');tbMake('tkmore','tkmore','orbit','Grab+','C');
  // the V button: one wheel button for every hero that has a V (or B) action; its label follows vAction() (it keeps the top slot of the ring)
  {const v=vAction();tbMake('wheel','vkey',v?v.icon:'wheel',v?v.name:'Wheel','C');}
  tbMake('oath','oath','oath','Oath','C');tbMake('rebuild','rebuild','rebuild','Rebuild','C');
  tbMake('fast','fast','run','Fast','C');tbMake('phase','phase','phase','Walls','C');tbMake('dial','dialcycle','dialUp','Dial','C');
  tbMake('suit','suit','shirt','Suit','C');tbMake('rewind','rewind','rewind','Rewind','C');tbMake('destroy','destroy','burst','Destroy','C','dz','#ff8aa8');
  {const b=tbMake('asc','asc','sparkle','Ascend','C','prismb');b.prepend(el('i',{class:'cd',hidden:true}));}
  layoutTouch(true);
}
// which buttons fit what you're doing right now
function tbWanted(){
  const on=new Set();if(!save.character||P.dead)return on;const m=save.character.movement[0],con=!!P.construct,fly=!!P.flying,flyer=hasPower('flight')||(P.alien&&alienDef().flies)||(!P.alien&&invFlyOk()); // (the invasion lets every hero fly, so the Fly button shows for them too)
  if(P.car){on.add('drift');on.add('exit');return on;}
  if(oathOpen&&!oathFree){on.add('oath');return on;} // typing the oath: you hang still, so only OATH (to put it away) stays
  on.add('punch');on.add('boost');on.add('lock');
  if(fly){on.add('down');on.add('up');if(!P.alien)on.add('land');}else{on.add('jump');
    if(P.swim)on.add('dive');else if(!P.alien&&m==='webSwing')on.add('web');else if(!P.alien&&m==='superSpeed')on.add('run');else if(flyer)on.add('fly');
    if(!P.swim&&!P.alien&&invFlyOk()&&!hasPower('flight')&&(m==='webSwing'||m==='superSpeed'))on.add('flyx');} // web and run heroes already use the traversal slot, so their invasion Fly goes to ring C
  for(let i=0;i<4;i++)if(TB['p'+i])on.add('p'+i);
  if(nearestInteract())on.add('use');
  if(P.alien||SG.on||PR.on){if(!PR.on&&!arenaSG())on.add('wheel');if(!PR.on)on.add('asc');return on;} // (Ascend: always there, in a Sun God or an alien form too)
  if(heldSlot>=0||con){on.add('grow');on.add('shrink');}
  if(con){on.add('alt');on.add('cx');}
  if(P.tk)on.add('tkmore');
  if(vAction())on.add('wheel');
  if(isRing()&&!con){on.add('oath');on.add('rebuild');}else if(isStrongest()&&!con)on.add('rebuild');
  if(isSpeed()){on.add('fast');on.add('phase');on.add('dial');}
  if(!con)on.add('suit');
  if(rewindOn())on.add('rewind');
  if(destroyAvail())on.add('destroy');
  on.add('asc');
  return on;
}
const TB_ORDER_C=['wheel','lock','use','flyx','grow','shrink','alt','cx','tkmore','oath','rebuild','fast','phase','dial','suit','rewind','destroy','asc'];
function layoutTouch(force){
  if(!touchOn()||state!=='play')return;
  if(!force&&time-tbT<0.15)return;tbT=time;
  {const v=vAction(),w=TB.wheel,sm=w&&w.b.querySelector('small');if(v&&sm&&sm.textContent!==v.name){sm.textContent=v.name;sm.className=v.name.length>5?'long':'';w.b.setAttribute('aria-label',v.name);}} // label follows vAction (Put away / Revert)
  const on=tbWanted(),W=innerWidth,H=innerHeight,k=tScale(),hand=tHand();
  const sig=[...on].join()+'|'+W+'x'+H+'|'+k+hand;if(sig===tbSig)return;tbSig=sig;
  const side=hand==='l'?safeIn('l'):safeIn('r'),sb=safeIn('b'),st=safeIn('t');
  const Pz=78*k,cx=W-side-14*k-Pz/2,cy=H-sb-14*k-Pz/2,minY=st+52; // keep clear of the icon bar
  const put=(t,x,y,sz)=>{const b=t.b;b.hidden=false;b.style.width=b.style.height=sz+'px';b.style.left=(hand==='l'?W-x:x)-sz/2+'px';b.style.top=y-sz/2+'px';b.style.fontSize=Math.max(9.5,Math.round(10*k))+'px';b.style.setProperty('--s',sz+'px');};
  const at=(r,deg)=>[cx+r*Math.cos(deg*Math.PI/180),cy-r*Math.sin(deg*Math.PI/180)];
  for(const id in TB){const t=TB[id];if(!on.has(id)){if(!t.b.hidden&&t.b.classList.contains('down'))t.b._up();t.b.hidden=true;}}
  if(on.has('punch'))put(TB.punch,cx,cy,Pz);
  const A=112*k,ringA={A0:[180,62*k],A1:[148,56*k],A2:[118,52*k],A3:[88,52*k]};
  if(TB.lock)TB.lock.ring=on.has('down')?'C':'A3'; // flying: DOWN takes LOCK's slot, LOCK moves out
  for(const id in TB){const t=TB[id];if(!on.has(id)||!ringA[t.ring])continue;const [d,sz]=ringA[t.ring];const [x,y]=at(A,d);put(t,x,y,sz);}
  // the powers share ring B, evenly from straight up to straight left
  const ps=[0,1,2,3,4].map(i=>'p'+i).filter(id=>on.has(id)),B=184*k,bs=58*k;
  ps.forEach((id,i)=>{const d=ps.length>1?90+i*90/(ps.length-1):135;const [x,y]=at(B,d);put(TB[id],x,y,PR.on?bs*1.2:bs);}); // the Prism form's skills are a little bigger
  // ring C packs the rest from the top down, spilling into ring D
  let r=252*k,d=-1;const cs=48*k,step=r=>2*Math.asin(Math.min(1,(cs+8*k)/(2*r)))*180/Math.PI;
  for(const id of TB_ORDER_C){if(!on.has(id)||TB[id].ring!=='C')continue;
    for(let guard=0;guard<40;guard++){
      if(d<0){d=86;while(d<200&&at(r,d)[1]-cs/2<minY)d+=2;}
      if(d>190){r+=cs+12*k;d=-1;continue;}
      const [x,y]=at(r,d);if(x-cs/2<W*0.47){r+=cs+12*k;d=-1;continue;}
      put(TB[id],x,y,cs);d+=step(r);break;}}
}
// the left column (name, meters, minimap, Getting started or the grow tip) stacks itself, so a taller panel (a wanted
// badge, a bounty) pushes the rest down instead of covering it
const LEFT_COL=['.hud-tl','#guide','#growtut','#goal','#map'];let leftT=-9;
function stackLeft(on){if(!on){for(const q of LEFT_COL){const e=document.querySelector(q);if(e)e.style.top='';}return;}
  if(time-leftT<0.25)return;leftT=time;let y=safeIn('t')+10;
  for(const q of LEFT_COL){const e=document.querySelector(q);if(!e||e.hidden||getComputedStyle(e).display==='none')continue;const t=Math.round(y)+'px';if(e.style.top!==t)e.style.top=t;y+=e.offsetHeight+8;}}
// per frame: cooldowns, toggles that are on, and the USE button's label
function updateTouchHud(){
  if(!touchOn()||state!=='play')return;layoutTouch(false);stackLeft(true);
  if(!save.character||P.alien||SG.on||PR.on)return;
  save.character.abilities.forEach((id,i)=>{const t=TB['p'+i];if(!t||t.b.hidden||t.b.classList.contains('lockd'))return;const st=PS[id],c=POWERS[id],cd=t.b.querySelector('.cd');
    if(cd){const f=c.cooldown?st.cd/pstat(id,'cooldown'):0,v=Math.round(clamp(f,0,1)*100);if(t.cdv!==v){t.cdv=v;cd.style.setProperty('--p',v+'%');cd.hidden=v<=0;}}
    t.b.classList.toggle('on',!!(st.holding||(id==='energyShield'&&P.shieldOn)||(id==='ringShield'&&P.ringShield)||(id==='telekinesis'&&P.tk)||(id==='invisibility'&&P.cloak)||(id==='slowTime'&&P.slowOn)||((id==='metalSkin'||id==='metalForms')&&P.metal)));});
  if(TB.use&&!TB.use.b.hidden){const it=nearestInteract(),lab=!it?'Use':it.kind==='exit'?'Get out':it.kind==='car'?(it.v.driver?'Take':'Get in'):it.kind==='eat'?'Eat':it.kind==='storm'?'Storm':'Help';
    if(TB.use.lab!==lab){TB.use.lab=lab;TB.use.b.querySelector('small').textContent=lab;}}
  if(TB.fast)TB.fast.b.classList.toggle('on',!!P.fastMode);if(TB.phase)TB.phase.b.classList.toggle('on',!!P.phasing);
}
function touchAct(a,down){
  if(a==='pause'){if(down&&state==='play')setPaused(true);return;}
  if(down&&!canAct())return;
  if(dialOpen)return;
  if(a==='punch'){if(P.car)return;if(sgArena()){sgClick(down);return;}if(P.construct){if(down)constructPrimary();else constructPrimaryUp();return;}if(down&&P.tk&&tkSlam())return;if(down&&chargeStart())return;if(!down&&P.cp){chargeRelease();mouseL=false;return;}mouseL=down;if(down)punch();}
  else if(/^a[0-3]$/.test(a)){if(P.car)return;const i=+a[1];if(down){heldSlot=i;abilityDown(i);if(!slotLocked(i))guideDone('ability');}else{if(heldSlot===i)heldSlot=-1;abilityUp(i);}}
  else if(a==='con'){if(down)summonConstruct();}
  else if(a==='vkey'){if(down)vPress();}
  else if(a==='destroy'){if(down)destroyKey();}
  else if(a==='asc'){if(down)prismHoldStart('touch');else prismHoldEnd();}
  else if(a==='oath'){if(oathHoldMode()){if(down)holdOathStart('touch');else holdOathStop();}else if(down){if(ringLocked())closeOath();else openOath();}}
  else if(a==='alt'){constructAlt(down);}
  else if(a==='cx'){if(down)constructX();}
  else if(a==='rebuild'){if(openerY(down))return;if(down)ringRebuild();}
  else if(a==='grow'||a==='shrink'){if(down)growStep(a==='grow'?1:-1);}
  else if(a==='jump'){keys.Space=down;if(down)pressJump();else releaseJump();}
  else if(a==='speed')keys.ShiftLeft=down;
  else if(a==='down')keys.KeyC=down;
  else if(a==='fly'){if(down){if(!flyChargeStart())toggleFlight();}else flyChargeRelease();}
  else if(a==='web'){if(down)webPress();else webRelease();}
  else if(a==='use'){if(down)interact();}
  else if(a==='fast'){if(down)toggleFastMode();}
  else if(a==='tkmore'){if(down)tkGrabMore();}
  else if(a==='suit'){if(down)suitToggle();}
  else if(a==='phase'){if(down)togglePhase();}
  else if(a==='dialup'){if(down)turnDial(1);}
  else if(a==='dialdn'){if(down)turnDial(-1);}
  // one touch button for the speed dial: each tap is one step faster, and past the top it starts again at x1 (in Slow Time: slower)
  else if(a==='dialcycle'){if(down){if(P.slowOn)turnDial(1);else if((P.dial|0)>=dialMax()){P.dial=1;feed('Speed dial x1','Tap DIAL to go faster');}else turnDial(1);}}
  else if(a==='rewind'){if(down)rewind();}
  else if(a==='lock'){if(down)lockToggle();}
}
function applyTouchUI(){const t=touchOn();document.body.classList.toggle('touch',t);document.body.classList.toggle('lefty',t&&tHand()==='l');$('touch').hidden=!(t&&state==='play');$('menu-controls').hidden=t;$('menu-touch').hidden=!t;
  if(t){$('menu-touch').textContent=(tHand()==='l'?'Right side: move · left side: look':'Left side: move · right side: look')+' · buttons: fight and fly.';placeStick();tbSig='';layoutTouch(true);leftT=-9;}else stackLeft(false);checkOrient();}
addEventListener('resize',()=>{if(touchOn()){placeStick();layoutTouch(true);}checkOrient();});
// ---- phones are played sideways: in portrait a screen asks you to turn the phone (and the game pauses) ----
function checkOrient(){const r=$('rotate');if(!r)return;const p=IS_TOUCH_DEVICE&&innerHeight>innerWidth*1.05;r.hidden=!p;
  if(p&&state==='play'&&!paused&&!creating)setPaused(true);
  if(!p)autoStart();} // a first visit held back in portrait starts once the phone is turned
addEventListener('orientationchange',()=>setTimeout(checkOrient,250));
// ---- iOS stops the sound after a call, the lock screen or another app: start it again on the next touch ----
function audioWake(){const c=SFX.ctx;if(c&&c.state!=='running'&&c.resume)c.resume().catch(()=>{});}
// sound starts on the first click, tap or key (an auto-started game has had none yet): SFX.init() builds the audio graph once and wakes it
for(const ev of ['pointerdown','keydown']){const h=()=>{removeEventListener(ev,h,true);try{SFX.init();}catch(e){logErr(e);}audioWake();};addEventListener(ev,h,true);}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)audioWake();});
addEventListener('pointerdown',audioWake,{passive:true});
