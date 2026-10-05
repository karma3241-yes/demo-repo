// ================================================================
// Zones: separate playable areas far from the city (the UFO interior now; the Kathana arena, the cyber world and the tower later)
// ================================================================
// The city is one fixed world, so every other place is a ZONE: a box-built area parked far away (the UFO at z=6000), entered with a fade.
//   ZONES[id]={id,name,origin:{x,y,z},spawn:{x,y,z,yaw},build(),cols:[],mesh,mesh2,draw(),update(dt),enter(),leave(),rebuild(),mapMarks(plot,c),
//              sky:[r,g,b],stars:bool,smash:bool,bounds:{x0,x1,z0,z1,y1},light:{dir,lcol,sky,gnd,fogC,fog:[near,far]},lights:[{x,y,z,r,c:[r,g,b]}],plan:[[x0,x1,z0,z1]]}
//   zone = the current zone object or null (zone.id is its id). enterZone(id,at): fade out, teleport the player to origin+at ({x,y,z,yaw}, local coordinates), set zone,
//   fade in. leaveZone(to): fade out, zone=null, teleport the player to the city point `to` ({x,y,z,yaw,fly}, default: where they entered from), fade in.
// While a zone is set: the city isn't drawn (cityVisible, the ocean and the shadow pass are skipped); the city's people, traffic, crimes, rivals, hunters, helis and
// ambient life are FROZEN, not despawned (updateWorld returns early, see 50_npcs.js): the cheapest safe way, and they pick up exactly where they were when you return;
// the minimap shows the zone's plan and name, crime pins are off, and lock-on only sees actors with actor.zid===zone.id. Collisions use the zone's boxes
// ({x0,x1,y0,y1,z0,z1,col}, absolute coordinates) through nearCols / rayCity, so collideBody, groundY, inBuilding and every ray work unchanged. The floor is y=origin.y
// (baseY / onIsland answer for the zone: no swimming, no drowning) and zones sit at y=0, so the space logic (y > 900) never fires.
// Fast flight smashes walls: in a zone with smash:true, while the player moves faster than 35 m/s, boxes flagged smash:true don't block; the ones the player
// bursts through break (debris and a thud, no damage) and are removed for the rest of the visit (box.dead; the zone's rebuild() redraws without them).
// Big zones (the cyber world, 3 km): Z.gofs / Z.gw size the lookup grid (zkey), Z.regions ({mesh,x0,x1,z0,z1,y0,y1}) replace Z.mesh and are drawn only near the camera
// (zoneDrawRegions), rays walk the grid (zoneRay), Z.speed multiplies player speed, Z.skyU(uniforms) paints a custom sky, Z.planDraw(ctx) / Z.mapS shape the minimap.
// Builders: zoneBox adds a box to a zone's mesh and (unless col:false) its colliders; zoneBake bakes the mesh and the lookup grid.
const ZONE_FADE=0.55,ZF={phase:0,t:0,fn:null,after:null}; // phase 1: fading to black, 2: fading back in
let zoneRet=null;
const ZS={on:false,px:0,py:0,pz:0};
function zoneFade(fn,after){if(ZF.phase)return false;ZF.phase=1;ZF.t=0;ZF.fn=fn;ZF.after=after||null;return true;}
function zoneFadeTick(dt){
  if(!ZF.phase)return;const f=$('fade');ZF.t+=dt;
  if(ZF.phase===1){f.style.opacity=clamp(ZF.t/ZONE_FADE,0,1).toFixed(3);
    if(ZF.t>=ZONE_FADE){f.style.opacity='1';const fn=ZF.fn;ZF.fn=null;ZF.phase=2;ZF.t=0;if(fn){try{fn();}catch(e){logErr(e);}}}}
  else{f.style.opacity=clamp(1-ZF.t/ZONE_FADE,0,1).toFixed(3);
    if(ZF.t>=ZONE_FADE){f.style.opacity='0';ZF.phase=0;const cb=ZF.after;ZF.after=null;if(cb){try{cb();}catch(e){logErr(e);}}}}
}
function enterZone(id,at,after){
  const Z=ZONES[id];if(!Z||zone||ZF.phase||state!=='play')return false;
  return zoneFade(()=>zoneSwitch(Z,at),after);
}
function zoneSwitch(Z,at){
  zoneRet=Math.hypot(P.pos.x,P.pos.z)>1600||P.pos.y>2000||P.pos.y<-20?{x:SPAWNS[0][0],y:0,z:SPAWNS[0][1],yaw:SPAWNS[0][2],fly:false}:{x:P.pos.x,y:P.pos.y,z:P.pos.z,yaw:P.yaw,fly:P.flying}; // (from far away, like the end of a light-speed jump, the way back is the hospital)
  if(P.car)exitCar(true);
  stopAllPowers();lockT=null;comboN=0;
  if(!Z.built){Z.built=true;Z.build();}
  zone=Z;const a=at||Z.spawn||{x:0,y:0,z:0},o=Z.origin;
  P.pos.set(o.x+a.x,o.y+(a.y||0),o.z+a.z);P.vel.set(0,0,0);if(a.yaw!==undefined)P.yaw=a.yaw;P.pitch=-0.1;P.grounded=true;P.floatT=0;P.web=null;P.reel=null;P.wall=null;
  camDist=8;projs.length=0;debris.length=0;tracers.length=0;
  if(Z.enter)try{Z.enter();}catch(e){logErr(e);}
}
function leaveZone(to,after){
  if(!zone||ZF.phase)return false;
  return zoneFade(()=>zoneExit(to),after);
}
function zoneExit(to){
  const Z=zone;if(!Z)return;stopAllPowers();lockT=null;comboN=0;
  if(Z.leave)try{Z.leave();}catch(e){logErr(e);}
  zone=null;const r=to||zoneRet||{x:SPAWNS[0][0],y:0,z:SPAWNS[0][1],yaw:SPAWNS[0][2]};zoneRet=null;
  P.pos.set(r.x,r.y,r.z);P.vel.set(0,0,0);if(r.yaw!==undefined)P.yaw=r.yaw;P.pitch=-0.1;P.flying=!!r.fly;P.grounded=!r.fly;P.floatT=0;camDist=8;projs.length=0;debris.length=0;tracers.length=0;
}
// from one zone straight into another (the cyber world <-> the Apex Spire): fade out, leave the first zone, switch to the second, fade in
function zoneHop(id,at,after){
  const Z=ZONES[id];if(!zone||!Z||ZF.phase||state!=='play')return false;
  return zoneFade(()=>{const Z0=zone;if(Z0&&Z0.leave)try{Z0.leave();}catch(e){logErr(e);}zone=null;zoneSwitch(Z,at);},after);
}
function zoneAbort(){ // straight out, no fade: dying inside a zone, or a multiplayer room opening
  if(!zone)return;ZF.phase=0;ZF.fn=null;ZF.after=null;ZF.t=0;$('fade').style.opacity='0';zoneExit();
}
// ---- building a zone ----
const ZGC=12; // lookup grid cell (m): boxes are listed in every cell within 6 m of them. A big zone (the cyber world) sets Z.gofs (local offset, default 512) and Z.gw (cells per row, default 400)
const zkey=(Z,x,z)=>Math.floor((x-Z.origin.x+(Z.gofs||512))/ZGC)*(Z.gw||400)+Math.floor((z-Z.origin.z+(Z.gofs||512))/ZGC);
function zoneNew(def){
  const Z=Object.assign({cols:[],geo:new Geo(),mesh:null,mesh2:null,built:false,grid:null,dirty:false,rebuildT:0},def);ZONES[Z.id]=Z;return Z;
}
// a box in local coordinates: drawn (mat 0 lit, 6 glowing, 7 metal) and, unless o.col===false, solid. o.smash: fast flight breaks it.
function zoneBox(Z,x0,y0,z0,x1,y1,z1,col,mat=0,o){
  const g=o&&o.geo||Z.geo,ox=Z.origin.x,oy=Z.origin.y,oz=Z.origin.z;
  if(!(o&&o.draw===false))g.box(x0+ox,y0+oy,z0+oz,x1+ox,y1+oy,z1+oz,col,mat,o&&o.seed||0); // o.seed: the shader's per-box number (mat 9, cyber towers, reads it as a 0..1 hue)
  if(o&&o.col===false)return null;
  const b={x0:x0+ox,x1:x1+ox,y0:y0+oy,y1:y1+oy,z0:z0+oz,z1:z1+oz,col,smash:!!(o&&o.smash),dead:false};Z.cols.push(b);return b;
}
function zoneIndex(Z){
  Z.grid=new Map();const o=Z.origin,M=6,F=Z.gofs||512,W=Z.gw||400;
  for(const b of Z.cols){const i0=Math.floor((b.x0-M-o.x+F)/ZGC),i1=Math.floor((b.x1+M-o.x+F)/ZGC),j0=Math.floor((b.z0-M-o.z+F)/ZGC),j1=Math.floor((b.z1+M-o.z+F)/ZGC);
    for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=i*W+j;let l=Z.grid.get(k);if(!l){l=[];Z.grid.set(k,l);}l.push(b);}}
}
function zoneBake(Z){if(Z.regions)return zoneIndex(Z);if(Z.mesh)freeMesh(Z.mesh);Z.mesh=Z.geo.idx.length?Z.geo.mesh():null;Z.geo=new Geo();zoneIndex(Z);} // (the build arrays are let go once on the GPU)
// the boxes near a point (what nearCols answers while a zone is set); smash boxes are skipped while the player is bursting through
function zoneCols(x,z){
  NEAR.length=0;const Z=zone,l=Z.grid&&Z.grid.get(zkey(Z,x,z));
  if(l)for(let k=0;k<l.length;k++){const b=l[k];if(b.dead||(ZS.on&&b.smash))continue;NEAR.push(b);}
  return NEAR;
}
// a ray through a zone's boxes (rayCity in 10_world.js): cell by cell through the lookup grid, so a city of thousands of boxes only tests the few the ray passes
function zoneRay(Z,ox,oy,oz,dx,dy,dz,tmax){
  const g=Z.grid;if(!g){for(const b of Z.cols)rayBox(b,ox,oy,oz,dx,dy,dz);return;}
  const F=Z.gofs||512,W=Z.gw||400,px=ox-Z.origin.x+F,pz=oz-Z.origin.z+F;let cx=Math.floor(px/ZGC),cz=Math.floor(pz/ZGC);
  const sx=dx>0?1:-1,sz=dz>0?1:-1,tdx=Math.abs(dx)<1e-9?Infinity:ZGC/Math.abs(dx),tdz=Math.abs(dz)<1e-9?Infinity:ZGC/Math.abs(dz);
  let tmx=Math.abs(dx)<1e-9?Infinity:((cx+(dx>0?1:0))*ZGC-px)/dx,tmz=Math.abs(dz)<1e-9?Infinity:((cz+(dz>0?1:0))*ZGC-pz)/dz;
  for(let n=0;n<700;n++){
    const l=g.get(cx*W+cz);if(l)for(let k=0;k<l.length;k++)rayBox(l[k],ox,oy,oz,dx,dy,dz);
    const tn=Math.min(tmx,tmz);if(_best<=tn||tn>tmax)break;
    if(tmx<tmz){tmx+=tdx;cx+=sx;}else{tmz+=tdz;cz+=sz;}
  }
}
// ---- fast flight through walls (called around updatePlayer, see 99_main.js) ----
function zonePlayerPre(){ZS.on=!!(zone&&zone.smash&&!P.dead&&!cutLocked()&&P.vel.len()>35);ZS.px=P.pos.x;ZS.py=P.pos.y;ZS.pz=P.pos.z;}
function zonePlayerPost(){
  const Z=zone;if(!Z)return;
  if(ZS.on&&Z.grid){
    const dx=P.pos.x-ZS.px,dy=P.pos.y-ZS.py,dz=P.pos.z-ZS.pz,n=Math.max(1,Math.ceil(Math.hypot(dx,dy,dz))),R=P.radius+0.3,H=P.height;let hit=0;
    for(let s=1;s<=n;s++){const x=ZS.px+dx*s/n,y=ZS.py+dy*s/n,z=ZS.pz+dz*s/n,l=Z.grid.get(zkey(Z,x,z));if(!l)continue;
      for(const b of l){if(!b.smash||b.dead)continue;if(x>b.x0-R&&x<b.x1+R&&z>b.z0-R&&z<b.z1+R&&y<b.y1&&y+H>b.y0){zoneBreak(Z,b);hit++;}}}
    if(hit){SFX.boom(0.55,0.5);addShake(0.3);}
  }
  ZS.on=false;
  const B=INV.ls?null:Z.bounds;if(B){const o=Z.origin; // (the wormhole jump out of a zone is not held in)
    if(P.pos.x<o.x+B.x0){P.pos.x=o.x+B.x0;if(P.vel.x<0)P.vel.x=0;}else if(P.pos.x>o.x+B.x1){P.pos.x=o.x+B.x1;if(P.vel.x>0)P.vel.x=0;}
    if(P.pos.z<o.z+B.z0){P.pos.z=o.z+B.z0;if(P.vel.z<0)P.vel.z=0;}else if(P.pos.z>o.z+B.z1){P.pos.z=o.z+B.z1;if(P.vel.z>0)P.vel.z=0;}
    if(B.y1&&P.pos.y>o.y+B.y1-P.height){P.pos.y=o.y+B.y1-P.height;if(P.vel.y>0)P.vel.y=0;}}
}
function zoneBreak(Z,b){
  b.dead=true;Z.dirty=true;const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2,n=Math.min(10,3+Math.round((b.x1-b.x0)*(b.z1-b.z0)/8));
  for(let i=0;i<n;i++){const s=rr(0.3,0.9);spawnPiece(rr(b.x0,b.x1),rr(b.y0+0.5,Math.min(b.y1,b.y0+10)),rr(b.z0,b.z1),MESH.box,s,s*0.7,s*1.1,b.col||[.4,.4,.45],P.vel.x*0.3+rr(-8,8),rr(2,10),P.vel.z*0.3+rr(-8,8),8);}
  burst(cx,P.pos.y+1.3,cz,26,16,0.7,[[1,.8,.5],[.7,.8,1],[1,1,1]],1.4,-3,1.5);smoke(cx,P.pos.y+1.5,cz,3,2,5,2,0.3);
  if(Z.onBreak)Z.onBreak(b);
}
// ---- drawing and lighting ----
function drawStory(){
  ufoDraw();prismDraw();invDraw();openerDraw();
  const Z=zone;if(!Z)return;
  if(Z.dirty&&Z.rebuild&&time-Z.rebuildT>0.2){Z.dirty=false;Z.rebuildT=time;Z.rebuild();}
  if(Z.mesh&&!Z.hide)queue(Z.mesh,ID,Z.tint||WHITE,0);if(Z.mesh2)queue(Z.mesh2,ID,WHITE,0);
  if(Z.regions)zoneDrawRegions(Z); // Z.tint / Z.hide: the Kathana arena fades its floor in
  if(Z.draw)Z.draw();
}
// a big zone is baked in regions ({mesh,x0,x1,z0,z1} in absolute coordinates): only the ones in front of the camera and inside the fog are drawn
function zoneDrawRegions(Z){
  const fe=(Z.light&&Z.light.fog?Z.light.fog[1]:2000)+60,cx=camPos.x,cy=camPos.y,cz=camPos.z;Z.vis=0;
  for(const r of Z.regions){if(!r.mesh)continue;
    const dx=Math.max(r.x0-cx,0,cx-r.x1),dz=Math.max(r.z0-cz,0,cz-r.z1),dy=Math.max(r.y0-cy,0,cy-r.y1);if(dx*dx+dy*dy+dz*dz>fe*fe)continue;
    const mx=(r.x0+r.x1)/2-cx,mz=(r.z0+r.z1)/2-cz,my=(r.y0+r.y1)/2-cy,rad=Math.hypot(r.x1-r.x0,r.y1-r.y0,r.z1-r.z0)/2;
    if(mx*camF.x+my*camF.y+mz*camF.z<-rad)continue; // behind the camera
    queue(r.mesh,ID,WHITE,0);Z.vis++;}
}
function zoneUniforms(u){
  const L=zone.light||{},d=L.dir||[0.3,1,0.2],l=Math.hypot(d[0],d[1],d[2])||1,f=L.fog||[30,200];
  gl.uniform3f(u.uLDir,d[0]/l,d[1]/l,d[2]/l);gl.uniform3fv(u.uLCol,L.lcol||[.5,.55,.7]);gl.uniform3fv(u.uSky,L.sky||[.3,.35,.5]);gl.uniform3fv(u.uGnd,L.gnd||[.15,.13,.2]);
  gl.uniform3fv(u.uFogC,L.fogC||[.02,.02,.05]);gl.uniform2f(u.uFog,f[0],f[1]);gl.uniform1f(u.uShOn,0);gl.uniform1f(u.uNight,L.night||0);
}
function zoneLights(){
  const Z=zone,ls=Z.lights;if(!ls||!ls.length)return 0;
  plCand.length=0;for(const L of ls){const d=(L.x-camPos.x)**2+(L.y-camPos.y)**2+(L.z-camPos.z)**2;if(d<(L.r+30)**2)plCand.push({x:L.x,y:L.y,z:L.z,d,r:L.r,c:L.c,k:L.k===undefined?1:L.k});}
  plCand.sort((a,b)=>a.d-b.d);const n=Math.min(PL_MAX,gfx().lights,plCand.length);
  for(let k=0;k<n;k++){const L=plCand[k];PL_POS[k*4]=L.x;PL_POS[k*4+1]=L.y;PL_POS[k*4+2]=L.z;PL_POS[k*4+3]=L.r;PL_COL[k*3]=L.c[0]*L.k;PL_COL[k*3+1]=L.c[1]*L.k;PL_COL[k*3+2]=L.c[2]*L.k;}
  return n;
}
// the minimap inside a zone: the zone's plan (rooms and corridors) turned to your heading, its name on top, the objective diamond, and whatever the zone adds (mapMarks)
function zoneMinimap(yaw){
  const R=180,S=zone.mapS||1.7,c=mctx,Z=zone,cs=Math.cos(yaw),sn=Math.sin(yaw);
  c.clearRect(0,0,360,360);c.save();c.beginPath();c.arc(R,R,R-2,0,TAU);c.clip();c.fillStyle='#070a16';c.fillRect(0,0,360,360);
  c.translate(R,R);c.rotate(yaw);c.scale(S,S);c.translate(-(P.pos.x-Z.origin.x),-(P.pos.z-Z.origin.z));
  if(Z.plan){c.fillStyle=Z.planCol||'#22365e';for(const r of Z.plan)c.fillRect(r[0],r[2],r[1]-r[0],r[3]-r[2]);}
  if(Z.planDraw)Z.planDraw(c);
  c.restore();
  const plot=(x,z,edge)=>{const dx=x-P.pos.x,dz=z-P.pos.z;let mx=(dx*cs-dz*sn)*S,my=(dx*sn+dz*cs)*S;const l=Math.hypot(mx,my);if(l>R-16){if(!edge)return null;mx*=(R-16)/l;my*=(R-16)/l;}return [R+mx,R+my];};
  c.font='700 15px "Chakra Petch", sans-serif';c.textAlign='center';c.textBaseline='middle';
  if(Z.mapMarks)Z.mapMarks(plot,c);objMapMark(plot,c);
  c.fillStyle='#cfe3ff';c.fillText(String(Z.name||Z.id).toUpperCase(),R,24);
  c.fillStyle='#e9f3ff';c.font='700 22px "Chakra Petch", sans-serif';c.fillText('N',R+sn*(R-18),R-cs*(R-18));
  c.fillStyle=FACTION_COL[playerFaction()]==='#e9f3ff'?'#ffc93c':FACTION_COL[playerFaction()];
  c.beginPath();c.moveTo(R,R-13);c.lineTo(R+9,R+10);c.lineTo(R,R+5);c.lineTo(R-9,R+10);c.closePath();c.fill();
}
