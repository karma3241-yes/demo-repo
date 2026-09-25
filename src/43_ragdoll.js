// ================================================================
// Ragdolls: verlet bodies for anyone launched by a finisher or charged punch
// ================================================================
// 13 points (hips, shoulders, head, elbows, hands, knees, feet) joined by distance
// constraints. The pelvis follows the body's physics position; everything else swings,
// trails and flops on its own, then the body gets up (or stays down) when it lands.
const RAG_PTS=['lh','rh','ls','rs','hd','le','lw','re','rw','lk','lf','rk','rf'];
const RAG_LINKS=[[0,1],[2,3],[0,2],[1,3],[0,3],[1,2],[2,4],[3,4],[2,5],[5,6],[3,7],[7,8],[0,9],[9,10],[1,11],[11,12]];
const ragdolls=[];
function ragPose(a){
  // standing pose around the actor, facing its yaw
  const yaw=a.kind==='human'?a.yaw:(a.heroYaw||0),s=Math.sin(yaw),c=Math.cos(yaw),x=a.pos.x,y=a.pos.y,z=a.pos.z;
  const P3=(lx,ly,lz)=>[x+lx*c+lz*s,y+ly,z-lx*s+lz*c];
  return [P3(-0.14,0.95,0),P3(0.14,0.95,0),P3(-0.26,1.55,0),P3(0.26,1.55,0),P3(0,1.9,0.02),P3(-0.34,1.2,0),P3(-0.36,0.88,0.05),P3(0.34,1.2,0),P3(0.36,0.88,0.05),P3(-0.14,0.5,0.04),P3(-0.14,0.05,0),P3(0.14,0.5,0.04),P3(0.14,0.05,0)];
}
function startRagdoll(a,vx=0,vy=0,vz=0){
  if(!a||a.hidden)return;if(a.rag){a.rag.t=0;a.rag.land=0;return;}
  if(ragdolls.length>=24){const o=ragdolls.shift();if(o.a)o.a.rag=null;}
  const pts=ragPose(a).map(p=>({x:p[0],y:p[1],z:p[2],px:p[0],py:p[1],pz:p[2]}));
  const dt=1/60,spin=Math.hypot(vx,vz)*0.02+1;
  pts.forEach((p,i)=>{const up=p.y-a.pos.y;p.px=p.x-vx*dt+rr(-0.03,0.03)*spin;p.py=p.y-vy*dt-(up-1)*0.02*spin;p.pz=p.z-vz*dt+rr(-0.03,0.03)*spin;});
  const len=RAG_LINKS.map(([i,j])=>Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y,pts[i].z-pts[j].z));
  a.rag={a,pts,len,t:0,land:0};ragdolls.push(a.rag);
}
function ragAir(a){
  if(a===P)return !P.grounded;if(a.kind==='human')return a.air;
  return a.pos.y>groundY(a.pos.x,a.pos.z,a.pos.y+1)+0.6;
}
function updateRagdolls(dt){
  dt=Math.min(dt,1/30);
  for(let n=ragdolls.length-1;n>=0;n--){const R=ragdolls[n],a=R.a;
    const gone=a!==P&&a.kind!=='remote'&&!actors.includes(a)&&!(a.net&&WS.byId.get(a.nid)===a);
    if(gone||(a===P&&P.dead===false&&!P.flungT&&R.t>0.5&&!ragAir(P))){a.rag=null;ragdolls.splice(n,1);continue;}
    R.t+=dt;const air=ragAir(a);if(!air)R.land+=dt;else R.land=0;
    const alive=a.alive!==false&&!(a===P&&P.dead);
    // get up once landed and recovered
    if(a.kind==='remote'&&!(a.flags&FLAG.rag)&&R.t>0.3){a.rag=null;ragdolls.splice(n,1);continue;}
    if(alive&&R.land>(a===P?0.7:1.3)&&(a.kind!=='human'||!a.downed)&&(!a.stun||a.stun<0.3)){a.rag=null;ragdolls.splice(n,1);continue;}
    if(R.t>12&&!alive){a.rag=null;ragdolls.splice(n,1);continue;}
    const pts=R.pts,g=34;
    for(let i=0;i<pts.length;i++){const p=pts[i],vx=(p.x-p.px)*0.99,vy=(p.y-p.py)*0.99,vz=(p.z-p.pz)*0.99;p.px=p.x;p.py=p.y;p.pz=p.z;p.x+=vx;p.y+=vy-g*dt*dt;p.z+=vz;}
    // pelvis follows the body (soft pin): hips move toward the root position
    const tx=a.pos.x,ty=a.pos.y+(air?0.95:0.18),tz=a.pos.z,mx=(pts[0].x+pts[1].x)/2,my=(pts[0].y+pts[1].y)/2,mz=(pts[0].z+pts[1].z)/2,k=air?0.9:0.35;
    for(const i of [0,1]){pts[i].x+=(tx-mx)*k;pts[i].y+=(ty-my)*k;pts[i].z+=(tz-mz)*k;}
    for(let it=0;it<5;it++){
      RAG_LINKS.forEach(([i,j],q)=>{const A=pts[i],B=pts[j],dx=B.x-A.x,dy=B.y-A.y,dz=B.z-A.z,d=Math.hypot(dx,dy,dz)||1e-4,f=(d-R.len[q])/d*0.5;
        A.x+=dx*f;A.y+=dy*f;A.z+=dz*f;B.x-=dx*f;B.y-=dy*f;B.z-=dz*f;});
      for(const p of pts){const gy=groundY(p.x,p.z,p.y+0.5)+0.07;if(p.y<gy){p.y=gy;p.px=lerp(p.px,p.x,0.4);p.pz=lerp(p.pz,p.z,0.4);}}
    }
    for(const p of pts){const b=inBuilding(p.x,p.y,p.z);if(b&&b.y1>p.y+0.3){p.x=p.px;p.z=p.pz;}}
    // keep the ragdoll from drifting away from the body
    const hx=(pts[0].x+pts[1].x)/2,hz=(pts[0].z+pts[1].z)/2;if(Math.hypot(hx-tx,hz-tz)>2.5)for(const p of pts){p.x+=tx-hx;p.z+=tz-hz;p.px+=tx-hx;p.pz+=tz-hz;}
  }
}
// ---- drawing ----
function limb(A,B,w,col,fl,e){queue(MESH.box,M4.beam(tmpM(),A.x,A.y,A.z,B.x,B.y,B.z,w),col,fl,e);}
function drawRagdoll(a,C){
  const p=a.rag.pts,e=(a.flash||0)*0.6,sh=F_SH;
  limb(p[0],p[2],0.3,C.torso,sh,e);limb(p[1],p[3],0.3,C.torso,sh,e);limb(p[2],p[3],0.22,C.torso2||C.torso,sh,e);limb(p[0],p[1],0.24,C.hips||C.legs,sh,e);
  const nk={x:(p[2].x+p[3].x)/2,y:(p[2].y+p[3].y)/2,z:(p[2].z+p[3].z)/2};limb(nk,p[4],0.12,C.skin,0,e);
  queue(MESH.sphere,at(p[4].x,p[4].y,p[4].z,0,0,0,0.2,0.22,0.2),C.head||C.skin,sh,e);
  limb(p[2],p[5],0.14,C.arms,sh,e);limb(p[5],p[6],0.13,C.hands,sh,e);limb(p[3],p[7],0.14,C.arms,sh,e);limb(p[7],p[8],0.13,C.hands,sh,e);
  limb(p[0],p[9],0.2,C.legs,sh,e);limb(p[9],p[10],0.18,C.shins||C.legs,sh,e);limb(p[1],p[11],0.2,C.legs,sh,e);limb(p[11],p[12],0.18,C.shins||C.legs,sh,e);
  if(C.cape){const b={x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2-0.3,z:(p[0].z+p[1].z)/2};limb(nk,b,0.08,C.cape,0,e);}
}
function ragColorsHuman(h){const L=h.look;return {torso:L.shirt,arms:L.shirt,hands:L.skin,skin:L.skin,head:L.hat||L.hair||L.skin,legs:L.pants};}
function ragColorsSuper(m){const suit=m.metal?SILVER:m.suit;return {torso:suit,torso2:m.metal?SILVER2:m.suit2,arms:suit,hands:m.cape,skin:m.metal?SILVER:SKIN_C,head:m.metal?SILVER2:HAIR,legs:suit,shins:m.cape,cape:m.capeOn?m.cape:null};}
