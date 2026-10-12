// Derive the authorized solo sandbox without changing the multiplayer package.
import {readFileSync,writeFileSync,mkdirSync,cpSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const source=join(root,'dist','playgama'),out=join(root,'dist','playgama-sandbox');
let html=readFileSync(join(source,'index.html'),'utf8');
function replaceOnce(before,after){
  const i=html.indexOf(before);
  if(i<0||html.indexOf(before,i+before.length)>=0)throw new Error('Review sandbox transform: '+before.slice(0,90));
  html=html.slice(0,i)+after+html.slice(i+before.length);
}
// Apply the maintained adapter to this derivative while preserving the uploaded
// multiplayer runtime and archive. The marker excludes the following game module.
const portalStart=html.indexOf('// Playgama-only adapter.'),portalEnd=html.indexOf('Portal.init();',portalStart);
if(portalStart<0||portalEnd<0)throw new Error('Playgama adapter markers changed');
html=html.slice(0,portalStart)+readFileSync(join(root,'tools/playgama/portal.js'),'utf8').trimEnd()+html.slice(portalEnd+'Portal.init();'.length);
const oldLock="if(!now&&locked&&state==='play'&&!paused&&!manualUnlock&&!sheetOpen&&!dialOpen&&!creating)setPaused(true);";
const safeLock="if(!now&&locked&&state==='play'&&!paused&&!manualUnlock&&!sheetOpen&&!dialOpen&&!creating&&!Portal.inAd&&!Portal.hostPaused)setPaused(true);";
if(html.includes(oldLock))replaceOnce(oldLock,safeLock);
else if(!html.includes(safeLock))throw new Error('Pointer-lock pause marker changed');
// Read the frozen runtime's module, so rebuilding this QA fix does not depend on
// unrelated edits to the current multiplayer source tree.
const mpHeading=html.indexOf('// Multiplayer: other players via the claude.ai room capability');
const nextHeading=html.indexOf('// Shared city for room-code games',mpHeading);
const moduleRule='// ================================================================';
const mpStart=html.lastIndexOf(moduleRule,mpHeading),mpEnd=html.lastIndexOf(moduleRule,nextHeading);
if(mpHeading<0||nextHeading<0||mpStart<0||mpEnd<=mpStart)throw new Error('Multiplayer module markers changed');
const multiplayer=html.slice(mpStart,mpEnd).trimEnd();
// Retain the remote drawing helpers referenced by the renderer, but remove all
// room transports, signaling, TURN requests, peer creation, and reconnect timers.
const helpers=multiplayer.slice(multiplayer.indexOf('const FLAG='),multiplayer.indexOf('// Room codes:'));
replaceOnce(multiplayer,`// Solo-only Playgama sandbox: no multiplayer transport.
const MP={room:null,myPeer:null,peers:new Map(),connected:false,
  bump(){},online(){return false;},net(){return null;},status(){return '';},
  init(){},canFight(){return false;},hit(){return 0;},flush(){},sendDown(){},fx(){}};
${helpers}
const P2P={host:false,code:'',pub:0,conns:new Map(),state:'off',err:'',open:false,
  available:()=>false,statusText(){return '';},create:async()=>false,join:async()=>false,
  quick:async()=>false,leave(){},broadcast(){},sendTo(){},emit:async()=>{}};
`);
replaceOnce("const SITE_URL='https://demo-repo-dusky.vercel.app';", "const SITE_URL='';");
const uiStart=html.indexOf('function renderMP(){'),uiEnd=html.indexOf('function renderSettings(){',uiStart);
if(uiStart<0||uiEnd<0)throw new Error('Multiplayer UI markers changed');
html=html.slice(0,uiStart)+"function renderMP(){sheetBody.append(el('p',{class:'muted',text:'This sandbox supports solo play.'}));}\n"+html.slice(uiEnd);
replaceOnce("  {id:'mp',glyph:'people',key:'6',code:'Digit6',tip:'Multiplayer',act:()=>sheetToggle('mp'),on:()=>sheetOpen==='mp'||MP.online()},\n",'');
replaceOnce("$('m-mp').addEventListener('click',()=>openSheet('mp'));$('p-mp').addEventListener('click',()=>openSheet('mp'));", "$('m-mp').hidden=$('p-mp').hidden=true;");
replaceOnce("{const m=/^#room=([A-Za-z0-9]{4,8})$/.exec(location.hash);if(m&&P2P.available())P2P.join(m[1]);}",'// Room invitation links are inactive in the solo sandbox.');
// Single-player mode preserves all progression, powers, and the Bridge adapter.
let scripts=0;
for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1],{filename:'sandbox-'+(++scripts)+'.js'});
if(/new window\.Peer|RTCPeerConnection|\/api\/turn|claude\.use\('room'\)/.test(html))throw new Error('Multiplayer transport remains');
mkdirSync(join(out,'assets'),{recursive:true});
for(const name of ['bungee-license.txt','bungee.ttf','chakra-bold.ttf','chakra-license.txt','chakra-regular.ttf','chakra-semibold.ttf'])cpSync(join(source,'assets',name),join(out,'assets',name));
cpSync(join(source,'playgama-bridge-config.json'),join(out,'playgama-bridge-config.json'));
writeFileSync(join(out,'index.html'),html);
console.log('Built separate solo sandbox, '+scripts+' parsed inline scripts.');
