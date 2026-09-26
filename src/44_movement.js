// ================================================================
// Traversal: Insomniac-style web swinging, web zip, wall running, parkour leaps
// ================================================================
// Swinging: hold right click (or WEB) and the web finds a building above and ahead
// automatically. Keep holding and it chains to the next anchor after each upswing;
// let go (or press Space) at the bottom-to-top of the arc for a speed boost.
// Anyone can wall run: sprint (or fly past fast) into a wall to run up it or along it.
const MOVE={webRange:[90,170],chainAngle:0.55,releaseBoost:1.12,swingJump:16,zipSpeed:75,
  runUp:20,runUpFast:30,runSide:24,runTime:1.5,sideTime:1.8,leapUp:21,leapOut:17};
let webHeld=false;
const hasWeb=()=>hasPower('webSwing')&&!P.alien;
const webRange=()=>pstat('webSwing','range');
// find a building point above and ahead to swing from (anchor assist)
function findAnchor(R){
  let fx=camF.x,fz=camF.z;const hs=Math.hypot(P.vel.x,P.vel.z);if(hs>12&&!keys.KeyS){fx=fx*0.4+P.vel.x/hs*0.6;fz=fz*0.4+P.vel.z/hs*0.6;}
  const fl=Math.hypot(fx,fz)||1;fx/=fl;fz/=fl;
  const ox=P.pos.x,oy=P.pos.y+2,oz=P.pos.z;let best=null,bs=-1e9;
  for(const el of [0.95,0.8,1.1,0.65,1.25])for(const side of [0,0.35,-0.35,0.7,-0.7]){
    const c=Math.cos(side),s=Math.sin(side),dx=fx*c-fz*s,dz=fx*s+fz*c,ce=Math.cos(el),dy=Math.sin(el);
    const t=rayCity(ox,oy,oz,dx*ce,dy,dz*ce,R);if(t>=R||t<9)continue;
    const y=oy+dy*t;if(y<P.pos.y+6)continue;
    const score=t*0.4-Math.abs(side)*18-Math.abs(el-0.9)*12+Math.min(y-P.pos.y,45)*0.3-Math.max(0,y-P.pos.y-60)*0.6;
    if(score>bs){bs=score;best={x:ox+dx*ce*t,y,z:oz+dz*ce*t,t};}}
  return best;
}
function attachWeb(pt){
  const h=handPoint(),d=Math.hypot(pt.x-h.x,pt.y-h.y,pt.z-h.z);
  const gy=groundY(P.pos.x,P.pos.z,P.pos.y+1);
  P.web={x:pt.x,y:pt.y,z:pt.z,L:Math.max(8,Math.min(d*0.88,pt.y-gy-3)),t:time};P.flying=false;P.wall=null;P.wallRun=null;P.charging=false;P.zip=null;
  SFX.tone('triangle',1200,500,0.12,0.08);
}
function webPress(){
  webHeld=true;
  if(!hasWeb()||!canAct())return;
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
  // aimed surface above you, else the anchor assist
  let pt=null;
  if(aim.hitAny&&aim.surface&&!(aim.ny>0.5&&aim.y<2)&&aim.y>P.pos.y+3){const d=Math.hypot(aim.x-h.x,aim.y-h.y,aim.z-h.z);if(d<=R)pt={x:aim.x,y:aim.y,z:aim.z};}
  if(!pt)pt=findAnchor(R);
  if(!pt){PS.webSwing.flash=0.3;feed('Nothing to swing from','Webs need a building within '+Math.round(R)+' m');return;}
  if(!spend(POWERS.webSwing.energy)){noEnergy();return;}
  if(P.grounded){P.vel.y=Math.max(P.vel.y,17);P.grounded=false;P.pos.y+=0.2;}
  attachWeb(pt);
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
  webHeld=false;if(!P.web)return;const W=P.web;P.web=null;if(W.target)boost=false;
  if(boost&&!P.grounded){const hs=Math.hypot(P.vel.x,P.vel.z);
    // best release: moving forward and starting to rise
    const good=P.vel.y>-4&&hs>10;P.vel.x*=good?MOVE.releaseBoost:1.03;P.vel.z*=good?MOVE.releaseBoost:1.03;P.vel.y+=good?7:3;
    if(good&&hs>25)for(let i=0;i<10;i++)emit(P.pos.x,P.pos.y+1.4,P.pos.z,-P.vel.x*0.1+rr(-2,2),rr(-2,2),-P.vel.z*0.1+rr(-2,2),0.4,[.9,.95,1],0.8,0,2);}
  void W;
}
function swingJump(){if(!P.web)return;webRelease(true);P.vel.y+=MOVE.swingJump;SFX.whoosh();}
function swingStep(dt,inF,inR,fwdX,fwdZ,rX,rZ){
  const W=P.web,f=pstat('webSwing','force');
  if(W.target&&!tetherTick(W))return;
  P.vel.y-=CONFIG.move.gravity*0.9*dt;
  P.vel.x+=(fwdX*inF+rX*inR)*26*f*dt;P.vel.z+=(fwdZ*inF+rZ*inR)*26*f*dt;
  // gravity assist through the bottom of the arc, gentle reel-in keeps the arc off the ground
  const gy=groundY(P.pos.x,P.pos.z,P.pos.y+1),dy=P.pos.y+1.6-W.y;
  if(dy<-W.L*0.6&&P.pos.y>gy+1.5){const hs=Math.hypot(P.vel.x,P.vel.z)||1;P.vel.x+=P.vel.x/hs*8*dt;P.vel.z+=P.vel.z/hs*8*dt;}
  if(P.pos.y<gy+3&&!W.target)W.L=Math.max(8,Math.min(W.L,W.y-gy-3.5)); // never drag along the street
  P.vel.mul(1-0.03*dt);{const v=P.vel.len(),cap=70+35*webMk();if(v>cap)P.vel.mul(cap/v);}
  // chain: past the anchor on the upswing, let go and grab the next one
  const ax=P.pos.x-W.x,az=P.pos.z-W.z,hs=Math.hypot(P.vel.x,P.vel.z);
  if(!W.target&&webHeld&&time-W.t>0.5&&hs>8&&(ax*P.vel.x+az*P.vel.z)>0&&P.vel.y>-2&&(P.pos.y+1.6-W.y)>-W.L*MOVE.chainAngle){
    const R=webRange();webRelease(true);webHeld=true;const pt=findAnchor(R);if(pt&&P.en>=POWERS.webSwing.energy*0.5){P.en-=POWERS.webSwing.energy*0.5;attachWeb(pt);}}
}
// ---- web zip / point launch: Space in mid-air (web swingers) ----
function webZip(){
  if(!hasWeb()||P.zip||P.grounded)return false;
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
