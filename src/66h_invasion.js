// ================================================================
// The invasion: 100 warships over Earth, three waves of superpowered invaders in space, then light-speed travel
// ================================================================
// save.story.invasion: 0 not yet, 1 the fleet is here (the battle), 2 the fleet is broken (go to light speed), 3 jumped (cyberArrive, 66i_cyber.js).
// Flow: Kathana falls -> invasion=1 -> invArrive (66g) -> invBegin: a 5.5 s cutscene up to the fleet, then invPlace puts you in space 600 m in front of the armada ->
// invWaveTick runs three waves (5, 15, 60 invaders, never more than 25 alive: wave 3 streams in) -> invWin: the fleet explodes ship by ship (6 s), invasion=2, +30 traversal mastery,
// "Ready for light speed traversal" -> hold boost at full flight speed for 2 s in space -> lsStart: a 5 s wormhole cutscene (collisions off) -> cyberArrive().
// Every hero can fly during the event (invFlyOk, used by toggleFlight / flyChargeStart; the battle also keeps you flying). Solo only (storySolo).
// The fleet is 4 baked ship meshes drawn as 100 instances (F_NF: no fog, so it is a dark shape in the city sky). The invaders are actors of kind 'invader'
// (faction 'alien', lockable, hostile), they live in INV.list; the bomber's orbs in INV.orbs.
const INV={fleet:[],built:false,meshes:null,state:'idle',go:false,arm:null,freeT:0,wave:0,nw:1,live:false,pend:[],breath:0,spawnT:0,list:[],orbs:[],blasts:[],start:null,cutT:0,tickT:0,warnT:-99,near:0,winT:-1,boomI:0,order:null,ls:null,lsHold:0,lsPct:-1,seen:{},ws:null,msgT:0,hitT:0};
const INV_C={x:0,y:4300,z:0},INV_R=2300,INV_CAP=25,INV_K=1.6; // INV_K: how big the ships are drawn
const INV_WAVES=[{n:5,mix:{blaster:3,brute:2}},{n:15,mix:{blaster:5,brute:3,shield:4,blinker:3}},{n:60,mix:{blaster:13,brute:10,shield:10,lancer:10,bomber:9,blinker:8}}];
const INV_V={ // armour colour, glow colour, health factor, size, a hint shown the first time one appears
  blaster:{name:'Blaster',col:[.78,.1,.14],trim:[1,.45,.3],css:'#ff7a5c',hp:1,sc:1,hint:'Plasma volleys. Keep moving.'},
  brute:{name:'Brute',col:[.95,.42,.08],trim:[1,.8,.25],css:'#ffc24a',hp:2.4,sc:1.5,hint:'Charges and punches hard. Dodge the charge.'},
  shield:{name:'Shieldbearer',col:[.15,.4,.95],trim:[.45,.9,1],css:'#7fd6ff',hp:1.8,sc:1.2,hint:'Its front shield blocks hits but breaks after a few. Go round the side or behind, or use area attacks.'},
  lancer:{name:'Lancer',col:[.5,.2,.9],trim:[.9,.5,1],css:'#d79bff',hp:.9,sc:1,hint:'A glowing line means a sniper beam is coming. Get off the line.'},
  bomber:{name:'Bomber',col:[.16,.62,.3],trim:[.7,1,.35],css:'#9dff6b',hp:1.3,sc:1.1,hint:'Its orbs explode. Keep moving.'},
  blinker:{name:'Blinker',col:[.85,.15,.65],trim:[1,.55,.95],css:'#ff8ee0',hp:1,sc:.95,hint:'It teleports around you and strikes from behind.'},
};
for(const k in INV_V){const V=INV_V[k];V.c4=[V.col[0]*.5,V.col[1]*.5,V.col[2]*.5,1];V.d4=[V.col[0]*.16,V.col[1]*.16,V.col[2]*.16,1];V.t4=[V.trim[0],V.trim[1],V.trim[2],1];}
const INV_SKIN=[.46,.56,.5,1],INV_DARK=[.05,.055,.075,1];
const invActive=()=>storySolo()&&!!save.story&&(INV.state==='battle'||INV.state==='cut'||INV.state==='win'); // the fleet event is running
const invBattle=()=>INV.state==='battle'&&storySolo();
const invFlyOk=()=>storySolo()&&!!save.story&&(save.story.invasion===2||save.story.tower>=2||INV.state==='battle'||INV.state==='cut'||INV.state==='win'); // every hero can fly during the event
const invFarOn=()=>!!save.story&&save.story.invasion===1&&!zone&&state==='play'; // the fleet is far up: the far plane reaches it (90_render.js)
// ---- the fleet: 4 ship designs, 100 ships ----
function primWedge(){ // a flat triangular prism: the nose points +z, the flat tail faces -z, 1 x 1 x 1
  const pos=[],nor=[],idx=[],T=[[-.5,-.5],[.5,-.5],[0,.5]],tri=(a,b,c,n)=>{const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]],cx=ab[1]*ac[2]-ab[2]*ac[1],cy=ab[2]*ac[0]-ab[0]*ac[2],cz=ab[0]*ac[1]-ab[1]*ac[0],k=pos.length/3;
    for(const v of (cx*n[0]+cy*n[1]+cz*n[2]<0?[a,c,b]:[a,b,c])){pos.push(...v);nor.push(...n);}idx.push(k,k+1,k+2);};
  for(const y of [.5,-.5])tri([T[0][0],y,T[0][1]],[T[1][0],y,T[1][1]],[T[2][0],y,T[2][1]],[0,Math.sign(y),0]);
  for(let i=0;i<3;i++){const A=T[i],B=T[(i+1)%3];let nx=B[1]-A[1],nz=-(B[0]-A[0]);const l=Math.hypot(nx,nz);nx/=l;nz/=l;if(nx*((A[0]+B[0])/2)+nz*((A[1]+B[1])/2+1/6)<0){nx=-nx;nz=-nz;}
    const n=[nx,0,nz];tri([A[0],.5,A[1]],[B[0],.5,B[1]],[B[0],-.5,B[1]],n);tri([A[0],.5,A[1]],[B[0],-.5,B[1]],[A[0],-.5,A[1]],n);}
  return {pos,nor,idx};
}
const IP={wedge:primWedge()};
function invMeshes(){
  if(INV.meshes)return INV.meshes;
  const D=[.16,.17,.22],D2=[.25,.27,.34],D3=[.09,.1,.13],RD=[.9,.04,.08],VI=[.3,.04,.62],AM=[.9,.5,.15],out=[];let g;
  const lamp=(x,y,z,s,c)=>g.prim(PRIM.box,x,y,z,0,0,0,s,s,s,c,6);
  // 0: the carrier, a big dark wedge with a tower and a block of engines
  g=new Geo();g.prim(IP.wedge,0,0,0,0,0,0,120,22,250,D,0);g.prim(IP.wedge,0,15,-26,0,0,0,70,12,150,D2,0);g.prim(PRIM.box,0,32,-74,0,0,0,24,30,42,D3,0);g.prim(PRIM.box,0,-1,-122,0,0,0,106,18,24,D3,0);
  for(const x of [-38,0,38])g.prim(PRIM.box,x,-1,-134.5,0,0,0,22,9,2,VI,6);
  for(let i=0;i<8;i++){const f=(i+.5)/8,x=60*(1-f)*.96,z=-125+250*f;lamp(x,12,z,3.4,RD);lamp(-x,12,z,3.4,RD);}
  g.prim(PRIM.box,0,43,-52.5,0,0,0,16,3,1.5,AM,6);lamp(0,50,-74,4,RD);for(const x of [-52,52])lamp(x,-1,-134,5,RD);
  out.push(g.mesh());
  // 1: the saucer frigate
  g=new Geo();g.prim(UP.cyl,0,0,0,0,0,0,52,9,52,D,0);g.prim(UP.sph,0,5,0,0,0,0,24,14,24,D2,0);g.prim(UP.cyl,0,-8,0,0,0,0,30,8,30,D3,0);g.prim(UP.tor,0,-0.5,0,0,0,0,52,52,52,VI,6);
  lamp(0,19,0,5,RD);for(let k=0;k<3;k++){const a=k*TAU/3;lamp(Math.cos(a)*20,-12.5,Math.sin(a)*20,4,AM);}
  out.push(g.mesh());
  // 2: the spiky cruiser
  g=new Geo();g.prim(PRIM.box,0,0,0,0,0,0,16,14,180,D,0);g.prim(PRIM.box,0,10,48,0,0,0,10,10,22,D2,0);
  for(let i=0;i<3;i++){const z=-52+i*40;for(const s of [-1,1]){g.prim(PRIM.cone,s*20,0,z,0,0,-s*1.15,7,46,7,D2,0);g.prim(PRIM.cone,s*8,13,z-14,0,0,-s*0.45,4,26,4,D3,0);}}
  g.prim(PRIM.cone,0,0,102,Math.PI/2,0,0,9,26,9,D2,0);
  lamp(0,0,6,13,RD);for(const x of [-4,4])g.prim(PRIM.box,x,0,-91,0,0,0,6,8,2,VI,6);for(let i=0;i<3;i++)for(const s of [-1,1])lamp(s*45,s*0+0,-52+i*40+6,3.2,RD);
  out.push(g.mesh());
  // 3: the ring ship
  g=new Geo();g.prim(UP.tor,0,0,0,0.3,0,0,56,56,56,D2,0);g.prim(UP.tor,0,0,0,0.3,0,0,50,50,50,VI,6);g.prim(PRIM.box,0,0,0,0,0,0,24,24,100,D,0);
  for(const s of [-1,1])g.prim(PRIM.box,s*27,0,0,0,0,0,56,5,6,D3,0);g.prim(PRIM.box,0,0,0,0,0,0,6,5,112,D3,0);
  lamp(0,0,52,7,RD);lamp(0,13,-30,5,AM);
  out.push(g.mesh());
  return INV.meshes=out;
}
function invFleetBuild(){
  if(INV.built)return;INV.built=true;
  let seed=24049;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const R=INV_R,SZ=[170*INV_K,72*INV_K,105*INV_K,82*INV_K],plan=[[0,10],[2,30],[3,20],[1,40]],ships=[];
  for(const [d,n] of plan)for(let i=0;i<n;i++){
    for(let tr=0;tr<80;tr++){
      const rf=d===0?Math.sqrt(rnd())*0.55:d===2?0.15+rnd()*0.7:0.1+Math.sqrt(rnd())*0.9,a=rnd()*TAU,r=rf*R,x=Math.cos(a)*r,z=Math.sin(a)*r;
      let y=2650+2600*(1-Math.pow(rf,1.5))+(rnd()-.5)*600;y=clamp(y,2550,5950);
      let ok=true;for(const o of ships){const dx=o.x-x,dy=o.y-y,dz=o.z-z;if(Math.hypot(dx,dy,dz)<(SZ[d]+SZ[o.d])*(tr<60?1.15:0.8)){ok=false;break;}}
      if(ok||tr===79){ships.push({d,x,y,z,yaw:Math.PI/2+(rnd()-.5)*0.7,sc:(d===0?1:0.85+rnd()*0.4)*INV_K,ph:rnd()*TAU,dead:false,die:-1});break;}
    }}
  INV.fleet=ships;
  let z=-R-1800;const near=zz=>{let m=1e9;for(const s of ships){const d=Math.hypot(s.x,s.y-2250,s.z-zz);if(d<m)m=d;}return m;};
  while(z<0&&near(z+15)>=600)z+=15;if(z>=0)z=-R-300; // fly in from outside until the nearest ship is 600 m away
  INV.start={x:0,y:2250,z,yaw:Math.PI,pitch:0.2}; // in front of the near edge, facing the armada
}
function invFleetDraw(){
  const t=time,cx=camPos.x,cy=camPos.y,cz=camPos.z,fx=camF.x,fy=camF.y,fz=camF.z,M=invMeshes(),sk=spaceK(cy),tint=[1+0.3*sk,1+0.3*sk,1+0.35*sk,1],em=0.05*sk; // out in space the hulls get some light of their own
  for(const s of INV.fleet){if(s.dead)continue;
    const dx=s.x-cx,dy=s.y-cy,dz=s.z-cz,d2=dx*dx+dy*dy+dz*dz;if(d2>2.5e8)continue;
    if(d2>2.5e5&&(dx*fx+dy*fy+dz*fz)<-0.4*Math.sqrt(d2))continue; // behind the camera
    const sc=s.sc,bob=Math.sin(t*0.45+s.ph)*7;
    queue(M[s.d],at(s.x,s.y+bob,s.z,Math.sin(t*0.3+s.ph)*0.03,s.yaw,Math.cos(t*0.27+s.ph)*0.03,sc,sc,sc),tint,F_NF,em);
    if(d2>1.6e6){const g=Math.sqrt(d2)*0.004;queue(MESH.glowSphere,at(s.x,s.y+bob,s.z,0,0,0,g,g,g),[1,.2,.3,0.5],F_ADD);} // far away: a glint of red so it still reads
  }
}
// ---- the start: a cutscene up to the fleet, then you stand in front of it ----
function invArrive(){INV.go=true;INV.freeT=0;} // called when the Kathana victory panel is closed (66g_kperfect.js)
function invFree(){return !zone&&!CUT&&!ASK&&!ZF.phase&&!P.dead&&state==='play'&&!paused&&!KA.on&&!PR.on&&!(KQ&&KQ.on)&&!Portal.inAd;}
function invBegin(quick){
  const S=save.story;if(INV.state==='battle'||INV.state==='cut'||INV.state==='win'||INV.state==='done'&&S.invasion>=2)return;
  S.invasion=Math.max(S.invasion,1);persist();invFleetBuild();INV.go=false;INV.state='cut';INV.cutT=time;INV.wave=0;INV.pend.length=0;INV.winT=-1;
  if(OBJ.text==='Look up: the fleet is coming')objective(null);
  if(quick||state!=='play'){invPlace();return;}
  const s=INV.start,px=P.pos.x,py=P.pos.y,pz=P.pos.z,C=INV_C,F2={x:s.x,y:s.y+0.2*400,z:s.z+400};
  cutscene({dur:5.6,text:'The fleet has arrived',fov:68,from:{x:px-16,y:py+3.5,z:pz-26},to:{x:s.x,y:s.y+4,z:s.z-9},look:k=>{const e=k*k*(3-2*k);return {x:lerp(C.x,F2.x,e),y:lerp(C.y,F2.y,e),z:lerp(C.z,F2.z,e)};},
    onTick:(k,dt)=>{addShake(0.015+0.05*Math.sin(k*3.14));if(k>0.03&&k<0.06)SFX.tone('sawtooth',55,38,5,0.1);},onEnd:invPlace});
}
function invPlace(){
  if(INV.state!=='cut')return;
  INV.state='battle';const s=INV.start;
  if(P.car)exitCar(true);if(P.alien)revertAlien(true);
  P.pos.set(s.x,s.y,s.z);P.vel.set(0,0,0);P.yaw=s.yaw;P.pitch=s.pitch;P.flying=true;P.grounded=false;P.web=null;P.reel=null;P.wall=null;P.wallRun=null;P.zip=null;P.floatT=0;P.charging=false;P.fCharge=false;
  camDist=8;projs.length=0;debris.length=0;tracers.length=0;lockT=null;comboN=0;P.hp=maxHp();P.en=maxEn();P.dead=false;
  spaceMsgT=time;wasSpace=true;flashWhite=Math.max(flashWhite,0.5);SFX.boom(0.6,1.4);SFX.chime();
  INV.breath=3;INV.wave=0;INV.nw=1;INV.live=false;INV.seen={};INV.hitT=time;clearInvaders();
  toast('The fleet is above you','Every hero can fly up here · Z locks on','red');objective('Hold the line');
}
function invWaveJump(n){ // test hook: jump straight to a wave
  if(INV.state!=='battle')invBegin(true);clearInvaders();INV.pend.length=0;INV.breath=0;invWaveStart(clamp(n,1,3));
}
function invAlive(){let n=0;for(const a of INV.list)if(a.alive)n++;return n;}
function clearInvaders(){for(const a of INV.list.slice())removeActor(a);INV.list.length=0;INV.orbs.length=0;lockT=lockT&&lockT.kind==='invader'?null:lockT;}
function invRemove(a){removeActor(a);removeFrom(INV.list,a);if(lockT===a)lockT=null;}
// dying in the battle: back at the start point after 3 s, the current wave starts over (cleared waves stay cleared)
function invRespawn(){
  if(INV.state!=='battle')return false;
  const s=INV.start;clearInvaders();
  P.dead=false;P.pos.set(s.x,s.y,s.z);P.vel.set(0,0,0);P.yaw=s.yaw;P.pitch=s.pitch;P.flying=true;P.grounded=false;P.hp=maxHp();P.en=maxEn();P.stun=0;P.lastHit=-99;P.web=null;P.wall=null;camDist=8;projs.length=0;
  $('dead').hidden=true;flashWhite=Math.max(flashWhite,0.4);
  if(INV.live){INV.nw=Math.max(1,INV.wave);INV.live=false;}INV.pend.length=0;INV.breath=2.5;INV.hitT=time;toast('Back in the fight','Wave '+INV.nw+' starts again','gold');
  return true;
}
// ---- the waves ----
function invWaveStart(n){
  INV.wave=n;INV.nw=n+1;INV.live=true;INV.hitT=time;const W=INV_WAVES[n-1],a=[];for(const k in W.mix)for(let i=0;i<W.mix[k];i++)a.push(k);
  for(let i=a.length-1;i>0;i--){const j=(Math.random()*(i+1))|0,t=a[i];a[i]=a[j];a[j]=t;}
  INV.pend=a;INV.breath=0;INV.spawnT=0.4;toast('WAVE '+n+' / 3',W.n+' invaders','red');SFX.tone('sawtooth',90,60,0.9,0.1);addShake(0.2);
}
function invNearShips(k){ // the k ships nearest to the player
  const out=[];for(const s of INV.fleet){if(s.dead)continue;const d=Math.hypot(s.x-P.pos.x,s.y-P.pos.y,s.z-P.pos.z);out.push({s,d});}
  out.sort((a,b)=>a.d-b.d);return out.slice(0,k).map(o=>o.s);
}
function invSpawn(vt){
  const V=INV_V[vt],ns=invNearShips(7),sh=ns.length?pick(ns):{x:P.pos.x+rr(-200,200),y:P.pos.y+rr(80,240),z:P.pos.z+rr(250,450),sc:1};
  const hp=Math.round((95+11*save.level)*V.hp),sx=sh.x+rr(-40,40),sy=sh.y-14,sz=sh.z+rr(-40,40);
  const a={kind:'invader',faction:'alien',vt,name:V.name,alive:true,hp,maxHp:hp,pos:new V3(sx,sy,sz),vel:new V3(),yaw:Math.atan2(P.pos.x-sx,P.pos.z-sz),flash:0,stun:0,slow:0,slowT:0,burn:0,burnDps:0,held:false,thrown:null,ac:hsl(Math.random()),sc:V.sc,cy:1.05*V.sc,radius:0.9*V.sc,ys:0.85,
    lastHit:-99,deadT:0,st:'drop',stT:0,cd:rr(0.8,2.2),fireT:rr(1,2.4),volley:0,volT:0,vis:1,ph:rr(0,TAU),os:Math.random()<0.5?1:-1,osT:rr(2,5),off:{x:rr(-40,40),y:rr(-8,14),z:rr(-40,40)},castT:-9,glow:0,want:rr(30,46),meleeT:0,bs:'app',bt:0,aim:null,bm:null,sh:0,sb:vt==='shield'?2+((Math.random()*2)|0):0,sHits:0,shT:-9,broke:false}; // sb: how many blocked hits break the shield (2 or 3)
  a.onHit=(src,amt,type)=>invOnHit(a,src,amt,type);a.onDefeat=()=>invOnDefeat(a);
  actors.push(a);INV.list.push(a);
  burst(sx,sy,sz,22,16,0.6,[V.trim,[1,1,1]],7,0,2);ringFx(sx,sy,sz,2,26,0.45,V.trim);SFX.tone('triangle',1200,300,0.3,0.08*SFX.vol(sx,sy,sz));
  if(!INV.seen[vt]){INV.seen[vt]=1;later(2.4,()=>{if(INV.state==='battle')feed(V.name,V.hint);});}
  return a;
}
const INV_BLOCK={punch:1,shot:1,bullet:1,blast:1,beam:1,slash:1,ring:1,throw:1,damage:1,hit:1}; // what the Shieldbearer's front shield stops (fire, shock, slams, wind and the like get round it)
function invOnHit(a,src,amt,type){
  if(src===P)INV.hitT=time; // the pointers to the enemies (invPointers) wait for 10 s without a hit from you
  if(a.vt!=='shield'||a.broke||!a.alive||!INV_BLOCK[type]||!src||!src.pos)return;
  const dx=src.pos.x-a.pos.x,dy=src.pos.y-a.pos.y,dz=src.pos.z-a.pos.z,l=Math.hypot(dx,dy,dz)||1,fx=Math.sin(a.yaw),fz=Math.cos(a.yaw);
  if((dx*fx+dz*fz)/l>0.4){a.hp=Math.min(a.maxHp,a.hp+amt*0.93);a.flash=0;a.sh=1;const px=a.pos.x+fx*1.9*a.sc,py=a.pos.y+a.cy,pz=a.pos.z+fz*1.9*a.sc;burst(px,py,pz,8,9,0.3,[[.5,.9,1],[1,1,1]],1.2,0,2);ringFx(px,py,pz,0.4,2.4,0.2,[.5,.9,1]);SFX.tone('square',1500,900,0.07,0.05*SFX.vol(px,py,pz));
    if(time-a.shT>0.12){a.shT=time;if(++a.sHits>=a.sb)invShieldBreak(a,px,py,pz);}} // each blocked hit counts (a beam ticking every frame counts once per 0.12 s)
}
function invShieldBreak(a,px,py,pz){ // the shield shatters: shards in the shield colour, then it takes damage from every side
  a.broke=true;a.sh=0;burst(px,py,pz,46,26,0.7,[[.5,.9,1],[1,1,1],[.3,.7,1]],2.2,-6,1.2);ringFx(px,py,pz,0.6,6.5,0.35,[.6,.95,1]);ringFx(px,py,pz,0.4,3.5,0.25,[1,1,1]);
  const v=SFX.vol(px,py,pz);SFX.tone('square',2400,260,0.28,0.1*v);SFX.tone('triangle',3200,500,0.18,0.06*v);SFX.boom(0.25*v,2.2);
}
function invOnDefeat(a){
  const V=INV_V[a.vt];a.vel.mul(0.4);burst(a.pos.x,a.pos.y+a.cy,a.pos.z,40,20,0.8,[V.trim,[1,1,1],V.col],2.4,0,1.8);ringFx(a.pos.x,a.pos.y+a.cy,a.pos.z,1,9,0.4,V.trim);
  SFX.tone('sawtooth',600,80,0.4,0.08*SFX.vol(a.pos.x,a.pos.y,a.pos.z));a.aim=null;a.bm=null;
}
function invWaveTick(dt){
  if(INV.breath>0){INV.breath-=dt;if(INV.breath<=0)invWaveStart(INV.nw);return;}
  if(INV.wave<1)return;
  const alive=invAlive();
  if(INV.pend.length&&alive<INV_CAP){INV.spawnT-=dt;if(INV.spawnT<=0){INV.spawnT=rr(0.25,0.5);invSpawn(INV.pend.pop());}}
  if(!INV.pend.length&&alive===0){
    if(INV.wave>=3){invWin(false);return;}
    INV.live=false;toast('Wave cleared','Wave '+INV.nw+' in 3 s','gold');SFX.chime();INV.breath=3;
  }
}
// not hit an enemy for 10 s while some are alive: pins on the 3 nearest (placeMark in 68_markers.js turns the pin into an edge arrow when it is off screen); a hit hides them
const INV_NP=[null,null,null],INV_ND=[0,0,0];
function invPointers(n){
  if(!invBattle()||P.dead||CUT||ASK||paused||INV.ls||time-INV.hitT<10)return n;
  let c=0;INV_NP[0]=INV_NP[1]=INV_NP[2]=null;
  for(const a of INV.list){if(!a.alive)continue;const d=Math.hypot(a.pos.x-P.pos.x,a.pos.y-P.pos.y,a.pos.z-P.pos.z);let i=c<3?c:(d<INV_ND[2]?2:-1);if(i<0)continue;if(c<3)c++;
    while(i>0&&INV_ND[i-1]>d){INV_ND[i]=INV_ND[i-1];INV_NP[i]=INV_NP[i-1];i--;}INV_ND[i]=d;INV_NP[i]=a;}
  for(let i=0;i<c;i++){const a=INV_NP[i],d=fmtDist(INV_ND[i]);placeMark(n++,a.pos.x,a.pos.y+a.cy+2.2*a.sc,a.pos.z,'▼',i?'#ff8a5c':'#ff4a3d',INV_V[a.vt].name+' · '+d,i?'':'big',d);}
  if(c&&!INV.seen.pin){INV.seen.pin=1;feed('Enemies marked','Follow the red arrows');}
  return n;
}
function invText(){
  if(INV.breath>0)return INV.wave>=1&&!INV.live&&INV.nw>INV.wave?'WAVE '+INV.wave+'/3 cleared · next in '+Math.ceil(INV.breath):'WAVE '+Math.min(3,INV.nw)+'/3 · starts in '+Math.ceil(INV.breath);
  return 'WAVE '+INV.wave+'/3 · '+(INV.pend.length+invAlive())+' left';
}
// ---- the invaders' minds ----
function invShoot(a,pc){
  const V=INV_V[a.vt],ox=a.pos.x+Math.sin(a.yaw)*1.2*a.sc,oy=a.pos.y+a.cy+0.2,oz=a.pos.z+Math.cos(a.yaw)*1.2*a.sc,d3=Math.hypot(P.pos.x-ox,P.pos.y-oy,P.pos.z-oz),lead=d3/56*0.55;
  const v=dirTo({x:ox,y:oy,z:oz},P.pos.x+P.vel.x*lead+rr(-1.4,1.4),P.pos.y+1.3+P.vel.y*lead+rr(-1,1),P.pos.z+P.vel.z*lead+rr(-1.4,1.4));
  fireProj({kind:'plasma',owner:a,x:ox,y:oy,z:oz,vx:v[0]*56,vy:v[1]*56,vz:v[2]*56,dmg:(9+0.17*save.level)*(pc?1.2:1),r:0.55,life:3,knock:6,pc:pc||a.ac,sc:1.1});a.castT=time;
  SFX.tone('square',500,1200,0.12,0.05*SFX.vol(ox,oy,oz));
}
function invHurtP(a,dmg,type,knock){Damage.apply(a,P,dmg,type,{knock});a.castT=time;}
function invBeamHit(a){ // the lancer's beam: along the locked line, 300 m
  const b=a.bm,sx=b.sx,sy=b.sy,sz=b.sz,dx=b.ex-sx,dy=b.ey-sy,dz=b.ez-sz,L2=dx*dx+dy*dy+dz*dz,px=P.pos.x,py=P.pos.y+1.3,pz=P.pos.z;
  const k=clamp(((px-sx)*dx+(py-sy)*dy+(pz-sz)*dz)/L2,0,1),d=Math.hypot(sx+dx*k-px,sy+dy*k-py,sz+dz*k-pz);
  if(d<2.8&&!P.dead)invHurtP(a,22+0.3*save.level,'beam',14);
}
function invBomb(a){
  const ox=a.pos.x+Math.sin(a.yaw)*1.1*a.sc,oy=a.pos.y+a.cy,oz=a.pos.z+Math.cos(a.yaw)*1.1*a.sc,d3=Math.hypot(P.pos.x-ox,P.pos.y-oy,P.pos.z-oz),lead=d3/27*0.5;
  const v=dirTo({x:ox,y:oy,z:oz},P.pos.x+P.vel.x*lead,P.pos.y+1.3+P.vel.y*lead,P.pos.z+P.vel.z*lead);
  INV.orbs.push({x:ox,y:oy,z:oz,vx:v[0]*27,vy:v[1]*27,vz:v[2]*27,life:3.4,src:a,t:0,c:a.ac});a.castT=time;SFX.tone('triangle',200,500,0.25,0.07*SFX.vol(ox,oy,oz));
}
function invOrbBoom(o){
  const c=o.c;burst(o.x,o.y,o.z,50,32,0.8,[c,[1,1,.8],c],4,0,1.6);ringFx(o.x,o.y,o.z,1,16,0.45,c);ringFx(o.x,o.y,o.z,1,10,0.3,[1,1,1]);SFX.boom(0.5*SFX.vol(o.x,o.y,o.z),1.1);
  areaDamage(o.x,o.y,o.z,9,16+0.22*save.level,o.src,{type:'blast',knock:24});addShake(0.15*SFX.vol(o.x,o.y,o.z));
}
function invOrbTick(dt){
  for(let i=INV.orbs.length-1;i>=0;i--){
    const o=INV.orbs[i];o.t+=dt;o.life-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.z+=o.vz*dt;if(Math.random()<0.5)emit(o.x,o.y,o.z,rr(-2,2),rr(-2,2),rr(-2,2),0.35,o.c,1.4,0,1);
    const d=Math.hypot(P.pos.x-o.x,P.pos.y+1.3-o.y,P.pos.z-o.z);
    if(o.life<=0||(d<4.2&&!P.dead)){invOrbBoom(o);INV.orbs.splice(i,1);}
  }
}
function invUpdate(a,dt){
  a.flash=Math.max(0,a.flash-dt*5);a.sh=Math.max(0,a.sh-dt*3);if(a.slowT>0){a.slowT-=dt;if(a.slowT<=0)a.slow=0;}
  if(a.burn>0&&a.alive){a.burn-=dt;Damage.apply(a.burnSrc,a,a.burnDps*dt,'burn');}
  if(a.held)return;
  if(!a.alive){a.deadT+=dt;a.pos.addS(a.vel,dt);a.vel.mul(Math.pow(0.3,dt));if(a.deadT>0.65)invRemove(a);return;}
  const V=INV_V[a.vt],sk=1-(a.slow||0),stun=a.stun>0;if(stun)a.stun-=dt;
  const valid=!P.dead&&state==='play'&&!cutLocked(),tx=P.pos.x,ty=P.pos.y+1.3,tz=P.pos.z,dx=tx-a.pos.x,dy=ty-(a.pos.y+a.cy),dz=tz-a.pos.z,dh=Math.hypot(dx,dz),d3=Math.hypot(dx,dy,dz)||1,ux=dx/d3,uy=dy/d3,uz=dz/d3;
  let wx=0,wy=0,wz=0,kk=4,yr=7;a.stT+=dt;a.glow=Math.max(0,a.glow-dt*2);
  if(a.st==='drop'){ // out of the ship in a streak of light, straight at you
    const gx=tx+a.off.x-a.pos.x,gy=ty+a.off.y-a.pos.y,gz=tz+a.off.z-a.pos.z,gl=Math.hypot(gx,gy,gz)||1,sp=175;wx=gx/gl*sp;wy=gy/gl*sp;wz=gz/gl*sp;kk=3;
    const px=a.pos.x,py=a.pos.y+a.cy,pz=a.pos.z;tracer(px-a.vel.x*0.06,py-a.vel.y*0.06,pz-a.vel.z*0.06,px,py,pz,V.trim,0.55*a.sc,0.45);
    if(gl<75||a.stT>5){a.st='fight';a.stT=0;}
  }else if(valid&&!stun){
    const sx=-uz,sz=ux,os=a.os;a.osT-=dt;if(a.osT<=0){a.osT=rr(2.5,5.5);a.os=-a.os;}
    const bobY=Math.sin(time*0.9+a.ph)*6;
    const hold=(want,sp,strafe)=>{const e=d3-want;const r=e>6?sp:e<-8?-sp*0.8:e*sp/10;wx=ux*r+sx*os*sp*strafe;wy=uy*r+(bobY+(ty-a.pos.y-a.cy)*0.25)*0.6;wz=uz*r+sz*os*sp*strafe;};
    a.fireT-=dt;a.cd-=dt;a.meleeT-=dt;
    if(a.vt==='blaster'){
      hold(a.want,34*sk,0.7);
      if(a.fireT<=0&&d3<120){a.fireT=rr(2.2,3.2);a.volley=3;a.volT=0;}
      if(a.volley>0){a.volT-=dt;if(a.volT<=0){a.volT=0.17;a.volley--;invShoot(a);}}
    }else if(a.vt==='brute'){
      if(a.bs==='app'){const sp=32*sk;wx=ux*sp;wy=uy*sp;wz=uz*sp;
        if(d3<4.8&&a.meleeT<=0){a.meleeT=1.1;invHurtP(a,11+0.15*save.level,'punch',16);SFX.punch(0.5*SFX.vol(a.pos.x,a.pos.y,a.pos.z));}
        if(d3<34&&d3>10&&a.cd<=0){a.bs='wind';a.bt=0.7;a.glow=1;SFX.tone('sawtooth',160,420,0.7,0.08*SFX.vol(a.pos.x,a.pos.y,a.pos.z));}}
      else if(a.bs==='wind'){a.bt-=dt;wx=-ux*9;wy=-uy*9;wz=-uz*9;a.glow=1;a.cx=ux;a.cy2=uy;a.cz=uz;if(a.bt<=0){a.bs='charge';a.bt=0.95;a.hit=false;SFX.whoosh();}}
      else if(a.bs==='charge'){a.bt-=dt;wx=a.cx*92;wy=a.cy2*92;wz=a.cz*92;kk=9;a.glow=1;
        if(!a.hit&&d3<4.4){a.hit=true;invHurtP(a,16+0.22*save.level,'punch',34);burst(a.pos.x,a.pos.y+a.cy,a.pos.z,16,14,0.4,[a.ac,[1,1,1]],2,0,2);SFX.punch(1);}
        if(a.bt<=0||a.hit){a.bs='rec';a.bt=1.2;a.cd=rr(2.8,4);}}
      else{a.bt-=dt;wx=ux*7;wy=uy*7;wz=uz*7;if(a.bt<=0)a.bs='app';}
    }else if(a.vt==='shield'){
      yr=a.broke?7:1.7;hold(11,18*sk,0.25);
      if(d3<6.5&&a.meleeT<=0){a.meleeT=1.5;invHurtP(a,9+0.13*save.level,'punch',22);SFX.punch(0.5*SFX.vol(a.pos.x,a.pos.y,a.pos.z));}
      if(a.fireT<=0&&d3<70){a.fireT=rr(3,4.2);invShoot(a);}
    }else if(a.vt==='lancer'){
      hold(88,20*sk,0.4);
      if(!a.aim){if(a.cd<=0&&d3<260){a.aim={t:0,dx:ux,dy:uy,dz:uz};SFX.tone('sine',300,1600,1.7,0.06*SFX.vol(a.pos.x,a.pos.y,a.pos.z));}}
      else{const A=a.aim;A.t+=dt;if(A.t<1.25){A.dx=ux;A.dy=uy;A.dz=uz;}
        if(A.t>=1.7){const ox=a.pos.x+A.dx*1.6,oy=a.pos.y+a.cy+A.dy*1.6,oz=a.pos.z+A.dz*1.6;a.bm={t:0.3,sx:ox,sy:oy,sz:oz,ex:ox+A.dx*300,ey:oy+A.dy*300,ez:oz+A.dz*300};invBeamHit(a);a.aim=null;a.cd=rr(3.2,4.6);a.castT=time;SFX.boom(0.4*SFX.vol(ox,oy,oz),1.8);SFX.tone('sawtooth',1800,200,0.3,0.1*SFX.vol(ox,oy,oz));}}
    }else if(a.vt==='bomber'){
      hold(56,22*sk,0.5);
      if(a.fireT<=0&&d3<130){a.fireT=rr(2.6,3.6);invBomb(a);}
    }else if(a.vt==='blinker'){
      if(a.bs==='app'){hold(a.want*0.6,40*sk,0.9);a.bt-=dt;
        if(a.fireT<=0&&d3<90){a.fireT=rr(1.8,2.6);invShoot(a);a.volley=1;a.volT=0.18;}
        if(a.volley>0){a.volT-=dt;if(a.volT<=0){a.volley--;invShoot(a);}}
        if(a.bt<=0&&a.stT>1.2){a.bs='out';a.bt=0.2;}}
      else if(a.bs==='out'){a.bt-=dt;a.vis=Math.max(0,a.bt/0.2);if(a.bt<=0){ // gone: reappear round the back of you
        const by=Math.atan2(Math.sin(P.yaw),Math.cos(P.yaw))+rr(-0.9,0.9),r=rr(11,17);burst(a.pos.x,a.pos.y+a.cy,a.pos.z,18,14,0.35,[V.trim,[1,1,1]],2.4,0,2);ringFx(a.pos.x,a.pos.y+a.cy,a.pos.z,0.6,6,0.3,V.trim);
        a.pos.set(tx+Math.sin(by)*r,ty+rr(-3,5),tz+Math.cos(by)*r);a.vel.set(0,0,0);a.bs='in';a.bt=0.55;burst(a.pos.x,a.pos.y+a.cy,a.pos.z,18,14,0.35,[V.trim,[1,1,1]],2.4,0,2);ringFx(a.pos.x,a.pos.y+a.cy,a.pos.z,0.6,6,0.3,V.trim);SFX.tone('triangle',2400,500,0.18,0.07*SFX.vol(a.pos.x,a.pos.y,a.pos.z));}}
      else if(a.bs==='in'){a.vis=Math.min(1,a.vis+dt*6);a.bt-=dt;wx=wy=wz=0;a.yaw=Math.atan2(dx,dz);if(a.bt<=0){a.bs='dash';a.bt=0.32;a.hit=false;a.cx=ux;a.cy2=uy;a.cz=uz;a.glow=1;SFX.whoosh();}}
      else if(a.bs==='dash'){a.bt-=dt;wx=a.cx*80;wy=a.cy2*80;wz=a.cz*80;kk=12;a.glow=1;
        if(!a.hit&&d3<3.8){a.hit=true;invHurtP(a,12+0.17*save.level,'slash',12);tracer(a.pos.x-a.cx*3,a.pos.y+a.cy+1,a.pos.z-a.cz*3,a.pos.x+a.cx*3,a.pos.y+a.cy-1,a.pos.z+a.cz*3,a.ac,0.4,0.25);SFX.punch(0.6);}
        if(a.bt<=0){a.bs='app';a.bt=rr(1.6,2.4);a.stT=0;}}
    }
    if(d3>380){wx+=ux*70;wy+=uy*70;wz+=uz*70;} // never wander off
    if(a.vt!=='blinker'||a.bs==='app')a.yaw=angLerp(a.yaw,Math.atan2(dx,dz),damp(yr,dt));
  }else{wx=wy=wz=0;} // stunned, or you are down
  const k=damp(stun?1.5:kk,dt);a.vel.x+=(wx-a.vel.x)*k;a.vel.y+=(wy-a.vel.y)*k;a.vel.z+=(wz-a.vel.z)*k;a.pos.addS(a.vel,dt);
  for(const o of INV.list){if(o===a||!o.alive)continue;const ox=a.pos.x-o.pos.x,oy=a.pos.y-o.pos.y,oz=a.pos.z-o.pos.z,l=Math.hypot(ox,oy,oz),m=2.4*(a.sc+o.sc)*0.5;if(l<m&&l>0.01){const f=(m-l)*0.4/l;a.pos.x+=ox*f;a.pos.y+=oy*f;a.pos.z+=oz*f;}}
  if(a.bm){a.bm.t-=dt;if(a.bm.t<=0)a.bm=null;}
}
// ---- victory: the fleet breaks apart ----
function invWin(quick){
  const S=save.story;if(INV.state==='win'||INV.state==='done'||S.invasion>=2)return;invFleetBuild();
  INV.state='win';INV.winT=0;S.invasion=2;persist();clearInvaders();INV.pend.length=0;objective(null);lockT=null;
  const ships=INV.fleet.filter(s=>!s.dead).sort((a,b)=>Math.hypot(a.x-P.pos.x,a.y-P.pos.y,a.z-P.pos.z)-Math.hypot(b.x-P.pos.x,b.y-P.pos.y,b.z-P.pos.z));
  ships.forEach((s,i)=>{s.die=0.4+5.6*(i/Math.max(1,ships.length-1))+rr(-0.12,0.12);});
  INV.order=ships;INV.boomI=0;
  if(quick||state!=='play'){for(const s of ships)s.die=0.01;return;}
  const s0=INV.start,C=INV_C;
  cutscene({dur:7.2,text:'The fleet is breaking apart',fov:62,skippable:false,from:()=>({x:P.pos.x,y:P.pos.y+5,z:P.pos.z-14}),to:()=>({x:P.pos.x+20,y:P.pos.y+30,z:P.pos.z-50}),look:()=>({x:C.x,y:C.y-200,z:C.z-300}),onTick:()=>addShake(0.06+0.04*Math.sin(time*9))});
}
function invBoom(s){
  s.dead=true;const sz=[260,100,170,110][s.d]*s.sc;INV.blasts.push({x:s.x,y:s.y,z:s.z,t:0,s:sz*0.35});
  burst(s.x,s.y,s.z,50,sz*0.9,1.2,[[1,.85,.45],[1,.5,.2],[1,1,1],[.8,.4,1]],sz*0.08,0,1.4);ringFx(s.x,s.y,s.z,sz*0.1,sz*1.4,0.9,[1,.7,.35]);ringFx(s.x,s.y,s.z,sz*0.1,sz*0.9,0.6,[1,1,1]);
  for(let i=0;i<4;i++){const q=rr(10,26);spawnPiece(s.x+rr(-20,20),s.y+rr(-8,8),s.z+rr(-20,20),MESH.box,q,q*0.5,q*1.3,[.12,.12,.15],rr(-60,60),rr(-40,40),rr(-60,60),6,[rr(0,3),rr(0,3),0]);}
  const v=SFX.vol(s.x,s.y,s.z);SFX.boom(Math.min(1,0.25+v*1.5),0.7+Math.random()*0.8);addShake(0.12);if(s.d===0)flashWhite=Math.max(flashWhite,0.35);
}
function invWinTick(dt){
  INV.winT+=dt;for(const s of INV.fleet)if(!s.dead&&s.die>=0&&INV.winT>=s.die)invBoom(s);
  if(INV.winT>=7.3&&!CUT){INV.fleet.length=0;INV.state='done';invWinEnd();}
}
// +30 levels of traversal for the current hero: the mastery curve (20_core.js masteryAt) run backwards, so masteryLevel rises by exactly 30 (cap 100)
function masteryInv(L){
  L=clamp(L,1,MASTERY_MAX);
  if(L<MASTERY_FULL){const x=1-(L-1)*(1-Math.exp(-3))/(MASTERY_FULL-1);return -MASTERY_K*Math.log(Math.max(1e-9,x));}
  return MASTERY_P10+(MASTERY_P100-MASTERY_P10)*Math.pow((L-MASTERY_FULL)/(MASTERY_MAX-MASTERY_FULL),1/0.7);
}
function invMastery(n){
  if(!save.character)return [0,0];const id=save.character.movement[0],before=masteryLevel(id),target=Math.min(MASTERY_MAX,before+n);
  for(let i=0;i<4&&masteryLevel(id)<target-0.005;i++){const add=masteryInv(target)-masteryInv(masteryLevel(id));if(!(add>0))break;addMastery(id,add);}
  return [before,masteryLevel(id)];
}
function invWinEnd(){
  const [b,a]=invMastery(30);INV.msgT=0;objective('Fly at full speed');
  save.story.invasion=2;persist();SFX.chime();SFX.levelUp();
  const txt=['Hold boost at full flight speed in space and you will tear through everything.','Traversal mastery +30 levels ('+b.toFixed(1)+' to '+a.toFixed(1)+'). Faster, bigger, stronger.'];
  const show=n=>{if(askInfo('Ready for light speed traversal',[{b:'Go at full speed (hold boost) to break through.'},...txt],'Go at full speed',null))return;if(n<30)later(1,()=>show(n+1));};
  show(0);toast('Ready for light speed traversal','Go at full speed','gold');
}
// ---- light speed: the jump, the wormhole, the landing (a stub for now) ----
function invMaxSpeed(){const AL=alienDef(),base=AL&&AL.flies?AL.flySpeed:flySpeed()*conSpeedMul();return base*(1-(P.slow||0))*spaceSpeedMul()*sgSpeedMul()*(AL&&AL.flies?1.5:flyBoost());}
function lsTick0(dt){ // watching for full speed
  const S=save.story;if(S.invasion!==2||INV.state!=='done'||INV.ls)return;
  const free=invFree()&&!P.car;
  if(!free||!inSpace()||!P.flying){INV.lsHold=Math.max(0,INV.lsHold-dt*2);}
  else{
    const boost=!!(keys.ShiftLeft||keys.ShiftRight)||stormRide(),sp=P.vel.len(),mx=invMaxSpeed();
    if(boost&&sp>=mx*0.95&&mx>40)INV.lsHold+=dt;else if(!boost||sp<mx*0.8)INV.lsHold=Math.max(0,INV.lsHold-dt*2);
    if(INV.lsHold>=2){lsStart();return;}
  }
  const want=!inSpace()?'Fly up into space, then go at full speed':INV.lsHold>0.1?'Hold full speed · '+Math.min(100,Math.round(INV.lsHold/2*100/10)*10)+'%':'Fly at full speed (hold boost)';
  if(OBJ.text!==want&&!ASK)objective(want);
}
const LSC={x:0,y:0,z:0},LSL={x:0,y:0,z:0};
function lsStart(dest){ // dest 'cyber' (default: the invasion's jump) or 'earth' (the way back, after the Sovereign, wormholeTo in 66j_spire.js)
  if(INV.ls||state!=='play'||CUT)return;
  let dx=P.vel.x,dy=P.vel.y,dz=P.vel.z,l=Math.hypot(dx,dy,dz);if(l<5){dx=camF.x;dy=camF.y;dz=camF.z;l=1;}dx/=l;dy/=l;dz/=l;
  let rx=dz,rz=-dx,rl=Math.hypot(rx,rz);if(rl<1e-3){rx=1;rz=0;rl=1;}rx/=rl;rz/=rl;const ux=dy*rz,uy=dz*rx-dx*rz,uz=-dy*rx; // right = up x d, up = d x right
  INV.ls={t:0,d:{x:dx,y:dy,z:dz},r:{x:rx,y:0,z:rz},u:{x:ux,y:uy,z:uz},v0:Math.max(l,300),sp:Math.max(l,300),u0:0,sfx:false,dest:dest==='earth'?'earth':'cyber'};INV.lsHold=0;
  P.flying=true;P.heroYaw=Math.atan2(dx,dz);P.tilt=Math.atan2(Math.hypot(dx,dz),dy);P.bank=0;const A=P.anim;A.armL=A.armR=-2.95;A.armLz=-0.1;A.armRz=0.1;
  objective(null);objectiveMark(null);lockT=null;SFX.tone('sawtooth',80,2600,2.2,0.12);SFX.tone('sine',200,3000,3.5,0.1);
  const cam=k=>{const L=INV.ls,d=L.d,j=Math.min(1,L.t/1.5)*0.35,back=9+3*Math.min(1,L.t/2);LSC.x=P.pos.x-d.x*back+rr(-j,j);LSC.y=P.pos.y+1.5-d.y*back+rr(-j,j);LSC.z=P.pos.z-d.z*back+rr(-j,j);return LSC;};
  const look=k=>{const d=INV.ls.d;LSL.x=P.pos.x+d.x*90;LSL.y=P.pos.y+1.5+d.y*90;LSL.z=P.pos.z+d.z*90;return LSL;};
  cutscene({dur:5.2,fov:74,letterbox:true,skippable:false,from:cam,to:cam,look,onTick:lsTick,onEnd:lsEnd});
}
function lsTick(k,dt,C){
  const L=INV.ls;if(!L)return;L.t=C.t;const t=L.t,d=L.d;
  L.sp=t<1.5?lerp(L.v0,60000,Math.pow(t/1.5,2.4)):60000;P.pos.x+=d.x*L.sp*dt;P.pos.y+=d.y*L.sp*dt;P.pos.z+=d.z*L.sp*dt;P.vel.set(d.x*L.sp,d.y*L.sp,d.z*L.sp);
  L.u0+=dt*(500+1500*smooth(0.2,1.6,t));C.fov=lerp(74,112,smooth(0,1.8,t));P.heroYaw=Math.atan2(d.x,d.z);P.tilt=Math.atan2(Math.hypot(d.x,d.z),d.y);
  if(!L.sfx&&t>1.3){L.sfx=true;SFX.boom(0.9,0.5);flashWhite=Math.max(flashWhite,0.6);}
  if(t>4.35)flashWhite=Math.max(flashWhite,smooth(4.35,5.0,t));
}
function lsEnd(){if(!INV.ls)return;if(INV.ls.dest==='earth')earthArrive();else cyberArrive();}
// cyberArrive() (called above) is in 66i_cyber.js: the hyper-advanced civilisation.
// a room opened while the fleet event (or its light-speed jump) had you up in space: the event waits and you are put back on the ground
function invMpGuard(){
  if(INV.list.length)clearInvaders();
  const was=INV.state==='battle'||INV.state==='cut'||INV.state==='win';
  if(was){INV.state='idle';INV.go=true;INV.freeT=0;}
  if(was||INV.ls){INV.ls=null;INV.lsHold=0;lockT=null;if(P.pos.y>SPACE.y||Math.hypot(P.pos.x,P.pos.z)>1600){const s=SPAWNS[0];P.pos.set(s[0],0,s[1]);P.vel.set(0,0,0);P.yaw=s[2];P.flying=false;P.grounded=true;P.web=null;P.floatT=0;camDist=8;}}
}
// ---- the tick ----
function invTick(dt){
  for(let i=INV.blasts.length-1;i>=0;i--){const b=INV.blasts[i];b.t+=dt;if(b.t>1.5)INV.blasts.splice(i,1);}
  const S=save.story;if(!S)return;
  if(!storySolo()){if(INV.list.length)clearInvaders();if(INV.state==='battle'||INV.state==='cut'){INV.state='idle';INV.go=true;INV.freeT=0;}return;} // a multiplayer room: the event waits, and starts again when you are back alone
  if(state!=='play')return;
  if(INV.arm===null)INV.arm=S.invasion===1;
  if(S.invasion===1||(S.invasion===2&&INV.state==='win'))invFleetBuild();
  if(S.invasion===2&&INV.state==='idle'&&!INV.ls){INV.state='done';} // reloaded after the battle: just the light-speed task
  if(S.invasion>=3&&INV.state!=='idle'&&!INV.ls){INV.state='idle';}
  if(INV.state==='idle'&&S.invasion===1&&S.kathana>=2){
    if(invFree()){INV.freeT+=dt;if(INV.freeT>(INV.go?0.8:2.5)&&(INV.go||INV.arm))invBegin(false);}else INV.freeT=0;
  }
  if(INV.state==='cut'&&!CUT&&time-INV.cutT>0.5)invPlace(); // the cutscene was cut short
  if(INV.state==='battle'){
    if(!P.dead&&!INV.ls){
      if(!cutLocked()){if(!P.flying&&!P.car){P.flying=true;P.grounded=false;}if(!hasPower('flight')&&P.en<maxEn()*0.25)P.en=maxEn()*0.25;} // every hero flies up here
      INV.tickT-=dt;if(INV.tickT<=0){INV.tickT=0.3;let m=1e9;for(const s of INV.fleet){if(s.dead)continue;const d=Math.hypot(s.x-P.pos.x,s.y-P.pos.y,s.z-P.pos.z);if(d<m)m=d;}INV.near=m;}
      if(INV.near>3000){ // out of the battle area: a warning, then a pull back
        const s=INV.start,dx=s.x-P.pos.x,dy=s.y-P.pos.y,dz=s.z-P.pos.z,l=Math.hypot(dx,dy,dz)||1,pull=Math.min(900,150+(INV.near-3000)*0.6);
        if(time-INV.warnT>3.5){INV.warnT=time;toast('Return to the fleet','You are leaving the battle','red');}
        P.pos.x+=dx/l*pull*dt;P.pos.y+=dy/l*pull*dt;P.pos.z+=dz/l*pull*dt;const vo=P.vel.x*dx/l+P.vel.y*dy/l+P.vel.z*dz/l;if(vo<0){P.vel.x-=dx/l*vo*0.15;P.vel.y-=dy/l*vo*0.15;P.vel.z-=dz/l*vo*0.15;}
        if(INV.near>4300){P.pos.set(s.x,s.y,s.z);P.vel.set(0,0,0);flashWhite=Math.max(flashWhite,0.5);}
      }
      if(!CUT&&!ASK){invWaveTick(dt);const t=invText();if(OBJ.text!==t)objective(t);}
    }
    for(const a of INV.list.slice())invUpdate(a,dt*worldTimeK());
    invOrbTick(dt*worldTimeK());
  }
  if(INV.state==='win')invWinTick(dt);
  if(INV.state==='done')lsTick0(dt);
  if(INV.ls&&!CUT&&INV.ls.t>0.5)lsEnd(); // the jump cutscene was cut short
}
// ---- drawing ----
function invDraw1(a){
  const dx=a.pos.x-camPos.x,dy=a.pos.y-camPos.y,dz=a.pos.z-camPos.z,d2=dx*dx+dy*dy+dz*dz;if(d2>1100*1100)return;
  if(d2>900&&(dx*camF.x+dy*camF.y+dz*camF.z)<-0.3*Math.sqrt(d2))return;
  const V=INV_V[a.vt],t=time,sp=Math.hypot(a.vel.x,a.vel.y,a.vel.z),fl=a.flash*0.6+0.05,far=d2>260*260;
  let sc=a.sc;if(!a.alive)sc*=Math.max(0,1-a.deadT/0.65);if(a.vis<1)sc*=a.vis;if(sc<0.05)return;
  const lean=Math.min(sp/45,1)*0.95,col=V.c4,dk=V.d4,tr=V.t4,ac=a.ac,ac4=a.ac4||(a.ac4=[ac[0],ac[1],ac[2],1]);
  const root=at(a.pos.x,a.pos.y,a.pos.z,lean,a.yaw,0,sc,sc,sc),aim=t-a.castT<0.45||a.aim;
  if(a.glow>0.05)queue(MESH.glowSphere,child(root,0,0.3,0,0,0,0,1.1,1.7,1.1),[tr[0],tr[1],tr[2],0.04*a.glow],F_ADD);
  if(far){queue(MESH.box,child(root,0,0.3,0,0,0,0,0.55,1.3,0.35),col,0,fl);const g=Math.sqrt(d2)*0.012;queue(MESH.glowSphere,at(a.pos.x,a.pos.y+a.cy,a.pos.z,0,0,0,g,g,g),[tr[0],tr[1],tr[2],0.35],F_ADD);return;}
  queue(MESH.box,child(root,0,0.35,0,0,0,0,0.52,0.62,0.3),col,F_SH,fl);queue(MESH.box,child(root,0,0.02,0,0,0,0,0.44,0.14,0.27),dk,0,fl);
  queue(MESH.glowBox,child(root,0,0.44,0.16,0,0,Math.PI/4,0.14,0.14,0.02),tr,0);
  const hd=child(root,0,0.93,0.03);queue(MESH.sphere,child(hd,0,0,0,0,0,0,0.17,0.21,0.19),INV_SKIN,F_SH,fl);queue(MESH.box,child(hd,0,0.07,-0.02,0,0,0,0.31,0.13,0.3),col,0,fl);queue(MESH.glowBox,child(hd,0,-0.01,0.17,0,0,0,0.22,0.05,0.03),tr,0);
  if(a.vt==='blinker')queue(MESH.glowBox,child(hd,0,0.2,-0.05,0,0,0,0.04,0.24,0.22),tr,0);
  if(a.vt==='brute'||a.vt==='lancer')for(const s of [-1,1])queue(MESH.cone,child(hd,s*0.17,0.18,0,0,0,-s*0.5,0.06,0.3,0.06),dk,0,fl);
  for(const s of [-1,1]){
    const big=a.vt==='brute'?1.3:1;queue(MESH.box,child(root,s*0.36,0.6,0,0,0,0,0.22*big,0.15*big,0.3*big),col,F_SH,fl);
    if(a.vt==='brute')queue(MESH.cone,child(root,s*0.42,0.74,0,0,0,-s*0.4,0.09,0.3,0.09),tr,0,fl);
    const armed=aim&&(s>0||a.vt==='shield'),ax=armed?-1.5:0.1+Math.sin(t*2+a.ph+s)*0.05,sh=child(root,s*0.36,0.52,0,ax,0,s*0.12);
    queue(MESH.box,child(sh,0,-0.16,0,0,0,0,0.13*big,0.32,0.13*big),dk,0,fl);const eb=child(sh,0,-0.32,0,armed?0:-0.25,0,0);queue(MESH.box,child(eb,0,-0.15,0,0,0,0,0.11*big,0.3,0.11*big),INV_SKIN,0,fl);
    queue(MESH.sphere,child(eb,0,-0.32,0,0,0,0,0.1*big,0.1*big,0.1*big),a.vt==='brute'?col:dk,0,fl);
    if(s>0){
      if(a.vt==='blaster'){queue(MESH.box,child(eb,0,-0.34,0,0,0,0,0.16,0.4,0.16),dk,0,fl);queue(MESH.glowSphere,child(eb,0,-0.56,0,0,0,0,0.16,0.16,0.16),[ac[0],ac[1],ac[2],aim?0.95:0.45],0);}
      else if(a.vt==='lancer'){queue(MESH.box,child(eb,0,-0.7,0,0,0,0,0.08,1.5,0.08),dk,0,fl);queue(MESH.glowBox,child(eb,0,-1.46,0,0,0,0,0.06,0.1,0.06),ac4,0);if(a.aim){const q=0.4+0.6*Math.min(1,a.aim.t/1.7);queue(MESH.glowSphere,child(eb,0,-1.5,0,0,0,0,0.5*q,0.5*q,0.5*q),[ac[0],ac[1],ac[2],0.9],F_ADD);}}
      else if(a.vt==='bomber'){const q=0.2+0.03*Math.sin(t*9);queue(MESH.glowSphere,child(eb,0,-0.5,0,0,0,0,q,q,q),ac4,0);queue(MESH.glowSphere,child(eb,0,-0.5,0,0,0,0,q*2.6,q*2.6,q*2.6),[ac[0],ac[1],ac[2],0.28],F_ADD);}
      else if(a.vt==='blinker')queue(MESH.glowBox,child(eb,0,-0.7,0,0,0,0,0.035,0.8,0.1),ac4,0);
    }
    const hp=child(root,s*0.12,-0.1,0,Math.sin(t*3+a.ph+s)*0.12,0,0);queue(MESH.box,child(hp,0,-0.24,0,0,0,0,0.15,0.48,0.16),dk,0,fl);queue(MESH.box,child(hp,0,-0.62,0.02,0,0,0,0.12,0.4,0.13),col,0,fl);
  }
  queue(MESH.glowSphere,at(a.pos.x,a.pos.y-0.55*sc,a.pos.z,0,0,0,0.18*sc,0.3*sc,0.18*sc),[tr[0],tr[1],tr[2],0.25+0.12*Math.sin(t*14+a.ph)],F_ADD);
  if(a.vt==='shield'&&!a.broke){const f=Math.sin(a.yaw),g=Math.cos(a.yaw);
    queue(MESH.glowSphere,at(a.pos.x+f*1.5*sc,a.pos.y+a.cy*1.05,a.pos.z+g*1.5*sc,0,a.yaw,0,2.1*sc,2.5*sc,0.16*sc),[.35,.8,1,0.02+0.22*a.sh],F_ADD);queue(MESH.ring,at(a.pos.x+f*1.55*sc,a.pos.y+a.cy*1.05,a.pos.z+g*1.55*sc,Math.PI/2,a.yaw,0,1.1*sc,1,1.3*sc),[.6,.95,1,0.2+0.5*a.sh],F_ADD);}
  if(a.bs==='wind'&&a.vt==='brute')queue(MESH.glowSphere,child(root,0,0.4,0,0,0,0,2.2,2.2,2.2),[ac[0],ac[1],ac[2],0.35],F_ADD);
}
function invDraw(){
  if(INV.ls&&storySolo()&&state==='play')lsDraw(); // (the wormhole also opens inside the cyber world)
  if(!storySolo()||state!=='play'||zone)return;
  for(const b of INV.blasts){const k=b.t/1.5,r=b.s*(0.4+k*1.3);queue(UGLOW,at(b.x,b.y,b.z,0,0,0,r,r,r),[1,.75,.4,0.8*(1-k)],F_ADD);queue(UGLOW,at(b.x,b.y,b.z,0,0,0,r*1.6,r*1.6,r*1.6),[1,.4,.2,0.2*(1-k)],F_ADD);if(k<0.3)queue(UGLOW,at(b.x,b.y,b.z,0,0,0,r*0.55,r*0.55,r*0.55),[1,1,1,1-k*3],F_ADD);}
  if(INV.fleet.length&&(save.story.invasion===1||INV.state==='win'))invFleetDraw();
  for(const a of INV.list){invDraw1(a);
    if(a.aim){const A=a.aim,ox=a.pos.x+A.dx*1.6,oy=a.pos.y+a.cy+A.dy*1.6,oz=a.pos.z+A.dz*1.6,lock=A.t>=1.25,w=lock?0.16+0.1*Math.sin(time*40):0.06;queue(MESH.glowBox,M4.beam(tmpM(),ox,oy,oz,ox+A.dx*300,oy+A.dy*300,oz+A.dz*300,w),[a.ac[0],a.ac[1],a.ac[2],lock?1:0.7],F_ADD);}
    if(a.bm){const b=a.bm,k=b.t/0.3;queue(MESH.glowBox,M4.beam(tmpM(),b.sx,b.sy,b.sz,b.ex,b.ey,b.ez,1.1*k),[a.ac[0],a.ac[1],a.ac[2],0.55*k],F_ADD);queue(MESH.glowBox,M4.beam(tmpM(),b.sx,b.sy,b.sz,b.ex,b.ey,b.ez,0.55*k),[1,1,1,k],F_ADD);}}
  for(const o of INV.orbs){const q=0.9+0.12*Math.sin(o.t*20);queue(MESH.glowSphere,at(o.x,o.y,o.z,0,0,0,0.9*q,0.9*q,0.9*q),[o.c[0]*.4+.6,o.c[1]*.4+.6,o.c[2]*.4+.6,1],0);queue(MESH.glowSphere,at(o.x,o.y,o.z,0,0,0,3.2*q,3.2*q,3.2*q),[o.c[0],o.c[1],o.c[2],0.3],F_ADD);const f=Math.min(1,o.t/3.2),r2=9*f;queue(MESH.ring,at(o.x,o.y,o.z,Math.PI/2,0,0,r2,1,r2),[o.c[0],o.c[1],o.c[2],0.12+0.2*f],F_ADD);}
}
// the wormhole: streaks, thin rings and a dark tube round the camera path (the world fades into it), a bright end in front
const RING2=primMesh(primRing(0.96,72),6);
function lsDraw(){
  const L=INV.ls,t=L.t,d=L.d,r=L.r,u=L.u,cx=camPos.x,cy=camPos.y,cz=camPos.z;
  if(!INV.ws){INV.ws=[];INV.wr=[];for(let i=0;i<70;i++)INV.wr.push({a:Math.random()*TAU,r:30+Math.random()*13,s:Math.random()*760,l:90+Math.random()*220,v:0.5+Math.random()*0.6,w:2+Math.random()*7,c:(Math.random()*4)|0});for(let i=0;i<260;i++)INV.ws.push({a:Math.random()*TAU,r:2.5+Math.pow(Math.random(),0.8)*42,s:Math.random()*760,l:25+Math.random()*90,v:0.7+Math.random()*0.8,w:0.05+Math.random()*0.16,c:(Math.random()*4)|0});}
  const on=smooth(0.05,0.8,t),tub=smooth(0.8,1.7,t)*(1-smooth(4.5,5.1,t)),U=L.u0,COL=[[.3,.42,.55],[.14,.3,.62],[.34,.18,.6],[.18,.5,.6]];
  for(const q of INV.ws){const s=((q.s-U*q.v)%760+760)%760,a=q.a+t*0.3+s*0.0016,px=r.x*Math.cos(a)*q.r+u.x*Math.sin(a)*q.r,py=u.y*Math.sin(a)*q.r,pz=r.z*Math.cos(a)*q.r+u.z*Math.sin(a)*q.r;
    const ax=cx+px+d.x*s,ay=cy+py+d.y*s,az=cz+pz+d.z*s,len=q.l*(0.5+L.sp/60000*1.5),c=COL[q.c],f=Math.pow(1-s/760,0.5)*on;
    queue(MESH.glowBox,M4.beam(tmpM(),ax,ay,az,ax+d.x*len,ay+d.y*len,az+d.z*len,q.w),[c[0],c[1],c[2],f],F_ADD);}
  for(const q of INV.wr){const s=((q.s-U*q.v)%760+760)%760,a=q.a+t*0.5+s*0.003,px=r.x*Math.cos(a)*q.r+u.x*Math.sin(a)*q.r,py=u.y*Math.sin(a)*q.r,pz=r.z*Math.cos(a)*q.r+u.z*Math.sin(a)*q.r,ax=cx+px+d.x*s,ay=cy+py+d.y*s,az=cz+pz+d.z*s,c=COL[q.c],f=Math.pow(1-s/760,0.4)*tub;
    queue(MESH.glowBox,M4.beam(tmpM(),ax,ay,az,ax+d.x*q.l,ay+d.y*q.l,az+d.z*q.l,q.w),[c[0],c[1],c[2],0.07*f],F_ADD);}
  for(let k=0;k<22;k++){const s=((k*34-U)%760+760)%760,f=Math.pow(1-s/760,0.7)*tub,R=21+4*Math.sin(k*0.9+t*2),m=k%4,c=COL[m],x=cx+d.x*s,y=cy+d.y*s,z=cz+d.z*s;
    queue(RING2,M4.alignY(tmpM(),x,y,z,d.x,d.y,d.z,R),[c[0]*1.5,c[1]*1.5,c[2]*1.5,0.8*f],F_ADD);queue(RING2,M4.alignY(tmpM(),x,y,z,d.x,d.y,d.z,R*1.12),[c[0],c[1],c[2],0.35*f],F_ADD);}
  if(tub>0.01){
    const T=M4.alignY(tmpM(),cx+d.x*340,cy+d.y*340,cz+d.z*340,d.x,d.y,d.z,1);queue(MESH.tube,child(T,0,0,0,0,0,0,46,760,46),[0,.004,.03,0.94*tub],F_BL);
    const e=Math.min(1,tub*1.5),ex=cx+d.x*700,ey=cy+d.y*700,ez=cz+d.z*700;queue(UGLOW,at(ex,ey,ez,0,0,0,190,190,190),[.08,.16,.5,0.45*e],F_ADD);queue(UGLOW,at(ex,ey,ez,0,0,0,90,90,90),[.3,.5,.9,0.5*e],F_ADD);queue(UGLOW,at(ex,ey,ez,0,0,0,36,36,36),[.9,.95,1,0.75*e],F_ADD);
  }
}
