// ================================================================
// HUD
// ================================================================
const $=id=>document.getElementById(id);
function el(tag,attrs={},...kids){
  const e=document.createElement(tag);
  for(const k in attrs){const v=attrs[k];if(v===null||v===undefined||v===false)continue;
    if(k==='text')e.textContent=v;else if(k==='class')e.className=v;else if(k==='style')e.setAttribute('style',v);
    else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v===true?'':v);}
  for(const c of kids)if(c)e.appendChild(typeof c==='string'?document.createTextNode(c):c);
  return e;
}
const hud={root:$('hud'),hname:$('hname'),htier:$('htier'),lvl:$('lvl'),xpb:$('xpb'),rep:$('rep'),sp:$('sp'),spwrap:$('spwrap'),bounty:$('bounty'),wanted:$('wanted'),
  clock:$('clock'),mode:$('mode'),hpb:$('hpb'),hpt:$('hpt'),enb:$('enb'),ent:$('ent'),en:$('enm'),shbar:$('shbar'),shb:$('shb'),hotbar:$('hotbar'),
  cross:$('cross'),prompt:$('prompt'),charge:$('charge'),chargeb:$('chargeb'),toasts:$('toasts'),feed:$('feed'),tags:$('tags'),
  bossbar:$('bossbar'),bossname:$('bossname'),bossb:$('bossb'),keys:$('keys'),vig:$('vig'),flash:$('flash')};
function toast(title,sub='',cls=''){
  const e=el('div',{class:'toast panel '+cls},el('b',{text:title}),sub?el('span',{text:sub}):null);
  hud.toasts.appendChild(e);while(hud.toasts.children.length>3)hud.toasts.firstChild.remove();
  setTimeout(()=>{e.classList.add('out');setTimeout(()=>e.remove(),500);},2800);
}
function feed(title,sub=''){
  const e=el('div',{class:'fline'},el('b',{text:title}),sub?el('span',{text:sub}):null);
  hud.feed.appendChild(e);while(hud.feed.children.length>5)hud.feed.firstChild.remove();
  setTimeout(()=>{e.classList.add('out');setTimeout(()=>e.remove(),500);},3200);
}
const SLOT_KEYS=['1','2','3'],SLOT_ALT=['Q','E','R'];
let slotEls=[];
function buildHotbar(){
  hud.hotbar.textContent='';slotEls=[];if(!save.character)return;
  if(P.alien){const a=ALIENS[P.alien.id];
    a.abilities.forEach((ab,i)=>{const cd=el('i',{class:'cd'});const s=el('div',{class:'slot alien'},cd,el('kbd',{text:touchOn()?'':SLOT_KEYS[i]}),el('span',{class:'nm',text:ab.name}),el('small',{text:a.name}));hud.hotbar.appendChild(s);slotEls.push({alien:i,s,cd});});
    const tb=el('i');const s=el('div',{class:'slot move band'},el('kbd',{text:touchOn()?'':'V'}),el('span',{class:'nm',text:'Revert'}),el('div',{class:'bar tbar'},tb));hud.hotbar.appendChild(s);slotEls.push({bandTimer:tb,s});
    return;}
  save.character.abilities.forEach((id,i)=>{
    const cd=el('i',{class:'cd'});const lv=el('small');
    const s=el('div',{class:'slot'+(id==='morphBand'?' bandslot':''),'data-cat':POWERS[id].cat},cd,el('kbd',{text:touchOn()?'':SLOT_KEYS[i]+(id==='morphBand'?' · V':'')}),el('span',{class:'nm',text:POWERS[id].name}),lv);
    hud.hotbar.appendChild(s);slotEls.push({id,s,cd,lv});
  });
  for(const id of save.character.movement){
    const lv=el('small');const s=el('div',{class:'slot move'},el('kbd',{text:touchOn()?'':POWERS[id].key}),el('span',{class:'nm',text:POWERS[id].name}),lv);
    hud.hotbar.appendChild(s);slotEls.push({id,s,cd:null,lv});
  }
}
const mapCv=document.createElement('canvas');mapCv.width=mapCv.height=Math.round((EDGE+130)*2*0.5);
(function drawMapBase(){
  const c=mapCv.getContext('2d'),s=0.5,o=EDGE+130;const X=v=>(v+o)*s;
  c.fillStyle='#0e2a3d';c.fillRect(0,0,mapCv.width,mapCv.height);
  c.fillStyle='#2a3140';c.fillRect(X(-EDGE),X(-EDGE),EDGE*2*s,EDGE*2*s);
  for(let i=0;i<GRID;i++)for(let j=0;j<GRID;j++){const cx=-HALF+(i+.5)*CELL,cz=-HALF+(j+.5)*CELL;c.fillStyle='#161b25';c.fillRect(X(cx-30),X(cz-30),60*s,60*s);}
  for(const r of mapRects){if(r.col===-1)c.fillStyle='#1f4d2c';else if(r.col===-2)c.fillStyle='#4a3c30';else{const l=Math.round(26+clamp(r.col/260,0,1)*46);c.fillStyle=`hsl(212,22%,${l}%)`;}
    c.fillRect(X(r.x0),X(r.z0),Math.max(1,(r.x1-r.x0)*s),Math.max(1,(r.z1-r.z0)*s));}
  c.fillStyle='#1d5f8a';for(const l of lakes){c.beginPath();c.arc(X(l.x),X(l.z),l.r*s,0,TAU);c.fill();}
  if(bank){c.fillStyle='#b8953a';c.fillRect(X(bank.x0),X(bank.z0),(bank.x1-bank.x0)*s,(bank.z1-bank.z0)*s);}
})();
const MAPO=EDGE+130;
const mapEl=$('map'),mctx=mapEl.getContext('2d');
const CRIME_COL={shop:'#ff5a3d',atm:'#ffb13d',mug:'#ffb13d',car:'#ffb13d',vault:'#ff3d5e',truck:'#ff3d5e'};
function drawMinimap(yaw){
  const R=180,MS=R/230,c=mctx;c.clearRect(0,0,360,360);
  c.save();c.beginPath();c.arc(R,R,R-2,0,TAU);c.clip();c.fillStyle='#0e2a3d';c.fillRect(0,0,360,360);
  c.translate(R,R);c.rotate(yaw);c.scale(MS,MS);c.translate(-P.pos.x,-P.pos.z);
  c.drawImage(mapCv,-MAPO,-MAPO,MAPO*2,MAPO*2);
  for(const o of orbs){if(!o.active||Math.abs(o.x-P.pos.x)>240||Math.abs(o.z-P.pos.z)>240)continue;c.fillStyle=o.type==='red'?'#ff4d4d':o.type==='blue'?'#4fb6ff':'#ffd23f';c.beginPath();c.arc(o.x,o.z,(o.type==='red'?3.6:2.6)/MS,0,TAU);c.fill();}
  c.restore();
  const cs=Math.cos(yaw),sn=Math.sin(yaw);
  const plot=(x,z,edge)=>{const dx=x-P.pos.x,dz=z-P.pos.z;let mx=(dx*cs-dz*sn)*MS,my=(dx*sn+dz*cs)*MS;const l=Math.hypot(mx,my);if(l>R-16){if(!edge)return null;mx*=(R-16)/l;my*=(R-16)/l;}return [R+mx,R+my];};
  c.font='700 15px "Chakra Petch", sans-serif';c.textAlign='center';c.textBaseline='middle';
  const mark=(x,z,t,col)=>{const q=plot(x,z,false);if(!q)return;c.fillStyle=col;c.beginPath();c.arc(q[0],q[1],8,0,TAU);c.fill();c.fillStyle='#0b0f1a';c.fillText(t,q[0],q[1]+1);};
  if(hospital)mark(hospital.x,hospital.z,'+','#e9f3ff');if(policeHQ)mark(policeHQ.x,policeHQ.z,'P','#5aa9ff');if(bank)mark(bank.x,bank.z,'$','#ffc93c');
  for(const r of MP.peers.values()){if(!r.alive)continue;const q=plot(r.pos.x,r.pos.z,true);if(!q)continue;c.fillStyle=FACTION_COL[r.faction];c.beginPath();c.arc(q[0],q[1],6,0,TAU);c.fill();c.strokeStyle='#fff';c.lineWidth=2;c.stroke();}
  for(const v of vehicles)if(v.siren){const q=plot(v.pos.x,v.pos.z,false);if(q){c.fillStyle=Math.sin(time*12)>0?'#ff3d5e':'#3d7dff';c.fillRect(q[0]-4,q[1]-4,8,8);}}
  for(const r of rivals){if(!r.alive)continue;const q=plot(r.pos.x,r.pos.z,true);if(!q)continue;c.fillStyle=FACTION_COL[r.faction];c.beginPath();c.moveTo(q[0],q[1]-8);c.lineTo(q[0]+7,q[1]+6);c.lineTo(q[0]-7,q[1]+6);c.closePath();c.fill();}
  for(const cr of crimes){const q=plot(cr.x,cr.z,true);if(!q)continue;const big=cr.heist,rad=big?13:10;
    c.fillStyle=CRIME_COL[cr.type]||'#ff5a3d';c.globalAlpha=big?0.75+Math.sin(time*5)*0.25:0.95;c.beginPath();c.arc(q[0],q[1],rad,0,TAU);c.fill();c.globalAlpha=1;
    c.strokeStyle='#0b0f1a';c.lineWidth=2;c.stroke();c.fillStyle='#0b0f1a';c.fillText(cr.icon,q[0],q[1]+1);}
  c.fillStyle='#e9f3ff';c.font='700 22px "Chakra Petch", sans-serif';c.fillText('N',R+sn*(R-18),R-cs*(R-18));
  c.fillStyle=FACTION_COL[playerFaction()]==='#e9f3ff'?'#ffc93c':FACTION_COL[playerFaction()];
  c.beginPath();c.moveTo(R,R-13);c.lineTo(R+9,R+10);c.lineTo(R,R+5);c.lineTo(R-9,R+10);c.closePath();c.fill();
}
// floating name tags and health bars
const tagPool=[];
function tagEl(i){if(!tagPool[i]){const n=el('span',{class:'n'}),b=el('i'),hb=el('div',{class:'hb'},b),t=el('div',{class:'tag'},n,hb);hud.tags.appendChild(t);tagPool[i]={t,n,b,hb,key:''};}return tagPool[i];}
function project(x,y,z){const cx=VP[0]*x+VP[4]*y+VP[8]*z+VP[12],cy=VP[1]*x+VP[5]*y+VP[9]*z+VP[13],cw=VP[3]*x+VP[7]*y+VP[11]*z+VP[15];if(cw<0.5)return null;
  const nx=cx/cw,ny=cy/cw;if(Math.abs(nx)>1.1||Math.abs(ny)>1.1)return null;return [(nx*0.5+0.5)*innerWidth,(0.5-ny*0.5)*innerHeight,cw];}
function updateTags(){
  let n=0;
  const add=(x,y,z,name,col,hp,max)=>{if(n>=22)return;const p=project(x,y,z);if(!p)return;const t=tagEl(n++);
    t.t.hidden=false;t.t.style.transform=`translate(${p[0].toFixed(1)}px,${p[1].toFixed(1)}px) translate(-50%,-100%)`;
    if(t.name!==name){t.name=name;t.n.textContent=name;t.n.hidden=!name;}if(t.col!==col){t.col=col;t.n.style.color=col||'';}
    if(max){t.hb.hidden=false;t.b.style.width=(clamp(hp/max,0,1)*100).toFixed(1)+'%';}else t.hb.hidden=true;};
  for(const r of MP.peers.values())if(r.alive&&d2h(r,P)<400*400)add(r.pos.x,r.pos.y+(r.car?3:3.4),r.pos.z,r.name+' · LV '+r.level+' · '+repTier(r.rep||0).name,FACTION_COL[r.faction],r.hp,100);
  for(const r of rivals)if(r.alive&&d2h(r,P)<220*220)add(r.pos.x,r.pos.y+3.4,r.pos.z,r.name+' · LV '+r.level+(r.bounty?' · BOUNTY':''),FACTION_COL[r.faction],r.hp,r.maxHp);
  for(const h of humans){if(!h.alive||h.hidden)continue;const d=d2h(h,P);
    if(h.downed>0&&d<45*45)add(h.pos.x,h.pos.y+1.2,h.pos.z,playerFaction()==='villain'?'Injured':'Injured · G to help','#7dffb0',0,0);
    else if(h.role==='boss'&&d<90*90)add(h.pos.x,h.pos.y+2.5,h.pos.z,h.name,'#c89bff',h.hp,h.maxHp);
    else if(time-(h.lastHit||-99)<3&&d<70*70)add(h.pos.x,h.pos.y+2.3,h.pos.z,'',null,h.hp,h.maxHp);}
  for(const dd of drones)if(dd.alive&&time-(dd.lastHit||-99)<3&&d2h(dd,P)<90*90)add(dd.pos.x,dd.pos.y+2.2,dd.pos.z,'',null,dd.hp,dd.maxHp);
  for(const v of vehicles)if(v.alive&&(v.temp||v===P.car)&&time-(v.lastHit||-99)<3)add(v.pos.x,v.pos.y+3.4,v.pos.z,'',null,v.hp,v.maxHp);
  for(let i=n;i<tagPool.length;i++)tagPool[i].t.hidden=true;
  // floating damage numbers
  let k=0;for(const d of dmgNums){const p=project(d.x,d.y,d.z);if(!p)continue;const e=dmgEl(k++);e.hidden=false;const v=Math.round(d.v);if(e.v!==v){e.v=v;e.textContent=String(v);}
    e.style.transform=`translate(${p[0].toFixed(1)}px,${p[1].toFixed(1)}px) translate(-50%,-50%) scale(${(1+Math.max(0,0.3-d.life)*1.5).toFixed(2)})`;e.style.opacity=String(clamp(1.3-d.life,0,1));}
  for(let i=k;i<dmgPool.length;i++)dmgPool[i].hidden=true;
}
const dmgPool=[];function dmgEl(i){if(!dmgPool[i]){const e=el('div',{class:'dmg'});$('dmgs').appendChild(e);dmgPool[i]=e;}return dmgPool[i];}
// ================================================================
// Menus: creator, skills, appearance, leaderboard, settings
// ================================================================
let sheetOpen=null,creating=false;
const sheet=$('sheet'),sheetBody=$('sheet-body'),sheetTitle=$('sheet-title');
function openSheet(name){if(name==='skills')guideDone('skills');
  if(state==='play'&&!paused)setPaused(true);
  sheetOpen=name;sheet.hidden=false;sheet.classList.toggle('side',name==='look');renderSheet();
  const f=sheet.querySelector('button,input');if(f)f.focus({preventScroll:true});
}
function closeSheet(){if(!sheetOpen)return;const was=sheetOpen;sheetOpen=null;sheet.hidden=true;persist();if(was==='look'){applyLook();syncPlayerDoc(true);}}
$('sheet-x').addEventListener('click',closeSheet);
sheet.addEventListener('mousedown',e=>{if(e.target===sheet)closeSheet();});
function renderSheet(){
  if(!sheetOpen)return;const y=sheetBody.scrollTop;sheetBody.textContent='';
  sheetTitle.textContent={skills:'Skills',look:'Appearance',lb:'Leaderboard',set:'Settings',mp:'Multiplayer'}[sheetOpen];
  ({skills:renderSkills,look:()=>renderLook(sheetBody),lb:renderLB,set:renderSettings,mp:renderMP})[sheetOpen]();
  sheetBody.scrollTop=y;
}
const STAT_LABELS={bounces:'Bounces',duration:'Duration',damage:'Damage',dps:'Damage per second',radius:'Radius',speed:'Speed',drain:'Energy per second',mult:'Speed multiplier',range:'Range',force:'Swing force',
  stun:'Stun',slow:'Slow',absorb:'Absorbs',dr:'Damage reduction',throwDmg:'Throw damage',knock:'Knockback',burnDps:'Burn per second',hitDmg:'Bump damage'};
function fmtStat(k,v){if(k==='duration')return v.toFixed(1)+' s';if(k==='slow'||k==='dr')return Math.round(v*100)+'%';if(k==='stun')return v.toFixed(1)+' s';if(k==='mult'||k==='force')return '×'+v.toFixed(1);return String(Math.round(v));}
function statLines(id,lvl,next){
  const c=POWERS[id],out=[];
  for(const k in c)if(Array.isArray(c[k])&&STAT_LABELS[k]){const a=pstat(id,k,lvl);out.push(STAT_LABELS[k]+' '+fmtStat(k,a)+(next?' → '+fmtStat(k,pstat(id,k,next)):''));}
  if(c.cooldown)out.push('Cooldown '+(Array.isArray(c.cooldown)?pstat(id,'cooldown',lvl).toFixed(1):c.cooldown)+' s');if(c.energy)out.push('Energy '+c.energy);if(c.energyPerSec)out.push(c.energyPerSec+' energy per second');
  return out.join(' · ');
}
function renderSkills(){
  sheetBody.append(el('p',{class:'pts',text:save.sp+(save.sp===1?' skill point':' skill points')}),
    el('p',{class:'muted',text:'You get '+CONFIG.progression.spPerLevel+' skill points every level. Upgrading a power costs as many points as the level it goes up to. Passives cost 1 point per level.'}));
  sheetBody.appendChild(el('h3',{text:'Your powers'}));
  for(const id of [...save.character.abilities,...save.character.movement]){
    const lvl=powerLevel(id),max=lvl>=CONFIG.powerMax,cost=CONFIG.powerUpgradeCost(lvl);
    const btn=el('button',{class:'plus',text:max?'Maxed':'Upgrade · '+cost+' SP',onclick:()=>{if(save.sp<cost||max)return;save.sp-=cost;save.powerLevels[id]=lvl+1;SFX.chime();persist();buildHotbar();renderSheet();syncPlayerDoc();}});
    btn.disabled=max||save.sp<cost;
    sheetBody.appendChild(el('div',{class:'upg'},el('b',{text:POWERS[id].name+'  ·  LV '+lvl+'/'+CONFIG.powerMax}),btn,el('p',{text:POWERS[id].desc}),el('p',{class:'stat',text:statLines(id,lvl,max?0:lvl+1)})));
  }
  sheetBody.appendChild(el('h3',{text:'Passives'}));
    for(const k in PASSIVES){
    const lvl=pv(k),max=lvl>=CONFIG.passiveMax;
    const b1=el('button',{class:'plus',text:max?'Maxed':'+1 · 1 SP',onclick:()=>buyPassive(k,1)});b1.disabled=max||save.sp<1;
    const b5=el('button',{class:'ghost small',text:'+5',onclick:()=>buyPassive(k,5)});b5.disabled=max||save.sp<5||lvl+5>CONFIG.passiveMax;
    sheetBody.appendChild(el('div',{class:'upg'},el('b',{text:PASSIVES[k].name+'  ·  '+lvl+'/'+CONFIG.passiveMax}),el('div',{class:'btns'},b5,b1),el('p',{text:PASSIVES[k].desc})));
  }
  const rr_=respecRow();if(rr_)sheetBody.appendChild(rr_);
  if(hasPower('morphBand')){sheetBody.appendChild(el('h3',{text:'Morph Band aliens'}));const lv=powerLevel('morphBand');
    for(const id of ALIEN_IDS){const a=ALIENS[id],on=a.unlock<=lv;sheetBody.appendChild(el('div',{class:'upg'},el('b',{text:a.name+(on?'':'  ·  unlocks at band LV '+a.unlock)}),el('p',{text:a.blurb+' '+a.abilities.map(x=>x.name).join(', ')+'.'})));}}
}
function spentPoints(){let n=0;for(const k in save.powerLevels){const l=save.powerLevels[k];for(let q=1;q<l;q++)n+=CONFIG.powerUpgradeCost(q);}for(const k in save.passives)n+=(save.passives[k]|0)*CONFIG.passiveCost;return n;}
let respecArmed=false;
function respecRow(){
  const spent=spentPoints();if(!spent)return null;
  const b=el('button',{class:'ghost warn',type:'button',text:respecArmed?'Click again to refund '+spent+' points':'Reset skill points',onclick:()=>{
    if(!respecArmed){respecArmed=true;renderSheet();setTimeout(()=>{if(respecArmed){respecArmed=false;if(sheetOpen==='skills')renderSheet();}},4000);return;}
    respecArmed=false;save.sp+=spent;save.powerLevels={};save.passives=freshPassives();P.hp=Math.min(P.hp,maxHp());P.en=Math.min(P.en,maxEn());persist();buildHotbar();renderSheet();toast('Skill points reset','+'+spent+' points to spend again','cyan');}});
  return el('div',{class:'field'},el('span',{text:'Start over'}),b,el('p',{class:'muted',text:'Refunds every point you spent on powers and passives. Your level, reputation and powers stay.'}));
}
function buyPassive(k,n){const lvl=pv(k);n=Math.min(n,CONFIG.passiveMax-lvl,Math.floor(save.sp/CONFIG.passiveCost));if(n<=0)return;save.sp-=n*CONFIG.passiveCost;save.passives[k]=lvl+n;
  if(k==='vitality')P.hp+=CONFIG.health.perLevel*n;if(k==='energy')P.en+=CONFIG.energy.perLevel*n;SFX.chime();persist();renderSheet();}
// appearance (shared by the creator and the Appearance sheet)
let draft=null;
function lookTarget(){return creating?draft:save.character;}
function renderLook(root){
  const t=lookTarget();
  const inp=el('input',{type:'text',id:'hero-name',maxlength:'16',value:t.name,'aria-label':'Hero name',autocomplete:'off'});
  inp.addEventListener('input',()=>{const v=cleanName(inp.value);if(v)t.name=v;});
  const sw=(label,opts,key)=>{const w=el('div',{class:'sw'});opts.forEach((c,i)=>{const b=el('button',{type:'button','aria-label':label+' '+(i+1),'aria-pressed':String(t[key]===i),onclick:()=>{t[key]=i;applyLook();rerender();}});b.style.background=c;w.appendChild(b);});return el('div',{class:'field'},el('span',{text:label}),w);};
  const cb=el('input',{type:'checkbox',id:'cape-on'});cb.checked=t.capeOn;cb.addEventListener('change',()=>{t.capeOn=cb.checked;});
  root.append(el('label',{class:'field'},el('span',{text:'Hero name'}),inp),sw('Suit',SUIT_OPTS,'suit'),sw('Cape, gloves and boots',CAPE_OPTS,'cape'),sw('Emblem and belt',ACC_OPTS,'accent'),el('label',{class:'row'},el('span',{text:'Wear a cape'}),cb));
}
function rerender(){if(creating)renderCreator();else renderSheet();}
// ---- leaderboard (shared board on claude.ai, this device elsewhere) ----
const LB={db:null,uid:null,ro:false,writing:false,pending:false,lists:{respected:[],feared:[],level:[]},last:''};
let lbTab='respected';
(async function initLB(){
  try{
    if(!window.claude||typeof window.claude.use!=='function')return;
    const db=await window.claude.use('db');if(!db)return;
    const user=await window.claude.use('user');let uid=null;if(user){try{uid=await user.id();}catch(e){}}
    if(user){try{if(await user.can('data.write')===false)LB.ro=true;}catch(e){}}
    LB.db=db;LB.uid=uid;
    const clean=s=>s.docs.map(d=>{const v=d.data()||{};return {id:d.id,name:typeof v.name==='string'?v.name.slice(0,16):'Hero',level:Math.floor(+v.level||1),rep:Math.round(+v.rep||0)};});
    db.collection('players').orderBy('rep','desc').limit(10).onSnapshot(s=>{LB.lists.respected=clean(s).filter(r=>r.rep>0);if(sheetOpen==='lb')renderSheet();},()=>{});
    db.collection('players').orderBy('rep','asc').limit(10).onSnapshot(s=>{LB.lists.feared=clean(s).filter(r=>r.rep<0);if(sheetOpen==='lb')renderSheet();},()=>{});
    db.collection('players').orderBy('level','desc').limit(10).onSnapshot(s=>{LB.lists.level=clean(s);if(sheetOpen==='lb')renderSheet();},()=>{});
    syncPlayerDoc(true);
  }catch(e){}
})();
async function syncPlayerDoc(force){
  if(!LB.db||!LB.uid||LB.ro||!save.character)return;
  const body={name:save.character.name,level:save.level,rep:save.reputation,faction:playerFaction(),updated:Date.now()};
  const key=body.name+'|'+body.level+'|'+body.rep;if(!force&&key===LB.last)return;
  if(LB.writing){LB.pending=true;return;}
  LB.writing=true;
  try{await LB.db.doc('players/'+LB.uid).set(body);LB.last=key;}catch(e){if(e&&(e.code==='invalid_argument'||e.code==='not_granted'))LB.ro=true;}
  LB.writing=false;if(LB.pending){LB.pending=false;syncPlayerDoc();}
}
Bus.on('levelUp',()=>syncPlayerDoc());
function renderLB(){
  const tabs=[['respected','Most respected'],['feared','Most feared'],['level','Highest level']];
  sheetBody.appendChild(el('div',{class:'lb-tabs'},...tabs.map(([k,l])=>el('button',{class:'ghost','aria-pressed':String(lbTab===k),text:l,onclick:()=>{lbTab=k;renderSheet();}}))));
  let rows;
  if(LB.db){rows=LB.lists[lbTab];if(LB.ro)sheetBody.appendChild(el('p',{class:'muted',text:'You can see the board, but your access to this page can’t post to it.'}));}
  else{sheetBody.appendChild(el('p',{class:'muted',text:'The shared board works when you play on claude.ai. Here you only see your own hero.'}));
    rows=save.character?[{id:'me',name:save.character.name,level:save.level,rep:save.reputation}]:[];if(lbTab==='respected')rows=rows.filter(r=>r.rep>0);if(lbTab==='feared')rows=rows.filter(r=>r.rep<0);}
  if(!rows.length){sheetBody.appendChild(el('p',{class:'muted',text:'Nobody here yet.'}));return;}
  const tb=el('tbody');rows.forEach((r,i)=>{const t=repTier(r.rep);tb.appendChild(el('tr',{class:(r.id===LB.uid||r.id==='me')?'me':''},el('td',{text:String(i+1)}),
    el('td',{},el('span',{text:r.name}),el('small',{text:t.name+' · LV '+r.level})),el('td',{text:lbTab==='level'?'LV '+r.level:(r.rep>0?'+':'')+r.rep.toLocaleString('en-US')})));});
  sheetBody.appendChild(el('table',{class:'lb'},tb));
}
// ---- multiplayer (room codes on the public site, automatic on claude.ai) ----
const SITE_URL='https://demo-repo-dusky.vercel.app';
function renderMP(){
  const B=sheetBody,st=MP.status();
  if(window.claude){
    B.append(el('p',{class:'muted',text:'Everyone in your organization who has this page open plays in the same city automatically. People invited from outside your organization can\'t join here.'}),
      st?el('p',{class:'pts',text:st}):null);
    if(SITE_URL)B.append(el('p',{class:'muted',text:'To play with friends outside your organization, open the public site and use a room code: '}),el('p',{},el('a',{href:SITE_URL,target:'_blank',rel:'noopener',class:'sitelink',text:SITE_URL.replace('https://','')})));
    return;}
  if(!P2P.available()){B.append(el('p',{class:'muted',text:'This browser can\'t do peer-to-peer connections, so multiplayer is off.'}));return;}
  B.append(el('p',{class:'muted',text:'Play with friends in the same city. One of you creates a room and shares the code or invite link; everyone else joins with it. The room stays open while its host is playing. Each player\'s crimes and traffic are their own; players and their attacks are shared.'}));
  if(P2P.state==='open'){
    const link=location.origin+location.pathname+'#room='+P2P.code;
    const names=[(save.character?save.character.name:'You')+' (you)'+(P2P.host?' · host':'')];for(const r of MP.peers.values())names.push(r.name+' · LV '+r.level);
    const copy=el('button',{class:'go',type:'button',text:'Copy invite link',onclick:async()=>{try{await navigator.clipboard.writeText(link);copy.textContent='Copied';}catch(e){inp.select();copy.textContent='Press Ctrl+C to copy';}}});
    const inp=el('input',{type:'text',value:link,readonly:'readonly','aria-label':'Invite link'});
    B.append(el('h3',{text:'Room code'}),el('p',{class:'roomcode',text:P2P.code}),inp,el('div',{class:'cta'},copy,el('button',{class:'ghost',type:'button',text:'Leave room',onclick:()=>P2P.leave()})),
      el('h3',{text:'Players · '+names.length+'/'+P2P_MAX}),el('ul',{class:'plist'},...names.map(n=>el('li',{text:n}))));
    return;}
  if(P2P.state==='starting'){B.append(el('p',{class:'pts',text:P2P.statusText()}),el('button',{class:'ghost',type:'button',text:'Cancel',onclick:()=>P2P.leave()}));return;}
  if(P2P.state==='error')B.append(el('p',{class:'note warn',text:P2P.err}));
  const code=el('input',{type:'text',placeholder:'Room code','aria-label':'Room code',maxlength:'8',autocapitalize:'characters',autocomplete:'off'});
  const join=()=>{if(code.value.trim())P2P.join(code.value);};code.addEventListener('keydown',e=>{if(e.key==='Enter')join();});
  B.append(el('div',{class:'cta'},el('button',{class:'go',type:'button',text:'Create a room',onclick:()=>P2P.create()})),
    el('h3',{text:'Join a friend'}),el('div',{class:'joinrow'},code,el('button',{class:'ghost',type:'button',text:'Join',onclick:join})));
}
function renderSettings(){
  const s=save.settings,row=(label,input)=>el('label',{class:'row'},el('span',{text:label}),input);
  const chk=(key,after)=>{const c=el('input',{type:'checkbox',id:'set-'+key});c.checked=!!s[key];c.addEventListener('change',()=>{s[key]=c.checked;after&&after();persist();});return c;};
  const rng=(key,min,max,step,after)=>{const r=el('input',{type:'range',id:'set-'+key,min,max,step});r.value=s[key];r.addEventListener('input',()=>{s[key]=parseFloat(r.value);after&&after();});r.addEventListener('change',persist);return r;};
  const modes=[['auto','Auto'],['kbm','Keyboard & mouse'],['touch','Touch']];
  sheetBody.append(
    el('div',{class:'field'},el('span',{text:'Controls · detected: '+(IS_TOUCH_DEVICE?'touch screen':'keyboard and mouse')}),
      el('div',{class:'lb-tabs'},...modes.map(([k,l])=>el('button',{class:'ghost','aria-pressed':String(s.controls===k),text:l,onclick:()=>{s.controls=k;persist();applyTouchUI();buildHotbar();renderSheet();}})))),
    row('Lock the mouse when you click into the game',chk('autoLock')),
    el('p',{class:'muted',text:'Press L any time to lock or unlock the mouse. While it is unlocked, hold the middle mouse button and drag to look around.'}),
    row('Mouse sensitivity',rng('sens',0.3,3,0.05)),row('Invert vertical look',chk('invertY')),
    row('Volume',rng('volume',0,1,0.05,()=>SFX.setVolume(s.volume))),row('Shadows',chk('shadows')));
}
// ---- character creator ----
const creator=$('create'),creatorBody=$('create-body');
let creatorMode='new';
function openCreator(mode='new'){
  creatorMode=mode;creating=true;
  if(mode==='rechoose'&&save.character){const c=save.character;draft={name:c.name,suit:c.suit,cape:c.cape,accent:c.accent,capeOn:c.capeOn,movement:c.movement.slice(),abilities:c.abilities.slice(),confirm:false};}
  else draft={name:'Guardian '+Math.floor(rr(100,1000)),suit:(Math.random()*SUIT_OPTS.length)|0,cape:(Math.random()*CAPE_OPTS.length)|0,accent:0,capeOn:true,movement:[],abilities:[],confirm:false};
  if(mode==='new'&&state!=='play'){const pk=parks.find(q=>Math.abs(q.cx-40)<1&&Math.abs(q.cz+360)<1)||parks[0];P.pos.set(pk.cx,1.4,pk.cz);P.vel.set(0,0,0);P.showcase=true;}
  applyLook();creator.hidden=false;$('menu').hidden=true;$('pause').hidden=true;$('create-title').textContent=mode==='rechoose'?'Change your powers':'Create your hero';renderCreator();
}
function renderCreator(){
  const y=creatorBody.scrollTop;creatorBody.textContent='';
  creatorBody.appendChild(el('p',{class:'muted',text:creatorMode==='rechoose'?'Pick new powers. Points you spent upgrading powers you drop come back to you. You can do this once every '+Math.round(CONFIG.rechoiceCooldown/60)+' minutes.':'Pick your powers. They are free, but once you lock them in they stay until you change them from the pause menu (once every '+Math.round(CONFIG.rechoiceCooldown/60)+' minutes). Skill points you earn upgrade these powers and your passives.'}));
  if(creatorMode!=='rechoose'){renderLook(creatorBody);}
  const group=(title,ids,key,max)=>{
    const chosen=draft[key];const wrap=el('div',{class:'picks'});
    for(const id of ids){const on=chosen.includes(id),c=POWERS[id];
      wrap.appendChild(el('button',{type:'button',class:'pick'+(on?' on':'')+(id==='morphBand'?' special':''),'aria-pressed':String(on),onclick:()=>{if(on)chosen.splice(chosen.indexOf(id),1);else if(chosen.length<max)chosen.push(id);else{chosen.shift();chosen.push(id);}draft.confirm=false;renderCreator();}},
        el('b',{text:c.name}),el('span',{class:'cat',text:c.cat==='movement'?'Movement · '+c.key:c.cat==='defence'?'Defence':c.cat==='special'?'Transformation':c.cat==='utility'?'Utility':c.type==='charge'?'Attack · hold':'Attack'}),el('span',{text:c.desc})));}
    creatorBody.append(el('h3',{text:title+' · '+chosen.length+'/'+max}),wrap);
  };
  group('Movement powers',MOVEMENT_POWERS,'movement',CONFIG.picks.movement);
  group('Abilities',ABILITY_POWERS,'abilities',CONFIG.picks.abilities);
  const ready=draft.movement.length===CONFIG.picks.movement&&draft.abilities.length===CONFIG.picks.abilities;
  const rnd=el('button',{class:'ghost',type:'button',text:'Surprise me',onclick:()=>{draft.movement=MOVEMENT_POWERS.slice().sort(()=>Math.random()-0.5).slice(0,CONFIG.picks.movement);draft.abilities=ABILITY_POWERS.slice().sort(()=>Math.random()-0.5).slice(0,CONFIG.picks.abilities);draft.confirm=false;renderCreator();}});
  const go=el('button',{class:'go',id:'lockin',type:'button',text:!ready?'Pick '+(CONFIG.picks.movement-draft.movement.length)+' movement and '+(CONFIG.picks.abilities-draft.abilities.length)+' abilities':draft.confirm?'Lock in':'Lock in my powers',onclick:()=>{
    if(!ready)return;if(!draft.confirm){draft.confirm=true;renderCreator();return;}finishCreator();}});
  go.disabled=!ready;
  creatorBody.append(el('div',{class:'cta'},go,rnd),draft.confirm?el('p',{class:'note warn',text:'Click Lock in to confirm.'}):null);
  creatorBody.scrollTop=y;
}
function finishCreator(){
  const c=validCharacter(draft);if(!c)return;
  if(creatorMode==='rechoose'&&save.character){
    const old=[...save.character.abilities,...save.character.movement],now=[...c.abilities,...c.movement];let refund=0;
    for(const id of old)if(!now.includes(id)){const l=save.powerLevels[id]|0;for(let q=1;q<l;q++)refund+=CONFIG.powerUpgradeCost(q);delete save.powerLevels[id];}
    if(P.alien)revertAlien(true);stopAllPowers();save.character=c;save.sp+=refund;save.rechoiceAt=Date.now();persist();
    creating=false;draft=null;creator.hidden=true;applyLook();buildHotbar();buildTouchButtons();setPaused(true);
    toast('Powers changed',refund?'+'+refund+' skill points refunded':'Your new powers are ready','cyan');return;
  }
  save.character=c;save.level=1;save.xp=0;save.sp=CONFIG.progression.startSP;save.powerLevels={};save.passives=freshPassives();save.reputation=0;save.rechoiceAt=Date.now();
  persist();creating=false;draft=null;creator.hidden=true;applyLook();startPlay(true);
}
function tryRechoose(){
  const left=CONFIG.rechoiceCooldown*1000-(Date.now()-save.rechoiceAt);
  if(left>0){toast('Not yet','You can change powers again in '+Math.ceil(left/60000)+' min','red');return;}
  openCreator('rechoose');
}
// ---- Morph Band dial ----
let dialOpen=false,dialSel=-1,dialVX=0,dialVY=0;
const dialEl=$('dial');
function openDial(){
  const list=ALIEN_IDS;dialOpen=true;dialSel=-1;dialVX=dialVY=0;dialEl.hidden=false;const ring=$('dial-ring');ring.textContent='';
  list.forEach((id,i)=>{const a=ALIENS[id],on=aliensUnlocked().includes(id),ang=i/list.length*TAU-Math.PI/2;
    const b=el('button',{type:'button',class:'dslot'+(on?'':' locked'),'data-i':String(i),style:`left:${(50+Math.cos(ang)*38).toFixed(1)}%;top:${(50+Math.sin(ang)*38).toFixed(1)}%`,
      onclick:()=>{if(on){transformInto(id);closeDial();}},onmouseenter:()=>setDialSel(i)},el('kbd',{text:String(i+1)}),el('b',{text:a.name}),el('small',{text:on?a.blurb:'Band LV '+a.unlock}));
    b.style.setProperty('--g',a.glow);ring.appendChild(b);});
  $('dial-info').textContent='Pick an alien · '+Math.round(pstat('morphBand','duration'))+' s transformation';
  SFX.tone('sine',500,900,0.15,0.08);
}
function setDialSel(i){dialSel=i;for(const b of dialEl.querySelectorAll('.dslot'))b.classList.toggle('sel',+b.dataset.i===i);
  const id=ALIEN_IDS[i];if(id)$('dial-info').textContent=ALIENS[id].name+' · '+ALIENS[id].abilities.map(x=>x.name).join(' · ');}
function dialMove(dx,dy){dialVX=clamp(dialVX+dx,-120,120);dialVY=clamp(dialVY+dy,-120,120);if(Math.hypot(dialVX,dialVY)<25)return;
  const a=Math.atan2(dialVY,dialVX)+Math.PI/2,n=ALIEN_IDS.length;setDialSel(((Math.round(a/TAU*n)%n)+n)%n);}
function dialConfirm(){if(dialSel<0)return;const id=ALIEN_IDS[dialSel];if(aliensUnlocked().includes(id)){transformInto(id);closeDial();}else SFX.tone('square',200,150,0.1,0.06);}
function closeDial(){dialOpen=false;dialEl.hidden=true;}
// ---- starter guide ----
const GUIDE=[['move','Move around','WASD to move, mouse to look','Drag the left side to move'],['punch','Throw a punch','Click to punch','Tap PUNCH'],
  ['ability','Use a power','Press 1, 2 or 3','Tap a power button'],['skills','Open your skills','Press Tab','Pause, then Skills'],['crime','Stop a crime','Head for an icon on your minimap','Head for an icon on your minimap']];
function guideDone(k){if(save.guide[k]||save.guide.done)return;save.guide[k]=true;SFX.chime();if(GUIDE.every(g=>save.guide[g[0]])){save.guide.done=true;toast('You are ready','The city is yours. Heroes stop crimes, villains commit them.','gold');}persist();renderGuide();}
function renderGuide(){const g=$('guide');if(!save.character||save.guide.done||state!=='play'){g.hidden=true;return;}g.hidden=false;const list=$('guide-list');list.textContent='';
  for(const [k,t,kb,tc] of GUIDE)list.appendChild(el('li',{class:save.guide[k]?'done':''},el('b',{text:t}),el('span',{text:touchOn()?tc:kb})));}
Bus.on('damaged',e=>{if(e.source===P&&e.type==='punch')guideDone('punch');});
