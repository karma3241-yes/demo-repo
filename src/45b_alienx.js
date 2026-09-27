// ================================================================
// Alien X: two giant masks decide whether you get to move
// ================================================================
// Morph into Alien X and your body freezes in place while your view is pulled out to a far corner of space,
// where two floating masks ask one question with three answers. Answer right and you play as Alien X; answer
// wrong (or run out of time) and you stand frozen in the alien body for 30 s. Playtime grows linearly with the
// Energy passive: 5 s at level 0, 3 minutes at the max. Every morph brings a question you haven't had yet, and
// in multiplayer no two players in the room get the same one (each player's questions ride in their presence).
const ALIENX={dur:[5,180],answer:20,lock:30,realm:{x:0,y:320000,z:0}};
function alienXDuration(){return ALIENX.dur[0]+(ALIENX.dur[1]-ALIENX.dur[0])*clamp(pv('energy')/CONFIG.passiveMax,0,1);}
// c is the index of the right answer (answers are shuffled on screen)
const XQS=[
  {q:'Which planet is known as the Red Planet?',a:['Mars','Venus','Jupiter'],c:0},
  {q:'How many planets are in our Solar System?',a:['Eight','Nine','Seven'],c:0},
  {q:'Which planet has the biggest, brightest rings?',a:['Saturn','Neptune','Mars'],c:0},
  {q:'What force pulls things down to the ground?',a:['Gravity','Magnetism','Friction'],c:0},
  {q:'Which is the largest planet in our Solar System?',a:['Jupiter','Saturn','Earth'],c:0},
  {q:'Which planet is closest to the Sun?',a:['Mercury','Venus','Mars'],c:0},
  {q:'What causes day and night on Earth?',a:['Earth spinning on its axis','The Moon circling Earth','The Sun circling Earth'],c:0},
  {q:'What sits at the centre of our Solar System?',a:['The Sun','Earth','The Moon'],c:0},
  {q:'About how many days does Earth take to go around the Sun?',a:['365','30','1,000'],c:0},
  {q:'Which planet spins lying on its side?',a:['Uranus','Mars','Mercury'],c:0},
  {q:'The Moon\'s pull on Earth\'s oceans causes what?',a:['Tides','Wind','Rain'],c:0},
  {q:'Which gas do plants take in from the air to make food?',a:['Carbon dioxide','Oxygen','Helium'],c:0},
  {q:'At sea level, water boils at how many degrees Celsius?',a:['100','90','212'],c:0},
  {q:'Water freezes at how many degrees Celsius?',a:['0','10','-10'],c:0},
  {q:'Which is the hardest natural material?',a:['Diamond','Gold','Iron'],c:0},
  {q:'What does a thermometer measure?',a:['Temperature','Weight','Speed'],c:0},
  {q:'What is the largest organ of the human body?',a:['Skin','Liver','Heart'],c:0},
  {q:'Which is the only mammal that can truly fly?',a:['Bat','Flying squirrel','Penguin'],c:0},
  {q:'How many legs does a spider have?',a:['Eight','Six','Ten'],c:0},
  {q:'What is a baby frog called?',a:['Tadpole','Cub','Calf'],c:0},
  {q:'Which is the tallest animal?',a:['Giraffe','Elephant','Horse'],c:0},
  {q:'Which is the largest ocean on Earth?',a:['Pacific','Atlantic','Indian'],c:0},
  {q:'Mixing blue and yellow paint makes which colour?',a:['Green','Purple','Orange'],c:0},
  {q:'How many sides does a hexagon have?',a:['Six','Five','Eight'],c:0},
  {q:'Which shape has exactly three sides?',a:['Triangle','Square','Pentagon'],c:0},
  {q:'What is 7 × 8?',a:['56','54','64'],c:0},
  {q:'What is 12 ÷ 3?',a:['4','3','6'],c:0},
  {q:'How many minutes are there in an hour?',a:['60','100','30'],c:0},
  {q:'How many continents are there?',a:['Seven','Five','Nine'],c:0},
  {q:'What does light travel fastest through?',a:['Empty space','Water','Glass'],c:0},
];
// questions this player got while online (shared in presence), and questions other players announced
const XQ={session:[],claimed:new Set()};
function xServerUsed(){const u=new Set(XQ.session);for(const q of XQ.claimed)u.add(q);for(const r of MP.peers.values())if(r.aq)for(const q of r.aq)u.add(q);return u;}
function pickXQuestion(){
  const all=XQS.map((_,i)=>i);let seen=save.xSeen||(save.xSeen=[]);
  if(all.every(i=>seen.includes(i)))save.xSeen=seen=seen.slice(-1); // had them all: start a new round (never the same one twice in a row)
  const used=xServerUsed(),last=seen[seen.length-1];
  // new to you and to the room · new to the room · new to you · anything
  const pool=[all.filter(i=>!seen.includes(i)&&!used.has(i)),all.filter(i=>!used.has(i)&&i!==last),all.filter(i=>!seen.includes(i))].find(p=>p.length)||all;
  const q=pick(pool);seen.push(q);XQ.session.push(q);if(XQ.session.length>XQS.length)XQ.session.shift();
  persist();MP.fx('aq',{q});MP.bump();return q;
}
function onXClaim(d){const q=Math.floor(+d.q);if(q>=0&&q<XQS.length)XQ.claimed.add(q);}
const alienXStage=()=>P.alien&&P.alien.xq?P.alien.xq.stage:'';
const alienXLocked=()=>{const s=alienXStage();return s==='quiz'||s==='lock';}; // frozen: no moving, no powers, no reverting
const alienXAway=()=>alienXStage()==='quiz';                                   // your view is out with the masks
const XQ_CODES={Digit1:0,Digit2:1,Digit3:2,Numpad1:0,Numpad2:1,Numpad3:2};
function alienXBegin(){
  const A=P.alien,qi=pickXQuestion(),order=[0,1,2];
  for(let i=2;i>0;i--){const j=(Math.random()*(i+1))|0;[order[i],order[j]]=[order[j],order[i]];}
  A.xq={stage:'quiz',q:qi,order,t:ALIENX.answer};P.vel.set(0,0,0);mouseL=false;if(lockT)lockT=null;
  if(dialOpen)closeDial();renderXQuiz(true);SFX.tone('sine',110,55,1.2,0.12);
}
function alienXAnswer(k){
  const A=P.alien;if(!A||!A.xq||A.xq.stage!=='quiz')return;const X=A.xq,Q=XQS[X.q];
  if(k>=0&&X.order[k]===Q.c){X.stage='play';
    const c=center(P);ringFx(c.x,c.y,c.z,1,18,0.7,[1,1,1]);burst(c.x,c.y,c.z,90,20,1,[[1,1,1],[.7,.8,1]],1.6,0,2);flashWhite=0.4;SFX.chime();
    toast('The masks agree','You are Alien X for '+xTime(A.t),'purple');}
  else{X.stage='lock';X.t=ALIENX.lock;SFX.tone('sawtooth',220,70,0.6,0.1);
    toast(k<0?'Too slow':'The masks disagree','Frozen for '+ALIENX.lock+' s · the answer was '+Q.a[Q.c],'red');}
  renderXQuiz(true);MP.bump();
}
function alienXTick(dt){
  const X=P.alien.xq;X.t-=dt;
  if(X.stage==='quiz'&&X.t<=0){alienXAnswer(-1);return;}
  if(X.stage==='lock'&&X.t<=0){revertAlien(false);feed('The masks let you go','Morph Band recharging for '+Math.ceil(band.cd)+' s');return;}
  renderXQuiz(false);
}
function alienXEnd(){xqEl.hidden=true;xqEl.dataset.mode='';}
const xTime=s=>s>=60?Math.floor(s/60)+' min'+(s%60>=1?' '+Math.round(s%60)+' s':''):Math.round(s)+' s';
// ---- the question card (keys 1-3, or tap / click an answer) ----
const xqEl=(()=>{const e=document.createElement('div');e.id='xquiz';e.hidden=true;e.setAttribute('role','dialog');e.setAttribute('aria-live','polite');document.body.appendChild(e);return e;})();
function renderXQuiz(full){
  const X=P.alien&&P.alien.xq;if(!X||X.stage==='play'){xqEl.hidden=true;xqEl.dataset.mode='';return;}
  const left=Math.max(0,Math.ceil(X.t));
  if(full||xqEl.dataset.mode!==X.stage){xqEl.dataset.mode=X.stage;xqEl.textContent='';xqEl.hidden=false;
    if(X.stage==='quiz'){const Q=XQS[X.q];
      xqEl.append(el('div',{class:'xq-head',text:'The two masks ask'}),el('p',{class:'xq-q',text:Q.q}),
        el('div',{class:'xq-opts'},...X.order.map((ai,k)=>el('button',{type:'button',class:'xq-opt',onclick:()=>alienXAnswer(k)},el('kbd',{text:String(k+1)}),el('span',{text:Q.a[ai]})))),
        el('div',{class:'xq-foot'}));}
    else xqEl.append(el('div',{class:'xq-head',text:'Frozen by the masks'}),el('div',{class:'xq-foot'}));}
  const f=xqEl.querySelector('.xq-foot'),txt=X.stage==='quiz'?(touchOn()?'Tap an answer':'Press 1, 2 or 3')+' · '+left+' s':'You can move again in '+left+' s';
  if(f&&f.textContent!==txt)f.textContent=txt;
}
// ---- the far-off place: two giant floating masks, only drawn for the player being asked ----
function drawXRealm(){
  if(!alienXAway())return;const R=ALIENX.realm,t=time;
  for(const sd of [-1,1]){
    const calm=sd>0,face=calm?[.5,.56,.68,1]:[.42,.05,.04,1],dark=calm?[.3,.34,.44,1]:[.16,.02,.02,1],glow=calm?[.3,.7,1,1]:[1,.5,.15,1];
    const root=at(R.x+sd*210,R.y+Math.sin(t*0.8+sd)*14,R.z-560,Math.sin(t*0.6+sd)*0.04,-sd*0.28+Math.sin(t*0.5+sd)*0.05,Math.sin(t*0.7-sd)*0.05);
    queue(MESH.sphere,child(root,0,0,0,0,0,0,120,165,40),face,0,0.12);
    queue(MESH.box,child(root,0,52,30,0,0,0,170,18,26),dark,0,0.08);                        // brow
    for(const x of [-1,1])queue(MESH.glowBox,child(root,x*46,22,38,0,0,x*(calm?-0.18:0.3),52,calm?9:14,6),glow,F_UN); // eyes
    queue(MESH.glowBox,child(root,0,-72,34,0,0,0,calm?56:86,calm?7:16,6),glow,F_UN);       // mouth
    queue(MESH.box,child(root,0,-8,40,0,0,0,10,60,10),dark,0,0.08);                           // nose ridge
    for(const [x,r] of [[-60,0.45],[0,0],[60,-0.45]])queue(MESH.cone,child(root,x,150,0,0,0,r,calm?14:20,calm?70:110,calm?14:20),dark,0,0.1); // crest
    for(let k=0;k<6;k++){const a=t*0.4+k*TAU/6+sd,g=6+2*Math.sin(t*3+k);queue(MESH.glowSphere,child(root,Math.cos(a)*170,Math.sin(a)*200,-20,0,0,0,g,g,g),glow,F_ADD);} // motes circling the mask
  }
}
// ---- Alien X's powers once the masks agree ----
Object.assign(ALIEN_FN,{
  starFlick(){const m=alienMul();P.punchT=time;P.punchArm=-P.punchArm||1;const n=coneHit(32,0.55,110*m,{knock:45,stun:0.6},'punch');const c=center(P);
    for(let k=0;k<70;k++){const s=rr(30,70),sp=rr(-0.25,0.25);emit(c.x,c.y,c.z,(camF.x+sp)*s,camF.y*s+rr(-4,4),(camF.z-sp)*s,0.7,k%3?[1,1,1]:[.7,.8,1],rr(0.6,1.4),0,2);}
    ringFx(c.x,c.y,c.z,1,14,0.35,[.9,.95,1],[camF.x,camF.y,camF.z]);hitProps(c.x+camF.x*10,c.y,c.z+camF.z*10,10,P,34);SFX.boom(0.6,1.6);addShake(n?0.4:0.2);},
  bigBang(){const m=alienMul(),x=aim.hitAny?aim.x:P.pos.x+camF.x*40,z=aim.hitAny?aim.z:P.pos.z+camF.z*40,y=aim.hitAny?aim.y:groundY(x,z,P.pos.y+2)+0.5;
    ringFx(x,y,z,2,40,0.8,[1,1,1]);ringFx(x,y,z,1,26,0.6,[.6,.7,1]);burst(x,y,z,160,40,1.4,[[1,1,1],[.75,.8,1],[.3,.35,.8]],3,0,2);flashWhite=0.6;
    areaDamage(x,y,z,30,220*m,P,{knock:42});hitProps(x,y,z,18,P,40);addScorch(x,groundY(x,z,y+2),z,12);SFX.boom(1,0.8);addShake(1.1);},
  rewrite(){P.hp=maxHp();const c=center(P);ringFx(c.x,c.y,c.z,1,60,0.9,[.9,.95,1]);flashWhite=0.35;
    for(const a of actors){if(!a.alive||a.kind==='prop'||a.kind==='remote'||a.kind==='vehicle')continue;if(Math.hypot(a.pos.x-c.x,a.pos.z-c.z)<60)a.stun=Math.max(a.stun||0,4);}
    toast('Reality rewritten','Healed · everyone around you frozen for 4 s','purple');SFX.chime();},
});
