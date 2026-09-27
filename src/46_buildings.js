// ================================================================
// Destructible buildings
// ================================================================
// Every tower, house and warehouse has hit points. Bodies launched into walls, charged
// punches, flying into a building at speed, explosions and heavy slams wear it down.
// At zero it collapses: it leans away from the hit and sinks into a cloud of dust and
// falling chunks, leaving rubble. A couple of minutes later it grows back.
// The bank, hospital and police headquarters are landmarks and never fall.
const BLD={fallTime:3.4,growTime:5,regrow:[100,150],maxHp:6000};
const cityPos0=new Float32Array(city.pos);
const bldActive=new Set();
for(const b of bldgs)b.maxHp=b.hp=Math.min(BLD.maxHp,b.maxHp);
function bldOf(c){return c&&c.bld?c.bld:null;}
function damageBuilding(b,amount,x,y,z,dx=0,dz=0){
  if(!b||b.state!=='up'||!(amount>0))return false;
  b.hp-=amount;b.lastHit=time;
  if(b.hp>0)return false;
  collapseBuilding(b,dx,dz,true);return true;
}
function collapseBuilding(b,dx,dz,broadcast){
  if(b.state!=='up')return;
  const l=Math.hypot(dx,dz);b.tx=l>0.01?dx/l:rr(-1,1);b.tz=l>0.01?dz/l:rr(-1,1);
  b.state='fall';b.t=0;b.hp=0;b.regrowAt=time+rr(BLD.regrow[0],BLD.regrow[1]);for(const c of b.cols)c.dead=true;bldActive.add(b);
  const inside=(o)=>o.x>b.x0-1&&o.x<b.x1+1&&o.z>b.z0-1&&o.z<b.z1+1;
  for(let i=windows.length-1;i>=0;i--)if(inside(windows[i]))windows.splice(i,1);
  for(let i=scorches.length-1;i>=0;i--)if(inside(scorches[i])&&scorches[i].y>0.5)scorches.splice(i,1);
  const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2,v=SFX.vol(cx,Math.min(b.h,40),cz);
  SFX.boom(Math.min(1,v*1.2),0.5);SFX.crash(v);later(0.4,()=>SFX.boom(v*0.8,0.4));later(1.1,()=>SFX.crash(v*0.8));
  addShake(Math.min(1.2,0.3+b.h/150)*v);scare(cx,cz,90);
  if(broadcast)WS.destroyed('bc',{id:b.id,dx:b.tx,dz:b.tz});
  if(state==='play'&&Math.hypot(cx-P.pos.x,cz-P.pos.z)<250)feed('Building down',b.h>80?'A tower just came down':'That one is not getting back up (for a while)');
}
function writeBldVerts(b){
  const n=b.v1-b.v0;if(n<=0)return;const buf=b.buf||(b.buf=new Float32Array(n*3)),s0=b.v0*3;
  const lean=b.tilt,base=0.25;
  for(let i=0;i<n;i++){const k=s0+i*3,x=cityPos0[k],y=cityPos0[k+1],z=cityPos0[k+2],hy=Math.max(0,y-base);
    buf[i*3]=x+b.tx*hy*lean;buf[i*3+1]=y+b.off-hy*lean*lean*0.5;buf[i*3+2]=z+b.tz*hy*lean;}
  gl.bindBuffer(gl.ARRAY_BUFFER,cityMesh.bufs[0]);gl.bufferSubData(gl.ARRAY_BUFFER,s0*4,buf);
}
function playersNear(x,z,r){if(Math.hypot(P.pos.x-x,P.pos.z-z)<r)return true;for(const q of MP.peers.values())if(Math.hypot(q.pos.x-x,q.pos.z-z)<r)return true;return false;}
function updateBuildings(dt){
  for(const b of bldActive){
    const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2,w=b.x1-b.x0,d=b.z1-b.z0,near=Math.hypot(cx-camPos.x,cz-camPos.z)<700;
    if(b.state==='fall'){b.t+=dt;const k=Math.min(1,b.t/BLD.fallTime),e=k*k;b.off=-(b.h+6)*e;b.tilt=Math.min(0.35,k*0.35)*(b.h>30?1:0.4);writeBldVerts(b);
      const top=Math.max(0,b.h+b.off);
      if(near){const n=Math.min(6,Math.ceil(w*d/300));
        for(let i=0;i<n;i++){const x=rr(b.x0,b.x1),z=rr(b.z0,b.z1),y=rr(0,top)+2,s=rr(1.2,3.8);
          if(Math.random()<0.5)spawnPiece(x+b.tx*top*b.tilt,y,z+b.tz*top*b.tilt,MESH.box,s,s*rr(0.4,1),s,b.col.map(c=>c*rr(0.7,1)),rr(-8,8)+b.tx*6,rr(-2,6),rr(-8,8)+b.tz*6,8);
          smoke(x,Math.min(top,25)*Math.random()+1,z,1,4,10+Math.random()*8,4,0.3);}
        if(Math.random()<0.5)burst(rr(b.x0,b.x1),top,rr(b.z0,b.z1),20,14,0.7,GLASSC,1,18,0.5);
        if(Math.random()<0.3)smoke(cx+rr(-w,w)*0.7,1,cz+rr(-d,d)*0.7,2,w*0.4,16,6,0.28);
        if(Math.random()<dt*6)addShake(0.12*SFX.vol(cx,1,cz));}
      if(k>=1){b.state='down';b.t=0;b.tilt=0;b.off=-(b.h+30);writeBldVerts(b);
        b.rubble=[];const m=Math.min(28,Math.ceil(w*d/60));for(let i=0;i<m;i++){const s=rr(2,Math.min(7,Math.max(w,d)*0.25));
          b.rubble.push({x:rr(b.x0+s/2,b.x1-s/2),y:rr(0.2,Math.min(6,b.h*0.08))*0.5+s*0.3,z:rr(b.z0+s/2,b.z1-s/2),rx:rr(-0.5,0.5),ry:rr(0,TAU),rz:rr(-0.5,0.5),sx:s,sy:s*rr(0.35,0.7),sz:s*rr(0.6,1.1),k:rr(0.55,0.9)});}
        for(let i=0;i<6;i++)smoke(cx+rr(-w,w)*0.5,2,cz+rr(-d,d)*0.5,3,w*0.5,22,9,0.3);}}
    else if(b.state==='down'){b.t+=dt;if(near&&Math.random()<dt*1.5)smoke(rr(b.x0,b.x1),1,rr(b.z0,b.z1),1,3,8,5,0.22);
      if(time>=b.regrowAt){if(playersNear(cx,cz,Math.max(w,d)*0.5+25))b.regrowAt=time+10;else{b.state='grow';b.t=0;}}}
    else if(b.state==='ring'){ // rebuilt by the ring: a green hard-light copy rises first, then the real building fills it
      b.t+=dt;const t=b.t-b.ringDelay;if(t<0)continue;
      if(t>=RING_BUILD.ghost){const k=Math.min(1,(t-RING_BUILD.ghost)/RING_BUILD.fill),e=k*k*(3-2*k);b.off=b.ringOff*(1-e);writeBldVerts(b);
        if(near&&Math.random()<0.6)emit(rr(b.x0,b.x1),rr(0,b.h),rr(b.z0,b.z1),0,rr(2,6),0,0.6,RING_C,1.4,0,0);
        if(k>=1){b.state='up';b.off=0;b.hp=b.maxHp;b.rubble=null;writeBldVerts(b);for(const c of b.cols)c.dead=false;bldActive.delete(b);if(near)ringFx(cx,1,cz,1,Math.max(w,d),0.4,RING_C);}}
      else if(b.rubble&&Math.random()<dt*8)b.rubble.pop();}
    else if(b.state==='grow'){b.t+=dt;const k=Math.min(1,b.t/BLD.growTime),e=k*k*(3-2*k);b.off=-(b.h+30)*(1-e);b.tilt=0;writeBldVerts(b);
      if(near&&Math.random()<0.4)smoke(rr(b.x0,b.x1),1,rr(b.z0,b.z1),1,2,6,3,0.25);
      if(k>=1){b.state='up';b.off=0;b.hp=b.maxHp;b.rubble=null;writeBldVerts(b);for(const c of b.cols)c.dead=false;bldActive.delete(b);}}
  }
}
// the Ring Bearer rebuilds every broken building at once (Y): 10 ring charge
const RING_BUILD={ghost:0.9,fill:0.8,cost:10};
function ringRebuild(){
  if(!isRing()||!canAct())return false;if(ringLocked()){oathBusy();return true;}const list=bldgs.filter(b=>b.state!=='up'&&b.state!=='ring');
  if(!list.length){feed('Nothing to rebuild','Every building in the city is standing');return true;}
  if(save.ring<RING_BUILD.cost){ringOut();return true;}save.ring-=RING_BUILD.cost;
  for(const b of list){const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2;b.state='ring';b.t=0;b.tilt=0;b.ringDelay=Math.min(1.5,Math.hypot(cx-P.pos.x,cz-P.pos.z)/900);
    b.off=b.off||-(b.h+30);if(b.off>-(b.h+2))b.off=-(b.h+30);b.ringOff=b.off;writeBldVerts(b);bldActive.add(b);}
  ringCast();const c=center(P);ringFx(c.x,c.y,c.z,1,60,0.8,RING_C);burst(c.x,c.y,c.z,80,20,1,[RING_C,[1,1,1]],1.6,0,2);flashWhite=Math.max(flashWhite,0.25);SFX.transform();
  toast('The city rebuilt','Your ring puts back '+list.length+' building'+(list.length>1?'s':''),'cyan');addMastery('powerRing',10);return true;
}
function drawRubble(){
  for(const b of bldActive){if(b.state==='ring'){const t=b.t-b.ringDelay;if(t<0)continue;const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2;if(inView(cx,cz,1200,80)<0)continue;
      const up=clamp(t/RING_BUILD.ghost,0,1),fade=t>RING_BUILD.ghost?1-clamp((t-RING_BUILD.ghost)/RING_BUILD.fill,0,1):1,a=0.32*fade+0.05;
      for(const c of b.cols){const h=(c.y1-c.y0)*up,w=c.x1-c.x0,d=c.z1-c.z0,x=(c.x0+c.x1)/2,z=(c.z0+c.z1)/2;if(h<0.05)continue;
        queue(MESH.glowBox,at(x,c.y0+h/2,z,0,0,0,w+0.3,h,d+0.3),[RING_C[0]*0.7,RING_C[1],RING_C[2]*0.8,a],F_BL);
        queue(MESH.glowBox,at(x,c.y0+h,z,0,0,0,w+0.5,0.25,d+0.5),[RING_C[0],RING_C[1],RING_C[2],0.8*fade],F_ADD);}}
    if(!b.rubble)continue;const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2;const q=inView(cx,cz,600,60);if(q<0)continue;
    const sink=b.state==='grow'?Math.min(1,b.t/BLD.growTime):0;
    for(const r of b.rubble)queue(MESH.box,at(r.x,r.y-sink*8,r.z,r.rx,r.ry,r.rz,r.sx,r.sy,r.sz),[b.col[0]*r.k,b.col[1]*r.k,b.col[2]*r.k,1],q<250*250?F_SH:0);}
}
