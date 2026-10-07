// ================================================================
// Audio. Recorded CC0 sounds (audio/sfx, see audio/CREDITS.md) and music loops (audio/music) on a bus graph with a soft
// clipper and one shared reverb; the synthesized voices stay as the fallback until the files have loaded (and in the sound lab).
//   samples / voices -> sfx / ui / amb / music bus -> mix -> soft clipper -> master (mute + volume) -> speakers
//   every bus also feeds the reverb (a generated impulse)
// SFX keeps its old API: each method below plays the recording that fits, so every call site gets the new sound for free.
// Muting goes through SFX.master (toggleMute / setVolume), also for the ad and portal mute (64_portal.js).
// ================================================================
const MIX={sfx:1,ui:0.7,amb:0.9,music:0.42,verb:0.28,voices:28}; // one place for the mix: bus levels, reverb return, live voice cap
const jit=(x,p)=>x*(1+(Math.random()*2-1)*p); // x varied by up to +-p (0.05 = 5 %), so a repeated sound is never twice the same
// the safety stage: untouched up to half scale, then rounded off towards 1, so a pile-up of voices saturates instead of clipping.
// (A DynamicsCompressorNode was tried and took ~10 dB off short hits like punches and shots, so it is not used.)
const SFX_CLIP=(()=>{const n=2049,a=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1,m=Math.abs(x);a[i]=Math.sign(x)*(m<0.5?m:0.5+0.5*Math.tanh((m-0.5)/0.5));}return a;})();
// the recorded sounds: name: [variants, gain, pitch jitter, bus, reverb send]. Files are audio/sfx/<name><i>.mp3.
const SAMPLES={punch:[5,0.62,0.07],punchHeavy:[5,0.8,0.06],hurt:[5,0.7,0.06],thump:[5,0.6,0.08],glass:[5,0.5,0.06,'sfx',0.2],glassSmall:[5,0.35,0.1,'sfx',0.2],
  metal:[5,0.5,0.06],crash:[5,0.6,0.06,'sfx',0.1],bell:[3,0.45,0.02,'sfx',0.35],step:[5,0.16,0.08],wood:[5,0.5,0.06],
  explode:[5,0.85,0.08,'sfx',0.2],explodeBig:[2,0.9,0.06,'sfx',0.3],laser:[5,0.42,0.06,'sfx',0.1],laserBig:[5,0.5,0.05,'sfx',0.15],blaster:[5,0.38,0.06,'sfx',0.1],
  shield:[5,0.45,0.04,'sfx',0.2],clang:[5,0.5,0.06,'sfx',0.15],doorOpen:[2,0.6,0.02,'sfx',0.25],doorClose:[2,0.6,0.02,'sfx',0.25],
  engine:[1,0.5,0],hum:[1,0.5,0,'sfx',0.2],whoosh:[1,0.5,0,'sfx',0.15],zap:[2,0.4,0.05,'sfx',0.15],
  powerUp:[9,0.42,0.02,'sfx',0.2],reward:[3,0.45,0,'ui',0.25],pep:[5,0.4,0.02,'ui',0.2],phaserUp:[7,0.4,0.04,'sfx',0.15],phaserDown:[3,0.4,0.04,'sfx',0.15],
  phase:[5,0.4,0.04,'sfx',0.2],alien:[5,0.4,0.05,'sfx',0.2],lockOn:[2,0.32,0,'ui',0.1],levelUp:[2,0.5,0,'ui',0.3],fanfare:[1,0.5,0,'ui',0.3],
  powerDown:[1,0.45,0.03,'sfx',0.15],fail:[1,0.45,0,'ui',0.2],
  click:[5,0.42,0.03,'ui'],hover:[6,0.16,0.03,'ui'],toggle:[4,0.4,0.03,'ui'],open:[4,0.38,0.02,'ui',0.1],close:[4,0.38,0.02,'ui',0.1],confirm:[4,0.45,0,'ui',0.15],
  back:[4,0.4,0.02,'ui'],error:[6,0.4,0.02,'ui'],select:[2,0.35,0.04,'ui'],tick:[2,0.35,0.05,'ui'],pluck:[2,0.4,0.03,'ui',0.1],bong:[1,0.4,0,'ui',0.2]};
// the named moments (SFX.play): each layers recordings, with the old synth as the fallback while the files load
const SFX_EV={
  pickup:(s,v)=>s.sample('pep',v)||s.chime(),
  reward:(s,v)=>(s.sample('reward',v)&&s.sample('pep',0.6*v,{delay:0.08}))||s.chime(),
  heal:(s,v)=>s.sample('powerUp',v,{rate:0.9})||s.chime(),
  upgrade:(s,v)=>(s.sample('confirm',v)&&s.sample('powerUp',0.7*v,{delay:0.05}))||s.chime(),
  confirm:(s,v)=>s.sample('confirm',v)||s.chime(),
  waveClear:(s,v)=>(s.sample('fanfare',v)&&s.sample('reward',0.7*v,{delay:0.1}))||s.chime(),
  stinger:(s,v)=>(s.sample('fanfare',v)&&s.sample('shield',0.6*v))||s.chime(), // a story beat: a form taken, a world saved
  door:(s,v)=>(s.sample('doorOpen',v)&&s.sample('reward',0.7*v,{delay:0.25}))||s.chime(),
  lockOn:(s,v)=>s.sample('lockOn',v,{rate:1.15})||s.tone('sine',500,900,0.08,0.06*v),
  deny:(s,v)=>s.sample('error',v)||s.tone('square',220,150,0.1,0.06*v),
  open:(s,v)=>s.sample('open',v),close:(s,v)=>s.sample('close',v),click:(s,v)=>s.sample('click',v),hover:(s,v)=>s.sample('hover',v),
  step:(s,v)=>s.sample('step',v),land:(s,v)=>s.sample('hurt',0.6*v,{rate:0.85})};
// the music: one loop per mood, crossfaded. menu = "Aurora" (Trex0n), explore = "Superhero" (Cleyton Kauffman),
// fight = "Determined Pursuit" (Emma_MA); all CC0 from OpenGameArt
const MUSIC=['menu','explore','fight'];
function sfxIR(c,len=1.8){ // a room: decaying noise that darkens as it dies, a little pre-delay, different in each ear
  const n=(c.sampleRate*len)|0,b=c.createBuffer(2,n,c.sampleRate),pre=(c.sampleRate*0.012)|0;
  for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);let lp=0;for(let i=0;i<n;i++){const t=i/n;lp+=(Math.random()*2-1-lp)*(1-(0.25+0.7*t)*0.9);d[i]=i<pre?0:lp*Math.pow(1-t,2.6);}}
  return b;}
const SFX={ctx:null,master:null,muted:false,volume:0.7,live:[],last:{},buf:{},mus:{},mood:null,fightT:-1e9,
  init(){
    if(this.ctx){if(this.ctx.state!=='running'&&this.ctx.resume)this.ctx.resume().catch(()=>{});return;}
    let c;try{c=new (window.AudioContext||window.webkitAudioContext)();}catch(e){this.ctx=null;return;}
    this.build(c);this.load();this.uiHooks();setInterval(()=>{try{this.musicTick();}catch(e){}},500);
  },
  load(){ // fetch and decode every recording; each is usable the moment it lands, the synth covers it until then
    const c=this.ctx;
    for(const k in SAMPLES){this.buf[k]=[];for(let i=0;i<SAMPLES[k][0];i++)
      fetch('audio/sfx/'+k+i+'.mp3').then(r=>{if(!r.ok)throw 0;return r.arrayBuffer();})
        .then(a=>new Promise((ok,no)=>{const p=c.decodeAudioData(a,ok,no);if(p&&p.catch)p.catch(no);}))
        .then(b=>{this.buf[k].push(b);}).catch(()=>{});}
  },
  // one recording: v (gain) and o: delay, rate, r1 (rate at the end of dur: a sweep), dur (loop it this long, faded in and out), atk lp pan bus wet pri
  sample(name,v=1,o={}){
    const c=this.ctx,L=this.buf[name],S=SAMPLES[name];if(!c||!L||!L.length)return false;if(!(v>0.003))return true;
    const b=L[L.length>1?this.pick('s'+name,L.length):0],d=o.delay||0,rate=o.rate||1,len=o.dur||b.duration/rate;
    if(!this.slot(o.pri||1,Math.min(len,2.5)+d))return true;
    const t=c.currentTime+d,s=c.createBufferSource(),r=rate*jit(1,S[2]),g=c.createGain(),pk=v*S[1];s.buffer=b;
    s.playbackRate.setValueAtTime(r,t);if(o.r1&&o.dur)s.playbackRate.exponentialRampToValueAtTime(Math.max(0.05,o.r1*r/rate),t+o.dur);
    if(o.dur){s.loop=true;const a=Math.min(o.atk||0.08,o.dur*0.4);g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(pk,t+a);
      g.gain.setValueAtTime(pk,t+Math.max(a,o.dur*0.6));g.gain.linearRampToValueAtTime(0.0001,t+o.dur);s.start(t,Math.random()*Math.max(0,b.duration-1));s.stop(t+o.dur+0.05);}
    else{g.gain.value=pk;s.start(t);}
    let out=g;s.connect(g);
    if(o.lp){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=o.lp;g.connect(f);out=f;}
    this.send(out,{pan:o.pan,bus:o.bus||S[3]||'sfx',wet:o.wet!=null?o.wet:(S[4]||0.06)});return true;
  },
  play(name,v=1){const f=SFX_EV[name];if(f&&this.ctx)f(this,v);}, // a named moment (SFX_EV)
  fight(){this.fightT=performance.now();}, // a hit or a blast near the player: the fight music comes in and stays a while
  musicTick(){ // twice a second: the menu, exploring, or a fight (recent hits, a boss bar, two or more police stars)
    if(!this.ctx)return;let m='explore';
    if(state!=='play'||paused)m='menu';
    else if(performance.now()-this.fightT<9000||(P.stars|0)>=2||!hud.bossbar.hidden)m='fight';
    if(m!==this.mood){this.mood=m;for(const k of MUSIC)this.fadeTrack(k,k===m?1:0);}
    const off=document.hidden||this.muted; // hidden tab, ad break or mute: the stream pauses instead of running silent
    for(const k in this.mus){const T=this.mus[k];if(off){if(!T.a.paused)T.a.pause();}else if(T.on&&T.a.paused)T.a.play().catch(()=>{});}
  },
  fadeTrack(k,to){ // a streamed <audio> loop through the music bus (so mute, volume and duck apply), faded over ~1.5 s
    let T=this.mus[k];
    if(!T){if(!to)return;const a=new Audio('audio/music/'+k+'.mp3');a.loop=true;a.preload='auto';let src;
      try{src=this.ctx.createMediaElementSource(a);}catch(e){return;}
      const g=this.ctx.createGain();g.gain.value=0;src.connect(g);g.connect(this.music);T=this.mus[k]={a,g,on:false,stop:0};}
    const t=this.ctx.currentTime;T.on=!!to;T.g.gain.cancelScheduledValues(t);T.g.gain.setTargetAtTime(to?1:0,t,to?0.5:0.4);clearTimeout(T.stop);
    if(to){if(T.a.paused&&!this.muted&&!document.hidden)T.a.play().catch(()=>{});}else T.stop=setTimeout(()=>{if(!T.on)T.a.pause();},2500);
  },
  uiHooks(){ // every button clicks (opening and closing a sheet adds its own sound, 70_ui.js); the mouse moving onto a button gives a soft tick
    let hv=0,hb=null;
    document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button,[role=button]');if(b&&!b.disabled)this.play('click');},true);
    document.addEventListener('pointerover',e=>{if(e.pointerType!=='mouse')return;const b=e.target.closest&&e.target.closest('button');if(!b||b===hb)return;hb=b;const n=performance.now();if(n-hv>60){hv=n;this.play('hover');}},true);
  },
  build(c){ // the whole graph on a context (also used on an OfflineAudioContext by the sound lab and the tests)
    this.ctx=c;this.live=[];this.last={};
    this.master=c.createGain();this.volume=save.settings.volume;this.master.gain.value=this.muted?0:this.volume;
    const clip=c.createWaveShaper();clip.curve=SFX_CLIP;clip.oversample='2x';
    this.mix=c.createGain();this.mix.connect(clip);clip.connect(this.master);this.master.connect(c.destination);
    this.verbIn=c.createGain();const cv=c.createConvolver();cv.buffer=sfxIR(c);const vo=c.createGain();vo.gain.value=MIX.verb;this.verbIn.connect(cv);cv.connect(vo);vo.connect(this.mix);
    for(const k of ['sfx','ui','amb','music']){const g=c.createGain();g.gain.value=MIX[k];g.connect(this.mix);this[k]=g;}
    const len=c.sampleRate*2,b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;this.noise=b;
    // loops that stay silent until a setX raises their gain
    const ws=c.createBufferSource();ws.buffer=b;ws.loop=true;const wf=c.createBiquadFilter();wf.type='bandpass';wf.frequency.value=400;wf.Q.value=0.7;
    const wg=c.createGain();wg.gain.value=0;ws.connect(wf);wf.connect(wg);wg.connect(this.amb);ws.start();this.wind={g:wg,f:wf};
    const o1=c.createOscillator();o1.type='sawtooth';o1.frequency.value=92;const o2=c.createOscillator();o2.type='square';o2.frequency.value=184.6;
    const lf=c.createBiquadFilter();lf.type='lowpass';lf.frequency.value=1500;lf.Q.value=5;const lg=c.createGain();lg.gain.value=0;
    o1.connect(lf);o2.connect(lf);lf.connect(lg);lg.connect(this.sfx);o1.start();o2.start();this.laser={g:lg,f:lf};
    const eo=c.createOscillator();eo.type='sawtooth';eo.frequency.value=40;const eo2=c.createOscillator();eo2.type='triangle';eo2.frequency.value=80.6;
    const ef=c.createBiquadFilter();ef.type='lowpass';ef.frequency.value=500;const eg=c.createGain();eg.gain.value=0;
    eo.connect(ef);eo2.connect(ef);ef.connect(eg);eg.connect(this.sfx);eo.start();eo2.start();this.eng={o:eo,o2:eo2,g:eg};
    const so=c.createOscillator();so.type='triangle';so.frequency.value=700;const sg=c.createGain();sg.gain.value=0;so.connect(sg);sg.connect(this.sfx);so.start();this.sir={o:so,g:sg};
  },
  vol(x,y,z){return clamp(1-Math.hypot(x-P.pos.x,y-P.pos.y,z-P.pos.z)/380,0,1);},
  at(x,y,z){ // where a sound sits: volume by distance, stereo pan from the side of the camera it is on, duller when far
    const dx=x-P.pos.x,dz=z-P.pos.z,d=Math.hypot(dx,y-P.pos.y,dz);
    return {v:clamp(1-d/380,0,1),pan:d>1?clamp((dx*Math.cos(P.yaw)-dz*Math.sin(P.yaw))/d,-1,1)*0.85:0,lp:clamp(14000-d*28,1800,14000)};},
  toggleMute(){this.muted=!this.muted;if(this.master)this.master.gain.value=this.muted?0:this.volume;return this.muted;},
  setVolume(v){this.volume=v;if(this.master&&!this.muted)this.master.gain.value=v;},
  duck(depth=0.5,hold=0.15,rel=0.6){ // dip the music under a big hit or a reward, then let it back
    if(!this.music)return;const g=this.music.gain,t=this.ctx.currentTime;g.cancelScheduledValues(t);g.setTargetAtTime(MIX.music*(1-depth),t,0.02);g.setTargetAtTime(MIX.music,t+hold,rel/3);},
  pick(key,n){let i=(Math.random()*n)|0;if(i===this.last[key])i=(i+1)%n;this.last[key]=i;return i;}, // which of n variants, never the same twice running
  slot(pri,dur){ // voice cap: finished voices are forgotten; when full, a minor sound is dropped and a big one (pri 2) still plays
    const t=this.ctx.currentTime,L=this.live;let n=0;for(let i=0;i<L.length;i++)if(L[i]>t)L[n++]=L[i];L.length=n;
    if(n>=MIX.voices+10||(n>=MIX.voices&&pri<2))return false;L.push(t+dur);return true;},
  send(node,o){ // pan, then the bus, then a share into the reverb
    const c=this.ctx;let out=node;
    if(o.pan&&c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=clamp(o.pan,-1,1);node.connect(p);out=p;}
    out.connect(this[o.bus||'sfx']);
    if(o.wet>0){const w=c.createGain();w.gain.value=o.wet;out.connect(w);w.connect(this.verbIn);}},
  // one tonal voice: type f0 f1 (pitch slide) dur vol delay atk hold voices (unison) spread (cents) lp lp1 (filter sweep) q wet pan bus pri
  voice(o){
    const c=this.ctx;if(!c||!(o.vol>0.003))return;const dur=o.dur,n=o.voices||1,f1=o.f1||o.f0;
    if(!this.slot(o.pri||1,dur+(o.delay||0)))return;
    const t=c.currentTime+(o.delay||0),atk=o.atk||0.004,pk=o.vol/Math.sqrt(n),g=c.createGain();
    g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(pk,t+atk);if(o.hold)g.gain.setValueAtTime(pk,t+atk+o.hold);g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
    let out=g;
    if(o.lp){const f=c.createBiquadFilter();f.type='lowpass';f.Q.value=o.q||0.7;f.frequency.setValueAtTime(o.lp,t);if(o.lp1)f.frequency.exponentialRampToValueAtTime(o.lp1,t+dur);g.connect(f);out=f;}
    for(let i=0;i<n;i++){const os=c.createOscillator();os.type=o.type||'sine';if(n>1)os.detune.value=(i/(n-1)*2-1)*(o.spread||0);
      os.frequency.setValueAtTime(o.f0,t);if(f1!==o.f0)os.frequency.exponentialRampToValueAtTime(f1,t+dur);os.connect(g);os.start(t);os.stop(t+dur+0.05);}
    this.send(out,o);
  },
  // a burst of filtered noise: ft (filter type) f0 f1 q dur vol delay atk wet pan bus pri
  noiseHit(o){
    const c=this.ctx;if(!c||!(o.vol>0.003))return;const dur=o.dur;if(!this.slot(o.pri||1,dur+(o.delay||0)))return;
    const t=c.currentTime+(o.delay||0),s=c.createBufferSource();s.buffer=this.noise;s.loop=true;
    const f=c.createBiquadFilter();f.type=o.ft||'lowpass';f.Q.value=o.q||0.7;f.frequency.setValueAtTime(o.f0,t);if(o.f1)f.frequency.exponentialRampToValueAtTime(o.f1,t+dur);
    const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(o.vol,t+(o.atk||0.003));g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
    s.connect(f);f.connect(g);s.start(t,Math.random()*1.5);s.stop(t+dur+0.05);this.send(g,o);
  },
  bell(f,v,delay=0,dur=0.6){ // a struck bell: the note, a bright inharmonic partial that dies fast, a soft octave, all into the reverb
    this.voice({type:'sine',f0:f,dur,vol:v,delay,wet:0.35,atk:0.002});
    this.voice({type:'sine',f0:f*2.76,dur:dur*0.35,vol:v*0.35,delay,wet:0.3,atk:0.002});
    this.voice({type:'triangle',f0:f*2,dur:dur*0.5,vol:v*0.25,delay,wet:0.3,atk:0.002});},
  // ---- continuous ----
  setLaser(on){if(!this.ctx)return;const t=this.ctx.currentTime;this.laser.g.gain.setTargetAtTime(on?0.08:0,t,0.03);this.laser.f.frequency.setTargetAtTime(on?1300+Math.random()*500:600,t,0.05);},
  setWind(v){if(!this.ctx)return;const t=this.ctx.currentTime;this.wind.g.gain.setTargetAtTime(v*0.28,t,0.15);this.wind.f.frequency.setTargetAtTime(250+v*1100,t,0.2);},
  setEngine(on,k){if(!this.eng)return;const t=this.ctx.currentTime;
    if(!this.engS&&on&&this.buf.engine&&this.buf.engine.length){const s=this.ctx.createBufferSource();s.buffer=this.buf.engine[0];s.loop=true;const g=this.ctx.createGain();g.gain.value=0;s.connect(g);g.connect(this.sfx);s.start();this.engS={s,g};}
    if(this.engS){this.engS.g.gain.setTargetAtTime(on?0.25+k*0.3:0,t,0.12);this.engS.s.playbackRate.setTargetAtTime(0.6+k*0.9,t,0.1);this.eng.g.gain.setTargetAtTime(0,t,0.05);return;} // the recorded engine, revving with speed
    this.eng.g.gain.setTargetAtTime(on?0.05+k*0.06:0,t,0.08);this.eng.o.frequency.setTargetAtTime(38+k*120,t,0.08);this.eng.o2.frequency.setTargetAtTime(76.6+k*240,t,0.08);},
  setSiren(v){if(!this.sir)return;const t=this.ctx.currentTime;this.sir.g.gain.setTargetAtTime(v*0.05,t,0.1);this.sir.o.frequency.setTargetAtTime(Math.sin(t*6)>0?760:560,t,0.02);},
  // ---- one-shots ----
  boom(v=1,len=1.1){if(!this.ctx||v<=0.01)return;const big=len>0.7,pri=v>0.5?2:1; // body, sub drop, a crack on the front, a growl under the long ones
    if(v>0.4)this.fight();
    if(v<0.3&&len<0.4&&this.sample('thump',v*2.2,{rate:jit(0.8,0.1)}))return; // the small ones (under a hit or a shot) are a thud
    if(this.sample('explode',v,{pri,rate:big?0.85:1.1})){if(big)this.sample('explodeBig',v*0.9,{pri,rate:len>2?0.8:1});
      this.voice({type:'sine',f0:jit(100,0.06),f1:28,dur:len*0.6,vol:0.45*v,pri});if(v>0.6)this.duck(0.5,0.12,0.7);return;}
    this.noiseHit({ft:'lowpass',f0:jit(2000,0.1),f1:70,q:0.8,dur:len,vol:0.9*v,pri,wet:big?0.25:0.1});
    this.voice({type:'sine',f0:jit(115,0.06),f1:28,dur:len*0.75,vol:0.8*v,pri});
    this.noiseHit({ft:'highpass',f0:3000,dur:0.05,vol:0.3*v});
    if(big)this.voice({type:'sawtooth',f0:55,f1:30,dur:len*0.9,vol:0.14*v,voices:2,spread:14,lp:240,wet:0.3,pri});
    if(v>0.6)this.duck(0.5,0.12,0.7);},
  tone(type,f0,f1,dur,v,delay=0){if(!this.ctx||v<=0.01)return;const j=1+(Math.random()-0.5)*0.01; // the 230-odd direct calls: a detuned pair, softened top, a touch of room
    if(this.toneSample(type,f0,f1,dur,v,delay))return;
    this.voice({type,f0:f0*j,f1:f1*j,dur,vol:v,delay,voices:2,spread:7,lp:type==='sine'?0:Math.min(16000,Math.max(f0,f1)*7+400),wet:0.12});},
  // each direct tone() call is matched to a recording by its shape: how long, how far and which way the pitch slides, the wave.
  // Low rumbles -> explosions slowed down; long rises and falls -> the big engine swept up or down; short square drops -> "no";
  // short square rises -> blaster shots; quick triangle drops -> web shots; other blips -> UI ticks; mid rises/falls -> phasers;
  // steady high sines -> a bell; the rest -> a force field.
  toneSample(type,f0,f1,dur,v,delay){
    const r=f1/f0,hi=Math.max(f0,f1),k=v*3,o={delay};
    if(hi<=130)return dur>=0.9?this.sample('explodeBig',k*0.8,{delay,rate:0.6,pri:2}):this.sample('hurt',k,{delay,rate:0.7});
    if(dur>=0.9){if(hi<=320&&r<1)return this.sample('explodeBig',k*0.7,{delay,rate:0.55,pri:2});
      return this.sample('hum',k,{delay,dur,rate:r>=1?0.45:1.7,r1:r>=1?1.8:0.45,atk:r>=1?dur*0.5:0.05});}
    if(dur<=0.13){
      if(type==='square'&&r<1&&hi<=420)return this.sample('error',k*2.2,o);
      if(type==='square'&&r>1.5&&f1>=1000)return this.sample('blaster',k*1.2,o);
      if(type==='triangle'&&r<0.75)return this.sample('laser',k*0.8,{delay,rate:1.5});
      return this.sample(r>=1?'select':'tick',k*1.2,{delay,rate:clamp(hi/900,0.7,1.6)});}
    if(r>=1.3)return this.sample(type==='sawtooth'?'phaserUp':'powerUp',k,{delay,rate:type==='sawtooth'?0.8:1});
    if(r<=0.77){if(f0>=1400&&type!=='sine')return this.sample('laserBig',k,o);
      return this.sample(type==='square'||f0<=400?'powerDown':'phaserDown',k,o);}
    if(type==='sine'&&hi>=1500)return this.sample('bell',k,{delay,rate:hi/1900});
    return this.sample('shield',k*0.8,{delay,dur:Math.max(0.15,dur)});
  },
  zap(v=1){this.fight();if(this.sample('laser',0.35*v))return;this.voice({type:'sawtooth',f0:jit(1000,0.1),f1:200,dur:0.17,vol:0.09*v,voices:2,spread:25,lp:3500,lp1:500,wet:0.18});
    this.noiseHit({ft:'highpass',f0:5000,dur:0.05,vol:0.06*v,delay:0.01});},
  hit(){this.fight();if(this.sample('hurt',1)){this.sample('punch',0.5,{rate:0.8});return;}this.voice({type:'sawtooth',f0:jit(160,0.1)*(1+this.pick('hit',3)*0.12),f1:50,dur:0.25,vol:0.2,voices:2,spread:10,lp:1800,lp1:200,wet:0.1});
    this.voice({type:'sine',f0:120,f1:38,dur:0.3,vol:0.2});
    this.noiseHit({ft:'bandpass',f0:jit(2400,0.2),f1:600,q:1.2,dur:0.09,vol:0.14});this.boom(0.12,0.28);},
  chime(){if(this.sample('reward',1))return;this.bell(880,0.13);this.bell(1320,0.1,0.08);this.bell(1760,0.08,0.16);}, // the generic sparkle; the specific rewards get their own
  levelUp(){if(this.sample('fanfare',1,{pri:2})){this.sample('levelUp',0.8,{delay:0.5,pri:2});this.sample('powerUp',0.6,{delay:0.15});this.duck(0.5,0.6,0.8);return;}
    const n=[523.25,659.25,783.99,1046.5];
    n.forEach((f,i)=>{this.voice({type:'sawtooth',f0:f,dur:0.4,vol:0.045,delay:i*0.09,voices:3,spread:12,lp:3200,lp1:1200,wet:0.3,atk:0.01});this.bell(f*2,0.045,i*0.09,0.5);});
    n.forEach(f=>this.voice({type:'sawtooth',f0:f,dur:1.2,vol:0.04,delay:0.4,voices:3,spread:14,lp:2800,lp1:900,wet:0.4,atk:0.02,hold:0.3,pri:2}));
    this.voice({type:'sine',f0:130.8,f1:65.4,dur:0.9,vol:0.2,delay:0.4,pri:2});this.duck(0.5,0.4,0.8);},
  alarm(){for(let i=0;i<3;i++)this.voice({type:'sawtooth',f0:700,f1:420,dur:0.28,vol:0.06,voices:3,spread:14,lp:2400,delay:i*0.32,wet:0.2,pri:2});},
  whoosh(){const up=Math.random()<0.5; // a rising or falling rush, panned a little, with a soft thud under it
    if(this.sample('whoosh',1.5,{dur:0.5,rate:up?0.7:1.5,r1:up?1.5:0.7,atk:0.15,pan:rr(-0.35,0.35)}))return;
    this.noiseHit({ft:'bandpass',f0:up?350:2200,f1:up?2200:350,q:1.1,dur:0.5,vol:0.5,atk:0.12,pan:rr(-0.35,0.35),wet:0.2});
    this.voice({type:'sine',f0:90,f1:40,dur:0.3,vol:0.16,atk:0.06});},
  swish(){if(this.sample('whoosh',0.55,{dur:0.14,rate:1.6,r1:2.4,atk:0.03,pan:rr(-0.2,0.2)}))return;this.noiseHit({ft:'bandpass',f0:jit(700,0.2),f1:jit(2200,0.2),q:1.6,dur:0.11,vol:0.3,atk:0.02,pan:rr(-0.2,0.2)});},
  glass(v=1){if(!this.ctx||v<=0.02)return;if(this.sample('glass',v)){this.sample('glassSmall',0.7*v,{delay:rr(0.05,0.12)});return;}this.noiseHit({ft:'highpass',f0:4500,dur:0.12,vol:0.09*v,wet:0.2}); // a snap, then falling shards (a ring and a bright partial each)
    for(let i=0;i<7;i++){const f=rr(2400,6200);this.voice({type:'sine',f0:f,f1:f*rr(0.6,0.9),dur:rr(0.1,0.35),vol:0.03*v,delay:i*rr(0.015,0.045),wet:0.35,pan:rr(-0.5,0.5)});
      this.voice({type:'sine',f0:f*2.76,f1:f*2.5,dur:0.08,vol:0.015*v,delay:i*0.03,wet:0.3});}},
  crash(v=1){if(v<=0.02)return;if(this.sample('crash',v)){this.sample('metal',0.8*v,{delay:0.03});this.sample('thump',v,{rate:0.7});return;}this.boom(0.6*v,0.5);
    this.voice({type:'square',f0:jit(180,0.1),f1:60,dur:0.3,vol:0.1*v,lp:1200,wet:0.15});
    this.noiseHit({ft:'bandpass',f0:jit(1200,0.3),f1:400,q:2,dur:0.4,vol:0.2*v,delay:0.02,wet:0.15});
    for(let i=0;i<3;i++)this.voice({type:'triangle',f0:rr(300,900),f1:rr(120,300),dur:0.15,vol:0.05*v,delay:rr(0.02,0.18)});}, // metal
  splash(v=1){if(v<=0.02)return;this.noiseHit({ft:'bandpass',f0:3000,f1:450,q:0.8,dur:0.7,vol:0.4*v,atk:0.015,wet:0.15});
    this.noiseHit({ft:'lowpass',f0:700,f1:150,dur:0.8,vol:0.22*v});this.voice({type:'sine',f0:jit(650,0.15),f1:200,dur:0.12,vol:0.07*v,delay:0.03});},
  honk(v=1){if(v<=0.05)return;const d=jit(1,0.04);
    this.voice({type:'sawtooth',f0:420*d,f1:405*d,dur:0.26,vol:0.05*v,voices:2,spread:9,lp:1700,atk:0.012,hold:0.14});
    this.voice({type:'sawtooth',f0:520*d,f1:500*d,dur:0.26,vol:0.04*v,voices:2,spread:9,lp:1700,atk:0.012,hold:0.14});},
  transform(){if(this.sample('shield',1,{pri:2})){this.sample('phaserUp',0.9,{rate:0.7,pri:2});this.sample('powerUp',0.7,{delay:0.25});this.boom(0.55,0.7);return;}this.noiseHit({ft:'bandpass',f0:300,f1:5500,q:1.5,dur:0.5,vol:0.2,atk:0.3,wet:0.2,pri:2});
    this.voice({type:'sawtooth',f0:200,f1:1600,dur:0.5,vol:0.1,voices:3,spread:18,lp:5000,wet:0.2,pri:2,atk:0.15});
    this.voice({type:'sine',f0:400,f1:2400,dur:0.6,vol:0.1,delay:0.05,wet:0.25});this.boom(0.55,0.7);},
  gun(v){if(v<=0.02)return;const k=this.pick('gun',3); // a snap, a body, a short tail; three crack timbres in rotation
    this.voice({type:'sawtooth',f0:jit(340,0.07),f1:90,dur:0.1,vol:0.11*v,voices:2,spread:12,lp:2600,lp1:400,pan:rr(-0.12,0.12),wet:0.1});
    this.voice({type:'square',f0:jit(180,0.05),f1:60,dur:0.08,vol:0.05*v});
    this.noiseHit({ft:'bandpass',f0:[3200,2600,3800][k],f1:900,q:0.9,dur:0.07,vol:0.25*v,wet:0.12});this.boom(0.1*v,0.16);},
  punch(v=1){if(v<=0.02)return;const k=this.pick('punch',3); // a thump, a knock, a slap; three slap timbres in rotation
    if(v>0.5)this.fight();if(this.sample(v>=0.95&&Math.random()<0.45?'punchHeavy':'punch',v))return;
    this.voice({type:'sine',f0:jit(140,0.1),f1:45,dur:0.15,vol:0.34*v});
    this.voice({type:'triangle',f0:jit(320,0.12)+k*40,f1:110,dur:0.07,vol:0.18*v,lp:1500});
    this.noiseHit({ft:'lowpass',f0:[1800,2600,1300][k],f1:260,dur:0.16,vol:0.2*v,wet:0.06});}
};
