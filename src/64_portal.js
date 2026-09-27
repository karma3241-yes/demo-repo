// ================================================================
// Game portals (CrazyGames): ads, gameplay events and invite links
// ================================================================
// Only the portal build (`node tools/build.mjs crazygames`) sets window.__PORTAL__ and loads the CrazyGames SDK;
// on the website and in the claude.ai version everything here does nothing.
// Ads only come at natural breaks: after a knockout and when you leave the pause menu, at most once every 3 minutes,
// never mid-fight. A rewarded ad (from the pause menu) doubles XP for 5 minutes. Rooms get the portal's invite button.
const PORTAL=window.__PORTAL__||'';
const PORTAL_AD_GAP=180,XP_BOOST={mul:2,time:300};
const Portal={sdk:null,inAd:false,adAt:0,playing:false,boostUntil:0,muteWas:false,
  on(){return !!this.sdk;},
  async init(){
    if(PORTAL!=='crazygames')return;const S=window.CrazyGames&&window.CrazyGames.SDK;if(!S)return;
    try{await S.init();}catch(e){return;}
    this.sdk=S;
    try{const room=S.game.getInviteParam('room');if(room&&P2P.available())P2P.join(room);else if(S.game.isInstantMultiplayer&&P2P.available())P2P.create();}catch(e){}
    if(sheetOpen)renderSheet();renderPortalButtons();
  },
  // tell the portal whether the player is actually playing (not in menus, paused, knocked out or watching an ad)
  tick(){
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
  inviteLink(code){try{return this.sdk?this.sdk.game.inviteLink({room:code}):'';}catch(e){return '';}},
  roomChanged(){if(!this.sdk)return;try{if(P2P.state==='open'&&P2P.code)this.sdk.game.showInviteButton({room:P2P.code});else this.sdk.game.hideInviteButton();}catch(e){}},
};
// the pause menu's "watch an ad" button (portal build only)
function renderPortalButtons(){
  let b=$('p-ad');if(!Portal.on()){if(b)b.hidden=true;return;}
  if(!b){b=el('button',{class:'ghost',id:'p-ad',type:'button',onclick:()=>Portal.rewardXP()});$('resume').parentNode.appendChild(b);}
  const left=Portal.boostUntil-time;b.hidden=false;b.disabled=left>0;b.textContent=left>0?'Double XP active · '+Math.ceil(left/60)+' min left':'Watch an ad: double XP for 5 min';
}
Portal.init();
