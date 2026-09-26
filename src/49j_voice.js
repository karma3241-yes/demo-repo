// ================================================================
// Saying the oath out loud: the browser's speech recognition listens while the lantern is up
// ================================================================
// Settings → Ring oath picks "Say it out loud" (the default where the browser can listen) or "Type it".
// In voice mode the game asks for the microphone when you start playing as the Ring Bearer, and O starts listening.
// Words are matched loosely and in order (a missed or misheard word is skipped), so the ring charges as you speak.
// While it listens you move and fight freely, but ring powers and constructs wait until you finish (O or Esc puts it away).
// If listening fails (no speech service, mic blocked) the oath carries on as the typed one: suspended, keys typed into it.
// Say it loudly: if your voice passes the Settings line at any point, finishing the oath overcharges the ring to 200.
const SpeechRec=window.SpeechRecognition||window.webkitSpeechRecognition||null;
const voiceOK=()=>!!SpeechRec;
const oathVoice=()=>save.settings.oathInput==='voice'&&voiceOK()&&!voiceBlocked;
let voiceFails=0,voiceRec=null,voiceBlocked=false,voicePtr=0,voiceBase=0,micAsked=false,voiceHeard='',voicePeak=0;
// letters only, then fold spellings that sound the same (light / lite, fear / fere, will / wil)
const vNorm=w=>w.toLowerCase().replace(/[^a-z]/g,'').replace(/ight/g,'ite').replace(/ph/g,'f').replace(/ck/g,'k').replace(/(.)\1+/g,'$1').replace(/(.{3,})e$/,'$1');
function vLev(a,b){const m=a.length,n=b.length;let prev=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){const cur=[i];for(let j=1;j<=n;j++)cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=cur;}return prev[n];}
function vClose(a,b){if(a===b)return true;if(a.length<3||b.length<3)return false;
  if(a.startsWith(b)||b.startsWith(a))return Math.abs(a.length-b.length)<=2;return vLev(a,b)<=(b.length>6?2:1);}
const OATH_WORDS=()=>OATH.split(' ');
// how many oath words the spoken text covers, carrying on from `from`
function voiceMatch(text,from){const W=OATH_WORDS().map(vNorm);let p=from;
  for(const s of text.split(/\s+/).map(vNorm).filter(Boolean)){if(p>=W.length)break;
    if(vClose(s,W[p]))p++;else if(p+1<W.length&&vClose(s,W[p+1]))p+=2;else if(p+2<W.length&&vClose(s,W[p+2]))p+=3;}
  return p;}
function voiceApply(){if(!oathOpen)return;const want=OATH_WORDS().slice(0,voicePtr).join(' ')+(voicePtr<OATH_WORDS().length?' ':'');
  if(oathNorm(want).length>oathNorm(oathIn.value).length){oathIn.value=want;oathIn.dispatchEvent(new Event('input'));}}
function voiceNote(t){const n=$('oath-note');if(n&&oathOpen)n.textContent=t;}
function voiceOathStart(){
  if(!oathVoice())return;voicePtr=0;voiceBase=0;voiceHeard='';
  try{voiceRec=new SpeechRec();}catch(e){voiceRec=null;return;}
  voiceRec.lang='en-US';voiceRec.continuous=true;voiceRec.interimResults=true;voiceRec.maxAlternatives=1;
  voiceRec.onresult=e=>{voiceFails=0;let t='';for(let i=0;i<e.results.length;i++)t+=' '+e.results[i][0].transcript;voiceHeard=t.trim();
    voicePtr=Math.max(voicePtr,voiceMatch(voiceHeard,voiceBase));voiceApply();voiceNote('🎙 "'+voiceHeard.slice(-70)+'"');};
  voiceRec.onerror=e=>{const er=e&&e.error;
    if(er&&er!=='no-speech'&&er!=='aborted'&&++voiceFails>=3&&!voiceBlocked){voiceBlocked=true;oathTyped();voiceNote('Speech recognition is not working here right now · type the oath instead');feed('Can\'t listen right now','Type the oath instead');return;} // e.g. offline: stop retrying
    if(er==='not-allowed'||er==='service-not-allowed'||er==='audio-capture'){voiceBlocked=true;oathTyped();voiceNote('The microphone is blocked here · type the oath instead ('+(touchOn()?'NEXT WORD':'Tab')+' fills words once you know it)');feed('Microphone blocked','Type the oath instead · allow the mic in your browser to speak it');}};
  voiceRec.onend=()=>{const r=voiceRec;if(!r)return;if(oathOpen&&oathVoice()){voiceBase=voicePtr;setTimeout(()=>{if(voiceRec===r&&oathOpen)try{r.start();}catch(e){}},120);}}; // it stops after a pause: keep listening
  try{voiceRec.start();voiceNote('🎙 Listening · say the oath out loud, loudly to overcharge the ring'+(touchOn()?' (you can still type it) · tap OATH':' · O or Esc')+' puts the lantern away');}catch(e){voiceRec=null;}
}
function voiceOathStop(){const r=voiceRec;voiceRec=null;if(r)try{r.onend=null;r.abort();}catch(e){}}
// ask for the microphone up front (once per session) so the first oath is not interrupted by the prompt
function askMic(force){
  if((micAsked&&!force)||save.settings.oathInput!=='voice'||!voiceOK()||!hasTrav('powerRing'))return;micAsked=true;voiceBlocked=false;
  const md=navigator.mediaDevices;if(!md||!md.getUserMedia)return;
  md.getUserMedia({audio:true}).then(s=>{for(const t of s.getTracks())t.stop();feed('Microphone ready','Press O and say the oath out loud');})
    .catch(()=>{voiceBlocked=true;feed('No microphone','You can still type the oath · switch in Settings');});
}
// ---- how loud you are ----
// While the voice oath listens (or Settings tests the mic) the mic runs into an analyser: level is 0-1 (-60 dB to 0 dB, RMS).
// The loudest moment of the oath is kept; past save.settings.micLoud, finishing the oath overcharges the ring.
// The stream and its AudioContext are released as soon as nothing needs them (the oath closes, Settings closes).
const MIC={users:new Set(),ctx:null,stream:null,an:null,buf:null,level:0,raf:0};
const oathLoud=()=>voicePeak>=save.settings.micLoud;
function micOn(who){
  MIC.users.add(who);if(MIC.ctx)return;
  const md=navigator.mediaDevices,AC=window.AudioContext||window.webkitAudioContext;if(!md||!md.getUserMedia||!AC)return;
  let ctx;try{ctx=new AC();}catch(e){return;}MIC.ctx=ctx;MIC.level=0; // made inside the key press or click, so it is allowed to run
  md.getUserMedia({audio:{autoGainControl:false}}).then(s=>{ // no auto gain: it would turn a shout back down
    if(MIC.ctx!==ctx){for(const t of s.getTracks())t.stop();return;}
    MIC.stream=s;const an=ctx.createAnalyser();an.fftSize=1024;ctx.createMediaStreamSource(s).connect(an);MIC.an=an;MIC.buf=new Float32Array(an.fftSize);
    if(ctx.resume)ctx.resume().catch(()=>{});cancelAnimationFrame(MIC.raf);micTick();
  }).catch(()=>{if(MIC.ctx===ctx)micRelease();});
}
function micOff(who){MIC.users.delete(who);if(!MIC.users.size&&MIC.ctx)micRelease();}
function micRelease(){cancelAnimationFrame(MIC.raf);MIC.raf=0;if(MIC.stream)for(const t of MIC.stream.getTracks())t.stop();
  const c=MIC.ctx;MIC.ctx=null;MIC.stream=null;MIC.an=null;MIC.level=0;if(c)try{c.close();}catch(e){}micShow();}
function micTick(){
  if(MIC.users.has('test')&&(sheetOpen!=='set'||!$('set-miclvl'))){micOff('test');if(!MIC.ctx)return;}
  MIC.raf=requestAnimationFrame(micTick);if(!MIC.an)return;
  MIC.an.getFloatTimeDomainData(MIC.buf);let e=0;for(let i=0;i<MIC.buf.length;i++)e+=MIC.buf[i]*MIC.buf[i];
  MIC.level=clamp((10*Math.log10(e/MIC.buf.length+1e-12)+60)/60,0,1);
  if(oathOpen&&oathFree){const was=oathLoud();voicePeak=Math.max(voicePeak,MIC.level);if(!was&&oathLoud()){feed('Loud and clear','Finish the oath to overcharge the ring to '+RING_MAX);SFX.tone('sine',600,1200,0.25,0.06);}}
  micShow();
}
// the level bars: in the oath panel (lights up once the oath is loud enough) and in Settings (lights up while you are past the line)
function micShow(){const thr=save.settings.micLoud;
  for(const id of ['oath-lvl','set-miclvl']){const e=$(id);if(!e||e.hidden)continue;
    e.style.setProperty('--lvl',(MIC.level*100).toFixed(1)+'%');e.style.setProperty('--thr',(thr*100).toFixed(1)+'%');
    e.classList.toggle('hit',id==='oath-lvl'?oathLoud():MIC.level>=thr);}}

