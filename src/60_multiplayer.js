// ================================================================
// Multiplayer: other players via the claude.ai room capability
// ================================================================
// Everyone playing the claude.ai version at the same time sees each other.
// Each player's own city (NPCs, crimes, traffic) runs on their own device; players,
// their attacks and PvP damage are shared. The shooter decides hits, the victim applies them.
const MP={room:null,myPeer:null,peers:new Map(),connected:false,sendT:0,last:'',dirty:true,hitT:0,
  bump(){this.dirty=true;},
  online(){return P2P.open||(!!this.room&&this.connected&&this.peers.size>0);},
  tried:false,err:'',access:null,since:0,
  // one-line room status for the HUD and menu ('' outside claude.ai)
  // the active transport: a room-code session (public site) or the claude.ai room
  net(){return P2P.open?P2P:(this.room&&!this.err?this.room:null);},
  status(){
    if(P2P.state!=='off')return P2P.statusText();
    if(!window.claude)return '';
    const a=this.access,why=a&&!a.edit?' · you have view-only access, ask the owner to make you an Editor':'';
    if(!this.room||this.err)return this.tried||this.err?'Multiplayer unavailable'+(this.err?' ('+this.err+')':'')+(why||' for this view'):'Connecting to other players…';
    if(!this.connected)return performance.now()-this.since>8000?'Can\'t reach other players'+why:'Connecting to other players…';
    let others=0;try{for(const p of this.room.peers())if(!p.isMe&&p.kind==='viewer')others++;}catch(e){}
    const playing=this.peers.size;
    if(!others)return 'Online · no one else here yet';
    const menu=others-playing;return 'Online · '+(playing?playing+' playing':'')+(playing&&menu>0?', ':'')+(menu>0?menu+' in the menu':'');
  },
  async init(){
    try{
      if(!window.claude||typeof window.claude.use!=='function')return;this.since=performance.now();
      window.claude.use('user').then(async u=>{if(!u)return;try{this.access={edit:await u.canEdit(),write:await u.can('data.write')};}catch(e){}}).catch(()=>{});
      const room=await window.claude.use('room');this.tried=true;if(!room)return;this.room=room;
      const onErr=e=>{this.err=(e&&e.code)||'error';};
      room.onPeers(ch=>{
        for(const p of ch.peers)if(p.isMe&&p.sameTab)this.myPeer=p.peer;
        for(const p of ch.joined)if(!p.isMe)this.upsert(p,true);
        for(const p of ch.updated)if(!p.isMe)this.upsert(p,false);
        for(const p of ch.left)this.remove(p.peer);
      },onErr);
      room.on('hit',m=>this.onHit(m),onErr);room.on('down',m=>this.onDown(m),onErr);room.on('fx',m=>this.onFx(m),onErr);
      room.onConnection(c=>{this.connected=c;if(c)this.dirty=true;},onErr);
    }catch(e){this.room=null;this.tried=true;}
  },
  upsert(peer,joined){
    const pr=peer.presence||{};if(pr.v!==1)return;
    let r=this.peers.get(peer.peer);
    if(!r){r=makeRemote(peer.peer);this.peers.set(peer.peer,r);actors.push(r);if(state==='play')feed((cleanName(pr.n||'')||'A hero')+' is here',repTier(+pr.rep||0).name);if(sheetOpen==='mp')renderSheet();}
    applyPresence(r,pr);
  },
  remove(id){const r=this.peers.get(id);if(!r)return;this.peers.delete(id);removeFrom(actors,r);if(state==='play')feed(r.name+' left','');if(sheetOpen==='mp')renderSheet();},
  canFight(t){const a=playerFaction(),b=t.faction;return !(a!=='neutral'&&a===b);},
  hit(t,amount,type,opt){
    if(!this.net()||P.dead||state!=='play')return 0;
    if(!this.canFight(t)){if(time-(t.ffT||-9)>2){t.ffT=time;feed('Same side','You and '+t.name+' are both '+(t.faction==='hero'?'heroes':'villains'));}return 0;}
    dmgNum(t,amount);hitMarkT=time;t.flash=1;t.pend=(t.pend||0)+amount;t.pendType=type;t.pendK=Math.max(t.pendK||0,(opt&&opt.knock)||0);if(opt&&opt.kv)t.pendV=opt.kv.map(v=>Math.round(v));if(opt&&opt.stun)t.pendS=Math.max(t.pendS||0,opt.stun);
    return amount;
  },
  flush(dt){
    const net=this.net();if(!net)return;
    this.hitT-=dt;if(this.hitT<=0){this.hitT=0.12;
      for(const r of this.peers.values())if(r.pend>0){const d={to:r.peer,a:Math.round(r.pend*10)/10,t:String(r.pendType||'hit').slice(0,12),k:Math.round(r.pendK||0),x:Math.round(P.pos.x),z:Math.round(P.pos.z)};if(r.pendV)d.v=r.pendV;if(r.pendS)d.s=Math.round(r.pendS*10)/10;
        r.pend=0;r.pendK=0;r.pendV=null;r.pendS=0;net.emit('hit',d).catch(()=>{});}}
    this.sendT-=dt;if(this.sendT>0)return;this.sendT=0.08;
    this.keepT=(this.keepT||0)-0.08;if(net===P2P&&this.keepT<=0){this.keepT=2;this.dirty=true;} // room codes: resend so late joiners see idle players
    const pr=myPresence(),key=JSON.stringify(pr);if(key===this.last&&!this.dirty)return;this.last=key;this.dirty=false;
    net.presence(pr).catch(e=>{if(e&&e.code==='not_granted')this.err='not_granted';});
  },
  onHit(m){
    if(!m||m.isMe||!m.data||m.data.to!==this.myPeer||P.dead||state!=='play')return;
    const src=this.peers.get(m.peer)||null;const amt=clamp(+m.data.a||0,0,250);if(!(amt>0))return;
    if(src&&!this.canFight(src))return;
    const v=Array.isArray(m.data.v)&&m.data.v.length===3?m.data.v.map(x=>clamp(+x||0,-240,240)):null;
    Damage.apply(src,P,amt,'pvp',{knock:clamp(+m.data.k||0,0,40),kv:v,stun:clamp(+m.data.s||0,0,1.4)});
  },
  sendDown(killer){const net=this.net();if(!net||!killer||killer.kind!=='remote')return;
    net.emit('down',{to:killer.peer,lv:save.level,fac:playerFaction(),b:hasBounty()?1:0}).catch(()=>{});},
  onDown(m){
    if(!m||m.isMe||!m.data||m.data.to!==this.myPeer)return;
    const r=this.peers.get(m.peer),lv=clamp(Math.floor(+m.data.lv||1),1,100),fac=m.data.fac;
    let xp=NPCS.rival.xp+NPCS.rival.xpPerLvl*lv,rep=fac==='villain'?25:fac==='hero'?-25:0;if(m.data.b){xp*=2;rep*=2;}
    addXP(xp);addRep(rep);save.stats.defeated++;toast('You defeated '+(r?r.name:'a player'),'+'+xp+' XP'+(rep?' · '+(rep>0?'+':'')+rep+' rep':''),'gold');
  },
  fx(k,d){const net=this.net();if(net&&(net===P2P||this.connected))net.emit('fx',Object.assign({k},d)).catch(()=>{});},
  onFx(m){
    if(!m||m.isMe||!m.data)return;const d=m.data,r=this.peers.get(m.peer);if(!r)return;
    const n=v=>{v=+v;return isFinite(v)?v:0;};
    if(d.k==='p')fireProj({kind:d.pk==='fire'?'fire':'blast',owner:r,visual:true,x:n(d.x),y:n(d.y),z:n(d.z),vx:n(d.vx),vy:n(d.vy),vz:n(d.vz),dmg:0,radius:3,knock:0,r:0.5,life:3});
    else if(d.k==='b')bolt(n(d.x),n(d.y),n(d.z),true);
    else if(d.k==='s'){const R=clamp(n(d.r),2,60);ringFx(n(d.x),n(d.y),n(d.z),1,R,0.5,[.45,.85,1]);SFX.boom(0.6*SFX.vol(n(d.x),n(d.y),n(d.z)),1);}
    else if(d.k==='gw'){wells.push({x:n(d.x),y:n(d.y),z:n(d.z),t:0,dur:4,R:24,dmg:0,visual:true});}
    else if(d.k==='hold'){if(d.to===this.myPeer&&!P.dead)P.heldBy={x:n(d.x),y:n(d.y),z:n(d.z),t:time,by:r};}
    else if(d.k==='rg'){if(d.g==='o'){ringFx(r.pos.x,r.pos.y+1.5,r.pos.z,1,20,0.7,RING_C);burst(r.pos.x,r.pos.y+1.5,r.pos.z,80,20,1,[RING_C,[1,1,1]],1.6,0,2);}else onRingFx(d,n);}
    else if(d.k==='t'){ringFx(r.pos.x,r.pos.y+1.5,r.pos.z,1,8,0.6,BAND_COL);burst(r.pos.x,r.pos.y+1.5,r.pos.z,50,14,0.8,[BAND_COL,[1,1,1]],1.4,0,2);}
  },
};
const FLAG={fly:1,speed:2,wall:4,web:8,charge:16,fire:32,shield:64,metal:128,dead:256,invis:512,car:1024,wanted:2048,rag:4096};
function myPresence(){
  const ch=save.character||{};let f=0;
  if(P.flying)f|=FLAG.fly;if(P.speeding)f|=FLAG.speed;if(P.wall)f|=FLAG.wall;if(P.web)f|=FLAG.web;if(P.charging)f|=FLAG.charge;if(beam)f|=FLAG.fire;
  if(P.shieldOn)f|=FLAG.shield;if(P.metal)f|=FLAG.metal;if(P.dead)f|=FLAG.dead;if(P.invisible>0)f|=FLAG.invis;if(P.car)f|=FLAG.car;if(P.heat>0)f|=FLAG.wanted;if(P.rag)f|=FLAG.rag;
  const r1=v=>Math.round(v*10)/10,r2=v=>Math.round(v*100)/100;
  const o={v:1,n:ch.name||'Hero',l:[ch.suit|0,ch.cape|0,ch.accent|0,ch.capeOn===false?0:1],lv:save.level,rep:save.reputation,fac:playerFaction(),al:P.alien?P.alien.id:'',
    x:r1(P.pos.x),y:r1(P.pos.y),z:r1(P.pos.z),vx:r1(P.vel.x),vy:r1(P.vel.y),vz:r1(P.vel.z),yw:r2(P.heroYaw),tl:r2(P.tilt),bk:r2(P.bank),f,hp:Math.round(P.hp/maxHp()*100)};
  // presence patches merge on the server, so optional fields are always sent (null clears them)
  o.b=beam?(beam.w?[r1(beam.x),r1(beam.y),r1(beam.z),r1(beam.w)]:[r1(beam.x),r1(beam.y),r1(beam.z)]):null;const wp=P.web||P.zip;o.w=wp?[r1(wp.x),r1(wp.y),r1(wp.z)]:null;o.k=P.tk&&P.tk.hold?P.tk.hold.map(r1):null;o.c=null;
  o.cn=P.construct?P.construct.id:null;o.ex=presExtra();
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
  r.beam=Array.isArray(p.b)?{x:n(p.b[0]),y:n(p.b[1]),z:n(p.b[2]),w:clamp(n(p.b[3]),0,8)}:null;r.web=Array.isArray(p.w)?{x:n(p.w[0]),y:n(p.w[1]),z:n(p.w[2])}:null;
  r.tk=Array.isArray(p.k)&&p.k.length===3?{x:n(p.k[0]),y:n(p.k[1]),z:n(p.k[2])}:null;
  r.car=Array.isArray(p.c)&&CARS[p.c[0]]?{model:p.c[0],yaw:n(p.c[1]),tint:Array.isArray(p.c[2])?[clamp(n(p.c[2][0]),0,1),clamp(n(p.c[2][1]),0,1),clamp(n(p.c[2][2]),0,1),1]:[1,1,1,1]}:null;
  r.cn=CONSTRUCTS[p.cn]?p.cn:null;r.ex=Array.isArray(p.ex)?p.ex.map(n).slice(0,6):null;
  if(r.pos.y<-40)r.pos.copy(r.tp);
  r.alive=!(r.flags&FLAG.dead)&&!(r.flags&FLAG.invis);r.firing=!!r.beam;
  if(r.flags&FLAG.rag){if(!r.rag)startRagdoll(r,r.vel.x,r.vel.y,r.vel.z);}else if(r.rag){r.rag.land=9;}
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

// ================================================================
// Room codes: peer-to-peer multiplayer for the public site
// ================================================================
// One player hosts a room and shares a short code; friends join with it. Players connect
// over WebRTC (PeerJS, loaded on demand; its free public server only introduces the players).
// The host relays presence and attacks between everyone, so the room lasts while the host plays.
const P2P_LIB=['https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js','https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'];
const P2P_PREFIX='skyline-guardian-v1-',P2P_MAX=8,P2P_TOPICS=['hit','down','fx','dx'],P2P_HOST_TOPICS=['nh','tk','tg','tt'];
const P2P={peer:null,host:false,code:'',conns:new Map(),hostConn:null,state:'off',err:'',open:false,myLast:null,timer:0,
  available:()=>!window.claude&&'RTCPeerConnection' in window,
  loadLib(){
    if(window.Peer)return Promise.resolve();
    return new Promise((res,rej)=>{let i=0;const next=()=>{if(i>=P2P_LIB.length){rej(new Error('lib'));return;}
      const sc=document.createElement('script');sc.src=P2P_LIB[i++];sc.async=true;sc.onload=()=>window.Peer?res():next();sc.onerror=next;document.head.appendChild(sc);};next();});
  },
  newCode(){const A='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let c='';for(let i=0;i<5;i++)c+=A[(Math.random()*A.length)|0];return c;},
  cleanCode:c=>String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8),
  statusText(){
    if(this.state==='starting')return 'Connecting to room '+this.code+'…';
    if(this.state==='error')return 'Room: '+this.err;
    const n=MP.peers.size;return 'Room '+this.code+' · '+(n?n+' other'+(n>1?'s':'')+' playing':'waiting for friends');
  },
  changed(){MP.dirty=true;if(sheetOpen==='mp')renderSheet();},
  fail(msg){this.shutdown();this.state='error';this.err=msg;this.changed();if(state==='play')feed('Multiplayer',msg);},
  shutdown(){
    clearTimeout(this.timer);this.open=false;
    for(const c of this.conns.values())try{c.close();}catch(e){}this.conns.clear();
    if(this.hostConn)try{this.hostConn.close();}catch(e){}this.hostConn=null;
    if(this.peer)try{this.peer.destroy();}catch(e){}this.peer=null;
    for(const id of [...MP.peers.keys()])MP.remove(id);
  },
  leave(){this.shutdown();this.state='off';this.err='';this.code='';try{if(location.hash.startsWith('#room='))history.replaceState(null,'',location.pathname+location.search);}catch(e){}this.changed();},
  startPeer(id){
    const peer=new window.Peer(id,{debug:0});this.peer=peer;
    peer.on('disconnected',()=>{if(this.peer===peer&&this.state!=='off')try{peer.reconnect();}catch(e){}});
    return peer;
  },
  setHash(){try{history.replaceState(null,'','#room='+this.code);}catch(e){}},
  async create(){
    this.shutdown();this.state='starting';this.err='';this.host=true;this.code=this.newCode();this.changed();
    try{await this.loadLib();}catch(e){this.fail('Could not load the multiplayer library. Check your connection.');return;}
    const peer=this.startPeer(P2P_PREFIX+this.code);
    peer.on('open',id=>{MP.myPeer=id;this.state='open';this.open=true;this.setHash();this.changed();});
    peer.on('connection',conn=>this.accept(conn));
    peer.on('error',e=>{if(this.peer!==peer)return;if(e&&e.type==='unavailable-id'){this.create();return;}
      if(!this.open)this.fail('Could not start a room ('+((e&&e.type)||'error')+')');});
    this.timer=setTimeout(()=>{if(this.state==='starting'&&this.peer===peer)this.fail('Could not reach the matchmaking server');},15000);
  },
  async join(code){
    code=this.cleanCode(code);if(code.length<4){this.fail('That room code looks wrong');return;}
    this.shutdown();this.state='starting';this.err='';this.host=false;this.code=code;this.changed();
    try{await this.loadLib();}catch(e){this.fail('Could not load the multiplayer library. Check your connection.');return;}
    const peer=this.startPeer(undefined);
    peer.on('open',id=>{MP.myPeer=id;const c=peer.connect(P2P_PREFIX+code,{reliable:true,serialization:'json'});this.hostConn=c;
      c.on('open',()=>{if(this.hostConn!==c)return;this.state='open';this.open=true;this.setHash();this.changed();if(state==='play')feed('Joined room '+code,'');});
      c.on('data',m=>this.fromHost(m));
      c.on('close',()=>{if(this.hostConn===c&&this.state!=='off')this.fail(this.open?'The host left, so the room closed':'Could not connect to that room');});
      c.on('error',()=>{});});
    peer.on('error',e=>{if(this.peer!==peer)return;const t=e&&e.type;
      this.fail(t==='peer-unavailable'?'No room with code '+code+'. Check the code, and make sure the host is still playing.':this.open?'Connection lost ('+(t||'error')+')':'Could not join ('+(t||'error')+')');});
    this.timer=setTimeout(()=>{if(this.state==='starting'&&this.peer===peer)this.fail('Could not connect to room '+code+'. A strict network may be blocking it.');},20000);
  },
  // host side
  accept(conn){
    conn.on('open',()=>{
      if(this.conns.size>=P2P_MAX-1){try{conn.send({t:'full'});}catch(e){}setTimeout(()=>conn.close(),300);return;}
      this.conns.set(conn.peer,conn);
      if(this.myLast)conn.send({t:'pr',from:MP.myPeer,p:this.myLast});
      for(const [id,o] of this.conns)if(id!==conn.peer&&o.lastPr)conn.send({t:'pr',from:id,p:o.lastPr});
      this.changed();});
    conn.on('data',m=>this.fromClient(conn,m));
    conn.on('close',()=>{if(!this.conns.has(conn.peer))return;this.conns.delete(conn.peer);MP.remove(conn.peer);this.broadcast({t:'left',from:conn.peer},null);this.changed();});
    conn.on('error',()=>{});
  },
  broadcast(m,except){for(const [id,c] of this.conns)if(id!==except&&c.open)try{c.send(m);}catch(e){}},
  fromClient(conn,m){
    if(!m||typeof m!=='object')return;
    if(m.t==='pr'&&m.p&&typeof m.p==='object'){conn.lastPr=m.p;MP.upsert({peer:conn.peer,presence:m.p});this.broadcast({t:'pr',from:conn.peer,p:m.p},conn.peer);}
    else if(m.t==='ev'&&P2P_TOPICS.includes(m.topic)){this.deliver(conn.peer,m.topic,m.d);this.broadcast({t:'ev',from:conn.peer,topic:m.topic,d:m.d},conn.peer);}
    else if(m.t==='ev'&&P2P_HOST_TOPICS.includes(m.topic))this.deliver(conn.peer,m.topic,m.d);
  },
  // client side
  fromHost(m){
    if(!m||typeof m!=='object')return;const from=typeof m.from==='string'?m.from:'';
    if(m.t==='pr'&&from&&m.p&&typeof m.p==='object')MP.upsert({peer:from,presence:m.p});
    else if(m.t==='left'&&from)MP.remove(from);
    else if(m.t==='ev'&&from&&P2P_TOPICS.includes(m.topic))this.deliver(from,m.topic,m.d);
    else if(m.t==='full')this.fail('That room is full ('+P2P_MAX+' players)');
    else if(m.t==='ws')WS.onSnapshot(m.d);else if(m.t==='ph')WS.onNpcHit(m.d);else if(m.t==='rw')WS.onReward(m.d);
  },
  deliver(from,topic,d){const msg={peer:from,isMe:false,data:d};if(topic==='hit')MP.onHit(msg);else if(topic==='down')MP.onDown(msg);else if(topic==='fx')MP.onFx(msg);
    else if(topic==='dx')WS.onDestroy(d);else if(topic==='nh')WS.onClientHit(from,d);else if(topic==='tk')WS.onTake(from,d);else if(topic==='tg')WS.onTkGrab(from,d);else if(topic==='tt')WS.onTkThrow(from,d);},
  sendTo(id,m){const c=this.conns.get(id);if(c&&c.open)try{c.send(m);}catch(e){}},
  // transport interface used by MP (same shape as the claude.ai room)
  presence(pr){if(this.host){this.myLast=pr;this.broadcast({t:'pr',from:MP.myPeer,p:pr},null);}else if(this.hostConn&&this.hostConn.open)this.hostConn.send({t:'pr',p:pr});return Promise.resolve();},
  emit(topic,d){if(this.host)this.broadcast({t:'ev',from:MP.myPeer,topic,d},null);else if(this.hostConn&&this.hostConn.open)this.hostConn.send({t:'ev',topic,d});return Promise.resolve();},
};
