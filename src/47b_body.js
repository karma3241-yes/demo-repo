// ================================================================
// Body mods: Metal Forms weapons, Stretch Strike, Giant Form, and thrown telekinesis slabs
// ================================================================
// Metal Forms: tap to turn to steel, tap again to cycle your hand through weapons,
// hold the key to turn back. Each weapon changes how your punches land.
const METAL_W=[
  {id:'fists',name:'Steel fists',note:'Solid steel punches',dmg:1,reach:0,knock:1},
  {id:'hammer',name:'Hammer arm',note:'Slow, huge knockback',dmg:1.8,reach:0.8,knock:1.7},
  {id:'flail',name:'Spiked flail',note:'Long reach, hits everyone around the target',dmg:1.4,reach:1.8,knock:1.1,area:3.5},
  {id:'blade',name:'Arm blade',note:'Cuts deep, shreds cars',dmg:2.1,reach:0.7,knock:0.8,car:3},
  {id:'shield',name:'Shield arm',note:'Blocks most damage, bash knocks back',dmg:1.1,reach:0,knock:1.5,block:0.6},
];
P.mw=0;P.giantS=1;let metalDownT=-9;
const metalWeapon=()=>P.metal&&hasPower('metalSkin')?METAL_W[P.mw|0]:null;
function metalDown(){metalDownT=time;}
function metalUp(){
  if(!canAct()&&!P.metal)return;const held=time-metalDownT;
  const fx=()=>{ringFx(P.pos.x,P.pos.y+1.3,P.pos.z,1,4,0.3,[.8,.85,.9]);burst(P.pos.x,P.pos.y+1.3,P.pos.z,16,4,0.4,[[.85,.88,.92]],0.8,0,2);};
  if(!P.metal){if(P.en<5){noEnergy('metalForms');return;}P.metal=true;P.mw=0;fx();SFX.tone('sawtooth',300,120,0.3,0.1);feed('Metal Forms','Tap again to change your hand · hold to turn back');return;}
  if(held>0.45){P.metal=false;fx();SFX.tone('sawtooth',500,900,0.3,0.1);return;}
  P.mw=(P.mw+1)%METAL_W.length;const W=METAL_W[P.mw];feed(W.name,W.note);SFX.tone('square',180,90,0.12,0.08);SFX.punch(0.6);
  if(P.hand)burst(P.hand[12],P.hand[13],P.hand[14],14,5,0.3,[[.85,.88,.92],[1,1,1]],0.7,0,2);
}
const bodyPunchMul=()=>{const W=metalWeapon();return (W?W.dmg:1)*(P.giantS>1.05?1+P.giantS:1);};
const bodyReach=()=>{const W=metalWeapon();return (W?W.reach:0)+(hasPower('elasticBody')&&!P.alien?pstat('elasticBody','reach')*0.45:0)+(P.giantS>1.05?(P.giantS-1)*1.6:0);};
// shield arm: most damage bounces off while you are not swinging
function bodyDamageMul(){const W=metalWeapon();return W&&W.block&&time-P.punchT>0.3?1-W.block:1;}
// after a punch lands: the flail catches everyone around the target
function bodyAfterHit(x,y,z,dmg){const W=metalWeapon();if(W&&W.area){areaDamage(x,y,z,W.area,dmg*0.5,P,{knock:12,type:'punch'});burst(x,y,z,14,8,0.3,[[.85,.88,.92]],0.8,0,2);}}
// ---- Stretch Strike ----
const stretches=[];
POWER_FN.stretchStrike=()=>{
  const R=28+pstat('elasticBody','reach')*1.5,t=lockT&&lockT.alive?lockT:aim.actor&&aim.actor.kind!=='prop'&&aim.hitAny?aim.actor:nearestFoe(aim.x,aim.y,aim.z,8);
  if(!t||Math.hypot(t.pos.x-P.pos.x,t.pos.z-P.pos.z)>R){PS.stretchStrike.cd=0;P.en+=POWERS.stretchStrike.energy;feed('Nothing in reach','Stretch Strike reaches '+Math.round(R)+' m');return;}
  faceAim();stretches.push({a:t,t:0,stage:0,dmg:pstat('elasticBody','damage')*strengthMul()});SFX.tone('triangle',200,700,0.25,0.1);
};
// ---- Giant Form ----
POWER_FN.giantForm=()=>{
  if(P.giant){P.giant.t=0;return;}
  const d=pstat('titanGrowth','duration');P.giant={t:d,max:d,s:pstat('titanGrowth','scale')};feed('Giant Form',Math.round(d)+' s · G picks up cars');
  SFX.tone('sawtooth',80,40,0.8,0.15);addShake(0.4);ringFx(P.pos.x,P.pos.y+0.3,P.pos.z,1,12,0.6,[1,.9,.7]);
};
function endGiant(){if(!P.giant)return;P.giant=null;if(P.tk&&P.tk.giant)tkThrow();}
function giantGrab(){
  if(!(P.giantS>1.8)||!canAct())return false;
  if(P.tk&&P.tk.giant){tkThrow();return true;}
  if(P.tk)return false;let best=null,bd=4+P.giantS*2;
  for(const v of vehicles){if(!v.alive||v===P.car)continue;const d=Math.hypot(v.pos.x-P.pos.x,v.pos.z-P.pos.z);if(d<bd&&(v.state==='road'||v.state==='parked')){bd=d;best=v;}}
  if(!best)return false;P.tk={a:best,more:[],sendT:0,giant:true};tkAttach(best);SFX.tone('square',100,60,0.3,0.1);feed('Got it','G throws it where you look');return true;
}
// ---- telekinesis slabs (rubble and pieces of buildings) ----
const slabs=[];
function throwSlab(S,vx,vy,vz,dmg){slabs.push(Object.assign(S,{vx,vy,vz,dmg,t:0,wx:rr(-2,2),wz:rr(-2,2)}));}
function slabImpact(S){
  const r=Math.max(S.sx,S.sz);explode(S.x,S.y,S.z,0.8+r*0.12);areaDamage(S.x,S.y,S.z,r*1.6,S.dmg,P,{knock:30,type:'blast'});hitProps(S.x,S.y,S.z,r,P,24);
  const b=inBuilding(S.x,S.y,S.z,r*0.5);if(b&&b.bld)damageBuilding(b.bld,S.dmg*8,S.x,S.y,S.z,S.vx,S.vz);
  for(let i=0;i<8;i++){const s=r*rr(0.15,0.35);spawnPiece(S.x,S.y+1,S.z,MESH.box,s,s*0.7,s,S.col,rr(-12,12),rr(4,14),rr(-12,12),6);}
  crater(S.x,Math.max(0.05,S.y-S.sy*0.5),S.z,0,1,0,Math.min(6,r*0.8),S.col);
}
function updateBody(dt){
  if(P.giant){P.giant.t-=dt;if(P.giant.t<=0||P.dead||P.alien)endGiant();}
  const want=P.giant?P.giant.s:1;if(Math.abs(P.giantS-want)>0.001){P.giantS=lerp(P.giantS,want,damp(3,dt));if(Math.abs(P.giantS-want)<0.01)P.giantS=want;
    if(!P.alien&&!P.construct){P.radius=0.8*Math.max(1,P.giantS*0.75);P.height=2.7*P.giantS;}}
  if(P.metal&&!hasPower('metalSkin'))P.metal=false;
  for(let i=stretches.length-1;i>=0;i--){const F=stretches[i],a=F.a;F.t+=dt;if(!a.alive||P.dead){stretches.splice(i,1);continue;}
    const c=center(a),dx=P.pos.x-c.x,dz=P.pos.z-c.z,l=Math.hypot(dx,dz)||1;castT=time;
    if(F.stage===0&&F.t>0.15){F.stage=1;Damage.apply(P,a,F.dmg*0.3,'punch',{kv:[dx/l*Math.min(l*1.5,40),24,dz/l*Math.min(l*1.5,40)],stun:1.5});SFX.punch(1);}
    if(F.stage===1&&F.t>0.65){F.stage=2;Damage.apply(P,a,F.dmg,'slam',{kv:[-dx/l*4,-50,-dz/l*4],flung:true,stun:1.2});SFX.whoosh();}
    if(F.t>0.9)stretches.splice(i,1);}
  for(let i=slabs.length-1;i>=0;i--){const S=slabs[i];S.t+=dt;S.vy-=CONFIG.move.gravity*0.8*dt;S.x+=S.vx*dt;S.y+=S.vy*dt;S.z+=S.vz*dt;S.rx+=S.wx*dt;S.rz+=S.wz*dt;
    let hit=S.y-S.sy*0.5<=groundY(S.x,S.z,S.y+1)+0.05||S.t>8||!!inBuilding(S.x,S.y,S.z,0);
    if(!hit)for(const a of actors){if(!a.alive||a===P||a.kind==='prop'||a.held)continue;const c=center(a);if(Math.hypot(c.x-S.x,c.y-S.y,c.z-S.z)<Math.max(S.sx,S.sz)*0.6+(a.radius||1)){hit=true;break;}}
    if(hit){slabs.splice(i,1);if(Math.hypot(S.vx,S.vy,S.vz)>6||S.dmg>60)slabImpact(S);else crater(S.x,Math.max(0.05,S.y-S.sy*0.5),S.z,0,1,0,2,S.col);}}
}
// ---- drawing ----
const STEEL=[.82,.85,.9,1],STEEL2=[.55,.58,.64,1];
function drawBody(){
  for(const S of slabs)queue(MESH.box,at(S.x,S.y,S.z,S.rx,S.ry,S.rz,S.sx,S.sy,S.sz),S.col,F_SH);
  if(P.tk&&P.tk.slab){const S=P.tk.slab;queue(MESH.box,at(S.x,S.y,S.z,S.rx,S.ry,S.rz,S.sx,S.sy,S.sz),S.col,F_SH);const g=Math.max(S.sx,S.sz)*0.9;queue(MESH.glowSphere,at(S.x,S.y,S.z,0,0,0,g,g,g),[.6,.35,1,0.18],F_ADD);}
  for(const F of stretches){const c=center(F.a),h=P.hand?{x:P.hand[12],y:P.hand[13],z:P.hand[14]}:handPoint();queue(MESH.box,M4.beam(tmpM(),h.x,h.y,h.z,c.x,c.y,c.z,0.24),LOOK.cape,F_SH);queue(MESH.sphere,at(c.x,c.y,c.z,0,0,0,0.45,0.45,0.45),LOOK.cape,0);}
  if(state!=='play'||P.dead||P.alien||P.rag||!P.hand)return;
  // stretchy punches reach out
  if(hasPower('elasticBody')&&time-P.punchT<0.14&&!stretches.length){const h=P.hand,r=pstat('elasticBody','reach')*0.45,fx=Math.sin(P.heroYaw),fz=Math.cos(P.heroYaw);
    queue(MESH.box,M4.beam(tmpM(),h[12],h[13],h[14],h[12]+fx*r,h[13],h[14]+fz*r,0.22),LOOK.cape,0);queue(MESH.sphere,at(h[12]+fx*r,h[13],h[14]+fz*r,0,0,0,0.3,0.3,0.3),LOOK.cape,0);}
  const W=metalWeapon();if(!W||W.id==='fists')return;const H=P.hand;
  if(W.id==='hammer'){queue(MESH.mcyl,child(H,0,-0.55,0,0,0,0,0.12,1.1,0.12),STEEL2,F_SH);queue(MESH.mbox,child(H,0,-1.15,0,0,0,0,0.62,0.42,0.42),STEEL,F_SH);}
  else if(W.id==='flail'){const sw=Math.sin(time*7)*0.5,e=child(H,0,-0.2,0,sw,0,0);for(let i=0;i<4;i++)queue(MESH.msphere,child(e,0,-0.25-i*0.28,0,0,0,0,0.07,0.07,0.07),STEEL2,0);
    const B=child(e,0,-1.45,0,time*3,time*2,0);queue(MESH.msphere,child(B,0,0,0,0,0,0,0.42,0.42,0.42),STEEL,F_SH);for(const [a,b] of [[0,0],[1.57,0],[0,1.57],[3.14,0],[-1.57,0],[0,-1.57]])queue(MESH.mbox,child(B,0,0,0,a,0,b,0.08,1.2,0.08),STEEL2,0);}
  else if(W.id==='blade'){queue(MESH.mbox,child(H,0,-0.95,0.05,0,0,0,0.05,1.6,0.24),STEEL,F_SH);queue(MESH.mbox,child(H,0,-0.1,0.05,0,0,0,0.3,0.1,0.3),STEEL2,0);}
  else if(W.id==='shield'){queue(MESH.mcyl,child(H,0,0.25,0.25,Math.PI/2,0,0,0.85,0.07,0.85),STEEL,F_SH);queue(MESH.mcyl,child(H,0,0.25,0.3,Math.PI/2,0,0,0.3,0.08,0.3),STEEL2,0);}
}
