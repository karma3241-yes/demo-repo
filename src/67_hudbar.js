// ================================================================
// HUD icon bar and the move list
// ================================================================
// A row of icons under your name, one per menu, each showing its key (like a game launcher's top bar). With the mouse locked,
// press the key; L frees the mouse to click them. On touch screens tap them. The CrazyGames build adds its rewards here
// (double XP, refill, try locked powers, cosmetics) instead of in the pause menu.
// The move list (right side) lists everything your hero can do. It is open for the first 2 minutes of each session;
// H or its icon shows or hides it, and once you choose it stays that way for the session.
const HUDBAR=[
  {id:'moves',glyph:'moves',key:'H',code:'KeyH',tip:'Move list',act:()=>toggleMoves(),on:()=>movesShown(),touch:false},
  {id:'skills',glyph:'skills',key:'K',code:'KeyK',tip:'Skills and upgrades',act:()=>sheetToggle('skills'),on:()=>sheetOpen==='skills',dot:()=>save.sp>0},
  {id:'powers',glyph:'swap',key:'J',code:'KeyJ',tip:()=>'Change powers'+(save.rechoiceAt?'':' · free the first time'),act:()=>{if(sheetOpen)closeSheet();tryRechoose();}},
  {id:'look',glyph:'shirt',key:'I',code:'KeyI',tip:'Appearance',act:()=>sheetToggle('look'),on:()=>sheetOpen==='look'},
  {id:'mp',glyph:'people',key:'6',code:'Digit6',tip:'Multiplayer',act:()=>sheetToggle('mp'),on:()=>sheetOpen==='mp'||MP.online()},
  {id:'set',glyph:'gear',key:'7',code:'Digit7',tip:'Settings',act:()=>sheetToggle('set'),on:()=>sheetOpen==='set'},
  {id:'lb',glyph:'trophy',key:'8',code:'Digit8',tip:'Leaderboard',act:()=>sheetToggle('lb'),on:()=>sheetOpen==='lb'},
  // CrazyGames build only
  {id:'xp',glyph:'x2',key:'9',code:'Digit9',portal:true,act:()=>Portal.rewardXP(),
    tip:()=>{const l=Portal.boostUntil-time;return l>0?'Double XP active · '+Math.ceil(l/60)+' min left':'Watch an ad: double XP for 5 min';},
    on:()=>Portal.boostUntil>time,off:()=>!Portal.on()||Portal.boostUntil>time},
  {id:'refill',glyph:'refill',key:'0',code:'Digit0',portal:true,act:()=>refill(),hide:()=>!refillInfo(),
    tip:()=>{const r=refillInfo();return !r?'':r.need?'Watch an ad: refill your '+r.m.label.toLowerCase():'Your '+r.m.label.toLowerCase()+' is full';},
    off:()=>{const r=refillInfo();return !Portal.on()||!r||!r.need;}},
  {id:'trials',glyph:'unlock',key:',',code:'Comma',portal:true,tip:'Try locked powers',act:()=>sheetToggle('trials'),on:()=>sheetOpen==='trials'},
  {id:'cos',glyph:'sparkle',key:'.',code:'Period',portal:true,tip:'Cosmetics',act:()=>sheetToggle('cos'),on:()=>sheetOpen==='cos'},
];
const HUDBAR_KEYS={};for(const b of HUDBAR)if(!b.portal||PBAL)HUDBAR_KEYS[b.code]=b;
const hbVal=(v)=>typeof v==='function'?v():v;
function sheetToggle(name){if(sheetOpen===name)closeSheet();else openSheet(name);}
let hudbarT=0;
function buildHudbar(){
  const bar=$('hudbar');if(!bar||bar.childElementCount)return;
  for(const b of HUDBAR){if(b.portal&&!PBAL)continue;
    const btn=el('button',{class:'hbtn',type:'button',id:'hb-'+b.id,onclick:e=>{e.stopPropagation();if(state==='play')b.act();}});
    btn.appendChild(glyph(b.glyph));btn.appendChild(el('kbd',{text:b.key}));btn.appendChild(el('i',{class:'dot'}));
    if(b.touch===false)btn.classList.add('kbm');bar.appendChild(btn);b.el=btn;}
  updateHudbar(true);
}
function updateHudbar(force){
  if(!force&&time-hudbarT<0.25)return;hudbarT=time;
  for(const b of HUDBAR){const e=b.el;if(!e)continue;const tip=hbVal(b.tip)||'';
    if(e.dataset.tip!==tip){e.dataset.tip=tip;e.setAttribute('aria-label',tip+' ('+b.key+')');}
    e.hidden=!!(b.hide&&b.hide());e.classList.toggle('on',!!(b.on&&b.on()));e.disabled=!!(b.off&&b.off());e.classList.toggle('badge',!!(b.dot&&b.dot()));}
  // sit just under the name panel, whatever its height
  const tl=document.querySelector('.hud-tl'),bar=$('hudbar');if(tl&&bar&&!touchOn()){const top=(tl.offsetTop+tl.offsetHeight+8)+'px';if(bar.style.top!==top)bar.style.top=top;}
}
// ---- move list ----
let movesUntil=0,movesChosen=false;
const movesShown=()=>!hud.keys.classList.contains('fade');
function showMovesForAWhile(){if(movesChosen)return;hud.keys.classList.remove('fade');movesUntil=time+120;}
function toggleMoves(){movesChosen=true;movesUntil=0;const show=!movesShown();hud.keys.classList.toggle('fade',!show);hud.keys.classList.toggle('pin',show);updateHudbar(true);}
function updateMoves(){if(movesUntil&&time>=movesUntil){movesUntil=0;if(!movesChosen){hud.keys.classList.add('fade');updateHudbar(true);}}}
