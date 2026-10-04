// ================================================================
// Sun God: the Sun Titan's god mode. V (60 s, then a 90 s wait) or fly into the Sun (120 s, no wait).
// ================================================================
// While it lasts you cannot be hurt, fly 1.5x faster, glow gold, and the four hotbar slots become four sun powers:
// 1 Solar Lance (hold: a piercing sun beam), 2 Heat Wave (a ring of heat), 3 Collapsing Star (a huge black hole),
// 4 Eclipse (the dark mode: the screen goes dark and every living thing around you is knocked down by dark bolts).
// Hooks for later phases: sunGodOn(), Bus 'sunGodEnd' ({src}), save.guide.sgV / sgSun.
const SG={on:false,t:0,max:60,src:'v',cd:0,cds:[0,0,0,0],lance:false,waves:[],ecl:null,armed:true,hintT:0,fx:0,dark:0,tint:0,lastTxt:''};
const SG_NAMES=['Solar Lance','Heat Wave','Collapsing Star','Eclipse'],SG_CD=[0,3,12,30];
const sgSeed=()=>ufoBoost()&&hasTrav('solarFlight'),sgVDur=()=>sgSeed()?90:60,sgVCd=()=>sgSeed()?20:90; // UFO boost (Star Seed): V lasts 90 s and comes back after 20 s
const sunGodOn=()=>SG.on;
const sgSpeedMul=()=>SG.on?1.5:1;
const SUN_B=PLANETS.find(b=>b.sun);
const sgBig=a=>a.kind==='boss'||(a.maxHp||0)>3000||!!a.bigBoss; // bosses take fixed big numbers, everyone else goes down at once
function sgHit(a,bossDmg,type,opt){return Damage.apply(P,a,sgBig(a)?bossDmg:Math.ceil((a.hp||50)*2+100),type,opt);}
const SGL={},SG_GOLD={suit:[1,.78,.2,1],suit2:[1,.93,.55,1],cape:[1,.52,.08,1],acc:[1,1,.85,1]},SG_DARK={suit:[.05,.04,.07,1],suit2:[.85,.62,.14,1],cape:[.03,.02,.06,1],acc:[1,.8,.3,1]};
// the look drawSuper uses while Sun God is on: gold, or black and gold during Eclipse
function sgLook(m){if(PR.on)return prismLook(m);return SG.on?Object.assign(SGL,m,SG.ecl?SG_DARK:SG_GOLD,{metal:false,armor:false,capeOn:true}):m;}
function sunGodStart(src,force){
  if(SG.on){if(src==='sun'&&SG.t<120-0.5&&SG.src!=='arena'){SG.t=SG.max=120;SG.src='sun';toast('The Sun feeds you','Sun God for 120 s','gold');}return false;}
  if(state!=='play'||P.dead||(!force&&(!hasTrav('solarFlight')||!canAct())))return false;
  if(PR.on&&src!=='arena')return false; // the Prism form has only Destroy
  if(src==='v'&&SG.cd>0){feed('Sun God is recharging',Math.ceil(SG.cd)+' s left');SFX.tone('square',300,200,0.12,0.06);return false;}
  if(P.alien)revertAlien(true);stopAllPowers();
  SG.on=true;SG.src=src==='sun'?'sun':src==='arena'?'arena':'v';SG.t=SG.max=src==='sun'?120:src==='arena'?9999:sgVDur(); // 'arena': Kathana's fight, every hero, no timer, you can be hurtSG.cds=[0,0,0,0];SG.lance=false;SG.waves.length=0;SG.ecl=null;SG.fx=0;
  P.hp=maxHp();P.en=maxEn();P.flying=true;P.grounded=false;P.vel.y=Math.max(P.vel.y,6);P.stun=0;
  const c=center(P),cx=c.x,cy=c.y,cz=c.z;ringFx(cx,cy,cz,1,24,0.7,[1,.85,.35]);ringFx(cx,cy,cz,1,14,0.45,[1,1,.9]);burst(cx,cy,cz,120,30,1.2,[[1,.85,.3],[1,.6,.15],[1,1,.85]],2,0,1.6);
  flashWhite=0.7;SFX.transform();SFX.boom(1,1.4);addShake(0.5);
  if(src!=='arena')toast('SUN GOD',(SG.max)+' s · you cannot be hurt · 1 Lance · 2 Heat Wave · 3 Star · 4 Eclipse','gold');else toast('SUN GOD','1 Lance · 2 Heat Wave · 3 Star · 4 Eclipse','gold');
  if(SG.src==='v'&&!save.guide.sgV){save.guide.sgV=true;persist();}
  buildHotbar();buildTouchButtons();sgHud(true);return true;}
function sunGodEnd(silent,stay){ // stay: the Prism form starts inside the Sun, so don't push you out of it
  if(!SG.on)return;const src=SG.src;
  SG.on=false;SG.lance=false;SG.ecl=null;SG.waves.length=0;beam=null;SFX.setLaser(false);P.flash=0;
  if(src==='v')SG.cd=sgVCd();
  if(!stay&&SUN_B&&P.pos.y>CEIL){const dx=P.pos.x-SUN_B.x,dy=P.pos.y-SUN_B.y,dz=P.pos.z-SUN_B.z,d=Math.hypot(dx,dy,dz);
    if(d<SUN_B.r+900){const k=(SUN_B.r+1100)/(d||1),nx=d>1e-3?dx*k:0,ny=d>1e-3?dy*k:SUN_B.r+1100,nz=d>1e-3?dz*k:0;P.pos.set(SUN_B.x+nx,SUN_B.y+ny,SUN_B.z+nz);P.vel.set(0,0,0);P.sunT=time+3;} // the Sun lets go of you
  }
  const c=center(P);ringFx(c.x,c.y,c.z,1,18,0.6,[1,.85,.35]);burst(c.x,c.y,c.z,70,16,1,[[1,.85,.3],[1,1,.85]],1.6,0,1.6);flashWhite=Math.max(flashWhite,0.6);SFX.tone('sine',1200,200,0.5,0.1);
  buildHotbar();buildTouchButtons();sgHud(false);
  if(!silent){toast('The Sun God fades',src==='v'?'Back in '+sgVCd()+' s':'The Sun will feed you again','gold');
    if(!save.guide.sgSun){save.guide.sgSun=true;persist();later(2.6,()=>{if(state==='play')toast('Try V, then fly into the Sun',touchOn()?'V: the sun button · the Sun gives you 120 s':'V gives '+sgVDur()+' s · the Sun gives you 120 s','gold');});}}
  Bus.emit('sunGodEnd',{src,silent:!!silent});}
// ---- the four skills ----
function sgAbilityDown(slot){
  if(!SG.on||!canAct())return;
  if(slot===0){SG.lance=true;return;}
  if(SG.cds[slot]>0){feed(SG_NAMES[slot],'Ready in '+SG.cds[slot].toFixed(1)+' s');SFX.tone('square',300,200,0.1,0.06);return;}
  if(slot===3&&SG.ecl)return;
  SG.cds[slot]=SG_CD[slot];faceAim();[null,sgHeat,sgStar,sgEclipse][slot]();}
function sgAbilityUp(slot){if(slot===0)SG.lance=false;}
// 1 Solar Lance: a thick beam that pierces everything in a line, ignites it and throws it back
function sgLance(dt){
  faceAim();const e=P.eye,R=220;let dx=camF.x,dy=camF.y,dz=camF.z;
  if(aim.hitAny){dx=aim.x-e.x;dy=aim.y-e.y;dz=aim.z-e.z;const l0=Math.hypot(dx,dy,dz)||1;dx/=l0;dy/=l0;dz/=l0;}
  let L=rayCity(e.x,e.y,e.z,dx,dy,dz,R),hb=null,surf=false,nx=0,ny=1,nz=0;
  if(L<R-0.3){hb=RAYHIT.b;surf=true;nx=RAYHIT.nx;ny=RAYHIT.ny;nz=RAYHIT.nz;}else L=R;
  if(dy<-0.001){const tg=-e.y/dy;if(tg>0&&tg<L){L=tg;surf=true;nx=0;ny=1;nz=0;hb=null;}}
  const tx=e.x+dx*L,ty=e.y+dy*L,tz=e.z+dz*L;beam={x:tx,y:ty,z:tz};SG.lanceTo=beam;
  if(hb&&Math.random()<dt*4)breakWindowAt(hb,tx,ty,tz);
  if(hb&&hb.bld&&Math.random()<dt*3)damageBuilding(hb.bld,600,tx,ty,tz,dx,dz);
  for(const a of actors){if(!a.alive||a.held||a===P||a.kind==='prop'||a.kind==='remote')continue;const c=center(a),vx=c.x-e.x,vy=c.y-e.y,vz=c.z-e.z,t=vx*dx+vy*dy+vz*dz;if(t<0||t>L+3)continue;
    const px=vx-dx*t,py=vy-dy*t,pz=vz-dz*t,rad=(a.radius||1)+2.4;if(px*px+py*py+pz*pz>rad*rad)continue;
    sgHit(a,Math.round(800*dt)+1,'fire',{burn:{dps:40,time:4},kv:[dx*32,9,dz*32],flung:true,stun:0.6});}
  if(Math.random()<dt*6)hitProps(tx,Math.min(ty,6),tz,5,P,26);
  if(surf&&Math.random()<dt*2)addFire(tx+nx*0.3,ty+ny*0.3,tz+nz*0.3,4,2);
  if(surf&&time-(SG.scorchT||0)>0.1){SG.scorchT=time;addScorch(tx,ty,tz,3,nx,ny,nz);}
  for(let i=0;i<5;i++)emit(tx,ty,tz,rr(-14,14),rr(2,20),rr(-14,14),rr(0.3,0.8),Math.random()<0.5?[1,.9,.5]:[1,.55,.15],rr(0.8,1.8),18,0.5);
  for(let i=0;i<2;i++){const s=rr(20,50);emit(e.x+dx*2,e.y+dy*2-0.1,e.z+dz*2,(dx+rr(-.08,.08))*s,(dy+rr(-.08,.08))*s,(dz+rr(-.08,.08))*s,0.4,[1,.85,.4],rr(0.8,1.4),0,0.6);}
  if(Math.random()<dt*5)addShake(0.12);SFX.setLaser(true);}
// 2 Heat Wave: a ring of heat sweeps out 45 m; everyone it touches is thrown back burning
function sgHeat(){const c=center(P);SG.waves.push({x:c.x,y:c.y,z:c.z,t:0,hit:new Set(),fireT:0});
  ringFx(c.x,c.y-0.6,c.z,1,48,0.9,[1,.55,.15]);ringFx(c.x,c.y,c.z,1,42,0.8,[1,.9,.55]);later(0.12,()=>ringFx(c.x,c.y,c.z,1,34,0.7,[1,1,.9]));
  burst(c.x,c.y,c.z,100,50,0.9,[[1,.85,.3],[1,.5,.12],[1,1,.85]],2.4,0,1.2);flashWhite=Math.max(flashWhite,0.35);SFX.boom(1,1.2);addShake(0.7);hitProps(c.x,Math.min(c.y,6),c.z,28,P,40);scare(c.x,c.z,90);}
function sgWaveTick(dt){
  for(let i=SG.waves.length-1;i>=0;i--){const W=SG.waves[i];W.t+=dt;const k=Math.min(1,W.t/0.9),r=45*(1-(1-k)*(1-k));
    for(const a of actors){if(!a.alive||a.held||a===P||a.kind==='prop'||a.kind==='remote'||W.hit.has(a))continue;const c=center(a),dx=c.x-W.x,dz=c.z-W.z,d=Math.hypot(dx,c.y-W.y,dz);if(d>r+(a.radius||1))continue;
      W.hit.add(a);const l=Math.hypot(dx,dz)||1;sgHit(a,600,'fire',{burn:{dps:60,time:5},kv:[dx/l*34,14,dz/l*34],flung:true,stun:1.5});}
    for(let j=0;j<18;j++){const an=rr(0,TAU);emit(W.x+Math.cos(an)*r,W.y+rr(-1.2,3),W.z+Math.sin(an)*r,Math.cos(an)*9,rr(2,9),Math.sin(an)*9,0.7,Math.random()<0.5?[1,.8,.3]:[1,.45,.1],rr(1.5,3.5),-2,1);}
    W.fireT-=dt;if(W.fireT<=0&&W.t<0.9){W.fireT=0.1;const an=rr(0,TAU),fx=W.x+Math.cos(an)*r,fz=W.z+Math.sin(an)*r;if(W.y<60)addFire(fx,groundY(fx,fz,W.y+2)+0.3,fz,4,1.4);}
    if(W.t>1.1)SG.waves.splice(i,1);}}
// 3 Collapsing Star: a huge black hole (the ring's hole, much bigger, no cost) that pulls in everything for 5 s, then implodes
function sgStar(){let x=aim.x,y=aim.y,z=aim.z;const d=Math.hypot(x-P.pos.x,z-P.pos.z);
  if(!aim.hitAny||d>180||d<20){x=P.pos.x+camF.x*70;y=P.pos.y+camF.y*70+8;z=P.pos.z+camF.z*70;}
  y=Math.max(groundY(x,z,P.pos.y+200)+14,y);
  holes.push({x,y,z,t:0,dur:5,R:120,next:0,hitT:0,own:true,sg:true});
  SFX.tone('sine',60,30,3,0.2);SFX.boom(0.9,0.5);addShake(0.7);flashWhite=0.3;feed('Collapsing Star','Everything within 120 m is falling in');}
function sgImplode(H){const R=H.R;
  for(const a of actors){if(!a.alive||a===P||a.kind==='prop'||a.kind==='remote')continue;const c=center(a),dx=c.x-H.x,dz=c.z-H.z,d=Math.hypot(dx,c.y-H.y,dz);if(d>R+(a.radius||1))continue;const l=Math.hypot(dx,dz)||1;
    sgHit(a,Math.round(1200*clamp(1-d/(R*1.3),0.3,1)),'blast',{kv:[dx/l*30,20,dz/l*30],flung:true,stun:2});}
  hitProps(H.x,Math.min(H.y,6),H.z,R*0.6,P,40);explode(H.x,H.y,H.z,3);ringFx(H.x,H.y,H.z,1,R*1.5,0.7,[1,.8,.4]);ringFx(H.x,H.y,H.z,1,R,0.5,[1,1,1]);
  burst(H.x,H.y,H.z,140,80,1.2,[[1,.85,.3],[.7,.45,1],[1,1,1]],3,0,1.2);addShake(1.2);SFX.boom(1,1.8);}
// 4 Eclipse: the dark mode. 4 s of darkness while a chain of dark bolts knocks down every hostile and neutral NPC within 250 m
const SG_ECL_KINDS=new Set(['human','drone','rival','heli','boss']);
function sgEclipse(){
  const c=center(P),cx=c.x,cy=c.y,cz=c.z,list=[];
  for(const a of actors){if(!a.alive||a.held||a===P||!SG_ECL_KINDS.has(a.kind))continue;const d=Math.hypot(a.pos.x-cx,a.pos.y-cy,a.pos.z-cz);if(d<250)list.push({a,d});}
  list.sort((p,q)=>p.d-q.d);const targets=list.slice(0,120).map(o=>o.a);
  SG.ecl={t:0,dur:4,list:targets,i:0,fx:cx,fy:cy,fz:cz,bossT:0,crown:0};
  flashWhite=0.25;SFX.tone('sawtooth',90,40,1.2,0.14);SFX.boom(0.8,1.6);addShake(0.5);ringFx(cx,cy,cz,1,30,0.8,[.55,.25,1]);ringFx(cx,cy,cz,1,20,0.6,[1,.8,.3]);
  toast('ECLIPSE','Nobody can stand in the dark','purple');}
function sgBolt(ax,ay,az,bx,by,bz){let px=ax,py=ay,pz=az;const n=4;
  for(let i=1;i<=n;i++){const k=i/n,j=i<n?1.6:0,qx=lerp(ax,bx,k)+rr(-j,j),qy=lerp(ay,by,k)+rr(-j,j),qz=lerp(az,bz,k)+rr(-j,j);
    tracer(px,py,pz,qx,qy,qz,[.3,.08,.55],0.45,0.3);tracer(px,py,pz,qx,qy,qz,[1,.85,.4],0.1,0.3);px=qx;py=qy;pz=qz;}}
function sgEclipseTick(dt){const E=SG.ecl;if(!E)return;E.t+=dt;const c=center(P),cx=c.x,cy=c.y,cz=c.z;
  const want=Math.min(E.list.length,Math.ceil(E.list.length*Math.min(1,E.t/3.4)));
  while(E.i<want){const a=E.list[E.i++];if(!a.alive)continue;const t=center(a),tx=t.x,ty=t.y,tz=t.z,dx=tx-cx,dz=tz-cz,l=Math.hypot(dx,dz)||1;
    sgBolt(E.fx,E.fy,E.fz,tx,ty,tz);burst(tx,ty,tz,14,9,0.5,[[.5,.2,1],[1,.85,.4]],1.4,0,2);
    sgHit(a,1200,'dark',{kv:[dx/l*26,16,dz/l*26],flung:true,stun:3});E.fx=tx;E.fy=ty;E.fz=tz;}
  E.bossT-=dt;if(E.bossT<=0){E.bossT=0.5;for(const a of E.list)if(a.alive&&sgBig(a)){const t=center(a);sgBolt(cx,cy+0.5,cz,t.x,t.y,t.z);sgHit(a,1200,'dark',{stun:1});}}
  E.crown-=dt;if(E.crown<=0){E.crown=0.1;const an=rr(0,TAU),r=rr(14,40);sgBolt(cx,cy+0.5,cz,cx+Math.cos(an)*r,cy+rr(-4,12),cz+Math.sin(an)*r);}
  if(E.t>=E.dur){SG.ecl=null;flashWhite=Math.max(flashWhite,0.3);SFX.tone('sine',700,150,0.6,0.1);}}
// V (key, slot or touch button): start it, or say how long is left
function sunGodKey(){if(state!=='play'||P.dead||dialOpen||paused)return;if(SG.on){feed('Sun God',Math.ceil(SG.t)+' s left');return;}sunGodStart('v');}
// the hotbar and the touch buttons while it lasts (the normal kit is back when it ends)
function sgBuildHotbar(){
  SG_NAMES.forEach((n,i)=>{const cd=el('i',{class:'cd',hidden:true}),s=el('div',{class:'slot sg'},cd,el('kbd',{text:touchOn()?'':SLOT_KEYS[i]}),el('span',{class:'nm',text:n}),el('small',{text:'Sun God'}));hud.hotbar.appendChild(s);slotEls.push({sg:i,s,cd});});
  const tb=el('i'),s=el('div',{class:'slot move band vslot sgv'},el('kbd',{text:touchOn()?'':'V'}),el('span',{class:'nm',text:'Sun God'}),el('div',{class:'bar tbar'},tb));s.addEventListener('click',vPress);hud.hotbar.appendChild(s);slotEls.push({sgTimer:tb,s});}
function sgTouchButtons(){['Lance','Heat','Star','Eclipse'].forEach((n,i)=>{const b=tbMake('p'+i,'a'+i,'sun',n,'B','ab alien','#ffd23c');b.prepend(el('i',{class:'cd',hidden:true}));});}
// ---- per frame ----
function sgHud(show){const b=$('sgbar');if(b)b.hidden=!show;SG.lastTxt='';}
function updateSunGod(dt){
  if(SG.cd>0)SG.cd=Math.max(0,SG.cd-dt);
  const isTitan=hasTrav('solarFlight');
  // the hint: a minute after becoming the Sun Titan (until V has been used once)
  if(isTitan&&!SG.on&&!save.guide.sgV&&!P.dead&&(SG.hintT+=dt)>=60){save.guide.sgV=true;persist();toast(touchOn()?'Tap the sun button':'Press V to become the Sun God',touchOn()?'Become the Sun God: invincible for 60 s':'Invincible for 60 s with four sun powers','gold');}
  if(isTitan&&!SG.on&&P.pos.y>CEIL&&SUN_B){const d=Math.hypot(P.pos.x-SUN_B.x,P.pos.y-SUN_B.y,P.pos.z-SUN_B.z);if(d>SUN_B.r+9000)SG.armed=true;else if(d<SUN_B.r+6000&&SG.armed&&sunGodStart('sun'))SG.armed=false;}
  if(!SG.on){sgTint(0,0);return;}
  const arena=SG.src==='arena';if(arena&&P.alien)revertAlien(true);
  if(P.dead||(!isTitan&&!arena)||(P.alien&&!arena)){sunGodEnd(true);sgTint(0,0);return;}
  if(!arena){SG.t-=dt;if(SG.t<=0){sunGodEnd(false);sgTint(0,0);return;}P.hp=maxHp();}
  P.en=maxEn();P.lastSpend=time;
  if(SG.lance&&canAct())sgLance(dt);else{SG.lance=false;SG.lanceTo=null;}
  for(let i=1;i<4;i++)if(SG.cds[i]>0)SG.cds[i]=Math.max(0,SG.cds[i]-dt);
  sgWaveTick(dt);sgEclipseTick(dt);
  P.flash=SG.ecl?0.14:0.5+0.1*Math.sin(time*5);
  { // golden sparks and a rising glow of embers
    const c=center(P);for(let i=0;i<(SG.ecl?3:2);i++)emit(c.x+rr(-1,1),c.y+rr(-1.3,1.3),c.z+rr(-1,1),rr(-2,2),rr(1,5),rr(-2,2),rr(0.5,1),SG.ecl?(Math.random()<0.5?[.55,.25,1]:[1,.8,.3]):(Math.random()<0.5?[1,.85,.35]:[1,.55,.15]),rr(0.7,1.5),-1,0.6);}
  // the pill under the meters, and the hotbar slots
  const txt=(SG.ecl?'ECLIPSE · ':'SUN GOD')+(arena?'':' '+Math.ceil(SG.t)+'s');if(SG.lastTxt!==txt){SG.lastTxt=txt;$('sgbar-t').textContent=txt;}
  {const b=$('sgbar');b.classList.toggle('dark',!!SG.ecl);}$('sgbar-f').style.width=(clamp(SG.t/SG.max,0,1)*100).toFixed(1)+'%';
  for(const s of slotEls){if(s.sg!==undefined){const i=s.sg,v=Math.round(clamp(i>0&&SG.cds[i]>0?SG.cds[i]/SG_CD[i]:0,0,1)*100);if(s.cdv!==v){s.cdv=v;s.cd.style.setProperty('--p',v+'%');s.cd.hidden=v<=0;}
      s.s.classList.toggle('on',i===0?SG.lance:i===3?!!SG.ecl:false);s.s.classList.toggle('dk',!!SG.ecl);}
    else if(s.sgTimer)setW(s.sgTimer,'sgt',SG.t/SG.max);}
  if(touchOn())for(let i=0;i<4;i++){const t=TB['p'+i],cd=t&&t.b.querySelector('.cd');if(!cd)continue;const v=Math.round(clamp(i>0&&SG.cds[i]>0?SG.cds[i]/SG_CD[i]:0,0,1)*100);if(t.cdv!==v){t.cdv=v;cd.style.setProperty('--p',v+'%');cd.hidden=v<=0;}t.b.classList.toggle('on',i===0?SG.lance:i===3?!!SG.ecl:false);}
  // inside the Sun everything is gold-white
  let tint=0;if(SUN_B&&P.pos.y>CEIL){const d=Math.hypot(P.pos.x-SUN_B.x,P.pos.y-SUN_B.y,P.pos.z-SUN_B.z);tint=clamp((SUN_B.r+2500-d)/(2500+SUN_B.r*0.2),0,1)*0.92;}
  sgTint(SG.ecl?1:0,tint);}
function sgTint(dark,tint){
  if(SG.dark!==dark){SG.dark=dark;$('sgdark').style.opacity=String(dark);}
  const t=Math.round(tint*100)/100;if(SG.tint!==t){SG.tint=t;$('sgtint').style.opacity=String(t);}}
// ---- drawing: the glow around you, the lance and the dark rings ----
function drawSunGod(){
  if(!SG.on||P.dead||state!=='play'&&state!=='menu')return;
  const FA=zone&&zone.white&&KA.flood>0.55?F_BL:F_ADD,x=P.pos.x,y=P.pos.y+1.35,z=P.pos.z,p=0.5+0.5*Math.sin(time*6),dk=!!SG.ecl,s=2.3+p*0.35;
  const g=dk?[.5,.22,.95]:[1,.75,.25];
  queue(MESH.glowSphere,at(x,y,z,0,0,0,s,s*1.15,s),[g[0],g[1],g[2],0.1+0.05*p],FA);
  queue(MESH.glowSphere,at(x,y,z,0,0,0,s*1.6,s*1.7,s*1.6),[g[0],g[1],g[2],0.05],FA);
  queue(MESH.ring,M4.alignY(tmpM(),x,y,z,Math.sin(time*1.3)*0.5,1,Math.cos(time*1.1)*0.5,s*0.85),[1,.88,.45,0.55],FA);
  queue(MESH.ring,M4.alignY(tmpM(),x,y,z,Math.cos(time*1.7)*0.6,1,Math.sin(time*1.4)*0.6,s*1.15),dk?[.7,.4,1,0.5]:[1,.6,.2,0.45],FA);
  if(SG.lance&&SG.lanceTo){const e=P.eye,b=SG.lanceTo,w=1+Math.sin(time*40)*0.08;
    queue(MESH.glowBox,M4.beam(tmpM(),e.x,e.y-0.1,e.z,b.x,b.y,b.z,0.7*w),[1,1,.9,1],FA);
    queue(MESH.glowBox,M4.beam(tmpM(),e.x,e.y-0.1,e.z,b.x,b.y,b.z,1.9*w),[1,.78,.25,0.55],FA);
    queue(MESH.glowBox,M4.beam(tmpM(),e.x,e.y-0.1,e.z,b.x,b.y,b.z,3.8*w),[1,.45,.1,0.22],FA);
    const q=3+Math.random()*1.2;queue(MESH.glowSphere,at(b.x,b.y,b.z,0,0,0,q,q,q),[1,.7,.25,0.6],FA);queue(MESH.glowSphere,at(b.x,b.y,b.z,0,0,0,q*2.2,q*2.2,q*2.2),[1,.5,.15,0.2],FA);}
  for(const W of SG.waves){const k=Math.min(1,W.t/0.9),r=45*(1-(1-k)*(1-k)),f=Math.max(0,1-W.t/1.1);
    queue(MESH.ring,M4.alignY(tmpM(),W.x,W.y-0.8,W.z,0,1,0,r),[1,.6,.2,0.7*f],FA);queue(MESH.ring,M4.alignY(tmpM(),W.x,W.y+1,W.z,0,1,0,r*0.9),[1,.95,.7,0.5*f],FA);}
}
