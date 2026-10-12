// Integration tests against the generated package using installed Chrome and a controlled Bridge double.
// No production ads/accounts are exercised. Override PLAYWRIGHT_MODULE / CHROME_PATH if needed.
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,join,resolve,extname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const here=dirname(fileURLToPath(import.meta.url)),dist=resolve(here,'../../dist',process.env.PLAYGAMA_DIST||'playgama-sandbox');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE || 'C:/Users/ASUS/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs').href);
let cloud=null;
const server=createServer(async(req,res)=>{
  if(req.url==='/__save'){
    if(req.method==='POST'){let body='';for await(const chunk of req)body+=chunk;cloud=JSON.parse(body);}
    res.setHeader('content-type','application/json');res.end(JSON.stringify(cloud));return;
  }
  const path=resolve(dist,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!path.startsWith(dist+ '\\')){res.writeHead(403).end();return;}
  try{
    const data=readFileSync(path);
    res.setHeader('content-type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.ttf':'font/ttf','.txt':'text/plain'})[extname(path)]||'application/octet-stream');
    res.end(data);
  }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const sdkDouble=`(() => {
  const config=window.__bridgeTestConfig||{};
  const listeners={};
  const emit=(event,value)=>{for(const fn of listeners[event]||[])fn(value);};
  const on=(event,fn)=>(listeners[event]??=[]).push(fn);
  const events={AUDIO_STATE_CHANGED:'audio',PAUSE_STATE_CHANGED:'pause',REWARDED_STATE_CHANGED:'reward',INTERSTITIAL_STATE_CHANGED:'interstitial'};
  const test=window.__bridgeTest={messages:[],ads:[],reads:[],writes:[],failWrites:0,emit,releaseRead:null,authCalls:0,authAction:false,authOutcome:config.authOutcome||'success',releaseAuth:null};
  if(config.authTimeout){const timeout=window.setTimeout;window.setTimeout=(fn,ms,...args)=>timeout(fn,ms===60000?30:ms,...args);}
  window.bridge={
    EVENT_NAME:events,
    initialize:async()=>{if(config.failInit)throw new Error('test initialization failure');},
    platform:{language:'fr',isAudioEnabled:config.audio!==false,isPaused:!!config.paused,on,
      sendMessage:async(name,options)=>{test.messages.push({name,options});}},
    player:{isAuthorizationSupported:config.auth!==false,isAuthorized:!!config.authorized,name:config.authorized?'QA Guardian':null,
      authorize:async()=>{
        test.authCalls++;test.authAction=navigator.userActivation.isActive;
        if(config.authDeferred)await new Promise(r=>test.releaseAuth=r);
        if(test.authOutcome==='failure')throw new Error('Test authorization failure');
        if(test.authOutcome==='cancelled')return;
        window.bridge.player.isAuthorized=true;window.bridge.player.name='QA Guardian';
      }},
    storage:{get:async(keys,parse)=>{test.reads.push({keys,parse});if(config.delayRead)await new Promise(r=>test.releaseRead=r);
      if(config.failRead)throw new Error('test read failure');const value=await(await fetch('/__save')).json();return [value];},
      set:async(keys,values)=>{test.writes.push({keys,values});if(test.failWrites-->0)throw new Error('test write failure');
        await fetch('/__save',{method:'POST',body:JSON.stringify(values[0])});}},
    advertisement:{isRewardedSupported:config.ads!==false,isInterstitialSupported:config.ads!==false,on,
      showRewarded:placement=>{test.ads.push({kind:'rewarded',placement});emit('reward','loading');},
      showInterstitial:placement=>{test.ads.push({kind:'midgame',placement});emit('interstitial','loading');}}
  };
  // Match Bridge's independent ad/visibility/platform pause and audio sources.
  let visibilityPaused=false,platformPaused=!!config.paused,adPaused=false;
  const sync=()=>{const paused=visibilityPaused||platformPaused||adPaused;
    if(window.bridge.platform.isPaused!==paused){window.bridge.platform.isPaused=paused;emit('pause',paused);}};
  addEventListener('blur',()=>{visibilityPaused=true;sync();});
  addEventListener('focus',()=>{visibilityPaused=false;sync();});
  test.pausePlatform=v=>{platformPaused=v;sync();};
  test.adState=(kind,state)=>{emit(kind,state);adPaused=state==='opened'||state==='rewarded';sync();};
})();`;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,
  args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']});
const results=[],errors=[];
const evidence=join(here,'evidence');mkdirSync(evidence,{recursive:true});
async function check(name,fn){await fn();results.push({name,result:'passed'});console.log('PASS '+name);}
async function pageWith(config={},device={viewport:{width:1280,height:720}}){
  const context=await browser.newContext(device),page=await context.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',message=>{if(message.type()==='error'&&!message.text().startsWith('Playgama startup:'))errors.push(message.text());});
  await page.addInitScript(({config})=>{window.__SKYLINE_TEST__=!config.auto;window.__bridgeTestConfig=config;},{config});
  await page.route('https://bridge.playgama.com/**',route=>route.fulfill({contentType:'text/javascript',body:sdkDouble}));
  // Deny unexpected external dependencies. The Bridge double is the only exception above.
  await page.route(/https?:\/\/(?!127\.0\.0\.1)(?!bridge\.playgama\.com)/,route=>route.abort());
  await page.goto(base+'/index.html');
  return {context,page};
}
async function loaded(page){await page.waitForFunction(()=>window.__skyline&&window.__playgamaBoot.readySent,{},{timeout:60000});}
try{
  await check('Visible menu sign-in uses a player action; failure and cancellation allow retry',async()=>{
    cloud=null;const {context,page}=await pageWith({authOutcome:'failure'});await loaded(page);
    assert.equal(await page.locator('#m-signin').isVisible(),true);
    assert.equal(await page.evaluate(()=>__bridgeTest.authCalls),0,'Startup must not authorize automatically');
    await page.locator('#m-signin').click();
    await page.waitForFunction(()=>!__skyline.Portal.authorizing);
    assert.match(await page.locator('#m-auth-status').textContent(),/Unable to sign in/);
    assert.equal(await page.locator('#m-signin').isEnabled(),true);
    assert.equal(await page.evaluate(()=>__bridgeTest.authAction),true,'authorize must retain the click gesture');
    await page.evaluate(()=>__bridgeTest.authOutcome='cancelled');await page.locator('#m-signin').click();
    await page.waitForFunction(()=>!__skyline.Portal.authorizing);
    assert.match(await page.locator('#m-auth-status').textContent(),/not completed/);
    assert.equal(await page.locator('#start').isEnabled(),true);
    await page.screenshot({path:join(evidence,'signin-menu.png')});await context.close();
  });
  await check('Pause sign-in succeeds once, updates both menus and preserves hero, progress and pause',async()=>{
    cloud=null;const {context,page}=await pageWith({authDeferred:true});await loaded(page);
    await page.evaluate(()=>{__skyline.save.settings.autoLock=false;__skyline.start();__skyline.setPaused(true);__skyline.save.level=7;});
    const hero=await page.evaluate(()=>JSON.stringify(__skyline.save.character));
    assert.equal(await page.locator('#p-signin').isVisible(),true);await page.locator('#p-signin').click();
    assert.equal(await page.locator('#p-signin').isEnabled(),false);
    await page.evaluate(()=>__skyline.Portal.signIn());assert.equal(await page.evaluate(()=>__bridgeTest.authCalls),1);
    // Simulate the host's focused authorization overlay and its delayed dismissal.
    await page.evaluate(()=>{
      const overlay=document.createElement('iframe');overlay.id='test-auth-frame';overlay.style='position:fixed;inset:0;width:100%;height:100%;z-index:999999';
      overlay.srcdoc='<button id="finish">Finish sign-in</button>';
      overlay.onload=()=>{overlay.contentDocument.getElementById('finish').onclick=()=>{
        __bridgeTest.releaseAuth();queueMicrotask(()=>overlay.contentWindow.focus());
      };};document.body.appendChild(overlay);
    });
    await page.frameLocator('#test-auth-frame').locator('#finish').click();
    await page.waitForFunction(()=>!__skyline.Portal.authorizing&&!__skyline.Portal.hostPaused);
    assert.equal(await page.locator('#p-signin').textContent(),'Signed in');
    assert.equal(await page.locator('#m-signin').textContent(),'Signed in');
    assert.equal(await page.locator('#p-auth-status').textContent(),'Signed in as QA Guardian');
    assert.deepEqual(await page.evaluate(()=>({level:__skyline.save.level,hero:JSON.stringify(__skyline.save.character),paused:__skyline.paused,username:__skyline.Portal.username})),
      {level:7,hero,paused:true,username:'QA Guardian'});
    await page.evaluate(()=>document.getElementById('test-auth-frame').remove());
    await page.screenshot({path:join(evidence,'signin-success.png')});await context.close();
  });
  await check('Already authorized players see their account without another authorization request',async()=>{
    cloud=null;const {context,page}=await pageWith({authorized:true});await loaded(page);
    assert.equal(await page.locator('#m-signin').textContent(),'Signed in');
    assert.equal(await page.locator('#m-signin').isEnabled(),false);
    assert.equal(await page.locator('#m-auth-status').textContent(),'Signed in as QA Guardian');
    assert.equal(await page.evaluate(()=>__bridgeTest.authCalls),0);await context.close();
  });
  await check('Unsupported authorization hides sign-in and keeps guest play available',async()=>{
    cloud=null;const {context,page}=await pageWith({auth:false});await loaded(page);
    assert.equal(await page.locator('#m-signin').isVisible(),false);
    assert.equal(await page.locator('#m-auth-status').isVisible(),false);
    await page.locator('#start').click();await page.waitForFunction(()=>document.getElementById('menu').hidden);
    assert.equal(await page.locator('#hud').isVisible(),true);await context.close();
  });
  await check('A stalled sign-in times out and restores retry without blocking play',async()=>{
    cloud=null;const {context,page}=await pageWith({authDeferred:true,authTimeout:true});await loaded(page);
    await page.locator('#m-signin').click();await page.waitForFunction(()=>!__skyline.Portal.authorizing);
    assert.match(await page.locator('#m-auth-status').textContent(),/Unable to sign in/);
    assert.equal(await page.locator('#m-signin').isEnabled(),true);assert.equal(await page.locator('#start').isEnabled(),true);
    await context.close();
  });
  for(const viewport of [{width:915,height:412},{width:640,height:360}]){
    await check('Touch sign-in remains usable at '+viewport.width+'x'+viewport.height,async()=>{
      cloud=null;const {context,page}=await pageWith({}, {viewport,isMobile:true,hasTouch:true});await loaded(page);
      await page.evaluate(()=>{__skyline.start();__skyline.setPaused(true);});
      const button=page.locator('#p-signin');await button.scrollIntoViewIfNeeded();
      const box=await button.boundingBox();assert.ok(box&&box.width>=44&&box.height>=44);
      assert.ok(box.x>=0&&box.x+box.width<=viewport.width&&box.y>=0&&box.y+box.height<=viewport.height);
      await page.screenshot({path:join(evidence,'signin-touch-'+viewport.width+'.png')});
      await button.tap();await page.waitForFunction(()=>bridge.player.isAuthorized);
      assert.equal(await button.textContent(),'Signed in');await context.close();
    });
  }
  cloud=null;
  const {context,page}=await pageWith({delayRead:true,audio:false});
  await check('Bridge storage finishes before game construction',async()=>{
    await page.waitForFunction(()=>window.__bridgeTest?.releaseRead);
    assert.equal(await page.evaluate(()=>!!window.__skyline),false);
    assert.equal(await page.locator('#pg-loading').isVisible(),true);
    await page.evaluate(()=>window.__bridgeTest.releaseRead());await loaded(page);
    const state=await page.evaluate(()=>({read:window.__bridgeTest.reads,ready:window.__bridgeTest.messages.filter(x=>x.name==='game_ready').length,
      muted:window.__skyline.SFX.muted,lang:document.documentElement.lang,ads:window.__bridgeTest.ads}));
    assert.deepEqual(state.read,[{keys:['skyline-guardian-save'],parse:false}]);
    assert.equal(state.ready,1);assert.equal(state.muted,true);assert.equal(state.lang,'en');assert.deepEqual(state.ads,[]);
  });
  await page.evaluate(()=>{window.__bridgeTest.emit('audio',true);window.__skyline.save.settings.autoLock=false;window.__skyline.start();});
  await page.waitForFunction(()=>window.__skyline.state==='play');
  await check('Gameplay lifecycle, pause, audio and input follow Bridge',async()=>{
    await page.waitForFunction(()=>window.__bridgeTest.messages.some(x=>x.name==='level_started'));
    const previous=await page.evaluate(()=>{const s=window.__skyline;s.keys.KeyW=true;window.__bridgeTest.emit('pause',true);
      return {t:s.time,paused:s.paused,mute:s.SFX.muted,key:s.keys.KeyW};});
    assert.equal(previous.mute,true);assert.equal(previous.key,false);
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(()=>window.__skyline.time),previous.t);
    await page.keyboard.press('KeyP');assert.equal(await page.evaluate(()=>window.__skyline.paused),previous.paused);
    await page.evaluate(()=>window.__bridgeTest.emit('pause',false));
    await page.waitForFunction(t=>window.__skyline.time>t,previous.t);
    assert.equal(await page.evaluate(()=>window.__skyline.SFX.muted),false);
    await page.evaluate(()=>{window.__skyline.SFX.toggleMute();window.__bridgeTest.emit('audio',false);window.__bridgeTest.emit('audio',true);});
    assert.equal(await page.evaluate(()=>window.__skyline.SFX.muted),true);
    await page.evaluate(()=>window.__skyline.SFX.toggleMute());
  });
  await check('Cancelled and failed rewarded ads never grant XP',async()=>{
    for(const final of ['closed','failed']){
      const before=await page.evaluate(()=>{const s=window.__skyline;s.Portal.rewardXP();return {t:s.time,boost:s.Portal.boostUntil,mute:s.SFX.muted,inAd:s.Portal.inAd};});
      assert.equal(before.inAd,true);assert.equal(before.mute,true);
      await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>window.__skyline.time),before.t);
      await page.evaluate(final=>window.__bridgeTest.emit('reward',final),final);
      assert.equal(await page.evaluate(()=>window.__skyline.Portal.boostUntil),before.boost);
      assert.equal(await page.evaluate(()=>window.__skyline.Portal.inAd),false);
    }
  });
  for(const [kind,final,recapture] of [['reward','closed'],['reward','failed'],['interstitial','closed'],['reward','closed',true]]){
    await check(kind+' '+final+(recapture?' with delayed overlay focus':'')+' returns ad-frame focus and resumes on the next frame',async()=>{
      await page.bringToFront();await page.locator('#gl').click({position:{x:30,y:30}});
      await page.evaluate(({kind,final,recapture})=>{
        const s=window.__skyline;s.setPaused(false);s.Portal.show(kind==='reward'?'rewarded':'midgame');
        window.__bridgeTest.adState(kind,'opened');
        const overlay=document.createElement('iframe');overlay.id='test-ad-frame';
        overlay.style='position:fixed;inset:0;width:100%;height:100%;z-index:999999';
        overlay.srcdoc='<button id="close">Close ad</button>';
        overlay.onload=()=>{overlay.contentDocument.getElementById('close').onclick=()=>{
          if(final==='closed'&&kind==='reward')window.__bridgeTest.adState(kind,'rewarded');
          window.__bridgeTest.adState(kind,final);
          if(recapture)queueMicrotask(()=>overlay.contentWindow.focus());
        };};document.body.appendChild(overlay);
      },{kind,final,recapture});
      await page.frameLocator('#test-ad-frame').locator('#close').click();
      await page.waitForFunction(()=>!__skyline.Portal.hostPaused,null,{timeout:2000});
      const resumed=await page.evaluate(()=>({host:__skyline.Portal.hostPaused,inAd:__skyline.Portal.inAd,paused:__skyline.paused,t:__skyline.time}));
      assert.equal(resumed.host,false,'Ad iframe blur must not leave Bridge paused');
      assert.equal(resumed.inAd,false);assert.equal(resumed.paused,false);
      await page.evaluate(()=>document.getElementById('test-ad-frame').remove());
      await page.waitForFunction(t=>__skyline.time>t,resumed.t,{timeout:2000});
    });
  }
  await check('Ad focus recovery preserves a separate platform pause and a hidden tab',async()=>{
    await page.evaluate(()=>{
      const s=__skyline;s.Portal.show('rewarded');__bridgeTest.adState('reward','opened');
      __bridgeTest.pausePlatform(true);__bridgeTest.adState('reward','closed');
    });
    assert.equal(await page.evaluate(()=>__skyline.Portal.hostPaused),true);
    await page.evaluate(()=>__bridgeTest.pausePlatform(false));
    await page.evaluate(()=>{
      __skyline.Portal.show('rewarded');__bridgeTest.adState('reward','opened');
      window.__focusCalls=0;window.__originalFocus=window.focus;window.focus=()=>window.__focusCalls++;
      Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
      __bridgeTest.adState('reward','closed');
    });
    assert.equal(await page.evaluate(()=>window.__focusCalls),0);
    assert.equal(await page.evaluate(()=>__skyline.Portal.hostPaused),true);
    await page.evaluate(()=>{delete document.hidden;window.focus=window.__originalFocus;__playgamaBoot.onState();});
  });
  await check('Reward confirmed once, applied only after closure; platform pause still wins',async()=>{
    await page.evaluate(()=>{const s=window.__skyline;s.Portal.rewardXP();window.__bridgeTest.emit('reward','opened');window.__bridgeTest.emit('pause',true);
      window.__bridgeTest.emit('reward','rewarded');window.__bridgeTest.emit('reward','rewarded');});
    assert.equal(await page.evaluate(()=>window.__skyline.Portal.boostUntil),0);
    assert.equal(await page.evaluate(()=>window.__skyline.Portal.inAd),true);
    await page.evaluate(()=>window.__bridgeTest.emit('reward','closed'));
    const until=await page.evaluate(()=>window.__skyline.Portal.boostUntil);
    assert.ok(until>0);assert.equal(await page.evaluate(()=>window.__skyline.Portal.hostPaused),true);
    await page.evaluate(()=>{window.__bridgeTest.emit('reward','closed');window.__bridgeTest.emit('reward','rewarded');});
    assert.equal(await page.evaluate(()=>window.__skyline.Portal.boostUntil),until);
    await page.evaluate(()=>window.__bridgeTest.emit('pause',false));
  });
  await check('A second request is declined while an ad is active',async()=>{
    const result=await page.evaluate(()=>{const p=window.__skyline.Portal;let denied;p.show('rewarded');
      const n=window.__bridgeTest.ads.length;p.show('rewarded',v=>denied=v);return {denied,n,after:window.__bridgeTest.ads.length};});
    assert.equal(result.denied,false);assert.equal(result.n,result.after);
    await page.evaluate(()=>window.__bridgeTest.emit('reward','failed'));
  });
  await check('Ad UI remains usable while game actions are blocked',async()=>{
    await page.evaluate(()=>{window.__skyline.Portal.show('rewarded');const b=document.createElement('button');b.id='sdk-ad-close';b.textContent='Close test ad';
      b.onclick=()=>window.__bridgeTest.emit('reward','closed');document.body.appendChild(b);});
    await page.locator('#sdk-ad-close').evaluate(b=>b.click());
    assert.equal(await page.evaluate(()=>window.__skyline.Portal.inAd),false);
    await page.evaluate(()=>document.getElementById('sdk-ad-close').remove());
  });
  await check('Power trials are only saved for completed rewarded ads',async()=>{
    await page.evaluate(()=>{delete window.__skyline.save.trials?.['lv:laser'];window.__skyline.startTrial('lv:laser','Laser Vision');window.__bridgeTest.emit('reward','closed');});
    assert.equal(await page.evaluate(()=>window.__skyline.save.trials?.['lv:laser']||0),0);
    await page.evaluate(()=>{window.__skyline.startTrial('lv:laser','Laser Vision');window.__bridgeTest.emit('reward','opened');
      window.__bridgeTest.emit('reward','rewarded');window.__bridgeTest.emit('reward','closed');});
    const remaining=await page.evaluate(()=>window.__skyline.save.trials['lv:laser']-Date.now());
    assert.ok(remaining>590000&&remaining<=600000);
  });
  await check('Meter refills and permanent cosmetics require rewarded confirmation',async()=>{
    await page.evaluate(()=>{const s=window.__skyline;s.setPaused(true);s.save.character.movement=['powerRing'];s.save.ring=25;s.refill();window.__bridgeTest.emit('reward','failed');});
    assert.equal(await page.evaluate(()=>window.__skyline.save.ring),25);
    await page.evaluate(()=>{window.__skyline.refill();window.__bridgeTest.emit('reward','rewarded');window.__bridgeTest.emit('reward','closed');});
    assert.equal(await page.evaluate(()=>window.__skyline.save.ring),100);
    await page.evaluate(()=>window.__skyline.openSheet('cos'));
    const unlock=page.getByRole('button',{name:'Watch ad · unlock',exact:true}).first();await unlock.click();
    await page.evaluate(()=>window.__bridgeTest.emit('reward','closed'));
    assert.deepEqual(await page.evaluate(()=>window.__skyline.save.cos.own),[]);
    await unlock.click();await page.evaluate(()=>{window.__bridgeTest.emit('reward','rewarded');window.__bridgeTest.emit('reward','closed');});
    assert.deepEqual(await page.evaluate(()=>window.__skyline.save.cos.own),['suit:neon']);
    await page.evaluate(()=>window.__skyline.closeSheet());
  });
  await check('Manual pause and online simulation remain suspended across ads/host pause',async()=>{
    await page.evaluate(()=>{const s=window.__skyline;s.setPaused(true);s.Portal.show('rewarded');window.__bridgeTest.emit('reward','closed');});
    assert.equal(await page.evaluate(()=>window.__skyline.paused),true);
    await page.evaluate(()=>{window.__skyline.MP.online=()=>true;window.__bridgeTest.emit('pause',true);});
    const t=await page.evaluate(()=>window.__skyline.time);await page.waitForTimeout(200);
    assert.equal(await page.evaluate(()=>window.__skyline.time),t);
    await page.evaluate(()=>{window.__skyline.MP.online=()=>false;window.__bridgeTest.emit('pause',false);});
  });
  await check('Knockout interstitial respects startup delay and three-minute cooldown',async()=>{
    const n=await page.evaluate(()=>{window.__skyline.Portal.midgame();return window.__bridgeTest.ads.length;});
    assert.equal(await page.evaluate(()=>window.__bridgeTest.ads.length),n);
    await page.evaluate(()=>{const p=window.__skyline.Portal;p.adAt=performance.now()/1000-181;p.midgame();});
    assert.deepEqual(await page.evaluate(()=>window.__bridgeTest.ads.at(-1)),{kind:'midgame',placement:'knockout'});
    await page.evaluate(()=>{window.__bridgeTest.emit('interstitial','opened');window.__bridgeTest.emit('interstitial','closed');});
    const after=await page.evaluate(()=>window.__bridgeTest.ads.length);
    await page.evaluate(()=>window.__skyline.Portal.midgame());assert.equal(await page.evaluate(()=>window.__bridgeTest.ads.length),after);
  });
  await check('Save writes batch through Bridge and survive reload',async()=>{
    const hero=await page.evaluate(async()=>{const s=window.__skyline;s.save.level=7;s.save.character.name='PG Guardian';
      window.__playgamaBoot.onPersist();await window.__playgamaBoot.flush();return s.save.character.name;});
    assert.equal(hero,'PG Guardian');assert.ok(JSON.parse(cloud).character);
    await page.addInitScript(()=>{window.__bridgeTestConfig.delayRead=false;});
    await page.reload();await loaded(page);
    assert.equal(await page.evaluate(()=>window.__skyline.save.level),7);
    assert.equal(await page.evaluate(()=>window.__skyline.save.character.name),hero);
    assert.equal(await page.evaluate(()=>window.__skyline.state),'menu');
    assert.equal(await page.evaluate(()=>window.__bridgeTest.messages.filter(x=>x.name==='game_ready').length),1);
  });
  await check('Pause Settings button opens settings in Playgama build',async()=>{
    await page.evaluate(()=>{window.__skyline.save.settings.autoLock=false;window.__skyline.start();window.__skyline.setPaused(true);});
    await page.locator('#p-set').click();assert.equal(await page.locator('#sheet').isVisible(),true);
    assert.match(await page.locator('#sheet').textContent(),/Graphics|Sound|Volume/i);
    await page.evaluate(()=>window.__skyline.closeSheet());
  });
  await check('Failed writes keep the newest progress for retry',async()=>{
    await page.evaluate(async()=>{window.__bridgeTest.failWrites=1;window.__skyline.save.level=8;window.__playgamaBoot.onPersist();await window.__playgamaBoot.flush();
      window.__skyline.save.level=9;window.__playgamaBoot.onPersist();await window.__playgamaBoot.flush();});
    assert.equal(JSON.parse(cloud).level,9);
    const batches=await page.evaluate(()=>window.__bridgeTest.writes);
    assert.ok(batches.every(x=>Array.isArray(x.keys)&&x.keys.length===1&&Array.isArray(x.values)&&x.values.length===1));
  });
  await page.screenshot({path:join(evidence,'desktop.png')});
  await context.close();
  for(const [label,config] of [['SDK initialization failure',{failInit:true}],['Storage read failure',{failRead:true}]]){
    await check(label+' shows retry without starting or overwriting progress',async()=>{
      const {context,page}=await pageWith(config);await page.waitForSelector('#pg-retry:not([hidden])');
      assert.equal(await page.evaluate(()=>!!window.__skyline),false);assert.equal(await page.evaluate(()=>window.__bridgeTest.writes.length),0);
      await context.close();
    });
  }
  await check('Unsupported ads are declined without rewards',async()=>{
    const {context,page}=await pageWith({ads:false});await loaded(page);
    assert.equal(await page.evaluate(()=>window.__skyline.Portal.ads()),false);
    assert.equal(await page.evaluate(()=>{let result;window.__skyline.Portal.show('rewarded',v=>result=v);return result;}),false);
    assert.equal(await page.evaluate(()=>window.__bridgeTest.ads.length),0);await context.close();
  });
  await check('Mobile portrait, landscape, reward UI and fullscreen',async()=>{
    const {context,page}=await pageWith({}, {viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});await loaded(page);
    await page.evaluate(()=>{window.__skyline.save.settings.autoLock=false;window.__skyline.start();});
    assert.equal(await page.locator('#rotate').isVisible(),true);
    await page.setViewportSize({width:844,height:390});
    await page.waitForFunction(()=>document.getElementById('rotate').hidden);
    await page.evaluate(()=>window.__skyline.resume());
    assert.equal(await page.locator('#touch').isVisible(),true);
    await page.locator('#hb-xp').waitFor({state:'visible'});
    assert.equal(await page.locator('#hb-xp').isEnabled(),true);
    const fs=page.locator('#hb-fs');assert.equal(await fs.isVisible(),true);await fs.click();
    await page.waitForFunction(()=>!!document.fullscreenElement);
    await page.evaluate(()=>document.exitFullscreen());
    await page.evaluate(()=>document.getElementById('tlayer').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:44,clientX:100,clientY:280,pointerType:'touch'})));
    assert.equal(await page.locator('#stick').evaluate(s=>s.classList.contains('on')),true);
    await page.locator('#hb-xp').click();assert.equal(await page.evaluate(()=>window.__skyline.Portal.inAd),true);
    assert.equal(await page.locator('#stick').evaluate(s=>s.classList.contains('on')),false);
    await page.evaluate(()=>{window.__bridgeTest.emit('reward','opened');window.__bridgeTest.emit('reward','rewarded');window.__bridgeTest.emit('reward','closed');});
    assert.ok(await page.evaluate(()=>window.__skyline.Portal.boostUntil>0));
    await page.evaluate(()=>document.getElementById('tlayer').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:45,clientX:100,clientY:280,pointerType:'touch'})));
    assert.equal(await page.locator('#stick').evaluate(s=>s.classList.contains('on')),true);
    await page.evaluate(()=>document.getElementById('tlayer').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:45})));
    await page.screenshot({path:join(evidence,'mobile-landscape.png')});await context.close();
  });
  await check('Fresh profiles wait for host resume and auto-start without a launch ad',async()=>{
    cloud=null;const {context,page}=await pageWith({auto:true,paused:true});
    await page.waitForFunction(()=>window.__playgamaBoot.readySent);
    assert.equal(await page.locator('#menu').isVisible(),true);assert.equal(await page.evaluate(()=>window.__bridgeTest.ads.length),0);
    await page.evaluate(()=>window.__bridgeTest.emit('pause',false));
    await page.waitForFunction(()=>document.getElementById('menu').hidden);
    assert.equal(await page.locator('#hud').isVisible(),true);assert.equal(await page.evaluate(()=>window.__bridgeTest.ads.length),0);
    assert.deepEqual(await page.evaluate(()=>window.__errs),[]);await context.close();
  });
  assert.deepEqual(errors,[],'Unexpected uncaught browser errors');
  writeFileSync(join(evidence,process.env.PLAYGAMA_RESULTS||'results-ad-resume.json'),JSON.stringify({timestamp:new Date().toISOString(),results,uncaughtErrors:errors,
    scope:'Controlled Bridge integration in Chrome; mobile viewport emulation, not physical devices or live Playgama ads.'},null,2)+'\n');
  console.log(results.length+' integration checks passed.');
}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
