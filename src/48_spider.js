// ================================================================
// Web Runner kit: web wings, updrafts, swing boost, slingshot, dives, air tricks,
// landing rolls, danger sense, and the Web Strike / Web Bomb / Web Whip moves
// ================================================================
const updrafts=[];
(function(){let q=7;const rnd=()=>(q=(q*16807)%2147483647)/2147483647,rg=(a,b)=>a+(b-a)*rnd(); // own seed: leaves the world generator untouched
  const tall=roofTops.filter(r=>r.y>60).filter(()=>rnd()<0.5).slice(0,26);
  for(const r of tall)updrafts.push({x:r.x+rg(-6,6),z:r.z+rg(-6,6),y0:r.y,h:120,r:9});
  for(const p of parks.slice(0,4))updrafts.push({x:p.cx+rg(-10,10),z:p.cz+rg(-10,10),y0:2,h:90,r:10});})();
const TRICKS=[{name:'Spin',unlock:1,rx:0,ry:TAU,dur:0.5},{name:'Backflip',unlock:3,rx:-TAU,ry:0,dur:0.6},{name:'Corkscrew',unlock:5,rx:-TAU,ry:TAU,dur:0.7},
  {name:'Twist Flip',unlock:7,rx:TAU,ry:-TAU,dur:0.65},{name:'Double Flip',unlock:9,rx:-2*TAU,ry:0,dur:0.8}];
let trickN=0;
const webMk=()=>mk('webSwing');
function spiderAirTrick(){
  if(!hasWeb()||P.grounded||P.flying||P.wall||P.wallRun||P.flip)return false;
  const lv=masteryLevel('webSwing'),opts=TRICKS.filter(t=>t.unlock<=lv),t=opts[trickN++%opts.length];
  P.flip={t:0,dur:t.dur,rx:t.rx,ry:t.ry};addMastery('webSwing',6);
  feed(t.name,'+style');SFX.whoosh();for(let i=0;i<10;i++)emit(P.pos.x,P.pos.y+1.3,P.pos.z,rr(-3,3),rr(-3,3),rr(-3,3),0.4,[.9,.95,1],0.8,0,2);return true;
}
// Shift while swinging: a burst of speed through the bottom of the arc
function swingBoost(){
  if(!P.web||time-(P.boostT||-9)<1)return;P.boostT=time;const hs=Math.hypot(P.vel.x,P.vel.z)||1,b=14*(1+webMk());
  P.vel.x+=P.vel.x/hs*b;P.vel.z+=P.vel.z/hs*b;P.vel.y+=3;SFX.whoosh();addShake(0.1);
  for(let i=0;i<14;i++)emit(P.pos.x,P.pos.y+1.3,P.pos.z,-P.vel.x*0.1+rr(-2,2),rr(-2,2),-P.vel.z*0.1+rr(-2,2),0.35,[.9,.95,1],1,0,2);
}
// slingshot: a charged jump (hold Space on the ground) stretches two webs and launches you forward
function slingLaunch(k){
  const sp=(40+35*k)*(0.8+0.4*webMk());
  let fx=camF.x,fz=camF.z;const l=Math.hypot(fx,fz)||1;fx/=l;fz/=l;
  P.vel.set(fx*sp,22+22*k,fz*sp);P.grounded=false;P.pos.y+=0.3;SFX.boom(0.4,1.4);SFX.whoosh();addShake(0.2);addMastery('webSwing',4);
  const h=handPoint();for(const s of [-1,1])tracer(h.x,h.y,h.z,P.pos.x+fx*6+fz*s*4,P.pos.y+5,P.pos.z+fz*6-fx*s*4,[.95,.95,1],0.06,0.3);
  burst(P.pos.x,P.pos.y+0.3,P.pos.z,30,14,0.5,DUST,1.6,-2,2);
}
// web wings: hold Space in the air
function wingStep(dt){
  const lv=webMk(),yaw=P.yaw,fx=-Math.sin(yaw),fz=-Math.cos(yaw),dive=clamp(-P.pitch,0,1);
  const hs=Math.hypot(P.vel.x,P.vel.z),target=Math.max(hs*0.995,24+22*lv+dive*30);
  const k=damp(1.6,dt);P.vel.x+=(fx*target-P.vel.x)*k;P.vel.z+=(fz*target-P.vel.z)*k;
  const sink=lerp(-5,-2.5,lv)-dive*28;P.vel.y+=(sink-P.vel.y)*damp(2.2,dt);
  for(const u of updrafts)if(Math.hypot(P.pos.x-u.x,P.pos.z-u.z)<u.r&&P.pos.y>u.y0-2&&P.pos.y<u.y0+u.h){P.vel.y=Math.min(P.vel.y+60*dt,26);if(Math.random()<0.4)emit(P.pos.x+rr(-2,2),P.pos.y,P.pos.z+rr(-2,2),0,20,0,0.4,[.95,.97,1],0.8,0,0);}
  addMastery('webSwing',hs*dt*0.02);
}
function landingRoll(impact){
  P.flip={t:0,dur:0.45,rx:-TAU,ry:0,roll:true};SFX.whoosh();
  burst(P.pos.x,P.pos.y+0.2,P.pos.z,24,10,0.5,DUST,1.4,-2,2);if(impact>80)addShake(0.2);
}
// runs every frame from the player controller
function spiderTick(dt){
  if(P.flip){P.flip.t+=dt;if(P.flip.t>=P.flip.dur)P.flip=null;}
  if(!hasWeb()){P.wings=false;return;}
  const air=!P.grounded&&!P.flying&&!P.web&&!P.wall&&!P.wallRun&&!P.zip;
  if(air&&keys.Space&&P.spaceT&&time-P.spaceT>0.22&&!P.wings){P.wings=true;SFX.tone('triangle',300,500,0.2,0.05);}
  if(P.wings&&(!air||!keys.Space))P.wings=false;
  if(P.web){const hs=Math.hypot(P.vel.x,P.vel.z);addMastery('webSwing',hs*dt*0.03);}
}
// danger sense: sometimes you dodge before the hit lands
function spiderSense(src,type){
  if(!hasPower('spiderPowers')||!src||src===P||P.dead)return false;
  if(!['bullet','blast','shot','punch','rocket','pvp','throw','shock','hit','fire'].includes(type))return false;
  if(time-(P.senseT||-9)<1.1||Math.random()>0.22+0.3*webMk())return false;
  P.senseT=time;const s=Math.random()<0.5?-1:1,rx=Math.cos(P.yaw)*s,rz=-Math.sin(P.yaw)*s;
  P.vel.x+=rx*14;P.vel.z+=rz*14;if(P.grounded)P.vel.y=Math.max(P.vel.y,5);P.flip={t:0,dur:0.4,rx:0,ry:TAU*s};feed('Danger sense','Dodged');SFX.tone('sine',1400,2000,0.08,0.06);
  return true;
}
// ---- Web Runner moves ----
Object.assign(POWER_FN,{
  webStrike(){
    const R=pstat('webStrike','range'),t=lockT&&lockT.alive?lockT:aim.actor&&aim.actor.kind!=='prop'&&aim.hitAny?aim.actor:null,h=handPoint();
    if(!t){if(aim.hitAny&&aim.surface){tracer(h.x,h.y,h.z,aim.x,aim.y,aim.z,[.95,.95,1],0.06,0.2);webZip();}PS.webStrike.cd=0.2;return;}
    const c=center(t),d=Math.hypot(c.x-P.pos.x,c.y-P.pos.y,c.z-P.pos.z);if(d>R){PS.webStrike.flash=0.3;PS.webStrike.cd=0;feed('Too far','Web Strike reaches '+Math.round(R)+' m');return;}
    tracer(h.x,h.y,h.z,c.x,c.y,c.z,[.95,.95,1],0.08,0.25);faceAim();const dmg=pstat('webStrike','damage')*strengthMul();
    if(!P.grounded&&!P.flying){ // swing kick: zip in and kick through them
      const dx=c.x-P.pos.x,dy=c.y-P.pos.y-1,dz=c.z-P.pos.z,l=Math.hypot(dx,dy,dz)||1;P.vel.set(dx/l*60,dy/l*60,dz/l*60);P.burstT=Math.min(0.5,l/60);
      later(Math.min(0.5,l/60),()=>{if(!t.alive)return;const q=center(t);Damage.apply(P,t,dmg*1.5,'punch',{kv:[dx/l*30,10,dz/l*30],flung:true,stun:1.2});P.punchT=time;P.punchKind='kick';SFX.punch(1.2);burst(q.x,q.y,q.z,20,10,0.4,SPARK,1,0,2);P.vel.set(-dx/l*8,10,-dz/l*8);});
    }else if(t.kind==='vehicle'&&!t.net&&t.vtype!=='truck'&&t!==P.car){if(t.driver)ejectDriver(t);t.state='thrown';const dx=P.pos.x-t.pos.x,dz=P.pos.z-t.pos.z,l=Math.hypot(dx,dz)||1;t.vel.set(dx/l*Math.min(l,26),8,dz/l*Math.min(l,26));t.life=4;t.thrower=P;t.throwDmg=dmg;}
    else{const dx=P.pos.x-t.pos.x,dz=P.pos.z-t.pos.z,l=Math.hypot(dx,dz)||1;Damage.apply(P,t,dmg,'web',{stun:1,kv:t.kind==='human'||t.kind==='rival'?[dx/l*Math.min(l,20),8,dz/l*Math.min(l,20)]:null});}
    SFX.tone('triangle',1300,500,0.12,0.08);},
  webBomb(){faceAim();const h=handPoint(),d=dirTo(h,aim.x,aim.y,aim.z);
    fireProj({kind:'web',owner:P,x:h.x,y:h.y,z:h.z,vx:d[0]*55,vy:d[1]*55+3,vz:d[2]*55,dmg:0,r:0.5,life:2.5,grav:12,webBomb:true});SFX.tone('triangle',900,400,0.15,0.08);},
  webWhip(){const R=pstat('webWhip','radius'),dmg=pstat('webWhip','damage')*strengthMul();P.flip={t:0,dur:0.5,rx:0,ry:TAU};
    for(let i=0;i<16;i++){const a=i/16*TAU;tracer(P.pos.x,P.pos.y+1.4,P.pos.z,P.pos.x+Math.cos(a)*R,P.pos.y+1.2,P.pos.z+Math.sin(a)*R,[.95,.95,1],0.07,0.25);}
    ringFx(P.pos.x,P.pos.y+1.2,P.pos.z,1,R,0.35,[.95,.95,1]);SFX.swish();
    for(const a of actors){if(!a.alive||a===P||a.kind==='prop'||a.held)continue;const c=center(a),dx=c.x-P.pos.x,dz=c.z-P.pos.z,l=Math.hypot(dx,dz)||1;if(l>R||Math.abs(c.y-P.pos.y-1)>4)continue;
      if(a.kind==='vehicle')Damage.apply(P,a,dmg*0.6,'web');else Damage.apply(P,a,dmg,'web',{stun:0.8,kv:[dx/l*22,9,dz/l*22]});}
    hitProps(P.pos.x,P.pos.y+1,P.pos.z,R*0.6,P,16);},
});
// web bomb burst (called from projectile impact)
function webBurst(x,y,z){
  const R=pstat('webBomb','radius'),st=pstat('webBomb','stun'),dmg=pstat('webBomb','damage')*strengthMul();
  burst(x,y,z,60,R*1.4,0.8,[[.95,.95,1],[.8,.8,.85]],1.6,4,2);ringFx(x,y+0.3,z,0.5,R,0.35,[.95,.95,1]);SFX.tone('triangle',500,200,0.25,0.1);
  for(const a of actors){if(!a.alive||a===P||a.kind==='prop'||a.kind==='boss')continue;const c=center(a);if(Math.hypot(c.x-x,c.y-y,c.z-z)>R)continue;
    Damage.apply(P,a,dmg,'web',{stun:st});if(!a.net)a.webT=st;if(a.kind==='drone'&&a.vel)a.vel.y-=20;}
}
function drawSpider(){
  if(state!=='play')return;
  if(P.wings&&!P.dead){const s=Math.sin(P.heroYaw),c=Math.cos(P.heroYaw);
    for(const side of [-1,1]){const rx=c*side,rz=-s*side;
      queue(MESH.box,M4.beam(tmpM(),P.pos.x+rx*0.3,P.pos.y+2.2,P.pos.z+rz*0.3,P.pos.x+rx*1.45,P.pos.y+1.5,P.pos.z+rz*1.45,0.05),[.2,.2,.25,0.55],F_BL);
      queue(MESH.box,at(P.pos.x+rx*0.85,P.pos.y+1.7,P.pos.z+rz*0.85,0,P.heroYaw,0,1.15,0.75,0.03),[.12,.12,.16,0.45],F_BL);
      queue(MESH.box,M4.beam(tmpM(),P.pos.x+rx*0.3,P.pos.y+1.2,P.pos.z+rz*0.3,P.pos.x+rx*1.45,P.pos.y+1.5,P.pos.z+rz*1.45,0.05),[.2,.2,.25,0.55],F_BL);}}
  if(P.charging&&P.chargeT>0.35&&hasWeb()){const h=handPoint(),c=Math.cos(P.yaw),s=Math.sin(P.yaw);
    for(const sd of [-1,1])queue(MESH.box,M4.beam(tmpM(),h.x,h.y,h.z,P.pos.x-s*8+c*sd*5,P.pos.y+4,P.pos.z-c*8-s*sd*5,0.04),[.95,.95,1,1],0);}
  if(hasWeb())for(const u of updrafts){const q=inView(u.x,u.z,300,40);if(q<0)continue;if(Math.random()<0.25)emit(u.x+rr(-u.r,u.r),u.y0+rr(0,u.h*0.4),u.z+rr(-u.r,u.r),0,rr(18,30),0,rr(1,2),[.9,.95,1],rr(0.3,0.6),0,0);}
  for(const a of actors)if(a.webT>0&&a.alive&&a.kind!=='remote'){const c=center(a),s=(a.radius||1)*1.3;queue(MESH.sphere,at(c.x,c.y,c.z,0,a.webT,0,s*0.8,s*1.2,s*0.8),[.92,.92,.95,0.55],F_BL);}
}
function updateWebbed(dt){for(const a of actors)if(a.webT>0){a.webT-=dt;a.stun=Math.max(a.stun||0,0.2);}}
