// ================================================================
// The opener: a first-time player's first two or three minutes ("the Twins")
// ================================================================
// A fresh profile skips the menu and drops into the intact city as The Strongest (startAsStrongest in 70_ui.js). The twin aliens Nala and Nuku attack at once and the game teaches
// fly (F), lock-on (Z), attack and powers in the fight; at half health Nala blasts the whole town flat (one buffer write behind a white flash, never building by building),
// the twins overpower the player (and the player is meant to lose): at zero health, in slow motion, the game asks to HOLD T (the ASCEND button), which is Prism Ascension (66k_prismform.js, every hero
// has it); the first twin the player brings down ends the form and the other flees ("I'll be back with my entire base!"), then Y rebuilds the city in a bird's-eye sweep. save.guide.openerP is true while it runs
// (a player who leaves midway gets it again on Continue), save.guide.opener once it is over (guide keys are whitelisted booleans in loadSave). Returning players and cloud saves have a hero, so they never get it; rooms skip it (solo only).
// Steps: cold, fly, flying, lock, fight1, blast, fight2, ascend, prism, escape, say, rebuild, sweep, handoff. The Skip button jumps to the hand-off with the city intact.
// Slow-motion prompts scale the game's dt (frameBody in 99_main.js), so the opener's own clock (OPN.t) runs on real time. The twins can't be beaten until the player has ascended (hp floors), and the player never drops below 2% health (Damage.apply in 30_systems.js).
// The fled twin is remembered in save.guide.fledNala (the UFO arc's cameo names it).
const OPN={on:false,arm:false,step:'',t:0,t0:0,last:0,slow:false,twins:[],nala:null,nuku:null,say:null,sayT:0,zTry:false,act:0,used:{atk:false,pow:false},hintOn:false,
  hold:0,down:false,ruined:false,charge:null,prompt:null,flashHold:0,bar:null,spawned:false,fired:0};
const OPN_SLOW=0.04; // the world's speed while a prompt waits for a key
const OPN_DMG=2.4; // the twins hit this much harder than they used to: the player is meant to lose the first part
const TWIN_PAL={
  nala:{skin:c4('#b98ed6'),hov:c4('#a77ac7'),suit:[.1,.05,.12,1],suit2:[.18,.08,.2,1],armor:c4('#d4244a'),trim:c4('#ffc93c'),glow:[1,.35,.6],eye:[.01,.005,.02,1]},
  nuku:{skin:c4('#7fd6d0'),hov:c4('#6ac4c0'),suit:[.04,.08,.14,1],suit2:[.07,.13,.22,1],armor:c4('#1f6fd0'),trim:c4('#bfe8ff'),glow:[.4,.8,1],eye:[.005,.01,.02,1]},
};
const TWIN_SC=2;
// ---- UI: the prompt card, the dim, the attack hint, the speech box and the Skip button ----
const opnDim=el('div',{id:'opn-dim',hidden:true});
const opnKeyEl=el('div',{class:'opn-key'},el('span'));
const opnTitle=el('div',{id:'opn-title',hidden:true});
const opnCard=el('div',{id:'opn-card',hidden:true},el('div',{class:'opn-arrow',text:'▼'}),opnKeyEl);
const opnHint=el('div',{id:'opn-hint',hidden:true},el('div',{class:'oh a'},el('kbd',{text:'Click'}),el('b',{text:'Attack'})),el('div',{class:'oh p'},el('kbd',{text:'1'}),el('b',{text:'Power'})));
const opnSay=el('div',{id:'opn-say',hidden:true},el('i'),el('p'));
const opnPHint=el('div',{id:'opn-phint',hidden:true},...[['1','Time Stop'],['2','Hold: Barrage'],['3','Erase (lock on)']].map(d=>el('div',{class:'oh'},el('kbd',{text:d[0]}),el('b',{text:d[1]}))));
const opnSkip=el('button',{id:'opn-skip',type:'button',hidden:true,onclick:()=>openerSkip()},'Skip intro',el('kbd',{text:'Backspace'})); // the mouse is locked while you play, so Backspace skips too
document.body.append(opnDim,opnTitle,opnCard,opnHint,opnPHint,opnSay,opnSkip);
const opnTbSel=['fly','lock','punch','p0','p1','p2','rebuild','asc'];
function opnPulse(id){for(const k of opnTbSel){const t=TB[k];if(t&&t.b)t.b.classList.toggle('opn-pulse',k===id);}}
// keycap prompt: key = the keyboard label, tb = the touch button to point at
function opnShow(title,key,tb){
  OPN.prompt={title,key,tb};opnCard.hidden=false;opnTitle.hidden=false;opnTitle.textContent=title;
  const touch=touchOn();opnKeyEl.hidden=touch;opnKeyEl.firstChild.textContent=key;opnCard.classList.toggle('touch',touch);
  opnCard.querySelector('.opn-arrow').style.transform='';
}
function opnHidePrompt(){OPN.prompt=null;opnCard.hidden=true;opnTitle.hidden=true;opnDim.hidden=true;opnPulse(null);opnKeyEl.style.setProperty('--p','0%');}
function opnPromptTick(){
  const p=OPN.prompt;if(!p)return;
  if(touchOn()){const t=TB[p.tb],b=t&&!t.b.hidden?t.b:null;opnPulse(p.tb);
    if(b){const r=b.getBoundingClientRect(),ar=opnCard.querySelector('.opn-arrow');opnCard.style.left=(r.left+r.width/2)+'px';opnCard.style.top=Math.max(40,r.top-64)+'px';opnCard.style.bottom='auto';ar.style.transform='';}
  }else{opnCard.style.left='';opnCard.style.top='';opnCard.style.bottom='';}
}
function opnSaySet(who,text,dur){
  OPN.say={who,text};OPN.sayT=OPN.t+(dur||3);opnSay.hidden=false;opnSay.firstChild.textContent=who||'';opnSay.firstChild.hidden=!who;opnSay.lastChild.textContent=text;
  opnSay.classList.toggle('named',!!who);opnSay.dataset.who=who||'';
}
function opnSayHide(){OPN.say=null;opnSay.hidden=true;}
// ---- begin / finish / skip ----
function openerBegin(){
  if(OPN.on||!save.character)return;
  if(!storySolo()||MP.online()){save.guide.opener=true;persist();return;}
  save.guide.openerP=true;save.guide.lockNear=true;persist(); // lockNear: the game's own "Press Z to lock on" toast would talk over the opener's prompt
  
  OPN.on=true;OPN.step='cold';OPN.t=0;OPN.t0=0;OPN.last=performance.now();OPN.slow=false;OPN.twins.length=0;OPN.spawned=false;OPN.fired=0;OPN.s1=OPN.s2=false;OPN.fPress=false;OPN.started=false;OPN.down=false;OPN.hold=0;OPN.nala=OPN.nuku=null;OPN.charge=null;OPN.used={atk:false,pow:false};OPN.hintOn=false;OPN.act=0;OPN.ruined=false;
  const s=SPAWNS[0];P.pos.set(s[0],0,s[1]);P.yaw=s[2];P.pitch=-0.05;P.vel.set(0,0,0);P.flying=false;P.hp=maxHp();P.en=maxEn();lockT=null;
  opnSkip.hidden=false;renderGuide();
}
function openerFinish(skipped){
  if(!OPN.on)return;
  OPN.on=false;OPN.slow=false;OPN.step='';opnHidePrompt();opnSayHide();opnHint.hidden=true;opnPHint.hidden=true;opnSkip.hidden=true;opnDim.hidden=true;hud.bossbar.hidden=true;
  save.guide.opener=true;save.guide.openerP=false;save.guide.move=save.guide.punch=true;if(OPN.used.pow||!skipped)save.guide.ability=true;
  save.story.act=0; // the UFO arc comes a few minutes after the opener, not during it
  persist();renderGuide();buildHotbar();buildTouchButtons();claimDaily();
  if(P.hp<maxHp()*0.5)P.hp=maxHp()*0.5;
  SFX.chime();toast('The city is yours',save.sp>0?'You have '+save.sp+' skill points to spend':'Stop crimes to level up','gold');
  if(save.sp>0){objective(touchOn()?'Tap the star icon to spend your skill points':'Press K to spend your skill points');OPN.objK=true;}
}
function openerSkip(){
  if(!OPN.on)return;
  if(CUT)cutEnd(false);
  if(PR.on)prismEnd('skip');PR.hold=0;
  for(const a of OPN.twins.slice())openerRemoveTwin(a);OPN.twins.length=0;
  for(let i=projs.length-1;i>=0;i--)if(projs[i].owner&&projs[i].owner.twin)projs.splice(i,1);
  if(OPN.ruined)openerRuins(false);
  for(const b of bldgs)if(b.state==='ring'){b.state='up';b.off=0;b.hp=b.maxHp;b.rubble=null;for(const c of b.cols)c.dead=false;bldActive.delete(b);}
  openerWriteAll();
  OPN.charge=null;OPN.flashHold=0;flashWhite=0;lockT=null;
  openerFinish(true);
}
function openerRemoveTwin(a){removeActor(a);if(lockT===a)lockT=null;}
// ---- the ruins: the whole city sunk or lifted back in one buffer write (never building by building) ----
function openerWriteAll(){const buf=OPN.buf||(OPN.buf=new Float32Array(cityPos0.length));buf.set(cityPos0);for(const b of bldgs){if(b.state==='up'||b.state==='ring')continue;const off=b.off;for(let i=b.v0;i<b.v1;i++)buf[i*3+1]+=off;}
  gl.bindBuffer(gl.ARRAY_BUFFER,cityMesh.bufs[0]);gl.bufferSubData(gl.ARRAY_BUFFER,0,buf);}
function openerRuins(on){
  OPN.ruined=on;
  if(on){
    for(const b of bldgs){b.state='down';b.hp=0;b.t=0;b.tilt=0;b.tx=b.tz=0;b.off=-(b.h+30);b.regrowAt=1e12;for(const c of b.cols)c.dead=true;bldActive.add(b);
      const w=b.x1-b.x0,d=b.z1-b.z0,pd=Math.hypot((b.x0+b.x1)/2-P.pos.x,(b.z0+b.z1)/2-P.pos.z),m=pd<150?Math.min(7,Math.max(2,Math.ceil(w*d/180))):pd<320?2:0;b.rubble=m?[]:null; // rubble only where the player will see it: every piece is a draw call
      for(let i=0;i<m;i++){const s=rr(2,Math.min(7,Math.max(w,d)*0.25));b.rubble.push({x:rr(b.x0+s/2,b.x1-s/2),y:rr(0.2,Math.min(6,b.h*0.08))*0.5+s*0.3,z:rr(b.z0+s/2,b.z1-s/2),rx:rr(-0.5,0.5),ry:rr(0,TAU),rz:rr(-0.5,0.5),sx:s,sy:s*rr(0.35,0.7),sz:s*rr(0.6,1.1),k:rr(0.55,0.9)});}}
    windows.length=0;scorches.length=0;
    openerWriteAll();
  }else{
    for(const b of bldgs){if(b.state==='up')continue;b.state='up';b.off=0;b.tilt=0;b.hp=b.maxHp;b.rubble=null;for(const c of b.cols)c.dead=false;bldActive.delete(b);}
    openerWriteAll();
  }
}
// ---- the twins ----
function twinSpawn(id,x,y,z){
  const pal=TWIN_PAL[id],hp=id==='nala'?420:320;
  const a={kind:'alien',faction:'alien',twin:id,pal,name:id==='nala'?'Nala':'Nuku',alive:true,hp,maxHp:hp,hpFloor:id==='nala'?hp*0.5:hp*0.35,pos:new V3(x,y,z),vel:new V3(),yaw:0,heroYaw:0,hover:true,
    flash:0,stun:0,slow:0,slowT:0,burn:0,burnDps:0,held:false,thrown:null,cy:2.5,radius:1.9,ys:0.75,phase:rr(0,TAU),bob:rr(0,TAU),aggro:true,los:true,fireT:id==='nala'?1.6:2.4,burstN:0,burstT:0,
    castT:-9,cast:null,specT:id==='nala'?7:5,lastHit:-99,deadT:0,rx:0,noRag:true,ang:id==='nala'?0:Math.PI,R:id==='nala'?15:23,mode:'fight',enraged:false,target:null,grudge:null,grudgeT:-99};
  a.onHit=function(){if(a.hp<a.hpFloor)a.hp=a.hpFloor;};
  a.onDefeat=()=>{burst(a.pos.x,a.pos.y+a.cy,a.pos.z,40,14,0.8,[pal.glow,[1,1,1]],1.6,-3,1.5);ringFx(a.pos.x,a.pos.y+a.cy,a.pos.z,1,8,0.5,pal.glow);SFX.boom(0.6,0.9);addShake(0.3);a.vel.set(rr(-3,3),4,rr(-3,3));};
  actors.push(a);OPN.twins.push(a);if(id==='nala')OPN.nala=a;else OPN.nuku=a;
  burst(x,y+a.cy,z,30,12,0.7,[pal.glow,[1,1,1]],1.6,0,2);ringFx(x,y+a.cy,z,1,10,0.5,pal.glow);
  return a;
}
function twinShot(a,spd,dmg,col,spread){
  const o={x:a.pos.x+Math.sin(a.heroYaw)*1.2,y:a.pos.y+a.cy+0.3,z:a.pos.z+Math.cos(a.heroYaw)*1.2},tv=P.vel,d=Math.hypot(P.pos.x-o.x,P.pos.z-o.z),lead=Math.min(1,d/spd)*0.6;
  const v=dirTo(o,P.pos.x+tv.x*lead+rr(-spread,spread),P.pos.y+1.3+tv.y*lead*0.5+rr(-spread,spread),P.pos.z+tv.z*lead+rr(-spread,spread));
  fireProj({kind:'plasma',owner:a,x:o.x,y:o.y,z:o.z,vx:v[0]*spd,vy:v[1]*spd,vz:v[2]*spd,dmg,r:0.6,life:3,knock:6,pc:col});a.castT=time;
  SFX.tone('square',420,1000,0.12,0.05*SFX.vol(o.x,o.y,o.z));
}
function twinUpdate(a,dt){
  a.flash=Math.max(0,a.flash-dt*5);if(a.slowT>0){a.slowT-=dt;if(a.slowT<=0)a.slow=0;}
  if(a.burn>0&&a.alive){a.burn-=dt;Damage.apply(a.burnSrc,a,a.burnDps*dt,'burn');}
  if(a.held||a.scripted)return;
  const sk=1-(a.slow||0);
  if(!a.alive){ // falls out of the sky
    a.deadT+=dt;a.vel.y-=30*dt;a.vel.x*=Math.pow(0.4,dt);a.vel.z*=Math.pow(0.4,dt);a.pos.addS(a.vel,dt);a.rx=lerp(a.rx,Math.PI/2,damp(3,dt));
    const g=groundY(a.pos.x,a.pos.z,a.pos.y+2);if(a.pos.y<g){a.pos.y=g;a.vel.y=0;}
    if(a.deadT>4&&!a.gone){a.gone=true;burst(a.pos.x,a.pos.y+1,a.pos.z,50,12,0.9,[a.pal.glow,[1,1,1]],1.6,-2,1.5);openerRemoveTwin(a);removeFrom(OPN.twins,a);}
    return;}
  if(a.mode==='flee'){a.vel.x+=a.fx*40*dt;a.vel.z+=a.fz*40*dt;a.vel.y+=34*dt;a.pos.addS(a.vel,dt);a.heroYaw=angLerp(a.heroYaw,Math.atan2(a.fx,a.fz),damp(8,dt));
    emit(a.pos.x,a.pos.y+a.cy,a.pos.z,rr(-2,2),rr(-2,2),rr(-2,2),0.6,a.pal.glow,2.2,0,1);return;}
  const live=!(a.stun>0),valid=live&&!P.dead&&state==='play'&&!cutLocked()&&!OPN.freeze;
  if(a.stun>0)a.stun-=dt;
  const dx=P.pos.x-a.pos.x,dz=P.pos.z-a.pos.z,d=Math.hypot(dx,dz)||1;
  a.heroYaw=angLerp(a.heroYaw,Math.atan2(dx,dz),damp(7,dt));
  // fly around the player on a ring, above the roofs
  if(live){
    a.ang+=dt*(a.twin==='nala'?0.45:-0.3);a.bob+=dt;
    const R=a.R*(a.mode==='watch'?1.8:1),tx=P.pos.x+Math.cos(a.ang)*R,tz=P.pos.z+Math.sin(a.ang)*R;
    let ty=Math.max(P.pos.y+5,groundY(tx,tz,1e9)+8)+(a.mode==='watch'?30:0)+Math.sin(a.bob*1.3)*1.6;
    for(let i=0;i<5&&inBuilding(tx,ty,tz,3);i++)ty+=9;
    const k=damp(1.6,dt),sp=1.4*sk;a.vel.x+=((tx-a.pos.x)*sp-a.vel.x)*k;a.vel.z+=((tz-a.pos.z)*sp-a.vel.z)*k;a.vel.y+=((ty-a.pos.y)*sp-a.vel.y)*k;
    const hs=Math.hypot(a.vel.x,a.vel.z);if(hs>22){a.vel.x*=22/hs;a.vel.z*=22/hs;}
  }else{a.vel.x*=Math.pow(0.3,dt);a.vel.z*=Math.pow(0.3,dt);a.vel.y*=Math.pow(0.3,dt);}
  a.pos.addS(a.vel,dt);
  if(inBuilding(a.pos.x,a.pos.y,a.pos.z,1.5)){a.pos.y+=18*dt;if(a.vel.y<4)a.vel.y=4;}
  a.phase+=dt*2;
  if(!valid)return;
  // attacks: shots always; one special every few seconds (a telegraphed nova for Nala, a lance for Nuku)
  const rate=a.enraged?0.7:1;
  if(a.cast){const C=a.cast;C.t+=dt;a.castT=time;
    if(C.kind==='lance'&&C.t<C.dur){const o={x:a.pos.x,y:a.pos.y+a.cy+0.3,z:a.pos.z};tracer(o.x,o.y,o.z,C.tx,C.ty,C.tz,[.4,.8,1],0.07,0.05);}
    if(C.t>=C.dur){a.cast=null;
      if(C.kind==='nova'){const n=14,o={x:a.pos.x,y:a.pos.y+a.cy,z:a.pos.z};for(let i=0;i<n;i++){const an=i/n*TAU+rr(0,0.2);fireProj({kind:'plasma',owner:a,x:o.x,y:o.y,z:o.z,vx:Math.cos(an)*24,vy:rr(-1.5,0.5),vz:Math.sin(an)*24,dmg:8*OPN_DMG,r:0.7,life:3.2,knock:8,pc:a.pal.glow});}
        ringFx(o.x,o.y,o.z,1,12,0.6,a.pal.glow);SFX.boom(0.5*SFX.vol(o.x,o.y,o.z),0.6);addShake(0.2);}
      else{const o={x:a.pos.x,y:a.pos.y+a.cy+0.3,z:a.pos.z},v=dirTo(o,C.tx,C.ty,C.tz);fireProj({kind:'bolt',owner:a,x:o.x,y:o.y,z:o.z,vx:v[0]*95,vy:v[1]*95,vz:v[2]*95,dmg:14*OPN_DMG,r:0.7,life:2,knock:12});SFX.tone('sawtooth',1400,100,0.25,0.1*SFX.vol(o.x,o.y,o.z));}}
    return;}
  a.fireT-=dt;if(a.fireT<=0){a.fireT=rr(1.3,2.1)*rate;a.burstN=a.twin==='nala'?3:1;a.burstT=0;}
  if(a.burstN>0){a.burstT-=dt;if(a.burstT<=0){a.burstT=0.2;a.burstN--;twinShot(a,40,7*OPN_DMG,a.pal.glow,1.2);OPN.fired++;}}
  a.specT-=dt;if(a.specT<=0&&a.burstN<=0){a.specT=(a.twin==='nala'?9:7)*rate;
    if(a.twin==='nala')a.cast={kind:'nova',t:0,dur:1.3};else a.cast={kind:'lance',t:0,dur:1.0,tx:P.pos.x+P.vel.x*0.5,ty:P.pos.y+1.3+P.vel.y*0.3,tz:P.pos.z+P.vel.z*0.5};
    SFX.tone('sine',200,900,a.cast.dur,0.08*SFX.vol(a.pos.x,a.pos.y,a.pos.z));}
}
function twinDraw(a){
  if(inView(a.pos.x,a.pos.z,1500,30)<0)return;
  const pal=a.pal,fl=a.flash*0.6,t=time,mv=Math.min(Math.hypot(a.vel.x,a.vel.z)/10,1),sc=TWIN_SC,bob=a.alive?Math.sin(t*2.2+a.bob)*0.12:0,aim=t-a.castT<0.35;
  const root=at(a.pos.x,a.pos.y+bob,a.pos.z,a.rx,a.heroYaw,0,sc,sc,sc),b=child(root,0,0.98,0,0.08+mv*0.12,0,0);
  queue(MESH.box,child(b,0,0.28,0,0,0,0,0.36,0.5,0.22),pal.suit,F_SH,fl);queue(MESH.box,child(b,0,0.0,0,0,0,0,0.3,0.16,0.2),pal.suit2,0,fl);
  queue(MESH.box,child(b,0,0.36,0.03,0,0,0,0.4,0.3,0.22),pal.armor,F_SH,fl); // chest plate
  queue(MESH.box,child(b,0,0.04,0.0,0,0,0,0.34,0.06,0.23),pal.trim,0,fl); // belt
  queue(MESH.glowBox,child(b,0,0.36,0.15,0,0,Math.PI/4,0.1,0.1,0.02),pal.glow.concat([1]),0);
  queue(MESH.box,child(b,0,0.6,0,0,0,0,0.07,0.12,0.07),pal.skin,0,fl);
  const hd=child(b,0,0.9,0.02);
  queue(MESH.sphere,child(hd,0,0,0,0,0,0,0.17,0.22,0.19),pal.skin,F_SH,fl);queue(MESH.sphere,child(hd,0,-0.19,0.05,0,0,0,0.1,0.1,0.1),pal.skin,0,fl);
  queue(MESH.sphere,child(hd,0,0.07,-0.02,0,0,0,0.185,0.15,0.205),pal.armor,F_SH,fl); // helmet cap
  queue(MESH.box,child(hd,0,0.17,-0.04,0,0,0,0.03,0.12,0.22),pal.trim,0,fl); // crest
  for(const s of [-1,1]){queue(MESH.sphere,child(hd,s*0.082,-0.01,0.15,0,0,s*0.55,0.058,0.1,0.04),pal.eye,0,0);queue(MESH.glowBox,child(hd,s*0.075,0.025,0.185,0,0,0,0.012,0.012,0.006),pal.glow.concat([1]),0);}
  for(const s of [-1,1]){const ax=aim&&s>0?-1.55:-0.25,sh=child(b,s*0.24,0.5,0,ax,0,s*0.1);
    queue(MESH.box,child(b,s*0.25,0.55,0,0,0,0,0.17,0.1,0.17),pal.armor,F_SH,fl); // shoulder pad
    queue(MESH.box,child(sh,0,-0.16,0,0,0,0,0.07,0.32,0.07),pal.skin,0,fl);const eb=child(sh,0,-0.32,0,aim&&s>0?0:-0.3,0,0);
    queue(MESH.box,child(eb,0,-0.16,0,0,0,0,0.06,0.32,0.06),pal.skin,0,fl);queue(MESH.box,child(eb,0,-0.2,0,0,0,0,0.09,0.15,0.09),pal.armor,F_SH,fl); // bracer
    queue(MESH.box,child(eb,0,-0.35,0,0,0,0,0.07,0.1,0.05),pal.skin,0,fl);
    if(aim&&s>0)queue(MESH.glowSphere,child(eb,0,-0.5,0.05,0,0,0,0.2,0.2,0.2),pal.glow.concat([0.9]),0);
    const hp=child(b,s*0.1,-0.08,0,0.25,0,0);queue(MESH.box,child(hp,0,-0.24,0,0,0,0,0.1,0.48,0.11),pal.suit2,0,fl);const kn=child(hp,0,-0.48,0,0.5,0,0);
    queue(MESH.box,child(kn,0,-0.22,0,0,0,0,0.09,0.44,0.1),pal.skin,0,fl);queue(MESH.box,child(kn,0,-0.3,0.02,0,0,0,0.11,0.12,0.12),pal.armor,F_SH,fl);}
  if(a.alive){queue(MESH.glowCyl,at(a.pos.x,a.pos.y+0.12,a.pos.z,0,0,0,1.1,0.08,1.1),pal.glow.concat([0.45+0.2*Math.sin(t*9)]),F_ADD);queue(MESH.glowSphere,at(a.pos.x,a.pos.y+0.1,a.pos.z,0,0,0,2,0.4,2),pal.glow.concat([0.22]),F_ADD);}
  const C=a.cast;if(C&&C.kind==='nova'){const k=C.t/C.dur,r=1.2+k*3;queue(MESH.glowSphere,at(a.pos.x,a.pos.y+a.cy,a.pos.z,0,0,0,r,r,r),pal.glow.concat([0.08+0.2*k]),F_ADD);queue(MESH.ring,at(a.pos.x,a.pos.y+a.cy,a.pos.z,0,t*3,0,r*1.4,1,r*1.4),pal.glow.concat([0.9]),F_ADD);}
  if(C&&C.kind==='lance'){const r=0.5+C.t/C.dur*0.6;queue(MESH.glowSphere,at(a.pos.x,a.pos.y+a.cy+0.3,a.pos.z,0,0,0,r,r,r),pal.glow.concat([0.5]),F_ADD);}
}
function openerDraw(){
  if(!OPN.on)return;
  for(const a of OPN.twins)twinDraw(a);
  const c=OPN.charge;if(c){const k=c.k,r=2+k*26,x=c.x,y=c.y,z=c.z;
    queue(MESH.glowSphere,at(x,y,z,0,0,0,r,r,r),[1,.45,.7,0.35+0.4*k],F_ADD);queue(MESH.glowSphere,at(x,y,z,0,0,0,r*0.55,r*0.55,r*0.55),[1,.9,.95,0.9],F_ADD);
    queue(MESH.ring,at(x,y,z,0,time*2,0.3,r*1.5,1,r*1.5),[1,.4,.6,0.9],F_ADD);queue(MESH.ring,at(x,y,z,0.4,-time*3,0,r*1.2,1,r*1.2),[1,.8,.9,0.7],F_ADD);}
}
// the health bar at the top follows the twin you are fighting (the locked one, else Nala)
function openerBar(){
  if(!OPN.on)return false;
  const a=lockT&&lockT.twin&&lockT.alive?lockT:OPN.nala&&OPN.nala.alive?OPN.nala:OPN.nuku&&OPN.nuku.alive&&OPN.nuku.mode!=='flee'?OPN.nuku:null;
  if(!a||!OPN.spawned||OPN.step==='blast'||OPN.step==='sweep'||OPN.step==='rebuild'){hud.bossbar.hidden=true;return true;}
  hud.bossbar.hidden=false;setText(hud.bossname,'bn',a.name);setW(hud.bossb,'boss',a.hp/a.maxHp);return true;
}
// ---- the player's inputs the opener watches ----
const opnNote=()=>{OPN.act=OPN.t;};
addEventListener('mousedown',e=>{if(OPN.on&&e.button===0){opnNote();OPN.used.atk=true;}},true);
addEventListener('keydown',e=>{if(!OPN.on||e.repeat)return;if(e.code==='Backspace'&&!ASK&&!/^(INPUT|TEXTAREA)$/.test((e.target&&e.target.tagName)||'')){e.preventDefault();openerSkip();return;}if(e.code==='KeyZ')OPN.zTry=true;
  if(e.code==='Digit1'||e.code==='Digit2'||e.code==='Digit3'||e.code==='Digit4'||e.code==='KeyQ'||e.code==='KeyE'||e.code==='KeyR'){opnNote();OPN.used.pow=true;}},true);
{const tb=$('tbtns');if(tb)tb.addEventListener('pointerdown',e=>{if(!OPN.on)return;const b=e.target.closest&&e.target.closest('.tb');if(!b)return;const a=b.dataset.act;
  if(a==='lock')OPN.zTry=true;else if(a==='punch'){opnNote();OPN.used.atk=true;}else if(/^a[0-3]$/.test(a)){opnNote();OPN.used.pow=true;}},true);}
Bus.on('damaged',e=>{if(OPN.on&&e.source===P&&e.target&&e.target.twin){opnNote();if(e.type==='punch')OPN.used.atk=true;else OPN.used.pow=true;}});
// Y (or the Rebuild button) at the rebuild step: a hold. Returns true when the opener took the press (so the normal rebuild must not run)
function openerY(down){
  if(!OPN.on)return false;
  if(OPN.step!=='rebuild')return true; // Y is saved for the end of the opener: a rebuild now would put the city back in the middle of the fight
  OPN.down=down;
  if(down&&!OPN.started){OPN.started=true;openerFirstBlocks();}
  return true;
}
function openerFirstBlocks(){ // the first block or two rise where you are aiming, with the ring's own ghost-and-fill look
  const ax=aim.t>0&&aim.hitAny?aim.x:P.pos.x-Math.sin(P.yaw)*30,az=aim.t>0&&aim.hitAny?aim.z:P.pos.z-Math.cos(P.yaw)*30;
  const list=bldgs.filter(b=>b.state==='down').map(b=>({b,d:Math.hypot((b.x0+b.x1)/2-ax,(b.z0+b.z1)/2-az)})).sort((p,q)=>p.d-q.d).slice(0,2);
  for(const {b} of list){b.state='ring';b.t=0;b.tilt=0;b.ringDelay=0;b.ringOff=b.off;bldActive.add(b);}
  SFX.transform();flashWhite=Math.max(flashWhite,0.18);
}
// ---- the steps ----
function openerTick(dt){
  if(OPN.objK&&sheetOpen==='skills'){OPN.objK=false;objective(null);} // the hand-off pill goes away once the skills sheet has been opened
  if(!OPN.on)return;
  const now=performance.now(),rdt=clamp((now-OPN.last)/1000,0,0.05);OPN.last=now;OPN.t+=rdt;
  // nobody dies in the opener
  {const f=maxHp()*0.02;if(P.hp<f)P.hp=f;if(P.dead){P.dead=false;$('dead').hidden=true;P.hp=maxHp();}
    if((OPN.step==='fight1'||OPN.step==='fight2')&&!OPN.slow&&!CUT&&!PR.on)P.hp=Math.max(f,P.hp-maxHp()*0.005*rdt);} // the twins wear you down even if you fight well
  {const wdt=dt*prBossK('twins');for(const a of OPN.twins.slice())twinUpdate(a,wdt);} // Time Stop and the like freeze the twins with the rest of the world (Prism's: they break out after 20 s)
  if(OPN.say&&OPN.t>OPN.sayT)opnSayHide();
  if(OPN.flashHold>0){OPN.flashHold-=rdt;flashWhite=Math.max(flashWhite,1);}
  OPN.freeze=!!(CUT&&!CUT.control);
  const T=OPN.t-OPN.t0,nala=OPN.nala,nuku=OPN.nuku;
  switch(OPN.step){
    case 'cold':{
      if(!OPN.spawned&&OPN.t>0.7){OPN.spawned=true;const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),px=P.pos.x+fx*70,pz=P.pos.z+fz*70;
        const A=twinSpawn('nala',px-fz*14,P.pos.y+42,pz+fx*14),B=twinSpawn('nuku',px+fz*14,P.pos.y+46,pz-fx*14);
        A.vel.set(-fx*18,-6,-fz*18);B.vel.set(-fx*18,-6,-fz*18);A.ang=Math.atan2(A.pos.z-P.pos.z,A.pos.x-P.pos.x);B.ang=Math.atan2(B.pos.z-P.pos.z,B.pos.x-P.pos.x);
        SFX.boom(0.5,0.8);opnSaySet('Nala','Look, Nuku. A tiny guardian.',2.6);}
      if(OPN.spawned&&OPN.fired>=2&&T>3.4){if(P.flying)openerGo('lock');else openerGo('fly');}
      else if(OPN.spawned&&T>6.5)openerGo(P.flying?'lock':'fly');
      break;}
    case 'fly':{
      // F on the ground charges and lets you fly when it is released; a knock that lifts you off the ground cancels the charge, so a released key that did not fly flies here
      const dn=!!(keys.KeyF||P.fCharge);
      if(dn&&!OPN.fPress){OPN.fPress=true;OPN.slow=false;opnHidePrompt();SFX.whoosh();}
      else if(!dn&&OPN.fPress){OPN.fPress=false;if(!P.flying)toggleFlight();}
      if(P.flying){OPN.slow=false;opnHidePrompt();openerGo('flying');}
      break;}
    case 'flying':
      if(T>1.8)openerGo('lock');
      break;
    case 'lock':
      if(OPN.zTry){OPN.zTry=false;if(!(lockT&&lockT.twin)){lockT=nala&&nala.alive?nala:nuku;if(lockT)SFX.tone('sine',500,900,0.08,0.06);}}
      if(lockT&&lockT.twin){OPN.slow=false;opnHidePrompt();openerGo('fight1');}
      break;
    case 'fight1':
      openerHintTick();
      if(PR.on){openerGo('prism');break;} // ascended early: straight to the rainbow
      if(nala&&nala.alive&&(nala.hp<=nala.maxHp*0.5+0.5||P.hp<=maxHp()*0.03))openerBlast(); // half health, or you ran out first: the city goes down either way
      break;
    case 'blast':break;
    case 'fight2':
      openerHintTick();
      if(PR.on){openerGo('prism');break;}
      if(P.hp<=maxHp()*0.03&&T>1.5)openerGo('ascend'); // out of health: you do not die, you ascend
      else if(OPN.twins.some(a=>!a.alive))openerGo('escape'); // (a twin fell anyway)
      break;
    case 'ascend':{
      const hp=PR.hold>0?clamp(PR.hold/PR_HOLD,0,1):0;opnKeyEl.style.setProperty('--p',(hp*100).toFixed(0)+'%');opnKeyEl.classList.toggle('held',hp>0);
      if(PR.on){OPN.slow=false;opnHidePrompt();openerGo('prism');}
      break;}
    case 'prism':
      openerPrismTick();
      if(!PR.on){ // the form ended: the first twin down ends it (and the other runs), anything else sends you back to the fight
        if(OPN.twins.some(a=>!a.alive)||(OPN.nala&&!OPN.nala.alive)||(OPN.nuku&&!OPN.nuku.alive))openerGo('escape');
        else{P.hp=Math.max(P.hp,maxHp()*0.3);for(const a of OPN.twins)a.hpFloor=a.maxHp*0.35;openerGo('fight2');}}
      break;
    case 'escape':
      { // whichever twin is left panics and flees
        const sv=OPN.twins.find(a=>a.alive);
        if(!sv){openerGo('say');break;}
        if(T>1.2&&sv.mode!=='flee'){sv.mode='flee';sv.zid='gone';sv.hpFloor=sv.hp;const dx=sv.pos.x-P.pos.x,dz=sv.pos.z-P.pos.z,l=Math.hypot(dx,dz)||1;sv.fx=dx/l;sv.fz=dz/l;sv.vel.set(0,6,0);
          sv.cast=null;if(lockT===sv)lockT=null;opnSaySet(sv.name,'I\'ll be back with my entire base!',3.6);SFX.tone('sawtooth',300,900,1.4,0.1);
          if(!!save.guide.fledNala!==(sv.twin==='nala')){save.guide.fledNala=sv.twin==='nala';persist();}}
        if(sv.mode==='flee'&&(T>4.2||sv.pos.y>P.pos.y+260)){openerRemoveTwin(sv);removeFrom(OPN.twins,sv);openerGo('say');}
      }
      break;
    case 'say':
      if(T>0.3&&!OPN.s1){OPN.s1=true;opnSaySet('','You should get stronger.',2.8);}
      if(T>3.3&&!OPN.s2&&!OPN.ruined){OPN.s2=true;openerFinish(false);break;} // (ascended before the blast: nothing to rebuild)
      if(T>3.3&&!OPN.s2){OPN.s2=true;opnSaySet('',touchOn()?'For now, hold REBUILD to rebuild the city with your power.':'For now, press Y to rebuild the city with your power.',60);openerGo('rebuild',true);}
      break;
    case 'rebuild':{
      const hold=OPN.down&&OPN.started;OPN.hold=clamp(OPN.hold+(hold?rdt:-rdt*1.5),0,1.2);
      opnKeyEl.style.setProperty('--p',(OPN.hold/1.2*100).toFixed(0)+'%');opnKeyEl.classList.toggle('held',hold);
      if(OPN.hold>=1.2)openerSweep();
      if(!hold&&OPN.started&&OPN.hold<=0)OPN.started=false;
      break;}
    case 'sweep':break;
    case 'handoff':
      break;
  }
  if(OPN.prompt)opnPromptTick();
}
function openerGo(step,keepSay){
  OPN.step=step;OPN.t0=OPN.t;if(!keepSay&&step!=='say'&&step!=='escape')opnSayHide();
  const touch=touchOn();
  if(step==='fly'){OPN.slow=true;opnDim.hidden=false;opnShow(touch?'Tap FLY':'Press to fly','F','fly');}
  else if(step==='lock'){
    OPN.zTry=false;OPN.slow=true;opnDim.hidden=false;const n=OPN.nala;
    if(n){const c=center(n),dx=c.x-P.pos.x,dy=c.y-(P.pos.y+1.8),dz=c.z-P.pos.z,h=Math.hypot(dx,dz)||1;P.yaw=Math.atan2(-dx,-dz);P.pitch=clamp(Math.atan2(dy,h)-0.12,-1.1,0.9);}
    opnShow(touch?'Tap LOCK to lock on to Nala':'Lock on to Nala','Z','lock');}
  else if(step==='fight1'){OPN.hintOn=true;OPN.act=OPN.t;opnSaySet('Nuku','Get her, Nala!',2.4);}
  else if(step==='fight2'){OPN.hintOn=true;OPN.act=OPN.t;}
  else if(step==='ascend'){OPN.slow=true;opnDim.hidden=false;OPN.hintOn=false;opnHint.hidden=true;opnShow('HOLD to ascend','T','asc');opnKeyEl.style.setProperty('--p','0%');}
  else if(step==='prism'){OPN.hintOn=false;opnHint.hidden=true;OPN.slow=false;opnHidePrompt();opnSayHide();for(const a of OPN.twins){a.hpFloor=0;a.mode='fight';a.enraged=true;}}
  else if(step==='rebuild'){OPN.hold=0;OPN.started=false;OPN.down=false;opnShow(touch?'Hold REBUILD':'Hold to rebuild','Y','rebuild');}
}
// the attack hint: bottom of the screen, no slowdown. It fades once the player has attacked and used a power, and comes back after about 5 s without either.
function openerHintTick(){
  if(!OPN.hintOn){opnHint.hidden=true;return;}
  const touch=touchOn(),idle=OPN.t-OPN.act,done=OPN.used.atk&&OPN.used.pow;
  const want=!done||idle>5;
  if(want&&idle>5&&done){OPN.used.atk=OPN.used.pow=false;} // the idle reminder shows both again
  opnHint.hidden=false;opnHint.classList.toggle('on',want);opnHint.classList.toggle('touch',touch);
  const a=opnHint.querySelector('.a'),p=opnHint.querySelector('.p'),pn=save.character?POWERS[save.character.abilities[0]].name:'Power';
  a.classList.toggle('used',OPN.used.atk);p.classList.toggle('used',OPN.used.pow);
  a.firstChild.textContent=touch?'PUNCH':'Click';a.lastChild.textContent='Attack';p.firstChild.textContent=touch?'POWER':'1';p.lastChild.textContent=pn;
  if(touch&&want)opnPulse(!OPN.used.atk?'punch':!OPN.used.pow?'p0':null);else if(touch)opnPulse(null);
}
// the three Prism skills, one hint each; every hint fades once its skill has been used (non-blocking, no slow motion)
function openerPrismTick(){
  const used=[PR.used.ts,PR.used.bar,PR.used.er],all=used.every(Boolean);
  opnPHint.hidden=all;if(all){opnPulse(null);return;}
  const touch=touchOn();opnPHint.classList.toggle('touch',touch);opnPHint.classList.add('on');
  [...opnPHint.children].forEach((d,i)=>{d.classList.toggle('used',!!used[i]);d.firstChild.textContent=touch?['TIME','HOLD','ERASE'][i]:String(i+1);});
  if(touch){const n=used.findIndex(u=>!u);opnPulse(n<0?null:'p'+n);}
}
// ---- the half-health cutscene: Nala flies up and blasts the whole town ----
function openerBlast(){
  const nala=OPN.nala;if(!nala||OPN.step==='blast')return;
  OPN.step='blast';OPN.hintOn=false;opnHint.hidden=true;opnPulse(null);opnSayHide();OPN.slow=false;
  const start={x:camPos.x,y:camPos.y,z:camPos.z},p0={x:nala.pos.x,y:nala.pos.y,z:nala.pos.z};nala.scripted=true;nala.cast=null;nala.hp=Math.max(nala.hp,nala.maxHp*0.5);
  const fx=nala.pos.x-P.pos.x,fz=nala.pos.z-P.pos.z,fl=Math.hypot(fx,fz)||1,bx=-fx/fl,bz=-fz/fl,hi={x:P.pos.x+fx/fl*75,y:P.pos.y+100,z:P.pos.z+fz/fl*75};
  let blasted=false;
  if(OPN.nuku)OPN.nuku.mode='watch';
  cutscene({dur:7.4,letterbox:true,skippable:false,text:'Nala: "Let\'s see you save a city that isn\'t there!"',fov:64,
    from:k=>{ // behind the player and rising, so the street, the sky and Nala fit in one view; after the blast, high above the ruins
      if(k<0.7){const e=Math.min(1,k*2.5),x=lerp(start.x,P.pos.x+bx*50,e),z=lerp(start.z,P.pos.z+bz*50,e);return {x,y:ufoCamY(x,z,lerp(start.y,P.pos.y+26+k*20,e)),z};}
      return {x:P.pos.x+bx*80,y:P.pos.y+210,z:P.pos.z+bz*80};},
    look:k=>{const n=nala.pos,w=k<0.7?0.85:0.2;return {x:lerp(P.pos.x,n.x,w),y:lerp(P.pos.y+2,n.y,w),z:lerp(P.pos.z,n.z,w)};},
    onTick:(k,dt)=>{
      const up=Math.min(1,k/0.46),e=up*up*(3-2*up);nala.pos.set(lerp(p0.x,hi.x,e),lerp(p0.y,hi.y,e),lerp(p0.z,hi.z,e));nala.heroYaw=Math.atan2(P.pos.x-nala.pos.x,P.pos.z-nala.pos.z);nala.vel.set(0,0,0);
      if(k>0.4&&k<0.72){const c=clamp((k-0.4)/0.32,0,1);OPN.charge={x:nala.pos.x,y:nala.pos.y+2,z:nala.pos.z,k:c};addShake(0.04+0.12*c);if(Math.random()<0.1)SFX.tone('sawtooth',80+c*500,120+c*700,0.4,0.05);}
      if(k>=0.72&&!blasted){blasted=true;OPN.charge=null;OPN.flashHold=0.5;flashWhite=1;SFX.boom(1,2.4);SFX.crash(1);addShake(1);
        openerRuins(true);ringFx(P.pos.x,2,P.pos.z,5,900,1.8,[1,.5,.7]);
        for(let i=0;i<14;i++){const an=rr(0,TAU),r=rr(15,160);smoke(P.pos.x+Math.cos(an)*r,rr(2,30),P.pos.z+Math.sin(an)*r,3,8,rr(10,24),rr(3,6),0.3);}}
      if(blasted&&k<0.9)addShake(0.12*(1-k));},
    onEnd:()=>{
      if(!OPN.on)return;OPN.charge=null;nala.scripted=false;nala.hpFloor=nala.maxHp*0.35;nala.enraged=true;nala.fireT=0.8;nala.specT=3;nala.mode='fight';
      nala.pos.set(P.pos.x-Math.sin(P.yaw)*22,P.pos.y+14,P.pos.z-Math.cos(P.yaw)*22);nala.vel.set(0,0,0);if(OPN.nuku){OPN.nuku.mode='fight';}
      flashWhite=Math.max(flashWhite,0.4);if(P.hp<maxHp()*0.35)P.hp=maxHp()*0.35;openerGo('fight2');opnSaySet('Nala','Enough games! Now you fight me for real!',3);lockT=nala;}});
}
// ---- the rebuild: the power takes over, the camera rises over the whole city and everything stands back up in one sweep ----
function openerSweep(){
  if(OPN.step==='sweep')return;
  OPN.step='sweep';opnHidePrompt();opnSayHide();OPN.down=false;
  const start={x:camPos.x,y:camPos.y,z:camPos.z},cx=0,cz=0,H=Math.max(HALF*1.55,CEIL+300),top={x:cx,y:H,z:cz+H*0.22},cityC={x:cx,y:0,z:cz};
  let swept=false;const sm=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
  cutscene({dur:9.2,letterbox:true,skippable:false,text:'',fov:68,
    from:k=>{const e=sm(k/0.2);return {x:lerp(start.x,top.x,e),y:lerp(start.y,top.y,e),z:lerp(start.z,top.z,e)};},
    look:k=>{const e=sm(k/0.25);return {x:lerp(P.pos.x,cityC.x,e),y:lerp(P.pos.y+1.5,0,e),z:lerp(P.pos.z,cityC.z,e)};},
    onTick:(k,dt)=>{
      if(k>0.14&&!swept){swept=true;openerSweepStart();}
      if(k>0.2&&k<0.85&&Math.random()<dt*9)SFX.tone('sine',90+k*260,140+k*300,0.5,0.05);
      flashWhite=Math.max(flashWhite,k>0.93?(k-0.93)*10:0);},
    onEnd:()=>{
      if(!OPN.on)return;
      for(const b of bldgs)if(b.state==='ring'){b.state='up';b.off=0;b.hp=b.maxHp;b.rubble=null;for(const c of b.cols)c.dead=false;bldActive.delete(b);}
      openerRuins(false);OPN.ruined=false;flashWhite=1;
      const cm=camPos,from={x:cm.x,y:cm.y,z:cm.z},cp=Math.cos(P.pitch),fw={x:-Math.sin(P.yaw)*cp,y:Math.sin(P.pitch),z:-Math.cos(P.yaw)*cp},end={x:P.pos.x-fw.x*8,y:P.pos.y+2.1-fw.y*8+0.4,z:P.pos.z-fw.z*8};
      cutscene({dur:2.2,letterbox:true,skippable:false,from,to:end,look:()=>({x:P.pos.x,y:P.pos.y+1.5,z:P.pos.z}),fov:68,onEnd:()=>{if(OPN.on)openerFinish(false);}});}});
}
function openerSweepStart(){ // every fallen building rises, staggered by its distance from the player (the ring's ghost-and-fill look), the whole thing taking about five seconds
  const list=bldgs.filter(b=>b.state==='down'),R=Math.max(1,HALF*1.5);
  for(const b of list){const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2;b.state='ring';b.t=0;b.tilt=0;b.ringDelay=Math.min(1,Math.hypot(cx-P.pos.x,cz-P.pos.z)/R)*5;b.ringOff=b.off;bldActive.add(b);}
  SFX.transform();SFX.chime();flashWhite=Math.max(flashWhite,0.4);
}
