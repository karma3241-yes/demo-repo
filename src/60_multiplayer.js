// ================================================================
// Multiplayer: other players via the claude.ai room capability
// ================================================================
// Everyone playing the claude.ai version at the same time sees each other.
// Each player's own city (NPCs, crimes, traffic) runs on their own device; players,
// their attacks and PvP damage are shared. The shooter decides hits, the victim applies them.
const MP={room:null,myPeer:null,peers:new Map(),connected:false,sendT:0,last:'',dirty:true,hitT:0,
  bump(){this.dirty=true;},
  tried:false,
  // one-line room status for the HUD and menu ('' outside claude.ai)
  status(){
    if(!window.claude)return '';if(!this.room)return this.tried?'Multiplayer unavailable for this view':'Connecting to other players…';
    if(!this.connected)return 'Connecting to other players…';
    let others=0;try{for(const p of this.room.peers())if(!p.isMe&&p.kind==='viewer')others++;}catch(e){}
    const playing=this.peers.size;
    if(!others)return 'Online · no one else here yet';
    const menu=others-playing;return 'Online · '+(playing?playing+' playing':'')+(playing&&menu>0?', ':'')+(menu>0?menu+' in the menu':'');
  },
  async init(){
    try{
      if(!window.claude||typeof window.claude.use!=='function')return;
      const room=await window.claude.use('room');this.tried=true;if(!room)return;this.room=room;
      room.onPeers(ch=>{
        for(const p of ch.peers)if(p.isMe&&p.sameTab)this.myPeer=p.peer;
        for(const p of ch.joined)if(!p.isMe)this.upsert(p,true);
        for(const p of ch.updated)if(!p.isMe)this.upsert(p,false);
        for(const p of ch.left)this.remove(p.peer);
      },()=>{});
      room.on('hit',m=>this.onHit(m),()=>{});room.on('down',m=>this.onDown(m),()=>{});room.on('fx',m=>this.onFx(m),()=>{});
      room.onConnection(c=>{this.connected=c;if(c)this.dirty=true;},()=>{});
    }catch(e){this.room=null;this.tried=true;}
  },
  upsert(peer,joined){
    const pr=peer.presence||{};if(pr.v!==1)return;
    let r=this.peers.get(peer.peer);
    if(!r){r=makeRemote(peer.peer);this.peers.set(peer.peer,r);actors.push(r);if(state==='play')feed((cleanName(pr.n||'')||'A hero')+' is here',repTier(+pr.rep||0).name);}
    applyPresence(r,pr);
  },
  remove(id){const r=this.peers.get(id);if(!r)return;this.peers.delete(id);removeFrom(actors,r);if(state==='play')feed(r.name+' left','');},
  canFight(t){const a=playerFaction(),b=t.faction;return !(a!=='neutral'&&a===b);},
  hit(t,amount,type,opt){
    if(!this.room||P.dead||state!=='play')return 0;
    if(!this.canFight(t)){if(time-(t.ffT||-9)>2){t.ffT=time;feed('Same side','You and '+t.name+' are both '+(t.faction==='hero'?'heroes':'villains'));}return 0;}
    dmgNum(t,amount);hitMarkT=time;t.flash=1;t.pend=(t.pend||0)+amount;t.pendType=type;t.pendK=Math.max(t.pendK||0,(opt&&opt.knock)||0);
    return amount;
  },
  flush(dt){
    if(!this.room)return;
    this.hitT-=dt;if(this.hitT<=0){this.hitT=0.12;
      for(const r of this.peers.values())if(r.pend>0){const d={to:r.peer,a:Math.round(r.pend*10)/10,t:String(r.pendType||'hit').slice(0,12),k:Math.round(r.pendK||0),x:Math.round(P.pos.x),z:Math.round(P.pos.z)};
        r.pend=0;r.pendK=0;this.room.emit('hit',d).catch(()=>{});}}
    this.sendT-=dt;if(this.sendT>0)return;this.sendT=0.08;
    const pr=myPresence(),key=JSON.stringify(pr);if(key===this.last&&!this.dirty)return;this.last=key;this.dirty=false;
    this.room.presence(pr).catch(()=>{});
  },
  onHit(m){
    if(!m||m.isMe||!m.data||m.data.to!==this.myPeer||P.dead||state!=='play')return;
    const src=this.peers.get(m.peer)||null;const amt=clamp(+m.data.a||0,0,250);if(!(amt>0))return;
    if(src&&!this.canFight(src))return;
    Damage.apply(src,P,amt,'pvp',{knock:clamp(+m.data.k||0,0,40)});
  },
  sendDown(killer){if(!this.room||!killer||killer.kind!=='remote')return;
    this.room.emit('down',{to:killer.peer,lv:save.level,fac:playerFaction(),b:hasBounty()?1:0}).catch(()=>{});},
  onDown(m){
    if(!m||m.isMe||!m.data||m.data.to!==this.myPeer)return;
    const r=this.peers.get(m.peer),lv=clamp(Math.floor(+m.data.lv||1),1,100),fac=m.data.fac;
    let xp=NPCS.rival.xp+NPCS.rival.xpPerLvl*lv,rep=fac==='villain'?25:fac==='hero'?-25:0;if(m.data.b){xp*=2;rep*=2;}
    addXP(xp);addRep(rep);save.stats.defeated++;toast('You defeated '+(r?r.name:'a player'),'+'+xp+' XP'+(rep?' · '+(rep>0?'+':'')+rep+' rep':''),'gold');
  },
  fx(k,d){if(this.room&&this.connected)this.room.emit('fx',Object.assign({k},d)).catch(()=>{});},
  onFx(m){
    if(!m||m.isMe||!m.data)return;const d=m.data,r=this.peers.get(m.peer);if(!r)return;
    const n=v=>{v=+v;return isFinite(v)?v:0;};
    if(d.k==='p')fireProj({kind:d.pk==='fire'?'fire':'blast',owner:r,visual:true,x:n(d.x),y:n(d.y),z:n(d.z),vx:n(d.vx),vy:n(d.vy),vz:n(d.vz),dmg:0,radius:3,knock:0,r:0.5,life:3});
    else if(d.k==='b')bolt(n(d.x),n(d.y),n(d.z),true);
    else if(d.k==='s'){const R=clamp(n(d.r),2,60);ringFx(n(d.x),n(d.y),n(d.z),1,R,0.5,[.45,.85,1]);SFX.boom(0.6*SFX.vol(n(d.x),n(d.y),n(d.z)),1);}
    else if(d.k==='t'){ringFx(r.pos.x,r.pos.y+1.5,r.pos.z,1,8,0.6,BAND_COL);burst(r.pos.x,r.pos.y+1.5,r.pos.z,50,14,0.8,[BAND_COL,[1,1,1]],1.4,0,2);}
  },
};
const FLAG={fly:1,speed:2,wall:4,web:8,charge:16,fire:32,shield:64,metal:128,dead:256,invis:512,car:1024};
function myPresence(){
  const ch=save.character||{};let f=0;
  if(P.flying)f|=FLAG.fly;if(P.speeding)f|=FLAG.speed;if(P.wall)f|=FLAG.wall;if(P.web)f|=FLAG.web;if(P.charging)f|=FLAG.charge;if(beam)f|=FLAG.fire;
  if(P.shieldOn)f|=FLAG.shield;if(P.metal)f|=FLAG.metal;if(P.dead)f|=FLAG.dead;if(P.invisible>0)f|=FLAG.invis;if(P.car)f|=FLAG.car;
  const r1=v=>Math.round(v*10)/10,r2=v=>Math.round(v*100)/100;
  const o={v:1,n:ch.name||'Hero',l:[ch.suit|0,ch.cape|0,ch.accent|0,ch.capeOn===false?0:1],lv:save.level,rep:save.reputation,fac:playerFaction(),al:P.alien?P.alien.id:'',
    x:r1(P.pos.x),y:r1(P.pos.y),z:r1(P.pos.z),vx:r1(P.vel.x),vy:r1(P.vel.y),vz:r1(P.vel.z),yw:r2(P.heroYaw),tl:r2(P.tilt),bk:r2(P.bank),f,hp:Math.round(P.hp/maxHp()*100)};
  // presence patches merge on the server, so optional fields are always sent (null clears them)
  o.b=beam?[r1(beam.x),r1(beam.y),r1(beam.z)]:null;o.w=P.web?[r1(P.web.x),r1(P.web.y),r1(P.web.z)]:null;o.c=null;
  if(P.car){o.c=[P.car.model,r2(P.car.yaw),P.car.tint.slice(0,3).map(r2)];o.x=r1(P.car.pos.x);o.y=r1(P.car.pos.y);o.z=r1(P.car.pos.z);}
  return o;
}
function makeRemote(peer){
  return {kind:'remote',peer,name:'Hero',faction:'neutral',level:1,alive:true,hp:100,maxHp:100,pos:new V3(0,-50,0),vel:new V3(),tp:new V3(0,-50,0),stamp:0,heroYaw:0,tilt:0,bank:0,
    anim:{legL:0,legR:0,kneeL:0,kneeR:0,armL:0,armR:0,elbL:0,elbR:0,armLz:-0.12,armRz:0.12,cape:0.2},look:null,flags:0,beam:null,web:null,eye:new V3(),radius:0.9,cy:1.3,ys:0.55,
    flash:0,stun:0,slow:0,slowT:0,burn:0,alien:'',car:null,phase:0,firing:false};
}
function applyPresence(r,p){
  const n=v=>{v=+v;return isFinite(v)?v:0;};
  r.name=cleanName(String(p.n||''))||'Hero';r.level=clamp(Math.floor(n(p.lv)),1,100);r.faction=['hero','villain','neutral'].includes(p.fac)?p.fac:'neutral';r.rep=n(p.rep);
  const l=Array.isArray(p.l)?p.l:[0,0,0,1];const su=clamp(l[0]|0,0,SUIT_OPTS.length-1),ca=clamp(l[1]|0,0,CAPE_OPTS.length-1),ac=clamp(l[2]|0,0,ACC_OPTS.length-1);
  r.look={suit:c4(SUIT_OPTS[su]),suit2:[...hex(SUIT_OPTS[su],0.6),1],cape:c4(CAPE_OPTS[ca]),acc:c4(ACC_OPTS[ac]),capeOn:!!l[3],metal:false};
  r.flags=n(p.f)|0;r.look.metal=!!(r.flags&FLAG.metal);r.alien=ALIENS[p.al]?p.al:'';
  r.tp.set(n(p.x),n(p.y),n(p.z));r.vel.set(n(p.vx),n(p.vy),n(p.vz));r.stamp=time;r.tyaw=n(p.yw);r.ttilt=n(p.tl);r.tbank=n(p.bk);r.hp=clamp(n(p.hp),0,100);
  r.beam=Array.isArray(p.b)?{x:n(p.b[0]),y:n(p.b[1]),z:n(p.b[2])}:null;r.web=Array.isArray(p.w)?{x:n(p.w[0]),y:n(p.w[1]),z:n(p.w[2])}:null;
  r.car=Array.isArray(p.c)&&CARS[p.c[0]]?{model:p.c[0],yaw:n(p.c[1]),tint:Array.isArray(p.c[2])?[clamp(n(p.c[2][0]),0,1),clamp(n(p.c[2][1]),0,1),clamp(n(p.c[2][2]),0,1),1]:[1,1,1,1]}:null;
  if(r.pos.y<-40)r.pos.copy(r.tp);
  r.alive=!(r.flags&FLAG.dead)&&!(r.flags&FLAG.invis);r.firing=!!r.beam;
}
function updateRemotes(dt){
  for(const r of MP.peers.values()){
    const age=Math.min(time-r.stamp,0.5);const tx=r.tp.x+r.vel.x*age,ty=r.tp.y+r.vel.y*age,tz=r.tp.z+r.vel.z*age;const k=damp(12,dt);
    r.pos.x+=(tx-r.pos.x)*k;r.pos.y+=(ty-r.pos.y)*k;r.pos.z+=(tz-r.pos.z)*k;
    r.heroYaw=angLerp(r.heroYaw,r.tyaw||0,k);r.tilt=lerp(r.tilt,r.ttilt||0,k);r.bank=lerp(r.bank,r.tbank||0,k);r.flash=Math.max(0,r.flash-dt*5);
    const a=r.anim,hs=Math.hypot(r.vel.x,r.vel.z),kk=damp(12,dt);
    if(r.flags&FLAG.fly){a.armR=lerp(a.armR,hs>20?-2.95:-0.3,kk);a.armL=lerp(a.armL,-0.2,kk);a.legL=lerp(a.legL,0.05,kk);a.legR=lerp(a.legR,0.2,kk);a.kneeL=lerp(a.kneeL,0.1,kk);a.kneeR=lerp(a.kneeR,0.3,kk);}
    else{r.phase+=dt*hs*0.3;const sw=Math.sin(r.phase)*Math.min(hs/14,1.2)*0.9;a.legL=sw;a.legR=-sw;a.armL=-sw*0.8;a.armR=sw*0.8;a.kneeL=Math.max(0,-Math.sin(r.phase))*Math.min(hs/10,1)*1.1;a.kneeR=Math.max(0,Math.sin(r.phase))*Math.min(hs/10,1)*1.1;}
    a.elbL=a.elbR=-0.4;a.cape=0.2+clamp(hs/40,0,1);
  }
}
