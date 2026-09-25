// ================================================================
// Police helicopters
// ================================================================
// When your heat climbs (robberies, carjacking police cars, attacking officers) a police
// helicopter joins the chase: it circles overhead, sweeps a searchlight at night and
// fires bursts at you. Shoot it down and it spins out of the sky and explodes.
const helis=[];let heliT=8;
function spawnHeli(target){
  const a=rr(0,TAU),x=clamp(target.pos.x+Math.cos(a)*260,-LIMIT,LIMIT),z=clamp(target.pos.z+Math.sin(a)*260,-LIMIT,LIMIT);
  const h={kind:'heli',faction:'police',alive:true,hp:450,maxHp:450,pos:new V3(x,90,z),vel:new V3(),yaw:0,rx:0,rz:0,target,orbit:rr(0,TAU),odir:Math.random()<0.5?1:-1,
    shootT:3,burst:0,shotN:0,flash:0,stun:0,slow:0,slowT:0,burn:0,burnDps:0,held:false,cy:1.6,radius:3.6,ys:0.5,rotor:0,crash:false,spin:0,leave:false,life:0};
  h.onDefeat=()=>{h.crash=true;h.spin=rr(2.5,4)*(Math.random()<0.5?-1:1);burst(h.pos.x,h.pos.y+1.5,h.pos.z,50,16,0.8,FIRE,2.4,-3,1.5);SFX.boom(SFX.vol(h.pos.x,h.pos.y,h.pos.z),0.9);};
  h.onHit=src=>{if(src&&(src===P||src.kind==='remote'))h.target=src;};
  helis.push(h);actors.push(h);feed('Police helicopter','Air support is on its way');return h;
}
function heliWants(){
  // who the police want from the air: the local player at high heat, plus wanted players when hosting
  const out=[];if(state==='play'&&!P.dead&&P.heat>=7)out.push(P);
  if(WS.host)for(const r of MP.peers.values())if(r.alive&&(r.flags&FLAG.wanted)&&r.faction==='villain')out.push(r);
  return out;
}
function manageHelis(dt){
  const wanted=heliWants(),live=helis.filter(h=>h.alive&&!h.leave);
  const want=wanted.length?Math.min(3,wanted.length+(save.reputation<=-1500&&P.heat>=7?1:0)):0;
  if(live.length<want){heliT-=dt;if(heliT<=0){heliT=rr(12,20);const t=wanted[live.length%wanted.length];spawnHeli(t);}}
  else heliT=Math.max(heliT,6);
  for(const h of live)if(!wanted.includes(h.target)){const t=wanted[0];if(t)h.target=t;else h.leave=true;}
}
function updateHeli(h,dt){
  h.flash=Math.max(0,h.flash-dt*5);h.rotor+=dt*(h.crash?20:38);
  if(h.burn>0&&h.alive){h.burn-=dt;Damage.apply(h.burnSrc,h,h.burnDps*dt,'burn');}
  if(h.held)return;
  if(h.crash){h.vel.y-=22*dt;h.vel.x*=1-0.3*dt;h.vel.z*=1-0.3*dt;h.pos.addS(h.vel,dt);h.yaw+=h.spin*dt;h.rx=lerp(h.rx,0.5,dt);h.rz+=h.spin*0.1*dt;
    if(Math.random()<0.8)smoke(h.pos.x,h.pos.y+2,h.pos.z,1,0.6,3,2,0.12);if(Math.random()<0.6)emit(h.pos.x,h.pos.y+1.5,h.pos.z,rr(-2,2),rr(1,4),rr(-2,2),0.5,FIRE[(Math.random()*3)|0],2,-2,1);
    const g=groundY(h.pos.x,h.pos.z,h.pos.y+1),b=inBuilding(h.pos.x,h.pos.y+1,h.pos.z,1);
    if(h.pos.y<=g+0.5||b){explode(h.pos.x,h.pos.y+1,h.pos.z,1.6);if(b){const n=faceNormal(b,h.pos.x,h.pos.y+1,h.pos.z);crater(h.pos.x,h.pos.y+1,h.pos.z,n[0],n[1],n[2],4,b.col);}else crater(h.pos.x,g+0.02,h.pos.z,0,1,0,5,[.3,.3,.3]);
      addFire(h.pos.x,Math.max(g,0)+0.3,h.pos.z,14,2,true);areaDamage(h.pos.x,h.pos.y+1,h.pos.z,10,60,null,{knock:20});
      for(let i=0;i<8;i++){const s=rr(0.6,1.6);spawnPiece(h.pos.x,h.pos.y+1.5,h.pos.z,MESH.box,s,s*0.4,s*1.6,i%2?[.9,.9,.92]:[.1,.1,.12],rr(-12,12),rr(6,16),rr(-12,12),12);}
      removeActor(h);removeFrom(helis,h);}
    return;}
  if(h.stun>0)h.stun-=dt;
  const t=h.target;let gx,gy,gz;
  if(h.leave||!t||(t===P?P.dead:!t.alive)){h.leave=true;h.life+=dt;const a=Math.atan2(h.pos.z,h.pos.x);gx=h.pos.x+Math.cos(a)*80;gz=h.pos.z+Math.sin(a)*80;gy=140;
    if(h.life>25||Math.abs(h.pos.x)>LIMIT+100||Math.abs(h.pos.z)>LIMIT+100){removeActor(h);removeFrom(helis,h);return;}}
  else{h.orbit+=dt*0.35*h.odir;const R=48;const c=center(t);gx=c.x+Math.cos(h.orbit)*R;gz=c.z+Math.sin(h.orbit)*R;
    gy=Math.max(c.y+26,groundY(h.pos.x,h.pos.z,h.pos.y+35)+12);}
  // steer, bank into turns and face the target
  const k=damp(h.stun>0?0.3:1.3,dt),spd=h.leave?40:32;let dx=gx-h.pos.x,dy=gy-h.pos.y,dz=gz-h.pos.z;const l=Math.hypot(dx,dz)||1;
  const want=Math.min(spd,l*0.8);h.vel.x+=(dx/l*want-h.vel.x)*k;h.vel.z+=(dz/l*want-h.vel.z)*k;h.vel.y+=(clamp(dy,-12,12)-h.vel.y)*k;
  h.pos.addS(h.vel,dt);
  if(inBuilding(h.pos.x,h.pos.y,h.pos.z,2)){h.pos.y+=20*dt;h.vel.y=Math.max(h.vel.y,8);}
  const fy=t&&!h.leave?Math.atan2(center(t).x-h.pos.x,center(t).z-h.pos.z):Math.atan2(h.vel.x,h.vel.z);h.yaw=angLerp(h.yaw,fy,damp(2,dt));
  const s=Math.sin(h.yaw),c2=Math.cos(h.yaw),fwd=h.vel.x*s+h.vel.z*c2,side=h.vel.x*c2-h.vel.z*s;h.rx=lerp(h.rx,clamp(fwd*0.012,-0.3,0.3),damp(3,dt));h.rz=lerp(h.rz,clamp(-side*0.015,-0.35,0.35),damp(3,dt));
  // door gunner bursts
  if(t&&!h.leave&&h.stun<=0){h.shootT-=dt;if(h.shootT<=0){if(h.burst<=0)h.burst=8;h.burst--;h.shootT=h.burst>0?0.14:rr(1.6,2.6);
    const tc=center(t),ox=h.pos.x,oy=h.pos.y+0.8,oz=h.pos.z,d=Math.hypot(tc.x-ox,tc.y-oy,tc.z-oz);
    if(d<220){const tv=t.vel?t.vel.len():0,hit=Math.random()<clamp(0.6-d/400-tv/150,0.06,0.5);
      const ex=tc.x+(hit?0:rr(-4,4)),ey=tc.y+(hit?0:rr(-2,2)),ez=tc.z+(hit?0:rr(-4,4));tracer(ox,oy,oz,ex,ey,ez,[1,.85,.5],0.06,0.06);h.shotN++;
      SFX.gun(SFX.vol(ox,oy,oz));if(hit&&losClear(ox,oy,oz,tc.x,tc.y,tc.z))Damage.apply(h,t,5,'bullet');else if(!hit)hitProps(ex,ey,ez,0.6,null,4);}}}
}
// a cone whose tip sits at a and whose base (radius r) sits at b
function coneM(o,ax,ay,az,bx,by,bz,r){let yx=ax-bx,yy=ay-by,yz=az-bz;const L=Math.hypot(yx,yy,yz)||1;yx/=L;yy/=L;yz/=L;
  let xx=yy,xy=-yx,xz=0;if(Math.abs(yz)<0.9){xx=yy;xy=-yx;xz=0;}else{xx=0;xy=yz;xz=-yy;}const xl=Math.hypot(xx,xy,xz)||1;xx/=xl;xy/=xl;xz/=xl;
  const zx=xy*yz-xz*yy,zy=xz*yx-xx*yz,zz=xx*yy-xy*yx;
  o[0]=xx*r;o[1]=xy*r;o[2]=xz*r;o[3]=0;o[4]=yx*L;o[5]=yy*L;o[6]=yz*L;o[7]=0;o[8]=zx*r;o[9]=zy*r;o[10]=zz*r;o[11]=0;o[12]=(ax+bx)/2;o[13]=(ay+by)/2;o[14]=(az+bz)/2;o[15]=1;return o;}
function updateHelis(dt){manageHelis(dt);for(const h of helis.slice())updateHeli(h,dt);}
function drawHelis(){
  for(const h of helis){const q=inView(h.pos.x,h.pos.z,800,40);if(q<0)continue;
    const root=at(h.pos.x,h.pos.y,h.pos.z,h.rx,h.yaw,h.rz);queue(heliMesh,root,h.crash?[.35,.33,.32,1]:[1,1,1,1],q<260*260?F_SH:0,h.flash*0.6);
    queue(MESH.box,child(root,0,3.35,0,0,h.rotor,0,11,0.06,0.45),ROTOR_C,0);queue(MESH.box,child(root,0,3.35,0,0,h.rotor+Math.PI/2,0,11,0.06,0.45),ROTOR_C,0);
    queue(MESH.box,child(root,0.25,2.4,-6.8,h.rotor*1.7,0,0,0.05,2.2,0.2),ROTOR_C,0);
    if(!h.crash){const on=Math.sin(time*10)>0;queue(MESH.glowBox,child(root,-0.4,0.3,0,0,0,0,0.3,0.15,0.3),on?SIR_R:SIR_OFF,0);queue(MESH.glowBox,child(root,0.4,0.3,0,0,0,0,0.3,0.15,0.3),on?SIR_OFF:SIR_B,0);
      if(env.night>0.3&&h.target&&!h.leave){const c=h.target===P?P.pos:h.target.pos,gy=groundY(c.x,c.z,c.y+2);
        queue(MESH.cone,coneM(tmpM(),h.pos.x,h.pos.y+0.4,h.pos.z,c.x,gy,c.z,6),[1,.97,.85,0.07*env.night],F_ADD);
        queue(MESH.disc,M4.alignY(tmpM(),c.x,gy+0.1,c.z,0,1,0,5),[1,.97,.85,0.18*env.night],F_ADD);}}}
}
