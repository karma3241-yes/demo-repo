// ================================================================
// HUD icon bar and the move list
// ================================================================
// A row of icons under your name, one per menu, each showing its key (like a game launcher's top bar). With the mouse locked,
// press the key; L frees the mouse to click them. On touch screens tap them. The CrazyGames build adds its rewards here
// (double XP, refill, try locked powers, cosmetics) instead of in the pause menu.
// The move list (right side) lists everything your hero can do. It starts closed, so the first thing you see is the city
// ("Getting started" teaches the basics and points to it); H or its icon shows or hides it. It lays out in two columns
// and shrinks to fit (folding "Getting started" down to its next step if it has to), so it never needs scrolling.
// The leaderboard sits under the icons on the left (the full board opens from it, the main menu or the pause menu).
// The CrazyGames build has no leaderboard at all: the shared board lives on claude.ai, and pointing players there is cross-promotion.
const rewardsLater=()=>{const st=save.stats||{};return BASIC_LAUNCH||!(st.crimesStopped||st.crimesCommitted||save.level>1);};
const HUDBAR=[
  {id:'moves',glyph:'moves',key:'H',code:'KeyH',tip:'Move list',act:()=>toggleMoves(),on:()=>movesShown(),touch:false},
  {id:'skills',glyph:'skills',key:'K',code:'KeyK',tip:'Skills and upgrades',act:()=>sheetToggle('skills'),on:()=>sheetOpen==='skills',dot:()=>save.sp>0},
  {id:'powers',glyph:'swap',key:'J',code:'KeyJ',tip:()=>'Change powers'+(save.rechoiceAt?'':' · free the first time'),act:()=>{if(sheetOpen)closeSheet();tryRechoose();}},
  {id:'look',glyph:'shirt',key:'I',code:'KeyI',tip:'Appearance',act:()=>sheetToggle('look'),on:()=>sheetOpen==='look'},
  {id:'mp',glyph:'people',key:'6',code:'Digit6',tip:'Multiplayer',act:()=>sheetToggle('mp'),on:()=>sheetOpen==='mp'||MP.online()},
  {id:'set',glyph:'gear',key:'7',code:'Digit7',tip:'Settings',act:()=>sheetToggle('set'),on:()=>sheetOpen==='set'},
  {id:'unlocks',glyph:'steps',key:'8',code:'Digit8',tip:'What you unlock',act:()=>sheetToggle('unlocks'),on:()=>sheetOpen==='unlocks'},
  // CrazyGames build only. The rewards appear once you've dealt with your first crime (or reached LV 2), so the opening
  // screen stays calm
  {id:'xp',glyph:'x2',key:'9',code:'Digit9',portal:true,act:()=>Portal.rewardXP(),hide:()=>rewardsLater(),
    tip:()=>{const l=Portal.boostUntil-time;return l>0?'Double XP active · '+Math.ceil(l/60)+' min left':'Watch an ad: double XP for 5 min';},
    on:()=>Portal.boostUntil>time,off:()=>!Portal.ads()||Portal.boostUntil>time},
  {id:'refill',glyph:'refill',key:'0',code:'Digit0',portal:true,act:()=>refill(),hide:()=>rewardsLater()||!refillInfo(),
    tip:()=>{const r=refillInfo();return !r?'':r.need?'Watch an ad: refill your '+r.m.label.toLowerCase():'Your '+r.m.label.toLowerCase()+' is full';},
    off:()=>{const r=refillInfo();return !Portal.ads()||!r||!r.need;}},
  {id:'trials',glyph:'unlock',key:',',code:'Comma',portal:true,tip:'Try locked powers',act:()=>sheetToggle('trials'),hide:()=>rewardsLater(),on:()=>sheetOpen==='trials'},
  {id:'cos',glyph:'sparkle',key:'.',code:'Period',portal:true,tip:'Cosmetics',act:()=>sheetToggle('cos'),hide:()=>rewardsLater(),on:()=>sheetOpen==='cos'},
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
  updateLBMini();
}
// ---- the leaderboard panel (left, under the icons) ----
let lbMiniKey='',lbMiniTop=-1;
function lbRows(tab){
  if(LB.db)return LB.lists[tab]||[];
  let rows=save.character?[{id:'me',name:save.character.name,level:save.level,rep:save.reputation}]:[];
  if(tab==='respected')rows=rows.filter(r=>r.rep>0);if(tab==='feared')rows=rows.filter(r=>r.rep<0);return rows;
}
const LB_TABS=[['respected','Respected'],['feared','Feared'],['level','Level']];
function updateLBMini(force){
  const box=$('lbmini');if(!box)return;
  if(PBAL||touchOn()||state!=='play'){box.hidden=true;return;} // touch screens: Leaderboard is in the pause menu; CrazyGames: no shared board there
  const bar=$('hudbar'),top=bar.offsetTop+bar.offsetHeight+8,room=innerHeight-top-212; // 212: the minimap below it
  if(room<70){box.hidden=true;return;}box.hidden=false;
  if(top!==lbMiniTop){lbMiniTop=top;box.style.top=top+'px';}
  const max=clamp(Math.floor((room-52)/19),1,5),rows=lbRows(lbTab).slice(0,max);
  const key=lbTab+'|'+max+'|'+rows.map(r=>r.id+':'+r.name+':'+r.level+':'+r.rep).join(',')+'|'+(LB.uid||'');
  if(!force&&key===lbMiniKey)return;lbMiniKey=key;box.textContent='';
  const open=e=>{e.stopPropagation();if(state==='play')openSheet('lb');};
  box.appendChild(el('button',{type:'button',class:'lbm-head',onclick:open,title:'Open the full leaderboard'},glyph('trophy'),el('b',{text:'Leaderboard'})));
  box.appendChild(el('div',{class:'lbm-tabs'},...LB_TABS.map(([k,l])=>el('button',{type:'button','aria-pressed':String(lbTab===k),text:l,onclick:e=>{e.stopPropagation();lbTab=k;updateLBMini(true);}}))));
  if(!rows.length){box.appendChild(el('p',{class:'lbm-none',text:LB.db?'Nobody here yet':'Shared board on claude.ai'}));return;}
  const ol=el('ol');rows.forEach((r,i)=>ol.appendChild(el('li',{class:(r.id===LB.uid||r.id==='me')?'me':''},el('i',{text:String(i+1)}),el('span',{text:r.name}),
    el('b',{text:lbTab==='level'?'LV '+r.level:(r.rep>0?'+':'')+r.rep.toLocaleString('en-US')}))));
  box.appendChild(ol);
}
// ---- move list ----
const movesShown=()=>!hud.keys.classList.contains('fade');
function toggleMoves(){const show=!movesShown();hud.keys.classList.toggle('fade',!show);hud.keys.classList.toggle('pin',show);fitMoves();updateHudbar(true);}
let fitT=0;
function updateMoves(){if(time-fitT>1)fitMoves();}
// fit the whole list on screen: place it under "Getting started", then fold that down to its next step, then use the tight rows
function fitMoves(){
  fitT=time;const k=hud.keys,g=$('guide');if(!k)return;
  const shown=movesShown()&&getComputedStyle(k).display!=='none';
  if(!shown){if(g.classList.contains('mini'))g.classList.remove('mini');return;}
  const place=()=>{const top=g.hidden?96:g.offsetTop+g.offsetHeight+8;k.style.top=top+'px';k.style.maxHeight=Math.max(120,innerHeight-top-150)+'px';};
  const over=()=>k.scrollHeight>k.clientHeight+1;
  g.classList.remove('mini');k.classList.remove('tight');place();
  if(over()&&!g.hidden){g.classList.add('mini');place();}
  if(over())k.classList.add('tight');
}
addEventListener('resize',()=>fitMoves());
// if it still can't fit (a very small window), the wheel scrolls it while the mouse is free, without also resizing a power
document.getElementById('keys').addEventListener('wheel',e=>{const k=e.currentTarget;if(k.scrollHeight>k.clientHeight+1)e.stopPropagation();},{passive:true});
