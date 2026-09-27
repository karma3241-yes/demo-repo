// ================================================================
// City life: planes, a blimp, birds, pigeons, boats, fountains and ponds
// ================================================================
// All of it is decoration: nothing here collides, fights or syncs to other players, and everything is only
// updated in detail and drawn when it is near the camera (like the helicopters, a handful of boxes each).
// - Airliners cross high over the city now and then, leaving contrails by day and blinking lights by night.
// - A blimp circles the city; at night its side panels light up.
// - Flocks of gulls circle over the parks and rooftops near you.
// - Pigeons sit on roof edges and park paths nearby and scatter when you come close.
// - Boats cruise the water around you: speedboats, ferries and sailboats, each with a wake.
// - The small parks' fountains spray, pour from the upper bowl and ripple; the ponds ripple and glint.
const LITE=IS_TOUCH_DEVICE;
const planes=[],boats=[],flocks=[],pigeonGroups=[],ripples=[];let planeT=rr(5,15);
const blimp={a:rr(0,TAU),R:560,y:190,x:0,z:0,yaw:0};
const AMB={white:[.93,.94,.96,1],grey:[.72,.74,.78,1],dark:[.2,.22,.26,1],fin:[.18,.34,.7,1],red:[1,.15,.12,1],green:[.2,1,.35,1],strobe:[1,1,1,1],
  gull:[.9,.9,.92,1],gullW:[.78,.8,.84,1],pigeon:[.45,.47,.53,1],pigeonW:[.38,.4,.46,1],silver:[.84,.85,.89,1],stripe:[.78,.14,.18,1],
  curtain:[.72,.88,1,.24],ripple:[.75,.9,1,1],glint:[1,1,.92]};
// ---- airliners ----
function spawnPlane(){const a=rr(0,TAU),R=2400,ta=a+Math.PI+rr(-0.5,0.5),hx=Math.cos(ta),hz=Math.sin(ta);
  planes.push({x:camPos.x+Math.cos(a)*R,y:rr(380,470),z:camPos.z+Math.sin(a)*R,hx,hz,yaw:Math.atan2(hx,hz),spd:rr(75,95),life:0,max:2*R/85+10,trail:0,side:1});}
function updatePlanes(dt){
  planeT-=dt;if(planeT<=0&&planes.length<2){planeT=rr(25,50);spawnPlane();}
  for(let i=planes.length-1;i>=0;i--){const p=planes[i];p.x+=p.hx*p.spd*dt;p.z+=p.hz*p.spd*dt;p.life+=dt;if(p.life>p.max){planes.splice(i,1);continue;}
    p.trail-=dt;if(p.trail<=0&&env.night<0.5&&Math.hypot(p.x-camPos.x,p.z-camPos.z)<1600){p.trail=0.1;p.side=-p.side;
      const c=Math.cos(p.yaw),s=Math.sin(p.yaw),ox=p.side*7,oz=-2;SMOKE.emit(p.x+ox*c+oz*s,p.y-1.4,p.z-ox*s+oz*c,0,0,0,6,[.95,.95,.97],rr(5,8),0,0.2);}}
}
function drawPlanes(){
  for(const p of planes){if(inView(p.x,p.z,3200,400)<0)continue;const root=at(p.x,p.y,p.z,0,p.yaw,0);
    queue(MESH.sphere,child(root,0,0,0,0,0,0,2,2,19),AMB.white,0);
    queue(MESH.box,child(root,0,-0.5,1,0,0,0,32,0.5,5),AMB.grey,0);
    queue(MESH.box,child(root,0,0.4,-16,0,0,0,11,0.4,3),AMB.grey,0);queue(MESH.box,child(root,0,3.3,-16.5,0,0,0,0.5,6,4),AMB.fin,0);
    for(const sx of [-7,7])queue(MESH.cyl,child(root,sx,-1.5,2.5,Math.PI/2,0,0,0.9,4,0.9),AMB.dark,0);
    const on=Math.sin(time*6+p.x)>0.6;
    queue(MESH.glowBox,child(root,-16,-0.4,1,0,0,0,0.5,0.5,0.5),AMB.red,0);queue(MESH.glowBox,child(root,16,-0.4,1,0,0,0,0.5,0.5,0.5),AMB.green,0);
    if(on)queue(MESH.glowBox,child(root,0,0.6,-18.5,0,0,0,0.6,0.6,0.6),AMB.strobe,0);}
}
// ---- the blimp ----
function updateBlimp(dt){const b=blimp;b.a+=dt*11/b.R;b.x=Math.cos(b.a)*b.R;b.z=Math.sin(b.a)*b.R;b.yaw=Math.atan2(-Math.sin(b.a),Math.cos(b.a));}
function drawBlimp(){const b=blimp;if(inView(b.x,b.z,2600,300)<0)return;const y=b.y+Math.sin(time*0.4)*2,root=at(b.x,y,b.z,0,b.yaw,Math.sin(time*0.3)*0.03);
  queue(MESH.sphere,child(root,0,0,0,0,0,0,8,8,26),AMB.silver,0);queue(MESH.sphere,child(root,0,0,0,0,0,0,8.1,2.2,24),AMB.stripe,0);
  queue(MESH.box,child(root,0,-8.4,2,0,0,0,2.6,2,8),AMB.dark,0);
  queue(MESH.box,child(root,0,5,-21,0,0,0,0.4,6,6),AMB.stripe,0);queue(MESH.box,child(root,0,-5,-21,0,0,0,0.4,6,6),AMB.stripe,0);
  queue(MESH.box,child(root,5,0,-21,0,0,0,6,0.4,6),AMB.stripe,0);queue(MESH.box,child(root,-5,0,-21,0,0,0,6,0.4,6),AMB.stripe,0);
  if(env.night>0.3){const h=(time*0.1)%1,c=[0.5+0.5*Math.sin(h*TAU),0.5+0.5*Math.sin(h*TAU+2),0.5+0.5*Math.sin(h*TAU+4),env.night];
    queue(MESH.glowBox,child(root,8.05,0,2,0,0,0,0.1,3,12),c,0);queue(MESH.glowBox,child(root,-8.05,0,2,0,0,0,0.1,3,12),c,0);}
  if(Math.sin(time*3)>0.7)queue(MESH.glowBox,child(root,0,-9.6,2,0,0,0,0.4,0.4,0.4),AMB.red,0);
}
// ---- gulls circling over the parks and rooftops near you ----
function homeFlock(f){const pk=parks.filter(p=>Math.hypot(p.cx-P.pos.x,p.cz-P.pos.z)<350);
  if(pk.length&&Math.random()<0.6){const p=pick(pk);f.hx=p.cx;f.hz=p.cz;}else{const a=rr(0,TAU),d=rr(100,280);f.hx=P.pos.x+Math.cos(a)*d;f.hz=P.pos.z+Math.sin(a)*d;}
  f.hy=Math.max(groundY(f.hx,f.hz)+rr(25,45),rr(35,80));f.R=rr(18,40);}
for(let i=0;i<(LITE?2:3);i++)flocks.push({hx:1e9,hz:1e9,hy:50,R:30,ph:rr(0,TAU),w:rr(0.25,0.4)*(i%2?1:-1),n:7+i*2});
function updateFlocks(dt){for(const f of flocks){f.ph+=f.w*dt;if(Math.hypot(f.hx-P.pos.x,f.hz-P.pos.z)>450)homeFlock(f);}}
function drawBird(x,y,z,yaw,flap,s,body,wing){const root=at(x,y,z,0,yaw,0);
  queue(MESH.box,child(root,0,0,0,0,0,0,0.3*s,0.25*s,0.9*s),body,0);
  queue(MESH.box,child(child(root,0,0.05*s,0,0,0,flap),0.6*s,0,0,0,0,0,1.2*s,0.05*s,0.4*s),wing,0);
  queue(MESH.box,child(child(root,0,0.05*s,0,0,0,-flap),-0.6*s,0,0,0,0,0,1.2*s,0.05*s,0.4*s),wing,0);}
function drawFlocks(){
  for(const f of flocks){const cx=f.hx+Math.cos(f.ph)*f.R,cz=f.hz+Math.sin(f.ph)*f.R;if(inView(cx,cz,320,60)<0)continue;
    const d=Math.sign(f.w),tx=-Math.sin(f.ph)*d,tz=Math.cos(f.ph)*d,yaw=Math.atan2(tx,tz);
    for(let j=0;j<f.n;j++){const ox=Math.sin(time*0.7+j*1.7)*5,oy=Math.sin(time*0.9+j)*1.8,oz=Math.cos(time*0.6+j*2.3)*5,glide=Math.sin(time*0.5+j)>0.3;
      drawBird(cx+ox,f.hy+oy,cz+oz,yaw-d*0.35,glide?0.1:Math.sin(time*11+j*2)*0.6,1.3,AMB.gull,AMB.gullW);}}
}
// ---- pigeons: they sit on a roof edge or a park path near you, and scatter when you come close ----
function pigeonSpot(g){
  const px=P.pos.x,pz=P.pos.z,opts=[];
  for(const p of parks){const d=Math.hypot(p.cx-px,p.cz-pz);if(d>30&&d<200)opts.push({x:p.cx+rr(-20,20),z:p.cz+(Math.random()<0.5?-1:1)*rr(6,20),y:0.45});}
  for(const r of roofTops){if(r.y>90||r.x1-r.x0<8||r.z1-r.z0<8)continue;const d=Math.hypot(r.x-px,r.z-pz);if(d<30||d>170)continue;
    if(opts.length<60||Math.random()<0.2)opts.push({x:rr(r.x0+2,r.x1-2),z:Math.random()<0.5?r.z0+0.8:r.z1-0.8,y:r.y});}
  if(!opts.length){g.state='gone';g.t=-5;return;}
  const s=pick(opts);g.x=s.x;g.y=s.y;g.z=s.z;g.state='sit';g.t=0;
  g.birds=[];for(let i=0;i<(LITE?4:6);i++)g.birds.push({x:s.x+rr(-2.5,2.5),y:s.y,z:s.z+rr(-0.5,0.5),yaw:rr(0,TAU),vx:0,vy:0,vz:0,ph:rr(0,TAU)});
}
for(let i=0;i<2;i++)pigeonGroups.push({state:'gone',t:-rr(1,4),x:0,y:0,z:0,birds:[]});
function scatterPigeons(g){g.state='fly';g.t=0;SFX.tone('triangle',900,1400,0.12,0.03*SFX.vol(g.x,g.y,g.z));
  for(const b of g.birds){const a=Math.atan2(b.z-P.pos.z,b.x-P.pos.x)+rr(-0.8,0.8),s=rr(5,9);b.vx=Math.cos(a)*s;b.vz=Math.sin(a)*s;b.vy=rr(3,6);b.yaw=Math.atan2(b.vx,b.vz);}}
function updatePigeons(dt){
  for(const g of pigeonGroups){g.t+=dt;
    if(g.state==='gone'){if(g.t>0&&state==='play')pigeonSpot(g);continue;}
    const d=Math.hypot(g.x-P.pos.x,g.z-P.pos.z);
    if(g.state==='sit'){if(d>260){g.state='gone';g.t=-2;continue;}
      if(state==='play'&&(Math.hypot(d,g.y-P.pos.y)<11||(d<30&&P.vel.len()>30)))scatterPigeons(g);}
    else{for(const b of g.birds){b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.vy=Math.min(b.vy+2*dt,8);}if(g.t>8){g.state='gone';g.t=-rr(4,10);}}}
}
function drawPigeons(){
  for(const g of pigeonGroups){if(g.state==='gone'||inView(g.x,g.z,160,20)<0)continue;
    for(const b of g.birds){
      if(g.state==='sit'){const peck=Math.max(0,Math.sin(time*3+b.ph*5))*0.5,root=at(b.x,b.y+0.18,b.z,0,b.yaw+Math.sin(time*0.5+b.ph)*0.4,0);
        queue(MESH.box,child(root,0,0,0,0,0,0,0.22,0.22,0.4),AMB.pigeon,0);queue(MESH.box,child(root,0,0.12,0.2,peck,0,0,0.13,0.13,0.16),AMB.pigeonW,0);}
      else drawBird(b.x,b.y+0.2,b.z,b.yaw,Math.sin(time*18+b.ph)*0.8,0.55,AMB.pigeon,AMB.pigeonW);}}
}
// ---- boats on the water near you ----
const BOATS=[{L:8,W:2.6,spd:15,hull:[.95,.95,.97,1],cab:[.18,.28,.45,1]},{L:24,W:7,spd:6,hull:[.96,.78,.18,1],cab:[.95,.95,.95,1],ferry:true},{L:10,W:3,spd:5,hull:[.9,.9,.92,1],cab:[.55,.35,.22,1],sail:true}];
const openWater=(x,z)=>!onIsland(x,z)&&!onIsland(x+18,z)&&!onIsland(x-18,z)&&!onIsland(x,z+18)&&!onIsland(x,z-18);
function spawnBoat(b){
  for(let k=0;k<14;k++){const a=rr(0,TAU),d=rr(140,420),x=P.pos.x+Math.cos(a)*d,z=P.pos.z+Math.sin(a)*d;if(!openWater(x,z))continue;
    Object.assign(b,{x,z,yaw:rr(0,TAU),kind:BOATS[Math.floor(Math.random()*3)],turn:0,seed:rr(0,9),on:true});return;}
  b.on=false;
}
for(let i=0;i<(LITE?3:5);i++)boats.push({on:false,wait:rr(0,3)});
function updateBoats(dt){
  for(const b of boats){
    if(!b.on){b.wait-=dt;if(b.wait<=0){b.wait=4;spawnBoat(b);}continue;}
    if(Math.hypot(b.x-P.pos.x,b.z-P.pos.z)>650){b.on=false;b.wait=rr(1,4);continue;}
    const K=b.kind,s=Math.sin(b.yaw),c=Math.cos(b.yaw);
    if(onIsland(b.x+s*30,b.z+c*30)||onIsland(b.x+s*15,b.z+c*15)){if(!b.turn)b.turn=onIsland(b.x+Math.sin(b.yaw+0.8)*30,b.z+Math.cos(b.yaw+0.8)*30)?-1:1;b.yaw+=b.turn*0.9*dt;}
    else{b.turn=0;b.yaw+=Math.sin(time*0.1+b.seed)*0.05*dt;}
    const v=onIsland(b.x+s*8,b.z+c*8)?0:K.spd;b.x+=s*v*dt;b.z+=c*v*dt;
    if(v>0&&Math.random()<dt*20&&inView(b.x,b.z,260,30)>=0)emit(b.x-s*K.L*0.5+rr(-1,1),SEA_Y+0.2,b.z-c*K.L*0.5+rr(-1,1),-s*rr(1,3)+rr(-1.5,1.5),rr(0.5,2),-c*rr(1,3)+rr(-1.5,1.5),rr(0.8,1.6),WATER[(Math.random()*2)|0],rr(0.6,1.2)*(K.ferry?1.8:1),6,1);}
}
function drawBoats(){
  for(const b of boats){if(!b.on)continue;const q=inView(b.x,b.z,700,40);if(q<0)continue;const K=b.kind,fl=q<150*150?F_SH:0;
    const root=at(b.x,SEA_Y+0.15+Math.sin(time*1.3+b.seed)*0.12,b.z,Math.sin(time*0.9+b.seed)*0.03,b.yaw,Math.sin(time*1.1+b.seed)*0.04);
    queue(MESH.box,child(root,0,0.5,-K.W*0.3,0,0,0,K.W,1.3,K.L-K.W*0.6),K.hull,fl);
    queue(MESH.box,child(root,0,0.5,K.L*0.5-K.W*0.5,0,Math.PI/4,0,K.W*0.707,1.3,K.W*0.707),K.hull,fl);
    if(K.ferry){queue(MESH.box,child(root,0,2.2,-2,0,0,0,K.W*0.8,2.2,K.L*0.6),K.cab,fl);queue(MESH.box,child(root,0,4.2,-3,0,0,0,K.W*0.6,1.8,K.L*0.35),K.cab,fl);
      queue(MESH.box,child(root,0,5.6,-6,0,0,0,1.2,1.5,1.2),AMB.dark,fl);}
    else if(K.sail){queue(MESH.cyl,child(root,0,6,0.5,0,0,0,0.12,10,0.12),AMB.dark,fl);queue(MESH.roof,child(root,0,6.4,-1.3,0,0,0,0.06,8.6,3.6),AMB.white,fl);
      queue(MESH.box,child(root,0,1.5,-2.8,0,0,0,K.W*0.6,0.8,2.6),K.cab,fl);}
    else queue(MESH.box,child(root,0,1.5,-0.8,0,0,0,K.W*0.8,0.9,2.6),K.cab,fl);
    if(env.night>0.4){queue(MESH.glowBox,child(root,0,K.ferry?6.6:K.sail?11:2.4,0,0,0,0,0.3,0.3,0.3),AMB.strobe,0);}}
}
// ---- the small parks' fountains and the ponds ----
function updateWaterLife(dt){
  for(const f of fountainSpots){if(inView(f.x,f.z,110,20)<0)continue;
    f.acc=(f.acc||0)+dt*(LITE?50:90);while(f.acc>=1){f.acc--;
      if(Math.random()<0.55)emit(f.x+rr(-.1,.1),4.8,f.z+rr(-.1,.1),rr(-1.1,1.1),rr(6,8.5),rr(-1.1,1.1),rr(0.9,1.2),WATER[(Math.random()*2)|0],rr(0.4,0.8),22,0.2); // the spout
      else{const a=Math.floor(rr(0,8))/8*TAU+time*0.05,cx=Math.cos(a),cz=Math.sin(a);                                                   // eight jets from the lip
        emit(f.x+cx*5.2,1.5,f.z+cz*5.2,-cx*rr(2.6,3.2),rr(5.5,6.5),-cz*rr(2.6,3.2),rr(0.8,1),WATER[(Math.random()*2)|0],rr(0.35,0.6),22,0.1);}}}
  for(const l of lakes){if(inView(l.x,l.z,300,l.r+10)<0)continue;
    if(ripples.length<(LITE?16:36)&&Math.random()<dt*l.r*0.12){const a=rr(0,TAU),r=lakeR(l,a)*Math.sqrt(Math.random())*0.85;ripples.push({x:l.x+Math.cos(a)*r,z:l.z+Math.sin(a)*r,t:0,dur:rr(2,3.2),r:rr(2,4)});}
    if(env.night<0.5&&Math.random()<dt*l.r*0.25){const a=rr(0,TAU),r=lakeR(l,a)*Math.sqrt(Math.random())*0.9;emit(l.x+Math.cos(a)*r,0.5,l.z+Math.sin(a)*r,0,0.2,0,rr(0.25,0.45),AMB.glint,rr(0.2,0.4),0,0);}}
  for(let i=ripples.length-1;i>=0;i--){const r=ripples[i];r.t+=dt;if(r.t>r.dur)ripples.splice(i,1);}
}
function drawWaterLife(){
  for(const f of fountainSpots){if(inView(f.x,f.z,110,20)<0)continue;
    queue(MESH.tube,at(f.x,2.47,f.z,0,time*0.4,0,1.72,2.3,1.72),[AMB.curtain[0],AMB.curtain[1],AMB.curtain[2],AMB.curtain[3]+Math.sin(time*7+f.x)*0.05],F_BL);
    for(let k=0;k<2;k++){const u=((time*0.7+k*0.5)%1),r=1+u*4;queue(MESH.ring,M4.alignY(tmpM(),f.x,1.275,f.z,0,1,0,r),[.8,.95,1,0.3*(1-u)],F_ADD);}}
  for(const r of ripples){const k=r.t/r.dur;queue(MESH.ring,M4.alignY(tmpM(),r.x,0.48,r.z,0,1,0,0.3+k*r.r),[AMB.ripple[0],AMB.ripple[1],AMB.ripple[2],0.35*(1-k)],F_ADD);}
}
function updateAmbient(dt){if(!cityVisible())return;updatePlanes(dt);updateBlimp(dt);updateFlocks(dt);updatePigeons(dt);updateBoats(dt);updateWaterLife(dt);}
function drawAmbient(){if(!cityVisible())return;drawPlanes();drawBlimp();drawFlocks();drawPigeons();drawBoats();drawWaterLife();}
