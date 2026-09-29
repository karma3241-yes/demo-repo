// ================================================================
// Hero meters: the Armored Inventor's suit battery, the Storm God's lightning and the Speedster's calories
// ================================================================
// Like the Ring Bearer's ring charge, each of these replaces the energy bar for that hero and never refills on its own.
// - Battery: every power runs on it. Empty, the suit drops to standby: flying and plain punches only.
//   Recharge at Inventor Tower (land on its roof or its landing pad, or walk into the lobby).
// - Lightning: only lightning attacks use it. Empty, you still fly and fight, and the hammer still flies, without lightning.
//   Recharge on top of a tall tower: press G to raise the hammer and call the storm down into it.
// - Calories: running fast and using powers burn them; there is no energy limit otherwise. Empty, the speed dial
//   tops out at x2, powers take three times as long to come back, and Time Stop is out. Press G at any shop to eat.
const METERS={
  armorFlight:{key:'battery',label:'BATTERY',cls:'bat',rate:0.25},
  stormFlight:{key:'bolt',label:'LIGHTNING',cls:'bolt',rate:0.5},
  superSpeed:{key:'cal',label:'CALORIES',cls:'cal',rate:0.12},
  powerRing:{key:'ring',label:'RING',cls:'ring',rate:0.25}, // pool powers on keys 4-5 run on ring charge too
};
const LIGHTNING_IDS=new Set(['stormHammer','lightning','lightningThrow','chainLightning']);
const TALL_ROOF=110; // how high a roof has to be to call the storm from
const heroMeter=()=>{if(!save.character||P.alien)return null;return METERS[save.character.movement[0]]||null;};
const meterCap=m=>m.key==='battery'?pstat('suitBattery','capacity'):m.key==='ring'&&save.ring>100?RING_MAX:100; // an overcharged ring holds up to 200
const meterFrac=m=>clamp(save[m.key]/meterCap(m),0,1);
const standby=()=>{const m=heroMeter();return !!m&&m.key==='battery'&&save.battery<=0;};
const hungry=()=>{const m=heroMeter();return !!m&&m.key==='cal'&&save.cal<=0;};
const boltEmpty=()=>{const m=heroMeter();return !!m&&m.key==='bolt'&&save.bolt<=0;};
// pay for a power with the hero meter (tick: a per-frame cost for held powers). Returns false if it can't be paid.
function payEn(n,id,tick){
  const m=heroMeter();if(!m)return false;if(!(n>0))return true;
  if(m.key==='bolt'&&!LIGHTNING_IDS.has(id))return true; // only lightning uses the storm's charge
  const c=n*m.rate;
  if(m.key==='cal'){if(save.cal>0){save.cal=Math.max(0,save.cal-c);if(save.cal<=0)meterEmpty(m);return true;}return !tick&&id!=='timeStop';}
  if(m.key==='bolt'&&id==='stormHammer'&&save.bolt<=0){P.hammerDry=true;return true;} // the hammer still flies, just without lightning
  if(save[m.key]<=0){meterOut(m);return false;}
  save[m.key]=Math.max(0,save[m.key]-c);if(save[m.key]<=0.01){save[m.key]=0;meterEmpty(m);}return true; // the last of the charge still pays for one more
}
// powers that the meter blocks right now (the hotbar dims them)
function meterBlocks(id){const m=heroMeter();if(!m)return false;
  if(m.key==='battery')return save.battery<=0;
  if(m.key==='ring')return save.ring<=0;
  if(m.key==='bolt')return save.bolt<=0&&LIGHTNING_IDS.has(id)&&id!=='stormHammer';
  return save.cal<=0&&id==='timeStop';}
const cdMul=()=>hungry()?3:1;
let meterMsgT=-9;
function meterOut(m){if(m.key==='ring'){ringOut();return;}if(time-meterMsgT<2)return;meterMsgT=time;
  if(m.key==='battery')feed('Suit on standby','Fly to Inventor Tower to recharge');
  else if(m.key==='bolt')feed('No lightning left','Call the storm from the top of a tall tower (G)');
  SFX.tone('square',220,140,0.15,0.06);}
function meterEmpty(m){meterMsgT=time;if(m.key==='ring'){ringOut();return;}
  if(m.key==='battery'){toast('Battery empty','Standby mode · flying and punches only. Recharge at Inventor Tower.','red');SFX.tone('sawtooth',400,60,0.8,0.1);}
  else if(m.key==='bolt')toast('Out of lightning','Fly to the top of a tall tower and call the storm (G)','cyan');
  else toast('Out of calories','You slow down. Press G at a shop to eat.','gold');}
// ---- Inventor Tower ----
function atInventorTower(){const T=invTower;if(!T)return false;const x=P.pos.x,y=P.pos.y,z=P.pos.z;
  if(x>T.x0-1&&x<T.x1+1&&z>T.z0-1&&z<T.z1+1&&y>T.top-1.5&&y<T.top+14)return true; // on the roof
  if(Math.hypot(x-T.pad.x,z-T.pad.z)<10&&y>T.pad.y-1&&y<T.pad.y+10)return true;   // on the landing pad
  return Math.hypot(x-T.door.x,z-T.door.z)<9&&y<6;                               // in the lobby doorway
}
// ---- the Storm God's tower tops ----
function tallRoofHere(){if(P.pos.y<TALL_ROOF-2)return null;
  for(const r of roofTops){if(r.y<TALL_ROOF)continue;if(P.pos.x>r.x0-2&&P.pos.x<r.x1+2&&P.pos.z>r.z0-2&&P.pos.z<r.z1+2&&P.pos.y>r.y-1.5&&P.pos.y<r.y+16)return r;}
  return null;}
function callStorm(){
  if(P.stormCall||!(heroMeter()&&heroMeter().key==='bolt'))return;
  if(save.bolt>=99.5){feed('Your hammer is fully charged','');return;}
  P.stormCall={t:0,next:0.15};P.flying=false;feed('Calling the storm','Hold still');SFX.tone('sawtooth',80,300,1.5,0.08);
}
function nearestShopToEat(){if(!(heroMeter()&&heroMeter().key==='cal')||save.cal>=99.5||P.pos.y>6)return null;let best=null,bd=7;
  for(const s of shops){if(s.prop&&!s.prop.alive)continue;const d=Math.hypot(s.x-P.pos.x,s.z-P.pos.z);if(d<bd){bd=d;best=s;}}return best;}
const MEALS=['a stack of 40 pancakes','twelve burritos','a bucket of noodles','every sandwich they had','a mountain of fries','nine pizzas'];
function eatAt(s){const before=save.cal;save.cal=100;P.en=maxEn();
  const c=center(P);burst(c.x,c.y+0.4,c.z,30,6,0.6,[[1,.85,.3],[1,1,1]],1.2,-3,1.5);SFX.chime();
  toast('Refueled · '+s.name,'You wolfed down '+MEALS[Math.floor(Math.random()*MEALS.length)]+(before<=0?' · full speed again':''),'gold');persist();}
function updateMeters(dt){
  const m=heroMeter();if(!m){P.stormCall=null;return;}
  P.en=maxEn(); // these heroes run on their meter instead of energy
  const cap=meterCap(m);if(!(save[m.key]>=0))save[m.key]=cap;save[m.key]=Math.min(save[m.key],cap);
  if(m.key==='battery'){
    if(P.flying&&save.battery>0&&P.suited!==false){save.battery=Math.max(0,save.battery-0.08*dt);if(save.battery<=0)meterEmpty(m);}
    if(atInventorTower()&&save.battery<cap&&!P.dead){const was=save.battery;save.battery=Math.min(cap,save.battery+cap*0.2*dt);
      if(was<=0||time-(P.chgMsgT||-9)>8){P.chgMsgT=time;feed('Charging at Inventor Tower',save.battery>=cap?'Fully charged':'');}
      if(Math.random()<dt*14){const T=invTower,c=center(P),sx=c.x+rr(-6,6),sz=c.z+rr(-6,6);tracer(sx,c.y+rr(3,8),sz,c.x,c.y,c.z,[.5,.9,1],0.12,0.15);}
      if(save.battery>=cap&&was<cap){toast('Battery full','Suit systems online','cyan');SFX.chime();persist();}}
  }else if(m.key==='bolt'){
    const S=P.stormCall;
    if(S){S.t+=dt;S.next-=dt;{const f=Math.pow(0.8,dt*60);P.vel.x*=f;P.vel.z*=f;}P.hammerUpT=time;
      if(!tallRoofHere()||P.dead||P.stun>0){P.stormCall=null;}
      else if(S.next<=0){S.next=0.45;const c=center(P);bolt(c.x,c.y+2.2,c.z,false,1);save.bolt=Math.min(100,save.bolt+20);addShake(0.25);
        if(save.bolt>=100){P.stormCall=null;toast('The storm answers','Lightning fully charged','cyan');persist();}}}
  }else if(m.key==='cal'){
    const sp=Math.hypot(P.vel.x,P.vel.z);
    if(sp>20&&save.cal>0){save.cal=Math.max(0,save.cal-(0.03+sp*0.0012)*dt);if(save.cal<=0)meterEmpty(m);}
  }
}
function meterPrompt(){const m=heroMeter();if(!m)return '';
  if(m.key==='bolt'&&save.bolt<99.5&&!P.stormCall&&tallRoofHere())return 'G · Raise your hammer and call the storm';
  return '';}
