// ================================================================
// CrazyGames rewards: power keys by level, 10-minute trials, refills and cosmetics
// ================================================================
// Everything here is for the CrazyGames build (PBAL); the website and claude.ai never lock a key or show an ad button.
// Rewarded ads are always optional: nothing is out of reach without them, they only get you there sooner.
const KIT_LV=[1,2,4,6,9];                 // the level each power key (1-5) opens at
const TRIAL_MIN=10;
const slotLocked=i=>PBAL&&save.level<KIT_LV[i]&&!trialOn('key'+i);
function lockedSlotMsg(i){if(time-(P.lockMsgT||-9)<1)return;P.lockMsgT=time;const id=save.character.abilities[i];
  feed((POWERS[id]?POWERS[id].name:'This power')+' unlocks at LV '+KIT_LV[i],Portal.on()?'Pause → Try locked powers to use it now for '+TRIAL_MIN+' min':'Keep fighting to level up');SFX.tone('square',220,150,0.1,0.06);}
// ---- timed trials (one rewarded ad = 10 minutes) ----
function startTrial(k,label){
  Portal.show('rewarded',ok=>{if(!ok){toast('No ad right now','Try again in a little while','red');return;}
    save.trials=save.trials||{};save.trials[k]=Date.now()+TRIAL_MIN*60e3;persist();
    toast(label,'Yours for the next '+TRIAL_MIN+' minutes','gold');buildHotbar();buildTouchButtons();if(sheetOpen)renderSheet();});
}
const trialLeft=k=>trialOn(k)?Math.ceil((save.trials[k]-Date.now())/60e3):0;
let trialSeen='';
function updateTrials(){ // tell the player when a trial runs out, and redraw what it unlocked
  if(!PBAL||!save.trials)return;const now=Date.now();let gone='';
  for(const k in save.trials)if(save.trials[k]<=now){gone=k;delete save.trials[k];}
  if(gone){persist();feed('Trial over','Level up to unlock it for good');buildHotbar();buildTouchButtons();if(P.construct&&!conUnlocked().includes(P.construct.id))dismissConstruct();if(P.alien&&!aliensUnlocked().includes(P.alien.id))revertAlien(false);}
  const sig=Object.keys(save.trials).join();if(sig!==trialSeen){trialSeen=sig;buildHotbar();}
}
function renderTrials(){
  const B=sheetBody,ch=save.character;if(!ch)return;
  B.append(el('p',{class:'muted',text:'Watch a short ad to use something before you unlock it. Each trial lasts '+TRIAL_MIN+' minutes; levelling up unlocks it for good.'}));
  const row=(title,sub,k,label)=>{const left=trialLeft(k);const b=el('button',{class:left?'ghost':'go',type:'button',text:left?left+' min left':'Watch ad · '+TRIAL_MIN+' min',onclick:()=>startTrial(k,label)});b.disabled=!!left||!Portal.on();
    B.append(el('div',{class:'upg'},el('b',{text:title}),el('div',{class:'btns'},b),el('p',{text:sub})));};
  B.append(el('h3',{text:'Power keys'}));let any=false;
  ch.abilities.forEach((id,i)=>{if(save.level>=KIT_LV[i])return;any=true;row('Key '+(i+1)+' · '+POWERS[id].name,'Unlocks at LV '+KIT_LV[i],'key'+i,POWERS[id].name);});
  if(!any)B.append(el('p',{class:'muted',text:'All your power keys are unlocked.'}));
  const tv=ch.movement[0],tn=PRESETS[tv]?PRESETS[tv].name:POWERS[tv].name;
  B.append(el('h3',{text:'Traversal'}));
  if(masteryLevel(tv)>=MASTERY_MAX-0.01&&!trialOn('trav'))B.append(el('p',{class:'muted',text:'Your traversal is already mastered.'}));
  else row(tn+' at full mastery','Top speed, the full speed dial and the biggest constructs, right now','trav',tn+' mastered');
  B.append(el('h3',{text:'A power at LV 10'}));
  for(const id of ch.abilities){if(!POWERS[id]||(save.powerLevels[LEVEL_OF(id)]|0)>=CONFIG.powerMax)continue;row(POWERS[id].name+' at LV 10','Full strength and the biggest size for '+TRIAL_MIN+' minutes','lv:'+LEVEL_OF(id),POWERS[id].name+' LV 10');}
  if(isRing()||armorForms()){const arm=armorForms(),l=masteryLevel(arm?'armorFlight':'powerRing'),locked=CON_IDS.filter(id=>!!CONSTRUCTS[id].armor===arm&&CONSTRUCTS[id].unlock>l);
    if(locked.length){B.append(el('h3',{text:arm?'Suit forms':'Constructs'}));for(const id of locked)row(CONSTRUCTS[id].name,'Unlocks at mastery '+CONSTRUCTS[id].unlock,'con:'+id,CONSTRUCTS[id].name);}}
  if(hasPower('morphBand')){const lv=powerLevel('morphBand'),locked=ALIEN_IDS.filter(id=>ALIENS[id].unlock>lv);
    if(locked.length){B.append(el('h3',{text:'Aliens'}));for(const id of locked)row(ALIENS[id].name,'Unlocks at band LV '+ALIENS[id].unlock,'al:'+id,ALIENS[id].name);}}
}
// locked dial slots (constructs, suit forms, aliens) offer a trial on click
function dialTrial(a){if(!PBAL||!a||!a.trialKey)return false;if(!Portal.on()){feed(a.name+' is locked',a.lock);return true;}closeDial();startTrial(a.trialKey,a.name);return true;}
// ---- refill your hero's meter ----
function refillInfo(){const m=heroMeter();if(!m)return null;const cap=m.key==='ring'?100:meterCap(m);return {m,cap,need:save[m.key]<cap-0.5};}
function refill(){const r=refillInfo();if(!r||!r.need)return;
  Portal.show('rewarded',ok=>{if(!ok){toast('No ad right now','Try again in a little while','red');return;}save[r.m.key]=Math.max(save[r.m.key],r.cap);persist();toast(r.m.label.charAt(0)+r.m.label.slice(1).toLowerCase()+' refilled','','gold');renderPortalButtons();});}
// ---- cosmetics: glowing suits, trails, capes and auras (one ad each, yours for good) ----
const COSMETICS={
  suit:[{id:'neon',name:'Neon Circuit',col:[.3,.95,1]},{id:'solar',name:'Solar Flare',col:[1,.55,.15]},{id:'void',name:'Void Pulse',col:[.72,.35,1],pulse:true},{id:'toxic',name:'Toxic Glow',col:[.45,1,.3],pulse:true}],
  trail:[{id:'comet',name:'Comet',col:[.75,.9,1]},{id:'ember',name:'Ember',col:[1,.5,.12]},{id:'rainbow',name:'Rainbow',rainbow:true},{id:'spark',name:'Lightning',col:[1,.95,.4],spark:true}],
  cape:[{id:'royal',name:'Royal Gold',col:[.45,.06,.1],glow:[1,.8,.3]},{id:'night',name:'Night Sky',col:[.04,.05,.14],glow:[.8,.85,1],stars:true},{id:'lava',name:'Lava',col:[.2,.04,.02],glow:[1,.4,.08]},{id:'frost',name:'Frostbite',col:[.62,.85,1],glow:[.9,1,1]}],
  aura:[{id:'frost',name:'Frost',col:[.6,.85,1]},{id:'flame',name:'Flame',col:[1,.45,.12]},{id:'shadow',name:'Shadow',col:[.4,.15,.6]},{id:'gold',name:'Gold',col:[1,.82,.3]}],
};
const COS_KINDS={suit:'Glowing suits',trail:'Trails',cape:'Capes',aura:'Auras'};
function cleanCos(c){const o={own:[],eq:{suit:'',trail:'',cape:'',aura:''}};if(!c||typeof c!=='object')return o;
  const ok=(k,id)=>COSMETICS[k]&&COSMETICS[k].some(x=>x.id===id);
  if(Array.isArray(c.own))o.own=c.own.filter(s=>typeof s==='string'&&ok(s.split(':')[0],s.split(':')[1])).slice(0,64);
  if(c.eq&&typeof c.eq==='object')for(const k in o.eq)if(ok(k,c.eq[k])&&o.own.includes(k+':'+c.eq[k]))o.eq[k]=c.eq[k];return o;}
const cosOf=(k,id)=>COSMETICS[k].find(x=>x.id===id)||null;
// what someone is wearing: you (CrazyGames build only) or another player (from their presence)
function cosFor(s){if(s===P)return PBAL&&save.cos?save.cos.eq:null;return s.cs||null;}
function cosPresence(){if(!PBAL||!save.cos)return null;const e=save.cos.eq;return e.suit||e.trail||e.cape||e.aura?[e.suit,e.trail,e.cape,e.aura]:null;}
function cosFromPresence(a){if(!Array.isArray(a))return null;const k=['suit','trail','cape','aura'],o={};k.forEach((n,i)=>{o[n]=typeof a[i]==='string'&&cosOf(n,a[i])?a[i]:'';});return o;}
function renderCosmetics(){
  const B=sheetBody;save.cos=save.cos||cleanCos(null);const C=save.cos;
  B.append(el('p',{class:'muted',text:'Watch a short ad to unlock an item for good, then wear it. Other players in your room see it too.'}));
  for(const k in COSMETICS){B.append(el('h3',{text:COS_KINDS[k]}));
    for(const it of COSMETICS[k]){const own=C.own.includes(k+':'+it.id),on=C.eq[k]===it.id;
      const b=el('button',{class:own?(on?'ghost':'go'):'go',type:'button',text:own?(on?'Take off':'Wear'):'Watch ad · unlock'});b.disabled=!own&&!Portal.on();
      b.onclick=()=>{if(own){C.eq[k]=on?'':it.id;persist();MP.bump();renderSheet();return;}
        Portal.show('rewarded',ok=>{if(!ok){toast('No ad right now','Try again in a little while','red');return;}if(!C.own.includes(k+':'+it.id))C.own.push(k+':'+it.id);C.eq[k]=it.id;persist();MP.bump();toast(it.name+' unlocked','It\'s yours to keep','gold');renderSheet();});};
      const sw=el('i',{class:'cos-sw'});const col=it.glow||it.col;sw.style.background=it.rainbow?'linear-gradient(90deg,#f44,#fd4,#4f6,#4cf,#a4f)':'rgb('+col.map(v=>Math.round(v*255)).join(',')+')';
      B.append(el('div',{class:'upg'},el('b',{},sw,it.name),el('div',{class:'btns'},b)));}}
}
// drawn on top of a hero (called from drawSuper with its body matrix)
function drawCosmetics(s,body,isPlayer){
  const e=cosFor(s);if(!e||GHOST)return;const t=time;
  const su=e.suit&&cosOf('suit',e.suit);
  if(su){const p=su.pulse?0.6+0.4*Math.sin(t*4):1,c=[su.col[0]*p,su.col[1]*p,su.col[2]*p,1];
    for(const x of [-0.24,0.24])queue(MESH.glowBox,child(body,x,0.55,0.235,0,0,0,0.04,0.8,0.01),c,0);
    queue(MESH.glowBox,child(body,0,0.3,0.235,0,0,0,0.5,0.04,0.01),c,0);queue(MESH.glowBox,child(body,0,0.82,0.235,0,0,0.785,0.18,0.18,0.01),c,0);
    for(const x of [-0.2,0.2])queue(MESH.glowBox,child(body,x,0.55,-0.235,0,0,0,0.04,0.8,0.01),c,0);}
  const au=e.aura&&cosOf('aura',e.aura);
  if(au){const g=2+Math.sin(t*3)*0.12;queue(MESH.glowSphere,child(body,0,0.4,0,0,t,0,g*0.7,g,g*0.7),[au.col[0],au.col[1],au.col[2],0.12],F_ADD);
    if(!paused&&Math.random()<0.35){const m=child(body,rr(-.5,.5),rr(-1,1.2),rr(-.4,.4));emit(m[12],m[13],m[14],rr(-.4,.4),rr(.6,1.6),rr(-.4,.4),rr(0.5,0.9),au.col,rr(0.25,0.5),au.id==='shadow'?0:-1,1);}}
  const tr=e.trail&&cosOf('trail',e.trail),v=s.vel?s.vel.len():0;
  if(tr&&v>18&&!paused){const n=Math.min(4,1+Math.floor(v/40));for(let i=0;i<n;i++){const col=tr.rainbow?hsl((t*0.5+i*0.07)%1):tr.col;
    emit(s.pos.x+rr(-.3,.3),s.pos.y+1.3+rr(-.3,.3),s.pos.z+rr(-.3,.3),-s.vel.x*0.05,-s.vel.y*0.05,-s.vel.z*0.05,tr.spark?0.25:0.7,col,tr.spark?rr(0.3,0.6):rr(0.5,0.9),0,tr.spark?2:1);}}
}
function hsl(h){const f=n=>{const k=(n+h*12)%12;return 0.5-0.5*Math.max(-1,Math.min(k-3,9-k,1));};return [f(0),f(8),f(4)];}
// a cape cosmetic recolours the cape and adds a glowing hem (called per cape segment)
function capeCos(s){const e=cosFor(s);return e&&e.cape?cosOf('cape',e.cape):null;}
save.cos=cleanCos(save.cos);
// new power keys open as you level up
let kitLvSeen=save.level;
Bus.on('levelUp',lv=>{if(!PBAL)return;KIT_LV.forEach((l,i)=>{if(l>kitLvSeen&&l<=lv&&save.character){const id=save.character.abilities[i];toast('Key '+(i+1)+' unlocked',(POWERS[id]?POWERS[id].name:'A new power')+' is ready','gold');}});kitLvSeen=lv;buildHotbar();buildTouchButtons();});
