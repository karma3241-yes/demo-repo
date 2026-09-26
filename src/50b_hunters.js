// ================================================================
// Hunter squads: armadas of AI robot supers
// ================================================================
// Villain side: stay at 5 stars long enough and the city sends hero robots to hunt you down.
// Hero side: rack up a long win streak (takedowns without going down) and villain robots come for you.
// Squads grow with every wave while the rampage or streak goes on. They pull out when you go down,
// or (villain side) when your stars drop. Each robot has its own kit: fliers, speedsters, brawlers, beamers and bombers.
const HUNT={fiveStarWait:15,waveGap:25,streakStart:25,streakStep:10,firstWave:3,maxWave:7,maxAlive:10};
const HUNTER_KITS={
  flier:{name:'Skyhunter',hp:1,speed:50},
  speedster:{name:'Blitz Unit',hp:0.8,speed:85},
  brawler:{name:'Crusher',hp:2.2,speed:26,scale:1.6},
  beamer:{name:'Lancer',hp:1,speed:34},
  bomber:{name:'Payload',hp:1.3,speed:30},
};
const KIT_IDS=Object.keys(HUNTER_KITS);
const HUNT_LOOK={hero:[['#e8eef6','#2a6fd6','#7fe0ff'],['#d9dde4','#1f9e8e','#7fe0ff']],villain:[['#1b1b1f','#a3122a','#ff3d3d'],['#2b1b3a','#6b1fa0','#ff3dcf']]};
// one hunt per hunted player: 'me', or a remote player's peer id when you host a room-code game
const hunts=new Map();let myStreak=0,myNextStreak=HUNT.streakStart;
const huntOf=key=>{let h=hunts.get(key);if(!h){h={side:null,wave:0,t:0,fiveT:0,nextStreak:HUNT.streakStart};hunts.set(key,h);}return h;};
function hunterLook(fac){const L=pick(HUNT_LOOK[fac]);return {suit:c4(L[0]),suit2:[...hex(L[0],0.6),1],cape:c4(L[1]),acc:c4(L[2]),capeOn:false,metal:false,armor:true,visor:hex(L[2],1)};}
function spawnHunter(fac,kit,T,key,wave){
  const r=spawnRival(fac),K=HUNTER_KITS[kit];r.hunter=kit;r.robot=true;r.huntKey=key;r.huntT=T;r.name=K.name+' '+(fac==='hero'?'H':'V')+'-'+Math.floor(rr(10,99));
  r.look=hunterLook(fac);r.bounty=false;r.maxHp=Math.round(r.maxHp*K.hp*(1+wave*0.15));r.hp=r.maxHp;r.giantS=K.scale||1;r.radius=0.9*(K.scale||1);r.cy=1.3*(K.scale||1);
  const a=rr(0,TAU),d=rr(160,220);r.pos.set(clamp(T.pos.x+Math.cos(a)*d,-LIMIT,LIMIT),kit==='speedster'||kit==='brawler'?2:rr(60,110),clamp(T.pos.z+Math.sin(a)*d,-LIMIT,LIMIT));
  r.target=T;r.attackT=rr(0.5,1.5);return r;
}
const huntersAlive=()=>rivals.filter(r=>r.hunter&&r.alive&&!r.net);
function sendWave(h,key,T,side){
  h.wave++;const n=Math.min(HUNT.maxWave,HUNT.firstWave+h.wave-1),room=HUNT.maxAlive-huntersAlive().length,fac=side==='villain'?'hero':'villain';
  for(let i=0;i<Math.min(n,room);i++)spawnHunter(fac,KIT_IDS[(i+h.wave)%KIT_IDS.length],T,key,h.wave);
  if(key==='me'){toast(h.wave===1?'Hunter squad inbound':'Hunter squad · wave '+h.wave,(fac==='hero'?'Hero robots':'Villain robots')+' are coming for you · '+n+' units','red');
    SFX.tone('sawtooth',300,900,0.5,0.1);later(0.5,()=>SFX.tone('sawtooth',300,900,0.5,0.1));}
  else feed('Hunter squad','Robots are after '+(T.name||'another player'));
}
function callOffHunt(key,why){const h=hunts.get(key);if(!h||!h.side)return;h.side=null;h.wave=0;h.t=0;
  for(const r of rivals)if(r.hunter&&!r.net&&r.huntKey===key)r.retreat=true;if(why&&key==='me')feed('The hunters pull out',why);}
// takedowns build a hero's streak; going down ends it
Bus.on('defeated',({target,killer})=>{
  if(killer!==P||!target||target===P)return;
  if(playerFaction()==='hero'&&(target.faction==='criminal'||target.faction==='villain'||target.kind==='drone'||target.kind==='boss')){myStreak++;
    if(myStreak===10||myStreak===20)feed('Win streak '+myStreak,'Keep it going and the villains will send something after you');}
});
Bus.on('playerDefeated',()=>{myStreak=0;const h=huntOf('me');h.nextStreak=HUNT.streakStart;h.fiveT=0;callOffHunt('me','');});
function huntTick(key,T,stars,streak,fac,down,dt){
  const h=huntOf(key);
  if(down){h.fiveT=0;h.nextStreak=HUNT.streakStart;callOffHunt(key,'');return;}
  // villain side: a long stretch at 5 stars
  if(stars>=5){h.fiveT+=dt;if(!h.side&&h.fiveT>=HUNT.fiveStarWait){h.side='villain';h.t=0;sendWave(h,key,T,'villain');}}
  else{h.fiveT=0;if(h.side==='villain')callOffHunt(key,'Your wanted level dropped');}
  if(h.side==='villain'){h.t+=dt;if(h.t>=HUNT.waveGap){h.t=0;sendWave(h,key,T,'villain');}}
  // hero side: a long win streak
  if(fac==='hero'&&streak>=h.nextStreak&&h.side!=='villain'){h.nextStreak+=HUNT.streakStep;h.side='hero';sendWave(h,key,T,'hero');}
  if(h.side==='hero'&&fac!=='hero')callOffHunt(key,'');
  if(fac==='hero'&&streak<h.nextStreak-HUNT.streakStep)h.nextStreak=Math.max(HUNT.streakStart,streak+HUNT.streakStep); // a remote player's streak reset
}
function updateHunters(dt){
  if(state!=='play'||WS.mirror)return; // in a room-code game the host runs every squad
  huntTick('me',P,P.stars,myStreak,playerFaction(),P.dead,dt);
  if(WS.host)for(const [id,q] of MP.peers)huntTick(id,q,q.stars||0,q.sk||0,q.faction,!q.alive||!!(q.flags&FLAG.dead),dt);
  for(const key of [...hunts.keys()])if(key!=='me'&&!MP.peers.has(key)){callOffHunt(key,'');hunts.delete(key);}
  for(const r of rivals)if(r.retreat&&r.alive){r.target=null;r.vel.y+=40*dt;if(r.pos.y>CEIL-20||Math.hypot(r.pos.x-P.pos.x,r.pos.z-P.pos.z)>400)removeActor(r);}
}
// each robot fights with its own kit (called from updateRival instead of the plain flying blaster)
function hunterBrain(r,dt){
  const K=HUNTER_KITS[r.hunter],kit=r.hunter;if(r.retreat){r.pos.addS(r.vel,dt);return true;}
  if(!r.target||!validTarget(r.target)){r.target=r.huntT&&validTarget(r.huntT)?r.huntT:null;if(!r.target){r.retreat=true;return true;}}
  const t=center(r.target),dx=t.x-r.pos.x,dz=t.z-r.pos.z,dist=Math.hypot(dx,t.y-r.pos.y,dz),sl=1-(r.slow||0);
  let gx=t.x,gy=t.y,gz=t.z,sp=K.speed*sl;
  if(kit==='flier'){r.orbit+=dt*0.9;gx=t.x+Math.cos(r.orbit)*20;gz=t.z+Math.sin(r.orbit)*20;gy=Math.max(t.y+6,5);}
  else if(kit==='beamer'){r.orbit+=dt*0.35;gx=t.x+Math.cos(r.orbit)*34;gz=t.z+Math.sin(r.orbit)*34;gy=Math.max(t.y+10,8);}
  else if(kit==='bomber'){r.orbit+=dt*0.25;gx=t.x+Math.cos(r.orbit)*14;gz=t.z+Math.sin(r.orbit)*14;gy=Math.max(t.y+26,30);}
  else{gy=Math.max(groundY(r.pos.x,r.pos.z,r.pos.y+2),t.y-1);} // speedsters and brawlers come at you on foot
  const sx=gx-r.pos.x,sy=gy-r.pos.y,sz=gz-r.pos.z,l=Math.hypot(sx,sy,sz)||1,v=Math.min(l*2,sp),k=damp(kit==='speedster'?5:2.5,dt);
  r.vel.x+=(sx/l*v-r.vel.x)*k;r.vel.y+=(sy/l*v-r.vel.y)*k;r.vel.z+=(sz/l*v-r.vel.z)*k;
  if(kit==='brawler'||kit==='speedster'){const g=groundY(r.pos.x,r.pos.z,r.pos.y+2);if(r.pos.y>g+0.5&&dist>12)r.vel.y-=30*dt;
    const b=inBuilding(r.pos.x+r.vel.x*0.2,r.pos.y+1,r.pos.z+r.vel.z*0.2,1);if(b){r.vel.y=Math.max(r.vel.y,kit==='brawler'?22:30);} // leap over what's in the way
    if(kit==='speedster'&&Math.random()<0.7)emit(r.pos.x,r.pos.y+rr(0.4,2.2),r.pos.z,0,0,0,0.3,[r.look.acc[0],r.look.acc[1],r.look.acc[2]],1.2,0,0);}
  r.pos.addS(r.vel,dt);
  const b=inBuilding(r.pos.x,r.pos.y,r.pos.z,1.5);if(b){r.pos.y=lerp(r.pos.y,b.y1+2,damp(6,dt));r.vel.y=Math.max(r.vel.y,6);}
  r.pos.x=clamp(r.pos.x,-LIMIT,LIMIT);r.pos.z=clamp(r.pos.z,-LIMIT,LIMIT);r.pos.y=clamp(r.pos.y,Math.max(0,groundY(r.pos.x,r.pos.z,r.pos.y+2)),CEIL);
  r.heroYaw=angLerp(r.heroYaw,Math.atan2(dx,dz),damp(6,dt));const hs=Math.hypot(r.vel.x,r.vel.z);r.tilt=lerp(r.tilt,kit==='speedster'?0.4:clamp(hs/30,0,1)*1.1,damp(4,dt));
  r.attackT-=dt;const lvl=r.level,o={x:r.pos.x,y:r.pos.y+1.9*(r.giantS||1),z:r.pos.z};
  if(r.attackT<=0){
    if(kit==='flier'&&dist<80){r.attackT=rr(0.7,1.2);if(losClear(o.x,o.y,o.z,t.x,t.y,t.z)){const d=dirTo(o,t.x,t.y,t.z);fireProj({kind:'blast',owner:r,x:o.x,y:o.y,z:o.z,vx:d[0]*85,vy:d[1]*85,vz:d[2]*85,dmg:12+lvl*1.5,knock:10,r:0.5,life:2});r.castT=time;}}
    else if(kit==='beamer'&&dist<90){r.attackT=0.12;if(losClear(o.x,o.y,o.z,t.x,t.y,t.z)){tracer(o.x,o.y,o.z,t.x+rr(-.3,.3),t.y+rr(-.3,.3),t.z+rr(-.3,.3),r.look.visor,0.18,0.1);Damage.apply(r,r.target,2+lvl*0.25,'beam');r.castT=time;}}
    else if(kit==='bomber'&&Math.hypot(dx,dz)<30){r.attackT=rr(1.4,2);fireProj({kind:'rocket',owner:r,x:o.x,y:o.y-1,z:o.z,vx:dx*0.4+rr(-3,3),vy:-20,vz:dz*0.4+rr(-3,3),dmg:28+lvl*2,r:0.6,life:5,grav:20,col:0});r.castT=time;SFX.whoosh();}
    else if(kit==='speedster'&&dist<3.2){r.attackT=0.6;Damage.apply(r,r.target,10+lvl,'punch',{knock:16});r.castT=time;SFX.punch(0.8);}
    else if(kit==='brawler'&&dist<5*(r.giantS||1)){r.attackT=1.8;const c=center(r);areaDamage(c.x,r.pos.y+0.5,c.z,7,30+lvl*2.5,r,{knock:26,type:'blast'});shockAt(r.pos.x,r.pos.y+0.5,r.pos.z,0.8);addShake(0.3*SFX.vol(r.pos.x,r.pos.y,r.pos.z));SFX.boom(0.5*SFX.vol(r.pos.x,r.pos.y,r.pos.z),0.7);r.castT=time;}
    else r.attackT=0.3;}
  const a=r.anim,kk=damp(8,dt);a.armR=lerp(a.armR,time-(r.castT||-9)<0.3?-1.5:hs>15?-2.9:-0.4,kk);a.armL=lerp(a.armL,-0.3,kk);
  const run=(kit==='speedster'||kit==='brawler')&&hs>2?Math.sin(time*(kit==='speedster'?24:9))*0.9:0;a.legL=lerp(a.legL,0.1+run,kk);a.legR=lerp(a.legR,0.25-run,kk);a.cape=0.15;
  return true;
}
// a glowing visor so they read as machines
function drawHunterVisors(){for(const r of rivals){if(!r.robot||!r.alive||!r.eye)continue;const s=r.giantS||1;
  queue(MESH.glowBox,at(r.eye.x,r.eye.y,r.eye.z,0,r.heroYaw,0,0.34*s,0.07*s,0.12*s),[...(r.look.visor||[1,.2,.2]),1],F_ADD);}}
