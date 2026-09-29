// ================================================================
// More Ring Bearer constructs: a bike and a race car you drive on the ground,
// and hard-light weapons: a rifle, a bazooka and a huge laser cannon on your shoulder
// ================================================================
// The construct wheel has two pages of five (Q / E, the mouse wheel or the page button switch pages).
const CON_PAGES=[['bubble','jet','mech','titan','dragon'],['bike','racer','rifle','bazooka','cannon']];
Object.assign(CONSTRUCTS,{
  bike:{name:'Bike',bike:true,unlock:2,cost:4,drain:0.35,speed:1,drive:{top:72,accel:42,steer:2.7},cam:1.25,attacks:'WASD ride · Shift boost · LMB guns · RMB ram · Space hop',blurb:'A hard-light motorbike',ext:true},
  racer:{name:'Race Car',unlock:4,cost:6,drain:0.45,speed:1,drive:{top:92,accel:34,steer:2.1},cam:1.45,attacks:'WASD drive · Shift nitro · LMB guns · RMB missiles',blurb:'A hard-light race car',ext:true},
  rifle:{name:'Rifle',unlock:1,cost:2,drain:0.12,speed:1,weapon:true,attacks:'LMB fire · RMB heavy burst · X grenade',blurb:'A hard-light assault rifle',ext:true},
  bazooka:{name:'Bazooka',unlock:3,cost:4,drain:0.18,speed:1,weapon:true,attacks:'LMB rocket · RMB homing salvo',blurb:'A shoulder rocket launcher',ext:true},
  cannon:{name:'Shoulder Cannon',unlock:8,cost:10,drain:0.3,speed:0.8,weapon:true,attacks:'Hold LMB to charge, let go to fire · RMB quick blast',blurb:'A giant laser cannon on your shoulder',ext:true},
});
for(const id of CON_PAGES[1])if(!CON_IDS.includes(id))CON_IDS.push(id);
const conDrive=()=>{const c=conDef();return c&&c.drive?c:null;};
// ---- driving the bike and the race car ----
function driveConstruct(dt,inF,inR,shift){
  const K=P.construct,C=CONSTRUCTS[K.id],g=conSizeK(),D={top:C.drive.top*g,accel:C.drive.accel*g,steer:C.drive.steer};K.spd=K.spd||0; // g: grown vehicles are faster in proportion
  const boost=shift&&(C.free||conFuel()>0.5)&&K.spd>5;if(boost){if(!C.free)conBurn(0.8*dt);if(Math.random()<dt*30){const b=-2.2;emit(P.pos.x+Math.sin(P.heroYaw)*b,P.pos.y+0.6,P.pos.z+Math.cos(P.heroYaw)*b,rr(-2,2),rr(0,2),rr(-2,2),0.35,C.armor?FIRE[1]:RING_C,1.6,0,0);}}
  const top=D.top*(boost?1.5:1)*(K.rideRam>0?1.4:1);
  if(inF>0.1)K.spd+=(K.spd<-0.5?D.accel*2:D.accel*(boost?1.8:1))*inF*dt;
  else if(inF<-0.1)K.spd-=(K.spd>0.5?D.accel*2.2:D.accel*0.6)*(-inF)*dt;
  else K.spd*=1-0.5*dt;
  if(K.spd>top)K.spd=lerp(K.spd,top,damp(3,dt));K.spd=Math.max(K.spd,-D.top*0.3);
  const turn=inR*D.steer*clamp(K.spd/10,-1,1)*(P.grounded?1:0.4);P.heroYaw-=turn*dt; // D steers right
  const fx=Math.sin(P.heroYaw),fz=Math.cos(P.heroYaw);
  P.vel.x=fx*K.spd;P.vel.z=fz*K.spd;P.vel.y-=CONFIG.move.gravity*dt;
  if(keys.Space&&P.grounded&&time-(K.hopT||-9)>0.6){K.hopT=time;P.vel.y=C.hop||(C.bike?16:C.heavy?6:11);P.grounded=false;SFX.whoosh();}
  K.lean=lerp(K.lean||0,-inR*clamp(K.spd/30,0,1)*(C.bike?0.55:0.12),damp(6,dt));
  if(K.rideRam>0)K.rideRam-=dt;
  // run into people, cars and street furniture
  const sp=Math.abs(K.spd);if(sp<5)return;
  for(const h of humans){if(!h.alive||h.air||h.hidden)continue;const dx=h.pos.x-P.pos.x,dz=h.pos.z-P.pos.z;if(Math.abs(dx)>3||Math.abs(dz)>3||Math.abs(h.pos.y-P.pos.y)>2.5)continue;
    if(Math.hypot(dx,dz)<2.4&&time-(h.bumpT||-9)>0.6){h.bumpT=time;Damage.apply(P,h,sp*(K.rideRam>0?3:1.4)*(1+ringMk()),'crash',{kv:[fx*sp*0.7,8+sp*0.15,fz*sp*0.7],flung:sp>25});}}
  for(const v of vehicles){if(!v.alive||v.state==='held'||v.state==='thrown'||v.state==='wreckAir')continue;const dx=v.pos.x-P.pos.x,dz=v.pos.z-P.pos.z;if(Math.abs(dx)>5||Math.abs(dz)>5)continue;
    if(Math.hypot(dx,dz)<v.hl*0.75+1.4&&time-(v.bumpT||-9)>0.5){v.bumpT=time;Damage.apply(P,v,sp*(K.rideRam>0?4:1.5),'crash');SFX.crash(clamp(sp/40,0.3,1));addShake(0.25);
      if((K.rideRam>0||C.crush)&&!v.net&&v!==P.car){if(v.driver)ejectDriver(v);v.state='thrown';v.vel.set(fx*sp*0.8,12+sp*0.2,fz*sp*0.8);v.sx=rr(-3,3);v.sy=rr(-2,2);v.sz=rr(-3,3);v.life=5;v.thrower=P;v.throwDmg=60;}
      else K.spd*=0.5;}}
  hitProps(P.pos.x+fx*1.8,0.6,P.pos.z+fz*1.8,1.4,P,sp);
}
// ---- attacks ----
function rifleShot(heavy){const o=conMuzzle(0),d=dirTo(o,aim.x,aim.y,aim.z),j=heavy?0.004:0.018;
  fireProj({kind:'ring',owner:P,x:o.x,y:o.y,z:o.z,vx:(d[0]+rr(-j,j))*190,vy:(d[1]+rr(-j,j))*190,vz:(d[2]+rr(-j,j))*190,dmg:(heavy?38:13)*(1+ringMk())*strengthMul(),knock:heavy?8:2,r:heavy?0.5:0.35,life:1.4,small:!heavy});
  SFX.tone('square',heavy?600:1000,heavy?200:500,0.05,heavy?0.06:0.035);}
function conRocket(o,d,dmg,blast){fireProj({kind:'rocket',owner:P,x:o.x,y:o.y,z:o.z,vx:d[0]*90,vy:d[1]*90,vz:d[2]*90,dmg,r:0.7,life:4,col:1,blast,bldDmg:dmg*6});SFX.whoosh();}
function conExtPrimary(K){
  const id=K.id;if(CONSTRUCTS[id].onPrimary)return CONSTRUCTS[id].onPrimary(K)!==false;
  if(id==='bike'||id==='racer'||id==='rifle'){K.gunning=true;return true;}
  if(CONSTRUCTS[id].armor)return armorPrimary(K);
  if(K.cd>0)return true;
  if(id==='bazooka'){if(!ringSpend(1.5)){ringOut();return true;}ringCast();K.cd=0.9;K.kick=time;const o=conMuzzle(0);conRocket(o,dirTo(o,aim.x,aim.y,aim.z),140*(1+ringMk())*strengthMul(),8);addShake(0.15);return true;}
  if(id==='cannon'){if(bigBeam||save.ring<3){if(save.ring<3)ringOut();return true;}K.chargeT=0;K.charging=true;SFX.tone('sawtooth',80,700,1.5,0.08);return true;}
  return true;
}
function conExtPrimaryUp(K){K.gunning=false;if(CONSTRUCTS[K.id].onPrimaryUp){CONSTRUCTS[K.id].onPrimaryUp(K);return;}
  if(K.id==='cannon'&&K.charging){K.charging=false;const k=clamp(K.chargeT/1.5,0,1);if(k<0.2)return;
    if(!ringSpend(3+7*k)){ringOut();return;}ringCast();K.cd=2.5;K.kick=time;
    {const g=conGrow('cannon');bigBeam={kind:'cannon',t:0,wind:0,dur:0.6+1.6*k,w:(1.6+3.4*k)*g,sc:g,dps:(260+900*k)*(1+ringMk())*strengthMul()*Math.sqrt(g)};}SFX.boom(0.6+0.4*k,0.5);addShake(0.3+0.5*k);flashWhite=Math.max(flashWhite,0.2*k);
    addMastery('powerRing',3+6*k);}
}
function conExtAlt(K,down){
  const id=K.id;if(CONSTRUCTS[id].armor)return armorAlt(K,down);if(CONSTRUCTS[id].onAlt){CONSTRUCTS[id].onAlt(K,down);return true;}if(!down)return true;if(K.cd2>0)return true;
  if(id==='bike'){if(!ringSpend(1.5)){ringOut();return true;}K.cd2=1.5;K.rideRam=1.1;K.spd=Math.max(K.spd||0,CONSTRUCTS[id].drive.top*1.2);SFX.whoosh();ringFx(P.pos.x,P.pos.y+0.8,P.pos.z,1,4,0.3,RING_C);}
  else if(id==='racer'){if(!ringSpend(2)){ringOut();return true;}K.cd2=1.1;fireMissiles(2);}
  else if(id==='rifle'){if(!ringSpend(1)){ringOut();return true;}ringCast();K.cd2=0.6;for(let i=0;i<3;i++)later(i*0.07,()=>{if(P.construct===K)rifleShot(true);});}
  else if(id==='bazooka'){if(!ringSpend(3)){ringOut();return true;}ringCast();K.cd2=2.5;K.kick=time;fireMissiles(4);}
  else if(id==='cannon'){if(!ringSpend(1.5)){ringOut();return true;}ringCast();K.cd2=0.8;K.kick=time;const o=conMuzzle(0),d=dirTo(o,aim.x,aim.y,aim.z);ringProj(o,d,150,120*(1+ringMk())*strengthMul(),{knock:24,big:2.5,r:1});SFX.tone('sine',300,1200,0.2,0.1);}
  return true;
}
function conExtX(K){
  if(CONSTRUCTS[K.id].armor)return true;if(CONSTRUCTS[K.id].onX)return CONSTRUCTS[K.id].onX(K)!==false;
  if(K.id!=='rifle'||K.cdx>0)return K.id==='rifle'||!!conDrive();
  if(!ringSpend(2)){ringOut();return true;}ringCast();K.cdx=2;const o=conMuzzle(0),d=dirTo(o,aim.x,aim.y,aim.z);
  fireProj({kind:'rocket',owner:P,x:o.x,y:o.y,z:o.z,vx:d[0]*45,vy:d[1]*45+12,vz:d[2]*45,dmg:90*(1+ringMk()),r:0.6,life:3,grav:30,col:1,blast:7});return true;
}
function conExtTick(K,dt){
  if(CONSTRUCTS[K.id].onTick)CONSTRUCTS[K.id].onTick(K,dt);
  if(K.id==='rifle'||K.id==='bike'||K.id==='racer'){ /* guns share the construct gun loop in updateRing */ }
  if(K.id==='cannon'&&K.charging){if(!canAct()){K.charging=false;return;}K.chargeT+=dt;if(K.chargeT>=1.5&&Math.random()<dt*6)addShake(0.05);
    const o=conMuzzle(0);if(Math.random()<0.6){const a=rr(0,TAU),r=rr(1.5,3);emit(o.x+Math.cos(a)*r,o.y+rr(-1,1),o.z+Math.sin(a)*r,-Math.cos(a)*r*3,rr(-1,1),-Math.sin(a)*r*3,0.3,RING_C,1.2,0,0);}}
}
// ---- drawing ----
function drawConExt(s,id,isPlayer){
  if(CONSTRUCTS[id].armor){drawArmorForm(s,id,isPlayer);return;}if(CONSTRUCTS[id].draw){CONSTRUCTS[id].draw(s,isPlayer?P.construct:null,isPlayer);return;}
  const K=isPlayer?P.construct:null,x=s.pos.x,y=s.pos.y,z=s.pos.z,yaw=s.heroYaw||0,G=RING_C;
  if(id==='bike'||id==='racer'){
    const lean=K?K.lean||0:s.bank||0,R=at(x,y,z,0,yaw,lean),spin=time*(K?(K.spd||0)*0.6:12),rx=Math.cos(yaw),rz=-Math.sin(yaw);
    const wheel=(lx,ly,lz,r)=>{const p=child(R,lx,ly,lz),wx=p[12],wy=p[13],wz=p[14];
      queue(MESH.ring,M4.alignY(tmpM(),wx,wy,wz,rx,0,rz,r),[G[0],G[1],G[2],0.85],F_ADD);queue(MESH.glowSphere,at(wx,wy,wz,spin,yaw,0,r*0.35,r*0.35,r*0.35),[G[0],G[1],G[2],0.35],F_BL);};
    if(id==='bike'){wheel(0,0.55,1.25,0.55);wheel(0,0.55,-1.15,0.55);
      glowQ(child(R,0,0.95,0.05,-0.15,0,0,0.35,0.35,2.1),0.6);glowQ(child(R,0,1.2,-0.4,0,0,0,0.42,0.18,1.0),0.65);glowQ(child(R,0,1.25,0.95,-0.5,0,0,0.12,0.9,0.12),0.5);
      glowQ(child(R,0,1.65,1.1,0,0,0,1.1,0.1,0.1),0.55);queue(MESH.glowSphere,child(R,0,1.1,1.55,0,0,0,0.22,0.18,0.12),[1,1,1,0.9],F_ADD);}
    else{for(const sd of [-1,1]){wheel(sd*1.05,0.5,1.55,0.5);wheel(sd*1.05,0.5,-1.45,0.5);}
      glowQ(child(R,0,0.7,0,0,0,0,2.1,0.45,4.6),0.55);glowQ(child(R,0,1.05,-0.3,0,0,0,1.2,0.45,1.6),0.5);glowQ(child(R,0,0.65,2.4,0,0,0,2.3,0.12,0.5),0.5);
      glowQ(child(R,0,1.35,-2.1,0,0,0,2.2,0.1,0.55),0.5);for(const sd of [-1,1]){glowQ(child(R,sd*0.8,1.05,-2.1,0,0,0,0.1,0.6,0.3),0.5);queue(MESH.glowSphere,child(R,sd*0.75,0.75,2.35,0,0,0,0.25,0.15,0.1),[1,1,1,0.9],F_ADD);}}
    return;}
  // weapons: held at your right side or on your right shoulder, aimed where you look
  const pitch=isPlayer?-P.pitch:0,kick=K&&time-(K.kick||-9)<0.15?-0.35:0,sy=Math.sin(yaw),cy=Math.cos(yaw);
  if(id==='rifle'){const R=at(x+cy*0.45+sy*0.55,y+1.55,z-sy*0.45+cy*0.55,pitch,yaw,0);
    glowQ(child(R,0,0,0.2+kick*0.3,0,0,0,0.16,0.26,1.3),0.5);glowQ(child(R,0,0.02,1.05,0,0,0,0.08,0.08,0.7),0.6);glowQ(child(R,0,-0.25,0.15,0.3,0,0,0.1,0.35,0.16),0.5);
    glowQ(child(R,0,-0.05,-0.55,0,0,0,0.14,0.22,0.4),0.45);if(K&&K.gunning)queue(MESH.glowSphere,child(R,0,0.02,1.5,0,0,0,0.2,0.2,0.3),[1,1,1,0.8],F_ADD);return;}
  if(id==='bazooka'){const R=at(x+cy*0.4,y+2.15,z-sy*0.4,pitch,yaw,0);
    queue(MESH.glowBox,child(R,0,0,0.3+kick,0,0,0,0.42,0.42,2.4),[G[0],G[1],G[2],0.4],F_BL);glowQ(child(R,0,0,1.55+kick,0,0,0,0.55,0.55,0.2),0.6);glowQ(child(R,0,-0.35,0.4,0,0,0,0.12,0.4,0.15),0.5);return;}
  if(id==='cannon'){const R=at(x+cy*0.55,y+2.55,z-sy*0.55,pitch,yaw,0),ch=K&&K.charging?clamp(K.chargeT/1.5,0,1):0;
    queue(MESH.glowBox,child(R,0,0,1.2+kick,0,0,0,0.7,0.7,5),[G[0],G[1],G[2],0.35],F_BL);glowQ(child(R,0,0,3.8+kick,0,0,0,0.95,0.95,0.3),0.6);
    for(let i=0;i<4;i++)glowQ(child(R,0,0,-0.4+i*1.1+kick,0,0,0,0.85,0.85,0.12),0.55);glowQ(child(R,0,-0.55,-0.3,0,0,0,0.3,0.5,0.8),0.45);
    if(ch>0){const g=0.3+ch*1.1+Math.sin(time*30)*0.05;queue(MESH.glowSphere,child(R,0,0,4,0,0,0,g,g,g),[G[0],G[1],G[2],0.8],F_ADD);queue(MESH.glowSphere,child(R,0,0,4,0,0,0,g*0.5,g*0.5,g*0.5),[1,1,1,0.9],F_ADD);}
    return;}
}
// where each of these fires from
function conExtMuzzle(id,side){return growMuzzle(conExtMuzzle0(id,side));}
function conExtMuzzle0(id,side){const s=Math.sin(P.heroYaw),c=Math.cos(P.heroYaw),cp=Math.cos(P.pitch),sp=Math.sin(-P.pitch);
  if(CONSTRUCTS[id].armor)return armorMuzzle(id,side,s,c);if(CONSTRUCTS[id].muzzle)return CONSTRUCTS[id].muzzle(side,s,c,cp,sp);
  if(id==='bike')return {x:P.pos.x+s*1.8+c*side*0.35,y:P.pos.y+1.1,z:P.pos.z+c*1.8-s*side*0.35};
  if(id==='racer')return {x:P.pos.x+s*2.6+c*side*0.9,y:P.pos.y+0.9,z:P.pos.z+c*2.6-s*side*0.9};
  if(id==='rifle')return {x:P.pos.x+c*0.45+s*(0.55+1.5*cp),y:P.pos.y+1.57-1.5*sp,z:P.pos.z-s*0.45+c*(0.55+1.5*cp)};
  if(id==='bazooka')return {x:P.pos.x+c*0.4+s*1.8*cp,y:P.pos.y+2.15-1.8*sp,z:P.pos.z-s*0.4+c*1.8*cp};
  return {x:P.pos.x+c*0.55+s*4*cp,y:P.pos.y+2.55-4*sp,z:P.pos.z-s*0.55+c*4*cp};}
