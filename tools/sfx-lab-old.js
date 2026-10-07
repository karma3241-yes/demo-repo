const SFX_OLD={ctx:null,master:null,muted:false,volume:0.7,
  init(){
    if(this.ctx){if(this.ctx.state!=='running'&&this.ctx.resume)this.ctx.resume().catch(()=>{});return;}
    try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){this.ctx=null;return;}
    const c=this.ctx;this.master=c.createGain();this.volume=save.settings.volume;this.master.gain.value=this.muted?0:this.volume;this.master.connect(c.destination);
    const len=c.sampleRate*2,b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;this.noise=b;
    const ws=c.createBufferSource();ws.buffer=b;ws.loop=true;const wf=c.createBiquadFilter();wf.type='bandpass';wf.frequency.value=400;wf.Q.value=0.7;
    const wg=c.createGain();wg.gain.value=0;ws.connect(wf).connect(wg).connect(this.master);ws.start();this.wind={g:wg,f:wf};
    const o1=c.createOscillator();o1.type='sawtooth';o1.frequency.value=92;const o2=c.createOscillator();o2.type='square';o2.frequency.value=184.6;
    const lf=c.createBiquadFilter();lf.type='lowpass';lf.frequency.value=1500;lf.Q.value=5;const lg=c.createGain();lg.gain.value=0;
    o1.connect(lf);o2.connect(lf);lf.connect(lg).connect(this.master);o1.start();o2.start();this.laser={g:lg,f:lf};this.loops();
  },
  vol(x,y,z){return clamp(1-Math.hypot(x-P.pos.x,y-P.pos.y,z-P.pos.z)/380,0,1);},
  setLaser(on){if(!this.ctx)return;const t=this.ctx.currentTime;this.laser.g.gain.setTargetAtTime(on?0.08:0,t,0.03);this.laser.f.frequency.setTargetAtTime(on?1300+Math.random()*500:600,t,0.05);},
  setWind(v){if(!this.ctx)return;const t=this.ctx.currentTime;this.wind.g.gain.setTargetAtTime(v*0.28,t,0.15);this.wind.f.frequency.setTargetAtTime(250+v*1100,t,0.2);},
  boom(v=1,len=1.1){if(!this.ctx||v<=0.01)return;const c=this.ctx,t=c.currentTime;
    const s=c.createBufferSource();s.buffer=this.noise;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(1800,t);f.frequency.exponentialRampToValueAtTime(80,t+len);
    const g=c.createGain();g.gain.setValueAtTime(0.9*v,t);g.gain.exponentialRampToValueAtTime(0.001,t+len);s.connect(f).connect(g).connect(this.master);s.start(t,Math.random());s.stop(t+len);
    const o=c.createOscillator();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(30,t+len*0.7);const og=c.createGain();og.gain.setValueAtTime(0.8*v,t);og.gain.exponentialRampToValueAtTime(0.001,t+len*0.7);
    o.connect(og).connect(this.master);o.start(t);o.stop(t+len);},
  tone(type,f0,f1,dur,v,delay=0){if(!this.ctx||v<=0.01)return;const c=this.ctx,t=c.currentTime+delay;const o=c.createOscillator();o.type=type;
    o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);const g=c.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g).connect(this.master);o.start(t);o.stop(t+dur+0.02);},
  zap(v){this.tone('square',900,220,0.16,0.07*v);},
  hit(){this.tone('sawtooth',160,50,0.25,0.25);this.boom(0.25,0.3);},
  chime(){this.tone('sine',880,880,0.25,0.18);this.tone('sine',1320,1320,0.35,0.14,0.08);this.tone('sine',1760,1760,0.5,0.1,0.16);},
  levelUp(){[523,659,784,1047].forEach((f,i)=>this.tone('triangle',f,f,0.35,0.16,i*0.09));},
  alarm(){for(let i=0;i<3;i++)this.tone('sawtooth',700,420,0.28,0.07,i*0.32);},
  whoosh(){this.boom(0.35,0.5);},
  glass(v=1){if(!this.ctx||v<=0.02)return;for(let i=0;i<5;i++)this.tone('triangle',rr(2200,4200),rr(1200,2000),rr(0.08,0.25),0.05*v,i*0.03);},
  crash(v=1){if(v<=0.02)return;this.boom(0.6*v,0.5);this.tone('square',180,60,0.3,0.12*v);},
  splash(v=1){this.boom(0.2*v,0.8);},
  honk(v=1){if(v<=0.05)return;this.tone('square',420,420,0.25,0.06*v);this.tone('square',520,520,0.25,0.05*v);},
  transform(){this.tone('sawtooth',200,1600,0.5,0.14);this.tone('sine',400,2400,0.6,0.12,0.05);this.boom(0.5,0.6);},
  loops(){if(!this.ctx||this.eng)return;const c=this.ctx;
    const eo=c.createOscillator();eo.type='sawtooth';eo.frequency.value=40;const ef=c.createBiquadFilter();ef.type='lowpass';ef.frequency.value=500;const eg=c.createGain();eg.gain.value=0;eo.connect(ef).connect(eg).connect(this.master);eo.start();this.eng={o:eo,g:eg};
    const so=c.createOscillator();so.type='triangle';so.frequency.value=700;const sg=c.createGain();sg.gain.value=0;so.connect(sg).connect(this.master);so.start();this.sir={o:so,g:sg};},
  setEngine(on,k){if(!this.eng)return;const t=this.ctx.currentTime;this.eng.g.gain.setTargetAtTime(on?0.05+k*0.06:0,t,0.08);this.eng.o.frequency.setTargetAtTime(38+k*120,t,0.08);},
  setSiren(v){if(!this.sir)return;const t=this.ctx.currentTime;this.sir.g.gain.setTargetAtTime(v*0.05,t,0.1);this.sir.o.frequency.setTargetAtTime(Math.sin(t*6)>0?760:560,t,0.02);},
  toggleMute(){this.muted=!this.muted;if(this.master)this.master.gain.value=this.muted?0:this.volume;return this.muted;},
  setVolume(v){this.volume=v;if(this.master&&!this.muted)this.master.gain.value=v;},
  gun(v){if(v<=0.02)return;this.tone('square',320,90,0.09,0.12*v);this.boom(0.12*v,0.15);},
  punch(v=1){if(v<=0.02)return;this.tone('sine',140,50,0.14,0.35*v);this.boom(0.18*v,0.18);},
  swish(){this.tone('triangle',500,180,0.1,0.05);}
};
