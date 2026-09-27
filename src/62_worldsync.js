// ================================================================
// Shared city for room-code games
// ================================================================
// The host's game runs the city: people, police, gangs, drones, traffic, rival supers,
// heists and crimes. It streams what is near each player (about 8 times a second), and
// the other games show those as mirrors. Hits on mirrors go to the host, which applies
// them and sends back kills and crime rewards. NPCs can target any player; their hits
// are sent to that player. Destruction (street props, windows, craters) is shared by all.
const WS={mirror:false,host:false,seq:0,byId:new Map(),sendT:0,slowT:0,applying:false,toff:0,hitQ:new Map(),hitT:0,npcQ:new Map(),
  nid(a){return a.nid||(a.nid=++this.seq);},
  players(){const c=[P];if(this.host)for(const r of MP.peers.values())if(r.alive&&r.pos.y>-40)c.push(r);return c;},
  centers(){return this.players().map(a=>a.pos);},
  update(dt){
    const client=P2P.open&&!P2P.host;
    if(client&&!this.mirror)this.enterMirror();else if(!client&&this.mirror)this.exitMirror();
    this.host=P2P.open&&P2P.host&&P2P.conns.size>0;
    if(this.host){this.sendT-=dt;if(this.sendT<=0){this.sendT=0.12;this.slowT-=0.12;const slow=this.slowT<=0;if(slow)this.slowT=1;
      for(const [id,conn] of P2P.conns)if(conn.open)this.snapshotFor(id,conn,slow);}}
    this.hitT-=dt;if(this.hitT<=0){this.hitT=0.1;this.flushHits();}
    if(this.host)this.holdTick(dt);
  },
  // ---------------- host side ----------------
  snapshotFor(id,conn,slow){
    const r=MP.peers.get(id);if(!r||r.pos.y<-40)return;
    const cx=r.pos.x,cz=r.pos.z,near=(a,R)=>Math.abs(a.pos.x-cx)<R&&Math.abs(a.pos.z-cz)<R;
    const known=conn.known||(conn.known=new Set()),seen=new Set(),r1=v=>Math.round(v*10)/10,r2=v=>Math.round(v*100)/100;
    const tgt=t=>!t?0:t===r?-1:t===P?-2:t.kind==='remote'?0:this.nid(t);
    const H=[],V=[],D=[],RV=[],HC=[];
    for(const h of helis){if(!near(h,700))continue;const n=this.nid(h);seen.add(n);HC.push([n,r1(h.pos.x),r1(h.pos.y),r1(h.pos.z),r2(h.yaw),r2(h.rx),r2(h.rz),(h.alive?1:0)|(h.crash?2:0)|(h.leave?4:0),Math.round(h.hp/h.maxHp*100),h.shotN,tgt(h.target)]);}
    for(const h of humans){if(h.hidden||!near(h,230))continue;const n=this.nid(h);seen.add(n);
      const f=(h.air?1:0)|(h.alive?2:0)|(h.downed>0?4:0)|(h.armsUp>0.3?8:0)|(h.gun?16:0)|(time-h.punchT<0.25?32:0)|(h.gun&&h.target?64:0)|(h.rag?128:0);
      const rec=[n,r1(h.pos.x),r1(h.pos.y),r1(h.pos.z),r2(h.yaw),r2(h.rx),r1(h.moving),f,Math.round(h.hp/h.maxHp*100),h.shotN||0,tgt(h.target)];
      if(!known.has(n))rec.push({ro:h.role,lk:lookOut(h.look),nm:h.name||''});H.push(rec);}
    for(const v of vehicles){if(v===P.car||!near(v,280))continue;const n=this.nid(v);seen.add(n);
      const f=(v.siren?1:0)|(v.state==='wreck'?2:0)|(v.alive?4:0);
      const rec=[n,r1(v.pos.x),r1(v.pos.y),r1(v.pos.z),r2(v.yaw),r2(v.rx),r2(v.rz),f,Math.round(v.hp/v.maxHp*100)];
      if(!known.has(n))rec.push({vt:v.vtype,md:v.model,ti:v.tint.slice(0,3).map(r2)});V.push(rec);}
    for(const d of drones){if(!near(d,400))continue;const n=this.nid(d);seen.add(n);
      D.push([n,r1(d.pos.x),r1(d.pos.y),r1(d.pos.z),r2(d.yaw),(d.bag?1:0)|(d.alive?2:0),Math.round(d.hp/d.maxHp*100),d.shotN||0,tgt(d.target)]);}
    for(const q of rivals){if(!near(q,600))continue;const n=this.nid(q);seen.add(n);
      const rec=[n,r1(q.pos.x),r1(q.pos.y),r1(q.pos.z),r2(q.heroYaw),r2(q.tilt),r2(q.bank),(q.alive?1:0)|(time-(q.castT||-9)<0.3?2:0),Math.round(q.hp/q.maxHp*100),r1(q.vel.x),r1(q.vel.y),r1(q.vel.z)];
      if(!known.has(n))rec.push({nm:q.name,fa:q.faction,lv:q.level,lk:[q.look.suit,q.look.cape,q.look.acc].map(c=>c.slice(0,3).map(r2)).concat([q.look.capeOn?1:0]),rb:q.robot?1:0,gs:q.giantS||1});RV.push(rec);}
    const msg={h:H,v:V,d:D,r:RV,hc:HC},rm=[];for(const n of known)if(!seen.has(n))rm.push(n);if(rm.length)msg.rm=rm;conn.known=seen;
    if(boss){const b=boss;msg.b=[this.nid(b),b.type,r1(b.pos.x),r1(b.pos.y),r1(b.pos.z),r2(b.yaw||0),r2(b.spin||0),Math.round(b.hp),Math.round(b.maxHp),r2(b.phase||0),r2(b.punchAnim||0),b.name||'',b.leave?1:0];}
    if(slow){msg.c=crimes.map(c=>[c.type,Math.round(c.x),Math.round(c.z),c.label,c.icon||'',c.heist?1:0]);msg.tod=Math.round(tod*1e4)/1e4;msg.tm=r1(time);msg.vy=r1(vaultY);
      msg.pp=props.map(p=>p.alive?1:0).join('');}
    P2P.sendTo(id,{t:'ws',d:msg});
  },
  onClientHit(peer,d){
    if(!this.host||!d)return;const src=MP.peers.get(peer);if(!src)return;
    const t=this.find(+d.id);if(!t||!t.alive)return;const n=v=>{v=+v;return isFinite(v)?v:0;};
    const v3=a=>Array.isArray(a)&&a.length===3?a.map(x=>clamp(n(x),-240,240)):null;
    const opt={knock:clamp(n(d.k),0,40),stun:clamp(n(d.s),0,2)};const kv=v3(d.v);if(kv)opt.kv=kv;
    if(Array.isArray(d.n)&&d.n.length===2)opt.nudge=d.n.map(x=>clamp(n(x),-1,1));if(d.f)opt.flung=true;if(d.ap)opt.apex=true;if(d.fl)opt.float=clamp(n(d.fl),0,1);
    if(d.b)opt.burn={dps:clamp(n(d.b[0]),0,40),time:clamp(n(d.b[1]),0,6)};
    Damage.apply(src,t,clamp(n(d.a),0,600),String(d.ty||'hit').slice(0,12),opt);
    const fv=v3(d.fv);if(fv&&t.kind==='vehicle'&&t.alive&&t.vtype!=='truck'&&t!==P.car){if(t.driver)ejectDriver(t);t.state='thrown';t.vel.set(fv[0]*0.7,Math.max(6,fv[1]*0.6),fv[2]*0.7);t.sx=rr(-3,3);t.sy=rr(-2,2);t.sz=rr(-3,3);t.life=4;t.thrower=src;t.throwDmg=40;}
  },
  onTake(peer,d){if(!this.host||!d)return;const v=this.find(+d.id);if(v&&v.kind==='vehicle'&&v!==P.car){if(v.driver)ejectDriver(v);removeActor(v);}},
  find(n){if(!n)return null;for(const a of actors)if(a.nid===n)return a;return boss&&boss.nid===n?boss:null;},
  // NPC hits on another player: batched and sent to that player
  npcHit(t,src,amount,type,opt){
    let q=this.npcQ.get(t.peer);if(!q){q={a:0,k:0,sx:0,sz:0,n:0,ty:type};this.npcQ.set(t.peer,q);}
    q.a+=amount;q.k=Math.max(q.k,(opt&&opt.knock)||0);if(src&&src.pos){q.sx=src.pos.x;q.sz=src.pos.z;q.n=this.nid(src);}q.ty=type;return amount;
  },
  crimeReward(c){if(!c.helpers)return;const xp=c.heist?CRIMES.clearXp*3:CRIMES.clearXp,rep=c.heist?CRIMES.clearRep*3:CRIMES.clearRep;
    for(const p of c.helpers)P2P.sendTo(p,{t:'rw',d:{k:'crime',xp,rep,label:c.label,heist:c.heist?1:0}});},
  // ---------------- client side ----------------
  enterMirror(){
    this.mirror=true;lockT=null;if(P.tk)tkDrop();
    for(const a of [...humans,...drones,...rivals,...helis])removeActor(a);for(const v of vehicles.slice())if(v!==P.car)removeActor(v);
    crimes.length=0;boss=null;this.byId.clear();
    if(state==='play')feed('Shared city','You are in the host’s city now');
  },
  exitMirror(){
    this.mirror=false;this.toff=0;for(const m of this.byId.values())removeActor(m);this.byId.clear();crimes.length=0;if(boss&&boss.net)boss=null;
    for(const a of [...humans,...drones,...rivals])if(a.net)removeActor(a);
    seedTraffic();
  },
  onSnapshot(d){
    if(!this.mirror||!d||typeof d!=='object')return;
    const n=v=>{v=+v;return isFinite(v)?v:0;},L=LIMIT+50,px=v=>clamp(n(v),-L,L);
    if(Array.isArray(d.rm))for(const id of d.rm){const m=this.byId.get(id);if(m){this.byId.delete(id);if(m.kind==='heli'&&m.crash)explode(m.pos.x,m.pos.y+1,m.pos.z,1.6);if(m===boss)boss=null;else removeActor(m);}}
    for(const r of Array.isArray(d.h)?d.h:[]){if(!Array.isArray(r))continue;let m=this.byId.get(r[0]);
      if(!m){const full=r[11];if(!full||!NPCS[full.ro])continue;m=mirrorHuman(r[0],full);}
      this.place(m,px(r[1]),n(r[2]),px(r[3]));m.yaw=n(r[4]);m.trx=n(r[5]);m.moving=n(r[6]);const f=r[7]|0;
      m.air=!!(f&1);m.alive=!!(f&2);m.downed=f&4?1:0;m.armsUp=f&8?1:0;m.gun=!!(f&16);if(f&32)m.punchT=time;m.aiming=!!(f&64);if(f&128){if(!m.rag)startRagdoll(m,m.nv.x,m.nv.y,m.nv.z);}m.hp=m.maxHp*clamp(n(r[8]),0,100)/100;
      if(r[9]!==m.shotN){if(m.shotN!==undefined)mirrorShot(m,r[10],false);m.shotN=r[9];}}
    for(const r of Array.isArray(d.v)?d.v:[]){if(!Array.isArray(r))continue;let m=this.byId.get(r[0]);
      if(!m){const full=r[9];if(!full)continue;m=mirrorVehicle(r[0],full);if(!m)continue;}
      this.place(m,px(r[1]),n(r[2]),px(r[3]));m.tyaw=n(r[4]);m.rx=n(r[5]);m.rz=n(r[6]);const f=r[7]|0;m.siren=!!(f&1);m.state=f&2?'wreck':'road';m.alive=!!(f&4);m.hp=m.maxHp*clamp(n(r[8]),0,100)/100;}
    for(const r of Array.isArray(d.d)?d.d:[]){if(!Array.isArray(r))continue;let m=this.byId.get(r[0]);if(!m)m=mirrorDrone(r[0]);
      this.place(m,px(r[1]),n(r[2]),px(r[3]));m.tyaw=n(r[4]);const f=r[5]|0;m.bag=!!(f&1);const was=m.alive;m.alive=!!(f&2);m.hp=m.maxHp*clamp(n(r[6]),0,100)/100;
      if(was&&!m.alive)explode(m.pos.x,m.pos.y,m.pos.z,0.55);
      if(r[7]!==m.shotN){if(m.shotN!==undefined)mirrorShot(m,r[8],true);m.shotN=r[7];}}
    for(const r of Array.isArray(d.r)?d.r:[]){if(!Array.isArray(r))continue;let m=this.byId.get(r[0]);
      if(!m){const full=r[12];if(!full)continue;m=mirrorRival(r[0],full);}
      this.place(m,px(r[1]),n(r[2]),px(r[3]));m.tyaw=n(r[4]);m.tilt=n(r[5]);m.bank=n(r[6]);const f=r[7]|0;m.alive=!!(f&1);if(f&2)m.castT=time;m.hp=m.maxHp*clamp(n(r[8]),0,100)/100;m.vel.set(n(r[9]),n(r[10]),n(r[11]));}
    for(const r of Array.isArray(d.hc)?d.hc:[]){if(!Array.isArray(r))continue;let m=this.byId.get(r[0]);if(!m)m=mirrorHeli(r[0]);
      this.place(m,px(r[1]),n(r[2]),px(r[3]));m.tyaw=n(r[4]);m.rx=n(r[5]);m.rz=n(r[6]);const f=r[7]|0;const was=m.crash;m.alive=!!(f&1);m.crash=!!(f&2);m.leave=!!(f&4);m.hp=m.maxHp*clamp(n(r[8]),0,100)/100;
      m.target=r[10]===-1?P:null;if(m.crash&&!was)burst(m.pos.x,m.pos.y+1.5,m.pos.z,50,16,0.8,FIRE,2.4,-3,1.5);
      if(r[9]!==m.shotN){if(m.shotN!==undefined)mirrorShot(m,r[10],false);m.shotN=r[9];}}
    if(Array.isArray(d.b)){const b=d.b;let m=this.byId.get(b[0]);if(!m){m=mirrorBoss(b[0],b[1]==='ship'?'ship':'mech',String(b[11]||'').slice(0,30));}
      boss=m;this.place(m,px(b[2]),n(b[3]),px(b[4]));m.tyaw=n(b[5]);m.spin=n(b[6]);m.hp=n(b[7]);m.maxHp=Math.max(1,n(b[8]));m.phase=n(b[9]);m.punchAnim=n(b[10]);m.leave=!!b[12];}
    else if(boss&&boss.net){this.byId.delete(boss.nid);boss=null;}
    if(Array.isArray(d.c)){crimes.length=0;for(const c of d.c)if(Array.isArray(c))crimes.push({type:String(c[0]),x:n(c[1]),z:n(c[2]),label:String(c[3]||'').slice(0,40),icon:String(c[4]||'').slice(0,2),heist:!!c[5],actors:[],mirror:true,update:()=>'active'});}
    if(d.tod!==undefined){const t=clamp(n(d.tod),0,1);let dd=t-tod;if(dd>0.5)dd-=1;if(dd<-0.5)dd+=1;if(Math.abs(dd)>0.01)tod=t;this.toff=n(d.tm)-time;}
    if(d.vy!==undefined)vaultY=n(d.vy);
    if(typeof d.pp==='string')props.forEach((p,i)=>{const a=d.pp[i]==='1';if(p.alive!==a){p.alive=a;if(a)p.hp=p.maxHp;}});
  },
  place(m,x,y,z){if(m.stamp!==undefined){const dt=Math.max(0.05,time-m.stamp);m.nv.set((x-m.tp.x)/dt,(y-m.tp.y)/dt,(z-m.tp.z)/dt);}else{m.pos.set(x,y,z);}
    m.tp.set(x,y,z);m.stamp=time;},
  updateMirrors(dt){
    const k=damp(12,dt);
    for(const m of this.byId.values()){
      const age=Math.min(time-m.stamp,0.3),tx=m.tp.x+m.nv.x*age,ty=m.tp.y+m.nv.y*age,tz=m.tp.z+m.nv.z*age;
      if(P.tk&&(P.tk.a===m||P.tk.more.includes(m)))continue; // I'm holding it: my telekinesis moves it here
      if(Math.hypot(tx-m.pos.x,tz-m.pos.z)>40)m.pos.set(tx,ty,tz);else{m.pos.x+=(tx-m.pos.x)*k;m.pos.y+=(ty-m.pos.y)*k;m.pos.z+=(tz-m.pos.z)*k;}
      if(m.flash>0)m.flash=Math.max(0,m.flash-dt*5);
      if(m.kind==='human'){m.rx=lerp(m.rx,m.trx||0,damp(10,dt));m.phase+=m.moving*dt*2.2;m.target=m.aiming?P:null;}
      else if(m.kind==='vehicle'||m.kind==='drone'||m.kind==='boss')m.yaw=angLerp(m.yaw,m.tyaw||0,k);
      else if(m.kind==='heli'){m.yaw=angLerp(m.yaw,m.tyaw||0,k);m.rotor+=dt*(m.crash?20:38);if(m.crash&&Math.random()<0.8)smoke(m.pos.x,m.pos.y+2,m.pos.z,1,0.6,3,2,0.12);}
      else if(m.kind==='rival'){m.heroYaw=angLerp(m.heroYaw,m.tyaw||0,k);mirrorRivalAnim(m,dt);}
    }
  },
  sendHit(t,amount,type,opt){
    let q=this.hitQ.get(t.nid);if(!q){q={id:t.nid,a:0,ty:type};this.hitQ.set(t.nid,q);}
    q.a+=amount;q.ty=type;if(!opt)return;
    if(opt.knock)q.k=Math.max(q.k||0,opt.knock);if(opt.stun)q.s=Math.max(q.s||0,opt.stun);if(opt.kv)q.v=opt.kv.map(v=>Math.round(v*10)/10);if(opt.nudge)q.n=opt.nudge;
    if(opt.flung)q.f=1;if(opt.apex)q.ap=1;if(opt.float)q.fl=opt.float;if(opt.burn)q.b=[opt.burn.dps,opt.burn.time];if(opt.fling)q.fv=opt.fling.map(v=>Math.round(v));
  },
  flushHits(){
    if(this.hitQ.size){if(P2P.open&&!P2P.host)for(const q of this.hitQ.values()){q.a=Math.round(q.a*10)/10;P2P.emit('nh',q);}this.hitQ.clear();}
    if(this.npcQ.size){if(this.host)for(const [peer,q] of this.npcQ)P2P.sendTo(peer,{t:'ph',d:{a:Math.round(q.a*10)/10,k:Math.round(q.k),sx:Math.round(q.sx),sz:Math.round(q.sz),n:q.n,ty:String(q.ty).slice(0,12)}});this.npcQ.clear();}
  },
  onNpcHit(d){
    if(!d||P.dead||state!=='play')return;const n=v=>{v=+v;return isFinite(v)?v:0;};
    const src=this.byId.get(d.n)||{kind:'human',pos:new V3(n(d.sx),P.pos.y,n(d.sz)),name:''};
    Damage.apply(src,P,clamp(n(d.a),0,300),String(d.ty||'hit').slice(0,12),{knock:clamp(n(d.k),0,40)});
  },
  onReward(d){
    if(!d||state!=='play')return;
    if(d.k==='kill'){const t={kind:String(d.kind),role:NPCS[d.role]?d.role:'thug',type:d.type==='ship'?'ship':'mech',level:clamp(+d.level||1,1,100),faction:d.faction==='hero'?'hero':'villain',bounty:!!d.bounty,name:String(d.name||'').slice(0,30),crime:null,pos:P.pos};
      if(['human','drone','rival','boss'].includes(t.kind))Bus.emit('defeated',{target:t,killer:P});}
    else if(d.k==='crime'){const xp=clamp(+d.xp||0,0,1000),rep=clamp(+d.rep||0,0,500);addXP(xp);addRep(rep);save.stats.crimesStopped++;guideDone('crime');
      if(d.heist){toast('Heist stopped','+'+xp+' XP · '+String(d.label||'').slice(0,40),'gold');Portal.happy();}else feed('+'+xp+' XP','Crime stopped: '+String(d.label||'').slice(0,40));persist();}
  },
  onTkGrab(peer,d){if(!this.host||!d)return;const a=this.find(+d.id),r=MP.peers.get(peer);if(!a||!r||a.held||a.kind==='boss'||a.kind==='heli')return;
    a.held=true;a.heldBy=r;a.heldT=time;if(a.kind==='vehicle'){a.state='held';if(a.driver)ejectDriver(a);}if(a.kind==='human')a.air=false;},
  onTkThrow(peer,d){if(!this.host||!d)return;const a=this.find(+d.id);if(!a||!a.heldBy||a.heldBy.peer!==peer)return;const src=a.heldBy;a.heldBy=null;a.held=false;
    const v=Array.isArray(d.v)?d.v.map(x=>clamp(+x||0,-120,120)):[0,0,0],dmg=clamp(+d.d||0,0,400),sp=Math.hypot(...v);
    if(a.kind==='vehicle'){a.state='thrown';a.vel.set(...v);a.sx=sp?rr(-3,3):0;a.sy=sp?rr(-2,2):0;a.sz=sp?rr(-3,3):0;a.life=6;a.thrower=src;a.throwDmg=dmg||10;}
    else if(a.kind==='human'){a.air=true;a.vel.set(...v);a.tumble=sp?rr(6,10):0;if(dmg)a.thrown={by:src,dmg};}else{a.vel.set(...v);if(dmg)a.thrown={by:src,dmg};a.stun=1;}},
  holdTick(dt){for(const a of actors){const r=a.heldBy;if(!r)continue;
    if(!r.tk&&time-(a.heldT||0)<1.2)continue; // the holder's first hold point is still on its way
    if(!MP.peers.has(r.peer)||!r.tk){a.heldBy=null;a.held=false;if(a.kind==='human')a.air=true;else if(a.kind==='vehicle'){a.state='thrown';a.vel.set(0,0,0);a.life=6;}continue;}
    const k=damp(9,dt);a.pos.x+=(r.tk.x-a.pos.x)*k;a.pos.y+=(r.tk.y-a.pos.y)*k;a.pos.z+=(r.tk.z-a.pos.z)*k;if(a.vel)a.vel.set(0,0,0);a.stun=Math.max(a.stun||0,0.3);}},
  take(v){if(!v.net)return;this.byId.delete(v.nid);P2P.emit('tk',{id:v.nid});v.net=false;v.nid=null;v.state='parked';},
  // ---------------- shared destruction ----------------
  destroyed(k,d){if(this.applying||!P2P.open)return;const o={k};for(const key in d)o[key]=typeof d[key]==='number'?Math.round(d[key]*100)/100:d[key];P2P.emit('dx',o);},
  onDestroy(d){
    if(!d||typeof d!=='object')return;const n=v=>{v=+v;return isFinite(v)?v:0;};this.applying=true;
    try{
      if(d.k==='pb'){const l=blockProps[d.bi|0];const p=l&&l[d.i|0];if(p&&p.alive)breakProp(p,null);}
      else if(d.k==='wb'){const b=colliders[d.ci|0];if(b)breakWindowAt(b,n(d.x),n(d.y),n(d.z));}
      else if(d.k==='bc'){const b=bldgs[d.id|0];if(b)collapseBuilding(b,clamp(n(d.dx),-1,1),clamp(n(d.dz),-1,1),false);}
      else if(d.k==='cr'){const x=n(d.x),z=n(d.z);if(Math.hypot(x-P.pos.x,z-P.pos.z)<600)crater(x,n(d.y),z,clamp(n(d.nx),-1,1),clamp(n(d.ny),-1,1),clamp(n(d.nz),-1,1),clamp(n(d.r),0.5,8));}
    }finally{this.applying=false;}
  },
};
MP.world=WS;
function lookOut(L){const r2=v=>Math.round(v*1000)/1000;const c=x=>x?x.slice(0,3).map(r2):0;return [c(L.shirt),c(L.pants),c(L.skin),c(L.hat),(L.mask?1:0)|(L.badge?2:0)|(L.gold?4:0)];}
function lookIn(a){const c=x=>Array.isArray(x)?[...x.slice(0,3).map(v=>clamp(+v||0,0,1)),1]:null;const f=a[4]|0;
  return {shirt:c(a[0])||[.5,.5,.5,1],pants:c(a[1])||[.2,.2,.2,1],skin:c(a[2])||SKINS[0],hat:c(a[3]),mask:!!(f&1),badge:!!(f&2),gold:!!(f&4)};}
function mirrorBase(nid){return {net:true,nid,alive:true,pos:new V3(),tp:new V3(),nv:new V3(),vel:new V3(),flash:0,stun:0,slow:0,slowT:0,burn:0,held:false,crime:null};}
function mirrorHuman(nid,full){
  const role=full.ro,h=Object.assign(mirrorBase(nid),{kind:'human',role,faction:role==='civilian'?'civilian':role==='police'?'police':'criminal',hp:NPCS[role].hp,maxHp:NPCS[role].hp,
    yaw:0,rx:0,trx:0,moving:0,phase:rr(0,TAU),look:Array.isArray(full.lk)?lookIn(full.lk):LOOKS[role](),air:false,hidden:false,gun:false,target:null,punchT:-9,armsUp:0,downed:0,radius:0.55,cy:1.1,ys:0.6});
  if(full.nm)h.name=String(full.nm).slice(0,30);
  WS.byId.set(nid,h);humans.push(h);actors.push(h);return h;
}
function mirrorVehicle(nid,full){
  const vt=['car','police','van','truck'].includes(full.vt)?full.vt:'car',model=vt==='van'||vt==='truck'?vt:CARS[full.md]?full.md:'sedan';if(!VDIM[model])return null;
  const hp=vt==='police'?90:NPCS[vt].hp,ti=Array.isArray(full.ti)?[...full.ti.slice(0,3).map(v=>clamp(+v||0,0,1)),1]:[1,1,1,1];
  const v=Object.assign(mirrorBase(nid),{kind:'vehicle',vtype:vt,model,faction:'object',hp,maxHp:hp,mesh:vt==='van'?vanMesh:vt==='truck'?truckMesh:CARS[model],hw:VDIM[model][0],hl:VDIM[model][1],
    tint:ti,yaw:0,tyaw:0,rx:0,rz:0,state:'road',siren:false,spd:0,cy:1.1*VEH_S,radius:(vt==='truck'?3:vt==='van'?2.8:2.3)*VEH_S,ys:1.4,driver:null,temp:false});
  WS.byId.set(nid,v);vehicles.push(v);actors.push(v);return v;
}
function mirrorDrone(nid){const d=Object.assign(mirrorBase(nid),{kind:'drone',role:'thief',faction:'criminal',hp:NPCS.drone.hp,maxHp:NPCS.drone.hp,yaw:0,tyaw:0,cy:0,radius:1.7,bag:false,seed:rr(0,100)});
  WS.byId.set(nid,d);drones.push(d);actors.push(d);return d;}
function mirrorRival(nid,full){
  const c=x=>Array.isArray(x)?[...x.slice(0,3).map(v=>clamp(+v||0,0,1)),1]:[.5,.5,.5,1],lk=Array.isArray(full.lk)?full.lk:[];
  const suit=c(lk[0]);const lv=clamp(+full.lv||1,1,100),hp=NPCS.rival.hp+NPCS.rival.hpPerLvl*lv;
  const r=Object.assign(mirrorBase(nid),{kind:'rival',name:String(full.nm||'Rival').slice(0,30),faction:full.fa==='hero'?'hero':'villain',level:lv,hp,maxHp:hp,heroYaw:0,tyaw:0,tilt:0,bank:0,
    look:{suit,suit2:[suit[0]*0.6,suit[1]*0.6,suit[2]*0.6,1],cape:c(lk[1]),acc:c(lk[2]),capeOn:!!lk[3],metal:false,armor:!!full.rb,visor:c(lk[2]).slice(0,3)},robot:!!full.rb,giantS:clamp(+full.gs||1,1,3),anim:{legL:0,legR:0,kneeL:0,kneeR:0,armL:0,armR:0,elbL:-0.3,elbR:-0.3,armLz:-0.12,armRz:0.12,cape:0.2},
    eye:new V3(),radius:0.9,cy:1.3,ys:0.55,castT:-9,phase:0,firing:false});
  WS.byId.set(nid,r);rivals.push(r);actors.push(r);return r;
}
function mirrorHeli(nid){const h=Object.assign(mirrorBase(nid),{kind:'heli',faction:'police',hp:450,maxHp:450,yaw:0,tyaw:0,rx:0,rz:0,rotor:0,crash:false,leave:false,target:null,cy:1.6,radius:3.6,ys:0.5});
  WS.byId.set(nid,h);helis.push(h);actors.push(h);return h;}
function mirrorBoss(nid,type,name){const b=Object.assign(mirrorBase(nid),{kind:'boss',type,name:name||(type==='ship'?'Mothership':'Titan mech'),hp:1,maxHp:1,yaw:0,tyaw:0,spin:0,phase:0,punchAnim:0,
  cy:type==='ship'?0:22,radius:type==='ship'?16:11,ys:type==='ship'?0.3:0.55,leave:false});WS.byId.set(nid,b);return b;}
function mirrorRivalAnim(r,dt){
  const a=r.anim,hs=Math.hypot(r.vel.x,r.vel.z),kk=damp(12,dt);
  if(r.pos.y>groundY(r.pos.x,r.pos.z,r.pos.y+1)+1.5){a.armR=lerp(a.armR,hs>20?-2.95:-0.3,kk);a.armL=lerp(a.armL,-0.2,kk);a.legL=lerp(a.legL,0.05,kk);a.legR=lerp(a.legR,0.2,kk);a.kneeL=lerp(a.kneeL,0.1,kk);a.kneeR=lerp(a.kneeR,0.3,kk);}
  else{r.phase+=dt*hs*0.3;const sw=Math.sin(r.phase)*Math.min(hs/14,1.2)*0.9;a.legL=sw;a.legR=-sw;a.armL=-sw*0.8;a.armR=sw*0.8;a.kneeL=Math.max(0,-Math.sin(r.phase))*Math.min(hs/10,1)*1.1;a.kneeR=Math.max(0,Math.sin(r.phase))*Math.min(hs/10,1)*1.1;}
  a.cape=0.2+clamp(hs/40,0,1);if(time-r.castT<0.3){a.armR=-1.6;a.elbR=0;}
}
// a gunshot or drone laser from a mirror, drawn toward whoever it was aimed at
function mirrorShot(m,tg,laser){
  let tx,ty,tz;if(tg===-1){tx=P.pos.x;ty=P.pos.y+1.3;tz=P.pos.z;}else{const o=tg>0?WS.byId.get(tg):null;if(o){const c=center(o);tx=c.x;ty=c.y;tz=c.z;}else{tx=m.pos.x+Math.sin(m.yaw||0)*20;ty=m.pos.y+1.4;tz=m.pos.z+Math.cos(m.yaw||0)*20;}}
  const oy=m.pos.y+(laser?0:1.4);
  if(laser){tracer(m.pos.x,oy,m.pos.z,tx+rr(-1,1),ty+rr(-1,1),tz+rr(-1,1),[1,.2,.15],0.12,0.12);SFX.zap(SFX.vol(m.pos.x,m.pos.y,m.pos.z));}
  else{tracer(m.pos.x,oy,m.pos.z,tx+rr(-1,1),ty+rr(-1,1),tz+rr(-1,1),[1,.85,.5],0.05,0.06);SFX.gun(SFX.vol(m.pos.x,m.pos.y,m.pos.z));}
}
Bus.on('damaged',({source,target})=>{if(WS.host&&source&&source.kind==='remote'&&target&&target.crime)(target.crime.helpers||(target.crime.helpers=new Set())).add(source.peer);});
Bus.on('defeated',({target,killer})=>{if(!WS.host||!killer||killer.kind!=='remote'||!target)return;
  P2P.sendTo(killer.peer,{t:'rw',d:{k:'kill',kind:target.kind,role:target.role,type:target.type,level:target.level,faction:target.faction,bounty:target.bounty?1:0,name:target.name||''}});});
