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
  clock:$('clock'),mode:$('mode'),hpb:$('hpb'),hpt:$('hpt'),enb:$('enb'),enb2:$('enb2'),ent:$('ent'),en:$('enm'),shbar:$('shbar'),shb:$('shb'),hotbar:$('hotbar'),
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
const SLOT_KEYS=['1','2','3','4','5'],SLOT_ALT=['Q','E','R','',''];
let slotEls=[];
function buildHotbar(){
  hud.hotbar.textContent='';slotEls=[];renderHeroKeys();fitMoves();if(!save.character)return;
  if(P.alien){const a=ALIENS[P.alien.id];
    a.abilities.forEach((ab,i)=>{const cd=el('i',{class:'cd'});const s=el('div',{class:'slot alien'},cd,el('kbd',{text:touchOn()?'':SLOT_KEYS[i]}),el('span',{class:'nm',text:ab.name}),el('small',{text:a.name}));hud.hotbar.appendChild(s);slotEls.push({alien:i,s,cd});});
    const tb=el('i');const s=el('div',{class:'slot move band'},el('kbd',{text:touchOn()?'':'V'}),el('span',{class:'nm',text:'Revert'}),el('div',{class:'bar tbar'},tb));hud.hotbar.appendChild(s);slotEls.push({bandTimer:tb,s});
    return;}
  save.character.abilities.forEach((id,i)=>{
    const cd=el('i',{class:'cd'});const lv=el('small');
    const s=el('div',{class:'slot'+(id==='morphBand'?' bandslot':''),'data-cat':POWERS[id].cat},cd,el('kbd',{text:touchOn()?'':SLOT_KEYS[i]+(id==='morphBand'?' · V':'')}),el('span',{class:'nm',text:POWERS[id].name}),lv);
    hud.hotbar.appendChild(s);slotEls.push({id,s,cd,lv,i});
  });
  for(const id of save.character.movement){
    const lv=el('small');const pre=PRESETS[id];const s=el('div',{class:'slot move'},el('kbd',{text:touchOn()?'':POWERS[id].key}),el('span',{class:'nm',text:pre?pre.name:POWERS[id].name}),lv);
    hud.hotbar.appendChild(s);slotEls.push({id,s,cd:null,lv,trav:true});
  }
}
const MAPO=EDGE+130,mapCv=document.createElement('canvas');mapCv.width=mapCv.height=Math.round(MAPO*2*0.5);
(function drawMapBase(){
  const c=mapCv.getContext('2d'),s=0.5,o=MAPO;const X=v=>(v+o)*s;
  c.fillStyle='#0e2a3d';c.fillRect(0,0,mapCv.width,mapCv.height);
  const h=CELL/2+SHORE;c.fillStyle='#2a3140';for(let i=0;i<GX;i++)for(let j=0;j<GZ;j++)if(cellAt(i,j))c.fillRect(X(cellX(i)-h),X(cellZ(j)-h),h*2*s,h*2*s);
  for(const r of BRIDGE_RECTS)c.fillRect(X(r.x0),X(r.z0),(r.x1-r.x0)*s,(r.z1-r.z0)*s);
  for(let i=0;i<GX;i++)for(let j=0;j<GZ;j++){if(!isBlock(i,j))continue;c.fillStyle='#161b25';c.fillRect(X(cellX(i)-30),X(cellZ(j)-30),60*s,60*s);}
  for(const r of mapRects){if(r.col===-1)c.fillStyle='#1f4d2c';else if(r.col===-2)c.fillStyle='#4a3c30';else{const l=Math.round(26+clamp(r.col/260,0,1)*46);c.fillStyle=`hsl(212,22%,${l}%)`;}
    c.fillRect(X(r.x0),X(r.z0),Math.max(1,(r.x1-r.x0)*s),Math.max(1,(r.z1-r.z0)*s));}
  c.fillStyle='#1d5f8a';for(const l of lakes){c.beginPath();for(let i=0;i<=32;i++){const a=i/32*TAU,r=lakeR(l,a);c.lineTo(X(l.x+Math.cos(a)*r),X(l.z+Math.sin(a)*r));}c.fill();}
  if(bank){c.fillStyle='#b8953a';c.fillRect(X(bank.x0),X(bank.z0),(bank.x1-bank.x0)*s,(bank.z1-bank.z0)*s);}
})();
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
  if(hospital)mark(hospital.x,hospital.z,'+','#e9f3ff');if(policeHQ)mark(policeHQ.x,policeHQ.z,'P','#5aa9ff');if(bank)mark(bank.x,bank.z,'$','#ffc93c');if(invTower)mark(invTower.x,invTower.z,'I','#ff5a3d');
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
  for(const r of MP.peers.values())if(r.alive&&d2h(r,P)<400*400)add(r.pos.x,r.pos.y+(r.car?3:3.4),r.pos.z,r.name+' · LV '+r.level+' · '+repTier(r.rep||0).name+(r.stars?' '+'★'.repeat(r.stars):'')+(r.bounty?' · $'+r.bounty.toLocaleString('en-US'):''),FACTION_COL[r.faction],r.hp,100);
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
  sheetTitle.textContent={skills:'Skills',look:'Appearance',lb:'Leaderboard',set:'Settings',mp:'Multiplayer',trials:'Try locked powers',cos:'Cosmetics'}[sheetOpen];
  ({skills:renderSkills,look:()=>renderLook(sheetBody),lb:renderLB,set:renderSettings,mp:renderMP,trials:renderTrials,cos:renderCosmetics})[sheetOpen]();
  sheetBody.scrollTop=y;
}
const STAT_LABELS={bounces:'Bounces',duration:'Duration',damage:'Damage',dps:'Damage per second',radius:'Radius',speed:'Speed',drain:'Energy per second',mult:'Speed multiplier',range:'Range',force:'Swing force',
  stun:'Stun',slow:'Slow',absorb:'Absorbs',dr:'Damage reduction',throwDmg:'Throw damage',knock:'Knockback',burnDps:'Burn per second',hitDmg:'Bump damage',capacity:'Capacity'};
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
  for(const id of save.character.movement){const m=masteryLevel(id);
    sheetBody.appendChild(el('div',{class:'upg'},el('b',{text:(PRESETS[id]?PRESETS[id].name:POWERS[id].name)+'  ·  Mastery '+m.toFixed(1)+'/'+MASTERY_MAX}),el('p',{text:'Traversal grows by using it: the more you travel this way, the higher, faster and bigger it gets. It does not cost skill points.'}),el('div',{class:'bar xp'},el('i',{style:'width:'+(m/MASTERY_MAX*100).toFixed(1)+'%'}))));}
  for(const id of [...new Set([...save.character.abilities.map(LEVEL_OF),save.character.body,...(hasTrav('armorFlight')?['suitBattery']:[])])]){
    if(!POWERS[id]||POWERS[id].cat==='body'&&POWERS[id].hidden)continue;
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
    db.collection('players').orderBy('rep','desc').limit(10).onSnapshot(s=>{LB.lists.respected=clean(s).filter(r=>r.rep>0);if(sheetOpen==='lb')renderSheet();updateLBMini(true);},()=>{});
    db.collection('players').orderBy('rep','asc').limit(10).onSnapshot(s=>{LB.lists.feared=clean(s).filter(r=>r.rep<0);if(sheetOpen==='lb')renderSheet();updateLBMini(true);},()=>{});
    db.collection('players').orderBy('level','desc').limit(10).onSnapshot(s=>{LB.lists.level=clean(s);if(sheetOpen==='lb')renderSheet();updateLBMini(true);},()=>{});
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
    const link=Portal.inviteLink(P2P.code)||location.origin+location.pathname+'#room='+P2P.code;
    const names=[(save.character?save.character.name:'You')+' (you)'+(P2P.host?' · host':'')];for(const r of MP.peers.values())names.push(r.name+' · LV '+r.level);
    const copy=el('button',{class:'go',type:'button',text:'Copy invite link',onclick:async()=>{try{await navigator.clipboard.writeText(link);copy.textContent='Copied';}catch(e){inp.select();copy.textContent='Press Ctrl+C to copy';}}});
    const inp=el('input',{type:'text',value:link,readonly:'readonly','aria-label':'Invite link'});
    B.append(el('h3',{text:'Room code'}),el('p',{class:'roomcode',text:P2P.code}),inp,el('div',{class:'cta'},copy,el('button',{class:'ghost',type:'button',text:'Leave room',onclick:()=>P2P.leave()})),
      el('h3',{text:'Players · '+names.length+'/'+P2P_MAX}),el('ul',{class:'plist'},...names.map(n=>el('li',{text:n}))));
    if(P2P.host)renderHostControls(B);
    else B.append(el('h3',{text:'Room rules'}),el('p',{class:'muted',text:PVP_MODES[ROOM.pvp]+' · crimes '+(ROOM.crimes?'on':'off')+' · police '+(ROOM.police?'on':'off')+(ROOM.locked?' · locked':'')+'. The host sets these.'}));
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
    el('div',{class:'field'},el('span',{text:'Ring oath · how the Ring Bearer recites it'}),
      el('div',{class:'lb-tabs'},...[['voice','Say it out loud'],['type','Type it (Tab)']].map(([k,l])=>el('button',{class:'ghost','aria-pressed':String(s.oathInput===k),disabled:k==='voice'&&!voiceOK(),text:l,onclick:()=>{s.oathInput=k;persist();if(k==='voice')askMic(true);renderSheet();}}))),
      el('p',{class:'muted',text:!voiceOK()?'This browser can\'t listen, so the oath is typed.':voiceBlocked&&s.oathInput==='voice'?'The microphone is blocked. Allow it for this page in your browser, then pick Say it out loud again.':s.oathInput==='voice'?'Press O and speak the oath. The ring charges as you say each line, and you can keep moving and fighting (no ring powers until you finish). O or Esc puts the lantern away.':'Press O and type the oath. Once you know it, Tab fills in each word.'})),
    ...(s.oathInput==='voice'&&voiceOK()?micSettings(s,rng):[]),
    row('Lock the mouse when you click into the game',chk('autoLock')),
    el('p',{class:'muted',text:'Press L any time to lock or unlock the mouse. While it is unlocked, hold the middle mouse button and drag to look around.'}),
    row('Mouse sensitivity',rng('sens',0.3,3,0.05)),row('Invert vertical look',chk('invertY')),
    row('Volume',rng('volume',0,1,0.05,()=>SFX.setVolume(s.volume))),row('Shadows',chk('shadows')));
}
// Ring oath loudness: say the oath louder than the line and finishing it overcharges the ring to 200
function micSettings(s,rng){
  const lvl=el('div',{class:'miclvl',id:'set-miclvl'},el('i'),el('b'));
  const test=el('button',{class:'ghost',type:'button',text:MIC.users.has('test')?'Stop the mic test':'Test your mic',onclick:()=>{
    if(MIC.users.has('test'))micOff('test');else micOn('test');test.textContent=MIC.users.has('test')?'Stop the mic test':'Test your mic';}});
  const out=[el('label',{class:'row'},el('span',{text:'Overcharge loudness'}),rng('micLoud',0.2,0.95,0.01,micShow)),lvl,
    el('div',{class:'cta'},test),
    el('p',{class:'muted',text:'Say the oath loud enough to pass the white line at any point and finishing it overcharges the ring to 200. Test your mic and speak to see where your voice lands.'})];
  setTimeout(micShow,0);return out;
}
// ---- character creator ----
const creator=$('create'),creatorBody=$('create-body');
let creatorMode='new';
function openCreator(mode='new'){
  creatorMode=mode;creating=true;
  if(locked)document.exitPointerLock(); // the creator is clicked with the mouse, so give the cursor back (creating keeps this from pausing)
  if(mode==='new'&&state!=='play'){const pk=parks.find(q=>Math.abs(q.cx-40)<1&&Math.abs(q.cz+360)<1)||parks[0];P.pos.set(pk.cx,1.4,pk.cz);P.vel.set(0,0,0);P.showcase=true;}
  if(mode==='rechoose'&&save.character){const c=save.character,pre=presetOf(c);draft={name:c.name,suit:c.suit,cape:c.cape,accent:c.accent,capeOn:c.capeOn,movement:c.movement.slice(),body:pre?null:c.body,abilities:pre?[]:c.abilities.filter(id=>ABILITY_POWERS.includes(id)),kit:pre?c.abilities.slice(0,CONFIG.picks.kit):[],free:pre?c.abilities.slice(CONFIG.picks.kit):[],confirm:false};}
  else draft={name:'Guardian '+Math.floor(rr(100,1000)),suit:(Math.random()*SUIT_OPTS.length)|0,cape:(Math.random()*CAPE_OPTS.length)|0,accent:0,capeOn:true,movement:[],body:null,abilities:[],confirm:false};
  applyLook();creator.hidden=false;$('menu').hidden=true;$('pause').hidden=true;$('create-title').textContent=mode==='rechoose'?'Change your powers':'Create your hero';renderCreator();
}
function pickCard(id,on,onclick,tag,extra){const c=POWERS[id];
  return el('button',{type:'button',class:'pick'+(on?' on':'')+(tag?' special':''),'aria-pressed':String(on),onclick},powerIcon(id),el('b',{text:PRESETS[id]?PRESETS[id].name:c.name}),
    el('span',{class:'cat',text:tag||(c.cat==='defence'?'Defence':c.cat==='special'?'Transformation':c.cat==='utility'?'Utility':c.type==='charge'?'Attack · hold':c.cat==='body'?'Body mod':'Attack')}),
    el('span',{text:PRESETS[id]?PRESETS[id].blurb:c.desc}),extra?el('span',{class:'cat',text:extra}):null);}
function renderCreator(){
  const y=creatorBody.scrollTop;creatorBody.textContent='';const d=draft;
  creatorBody.appendChild(el('p',{class:'muted',text:creatorMode==='rechoose'?'Pick new powers. Skill points you spent on powers you drop come back to you.'+(CONFIG.rechoiceCooldown>0?' You can do this once every '+Math.round(CONFIG.rechoiceCooldown/60)+' minutes.':''):'Pick one way to get around. Six of them are full hero kits: pick 3 of the kit\'s moves for keys 1–3 and 2 more for keys 4–5. Flight lets you build your own hero from a body mod (its move goes on key 1) and 4 abilities. Powers are free, and you can change them any time from the pause menu. Traversal gets stronger the more you use it; skill points upgrade everything else.'}));
  if(creatorMode!=='rechoose')renderLook(creatorBody);
  const redraw=()=>{d.confirm=false;renderCreator();};
  creatorBody.appendChild(el('h3',{text:'Traversal · pick 1'}));
  const tw=el('div',{class:'picks'});for(const id of MOVEMENT_POWERS)tw.appendChild(pickCard(id,d.movement[0]===id,()=>{d.movement=[id];if(PRESETS[id]){const ab=presetAbilities(id,[]);d.kit=ab.slice(0,CONFIG.picks.kit);d.free=ab.slice(CONFIG.picks.kit);}redraw();},PRESETS[id]?'Hero kit':'Build your own'));creatorBody.appendChild(tw);
  const pre=PRESETS[d.movement[0]];
  if(pre){
    if(!d.kit||!d.free){const ab=presetAbilities(d.movement[0],[]);d.kit=ab.slice(0,CONFIG.picks.kit);d.free=ab.slice(CONFIG.picks.kit);}
    const K=CONFIG.picks.kit,F=CONFIG.picks.free,toggle=(arr,other,max,id)=>{const i=arr.indexOf(id);if(i>=0)arr.splice(i,1);else{const j=other.indexOf(id);if(j>=0)other.splice(j,1);if(arr.length>=max)arr.shift();arr.push(id);}redraw();};
    creatorBody.appendChild(el('h3',{text:pre.name+' · body'}));
    const bodyRow=el('div',{class:'picks'});bodyRow.appendChild(pickCard(pre.body,true,()=>{},'Body'));creatorBody.appendChild(bodyRow);
    creatorBody.appendChild(el('h3',{text:'Keys 1–3 · '+d.kit.length+'/'+K+' from the '+pre.name+' kit'}));
    const kit=el('div',{class:'picks'});for(const id of pre.abilities)kit.appendChild(pickCard(id,d.kit.includes(id),()=>toggle(d.kit,d.free,K,id),d.kit.includes(id)?'Key '+(d.kit.indexOf(id)+1):'Kit move'));creatorBody.appendChild(kit);
    creatorBody.appendChild(el('h3',{text:'Keys 4–5 · '+d.free.length+'/'+F+' more: the rest of your kit, or any power'}));
    const fr=el('div',{class:'picks'});for(const id of [...pre.abilities.filter(x=>!d.kit.includes(x)),...ABILITY_POWERS.filter(x=>!pre.abilities.includes(x))])
      fr.appendChild(pickCard(id,d.free.includes(id),()=>toggle(d.free,d.kit,F,id),d.free.includes(id)?'Key '+(K+d.free.indexOf(id)+1):pre.abilities.includes(id)?'Kit move':id==='morphBand'?'Transformation':null));
    creatorBody.appendChild(fr);d.abilities=[...d.kit,...d.free];
  }else if(d.movement[0]){
    creatorBody.appendChild(el('h3',{text:'Body mod · pick 1'}));
    const bw=el('div',{class:'picks'});for(const id of BODY_MODS)bw.appendChild(pickCard(id,d.body===id,()=>{d.body=id;redraw();},null,'Signature move: '+POWERS[POWERS[id].sig].name));creatorBody.appendChild(bw);
    creatorBody.appendChild(el('h3',{text:'Abilities · '+d.abilities.length+'/'+CONFIG.picks.abilities+(d.body?' (plus '+POWERS[POWERS[d.body].sig].name+')':'')}));
    const aw=el('div',{class:'picks'});
    for(const id of ABILITY_POWERS){const on=d.abilities.includes(id);aw.appendChild(pickCard(id,on,()=>{if(on)d.abilities.splice(d.abilities.indexOf(id),1);else if(d.abilities.length<CONFIG.picks.abilities)d.abilities.push(id);else{d.abilities.shift();d.abilities.push(id);}redraw();},id==='morphBand'?'Transformation':null));}
    creatorBody.appendChild(aw);
  }
  const ready=d.movement.length===1&&(pre?d.kit.length===CONFIG.picks.kit&&d.free.length===CONFIG.picks.free:(d.body&&d.abilities.length===CONFIG.picks.abilities));
  const need=!d.movement.length?'Pick a traversal':pre?(d.kit.length<CONFIG.picks.kit?'Pick '+(CONFIG.picks.kit-d.kit.length)+' more kit move'+(CONFIG.picks.kit-d.kit.length>1?'s':''):'Pick '+(CONFIG.picks.free-d.free.length)+' more for keys 4–5'):!d.body?'Pick a body mod':'Pick '+(CONFIG.picks.abilities-d.abilities.length)+' more abilit'+(CONFIG.picks.abilities-d.abilities.length===1?'y':'ies');
  const rnd=el('button',{class:'ghost',type:'button',text:'Surprise me',onclick:()=>{d.movement=[pick(MOVEMENT_POWERS)];d.body=pick(BODY_MODS);d.abilities=ABILITY_POWERS.slice().sort(()=>Math.random()-0.5).slice(0,CONFIG.picks.abilities);const pr=PRESETS[d.movement[0]];if(pr){const k=pr.abilities.slice().sort(()=>Math.random()-0.5);d.kit=k.slice(0,CONFIG.picks.kit);d.free=[...k.slice(CONFIG.picks.kit),...ABILITY_POWERS.filter(x=>!pr.abilities.includes(x)).sort(()=>Math.random()-0.5)].slice(0,CONFIG.picks.free);}redraw();}});
  const go=el('button',{class:'go',id:'lockin',type:'button',text:!ready?need:d.confirm?'Lock in':'Lock in my powers',onclick:()=>{if(!ready)return;if(!d.confirm){d.confirm=true;renderCreator();return;}finishCreator();}});
  go.disabled=!ready;
  creatorBody.append(el('div',{class:'cta'},go,rnd),d.confirm?el('p',{class:'note warn',text:'Click Lock in to confirm.'}):null);
  creatorBody.scrollTop=y;
}
const ownedIds=c=>[...new Set([...c.abilities.map(LEVEL_OF),...c.movement,c.body])];
function finishCreator(){
  const c=validCharacter(draft);if(!c)return;
  if(creatorMode==='rechoose'&&save.character){
    const old=ownedIds(save.character),now=ownedIds(c);let refund=0;
    for(const id of old)if(!now.includes(id)){const l=save.powerLevels[id]|0;for(let q=1;q<l;q++)refund+=CONFIG.powerUpgradeCost(q);delete save.powerLevels[id];}
    if(P.alien)revertAlien(true);stopAllPowers();save.character=c;save.sp+=refund;save.rechoiceAt=Date.now();save.migrated=false;persist();
    creating=false;draft=null;creator.hidden=true;applyLook();buildHotbar();buildTouchButtons();setPaused(true);
    toast('Powers changed',refund?'+'+refund+' skill points refunded':'Your new powers are ready','cyan');return;
  }
  newHero(c);
}
// new players start straight away as the Ring Bearer; the first change of powers (J, or the swap icon) is free
function startAsRingBearer(){
  const c=validCharacter({name:Portal.username||'Guardian '+Math.floor(rr(100,1000)),suit:2,cape:4,accent:4,capeOn:true,movement:['powerRing'],abilities:[]});
  if(!c){openCreator();return;}newHero(c,true);
  feed('You are the Ring Bearer',(touchOn()?'Tap the swap icon (top)':'Press J (the swap icon, top left)')+' to pick other powers · free the first time');
}
// the menu's second button, for players who want to pick their powers before they start
function menuButtons(){let q=$('choose');if(!q){q=el('button',{class:'ghost',id:'choose',type:'button',text:'Choose your powers',onclick:()=>{SFX.init();openCreator();}});$('start').after(q);}q.hidden=!!save.character;}
function newHero(c,freeChange){
  save.character=c;save.level=1;save.xp=0;save.sp=CONFIG.progression.startSP;save.powerLevels={};save.passives=freshPassives();save.reputation=0;save.rechoiceAt=freeChange?0:Date.now();save.mastery={};save.ring=100;save.battery=300;save.bolt=100;save.cal=100;
  persist();creating=false;draft=null;creator.hidden=true;applyLook();startPlay(true);
}
function tryRechoose(){
  const left=CONFIG.rechoiceCooldown*1000-(Date.now()-save.rechoiceAt);
  if(left>0){toast('Not yet','You can change powers again in '+Math.ceil(left/60000)+' min','red');return;}
  openCreator('rechoose');
}
// ---- Morph Band dial ----
let dialOpen=false,dialSel=-1,dialVX=0,dialVY=0,dialKind='alien';
const dialEl=$('dial');
// the radial picker is shared by the Morph Band (aliens) and the power ring (constructs)
function dialItems(){
  if(dialKind==='armor')return ARMOR_IDS.map(id=>{const c=CONSTRUCTS[id];return {name:c.name,blurb:c.blurb,on:conUnlocked().includes(id),trialKey:'con:'+id,lock:'Armored Inventor mastery '+c.unlock+(PBAL?' · click to try':''),glow:'#ff6a3d',info:c.name+' · '+c.attacks,pick:()=>summonConstruct(id)};});
  if(dialKind==='construct')return CON_PAGES.flat().map(id=>{const c=CONSTRUCTS[id];return {name:c.name,blurb:c.blurb,on:conUnlocked().includes(id),trialKey:'con:'+id,lock:'Ring mastery '+c.unlock+(PBAL?' · click to try':''),glow:'#5dff86',cost:c.cost,info:c.name+' · '+c.attacks+' · '+c.cost+' charge',pick:()=>summonConstruct(id)};});
  return ALIEN_IDS.map(id=>{const a=ALIENS[id];return {name:a.name,blurb:a.blurb,on:aliensUnlocked().includes(id),trialKey:'al:'+id,lock:'Band LV '+a.unlock+(PBAL?' · click to try':''),glow:a.glow,info:a.name+' · '+a.abilities.map(x=>x.name).join(' · ')+(a.xQuiz?' · '+xTime(voidbornDuration())+' if the masks agree (Energy raises it)':''),pick:()=>transformInto(id)};});
}
let dialPage=0;
function dialPageTurn(d){} // every construct is on the wheel at once now: nothing to page through
function openDial(kind='alien',keepPage){
  dialKind=kind;const list=dialItems();dialOpen=true;dialSel=-1;dialVX=dialVY=0;dialEl.hidden=false;dialEl.classList.toggle('green',kind==='construct');dialEl.classList.toggle('red',kind==='armor');dialEl.classList.toggle('all',kind==='construct');const ring=$('dial-ring');ring.textContent='';
  const two=kind==='construct',nIn=two?DIAL_INNER:list.length; // constructs: an inner ring (mechs, flyers, rides, weapons) and an outer ring (everything newer)
  list.forEach((a,i)=>{const inner=i<nIn,k=inner?i:i-nIn,n=inner?nIn:list.length-nIn,ang=k/n*TAU-Math.PI/2,rad=two?(inner?25:43):38;
    const b=el('button',{type:'button',class:'dslot'+(two?' mini':'')+(a.on?'':' locked'),'data-i':String(i),style:`left:${(50+Math.cos(ang)*rad).toFixed(1)}%;top:${(50+Math.sin(ang)*rad).toFixed(1)}%`,
      onclick:()=>{if(a.on){closeDial();a.pick();}else dialTrial(a);},onmouseenter:()=>setDialSel(i)},two?null:el('kbd',{text:String(i+1)}),el('b',{text:a.name}),el('small',{text:two?(a.on?a.cost+' charge':a.lock):a.on?a.blurb:a.lock}));
    b.style.setProperty('--g',a.glow);ring.appendChild(b);});
  if(kind==='construct')ring.appendChild(el('div',{class:'dpage'},'All '+list.length+' constructs'));
  $('dial-info').textContent=kind==='armor'?'Pick a suit form · battery '+Math.round(meterFrac(METERS.armorFlight)*100)+'%':kind==='construct'?'Pick a construct · '+Math.round(save.ring)+'% ring charge · move toward the centre for the inner ring':'Pick an alien · '+Math.round(pstat('morphBand','duration'))+' s transformation';
}
function setDialSel(i){dialSel=i;for(const b of dialEl.querySelectorAll('.dslot'))b.classList.toggle('sel',+b.dataset.i===i);
  const a=dialItems()[i];if(a)$('dial-info').textContent=a.info;}
const DIAL_INNER=10;
function dialMove(dx,dy){dialVX=clamp(dialVX+dx,-120,120);dialVY=clamp(dialVY+dy,-120,120);const m=Math.hypot(dialVX,dialVY);if(m<25)return;
  const a=Math.atan2(dialVY,dialVX)+Math.PI/2,N=dialItems().length;
  if(dialKind==='construct'){const inner=m<85,n=inner?DIAL_INNER:N-DIAL_INNER,k=((Math.round(a/TAU*n)%n)+n)%n;setDialSel(inner?k:DIAL_INNER+k);return;} // push the mouse further out to reach the outer ring
  setDialSel(((Math.round(a/TAU*N)%N)+N)%N);}
function dialConfirm(){if(dialSel<0)return;const a=dialItems()[dialSel];if(a&&a.on){closeDial();a.pick();}else if(!dialTrial(a))SFX.tone('square',200,150,0.1,0.06);}
function closeDial(){dialOpen=false;dialEl.hidden=true;}
// ---- starter guide ----
const GUIDE=[['move','Move around','WASD to move, mouse to look','Drag the left side to move'],['punch','Throw a punch','Click to punch','Tap PUNCH'],
  ['ability','Use a power','Press 1 to 5','Tap a power button'],['skills','Open your skills','Press Tab','Pause, then Skills'],['crime','Stop a crime','Follow a ! marker (or a minimap icon)','Follow a ! marker (or a minimap icon)']];
function guideDone(k){if(save.guide[k]||save.guide.done)return;save.guide[k]=true;SFX.chime();if(GUIDE.every(g=>save.guide[g[0]])){save.guide.done=true;toast('You are ready','The city is yours. Heroes stop crimes, villains commit them.','gold');}persist();renderGuide();}
function renderGuide(){const g=$('guide');if(!save.character||save.guide.done||state!=='play'){g.hidden=true;return;}g.hidden=false;const list=$('guide-list');list.textContent='';
  for(const [k,t,kb,tc] of GUIDE)list.appendChild(el('li',{class:save.guide[k]?'done':''},el('b',{text:t}),el('span',{text:touchOn()?tc:kb})));fitMoves();}
Bus.on('damaged',e=>{if(e.source===P&&e.type==='punch')guideDone('punch');});
