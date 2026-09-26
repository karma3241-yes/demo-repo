// ================================================================
// Saying the oath out loud: the browser's speech recognition listens while the lantern is up
// ================================================================
// Settings → Ring oath picks "Say it out loud" (the default where the browser can listen) or "Type it".
// In voice mode the game asks for the microphone when you start playing as the Ring Bearer, and O starts listening.
// Words are matched loosely and in order (a missed or misheard word is skipped), so the ring charges as you speak.
// Typing still works as a fallback while listening.
const SpeechRec=window.SpeechRecognition||window.webkitSpeechRecognition||null;
const voiceOK=()=>!!SpeechRec;
const oathVoice=()=>save.settings.oathInput==='voice'&&voiceOK()&&!voiceBlocked;
let voiceFails=0,voiceRec=null,voiceBlocked=false,voicePtr=0,voiceBase=0,micAsked=false,voiceHeard='';
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
    if(er&&er!=='no-speech'&&er!=='aborted'&&++voiceFails>=3&&!voiceBlocked){voiceBlocked=true;voiceNote('Speech recognition is not working here right now · type the oath instead');feed('Can\'t listen right now','Type the oath instead');return;} // e.g. offline: stop retrying
    if(er==='not-allowed'||er==='service-not-allowed'||er==='audio-capture'){voiceBlocked=true;voiceNote('The microphone is blocked here · type the oath instead ('+(touchOn()?'NEXT WORD':'Tab')+' fills words once you know it)');feed('Microphone blocked','Type the oath instead · allow the mic in your browser to speak it');}};
  voiceRec.onend=()=>{const r=voiceRec;if(!r)return;if(oathOpen&&oathVoice()){voiceBase=voicePtr;setTimeout(()=>{if(voiceRec===r&&oathOpen)try{r.start();}catch(e){}},120);}}; // it stops after a pause: keep listening
  try{voiceRec.start();voiceNote('🎙 Listening · say the oath out loud (you can still type it) · Enter puts the lantern away');}catch(e){voiceRec=null;}
}
function voiceOathStop(){const r=voiceRec;voiceRec=null;if(r)try{r.onend=null;r.abort();}catch(e){}}
// ask for the microphone up front (once per session) so the first oath is not interrupted by the prompt
function askMic(force){
  if((micAsked&&!force)||save.settings.oathInput!=='voice'||!voiceOK()||!hasTrav('powerRing'))return;micAsked=true;voiceBlocked=false;
  const md=navigator.mediaDevices;if(!md||!md.getUserMedia)return;
  md.getUserMedia({audio:true}).then(s=>{for(const t of s.getTracks())t.stop();feed('Microphone ready','Press O and say the oath out loud');})
    .catch(()=>{voiceBlocked=true;feed('No microphone','You can still type the oath · switch in Settings');});
}
