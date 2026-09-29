// ================================================================
// Game portals (CrazyGames): ads, gameplay events, invite links, happy time, cloud save and a quick start
// ================================================================
// Only the portal build (`node tools/build.mjs crazygames`) sets window.__PORTAL__ and loads the CrazyGames SDK;
// on the website and in the claude.ai version everything here does nothing.
// Midgame ads only come at a natural break: after a knockout, on the way back to the hospital, at most once every 3 minutes
// (CrazyGames forbids them on menu buttons and in the middle of play, so leaving the pause menu never shows one). Rewarded
// ads are always the player's choice (the HUD icons). The portal's mute setting always wins over the game's own M key.
// A signed-in CrazyGames player's new hero takes their CrazyGames username. Rooms get the portal's invite button.
// Big moments (level-ups, heists stopped, bosses and rivals beaten, an overcharged ring) call happytime(), at most once a minute.
// The save is copied to the portal's cloud storage, so it survives cleared browser storage and follows a signed-in player;
// the portal copy is the save of record, and a guest who signs in mid-game gets their account save. Every session's first crime starts a short run from you, so there is something to do
// within seconds. The rewards live in the HUD icon bar (67_hudbar.js).
const PORTAL=window.__PORTAL__||'';
const PORTAL_AD_GAP=180,XP_BOOST={mul:2,time:300};
const Portal={sdk:null,inAd:false,adAt:0,playing:false,stopAt:-9999,boostUntil:0,muteWas:false,happyAt:-99,crimeAt:0,forceMute:false,weMuted:false,username:'',adblock:false,
  on(){return !!this.sdk;},
  // rewarded buttons are only live when an ad can actually play (an ad blocker leaves them greyed out, never clickable-but-dead)
  ads(){return !!this.sdk&&!this.adblock&&!BASIC_LAUNCH;}, // basic launch: no ads at all (20_core.js)
  async init(){
    if(PORTAL!=='crazygames')return;const S=window.CrazyGames&&window.CrazyGames.SDK;if(!S)return;
    try{await S.init();}catch(e){return;}
    this.sdk=S;
    try{S.game.loadingStart();S.game.loadingStop();}catch(e){} // the game has finished loading by the time the SDK is ready
    this.cloudSync(S);this.watchSettings(S);this.fetchUser(S);this.checkAdblock(S);
    try{const room=S.game.getInviteParam('room');if(room&&P2P.available())P2P.join(room);else if(S.game.isInstantMultiplayer&&P2P.available())P2P.create();}catch(e){}
    // a player already in the game who accepts a friend's invite goes straight to that room
    try{if(typeof S.game.addJoinRoomListener==='function')S.game.addJoinRoomListener(p=>this.joinInvite(p));}catch(e){}
    if(sheetOpen)renderSheet();renderPortalButtons();
  },
  // tell the portal whether the player is actually playing (not in menus, paused, knocked out or watching an ad)
  tick(){
    if(this.crimeAt&&time>=this.crimeAt&&state==='play'&&!paused&&!P.dead){this.crimeAt=0;if(ROOM.crimes&&!MP.online())nearCrime();}
    if(!this.sdk)return;const now=state==='play'&&!paused&&!sheetOpen&&!creating&&!P.dead&&!this.inAd;
    if(now===this.playing)return;
    const t=performance.now();if(now&&t-this.stopAt<1100)return; // the SDK rejects a start within 1 s of a stop; this runs every frame, so it just waits
    this.playing=now;if(!now)this.stopAt=t;try{now?this.sdk.game.gameplayStart():this.sdk.game.gameplayStop();}catch(e){}
  },
  // mute while an ad plays; afterwards go back to what the player (or the portal's mute setting) wants
  quiet(on){if(on){this.muteWas=SFX.muted;if(!SFX.muted)SFX.toggleMute();return;}
    if(SFX.muted&&!this.muteWas)SFX.toggleMute();this.applyMute();},
  // CrazyGames' own mute setting (game.settings.muteAudio) overrides the game's sound, now and whenever it changes;
  // when it is lifted, only the mute it caused is undone (a player who pressed M stays muted)
  watchSettings(S){
    const apply=st=>{this.forceMute=!!(st&&st.muteAudio);this.applyMute();};
    try{apply(S.game.settings);S.game.addSettingsChangeListener(apply);}catch(e){}
  },
  applyMute(){if(this.inAd)return;
    if(this.forceMute&&!SFX.muted){SFX.toggleMute();this.weMuted=true;}
    else if(!this.forceMute&&this.weMuted){this.weMuted=false;if(SFX.muted)SFX.toggleMute();}},
  // the signed-in player's CrazyGames username names a new hero (guests keep "Guardian 123"). A hero still wearing that
  // placeholder takes the username once it is known (Play may be pressed before the SDK answers, or the guest signs in later).
  async fetchUser(S){if(!S.user)return;try{S.user.addAuthListener(u=>this.authChanged(u));}catch(e){}
    try{if(!S.user.isUserAccountAvailable)return;this.setUser(await S.user.getUser());}catch(e){}},
  setUser(u){this.username=u&&typeof u.username==='string'?u.username:'';
    if(this.username&&save.character&&/^Guardian \d+$/.test(save.character.name)){save.character.name=this.username;persist();applyLook();refreshMenu();}},
  // a guest signed in while playing: the SDK has already swapped in the account's save (or moved the guest's save to the
  // account). A different save means a restart so the game loads it; the same save just picks up the username.
  authChanged(u){if(!u)return;const D=this.sdk&&this.sdk.data;let cloud=null;try{cloud=D?JSON.parse(D.getItem(SAVE_KEY)||'null'):null;}catch(e){}
    if(cloud&&cloud.character&&+cloud.savedAt!==+save.savedAt){persistHook=null;location.reload();return;}
    this.setUser(u);},
  async checkAdblock(S){try{this.adblock=!!(await S.ad.hasAdblock());}catch(e){}if(this.adblock)renderPortalButtons();},
  show(kind,done){
    if(!this.sdk||this.inAd||BASIC_LAUNCH){done&&done(false);return;}
    const end=ok=>{if(!this.inAd)return;this.inAd=false;this.quiet(false);this.tick();done&&done(ok);};
    this.inAd=true;this.tick();
    try{this.sdk.ad.requestAd(kind,{adStarted:()=>{this.quiet(true);mouseL=false;for(const k in keys)keys[k]=false;},adFinished:()=>{this.adAt=performance.now()/1000;end(true);},adError:()=>end(false)});}
    catch(e){end(false);}
  },
  // a short ad at a natural break, if the last one was long enough ago
  midgame(){if(BASIC_LAUNCH||!this.sdk||performance.now()/1000-this.adAt<PORTAL_AD_GAP)return;this.show('midgame');},
  rewardXP(){this.show('rewarded',ok=>{if(!ok){toast('No ad right now','Try again in a little while','red');return;}
    this.boostUntil=time+XP_BOOST.time;toast('Double XP','For the next 5 minutes of play','gold');renderPortalButtons();});},
  xpMul(){return time<this.boostUntil?XP_BOOST.mul:1;},
  happy(){if(!this.sdk||time-this.happyAt<60)return;this.happyAt=time;try{this.sdk.game.happytime();}catch(e){}},
  onPlay(){if(PBAL)this.crimeAt=time+4;},
  // CrazyGames' Data module is the save of record (their rule: rely on it, not on local saves): its copy replaces the local one
  // whenever it holds a hero, so another device's progress or a signed-in account's progress is never overwritten by a stale
  // browser copy. If Play was pressed before the SDK was ready and the copies differ, the game restarts to load it. A local
  // hero with nothing in the cloud yet is pushed up. From then on every save goes to both.
  cloudSync(S){
    const D=S.data;if(!D||typeof D.getItem!=='function'||typeof D.setItem!=='function')return;
    let cloud=null;try{cloud=JSON.parse(D.getItem(SAVE_KEY)||'null');}catch(e){cloud=null;}
    const has=!!(cloud&&cloud.character),same=has&&+cloud.savedAt===+save.savedAt;
    if(has&&!same&&(state==='play'||creating)){location.reload();return;}
    if(has&&!same){
      const n=loadSave(JSON.stringify(cloud));
      if(n.character){for(const k of Object.keys(save))delete save[k];Object.assign(save,n);kitLvSeen=save.level;
        try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch(e){}refreshMenu();applyLook();applyTouchUI();}}
    persistHook=j=>D.setItem(SAVE_KEY,j);
    if(save.character&&!has)persist();
  },
  joinInvite(p){const room=p&&typeof p.room==='string'?p.room.trim().toUpperCase():'';
    if(!/^[A-Z0-9]{4,8}$/.test(room)||!P2P.available())return;
    if(P2P.code===room&&(P2P.state==='open'||P2P.state==='starting'))return; // already there
    P2P.join(room);if(state==='play')feed('Joining your friend','Room '+room);},
  inviteLink(code){try{return this.sdk?this.sdk.game.inviteLink({room:code}):'';}catch(e){return '';}},
  // room info for the portal (its invite button and friends list): which room, and whether friends can still get in
  roomChanged(){if(!this.sdk)return;const g=this.sdk.game;try{
    if(P2P.state==='open'&&P2P.code){const full=P2P.host&&P2P.conns.size>=P2P_MAX-1;this.inRoom=true;
      if(g.updateRoom)g.updateRoom({roomId:P2P.code,isJoinable:!full&&!ROOM.locked,inviteParams:{room:P2P.code}});else g.showInviteButton({room:P2P.code});}
    else if(this.inRoom){this.inRoom=false;if(g.leftRoom)g.leftRoom();else g.hideInviteButton();}}catch(e){}},
};
// the rewards (double XP, refill, try locked powers, cosmetics) are HUD icons now (67_hudbar.js): keep them current
function renderPortalButtons(){updateHudbar(true);}
// the first crime of a session starts close by (30-120 m) instead of 90-420 m away
function nearCrime(){const a=CRIMES.minDist,b=CRIMES.maxDist;CRIMES.minDist=30;CRIMES.maxDist=120;
  try{if(!startShopRobbery()&&!startAtmHack())startRandomCrime();}finally{CRIMES.minDist=a;CRIMES.maxDist=b;}}
Bus.on('levelUp',()=>Portal.happy());
Bus.on('defeated',({target,killer})=>{if(killer===P&&(target.kind==='boss'||target.kind==='rival'||(target.kind==='human'&&target.role==='boss')))Portal.happy();});
Portal.init();
