// ================================================================
// Hero-inspired abilities (original names and designs)
// ================================================================
const thrown=[];            // hammers and shields in flight
const wells=[];             // gravity wells
let bigBeam=null;           // core beam / spirit wave in progress
let timeDil=0,hasteT=0;     // time dilation (world slow) / haste in multiplayer
const HAMMER_C=[.55,.58,.62,1],HANDLE_C=[.35,.22,.12,1],DISC_C=[.8,.82,.86,1],DISC_B=[.2,.35,.8,1];
function nearestFoe(x,y,z,R,skip){
  let best=null,bd=R;for(const a of actors){if(!a.alive||a.held||a===P||a.kind==='prop'||a.kind==='vehicle'||(skip&&skip.has(a)))continue;
    if(a.kind==='human'&&a.role==='civilian'&&playerFaction()!=='villain')continue;const c=center(a),d=Math.hypot(c.x-x,c.y-y,c.z-z);if(d<bd){bd=d;best=a;}}
  return best;
}
Object.assign(POWER_FN,{
  stormHammer(){faceAim();const h=handPoint(),d=dirTo(h,aim.x,aim.y,aim.z),R=pstat('stormHammer','range');
    thrown.push({kind:'hammer',x:h.x,y:h.y,z:h.z,vx:d[0]*75,vy:d[1]*75,vz:d[2]*75,t:0,back:false,max:R/75,hit:new Set(),spin:0});SFX.whoosh();},
  ricochetShield(){faceAim();const h=handPoint(),first=lockT&&lockT.alive?lockT:aim.actor&&aim.actor.kind!=='prop'&&aim.actor.kind!=='vehicle'?aim.actor:nearestFoe(aim.x,aim.y,aim.z,15);
    const tgt=first?center(first):{x:aim.x,y:aim.y,z:aim.z},d=dirTo(h,tgt.x,tgt.y,tgt.z);
    thrown.push({kind:'disc',x:h.x,y:h.y,z:h.z,vx:d[0]*85,vy:d[1]*85,vz:d[2]*85,t:0,back:false,max:1.2,hit:new Set(),target:first||null,left:Math.round(pstat('ricochetShield','bounces')),spin:0});SFX.whoosh();},
  coreBeam(){bigBeam={kind:'core',t:0,wind:0.45,dur:1.5,w:1.4,dps:pstat('coreBeam','dps')};SFX.tone('sawtooth',200,900,0.45,0.1);},
  bladeClaws(){
    const R=pstat('bladeClaws','range');let tx=P.pos.x+camF.x*R,tz=P.pos.z+camF.z*R;
    if(lockT&&lockT.alive){const c=center(lockT);tx=c.x;tz=c.z;}
    const dx=tx-P.pos.x,dz=tz-P.pos.z,l=Math.hypot(dx,dz)||1,ux=dx/l,uz=dz/l,dist=Math.min(l+2,R);
    const hit=new Set(),dmg=pstat('bladeClaws','damage')*strengthMul();
    // slash through everything along the lunge
    for(let s=0;s<=dist;s+=1.5){const x=P.pos.x+ux*s,z=P.pos.z+uz*s;for(const a of actors){if(!a.alive||a===P||hit.has(a)||a.kind==='prop')continue;const c=center(a);
      if(Math.hypot(c.x-x,c.z-z)<2.6&&Math.abs(c.y-(P.pos.y+1.2))<3){hit.add(a);if(a.kind==='vehicle')Damage.apply(P,a,dmg*0.8,'slash');else Damage.apply(P,a,dmg,'slash',{stun:0.8,kv:[ux*14,6,uz*14]});
        for(let i=0;i<3;i++)later(i*0.06,()=>{const q=center(a);tracer(q.x-uz*1.2,q.y+rr(-.6,.6)+0.6,q.z+ux*1.2,q.x+uz*1.2,q.y+rr(-.6,.6)-0.6,q.z-ux*1.2,[.9,.95,1],0.07,0.12);});}}}
    hitProps(P.pos.x+ux*dist*0.5,P.pos.y+1,P.pos.z+uz*dist*0.5,dist*0.5,P,18);
    P.vel.set(ux*dist*5,P.grounded?3:2,uz*dist*5);P.burstT=0.2;P.heroYaw=Math.atan2(ux,uz);P.punchT=time;P.punchKind='fin';
    SFX.swish();SFX.tone('square',1400,2400,0.08,0.05);if(hit.size){SFX.punch(1);addShake(0.25);}
    for(let i=0;i<14;i++)emit(P.pos.x+ux*rr(0,dist),P.pos.y+rr(0.5,2),P.pos.z+uz*rr(0,dist),0,0,0,0.3,[.85,.9,1],0.9,0,0);},
  blink(){
    const R=pstat('blink','range');let t=rayCity(P.pos.x,P.pos.y+1.5,P.pos.z,camF.x,camF.y,camF.z,R);let x=P.pos.x+camF.x*(t-1.2),y=P.pos.y+1.5+camF.y*(t-1.2)-1.5,z=P.pos.z+camF.z*(t-1.2);
    const g=groundY(x,z,y+2);if(y<g)y=g;
    const puff=(px,py,pz)=>{burst(px,py+1.2,pz,50,8,0.7,[[.35,.15,.55],[.1,.05,.15],[.8,.6,1]],2.2,0,2);smoke(px,py+1,pz,4,1,4,1.5,0.1);};
    puff(P.pos.x,P.pos.y,P.pos.z);P.pos.set(x,y,z);P.vel.set(0,0,0);P.web=null;P.wallRun=null;puff(x,y,z);
    SFX.tone('sine',900,180,0.3,0.1);ringFx(x,y+1,z,0.5,7,0.3,[.7,.5,1]);
    areaDamage(x,y+1,z,5,pstat('blink','damage')*strengthMul(),P,{knock:18,stun:0.5});},
  gravityWell(){faceAim();let x=aim.x,y=aim.y,z=aim.z;if(!aim.hitAny){x=P.pos.x+camF.x*30;y=P.pos.y+camF.y*30+1;z=P.pos.z+camF.z*30;}
    if(aim.surface){x+=aim.nx*2;y+=aim.ny*2+1;z+=aim.nz*2;}
    wells.push({x,y,z,t:0,dur:4,R:pstat('gravityWell','radius'),dmg:pstat('gravityWell','damage')*strengthMul()});SFX.tone('sine',80,40,1.5,0.15);MP.fx('gw',{x:Math.round(x),y:Math.round(y),z:Math.round(z)});},
  timeDilation(){const d=pstat('timeDilation','duration');if(MP.online()){hasteT=d;feed('Haste','Time can\'t bend in a shared city, so you speed up instead');}else timeDil=d;
    SFX.tone('sine',600,120,0.8,0.12);ringFx(P.pos.x,P.pos.y+1.3,P.pos.z,1,30,0.6,[.6,.8,1]);flashWhite=0.25;},
});
// ---- repulsors: channelled palm blasts ----
let repT=0,repHand=1;
function repulsorTick(dt){repT-=dt;if(repT>0)return;repT=0.11;faceAim();repHand=-repHand;
  const s=Math.sin(P.heroYaw),c=Math.cos(P.heroYaw),h={x:P.pos.x+s*0.8+c*0.45*repHand,y:P.pos.y+1.75,z:P.pos.z+c*0.8-s*0.45*repHand},d=dirTo(h,aim.x,aim.y,aim.z);
  fireProj({kind:'blast',owner:P,x:h.x,y:h.y,z:h.z,vx:d[0]*120,vy:d[1]*120,vz:d[2]*120,dmg:pstat('repulsors','damage')*strengthMul(),knock:pstat('repulsors','knock'),r:0.4,life:1.4});
  SFX.tone('square',900,1600,0.06,0.05);emit(h.x,h.y,h.z,0,0,0,0.12,[.8,.95,1],1.4,0,0);}
// ---- spirit wave: hold to charge, release to fire ----
function chargeFire(id){
  const s=PS[id],k=clamp((s.chargeT||0)/2,0.2,1);if(!canAct())return;
  if(!spend(POWERS[id].energy*(0.5+k*0.5))){noEnergy(id);return;}s.cd=pstat(id,'cooldown');
  bigBeam={kind:'spirit',t:0,wind:0.05,dur:0.9+k*0.8,w:1.5+k*3,dps:pstat(id,'damage')*strengthMul()*(0.6+k)};SFX.boom(0.8,0.6);addShake(0.3+k*0.4);
}
// ---- updates ----
function updateHeroAbilities(dt){
  if(timeDil>0)timeDil-=dt;if(hasteT>0)hasteT-=dt;
  const sw=PS.spiritWave;if(sw&&sw.holding){sw.chargeT=(sw.chargeT||0)+dt;const h=handPoint(),k=Math.min(1,sw.chargeT/2);if(!canAct())sw.holding=false;
    if(Math.random()<0.5+k*0.5){const a=rr(0,TAU),r=rr(1,2.5);emit(h.x+Math.cos(a)*r,h.y+rr(-1,1),h.z+Math.sin(a)*r,-Math.cos(a)*r*3,0,-Math.sin(a)*r*3,0.3,[.55,.8,1],0.8+k,0,0);}}
  for(let i=thrown.length-1;i>=0;i--){const T=thrown[i];T.t+=dt;T.spin+=dt*25;
    if(!T.back){
      if(T.kind==='disc'&&T.target&&T.target.alive){const c=center(T.target),d=dirTo(T,c.x,c.y,c.z);T.vx=d[0]*85;T.vy=d[1]*85;T.vz=d[2]*85;}
      if(T.t>T.max)T.back=true;}
    else{const h=handPoint(),d=Math.hypot(h.x-T.x,h.y-T.y,h.z-T.z);if(d<2.5){thrown.splice(i,1);SFX.tone('triangle',500,300,0.1,0.06);continue;}const s=T.kind==='disc'?95:85;T.vx=(h.x-T.x)/d*s;T.vy=(h.y-T.y)/d*s;T.vz=(h.z-T.z)/d*s;}
    const nx=T.x+T.vx*dt,ny=T.y+T.vy*dt,nz=T.z+T.vz*dt;
    if(!T.back){const L=Math.hypot(T.vx,T.vy,T.vz)*dt||1,tb=rayCity(T.x,T.y,T.z,T.vx*dt/L,T.vy*dt/L,T.vz*dt/L,L);
      if(tb<L){const hx=T.x+T.vx*dt*tb/L,hy=T.y+T.vy*dt*tb/L,hz=T.z+T.vz*dt*tb/L;if(T.kind==='hammer'){bolt(hx,hy,hz);crater(hx,hy,hz,RAYHIT.nx,RAYHIT.ny,RAYHIT.nz,2.5,RAYHIT.b&&RAYHIT.b.col);}else{burst(hx,hy,hz,16,10,0.3,SPARK,1,10,1);SFX.punch(0.6);}T.back=true;}}
    T.x=nx;T.y=ny;T.z=nz;
    for(const a of actors){if(!a.alive||a===P||T.hit.has(a)||a.kind==='prop'||a.held)continue;const c=center(a);if(Math.hypot(c.x-T.x,c.y-T.y,c.z-T.z)>(a.radius||1)+1.2)continue;
      T.hit.add(a);
      if(T.kind==='hammer'){Damage.apply(P,a,pstat('stormHammer','damage')*strengthMul(),'shock',{stun:pstat('stormHammer','stun'),kv:a.kind==='vehicle'?null:[T.vx*0.35,12,T.vz*0.35]});if(!T.bolted){T.bolted=true;bolt(c.x,c.y,c.z);areaDamage(c.x,c.y,c.z,6,pstat('stormHammer','damage')*0.4,P,{type:'shock',stun:0.5,exclude:a});}}
      else{Damage.apply(P,a,pstat('ricochetShield','damage')*strengthMul(),'slash',{stun:pstat('ricochetShield','stun'),knock:8});SFX.tone('triangle',1600,900,0.08,0.08);burst(c.x,c.y,c.z,14,8,0.3,SPARK,1,10,1);
        if(!T.back&&T.left>0){T.left--;T.target=nearestFoe(c.x,c.y,c.z,32,T.hit);T.t=0;if(!T.target)T.back=true;}else T.back=true;}}
    hitProps(T.x,T.y,T.z,1,P,14);
    if(T.t>6)thrown.splice(i,1);
  }
  for(let i=wells.length-1;i>=0;i--){const W=wells[i];W.t+=dt;
    const k=Math.min(1,W.t/0.6);
    if(!W.visual)for(const a of actors){if(!a.alive||a===P||a.held||a.kind==='prop'||a.kind==='boss')continue;const dx=W.x-a.pos.x,dy=W.y-a.pos.y,dz=W.z-a.pos.z,d=Math.hypot(dx,dy,dz)||1;if(d>W.R)continue;
      const f=(1-d/W.R)*55*k;
      if(a.kind==='human'){if(!a.air){a.air=true;a.vel.set(0,4,0);}a.vel.x+=(dx/d*f-dz/d*f*0.4)*dt;a.vel.y+=(dy/d*f+12)*dt;a.vel.z+=(dz/d*f+dx/d*f*0.4)*dt;a.tumble=6;a.floatT=0.2;}
      else if(a.kind==='vehicle'&&!a.net&&a!==P.car&&a.vtype!=='truck'){if(a.state!=='thrown'){if(a.driver)ejectDriver(a);a.state='thrown';a.vel.set(0,6,0);a.sx=rr(-2,2);a.sy=rr(-2,2);a.sz=rr(-2,2);a.life=8;a.thrower=P;a.throwDmg=30;}
        a.vel.x+=dx/d*f*0.7*dt;a.vel.y+=(dy/d*f*0.7+25)*dt;a.vel.z+=dz/d*f*0.7*dt;}
      else if(a.vel){a.vel.x+=dx/d*f*dt;a.vel.y+=dy/d*f*dt;a.vel.z+=dz/d*f*dt;}
      if(d<4)Damage.apply(P,a,W.dmg*0.25*dt,'gravity');}
    if(!W.visual)hitProps(W.x,Math.min(W.y,4),W.z,W.R*0.35*k,P,6);
    if(Math.random()<0.8){const a=rr(0,TAU),r=W.R*rr(0.3,1);emit(W.x+Math.cos(a)*r,W.y+rr(-3,3),W.z+Math.sin(a)*r,-Math.cos(a)*r*1.5,0,-Math.sin(a)*r*1.5,0.6,[.6,.35,1],1.2,0,0);}
    if(W.t>=W.dur){wells.splice(i,1);explode(W.x,W.y,W.z,1.4);if(!W.visual)areaDamage(W.x,W.y,W.z,W.R*0.6,W.dmg,P,{knock:40,type:'blast'});ringFx(W.x,W.y,W.z,1,W.R*1.4,0.5,[.7,.5,1]);flashWhite=Math.max(flashWhite,0.2);}}
  if(bigBeam){const B=bigBeam;B.t+=dt;
    if(!canAct()&&B.t<B.wind){bigBeam=null;beam=null;}
    else if(B.t>=B.wind){faceAim();const o=B.kind==='core'?{x:P.pos.x+Math.sin(P.heroYaw)*0.5,y:P.pos.y+1.9,z:P.pos.z+Math.cos(P.heroYaw)*0.5}:handPoint();
      const d=dirTo(o,aim.x,aim.y,aim.z),range=B.kind==='core'?160:240;let tb=rayCity(o.x,o.y,o.z,d[0],d[1],d[2],range);const hb=tb<range?RAYHIT.b:null,hn=[RAYHIT.nx,RAYHIT.ny,RAYHIT.nz];
      if(d[1]<0){const tg=(0.05-o.y)/d[1];if(tg>0&&tg<tb)tb=tg;}
      const ex=o.x+d[0]*tb,ey=o.y+d[1]*tb,ez=o.z+d[2]*tb;B.o=o;B.e={x:ex,y:ey,z:ez};beam={x:ex,y:ey,z:ez,w:B.w};
      for(const a of actors){if(!a.alive||a===P||a.kind==='prop')continue;const c=center(a),vx=c.x-o.x,vy=c.y-o.y,vz=c.z-o.z,s=vx*d[0]+vy*d[1]+vz*d[2];if(s<0||s>tb+1)continue;
        const px=vx-d[0]*s,py=vy-d[1]*s,pz=vz-d[2]*s;if(Math.hypot(px,py,pz)>B.w+(a.radius||1))continue;
        Damage.apply(P,a,B.dps*dt,'beam',{knock:0});if(a.kind==='human'&&a.alive===false&&!a.air)a.air=true;
        if(a.kind==='human'&&(!a.air)&&Math.random()<dt*3)Damage.apply(P,a,0.01,'beam',{kv:[d[0]*30,8,d[2]*30],flung:true});}
      if(hb&&hb.bld)damageBuilding(hb.bld,B.dps*dt*(B.kind==='spirit'?9:4),ex,ey,ez,d[0],d[2]);
      hitProps(ex,ey,ez,B.w+1,P,20);
      if(Math.random()<0.6){if(hb)addScorch(ex,ey,ez,B.w*1.2,hn[0],hn[1],hn[2]);else if(ey<0.3)addScorch(ex,0.03,ez,B.w*1.3);}
      for(let i=0;i<3;i++)emit(ex,ey,ez,rr(-10,10),rr(2,14),rr(-10,10),rr(0.3,0.6),B.kind==='spirit'?[.6,.85,1]:[1,.95,.8],rr(1,2)*B.w*0.6,18,0.5);
      if(Math.random()<dt*8)addShake(0.15);SFX.setLaser(true);
      if(B.t>=B.wind+B.dur){bigBeam=null;beam=null;SFX.setLaser(false);}}}
}
function drawHeroAbilities(){
  for(const T of thrown){
    if(T.kind==='hammer'){const M=at(T.x,T.y,T.z,T.spin,Math.atan2(T.vx,T.vz),0);queue(MESH.mbox,child(M,0,0.35,0,0,0,0,0.7,0.42,0.42),HAMMER_C,F_SH);queue(MESH.box,child(M,0,-0.2,0,0,0,0,0.12,0.8,0.12),HANDLE_C,F_SH);
      queue(MESH.glowSphere,at(T.x,T.y,T.z,0,0,0,1,1,1),[.6,.75,1,0.25],F_ADD);if(Math.random()<0.5)tracer(T.x,T.y,T.z,T.x+rr(-2,2),T.y+rr(-2,2),T.z+rr(-2,2),[.6,.75,1],0.06,0.08);}
    else{const M=at(T.x,T.y,T.z,0,T.spin,0);queue(MESH.mcyl,child(M,0,0,0,0,0,0,0.75,0.08,0.75),DISC_C,F_SH);queue(MESH.cyl,child(M,0,0.02,0,0,0,0,0.5,0.08,0.5),DISC_B,0);queue(MESH.mcyl,child(M,0,0.04,0,0,0,0,0.22,0.08,0.22),DISC_C,0);}}
  for(const W of wells){const k=Math.min(1,W.t/0.6),p=1+Math.sin(time*10)*0.05,s=(1.2+W.t*0.4)*k*p;
    queue(MESH.sphere,at(W.x,W.y,W.z,0,0,0,s,s,s),[0,0,0,1],F_UN);queue(MESH.glowSphere,at(W.x,W.y,W.z,0,0,0,s*1.6,s*1.6,s*1.6),[.55,.3,1,0.35],F_ADD);
    for(let i=0;i<3;i++)queue(MESH.ring,M4.alignY(tmpM(),W.x,W.y,W.z,Math.sin(time*2+i*2),1,Math.cos(time*1.7+i),s*(2.5+i*1.2)),[.7,.45,1,0.5*k],F_ADD);}
  const B=bigBeam;if(B&&B.o&&B.e){const w=B.w*(1+Math.sin(time*40)*0.08),col=B.kind==='spirit'?[.55,.85,1]:[1,.95,.8];
    queue(MESH.glowBox,M4.beam(tmpM(),B.o.x,B.o.y,B.o.z,B.e.x,B.e.y,B.e.z,w*0.5),[1,1,1,1],F_ADD);queue(MESH.glowBox,M4.beam(tmpM(),B.o.x,B.o.y,B.o.z,B.e.x,B.e.y,B.e.z,w*1.4),[col[0],col[1],col[2],0.45],F_ADD);
    queue(MESH.glowSphere,at(B.e.x,B.e.y,B.e.z,0,0,0,w*1.6,w*1.6,w*1.6),[col[0],col[1],col[2],0.6],F_ADD);queue(MESH.glowSphere,at(B.o.x,B.o.y,B.o.z,0,0,0,w*0.9,w*0.9,w*0.9),[1,1,1,0.8],F_ADD);}
  else if(B&&B.t<B.wind){const h=B.kind==='core'?{x:P.pos.x+Math.sin(P.heroYaw)*0.4,y:P.pos.y+1.9,z:P.pos.z+Math.cos(P.heroYaw)*0.4}:handPoint(),g=0.3+B.t*1.5;queue(MESH.glowSphere,at(h.x,h.y,h.z,0,0,0,g,g,g),[1,.95,.8,0.8],F_ADD);}
  const sw=PS.spiritWave;if(sw&&sw.holding){const h=handPoint(),k=Math.min(1,(sw.chargeT||0)/2),g=0.3+k*0.9+Math.sin(time*25)*0.05;queue(MESH.glowSphere,at(h.x,h.y,h.z,0,0,0,g,g,g),[.55,.85,1,0.9],F_ADD);queue(MESH.glowSphere,at(h.x,h.y,h.z,0,0,0,g*2,g*2,g*2),[.4,.7,1,0.25*k],F_ADD);}
  if(hasPower('bladeClaws')&&P.hand&&!P.alien&&!P.rag){for(const side of [-1,0,1])queue(MESH.mbox,child(P.hand,side*0.07,-0.1,0.25,0.3,0,0,0.03,0.05,0.55),[.85,.88,.92,1],0);}
}
