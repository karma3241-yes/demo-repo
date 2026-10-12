// Smoke-test the actual CDN Bridge and its local mock platform. No fake Bridge APIs.
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve,join,extname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const here=dirname(fileURLToPath(import.meta.url)),dist=resolve(here,'../../dist',process.env.PLAYGAMA_DIST||'playgama');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/Users/ASUS/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs').href);
const server=createServer((req,res)=>{
  const path=resolve(dist,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!path.startsWith(dist+'\\')){res.writeHead(403).end();return;}
  try{res.setHeader('content-type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.ttf':'font/ttf'})[extname(path)]||'text/plain');res.end(readFileSync(path));}
  catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,
  args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']});
const requests=[],messages=[],errors=[];
try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  page.on('request',req=>{requests.push(req.url());});
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{messages.push({type:m.type(),text:m.text().slice(0,240)});});
  await page.addInitScript(()=>{window.__SKYLINE_TEST__=true;});
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
  await page.waitForFunction(()=>window.__skyline&&window.__playgamaBoot.readySent,{},{timeout:60000});
  const boot=await page.evaluate(()=>({platform:bridge.platform.id,language:bridge.platform.language,
    rewarded:bridge.advertisement.isRewardedSupported,interstitial:bridge.advertisement.isInterstitialSupported,
    authorizationSupported:bridge.player.isAuthorizationSupported,authorized:bridge.player.isAuthorized,
    ready:window.__playgamaBoot.readySent,errs:window.__errs}));
  assert.equal(boot.ready,true);assert.deepEqual(boot.errs,[]);
  assert.equal(await page.locator('#m-signin').isVisible(),!!(boot.authorizationSupported||boot.authorized));
  await page.evaluate(async()=>{window.__skyline.save.settings.autoLock=false;window.__skyline.start();
    window.__skyline.save.character.name='SDK Guardian';window.__playgamaBoot.onPersist();await window.__playgamaBoot.flush();});
  await page.reload();await page.waitForFunction(()=>window.__skyline&&window.__playgamaBoot.readySent,{},{timeout:60000});
  assert.equal(await page.evaluate(()=>window.__skyline.save.character.name),'SDK Guardian');
  assert.deepEqual(await page.evaluate(()=>window.__errs),[]);assert.deepEqual(errors,[]);
  const evidence=join(here,'evidence');mkdirSync(evidence,{recursive:true});
  writeFileSync(join(evidence,process.env.PLAYGAMA_RESULTS||'real-bridge.json'),JSON.stringify({timestamp:new Date().toISOString(),result:'passed',
    scope:'Actual CDN SDK initialization, config, local mock-platform storage write/reload; no live ads, accounts or portal iframe.',boot,requests,messages,errors},null,2)+'\n');
  console.log('PASS real CDN Bridge, platform '+boot.platform+', save and reload; external requests:');
  console.log(JSON.stringify([...new Set(requests.filter(x=>!x.includes('127.0.0.1')))],null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
