// ================================================================
// Space: fly high enough and you leave the atmosphere; the Moon, the planets and the Sun are out there
// ================================================================
// Anything that flies can keep climbing past the clouds. Above SPACE.y the sky turns black and starry, you stay in
// zero-g flight, and your speed grows with altitude (slowing down again near any surface so you can land).
// Distances are shrunk so a trip to Neptune takes about half a minute at full boost. Planets are solid: land on them.
// Fly back down and you drop through re-entry over the city.
const SPACE={y:900,lim:600000};
const EARTH={name:'Earth',x:0,y:-60003,z:0,r:60000,col:[.07,.2,.42,1]};
const PLANETS=[
  {name:'The Moon',x:18000,y:12000,z:-9000,r:1700,col:[.55,.55,.56,1]},
  {name:'Mercury',x:95000,y:16000,z:85000,r:2400,col:[.5,.46,.42,1]},
  {name:'Venus',x:48000,y:14000,z:52000,r:6000,col:[.85,.72,.45,1]},
  {name:'Mars',x:-62000,y:22000,z:30000,r:3400,col:[.72,.28,.14,1]},
  {name:'Phobos',x:-62000+5200,y:23500,z:30000,r:220,col:[.4,.36,.33,1]},
  {name:'Jupiter',x:-150000,y:30000,z:-60000,r:14000,col:[.78,.62,.45,1],bands:[.62,.42,.3,1]},
  {name:'Europa',x:-150000+24000,y:32000,z:-60000,r:900,col:[.8,.76,.7,1]},
  {name:'Saturn',x:-100000,y:45000,z:170000,r:12000,col:[.86,.76,.52,1],ring:[.8,.72,.55,0.75]},
  {name:'Titan',x:-100000,y:47000,z:170000+30000,r:1100,col:[.8,.6,.3,1]},
  {name:'Uranus',x:60000,y:60000,z:-200000,r:7000,col:[.55,.82,.86,1]},
  {name:'Neptune',x:-220000,y:50000,z:-200000,r:7000,col:[.22,.36,.85,1]},
  {name:'The Sun',x:170000,y:40000,z:170000,r:30000,col:[1,.85,.45,1],sun:true},
];
const PLANET_MESH=primMesh(primSphere(64,40));
const spaceK=y=>smooth(CEIL,SPACE.y,y);   // 0 in the city sky, 1 in space
const inSpace=()=>P.pos.y>SPACE.y;
function nearestBody(){let best=null,bd=1e12;for(const b of PLANETS){const d=Math.hypot(P.pos.x-b.x,P.pos.y-b.y,P.pos.z-b.z)-b.r;if(d<bd){bd=d;best=b;}}return {b:best,d:bd};}
// flight speed multiplier: much faster the higher you are, slower again close to any surface
function spaceSpeedMul(){
  if(P.pos.y<=CEIL)return 1;const nb=nearestBody();
  return Math.max(1,Math.min(1+(P.pos.y-CEIL)/40,90,1+Math.max(0,nb.d)/60,1+(P.pos.y)/60));
}
let spaceMsgT=-99,lastBody=null,wasSpace=false;
function updateSpace(dt){
  if(state!=='play'||P.dead)return;
  const sp=inSpace();
  if(sp&&!wasSpace&&time-spaceMsgT>20){spaceMsgT=time;toast('You made it to space','The Moon and the planets are out there · fly to one and land','cyan');}
  wasSpace=sp;
  if(P.pos.y>CEIL){
    // the planets are solid: land on them (the Sun burns)
    for(const b of PLANETS){const dx=P.pos.x-b.x,dy=P.pos.y+1-b.y,dz=P.pos.z-b.z,d=Math.hypot(dx,dy,dz)||1,min=b.r+(b.sun?800:1.4);
      if(d<min){const nx=dx/d,ny=dy/d,nz=dz/d;P.pos.set(b.x+nx*min,b.y+ny*min-1,b.z+nz*min);const vr=P.vel.x*nx+P.vel.y*ny+P.vel.z*nz;if(vr<0){P.vel.x-=nx*vr;P.vel.y-=ny*vr;P.vel.z-=nz*vr;}
        if(b.sun){if(time-(P.sunT||-9)>0.5){P.sunT=time;Damage.apply(null,P,25,'fire',{burn:{dps:8,time:2}});feed('Too hot','Nobody lands on the Sun');}P.vel.set(nx*400,ny*400,nz*400);}
        else{P.vel.mul(0.8);if(lastBody!==b){lastBody=b;toast('You landed on '+b.name,'Take in the view · fly off whenever you like','cyan');SFX.chime();addXP(50);}}}}
    const nb=nearestBody();if(nb.b&&nb.d<nb.b.r*1.5&&lastBody!==nb.b&&time-(nb.b.seenT||-99)>30){nb.b.seenT=time;feed('Approaching '+nb.b.name,Math.round(nb.d/1000)+' km');}
    if(nb.d>nb.b.r*3)lastBody=null;
  }
  if(!onIsland(P.pos.x,P.pos.z)&&Math.hypot(P.pos.x,P.pos.z)>4000&&P.pos.y<CEIL&&time-(P.seaMsgT||-99)>120){P.seaMsgT=time;feed('Open ocean','Nova Bay is '+Math.round(Math.hypot(P.pos.x,P.pos.z)/1000)+' km away');}
}
function spaceMode(){const nb=nearestBody();return 'Space · '+nb.b.name+' '+(nb.d>1000?Math.round(nb.d/1000)+' km':Math.round(Math.max(0,nb.d))+' m');}
// the Earth below and the planets, only drawn when you are high enough to see them
function drawSpace(){
  if(camPos.y<300)return;
  queue(PLANET_MESH,at(EARTH.x,EARTH.y,EARTH.z,0,0,0,EARTH.r,EARTH.r,EARTH.r),EARTH.col,0);
  for(const b of PLANETS){
    if(b.sun){queue(PLANET_MESH,at(b.x,b.y,b.z,0,0,0,b.r,b.r,b.r),[1.6,1.3,.7,1],F_UN);queue(MESH.glowSphere,at(b.x,b.y,b.z,0,0,0,b.r*1.6,b.r*1.6,b.r*1.6),[1,.75,.35,0.35],F_ADD);continue;}
    queue(PLANET_MESH,at(b.x,b.y,b.z,0,time*0.01,0,b.r,b.r,b.r),b.col,0);
    if(b.bands)for(let i=-2;i<=2;i++){const y=i*0.28,rr_=Math.sqrt(1-y*y)*1.002;queue(PLANET_MESH,at(b.x,b.y+y*b.r,b.z,0,0,0,b.r*rr_,b.r*0.06,b.r*rr_),b.bands,0);}
    if(b.ring){queue(MESH.ring,M4.alignY(tmpM(),b.x,b.y,b.z,0.25,1,0.15,b.r*2.3),b.ring,F_BL);queue(MESH.ring,M4.alignY(tmpM(),b.x,b.y,b.z,0.25,1,0.15,b.r*1.8),[b.ring[0]*0.8,b.ring[1]*0.8,b.ring[2]*0.8,0.6],F_BL);}}
}
// sunlight in space comes from the Sun itself
function spaceLight(){const S=PLANETS[PLANETS.length-1],dx=S.x-camPos.x,dy=S.y-camPos.y,dz=S.z-camPos.z,l=Math.hypot(dx,dy,dz)||1;return [dx/l,dy/l,dz/l];}
