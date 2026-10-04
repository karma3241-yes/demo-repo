// ================================================================
// Kathana, stage 2: the scream, the split, the Perfect Form, the break-free QTE and the duel; then the super-powered world
// ================================================================
// Flow (KA.phase): all four orbs gone -> kathanaStage2 -> 'scream' (4.2 s cutscene WITH control: letterbox, shake, flashes, the floor cracks, a distorted roar) ->
// 'split' (8 s cutscene, no control: the body is drawn twice with a clip plane (kSplitDraw), the halves slide apart, topple and sink; the Perfect Form (actor kind
// 'kperfect', PF.real) appears in the light, floats down and faces you) -> 'qte' (KQ: you are frozen in a gold grip, mash Space / tap, 5 s; a fail hurts and restarts
// after 2 s, after 3 fails it fills by itself) -> 'fight' (the duel) -> 'won' (shatter, white-out, back to the city, cutscene, the world upgrade).
// Save: story.kathana 1 = stage 1 reached, 2 = defeated; story.kp 1 = the Perfect Form was reached (a retry after being knocked out starts there, orbs not redone).
// Winning (first time): kathana=2, invasion=1, and ufo=4 (skipped for good) if the UFO event wasn't done. While kathana>=2 every human spawns with x2 HP, x1.5 speed
// and a random power (humanSuper / superTick, 50_npcs.js calls the first, kathanaTick the second).
var KQ={on:false,phase:'',meter:0,t:0,n:0,fails:0}; // var: cutLocked (66b_story.js) reads it
const PF={on:false,real:null,list:[],fight:false,show:false,bar:0,won:false,split:0,still:null,stillCd:6,dmgW:0,evCd:0,shards:[],od:1,decAtk:0,decGate:0,popN:0,popT:-9,tmp:[]};
const PF_DEC=50; // afterimages per split: the figures are drawn lite, think cheaply and at most 3 of them attack at once
const KW={first:false}; // the win that is playing out (pfClear must not reset it: the zone is left in the middle of it)
const PF_HP=36000,PFH=1.38; // the model is 1.95 tall; the hero is about 2.8
const KQ_NEED=5; // seconds
const sm01=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const inKS=()=>KA.on&&inVoid()&&!KA.lost;
// ================================================================
// Meshes: polished chrome (mat 8, see the shader) built from smooth shapes
// ================================================================
function primCylZ(seg,rt,rb){const p=primCyl(seg,rt,rb,true);for(let i=0;i<p.pos.length;i+=3){const y=p.pos[i+1],z=p.pos[i+2];p.pos[i+1]=-z;p.pos[i+2]=y;const ny=p.nor[i+1],nz=p.nor[i+2];p.nor[i+1]=-nz;p.nor[i+2]=ny;}return p;} // axis along +z
const PFS=primMesh(primSphere(40,28),8),PFC=primMesh(primCylZ(30,0.76,1),8),PFT=primMesh(primTorus(1,0.028,80,12),8),PFD=primMesh(primSphere(4,2),8),PFB=primMesh(PRIM.box,8),PFG=primMesh(primTorus(1,0.02,64,8),6);
function pfEll(mesh,x,y,z,dx,dy,dz,rx,ry,rz,tint,fl){const M=M4.alignY(tmpM(),x,y,z,dx,dy,dz,1);queue(mesh,M4.mul(tmpM(),M,at(0,0,0,0,0,0,rx,ry,rz)),tint,fl);}
const pfLW=(R,x,y,z)=>[R[0]*x+R[4]*y+R[8]*z+R[12],R[1]*x+R[5]*y+R[9]*z+R[13],R[2]*x+R[6]*y+R[10]*z+R[14]];
function pfIK(S,T,l1,l2,p){ // two-bone chain: [elbow x,y,z, clamped end x,y,z]
  let dx=T[0]-S[0],dy=T[1]-S[1],dz=T[2]-S[2],d=Math.hypot(dx,dy,dz)||1e-3;const mx=(l1+l2)*0.998;if(d>mx){dx*=mx/d;dy*=mx/d;dz*=mx/d;d=mx;}
  const ux=dx/d,uy=dy/d,uz=dz/d,a=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a));
  let px=p[0],py=p[1],pz=p[2];const dp=px*ux+py*uy+pz*uz;px-=dp*ux;py-=dp*uy;pz-=dp*uz;const pl=Math.hypot(px,py,pz)||1;
  return [S[0]+ux*a+px/pl*h,S[1]+uy*a+py/pl*h,S[2]+uz*a+pz/pl*h,S[0]+dx,S[1]+dy,S[2]+dz];
}
// the figure: a sculpture of a being, ellipsoids and tapered limbs, no edges anywhere, a thin glowing seam down the featureless face
function pfFigure(a,t){
  if(a.al<=0.02||!a.vis)return;
  const al=a.al,k=PFH*a.sc,fl=al<0.97?F_BL:0,T=[0.94,0.96,1,al],GL=[1,0.93,0.7,al],bob=Math.sin(t*1.9+a.ph)*0.05;
  const R=at(a.pos.x,a.pos.y+(0.16+bob)*k,a.pos.z,a.lean,a.yaw,0,k,k,k);
  const E=(x,y,z,sx,sy,sz,rx,ry,rz)=>queue(PFS,child(R,x,y,z,rx||0,ry||0,rz||0,sx,sy,sz),T,fl);
  const L=(A,B,r0,r1)=>{const wa=pfLW(R,A[0],A[1],A[2]),wb=pfLW(R,B[0],B[1],B[2]);queue(PFC,M4.beam(tmpM(),wa[0],wa[1],wa[2],wb[0],wb[1],wb[2],r0*k),T,fl);};
  const J=(P3,r)=>queue(PFS,child(R,P3[0],P3[1],P3[2],0,0,0,r,r,r),T,fl);
  const RING=(P3,dx,dy,dz,r)=>{const w=pfLW(R,P3[0],P3[1],P3[2]);queue(PFG,M4.alignY(tmpM(),w[0],w[1],w[2],R[0]*dx+R[4]*dy+R[8]*dz,R[1]*dx+R[5]*dy+R[9]*dz,R[2]*dx+R[6]*dy+R[10]*dz,r*k),GL,fl);};
  // pelvis, belly, chest, collar
  E(0,0.97,0,0.19,0.125,0.14);E(0,1.14,0,0.15,0.13,0.11);E(0,1.38,0,0.235,0.23,0.15);E(0,1.47,0.1,0.18,0.1,0.075,-0.15);E(0,1.57,0,0.25,0.06,0.12);
  RING([0,1.1,0],0,1,0,0.16);RING([0,1.585,0.0],0,1,0,0.115);
  // neck and head (an egg), the seam
  L([0,1.58,0],[0,1.7,0.015],0.05,0.045);E(0,1.84,0,0.105,0.145,0.12);E(0,1.765,0.03,0.082,0.085,0.095);
  queue(MESH.glowSphere,child(R,0,1.835,0.119,0,0,0,0.009,0.152,0.013),[1,0.88,0.5,al],fl);queue(MESH.glowSphere,child(R,0,1.835,0.12,0,0,0,0.03,0.17,0.02),[1,0.85,0.4,al*0.3],F_BL);
  queue(MESH.glowSphere,child(R,0,1.985,0.04,0,0,0,0.006,0.01,0.09),GL,fl);
  queue(MESH.glowSphere,child(R,0,1.43,0.152,0,0,0,0.028,0.028,0.02),[1,0.8,0.35,al],fl); // a warm gem at the breastbone
  // arms: shoulder -> elbow -> wrist -> hand
  for(let i=0;i<2;i++){
    const sd=i?1:-1,S=[sd*0.31,1.52,0],Hn=a.hd[i],r=pfIK(S,Hn,0.3,0.29,[sd*0.7,-0.6,-0.5]),el=[r[0],r[1],r[2]],wr=[r[3],r[4],r[5]];
    E(sd*0.325,1.585,0,0.115,0.07,0.125,0,0,-sd*0.35);J(S,0.078);L(S,el,0.064,0.05);J(el,0.052);L(el,wr,0.05,0.036);J(wr,0.04);
    const fx=wr[0]-el[0],fy=wr[1]-el[1],fz=wr[2]-el[2],fl2=Math.hypot(fx,fy,fz)||1,ux=fx/fl2,uy=fy/fl2,uz=fz/fl2;
    RING(wr,ux,uy,uz,0.047);
    const hc=[wr[0]+ux*0.07,wr[1]+uy*0.07,wr[2]+uz*0.07],hw=pfLW(R,hc[0],hc[1],hc[2]),dxw=R[0]*ux+R[4]*uy+R[8]*uz,dyw=R[1]*ux+R[5]*uy+R[9]*uz,dzw=R[2]*ux+R[6]*uy+R[10]*uz;
    pfEll(PFS,hw[0],hw[1],hw[2],dxw,dyw,dzw,0.052*k,0.1*k,0.036*k,T,fl);
    const th=pfLW(R,hc[0]+sd*0.03,hc[1]+uy*0.0,hc[2]+0.02);pfEll(PFS,th[0],th[1],th[2],dxw,dyw,dzw,0.014*k,0.045*k,0.014*k,T,fl);
    a.hw[i][0]=hw[0];a.hw[i][1]=hw[1];a.hw[i][2]=hw[2];
  }
  // legs: hip -> knee -> ankle, a long pointed foot (it floats)
  for(let i=0;i<2;i++){
    const sd=i?1:-1,S=[sd*0.115,0.95,0],F=a.ft[i],r=pfIK(S,F,0.45,0.44,[0,0.15,1]),kn=[r[0],r[1],r[2]],an=[r[3],r[4],r[5]];
    J(S,0.09);L(S,kn,0.085,0.066);J(kn,0.07);L(kn,an,0.062,0.04);J(an,0.042);RING(an,an[0]-kn[0],an[1]-kn[1],an[2]-kn[2],0.05);
    E(an[0],an[1]-0.035,an[2]+0.085,0.05,0.045,0.14,0.32,0,0);
  }
  // a halo behind the head and a thin ring that turns about the chest
  queue(PFT,child(R,0,1.87,-0.2,Math.PI/2,0,0,0.34,0.34,0.34),T,fl);
  queue(PFG,child(R,0,1.4,0,0.5+0.25*Math.sin(t*0.8),t*0.5,0,0.5,0.5,0.5),[1,0.9,0.6,al*0.85],fl);
  if(a.real&&fl===0){const p=0.5+0.5*Math.sin(t*3);queue(MESH.glowSphere,child(R,0,1.1,0,0,0,0,0.78,1.2,0.62),[1,0.9,0.55,0.07+0.04*p],F_BL);queue(MESH.glowSphere,child(R,0,1.1,0,0,0,0,1.15,1.6,0.9),[1,0.85,0.45,0.035],F_BL);}
  if(a.flash>0.02)queue(MESH.glowSphere,child(R,0,1.1,0,0,0,0,0.6,1.1,0.5),[1,1,1,a.flash*0.55],F_BL);
  if(a.glow>0.02){const g=a.glow,h=a.hand||0,w=a.hw[h];queue(MESH.glowSphere,at(w[0],w[1],w[2],0,0,0,0.25*g*k,0.25*g*k,0.25*g*k),[1,0.85,0.4,1],0);queue(MESH.glowSphere,at(w[0],w[1],w[2],0,0,0,0.7*g*k,0.7*g*k,0.7*g*k),[1,0.7,0.2,0.3],F_BL);}
}
// the same sculpture in nine pieces, for the fakes (and the real one while it hides among them) that are only circling (no hands to pose, no seam, no shadow): 50 of them are on screen at once
const PFL=[[-0.31,1.52,0,-0.28,1.2,0.4,0.07],[0.31,1.52,0,0.3,1.12,0.44,0.07],[-0.115,0.95,0,-0.12,0.2,0.05,0.085],[0.115,0.95,0,0.12,0.22,-0.05,0.085]]; // arm and leg: from x y z to x y z, radius
function pfFigureLite(a,t){
  if(a.al<=0.02||!a.vis)return;
  const al=a.al,k=PFH*a.sc,fl=al<0.97?F_BL:0,T=a.tt||(a.tt=[0.94,0.96,1,1]);T[3]=al; // one tint per fake, kept in place
  const R=at(a.pos.x,a.pos.y+(0.16+Math.sin(t*1.9+a.ph)*0.05)*k,a.pos.z,a.lean,a.yaw,0,k,k,k);
  queue(PFS,child(R,0,1.3,0,0,0,0,0.24,0.38,0.14),T,fl);queue(PFS,child(R,0,0.97,0,0,0,0,0.19,0.125,0.14),T,fl);queue(PFS,child(R,0,1.57,0,0,0,0,0.25,0.06,0.12),T,fl);queue(PFS,child(R,0,1.84,0,0,0,0,0.105,0.145,0.12),T,fl);
  for(let i=0;i<4;i++){const q=PFL[i];queue(PFC,M4.beam(tmpM(),R[0]*q[0]+R[4]*q[1]+R[8]*q[2]+R[12],R[1]*q[0]+R[5]*q[1]+R[9]*q[2]+R[13],R[2]*q[0]+R[6]*q[1]+R[10]*q[2]+R[14],R[0]*q[3]+R[4]*q[4]+R[8]*q[5]+R[12],R[1]*q[3]+R[5]*q[4]+R[9]*q[5]+R[13],R[2]*q[3]+R[6]*q[4]+R[10]*q[5]+R[14],q[6]*k),T,fl);}
  queue(PFT,child(R,0,1.87,-0.2,Math.PI/2,0,0,0.34,0.34,0.34),T,fl);
  if(a.real&&fl===0){const p=0.5+0.5*Math.sin(t*3);queue(MESH.glowSphere,child(R,0,1.1,0,0,0,0,0.78,1.2,0.62),[1,0.9,0.55,0.07+0.04*p],F_BL);queue(MESH.glowSphere,child(R,0,1.1,0,0,0,0,1.15,1.6,0.9),[1,0.85,0.45,0.035],F_BL);} // the real one's faint glow, the only tell
}
// ================================================================
// The actor
// ================================================================
function pfMake(x,y,z,dec){
  const a={kind:'kperfect',faction:'kathana',zid:'void',name:dec?'Afterimage':'Kathana, Perfect Form',alive:true,hp:dec?1e9:PF_HP,maxHp:dec?1e9:PF_HP,pos:new V3(x,y,z),vel:new V3(),yaw:0,heroYaw:0,flash:0,stun:0,slow:0,slowT:0,burn:0,burnDps:0,held:false,thrown:null,cy:1.45,radius:1.25,ys:1,lastHit:-99,grudge:null,grudgeT:-99,bigBoss:true,
    dec:!!dec,real:!dec,al:0,alT:1,sc:1,vis:true,lean:0,ph:rr(0,TAU),st:'orbit',t:0,cd:dec?rr(2,3.5):1.2,ang:rr(0,TAU),mv:null,last:'',pose:'guard',hand:1,glow:0,stag:0,life:dec?rr(30,45):26,popping:false,rad:rr(9,27),hy:rr(-2,9),dsp:(Math.random()<0.5?-1:1)*rr(0.35,0.6),
    hd:[[-0.3,1.15,0.38],[0.3,1.1,0.42]],ht:[[-0.3,1.15,0.38],[0.3,1.1,0.42]],ft:[[-0.12,0.18,0.06],[0.12,0.22,-0.06]],hw:[[0,0,0],[0,0,0]],sgCap:{dark:0.25,blast:0.7}};
  a.onHit=(src,amt)=>pfHit(a,amt);a.onDefeat=()=>{if(a.dec)pfPop(a);else pfDefeated();};
  actors.push(a);PF.list.push(a);if(!dec){PF.real=a;PF.on=true;}return a;
}
function pfHit(a,amt){
  if(a.dec){if(!a.popping){a.alive=false;pfPop(a);}return;}
  PF.dmgW+=amt;if(a.stag>0)a.hp-=amt*0.5; // staggered: hits count half again
}
function pfPop(a){ // an afterimage shatters into mirror shards (a small burst for the 50 fakes, and only one sound per instant)
  if(a.popping)return;a.popping=true;a.alive=false;a.alT=0;PF.popN++;const c=center(a),d=a.dec;
  for(let i=0,n=d?3:14;i<n;i++){const s=rr(0.25,0.6);spawnPiece(c.x+rr(-1,1),c.y+rr(-1.2,1.2),c.z+rr(-1,1),PFB,s*0.4,s*1.5,s*0.4,[1,1,1],rr(-14,14),rr(4,18),rr(-14,14),d?1.6:3,[rr(0,3),rr(0,3),0]);}
  burst(c.x,c.y,c.z,d?7:30,14,0.7,[[1,.9,.6],[1,1,1]],1.4,-2,1);
  if(!d||time-PF.popT>0.07){PF.popT=time;SFX.glass(0.8*SFX.vol(c.x,c.y,c.z));if(!d)SFX.tone('sine',1400,300,0.3,0.07);}
}
const pfFace=(a,dt,k)=>{a.yaw=angLerp(a.yaw,Math.atan2(P.pos.x-a.pos.x,P.pos.z-a.pos.z),damp(k||10,dt));};
function pfClampPos(a){const ox=a.pos.x-KAR.x,oz=a.pos.z-KAR.z,r=Math.hypot(ox,oz);if(r>470){a.pos.x=KAR.x+ox/r*470;a.pos.z=KAR.z+oz/r*470;}a.pos.y=clamp(a.pos.y,0,170);}
function pfSteer(a,tx,ty,tz,sp,dt){const dx=tx-a.pos.x,dy=ty-a.pos.y,dz=tz-a.pos.z,d=Math.hypot(dx,dy,dz);if(d>0.02){const s=Math.min(d*3.2,sp)*dt/d;a.pos.x+=dx*s;a.pos.y+=dy*s;a.pos.z+=dz*s;}pfClampPos(a);}
const pfHurt=(a,f,kn)=>{if(!P.dead)Damage.apply(a,P,kDmg(f*(a.dec?0.5:1)*0.7),'blast',{knock:kn||0});};
const pfPh2=()=>PF.real&&PF.real.hp<=PF_HP*0.5;
function pfDone(a){a.st='orbit';a.cd=a.dec?rr(3,9):pfPh2()?rr(0.7,1.2):rr(1.2,2.0);a.pose='guard';a.lean=0;a.mv=null;a.ang=Math.atan2(a.pos.z-P.pos.z,a.pos.x-P.pos.x);}
function pfFx(a,col){const c=center(a);ringFx(c.x,c.y,c.z,0.5,5,0.3,col||[1,.9,.6]);burst(c.x,c.y,c.z,18,10,0.5,[[1,.9,.6],[1,1,1]],1.1,0,2);KA.fx.push({x:c.x,y:c.y,z:c.z,t:0,dur:0.4,r0:1,r1:9,col:col||[1,.9,.6]});}
// ================================================================
// The pose: where the hands and feet want to be (local, y up, z forward)
// ================================================================
function pfPose(a,dt){
  const H=a.ht,F=a.ft,p=a.pose,s=(i,x,y,z)=>{H[i][0]=x;H[i][1]=y;H[i][2]=z;},t=time+a.ph;
  F[0][0]=-0.12;F[0][1]=0.18+Math.sin(t*1.6)*0.04;F[0][2]=0.06;F[1][0]=0.12;F[1][1]=0.22+Math.sin(t*1.6+1)*0.04;F[1][2]=-0.06;
  if(p==='guard'){s(0,-0.28,1.22,0.4);s(1,0.3,1.12,0.44);}
  else if(p==='cross'){s(0,0.1,1.4,0.2);s(1,-0.1,1.36,0.2);}
  else if(p==='crouch'){s(0,-0.3,1.0,0.5);s(1,0.3,1.0,0.5);F[0][1]=0.1;F[1][1]=0.1;}
  else if(p==='wind'){const h=a.hand,sd=h?1:-1;s(h,sd*0.34,1.5,-0.4);s(1-h,-sd*0.3,1.25,0.45);}
  else if(p==='hit'){const h=a.hand,sd=h?1:-1;s(h,sd*0.06,1.45,1.15);s(1-h,-sd*0.3,1.2,0.3);}
  else if(p==='raise'){s(0,-0.5,2.0,0.2);s(1,0.5,2.0,0.2);}
  else if(p==='still'){s(1,0.3,1.95,0.45);s(0,-0.34,1.0,0.2);}
  else if(p==='grip'){s(1,0.25,1.75,0.75);s(0,-0.34,1.0,0.25);}
  else if(p==='flung'){s(0,-0.65,1.2,-0.2);s(1,0.65,1.2,-0.2);}
  const k=damp(a.pose==='hit'?26:10,dt);
  for(let i=0;i<2;i++)for(let j=0;j<3;j++)a.hd[i][j]+=(H[i][j]-a.hd[i][j])*k;
}
// ================================================================
// The brain
// ================================================================
function pfThink(a,dt){
  a.t+=dt;a.flash=Math.max(0,a.flash-dt*5);a.glow=Math.max(0,a.glow-dt*4);a.stun=0;a.slow=0;a.slowT=0;a.burn=0;
  a.al+=(a.alT-a.al)*Math.min(1,dt*9);
  if(a.popping){if(a.al<0.04){removeActor(a);const i=PF.list.indexOf(a);if(i>=0)PF.list.splice(i,1);}return;}
  if(a.dec){a.life-=dt;if(a.life<=0){pfPop(a);return;}}
  a.lean+=((a.leanT||0)-a.lean)*Math.min(1,dt*8);a.leanT=0;
  if(a.stag>0){a.stag-=dt;a.pose='flung';a.leanT=-0.3;pfFace(a,dt,4);pfPose(a,dt);return;}
  if(!PF.fight||KQ.on||PF.won){
    if(!a.keep){if(KQ.on)a.pose='grip';else if(!PF.fight&&!PF.won)a.pose='guard';if(!PF.won)pfFace(a,dt,6);}
    pfPose(a,dt);return;
  }
  switch(a.st){
    case 'orbit':pfOrbit(a,dt);break;
    case 'blink':pfBlink(a,dt);break;
    case 'combo':pfCombo(a,dt);break;
    case 'shards':pfShardsMove(a,dt);break;
    case 'still':pfStillMove(a,dt);break;
    case 'evade':pfEvade(a,dt);break;
    case 'split':pfSplitTick(a,dt);break;
    default:pfDone(a);
  }
  if(!(a.dec&&a.st==='orbit'))pfPose(a,dt); // a circling fake is drawn lite: no hands to pose
}
function pfOrbit(a,dt){
  const ph2=pfPh2(),dec=a.dec;a.pose='guard';
  a.ang+=dec?a.dsp*dt:PF.od*dt*0.5; // the fakes circle at their own radius, height and speed, in both directions
  const want=dec?a.rad:ph2?9.5:11,tx=P.pos.x+Math.cos(a.ang)*want,tz=P.pos.z+Math.sin(a.ang)*want,ty=clamp(P.pos.y-0.2+(dec?a.hy+Math.sin(time*0.9+a.ph)*1.5:0),0,150);
  pfSteer(a,tx,ty,tz,ph2?22:17,dt);pfFace(a,dt,10);a.leanT=0.08;
  a.cd-=dt;
  if(dec){if(a.cd<=0){if(PF.decAtk<3&&PF.decGate<=0){PF.decGate=rr(0.7,1.5);PF.decAtk++;pfPick(a);}else a.cd=rr(0.3,0.9);}return;} // at most 3 fakes attack at once, one new one at a time
  if(a.real&&PF.evCd<=0&&PF.dmgW>1500){PF.evCd=3.6;PF.dmgW=0;a.st='evade';a.mv={t:0,ph:0};return;} // hammered too long: it slips away
  if(a.cd<=0)pfPick(a);
}
function pfPick(a){
  const d=Math.hypot(P.pos.x-a.pos.x,P.pos.z-a.pos.z),pool=a.dec?[['combo',45],['shards',40]]:[['combo',d<12?55:24],['blink',28],['shards',d>8?30:12],['still',PF.stillCd<=0?20:0]];
  const l=pool.filter(p=>p[1]>0&&p[0]!==a.last);let tot=0;for(const p of l)tot+=p[1];let r=Math.random()*tot,type=l[0][0];for(const p of l){r-=p[1];if(r<=0){type=p[0];break;}}
  a.last=type;a.st=type;a.mv={t:0,ph:0};
  if(type==='still')PF.stillCd=16;
}
function pfEvade(a,dt){
  const M=a.mv;M.t+=dt;a.pose='cross';
  if(M.ph===0){if(M.t===dt)pfFx(a);a.alT=0;if(M.t>=0.14){const an=Math.atan2(a.pos.z-P.pos.z,a.pos.x-P.pos.x)+rr(1.6,2.6)*(Math.random()<0.5?-1:1),r=rr(13,19);
    a.pos.set(P.pos.x+Math.cos(an)*r,clamp(P.pos.y-0.2,0,150),P.pos.z+Math.sin(an)*r);pfClampPos(a);a.alT=1;a.al=Math.max(a.al,0.2);pfFx(a);SFX.tone('sine',900,300,0.2,0.07);M.ph=1;M.t=0;}}
  else if(M.t>=0.25){pfDone(a);a.cd=0.5;}
}
function pfBlink(a,dt){
  const M=a.mv;M.t+=dt;
  if(M.ph===0){a.pose='cross';pfFace(a,dt,12);a.glow=M.t/0.7;a.leanT=-0.05;
    if(M.t<0.45){const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);M.dx=P.pos.x-fx*3.6+clamp(P.vel.x*0.3,-6,6);M.dz=P.pos.z-fz*3.6+clamp(P.vel.z*0.3,-6,6);M.dy=clamp(P.pos.y-0.2,0,150);}
    if(M.t>=0.7){M.ph=1;M.t=0;a.alT=0;pfFx(a);SFX.tone('sine',1200,200,0.22,0.08);}}
  else if(M.ph===1){if(M.t>=0.18){a.pos.set(M.dx,M.dy,M.dz);pfClampPos(a);a.yaw=Math.atan2(P.pos.x-a.pos.x,P.pos.z-a.pos.z);a.alT=1;a.al=Math.max(a.al,0.35);pfFx(a);SFX.tone('sine',300,1300,0.2,0.07);M.ph=2;M.t=0;}}
  else if(M.ph===2){a.pose='wind';a.hand=1;pfFace(a,dt,16);a.glow=M.t/0.5;a.leanT=0.1+M.t*0.5;
    if(M.t>=0.5){pfStrike(a,0.09,16,2.4);M.ph=3;M.t=0;}}
  else{a.pose=M.t<0.22?'hit':'guard';if(M.t>=0.65)pfDone(a);}
}
function pfStrike(a,f,kn,lunge){ // step in, then hit whoever is still close
  const dx=P.pos.x-a.pos.x,dz=P.pos.z-a.pos.z,d=Math.hypot(dx,dz)||1;if(d>2.6){const m=Math.min(d-2.2,lunge);a.pos.x+=dx/d*m;a.pos.z+=dz/d*m;}
  const c=center(P),q=center(a),dd=Math.hypot(c.x-q.x,c.y-q.y,c.z-q.z);
  if(dd<4.7)pfHurt(a,f,kn);
  const w=a.hw[a.hand||0];ringFx(w[0],w[1],w[2],0.4,5.5,0.25,[1,.9,.5]);burst(w[0],w[1],w[2],10,10,0.3,[[1,.9,.5],[1,1,1]],1,0,2);SFX.punch(0.9*SFX.vol(a.pos.x,a.pos.y,a.pos.z));addShake(0.12);a.pose='hit';
}
function pfCombo(a,dt){
  const M=a.mv;M.t+=dt;pfFace(a,dt,14);
  if(M.ph===0){a.pose='crouch';a.leanT=0.45;
    if(M.t<0.35){const dx=P.pos.x-a.pos.x,dz=P.pos.z-a.pos.z,d=Math.hypot(dx,dz)||1,k=Math.max(0,d-2.8)/d;M.tx=a.pos.x+dx*k;M.tz=a.pos.z+dz*k;M.ty=clamp(P.pos.y-0.2,0,150);}
    if(M.t>=0.5){M.ph=1;M.t=0;M.x0=a.pos.x;M.y0=a.pos.y;M.z0=a.pos.z;SFX.tone('sawtooth',300,1000,0.2,0.08);}}
  else if(M.ph===1){const k=Math.min(1,M.t/0.18),e=k*k*(3-2*k);a.pos.set(lerp(M.x0,M.tx,e),lerp(M.y0,M.ty,e),lerp(M.z0,M.tz,e));a.leanT=0.4;
    {const c=center(a);emit(c.x,c.y,c.z,0,0,0,0.3,[1,.9,.6],2.4,0,0);}
    if(k>=1){M.ph=2;M.t=0;M.n=0;M.hand=0;}}
  else if(M.ph===2){a.pose='wind';a.hand=M.hand;a.glow=M.t/0.3;a.leanT=0.2;
    const dx=P.pos.x-a.pos.x,dz=P.pos.z-a.pos.z,d=Math.hypot(dx,dz)||1;if(d>2.4){const m=Math.min(5*dt,d-2.4);a.pos.x+=dx/d*m;a.pos.z+=dz/d*m;}
    if(M.t>=0.3){const last=M.n===2;pfStrike(a,last?0.08:0.045,last?22:8,2.5);M.n++;M.hand=1-M.hand;M.t=0;M.ph=M.n>=3?3:4;}}
  else if(M.ph===4){a.pose='hit';if(M.t>=0.16){M.ph=2;M.t=0;}}
  else{a.pose=M.t<0.2?'hit':'guard';a.leanT=0;if(M.t>=0.6)pfDone(a);}
}
// mirror shards: a fan of slivers that circle it, then fly at you and curve a little
function pfShardPos(a,i,n){const ang=(i-(n-1)/2)*0.4,s=Math.sin(a.yaw),c=Math.cos(a.yaw),lx=Math.sin(ang)*2.6,ly=3.6+Math.cos(ang)*0.9,lz=-1.0;return [a.pos.x+lx*c+lz*s,a.pos.y+ly,a.pos.z-lx*s+lz*c];}
function pfShardsMove(a,dt){
  const M=a.mv;M.t+=dt;pfFace(a,dt,12);const n=a.dec?3:pfPh2()?7:5,vols=(pfPh2()&&!a.dec)?2:1;M.n=n;
  if(M.ph===0){a.pose='raise';a.leanT=-0.12;if(M.t>=0.95){M.ph=1;M.t=0;M.vol=0;}}
  else if(M.ph===1){a.pose='raise';
    if(M.vol<vols&&(M.vol===0||M.t>=0.6)){M.vol++;M.t=0;
      const bx=P.pos.x-a.pos.x,bz=P.pos.z-a.pos.z,hd=Math.hypot(bx,bz)||1,base=Math.atan2(bx,bz);
      for(let i=0;i<n&&PF.shards.length<28;i++){const p=pfShardPos(a,i,n),an=base+(i-(n-1)/2)*0.17,dy=P.pos.y+1.3-p[1],dl=Math.hypot(hd,dy)||1,sp=32;
        PF.shards.push({x:p[0],y:p[1],z:p[2],vx:Math.sin(an)*sp*hd/dl,vy:dy/dl*sp,vz:Math.cos(an)*sp*hd/dl,sp,age:0,home:0.9,life:4,own:a,f:a.dec?0.02:0.035});}
      SFX.tone('triangle',1800,500,0.25,0.07);SFX.glass(0.4);a.pose='hit';}
    if(M.vol>=vols&&M.t>=0.5){M.ph=2;M.t=0;}}
  else{a.pose='guard';if(M.t>=0.4)pfDone(a);}
}
function pfShardTick(dt){
  for(let i=PF.shards.length-1;i>=0;i--){const s=PF.shards[i];s.age+=dt;
    if(s.age<s.home&&!P.dead){const dx=P.pos.x-s.x,dy=P.pos.y+1.3-s.y,dz=P.pos.z-s.z,l=Math.hypot(dx,dy,dz)||1,k=damp(1.7,dt);s.vx+=(dx/l*s.sp-s.vx)*k;s.vy+=(dy/l*s.sp-s.vy)*k;s.vz+=(dz/l*s.sp-s.vz)*k;}
    s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;
    let gone=s.age>s.life||s.y<0.4;
    if(!gone&&!P.dead){const c=center(P);if(Math.hypot(c.x-s.x,c.y-s.y,c.z-s.z)<1.9){pfHurt(s.own,s.f/(s.own&&s.own.dec?0.5:1),10);gone=true;burst(s.x,s.y,s.z,10,8,0.3,[[1,.9,.6],[1,1,1]],1,0,2);}}
    if(gone){PF.shards.splice(i,1);}
  }
}
// Perfect Stillness: a pale field slows you (the screen goes blue-grey) while it dashes through the place you were
function pfStillMove(a,dt){
  const M=a.mv;M.t+=dt;
  if(M.ph===0){a.pose='still';a.glow=0;pfFace(a,dt,10);a.leanT=-0.1;M.field=M.t/0.9;
    if(M.t>=0.9){PF.still={t:0,dur:3.6};M.ph=1;M.t=0;M.n=0;M.sub=0;SFX.tone('sine',700,90,1.2,0.14);flashWhite=Math.max(flashWhite,0.25);const q=center(a);ringFx(q.x,q.y,q.z,1,40,0.6,[.5,.7,1]);}}
  else if(M.ph===1){a.pose='crouch';pfFace(a,dt,18);
    if(M.sub===0){ // aim: the line follows you, then freezes
      if(M.t<0.32){M.tx=P.pos.x;M.tz=P.pos.z;M.ty=clamp(P.pos.y,0,150);}
      if(M.t>=0.55){M.sub=1;M.t=0;M.x0=a.pos.x;M.y0=a.pos.y;M.z0=a.pos.z;const dx=M.tx-M.x0,dz=M.tz-M.z0,l=Math.hypot(dx,dz)||1;M.ex=M.tx+dx/l*7;M.ez=M.tz+dz/l*7;M.hit=false;a.alT=0.5;SFX.tone('sawtooth',250,1400,0.18,0.09);}}
    else if(M.sub===1){const k=Math.min(1,M.t/0.15);a.pos.set(lerp(M.x0,M.ex,k),lerp(M.y0,M.ty,k),lerp(M.z0,M.ez,k));a.leanT=0.4;
      if(!M.hit&&!P.dead){const c=center(P),ax=M.x0,az=M.z0,bx=M.ex-ax,bz=M.ez-az,L2=bx*bx+bz*bz||1,u=clamp(((a.pos.x-ax)*bx+(a.pos.z-az)*bz)/L2,0,1);
        // the dash passes the player when it is near its own position along the line
        if(Math.hypot(c.x-a.pos.x,(c.y-a.pos.y-1.4)*0.5,c.z-a.pos.z)<2.9){M.hit=true;pfHurt(a,0.07,18);burst(c.x,c.y,c.z,14,10,0.3,[[.6,.8,1],[1,1,1]],1.2,0,2);}}
      {const c=center(a);emit(c.x,c.y,c.z,0,0,0,0.4,[.6,.8,1],3,0,0);}
      if(k>=1){M.sub=2;M.t=0;a.alT=1;}}
    else{a.pose='guard';if(M.t>=0.28){M.n++;if(M.n>=3)M.ph=2;else{M.sub=0;M.t=0;}}}}
  else{pfDone(a);a.cd=1.4;}
}
function pfStillEnd(){PF.still=null;P.slow=0;const e=$('kstill');if(e)e.style.opacity='0';}
// the split at half health (and again at a fifth): fifty afterimages (topped back up to 50 the second time), the real one hides among them (it has a faint glow)
function pfSplit(a){a.st='split';a.mv={t:0,ph:0};PF.split++;if(PF.still)pfStillEnd();}
function pfSplitTick(a,dt){
  const M=a.mv;M.t+=dt;a.pose='raise';a.glow=0;a.pos.y=Math.min(a.pos.y+dt*2,160);pfFace(a,dt,8);
  if(M.ph===0&&M.t>=0.9){M.ph=1;flashWhite=Math.max(flashWhite,0.55);SFX.tone('sine',300,1800,0.6,0.12);SFX.boom(0.6,1);addShake(0.4);pfFx(a);
    let have=0;for(const d of PF.list)if(d.dec&&!d.popping)have++;
    PF.od=Math.random()<0.5?1:-1;
    for(let i=have;i<PF_DEC;i++){const d=pfMake(a.pos.x,a.pos.y,a.pos.z,true);d.fadeIn=1;d.al=0;d.yaw=a.yaw;d.ang=rr(0,TAU);d.cd=rr(2,9);} // they fan out from the real one to their own rings
    a.ang=Math.atan2(a.pos.z-P.pos.z,a.pos.x-P.pos.x)+rr(-1,1);
    a.pos.set(P.pos.x+Math.cos(a.ang)*11,clamp(P.pos.y,0,150),P.pos.z+Math.sin(a.ang)*11);pfClampPos(a);
    toast('Afterimages','Fifty of them. Only the real one glows. A fake shatters at a touch · the Solar Lance cuts through a whole line','gold');}
  if(M.t>=1.3)pfDone(a);
}
// ================================================================
// Update / draw (called from kathanaUpdate / kathanaDraw in 66f_kathana.js)
// ================================================================
function pfUpdate(dt){
  if(!PF.on)return;
  PF.dmgW=Math.max(0,PF.dmgW-dt*1100);PF.evCd-=dt;PF.stillCd-=dt;
  qteTick(dt);PF.decGate-=dt;
  const L=PF.tmp;L.length=0;let n=0;for(const a of PF.list){L.push(a);if(a.dec&&a.st!=='orbit'&&!a.popping)n++;}PF.decAtk=n; // a copy: pfThink removes the fakes that have faded out
  for(let i=0;i<L.length;i++)pfThink(L[i],dt);
  pfShardTick(dt);
  const r=PF.real;
  if(r&&r.alive&&PF.fight&&!PF.won&&r.st==='orbit'&&!KQ.on){const f=r.hp/PF_HP;if(f<=0.5&&PF.split===0)pfSplit(r);else if(f<=0.2&&PF.split===1)pfSplit(r);}
  if(PF.still){PF.still.t+=dt;P.slow=0.55;const e=$('kstill');if(e&&e.style.opacity!=='1')e.style.opacity='1';if(PF.still.t>=PF.still.dur||P.dead||!PF.fight)pfStillEnd();}
}
function pfClear(){
  for(const a of PF.list)removeActor(a);PF.list.length=0;PF.shards.length=0;PF.decAtk=0;PF.decGate=0;PF.real=null;PF.on=false;PF.fight=false;PF.show=false;PF.bar=0;PF.won=false;PF.split=0;PF.stillCd=6;PF.dmgW=0;PF.evCd=0;
  if(PF.still)pfStillEnd();KQ.on=false;KQ.phase='';KQ.fails=0;qteHide();if(lockT&&lockT.kind==='kperfect')lockT=null;
}
function pfStop(){PF.fight=false;KQ.on=false;qteHide();PF.shards.length=0;if(PF.still)pfStillEnd();}
function pfBar(){
  if(!(PF.on&&PF.show&&PF.real&&KA.on&&inVoid()))return false;
  PF.bar=Math.min(1,PF.bar+0.012);hud.bossbar.hidden=false;setText(hud.bossname,'bn','KATHANA, PERFECT FORM');setW(hud.bossb,'boss',PF.bar*Math.max(0,PF.real.hp)/PF_HP);return true;
}
function pfPickLock(cur){
  const l=PF.list.filter(a=>a.alive&&!a.popping&&a.al>0.4).sort((p,q)=>Math.hypot(p.pos.x-P.pos.x,p.pos.z-P.pos.z)-Math.hypot(q.pos.x-P.pos.x,q.pos.z-P.pos.z));
  if(!cur)return l[0]||null;const i=l.indexOf(cur);return i>=0&&i+1<l.length?l[i+1]:null;
}
function pfDraw(t){
  if(!PF.on&&!KQ.on)return;
  const sh=(x,z,r,al)=>queue(MESH.disc,at(x,0.12,z,0,0,0,r,1,r),[0.05,0.05,0.12,al],F_BL);
  for(const a of PF.list){if(a.st==='orbit'&&(a.dec||(a.real&&PF.split>0&&a.al>0.97&&!(a.stag>0)))){pfFigureLite(a,t);continue;}pfFigure(a,t);if(a.al>0.3&&KA.flood>0.4){const h=Math.max(0,a.pos.y);sh(a.pos.x,a.pos.z,2.2+h*0.05,Math.max(0.08,0.3-h*0.004)*a.al);}}
  // telegraphs
  for(const a of PF.list){const M=a.mv;if(!M||a.popping)continue;
    if(a.st==='blink'&&M.ph===0&&M.dx!==undefined){const f=0.5+0.5*Math.sin(t*26),r=3.2;queue(MESH.ring,at(M.dx,0.22,M.dz,0,0,0,r,1,r),[1,.75,.2,0.55+0.4*f],F_BL);queue(MESH.disc,at(M.dx,0.2,M.dz,0,0,0,r,1,r),[1,.8,.3,0.15+0.12*f],F_BL);queue(MESH.glowCyl,at(M.dx,M.dy+2.5,M.dz,0,0,0,r*0.7,5,r*0.7),[1,.85,.4,0.1+0.1*f],F_BL);}
    if(a.st==='combo'&&M.ph===0&&M.tx!==undefined){const dx=M.tx-a.pos.x,dz=M.tz-a.pos.z,l=Math.hypot(dx,dz)||1,f=0.5+0.5*Math.sin(t*30);queue(MESH.box,at((M.tx+a.pos.x)/2,0.22,(M.tz+a.pos.z)/2,0,Math.atan2(dx,dz),0,2.2,0.05,l),[1,.75,.25,0.2+0.3*f],F_BL);queue(MESH.ring,at(M.tx,0.22,M.tz,0,0,0,2.4,1,2.4),[1,.8,.3,0.5+0.3*f],F_BL);}
    if(a.st==='still'){if(M.ph===0){const r=lerp(2,34,M.field||0),c=center(a);queue(MESH.ring,at(c.x,Math.max(0.3,a.pos.y),c.z,0,0,0,r,1,r),[.5,.7,1,0.6],F_BL);queue(MESH.glowSphere,at(c.x,c.y,c.z,0,0,0,r*0.5,r*0.5,r*0.5),[.55,.7,1,0.12],F_BL);}
      else if(M.ph===1&&M.sub===0&&M.tx!==undefined){const dx=M.tx-a.pos.x,dz=M.tz-a.pos.z,l=Math.hypot(dx,dz)||1,mx=(M.tx+a.pos.x)/2,mz=(M.tz+a.pos.z)/2,f=0.5+0.5*Math.sin(t*34);
        queue(MESH.box,at(mx,0.24,mz,0,Math.atan2(dx,dz),0,3.2,0.05,l+14),[.5,.7,1,0.25+0.35*f],F_BL);queue(MESH.ring,at(M.tx,0.24,M.tz,0,0,0,2.8,1,2.8),[.6,.8,1,0.6],F_BL);}}
    if(a.st==='shards'&&M.ph===0&&M.n){for(let i=0;i<M.n;i++){const p=pfShardPos(a,i,M.n),g=sm01(M.t/0.5);pfEll(PFD,p[0],p[1],p[2],Math.sin(t*3+i),1,Math.cos(t*2+i),0.2*g,1.0*g,0.2*g,[1,1,1,1],0);}}
  }
  // flying shards
  for(const s of PF.shards)pfEll(PFD,s.x,s.y,s.z,s.vx,s.vy,s.vz,0.2,1.1,0.2,[1,1,1,1],0),queue(MESH.glowSphere,at(s.x,s.y,s.z,0,0,0,0.45,0.45,0.45),[1,.9,.6,0.35],F_BL);
  // the gold-white grip on you
  if(KQ.on&&PF.real){const c=center(P),w=PF.real.hw[1],f=0.5+0.5*Math.sin(t*20);
    queue(MESH.glowBox,M4.beam(tmpM(),w[0],w[1],w[2],c.x,c.y,c.z,0.35+0.12*f),[1,.85,.4,0.7],F_BL);queue(MESH.glowBox,M4.beam(tmpM(),w[0],w[1],w[2],c.x,c.y,c.z,1.1),[1,.8,.3,0.22],F_BL);
    queue(MESH.glowSphere,at(c.x,c.y,c.z,0,0,0,2.7,3.2,2.7),[1,.85,.4,0.25+0.1*f],F_BL);
    for(let i=0;i<3;i++){const an=t*(1.2+i*0.4)*(i%2?-1:1),s=2.2+0.3*i;queue(MESH.ring,M4.alignY(tmpM(),c.x,c.y+(i-1)*0.7,c.z,Math.sin(an)*0.5,1,Math.cos(an)*0.5,s),[1,.85,.3,0.85],F_BL);}}
}
// ================================================================
// The floor cracks (the scream)
// ================================================================
function kCracksMake(){
  KA.cracks=[];const n=16;
  for(let i=0;i<n;i++){let a=i/n*TAU+rr(-0.15,0.15),x=KA.bx+Math.sin(a)*46,z=KA.bz+Math.cos(a)*46;const pts=[[x,z]],len=7+((Math.random()*5)|0),br=3+((Math.random()*3)|0);
    for(let k=0;k<len;k++){a+=rr(-0.4,0.4);const l=rr(14,22);x+=Math.sin(a)*l;z+=Math.cos(a)*l;if(Math.hypot(x-KAR.x,z-KAR.z)>470)break;pts.push([x,z]);
      if(k===br){let b=a+rr(0.6,1.1)*(Math.random()<0.5?-1:1),bx=x,bz=z;const bp=[[bx,bz]];for(let j=0;j<4;j++){b+=rr(-0.35,0.35);bx+=Math.sin(b)*rr(10,16);bz+=Math.cos(b)*rr(10,16);bp.push([bx,bz]);}KA.cracks.push({pts:bp,w:1.0,g:0,t0:rr(0.5,2.4)});}}
    KA.cracks.push({pts,w:2.2,g:0,t0:rr(0,1.4)});}
}
function kCracksDraw(){
  if(!KA.cracks||!KA.cracks.length)return;
  for(const c of KA.cracks){const n=c.pts.length-1,gg=c.g*n;
    for(let i=0;i<n;i++){const k=clamp(gg-i,0,1);if(k<=0)break;const A=c.pts[i],B=c.pts[i+1],bx=A[0]+(B[0]-A[0])*k,bz=A[1]+(B[1]-A[1])*k,dx=bx-A[0],dz=bz-A[1],l=Math.hypot(dx,dz);if(l<0.05)continue;
      const ang=Math.atan2(dx,dz),w=c.w*(1-i/(n+2)*0.55),mx=(A[0]+bx)/2,mz=(A[1]+bz)/2;
      queue(MESH.box,at(mx,0.27,mz,0,ang,0,w*2.6,0.04,l+0.4),[1,.55,.15,0.22],F_BL);queue(MESH.box,at(mx,0.33,mz,0,ang,0,w*1.7,0.16,l+0.35),[0.04,0.03,0.06,1],0);}}
}
// ================================================================
// Stage 2: the scream
// ================================================================
function kathanaStage2(){
  if(!(KA.on&&inVoid())||KA.lost||KA.stage===2||ZF.phase)return false;
  if(CUT)cutEnd(false);
  for(const o of KA.orbs){if(!o.dead){o.dead=true;if(o.a)removeActor(o.a);}}KA.dead=4;kClearShots();
  KA.stage=2;KA.fight=false;KA.atk=null;KA.beam=null;KA.phase='scream';lockT=null;objective(null);kFly(12);
  const S=save.story;if(S.kathana<1)S.kathana=1;persist();
  kCracksMake();
  for(const h of KA.hands){h.busy=true;h.k=2.4;h.tx=h.s[0]*1.5;h.ty=h.s[1]+130;h.tz=h.s[2]-20;}
  cutscene({dur:4.2,control:true,letterbox:true,text:'KATHANA SCREAMS',onTick:kScreamTick,onEnd:kSplitStart});
  kScreamSfx(3.9);
  return true;
}
function kScreamTick(k,dt,C){
  if(!inVoid())return;const t=C.t;
  KA.scream=clamp(t/0.5,0,1)*(1-clamp((t-3.5)/0.7,0,1));KA.jit=2.2*KA.scream;
  addShake(0.1+0.2*KA.scream);
  for(const [ft,fa] of [[0.3,0.5],[1.15,0.6],[1.9,0.7],[2.7,0.7],[3.4,0.9]])if(!C['f'+ft]&&t>=ft){C['f'+ft]=true;flashWhite=Math.max(flashWhite,fa);}
  for(const c of KA.cracks)c.g=clamp((t-c.t0)/1.7,0,1);
  if(Math.random()<dt*20)smoke(KA.bx+rr(-120,120),1,KA.bz+rr(-90,90),1,6,14,3,0.35);
}
function kScreamSfx(dur){ // a deep, distorted roar: low saws and a sub square into a clipping shaper, a filter that opens and closes, noise sweeping through
  try{
    if(!SFX.ctx||!SFX.master)return;const c=SFX.ctx,t=c.currentTime;
    const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.3,t+0.35);g.gain.setValueAtTime(0.3,t+dur-0.9);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    const ws=c.createWaveShaper(),cv=new Float32Array(256);for(let i=0;i<256;i++)cv[i]=Math.tanh((i/128-1)*5);ws.curve=cv;
    const lp=c.createBiquadFilter();lp.type='lowpass';lp.Q.value=6;lp.frequency.setValueAtTime(260,t);lp.frequency.exponentialRampToValueAtTime(1900,t+dur*0.35);lp.frequency.exponentialRampToValueAtTime(380,t+dur);
    const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=7;lg.gain.value=5;lfo.connect(lg);
    for(const [type,f0,f1,det] of [['sawtooth',72,52,0],['sawtooth',72,52,18],['square',36,26,0]]){const o=c.createOscillator();o.type=type;o.detune.value=det;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);lg.connect(o.frequency);o.connect(ws);o.start(t);o.stop(t+dur+0.1);}
    if(SFX.noise){const n=c.createBufferSource();n.buffer=SFX.noise;n.loop=true;const bp=c.createBiquadFilter();bp.type='bandpass';bp.Q.value=2.5;bp.frequency.setValueAtTime(220,t);bp.frequency.exponentialRampToValueAtTime(2600,t+dur*0.5);bp.frequency.exponentialRampToValueAtTime(300,t+dur);const ng=c.createGain();ng.gain.value=0.6;n.connect(bp).connect(ng).connect(ws);n.start(t);n.stop(t+dur+0.1);}
    ws.connect(lp).connect(g).connect(SFX.master);lfo.start(t);lfo.stop(t+dur+0.1);
  }catch(e){logErr(e);}
}
// ================================================================
// The split: the body drawn twice, each half clipped at the seam and moved as a rigid piece
// ================================================================
function kSplitDraw(t){
  const sp=KA.split,e=sp*sp*(3-2*sp),LF=at(KA.bx,KA.by,KA.bz,0,KA.yaw,0),IV=M4.mul(tmpM(),at(0,0,0,0,-KA.yaw,0),at(-KA.bx,-KA.by,-KA.bz,0,0,0));
  if(KA.vis){
    for(const sd of [-1,1]){
      const n0=dlN,pv=sd*58,D=M4.mul(tmpM(),at(sd*e*42,0,0,0,0,0),M4.mul(tmpM(),at(pv,0,0,0,0,0),M4.mul(tmpM(),at(0,0,0,0,0,-sd*e*1.2),at(-pv,0,0,0,0,0))));
      const LD=M4.mul(tmpM(),LF,D),HM=M4.mul(tmpM(),LD,IV);
      kBody(t);kHandsDraw(t,sd);
      const nx=sd*LD[0],ny=sd*LD[1],nz=sd*LD[2],cl=[nx,ny,nz,-(nx*LD[12]+ny*LD[13]+nz*LD[14])];
      for(let i=n0;i<dlN;i++){const d=drawList[i];d.M=M4.mul(tmpM(),HM,d.M);d.clip=cl;}
      const cap=(y,h,w)=>queue(MESH.glowBox,child(LD,sd*0.5,y,0,0,0,0,0.7,h,w),[1,1,1,1],0); // the inside is light
      cap(44,88,96);cap(112,64,42);cap(148,16,20);cap(176,56,32);
    }
  }
  if(KA.sink<0.5&&PF.core){const r=(8+10*e)*(1-KA.sink*2),c=PF.core;queue(MESH.glowSphere,at(c[0],c[1],c[2],0,0,0,r,r,r),[1,1,1,1],0);queue(MESH.glowSphere,at(c[0],c[1],c[2],0,0,0,r*2.4,r*2.4,r*2.4),[1,.85,.4,0.4],F_BL);}
}
function pfStand(){const dx=KA.bx-P.pos.x,dz=KA.bz-P.pos.z,l=Math.hypot(dx,dz)||1;let x=P.pos.x+dx/l*16,z=P.pos.z+dz/l*16;const ox=x-KAR.x,oz=z-KAR.z,r=Math.hypot(ox,oz);if(r>440){x=KAR.x+ox/r*440;z=KAR.z+oz/r*440;}return {x,y:clamp(P.pos.y-0.3,0,45),z};}
function pfCam(st){ // the camera in front of the Perfect Form (toward you), a little to the side and low
  const dx=P.pos.x-st.x,dz=P.pos.z-st.z,l=Math.hypot(dx,dz)||1,fx=dx/l,fz=dz/l;return {x:st.x+fx*4.4+fz*1.7,y:st.y+1.9,z:st.z+fz*4.4-fx*1.7};
}
function kSplitStart(){
  if(!inKS())return;
  KA.phase='split';const st=pfStand(),core=kwa(0,114,8),b={x:KA.bx,z:KA.bz,yaw:KA.yaw};PF.core=core;
  for(const h of KA.hands)h.busy=false;
  const kw=(x,y,z)=>{const s=Math.sin(b.yaw),c=Math.cos(b.yaw);return {x:b.x+x*c+z*s,y,z:b.z-x*s+z*c};},c0=kw(95,48,330),c1=kw(55,95,175),c2=pfCam(st);
  const camf=k=>{const t=k*8;if(t<4.2){const e=sm01(t/4.2);return {x:lerp(c0.x,c1.x,e),y:lerp(c0.y,c1.y,e),z:lerp(c0.z,c1.z,e)};}const e=sm01((t-4.2)/3.8);return {x:lerp(c1.x,c2.x,e),y:lerp(c1.y,c2.y,e),z:lerp(c1.z,c2.z,e)};};
  const look=k=>{const t=k*8,r=PF.real,h=r?{x:r.pos.x,y:r.pos.y+2.6,z:r.pos.z}:{x:core[0],y:core[1],z:core[2]},e=sm01((t-3.6)/2.2);return {x:lerp(core[0],h.x,e),y:lerp(core[1],h.y,e),z:lerp(core[2],h.z,e)};};
  cutscene({dur:8,control:false,letterbox:true,skippable:false,fov:64,text:'',from:camf,to:camf,look,onTick:(k,dt,C)=>kSplitTick(k,dt,C,st,core),onEnd:()=>kSplitEnd(st)});
}
function kSplitTick(k,dt,C,st,core){
  if(!inVoid())return;const t=C.t;
  if(t<1.0){KA.split=0.012+0.05*sm01(t);KA.jit=1.2*sm01(t);KA.scream=0.6;}
  else{KA.split=0.06+0.94*sm01((t-1.0)/2.4);KA.jit=Math.max(0,1.2*(1-(t-1)/2));KA.scream=0.6*Math.max(0,1-(t-1)/1.5);}
  if(!C.b1&&t>=1.0){C.b1=true;SFX.boom(1,2.8);SFX.tone('sawtooth',60,20,2.2,0.26);addShake(1.3);flashWhite=1;ringFx(core[0],core[1],core[2],4,90,1,[1,.9,.6]);}
  if(!C.b2&&t>=2.2){C.b2=true;SFX.boom(0.8,2);addShake(0.9);}
  if(t>=3.0){KA.sink=sm01((t-3.0)/2.4);if(KA.sink>=0.99)KA.vis=false;}
  if(t>=3.0&&t<4.4&&Math.random()<dt*30)smoke(KA.bx+rr(-70,70),2,KA.bz+rr(-50,50),1,8,16,4,0.7);
  if(!C.pf&&t>=2.3){C.pf=true;const a=pfMake(core[0],core[1]-2.2,core[2],false);a.al=0;a.yaw=KA.yaw+Math.PI;a.fadeIn=1;
    flashWhite=1;SFX.chime();SFX.tone('sine',200,2000,1.4,0.14);ringFx(core[0],core[1],core[2],1,34,0.8,[1,1,1]);burst(core[0],core[1],core[2],90,30,1.2,[[1,.9,.6],[1,1,1]],2,0,1.5);KA.fx.push({x:core[0],y:core[1],z:core[2],t:0,dur:1,r0:4,r1:70,col:[1,.9,.55]});}
  const a=PF.real;
  if(a&&C.pf){
    if(t<4.2){a.pos.set(core[0],core[1]-2.2+Math.sin(t*2)*0.5,core[2]);a.yaw+=dt*0.9;a.pose='raise';}
    else{const e=sm01((t-4.2)/2.2);a.pos.set(lerp(core[0],st.x,e),lerp(core[1]-2.2,st.y,e),lerp(core[2],st.z,e));a.yaw=angLerp(a.yaw,Math.atan2(P.pos.x-st.x,P.pos.z-st.z),damp(5,dt));a.pose=e<0.9?'raise':'guard';}
    a.keep=true;a.al+=(1-a.al)*Math.min(1,dt*2);
  }
  if(!C.cap&&t>=4.4){C.cap=true;C.text='KATHANA, PERFECT FORM';$('cut-cap').textContent=C.text;PF.show=true;SFX.tone('sine',440,880,0.8,0.1);}
}
function kSplitEnd(st){
  if(!inKS())return;
  KA.split=1;KA.sink=1;KA.vis=false;KA.jit=0;KA.scream=0;PF.core=null;PF.show=true;
  const a=PF.real;if(a){a.keep=false;a.pos.set(st.x,st.y,st.z);a.al=1;a.alT=1;a.yaw=Math.atan2(P.pos.x-st.x,P.pos.z-st.z);}
  pfQteStart();
}
// a retry after a knock-out at the Perfect Form: no Kathana, no orbs; it descends straight away
function pfRetryStart(){
  KA.gone=true;KA.vis=false;KA.stage=2;KA.dead=4;KA.rise=1;KA.open=1;KA.phase='retry';KA.fight=false;
  const st=pfStand(),a=pfMake(st.x,st.y+60,st.z,false);a.al=0;a.fadeIn=1;a.pose='raise';a.keep=true;a.yaw=Math.atan2(P.pos.x-st.x,P.pos.z-st.z);PF.show=true;
  const cam=pfCam(st);
  cutscene({dur:4.6,control:false,letterbox:true,skippable:false,fov:60,text:'KATHANA, PERFECT FORM',from:cam,to:cam,look:()=>({x:a.pos.x,y:a.pos.y+2.6,z:a.pos.z}),
    onTick:(k,dt,C)=>{const e=sm01((C.t-0.4)/2.4);a.pos.set(st.x,lerp(st.y+60,st.y,e),st.z);a.pose=e<0.9?'raise':'guard';a.keep=true;a.al+=(1-a.al)*Math.min(1,dt*2);
      if(!C.f&&C.t>0.4){C.f=true;flashWhite=0.8;SFX.chime();SFX.tone('sine',200,1800,1.2,0.12);}},
    onEnd:()=>{if(!inKS())return;a.keep=false;a.pos.set(st.x,st.y,st.z);a.al=1;pfQteStart();}});
}
// ================================================================
// The break-free QTE: the Perfect Form raises a hand and you are frozen in a gold-white grip (cutLocked reads KQ.on)
// ================================================================
const qteEl=()=>$('qte');
function qteHide(){const e=qteEl();if(e){e.hidden=true;e.classList.remove('fail','hit');}}
function pfQteStart(){
  if(!inKS()||!PF.real||!PF.real.alive)return;
  KQ.on=true;KQ.phase='mash';KQ.meter=0;KQ.t=0;KQ.n=0;KA.phase='qte';lockT=null;PF.fight=false;
  const e=qteEl();e.hidden=false;e.classList.remove('fail','hit');$('q-t').textContent='BREAK FREE';$('q-s').textContent=touchOn()?'TAP! TAP! TAP!':'mash SPACE';
  SFX.tone('sawtooth',160,50,0.8,0.18);SFX.tone('sine',900,400,0.5,0.1);addShake(0.4);
  const c=center(P);ringFx(c.x,c.y,c.z,3,1,0.5,[1,.85,.4]);
}
function pfPress(){
  if(!KQ.on||KQ.phase!=='mash')return;KQ.meter=Math.min(1,KQ.meter+0.085);KQ.n++;
  SFX.tone('square',420+KQ.meter*800,520+KQ.meter*900,0.06,0.05);
  const e=qteEl();e.classList.remove('hit');void e.offsetWidth;e.classList.add('hit');
}
addEventListener('keydown',e=>{if(KQ.on&&KQ.phase==='mash'&&e.code==='Space'){e.preventDefault();if(!e.repeat)pfPress();}},true);
addEventListener('pointerdown',e=>{if(KQ.on&&KQ.phase==='mash')pfPress();},true);
function qteTick(dt){
  if(!KQ.on||KQ.phase!=='mash')return;
  KQ.t+=dt;KQ.meter=Math.max(0,KQ.meter-0.05*dt);
  if(KQ.fails>=3)KQ.meter=Math.min(1,KQ.meter+0.75*dt); // three fails: it breaks by itself
  $('q-f').style.width=(KQ.meter*100).toFixed(1)+'%';$('q-tm').style.width=(clamp(1-KQ.t/KQ_NEED,0,1)*100).toFixed(1)+'%';
  P.vel.set(0,0,0);
  if(KQ.meter>=1)pfQteWin();else if(KQ.t>=KQ_NEED)pfQteFail();
}
function pfQteFail(){
  KQ.on=false;KQ.phase='fail';KQ.fails++;const e=qteEl();e.classList.add('fail');$('q-t').textContent='TOO SLOW';$('q-s').textContent='';setTimeout(()=>{if(!KQ.on)qteHide();},1300);
  const a=PF.real;KA.phase='qte-wait';
  if(a){a.pose='hit';a.hand=1;pfHurt(a,0.12,28);P.vel.y=Math.max(P.vel.y,7);flashWhite=Math.max(flashWhite,0.4);SFX.boom(0.9,1.2);addShake(0.8);const c=center(P);ringFx(c.x,c.y,c.z,1,22,0.5,[1,.85,.4]);}
  later(2,()=>{if(inKS()&&PF.real&&PF.real.alive&&!P.dead&&KA.phase==='qte-wait')pfQteStart();});
}
function pfQteWin(){
  KQ.on=false;KQ.phase='';qteHide();const a=PF.real,c=center(P);
  flashWhite=1;SFX.boom(1,2.2);SFX.chime();SFX.tone('sine',200,1600,1,0.15);addShake(1.2);
  ringFx(c.x,c.y,c.z,1,60,0.9,[1,.9,.5]);ringFx(c.x,c.y,c.z,1,40,0.6,[1,1,1]);burst(c.x,c.y,c.z,110,36,1.1,[[1,.9,.5],[1,1,1],[1,.7,.2]],2,0,1.5);KA.fx.push({x:c.x,y:c.y,z:c.z,t:0,dur:0.9,r0:2,r1:70,col:[1,.9,.5]});
  if(a){const dx=a.pos.x-P.pos.x,dz=a.pos.z-P.pos.z,l=Math.hypot(dx,dz)||1;a.pos.x+=dx/l*6;a.pos.z+=dz/l*6;pfClampPos(a);a.stag=1.6;a.pose='flung';a.st='orbit';a.cd=1.2;lockT=a;}
  PF.fight=true;KA.phase='fight';objective('Defeat the Perfect Form');kFly(12);
  toast('KATHANA, PERFECT FORM','Dodge the telegraphs · '+(touchOn()?'Attack':'Click')+' fires the Solar Lance · Z locks on','gold');
}
const qteWin=()=>{if(KQ.on){KQ.meter=1;qteTick(0);return true;}return false;};
// ================================================================
// Victory: it shatters, the white takes everything, the city comes back
// ================================================================
function kathanaWin(){const a=PF.real;if(!a||!a.alive||PF.won)return false;a.hp=0;a.alive=false;pfDefeated();return true;}
function pfDefeated(){
  if(PF.won)return;PF.won=true;PF.fight=false;KA.fight=false;KA.phase='won';KQ.on=false;qteHide();if(PF.still)pfStillEnd();PF.shards.length=0;lockT=null;
  const a=PF.real;a.alive=false;a.hp=0;for(const d of PF.list)if(d.dec)pfPop(d);
  const S=save.story,first=S.kathana<2;KW.first=first;
  if(first){S.kathana=2;S.kp=0;S.invasion=Math.max(S.invasion,1);if(S.ufo<2){S.ufo=4;UFO.on=false;UFO.leaving=false;objectiveMark(null);}persist();addXP(2500);save.stats.defeated++;feed('+2500 XP','Kathana, Perfect Form');}
  objective(null);
  const cam=k=>{const an=0.6+k*1.9,r=7.5-2.2*k;return {x:a.pos.x+Math.sin(an)*r,y:a.pos.y+2.4+k*0.8,z:a.pos.z+Math.cos(an)*r};};
  cutscene({dur:4.6,control:false,letterbox:true,skippable:false,fov:56,from:cam,to:cam,look:()=>({x:a.pos.x,y:a.pos.y+2.4,z:a.pos.z}),
    onTick:(k,dt,C)=>pfWinTick(k,dt,C,a),onEnd:()=>pfReturn(a)});
}
function pfWinTick(k,dt,C,a){
  const t=C.t;a.keep=true;
  if(t<1.1){a.pose='flung';a.glow=0;a.flash=0.5+0.5*Math.sin(t*50);a.pos.x+=Math.sin(t*90)*0.03;addShake(0.2+t*0.3);if(!C.c&&t>0.1){C.c=true;SFX.tone('sine',300,1900,1.1,0.12);}
    if(Math.random()<dt*30){const c=center(a);emit(c.x+rr(-1,1),c.y+rr(-1.5,1.5),c.z+rr(-1,1),rr(-3,3),rr(-3,3),rr(-3,3),0.5,[1,.9,.6],2,0,1);}}
  if(!C.sh&&t>=1.1){C.sh=true;a.vis=false;const c=center(a);
    for(let i=0;i<90;i++){const s=rr(0.12,0.45);spawnPiece(c.x+rr(-1,1),c.y+rr(-1.5,1.5),c.z+rr(-1,1),PFB,s*0.5,s*1.3,s*0.5,[1,1,1],rr(-26,26),rr(6,28),rr(-26,26),4,[rr(0,3),rr(0,3),0]);}
    burst(c.x,c.y,c.z,150,40,1.6,[[1,.9,.6],[1,1,1],[.7,.85,1]],2.2,-3,1.2);ringFx(c.x,c.y,c.z,1,60,0.9,[1,1,1]);KA.fx.push({x:c.x,y:c.y,z:c.z,t:0,dur:1,r0:2,r1:60,col:[1,.95,.8]});
    SFX.glass(1);SFX.boom(1,2.4);SFX.chime();addShake(1.5);flashWhite=1;}
  if(t>=2.0){const f=$('fade');f.style.background='#fff';f.style.opacity=clamp((t-2.0)/1.8,0,1).toFixed(3);}
}
function pfReturn(a){
  const f=$('fade');
  if(!zone||zone.id!=='void'){f.style.background='#000';f.style.opacity='0';pfWorldBack();return;}
  if(leaveZone(KA.ret,pfWorldBack)){ZF.t=ZONE_FADE;} // the white is already full: skip the fade to black
  else{zoneAbort();f.style.background='#000';f.style.opacity='0';pfWorldBack();}
}
function pfWorldBack(){
  $('fade').style.background='#000';
  if(save.story.kathana>=2)worldUpgrade();
  if(state!=='play')return;
  cutscene({dur:5.4,control:false,letterbox:true,skippable:true,fov:68,text:'The world comes back',
    from:()=>({x:P.pos.x-70,y:P.pos.y+55,z:P.pos.z+70}),to:()=>({x:P.pos.x+34,y:P.pos.y+20,z:P.pos.z-34}),look:()=>({x:P.pos.x,y:P.pos.y+4,z:P.pos.z}),
    onTick:(k,dt,C)=>{if(!C.f&&C.t>0.1){C.f=true;SFX.chime();SFX.tone('sine',300,900,1.2,0.08);}},onEnd:pfAfterWin});
}
function pfAfterWin(){
  const first=KW.first;KW.first=false;
  if(!first){toast('The Perfect Form is gone','Again.','gold');return;}
  const go=()=>{invArrive();objective('Look up: the fleet is coming');later(10,()=>{if(OBJ.text==='Look up: the fleet is coming')objective(null);});};
  const ok=askInfo('Everyone is super now',['Civilians, police and thugs are twice as tough and much faster, and every human has a power.',{b:'And something is coming: 100 ships are gathering above Earth.'}],'Look up',go);
  if(!ok){toast('Everyone is super now','And something is coming: 100 ships are gathering above Earth.','gold');go();}
}
// ================================================================
// A super-powered world (save.story.kathana>=2): every human is tougher and faster and has a power
// ================================================================
const SUP={n:0,t:0,cols:[[.4,.85,1],[1,.6,.2],[.85,.45,1],[.45,1,.6],[1,.45,.55]]};
function superOn(){return !!save.story&&save.story.kathana>=2;}
function humanSuper(h){ // called by spawnHuman (50_npcs.js) and, once, for the people already in the city
  if(h.sup||h.kind!=='human')return;h.sup=true;h.hp*=2;h.maxHp*=2;h.walk*=1.5;h.run*=1.5;h.spi=(Math.random()*SUP.cols.length)|0;h.pw=0;h.pwCd=rr(1,8);
  h.sp=h.role==='civilian'?pick(['hover','trail','fist','hover']):pick(['fist','trail','fist']);
}
function worldUpgrade(){for(const h of humans)humanSuper(h);}
function superTick(dt){
  if(!superOn()||zone||P.dead)return;
  for(const h of humans){if(h.pw>0){h.pw-=dt;if(h.sp==='trail'&&h.alive&&h.moving>2&&!h.air){const c=SUP.cols[h.spi],s=Math.sin(h.yaw),co=Math.cos(h.yaw);emit(h.pos.x-s*0.5,h.pos.y+rr(0.4,1.6),h.pos.z-co*0.5,-s*3,rr(-0.3,0.3),-co*3,0.5,c,1.6,0,1);}}}
  SUP.t-=dt;if(SUP.t>0)return;SUP.t=0.2;
  let n=0;for(const h of humans)if(h.pw>0)n++;SUP.n=n;
  for(const h of humans){
    if(!h.sup||!h.alive||h.held||h.hidden||h.air||h.rag||h.stun>0||h.downed>0)continue;
    const dx=h.pos.x-P.pos.x,dz=h.pos.z-P.pos.z;if(dx*dx+dz*dz>150*150)continue;
    h.pwCd-=0.2;if(h.pwCd>0||SUP.n>=10)continue;
    const t=h.target;
    if(h.role!=='civilian'&&t&&h.state!=='hidden'&&validTarget(t)){ // thugs and police: a power blast, and a high leap at range
      const tc=center(t),d=Math.hypot(tc.x-h.pos.x,tc.z-h.pos.z);
      if(d>14&&d<60&&Math.random()<0.3){h.air=true;h.vel.set((tc.x-h.pos.x)/d*11,rr(16,21),(tc.z-h.pos.z)/d*11);h.apexT=time;h.tumble=0;h.pw=2.4;h.pwCd=rr(5,9);SUP.n++;continue;}
      if(d>7&&d<50&&losClear(h.pos.x,h.pos.y+1.5,h.pos.z,tc.x,tc.y,tc.z)){const o={x:h.pos.x,y:h.pos.y+1.5,z:h.pos.z},v=dirTo(o,tc.x,tc.y,tc.z);
        fireProj({kind:'blast',owner:h,x:o.x,y:o.y,z:o.z,vx:v[0]*50,vy:v[1]*50,vz:v[2]*50,dmg:h.role==='police'?9:10,knock:10,r:0.5,life:2});SFX.tone('square',500,1300,0.12,0.05*SFX.vol(o.x,o.y,o.z));h.punchT=time;h.pw=0.5;h.pwCd=rr(2.2,4);SUP.n++;continue;}
      continue;
    }
    if(h.sp==='hover'&&h.state!=='victim'&&h.state!=='flee'){h.air=true;h.vel.set(rr(-3,3),rr(11,15),rr(-3,3));h.apexT=time;h.tumble=0;h.pw=2.4;h.pwCd=rr(6,14);SUP.n++;}
    else if(h.sp==='trail'){h.slow=-0.7;h.slowT=2.6;h.pw=2.6;h.pwCd=rr(7,14);SUP.n++;}
    else h.pwCd=rr(4,9);
  }
}
