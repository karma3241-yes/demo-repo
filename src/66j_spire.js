// ================================================================
// The Apex Spire: three floors of cyber-enhanced fighters, the Sovereign, and the ending that gives the sky back
// ================================================================
// Flow: the entrance arch in the cyber world (66i_cyber.js) calls towerEnter(): story.tower=1, zoneHop to ZONES.spire (parked at z=12000). Floors stack 28 m apart (SPFY),
// 120 x 120 m, 22 m clear height, glass outer walls (solid, never smashable) with a stylised skyline outside, partitions inside (smash:true: fast flight bursts through them).
// Floor 1 Security Lobby (Gunner, Blade Dasher, Drone Handler), floor 2 Augment Labs (Phase Walker, Gravity Bender, Mirror Shield), floor 3 Throne Hall (a Speed-augmented and a
// Titan-augmented champion, then the boss). Floors 1-2 run 3 waves each (never more than SPCAP alive; a handler's drones come on top). Clearing a floor saves story.tf (0..3) and
// opens the lift (a gravity column): the glowing column in the north (floor 1) / south (floor 2) of the room. A knocked-out player respawns at the start of floor min(3,tf+1).
// Enemies are actors of kind 'cyborg' (faction 'cyber', zid 'spire', lockable, hostile), variant in a.vt, all in SP.list; humanoid() draws every one of them in polished chrome.
// The Sovereign (vt 'sov', SOV): 6000+900*level HP, hovers, mocks you (caption #sovsay) and dodges until 50% HP, then "Enough." (cutscene with control) and it fights for real
// (halo red, faster, no taunts). Every 15-20 s TIME STOP: 1 s warning, then the player is frozen 2.5 s (startTimeStop with the boss as the caster: grey screen, world frozen), the boss
// repositions and hangs blades round you that all land when time resumes. Its powers cycle: hard-light fist, web yank and web bomb, storm hammer + lightning, speed dash barrage,
// laser sweep, ice cloud, giant slam, mini black hole, hulk morph. Killing it: story.tower=2, a shatter cutscene, zoneHop to the cyber world, the ending (cyberEnding): the
// synthetic sun and moon dissolve, the real sky returns with the Moon, Earth and the planets as bodies in it, and the shield's ceiling is gone. travelTick (every frame, both
// worlds): at full flight speed held 2 s high up (cyber y>600 / Earth in space) a wormhole (wormholeTo, 66h_invasion.js lsStart) carries you to the other world.
// spireTick(dt) runs once per frame from storyTick with the REAL dt (the boss keeps moving while time is stopped); the AI uses dt*worldTimeK().
const SPO={x:0,y:0,z:12000},SPW=60,SPH=22,SPFY=[0,28,56],SPLIFT=[{x:0,z:48},{x:0,z:-48}],SPCAP=10;
const SPST=[{x:0,z:-52,yaw:Math.PI},{x:0,z:46,yaw:0},{x:0,z:-46,yaw:Math.PI}]; // where each floor starts (yaw PI faces +z)
const SPWAVES=[[{gunner:2,dasher:1},{gunner:2,dasher:2,handler:1},{gunner:3,dasher:2,handler:1}],[{phase:2,bender:1,mirror:1},{phase:2,bender:1,mirror:2},{phase:2,bender:2,mirror:2}]];
const SP={list:[],floor:1,wave:0,nw:1,pend:[],live:false,breath:0,spawnT:0,cleared:[false,false,false],open:false,fx:[],seen:{},objT:0,elite:0,bossT:-1,walls:[],cars:[],ride:false};
const SPR={real:false,ending:false,dis:1,pk:0,hold:0,hint:false,hintT:0,earthHint:false};
const inSpire=()=>!!(zone&&zone.id==='spire');
const spY=()=>SPFY[SP.floor-1];
const spFloorAt=()=>P.pos.y>=SPFY[2]-1?3:P.pos.y>=SPFY[1]-1?2:1;
const spStartAt=f=>({x:SPST[f-1].x,y:SPFY[f-1],z:SPST[f-1].z,yaw:SPST[f-1].yaw});
const SPZ=zoneNew({id:'spire',name:'The Apex Spire',origin:SPO,spawn:SPST[0],smash:true,stars:true,sky:[.03,.07,.2],
  bounds:{x0:-SPW+1,x1:SPW-1,z0:-SPW+1,z1:SPW-1,y1:SPFY[2]+SPH-0.5},light:{dir:[.3,1,.25],lcol:[.55,.6,.8],sky:[.3,.38,.6],gnd:[.14,.19,.34],fogC:[.3,.5,.9],fog:[300,2800],night:0},lights:[],walls:[],
  plan:[[-SPW,SPW,-SPW,SPW]],planCol:'#27436f',mapS:1.6,
  build(){spBuild(SPZ);},enter(){spEnter(SPZ);},leave(){spLeave(SPZ);},update(){},draw(){spZoneDraw(SPZ);},rebuild(){spRebuild(SPZ);},skyU:s=>cySkyU(s),mapMarks:(plot,c)=>spMarks(plot,c)});
// ---- building the three floors and the skyline outside ----
function spBuild(Z){
  const WH=[.9,.94,1],WH2=[.17,.22,.38],DK=[.08,.11,.2],BL=[.15,.5,1],CYG=[.25,.85,1],GD=[1,.78,.3],FLR=[.03,.045,.11],o0={col:false},O=SPO,W=SPW,T=SPH;
  const bx=(x0,y0,z0,x1,y1,z1,c,m=0,o)=>zoneBox(Z,x0,y0,z0,x1,y1,z1,c,m,o);
  for(const [x0,z0,x1,z1] of [[-W-2,-W-2,-W,W+2],[W,-W-2,W+2,W+2],[-W,-W-2,W,-W],[-W,W,W,W+2]])bx(x0,-6,z0,x1,SPFY[2]+T+6,z1,DK,0,{draw:false}); // the glass walls (drawn in spZoneDraw)
  const slab=(y0,y1,hole)=>{ // a floor/ceiling slab, with a square lift hole (half 5 m) when asked
    if(!hole){bx(-W-2,y0,-W-2,W+2,y1,W+2,WH2);return;}const hx=hole.x,hz=hole.z;
    bx(-W-2,y0,-W-2,W+2,y1,hz-5,WH2);bx(-W-2,y0,hz+5,W+2,y1,W+2,WH2);bx(-W-2,y0,hz-5,hx-5,y1,hz+5,WH2);bx(hx+5,y0,hz-5,W+2,y1,hz+5,WH2);};
  slab(-6,0);slab(SPFY[0]+T,SPFY[1],SPLIFT[0]);slab(SPFY[1]+T,SPFY[2],SPLIFT[1]);slab(SPFY[2]+T,SPFY[2]+T+6);
  bx(-5,SPFY[1]-0.4,SPLIFT[0].z-5,5,SPFY[1],SPLIFT[0].z+5,WH2);bx(-5,SPFY[2]-0.4,SPLIFT[1].z-5,5,SPFY[2],SPLIFT[1].z+5,WH2); // the caps: you arrive standing on them
  const part=(f,x0,x1,z0,z1,h)=>{const y0=SPFY[f],b={x0:O.x+x0,x1:O.x+x1,y0,y1:y0+h,z0:O.z+z0,z1:O.z+z1,col:WH,mat:0,smash:true,dead:false};Z.cols.push(b);Z.walls.push(b);};
  for(let f=0;f<3;f++){
    const y0=SPFY[f],gold=f===2;
    bx(-W,y0-0.02,-W,W,y0+0.04,W,FLR,0,o0);
    for(const x of [-30,-6,6,30])bx(x-.3,y0+.04,-W,x+.3,y0+.12,W,Math.abs(x)<10?CYG:BL,6,o0); // glowing floor lines
    for(const z of [-40,-20,0,20,40])bx(-W,y0+.04,z-.18,W,y0+.1,z+.18,[.12,.4,.85],6,o0);
    for(const x of [-45,-15,15,45])bx(x-.5,y0+T-0.08,-W+2,x+.5,y0+T,W-2,[.7,.88,1],6,o0); // ceiling light strips
    for(const z of [-30,0,30])bx(-W+2,y0+T-0.08,z-.4,W-2,y0+T,z+.4,[.7,.88,1],6,o0);
    for(const [x0,z0,x1,z1] of [[-W,-W,W,-W+.5],[-W,W-.5,W,W],[-W,-W,-W+.5,W],[W-.5,-W,W,W]]){bx(x0,y0+.04,z0,x1,y0+.4,z1,gold?GD:CYG,6,o0);bx(x0,y0+T-.5,z0,x1,y0+T,z1,gold?GD:CYG,6,o0);} // baseboard and cornice light
    for(let k=-5;k<=5;k++){bx(k*10-.5,y0,-W-.1,k*10+.5,y0+T,-W+.4,WH,0,o0);bx(k*10-.5,y0,W-.4,k*10+.5,y0+T,W+.1,WH,0,o0);bx(-W-.1,y0,k*10-.5,-W+.4,y0+T,k*10+.5,WH,0,o0);bx(W-.4,y0,k*10-.5,W+.1,y0+T,k*10+.5,WH,0,o0);} // glass mullions
    for(const sx of [-1,1])for(const sz of [-1,1])Z.lights.push({x:O.x+sx*30,y:y0+T-3,z:O.z+sz*30,r:50,c:gold?[1,.9,.7]:[.45,.6,.95],k:0.16});
    Z.lights.push({x:O.x,y:y0+T-3,z:O.z,r:50,c:gold?[1,.9,.7]:[.45,.6,.95],k:0.16});
  }
  // ---- floor 1: the Security Lobby ----
  {const y0=SPFY[0];
    bx(-9,y0,-6,9,y0+1.2,6,WH);bx(-9,y0+1.2,-6,9,y0+1.3,6,BL,6,o0);bx(-8,y0+1.4,-.1,8,y0+5.5,.1,[.3,.8,1],6,o0);
    for(const x of [-18,-12,-6,6,12,18]){bx(x-.2,y0,-32,x+.2,y0+1.9,-31.2,WH);bx(x-.25,y0+1.9,-32.05,x+.25,y0+2.1,-31.15,CYG,6,o0);}
    for(const sx of [-1,1])for(const sz of [-1,1]){const x=sx*32,z=sz*30;bx(x-1.7,y0,z-1.7,x+1.7,y0+T,z+1.7,WH);for(const y of [3,10,17])bx(x-1.8,y0+y,z-1.8,x+1.8,y0+y+.3,z+1.8,BL,6,o0);}
    bx(-6,y0,-W+.5,6,y0+10,-W+1,[.1,.3,.7],6,o0);bx(-6.5,y0,-W+.3,-5.5,y0+10.5,-W+1.2,CYG,6,o0);bx(5.5,y0,-W+.3,6.5,y0+10.5,-W+1.2,CYG,6,o0);bx(-6.5,y0+10,-W+.3,6.5,y0+10.8,-W+1.2,CYG,6,o0); // the entrance gate behind you
    part(0,-45,-20,14,15.4,14);part(0,20,45,14,15.4,14);part(0,-45,-43.6,-30,-8,14);part(0,43.6,45,-30,-8,14);}
  // ---- floor 2: the Augment Labs ----
  {const y0=SPFY[1];
    for(const sx of [-1,1])for(let k=0;k<6;k++){const x=sx*52,z=-40+k*16;bx(x-2,y0,z-2,x+2,y0+1,z+2,[.72,.8,.92]);bx(x-2,y0+T-3,z-2,x+2,y0+T-2,z+2,[.72,.8,.92],0,o0);bx(x-2.2,y0+1,z-.15,x-1.8,y0+3,z+.15,CYG,6,o0);}
    bx(-6,y0,-6,6,y0+.8,6,[.8,.86,.96]);bx(-5,y0+.8,-5,5,y0+.9,5,CYG,6,o0);bx(-1.5,y0+.9,-1.5,1.5,y0+1.6,1.5,WH);
    for(const sx of [-1,1])for(const sz of [-1,1]){const x=sx*30,z=sz*28;bx(x-1.5,y0,z-1.5,x+1.5,y0+T,z+1.5,WH);for(const y of [3,10,17])bx(x-1.6,y0+y,z-1.6,x+1.6,y0+y+.3,z+1.6,[.7,.5,1],6,o0);}
    part(1,-40,-12,-10,-8.6,13);part(1,12,40,-10,-8.6,13);part(1,-26,-24.6,-40,-22,13);part(1,24.6,26,-40,-22,13);part(1,-40,-12,14,15.4,13);part(1,12,40,14,15.4,13);}
  // ---- floor 3: the Throne Hall ----
  {const y0=SPFY[2];
    for(const sx of [-1,1])for(const z of [-40,-14,12,38]){const x=sx*36;bx(x-1.7,y0,z-1.7,x+1.7,y0+T,z+1.7,WH);for(const y of [2,11,19])bx(x-1.85,y0+y,z-1.85,x+1.85,y0+y+.35,z+1.85,GD,6,o0);}
    bx(-24,y0,34,24,y0+.7,W-.5,[.96,.94,.9]);bx(-20,y0+.7,38,20,y0+1.4,W-.5,[.96,.94,.9]);bx(-24,y0+.7,34,24,y0+.8,34.4,GD,6,o0);bx(-20,y0+1.4,38,20,y0+1.5,38.4,GD,6,o0);
    bx(-5,y0+1.4,52,5,y0+11,54,[.98,.95,.85]);bx(-5.4,y0+1.4,51.8,-4.6,y0+11.4,54.2,GD,6,o0);bx(4.6,y0+1.4,51.8,5.4,y0+11.4,54.2,GD,6,o0);bx(-3,y0+1.4,48,3,y0+3.4,52,[.96,.92,.8]);
    bx(-4,y0+.05,-W,4,y0+.12,34,[1,.78,.3],6,o0);bx(-4.6,y0+.05,-W,-4.2,y0+.14,34,GD,6,o0);bx(4.2,y0+.05,-W,4.6,y0+.14,34,GD,6,o0);}
  // ---- the skyline outside: white towers with glowing blue bands, a long way down, and avenues of light ----
  cySeed=0x51f15e;const rn=cyR;
  bx(-1900,-142,-1900,1900,-140,1900,[.4,.52,.78],0,o0);
  for(let k=-12;k<=12;k++){bx(k*150-1,-140,-1900,k*150+1,-139.6,1900,CYG,6,o0);bx(-1900,-140,k*150-1,1900,-139.6,k*150+1,CYG,6,o0);}
  for(let k=0;k<190;k++){const a=rn()*TAU,r=100+Math.pow(rn(),0.65)*1000,x=Math.cos(a)*r,z=Math.sin(a)*r,w=16+rn()*38,d=16+rn()*38;
    if(Math.abs(x)<w/2+78&&Math.abs(z)<d/2+78)continue;
    const H=30+rn()*Math.min(300,70+r*0.34)*(rn()<0.14?1.7:1),c=CYPAL[(rn()*CYPAL.length)|0],sd=rn();
    bx(x-w/2,-141,z-d/2,x+w/2,H,z+d/2,c,9,{col:false,seed:sd});bx(x-w/2+1,H,z-d/2+1,x+w/2-1,H+.6,z+d/2-1,CYGL,6,o0);}
  zoneBake(Z);
  for(let n=0;n<26;n++)SP.cars.push({x:(n%2?1:-1)*(86+rn()*320),y:-20+rn()*150,v:(18+rn()*40)*(rn()<.5?1:-1),o:rn()*900,c:rn()<.5?[.3,.85,1]:[.7,.8,1],ax:n%3===0});
  spRebuild(Z);
}
function spRebuild(Z){ // the partitions are redrawn without whatever was smashed
  const g=new Geo();for(const b of Z.walls){if(b.dead)continue;g.box(b.x0,b.y0,b.z0,b.x1,b.y1,b.z1,b.col,0);g.box(b.x0-.04,b.y1-.3,b.z0-.04,b.x1+.04,b.y1,b.z1+.04,[.35,.8,1],6);g.box(b.x0-.04,b.y0,b.z0-.04,b.x1+.04,b.y0+.25,b.z1+.04,[.35,.8,1],6);}
  if(Z.mesh2)freeMesh(Z.mesh2);Z.mesh2=g.idx.length?g.mesh():null;
}
// ================================================================
// The cyborgs
// ================================================================
const CB={ // armour tint, glow colour, health factor, size, hint (first time seen)
  gunner:{name:'Gunner',col:[.72,.88,1],trim:[.3,.85,1],css:'#7fd6ff',hp:1,sc:1,hint:'Rifle bursts after a glow. Keep moving.'},
  dasher:{name:'Blade Dasher',col:[.6,.74,1],trim:[.4,.6,1],css:'#9bb8ff',hp:.9,sc:1,hint:'When its blade glows, a dash slash is coming. Sidestep it.'},
  handler:{name:'Drone Handler',col:[.84,.7,1],trim:[.75,.5,1],css:'#d79bff',hp:.8,sc:1,hint:'It releases two drones. Take the handler out first.'},
  drone:{name:'Drone',col:[.92,.95,1],trim:[.45,.9,1],css:'#9be8ff',hp:.28,sc:.5,hint:''},
  phase:{name:'Phase Walker',col:[.74,.62,1],trim:[.8,.5,1],css:'#d79bff',hp:1.1,sc:1,hint:'It turns intangible, then strikes from behind. Wait for it to return.'},
  bender:{name:'Gravity Bender',col:[.6,.56,1],trim:[.6,.4,1],css:'#b59bff',hp:1.4,sc:1.05,hint:'It drags you in, then slams. Break away or get above it.'},
  mirror:{name:'Mirror Shield',col:[.78,.96,1],trim:[.6,.95,1],css:'#9be8ff',hp:1.5,sc:1.05,hint:'Its front shield reflects projectiles. Hit it from the side or behind.'},
  speedy:{name:'Velocity Augment',col:[1,.86,.45],trim:[1,.85,.3],css:'#ffd75a',hp:3.5,sc:.97,elite:1,hint:'A speed-augmented champion. It rushes in for combos.'},
  titan:{name:'Titan Augment',col:[1,.6,.4],trim:[1,.5,.25],css:'#ffa066',hp:5.2,sc:1.75,elite:1,hint:'A titan-augmented champion. Stay off the ground when it stomps.'},
};
for(const k in CB){const V=CB[k];V.d4=[.07,.1,.19,1];V.c4=[V.col[0],V.col[1],V.col[2],1];V.t4=[V.trim[0],V.trim[1],V.trim[2],1];}
const spAlive=()=>{let n=0;for(const a of SP.list)if(a.alive&&a.vt!=='sov')n++;return n;};
function cbRemove(a){removeActor(a);removeFrom(SP.list,a);if(lockT===a)lockT=null;}
function spSpawn(vt,ow){
  const V=CB[vt],y0=spY(),lvl=save.level,fly=vt==='drone';let x=SPO.x,z=SPO.z,ok=false;
  if(ow){x=ow.pos.x+rr(-2,2);z=ow.pos.z+rr(-2,2);ok=true;}
  for(let t=0;t<40&&!ok;t++){x=SPO.x+rr(-50,50);z=SPO.z+rr(-50,50);
    if(Math.hypot(x-P.pos.x,z-P.pos.z)<14||inBuilding(x,y0+1,z,1.6*V.sc)||inBuilding(x,y0+3.2,z,1.4*V.sc))continue;ok=true;}
  if(!ok){x=SPO.x+(Math.random()<.5?-46:46);z=SPO.z+rr(-30,30);}
  const hp=Math.round((100+12*lvl)*V.hp);
  const a={kind:'cyborg',faction:'cyber',zid:'spire',vt,name:V.name,alive:true,hp,maxHp:hp,pos:new V3(x,y0+(fly?(ow?ow.pos.y-y0+1.8:3.6):0.05),z),vel:new V3(),yaw:Math.atan2(P.pos.x-x,P.pos.z-z),flash:0,stun:0,slow:0,slowT:0,burn:0,burnDps:0,held:false,thrown:null,
    sc:V.sc,cy:(fly?1:1.5)*V.sc,radius:(fly?0.7:0.85)*V.sc,ys:0.8,lastHit:-99,deadT:0,vis:1,mat:0,fly,own:ow||null,st:'walk',bt:0,t:0,cd:rr(0.8,2),fireT:rr(1,2.4),volley:0,volT:0,os:Math.random()<.5?1:-1,osT:rr(2,4),glow:0,castT:-9,phase:rr(0,TAU),sh:0,ph:rr(0,TAU),meleeT:0,ghost:false,rt:0,scanT:0,los:false,elite:V.elite||0,n:0,hit:false,cx:0,cz:0,lx:x,ly:y0,lz:z};
  a.onHit=(src,amt,type)=>cbOnHit(a,src,amt,type);a.onDefeat=()=>cbOnDefeat(a);
  actors.push(a);SP.list.push(a);SP.fx.push({x,y:y0,z,t:0,dur:0.8,c:V.trim});
  burst(x,a.pos.y+1.2,z,16,8,0.5,[V.trim,[1,1,1]],1.1,0,2);SFX.tone('triangle',1400,400,0.25,0.06*SFX.vol(x,y0,z));
  if(V.hint&&!SP.seen[vt]){SP.seen[vt]=1;later(2.2,()=>{if(inSpire())feed(V.name,V.hint);});}
  return a;
}
const SP_REFL={shot:1,bullet:1,blast:1,beam:1,ring:1,shock:1,plasma:1}; // what a Mirror Shield bounces back (melee from the front is mostly blocked)
function cbOnHit(a,src,amt,type){
  if(!a.alive)return;
  if(a.ghost){a.hp=Math.min(a.maxHp,a.hp+amt);a.flash=0;burst(a.pos.x,a.pos.y+a.cy,a.pos.z,5,4,0.3,[[.8,.5,1]],0.8,0,2);return;}
  if(a.vt==='mirror'&&src&&src.pos){
    const dx=src.pos.x-a.pos.x,dz=src.pos.z-a.pos.z,l=Math.hypot(dx,dz)||1,fx=Math.sin(a.yaw),fz=Math.cos(a.yaw);
    if((dx*fx+dz*fz)/l>0.35){const rng=SP_REFL[type],mel=type==='punch'||type==='slash'||type==='hit'||type==='bump';
      if(rng||mel){a.hp=Math.min(a.maxHp,a.hp+amt*(rng?1:0.75));a.flash=0;a.sh=1;const px=a.pos.x+fx*1.2,py=a.pos.y+a.cy,pz=a.pos.z+fz*1.2;burst(px,py,pz,8,9,0.3,[[.6,.95,1],[1,1,1]],1,0,2);ringFx(px,py,pz,0.4,2.4,0.2,[.6,.95,1]);SFX.tone('square',1700,1000,0.06,0.05*SFX.vol(px,py,pz));
        if(rng&&time-a.rt>0.5&&!P.dead){a.rt=time;const v=dirTo({x:px,y:py,z:pz},P.pos.x,P.pos.y+1.2,P.pos.z);fireProj({kind:'plasma',owner:a,x:px,y:py,z:pz,vx:v[0]*50,vy:v[1]*50,vz:v[2]*50,dmg:7+0.12*save.level,r:0.5,life:2.2,knock:6,pc:[.6,.95,1],sc:1.2});}}}
  }
}
function cbOnDefeat(a){
  const V=CB[a.vt];a.vel.mul(0.4);a.ghost=false;a.vis=1;burst(a.pos.x,a.pos.y+a.cy,a.pos.z,34,16,0.8,[V.trim,[1,1,1],V.col],2,0,1.8);ringFx(a.pos.x,a.pos.y+a.cy,a.pos.z,1,8,0.4,V.trim);
  SFX.tone('sawtooth',600,80,0.4,0.08*SFX.vol(a.pos.x,a.pos.y,a.pos.z));
}
function cbShoot(a,k){
  const V=CB[a.vt],ox=a.pos.x+Math.sin(a.yaw)*0.9*a.sc,oy=a.pos.y+a.cy+0.3,oz=a.pos.z+Math.cos(a.yaw)*0.9*a.sc,d3=Math.hypot(P.pos.x-ox,P.pos.y-oy,P.pos.z-oz),lead=d3/46*0.5;
  const v=dirTo({x:ox,y:oy,z:oz},P.pos.x+P.vel.x*lead+rr(-1,1),P.pos.y+1.2+P.vel.y*lead*0.6+rr(-.7,.7),P.pos.z+P.vel.z*lead+rr(-1,1));
  fireProj({kind:'plasma',owner:a,x:ox,y:oy,z:oz,vx:v[0]*46,vy:v[1]*46,vz:v[2]*46,dmg:(7+0.12*save.level)*(k||1),r:0.5,life:2.4,knock:5,pc:V.trim,sc:1.1});a.castT=time;
  SFX.tone('square',500,1200,0.1,0.05*SFX.vol(ox,oy,oz));
}
const cbHurt=(a,dmg,type,knock)=>{if(!P.dead)Damage.apply(a,P,dmg,type,{knock});a.castT=time;};
function cbUpdate(a,dt){
  a.flash=Math.max(0,a.flash-dt*5);a.sh=Math.max(0,a.sh-dt*3);a.glow=Math.max(0,a.glow-dt*2.5);
  if(a.slowT>0){a.slowT-=dt;if(a.slowT<=0)a.slow=0;}
  if(a.burn>0&&a.alive){a.burn-=dt;Damage.apply(a.burnSrc,a,a.burnDps*dt,'burn');}
  if(a.held)return;
  if(!a.alive){a.deadT+=dt;a.pos.addS(a.vel,dt);a.vel.mul(Math.pow(0.3,dt));if(a.deadT>0.7)cbRemove(a);return;}
  if(a.mat<1)a.mat=Math.min(1,a.mat+dt*2.2);
  const sk=1-(a.slow||0),stun=a.stun>0,lvl=save.level,vol=SFX.vol(a.pos.x,a.pos.y,a.pos.z);if(stun)a.stun-=dt;a.t+=dt;
  const valid=!P.dead&&state==='play'&&!cutLocked()&&a.mat>=1,dx=P.pos.x-a.pos.x,dz=P.pos.z-a.pos.z,dy=P.pos.y+1.3-(a.pos.y+a.cy),d=Math.hypot(dx,dz)||0.01,d3=Math.hypot(dx,dy,dz)||0.01,ux=dx/d,uz=dz/d;
  let wx=0,wz=0,wy=0,kk=6,yr=8,face=true;
  a.fireT-=dt;a.cd-=dt;a.meleeT-=dt;a.osT-=dt;if(a.osT<=0){a.osT=rr(2,4.5);a.os=-a.os;}
  a.scanT-=dt;if(a.scanT<=0){a.scanT=0.4;a.los=valid&&d3<70&&losClear(a.pos.x,a.pos.y+a.cy,a.pos.z,P.pos.x,P.pos.y+1.3,P.pos.z);}
  const hold=(want,sp,strafe)=>{const e=d-want,r=e>3?sp:e<-3?-sp*0.7:e*sp/6;wx=ux*r-uz*a.os*sp*strafe;wz=uz*r+ux*a.os*sp*strafe;};
  if(valid&&!stun){
    switch(a.vt){
    case 'gunner':hold(14,8*sk,0.55);
      if(a.st==='walk'){if(a.fireT<=0&&d3<60&&a.los){a.st='wind';a.bt=0.4;}}
      else if(a.st==='wind'){a.bt-=dt;a.glow=1;if(a.bt<=0){a.st='fire';a.volley=3;a.volT=0;}}
      else{a.volT-=dt;if(a.volT<=0){a.volT=0.16;a.volley--;cbShoot(a);if(a.volley<=0){a.st='walk';a.fireT=rr(2,3.2);}}}
      break;
    case 'dasher':
      if(a.st==='walk'){const sp=9*sk;wx=ux*sp;wz=uz*sp;
        if(d<2.6&&a.meleeT<=0){a.meleeT=1;cbHurt(a,8+0.12*lvl,'punch',8);SFX.punch(0.5*vol);}
        if(a.cd<=0&&d<22&&d>5){a.st='aim';a.bt=0.55;a.cx=ux;a.cz=uz;}}
      else if(a.st==='aim'){a.bt-=dt;a.glow=1;face=false;if(a.bt>0.2){a.cx=ux;a.cz=uz;}a.yaw=angLerp(a.yaw,Math.atan2(a.cx,a.cz),damp(14,dt));if(a.bt<=0){a.st='dash';a.bt=0.3;a.hit=false;SFX.whoosh();}}
      else if(a.st==='dash'){a.bt-=dt;wx=a.cx*58;wz=a.cz*58;kk=16;face=false;a.glow=1;
        if(!a.hit&&d<2.8&&Math.abs(dy)<2.6){a.hit=true;cbHurt(a,14+0.2*lvl,'slash',12);tracer(a.pos.x-a.cx*2,a.pos.y+a.cy+1,a.pos.z-a.cz*2,a.pos.x+a.cx*3,a.pos.y+a.cy-1,a.pos.z+a.cz*3,CB.dasher.trim,0.35,0.25);SFX.punch(0.7*vol);}
        if(a.bt<=0){a.st='rec';a.bt=0.7;}}
      else{a.bt-=dt;wx=ux*3;wz=uz*3;if(a.bt<=0){a.st='walk';a.cd=rr(2.2,3.4);}}
      break;
    case 'handler':{hold(19,7*sk,0.5);let n=0;for(const o of SP.list)if(o.own===a&&o.alive)n++;
      if(a.st==='walk'){if(a.cd<=0&&n<2&&d<45){a.st='rel';a.bt=0.9;}else if(a.fireT<=0&&d3<50&&a.los){a.fireT=rr(3,4.2);cbShoot(a,0.7);}}
      else{a.bt-=dt;a.glow=1;wx=wz=0;if(a.bt<=0){for(let i=n;i<2;i++)spSpawn('drone',a);a.st='walk';a.cd=rr(8,11);SFX.tone('triangle',500,1500,0.3,0.07*vol);}}
      break;}
    case 'drone':{const ang=a.phase+a.t*0.7,tx=P.pos.x+Math.cos(ang)*8,tz=P.pos.z+Math.sin(ang)*8,ty=P.pos.y+2.6+Math.sin(a.t*1.6+a.ph)*0.8;
      wx=clamp((tx-a.pos.x)*1.6,-14,14);wz=clamp((tz-a.pos.z)*1.6,-14,14);wy=clamp((ty-a.pos.y)*1.8,-8,8);
      if(a.fireT<=0&&d3<40&&a.los){a.fireT=rr(1.6,2.6);cbShoot(a,0.55);}break;}
    case 'phase':
      if(a.st==='walk'){const sp=8.5*sk;wx=ux*sp;wz=uz*sp;if(d<2.6&&a.meleeT<=0){a.meleeT=1.1;cbHurt(a,11+0.16*lvl,'punch',10);SFX.punch(0.5*vol);}if(a.cd<=0&&d<28&&d>4){a.st='fade';a.bt=0.3;a.glow=1;}}
      else if(a.st==='fade'){a.bt-=dt;a.vis=Math.max(0.25,a.bt/0.3);if(a.bt<=0){a.st='ghost';a.ghost=true;a.bt=1.05;a.vis=0.25;SFX.tone('sine',1500,300,0.25,0.06*vol);}}
      else if(a.st==='ghost'){a.bt-=dt;a.vis=0.25;const tx=P.pos.x+Math.sin(P.yaw)*3.4,tz=P.pos.z+Math.cos(P.yaw)*3.4,gx=tx-a.pos.x,gz=tz-a.pos.z,gl=Math.hypot(gx,gz)||1;wx=gx/gl*Math.min(26,gl*6);wz=gz/gl*Math.min(26,gl*6);kk=14;
        if(a.bt<=0){if(inBuilding(a.pos.x,spY()+1,a.pos.z,0.9))a.bt=0.25;else{a.ghost=false;a.vis=1;a.st='strike';a.bt=0.4;SFX.tone('sine',300,1400,0.2,0.07*vol);}}}
      else if(a.st==='strike'){a.bt-=dt;a.glow=1;wx=wz=0;if(a.bt<=0){if(d<3.4&&Math.abs(dy)<2.8){cbHurt(a,16+0.22*lvl,'punch',16);SFX.punch(0.8*vol);}a.st='rec';a.bt=0.6;}}
      else{a.bt-=dt;if(a.bt<=0){a.st='walk';a.cd=rr(3.8,5.5);}}
      break;
    case 'bender':hold(11,5*sk,0.35);
      if(a.st==='walk'){if(a.cd<=0&&d<32){a.st='pull';a.bt=1.4;}}
      else if(a.st==='pull'){a.bt-=dt;a.glow=1;wx=wz=0;if(d>3.5){P.vel.x-=ux*34*dt;P.vel.z-=uz*34*dt;if(P.flying)P.vel.y+=(a.pos.y+a.cy-P.pos.y)*dt;const sp=Math.hypot(P.vel.x,P.vel.z);if(sp>24){P.vel.x*=24/sp;P.vel.z*=24/sp;}}
        if(a.bt<=0){a.st='slam';a.bt=0.6;SFX.tone('sawtooth',200,60,0.5,0.09*vol);}}
      else if(a.st==='slam'){a.bt-=dt;a.glow=1;wx=wz=0;if(a.bt<=0){if(d<9&&P.pos.y<a.pos.y+3.2)cbHurt(a,17+0.25*lvl,'blast',22);ringFx(a.pos.x,a.pos.y+0.2,a.pos.z,1,9,0.4,[.7,.5,1]);burst(a.pos.x,a.pos.y+0.4,a.pos.z,26,12,0.5,[[.7,.5,1],[1,1,1]],1.3,-2,2);SFX.boom(0.5*vol,0.7);addShake(0.2*vol);a.st='rec';a.bt=0.8;}}
      else{a.bt-=dt;wx=wz=0;if(a.bt<=0){a.st='walk';a.cd=rr(4.5,6.5);}}
      break;
    case 'mirror':{yr=1.5;const sp=6*sk;if(d>5.5){wx=ux*sp;wz=uz*sp;}else if(d<3.5){wx=-ux*sp*0.4;wz=-uz*sp*0.4;}
      if(d<3.5&&a.meleeT<=0){a.meleeT=1.7;cbHurt(a,10+0.15*lvl,'punch',18);SFX.punch(0.6*vol);}break;}
    case 'speedy':
      if(a.st==='walk'){const ang=a.phase+=dt*1.7*a.os,tx=P.pos.x+Math.cos(ang)*7,tz=P.pos.z+Math.sin(ang)*7;wx=clamp((tx-a.pos.x)*5,-26,26);wz=clamp((tz-a.pos.z)*5,-26,26);kk=10;if(a.cd<=0){a.st='rush';a.bt=0.55;a.glow=1;SFX.whoosh();}}
      else if(a.st==='rush'){a.bt-=dt;wx=ux*62;wz=uz*62;kk=14;a.glow=1;if(d<2.6){a.st='combo';a.bt=0;a.n=0;}else if(a.bt<=0){a.st='walk';a.cd=rr(0.6,1.2);}}
      else if(a.st==='combo'){wx=wz=0;a.bt-=dt;a.glow=1;if(a.bt<=0){a.bt=0.17;a.n++;if(d<3.8)cbHurt(a,7+0.1*lvl,'slash',7);tracer(a.pos.x-ux*1.5,a.pos.y+a.cy+rr(-.6,.6),a.pos.z-uz*1.5,a.pos.x+ux*2.5,a.pos.y+a.cy+rr(-.6,.6),a.pos.z+uz*2.5,CB.speedy.trim,0.2,0.2);SFX.punch(0.5*vol);if(a.n>=4){a.st='away';a.bt=0.4;}}}
      else{a.bt-=dt;wx=-ux*40-uz*a.os*20;wz=-uz*40+ux*a.os*20;kk=14;if(a.bt<=0){a.st='walk';a.cd=rr(1.3,2.2);}}
      if(Math.hypot(a.vel.x,a.vel.z)>20&&Math.random()<0.8)tracer(a.lx,a.ly+a.cy,a.lz,a.pos.x,a.pos.y+a.cy,a.pos.z,CB.speedy.trim,0.1,0.25);
      break;
    case 'titan':{const sp=6.5*sk;
      if(a.st==='walk'){if(d>3.2){wx=ux*sp;wz=uz*sp;}if(d<3.8&&a.meleeT<=0){a.meleeT=1.5;cbHurt(a,18+0.26*lvl,'punch',24);SFX.punch(0.9*vol);}
        if(a.cd<=0){if(Math.random()<0.5){a.st='stomp';a.bt=1.0;}else{a.st='cw';a.bt=0.8;a.cx=ux;a.cz=uz;}}}
      else if(a.st==='stomp'){a.bt-=dt;a.glow=1;if(a.bt<=0){if(d<12&&P.pos.y<a.pos.y+2.4)cbHurt(a,19+0.28*lvl,'blast',22);ringFx(a.pos.x,a.pos.y+0.2,a.pos.z,1,12,0.5,[1,.6,.3]);ringFx(a.pos.x,a.pos.y+0.2,a.pos.z,1,8,0.35,[1,1,1]);burst(a.pos.x,a.pos.y+0.4,a.pos.z,34,14,0.5,[[1,.6,.3],[1,1,1]],1.6,-2,2);SFX.boom(0.8*vol,0.5);addShake(0.4*vol);a.st='rec';a.bt=0.9;}}
      else if(a.st==='cw'){a.bt-=dt;a.glow=1;wx=-ux*2;wz=-uz*2;if(a.bt<=0){a.st='charge';a.bt=0.9;a.hit=false;SFX.whoosh();}}
      else if(a.st==='charge'){a.bt-=dt;wx=a.cx*26;wz=a.cz*26;kk=8;a.glow=1;face=false;
        if(!a.hit&&d<3.8&&Math.abs(dy)<3.2){a.hit=true;cbHurt(a,24+0.34*lvl,'punch',32);SFX.punch(1);addShake(0.3*vol);}if(a.bt<=0||a.hit){a.st='rec';a.bt=1.0;}}
      else{a.bt-=dt;if(a.bt<=0){a.st='walk';a.cd=rr(2.4,3.6);}}
      break;}
    }
  }
  if(face&&valid&&!stun)a.yaw=angLerp(a.yaw,Math.atan2(dx,dz),damp(yr,dt));
  const k=damp(stun?1.5:kk,dt);a.vel.x+=(wx-a.vel.x)*k;a.vel.z+=(wz-a.vel.z)*k;
  if(a.fly)a.vel.y+=(wy-a.vel.y)*damp(3,dt);else if(!a.ghost)a.vel.y-=34*dt;
  const prevY=a.pos.y;a.lx=a.pos.x;a.ly=a.pos.y;a.lz=a.pos.z;a.pos.addS(a.vel,dt);
  if(a.ghost){a.pos.y=spY()+0.05;a.vel.y=0;}
  else collideBody(a.pos,a.vel,prevY,0.7*a.sc,a.fly?2:2.4*a.sc);
  a.phase+=Math.hypot(a.vel.x,a.vel.z)*dt*1.5;
  if(a.pos.y<spY()-3)a.pos.y=spY()+0.05;
  for(const o of SP.list){if(o===a||!o.alive||!a.alive||o.vt==='sov')continue;const ox=a.pos.x-o.pos.x,oz=a.pos.z-o.pos.z,l=Math.hypot(ox,oz),m=1.3*(a.sc+o.sc);if(l<m&&l>0.01&&Math.abs(a.pos.y-o.pos.y)<2){a.pos.x+=ox/l*(m-l)*0.35;a.pos.z+=oz/l*(m-l)*0.35;}}
  if(a.alive&&!P.dead&&!a.fly&&!a.ghost){const ox=a.pos.x-P.pos.x,oz=a.pos.z-P.pos.z,l=Math.hypot(ox,oz),m=1.2*a.sc+0.4;if(l<m&&l>0.01&&Math.abs(a.pos.y-P.pos.y)<2){a.pos.x+=ox/l*(m-l)*0.5;a.pos.z+=oz/l*(m-l)*0.5;}}
}
// ================================================================
// Drawing the humanoids (every cyborg and the Sovereign): polished chrome limbs, glowing visor and trim
// ================================================================
// o: {sc,sx,sy (extra width / height),col,dk,trim,fl,ghost,bob,lean,aR,aL,eR,eL (arm angles, elbows),leg (swing),kn,pad,hand(eb,Q),handL(eb,Q)}
function humanoid(a,o){
  const K=1.38*o.sc,C=o.col,D=o.dk,T=o.trim,cT=[T[0],T[1],T[2],1],g=o.ghost;
  const Q=(m,M,c,f)=>g?queue(m,M,[c[0],c[1],c[2],0.3],F_BL):queue(m,M,c,f||0,o.fl||0);
  const root=at(a.pos.x,a.pos.y+(o.bob||0),a.pos.z,o.lean||0,a.yaw,0,K*(o.sx||1),K*(o.sy||1),K*(o.sx||1));
  Q(PFB,child(root,0,0.93,0,0,0,0,0.3,0.15,0.2),D);Q(PFS,child(root,0,1.3,0,0,0,0,0.21,0.3,0.14),C);Q(PFB,child(root,0,1.42,0.07,0,0,0,0.3,0.2,0.09),C);Q(PFB,child(root,0,1.18,0.07,0,0,0,0.24,0.12,0.08),D);
  Q(MESH.glowBox,child(root,0,1.42,0.121,0,0,Math.PI/4,0.07,0.07,0.02),cT);Q(MESH.glowBox,child(root,0,1.03,0.1,0,0,0,0.27,0.025,0.04),cT);
  Q(PFS,child(root,0,1.74,0.01,0,0,0,0.105,0.135,0.115),C);Q(MESH.glowBox,child(root,0,1.75,0.108,0,0,0,0.16,0.035,0.03),cT);Q(PFB,child(root,0,1.6,0,0,0,0,0.07,0.08,0.07),D);
  const pd=o.pad||1;
  for(const s of [-1,1]){
    const sh=child(root,s*0.27,1.48,0,s>0?o.aR||0:o.aL||0,0,s*0.1),el=s>0?o.eR||0:o.eL||0;
    Q(PFS,child(root,s*0.27,1.5,0,0,0,0,0.085*pd,0.075*pd,0.085*pd),C);Q(PFB,child(sh,0,-0.16,0,0,0,0,0.085,0.3,0.09),C);
    const eb=child(sh,0,-0.32,0,el,0,0);Q(PFS,child(eb,0,0,0,0,0,0,0.058,0.058,0.058),D);Q(PFB,child(eb,0,-0.16,0,0,0,0,0.072,0.3,0.078),D);Q(PFS,child(eb,0,-0.35,0,0,0,0,0.06,0.06,0.06),C);
    if(s>0&&o.hand)o.hand(eb,Q);else if(s<0&&o.handL)o.handL(eb,Q);
    const hp=child(root,s*0.1,0.93,0,(o.leg||0)*s,0,0);Q(PFB,child(hp,0,-0.21,0,0,0,0,0.13,0.44,0.14),C);
    const kn=child(hp,0,-0.43,0,Math.max(0,-s*(o.leg||0))*1.1,0,0);Q(PFS,child(kn,0,0,0.01,0,0,0,0.07,0.07,0.07),D);Q(PFB,child(kn,0,-0.2,0,0,0,0,0.105,0.4,0.11),D);Q(PFB,child(kn,0,-0.42,0.05,0,0,0,0.1,0.06,0.22),C);
  }
  return root;
}
function cbDraw(a){
  if(a.vt==='sov')return;
  const dx=a.pos.x-camPos.x,dz=a.pos.z-camPos.z,dy=a.pos.y-camPos.y,d2=dx*dx+dy*dy+dz*dz;if(d2>300*300||(d2>900&&dx*camF.x+dy*camF.y+dz*camF.z<-0.3*Math.sqrt(d2)))return;
  const V=CB[a.vt],t=time,mv=Math.min(Math.hypot(a.vel.x,a.vel.z)/8,1),sw=Math.sin(a.phase)*mv*0.75;
  if(a.fly){cbDroneDraw(a,V,t);return;}
  const dead=a.alive?1:Math.max(0,1-a.deadT/0.7),aim=t-a.castT<0.4||a.st==='wind'||a.st==='fire'||a.st==='aim',up=a.st==='rel'||a.st==='pull'||a.st==='slam'||a.st==='stomp'||a.st==='cw';
  let sx=1,sy=1,pad=1;if(a.vt==='titan'){sx=1.3;sy=1.02;pad=1.7;}if(a.vt==='speedy'){sx=0.9;}
  const gl=a.glow,tr=V.trim,o={sc:a.sc*dead*(0.4+0.6*a.mat),sx,sy,pad,col:V.c4,dk:V.d4,trim:V.t4,fl:a.flash*0.6,ghost:a.ghost||a.vis<1,bob:a.vt==='bender'?0.7+Math.sin(t*2+a.ph)*0.12:0,lean:Math.min(Math.hypot(a.vel.x,a.vel.z)/40,1)*0.5,leg:sw,
    aR:aim?-1.4:up?-2.7:-sw,aL:up?-2.7:aim&&(a.vt==='gunner'||a.vt==='handler')?-1.1:sw,eR:aim?0:-0.25,eL:up?0:-0.25};
  if(o.sc<0.05)return;
  if(a.vt==='gunner')o.hand=(eb,Q)=>{Q(PFB,child(eb,0,-0.34,0.3,0,0,0,0.06,0.07,0.74),V.d4);Q(MESH.glowSphere,child(eb,0,-0.34,0.7,0,0,0,0.06,0.06,0.06),[tr[0],tr[1],tr[2],0.5+0.5*gl]);};
  else if(a.vt==='dasher')o.hand=(eb,Q)=>{Q(MESH.glowBox,child(eb,0,-0.34,0.55,0,0,0,0.03+0.04*gl,0.06,1.15),[tr[0],tr[1],tr[2],0.55+0.45*gl]);Q(PFB,child(eb,0,-0.34,0.05,0,0,0,0.07,0.08,0.22),V.d4);};
  else if(a.vt==='handler'){o.hand=(eb,Q)=>Q(MESH.glowSphere,child(eb,0,-0.4,0.05,0,0,0,0.07,0.07,0.07),[tr[0],tr[1],tr[2],1]);}
  else if(a.vt==='titan')o.hand=o.handL=(eb,Q)=>{Q(PFS,child(eb,0,-0.4,0,0,0,0,0.11,0.11,0.11),V.c4);};
  const root=humanoid(a,o);const g=!!o.ghost?0.3:1;
  if(a.vt==='handler'){queue(PFB,child(root,0,1.35,-0.19,0,0,0,0.3,0.38,0.12),V.d4,0,o.fl);queue(MESH.glowSphere,child(root,0.14,1.82,-0.15,0,0,0,0.07,0.07,0.07),[tr[0],tr[1],tr[2],1],0);queue(MESH.ring,child(root,0,1.5,0,0,t*2,0,0.36,1,0.36),[tr[0],tr[1],tr[2],0.35+0.5*gl],F_ADD);}
  else if(a.vt==='phase'){queue(MESH.glowSphere,child(root,0,0.9,0,0,0,0,0.7,1.1,0.55),[tr[0],tr[1],tr[2],a.ghost?0.12:0.04],F_ADD);for(let k=0;k<3;k++)queue(MESH.ring,child(root,0,0.2+k*0.55+Math.sin(t*3+k)*0.1,0,0,t*(1+k*0.5),0,0.4,1,0.4),[tr[0],tr[1],tr[2],0.35],F_ADD);}
  else if(a.vt==='bender'){queue(MESH.ring,child(root,0,1.25,0,0.4,t*1.4,0.2,0.6,1,0.6),[tr[0],tr[1],tr[2],0.55+0.4*gl],F_ADD);queue(MESH.ring,child(root,0,1.25,0,-0.5,-t*1.1,0,0.72,1,0.72),[tr[0],tr[1],tr[2],0.4],F_ADD);queue(MESH.glowSphere,child(root,0,1.25,0.6,0,0,0,0.12,0.12,0.12),[tr[0],tr[1],tr[2],0.5+0.5*gl],0);
    if(a.st==='pull'||a.st==='slam'){const k=1-a.bt/1.4;for(let i=0;i<3;i++){const r=14*(1-((t*0.9+i/3)%1));queue(MESH.ring,at(a.pos.x,a.pos.y+1.5,a.pos.z,0,0,0,r,1,r),[tr[0],tr[1],tr[2],0.45*(1-r/14)],F_ADD);}}
    if(a.st==='slam')queue(MESH.disc,at(a.pos.x,a.pos.y+0.12,a.pos.z,0,0,0,9,1,9),[1,.3,.3,0.2+0.25*Math.sin(t*22)],F_ADD);}
  else if(a.vt==='mirror'){const f=Math.sin(a.yaw),c=Math.cos(a.yaw);queue(MESH.glowBox,child(root,0,1.15,0.6,0,0,0,1.0,1.55,0.04),[.45,.8,1,0.22+0.4*a.sh],F_BL);queue(MESH.glowBox,child(root,0,1.15,0.62,0,0,0,1.0,1.55,0.02),[.4,.8,1,0.1+0.3*a.sh],F_ADD);for(const s of [-1,1])queue(PFB,child(root,s*0.62,1.15,0.6,0,0,0,0.05,1.85,0.07),V.d4,0,o.fl);
    const sh=((t*0.8)%1);queue(MESH.glowBox,child(root,-0.55+sh*1.1,1.15+Math.sin(sh*6)*0.5,0.64,0,0,0.5,0.05,0.8,0.01),[1,1,1,0.6*(1-Math.abs(sh-0.5)*2)],F_ADD);}
  else if(a.vt==='speedy'){queue(MESH.glowSphere,child(root,0,1.1,0,0,0,0,0.5,1,0.5),[tr[0],tr[1],tr[2],0.03+0.08*gl],F_ADD);}
  else if(a.vt==='titan'){queue(MESH.glowSphere,child(root,0,1.42,0.13,0,0,0,0.045,0.045,0.03),[tr[0],tr[1],tr[2],0.9],0);queue(MESH.glowSphere,child(root,0,1.2,0,0,0,0,0.9,1.4,0.7),[tr[0],tr[1],tr[2],0.02+0.07*gl],F_ADD);
    if(a.st==='stomp')queue(MESH.disc,at(a.pos.x,a.pos.y+0.12,a.pos.z,0,0,0,12,1,12),[1,.4,.2,0.18+0.2*Math.sin(t*24)],F_ADD);}
  else if(a.vt==='dasher'&&a.st==='aim'){const px=a.pos.x+a.cx*22,pz=a.pos.z+a.cz*22;queue(MESH.glowBox,M4.beam(tmpM(),a.pos.x,a.pos.y+0.15,a.pos.z,px,a.pos.y+0.15,pz,0.5),[tr[0],tr[1],tr[2],0.18+0.14*Math.sin(t*30)],F_ADD);}
  if(a.glow>0.05)queue(MESH.glowSphere,at(a.pos.x,a.pos.y+a.cy,a.pos.z,0,0,0,1.1*a.sc,1.7*a.sc,1.1*a.sc),[tr[0],tr[1],tr[2],0.06*a.glow],F_ADD);
}
function cbDroneDraw(a,V,t){
  const tr=V.trim,sc=a.alive?1:Math.max(0,1-a.deadT/0.7),root=at(a.pos.x,a.pos.y+Math.sin(t*3+a.ph)*0.12,a.pos.z,Math.sin(t*2+a.ph)*0.1,a.yaw,Math.cos(t*2.2+a.ph)*0.1,sc,sc,sc);
  queue(PFS,child(root,0,0,0,0,0,0,0.55,0.32,0.55),V.c4,0,a.flash*0.6);queue(PFS,child(root,0,-0.15,0,0,0,0,0.42,0.16,0.42),V.d4,0);queue(MESH.ring,child(root,0,0.02,0,0,t*3,0,0.7,1,0.7),[tr[0],tr[1],tr[2],0.8],F_ADD);
  queue(MESH.glowSphere,child(root,0,0.02,0.5,0,0,0,0.16,0.16,0.16),[tr[0],tr[1],tr[2],1],0);for(const s of [-1,1])queue(MESH.glowSphere,child(root,s*0.65,0.05,0,0,0,0,0.09,0.09,0.09),Math.sin(t*7+s*2+a.ph)>0?[1,1,1,1]:[.3,.6,1,1],0);
}
// ================================================================
// The floors: waves, clearing, the lift, dying, entering and leaving
// ================================================================
function spFloorBegin(f){
  SP.floor=f;SP.wave=0;SP.nw=1;SP.pend.length=0;SP.live=false;SP.open=false;SP.spawnT=0;SP.cleared[f-1]=false;SP.bossT=-1;
  if(f===3&&SP.elite){SP.bossT=2.2;SP.breath=0;}else SP.breath=2.4;
  objectiveMark(null);spObj(true);
}
function spWaveStart(n){
  SP.wave=n;SP.nw=n+1;SP.live=true;const f=SP.floor;let a=[];
  if(f===3){a=['titan','speedy'];toast('THE ELITE GUARD','Two augmented champions','red');}
  else{const W=SPWAVES[f-1][n-1];for(const k in W)for(let i=0;i<W[k];i++)a.push(k);toast('WAVE '+n+' / 3',a.length+' enemies','red');}
  for(let i=a.length-1;i>0;i--){const j=(Math.random()*(i+1))|0,t=a[i];a[i]=a[j];a[j]=t;}
  SP.pend=a;SP.spawnT=0.4;SP.breath=0;SFX.tone('sawtooth',90,60,0.8,0.1);addShake(0.15);
}
function spWaveTick(dt){
  if(SP.bossT>=0){SP.bossT-=dt;if(SP.bossT<0&&!SOV.a)sovIntro();return;}
  if(SP.breath>0){SP.breath-=dt;if(SP.breath<=0)spWaveStart(SP.nw);return;}
  if(SP.wave<1||SP.open)return;
  if(SOV.a)return;
  const alive=spAlive(),last=SP.floor===3?1:3;
  if(SP.pend.length&&alive<SPCAP){SP.spawnT-=dt;if(SP.spawnT<=0){SP.spawnT=rr(0.3,0.6);spSpawn(SP.pend.pop());}}
  if(!SP.pend.length&&alive===0){
    if(SP.wave>=last){if(SP.floor<3)spFloorClear();else{SP.live=false;SP.elite=1;SP.bossT=3;toast('The champions have fallen','Something is coming...','gold');SFX.chime();}}
    else{SP.live=false;toast('Wave cleared','Wave '+SP.nw+' in 3 s','gold');SFX.chime();SP.breath=3;}
  }
}
function spFloorClear(){
  const S=save.story,f=SP.floor;SP.cleared[f-1]=true;SP.open=true;S.tf=Math.max(S.tf,f);persist();
  toast('Floor '+f+' cleared','Take the lift','cyan');SFX.chime();SFX.levelUp();flashWhite=Math.max(flashWhite,0.25);
  const L=SPLIFT[f-1];objectiveMark(SPO.x+L.x,SPFY[f-1]+4,SPO.z+L.z,'Lift');spObj(true);
}
function spObj(force){
  if(CUT||ASK)return;const f=SP.floor;let t;
  if(SP.open)t='Floor '+f+' cleared · take the lift';
  else if(SOV.a&&SOV.fight)t='Floor 3/3 · defeat the Sovereign';
  else if(SOV.a||SP.bossT>=0)t='Floor 3/3 · the Sovereign awaits';
  else if(SP.breath>0&&SP.wave>=1)t='Floor '+f+'/3 · next wave in '+Math.ceil(SP.breath);
  else if(SP.breath>0)t='Floor '+f+'/3 · get ready';
  else t='Floor '+f+'/3 · '+(SP.pend.length+spAlive())+' left';
  if(force||OBJ.text!==t)objective(t);
}
function spLiftTick(dt){
  if(!SP.open||SP.ride||P.dead||cutLocked()||SP.floor>=3)return;
  const L=SPLIFT[SP.floor-1],dx=P.pos.x-(SPO.x+L.x),dz=P.pos.z-(SPO.z+L.z);
  if(dx*dx+dz*dz<16&&P.pos.y-spY()<5)spRide();
}
function spRide(){
  if(SP.ride)return;SP.ride=true;const f=SP.floor,L=SPLIFT[f-1],y0=SPFY[f-1],x=SPO.x+L.x,z=SPO.z+L.z;SFX.tone('sine',200,1200,2.2,0.1);objectiveMark(null);
  cutscene({dur:2.4,letterbox:false,skippable:false,fov:64,from:k=>({x:x+3.4,y:y0+3+k*k*(3-2*k)*28,z:z-3.4}),to:k=>({x:x+3.4,y:y0+3+k*k*(3-2*k)*28,z:z-3.4}),look:()=>({x,y:P.pos.y+1.5,z}),
    onTick:(k,dt)=>{const e=k*k*(3-2*k);P.pos.set(x,y0+e*28,z);P.vel.set(0,0,0);for(let i=0;i<3;i++)emit(x+rr(-2,2),P.pos.y+rr(-2,4),z+rr(-2,2),0,rr(8,20),0,0.5,[.6,.9,1],rr(.5,1),0,0);},
    onEnd:()=>{SP.ride=false;const n=f+1,s=spStartAt(n);P.pos.set(SPO.x+s.x,SPO.y+s.y,SPO.z+s.z);P.vel.set(0,0,0);P.yaw=s.yaw;P.pitch=-0.1;P.grounded=true;flashWhite=Math.max(flashWhite,0.4);spFloorBegin(n);toast('Floor '+n,n===2?'The Augment Labs':'The Throne Hall','cyan');}});
}
function spClear(){
  for(const a of SP.list.slice())removeActor(a);SP.list.length=0;SP.pend.length=0;SP.fx.length=0;sovClear();lockT=null;projs.length=0;
}
function spRespawn(){
  if(!inSpire())return false;
  const S=save.story,f=Math.min(3,S.tf+1),s=spStartAt(f);spClear();SP.ride=false;
  P.dead=false;P.pos.set(SPO.x+s.x,SPO.y+s.y,SPO.z+s.z);P.vel.set(0,0,0);P.yaw=s.yaw;P.pitch=-0.1;P.flying=false;P.grounded=true;P.hp=maxHp();P.en=maxEn();P.stun=0;P.lastHit=-99;P.web=null;P.wall=null;camDist=8;
  $('dead').hidden=true;flashWhite=Math.max(flashWhite,0.4);spFloorBegin(f);toast('Back on your feet','Floor '+f+' starts again · cleared floors stay cleared','cyan');Portal.midgame();return true;
}
function spEnter(Z){
  const f=spFloorAt();SP.ride=false;spClear();SP.elite=0;zoneRet={x:SPAWNS[0][0],y:0,z:SPAWNS[0][1],yaw:SPAWNS[0][2],fly:false};
  for(const b of Z.walls)b.dead=false;Z.dirty=false;spRebuild(Z);cyEnv();SP.cleared=[save.story.tf>=1,save.story.tf>=2,false];spFloorBegin(f);
}
function spLeave(Z){spClear();SP.open=false;objective(null);objectiveMark(null);const e=$('sovsay'),w=$('tswarn');if(e)e.classList.remove('on');if(w)w.classList.remove('on');}
function spJump(n){ // test hook: straight to a floor (earlier floors count as cleared)
  const S=save.story,s=spStartAt(n);S.tf=Math.max(S.tf,n-1);spClear();SP.ride=false;SP.elite=0;P.dead=false;P.pos.set(SPO.x+s.x,SPO.y+s.y,SPO.z+s.z);P.vel.set(0,0,0);P.yaw=s.yaw;P.hp=maxHp();spFloorBegin(n);
}
function spMarks(plot,c){
  for(const a of SP.list){if(!a.alive)continue;const p=plot(a.pos.x,a.pos.z,false);if(!p)continue;c.fillStyle=a.vt==='sov'?'#ffd75a':a.fly?'#7fd6ff':'#ff4d5e';c.beginPath();c.arc(p[0],p[1],a.vt==='sov'?8:a.elite?7:4.5,0,TAU);c.fill();}
  if(SP.open&&SP.floor<3){const L=SPLIFT[SP.floor-1],p=plot(SPO.x+L.x,SPO.z+L.z,true);if(p){c.fillStyle='#7fe8ff';c.fillRect(p[0]-6,p[1]-6,12,12);}}
}
// ================================================================
// The tick
// ================================================================
function spireTick(dt){
  travelTick(dt);
  if(!inSpire()||ZF.phase)return;
  if(SPR.ending)return;
  const dtw=dt*worldTimeK();
  if(state==='play'&&!P.dead){
    if(!CUT&&!ASK){spWaveTick(dtw);if(!SOV.a)spLiftTick(dt);}
    SP.objT-=dt;if(SP.objT<=0){SP.objT=0.4;spObj(false);}
  }
  for(const a of SP.list.slice()){if(a.vt==='sov')continue;cbUpdate(a,dtw);}
  for(let i=SP.fx.length-1;i>=0;i--){SP.fx[i].t+=dt;if(SP.fx[i].t>SP.fx[i].dur)SP.fx.splice(i,1);}
  sovTick(dt);
  if(!P.dead&&P.pos.y<SPFY[0]-8){const s=spStartAt(spFloorAt());P.pos.set(SPO.x+s.x,s.y,SPO.z+s.z);P.vel.set(0,0,0);} // never fall out of the world
}
// ================================================================
// The Sovereign
// ================================================================
const SOV={a:null,on:false,fight:false,ph:1,rage:0,hulk:0,sayT:0,tauntT:6,qi:[],tsCd:15,ts:null,at:null,cd:2,last:'',seq:[],fists:[],webs:[],bolts:[],ices:[],holes:[],waves:[],blades:[],hammer:null,laser:null,icet:null,trans:false,blinkT:-9,dodgeT:-9,dir:1,ang:0,said20:false,slowOn:false,won:false,tg:0,halo:0};
const SOV_LINES=["Is that all your world could send?","I've stopped time for slower things than you.","Try again. I'll wait. I literally can.","Careful. You might scuff the floor.","Your whole sky fell, and you came anyway. Adorable.","Do you hear that? That's the sound of nothing happening.","I was crowned before your sun was lit.","Please, hit me properly. I'm only a little bored.","Every hero I've met had a power. I kept them all.","Slow down. You'll miss how this ends.","I could end this in a heartbeat. Where is the fun in that?","Your best is a warm-up."];
const SOVBY=SPFY[2];
const sovHp=()=>6000+900*save.level;
const sovD=f=>kDmg(f)*(SOV.ph===2?1:0.55);
const sovHurt=(f,type,knock)=>{if(!P.dead&&SOV.a)Damage.apply(SOV.a,P,sovD(f),type,{knock});};
function sovSay(txt,red){const e=$('sovsay');if(!e)return;e.querySelector('b').textContent=txt;e.classList.toggle('red',!!red);e.classList.add('on');SOV.sayT=clamp(txt.length*0.08,2.4,5);}
function sovClear(){
  if(SOV.a){removeActor(SOV.a);removeFrom(SP.list,SOV.a);}
  if(SOV.slowOn){P.slow=0;SOV.slowOn=false;}
  if(SOV.ts&&frozenT>0){frozenT=0;tsBy=null;}
  Object.assign(SOV,{a:null,on:false,fight:false,ph:1,rage:0,hulk:0,sayT:0,tauntT:6,qi:[],tsCd:15,ts:null,at:null,cd:2,last:'',seq:[],fists:[],webs:[],bolts:[],ices:[],holes:[],waves:[],blades:[],hammer:null,laser:null,icet:null,trans:false,said20:false,won:false,halo:0});
  const e=$('sovsay'),w=$('tswarn');if(e)e.classList.remove('on');if(w)w.classList.remove('on');
}
function sovMake(){
  const hp=sovHp(),o=SPO,a={kind:'cyborg',faction:'cyber',zid:'spire',vt:'sov',name:'The Sovereign',alive:true,hp,maxHp:hp,pos:new V3(o.x,SOVBY+16,o.z+34),vel:new V3(),yaw:Math.PI,flash:0,stun:0,slow:0,slowT:0,burn:0,burnDps:0,held:false,thrown:null,sc:1,cy:1.9,radius:1.35,ys:0.85,
    bigBoss:true,lastHit:-99,deadT:0,vis:1,glow:0,castT:-9,armUp:0,iframe:0,cd:2,mat:1,phase:0,elite:1};
  a.onHit=(src,amt,type)=>sovHit(a,amt,type);a.onDefeat=()=>sovDefeated(a);
  actors.push(a);SP.list.push(a);Object.assign(SOV,{a,on:true,fight:false,ph:1,rage:0,tsCd:rr(12,16),tauntT:7,cd:2.4,ang:rr(0,TAU),dir:Math.random()<.5?1:-1});return a;
}
function sovIntro(quick){
  const a=sovMake(),y0=SOVBY;spObj(true);
  if(quick){a.pos.set(SPO.x,y0+2.6,SPO.z+26);SOV.fight=true;return;}
  cutscene({dur:4.6,letterbox:true,skippable:false,fov:60,text:'THE SOVEREIGN',from:{x:SPO.x-4,y:y0+4.5,z:SPO.z+12},to:{x:SPO.x+3,y:y0+5,z:SPO.z+17},look:()=>({x:a.pos.x,y:a.pos.y+1.6,z:a.pos.z}),
    onTick:(k,dt)=>{const e=Math.min(1,k/0.72),s=1-Math.pow(1-e,3);a.pos.set(SPO.x,lerp(y0+16,y0+2.8,s),SPO.z+34-s*8);a.yaw=Math.PI;SOV.halo+=dt;if(k>0.7&&k<0.74){SFX.boom(0.6,0.7);flashWhite=Math.max(flashWhite,0.25);ringFx(a.pos.x,y0+0.2,a.pos.z,1,22,0.6,[1,.9,.55]);}},
    onEnd:()=>{if(!SOV.a)return;SOV.fight=true;spObj(true);sovSay('Finally. A visitor.');}});
}
function sovHit(a,amt,type){
  if(!a.alive)return;
  if(SOV.trans||a.iframe>0||!SOV.fight){a.hp=Math.min(a.maxHp,a.hp+amt);a.flash=0;return;}
  if(SOV.ph===1){
    if(a.hp<a.maxHp*0.5)a.hp=a.maxHp*0.5; // it never drops below the halfway mark before the change
    if(time-SOV.dodgeT>1.2&&Math.random()<0.28&&!SOV.ts&&a.hp-0>a.maxHp*0.52){SOV.dodgeT=time;a.hp=Math.min(a.maxHp,a.hp+amt);a.flash=0;sovBlink();if(Math.random()<0.4)sovSay(pick(['Too slow.','Missed me.','Is that a hit? Adorable.']));}
  }
}
function sovBlink(){
  const a=SOV.a;if(!a)return;SOV.blinkT=time;a.iframe=0.2;const c=center(a);ringFx(c.x,c.y,c.z,0.6,6,0.3,[1,.9,.6]);burst(c.x,c.y,c.z,14,9,0.4,[[1,.9,.6],[1,1,1]],1,0,2);
  const an=rr(0,TAU),r=rr(9,14);a.pos.set(P.pos.x+Math.cos(an)*r,Math.max(SOVBY+1.6,P.pos.y+rr(-.5,2.5)),P.pos.z+Math.sin(an)*r);sovClamp(a);const c2=center(a);ringFx(c2.x,c2.y,c2.z,0.6,6,0.3,[1,.9,.6]);burst(c2.x,c2.y,c2.z,14,9,0.4,[[1,.9,.6],[1,1,1]],1,0,2);SFX.tone('sine',1300,300,0.2,0.07);
}
function sovClamp(a){a.pos.x=clamp(a.pos.x,SPO.x-52,SPO.x+52);a.pos.z=clamp(a.pos.z,SPO.z-52,SPO.z+52);a.pos.y=clamp(a.pos.y,SOVBY+(a.sc>1.5?0.05:1.2),SOVBY+17);}
function sovGo(a,tx,ty,tz,sp,dt){const dx=tx-a.pos.x,dy=ty-a.pos.y,dz=tz-a.pos.z,d=Math.hypot(dx,dy,dz);if(d>0.02){const s=Math.min(d*3,sp)*dt/d;a.pos.x+=dx*s;a.pos.y+=dy*s;a.pos.z+=dz*s;}sovClamp(a);}
const sovFace=(a,dt,k)=>{a.yaw=angLerp(a.yaw,Math.atan2(P.pos.x-a.pos.x,P.pos.z-a.pos.z),damp(k||10,dt));};
function sovHand(a){const s=Math.sin(a.yaw),c=Math.cos(a.yaw),k=a.sc;return {x:a.pos.x+(c*0.4+s*0.4)*k,y:a.pos.y+(1.5+a.armUp*0.7)*k*1.38,z:a.pos.z+(-s*0.4+c*0.4)*k};}
function sovEnd(a){
  SOV.at=null;SOV.laser=null;SOV.icet=null;a.sc=1;a.radius=1.35;a.cy=1.9;SOV.hulk=0;a.cd=SOV.ph===2?rr(1.1,1.9):rr(2.4,3.6);
  if(SOV.ph===1&&Math.random()<0.4)sovBlink();
  if(SOV.ph===2&&Math.random()<0.35)a.cd=0.25; // it chains powers together
}
function sovPick(){
  const p2=SOV.ph===2;
  if(!SOV.seq.length){const pool=p2?['fist','web','hammer','dash','laser','ice','giant','hole','morph']:['fist','web','hammer','dash','laser','ice'];SOV.seq=pool.slice();
    for(let i=SOV.seq.length-1;i>0;i--){const j=(Math.random()*(i+1))|0,t=SOV.seq[i];SOV.seq[i]=SOV.seq[j];SOV.seq[j]=t;}
    if(SOV.seq[SOV.seq.length-1]===SOV.last)SOV.seq.unshift(SOV.seq.pop());}
  return SOV.seq.pop();
}
function sovTick(dt){
  const a=SOV.a;if(!a)return;
  SOV.halo+=dt;a.flash=Math.max(0,a.flash-dt*5);a.iframe=Math.max(0,a.iframe-dt);a.glow=Math.max(0,a.glow-dt*2);a.armUp=Math.max(0,a.armUp-dt*2.5);
  SOV.rage+=((SOV.ph===2?1:0)-SOV.rage)*Math.min(1,dt*2);
  if(SOV.sayT>0){SOV.sayT-=dt;if(SOV.sayT<=0){const e=$('sovsay');if(e)e.classList.remove('on');}}
  if(!a.alive)return;
  const dtw=dt*prBossK('sov'); // Prism's Time Stop holds the Sovereign for 6 s, then he breaks out
  sovFxTick(dtw);
  if(!SOV.fight||SOV.won||P.dead||state!=='play')return;
  if(SOV.ts){sovTsTick(dt);return;}
  if(SOV.trans)return;
  if(SOV.ph===1&&a.hp<=a.maxHp*0.5+1){sovTransition();return;}
  if(SOV.ph===2&&!SOV.said20&&a.hp<=a.maxHp*0.2){SOV.said20=true;sovSay('Impossible...',true);}
  if(CUT&&!CUT.control)return;
  if(dtw<=0)return;
  if(SOV.ph===1){SOV.tauntT-=dtw;if(SOV.tauntT<=0&&!SOV.at){SOV.tauntT=rr(5.5,8.5);if(!SOV.qi.length){SOV.qi=SOV_LINES.map((l,i)=>i);for(let i=SOV.qi.length-1;i>0;i--){const j=(Math.random()*(i+1))|0,t=SOV.qi[i];SOV.qi[i]=SOV.qi[j];SOV.qi[j]=t;}}sovSay(SOV_LINES[SOV.qi.pop()]);}}
  SOV.tsCd-=dtw;if(SOV.tsCd<=0&&!SOV.at&&!CUT&&sovTsStart())return;
  if(SOV.at){sovAtk(a,dtw);return;}
  // idle: hover round the player, face them
  const p2=SOV.ph===2,R=p2?8.5:11,an=SOV.ang+=dtw*(p2?0.55:0.35)*SOV.dir;
  sovGo(a,P.pos.x+Math.cos(an)*R,Math.max(SOVBY+1.8,P.pos.y+0.6)+Math.sin(time*1.4)*0.35,P.pos.z+Math.sin(an)*R,p2?20:14,dtw);sovFace(a,dtw,9);
  if(!p2&&time-SOV.blinkT>3&&Math.hypot(P.pos.x-a.pos.x,P.pos.z-a.pos.z)<4.6){sovBlink();return;}
  a.cd-=dtw;if(a.cd<=0){const k=sovPick();SOV.at={k,t:0,ph:0};SOV.last=k;}
}
function sovTransition(){
  const a=SOV.a;SOV.trans=true;SOV.at=null;SOV.laser=null;SOV.icet=null;a.sc=1;a.radius=1.35;a.cy=1.9;SOV.hulk=0;for(const f of SOV.fists)f.st='rest';SOV.ices.length=0;SOV.holes.length=0;SOV.bolts.length=0;SOV.hammer=null;SOV.webs.length=0;SOV.waves.length=0;
  sovSay('Enough.',true);const y=SOVBY;
  cutscene({dur:3.6,control:true,letterbox:true,text:'Enough.',onTick:(k,dt)=>{a.pos.y+=(Math.max(SOVBY+4,P.pos.y+2)-a.pos.y)*Math.min(1,dt*2);sovFace(a,dt,8);a.glow=1;a.armUp=1;if(k>0.4&&k<0.45){flashWhite=Math.max(flashWhite,0.6);SFX.boom(0.9,0.4);addShake(0.6);ringFx(a.pos.x,a.pos.y+1.5,a.pos.z,1,30,0.7,[1,.3,.25]);ringFx(a.pos.x,a.pos.y+1.5,a.pos.z,1,18,0.5,[1,1,1]);burst(a.pos.x,a.pos.y+1.5,a.pos.z,60,30,0.9,[[1,.3,.25],[1,.8,.5]],1.6,0,1.5);}},
    onEnd:()=>{SOV.trans=false;SOV.ph=2;SOV.seq=[];SOV.cd=0.6;a.cd=0.6;SOV.tsCd=6;SOV.at={k:'giant',t:0,ph:0};SOV.last='giant';}});
}
// ---- time stop ----
function sovTsStart(){
  const a=SOV.a;if(timeStopT>0||frozenT>0||PR.ts||PR.on||CUT||ASK||!a)return false;
  SOV.ts={ph:'warn',t:0,tk:0,k:0,alt:false};const w=$('tswarn');if(w)w.classList.add('on');SFX.tone('sine',110,70,1.0,0.12);return true;
}
function sovTsTick(dt){
  const T=SOV.ts,a=SOV.a,p2=SOV.ph===2;T.t+=dt;sovFace(a,dt,10);a.armUp=1;
  if(T.ph==='warn'){a.glow=1;T.tk-=dt;if(T.tk<=0){T.tk=0.25;T.alt=!T.alt;SFX.tone('square',T.alt?1500:1050,T.alt?1400:1000,0.05,0.07);}
    if(T.t>=1){T.ph='freeze';T.t=0;const w=$('tswarn');if(w)w.classList.remove('on');startTimeStop(a,2.5);sovTp(a,7);}}
  else if(T.ph==='freeze'){
    if(T.t>=0.4&&T.k<1){T.k=1;sovTp(a,5.5);}
    if(T.t>=1.0&&T.k<2){T.k=2;const n=p2?12:8;for(let i=0;i<n;i++){const an=i/n*TAU+rr(-.2,.2),r=rr(3.2,4.4),y=P.pos.y+1.3+rr(-1.2,1.6);SOV.blades.push({x:P.pos.x+Math.cos(an)*r,y,z:P.pos.z+Math.sin(an)*r,go:false,age:0,vx:0,vy:0,vz:0});}SFX.tone('sine',2400,2400,0.6,0.05);sovTp(a,4.2);}
    if(T.t>=1.8&&T.k<3){T.k=3;sovTp(a,5.8);}
    if(T.t>=2.5||frozenT<=0){T.ph='release';T.t=0;for(const b of SOV.blades){const v=dirTo(b,P.pos.x,P.pos.y+1.3,P.pos.z);b.go=true;b.vx=v[0]*62;b.vy=v[1]*62;b.vz=v[2]*62;}SFX.boom(0.7,0.9);flashWhite=Math.max(flashWhite,0.35);a.glow=1;}}
  else if(T.t>=0.7){SOV.ts=null;SOV.tsCd=p2?rr(12,16):rr(15,20);a.cd=1.0;}
}
function sovTp(a,r){ // reposition during the stop
  const c=center(a);burst(c.x,c.y,c.z,10,8,0.3,[[1,.9,.6]],1,0,2);const an=rr(0,TAU);a.pos.set(P.pos.x+Math.cos(an)*r,Math.max(SOVBY+1.8,P.pos.y+rr(0,1.8)),P.pos.z+Math.sin(an)*r);sovClamp(a);a.yaw=Math.atan2(P.pos.x-a.pos.x,P.pos.z-a.pos.z);
  const c2=center(a);burst(c2.x,c2.y,c2.z,10,8,0.3,[[1,.9,.6]],1,0,2);ringFx(c2.x,c2.y,c2.z,0.5,4,0.3,[1,.9,.6]);
}
// ---- the powers ----
function sovAtk(a,dt){
  const A=SOV.at,p2=SOV.ph===2,BY=SOVBY;A.t+=dt;const pcx=P.pos.x,pcy=P.pos.y+1.3,pcz=P.pos.z;
  switch(A.k){
  case 'fist':{ // hard light: a giant green fist drops where you stand
    if(A.ph===0){
      if(!A.f){A.f=[];const n=p2?3:1;for(let i=0;i<n;i++){const ox=i?rr(-8,8):0,oz=i?rr(-8,8):0;A.f.push({x:pcx+ox,z:pcz+oz,y:BY+17,st:'tg',t:0,ox,oz});}SOV.fists.push(...A.f);SFX.tone('sine',200,700,0.9,0.08);}
      sovFace(a,dt,10);a.armUp=Math.min(1,a.armUp+dt*4);const dur=p2?0.8:1.2;
      if(A.t<dur*0.7)for(const f of A.f){f.x=pcx+f.ox;f.z=pcz+f.oz;}
      if(A.t>=dur){A.ph=1;A.t=0;}
    }else if(A.ph===1){
      const k=Math.min(1,A.t/0.2);for(const f of A.f){f.st='sl';f.y=lerp(BY+17,BY+1.4,k*k);}
      if(k>=1){for(const f of A.f){f.st='rest';f.t=0;if(Math.hypot(pcx-f.x,pcz-f.z)<5.4&&P.pos.y<BY+8)sovHurt(0.12,'ring',24);ringFx(f.x,BY+0.3,f.z,1,10,0.4,[.4,1,.5]);burst(f.x,BY+1,f.z,26,14,0.5,[[.4,1,.5],[.8,1,.85]],1.4,-2,2);}SFX.boom(0.7,0.6);addShake(0.35);A.ph=2;A.t=0;}
    }else if(A.t>=0.7)sovEnd(a);
    break;}
  case 'web':{ // webbing: a strand yanks you in, then a web bomb pins you to the floor
    const dd=Math.hypot(pcx-a.pos.x,pcz-a.pos.z);
    if(A.ph===0){sovFace(a,dt,12);a.armUp=Math.min(1,a.armUp+dt*5);A.yank=dd>8.5;const h=sovHand(a);tracer(h.x,h.y,h.z,pcx,pcy,pcz,[.95,.95,1],0.03+0.04*A.t,0.06);if(A.t>=(p2?0.5:0.8)){A.ph=1;A.t=0;SFX.tone('triangle',1400,500,0.14,0.1);}}
    else if(A.ph===1){
      if(A.yank){const h=sovHand(a),tx=a.pos.x+Math.sin(a.yaw)*2.8,tz=a.pos.z+Math.cos(a.yaw)*2.8,dx=tx-P.pos.x,dy=a.pos.y-P.pos.y,dz=tz-P.pos.z,l=Math.hypot(dx,dy,dz)||1;
        tracer(h.x,h.y,h.z,pcx,pcy,pcz,[.95,.95,1],0.07,0.05);if(l>3.4){P.vel.set(dx/l*52,dy/l*52*0.8+3,dz/l*52);P.grounded=false;P.web=null;}
        if(l<=3.6||A.t>0.75){A.ph=2;A.t=0;P.vel.mul(0.3);if(l<=6){sovHurt(0.06,'punch',18);burst(pcx,pcy,pcz,10,8,0.3,[[.95,.95,1]],1,0,2);}}}
      else{A.ph=2;A.t=0;}
    }else if(A.ph===2){
      if(!A.b){A.b=true;const h=sovHand(a),tx=pcx+P.vel.x*0.4,tz=pcz+P.vel.z*0.4,life=0.85;SOV.webs.push({x:h.x,y:h.y,z:h.z,vx:(tx-h.x)/life,vy:(BY+0.8-h.y)/life+4.9*life,vz:(tz-h.z)/life,t:0,life,st:'fly',tx,tz});sovFace(a,dt,12);a.armUp=1;SFX.tone('triangle',700,300,0.2,0.08);}
      if(A.t>=(p2?0.9:1.3))sovEnd(a);}
    break;}
  case 'hammer':{ // a storm hammer, then lightning on the spot
    if(A.ph===0){sovFace(a,dt,12);a.armUp=Math.min(1,a.armUp+dt*5);a.glow=1;const h=sovHand(a);if(Math.random()<0.7)tracer(h.x,h.y,h.z,h.x+rr(-2,2),h.y+rr(-1,2),h.z+rr(-2,2),[.7,.85,1],0.06,0.1);
      if(A.t>=(p2?0.55:0.85)){const h2=sovHand(a),v=dirTo(h2,pcx+P.vel.x*0.25,pcy,pcz+P.vel.z*0.25);SOV.hammer={x:h2.x,y:h2.y,z:h2.z,vx:v[0]*50,vy:v[1]*50,vz:v[2]*50,t:0,ret:false,hit:false,sp:0};
        const n=p2?5:3;for(let i=0;i<n;i++)SOV.bolts.push({x:pcx+(i?rr(-7,7):0),z:pcz+(i?rr(-7,7):0),t:-(0.1+i*0.22),dur:0.75,done:false,tr:i===0});SFX.tone('sawtooth',300,900,0.3,0.1);A.ph=1;A.t=0;}}
    else if(A.t>=(p2?1.7:2.0))sovEnd(a);
    break;}
  case 'dash':{ // a speed-blur barrage
    const n=p2?6:4;
    if(A.ph===0){
      if(!A.dest){const an=rr(0,TAU),r=rr(3.2,5);A.dest={x:pcx+Math.cos(an)*r,y:Math.max(BY+1.4,P.pos.y+rr(0,1)),z:pcz+Math.sin(an)*r};A.sx=a.pos.x;A.sy=a.pos.y;A.sz=a.pos.z;A.i=A.i||0;}
      a.glow=1;sovFace(a,dt,14);tracer(a.pos.x,a.pos.y+1.5,a.pos.z,A.dest.x,A.dest.y+1.5,A.dest.z,[1,.85,.4],0.04,0.05);
      if(A.t>=(p2?0.26:0.42)){A.ph=1;A.t=0;}
    }else if(A.ph===1){
      const k=Math.min(1,A.t/0.1),px=a.pos.x,py=a.pos.y,pz=a.pos.z;a.pos.set(lerp(A.sx,A.dest.x,k),lerp(A.sy,A.dest.y,k),lerp(A.sz,A.dest.z,k));sovClamp(a);streak(px,py+1.5,pz,a.pos.x,a.pos.y+1.5,a.pos.z);
      if(k>=1){a.yaw=Math.atan2(pcx-a.pos.x,pcz-a.pos.z);if(Math.hypot(a.pos.x-pcx,a.pos.z-pcz)<4.4&&Math.abs(a.pos.y-P.pos.y)<4)sovHurt(0.04,'slash',10);burst(a.pos.x,a.pos.y+1.5,a.pos.z,12,10,0.3,[[1,.85,.4],[1,1,1]],1,0,2);SFX.punch(0.8);A.i++;A.dest=null;A.ph=A.i>=n?2:3;A.t=0;}
    }else if(A.ph===3){if(A.t>=(p2?0.12:0.28)){A.ph=0;A.t=0;}}
    else if(A.t>=0.5)sovEnd(a);
    break;}
  case 'laser':{ // laser vision sweeping across you
    const E={x:a.pos.x,y:a.pos.y+2.55*a.sc,z:a.pos.z},base=Math.atan2(pcx-a.pos.x,pcz-a.pos.z);
    if(A.ph===0){
      if(A.a0===undefined){const sd=Math.random()<0.5?-1:1;A.a0=base+sd*0.95;A.a1=base-sd*0.95;A.R=Math.max(16,Math.hypot(pcx-a.pos.x,pcz-a.pos.z)+8);A.hitT=0;SFX.tone('sine',300,1200,0.9,0.07);}
      a.glow=1;a.yaw=angLerp(a.yaw,A.a0,damp(14,dt));SOV.laser={sx:E.x,sy:E.y,sz:E.z,ex:E.x+Math.sin(A.a0)*A.R,ey:BY+0.4,ez:E.z+Math.cos(A.a0)*A.R,pre:true};
      if(A.t>=(p2?0.7:1.05)){A.ph=1;A.t=0;SFX.tone('sawtooth',300,1500,0.3,0.1);}
    }else if(A.ph===1){
      const dur=p2?1.1:1.5,k=Math.min(1,A.t/dur),ang=lerp(A.a0,A.a1,k);a.yaw=ang;A.hitT-=dt;
      const L={sx:E.x,sy:E.y,sz:E.z,ex:E.x+Math.sin(ang)*A.R,ey:BY+0.4,ez:E.z+Math.cos(ang)*A.R,pre:false};SOV.laser=L;
      const dx=L.ex-L.sx,dy=L.ey-L.sy,dz=L.ez-L.sz,l2=dx*dx+dy*dy+dz*dz,q=clamp(((pcx-L.sx)*dx+(pcy-L.sy)*dy+(pcz-L.sz)*dz)/l2,0,1),dd=Math.hypot(L.sx+dx*q-pcx,L.sy+dy*q-pcy,L.sz+dz*q-pcz);
      if(dd<1.8&&A.hitT<=0){A.hitT=0.3;sovHurt(0.065,'beam',10);}
      if(Math.random()<0.6)burst(L.ex,BY+0.5,L.ez,3,8,0.3,[[1,.4,.3],[1,1,1]],0.9,-2,2);
      if(k>=1){SOV.laser=null;A.ph=2;A.t=0;}
    }else if(A.t>=0.5)sovEnd(a);
    break;}
  case 'ice':{ // an ice cloud that slows and chills
    if(A.ph===0){if(!A.c){A.c={x:pcx,z:pcz};SOV.icet=A.c;SFX.tone('sine',900,300,0.9,0.07);}sovFace(a,dt,10);a.armUp=1;if(A.t<0.55){A.c.x=pcx;A.c.z=pcz;}
      if(A.t>=(p2?0.8:1.1)){SOV.ices.push({x:A.c.x,z:A.c.z,t:0,life:p2?6:5,r:p2?9.5:8.5,tk:0});burst(A.c.x,BY+1,A.c.z,30,10,0.7,[[.7,.92,1],[1,1,1]],1.8,-1,2);SFX.tone('sine',1200,200,0.6,0.1);SOV.icet=null;A.ph=1;A.t=0;}}
    else if(A.t>=0.6)sovEnd(a);
    break;}
  case 'giant':{ // grows huge and slams down
    if(A.ph===0){const k=Math.min(1,A.t/0.8),e=k*k*(3-2*k);a.sc=lerp(1,3.2,e);a.radius=1.35*a.sc;a.cy=1.9*a.sc*0.8;sovGo(a,a.pos.x,BY+0.05,a.pos.z,10,dt);sovFace(a,dt,8);
      if(A.t<0.55)A.tx=pcx;if(A.t<0.55)A.tz=pcz;if(A.tx===undefined){A.tx=pcx;A.tz=pcz;}if(A.t===dt)SFX.tone('sawtooth',80,200,0.8,0.12);
      if(k>=1){A.ph=1;A.t=0;A.x0=a.pos.x;A.z0=a.pos.z;}}
    else if(A.ph===1){const k=Math.min(1,A.t/0.3),e=k*k*(3-2*k);a.pos.x=lerp(A.x0,A.tx-Math.sin(a.yaw)*4,e);a.pos.z=lerp(A.z0,A.tz-Math.cos(a.yaw)*4,e);a.pos.y=BY+0.05+Math.sin(k*Math.PI)*6;sovClamp(a);
      if(k>=1){const c=SOV.a.pos;SOV.waves.push({x:c.x,z:c.z,r:3,v:28,max:44,hit:false});ringFx(c.x,BY+0.3,c.z,2,18,0.5,[1,.8,.4]);burst(c.x,BY+1,c.z,40,24,0.7,[[1,.8,.4],[1,1,1]],1.5,-2,1.5);SFX.boom(1,0.4);addShake(0.7);flashWhite=Math.max(flashWhite,0.2);
        if(Math.hypot(pcx-c.x,pcz-c.z)<7&&P.pos.y<BY+6)sovHurt(0.14,'blast',26);A.ph=2;A.t=0;}}
    else{const k=Math.min(1,A.t/0.8),e=k*k*(3-2*k);a.sc=lerp(3.2,1,e);a.radius=1.35*a.sc;a.cy=1.9*a.sc*0.8;sovGo(a,a.pos.x,lerp(BY+0.05,BY+2.4,e),a.pos.z,10,dt);if(k>=1)sovEnd(a);}
    break;}
  case 'hole':{ // a mini black hole that drags you in
    if(A.ph===0){sovFace(a,dt,10);a.armUp=1;if(!A.h){const an=rr(0,TAU),r=rr(6,9);A.h={x:pcx+Math.cos(an)*r,y:BY+3+rr(0,2),z:pcz+Math.sin(an)*r,t:0,life:p2?5:4.2,k:0,tk:0};SOV.holes.push(A.h);SFX.tone('sawtooth',60,30,1.5,0.14);}
      if(A.t>=0.7){A.ph=1;A.t=0;}}
    else if(A.t>=1.0)sovEnd(a);
    break;}
  case 'morph':{ // an alien form: hulking charges and pounds
    if(A.ph===0){const k=Math.min(1,A.t/0.85);a.sc=lerp(1,1.9,k);a.radius=1.35*a.sc;a.cy=1.9*a.sc*0.85;SOV.hulk=k;a.glow=1;sovFace(a,dt,8);sovGo(a,a.pos.x,BY+0.05,a.pos.z,8,dt);if(A.t===dt)SFX.tone('sawtooth',90,50,0.9,0.14);
      if(k>=1){A.ph=1;A.t=0;A.h=p2?6:4.5;A.s='idle';A.sc=0.8;SFX.boom(0.8,0.4);addShake(0.5);flashWhite=Math.max(flashWhite,0.3);ringFx(a.pos.x,BY+0.3,a.pos.z,2,14,0.5,[.4,1,.5]);}}
    else if(A.ph===1){
      A.h-=dt;A.sc-=dt;const dx=pcx-a.pos.x,dz=pcz-a.pos.z,d=Math.hypot(dx,dz)||1,ux=dx/d,uz=dz/d;a.pos.y+=(BY+0.05-a.pos.y)*Math.min(1,dt*6);
      if(A.s==='idle'){sovFace(a,dt,8);if(d>5){a.pos.x+=ux*16*dt;a.pos.z+=uz*16*dt;}if(A.sc<=0){A.s='wind';A.t2=0.45;a.glow=1;}}
      else if(A.s==='wind'){A.t2-=dt;a.glow=1;a.pos.x-=ux*3*dt;a.pos.z-=uz*3*dt;A.cx=ux;A.cz=uz;if(A.t2<=0){A.s='charge';A.t2=0.5;A.hit=false;SFX.whoosh();}}
      else if(A.s==='charge'){A.t2-=dt;a.pos.x+=A.cx*(p2?26:20)*dt;a.pos.z+=A.cz*(p2?26:20)*dt;a.yaw=Math.atan2(A.cx,A.cz);
        if(!A.hit&&d<3.8*a.sc*0.7&&Math.abs(P.pos.y-a.pos.y)<5){A.hit=true;sovHurt(0.09,'punch',28);SFX.punch(1);}
        if(A.t2<=0||A.hit){A.s='pound';A.t2=0.4;}}
      else if(A.s==='pound'){A.t2-=dt;a.glow=1;if(A.t2<=0){if(d<8&&P.pos.y<BY+4)sovHurt(0.08,'blast',22);ringFx(a.pos.x,BY+0.3,a.pos.z,1,9,0.4,[.4,1,.5]);burst(a.pos.x,BY+0.6,a.pos.z,30,14,0.5,[[.4,1,.5],[1,1,1]],1.8,-2,2);SFX.boom(0.7,0.5);addShake(0.4);A.s='rec';A.t2=0.5;}}
      else{A.t2-=dt;if(A.t2<=0){A.s='idle';A.sc=rr(0.5,1);}}
      sovClamp(a);
      if(A.h<=0){SOV.hulk=0;flashWhite=Math.max(flashWhite,0.2);ringFx(a.pos.x,a.pos.y+1.5,a.pos.z,1,10,0.4,[1,.9,.6]);A.ph=2;A.t=0;}
    }else{const k=Math.min(1,A.t/0.5);a.sc=lerp(1.9,1,k);a.radius=1.35*a.sc;a.cy=1.9*a.sc*0.85;SOV.hulk=1-k;sovGo(a,a.pos.x,lerp(BY+0.05,BY+2.4,k),a.pos.z,10,dt);if(k>=1)sovEnd(a);}
    break;}
  default:sovEnd(a);
  }
}
// the hazards the powers leave in the room (they run on world time: they freeze with it)
function sovFxTick(dt){
  const BY=SOVBY,pcx=P.pos.x,pcy=P.pos.y+1.3,pcz=P.pos.z,a=SOV.a;
  for(let i=SOV.fists.length-1;i>=0;i--){const f=SOV.fists[i];if(f.st==='rest'){f.t+=dt;if(f.t>0.9)SOV.fists.splice(i,1);}else if(!SOV.at||SOV.at.k!=='fist')SOV.fists.splice(i,1);}
  for(let i=SOV.webs.length-1;i>=0;i--){const w=SOV.webs[i];w.t+=dt;
    if(w.st==='fly'){w.vy-=9.8*dt;w.x+=w.vx*dt;w.y+=w.vy*dt;w.z+=w.vz*dt;if(Math.random()<0.7)emit(w.x,w.y,w.z,0,0,0,0.3,[.95,.95,1],0.8,0,0);
      if(w.t>=w.life){w.st='stuck';w.t=0;w.y=BY+0.2;ringFx(w.x,BY+0.3,w.z,0.5,5.5,0.35,[.95,.95,1]);burst(w.x,BY+0.6,w.z,24,8,0.5,[[.95,.95,1]],1,2,2);SFX.tone('triangle',500,200,0.2,0.08);
        if(Math.hypot(pcx-w.x,pcz-w.z)<5.5&&P.pos.y<BY+6&&!P.dead){P.stun=Math.max(P.stun,1.15);P.vel.set(0,0,0);sovHurt(0.04,'web',0);feed('Pinned by webbing','Wait it out');}}}
    else if(w.t>1.4)SOV.webs.splice(i,1);}
  const h=SOV.hammer;if(h){h.t+=dt;h.sp+=dt*14;
    if(!h.ret){h.x+=h.vx*dt;h.y+=h.vy*dt;h.z+=h.vz*dt;if(h.t>0.95||inBuilding(h.x,h.y,h.z,0.2)){h.ret=true;h.hit=false;h.t=0;burst(h.x,h.y,h.z,16,10,0.4,[[.7,.85,1],[1,1,1]],1.2,0,2);}}
    else if(a){const v=dirTo(h,a.pos.x,a.pos.y+2,a.pos.z);h.x+=v[0]*64*dt;h.y+=v[1]*64*dt;h.z+=v[2]*64*dt;if(Math.hypot(a.pos.x-h.x,a.pos.y+2-h.y,a.pos.z-h.z)<2.2||h.t>1.6)SOV.hammer=null;}else SOV.hammer=null;
    if(SOV.hammer){if(Math.random()<0.8)tracer(h.x,h.y,h.z,h.x+rr(-1.5,1.5),h.y+rr(-1.5,1.5),h.z+rr(-1.5,1.5),[.7,.85,1],0.05,0.1);
      if(!h.hit&&!P.dead&&Math.hypot(pcx-h.x,pcy-h.y,pcz-h.z)<2.2){h.hit=true;sovHurt(0.1,'shock',22);burst(h.x,h.y,h.z,20,12,0.4,[[.7,.85,1],[1,1,1]],1.4,0,2);SFX.tone('sawtooth',1500,150,0.25,0.1);}}}
  for(let i=SOV.bolts.length-1;i>=0;i--){const b=SOV.bolts[i];b.t+=dt;
    if(b.tr&&b.t<b.dur*0.55&&b.t>0){b.x=pcx;b.z=pcz;}
    if(!b.done&&b.t>=b.dur){b.done=true;b.fl=0.35;let px=b.x,py=BY+SPH-1,pz=b.z;for(let k=1;k<=8;k++){const q=k/8,nx=b.x+(k<8?rr(-1.4,1.4):0),ny=lerp(BY+SPH-1,BY+0.2,q),nz=b.z+(k<8?rr(-1.4,1.4):0);tracer(px,py,pz,nx,ny,nz,[.8,.9,1],0.2,0.35);tracer(px,py,pz,nx,ny,nz,[1,1,1],0.07,0.3);px=nx;py=ny;pz=nz;}
      burst(b.x,BY+0.5,b.z,26,16,0.5,[[.7,.85,1],[1,1,1]],1.5,-2,2);SFX.boom(0.5,1.2);addShake(0.2);if(Math.hypot(pcx-b.x,pcz-b.z)<3.6&&P.pos.y<BY+5)sovHurt(0.055,'shock',10);}
    if(b.t>b.dur+0.5)SOV.bolts.splice(i,1);}
  for(let i=SOV.ices.length-1;i>=0;i--){const c=SOV.ices[i];c.t+=dt;c.tk-=dt;
    if(Math.random()<0.5)emit(c.x+rr(-c.r,c.r)*0.8,BY+rr(0.3,2.5),c.z+rr(-c.r,c.r)*0.8,rr(-1,1),rr(0.5,2),rr(-1,1),0.9,[.75,.93,1],rr(1.4,2.6),0,0.5);
    if(c.t>c.life)SOV.ices.splice(i,1);}
  {let inIce=false;for(const c of SOV.ices)if(Math.hypot(pcx-c.x,pcz-c.z)<c.r&&P.pos.y<BY+6&&!P.dead){inIce=true;if(c.tk<=0){c.tk=0.6;sovHurt(0.028,'frost',0);}}
    if(inIce){P.slow=Math.max(P.slow||0,0.6);SOV.slowOn=true;}else if(SOV.slowOn){P.slow=0;SOV.slowOn=false;}}
  for(let i=SOV.holes.length-1;i>=0;i--){const q=SOV.holes[i];q.t+=dt;q.k=Math.min(1,q.t/0.7)*(q.t>q.life-0.5?Math.max(0,(q.life-q.t)/0.5):1);q.tk-=dt;
    const dx=q.x-P.pos.x,dy=q.y-pcy,dz=q.z-P.pos.z,d=Math.hypot(dx,dy,dz)||1;
    if(q.k>0.5&&d<30&&!P.dead){const f=(30*(1-d/30)+10)*dt*q.k;P.vel.x+=dx/d*f;P.vel.y+=dy/d*f*0.5;P.vel.z+=dz/d*f;if(d<2.4*q.k&&q.tk<=0){q.tk=0.5;sovHurt(0.12,'gravity',0);}}
    if(Math.random()<0.7){const an=rr(0,TAU),r=rr(4,10);emit(q.x+Math.cos(an)*r,q.y+rr(-3,3),q.z+Math.sin(an)*r,-Math.cos(an)*r*1.4,0,-Math.sin(an)*r*1.4,0.6,[.6,.35,1],1.2,0,0);}
    if(q.t>q.life){burst(q.x,q.y,q.z,30,16,0.6,[[.6,.35,1],[1,1,1]],1.5,0,2);SOV.holes.splice(i,1);}}
  for(let i=SOV.waves.length-1;i>=0;i--){const w=SOV.waves[i];w.r+=w.v*dt;
    if(!w.hit&&!P.dead&&Math.abs(Math.hypot(pcx-w.x,pcz-w.z)-w.r)<2.4&&P.pos.y<BY+1.8){w.hit=true;sovHurt(0.09,'blast',18);}
    if(w.r>w.max)SOV.waves.splice(i,1);}
  for(let i=SOV.blades.length-1;i>=0;i--){const b=SOV.blades[i];
    if(!b.go)continue;b.age+=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
    if(!P.dead&&Math.hypot(pcx-b.x,pcy-b.y,pcz-b.z)<1.5){sovHurt(0.011,'slash',6);burst(b.x,b.y,b.z,8,8,0.3,[[1,.9,.5],[1,1,1]],0.9,0,2);b.age=9;}
    if(b.age>1.3)SOV.blades.splice(i,1);}
}
// ---- drawing the Sovereign and its powers ----
function sovDraw(){
  const a=SOV.a,t=time,BY=SOVBY;
  if(a&&(a.alive||SOV.won)){
    const s=SOV.rage,hulk=SOV.hulk,gold=[1,.86,.48],red=[1,.18,.16],hc=[lerp(gold[0],red[0],s),lerp(gold[1],red[1],s),lerp(gold[2],red[2],s)];
    const col=hulk>0?[lerp(1,.4,hulk),lerp(.88,.85,hulk),lerp(.6,.45,hulk),1]:[1,lerp(.9,.8,s),lerp(.62,.6,s),1],dk=hulk>0?[.08,.2,.1,1]:[lerp(.5,.4,s),lerp(.36,.2,s),lerp(.16,.15,s),1];
    const mv=Math.hypot(a.pos.x-(a.lx||a.pos.x),a.pos.z-(a.lz||a.pos.z));a.lx=a.pos.x;a.lz=a.pos.z;
    const k=a.sc,up=a.armUp,fl=a.flash*0.6+(a.iframe>0?0.3:0);
    const o={sc:k*(a.vis===undefined?1:1),col,dk,trim:[hc[0],hc[1],hc[2],1],fl,bob:Math.sin(t*1.6)*0.12,lean:0.12*Math.min(1,mv*8),leg:0.12*Math.sin(t*1.6),aR:-2.6*up-0.1,aL:SOV.ts?-2.3:-0.2*Math.sin(t*1.3),eR:-0.3,eL:-0.3,pad:1.25+0.4*hulk,sx:1+0.35*hulk,sy:1};
    if(hulk>0)o.sx=1+0.5*hulk;
    const root=humanoid(a,o),hc4=[hc[0],hc[1],hc[2],1];
    // the halo: a crown of floating shards round the head, a ring behind it
    const nS=14,hr=0.5;for(let i=0;i<nS;i++){const an=i/nS*TAU+t*(0.8+0.8*s),yy=2.12+Math.sin(t*2+i)*0.06;queue(PFB,child(root,Math.cos(an)*hr,yy,Math.sin(an)*hr,0.3*Math.sin(an),-an,0,0.04,0.2,0.09),col,0,0.2+0.4*s);queue(MESH.glowBox,child(root,Math.cos(an)*hr,yy,Math.sin(an)*hr,0.3*Math.sin(an),-an,0,0.025,0.14,0.05),hc4,0);}
    queue(MESH.ring,child(root,0,2.12,0,0,t*0.5,0,0.62,1,0.62),[hc[0],hc[1],hc[2],0.7],F_ADD);queue(MESH.glowSphere,child(root,0,1.75,-0.1,0,0,0,0.38,0.38,0.2),[hc[0],hc[1],hc[2],0.28],F_ADD);
    queue(MESH.glowSphere,child(root,0,1.2,0,0,0,0,0.85,1.35,0.7),[hc[0],hc[1],hc[2],0.02+0.03*s+0.07*a.glow],F_ADD);
    for(const sd of [-1,1])queue(PFB,child(root,sd*0.06,1.3,-0.2,0.15,0,sd*0.12,0.08,0.7,0.015),[hc[0],hc[1],hc[2],1],0,0.2); // a short blade-like cape
    if(SOV.ts&&SOV.ts.ph==='warn'){const q=SOV.ts.t;queue(MESH.ring,at(a.pos.x,a.pos.y+1.9,a.pos.z,Math.PI/2,0,0,3-q*1.5,1,3-q*1.5),[1,.9,.5,0.8],F_ADD);queue(MESH.glowBox,child(root,0,2.9,0,0,0,0,0.06,0.5,0.02),[1,1,1,1],0);queue(MESH.glowBox,child(root,0,2.9,0,0,0,q*TAU,0.06,0.4,0.02),[1,.9,.5,1],0);}
  }
  for(const f of SOV.fists)sovFistDraw(f,t);
  for(const w of SOV.webs){if(w.st==='fly'){queue(MESH.glowSphere,at(w.x,w.y,w.z,0,0,0,0.7,0.7,0.7),[.95,.95,1,0.9],0);queue(MESH.glowSphere,at(w.x,w.y,w.z,0,0,0,2.2,2.2,2.2),[.9,.9,1,0.2],F_ADD);const k=w.t/w.life;queue(MESH.ring,at(w.tx,BY+0.15,w.tz,0,0,0,5.5*k,1,5.5*k),[.9,.9,1,0.35],F_ADD);}
    else{const f=1-w.t/1.4;queue(MESH.disc,at(w.x,BY+0.1,w.z,0,0,0,5.5,1,5.5),[.88,.9,1,0.12*f],F_BL);for(let k=0;k<8;k++){const an=k*TAU/8;queue(MESH.glowBox,M4.beam(tmpM(),w.x,BY+0.15,w.z,w.x+Math.cos(an)*5.5,BY+0.15,w.z+Math.sin(an)*5.5,0.025),[.9,.92,1,0.3*f],F_ADD);}
      for(const r of [2,3.8,5.4])queue(MESH.ring,at(w.x,BY+0.16,w.z,0,0,0,r,1,r),[.9,.92,1,0.3*f],F_ADD);}}
  if(SOV.hammer){const h=SOV.hammer,sp=h.sp;queue(PFB,at(h.x,h.y,h.z,sp,sp*0.6,0,0.5,0.55,1.7),[.75,.82,.95,1],0);queue(PFB,at(h.x,h.y,h.z,sp,sp*0.6,0,0.2,0.2,2.6),[.5,.35,.2,1],0);queue(MESH.glowSphere,at(h.x,h.y,h.z,0,0,0,2.8,2.8,2.8),[.6,.8,1,0.1],F_ADD);}
  for(const b of SOV.bolts){if(b.t<0){continue;}if(!b.done){const k=b.t/b.dur;queue(MESH.disc,at(b.x,BY+0.12,b.z,0,0,0,3.6,1,3.6),[.7,.85,1,0.1+0.25*k*(0.6+0.4*Math.sin(t*30))],F_ADD);queue(MESH.ring,at(b.x,BY+0.14,b.z,0,0,0,3.6*(1-k*0.3),1,3.6*(1-k*0.3)),[.8,.9,1,0.8],F_ADD);}else if(b.fl>0){b.fl-=0.016;queue(MESH.tube,at(b.x,BY+SPH/2,b.z,0,0,0,1.0,SPH,1.0),[.6,.8,1,Math.max(0,b.fl)*1.4],F_ADD);}}
  if(SOV.icet){const c=SOV.icet,p=0.5+0.5*Math.sin(t*14);queue(MESH.disc,at(c.x,BY+0.1,c.z,0,0,0,8.5,1,8.5),[.6,.9,1,0.12+0.15*p],F_ADD);queue(MESH.ring,at(c.x,BY+0.14,c.z,0,0,0,8.5,1,8.5),[.8,.95,1,0.8],F_ADD);}
  for(const c of SOV.ices){const f=Math.min(1,c.t/0.5)*Math.min(1,(c.life-c.t)/0.6);queue(MESH.disc,at(c.x,BY+0.1,c.z,0,0,0,c.r,1,c.r),[.7,.92,1,0.16*f],F_BL);queue(MESH.ring,at(c.x,BY+0.14,c.z,0,0,0,c.r,1,c.r),[.8,.95,1,0.5*f],F_ADD);
    for(let k=0;k<7;k++){const an=k*TAU/7+t*0.3+c.x,r=c.r*0.55*(0.4+0.6*((k*0.37)%1)),y=BY+1.4+Math.sin(t*0.9+k)*0.5;queue(MESH.glowSphere,at(c.x+Math.cos(an)*r,y,c.z+Math.sin(an)*r,0,0,0,3.4,2.1,3.4),[.78,.92,1,0.045*f],F_ADD);}}
  for(const q of SOV.holes){const k=q.k,r=2.4*k;if(k<=0)continue;queue(MESH.sphere,at(q.x,q.y,q.z,0,0,0,r,r,r),[0,0,0,1],0);queue(MESH.glowSphere,at(q.x,q.y,q.z,0,0,0,r*2.2,r*2.2,r*2.2),[.5,.3,1,0.16],F_ADD);
    for(let i=0;i<3;i++)queue(MESH.ring,at(q.x,q.y,q.z,0.5,t*(2+i),0.2*i,r*(2+i*0.8),1,r*(2+i*0.8)),[.7,.45,1,0.5-i*0.12],F_ADD);queue(MESH.ring,at(q.x,q.y,q.z,0,0,0,30*k,1,30*k),[.5,.3,1,0.04],F_ADD);}
  for(const w of SOV.waves){const f=1-w.r/w.max;queue(MESH.ring,at(w.x,BY+0.4,w.z,0,0,0,w.r,1,w.r),[1,.85,.5,0.9*f],F_ADD);queue(MESH.ring,at(w.x,BY+0.8,w.z,0,0,0,w.r*0.97,1,w.r*0.97),[1,1,1,0.5*f],F_ADD);}
  for(const b of SOV.blades){const l=Math.hypot(b.vx,b.vy,b.vz)||1,tx=b.go?b.vx/l:(P.pos.x-b.x),ty=b.go?b.vy/l:(P.pos.y+1.3-b.y),tz=b.go?b.vz/l:(P.pos.z-b.z),tl=Math.hypot(tx,ty,tz)||1;queue(MESH.glowBox,M4.beam(tmpM(),b.x,b.y,b.z,b.x+tx/tl*1.8,b.y+ty/tl*1.8,b.z+tz/tl*1.8,0.1),[1,.9,.5,1],F_ADD);queue(MESH.glowBox,M4.beam(tmpM(),b.x,b.y,b.z,b.x+tx/tl*1.8,b.y+ty/tl*1.8,b.z+tz/tl*1.8,0.3),[1,.8,.3,0.3],F_ADD);}
  if(SOV.laser){const L=SOV.laser,pre=L.pre;queue(MESH.glowBox,M4.beam(tmpM(),L.sx,L.sy,L.sz,L.ex,L.ey,L.ez,pre?0.05:0.14+0.04*Math.sin(t*40)),[1,pre?.3:.55,pre?.3:.4,pre?0.7:0.95],F_ADD);if(!pre){queue(MESH.glowBox,M4.beam(tmpM(),L.sx,L.sy,L.sz,L.ex,L.ey,L.ez,0.5),[1,.12,.08,0.22],F_ADD);queue(MESH.glowSphere,at(L.ex,L.ey,L.ez,0,0,0,2.4,1,2.4),[1,.45,.25,0.35],F_ADD);}}
  if(SOV.at&&SOV.at.k==='giant'&&SOV.at.ph<2&&SOV.at.tx!==undefined){const k=SOV.at.ph===1?1:SOV.at.t/0.8,p=0.5+0.5*Math.sin(t*20);queue(MESH.ring,at(SOV.at.tx,BY+0.14,SOV.at.tz,0,0,0,7,1,7),[1,.8,.4,0.5+0.4*p],F_ADD);queue(MESH.disc,at(SOV.at.tx,BY+0.12,SOV.at.tz,0,0,0,7*k,1,7*k),[1,.7,.3,0.15],F_ADD);}
  if(a&&SOV.at&&SOV.at.k==='hole'&&SOV.at.h){const q=SOV.at.h;queue(MESH.glowBox,M4.beam(tmpM(),a.pos.x,a.pos.y+1.9,a.pos.z,q.x,q.y,q.z,0.08),[.6,.4,1,0.5],F_ADD);}
}
function sovFistDraw(f,t){
  const BY=SOVBY,rest=f.st==='rest',al=rest?Math.max(0,1-f.t/0.9):1;
  if(f.st==='tg'){const p=0.5+0.5*Math.sin(t*18);queue(MESH.disc,at(f.x,BY+0.12,f.z,0,0,0,5.4,1,5.4),[.4,1,.5,0.12+0.14*p],F_ADD);queue(MESH.ring,at(f.x,BY+0.14,f.z,0,0,0,5.4,1,5.4),[.5,1,.6,0.85],F_ADD);queue(MESH.tube,at(f.x,BY+8.5,f.z,0,0,0,5.4,17,5.4),[.4,1,.5,0.04],F_ADD);}
  const y=f.y,g=[.35,1,.5];
  queue(MESH.box,at(f.x,y+1,f.z,0,0,0,3.6,2.4,3.6),[.12,.7,.25,0.62*al],F_BL);queue(MESH.glowBox,at(f.x,y+1,f.z,0,0,0,3.9,2.7,3.9),[.15,.85,.35,0.07*al],F_ADD);
  for(let k=0;k<4;k++){const x=f.x-1.35+k*0.9;queue(MESH.box,at(x,y-1,f.z+0.5,0,0,0,0.85,2.2,0.95),[.12,.7,.25,0.62*al],F_BL);queue(MESH.glowBox,at(x,y-1,f.z+0.5,0,0,0,1.0,2.35,1.1),[.15,.85,.35,0.07*al],F_ADD);}
  queue(MESH.box,at(f.x+2.1,y+0.3,f.z+0.4,0,0,0.5,0.9,1.9,0.95),[.12,.7,.25,0.62*al],F_BL);queue(MESH.ring,at(f.x,y+1,f.z,Math.PI/2,0,0,2.4,1,2.4),[g[0],g[1],g[2],0.4*al],F_ADD);
  if(f.st==='sl')queue(MESH.glowBox,at(f.x,y+8,f.z,0,0,0,2.2,16,2.2),[g[0],g[1],g[2],0.07],F_ADD);
}
// ================================================================
// The zone's moving parts: glass, lifts, the throne, the city outside
// ================================================================
function spZoneDraw(Z){
  const t=time,o=SPO,W=SPW;
  for(const a of SP.list)cbDraw(a);
  sovDraw();
  for(const f of SP.fx){const k=f.t/f.dur;queue(MESH.tube,at(f.x,f.y+8,f.z,0,0,0,1.6*(1-k*0.5),16,1.6*(1-k*0.5)),[f.c[0],f.c[1],f.c[2],0.35*(1-k)],F_ADD);queue(MESH.ring,at(f.x,f.y+0.15,f.z,0,0,0,0.6+k*3,1,0.6+k*3),[f.c[0],f.c[1],f.c[2],0.8*(1-k)],F_ADD);}
  for(let f=0;f<3;f++){const y0=SPFY[f],my=y0+SPH/2;for(const s of [-1,1]){queue(MESH.box,at(o.x+s*W,my,o.z,0,0,0,0.2,SPH,2*W),[.55,.82,1,0.1],F_BL);queue(MESH.box,at(o.x,my,o.z+s*W,0,0,0,2*W,SPH,0.2),[.55,.82,1,0.1],F_BL);}}
  for(let f=0;f<2;f++){ // the lifts: a gravity column, dim and red until the floor is cleared
    const L=SPLIFT[f],y0=SPFY[f],x=o.x+L.x,z=o.z+L.z,open=SP.open&&SP.floor===f+1,col=open?[.4,.9,1]:[1,.3,.3],a=open?1:0.25;
    queue(MESH.disc,at(x,y0+0.15,z,0,0,0,5,1,5),[col[0],col[1],col[2],0.3*a+(open?0.12*Math.sin(t*4):0)],F_ADD);queue(MESH.ring,at(x,y0+0.18,z,0,0,0,5.1,1,5.1),[col[0],col[1],col[2],0.9*a],F_ADD);queue(MESH.ring,at(x,y0+0.2,z,0,-t,0,3.4,1,3.4),[col[0],col[1],col[2],0.7*a],F_ADD);
    queue(MESH.tube,at(x,y0+14,z,0,0,0,7,28,7),[col[0],col[1],col[2],(open?0.06:0.02)+(open?0.02*Math.sin(t*3):0)],F_ADD);queue(MESH.tube,at(x,y0+14,z,0,0,0,2.4,28,2.4),[col[0],col[1],col[2],open?0.2:0.04],F_ADD);
    if(open)for(let k=0;k<5;k++){const y=((t*7+k*5.6)%28);queue(MESH.ring,at(x,y0+y,z,0,0,0,3.2,1,3.2),[.6,.95,1,0.7*(1-y/28)],F_ADD);}
    if(open&&Math.random()<0.5)emit(x+rr(-2,2),y0+0.3,z+rr(-2,2),0,rr(8,18),0,1.2,[.6,.95,1],rr(.7,1.3),0,0);
    queue(MESH.disc,at(x,SPFY[f+1]-0.45,z,0,0,0,5,1,5),[.4,.9,1,0.3],F_ADD); // the underside of the pad above
    const s=SPST[f+1];queue(MESH.ring,at(o.x+s.x,SPFY[f+1]+0.18,o.z+s.z,0,t*0.5,0,3.2+0.2*Math.sin(t*2),1,3.2+0.2*Math.sin(t*2)),[.5,.95,1,0.5],F_ADD); // where you step off
  }
  {const y0=SPFY[2];queue(MESH.ring,M4.alignY(tmpM(),o.x,y0+9,o.z+52.5,0,0,1,7),[1,.82,.4,0.85],F_ADD);queue(MESH.ring,M4.alignY(tmpM(),o.x,y0+9,o.z+52.4,0,0,1,5.6),[1,.9,.6,0.5],F_ADD);queue(MESH.glowSphere,at(o.x,y0+8,o.z+52,0,0,0,9,9,2.4),[1,.8,.4,0.08],F_ADD);}
  // labs: stasis tubes glow
  {const y0=SPFY[1];for(const sx of [-1,1])for(let k=0;k<6;k++){const x=o.x+sx*52,z=o.z-40+k*16;queue(MESH.cyl,at(x,y0+SPH/2-1,z,0,0,0,3.2,SPH-6,3.2),[.6,.85,1,0.07],F_BL);queue(MESH.glowCyl,at(x,y0+SPH/2-1,z,0,0,0,2,SPH-7,2),[.45,.3,1,0.07+0.03*Math.sin(t*2+k)],F_ADD);queue(MESH.glowSphere,at(x,y0+4+((t*1.5+k)%1)*8,z,0,0,0,0.5,0.5,0.5),[.8,.7,1,0.5],F_ADD);}
    queue(MESH.ring,at(o.x,y0+1.1,o.z,0,t*0.7,0,6,1,6),[.5,.9,1,0.6],F_ADD);}
  // the lobby's holo panel
  queue(MESH.glowSphere,at(o.x,SPFY[0]+3.4,o.z,0,t*0.8,0,1.4,1.4,1.4),[.5,.9,1,0.4],F_ADD);queue(MESH.ring,at(o.x,SPFY[0]+3.4,o.z,Math.sin(t)*0.4,t,0,2.2,1,2.2),[.5,.9,1,0.5],F_ADD);
  // the city outside: lanes of flying cars
  for(const c of SP.cars){const p=((c.o+t*c.v)%1400+1400)%1400-700;const x=c.ax?p:c.x,z=c.ax?c.x:p+0;queue(MESH.glowBox,at(o.x+x,c.y,o.z+z,0,c.ax?Math.PI/2:0,0,1.6,0.5,5),[c.c[0],c.c[1],c.c[2],0.9],0);queue(MESH.glowBox,M4.beam(tmpM(),o.x+x,c.y,o.z+z,o.x+x-(c.ax?1:0)*Math.sign(c.v)*30,c.y,o.z+z-(c.ax?0:1)*Math.sign(c.v)*30,0.4),[c.c[0],c.c[1],c.c[2],0.25],F_ADD);}
}
// ================================================================
// The ending: the Sovereign shatters, the stars come back
// ================================================================
function sovDefeated(a){
  const S=save.story;SOV.won=true;SOV.fight=false;SOV.ts=null;if(frozenT>0){frozenT=0;tsBy=null;}
  for(const f of SOV.fists)f.st='rest';SOV.at=null;SOV.laser=null;SOV.icet=null;SOV.ices.length=0;SOV.holes.length=0;SOV.bolts.length=0;SOV.hammer=null;SOV.webs.length=0;SOV.waves.length=0;SOV.blades.length=0;
  if(SOV.slowOn){P.slow=0;SOV.slowOn=false;}
  S.tower=2;S.tf=3;persist();lockT=null;objective(null);objectiveMark(null);const w=$('tswarn'),e=$('sovsay');if(w)w.classList.remove('on');if(e)e.classList.remove('on');
  const c0={x:a.pos.x,y:a.pos.y,z:a.pos.z};SOV.shat={t:0};SOV.gone=false;
  cutscene({dur:6.5,text:'The Sovereign shatters into light',letterbox:true,skippable:false,fov:58,from:()=>({x:c0.x+4,y:c0.y+2.4,z:c0.z-9}),to:()=>({x:c0.x+8,y:c0.y+5,z:c0.z-15}),look:()=>({x:c0.x,y:c0.y+1.6,z:c0.z}),
    onTick:(k,dt)=>sovShatter(k,dt,c0,a),onEnd:sovEndHop});
}
function sovShatter(k,dt,c0,a){
  const S=SOV.shat;if(!S)return;S.t+=dt;
  if(k<0.2){a.flash=0.5+0.5*Math.sin(S.t*34);addShake(0.12);SOV.halo+=dt*9;if(Math.random()<0.6)burst(c0.x,c0.y+1.5,c0.z,3,10,0.4,[[1,.9,.6]],1,0,2);}
  else if(!SOV.gone){SOV.gone=true;flashWhite=1;SFX.boom(1,0.35);SFX.glass(1);SFX.tone('sine',200,2000,2.5,0.12);addShake(0.7);
    ringFx(c0.x,c0.y+1.5,c0.z,1,40,1.0,[1,.9,.6]);ringFx(c0.x,c0.y+1.5,c0.z,1,26,0.7,[1,1,1]);burst(c0.x,c0.y+1.5,c0.z,120,34,1.4,[[1,.9,.6],[1,1,1],[1,.8,.4]],2,0,1.2);
    for(let i=0;i<46;i++){const s=rr(0.12,0.4);spawnPiece(c0.x+rr(-1,1),c0.y+rr(0,3),c0.z+rr(-1,1),PFB,s*0.4,s*1.6,s*0.5,[1,.92,.7],rr(-22,22),rr(4,26),rr(-22,22),3.5,[rr(0,3),rr(0,3),0]);}}
  if(SOV.gone){if(Math.random()<0.9)emit(c0.x+rr(-2,2),c0.y+rr(-1,3),c0.z+rr(-2,2),rr(-1,1),rr(8,20),rr(-1,1),1.6,[1,.9,.6],rr(1,2.2),0,0);if(k>0.85)flashWhite=Math.max(flashWhite,smooth(0.85,1,k));}
}
function sovEndHop(){
  const a=SOV.a;if(a){removeActor(a);removeFrom(SP.list,a);}
  SPR.ending=true;SPR.real=false;SPR.dis=1;SPR.pk=0;CYZ.bounds.y1=0;
  if(!zoneHop('cyber',CYFRONT,cyberEnding)){later(0.5,sovEndHop);}
}
function cyberEnding(){
  SPR.ending=true;const C={x:0,y:0,z:0},Lk={x:0,y:0,z:0};CYZ.bounds.y1=0;
  const x0=P.pos.x-20,y0=P.pos.y+230,z0=P.pos.z-60; // high above the plaza, looking east over the city where the sky is open
  const pose=k=>{C.x=x0;C.y=y0;C.z=z0;return C;};
  const look=k=>{const e=smooth(0,1,k),el=lerp(0.2,0.62,e),az=1.3;Lk.x=x0+Math.cos(el)*Math.sin(az)*300;Lk.y=y0+Math.sin(el)*300;Lk.z=z0+Math.cos(el)*Math.cos(az)*300;return Lk;};
  cutscene({dur:11,letterbox:true,skippable:false,fov:70,text:'The stars are coming back',from:pose,to:pose,look,
    onTick:(k,dt,Cu)=>{const t=Cu.t;
      SPR.dis=1-smooth(0.5,3.2,t);
      if(t<3.4&&Math.random()<0.5){const s=CY.sun,an=rr(0,TAU);burst(P.pos.x+s[0]*60+Math.cos(an)*8,P.pos.y+s[1]*60,P.pos.z+s[2]*60+Math.sin(an)*8,2,6,0.8,[[.4,.9,1]],1.4,0,1);}
      if(t>=3.4&&!SPR.real){SPR.real=true;if(env.night>0.5)tod=0.42;flashWhite=1;SFX.chime();SFX.levelUp();SFX.tone('sine',400,1800,1.6,0.1);}
      SPR.pk=smooth(3.8,9.5,t);},
    onEnd:()=>{SPR.ending=false;SPR.real=true;SPR.dis=0;SPR.pk=1;CYZ.bounds.y1=0;save.story.tower=2;persist();cyberInfo();}});
}
function cyberInfo(n){
  n=n||0;
  const ok=askInfo('The solar system is back',[{b:'You did it.'},'The solar system is back, the Sun and the Moon are normal again, and Earth is out there waiting. And now there is a new world too.','Fly at full speed in the sky to travel between worlds.'],'Continue',()=>{SPR.hint=true;SPR.hintT=60;});
  if(!ok&&n<30)later(1,()=>cyberInfo(n+1));
}
// ---- the real sky in the cyber world ----
const cyReal=()=>inCyber()&&(SPR.real||(!SPR.ending&&!!save.story&&save.story.tower>=2));
const SKYB=[
  {az:1.45,el:.38,r:.09,col:[.12,.36,.82,1],earth:1},{az:2.05,el:.52,r:.036,col:[.8,.8,.82,1],moon:1},{az:2.4,el:.2,r:.046,col:[.8,.64,.46,1],bands:[.62,.42,.3,1]},
  {az:1.9,el:.25,r:.04,col:[.86,.76,.52,1],ring:[.8,.72,.55,0.75]},{az:1.15,el:.6,r:.022,col:[.76,.3,.16,1]},{az:.75,el:.22,r:.02,col:[.92,.78,.5,1]},
  {az:1.75,el:.66,r:.016,col:[.25,.4,.9,1]},{az:2.7,el:.35,r:.016,col:[.58,.85,.9,1]}];
function spSkyDraw(){
  const k=SPR.pk;if(k<=0.001)return;const D=3300,cx=camPos.x,cy=camPos.y,cz=camPos.z,t=time,s=env.sun;
  if(s[1]>-0.15)queue(MESH.glowSphere,at(cx+s[0]*D,cy+s[1]*D,cz+s[2]*D,0,0,0,D*0.16,D*0.16,D*0.16),[1,.7,.3,0.09*k],F_ADD);
  SKYB.forEach((b,i)=>{
    const kk=clamp(k*1.5-i*0.1,0,1);if(kk<=0)return;const e=1-Math.pow(1-kk,3),pop=e*(1+0.12*Math.sin(kk*Math.PI)),ce=Math.cos(b.el),dx=ce*Math.sin(b.az),dy=Math.sin(b.el),dz=ce*Math.cos(b.az),R=Math.tan(b.r)*D*pop,x=cx+dx*D,y=cy+dy*D,z=cz+dz*D;
    if(b.earth){const root=at(x,y,z,0.38,t*0.02,0.3,R,R,R);queue(PLANET_MESH,root,b.col,F_NF);
      for(const [yy,w,c] of [[.55,.18,[.25,.6,.3,1]],[.12,.2,[.3,.62,.28,1]],[-.3,.17,[.62,.55,.3,1]],[-.62,.12,[.25,.58,.32,1]],[.85,.1,[.95,.97,1,1]],[-.88,.1,[.95,.97,1,1]]]){const rr_=Math.sqrt(Math.max(0,1-yy*yy))*1.004;queue(PLANET_MESH,child(root,0,yy,0,0,0,0,rr_,w*0.5,rr_),c,F_NF);}
      for(const [yy,w] of [[.3,.05],[-.12,.04],[.7,.04],[-.5,.05]]){const rr_=Math.sqrt(1-yy*yy)*1.012;queue(PLANET_MESH,child(root,0,yy,0,0,t*0.01*(1+yy),0,rr_,w,rr_),[1,1,1,1],F_NF);}
      queue(MESH.glowSphere,at(x,y,z,0,0,0,R*1.1,R*1.1,R*1.1),[.4,.7,1,0.1],F_ADD);return;}
    queue(PLANET_MESH,at(x,y,z,0,t*0.01,0,R,R,R),b.col,F_NF);
    if(b.moon){for(const [ax,ay,az2,q] of [[.3,.3,.9,.28],[-.35,.1,.92,.2],[.1,-.4,.9,.22]])queue(PLANET_MESH,at(x+ax*R*.9,y+ay*R*.9,z-az2*R*.2,0,0,0,R*q,R*q,R*q*.4),[.58,.58,.62,1],F_NF);}
    if(b.bands)for(let j=-2;j<=2;j++){const yy=j*0.28,rr_=Math.sqrt(1-yy*yy)*1.003;queue(PLANET_MESH,at(x,y+yy*R,z,0,0,0,R*rr_,R*0.06,R*rr_),b.bands,F_NF);}
    if(b.ring){queue(MESH.ring,M4.alignY(tmpM(),x,y,z,0.25,1,0.15,R*2.3),b.ring,F_BL);queue(MESH.ring,M4.alignY(tmpM(),x,y,z,0.25,1,0.15,R*1.8),[b.ring[0]*.8,b.ring[1]*.8,b.ring[2]*.8,0.6],F_BL);}
  });
}
// ================================================================
// Travelling between worlds
// ================================================================
function travelTick(dt){
  const S=save.story;if(!S||S.tower<2){SPR.hold=0;return;}
  if(SPR.hint){SPR.hintT-=dt;if(SPR.hintT<=0||INV.ls)SPR.hint=false;}
  const cy=inCyber(),earth=!zone;
  if(INV.ls||CUT||ASK||ZF.phase||P.dead||state!=='play'||paused||!storySolo()||P.car||!(cy||earth)||SPR.ending){SPR.hold=Math.max(0,SPR.hold-dt*2);return;}
  if(earth&&inSpace()&&!SPR.earthHint&&P.flying){SPR.earthHint=true;toast('A way between worlds','Hold boost at full speed up here and a wormhole opens to the Cyber World','cyan');}
  const ok=P.flying&&(cy?P.pos.y-CYO.y>600:inSpace());
  if(!ok){SPR.hold=Math.max(0,SPR.hold-dt*2);return;}
  const boost=!!(keys.ShiftLeft||keys.ShiftRight)||stormRide(),sp=P.vel.len(),mx=invMaxSpeed()*(zone&&zone.speed||1);
  if(boost&&sp>=mx*0.95&&mx>40)SPR.hold+=dt;else if(!boost||sp<mx*0.8)SPR.hold=Math.max(0,SPR.hold-dt*2);
  if(SPR.hold>=2){SPR.hold=0;SPR.hint=false;wormholeTo(cy?'earth':'cyber');}
}
function wormholeTo(dest){if(dest!=='earth'&&dest!=='cyber')return false;lsStart(dest);return true;}
function earthArrive(){ // the wormhole's far end on Earth: high above Nova Bay
  INV.ls=null;INV.lsHold=0;SPR.hold=0;objective(null);objectiveMark(null);
  const pt={x:SPAWNS[0][0],y:420,z:SPAWNS[0][1]-60,yaw:SPAWNS[0][2],fly:true};
  if(zone)zoneExit(pt);else{P.pos.set(pt.x,pt.y,pt.z);P.vel.set(0,0,0);P.yaw=pt.yaw;P.flying=true;P.grounded=false;}
  P.pitch=-0.12;flashWhite=1;toast('Back on Earth','Nova Bay · full speed up in space opens the way back','cyan');
}
// ================================================================
// The entrance, the boss bar, test hooks
// ================================================================
function towerEnter(){ // the light gate at the end of the Spire's entrance (66i_cyber.js cyUpdate)
  const S=save.story;if(!inCyber()||ZF.phase||S.tower>=2)return;CY.enterT=time;
  S.cyber=Math.max(2,S.cyber);S.tower=Math.max(1,S.tower);persist();
  toast('The doors open...','Three floors to the top. Climb.','cyan');SFX.chime();flashWhite=Math.max(flashWhite,0.55);
  zoneHop('spire',spStartAt(Math.min(3,S.tf+1)));
}
function spireBar(){const a=SOV.a;if(!a||!a.alive||!inSpire())return false;hud.bossbar.hidden=false;setText(hud.bossname,'bn','THE SOVEREIGN');setW(hud.bossb,'boss',a.hp/a.maxHp);return true;}
function spireEnter(f){ // test hook
  const S=save.story;f=f||Math.min(3,S.tf+1);S.cyber=Math.max(S.cyber,2);S.tower=Math.max(S.tower,1);persist();
  if(inSpire()){spJump(f);return true;}if(zone)return zoneHop('spire',spStartAt(f));return enterZone('spire',spStartAt(f));
}
function spireFloor(n){if(!inSpire())return spireEnter(n);spJump(n);return true;}
function spireClearFloor(){ // test hook: knock out the floor
  SP.pend.length=0;for(const a of SP.list)if(a.alive&&a.vt!=='sov')Damage.apply(P,a,1e9,'test');SP.breath=0;if(SP.wave<1)SP.wave=1;if(SP.floor<3)SP.wave=3;
}
function sovereignAtk(k){const a=SOV.a;if(!a||!SOV.fight)return false;SOV.at={k,t:0,ph:0};SOV.ts=null;a.sc=1;return true;} // test hook: start one power now
function sovereignHalf(){const a=SOV.a;if(!a)return false;a.hp=Math.min(a.hp,a.maxHp*0.5);SOV.dodgeT=time+5;return true;}
function sovereignWin(){ // test hook: skip to the ending
  if(!inSpire())return false;if(SP.floor!==3)spJump(3);if(!SOV.a){SP.elite=1;SP.bossT=-1;sovIntro(true);}
  const a=SOV.a;SOV.ph=2;SOV.fight=true;SOV.trans=false;a.iframe=0;Damage.apply(P,a,a.maxHp*2,'test');return true;
}
