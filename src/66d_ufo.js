// ================================================================
// The UFO event: a saucer over Nova Bay, a way in, an interior full of aliens, and one item per hero
// ================================================================
// After 3 minutes of active play (save.story.act >= 180) a huge saucer descends over the city (an 8 s cutscene) and stays until you go in (save.story.ufo: 0 not
// yet, 1 waiting, 2 item taken, 3 done). Fly up into the hole in its belly, or say yes to the popup (after 60 s, 15 s for heroes that can't fly) and be beamed up.
// Inside (ZONES.ufo, parked at z=40000) are a hangar, corridors, four rooms with aliens (lab, engine room, holding cells, control deck) and a vault whose door opens
// once all four rooms are cleared. The item on its pedestal depends on the hero (UFO_ITEMS); touching it saves save.story.item and calls ufoReward(id). Then you are
// sent back above the city and the saucer flies off (5 s cutscene). The rewards live in 66e_boost.js (boostGranted); the Web Runner's reel is ufoWebReel below.
const UFO={on:false,x:0,y:420,z:0,rot:0,mesh:null,waitT:0,waitMax:60,leaving:false,lift:null};
const UFO_R=130,UFO_Y=420,UFO_HOLE=20; // saucer radius, hover height, radius of the opening in its belly
// the item each hero fetches: name, what it will do (next phase), glow colour
const UFO_ITEMS={
  powerRing:{name:'Infinity Lens',desc:'Constructs with no limits',col:[.3,1,.5]},bandFlight:{name:'Master Control',desc:'Every alien, any time',col:[.4,.9,1]},
  stormFlight:{name:'Storm Axe Core',desc:'Your hammer becomes an axe',col:[.6,.8,1]},superSpeed:{name:'Chrono Core',desc:'Rewind time',col:[1,.85,.3]},
  webSwing:{name:'Graviton Web Gland',desc:'Webs that reel you in',col:[.9,.9,1]},solarFlight:{name:'Star Seed',desc:'A sun of your own',col:[1,.8,.3]},
  armorFlight:{name:'Arc Reactor Prime',desc:'Power without end',col:[.4,.8,1]},ironFlight:{name:'Living Alloy',desc:'Armor that mends itself',col:[.8,.85,.95]},
  bladeFlight:{name:'Void Edge',desc:'A blade that cuts anything',col:[.7,.4,1]},elasticFlight:{name:'Quantum Polymer',desc:'Stretch without limits',col:[1,.5,.8]},
  titanFlight:{name:'Titan Heart',desc:'The strength of a giant',col:[1,.5,.25]},
};
const ufoHero=()=>save.character?save.character.movement[0]:'ironFlight';
const ufoItem=()=>UFO_ITEMS[ufoHero()]||UFO_ITEMS.ironFlight;
const ufoFlier=()=>hasPower('flight'); // Speedster and Web Runner can't fly up to it
// taking the item turns the boosts on for every hero (ufoBoost(), 66e_boost.js): the panel says what the current hero got
function ufoReward(id){boostGranted(id);}
// Web Runner: pressing web while looking at the saucer (or anywhere under it, aiming up more than 25 degrees) webs its belly and reels you up at a steady 45 m/s (80_player.js reelStep).
// Returns true when it took the press (44_movement.js webPress), false for a normal swing.
function ufoWebReel(){
  const S=save.story;if(!hasTrav('webSwing')||P.alien||S.ufo!==1||!UFO.on||zone||CUT||ASK||ZF.phase||UFO.leaving||Math.abs(UFO.y-UFO_Y)>5||!storySolo())return false;
  const ox=P.pos.x,oy=P.pos.y+1.6,oz=P.pos.z,tx=UFO.x,ty=UFO.y-26,tz=UFO.z,dx=tx-ox,dy=ty-oy,dz=tz-oz,d=Math.hypot(dx,dy,dz)||1;
  if(P.pos.y>ty-6)return false; // the hull is above you only when you are below the opening
  const ang=Math.acos(clamp((camF.x*dx+camF.y*dy+camF.z*dz)/d,-1,1)),sat=Math.atan2(UFO_R*0.9,d),hd=Math.hypot(dx,dz);
  if(!(ang<sat+0.12||(hd<700&&camF.y>Math.sin(0.436))))return false; // looking at the saucer, or up under it
  if(!spend(POWERS.webSwing.energy)){noEnergy();return true;}
  P.web=null;P.wall=null;P.wallRun=null;P.zip=null;P.flying=false;P.charging=false;if(P.grounded){P.grounded=false;P.pos.y+=0.2;P.vel.y=Math.max(P.vel.y,4);}
  P.reel={t:0,x:tx,y:ty,z:tz,pd:d,pt:time};SFX.tone('triangle',1400,500,0.14,0.09);feed('Reeling up to the UFO','Keep holding the web button · let go to stop');
  const h=handPoint();tracer(h.x,h.y,h.z,h.x+dx/d*30,h.y+dy/d*30,h.z+dz/d*30,[.95,.95,1],0.08,0.3);
  return true;
}
// ---- the saucer in the sky ----
const UP={sph:primSphere(56,28),cyl:primCyl(56),tor:primTorus(1,0.09,64,10),cone:primCyl(24,0.02,1,true)}; // smooth parts for the saucer (the shared ones are low-poly)
const UGLOW=primMesh(UP.sph,6);
function ufoMesh(){
  if(UFO.mesh)return UFO.mesh;
  const g=new Geo(),M=[.17,.18,.215],M2=[.085,.09,.11],M3=[.3,.32,.37],DK=[.03,.033,.045];
  g.prim(UP.sph,0,0,0,0,0,0,UFO_R,26,UFO_R,M,7);                                        // the hull
  g.prim(UP.cyl,0,0,0,0,0,0,UFO_R+3,4.5,UFO_R+3,M3,7);                                  // rim band
  g.prim(UP.sph,0,15,0,0,0,0,88,13,88,M2,7);                                            // top deck
  for(const r of [40,66,92,116])g.prim(UP.cyl,0,26*Math.sqrt(1-(r/UFO_R)**2)-0.3,0,0,0,0,r,1.4,r,r<80?M3:M2,7); // terraces
  g.prim(UP.sph,0,24,0,0,0,0,34,24,34,[.12,.24,.3],7);                                  // the dome
  g.prim(UP.cone,0,52,0,0,0,0,3,34,3,M3,7);                                             // antenna
  for(const r of [46,70,96,118])g.prim(UP.cyl,0,-26*Math.sqrt(1-(r/UFO_R)**2)+0.35,0,0,0,0,r,1.4,r,r<80?M3:M2,7); // the belly's terraces
  g.prim(UP.cyl,0,-24.6,0,0,0,0,30,1.4,30,DK,0);                                        // dark plate round the opening
  g.prim(UP.tor,0,-25.4,0,0,0,0,UFO_HOLE+2,3.2,UFO_HOLE+2,[.25,.8,1],6);                // glowing ring
  g.prim(UP.cyl,0,-25.9,0,0,0,0,UFO_HOLE,1.2,UFO_HOLE,[.6,.9,1],6);                     // the glowing opening (a disc facing down)
  for(let k=0;k<4;k++){const a=k*TAU/4+0.785;g.prim(UP.cyl,Math.cos(a)*74,-19,Math.sin(a)*74,0,0,0,11,7,11,M2,7);g.prim(UP.tor,Math.cos(a)*74,-22.6,Math.sin(a)*74,0,0,0,10,1.8,10,[.4,.55,1],6);} // engine pods
  for(let k=0;k<48;k++){const a=k*TAU/48,c=k%3===0?[1,.4,.85]:k%3===1?[.25,.85,1]:[.85,.92,1];g.prim(UP.sph,Math.cos(a)*(UFO_R+3.5),0,Math.sin(a)*(UFO_R+3.5),0,0,0,2,2,2,c,6);} // rim lights
  return UFO.mesh=g.mesh();
}
// the saucer is solid: its hull is a flattened ellipsoid (the same 130 x 26 x 130 the mesh is drawn with). The player is pushed out along the surface and bounces off
// a hard hit; the saucer takes no damage. The opening in the belly stays clear (that is the way in), and so does the web reel, which pulls you through its own path.
let ufoHitT=-9;
function ufoBlock(){
  if(!UFO.on||zone||state!=='play'||P.reel||P.dead||UFO.leaving||!storySolo())return;
  const R=P.radius,hh=P.height*0.5,a=UFO_R+3+R,b=26+hh+0.8,dx=P.pos.x-UFO.x,dy=P.pos.y+hh-UFO.y,dz=P.pos.z-UFO.z;
  if(Math.abs(dx)>a||Math.abs(dz)>a||Math.abs(dy)>b)return;
  if(dy<0&&dx*dx+dz*dz<(UFO_HOLE+4)*(UFO_HOLE+4))return;
  const a2=a*a,b2=b*b,gx=dx/a2,gy=dy/b2,gz=dz/a2,d=Math.sqrt(dx*gx+dy*gy+dz*gz);if(d>=1)return;
  const gl=Math.hypot(gx,gy,gz);let nx=0,ny=1,nz=0,step=b-dy;
  if(gl>1e-9){nx=gx/gl;ny=gy/gl;nz=gz/gl;step=Math.min(a,(1-d)*d/gl+0.02);}
  P.pos.x+=nx*step;P.pos.y+=ny*step;P.pos.z+=nz*step;
  const vn=P.vel.x*nx+P.vel.y*ny+P.vel.z*nz;
  if(vn<0){P.vel.x-=vn*nx*1.3;P.vel.y-=vn*ny*1.3;P.vel.z-=vn*nz*1.3; // cancel the way in, plus a little bounce
    if(-vn>18&&time-ufoHitT>0.5){ufoHitT=time;addShake(clamp(-vn*0.012,0.2,0.8));SFX.crash(clamp(-vn*0.02,0.3,0.8));burst(P.pos.x,P.pos.y+hh,P.pos.z,10,8,0.4,SPARK,0.8,15,1);}}
  if(ny>0.6){P.grounded=true;if(P.vel.y<0)P.vel.y=0;}
}
function ufoDraw(){
  const L=UFO.lift;
  if(L){const k=clamp(L.t/2.4,0,1),h=300;queue(MESH.tube,at(L.x,L.y0+h/2-4,L.z,0,0,0,2.2,h,2.2),[.7,.92,1,0.2],F_ADD);queue(MESH.tube,at(L.x,L.y0+h/2-4,L.z,0,0,0,4.2,h,4.2),[.5,.85,1,0.07],F_ADD);queue(MESH.ring,at(L.x,L.y0+0.2,L.z,0,0,0,3+k*3,1,3+k*3),[.8,.95,1,1-k*0.6],F_ADD);}
  if(!UFO.on||zone||state!=='play'||!storySolo())return;
  const x=UFO.x,y=UFO.y,z=UFO.z,t=time;
  queue(ufoMesh(),at(x,y,z,0,UFO.rot,0),WHITE,F_NF,0.1);
  for(let k=0;k<24;k++){const a=k*TAU/24+UFO.rot,c=k%3===0?[1,.45,.9]:k%3===1?[.3,.9,1]:[.9,.95,1];queue(UGLOW,at(x+Math.cos(a)*(UFO_R+3.5),y,z+Math.sin(a)*(UFO_R+3.5),0,0,0,4.5,4.5,4.5),[c[0],c[1],c[2],0.22+0.16*Math.sin(t*3+k)],F_ADD);}
  queue(UGLOW,at(x,y+22,z,0,0,0,44,30,44),[.45,.85,1,0.16+0.05*Math.sin(t*2)],F_ADD);
  queue(UGLOW,at(x,y-27,z,0,0,0,34,7,34),[.6,.9,1,0.25+0.08*Math.sin(t*4)],F_ADD);
  const len=y-26,p=0.8+0.2*Math.sin(t*2.5);
  for(const [r,a] of [[UFO_HOLE,0.035],[UFO_HOLE*0.72,0.05],[UFO_HOLE*0.4,0.07]])queue(MESH.tube,at(x,len/2,z,0,0,0,r,len,r),[.65,.92,1,a*p],F_ADD);
}
// ---- the event: arrival, waiting, getting in, leaving ----
function ufoTick(dt){
  const S=save.story;if(S.ufo===4){UFO.on=false;return;} // skipped for good (Kathana's fall)
  if(S.ufo>=1&&S.ufo<=2&&!UFO.on&&!UFO.leaving){UFO.on=true;UFO.y=UFO_Y;UFO.waitT=0;UFO.waitMax=ufoFlier()?60:15;} // it stays across sessions
  if(UFO.on)UFO.rot+=dt*0.04;
  if(!CUT&&state==='play'){if(UFO.leaving)UFO.leaving=false;if(S.ufo===1&&UFO.on&&UFO.y!==UFO_Y)UFO.y=UFO_Y;} // a cutscene cut short (a room opened) leaves the saucer where it belongs
  const free=!zone&&!CUT&&!ASK&&!ZF.phase&&!P.dead&&state==='play';
  if(S.ufo===0&&S.act>=180&&free&&!inSpace()&&!P.car)ufoArrive(false);
  if(S.ufo===2&&free&&!UFO.leaving)ufoLeaveCut(); // item taken but the cutscene never ran (died or left early): play it now
  if(S.ufo===1&&UFO.on&&!zone){
    const want=ufoFlier()?'Fly up into the UFO':hasTrav('webSwing')?'Web the UFO to pull yourself up':'Get up to the UFO';
    if(OBJ.text!==want)objective(want);if(!OBJ.mark||OBJ.mark.label!=='UFO')objectiveMark(UFO.x,UFO.y-26,UFO.z,'UFO');
    if(free){
      if(storyActiveNow())UFO.waitT+=dt;
      if(UFO.waitT>=UFO.waitMax)ufoAsk();
      const dx=P.pos.x-UFO.x,dz=P.pos.z-UFO.z;
      if(dx*dx+dz*dz<UFO_HOLE*UFO_HOLE&&P.pos.y>UFO.y-38&&P.pos.y<UFO.y-12&&!P.dead){P.reel=null;SFX.whoosh();enterZone('ufo');}
    }
  }
}
// the cutscene cameras look up at the saucer from street level, where a tower beside the player would fill the frame (or the camera would sit inside it):
// ufoCamY lifts a camera point to 5 m above the tallest roof within 26 m, so nothing but sky is between it and the saucer
function ufoCamY(x,z,y){
  let top=0;for(const b of nearCols(x,z)){if(b.dead)continue;const dx=Math.max(b.x0-x,0,x-b.x1),dz=Math.max(b.z0-z,0,z-b.z1);if(dx*dx+dz*dz<26*26&&b.y1>top)top=b.y1;}
  return Math.max(y,top+5);
}
// the saucer arrives (the 8 s cutscene); quick skips the cutscene (tests)
function ufoArrive(quick){
  const S=save.story;if(S.ufo===4||(UFO.on&&S.ufo>=1))return;
  S.ufo=1;persist();UFO.on=true;UFO.waitT=0;UFO.waitMax=ufoFlier()?60:15;UFO.x=0;UFO.z=0;
  if(quick||state!=='play'){UFO.y=UFO_Y;return;}
  const ex=P.pos.x,ez=P.pos.z,hx=ex-UFO.x,hz=ez-UFO.z,hl=Math.hypot(hx,hz);let cx=ex,cz=ez;
  if(hl<110){const ux=hl>1?hx/hl:1,uz=hl>1?hz/hl:0;cx=UFO.x+ux*110;cz=UFO.z+uz*110;} // right under it, the camera steps back so it can look up at an angle
  const tx=cx+(UFO.x-cx)*0.22,tz=cz+(UFO.z-cz)*0.22,up=Math.max(ufoCamY(cx,cz,0),ufoCamY(tx,tz,0),ufoCamY((cx+tx)/2,(cz+tz)/2,0)); // one clear height for the whole glide
  const from={x:cx,y:Math.max(P.pos.y+3,up),z:cz},to={x:tx,y:Math.max(P.pos.y+14,up+9),z:tz};
  UFO.y=1100;UFO.leaving=false;
  cutscene({dur:8,text:'Something huge just arrived over Nova Bay',from,to,look:()=>({x:UFO.x,y:UFO.y,z:UFO.z}),fov:62,
    onTick:(k,dt)=>{const e=1-Math.pow(1-k,3);UFO.y=lerp(1100,UFO_Y,e);addShake(0.05*(1-k)+0.02);if(k>0.02&&k<0.04)SFX.tone('sawtooth',50,35,6,0.12);},
    onEnd:()=>{UFO.y=UFO_Y;UFO.waitT=0;flashWhite=Math.max(flashWhite,0.25);SFX.boom(0.6,1.2);addShake(0.4);objective('Fly up into the UFO');objectiveMark(UFO.x,UFO.y-26,UFO.z,'UFO');}});
}
function ufoAsk(){
  if(ASK||CUT||ZF.phase)return;
  askYesNo('Start the story?',hasTrav('webSwing')?'Web the UFO to pull yourself up, or be beamed up now?':'The UFO is waiting. Beam up now?','Beam me up','Not now',()=>{UFO.waitT=0;ufoBeamUp();},()=>{UFO.waitT=0;UFO.waitMax=180;}); // No: ask again after 3 more active minutes
}
// a column of light lifts you for 2 s, then you are inside
function ufoBeamUp(){
  if(P.car)exitCar(true);
  const p={x:P.pos.x,y:P.pos.y,z:P.pos.z};UFO.lift={x:p.x,z:p.z,y0:p.y,t:0};SFX.tone('sine',200,1400,2.2,0.12);
  cutscene({dur:2.4,letterbox:false,from:{x:p.x+9,y:ufoCamY(p.x+9,p.z+9,p.y+3),z:p.z+9},to:{x:p.x+13,y:ufoCamY(p.x+13,p.z+13,p.y+16),z:p.z+13},look:()=>({x:P.pos.x,y:P.pos.y+1.5,z:P.pos.z}),fov:60,
    onTick:(k,dt)=>{UFO.lift.t+=dt;P.pos.y=UFO.lift.y0+k*k*60;for(let i=0;i<3;i++)emit(p.x+rr(-2.5,2.5),P.pos.y+rr(-3,6),p.z+rr(-2.5,2.5),0,rr(8,20),0,0.6,[.7,.92,1],rr(0.5,1),0,0);},
    onEnd:()=>{UFO.lift=null;flashWhite=Math.max(flashWhite,0.5);enterZone('ufo');}});
}
// the way out: back above the city where the saucer hung (heroes that can't fly are set down on the bridge below it)
function ufoReturnPoint(){return ufoFlier()?{x:-80,y:44,z:0,yaw:Math.PI/2,fly:true}:{x:-80,y:0.3,z:0,yaw:Math.PI/2,fly:false};}
function ufoLeave(){if(zone&&zone.id==='ufo'&&!ZF.phase)leaveZone(ufoReturnPoint(),ufoLeaveCut);}
// the saucer flies off into space (5 s), and the event is over
function ufoLeaveCut(){
  const S=save.story;if(UFO.leaving||state!=='play')return;UFO.leaving=true;UFO.on=true;UFO.y=UFO_Y;
  const p={x:P.pos.x,y:ufoCamY(P.pos.x,P.pos.z,P.pos.y+3),z:P.pos.z};
  cutscene({dur:5,from:p,to:{x:p.x,y:p.y+10,z:p.z},look:()=>({x:UFO.x,y:UFO.y,z:UFO.z}),fov:66,
    onTick:(k)=>{UFO.y=UFO_Y+k*k*k*3400;UFO.rot+=k*0.15;addShake(0.04*k);if(k>0.1&&k<0.13)SFX.tone('sawtooth',40,900,3.5,0.1);},
    onEnd:()=>{UFO.on=false;UFO.leaving=false;S.ufo=3;objective(null);objectiveMark(null);flashWhite=Math.max(flashWhite,0.45);persist();toast('The UFO is gone','Nova Bay is quiet again','cyan');}});
}
// ================================================================
// The interior (ZONES.ufo)
// ================================================================
// A 200 x 200 m floor plan on a 2 m grid, local coordinates with the vault at (0,0) and the hangar to the south (+z). Every open rectangle becomes floor and a ceiling
// (its own height), and 4 m thick walls grow around it in panels of up to 8 x 8 m (the panels are what fast flight smashes). The vault and the outer edge are not smashable.
const UF={rooms:[],cleared:0,doorOpen:false,took:false,leaveT:-1,door:null,item:{x:0,y:4.6,z:0},pad:{x:0,z:76},spawnT:0};
const UFZ={x:0,y:0,z:40000};
const UFR=[ // [id, x0, x1, z0, z1, ceiling height, light colour, floor colour]
  ['hangar',-36,36,60,92,32,[.3,.85,1],'#2a3340'],['spine',-6,6,34,60,18,[.5,.55,1],'#1c2230'],['ante',-32,32,18,34,24,[.75,.45,1],'#262033'],
  ['c2',-50,-32,20,32,18,[.45,.55,1],'#1c2230'],['c3',32,50,20,32,18,[.45,.55,1],'#1c2230'],
  ['lab',-92,-50,-20,34,26,[.3,1,.7],'#26373a'],['engine',50,92,-20,34,40,[1,.6,.25],'#33281f'],
  ['c4',-76,-64,-24,-20,18,[.5,.55,1],'#1c2230'],['c5',64,76,-24,-20,18,[.5,.55,1],'#1c2230'],
  ['cells',-92,-44,-68,-24,22,[1,.3,.4],'#2f2326'],['control',44,92,-68,-24,28,[.4,.6,1],'#1f2740'],['c6',-44,44,-52,-40,18,[.5,.55,1],'#1c2230'],
  ['vault',-14,14,-14,14,34,[1,.8,.4],'#3a3220'],['slot',-4,4,14,18,34,[1,.8,.4],'#3a3220'],
];
// the four rooms with aliens: id, how many, where they may appear
const UFROOMS=[['lab',5,-88,-54,-16,30],['engine',7,54,88,-16,30],['cells',4,-88,-48,-48,-28],['control',8,48,88,-64,-28]];
const UFLAB={lab:'Laboratory',engine:'Engine room',cells:'Holding cells',control:'Control deck'};
function ufoZone(){
  const Z=zoneNew({id:'ufo',name:'The UFO',origin:UFZ,spawn:{x:0,y:0,z:80,yaw:0},smash:true,stars:true,sky:[0,0,0.01],
    bounds:{x0:-98,x1:98,z0:-98,z1:98,y1:44},light:{dir:[.25,1,.3],lcol:[.3,.34,.5],sky:[.15,.17,.27],gnd:[.07,.06,.11],fogC:[.02,.02,.05],fog:[50,210]},lights:[],walls:[],
    plan:UFR.filter(r=>r[0]!=='slot').map(r=>[r[1],r[2],r[3],r[4]]),planCol:'#26406e',
    build(){ufoBuild(Z);},enter(){ufoEnter(Z);},leave(){ufoLeaveZone(Z);},update(dt){ufoZoneUpdate(Z,dt);},draw(){ufoZoneDraw(Z);},rebuild(){ufoRebuild(Z);},
    mapMarks(plot,c){for(const a of ualiens){if(!a.alive)continue;const q=plot(a.pos.x,a.pos.z,false);if(!q)continue;c.fillStyle='#ff4d5e';c.beginPath();c.arc(q[0],q[1],5,0,TAU);c.fill();}}});
  return Z;
}
ufoZone();
function ufoBuild(Z){
  const N=100,G=2,I=(x)=>Math.round((x+100)/G),open=new Float32Array(N*N),shell=new Float32Array(N*N),HC=new Float32Array(N*N);
  for(const r of UFR)for(let i=I(r[1]);i<I(r[2]);i++)for(let j=I(r[3]);j<I(r[4]);j++)open[i*N+j]=Math.max(open[i*N+j],r[5]);
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){const h=open[i*N+j];if(!h)continue;for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){const ni=i+a,nj=j+b;if(ni<0||nj<0||ni>=N||nj>=N)continue;if(h>shell[ni*N+nj])shell[ni*N+nj]=h;}}
  for(let k=0;k<N*N;k++)HC[k]=open[k]||shell[k];
  const cxm=i=>-100+i*G,WIN=(i,j)=>{const x=cxm(i)+1,z=cxm(j)+1;return z>92&&Math.abs(x)<=26;}; // the hangar window
  const op=(i,j)=>i>=0&&j>=0&&i<N&&j<N&&open[i*N+j]>0;
  const part=(i,j)=>(op(i-1,j)||op(i-2,j))&&(op(i+1,j)||op(i+2,j))||(op(i,j-1)||op(i,j-2))&&(op(i,j+1)||op(i,j+2)); // a wall with open space on both sides: fast flight can burst through it into the next room
  const smashOK=(i,j)=>{const x=cxm(i)+1,z=cxm(j)+1;return !(Math.abs(x)<=28&&Math.abs(z)<=28)&&part(i,j);}; // (not the vault's walls, and not the hull: that would only lead out into space)
  // floor and room plates
  const FLOOR=hex('#10131a'),CEIL_C=hex('#12151e');
  zoneBox(Z,-100,-3,-100,100,0,100,FLOOR,0,{col:false});
  for(const r of UFR)zoneBox(Z,r[1],-0.02,r[3],r[2],0.04,r[4],hex(r[7]),0,{col:false});
  // ceilings: merge open + shell cells of one height into rectangles
  {const used=new Uint8Array(N*N);
    for(let j=0;j<N;j++)for(let i=0;i<N;i++){const h=HC[i*N+j];if(!h||used[i*N+j])continue;let i1=i;while(i1+1<N&&HC[(i1+1)*N+j]===h&&!used[(i1+1)*N+j])i1++;
      let j1=j;for(;;){const nj=j1+1;if(nj>=N)break;let ok=true;for(let a=i;a<=i1;a++)if(HC[a*N+nj]!==h||used[a*N+nj]){ok=false;break;}if(!ok)break;j1=nj;}
      for(let a=i;a<=i1;a++)for(let b=j;b<=j1;b++)used[a*N+b]=1;
      zoneBox(Z,cxm(i),h,cxm(j),cxm(i1+1),h+3,cxm(j1+1),CEIL_C,0);}}
  // walls: shell cells, merged into panels (max 4 x 4 cells = 8 x 8 m) of equal height and smashability
  {const used=new Uint8Array(N*N);let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    for(let j=0;j<N;j++)for(let i=0;i<N;i++){const k=i*N+j;if(open[k]||!HC[k]||used[k]||WIN(i,j))continue;const h=HC[k],sm=smashOK(i,j);
      const same=(a,b)=>{const q=a*N+b;return !open[q]&&HC[q]===h&&!used[q]&&!WIN(a,b)&&smashOK(a,b)===sm;};
      let i1=i;while(i1+1<N&&i1-i<3&&same(i1+1,j))i1++;
      let j1=j;while(j1+1<N&&j1-j<3){let ok=true;for(let a=i;a<=i1;a++)if(!same(a,j1+1)){ok=false;break;}if(!ok)break;j1++;}
      for(let a=i;a<=i1;a++)for(let b=j;b<=j1;b++)used[a*N+b]=1;
      const v=0.85+rnd()*0.3,col=[.12*v,.14*v,.19*v];
      const w={x0:UFZ.x+cxm(i),x1:UFZ.x+cxm(i1+1),y0:0,y1:h,z0:UFZ.z+cxm(j),z1:UFZ.z+cxm(j1+1),col,mat:0,smash:sm,dead:false};Z.cols.push(w);Z.walls.push(w);}}
  // the hangar window: stars behind glass (wall above and below, an invisible solid pane)
  zoneBox(Z,-26,0,92,26,6,96,hex('#262c3a'),7);zoneBox(Z,-26,24,92,26,32,96,hex('#262c3a'),7);zoneBox(Z,-26,6,93.5,26,24,94.5,[0,0,0],0,{draw:false});
  // strips of light along every room: ceiling edge and floor edge, a centre line down corridors
  for(const r of UFR){if(r[0]==='slot')continue;const [x0,x1,z0,z1,h,c]=[r[1],r[2],r[3],r[4],r[5],r[6]],o={col:false},t=0.25,y=h-1.7;
    zoneBox(Z,x0+.1,y,z0+.1,x1-.1,y+t,z0+.1+t,c,6,o);zoneBox(Z,x0+.1,y,z1-.1-t,x1-.1,y+t,z1-.1,c,6,o);zoneBox(Z,x0+.1,y,z0+.1,x0+.1+t,y+t,z1-.1,c,6,o);zoneBox(Z,x1-.1-t,y,z0+.1,x1-.1,y+t,z1-.1,c,6,o);
    const d=[c[0]*.45,c[1]*.45,c[2]*.45];zoneBox(Z,x0+.1,.3,z0+.1,x1-.1,.5,z0+.3,d,6,o);zoneBox(Z,x0+.1,.3,z1-.3,x1-.1,.5,z1-.1,d,6,o);zoneBox(Z,x0+.1,.3,z0+.1,x0+.3,.5,z1-.1,d,6,o);zoneBox(Z,x1-.3,.3,z0+.1,x1-.1,.5,z1-.1,d,6,o);
    const long=(x1-x0)>(z1-z0),cc=/^c\d$/.test(r[0])||r[0]==='spine';
    if(cc){if(long)zoneBox(Z,x0+1,h-.35,(z0+z1)/2-.4,x1-1,h,(z0+z1)/2+.4,c,6,o);else zoneBox(Z,(x0+x1)/2-.4,h-.35,z0+1,(x0+x1)/2+.4,h,z1-1,c,6,o);}
    else for(let x=x0+8;x<x1-4;x+=14)for(let z=z0+8;z<z1-4;z+=14)zoneBox(Z,x-2,h-.3,z-2,x+2,h,z+2,[.8,.9,1],6,o); // ceiling lamps in the big rooms
    // point lights: along corridors every 14 m, a grid in rooms
    if(cc){for(let k=0,n=Math.max(1,Math.round(Math.max(x1-x0,z1-z0)/14));k<n;k++){const f=(k+.5)/n;Z.lights.push({x:UFZ.x+(long?x0+(x1-x0)*f:(x0+x1)/2),y:h-3,z:UFZ.z+(long?(z0+z1)/2:z0+(z1-z0)*f),r:26,c:c,k:.7});}}
    else for(let x=x0+(x1-x0)/4;x<x1-1;x+=(x1-x0)/2)for(let z=z0+(z1-z0)/4;z<z1-1;z+=(z1-z0)/2)Z.lights.push({x:UFZ.x+x,y:h-4,z:UFZ.z+z,r:Math.max(30,(x1-x0)*0.55),c:c,k:.9});
  }
  // ---- hangar: a landing pad and two docked shuttles ----
  for(const sd of [-1,1]){const x=sd*24;zoneBox(Z,x-8,0,66,x+8,3.5,82,hex('#5a6270'),7);zoneBox(Z,x-5,3.5,69,x+5,6,79,hex('#7b8594'),7);zoneBox(Z,x-4,3,82,x+4,5,86,hex('#4a5260'),7);
    zoneBox(Z,x-6,2.2,82.2,x+6,2.6,82.6,[.3,.9,1],6,{col:false});zoneBox(Z,x-3,4.2,66,x+3,5,66.3,[.3,.9,1],6,{col:false});}
  zoneBox(Z,-7,.05,69,7,.12,83,hex('#3b4352'),0,{col:false});
  // ---- lab: stasis tubes and tables ----
  for(const x of [-84,-76,-68,-60])for(const z of [-8,24]){zoneBox(Z,x-2.2,0,z-2.2,x+2.2,1,z+2.2,hex('#505866'),7);zoneBox(Z,x-2.2,9,z-2.2,x+2.2,10,z+2.2,hex('#505866'),7,{col:false});
    const b=Z.cols[Z.cols.length-1];b.y1=10;}
  for(const z of [4,10,16]){zoneBox(Z,-72,0,z-1.2,-66,1.1,z+1.2,hex('#6b7686'),7);zoneBox(Z,-71,1.1,z-.9,-67,1.2,z+.9,[.3,1,.8],6,{col:false});}
  // ---- engine room: a core on a base, pipes up the walls ----
  zoneBox(Z,64,0,0,78,3,14,hex('#4a4038'),7);for(const [x,z] of [[54,-16],[88,-16],[54,30],[88,30]])zoneBox(Z,x-1.5,0,z-1.5,x+1.5,40,z+1.5,hex('#5a4a3a'),7);
  for(const z of [-10,6,22])zoneBox(Z,86,2,z,88.4,4,z+1.2,[1,.55,.2],6,{col:false});
  // ---- holding cells: dividers and glowing bars ----
  for(const x of [-80,-68,-56])zoneBox(Z,x-.4,0,-68,x+.4,8,-52,hex('#3a3236'),7);
  for(const x of [-86,-74,-62,-50])for(let b=-3;b<=3;b++)zoneBox(Z,x+b*1.7-.12,0,-52.3,x+b*1.7+.12,8,-52,[1,.3,.4],6,{col:false});
  zoneBox(Z,-92,7.8,-52.5,-44,8.4,-51.9,[1,.3,.4],6,{col:false});
  // ---- control deck: consoles, a big screen, a holo table ----
  for(const x of [50,58,66,74,82])zoneBox(Z,x-3.5,0,-64,x+3.5,2.2,-60.5,hex('#3b4766'),7);for(const x of [50,58,66,74,82])zoneBox(Z,x-3,2.2,-63.6,x+3,3.4,-61.2,[.4,.7,1],6,{col:false});
  zoneBox(Z,50,8,-67.8,86,22,-67.5,[.2,.4,.8],6,{col:false});for(let k=0;k<5;k++)zoneBox(Z,52,10+k*2.4,-67.4,52+10+((k*37)%20),11+k*2.4,-67.3,[.8,.95,1],6,{col:false});
  zoneBox(Z,62,0,-50,74,1.2,-38,hex('#3b4766'),7);zoneBox(Z,64,1.2,-48,72,1.5,-40,[.4,.7,1],6,{col:false});
  // ---- vault: a pedestal under a ring of gold light ----
  zoneBox(Z,-2.4,0,-2.4,2.4,2.2,2.4,hex('#8a7440'),7);zoneBox(Z,-3.2,.05,-3.2,3.2,.2,3.2,[1,.8,.4],6,{col:false});zoneBox(Z,-3.8,.05,-3.8,3.8,.15,-3.4,[1,.8,.4],6,{col:false});
  for(const [x,z] of [[-12,-12],[12,-12],[-12,12],[12,12]])zoneBox(Z,x-.6,0,z-.6,x+.6,34,z+.6,[1,.8,.4],6,{col:false});
  Z.lights.push({x:UFZ.x,y:UFZ.y+6,z:UFZ.z,r:30,c:[1,.8,.4],k:1.2});
  // ---- the vault door: fills the slot between the antechamber and the vault, opens when the rooms are cleared ----
  UF.door={x0:UFZ.x-4,x1:UFZ.x+4,y0:0,y1:34,z0:UFZ.z+14,z1:UFZ.z+18,col:hex('#8a7436'),mat:0,smash:false,dead:false,door:true};Z.cols.push(UF.door);Z.walls.push(UF.door);
  zoneBake(Z);ufoRebuild(Z);
}
// the walls and the door are redrawn without whatever has been smashed or opened
function ufoRebuild(Z){
  const g=new Geo();for(const b of Z.walls){if(b.dead)continue;g.box(b.x0,b.y0,b.z0,b.x1,b.y1,b.z1,b.col,b.mat);}
  const d=UF.door;if(d&&!d.dead){for(const x of [-3,3])g.box(d.x0+4+x-.3,3,d.z1-.05,d.x0+4+x+.3,31,d.z1+.1,[1,.8,.4],6);g.box(d.x0+1,15.5,d.z1-.05,d.x1-1,16.5,d.z1+.12,[1,.8,.4],6);}
  if(Z.mesh2)freeMesh(Z.mesh2);Z.mesh2=g.idx.length?g.mesh():null;
}
// ---- entering, leaving, the rooms ----
function ufoEnter(Z){
  clearAliens();
  for(const b of Z.walls)b.dead=false;Z.dirty=false;ufoRebuild(Z);
  UF.rooms=UFROOMS.map(r=>({id:r[0],n:r[1],x0:r[2],x1:r[3],z0:r[4],z1:r[5],active:false,pending:0,alive:0,cleared:false,spawnT:0}));
  UF.cleared=0;UF.doorOpen=false;UF.took=save.story.ufo>=2;UF.leaveT=-1;UF.spawnT=0;
  const it=ufoItem();objective('Find the '+it.name);objectiveMark(UFZ.x,UFZ.y+8,UFZ.z+22,'Vault');
  toast('Inside the UFO','Find the '+it.name+' · fly fast to smash through walls','cyan');
}
function ufoLeaveZone(Z){clearAliens();objective(null);objectiveMark(null);}
function ufoOpenVault(Z){
  UF.doorOpen=true;UF.door.dead=true;Z.dirty=true;
  const d=UF.door,x=(d.x0+d.x1)/2,z=(d.z0+d.z1)/2;burst(x,10,z,60,22,1.2,[[1,.85,.4],[1,1,1]],1.6,0,2);ringFx(x,8,z,1,16,0.6,[1,.85,.4],[0,0,1]);SFX.boom(0.7,1.1);SFX.chime();addShake(0.5);
  toast('The vault door opens','Something glows inside','gold');const it=ufoItem();objective('Find the '+it.name);objectiveMark(UFZ.x+UF.item.x,UFZ.y+UF.item.y+1,UFZ.z+UF.item.z,it.name);
}
function ufoPickItem(){
  if(UF.took)return;UF.took=true;const S=save.story,id=ufoHero(),it=ufoItem();S.item=id;S.ufo=2;persist();
  ufoReward(id);toast('You found the '+it.name,it.desc,'gold');SFX.chime();SFX.levelUp();flashWhite=Math.max(flashWhite,0.5);
  const c=UF.item,x=UFZ.x+c.x,y=UFZ.y+c.y,z=UFZ.z+c.z;burst(x,y,z,90,26,1.4,[it.col,[1,1,1]],1.8,0,2);ringFx(x,y,z,1,24,0.8,it.col);ringFx(x,y,z,1,16,0.6,[1,1,1]);
  objective('Leave the UFO');objectiveMark(UFZ.x+UF.pad.x,UFZ.y+2,UFZ.z+UF.pad.z,'Exit');UF.leaveT=4; // out through the hangar, or the UFO beams you out after 4 s
}
// test hook: teleport to the pedestal and take the item
function ufoTakeItem(){
  if(!zone||zone.id!=='ufo')return false;if(!UF.doorOpen)ufoOpenVault(zone);
  P.pos.set(UFZ.x+UF.item.x,UFZ.y,UFZ.z+UF.item.z+1.5);P.vel.set(0,0,0);ufoPickItem();return true;
}
function ufoAliveCount(){let n=0;for(const a of ualiens)if(a.alive)n++;return n;}
function ufoZoneUpdate(Z,dt){
  const px=P.pos.x-UFZ.x,pz=P.pos.z-UFZ.z;
  for(const rm of UF.rooms){
    if(!rm.active&&px>rm.x0-3&&px<rm.x1+3&&pz>rm.z0-3&&pz<rm.z1+3&&Math.abs(P.pos.y-UFZ.y)<10){rm.active=true;rm.pending=rm.n;toast(UFLAB[rm.id],'Aliens!','red');} // the player walks into the room: its aliens come out, a few at a time
    if(rm.active&&rm.pending>0&&ufoAliveCount()<16){rm.spawnT-=dt;if(rm.spawnT<=0){rm.spawnT=0.4;ufoSpawnIn(rm);}}
    if(rm.active&&!rm.cleared&&rm.pending===0&&rm.alive===0){rm.cleared=true;UF.cleared++;toast(UFLAB[rm.id]+' secured',UF.cleared+' of 4 rooms cleared','cyan');SFX.chime();
      if(UF.cleared>=4)ufoOpenVault(Z);else objective('Find the '+ufoItem().name+' · rooms cleared '+UF.cleared+'/4');}
  }
  for(const a of ualiens.slice())ualienUpdate(a,dt);
  if(!P.dead&&!UF.took&&UF.doorOpen&&Math.hypot(px-UF.item.x,P.pos.y+1.3-UFZ.y-UF.item.y,pz-UF.item.z)<3.2)ufoPickItem();
  if(UF.leaveT>=0){UF.leaveT-=dt;if(UF.leaveT<=0||Math.hypot(px-UF.pad.x,pz-UF.pad.z)<7){UF.leaveT=-1;ufoLeave();}}
  if(Math.random()<dt*3)emit(UFZ.x+71+rr(-1,1),UFZ.y+rr(2,30),UFZ.z+7+rr(-1,1),rr(-3,3),rr(2,8),rr(-3,3),0.8,[1,.6,.25],rr(0.8,1.4),0,0.5); // the engine room's core spits sparks
}
function ufoSpawnIn(rm){
  for(let t=0;t<12;t++){const x=UFZ.x+rr(rm.x0,rm.x1),z=UFZ.z+rr(rm.z0,rm.z1),hover=Math.random()<0.3;
    if(Math.hypot(x-P.pos.x,z-P.pos.z)<10||inBuilding(x,1,z,1.4)||inBuilding(x,2.4,z,1.2))continue;
    const a=ualienSpawn(rm,x,z,hover);rm.pending--;rm.alive++;burst(x,a.pos.y+1.2,z,20,8,0.6,[[.5,1,.6],[1,1,1]],1.2,0,2);ringFx(x,a.pos.y+0.1,z,0.5,3,0.4,[.5,1,.6]);return;}
}
function clearAliens(){for(const a of ualiens.slice())removeActor(a);ualiens.length=0;}
// ================================================================
// Aliens: grey-green humanoids with big heads and dark eyes (kind 'alien'), some hover
// ================================================================
const ualiens=[];
const UAC={skin:c4('#8fae88'),hov:c4('#86aaa8'),suit:[.06,.07,.1,1],suit2:[.11,.13,.19,1],eye:[.008,.01,.016,1]};
const UARAG={torso:UAC.suit,arms:UAC.skin,hands:UAC.skin,skin:UAC.skin,head:UAC.skin,legs:UAC.suit2};
function ualienSpawn(rm,x,z,hover){
  const lvl=save.level,hp=70+8*lvl;
  const a={kind:'alien',faction:'alien',zid:'ufo',name:'Alien',room:rm,alive:true,hp,maxHp:hp,pos:new V3(x,hover?2.2:0,z),vel:new V3(),yaw:rr(0,TAU),heroYaw:rr(-3,3),hover,
    flash:0,stun:0,slow:0,slowT:0,burn:0,burnDps:0,held:false,thrown:null,cy:hover?2.4:1.15,radius:0.75,ys:0.62,home:{x,z},phase:rr(0,TAU),bob:rr(0,TAU),aggro:false,los:false,scanT:rr(0,0.4),fireT:rr(1.2,2.6),meleeT:0,castT:-9,
    lastHit:-99,deadT:0,rx:0,gunner:Math.random()<0.4,wander:{x,z,t:0},target:null,grudge:null,grudgeT:-99};
  a.onHit=src=>{if(src===P)a.aggro=true;for(const o of ualiens)if(o.alive&&o.room===a.room&&Math.hypot(o.pos.x-a.pos.x,o.pos.z-a.pos.z)<25)o.aggro=true;}; // a hit wakes the neighbours
  a.onDefeat=()=>{a.rm0=a.room;if(a.room)a.room.alive--;burst(a.pos.x,a.pos.y+1.2,a.pos.z,30,12,0.7,[[.5,1,.6],[.8,1,.8],[.3,.6,.4]],1.4,-3,1.5);SFX.tone('sawtooth',500,90,0.35,0.08*SFX.vol(a.pos.x,a.pos.y,a.pos.z));
    if(a.vel.y<2&&!a.hover)a.vel.y=4;};
  actors.push(a);ualiens.push(a);return a;
}
function ualienUpdate(a,dt){
  a.flash=Math.max(0,a.flash-dt*5);if(a.slowT>0){a.slowT-=dt;if(a.slowT<=0)a.slow=0;}
  if(a.burn>0&&a.alive){a.burn-=dt;Damage.apply(a.burnSrc,a,a.burnDps*dt,'burn');}
  if(a.held)return;
  const live=a.alive&&!(a.stun>0)&&!a.thrown,sk=1-(a.slow||0);
  // ---- the mind ----
  if(live){
    const valid=!P.dead&&state==='play'&&!cutLocked(),dx=P.pos.x-a.pos.x,dz=P.pos.z-a.pos.z,dy=P.pos.y+1.3-(a.pos.y+a.cy),d=Math.hypot(dx,dz),d3=Math.hypot(dx,dy,dz);
    a.scanT-=dt;if(a.scanT<=0){a.scanT=0.35;a.los=valid&&d3<75&&losClear(a.pos.x,a.pos.y+a.cy,a.pos.z,P.pos.x,P.pos.y+1.3,P.pos.z);if(a.los&&d3<45)a.aggro=true;if(d3>110)a.aggro=false;}
    let wx=0,wz=0,wy=a.hover?a.vel.y:0;
    if(valid&&a.aggro){
      a.heroYaw=angLerp(a.heroYaw,Math.atan2(dx,dz),damp(8,dt));
      const want=a.hover?13:a.gunner?15:2,sp=(a.hover?9:a.gunner?7:9.5)*sk,ux=dx/(d||1),uz=dz/(d||1);
      if(d>want+3){wx=ux*sp;wz=uz*sp;}else if(a.hover||a.gunner){if(d<want-5){wx=-ux*sp*0.7;wz=-uz*sp*0.7;}const s=Math.sin(time*0.9+a.bob)>0?1:-1;wx+=-uz*s*sp*0.55;wz+=ux*s*sp*0.55;}else{wx=ux*sp*0.3;wz=uz*sp*0.3;}
      if(a.hover){const ty=P.pos.y+3.8+Math.sin(time*1.3+a.bob)*1.2;wy=clamp((ty-a.pos.y)*1.6,-8,8);}
      a.fireT-=dt;if(a.fireT<=0&&d3<58&&a.los){a.fireT=a.hover?rr(0.9,1.7):a.gunner?rr(1.1,2):rr(1.8,3);if(d>5||a.gunner||a.hover)ualienShoot(a,d3);}
      a.meleeT-=dt;if(!a.hover&&d<2.4&&Math.abs(dy)<2.6&&a.meleeT<=0){a.meleeT=1;a.castT=time;Damage.apply(a,P,10+0.1*save.level,'punch',{knock:7});SFX.punch(0.5*SFX.vol(a.pos.x,a.pos.y,a.pos.z));}
    }else{ // at rest: drift about the spot it spawned at
      a.wander.t-=dt;if(a.wander.t<=0){a.wander.t=rr(2,5);a.wander.x=a.home.x+rr(-6,6);a.wander.z=a.home.z+rr(-6,6);}
      const ex=a.wander.x-a.pos.x,ez=a.wander.z-a.pos.z,l=Math.hypot(ex,ez);if(l>1){wx=ex/l*2.2;wz=ez/l*2.2;a.heroYaw=angLerp(a.heroYaw,Math.atan2(ex,ez),damp(4,dt));}
      if(a.hover)wy=clamp((2.4+Math.sin(time*1.2+a.bob)*0.5-a.pos.y)*1.5,-3,3);
    }
    const k=damp(a.hover?2.5:6,dt);a.vel.x+=(wx-a.vel.x)*k;a.vel.z+=(wz-a.vel.z)*k;if(a.hover)a.vel.y+=(wy-a.vel.y)*damp(3,dt);
    a.phase+=Math.hypot(a.vel.x,a.vel.z)*dt*1.6;
  }
  // ---- the body ----
  const prevY=a.pos.y;
  if(!(a.hover&&live))a.vel.y-=34*dt; // hovering ones float while they are up and fighting
  const pv=[a.vel.x,a.vel.y,a.vel.z];a.pos.addS(a.vel,dt);const col=collideBody(a.pos,a.vel,prevY,0.6,a.hover?3:2.3);
  const flung=a.flungT&&time-a.flungT<2.5,spd=flung?Math.hypot(pv[0],pv[1],pv[2]):0;
  if(flung){flungSweep(a,spd);if(col.wall&&spd>COMBAT.slamMin)slamWall(a,col.wall,spd,pv);else if(col.grounded&&-pv[1]>COMBAT.slamMin)slamGround(a,-pv[1]);}
  if(col.grounded){const f=Math.pow(0.82,dt*60);a.vel.x*=f;a.vel.z*=f;}
  if(a.stun>0)a.stun-=dt;
  if(a.pos.y<-5)a.pos.y=0;
  // others and the player: keep a little room
  for(const o of ualiens){if(o===a||!o.alive||!a.alive)continue;const ox=a.pos.x-o.pos.x,oz=a.pos.z-o.pos.z,l=Math.hypot(ox,oz);if(l<1.4&&l>0.01){a.pos.x+=ox/l*(1.4-l)*0.4;a.pos.z+=oz/l*(1.4-l)*0.4;}}
  if(a.alive&&!P.dead){const ox=a.pos.x-P.pos.x,oz=a.pos.z-P.pos.z,l=Math.hypot(ox,oz);if(l<1.3&&l>0.01&&Math.abs(a.pos.y-P.pos.y)<2){a.pos.x+=ox/l*(1.3-l)*0.5;a.pos.z+=oz/l*(1.3-l)*0.5;}}
  if(!a.alive){a.deadT+=dt;a.rx=lerp(a.rx,Math.PI/2,damp(6,dt));if(a.deadT>5){removeActor(a);removeFrom(ualiens,a);}}
}
function ualienShoot(a,d3){
  const o={x:a.pos.x+Math.sin(a.heroYaw)*0.5,y:a.pos.y+a.cy+0.1,z:a.pos.z+Math.cos(a.heroYaw)*0.5},tv=P.vel,lead=d3/50*0.5,v=dirTo(o,P.pos.x+tv.x*lead+rr(-1.2,1.2),P.pos.y+1.3+tv.y*lead*0.5+rr(-0.8,0.8),P.pos.z+tv.z*lead+rr(-1.2,1.2));
  fireProj({kind:'plasma',owner:a,x:o.x,y:o.y,z:o.z,vx:v[0]*48,vy:v[1]*48,vz:v[2]*48,dmg:6+0.12*save.level,r:0.5,life:2.6,knock:6});a.castT=time;
  SFX.tone('square',420,1000,0.12,0.05*SFX.vol(o.x,o.y,o.z));
}
function ualienDraw(a){
  if(inView(a.pos.x,a.pos.z,160,30)<0)return;
  if(a.rag){drawRagdoll(a,UARAG);return;}
  const sk=a.hover?UAC.hov:UAC.skin,fl=a.flash*0.6,t=time,mv=Math.min(Math.hypot(a.vel.x,a.vel.z)/6,1),sw=Math.sin(a.phase)*mv*0.7,bob=a.hover?0.9+Math.sin(t*2.2+a.bob)*0.15:0;
  const root=at(a.pos.x,a.pos.y+bob,a.pos.z,a.rx,a.heroYaw,0),b=child(root,0,0.98,0,a.alive&&mv>0.2?0.06:0,0,0);
  queue(MESH.box,child(b,0,0.28,0,0,0,0,0.36,0.5,0.22),UAC.suit,F_SH,fl);queue(MESH.box,child(b,0,0.0,0,0,0,0,0.3,0.16,0.2),UAC.suit2,0,fl);
  queue(MESH.glowBox,child(b,0,0.32,0.115,0,0,Math.PI/4,0.1,0.1,0.02),[.15,.55,.35,1],0);
  queue(MESH.box,child(b,0,0.6,0,0,0,0,0.07,0.12,0.07),sk,0,fl);
  const hd=child(b,0,0.9,0.02);
  queue(MESH.sphere,child(hd,0,0,0,0,0,0,0.17,0.22,0.19),sk,F_SH,fl);queue(MESH.sphere,child(hd,0,-0.19,0.05,0,0,0,0.1,0.1,0.1),sk,0,fl);
  for(const s of [-1,1]){queue(MESH.sphere,child(hd,s*0.082,-0.01,0.15,0,0,s*0.55,0.058,0.1,0.04),UAC.eye,0,0);queue(MESH.glowBox,child(hd,s*0.075,0.025,0.185,0,0,0,0.012,0.012,0.006),[.6,1,.9,1],0);}
  const aim=t-a.castT<0.35;
  for(const s of [-1,1]){const ax=aim&&s>0?-1.55:-s*sw*0.9,sh=child(b,s*0.24,0.5,0,ax,0,s*0.1);
    queue(MESH.box,child(sh,0,-0.16,0,0,0,0,0.07,0.32,0.07),sk,0,fl);const eb=child(sh,0,-0.32,0,aim&&s>0?0:-0.3,0,0);queue(MESH.box,child(eb,0,-0.16,0,0,0,0,0.06,0.32,0.06),sk,0,fl);queue(MESH.box,child(eb,0,-0.35,0,0,0,0,0.07,0.1,0.05),sk,0,fl);
    if(aim&&s>0)queue(MESH.glowSphere,child(eb,0,-0.5,0.05,0,0,0,0.16,0.16,0.16),[.5,1,.5,0.9],0);
    const hp=child(b,s*0.1,-0.08,0,a.hover?0.25:s*sw,0,0);queue(MESH.box,child(hp,0,-0.24,0,0,0,0,0.1,0.48,0.11),UAC.suit2,0,fl);const kn=child(hp,0,-0.48,0,a.hover?0.5:Math.max(0,-s*Math.sin(a.phase))*mv*0.8,0,0);
    queue(MESH.box,child(kn,0,-0.22,0,0,0,0,0.09,0.44,0.1),sk,0,fl);queue(MESH.box,child(kn,0,-0.46,0.05,0,0,0,0.1,0.06,0.2),UAC.suit,0,fl);}
  if(a.hover&&a.alive){queue(MESH.glowCyl,at(a.pos.x,a.pos.y+0.12,a.pos.z,0,0,0,0.7,0.06,0.7),[.4,.9,1,0.5+0.2*Math.sin(t*9)],F_ADD);queue(MESH.glowSphere,at(a.pos.x,a.pos.y+0.1,a.pos.z,0,0,0,1.4,0.3,1.4),[.3,.8,1,0.25],F_ADD);}
}
// ---- the zone's moving parts ----
function ufoZoneDraw(Z){
  const t=time,o=UFZ;
  for(const a of ualiens)ualienDraw(a);
  // hangar: the window, the pad
  queue(MESH.box,at(o.x,o.y+15,o.z+93.3,0,0,0,52,18,0.3),[.35,.6,1,0.1],F_BL);
  queue(MESH.ring,at(o.x+UF.pad.x,o.y+0.1,o.z+UF.pad.z,0,0,0,8,1,8),[.3,.9,1,0.9],F_ADD);queue(MESH.ring,at(o.x+UF.pad.x,o.y+0.12,o.z+UF.pad.z,0,-t*0.6,0,5+Math.sin(t*2)*0.4,1,5+Math.sin(t*2)*0.4),[.5,1,1,0.7],F_ADD);
  // lab: tubes of green liquid
  for(const x of [-84,-76,-68,-60])for(const z of [-8,24]){queue(MESH.cyl,at(o.x+x,o.y+5.5,o.z+z,0,0,0,1.9,8,1.9),[.5,1,.8,0.2],F_BL);queue(MESH.glowCyl,at(o.x+x,o.y+5.5,o.z+z,0,0,0,1.2,7.6,1.2),[.3,1,.6,0.28+0.08*Math.sin(t*2+x)],F_ADD);
    queue(MESH.glowSphere,at(o.x+x,o.y+3+Math.sin(t*1.3+x+z)*1.4,o.z+z,0,0,0,0.3,0.3,0.3),[.6,1,.8,0.6],F_ADD);}
  // engine room: the core and its rings
  {const p=0.75+0.25*Math.sin(t*3);queue(MESH.glowCyl,at(o.x+71,o.y+20,o.z+7,0,0,0,3.4,32,3.4),[1,.5,.15,0.3*p],F_ADD);queue(MESH.glowCyl,at(o.x+71,o.y+20,o.z+7,0,0,0,1.5,36,1.5),[1,.8,.45,0.55],F_ADD);
    for(let k=0;k<4;k++)queue(MESH.ring,at(o.x+71,o.y+6+k*8+Math.sin(t*1.5+k)*1.2,o.z+7,0,t*(k%2?1:-1)*0.8,0,6+k*0.4,1,6+k*0.4),[1,.7,.3,0.8],F_ADD);queue(MESH.glowSphere,at(o.x+71,o.y+14,o.z+7,0,0,0,10,14,10),[1,.5,.15,0.1],F_ADD);}
  // control deck: the holo table
  queue(MESH.glowCyl,at(o.x+68,o.y+4,o.z-44,0,0,0,3.2,5,3.2),[.4,.8,1,0.14+0.05*Math.sin(t*4)],F_ADD);queue(MESH.ring,at(o.x+68,o.y+1.6,o.z-44,0,t*0.9,0,4.5,1,4.5),[.5,.85,1,0.9],F_ADD);
  queue(MESH.glowSphere,at(o.x+68,o.y+4.6+Math.sin(t*1.7)*0.4,o.z-44,0,t,0,1.1,1.1,1.1),[.6,.9,1,0.5],F_ADD);
  // the four lamps over the vault door: red until a room is cleared
  for(let k=0;k<4;k++){const done=UF.cleared>k||UF.doorOpen;queue(MESH.glowBox,at(o.x-6+k*4,o.y+19,o.z+18.2,0,0,0,1.6,1.6,0.3),done?[.3,1,.5,1]:[1,.25,.25,0.6+0.4*Math.sin(t*4+k)],0);}
  // the item on its pedestal
  if(UF.doorOpen&&!UF.took){const it=ufoItem(),c=UF.item,y=o.y+c.y+Math.sin(t*2)*0.35;
    queue(MESH.glowSphere,at(o.x+c.x,y,o.z+c.z,t*1.1,t*1.7,0,0.8,0.8,0.8),[it.col[0],it.col[1],it.col[2],1],0);queue(MESH.glowSphere,at(o.x+c.x,y,o.z+c.z,0,0,0,3,3,3),[it.col[0],it.col[1],it.col[2],0.28],F_ADD);
    queue(MESH.ring,at(o.x+c.x,y,o.z+c.z,0.6,t,0,1.8,1,1.8),[it.col[0],it.col[1],it.col[2],0.9],F_ADD);queue(MESH.tube,at(o.x+c.x,o.y+17,o.z+c.z,0,0,0,1.2,30,1.2),[it.col[0],it.col[1],it.col[2],0.12],F_ADD);}
}
