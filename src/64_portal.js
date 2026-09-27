// ================================================================
// Game portals (CrazyGames): ads, gameplay events, invite links, happy time, cloud save and a quick start
// ================================================================
// Only the portal build (`node tools/build.mjs crazygames`) sets window.__PORTAL__ and loads the CrazyGames SDK;
// on the website and in the claude.ai version everything here does nothing.
// Ads only come at natural breaks: after a knockout and when you leave the pause menu, at most once every 3 minutes,
// never mid-fight. A rewarded ad (from the pause menu) doubles XP for 5 minutes. Rooms get the portal's invite button.
// Big moments (level-ups, heists stopped, bosses and rivals beaten, an overcharged ring) call happytime(), at most once a minute.
// The save is copied to the portal's cloud storage, so it survives cleared browser storage and follows a signed-in player;
// on start the newer of the two wins. Every session's first crime starts a short run from you, so there is something to do
// within seconds. The rewards live in the HUD icon bar (67_hudbar.js).
const PORTAL=window.__PORTAL__||'';
const PORTAL_AD_GAP=180,XP_BOOST={mul:2,time:300};
const Portal={sdk:null,inAd:false,adAt:0,playing:false,boostUntil:0,muteWas:false,happyAt:-99,crimeAt:0,
  on(){return !!this.sdk;},
  async init(){
    if(PORTAL!=='crazygames')return;const S=window.CrazyGames&&window.CrazyGames.SDK;if(!S)return;
    try{await S.init();}catch(e){return;}
    this.sdk=S;
    try{S.game.loadingStart();S.game.loadingStop();}catch(e){} // the game has finished loading by the time the SDK is ready
    this.cloudSync(S);
    try{const room=S.game.getInviteParam('room');if(room&&P2P.available())P2P.join(room);else if(S.game.isInstantMultiplayer&&P2P.available())P2P.create();}catch(e){}
    if(sheetOpen)renderSheet();renderPortalButtons();
  },
  // tell the portal whether the player is actually playing (not in menus, paused, knocked out or watching an ad)
  tick(){
    if(this.crimeAt&&time>=this.crimeAt&&state==='play'&&!paused&&!P.dead){this.crimeAt=0;if(ROOM.crimes&&!MP.online())nearCrime();}
    if(!this.sdk)return;const now=state==='play'&&!paused&&!sheetOpen&&!creating&&!P.dead&&!this.inAd;
    if(now===this.playing)return;this.playing=now;try{now?this.sdk.game.gameplayStart():this.sdk.game.gameplayStop();}catch(e){}
  },
  quiet(on){if(on){this.muteWas=SFX.muted;if(!SFX.muted)SFX.toggleMute();}else if(SFX.muted&&!this.muteWas)SFX.toggleMute();},
  show(kind,done){
    if(!this.sdk||this.inAd){done&&done(false);return;}
    const end=ok=>{if(!this.inAd)return;this.inAd=false;this.quiet(false);this.tick();done&&done(ok);};
    this.inAd=true;this.tick();
    try{this.sdk.ad.requestAd(kind,{adStarted:()=>{this.quiet(true);mouseL=false;for(const k in keys)keys[k]=false;},adFinished:()=>{this.adAt=performance.now()/1000;end(true);},adError:()=>end(false)});}
    catch(e){end(false);}
  },
  // a short ad at a natural break, if the last one was long enough ago
  midgame(){if(!this.sdk||performance.now()/1000-this.adAt<PORTAL_AD_GAP)return;this.show('midgame');},
  rewardXP(){this.show('rewarded',ok=>{if(!ok){toast('No ad right now','Try again in a little while','red');return;}
    this.boostUntil=time+XP_BOOST.time;toast('Double XP','For the next 5 minutes of play','gold');renderPortalButtons();});},
  xpMul(){return time<this.boostUntil?XP_BOOST.mul:1;},
  happy(){if(!this.sdk||time-this.happyAt<60)return;this.happyAt=time;try{this.sdk.game.happytime();}catch(e){}},
  onPlay(){if(PBAL)this.crimeAt=time+4;},
  // the newer save wins: a cloud copy from another device (or from before the browser cleared its storage) replaces this
  // one while you are still in the menu; otherwise this one is pushed up. From then on every save goes to both.
  cloudSync(S){
    const D=S.data;if(!D||typeof D.getItem!=='function'||typeof D.setItem!=='function')return;
    let cloud=null;try{cloud=JSON.parse(D.getItem(SAVE_KEY)||'null');}catch(e){cloud=null;}
    const cAt=cloud&&+cloud.savedAt||0,lAt=+save.savedAt||0;
    if(cloud&&cloud.character&&cAt>lAt&&state!=='play'&&!creating){
      const n=loadSave(JSON.stringify(cloud));
      if(n.character){for(const k of Object.keys(save))delete save[k];Object.assign(save,n);kitLvSeen=save.level;
        try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch(e){}refreshMenu();applyLook();applyTouchUI();}}
    persistHook=j=>D.setItem(SAVE_KEY,j);
    if(save.character&&!(cloud&&cAt>=lAt&&cloud.character))persist();
  },
  inviteLink(code){try{return this.sdk?this.sdk.game.inviteLink({room:code}):'';}catch(e){return '';}},
  roomChanged(){if(!this.sdk)return;try{if(P2P.state==='open'&&P2P.code)this.sdk.game.showInviteButton({room:P2P.code});else this.sdk.game.hideInviteButton();}catch(e){}},
};
// the rewards (double XP, refill, try locked powers, cosmetics) are HUD icons now (67_hudbar.js): keep them current
function renderPortalButtons(){updateHudbar(true);}
// the first crime of a session starts close by (30-120 m) instead of 90-420 m away
function nearCrime(){const a=CRIMES.minDist,b=CRIMES.maxDist;CRIMES.minDist=30;CRIMES.maxDist=120;
  try{if(!startShopRobbery()&&!startAtmHack())startRandomCrime();}finally{CRIMES.minDist=a;CRIMES.maxDist=b;}}
Bus.on('levelUp',()=>Portal.happy());
Bus.on('defeated',({target,killer})=>{if(killer===P&&(target.kind==='boss'||target.kind==='rival'||(target.kind==='human'&&target.role==='boss')))Portal.happy();});
Portal.init();
