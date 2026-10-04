// ================================================================
// Traversal: physics-based web swinging, web zip, wall running, parkour leaps
// ================================================================
// Swinging: hold right click (or WEB) and the web finds a building above and ahead
// automatically. Keep holding and it chains to the next anchor after each upswing;
// let go (or press Space) at the bottom-to-top of the arc for a speed boost.
// Anyone can wall run: sprint (or fly past fast) into a wall to run up it or along it.
const MOVE={webRange:[90,170],chainAngle:0.7,releaseBoost:1.12,swingJump:16,zipSpeed:75,
  runUp:20,runUpFast:30,runSide:24,runTime:1.5,sideTime:1.8,leapUp:21,leapOut:17,
  // smart anchor: candidate targets (forward m / height m / sideways m) ahead of the player, ideal pick, rope feel
  webFwd:[18,28,40,54],webH:[16,28,42],webLat:[0,8,-8,18,-18],webMaxD:90,webIdealF:34,webIdealH:30,
  reelT:0.45,reelK:0.86,ropeK:12,tetherK:30,groundClear:4.6};
let webHeld=false,webSide=0,chainWait=0,noAnchorT=-9;
const hasWeb=()=>hasPower('webSwing')&&!P.alien;
const webRange=()=>pstat('webSwing','range');
// where the player wants to go (flat): WASD vs the camera, else the current motion, else camera forward
function intentDir(){
  const inF=clamp((keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)+touchIn.y,-1,1),inR=clamp((keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+touchIn.x,-1,1);
  const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);let x=fx*inF+Math.cos(P.yaw)*inR,z=fz*inF-Math.sin(P.yaw)*inR,l=Math.hypot(x,z);
  if(l<0.3){const hs=Math.hypot(P.vel.x,P.vel.z);if(hs>8){x=P.vel.x;z=P.vel.z;l=hs;}else{x=fx;z=fz;l=1;}}
  return [x/l,z/l];
}
// smart anchor: the game picks a building side/edge ahead (the way you want to go), above you, a little to one side
// (alternating with the last one), with a clear line. Never the ground, water or sky. null = nothing to swing from.
function findAnchor(R){
  const [dx,dz]=intentDir(),ox=P.pos.x,oy=P.pos.y+1.6,oz=P.pos.z,mx=Math.min(R,MOVE.webMaxD),px=dz,pz=-dx;let best=null,bs=-1e9;
  for(const fd of MOVE.webFwd)for(const h of MOVE.webH)for(const lat of MOVE.webLat){
    const tx=dx*fd+px*lat,tz=dz*fd+pz*lat,tl=Math.hypot(tx,h,tz),tm=Math.min(mx,tl*1.8),ux=tx/tl,uy=h/tl,uz=tz/tl;
    const t=rayCity(ox,oy,oz,ux,uy,uz,tm);if(t>=tm-0.01||!RAYHIT.b||t<12||RAYHIT.ny>0.5)continue; // first thing the ray meets must be a wall or underside
    const ax=ox+ux*t+RAYHIT.nx*0.2,ay=oy+uy*t+RAYHIT.ny*0.2,az=oz+uz*t+RAYHIT.nz*0.2,ry=ay-P.pos.y;if(ry<8||ry>80)continue;
    const fw=(ax-ox)*dx+(az-oz)*dz,lt=(ax-ox)*px+(az-oz)*pz;if(fw<10)continue;
    const score=-Math.abs(fw-MOVE.webIdealF)*0.6-Math.abs(ry-MOVE.webIdealH)*0.5-Math.abs(Math.abs(lt)-9)*0.35-Math.max(0,Math.abs(lt)-22)*0.8+(webSide&&lt*webSide<0&&Math.abs(lt)>3?6:0)-(t>70?(t-70)*0.3:0);
    if(score>bs){bs=score;best={x:ax,y:ay,z:az,t,side:Math.sign(lt)};}}
  return best;
}
// rope constraint helpers (pure: pos/vel are {x,y,z}; the body hangs from its chest, 1.6 m up)
function ropeD(pos,W){const dx=pos.x-W.x,dy=pos.y+1.6-W.y,dz=pos.z-W.z;return [dx,dy,dz,Math.hypot(dx,dy,dz)||1];}
// keep the rope taut as you close in; shorten (reel in) at most `rate` m/s toward `lo` without ever leaving more than 0.25 m of gap
function ropeLen(pos,W,dt,rate,lo){const d=ropeD(pos,W)[3];
  if(d<W.L)W.L=Math.min(W.L,Math.max(6,(W.L0||0)*0.55,d,W.L-40*dt)); // (not shorter than 55% of the first length, so a flyby never ends in a tiny circle)
  if(rate>0)W.L=Math.min(W.L,Math.max(lo,W.L-rate*dt,d-0.25));}
// velocity constraint: no outward speed along a taut rope (tangential kept); while reeling, ease the inward speed toward `rate`
function ropeVel(pos,vel,W,rate,dt){const q=ropeD(pos,W),d=q[3];if(d<W.L-0.05)return;const ux=q[0]/d,uy=q[1]/d,uz=q[2]/d;let vr=vel.x*ux+vel.y*uy+vel.z*uz;
  if(vr>0){vel.x-=ux*vr;vel.y-=uy*vr;vel.z-=uz*vr;vr=0;}
  if(rate>0&&vr>-rate){const a=(vr+rate)*Math.min(1,5*dt);vel.x-=ux*a;vel.y-=uy*a;vel.z-=uz*a;}}
// soft position fix: a little overshoot is eased back over a few frames (never a snap), then outward velocity is dropped again
function ropePos(pos,vel,W,dt,k){const q=ropeD(pos,W),d=q[3];if(d<=W.L)return;const ux=q[0]/d,uy=q[1]/d,uz=q[2]/d,c=(d-W.L)*Math.min(1,k*dt);
  pos.x-=ux*c;pos.y-=uy*c;pos.z-=uz*c;const vr=vel.x*ux+vel.y*uy+vel.z*uz;if(vr>0){vel.x-=ux*vr;vel.y-=uy*vr;vel.z-=uz*vr;}}
function attachWeb(pt){
  // the rope is exactly as long as the gap: your position never moves; outward speed is turned sideways instead of lost
  const dx=P.pos.x-pt.x,dy=P.pos.y+1.6-pt.y,dz=P.pos.z-pt.z,d=Math.hypot(dx,dy,dz)||1,vr=(P.vel.x*dx+P.vel.y*dy+P.vel.z*dz)/d;
  if(vr>0){P.vel.x-=dx/d*vr;P.vel.y-=dy/d*vr;P.vel.z-=dz/d*vr;const tl=P.vel.len();if(tl>1){const k=vr*0.55/tl;P.vel.x*=1+k;P.vel.y*=1+k;P.vel.z*=1+k;}}
  const L=Math.max(6,d);P.web={x:pt.x,y:pt.y,z:pt.z,L,Lt:Math.min(L,Math.max(8,d*MOVE.reelK)),L0:L,t:time};if(pt.side)webSide=pt.side;
  P.flying=false;P.wall=null;P.wallRun=null;P.charging=false;P.zip=null;
  SFX.tone('triangle',1200,500,0.12,0.08);
}
function webPress(){
  webHeld=true;
  if(!hasWeb()||!canAct())return;
  if(ufoWebReel())return; // the UFO is up there: the web reels you up to it (66d_ufo.js)
  const R=webRange(),h=handPoint();
  // yank a close target (or the locked one) instead of swinging
  // (keep holding to stay webbed on: see tether below)
  const a=aim.actor;
  if(a&&a.kind!=='boss'&&a.kind!=='prop'&&a.kind!=='vehicle'){const c=center(a),d=Math.hypot(c.x-P.pos.x,c.y-P.pos.y,c.z-P.pos.z);
    if(d<(lockT?32:R)){if(!spend(POWERS.webSwing.energy)){noEnergy();return;}
      tracer(h.x,h.y,h.z,c.x,c.y,c.z,[.95,.95,1],0.08,0.2);const dx=P.pos.x-a.pos.x,dz=P.pos.z-a.pos.z,l=Math.hypot(dx,dz)||1;
      Damage.apply(P,a,5,'web',{stun:pstat('webSwing','stun'),kv:a.kind==='human'?[dx/l*Math.min(l,18),7,dz/l*Math.min(l,18)]:null});
      SFX.tone('triangle',1300,500,0.12,0.08);if(a.alive&&!tetherShielded(a))tetherTo(a,d);return;}}
  if(a&&a.kind==='vehicle'&&a.alive){const c=center(a),d=Math.hypot(c.x-P.pos.x,c.y-P.pos.y,c.z-P.pos.z);
    if(d<R*0.6){if(!spend(POWERS.webSwing.energy)){noEnergy();return;}tetherTo(a,d);SFX.tone('triangle',1100,500,0.12,0.08);return;}}
  // Zip style (V wheel): right click pulls you straight to where you aim instead of swinging
  if(hasTrav('webSwing')&&travStyle('webSwing')==='zip'){if(!webZip(true)){PS.webSwing.flash=0.3;feed('Nothing to zip to','Aim at a wall or rooftop within '+Math.round(R*0.8)+' m');}return;}
  // the game picks the anchor (you only steer): a building ahead in the direction you want to go
  const pt=findAnchor(R)||skyAnchor(); // Graviton Web Gland: in the air a web can hold on to the sky
  if(!pt){if(P.grounded){webHop();return;}if(time-noAnchorT>3){noAnchorT=time;PS.webSwing.flash=0.3;feed('Nothing to swing from','Webs need a building ahead and above you');}return;}
  if(!spend(POWERS.webSwing.energy)){noEnergy();return;}
  if(P.grounded){P.vel.y=Math.max(P.vel.y,17);P.grounded=false;P.pos.y+=0.2;}
  attachWeb(pt);
}
// no building to swing from but you are on the ground: a short web-pull forward and up
function webHop(){
  if(!spend(4)){noEnergy();return;}
  const [dx,dz]=intentDir(),h=handPoint(),tx=P.pos.x+dx*22,tz=P.pos.z+dz*22,ty=groundY(tx,tz,P.pos.y+8)+0.4;
  tracer(h.x,h.y,h.z,tx,ty,tz,[.95,.95,1],0.07,0.25);P.vel.set(dx*22,15,dz*22);P.grounded=false;P.pos.y+=0.2;PS.webSwing.flash=0.3;SFX.whoosh();
  burst(P.pos.x,P.pos.y+0.3,P.pos.z,10,6,0.4,DUST,1,-2,2);
}
// holding the web button after a chain found nothing: keep looking for a moment so you re-attach as soon as a building shows up
function webAssist(){
  if(!webHeld||P.web||P.zip||time>chainWait||!hasWeb()||P.grounded||P.flying||P.wings||P.wall||P.wallRun||P.swim||P.car||!canAct()||time-(P.assistT||-9)<0.1)return;
  P.assistT=time;const pt=findAnchor(webRange());if(pt&&P.en>=POWERS.webSwing.energy*0.5){P.en-=POWERS.webSwing.energy*0.5;chainWait=0;attachWeb(pt);}
}
// ---- web tether: hold right click on someone to stay webbed on; if they run or fly off, you get dragged along ----
function tetherShielded(a){
  if(a.kind==='remote')return !!(a.flags&FLAG.shield)||!!(a.ex&&(a.ex[0]||a.ex[5]));
  return !!(a.shieldOn||a.ringShield);
}
function tetherTo(a,d){const c=center(a);P.web={x:c.x,y:c.y,z:c.z,L:Math.max(4,d*0.95),t:time,target:a};P.flying=false;P.wall=null;P.wallRun=null;P.charging=false;P.zip=null;
  if(a.kind==='human'||a.kind==='rival')feed('Webbed on','Keep holding right click to hang on');}
function tetherTick(W){
  const a=W.target,c=center(a);W.x=c.x;W.y=c.y+0.4;W.z=c.z;
  if(!a.alive||a.hp<=0||(a.kind==='remote'&&a.flags&FLAG.dead)||Math.hypot(c.x-P.pos.x,c.y-P.pos.y,c.z-P.pos.z)>320){P.web=null;return false;}
  if(tetherShielded(a)){P.web=null;const h=handPoint();burst(lerp(h.x,c.x,0.5),lerp(h.y,c.y,0.5),lerp(h.z,c.z,0.5),16,6,0.4,[[.95,.95,1]],1,4,2);SFX.tone('square',900,200,0.15,0.08);feed('Web cut','Their shield sliced through it');return false;}
  // reel in a little while you hold on, so you close the gap
  if(W.L>5&&time-W.t>0.4)W.L=Math.max(5,W.L-4*(1/60));
  return true;
}
function webRelease(boost=true){
  webHeld=false;if(P.reel)reelStop();if(!P.web)return;const W=P.web;P.web=null;if(W.target)boost=false;
  if(boost&&!P.grounded){const hs=Math.hypot(P.vel.x,P.vel.z);
    // best release: moving forward and starting to rise
    const good=P.vel.y>-4&&hs>10;P.vel.x*=good?MOVE.releaseBoost:1.03;P.vel.z*=good?MOVE.releaseBoost:1.03;P.vel.y+=good?7:3;
    if(good&&hs>25)for(let i=0;i<10;i++)emit(P.pos.x,P.pos.y+1.4,P.pos.z,-P.vel.x*0.1+rr(-2,2),rr(-2,2),-P.vel.z*0.1+rr(-2,2),0.4,[.9,.95,1],0.8,0,2);}
  void W;
}
function swingJump(){if(!P.web)return;webRelease(true);P.vel.y+=MOVE.swingJump;SFX.whoosh();}
function swingStep(dt,inF,inR,fwdX,fwdZ,rX,rZ){
  const W=P.web,f=Math.max(pstat('webSwing','force'),PBAL?1.2:0); // CrazyGames: swings start a bit faster than the website's
  if(W.target&&!tetherTick(W))return;
  P.vel.y-=CONFIG.move.gravity*0.9*dt;
  // pendulum: how close to the bottom of the arc (1 = straight below the anchor), input pushes harder there
  const gy=groundY(P.pos.x,P.pos.z,P.pos.y+1),dyA=P.pos.y+1.6-W.y,down=clamp(-dyA/Math.max(W.L,1),0,1);
  let ix=fwdX*inF+rX*inR,iz=fwdZ*inF+rZ*inR;const il=Math.hypot(ix,iz);
  if(il>0.05){const m=Math.min(il,1);ix/=il;iz/=il;const acc=26*f*dt*m*(0.5+0.7*down);P.vel.x+=ix*acc;P.vel.z+=iz*acc;
    // the swing plane turns gradually toward where you want to go (speed kept, nothing fights you)
    const hs=Math.hypot(P.vel.x,P.vel.z);if(hs>6&&!W.target){const vx=P.vel.x/hs,vz=P.vel.z/hs;if(vx*ix+vz*iz>-0.3){const k=Math.min(1,1.6*m*dt*(0.4+0.6*down)),nx=vx+(ix-vx)*k,nz=vz+(iz-vz)*k,nl=Math.hypot(nx,nz)||1;P.vel.x=nx/nl*hs;P.vel.z=nz/nl*hs;}}}
  // gravity assist through the bottom of the arc
  if(down>0.6&&P.pos.y>gy+1.5){const hs=Math.hypot(P.vel.x,P.vel.z)||1;P.vel.x+=P.vel.x/hs*8*dt;P.vel.z+=P.vel.z/hs*8*dt;}
  P.vel.mul(1-0.03*dt);{const v=P.vel.len(),cap=(PBAL?80+25*webMk():70+35*webMk())*(1+0.01*masteryOver('webSwing'))*boostMul('speed');if(v>cap)P.vel.mul(cap/v);}
  // rope: stays taut, reels in a little after the attach (the swoop), never drags along the street; speed along it is limited, position is never snapped
  let rr_=0;
  if(!W.target){ropeLen(P.pos,W,dt,0,6);
    if(time-W.t<MOVE.reelT&&W.L>W.Lt){const r=(W.L0-W.Lt)/MOVE.reelT;ropeLen(P.pos,W,dt,r,W.Lt);rr_=r;}
    const lcap=Math.max(8,W.y-gy-MOVE.groundClear);if(P.pos.y<gy+3&&W.L>lcap){ropeLen(P.pos,W,dt,14,lcap);rr_=Math.max(rr_,14);}}
  ropeVel(P.pos,P.vel,W,rr_,dt);
  // chain: past the bottom and rising beyond ~45 degrees in front of the anchor, let go and grab the next one (picked before letting go)
  const ax=P.pos.x-W.x,az=P.pos.z-W.z,hs=Math.hypot(P.vel.x,P.vel.z);
  if(!W.target&&webHeld&&time-W.t>0.5&&hs>8&&(ax*P.vel.x+az*P.vel.z)>0&&P.vel.y>-2&&dyA>-W.L*MOVE.chainAngle){
    const R=webRange(),pt=findAnchor(R)||skyAnchor();webRelease(true);webHeld=true;
    if(pt&&P.en>=POWERS.webSwing.energy*0.5){P.en-=POWERS.webSwing.energy*0.5;attachWeb(pt);}else chainWait=time+0.9;}
}
// ---- web zip / point launch: Space in mid-air (web swingers) ----
function webZip(fromGround){
  if(!hasWeb()||P.zip||(P.grounded&&!fromGround))return false;
  const R=webRange()*0.8;let pt=null;
  if(aim.hitAny&&aim.surface&&!aim.actor){const d=Math.hypot(aim.x-P.pos.x,aim.y-P.pos.y,aim.z-P.pos.z);if(d<R&&d>6)pt={x:aim.x+aim.nx*1.2,y:aim.y+Math.max(aim.ny,0)*0.5+0.5,z:aim.z+aim.nz*1.2};}
  if(!pt){const a=findAnchor(R);if(a)pt=a;}
  if(!pt||!spend(4))return false;
  P.zip={x:pt.x,y:pt.y,z:pt.z,t:0};P.web=null;P.wall=null;P.wallRun=null;SFX.tone('triangle',1500,700,0.1,0.08);
  return true;
}
function zipStep(dt){
  const Z=P.zip;Z.t+=dt;const dx=Z.x-P.pos.x,dy=Z.y-P.pos.y,dz=Z.z-P.pos.z,d=Math.hypot(dx,dy,dz)||1;
  const s=MOVE.zipSpeed;P.vel.set(dx/d*s,dy/d*s,dz/d*s);
  if(d<3||Z.t>1.6){P.zip=null;const hs=Math.hypot(dx,dz)||1;
    // point launch: pop up and forward off the perch
    P.vel.set(dx/hs*16,24,dz/hs*16);SFX.whoosh();burst(P.pos.x,P.pos.y+1,P.pos.z,16,8,0.4,[[.9,.95,1]],1,0,2);}
}
// ---- wall running ----
function tryWallRun(col,inF,inR,fwdX,fwdZ,rX,rZ,shift){
  const w=col.wall;if(!w||!w.b||P.flying||P.zip||P.wallRun||P.wallCd>0||P.car)return false;
  if(w.b.y1<P.pos.y+3)return false;
  const ix=fwdX*inF+rX*inR,iz=fwdZ*inF+rZ*inR,il=Math.hypot(ix,iz);if(il<0.3)return false;
  const hs=Math.hypot(P.vel.x,P.vel.z),fast=shift||P.speeding||hs>16||!P.grounded;if(!fast)return false;
  const into=-(ix*w.nx+iz*w.nz)/il;if(into<0.25)return false;
  let tx=-w.nz,tz=w.nx;if(tx*ix+tz*iz<0){tx=-tx;tz=-tz;}
  const mode=into>0.8?'up':'side';
  P.wallRun={b:w.b,nx:w.nx,nz:w.nz,tx,tz,mode,t:0,max:hasWeb()||hasPower('wallClimb')||P.speeding?99:(mode==='up'?MOVE.runTime:MOVE.sideTime)};
  P.web=null;P.grounded=false;P.charging=false;P.vel.y=Math.max(P.vel.y,mode==='up'?6:5);
  if(!save.guide.wallrun){save.guide.wallrun=true;feed('Wall run','Space to leap off · let go of W to drop');}
  return true;
}
function wallRunStep(dt,inF,inR){
  const R=P.wallRun,b=R.b;R.t+=dt;
  const fast=hasWeb()||P.speeding||P.fastMode||(keys.ShiftLeft||keys.ShiftRight)?1:0;
  // speedsters run walls as fast as their speed dial lets them
  const spd=isSpeed()&&fast?Math.max(MOVE.runUpFast,CONFIG.move.run*speedMult()*0.7):0;
  if(spd&&Math.random()<0.8){const c=center(P);tracer(c.x,c.y-1,c.z,c.x+R.nx*0.4+rr(-.5,.5),c.y-1-(R.mode==='up'?spd*0.05:0),c.z+R.nz*0.4+rr(-.5,.5),SPD_C,0.07,0.3);}
  if(R.mode==='up'){const sp=(spd||(hasPower('superSpeed')&&fast?MOVE.runUpFast:MOVE.runUp))*(R.t>R.max-0.4?0.5:1);P.vel.set(-R.nx*2,sp,-R.nz*2);if(spd)addMastery('superSpeed',dt*0.3);}
  else{const sp=Math.max(MOVE.runSide*(fast?1.2:1),spd);P.vel.x=R.tx*sp-R.nx*2;P.vel.z=R.tz*sp-R.nz*2;P.vel.y-=CONFIG.move.gravity*0.2*dt;if(R.t<0.25)P.vel.y=Math.max(P.vel.y,4);}
  P.pos.addS(P.vel,dt);
  // stay glued to the face
  if(R.nx!==0)P.pos.x=R.nx>0?b.x1+P.radius:b.x0-P.radius;else P.pos.z=R.nz>0?b.z1+P.radius:b.z0-P.radius;
  P.heroYaw=R.mode==='up'?Math.atan2(-R.nx,-R.nz):Math.atan2(R.tx,R.tz);
  const along=R.nx!==0?P.pos.z:P.pos.x,lo=R.nx!==0?b.z0:b.x0,hi=R.nx!==0?b.z1:b.x1;
  if(P.pos.y>=b.y1-0.5){P.wallRun=null;P.pos.y=b.y1+0.2;P.pos.x-=R.nx*1.4;P.pos.z-=R.nz*1.4;P.vel.set(-R.nx*8,12,-R.nz*8);P.wallCd=0.3;SFX.whoosh();return;} // vault over the top
  if(along<lo-0.3||along>hi+0.3||inF<0.1||R.t>R.max||P.stun>0){P.wallRun=null;P.wallCd=0.35;P.vel.x+=R.nx*4;P.vel.z+=R.nz*4;return;}
  if(P.pos.y<=groundY(P.pos.x,P.pos.z,P.pos.y+1)+0.05&&R.t>0.3){P.wallRun=null;P.wallCd=0.3;P.grounded=true;}
  if(Math.random()<0.5)emit(P.pos.x-R.nx*0.6,P.pos.y+0.2,P.pos.z-R.nz*0.6,R.nx*rr(1,3),rr(-1,1),R.nz*rr(1,3),0.4,DUST[0],0.9,-2,2);
}
function wallRunLeap(){
  const R=P.wallRun;if(!R)return;P.wallRun=null;P.wallCd=0.35;
  let dx=camF.x+R.nx*0.8,dz=camF.z+R.nz*0.8;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
  const keep=R.mode==='side'?0.8:0.3;
  P.vel.set(dx*MOVE.leapOut+P.vel.x*keep,MOVE.leapUp,dz*MOVE.leapOut+P.vel.z*keep);P.grounded=false;SFX.whoosh();airDash=true;
  burst(P.pos.x,P.pos.y+1,P.pos.z,14,6,0.4,DUST,1.2,-2,2);
}
