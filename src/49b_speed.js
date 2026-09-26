// ================================================================
// Speedster: speed dial, fast mode, phasing, lightning, slow time and time stop
// ================================================================
// Shift runs, F toggles fast mode (always running), C vibrates you through walls,
// [ and ] (or the mouse wheel) turn the speed dial, or how slow time runs while Slow Time is on.
// Punches hit harder the higher the dial. Time Stop freezes everyone for 3 seconds;
// whatever you hit in that moment lands all at once when time starts again.
const SPD_C=[1,.82,.25],SPD_C2=[1,.45,.15];
const isSpeed=()=>hasTrav('superSpeed')&&!P.alien;
const dialMax=()=>hungry()?2:Math.round(3+9*mk('superSpeed')); // x3 at the start, x12 mastered; x2 when out of calories
P.dial=2;P.fastMode=false;P.phasing=false;P.slowOn=false;
let timeStopT=0,frozenT=0,slowK=0.3,tsQueue=[],tsPath=[],tsBy=null,lastStreak=null;
function speedMult(){return isSpeed()?Math.max(1.5,Math.min(P.dial,dialMax())):pstat('superSpeed','mult');}
const speedPunchMul=()=>isSpeed()?1+0.3*(Math.min(P.dial,dialMax())-1):1;
function turnDial(dir){
  if(!isSpeed())return false;
  if(P.slowOn){slowK=clamp(slowK-dir*0.06,0.06,0.7);feed('Slow time','World at '+Math.round(slowK*100)+'% speed');return true;}
  const m=dialMax(),v=clamp((P.dial|0)+dir,1,m);if(v===P.dial&&dir>0){feed('Speed dial x'+v,'Master super speed to push it higher (max x'+m+')');return true;}
  P.dial=v;feed('Speed dial x'+v,v>=m?'As fast as you can go for now':'');SFX.tone('square',300+v*80,300+v*90,0.06,0.05);return true;
}
function toggleFastMode(){if(!isSpeed())return;P.fastMode=!P.fastMode;feed(P.fastMode?'Fast mode on':'Fast mode off',P.fastMode?'You run at the speed dial without holding Shift':'');}
function togglePhase(){
  if(!isSpeed()||!canAct())return;
  if(P.phasing){P.phaseOff=true;return;}
  if(P.en<5){noEnergy();return;}
  P.phasing=true;P.phaseOff=false;SFX.tone('sawtooth',120,900,0.3,0.06);feed('Phasing','Walls can\'t stop you · press C again to become solid');
}
function endPhase(force){
  if(!P.phasing)return;const b=inBuilding(P.pos.x,P.pos.y+1,P.pos.z,0.3);
  if(b&&!force){P.phaseOff=true;return;} // stay intangible until you are out of the wall
  P.phasing=false;P.phaseOff=false;if(b){P.pos.y=b.y1+0.1;P.vel.set(0,0,0);}
}
// ---- moves ----
Object.assign(POWER_FN,{
  lightningThrow(){faceAim();const h=handPoint(),d=dirTo(h,aim.x,aim.y,aim.z),sp=160;
    fireProj({kind:'bolt',owner:P,x:h.x,y:h.y,z:h.z,vx:d[0]*sp,vy:d[1]*sp,vz:d[2]*sp,dmg:pstat('lightningThrow','damage')*(1+0.12*(P.dial-1)),r:0.6,life:1.6});
    SFX.tone('sawtooth',1800,200,0.2,0.1);for(let i=0;i<6;i++)tracer(h.x,h.y,h.z,h.x+rr(-1.5,1.5),h.y+rr(-1.5,1.5),h.z+rr(-1.5,1.5),SPD_C,0.05,0.12);},
  phaseStrike(){const t=lockT&&lockT.alive?lockT:aim.actor&&aim.actor.kind!=='prop'&&aim.actor.kind!=='vehicle'?aim.actor:nearestFoe(aim.x,aim.y,aim.z,6);
    if(!t||Math.hypot(t.pos.x-P.pos.x,t.pos.z-P.pos.z)>30){PS.phaseStrike.cd=0;P.en+=POWERS.phaseStrike.energy;feed('No one in reach','Phase Strike reaches 30 m · lock on with Z');return;}
    const c=center(t),dx=c.x-P.pos.x,dz=c.z-P.pos.z,l=Math.hypot(dx,dz)||1,x0=P.pos.x,y0=P.pos.y,z0=P.pos.z;
    if(l>3){P.pos.set(c.x-dx/l*1.6,Math.max(t.pos.y,groundY(c.x,c.z,c.y+1)),c.z-dz/l*1.6);streak(x0,y0+1.2,z0,P.pos.x,P.pos.y+1.2,P.pos.z);}
    P.heroYaw=Math.atan2(dx,dz);P.punchT=time;P.punchKind='jab';P.punchArm=1;P.vibT=0.35;
    later(0.18,()=>{if(!t.alive)return;const q=center(t);Damage.apply(P,t,pstat('phaseStrike','damage')*strengthMul(),'phase',{stun:2,kv:t.kind==='boss'?null:[dx/l*6,4,dz/l*6]});
      burst(q.x,q.y,q.z,40,8,0.5,[[1,.2,.2],SPD_C],1.2,4,2);SFX.tone('sawtooth',80,40,0.3,0.15);addShake(0.3);});
    SFX.tone('square',2000,2400,0.3,0.04);},
});
CHANNEL_FN.speedTornado=dt=>{
  const R=pstat('speedTornado','radius'),dps=pstat('speedTornado','dps')*(1+0.1*(P.dial-1));P.heroYaw+=30*dt;P.spinT=0.2;castT=time;
  for(const a of actors){if(!a.alive||a===P||a.kind==='prop'||a.kind==='boss'||a===P.car)continue;const dx=P.pos.x-a.pos.x,dz=P.pos.z-a.pos.z,d=Math.hypot(dx,dz)||1;if(d>R||Math.abs(a.pos.y-P.pos.y)>R)continue;
    if(a.kind==='remote'||a.net){if(time-(a.twT||-9)>0.4){a.twT=time;Damage.apply(P,a,dps*0.4,'wind',{kv:[-dz/d*18,16,dx/d*18]});}continue;}
    if(a.kind==='human'){a.air=true;a.vel.set(dx/d*3-dz/d*16,Math.min(a.vel.y+36*dt,16),dz/d*3+dx/d*16);a.tumble=6;}
    else if(a.kind==='vehicle'&&a.vtype!=='truck'&&d<R*0.7){if(a.state!=='thrown'){if(a.driver)ejectDriver(a);a.state='thrown';a.sx=rr(-3,3);a.sy=3;a.sz=rr(-3,3);a.thrower=P;a.throwDmg=30;}a.life=3;a.vel.set(dx/d*3-dz/d*14,12,dz/d*3+dx/d*14);}
    else if(a.vel){a.vel.x+=-dz/d*20*dt;a.vel.z+=dx/d*20*dt;a.vel.y+=18*dt;}
    Damage.apply(P,a,dps*dt,'wind');}
  hitProps(P.pos.x,P.pos.y,P.pos.z,R*0.5,P,18);
  for(let k=0;k<6;k++){const an=rr(0,TAU),h=rr(0,R*1.2),r=1+h*0.4;emit(P.pos.x+Math.cos(an)*r,P.pos.y+h,P.pos.z+Math.sin(an)*r,-Math.sin(an)*20,rr(3,8),Math.cos(an)*20,0.6,Math.random()<0.4?SPD_C:[.85,.85,.85],rr(1,2),0,0.5);}
};
TOGGLE_FN.slowTime=()=>{P.slowOn=!P.slowOn;SFX.tone('sine',P.slowOn?600:200,P.slowOn?150:700,0.5,0.1);
  if(P.slowOn)feed('Slow time',MP.online()?'In a shared city you just get faster; the others keep their speed':'[ and ] set how slow the world runs');};
POWER_FN.timeStop=()=>{startTimeStop(P,POWERS.timeStop.duration);MP.fx('ts',{d:POWERS.timeStop.duration});};
function startTimeStop(by,d){
  if(by===P){timeStopT=d;tsQueue=[];tsPath=[[P.pos.x,P.pos.y+1.2,P.pos.z]];feed('Time stopped','Everything you do lands when time starts again');}
  else{frozenT=d;tsBy=by;if(by){by.tsPos=by.pos.clone();by.tsUntil=time+d;}P.charging=false;mouseL=false;if(P.cp)P.cp=null;}
  flashWhite=0.4;SFX.tone('sine',1200,80,0.8,0.15);SFX.boom(0.5,0.3);addShake(0.2);
}
// your hits during a time stop wait here until time starts again
function tsIntercept(src,t,amount,type,opt){
  if(!(timeStopT>0)||src!==P||t===P||opt._ts)return false;
  tsQueue.push([t,amount,type,Object.assign({},opt,{_ts:true})]);const c=center(t);burst(c.x,c.y,c.z,6,3,0.3,[SPD_C],0.8,0,2);return true;
}
function endTimeStop(){
  const q=tsQueue;tsQueue=[];
  for(let i=1;i<tsPath.length;i++){const a=tsPath[i-1],b=tsPath[i];streak(a[0],a[1],a[2],b[0],b[1],b[2]);}
  q.forEach((h,i)=>later(i*0.025,()=>{const [t,amt,type,opt]=h;if(t.alive===false&&t.kind!=='remote')return;Damage.apply(P,t,amt,type,opt);const c=center(t);burst(c.x,c.y,c.z,20,10,0.4,[SPD_C,[1,1,1]],1.2,0,2);}));
  if(q.length){SFX.boom(0.8,0.8);addShake(0.5);feed(q.length+' hits landed at once','');}flashWhite=0.3;
}
// the world clock: 0 while time is stopped, slowed by Slow Time (single player) and Time Dilation
function worldTimeK(){if(timeStopT>0||frozenT>0)return 0;if(MP.online())return 1;if(P.slowOn&&isSpeed())return slowK;if(timeDil>0)return 0.25;return 1;}
function updateTimeStop(dt){
  if(timeStopT>0){timeStopT-=dt;const L=tsPath[tsPath.length-1];if(Math.hypot(P.pos.x-L[0],P.pos.z-L[2])>2&&tsPath.length<400)tsPath.push([P.pos.x,P.pos.y+1.2,P.pos.z]);if(timeStopT<=0)endTimeStop();}
  if(frozenT>0){frozenT-=dt;if(frozenT<=0&&tsBy){const r=tsBy;if(r.tsPos)streak(r.tsPos.x,r.tsPos.y+1.2,r.tsPos.z,r.pos.x,r.pos.y+1.2,r.pos.z);tsBy=null;}}
  canvas.classList.toggle('tstop',timeStopT>0||frozenT>0);canvas.classList.toggle('slowmo',!(timeStopT>0||frozenT>0)&&((P.slowOn&&isSpeed())||timeDil>0));
}
// lightning streak between two points
function streak(ax,ay,az,bx,by,bz){const n=Math.max(2,Math.min(12,Math.round(Math.hypot(bx-ax,by-ay,bz-az)/4)));let px=ax,py=ay,pz=az;
  for(let i=1;i<=n;i++){const k=i/n,j=i<n?1.2:0,qx=lerp(ax,bx,k)+rr(-j,j),qy=lerp(ay,by,k)+rr(-j,j),qz=lerp(az,bz,k)+rr(-j,j);
    tracer(px,py,pz,qx,qy,qz,i%2?SPD_C:SPD_C2,0.12,0.5);tracer(px,py,pz,qx,qy,qz,[1,1,1],0.04,0.4);px=qx;py=qy;pz=qz;}}
function updateSpeed(dt){
  if(!isSpeed()){P.phasing=false;P.slowOn=false;P.fastMode=false;return;}
  if(P.dial>dialMax())P.dial=dialMax();
  if(P.phasing){P.en=Math.max(0,P.en-6*dt);P.lastSpend=time;if(P.en<=0)endPhase(true);else if(P.phaseOff)endPhase(false);}
  if(P.slowOn){const sd=pstat('slowTime','drain')*dt;if(heroMeter()){if(!payEn(sd,'slowTime',true))P.en=0;}else{P.en=Math.max(0,P.en-sd);P.lastSpend=time;}if(P.en<=0){P.slowOn=false;feed('Out of energy','Time runs normally again');}if(MP.online())hasteT=Math.max(hasteT,0.15);}
  if(P.vibT>0)P.vibT-=dt;
  // lightning trails behind you when you really move
  const hs=Math.hypot(P.vel.x,P.vel.z),c=center(P);
  if(hs>24){if(lastStreak&&Math.random()<0.7){const L=lastStreak;tracer(L[0],L[1],L[2],c.x+rr(-.4,.4),c.y+rr(-.6,.4),c.z+rr(-.4,.4),Math.random()<0.5?SPD_C:SPD_C2,0.07,0.35);}lastStreak=[c.x,c.y,c.z];
    if(Math.random()<0.3)tracer(c.x,c.y,c.z,c.x+rr(-1.2,1.2),c.y+rr(-1,1),c.z+rr(-1.2,1.2),[1,1,1],0.04,0.1);}else lastStreak=null;
  if(P.speeding)addMastery('superSpeed',hs*dt*0.004);
}
function remoteStreaks(){for(const r of MP.peers.values()){if(!(r.flags&FLAG.speed)){r.lastS=null;continue;}const c={x:r.pos.x,y:r.pos.y+1.2,z:r.pos.z};
  if(r.lastS&&Math.random()<0.7)tracer(r.lastS.x,r.lastS.y,r.lastS.z,c.x,c.y,c.z,SPD_C,0.07,0.35);r.lastS=c;}}
