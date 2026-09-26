// ================================================================
// Even more Ring Bearer constructs: bikes and boards, heavy rides and aircraft, blades and guns
// ================================================================
// Three more pages on the construct wheel. The bicycle is the cheapest thing the ring can make:
// half a point of charge to build, and it never costs anything after that, even on an empty ring.
// Every construct can be grown with the mouse wheel (see conGrowStep), these included.
const cp3=(R,lx,ly,lz)=>{const m=child(R,lx,ly,lz);return {x:m[12],y:m[13],z:m[14]};};
const glowLine=(a,b,w,al)=>glowQ(M4.beam(tmpM(),a.x,a.y,a.z,b.x,b.y,b.z,w),al||0.6);
// a hard-light wheel whose axle runs across the vehicle
function hlWheel(R,yaw,lx,ly,lz,r,spin,thick){const p=child(R,lx,ly,lz),rx=Math.cos(yaw),rz=-Math.sin(yaw),G=RING_C;
  for(const o of thick?[-thick,thick]:[0]){const wx=p[12]+rx*o,wz=p[14]+rz*o;queue(MESH.ring,M4.alignY(tmpM(),wx,p[13],wz,rx,0,rz,r),[G[0],G[1],G[2],0.85],F_ADD);}
  queue(MESH.glowSphere,at(p[12],p[13],p[14],spin,yaw,0,r*0.3,r*0.3,r*0.3),[G[0],G[1],G[2],0.35],F_BL);}
const conLean=(s,K)=>K?K.lean||0:s.bank||0;
const conSpin=K=>time*(K?(K.spd||0)*0.6:12);
const conG=K=>K?conGrow(K.id):1;
// a melee sweep in front of you that grows with the construct
function bladeSweep(K,range,dmg,kv,up){const g=conG(K);return conSmash(range*g,dmg*(1+ringMk())*strengthMul()*Math.sqrt(g),kv*Math.sqrt(g),up*Math.sqrt(g),RING_C);}
Object.assign(CONSTRUCTS,{
  // ---- bikes & boards ----
  cycle:{name:'Bicycle',bike:true,free:true,rider:0.35,len:2,unlock:1,cost:0.5,drain:0,speed:1,drive:{top:34,accel:26,steer:2.9},hop:12,cam:1.15,ext:true,
    attacks:'WASD pedal · Shift sprint · Space hop · LMB bell',blurb:'Costs half a point once, then nothing, ever',
    onPrimary(K){if(time-(K.bellT||-9)<0.3)return;K.bellT=time;SFX.tone('sine',1900,1850,0.25,0.12);SFX.tone('sine',2400,2350,0.2,0.08,0.12);
      for(const h of humans)if(h.alive&&h.role==='civilian'&&Math.hypot(h.pos.x-P.pos.x,h.pos.z-P.pos.z)<12&&h.state==='walk'){h.yaw=Math.atan2(P.pos.x-h.pos.x,P.pos.z-h.pos.z);}},
    draw(s,K){const yaw=s.heroYaw||0,R=at(s.pos.x,s.pos.y,s.pos.z,0,yaw,conLean(s,K)),sp=conSpin(K);
      hlWheel(R,yaw,0,0.42,0.85,0.42,sp);hlWheel(R,yaw,0,0.42,-0.8,0.42,sp);
      const rh=cp3(R,0,0.42,-0.8),cr=cp3(R,0,0.4,0),se=cp3(R,0,1.0,-0.32),hd=cp3(R,0,1.02,0.62),fh=cp3(R,0,0.42,0.85),bar=cp3(R,0,1.25,0.7);
      glowLine(rh,cr,0.05);glowLine(rh,se,0.05);glowLine(cr,se,0.06);glowLine(se,hd,0.06);glowLine(cr,hd,0.06);glowLine(hd,fh,0.05);glowLine(hd,bar,0.05);
      glowQ(child(R,0,1.25,0.7,0,0,0,0.62,0.05,0.05),0.6);glowQ(child(R,0,1.04,-0.34,0,0,0,0.22,0.07,0.36),0.7);
      const a=sp*0.5;for(const sd of [-1,1]){const pd=cp3(R,sd*0.16,0.4+Math.sin(a+(sd>0?Math.PI:0))*0.17,Math.cos(a+(sd>0?Math.PI:0))*0.17);glowLine(cr,pd,0.03);glowQ(at(pd.x,pd.y,pd.z,0,yaw,0,0.14,0.03,0.08),0.7);}}},
  chopper:{name:'Chopper',bike:true,rider:0.5,len:3.4,unlock:2,cost:5,drain:0.4,speed:1,drive:{top:84,accel:38,steer:2.2},hop:14,cam:1.3,ext:true,
    attacks:'WASD ride · Shift boost · LMB guns · RMB wheelie ram',blurb:'A long, low hard-light chopper',
    onPrimary(K){K.gunning=true;},
    onAlt(K,down){if(!down||K.cd2>0)return;if(!ringSpend(1.5)){ringOut();return;}K.cd2=1.4;K.rideRam=1.2;K.wheelie=time;K.spd=Math.max(K.spd||0,CONSTRUCTS.chopper.drive.top*1.25);SFX.whoosh();ringFx(P.pos.x,P.pos.y+0.8,P.pos.z,1,5,0.3,RING_C);},
    muzzle(side,s,c){return {x:P.pos.x+s*2.2+c*side*0.4,y:P.pos.y+1.2,z:P.pos.z+c*2.2-s*side*0.4};},
    draw(s,K){const yaw=s.heroYaw||0,wh=K&&time-(K.wheelie||-9)<0.9?-0.35:0,R=at(s.pos.x,s.pos.y,s.pos.z,wh,yaw,conLean(s,K)),sp=conSpin(K);
      hlWheel(R,yaw,0,0.62,-1.4,0.62,sp,0.12);hlWheel(R,yaw,0,0.52,1.75,0.52,sp);
      const hub=cp3(R,0,0.52,1.75),neck=cp3(R,0,1.3,0.85),bar=cp3(R,0,1.75,0.7);glowLine(hub,neck,0.07);glowLine(neck,bar,0.05);glowQ(child(R,0,1.75,0.65,0,0,0,1.1,0.06,0.06),0.6);
      glowQ(child(R,0,0.95,0,-0.08,0,0,0.3,0.3,2.6),0.55);glowQ(child(R,0,1.2,0.35,0,0,0,0.5,0.35,0.9),0.6);glowQ(child(R,0,0.95,-0.7,0,0,0,0.5,0.15,0.8),0.65);
      for(const sd of [-1,1])glowQ(child(R,sd*0.3,0.55,-0.9,0.2,0,0,0.12,0.12,1.3),0.5);queue(MESH.glowSphere,child(R,0,1.25,1.0,0,0,0,0.2,0.16,0.12),[1,1,1,0.9],F_ADD);}},
  skates:{name:'Rocket Skates',rider:0.14,len:1,unlock:1,cost:0.8,drain:0.03,speed:1,drive:{top:44,accel:36,steer:3.4},hop:15,cam:1.05,ext:true,
    attacks:'WASD skate · Shift rocket boost · Space jump · LMB spin kick',blurb:'A pair of hard-light skates',
    onPrimary(K){if(K.cd>0)return;if(!ringSpend(0.4)){ringOut();return;}K.cd=0.5;P.flip={t:0,dur:0.45,rx:0,ry:TAU};bladeSweep(K,3,30,18,8);},
    draw(s,K){const yaw=s.heroYaw||0,R=at(s.pos.x,s.pos.y,s.pos.z,0,yaw,conLean(s,K));
      for(const sd of [-1,1]){glowQ(child(R,sd*0.2,0.1,0.05,0,0,0,0.16,0.08,0.55),0.7);for(const z of [-0.2,0.05,0.3])queue(MESH.glowSphere,child(R,sd*0.2,0.05,z,0,0,0,0.06,0.06,0.06),[RING_C[0],RING_C[1],RING_C[2],0.9],F_ADD);
        if(K&&K.spd>30)queue(MESH.glowSphere,child(R,sd*0.2,0.12,-0.35,0,0,0,0.1,0.1,0.35),[1,1,1,0.6],F_ADD);}}},
  board:{name:'Hoverboard',rider:0.5,len:2,unlock:1,cost:1.5,drain:0.1,speed:1,drive:{top:58,accel:42,steer:3.2},hop:22,cam:1.2,ext:true,
    attacks:'WASD ride · Shift boost · Space big air · LMB trick',blurb:'Ride a floating board of light',
    onPrimary(K){if(P.grounded||P.flip)return;const tr=[{rx:-TAU,ry:0},{rx:0,ry:TAU},{rx:-TAU,ry:TAU}][(K.tn=(K.tn||0)+1)%3];P.flip={t:0,dur:0.6,rx:tr.rx,ry:tr.ry};addMastery('powerRing',3);feed('Board trick','+style');SFX.whoosh();},
    draw(s,K){const yaw=s.heroYaw||0,R=at(s.pos.x,s.pos.y+0.35+Math.sin(time*3)*0.05,s.pos.z,0,yaw,conLean(s,K)*0.5);
      glowQ(child(R,0,0,0,0,0,0,0.7,0.07,1.9),0.7);glowQ(child(R,0,0.05,0.9,-0.3,0,0,0.6,0.05,0.25),0.6);glowQ(child(R,0,0.05,-0.9,0.3,0,0,0.6,0.05,0.25),0.6);
      for(const z of [-0.6,0.6])queue(MESH.glowSphere,child(R,0,-0.15,z,0,0,0,0.3,0.12,0.3),[RING_C[0],RING_C[1],RING_C[2],0.5],F_ADD);}},
  monster:{name:'Monster Truck',heavy:true,crush:true,hide:true,len:6,unlock:3,cost:9,drain:0.6,speed:1,drive:{top:62,accel:30,steer:1.8},hop:18,cam:1.8,ext:true,
    attacks:'WASD drive over everything · Space jump · LMB guns · RMB slam jump',blurb:'Wheels taller than you, crushes cars',
    onPrimary(K){K.gunning=true;},
    onAlt(K,down){if(!down||K.cd2>0||!P.grounded)return;if(!ringSpend(2)){ringOut();return;}K.cd2=2;K.slam=true;K.slamT=time;P.vel.y=30;P.grounded=false;SFX.whoosh();},
    onTick(K){if(K.slam&&P.grounded&&time-K.slamT>0.3){K.slam=false;const g=conG(K),R=10*g;areaDamage(P.pos.x,P.pos.y+1,P.pos.z,R,120*(1+ringMk())*Math.sqrt(g),P,{knock:30,type:'blast'});
      crater(P.pos.x,P.pos.y+0.05,P.pos.z,0,1,0,Math.min(8,4*g),[.42,.41,.4]);ringFx(P.pos.x,P.pos.y+0.3,P.pos.z,1,R*1.4,0.5,RING_C);SFX.boom(0.9,1);addShake(0.6);
      for(const v of vehicles)if(v.alive&&!v.net&&v!==P.car&&v.state!=='thrown'&&Math.hypot(v.pos.x-P.pos.x,v.pos.z-P.pos.z)<R){if(v.driver)ejectDriver(v);v.state='thrown';v.vel.set(rr(-6,6),rr(14,22),rr(-6,6));v.sx=rr(-3,3);v.sy=rr(-2,2);v.sz=rr(-3,3);v.life=5;v.thrower=P;v.throwDmg=60;}}},
    muzzle(side,s,c){return {x:P.pos.x+s*3+c*side*1,y:P.pos.y+3.2,z:P.pos.z+c*3-s*side*1};},
    draw(s,K){const yaw=s.heroYaw||0,R=at(s.pos.x,s.pos.y,s.pos.z,0,yaw,conLean(s,K)),sp=conSpin(K);
      for(const sd of [-1,1])for(const z of [-1.9,1.9])hlWheel(R,yaw,sd*1.55,1.15,z,1.15,sp,0.3);
      glowQ(child(R,0,2.55,0,0,0,0,2.7,0.9,5),0.5);glowQ(child(R,0,3.4,-0.4,0,0,0,2,0.9,2.1),0.45);glowQ(child(R,0,1.7,0,0,0,0,0.5,0.5,4),0.5);
      for(const sd of [-1,1]){glowQ(child(R,sd*0.9,1.75,1.9,0,0,sd*0.4,0.12,1.2,0.12),0.5);glowQ(child(R,sd*0.9,1.75,-1.9,0,0,sd*0.4,0.12,1.2,0.12),0.5);queue(MESH.glowSphere,child(R,sd*0.9,2.6,2.55,0,0,0,0.3,0.2,0.1),[1,1,1,0.9],F_ADD);}}},
  // ---- heavy & sky ----
  tank:{name:'Light Tank',heavy:true,crush:true,hide:true,len:6,unlock:5,cost:10,drain:0.6,speed:1,drive:{top:32,accel:16,steer:1.3},cam:1.7,ext:true,
    attacks:'WASD drive · LMB cannon · RMB machine gun',blurb:'A hard-light battle tank',
    onPrimary(K){if(K.cd>0)return;if(!ringSpend(2.5)){ringOut();return;}K.cd=1.3;K.kick=time;const o=conMuzzle(0),g=conG(K);
      conRocket(o,dirTo(o,aim.x,aim.y,aim.z),200*(1+ringMk())*strengthMul()*Math.sqrt(g),10*Math.min(g,40));explode(o.x,o.y,o.z,0.3);addShake(0.35);SFX.boom(0.7,0.9);},
    onAlt(K,down){K.gunning2=down;},
    muzzle(side,s,c){const ty=Math.atan2(camF.x,camF.z),ts=Math.sin(ty),tc=Math.cos(ty);
      return side?{x:P.pos.x+ts*2.2+tc*side*0.9,y:P.pos.y+2.6,z:P.pos.z+tc*2.2-ts*side*0.9}:{x:P.pos.x+ts*5.2,y:P.pos.y+2.4+camF.y*3,z:P.pos.z+tc*5.2};},
    draw(s,K,isPlayer){const yaw=s.heroYaw||0,R=at(s.pos.x,s.pos.y,s.pos.z,0,yaw,0),sp=conSpin(K);
      for(const sd of [-1,1]){glowQ(child(R,sd*1.6,0.7,0,0,0,0,0.9,1.3,5.6),0.4);for(let i=0;i<5;i++)queue(MESH.glowSphere,child(R,sd*1.62,0.55,-2.2+i*1.1,sp*0.3,0,0,0.45,0.35,0.35),[RING_C[0],RING_C[1],RING_C[2],0.5],F_BL);}
      glowQ(child(R,0,1.55,0,0,0,0,2.9,0.9,5.2),0.45);
      const ty=isPlayer?Math.atan2(camF.x,camF.z)-yaw:0,T=child(R,0,2.25,-0.3,0,ty,0),kick=K&&time-(K.kick||-9)<0.2?-0.6:0,pt=isPlayer?-P.pitch*0.5:0;
      glowQ(child(T,0,0.25,0,0,0,0,2.2,0.8,2.4),0.55);glowQ(child(T,0,0.25,2.3+kick,pt,0,0,0.35,0.35,3.4),0.6);glowQ(child(T,0.9,0.6,0.9,0,0,0,0.2,0.2,1.2),0.6);}},
  heli:{name:'Helicopter',fly:true,hide:true,len:11,unlock:3,cost:7,drain:0.5,speed:1.25,cam:1.6,ext:true,
    attacks:'LMB guns · RMB missiles',blurb:'A hard-light attack helicopter',
    onPrimary(K){K.gunning=true;},
    onAlt(K,down){if(!down||K.cd2>0)return;if(!ringSpend(2)){ringOut();return;}K.cd2=1.2;fireMissiles(2);},
    muzzle(side,s,c){return {x:P.pos.x+s*2.6+c*side*0.9,y:P.pos.y+0.9,z:P.pos.z+c*2.6-s*side*0.9};},
    draw(s,K,isPlayer){const yaw=s.heroYaw||0,pitch=isPlayer&&P.flying?clamp(-P.pitch*0.4,-0.3,0.3):0,R=at(s.pos.x,s.pos.y,s.pos.z,pitch,yaw,(s.bank||0)*0.6);
      glowQ(child(R,0,1.5,0.4,0,0,0,1.8,1.7,3.4),0.45);glowQ(child(R,0,1.6,2.1,0.3,0,0,1.5,1.2,0.6),0.3);glowQ(child(R,0,1.8,-3.4,0,0,0,0.35,0.35,4.8),0.55);
      glowQ(child(R,0,2.5,-5.6,0,0,0,0.12,1.6,0.9),0.55);const rt=time*28;glowQ(child(R,0.25,2.6,-5.7,rt,0,0,0.05,2,0.2),0.6);
      for(const a of [rt,rt+Math.PI/2])glowQ(child(R,0,2.75,0.2,0,a,0,11,0.06,0.45),0.55);glowQ(child(R,0,2.5,0.2,0,0,0,0.3,0.5,0.3),0.6);
      for(const sd of [-1,1]){glowQ(child(R,sd*1.1,0.05,0.3,0,0,0,0.12,0.12,3.4),0.6);glowQ(child(R,sd*0.95,0.45,0.3,0,0,sd*0.3,0.08,0.8,0.08),0.5);}}},
  glider:{name:'Hang Glider',fly:true,rider:0,len:7,unlock:1,cost:1,drain:0.03,speed:0.8,cam:1.3,ext:true,
    attacks:'Glide quietly over the city · Space climbs, C dives',blurb:'Barely any charge to keep in the air',
    onPrimary(){},
    draw(s,K,isPlayer){const yaw=s.heroYaw||0,pitch=isPlayer&&P.flying?clamp(-P.pitch*0.4,-0.4,0.4):0,R=at(s.pos.x,s.pos.y,s.pos.z,pitch,yaw,(s.bank||0)*0.8);
      for(const sd of [-1,1])glowQ(child(R,sd*1.8,3.3,-0.2,0,sd*0.55,0,3.8,0.06,2.4),0.35);glowQ(child(R,0,3.35,0.6,0,0,0,0.12,0.12,3),0.6);
      const top=cp3(R,0,3.3,0.2);for(const sd of [-1,1]){const hand=cp3(R,sd*0.55,1.9,0.5);glowLine(top,hand,0.04);}glowQ(child(R,0,1.9,0.5,0,0,0,1.2,0.05,0.05),0.6);}},
  ufo:{name:'Flying Saucer',fly:true,hide:true,len:11,unlock:6,cost:11,drain:0.7,speed:2.3,cam:1.8,ext:true,
    attacks:'LMB ray guns · RMB tractor beam (throws whatever is below)',blurb:'Abduct cars, people and drones',
    onPrimary(K){K.gunning=true;},
    onAlt(K,down){if(!down||K.cd2>0)return;if(!ringSpend(2)){ringOut();return;}K.cd2=1.4;K.beamT=time;const g=conG(K),R=18*g;let n=0;
      for(const a of actors){if(!a.alive||a===P||a.held||a.kind==='prop'||a.kind==='boss'||a.kind==='remote')continue;const dx=a.pos.x-P.pos.x,dz=a.pos.z-P.pos.z;if(Math.hypot(dx,dz)>R||a.pos.y>P.pos.y)continue;
        n++;if(a.kind==='vehicle'){if(a.net||a===P.car||a.state==='thrown')continue;if(a.driver)ejectDriver(a);a.state='thrown';a.vel.set(rr(-8,8),38,rr(-8,8));a.sx=rr(-3,3);a.sy=rr(-2,2);a.sz=rr(-3,3);a.life=6;a.thrower=P;a.throwDmg=50;}
        else Damage.apply(P,a,20*(1+ringMk()),'ring',{kv:[rr(-6,6),36,rr(-6,6)],flung:true,stun:1.5});}
      SFX.tone('sine',200,1200,0.6,0.1);if(!n)feed('Tractor beam','Nothing below you to lift');},
    muzzle(side,s,c){return {x:P.pos.x+s*3+c*side*3,y:P.pos.y+1.5,z:P.pos.z+c*3-s*side*3};},
    draw(s,K){const x=s.pos.x,y=s.pos.y,z=s.pos.z,G=RING_C;
      queue(MESH.glowSphere,at(x,y+1.6,z,0,time*2,0,5.5,0.8,5.5),[G[0]*0.7,G[1],G[2]*0.8,0.3],F_BL);queue(MESH.glowSphere,at(x,y+2.3,z,0,0,0,1.8,1.3,1.8),[G[0],G[1],G[2],0.25],F_BL);
      queue(MESH.ring,at(x,y+1.6,z,0,time,0,5.6,1,5.6),[G[0],G[1],G[2],0.7],F_ADD);
      for(let i=0;i<8;i++){const a=i/8*TAU+time*2;queue(MESH.glowSphere,at(x+Math.cos(a)*4.6,y+1.4,z+Math.sin(a)*4.6,0,0,0,0.25,0.25,0.25),i%2?[1,1,1,0.9]:[G[0],G[1],G[2],0.9],F_ADD);}
      if(K&&time-(K.beamT||-9)<0.6){const gy=groundY(x,z,y);queue(MESH.cone,coneM(tmpM(),x,y+1,z,x,gy,z,18),[G[0],G[1],G[2],0.18],F_ADD);}}},
  starship:{name:'Starship',fly:true,hide:true,len:18,unlock:7,cost:12,drain:0.8,speed:4.5,cam:2.2,ext:true,
    attacks:'LMB lasers · RMB torpedoes · X warp jump',blurb:'The fastest thing you can build: made for space',
    onPrimary(K){K.gunning=true;},
    onAlt(K,down){if(!down||K.cd2>0)return;if(!ringSpend(3)){ringOut();return;}K.cd2=2;fireMissiles(4);},
    onX(K){if(K.cdx>0)return true;if(!ringSpend(4)){ringOut();return true;}K.cdx=3;P.flying=true;P.vel.set(camF.x*900,camF.y*900,camF.z*900);P.launchT=0.7;flashWhite=Math.max(flashWhite,0.35);SFX.boom(0.8,1.5);addShake(0.4);feed('Warp','');return true;},
    muzzle(side,s,c){return {x:P.pos.x+s*4+c*side*3.2,y:P.pos.y+1.1,z:P.pos.z+c*4-s*side*3.2};},
    draw(s,K,isPlayer){const yaw=s.heroYaw||0,pitch=isPlayer&&P.flying?-P.pitch*0.6:0,R=at(s.pos.x,s.pos.y+1,s.pos.z,pitch,yaw,s.bank||0);
      glowQ(child(R,0,0,1,0,0,0,2.2,1,12),0.4);glowQ(child(R,0,0.6,3,0,0,0,1.2,0.6,3),0.3);glowQ(child(R,0,0,7.4,0,0,0,1,0.6,2),0.45);
      for(const sd of [-1,1]){glowQ(child(R,sd*3.4,-0.1,-1.5,0,sd*0.5,0,6,0.15,3.2),0.4);glowQ(child(R,sd*6,0.4,-2.8,0,0,0,0.3,1.4,2),0.5);
        queue(MESH.glowSphere,child(R,sd*1,0,-5.2,0,0,0,0.8,0.8,1.3),[.7,1,.8,0.7],F_ADD);if(K&&K.cdx>2.5)queue(MESH.glowSphere,child(R,sd*1,0,-9,0,0,0,1,1,6),[1,1,1,0.5],F_ADD);}}},
  // ---- blades & guns ----
  sword:{name:'Giant Sword',weapon:true,len:6,unlock:1,cost:3,drain:0.1,speed:1,ext:true,attacks:'LMB slash · RMB spin attack',blurb:'A blade of light as long as a car',
    onPrimary(K){if(K.cd>0)return;if(!ringSpend(0.6)){ringOut();return;}ringCast();K.cd=0.4;K.slashT=time;K.sd=-(K.sd||1);bladeSweep(K,6,70,30,10);SFX.swish();},
    onAlt(K,down){if(!down||K.cd2>0)return;if(!ringSpend(1.5)){ringOut();return;}K.cd2=1.5;K.spinT=time;P.flip={t:0,dur:0.5,rx:0,ry:TAU};const g=conG(K);
      areaDamage(P.pos.x,P.pos.y+1.3,P.pos.z,8*g,90*(1+ringMk())*Math.sqrt(g),P,{knock:26,type:'slash'});hitProps(P.pos.x,P.pos.y+1,P.pos.z,6*g,P,20);ringFx(P.pos.x,P.pos.y+1.3,P.pos.z,1,8*g,0.3,RING_C);SFX.swish();},
    draw(s,K){const yaw=s.heroYaw||0,sy=Math.sin(yaw),cy=Math.cos(yaw),k=K&&time-(K.slashT||-9)<0.25?(time-K.slashT)/0.25:1,sw=K&&k<1?lerp(-1.3,1.3,k)*(K.sd||1):0.3;
      const R=at(s.pos.x+cy*0.55+sy*0.3,s.pos.y+1.5,s.pos.z-sy*0.55+cy*0.3,-0.2,yaw+sw,0);
      glowQ(child(R,0,0,3,0,0,0,0.1,0.45,5.2),0.6);glowQ(child(R,0,0,0.35,0,0,0,0.9,0.12,0.14),0.7);glowQ(child(R,0,0,-0.1,0,0,0,0.1,0.12,0.6),0.7);
      queue(MESH.glowBox,child(R,0,0,3,0,0,0,0.03,0.2,5.2),[1,1,1,0.8],F_ADD);}},
  warhammer:{name:'War Hammer',weapon:true,len:4,unlock:3,cost:4,drain:0.14,speed:0.95,ext:true,attacks:'LMB smash · RMB ground quake',blurb:'Flatten the street in front of you',
    onPrimary(K){if(K.cd>0)return;if(!ringSpend(1.2)){ringOut();return;}ringCast();K.cd=0.9;K.slashT=time;const g=conG(K),fx=Math.sin(P.heroYaw),fz=Math.cos(P.heroYaw),x=P.pos.x+fx*3*g,z=P.pos.z+fz*3*g,y=groundY(x,z,P.pos.y+3);
      areaDamage(x,y+1,z,5*g,110*(1+ringMk())*strengthMul()*Math.sqrt(g),P,{knock:28,type:'blast'});crater(x,y+0.05,z,0,1,0,Math.min(10,2.5*g),[.42,.41,.4]);SFX.boom(0.7,0.7);addShake(0.4);},
    onAlt(K,down){if(!down||K.cd2>0)return;if(!ringSpend(3)){ringOut();return;}K.cd2=3;K.slashT=time;const g=conG(K),R=16*g;
      ringFx(P.pos.x,P.pos.y+0.3,P.pos.z,1,R,0.6,RING_C);burst(P.pos.x,P.pos.y+0.3,P.pos.z,80,R,0.9,DUST,2.6,-3,2);areaDamage(P.pos.x,P.pos.y+0.8,P.pos.z,R,80*(1+ringMk())*Math.sqrt(g),P,{knock:40,type:'blast'});hitProps(P.pos.x,P.pos.y,P.pos.z,R*0.7,P,26);SFX.boom(1,1.2);addShake(0.8);scare(P.pos.x,P.pos.z,R*2);},
    draw(s,K){const yaw=s.heroYaw||0,sy=Math.sin(yaw),cy=Math.cos(yaw),k=K&&time-(K.slashT||-9)<0.3?(time-K.slashT)/0.3:1,sw=K&&k<1?lerp(-2.2,0.3,k):-1.1;
      const R=at(s.pos.x+cy*0.55,s.pos.y+1.6,s.pos.z-sy*0.55,sw,yaw,0);glowQ(child(R,0,0,1.3,0,0,0,0.12,0.12,2.6),0.6);glowQ(child(R,0,0,2.7,0,0,0,1.5,0.9,0.9),0.55);glowQ(child(R,0,0,2.7,0,0,0,1.6,0.2,1),0.7);}},
  bow:{name:'Longbow',weapon:true,len:2.2,unlock:2,cost:2,drain:0.06,speed:1,ext:true,attacks:'Hold LMB to draw, let go to shoot · RMB three arrows',blurb:'Arrows of light that punch through',
    onPrimary(K){if(K.cd>0)return;K.drawing=true;K.drawT=0;SFX.tone('triangle',200,500,0.8,0.04);},
    onPrimaryUp(K){if(!K.drawing)return;K.drawing=false;const k=clamp(K.drawT/1,0.15,1);if(!ringSpend(0.4+0.8*k)){ringOut();return;}ringCast();K.cd=0.35;
      const o=conMuzzle(0),d=dirTo(o,aim.x,aim.y,aim.z),sp=150+250*k;ringProj(o,d,sp,(40+160*k)*(1+ringMk())*strengthMul(),{knock:6+14*k,big:1+k,r:0.45});SFX.tone('triangle',900,300,0.12,0.08);},
    onAlt(K,down){if(!down||K.cd2>0)return;if(!ringSpend(1.2)){ringOut();return;}ringCast();K.cd2=0.9;const o=conMuzzle(0),d=dirTo(o,aim.x,aim.y,aim.z);
      for(const a of [-0.08,0,0.08]){const c=Math.cos(a),sn=Math.sin(a);ringProj(o,[d[0]*c-d[2]*sn,d[1],d[0]*sn+d[2]*c],220,60*(1+ringMk())*strengthMul(),{knock:8,r:0.4});}SFX.tone('triangle',800,300,0.12,0.08);},
    onTick(K,dt){if(K.drawing)K.drawT+=dt;},
    muzzle(side,s,c,cp,sp){return {x:P.pos.x+c*0.35+s*(0.6+1*cp),y:P.pos.y+1.65-1*sp,z:P.pos.z-s*0.35+c*(0.6+1*cp)};},
    draw(s,K,isPlayer){const yaw=s.heroYaw||0,sy=Math.sin(yaw),cy=Math.cos(yaw),pitch=isPlayer?-P.pitch:0,R=at(s.pos.x+cy*0.35+sy*0.6,s.pos.y+1.65,s.pos.z-sy*0.35+cy*0.6,pitch,yaw,0);
      const dr=K&&K.drawing?clamp(K.drawT,0,1):0;let prev=null;for(let i=0;i<=8;i++){const a=(i/8-0.5)*2.2,p=cp3(R,0,Math.sin(a)*1,Math.cos(a)*0.45-0.3);if(prev)glowLine(prev,p,0.06,0.7);prev=p;}
      const top=cp3(R,0,Math.sin(1.1),Math.cos(1.1)*0.45-0.3),bot=cp3(R,0,-Math.sin(1.1),Math.cos(1.1)*0.45-0.3),nock=cp3(R,0,0,-0.1-dr*0.7);
      queue(MESH.glowBox,M4.beam(tmpM(),top.x,top.y,top.z,nock.x,nock.y,nock.z,0.015),[1,1,1,0.8],F_ADD);queue(MESH.glowBox,M4.beam(tmpM(),bot.x,bot.y,bot.z,nock.x,nock.y,nock.z,0.015),[1,1,1,0.8],F_ADD);
      if(dr>0){const tip=cp3(R,0,0,0.9-dr*0.7);glowLine(nock,tip,0.04,0.8);}}},
  minigun:{name:'Minigun',weapon:true,len:2.4,unlock:4,cost:4,drain:0.15,speed:0.85,ext:true,attacks:'Hold LMB to spin up and fire · RMB flak burst',blurb:'Six spinning barrels of light',
    gun:{rate:0.035,cost:0.05,fire(K){K.spin=(K.spin||0)+1;rifleShot(false);}},
    onPrimary(K){K.gunning=true;},
    onAlt(K,down){if(!down||K.cd2>0)return;if(!ringSpend(1.5)){ringOut();return;}ringCast();K.cd2=1;for(let i=0;i<12;i++)rifleShot(true);addShake(0.2);},
    muzzle(side,s,c,cp,sp){return {x:P.pos.x+c*0.5+s*(0.6+1.6*cp),y:P.pos.y+1.35-1.6*sp,z:P.pos.z-s*0.5+c*(0.6+1.6*cp)};},
    draw(s,K,isPlayer){const yaw=s.heroYaw||0,sy=Math.sin(yaw),cy=Math.cos(yaw),pitch=isPlayer?-P.pitch:0,R=at(s.pos.x+cy*0.5+sy*0.4,s.pos.y+1.35,s.pos.z-sy*0.5+cy*0.4,pitch,yaw,0),rot=K&&K.gunning?time*40:0;
      glowQ(child(R,0,0,0.1,0,0,0,0.45,0.45,0.7),0.55);for(let i=0;i<6;i++){const a=i/6*TAU+rot;glowQ(child(R,Math.cos(a)*0.16,Math.sin(a)*0.16,1,0,0,0,0.07,0.07,1.6),0.6);}
      glowQ(child(R,0,-0.35,-0.1,0,0,0,0.12,0.4,0.15),0.5);if(K&&K.gunning)queue(MESH.glowSphere,child(R,0,0,1.9,0,0,0,0.3,0.3,0.4),[1,1,1,0.8],F_ADD);}},
  towershield:{name:'Tower Shield',weapon:true,block:0.8,len:3,unlock:2,cost:3,drain:0.1,speed:0.9,ext:true,attacks:'Blocks 80% of every hit · LMB bash · RMB shield charge',blurb:'Hide behind a wall of light',
    onPrimary(K){if(K.cd>0)return;if(!ringSpend(0.5)){ringOut();return;}ringCast();K.cd=0.6;K.slashT=time;bladeSweep(K,3.5,50,32,8);},
    onAlt(K,down){if(!down||K.cd2>0)return;if(!ringSpend(1.5)){ringOut();return;}K.cd2=1.3;K.ramT=0.45;P.vel.set(camF.x*55,Math.max(camF.y*55,2),camF.z*55);SFX.whoosh();},
    draw(s,K){const yaw=s.heroYaw||0,sy=Math.sin(yaw),cy=Math.cos(yaw),push=K&&time-(K.slashT||-9)<0.2?0.5:0,R=at(s.pos.x+sy*(1+push),s.pos.y+1.4,s.pos.z+cy*(1+push),0,yaw,0);
      glowQ(child(R,0,0,0,0,0,0,1.6,2.6,0.12),0.35);glowQ(child(R,0,0,0.02,0,0,0,1.7,0.12,0.14),0.7);glowQ(child(R,0,1.25,0.02,0,0,0,1.7,0.12,0.14),0.6);glowQ(child(R,0,-1.25,0.02,0,0,0,1.7,0.12,0.14),0.6);
      queue(MESH.ring,M4.alignY(tmpM(),s.pos.x+sy*(1.08+push),s.pos.y+1.4,s.pos.z+cy*(1.08+push),sy,0,cy,0.5),[RING_C[0],RING_C[1],RING_C[2],0.8],F_ADD);}},
});
CON_PAGES.push(['cycle','chopper','skates','board','monster'],['tank','heli','glider','ufo','starship'],['sword','warhammer','bow','minigun','towershield']);
for(const pg of CON_PAGES)for(const id of pg)if(!CON_IDS.includes(id))CON_IDS.push(id);
