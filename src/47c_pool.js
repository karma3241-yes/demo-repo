// ================================================================
// More powers for the shared ability pool (anyone can put these on keys 4 and 5, or pick them for a custom build)
// ================================================================
// helpers: everyone in a cone in front of you, everyone near a point
function inCone(range,cosMin){const o={...center(P)},fx=camF.x,fz=camF.z,fl=Math.hypot(fx,fz)||1,out=[];
  for(const a of actors){if(!a.alive||a===P||a.kind==='prop'||a.held)continue;const c={...center(a)},dx=c.x-o.x,dy=c.y-o.y,dz=c.z-o.z,d=Math.hypot(dx,dy,dz);
    if(d>range+(a.radius||1)||d<0.1)continue;if((dx*fx+dz*fz)/fl/Math.max(0.1,Math.hypot(dx,dz))<cosMin&&d>2)continue;out.push({a,c,d,dx:dx/d,dy:dy/d,dz:dz/d});}
  return out;}
function flingVehicle(v,vx,vy,vz,dmg){if(v.net||v===P.car||v.state==='held')return;if(v.driver)ejectDriver(v);v.state='thrown';v.vel.set(vx,vy,vz);v.sx=rr(-3,3);v.sy=rr(-2,2);v.sz=rr(-3,3);v.life=5;v.thrower=P;v.throwDmg=dmg;}
const HEAL_C=[[.5,1,.6],[1,1,.85]];
Object.assign(POWER_FN,{
  sonicScream(){faceAim();const R=pstat('sonicScream','range'),dmg=pstat('sonicScream','damage')*strengthMul(),stun=pstat('sonicScream','stun');
    for(const h of inCone(R,0.55)){if(h.a.kind==='vehicle'){Damage.apply(P,h.a,dmg*0.5,'blast');continue;}Damage.apply(P,h.a,dmg,'blast',{stun,kv:[h.dx*12,4,h.dz*12]});}
    const e=P.eye||center(P);for(let i=1;i<=5;i++)later(i*0.05,()=>ringFx(e.x+camF.x*i*R/5,e.y+camF.y*i*R/5,e.z+camF.z*i*R/5,0.5,1+i*R/10,0.25,[.8,.85,1],[camF.x,camF.y,camF.z]));
    const t=rayCity(e.x,e.y,e.z,camF.x,camF.y,camF.z,R);if(t<R&&RAYHIT.b)breakWindowAt(RAYHIT.b,e.x+camF.x*t,e.y+camF.y*t,e.z+camF.z*t);
    hitProps(e.x+camF.x*R*0.5,e.y,e.z+camF.z*R*0.5,R*0.4,P,12);SFX.tone('sawtooth',900,300,0.5,0.14);SFX.tone('square',1400,700,0.4,0.06);addShake(0.3);scare(P.pos.x,P.pos.z,R*1.5);},
  quakeStomp(){const R=pstat('quakeStomp','range'),dmg=pstat('quakeStomp','damage')*strengthMul(),fl=Math.hypot(camF.x,camF.z)||1,ux=camF.x/fl,uz=camF.z/fl,hit=new Set();
    P.punchT=time;P.punchKind='down';SFX.boom(0.7,0.6);addShake(0.45);
    for(let s=3;s<=R;s+=3){const x=P.pos.x+ux*s,z=P.pos.z+uz*s;later(s/60,()=>{const y=groundY(x,z,P.pos.y+4);
      burst(x,y+0.4,z,14,10,0.5,DUST,2,-3,1.6);for(let k=0;k<2;k++)spawnPiece(x+rr(-1.5,1.5),y+0.5,z+rr(-1.5,1.5),MESH.box,rr(0.6,1.4),rr(0.6,1.4),rr(0.6,1.4),[.42,.4,.38],rr(-3,3),rr(10,18),rr(-3,3),1.2);
      for(const a of actors){if(!a.alive||a===P||hit.has(a)||a.kind==='prop')continue;const c=center(a);if(Math.hypot(c.x-x,c.z-z)>3.4||c.y-y>4)continue;hit.add(a);
        if(a.kind==='vehicle')flingVehicle(a,ux*6,18,uz*6,dmg*0.4);else Damage.apply(P,a,dmg,'blast',{kv:[ux*4,22,uz*4],flung:true,stun:0.6});}
      hitProps(x,y,z,2.5,P,15);if(Math.random()<0.4)crater(x,y+0.02,z,0,1,0,1.6,[.42,.41,.4]);});}},
  meteorStrike(){faceAim();let x=aim.x,y=aim.y,z=aim.z;if(!aim.hitAny||Math.hypot(x-P.pos.x,z-P.pos.z)>160){const k=60;x=P.pos.x+camF.x*k;z=P.pos.z+camF.z*k;y=groundY(x,z,P.pos.y+20);}
    const R=pstat('meteorStrike','radius'),dmg=pstat('meteorStrike','damage')*strengthMul();ringFx(x,y+0.3,z,1,R,1.1,[1,.45,.2]);feed('Meteor incoming','');
    fireProj({kind:'rocket',owner:P,x:x+40,y:y+220,z:z+20,vx:-40/1.1,vy:-220/1.1,vz:-20/1.1,dmg,r:2.4,life:1.6,col:0,blast:R,bldDmg:dmg*8,meteor:true});SFX.tone('sawtooth',120,40,1.1,0.1);},
  forcePush(){faceAim();const R=pstat('forcePush','range'),dmg=pstat('forcePush','damage')*strengthMul();
    for(const h of inCone(R,0.5)){const f=40*(1-h.d/R*0.5);if(h.a.kind==='vehicle')flingVehicle(h.a,h.dx*f,12,h.dz*f,dmg);else Damage.apply(P,h.a,dmg,'blast',{kv:[h.dx*f,10,h.dz*f],flung:true});}
    for(const p of debris)if(!p.rest){const dx=p.x-P.pos.x,dz=p.z-P.pos.z,d=Math.hypot(dx,dz)||1;if(d<R&&(dx*camF.x+dz*camF.z)/d>0.5){p.vx+=dx/d*40;p.vy+=10;p.vz+=dz/d*40;}}
    const o={...center(P)};for(let i=0;i<24;i++){const s=rr(20,45);emit(o.x,o.y,o.z,(camF.x+rr(-.4,.4))*s,(camF.y+rr(-.2,.3))*s,(camF.z+rr(-.4,.4))*s,0.4,[.75,.85,1],1.2,0,1);}
    hitProps(o.x+camF.x*R*0.4,o.y,o.z+camF.z*R*0.4,R*0.35,P,20);SFX.whoosh();addShake(0.2);},
  chainLightning(){faceAim();const n=Math.round(pstat('chainLightning','bounces')),dmg=pstat('chainLightning','damage')*strengthMul(),hit=new Set();
    let from=handPoint(),cur=lockT&&lockT.alive?lockT:aim.actor&&aim.actor.kind!=='prop'&&aim.actor.alive?aim.actor:nearestFoe(aim.x,aim.y,aim.z,20)||nearestFoe(P.pos.x+camF.x*14,P.pos.y+1+camF.y*14,P.pos.z+camF.z*14,16);
    if(!cur){PS.chainLightning.cd=0;P.en+=POWERS.chainLightning.energy;feed('No one to hit','Aim at someone or lock on (Z)');return;}
    for(let i=0;i<=n&&cur;i++){const c={...center(cur)},f=from,a=cur;hit.add(a);
      later(i*0.08,()=>{for(let k=0;k<3;k++)tracer(f.x,f.y,f.z,c.x+rr(-.4,.4),c.y+rr(-.4,.4),c.z+rr(-.4,.4),[.65,.8,1],0.14-k*0.03,0.2);if(a.alive)Damage.apply(P,a,dmg*(1-i*0.08),'shock',{stun:0.5,knock:6});burst(c.x,c.y,c.z,14,8,0.3,CYAN,1,0,2);SFX.tone('sawtooth',1500,200,0.15,0.07);});
      from=c;cur=nearestFoe(c.x,c.y,c.z,18,hit);}},
  healingPulse(){const h=pstat('healingPulse','damage');P.hp=Math.min(maxHp(),P.hp+h);let n=0;
    for(const q of humans)if(q.alive&&q.downed>0&&Math.hypot(q.pos.x-P.pos.x,q.pos.z-P.pos.z)<20){q.downed=0;q.hp=Math.max(q.hp,40);q.state='flee';n++;}
    ringFx(P.pos.x,P.pos.y+0.3,P.pos.z,1,20,0.6,HEAL_C[0]);burst(P.pos.x,P.pos.y+1.3,P.pos.z,50,8,0.9,HEAL_C,1.4,-4,1.6);SFX.chime();
    if(n){addXP(10*n);if(playerFaction()!=='villain')addRep(3*n);}feed('+'+Math.round(h)+' health',n?n+' people back on their feet':'');},
  vineSnare(){faceAim();let x=aim.x,y=aim.y,z=aim.z;if(!aim.hitAny){x=P.pos.x+camF.x*25;z=P.pos.z+camF.z*25;y=groundY(x,z,P.pos.y+10);}
    const R=pstat('vineSnare','radius'),stun=pstat('vineSnare','stun'),dmg=pstat('vineSnare','damage')*strengthMul();
    for(const a of actors){if(!a.alive||a===P||a.kind==='prop'||a.kind==='vehicle')continue;const c=center(a);if(Math.hypot(c.x-x,c.z-z)>R||Math.abs(c.y-y)>6)continue;
      Damage.apply(P,a,dmg,'slash',{stun});if(a.vel)a.vel.set(0,Math.min(a.vel.y,0),0);a.slow=Math.max(a.slow||0,0.8);a.slowT=Math.max(a.slowT||0,stun+1);}
    for(let i=0;i<16;i++){const ang=rr(0,TAU),r=rr(0,R),vx=x+Math.cos(ang)*r,vz=z+Math.sin(ang)*r,h=rr(1.5,3.5);
      spawnPiece(vx,y+h/2,vz,MESH.cyl,0.15,h,0.15,[.18,.42,.16],0,0,0,stun);}
    ringFx(x,y+0.2,z,1,R,0.5,[.35,.9,.35]);burst(x,y+0.5,z,30,R,0.6,[[.3,.8,.3],[.2,.5,.2]],1.5,-2,1.4);SFX.tone('triangle',200,500,0.3,0.1);},
  shadowStep(){const R=pstat('shadowStep','range');let t=lockT&&lockT.alive?lockT:aim.actor&&aim.actor.kind!=='prop'&&aim.actor.alive?aim.actor:null;
    const puff=(px,py,pz)=>{burst(px,py+1.2,pz,40,6,0.6,[[.1,.05,.15],[.35,.15,.55]],2,0,2);smoke(px,py+1,pz,3,1,3,1.2,0.08);};puff(P.pos.x,P.pos.y,P.pos.z);
    if(t&&Math.hypot(t.pos.x-P.pos.x,t.pos.z-P.pos.z)<=R){const c=center(t),yaw=t.heroYaw!=null?t.heroYaw:t.yaw||0,bx=c.x-Math.sin(yaw)*2.2,bz=c.z-Math.cos(yaw)*2.2;
      P.pos.set(bx,Math.max(groundY(bx,bz,c.y+2),c.y-1.2),bz);P.vel.set(0,0,0);P.heroYaw=Math.atan2(c.x-bx,c.z-bz);P.punchT=time;P.punchKind='fin';
      Damage.apply(P,t,pstat('shadowStep','damage')*strengthMul(),'slash',{stun:1,kv:[Math.sin(P.heroYaw)*14,6,Math.cos(P.heroYaw)*14]});SFX.punch(1.2);addShake(0.25);}
    else{const d=Math.min(R,rayCity(P.pos.x,P.pos.y+1.5,P.pos.z,camF.x,0,camF.z,R)-1.5);const x=P.pos.x+camF.x*d,z=P.pos.z+camF.z*d;P.pos.set(x,Math.max(P.pos.y,groundY(x,z,P.pos.y+2)),z);P.vel.set(0,0,0);}
    P.web=null;P.wallRun=null;puff(P.pos.x,P.pos.y,P.pos.z);SFX.tone('sine',700,150,0.25,0.1);},
  plasmaWhip(){faceAim();const R=pstat('plasmaWhip','radius'),dmg=pstat('plasmaWhip','damage')*strengthMul(),o={...center(P)},yaw=P.heroYaw;
    for(const h of inCone(R,-0.1)){if(h.a.kind==='vehicle')Damage.apply(P,h.a,dmg*0.6,'fire');else Damage.apply(P,h.a,dmg,'fire',{kv:[h.dx*16,7,h.dz*16],stun:0.4});}
    for(let i=0;i<10;i++){const a0=yaw-1.6+i*0.32,a1=a0+0.32;later(i*0.012,()=>tracer(o.x+Math.sin(a0)*R,o.y+Math.sin(i)*0.3,o.z+Math.cos(a0)*R,o.x+Math.sin(a1)*R,o.y+Math.sin(i+1)*0.3,o.z+Math.cos(a1)*R,[1,.45,.9],0.16,0.18));}
    hitProps(o.x+Math.sin(yaw)*R*0.6,o.y,o.z+Math.cos(yaw)*R*0.6,R*0.6,P,14);P.punchT=time;P.punchKind='fin';SFX.swish();SFX.tone('sawtooth',500,1600,0.12,0.06);},
});
TOGGLE_FN.invisibility=()=>{P.cloak=!P.cloak;if(P.cloak){P.invisible=Math.max(P.invisible||0,0.2);for(const a of actors)if(a.target===P)a.target=null;burst(P.pos.x,P.pos.y+1.3,P.pos.z,30,5,0.6,[[.6,.7,.9]],1,0,2);SFX.tone('sine',800,200,0.3,0.08);feed('Invisible','Enemies and the police lose track of you');}
  else SFX.tone('sine',200,800,0.2,0.06);};
function updatePool(dt){
  if(P.cloak){const c=pstat('invisibility','drain')*dt,paid=heroMeter()?payEn(c,'invisibility',true):P.en>=c?(P.en-=c,P.lastSpend=time,true):false;
    if(!paid||P.alien||P.dead){P.cloak=false;feed('Visible again','');}else P.invisible=Math.max(P.invisible||0,0.2);}
  if(!P.alien&&P.invisible>0&&!P.cloak)P.invisible=Math.max(0,P.invisible-dt);
}
