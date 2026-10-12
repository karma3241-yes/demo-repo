// Playgama-only adapter. The CrazyGames source and build remain separate.
const PORTAL = 'playgama';
const PORTAL_AD_GAP = 180, XP_BOOST = {mul:2,time:300};
const Portal = {
  sdk:null,pending:true,inAd:false,hostPaused:false,adAt:performance.now()/1000,
  playing:false,started:false,boostUntil:0,crimeAt:0,forceMute:false,weMuted:false,
  username:'',adblock:false,session:null,authorizing:false,authMessage:'',authControls:[],
  on(){return !!this.sdk;},
  ads(){return !!this.sdk?.advertisement.isRewardedSupported&&!this.inAd&&!this.hostPaused;},
  init(){
    // All game modules must be constructed before touching input, HUD or auto-start bindings.
    queueMicrotask(()=>{
      const boot=window.__playgamaBoot;this.sdk=boot.sdk;
      persistHook=j=>boot.putRaw(j);
      boot.onPersist=()=>{if(save.character)persist();};
      let saveWarned=false;
      boot.onSaveError=()=>{if(!saveWarned){saveWarned=true;toast('Progress could not be saved','Keep this tab open while your connection recovers','red');}};
      boot.onState=()=>this.syncHost();
      this.sdk.advertisement.on(this.sdk.EVENT_NAME.REWARDED_STATE_CHANGED,s=>this.adState('rewarded',s));
      this.sdk.advertisement.on(this.sdk.EVENT_NAME.INTERSTITIAL_STATE_CHANGED,s=>this.adState('midgame',s));
      this.initAuthorization();this.syncHost();renderPortalButtons();
      this.pending=false;
      // First render, then the first visible interactive frame. No ready signal on failed startup.
      requestAnimationFrame(()=>requestAnimationFrame(()=>{boot.gameReady();autoReady=true;autoStart();}));
    });
  },
  initAuthorization(){
    for(const [prefix,selector] of [['m','#menu .menu-inner'],['p','#pause .box']]){
      const parent=document.querySelector(selector);
      const row=prefix==='m'?parent.querySelector('.menu-btns'):[...parent.querySelectorAll('.pause-btns')].at(-1);
      const status=el('p',{id:prefix+'-auth-status',class:'muted',role:'status','aria-live':'polite'});
      const button=el('button',{id:prefix+'-signin',class:'ghost',type:'button',text:'Sign in',
        style:'min-height:44px','aria-describedby':status.id,onclick:()=>this.signIn()});
      row.append(button);row.after(status);
      this.authControls.push({button,status});
    }
    this.renderAuthorization();
  },
  renderAuthorization(){
    const player=this.sdk?.player,supported=!!player?.isAuthorizationSupported,authorized=!!player?.isAuthorized;
    this.username=authorized?(player.name||''):'';
    for(const {button,status} of this.authControls){
      button.hidden=!supported&&!authorized;status.hidden=button.hidden;
      button.disabled=authorized||this.authorizing;
      button.textContent=authorized?'Signed in':this.authorizing?'Signing in…':'Sign in';
      status.textContent=authorized?(this.username?'Signed in as '+this.username:'Signed in'):
        this.authMessage||'Sign in to your platform account, or keep playing as a guest.';
    }
  },
  async signIn(){
    const player=this.sdk?.player;
    if(!player?.isAuthorizationSupported||player.isAuthorized||this.authorizing||this.inAd||this.hostPaused)return;
    this.authorizing=true;this.authMessage='Complete sign-in in the platform window. You can keep playing as a guest.';
    this.renderAuthorization();
    const restoreFocus=document.hasFocus();
    let timer;
    try{
      // Invoke before any await so platforms that open a popup retain the click gesture.
      const authorization=player.authorize();
      window.__playgamaBoot.onPersist?.();
      await Promise.race([authorization,new Promise((_,reject)=>{
        timer=setTimeout(()=>reject(new Error('Sign-in timed out')),60000);
      })]);
      this.authMessage=player.isAuthorized?'':'Sign-in was not completed. Try again, or keep playing as a guest.';
    }catch{
      this.authMessage='Unable to sign in. Try again, or keep playing as a guest.';
    }finally{
      clearTimeout(timer);this.authorizing=false;this.renderAuthorization();
      // Keep the current hero and progress; authorization never reloads or replaces a save.
      this.syncHost();
      const recover=()=>{
        if(restoreFocus&&!document.hidden&&!this.inAd)window.focus();
        this.syncHost();
      };
      queueMicrotask(()=>{recover();requestAnimationFrame(recover);});
    }
  },
  cancelInput(){
    mouseL=false;mmbLook=rmbLook=false;for(const k in keys)keys[k]=false;
    touchIn.x=touchIn.y=0;heldSlot=-1;
    clearTimeout(vHoldTimer);vHoldTimer=0;vHoldAt=0;vHeldOpen=false;
    prismHoldEnd();
    // Cancelling must never call a release handler that fires a charged attack.
    for(const k in PS){PS[k].holding=false;PS[k].primed=false;}
    if(P.alien)P.alien.channel=false;
    P.charging=false;P.fCharge=false;P.cp=null;beam=null;PR.bar=false;SG.lance=SG.lanceM=false;
    if(P.construct){P.construct.gunning=false;P.construct.gunning2=false;P.construct.breath=false;P.construct.charging=false;}
    holdOathStop();OPN.down=false;
    for(const id of [stickId,lookId])if(id!==null){try{tl.releasePointerCapture(id);}catch{}}
    stickId=lookId=null;knob.style.transform='';stick.classList.remove('on');placeStick();
    for(const button of document.querySelectorAll('.tb.down'))button.classList.remove('down');
    SFX.setLaser(false);SFX.setWind(0);SFX.setEngine(false,0);
    if(locked){manualUnlock=true;document.exitPointerLock();}
  },
  syncHost(){
    const boot=window.__playgamaBoot,was=this.hostPaused;
    this.hostPaused=boot.hostPaused;
    this.forceMute=!boot.audioEnabled||this.hostPaused||this.inAd;
    this.applyMute();
    if(this.hostPaused&&!was)this.cancelInput();
    this.tick();
  },
  applyMute(){
    if(this.forceMute&&!SFX.muted){SFX.toggleMute();this.weMuted=true;}
    else if(!this.forceMute&&this.weMuted){this.weMuted=false;if(SFX.muted)SFX.toggleMute();}
  },
  tick(){
    if(this.crimeAt&&time>=this.crimeAt&&state==='play'&&!paused&&!P.dead&&!OPN.on&&!this.hostPaused&&!this.inAd){
      this.crimeAt=0;if(ROOM.crimes&&!MP.online())nearCrime();
    }
    if(!this.sdk||!window.__playgamaBoot.readySent)return;
    const now=state==='play'&&!paused&&!sheetOpen&&!creating&&!P.dead&&!this.inAd&&!this.hostPaused;
    if(now===this.playing)return;
    this.playing=now;
    if(now){window.__playgamaBoot.message(this.started?'level_resumed':'level_started',{level:save.level});this.started=true;}
    else if(this.started)window.__playgamaBoot.message('level_paused',{level:save.level});
    window.__playgamaBoot.message(now?'gameplay_started':'gameplay_stopped');
  },
  adState(kind,state){
    const session=this.session;if(!session||session.kind!==kind)return;
    if(state==='rewarded'&&kind==='rewarded'){session.rewarded=true;return;}
    if(state==='opened')session.opened=true;
    if(state==='closed'||state==='failed'){
      this.session=null;this.inAd=false;window.__playgamaAdActive=false;
      if(state==='closed'&&session.opened)this.adAt=performance.now()/1000;
      this.syncHost();
      // Closing the host's ad overlay can leave its control focused outside our iframe.
      // Bridge treats that blur as a separate pause, even after the ad is closed.
      // Run after Bridge clears its ad pause; focus restores only the visibility pause.
      const restoreFocus=()=>{
        if(session.restoreFocus&&!document.hidden&&!this.inAd)window.focus();
        this.syncHost();
      };
      queueMicrotask(()=>{
        restoreFocus();
        // Some hosts finish dismissing their overlay after the close callback.
        // One frame-boundary retry covers that handoff without a timed delay.
        requestAnimationFrame(restoreFocus);
      });
      // A close alone is not proof that the player earned a reward. One callback per request.
      session.done?.(state==='closed'&&(kind==='midgame'||session.rewarded));
      if(session.rewarded&&state==='closed')persist();
      renderPortalButtons();
    }
  },
  show(kind,done){
    const ads=this.sdk?.advertisement;
    const supported=kind==='rewarded'?ads?.isRewardedSupported:ads?.isInterstitialSupported;
    if(!supported||this.inAd||this.hostPaused){done?.(false);return;}
    persist();
    this.session={kind,done,rewarded:false,opened:false,restoreFocus:document.hasFocus()};
    this.inAd=true;window.__playgamaAdActive=true;this.syncHost();this.cancelInput();
    try{if(kind==='rewarded')ads.showRewarded('bonus');else ads.showInterstitial('knockout');}
    catch(error){console.warn('Playgama ad:',error);this.adState(kind,'failed');}
  },
  midgame(){
    if(!this.sdk?.advertisement.isInterstitialSupported||performance.now()/1000-this.adAt<PORTAL_AD_GAP)return;
    // Existing call sites are respawn/knockout breaks; never invoked on startup or menu/resume.
    this.show('midgame');
  },
  rewardXP(){this.show('rewarded',ok=>{
    if(!ok){toast('No ad right now','Try again in a little while','red');return;}
    this.boostUntil=time+XP_BOOST.time;toast('Double XP','For the next 5 minutes of play','gold');renderPortalButtons();
  });},
  xpMul(){return time<this.boostUntil?XP_BOOST.mul:1;},
  happy(){},
  onPlay(){this.crimeAt=time+4;},
  inviteLink(){return '';},roomChanged(){},
};
function renderPortalButtons(){Portal.renderAuthorization();updateHudbar(true);}
function nearCrime(){const a=CRIMES.minDist,b=CRIMES.maxDist;CRIMES.minDist=30;CRIMES.maxDist=120;
  try{if(!startShopRobbery()&&!startAtmHack())startRandomCrime();}finally{CRIMES.minDist=a;CRIMES.maxDist=b;}}
Bus.on('playerDefeated',()=>{if(Portal.sdk)window.__playgamaBoot.message('level_failed',{level:save.level});});
Portal.init();
