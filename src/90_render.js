// ================================================================
// Day / night
// ================================================================
const env={sun:[0,1,0],ldir:[0,1,0],lcol:[1,1,1],sky:[0,0,0],gnd:[0,0,0],zen:[0,0,0],hor:[0,0,0],night:0,suncol:[1,1,1]};
const mix3=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
function updateEnv(dt){
  tod=(tod+dt*(timeFast?0.02:1/360))%1;
  const ang=(tod-0.25)*TAU;let sx=Math.cos(ang),sy=Math.sin(ang),sz=0.42;const l=Math.hypot(sx,sy,sz);sx/=l;sy/=l;sz/=l;
  env.sun=[sx,sy,sz];const day=smooth(-0.1,0.25,sy),night=1-day,sunset=Math.exp(-Math.pow(sy*5,2));env.night=night;
  env.zen=mix3([0.004,0.006,0.02],[0.09,0.25,0.62],day);
  env.hor=mix3(mix3([0.015,0.02,0.05],[0.55,0.7,0.86],day),[0.95,0.42,0.18],sunset*0.75);
  env.suncol=mix3([1.0,0.95,0.85],[1.0,0.55,0.25],sunset);
  if(sy>-0.05){env.ldir=[sx,Math.max(sy,0.06),sz];env.lcol=env.suncol.map(c=>c*3.0*smooth(-0.05,0.12,sy));}
  else{env.ldir=[-sx,Math.max(-sy,0.1),-sz];env.lcol=[0.18*night,0.24*night,0.42*night];}
  const ll=Math.hypot(...env.ldir);env.ldir=env.ldir.map(c=>c/ll);
  env.sky=mix3([0.02,0.03,0.07],[0.3,0.4,0.55],day);env.gnd=mix3([0.015,0.015,0.02],[0.2,0.18,0.15],day);
}

// ================================================================
// Camera
// ================================================================
const VIEW=M4.create(),PROJ=M4.create(),VP=M4.create(),LV=M4.create(),LP=M4.create(),LVP=M4.create();
let camDist=8,fov=70;
// Where the creator / appearance panel leaves room for the hero: returns the free screen rectangle
function previewRegion(){
  const iw=innerWidth,ih=innerHeight,el=creating?creator:sheetOpen==='look'?$('sheet'):null;
  const card=el&&!el.hidden?el.querySelector('.sheet-card'):null;
  if(!card)return {x0:0,y0:0,x1:iw,y1:ih};
  const r=card.getBoundingClientRect();
  if(r.width>iw*0.62)return {x0:0,y0:0,x1:iw,y1:Math.max(ih*0.3,r.top)};   // bottom sheet on phones: hero above it
  return {x0:Math.min(r.right,iw*0.7),y0:0,x1:iw,y1:ih};                     // side panel: hero to the right of it
}
function updateCamera(dt){
  const preview=creating||sheetOpen==='look';
  if(preview){
    const R=previewRegion(),iw=innerWidth,ih=innerHeight,th=Math.tan(25*Math.PI/180),asp=W/H;
    const hx=((R.x0+R.x1)/2)/iw*2-1,hy=1-((R.y0+R.y1)/2)/ih*2,hf=(R.y1-R.y0)/ih,wf=(R.x1-R.x0)/iw;
    const ht=P.height+0.6,d=Math.max(6.6,ht/(2*th*hf*0.62),2.2/(2*th*asp*wf*0.62));
    const a=performance.now()*0.00022,tx=P.pos.x,ty=P.pos.y+P.height*0.5,tz=P.pos.z;
    let ox=Math.sin(a),oy=0.16,oz=Math.cos(a);const ol=Math.hypot(ox,oy,oz);ox/=ol;oy/=ol;oz/=ol;
    camF.set(-ox,-oy,-oz);const rx=-camF.z,rz=camF.x,rl=Math.hypot(rx,rz)||1;
    const ux=-(rz/rl)*camF.y,uy=(rz/rl)*camF.x-(rx/rl)*camF.z,uz=(rx/rl)*camF.y;
    let sx=hx*d*th*asp,sy=hy*d*th;
    camPos.set(tx+ox*d-rx/rl*sx-ux*sy,ty+oy*d-uy*sy,tz+oz*d-rz/rl*sx-uz*sy);
    {let dx=camPos.x-tx,dy=camPos.y-ty,dz=camPos.z-tz;const L=Math.hypot(dx,dy,dz)||1;const hit=rayCity(tx,ty,tz,dx/L,dy/L,dz/L,L);
      if(hit<L){const k=Math.max(0.25,(hit-0.5)/L);camPos.set(tx+dx*k,ty+dy*k,tz+dz*k);}}
    fov=50;
  }else if(state!=='play'){
    const a=time*0.05;camPos.set(Math.cos(a)*420,170,Math.sin(a)*420);
    let fx=-camPos.x,fy=40-camPos.y,fz=-camPos.z;const l=Math.hypot(fx,fy,fz);camF.set(fx/l,fy/l,fz/l);fov=lerp(fov,60,damp(3,dt));
  }else{
    const cp=Math.cos(P.pitch);camF.set(-Math.sin(P.yaw)*cp,Math.sin(P.pitch),-Math.cos(P.yaw)*cp);
    const rX=Math.cos(P.yaw),rZ=-Math.sin(P.yaw),sp=P.vel.len(),spN=clamp(sp/190,0,1),hs=P.height/2.7;
    let want,ty,side;
    if(P.car){const cs=clamp(Math.abs(P.car.spd||0)/CONFIG.drive.maxSpeed,0,1);want=12.5+cs*4;ty=P.car.pos.y+3.1;side=0;}
    else{const hk=hs<=6?Math.max(1,hs*0.8):4.8+(hs-6)*0.4;want=(P.flying?9+spN*9:P.web?10:7.5)*hk*conCam();ty=P.pos.y+2.1*hs;side=1.2*Math.min(hs,1.6);}
    const tx=P.car?P.car.pos.x:P.pos.x,tz=P.car?P.car.pos.z:P.pos.z;
    const cx=tx-camF.x*want+rX*side,cy=ty-camF.y*want+0.4,cz=tz-camF.z*want+rZ*side;
    let dx=cx-tx,dy=cy-ty,dz=cz-tz;const L=Math.hypot(dx,dy,dz)||1;dx/=L;dy/=L;dz/=L;
    const t=rayCity(tx,ty,tz,dx,dy,dz,L+0.5),dist=Math.max(1.2,Math.min(L,t-0.6));
    camDist=dist<camDist?dist:lerp(camDist,dist,damp(5,dt));
    camPos.set(tx+dx*camDist,Math.max(ty+dy*camDist,baseY(tx,tz)+0.6),tz+dz*camDist);
    if(shake>0){const s=shake*shake*0.8;camPos.x+=rr(-s,s);camPos.y+=rr(-s,s);camPos.z+=rr(-s,s);}
    fov=lerp(fov,70+spN*24+(P.speeding?10:0)+(P.car?clamp(Math.abs(P.car.spd||0)/42,0,1)*8:0),damp(4,dt));
  }
  const fx=camF.x,fy=camF.y,fz=camF.z;let rx=-fz,rz=fx;const rl=Math.hypot(rx,rz)||1;rx/=rl;rz/=rl;camR.set(rx,0,rz);camU.set(-rz*fy,rz*fx-rx*fz,rx*fy);
  M4.lookAt(VIEW,camPos.x,camPos.y,camPos.z,camPos.x+fx,camPos.y+fy,camPos.z+fz,0,1,0);
  M4.perspective(PROJ,fov*Math.PI/180,W/H,0.3,4000);M4.mul(VP,PROJ,VIEW);
  const menu=state!=='play'&&!preview;
  const fxp=menu?0:P.pos.x,fzp=menu?0:P.pos.z,fyp=menu?0:Math.min(P.pos.y,120),ext=menu?520:170,tex=ext*2/SHADOW;
  const ld=env.ldir,cxs=Math.round(fxp/tex)*tex,czs=Math.round(fzp/tex)*tex;
  M4.lookAt(LV,cxs+ld[0]*600,fyp+ld[1]*600,czs+ld[2]*600,cxs,fyp,czs,0,1,0);M4.ortho(LP,-ext,ext,-ext,ext,1,1500);M4.mul(LVP,LP,LV);
}

// ================================================================
// Build draw list
// ================================================================
const SKIN_C=c4('#d9a27a'),HAIR=c4('#20140e'),SILVER=[.62,.64,.68,1],SILVER2=[.4,.42,.46,1],DARKGUN=c4('#1a1c20'),GOLDA=c4('#ffc93c');
const HAIRS=['#20140e','#3b2416','#6b4a2b','#c9a15a','#141414','#8a3b1c','#9a9a9a','#4a2a1a'].map(c4),SHOES=['#1b1b1f','#3a2a20','#e6e6e6','#2a2f3a'].map(c4);
const BANDC=[BAND_COL[0],BAND_COL[1],BAND_COL[2],1];
// GHOST>0 draws everything translucent (Umbra's veil / phase)
let GHOST=0;
function Q(mesh,M,col,f=0,e=0){if(GHOST)queue(mesh,M,[col[0],col[1],col[2],GHOST],F_BL);else queue(mesh,M,col,f,e);}
const inView=(x,z,far,near=40)=>{const dx=x-camPos.x,dz=z-camPos.z,q=dx*dx+dz*dz;if(q>far*far)return -1;if(q>near*near&&dx*camF.x+dz*camF.z<-near)return -1;return q;};
function propM(p,lx,ly,lz,sx,sy,sz){const c=Math.cos(p.yaw),s=Math.sin(p.yaw);return M4.compose(tmpM(),p.x+lx*c+lz*s,p.y+ly,p.z-lx*s+lz*c,0,p.yaw,0,sx,sy,sz);}

function drawSuper(s,m,isPlayer){
  const a=s.anim,box=m.metal||m.armor?MESH.mbox:MESH.box,sph=m.metal||m.armor?MESH.msphere:MESH.sphere;
  const suit=m.metal?SILVER:m.suit,suit2=m.metal?SILVER2:m.suit2,cape=m.cape,acc=m.acc,skin=m.metal?SILVER:SKIN_C;
  const fl=s.flash?s.flash*0.6:0,sh=F_SH;
  const GS=s.giantS||1;let root=at(s.pos.x,s.pos.y,s.pos.z,0,s.heroYaw,0,GS,GS,GS);
  if(s.flip){const e=clamp(s.flip.t/s.flip.dur,0,1),q=e*e*(3-2*e);root=child(child(at(s.pos.x,s.pos.y+1.2,s.pos.z,0,s.heroYaw+s.flip.ry*q,0),0,0,0,s.flip.rx*q,0,0),0,-1.2,0);}
  const crouch=s.charging?-0.35*Math.min(s.chargeT,1):0;
  const kl=a.kneeL||0,kr=a.kneeR||0;
  const body=child(root,0,1.28+crouch-Math.max(0,Math.min(kl,kr))*0.12,0,s.tilt,0,s.bank);
  // torso
  Q(box,child(body,0,0.55,0,0,0,0,0.8,0.9,0.46),suit,sh,fl);
  Q(box,child(body,0,0.72,0.2,0.08,0,0,0.66,0.46,0.12),suit2,sh,fl);
  Q(box,child(body,0,0.12,0,0,0,0,0.7,0.2,0.44),suit,sh,fl);
  Q(box,child(body,0,0.02,0,0,0,0,0.76,0.12,0.5),acc,sh,fl);
  const civ=!!m.civ;
  if(!civ)Q(MESH.glowBox,child(body,0,0.02,0.255,0,0,0,0.18,0.1,0.02),acc,0);
  Q(box,child(body,0,-0.14,0,0,0,0,0.7,0.26,0.44),suit2,sh,fl);
  if(!civ)Q(MESH.glowBox,child(body,0,0.7,0.27,0,0,Math.PI/4,0.24,0.24,0.03),s.firing?[1,.3,.2,1]:acc,0);
  Q(box,child(body,0,1.02,0,0,0,0,0.24,0.14,0.24),skin,sh,fl);
  Q(box,child(body,0,0.97,-0.02,0,0,0,0.5,0.1,0.34),suit2,sh,fl);
  // head
  const head=child(body,0,1.27,0.02);
  Q(sph,child(head,0,0,0,0,0,0,0.25,0.3,0.27),skin,sh,fl);
  Q(sph,child(head,0,0.1,-0.04,0,0,0,0.27,0.24,0.28),m.metal?SILVER2:HAIR,sh,fl);
  const mkK=isPlayer&&P.maskK!=null?P.maskK:1;if(!civ&&mkK>0.02)Q(box,child(head,0,0.03+(1-mkK)*0.25,0.12,0,0,0,0.53*mkK,0.11,0.3),suit2,0,fl);
  Q(box,child(head,0,-0.2,0.18,0,0,0,0.12,0.05,0.06),skin,0,fl);
  const eyeC=s.firing?[1,.25,.15,1]:civ?[.12,.1,.09,1]:[.65,.95,1,1];
  Q(MESH.glowBox,child(head,-0.1,0.03,0.275,0,0,0,0.09,0.04,0.02),eyeC,0);
  Q(MESH.glowBox,child(head,0.1,0.03,0.275,0,0,0,0.09,0.04,0.02),eyeC,0);
  const eyeM=child(head,0,0.03,0.3);s.eye.set(eyeM[12],eyeM[13],eyeM[14]);
  // arms: shoulder -> elbow -> fist
  for(const [side,rx,rz,el] of [[-1,a.armL,a.armLz,a.elbL||0],[1,a.armR,a.armRz,a.elbR||0]]){
    const shd=child(body,side*0.52,0.92,0,rx,0,rz);
    Q(box,child(shd,0,-0.02,0,0,0,side*0.2,0.32,0.22,0.32),suit2,sh,fl);
    Q(box,child(shd,0,-0.22,0,0,0,0,0.22,0.42,0.24),suit,sh,fl);
    const elb=child(shd,0,-0.42,0,el,0,0);
    Q(sph,child(elb,0,0,0,0,0,0,0.12,0.12,0.12),suit,sh,fl);
    Q(box,child(elb,0,-0.18,0,0,0,0,0.21,0.34,0.23),civ?suit:cape,sh,fl);
    Q(box,child(elb,0,-0.08,0,0,0,0,0.25,0.08,0.27),acc,0,fl);
    Q(box,child(elb,0,-0.42,0.02,0,0,0,0.24,0.2,0.26),civ?skin:cape,sh,fl);
    if(side<0&&isPlayer&&hasPower('morphBand'))Q(MESH.glowCyl,child(elb,0,-0.26,0,0,0,0,0.14,0.07,0.14),BANDC,0);
    if(isPlayer&&side>0)s.hand=child(elb,0,-0.45,0);
  }
  // legs: hip -> knee -> boot
  for(const [side,rx,kn] of [[-1,a.legL,kl],[1,a.legR,kr]]){
    const hip=child(body,side*0.2,-0.14,0,rx,0,0);
    Q(box,child(hip,0,-0.26,0,0,0,0,0.31,0.54,0.34),suit,sh,fl);
    const knee=child(hip,0,-0.52,0,kn,0,0);
    Q(box,child(knee,0,0.0,0.06,0,0,0,0.26,0.16,0.26),suit2,0,fl);
    Q(box,child(knee,0,-0.2,0,0,0,0,0.28,0.4,0.31),cape,sh,fl);
    Q(box,child(knee,0,-0.47,0.06,0,0,0,0.31,0.18,0.44),civ?[.16,.13,.11,1]:cape,sh,fl);
    Q(box,child(knee,0,-0.555,0.06,0,0,0,0.32,0.05,0.46),[.08,.08,.09,1],0,fl);
  }
  if(m.capeOn){let seg=child(body,0,0.94,-0.25,a.cape,0,0);const v=s.vel?s.vel.len():0;
    Q(box,child(body,0,0.94,-0.2,0,0,0,0.7,0.1,0.08),cape,sh,fl);
    for(let i=0;i<3;i++){const f=Math.sin(time*(8+v*0.08)-i*1.3)*0.12*(0.3+clamp(v/60,0,1));
      Q(MESH.box,child(seg,0,-0.3,0,0,0,0,0.96-i*0.03+i*0.08,0.64,0.05),cape,sh,fl);seg=child(seg,0,-0.6,0,0.08+f,0,0);}}
}

// ---- Morph Band aliens: a shared humanoid rig plus per-alien dressing ----
const ACOL={};
function alienCols(id){let c=ACOL[id];if(!c){const d=ALIENS[id];const b=c4(d.body),g=c4(d.glow);c=ACOL[id]={b,g,b2:[b[0]*0.65,b[1]*0.65,b[2]*0.65,1],b3:[Math.min(1,b[0]*1.3+.05),Math.min(1,b[1]*1.3+.05),Math.min(1,b[2]*1.3+.05),1]};}return c;}
const ALIEN_RIG={
  magmaw:{tw:1.05,th:1.0,td:.62,nk:.14,aw:.36,ua:.5,fa:.48,hs:.44,lw:.4,ul:.5,ll:.48,fh:.2,fw:.55,handGlow:true},
  zephyrix:{tw:.5,th:.72,td:.32,nk:.1,aw:.15,ua:.4,fa:.38,hs:.13,noLegs:true,hover:1.25},
  cryolith:{tw:1.0,th:1.05,td:.6,nk:.1,aw:.34,ua:.48,fa:.46,hs:.38,lw:.38,ul:.5,ll:.5,fh:.2,fw:.5},
  voltwing:{tw:.55,th:.8,td:.4,nk:.12,aw:.15,ua:.45,fa:.45,hs:.14,lw:.18,ul:.55,ll:.55,fh:.12,fw:.34},
  colossus:{tw:1.1,th:1.1,td:.7,nk:.1,aw:.4,ua:.55,fa:.55,hs:.46,lw:.45,ul:.55,ll:.55,fh:.22,fw:.62,metal:true},
  umbra:{tw:.6,th:.85,td:.36,nk:.12,aw:.17,ua:.45,fa:.45,hs:.15,lw:.2,ul:.55,ll:.55,fh:.12,fw:.32},
};
function rigAlien(s,o,c,root,fl){
  const a=s.anim,box=o.metal?MESH.mbox:MESH.box,sh=F_SH;
  const legH=o.noLegs?o.hover+Math.sin(time*2.4)*0.08:o.ul+o.ll+o.fh+0.08;
  const body=child(root,0,legH,0,s.tilt,0,s.bank);
  Q(box,child(body,0,o.th*0.55,0,0,0,0,o.tw,o.th*0.9,o.td),c.b,sh,fl);
  Q(box,child(body,0,0.02,0,0,0,0,o.tw*0.8,0.26,o.td*0.9),c.b2,sh,fl);
  Q(MESH.glowCyl,child(body,0,o.th*0.72,o.td/2+0.012,Math.PI/2,0,0,0.13,0.03,0.13),BANDC,0);
  const head=child(body,0,o.th+o.nk,0),F={body,head,sh:[],el:[],hand:[],hip:[],kn:[]};
  for(const [side,rx,rz,el] of [[-1,a.armL,a.armLz,a.elbL||0],[1,a.armR,a.armRz,a.elbR||0]]){
    const shd=child(body,side*(o.tw/2+o.aw*0.45),o.th-o.aw*0.5,0,rx,0,rz);
    Q(box,child(shd,0,-o.ua/2,0,0,0,0,o.aw,o.ua,o.aw),c.b,sh,fl);
    const elb=child(shd,0,-o.ua,0,el,0,0);
    Q(box,child(elb,0,-o.fa/2,0,0,0,0,o.aw*0.92,o.fa,o.aw*0.92),c.b2,sh,fl);
    const hand=child(elb,0,-o.fa-o.hs*0.42,0);
    Q(o.handGlow?MESH.glowBox:box,child(hand,0,0,0,0,0,0,o.hs,o.hs,o.hs),o.handGlow?c.g:c.b,sh,fl);
    F.sh.push(shd);F.el.push(elb);F.hand.push(hand);
  }
  if(!o.noLegs)for(const [side,rx,kn] of [[-1,a.legL,a.kneeL||0],[1,a.legR,a.kneeR||0]]){
    const hip=child(body,side*o.tw*0.27,-0.04,0,rx,0,0);
    Q(box,child(hip,0,-o.ul/2,0,0,0,0,o.lw,o.ul,o.lw*1.05),c.b,sh,fl);
    const knee=child(hip,0,-o.ul,0,kn,0,0);
    Q(box,child(knee,0,-o.ll/2,0,0,0,0,o.lw*0.9,o.ll,o.lw),c.b2,sh,fl);
    Q(box,child(knee,0,-o.ll-o.fh/2+0.02,o.fw*0.18,0,0,0,o.lw*1.1,o.fh,o.fw),c.b,sh,fl);
    F.hip.push(hip);F.kn.push(knee);
  }
  return F;
}
function drawAlien(s,id,isPlayer){
  const d=ALIENS[id],o=ALIEN_RIG[id],c=alienCols(id),fl=s.flash?s.flash*0.6:0,sc=d.scale;
  const root=at(s.pos.x,s.pos.y,s.pos.z,0,s.heroYaw,0,sc,sc,sc);
  const F=rigAlien(s,o,c,root,fl),H=F.head,B=F.body,t=time,live=!paused&&!GHOST;
  let eye=null;
  if(id==='magmaw'){
    Q(MESH.box,child(H,0,0.2,0.02,0,0,0,0.56,0.46,0.5),c.b,F_SH,fl);Q(MESH.box,child(H,0,0.02,0.18,0,0,0,0.42,0.14,0.2),c.b2,F_SH,fl);
    for(const x of [-0.13,0.13])Q(MESH.glowBox,child(H,x,0.24,0.255,0,0,0,0.12,0.06,0.02),c.g,0);
    for(const [x,y,r,l] of [[-0.25,0.5,0.4,0.6],[0.2,0.35,-0.5,0.5],[0.05,0.75,1.2,0.4],[-0.1,0.2,-0.3,0.35]])Q(MESH.glowBox,child(B,x,y,o.td/2+0.01,0,0,r,0.06,l,0.02),c.g,0);
    for(const x of [-0.3,0.25])Q(MESH.glowBox,child(B,x,0.6,-o.td/2-0.01,0,0,x*2,0.06,0.6,0.02),c.g,0);
    for(let i=0;i<2;i++)Q(MESH.box,child(F.sh[i],0,0.08,0,0.3,0.5,i?-0.35:0.35,0.5,0.36,0.5),c.b2,F_SH,fl);
    const fk=0.8+Math.sin(t*13)*0.12+Math.sin(t*7.3)*0.08;
    if(!GHOST){queue(MESH.glowSphere,child(H,0,0.5,0,0,0,0,0.34*fk,0.3*fk,0.34*fk),[1,.55,.12,0.8],F_ADD);queue(MESH.glowSphere,child(H,0,0.55,0,0,0,0,0.6*fk,0.5*fk,0.6*fk),[1,.3,.05,0.3],F_ADD);}
    if(live&&Math.random()<0.5){const m=child(H,0,0.5,0);emit(m[12]+rr(-.2,.2)*sc,m[13],m[14]+rr(-.2,.2)*sc,rr(-1,1),rr(3,6),rr(-1,1),rr(0.3,0.6),FIRE[(Math.random()*FIRE.length)|0],rr(0.5,1)*sc,-3,1);}
    eye=child(H,0,0.24,0.3);
  }else if(id==='zephyrix'){
    Q(MESH.sphere,child(H,0,0.18,-0.04,0.35,0,0,0.24,0.28,0.36),c.b,F_SH,fl);
    for(const x of [-0.1,0.1])Q(MESH.glowSphere,child(H,x,0.2,0.22,0,0,0,0.07,0.05,0.05),c.g,0);
    for(const x of [-1,1])Q(MESH.cone,child(H,x*0.16,0.3,-0.2,-1.0,0,x*-0.5,0.08,0.45,0.08),c.b3,F_SH,fl);
    let seg=child(B,0,-0.05,0);
    for(let i=0;i<3;i++){const w=Math.sin(t*5-i*1.2)*0.25;seg=child(seg,0,-0.22,0,w*0.6,0,w);Q(MESH.cone,child(seg,0,-0.25,0,Math.PI,0,0,0.26-i*0.07,0.55,0.22-i*0.06),i===2?c.g:c.b,F_SH,fl);seg=child(seg,0,-0.4,0);}
    const fl2=Math.sin(t*16)*0.45;
    if(!GHOST)for(const x of [-1,1]){const w=child(B,x*0.2,o.th*0.8,-o.td/2-0.02,0.2,x*0.25,x*(0.6+fl2));queue(MESH.glowBox,child(w,x*0.5,0.1,0,0,0,0,1.0,0.5,0.02),[c.g[0],c.g[1],c.g[2],0.35],F_ADD);}
    if(live&&Math.random()<0.4){const m=child(seg,0,0,0);emit(m[12],m[13],m[14],rr(-2,2),rr(-2,1),rr(-2,2),0.5,[.8,1,1],rr(0.4,0.8),0,1);}
    eye=child(H,0,0.2,0.3);
  }else if(id==='cryolith'){
    Q(MESH.box,child(H,0,0.2,0,0,0.78,0,0.46,0.44,0.46),c.b,F_SH,fl);
    for(const x of [-0.11,0.11])Q(MESH.glowBox,child(H,x,0.22,0.25,0,0,0,0.1,0.05,0.02),c.g,0);
    for(const [x,z,r] of [[0,0,0],[-0.16,0.05,-0.4],[0.16,0.05,0.4],[0,-0.14,0]])Q(MESH.cone,child(H,x,0.55,z,z*2,0,r,0.1,0.42,0.1),c.b3,F_SH,fl);
    for(let i=0;i<2;i++){const sd=i?1:-1;Q(MESH.cone,child(F.sh[i],sd*0.05,0.25,0,0,0,-sd*0.45,0.16,0.7,0.16),c.b3,F_SH,fl);Q(MESH.cone,child(F.sh[i],sd*0.08,0.18,-0.12,-0.3,0,-sd*0.9,0.1,0.45,0.1),c.b3,F_SH,fl);
      Q(MESH.cone,child(F.el[i],sd*0.16,-0.2,0,0,0,-sd*1.3,0.08,0.34,0.08),c.b3,F_SH,fl);}
    for(const [x,y] of [[-0.2,0.7],[0.18,0.85],[0,0.45]])Q(MESH.cone,child(B,x,y,-o.td/2-0.1,-1.2,0,x,0.12,0.5,0.12),c.b3,F_SH,fl);
    Q(MESH.glowSphere,child(B,0,o.th*0.6,o.td/2-0.02,0,0,0,0.16,0.16,0.08),c.g,0);
    if(!GHOST&&isPlayer&&P.alien&&P.alien.armor>0)queue(MESH.glowSphere,child(B,0,0.4,0,0,t,0,1.2,1.5,1.0),[.7,.9,1,0.2+Math.sin(t*5)*0.05],F_ADD);
    eye=child(H,0,0.22,0.3);
  }else if(id==='voltwing'){
    Q(MESH.sphere,child(H,0,0.15,0.02,0,0,0,0.22,0.24,0.26),c.b,F_SH,fl);
    for(const x of [-0.11,0.11])Q(MESH.glowSphere,child(H,x,0.18,0.17,0,0,0,0.1,0.1,0.08),c.g,0);
    for(const x of [-1,1])Q(MESH.box,child(H,x*0.09,0.48,0.08,-0.4,0,x*0.35,0.025,0.5,0.025),c.b,0,fl);
    for(const y of [0.3,0.55,0.8])Q(MESH.glowBox,child(B,0,y,o.td/2+0.01,0,0,0,o.tw*0.85,0.06,0.02),c.g,0);
    Q(MESH.cone,child(B,0,-0.12,-0.28,-2.3,0,0,0.12,0.5,0.12),c.b2,F_SH,fl);
    if(!GHOST){const fl2=Math.sin(t*55)*0.35;for(const x of [-1,1])for(const [y,r] of [[0.75,0.15],[0.5,-0.25]]){const w=child(B,x*0.12,y,-o.td/2-0.03,0,x*0.35,x*(r+fl2));
      queue(MESH.glowBox,child(w,x*0.55,0,0,0,0,0,1.1,0.32,0.02),[c.g[0],c.g[1],c.g[2],0.28],F_ADD);}}
    if(live&&Math.random()<0.25){const m=child(B,rr(-.3,.3),rr(0,.9),0);emit(m[12],m[13],m[14],rr(-4,4),rr(-4,4),rr(-4,4),0.2,[1,1,.5],rr(0.3,0.6),0,2);}
    eye=child(H,0,0.18,0.28);
  }else if(id==='colossus'){
    Q(MESH.mbox,child(H,0,0.2,0,0,0,0,0.5,0.42,0.5),c.b,F_SH,fl);Q(MESH.mbox,child(H,0,0.4,-0.05,0,0,0,0.56,0.1,0.56),c.b2,F_SH,fl);
    Q(MESH.glowBox,child(H,0,0.22,0.255,0,0,0,0.38,0.07,0.02),c.g,0);
    for(let i=0;i<2;i++){const sd=i?1:-1;Q(MESH.mbox,child(F.sh[i],sd*0.06,0.12,0,0,0,-sd*0.3,0.62,0.22,0.58),c.b2,F_SH,fl);Q(MESH.mbox,child(F.el[i],0,-0.3,0,0,0,0,0.5,0.22,0.5),c.b2,F_SH,fl);
      if(F.kn[i])Q(MESH.mbox,child(F.kn[i],0,0,0.2,0,0,0,0.36,0.3,0.16),c.b2,F_SH,fl);}
    const p=0.75+Math.sin(t*3)*0.25;Q(MESH.glowSphere,child(B,0,o.th*0.62,o.td/2,0,0,0,0.2,0.2,0.1),[1,.6*p,.2,1],0);
    if(!GHOST)queue(MESH.glowSphere,child(B,0,o.th*0.62,o.td/2+0.1,0,0,0,0.45,0.45,0.2),[1,.5,.15,0.3*p],F_ADD);
    for(const y of [0.2,0.45])Q(MESH.glowBox,child(B,0,y,o.td/2+0.01,0,0,0,o.tw*0.7,0.04,0.02),c.g,0);
    eye=child(H,0,0.22,0.3);
  }else if(id==='umbra'){
    Q(MESH.sphere,child(H,0,0.17,-0.03,0,0,0,0.24,0.28,0.27),c.b,F_SH,fl);Q(MESH.sphere,child(H,0,0.24,-0.08,0,0,0,0.3,0.32,0.3),c.b2,F_SH,fl);
    for(const x of [-0.09,0.09])Q(MESH.glowBox,child(H,x,0.19,0.255,0,0,x*-3,0.1,0.03,0.02),c.g,0);
    let seg=child(B,0,o.th*0.95,-o.td/2-0.02,(s.anim.cape||0.2)*0.8,0,0);const v=s.vel?s.vel.len():0;
    for(let i=0;i<4;i++){const f=Math.sin(t*(6+v*0.06)-i*1.1)*0.14;Q(MESH.box,child(seg,0,-0.28,0,0,0,0,0.8+i*0.1,0.58,0.04),[.12,.04,.18,1],F_SH,fl);seg=child(seg,0,-0.56,0,0.06+f,0,0);}
    if(!GHOST)for(let k=0;k<3;k++){const ang=t*2+k*TAU/3;queue(MESH.glowSphere,child(B,Math.cos(ang)*0.7,0.5+Math.sin(t*3+k)*0.3,Math.sin(ang)*0.7,0,0,0,0.07,0.07,0.07),[c.g[0],c.g[1],c.g[2],0.8],F_ADD);}
    if(live&&Math.random()<0.4){const m=child(B,rr(-.3,.3),rr(-.2,.8),0);emit(m[12],m[13],m[14],rr(-.5,.5),rr(.5,1.5),rr(-.5,.5),rr(0.6,1),[.25,.08,.35],rr(0.6,1.1),-1,1);}
    eye=child(H,0,0.19,0.3);
  }
  if(eye&&s.eye)s.eye.set(eye[12],eye[13],eye[14]);
  if(isPlayer)s.hand=F.hand[1];
}

function drawHuman(h){
  if(h.hidden)return;const q=inView(h.pos.x,h.pos.z,190);if(q<0)return;
  const L=h.look,e=h.flash*0.8,sh=q<55*55?F_SH:0;
  if(L.hair===undefined){L.hair=Math.random()<0.1?null:pick(HAIRS);L.long=Math.random()<0.35;L.shoe=pick(SHOES);}
  if(h.rag){drawRagdoll(h,ragColorsHuman(h));return;}
  const root=at(h.pos.x,h.pos.y,h.pos.z,h.rx,h.yaw,0);
  if(q>80*80){queue(MESH.box,child(root,0,1.0,0,0,0,0,0.5,1.9,0.32),L.shirt,0,e);queue(MESH.sphere,child(root,0,2.0,0,0,0,0,0.2,0.23,0.21),L.skin,0,e);return;}
  const mv=Math.min(h.moving/4,1),sw=Math.sin(h.phase)*mv*0.7,run=h.moving>5?1:0;
  // torso, hips, neck, head
  queue(MESH.box,child(root,0,1.33,0,0,0,0,0.52,0.64,0.3),L.shirt,sh,e);
  queue(MESH.box,child(root,0,0.98,0,0,0,0,0.48,0.2,0.29),L.pants,sh,e);
  if(L.badge||L.gold)queue(MESH.box,child(root,0,1.03,0,0,0,0,0.5,0.06,0.31),[.1,.08,.06,1],0,e);
  queue(MESH.box,child(root,0,1.68,0,0,0,0,0.14,0.1,0.14),L.skin,0,e);
  queue(MESH.sphere,child(root,0,1.86,0,0,0,0,0.18,0.21,0.19),L.skin,sh,e);
  if(L.hat){queue(MESH.sphere,child(root,0,1.97,-0.01,0,0,0,0.2,0.11,0.21),L.hat,0,e);if(L.badge)queue(MESH.box,child(root,0,1.95,0.14,0,0,0,0.34,0.04,0.16),L.hat,0,e);}
  else if(L.hair){queue(MESH.sphere,child(root,0,1.93,-0.03,0,0,0,0.195,0.16,0.2),L.hair,0,e);if(L.long)queue(MESH.box,child(root,0,1.76,-0.13,0,0,0,0.34,0.36,0.1),L.hair,0,e);}
  if(L.mask)queue(MESH.box,child(root,0,1.88,0.1,0,0,0,0.38,0.1,0.2),[.05,.05,.06,1],0,e);
  if(L.gold)queue(MESH.box,child(root,0,1.5,0.16,0,0,0,0.12,0.12,0.02),GOLDA,0);
  if(L.badge)queue(MESH.box,child(root,-0.13,1.47,0.16,0,0,0,0.08,0.1,0.02),GOLDA,0);
  // legs with knees
  for(const side of [-1,1]){const ph=h.phase+(side>0?Math.PI:0),kn=Math.max(0,Math.sin(ph))*mv*(0.6+run*0.5);
    const hip=child(root,side*0.13,0.94,0,side*sw,0,0);queue(MESH.box,child(hip,0,-0.23,0,0,0,0,0.2,0.46,0.22),L.pants,sh,e);
    const knee=child(hip,0,-0.46,0,kn,0,0);queue(MESH.box,child(knee,0,-0.2,0,0,0,0,0.18,0.42,0.2),L.pants,sh,e);
    queue(MESH.box,child(knee,0,-0.43,0.05,0,0,0,0.2,0.1,0.32),L.shoe,0,e);}
  // arms with elbows
  const aimGun=h.gun&&h.target&&h.alive;
  for(const side of [-1,1]){
    let ax=-side*sw*0.8,el=-0.25-run*0.9;if(h.armsUp>0){ax=-2.8+Math.sin(time*9+side)*0.25*h.armsUp;el=-0.2;}if(side>0&&(aimGun||time-h.punchT<0.2)){ax=-1.5;el=0;}
    const s=child(root,side*0.34,1.6,0,ax,0,side*0.08);queue(MESH.box,child(s,0,-0.16,0,0,0,0,0.15,0.34,0.16),L.shirt,sh,e);
    const eb=child(s,0,-0.32,0,el,0,0);queue(MESH.box,child(eb,0,-0.14,0,0,0,0,0.13,0.3,0.14),L.police||L.badge?L.shirt:L.skin,0,e);
    queue(MESH.sphere,child(eb,0,-0.32,0,0,0,0,0.075,0.08,0.075),L.skin,0,e);
    if(side>0&&aimGun)queue(MESH.box,child(eb,0,-0.32,0.12,0,0,0,0.07,0.12,0.34),DARKGUN,0);
  }
}
function drawMech(b){
  const root=at(b.pos.x,b.pos.y,b.pos.z,0,b.yaw,0),sw=Math.sin(b.phase)*0.38,bob=Math.abs(Math.sin(b.phase))*0.8,e=b.flash*0.5;
  const GUN=c4('#3a3f48'),OR=c4('#e07b1a'),DK=c4('#24272d');
  const hips=child(root,0,23+bob,0);
  queue(MESH.mbox,child(hips,0,0,0,0,0,0,11,4,6),GUN,F_SH,e);
  for(const side of [-1,1]){const hip=child(hips,side*4.2,-1,0,side*sw,0,0);queue(MESH.mbox,child(hip,0,-5,0,0,0,0,3.6,10,4.2),GUN,F_SH,e);
    queue(MESH.mcyl,child(hip,0,0,0,0,0,Math.PI/2,2,2.4,2),DK,F_SH,e);
    const knee=child(hip,0,-10,0,Math.max(0,-side*sw)*0.7+0.05,0,0);queue(MESH.box,child(knee,0,0,0.8,0,0,0,2.4,2.4,2.4),OR,F_SH,e);
    for(const x of [-1,1])queue(MESH.mcyl,child(knee,x*1.1,-4,-1.8,0.2,0,0,0.35,7,0.35),CHROME.concat(1),0,e);
    queue(MESH.mbox,child(knee,0,-5.5,0.3,0,0,0,3,11,3.4),GUN,F_SH,e);queue(MESH.mbox,child(knee,0,-11.2,1.2,0,0,0,4.6,1.6,8),GUN,F_SH,e);
    queue(MESH.box,child(knee,0,-11.2,5.3,0,0,0,4.8,1.2,0.6),OR,0,e);}
  const torso=child(hips,0,2,0,0.08,0,0);
  queue(MESH.mbox,child(torso,0,7,0,0,0,0,16,12,10),GUN,F_SH,e);queue(MESH.box,child(torso,0,8,5.1,0,0,0,10,6,0.6),OR,F_SH,e);
  for(const x of [-5,5])queue(MESH.mbox,child(torso,x,4,5.2,0,0,0,3,3,0.8),DK,0,e);
  for(const x of [-3,0,3])queue(MESH.mcyl,child(torso,x,11,-6,0,0,0,0.8,5,0.8),DK,F_SH,e);
  const pulse=0.7+Math.sin(time*6)*0.3;
  queue(MESH.glowSphere,child(torso,0,8,5.7,0,0,0,2.2,2.2,2.2),[1,.3*pulse,.1,1],0);queue(MESH.glowSphere,child(torso,0,8,5.9,0,0,0,4,4,4),[1,.3,.1,0.25*pulse],F_ADD);
  queue(MESH.mbox,child(torso,0,14.5,1,0,0,0,6,4,6),GUN,F_SH,e);queue(MESH.glowBox,child(torso,0,14.8,4.05,0,0,0,4.6,0.9,0.2),[1,.15,.1,1],0);
  for(const side of [-1,1]){queue(MESH.mbox,child(torso,side*8,14,-1,0,0,0,5,4,6),GUN,F_SH,e);queue(MESH.glowBox,child(torso,side*8,14,2.05,0,0,0,4,2.4,0.2),[1,.5,.1,1],0);
    const ax=side>0&&b.punchAnim>0?-1.4*b.punchAnim:-0.25+side*sw*0.3;
    const sh=child(torso,side*9.8,11,0,ax,0,side*0.12);queue(MESH.mbox,child(sh,0,-4.5,0,0,0,0,3.2,9,3.2),GUN,F_SH,e);
    queue(MESH.mbox,child(sh,0,-9.5,3.5,0,0,0,2.4,2.4,10),OR,F_SH,e);queue(MESH.glowBox,child(sh,0,-9.5,8.6,0,0,0,1.6,1.6,0.3),[1,.8,.3,1],0);}
}
const HEADL=[1,.93,.75,1],SIR_R=[1,.12,.1,1],SIR_B=[.15,.35,1,1],SIR_OFF=[.25,.25,.28,1],ROTOR_C=[.1,.11,.13,1];
function drawVehicle(v,mesh,x,y,z,rx,yaw,rz,tint,flash,siren,hw,hl,wreck){
  const q=inView(x,z,600,30);if(q<0)return;
  const root=at(x,y,z,rx,yaw,rz,VEH_S,VEH_S,VEH_S);queue(mesh,root,wreck?[.07,.065,.06,1]:tint,q<160*160?F_SH:0,flash*0.5);hw/=VEH_S;hl/=VEH_S;
  if(wreck||q>220*220)return;
  if(env.night>0.35&&q<180*180)for(const sx of [-1,1]){queue(MESH.glowSphere,child(root,sx*(hw-0.35),0.84,hl+0.2,0,0,0,0.45,0.35,0.3),[HEADL[0],HEADL[1],HEADL[2],0.55*env.night],F_ADD);
    queue(MESH.glowSphere,child(root,sx*(hw-0.3),0.86,-hl-0.15,0,0,0,0.3,0.25,0.2),[1,.1,.08,0.45*env.night],F_ADD);}
  if(siren){const on=Math.sin(time*14)>0;
    queue(MESH.glowBox,child(root,-0.38,1.8,-0.12,0,0,0,0.66,0.14,0.3),on?SIR_R:SIR_OFF,0);queue(MESH.glowBox,child(root,0.38,1.8,-0.12,0,0,0,0.66,0.14,0.3),on?SIR_OFF:SIR_B,0);
    queue(MESH.glowSphere,child(root,on?-0.4:0.4,1.9,-0.1,0,0,0,1.6,1.1,1.6),on?[1,.1,.1,0.35]:[.15,.3,1,0.35],F_ADD);}
}
function drawProps(){
  const night=env.night;
  for(let bi=0;bi<GRID*GRID;bi++){const m=propMeshes[bi];const i=(bi/GRID)|0,j=bi%GRID,cx=-HALF+(i+.5)*CELL,cz=-HALF+(j+.5)*CELL;
    const q=inView(cx,cz,440,90);if(q<0)continue;
    if(m)queue(m,ID,WHITE,q<170*170?F_SH:0);
    if(q>260*260)continue;
    for(const p of blockProps[bi]){if(!p.alive)continue;
      if(p.type==='tlight'){const c=lightFor(p.ix,p.iz,p.axis),y=c==='r'?5.3:c==='y'?4.92:4.54,col=c==='r'?[1,.15,.1,1]:c==='y'?[1,.75,.1,1]:[.2,1,.4,1];
        queue(MESH.glowBox,propM(p,0,y,3.27,0.24,0.24,0.03),col,0);if(night>0.2)queue(MESH.glowSphere,propM(p,0,y,3.35,0.6,0.6,0.3),[col[0],col[1],col[2],0.4*night],F_ADD);}
      else if(p.type==='lamp'&&night>0.25){queue(MESH.glowSphere,propM(p,0,7.0,1.7,1.1,0.6,1.1),[1,.78,.45,0.3*night],F_ADD);queue(MESH.disc,propM(p,0,0.28,1.7,5.5,1,5.5),[1,.75,.4,0.07*night],F_ADD);}}}
}
function drawRemote(r){
  if(!r.look||r.pos.y<-40||(r.flags&FLAG.invis))return;const q=inView(r.pos.x,r.pos.z,700,30);if(q<0)return;
  if(r.car){const mesh=CARS[r.car.model];drawVehicle(r,mesh,r.pos.x,r.pos.y,r.pos.z,0,r.car.yaw,0,r.car.tint,r.flash,r.car.model==='police',VDIM[r.car.model][0],VDIM[r.car.model][1],false);return;}
  if(r.flags&FLAG.dead){const root=at(r.pos.x,r.pos.y,r.pos.z,0,r.heroYaw,0);queue(MESH.box,child(root,0,0.25,0,0,0,0,0.8,0.4,2.2),r.look.suit,F_SH);return;}
  if(r.rag)drawRagdoll(r,ragColorsSuper(r.look));else if(r.alien)drawAlien(r,r.alien,false);else if(r.cn&&conHidesRider(r.cn)){}else{const ro=r.cn?riderOffset(r.cn,r.cz):0;r.pos.y+=ro;drawSuper(r,r.look,false);r.pos.y-=ro;}
  if(r.cn&&!r.rag)drawConstruct(r,r.cn,false);if(r.ex&&r.ex[0])queue(MESH.glowSphere,at(r.pos.x,r.pos.y+1.3,r.pos.z,0,0,0,3.2,3.2,3.2),[RING_C[0],RING_C[1],RING_C[2],0.14],F_ADD);
  if(r.beam){const w=r.beam.w||0;if(w>0.5){queue(MESH.glowBox,M4.beam(tmpM(),r.pos.x,r.pos.y+1.8,r.pos.z,r.beam.x,r.beam.y,r.beam.z,w*0.5),[1,1,1,1],F_ADD);queue(MESH.glowBox,M4.beam(tmpM(),r.pos.x,r.pos.y+1.8,r.pos.z,r.beam.x,r.beam.y,r.beam.z,w*1.4),[.6,.85,1,0.45],F_ADD);}
    else{queue(MESH.glowBox,M4.beam(tmpM(),r.eye.x,r.eye.y,r.eye.z,r.beam.x,r.beam.y,r.beam.z,0.1),[1,.55,.35,1],F_ADD);queue(MESH.glowBox,M4.beam(tmpM(),r.eye.x,r.eye.y,r.eye.z,r.beam.x,r.beam.y,r.beam.z,0.35),[.9,.08,.03,0.45],F_BL);}}
  if(r.web){let e=r.web;if(r.wt){const t=r.wt===MP.myPeer?P:MP.peers.get(r.wt);if(t)e=center(t);}queue(MESH.box,M4.beam(tmpM(),r.pos.x,r.pos.y+2.1,r.pos.z,e.x,e.y,e.z,0.06),[.95,.95,1,1],0);}
  if(r.tk){const g=1.6+Math.sin(time*6)*0.15;queue(MESH.glowSphere,at(r.tk.x,r.tk.y+1,r.tk.z,0,time,0,g,g,g),[.6,.35,1,0.22],F_ADD);queue(MESH.glowBox,M4.beam(tmpM(),r.pos.x,r.pos.y+1.9,r.pos.z,r.tk.x,r.tk.y+1,r.tk.z,0.12),[.7,.45,1,0.35],F_ADD);}
  if(r.flags&FLAG.shield)queue(MESH.glowSphere,at(r.pos.x,r.pos.y+1.35,r.pos.z,0,time,0,1.9,2.1,1.9),[.3,.75,1,0.25],F_ADD);
}
function buildDrawList(){
  dlN=0;
  if(!P.dead&&!P.car&&(state==='play'||creating||sheetOpen==='look'||state==='menu')){
    const A=P.alien;GHOST=A?(P.invisible>0?0.2:A.phase>0?0.4:0):P.phasing?0.45:0;
    if(A)drawAlien(P,A.id,true);else if(P.rag){const m=LOOK;m.metal=P.metal;drawRagdoll(P,ragColorsSuper(m));}else if(P.construct&&conHidesRider(P.construct.id)){/* inside the race car, or the suit has become the vehicle */}else{const m=LOOK;m.metal=P.metal;P.firing=!!beam;const ro=P.construct?riderOffset(P.construct.id):0,so=suitDrawOfs(),jx=(P.phasing||P.vibT>0?rr(-.07,.07):0)+(so?so[0]:0),jz=(jx&&!so?rr(-.07,.07):0)+(so?so[1]:0);P.pos.y+=ro;P.pos.x+=jx;P.pos.z+=jz;drawSuper(P,m,true);P.pos.y-=ro;P.pos.x-=jx;P.pos.z-=jz;}
    if(P.cp&&P.hand){const h=P.hand,k=Math.min(1,P.cp.t/1.2),s=0.3+k*0.6+Math.sin(time*30)*0.05;queue(MESH.glowSphere,at(h[12],h[13],h[14],0,0,0,s,s,s),[1,.85,.5,0.9],F_ADD);queue(MESH.glowSphere,at(h[12],h[13],h[14],0,0,0,s*2.5,s*2.5,s*2.5),[1,.6,.3,0.25*k],F_ADD);}
    GHOST=0;
    if(P.shieldOn){const s=1.9+Math.sin(time*6)*0.05;queue(MESH.glowSphere,at(P.pos.x,P.pos.y+1.35,P.pos.z,0,time,0,s,s*1.1,s),[.3,.75,1,0.16+0.2*clamp(P.shield/pstat('energyShield','absorb'),0,1)],F_ADD);}
    if(beam&&!bigBeam){const k=lvlK('laserVision'); // a thin orange line at first, a thick deep red beam when mastered
      for(const sd of [-0.1,0.1]){const ex=P.eye.x+Math.cos(P.heroYaw)*sd,ez=P.eye.z-Math.sin(P.heroYaw)*sd;
      queue(MESH.glowBox,M4.beam(tmpM(),ex,P.eye.y,ez,beam.x,beam.y,beam.z,0.035+0.07*k),[1,lerp(.75,.5,k),lerp(.5,.3,k),1],F_ADD);
      queue(MESH.glowBox,M4.beam(tmpM(),ex,P.eye.y,ez,beam.x,beam.y,beam.z,0.12+0.3*k),[lerp(1,.9,k),lerp(.45,.05,k),lerp(.25,.02,k),0.3+0.3*k],F_BL);}
      const g=(0.6+k*1.2)+Math.random()*0.4;queue(MESH.glowSphere,at(beam.x,beam.y,beam.z,0,0,0,g,g,g),[1,.5,.2,0.5+0.35*k],F_ADD);}
    const wp=P.web||P.zip;if(wp&&P.hand){const h=P.hand;queue(MESH.box,M4.beam(tmpM(),h[12],h[13],h[14],wp.x,wp.y,wp.z,0.06),[.95,.95,1,1],0);}
    if(P.tk&&!P.tk.giant)for(const a of [P.tk.a,...P.tk.more]){if(!a)continue;const c=center(a),s=(a.radius||1)*1.6*(0.8+tkLevel()*0.05);queue(MESH.glowSphere,at(c.x,c.y,c.z,0,0,0,s,s,s),[.6,.35,1,0.16+tkLevel()*0.015],F_ADD);}
  }
  for(const r of MP.peers.values()){const fr=r.tsUntil>time&&r.tsPos,sv=fr?r.pos.clone():null;if(fr)r.pos.copy(r.tsPos);GHOST=r.ex&&r.ex[1]?0.4:0;drawRemote(r);GHOST=0;if(fr)r.pos.copy(sv);}
  for(const r of rivals){if(inView(r.pos.x,r.pos.z,500)<0)continue;r.firing=time-(r.castT||-9)<0.3;if(r.rag)drawRagdoll(r,ragColorsSuper(r.look));else drawSuper(r,r.look,false);}
  for(const h of humans)drawHuman(h);
  for(const v of vehicles)drawVehicle(v,v.mesh,v.pos.x,v.pos.y,v.pos.z,v.rx,v.yaw,v.rz,v.tint,v.flash,v.siren,v.hw,v.hl,v.state==='wreck');
  for(const d of drones){const q=inView(d.pos.x,d.pos.z,500);if(q<0)continue;const bob=Math.sin(time*3+d.seed)*0.3;
    const root=at(d.pos.x,d.pos.y+bob,d.pos.z,Math.sin(time*2+d.seed)*0.1,d.yaw,Math.cos(time*2.3+d.seed)*0.1);
    queue(droneMesh,root,[1,1,1,1],F_SH,d.flash);
    if(q<150*150)for(let k=0;k<4;k++)queue(MESH.box,child(root,ROTORS[k][0],0.3,ROTORS[k][1],0,time*47+k,0,1.35,0.03,0.12),ROTOR_C,0);
    if(d.bag)queue(bagMesh,at(d.pos.x,d.pos.y+bob-1.5,d.pos.z,0,d.yaw,0),[1,1,1,1],F_SH);
    queue(MESH.glowSphere,at(d.pos.x,d.pos.y+bob,d.pos.z,0,0,0,3,3,3),[1,.15,.15,0.14],F_ADD);}
  for(const w of wrecks)queue(droneMesh,at(w.x,w.y,w.z,w.rx,w.ry,w.rz),[.25,.25,.25,1],0);
  if(boss){const b=boss;if(b.type==='ship'){queue(bossMesh,at(b.pos.x,b.pos.y,b.pos.z,0,b.spin,0),[1,1,1,1],F_SH,b.flash*0.6);
      const pulse=0.6+Math.sin(time*6)*0.3;queue(MESH.glowSphere,at(b.pos.x,b.pos.y-3,b.pos.z,0,0,0,10,3,10),[1,.35,.1,0.35*pulse],F_ADD);}
    else drawMech(b);}
  if(bank&&vaultY>-100){queue(MESH.box,at(bank.vault.x,vaultY,bank.vault.z,0,0,0,12,7,10),c4('#5d6470'),F_SH);queue(MESH.box,at(bank.vault.x,vaultY,bank.vault.z-5.05,0,0,0,4,4,0.2),c4('#8b93a0'),0);
    const hc=crimes.find(c=>c.type==='vault');if(hc&&hc.boss&&hc.boss.alive){const b=hc.boss,mid=(vaultY+b.pos.y)/2,len=b.pos.y-vaultY;const p=0.5+Math.sin(time*5)*0.2;
      queue(MESH.tube,at(bank.vault.x,mid,bank.vault.z,0,time,0,8,len,8),[.4,1,.7,0.18*p],F_ADD);queue(MESH.tube,at(bank.vault.x,mid,bank.vault.z,0,0,0,4,len,4),[.6,1,.8,0.25*p],F_ADD);}}
  for(const c of crimes)if(c.type==='shop'&&c.shop&&Math.sin(time*10)>0)queue(MESH.glowBox,at(c.shop.fx,5.8,c.shop.fz,0,0,0,0.5,0.5,0.5),[1,.1,.1,1],0);
  drawProps();drawRubble();drawHelis();drawHeroAbilities();drawSpider();drawRing();drawBody();drawSuit();
  for(const w of windows){if(inView(w.x,w.z,320)<0)continue;const ax=w.nx!==0;
    queue(MESH.box,at(w.x,w.y,w.z,0,0,0,ax?0.06:2.1,2.3,ax?2.1:0.06),[.02,.02,.025,1],F_UN);
    for(const [u,v,s] of [[-0.8,0.9,0.5],[0.85,-0.8,0.4],[0.7,0.95,0.3]])queue(MESH.box,at(w.x+(ax?w.nx*0.02:u),w.y+v,w.z+(ax?u:w.nz*0.02),0,0,u*0.8,ax?0.04:s,s*0.8,ax?s:0.04),[.55,.7,.8,1],0);}
  for(const s of spikes){const k=Math.min(1,(3-s.t)*6)*Math.min(1,s.t*2),h=3*s.s*k;
    queue(MESH.cone,at(s.x,s.y+h/2,s.z,0,s.s*7,0,0.7*s.s,h,0.7*s.s),[.62,.85,1,1],F_SH,0.3);
    queue(MESH.cone,at(s.x+0.6*s.s,s.y+h*0.3,s.z-0.3*s.s,0.3,0,-0.3,0.35*s.s,h*0.6,0.35*s.s),[.75,.92,1,1],0,0.3);}
  for(const T of tornados){const k=Math.min(1,T.t);queue(MESH.cone,at(T.x,T.y+12,T.z,Math.PI,T.a,0,7,24,7),[.75,.8,.82,0.16*k],F_BL);queue(MESH.cone,at(T.x,T.y+12,T.z,Math.PI,-T.a*1.3,0,4.5,24,4.5),[.85,.9,.9,0.12*k],F_BL);}
  for(const o of orbs){if(!o.active)continue;if(inView(o.x,o.z,420)<0)continue;
    const c=ORB_COL[o.type],y=o.y+Math.sin(time*2+o.ph)*0.4,s=(o.type==='red'?0.8:o.type==='blue'?0.65:0.5)*(1+Math.sin(time*4+o.ph)*0.08);
    queue(MESH.glowSphere,at(o.x,y,o.z,time+o.ph,time*1.3,0,s,s,s),[c[0],c[1],c[2],1],0);
    queue(MESH.glowSphere,at(o.x,y,o.z,0,0,0,s*2.8,s*2.8,s*2.8),[c[0],c[1],c[2],0.25],F_ADD);}
  for(const p of projs){
    if(p.rock){queue(MESH.box,at(p.x,p.y,p.z,time*5,time*3,0,1.1,0.9,1.0),[.25,.18,.14,1],F_SH);queue(MESH.glowSphere,at(p.x,p.y,p.z,0,0,0,1.3,1.3,1.3),[1,.4,.1,0.4],F_ADD);}
    else if(p.kind==='fire'){const f=clamp((p.radius||3)/4.2,0.6,1.8);queue(MESH.glowSphere,at(p.x,p.y,p.z,0,0,0,0.7*f,0.7*f,0.7*f),[1,.6,.2,1],0);queue(MESH.glowSphere,at(p.x,p.y,p.z,0,0,0,1.8*f,1.8*f,1.8*f),[1,.35,.05,0.4],F_ADD);}
    else if(p.kind==='blast'){const f=p.big||1;queue(MESH.glowSphere,at(p.x,p.y,p.z,0,0,0,0.5*f,0.5*f,0.5*f),[.5,.9,1,1],0);queue(MESH.glowSphere,at(p.x,p.y,p.z,0,0,0,1.4*f,1.4*f,1.4*f),[.2,.6,1,0.4],F_ADD);}
    else if(p.kind==='bolt'){let px=p.x,py=p.y,pz=p.z;for(let i=1;i<=3;i++){const qx=p.x-p.vx*0.012*i+rr(-.4,.4),qy=p.y-p.vy*0.012*i+rr(-.4,.4),qz=p.z-p.vz*0.012*i+rr(-.4,.4);queue(MESH.glowBox,M4.beam(tmpM(),px,py,pz,qx,qy,qz,0.18),[1,.9,.5,1],F_ADD);px=qx;py=qy;pz=qz;}queue(MESH.glowSphere,at(p.x,p.y,p.z,0,0,0,1.1,1.1,1.1),[1,.8,.3,0.5],F_ADD);}
    else if(p.kind==='ring'){const s=p.small?0.28:0.5*(p.big||1);queue(MESH.glowBox,M4.beam(tmpM(),p.x,p.y,p.z,p.x-p.vx*0.02,p.y-p.vy*0.02,p.z-p.vz*0.02,s*0.7),[RING_C[0],RING_C[1],RING_C[2],1],0);queue(MESH.glowSphere,at(p.x,p.y,p.z,0,0,0,s*2.4,s*2.4,s*2.4),[RING_C[0],RING_C[1],RING_C[2],0.35],F_ADD);}
    else if(p.kind==='web'){queue(MESH.sphere,at(p.x,p.y,p.z,time*6,time*4,0,0.55,0.55,0.55),[.95,.95,1,1],0);}
    else if(p.kind==='rocket'){queue(MESH.glowBox,M4.beam(tmpM(),p.x,p.y,p.z,p.x-p.vx*0.03,p.y-p.vy*0.03,p.z-p.vz*0.03,0.5),[1,.6,.3,1],0);}
    else{queue(MESH.glowSphere,at(p.x,p.y,p.z,0,0,0,0.45,0.45,0.45),[1,.25,.2,1],0);queue(MESH.glowBox,M4.beam(tmpM(),p.x,p.y,p.z,p.x-p.vx*0.05,p.y-p.vy*0.05,p.z-p.vz*0.05,0.3),[1,.2,.15,0.5],F_ADD);}}
  for(const t of tracers){const k=t.life/t.max;queue(MESH.glowBox,M4.beam(tmpM(),t.ax,t.ay,t.az,t.bx,t.by,t.bz,t.w),[t.col[0],t.col[1],t.col[2],k],F_ADD);}
  for(const r of rings){const k=r.t/r.dur,e=1-Math.pow(1-k,3),rad=lerp(r.r0,r.r1,e);
    const M=r.dir?M4.alignY(tmpM(),r.x,r.y,r.z,r.dir[0],r.dir[1],r.dir[2],rad):at(r.x,r.y,r.z,0,0,0,rad,1,rad);queue(MESH.ring,M,[r.col[0],r.col[1],r.col[2],1-k],F_ADD);}
  for(const s of scorches){const f=Math.min(1,s.life/10);queue(MESH.disc,M4.alignY(tmpM(),s.x,s.y,s.z,s.nx,s.ny,s.nz,s.r),[.015,.013,.012,0.8*f],F_BL);
    if(s.cr){queue(MESH.ring,M4.alignY(tmpM(),s.x+s.nx*0.03,s.y+s.ny*0.03,s.z+s.nz*0.03,s.nx,s.ny,s.nz,s.r*1.25),[.33,.31,.29,0.9*f],F_BL);queue(MESH.disc,M4.alignY(tmpM(),s.x+s.nx*0.02,s.y+s.ny*0.02,s.z+s.nz*0.02,s.nx,s.ny,s.nz,s.r*0.55),[0,0,0,0.9*f],F_BL);}}
  for(const d of debris){const q=inView(d.x,d.z,260);if(q<0)continue;queue(d.mesh||MESH.box,at(d.x,d.y,d.z,d.rx,d.ry,d.rz,d.dx||d.s,d.dy||d.s*0.7,d.dz||d.s*1.1),d.tint,q<60*60?F_SH:0);}
}

// ================================================================
// Render
// ================================================================
function setMainFrameUniforms(){
  const u=MAIN.u;
  gl.uniformMatrix4fv(u.uVP,false,VP);gl.uniformMatrix4fv(u.uLVP,false,LVP);
  gl.uniform3fv(u.uLDir,env.ldir);gl.uniform3fv(u.uLCol,env.lcol);gl.uniform3fv(u.uSky,env.sky);gl.uniform3fv(u.uGnd,env.gnd);
  gl.uniform3fv(u.uFogC,env.hor);gl.uniform2f(u.uFog,state==='play'?160:300,state==='play'?1150:1500);
  gl.uniform3f(u.uCam,camPos.x,camPos.y,camPos.z);gl.uniform1f(u.uNight,env.night);gl.uniform1f(u.uTime,time);gl.uniform1f(u.uExpo,1.0);
  gl.uniform1f(u.uShTexel,1/SHADOW);gl.uniform1i(u.uShadow,0);gl.uniform1f(u.uShOn,save.settings.shadows?1:0);
  const n=gatherLights();gl.uniform1f(u.uPLn,n);if(n){gl.uniform4fv(u.uPL,PL_POS);gl.uniform3fv(u.uPLC,PL_COL);}
}
// the nearest lit street lamps (and car headlights) light the street around them at night
const PL_MAX=20,PL_POS=new Float32Array(PL_MAX*4),PL_COL=new Float32Array(PL_MAX*3),plCand=[];
function gatherLights(){
  const night=env.night;if(night<0.08)return 0;
  const fx=state==='play'?P.pos.x:camPos.x,fz=state==='play'?P.pos.z:camPos.z;plCand.length=0;
  const bi0=Math.floor((fx+HALF)/CELL),bj0=Math.floor((fz+HALF)/CELL);
  for(let i=bi0-2;i<=bi0+2;i++)for(let j=bj0-2;j<=bj0+2;j++){if(i<0||j<0||i>=GRID||j>=GRID)continue;
    for(const p of blockProps[i*GRID+j]){if(p.type!=='lamp'||!p.alive)continue;const x=p.x+Math.sin(p.yaw)*1.7,z=p.z+Math.cos(p.yaw)*1.7,d=(x-fx)**2+(z-fz)**2;
      if(d<200*200)plCand.push({x,y:p.y+6.2,z,d,r:28,c:0});}}
  for(const v of vehicles){if(!v.alive||v.state==='wreck'||v.state==='parked'||v.state==='thrown')continue;const d=(v.pos.x-fx)**2+(v.pos.z-fz)**2;if(d>120*120)continue;
    const s=Math.sin(v.yaw),c=Math.cos(v.yaw),hl=v.hl||2;plCand.push({x:v.pos.x+s*(hl+5),y:v.pos.y+1.2,z:v.pos.z+c*(hl+5),d:d+900,r:13,c:1});}
  plCand.sort((a,b)=>a.d-b.d);const n=Math.min(PL_MAX,plCand.length);
  for(let k=0;k<n;k++){const L=plCand[k],fade=clamp(1.4-Math.sqrt(L.d)/170,0,1)*night;
    PL_POS[k*4]=L.x;PL_POS[k*4+1]=L.y;PL_POS[k*4+2]=L.z;PL_POS[k*4+3]=L.r;
    const col=L.c?[0.9,0.9,0.8]:[1,0.72,0.42];PL_COL[k*3]=col[0]*fade;PL_COL[k*3+1]=col[1]*fade;PL_COL[k*3+2]=col[2]*fade;}
  return n;
}
const ID=M4.create(),WHITE=[1,1,1,1];
function drawItem(mesh,M,tint,unlit,emis){
  const u=MAIN.u;gl.uniformMatrix4fv(u.uM,false,M);gl.uniform4fv(u.uTint,tint);gl.uniform1f(u.uUnlit,unlit?1:0);gl.uniform1f(u.uEmis,emis);
  gl.bindVertexArray(mesh.vao);gl.drawElements(gl.TRIANGLES,mesh.n,mesh.type,0);
}
function render(){
  if(save.settings.shadows){
    gl.bindFramebuffer(gl.FRAMEBUFFER,shFbo);gl.viewport(0,0,SHADOW,SHADOW);
    gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(2.0,4.0);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);
    gl.useProgram(DEPTH.p);gl.uniformMatrix4fv(DEPTH.u.uLVP,false,LVP);
    gl.uniformMatrix4fv(DEPTH.u.uM,false,ID);gl.bindVertexArray(cityMesh.vao);gl.drawElements(gl.TRIANGLES,cityMesh.n,cityMesh.type,0);
    for(let i=0;i<dlN;i++){const d=drawList[i];if(!(d.flags&F_SH))continue;gl.uniformMatrix4fv(DEPTH.u.uM,false,d.M);gl.bindVertexArray(d.mesh.vao);gl.drawElements(gl.TRIANGLES,d.mesh.n,d.mesh.type,0);}
    gl.disable(gl.POLYGON_OFFSET_FILL);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,W,H);
  gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.BLEND);gl.useProgram(SKY.p);const s=SKY.u,th=Math.tan(fov*Math.PI/360);
  gl.uniform3f(s.uFwd,camF.x,camF.y,camF.z);gl.uniform3f(s.uRight,camR.x,camR.y,camR.z);gl.uniform3f(s.uUp,camU.x,camU.y,camU.z);
  gl.uniform2f(s.uTan,th*W/H,th);gl.uniform3fv(s.uSunDir,env.sun);gl.uniform3fv(s.uZen,env.zen);gl.uniform3fv(s.uHor,env.hor);gl.uniform3fv(s.uSunCol,env.suncol);
  gl.uniform1f(s.uNight,env.night);gl.uniform1f(s.uTime,time);gl.uniform1f(s.uExpo,1.0);
  gl.bindVertexArray(skyVao);gl.drawArrays(gl.TRIANGLES,0,3);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
  gl.useProgram(MAIN.p);setMainFrameUniforms();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shTex);
  drawItem(waterMesh,ID,WHITE,false,0);drawItem(groundMesh,ID,WHITE,false,0);drawItem(lakeMesh,ID,WHITE,false,0);drawItem(cityMesh,ID,WHITE,false,0);
  for(let i=0;i<dlN;i++){const d=drawList[i];if(d.flags&(F_ADD|F_BL))continue;drawItem(d.mesh,d.M,d.tint,d.flags&F_UN,d.emis);}
  gl.enable(gl.BLEND);gl.depthMask(false);gl.disable(gl.CULL_FACE);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  for(let i=0;i<dlN;i++){const d=drawList[i];if(!(d.flags&F_BL))continue;drawItem(d.mesh,d.M,d.tint,true,0);}
  gl.useProgram(PART.p);gl.uniformMatrix4fv(PART.u.uVP,false,VP);gl.uniform1f(PART.u.uScale,H/(2*Math.tan(fov*Math.PI/360)));
  SMOKE.draw(0.3+0.7*(1-env.night));
  gl.useProgram(MAIN.p);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
  for(let i=0;i<dlN;i++){const d=drawList[i];if(!(d.flags&F_ADD))continue;drawItem(d.mesh,d.M,d.tint,true,0);}
  gl.useProgram(PART.p);gl.blendFunc(gl.ONE,gl.ONE);FX.draw(1);
  gl.disable(gl.BLEND);gl.depthMask(true);gl.bindVertexArray(null);
}
