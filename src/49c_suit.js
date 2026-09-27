// ================================================================
// Suit up: U swaps between your civilian clothes and your suit
// ================================================================
// Each kind of hero changes differently: the Ring Bearer's ring builds the suit out of light,
// the Speedster zig-zags in a blur, the Web-Slinger fades to black and pulls the mask on last,
// Metal Skin heroes flash to steel and everyone else spins into it.
P.suited=true;
let suitAnim=null;
const CIV={suit:[.23,.27,.34,1],suit2:[.84,.8,.72,1],cape:[.17,.23,.36,1],acc:[.3,.3,.32,1]};
function civLook(m){return Object.assign({},m,CIV,{capeOn:false,civ:true});}
function suitStyle(){const m=save.character&&save.character.movement[0];
  return m==='powerRing'?'ring':m==='superSpeed'?'speed':m==='webSwing'?'spider':m==='stormFlight'?'storm':m==='armorFlight'?'armor':hasPower('metalSkin')?'metal':'spin';}
const SUIT_DUR={ring:1.1,speed:0.6,spider:1.5,metal:0.8,spin:0.8,storm:0.7,armor:1};
function suitToggle(){
  if(!save.character||state!=='play'||P.dead||P.alien||P.car||suitAnim)return;
  const st=suitStyle();suitAnim={t:0,to:!P.suited,st,dur:SUIT_DUR[st],swapped:false,ofs:[0,0]};
  if(st==='ring')SFX.tone('sine',300,1000,0.8,0.1);else if(st==='speed')SFX.whoosh();else if(st==='spider')SFX.tone('triangle',500,200,0.5,0.05);else SFX.tone('sawtooth',200,600,0.4,0.08);
  if(st==='spin')P.flip={t:0,dur:0.7,rx:0,ry:TAU*2};
}
function suitSwap(A){A.swapped=true;P.suited=A.to;applyLook();MP.bump();if(!A.to)P.maskK=1;else P.maskK=A.st==='spider'?0:1;
  const c=center(P);if(A.st==='ring'){burst(c.x,c.y,c.z,50,6,0.6,[RING_C,[1,1,1]],1.2,0,2);}
  else if(A.st==='storm'){bolt(P.pos.x,P.pos.y,P.pos.z,true);}
  else if(A.st==='armor'){burst(c.x,c.y,c.z,40,5,0.4,[[.8,.2,.15],[1,.8,.3]],1.1,0,2);SFX.tone('square',200,90,0.2,0.1);}
  else if(A.st==='metal'){burst(c.x,c.y,c.z,30,6,0.5,[[.85,.88,.92],[1,1,1]],1,0,2);ringFx(c.x,c.y,c.z,1,4,0.3,[.85,.88,.92]);}
  else if(A.st==='spin'){burst(c.x,c.y,c.z,60,10,0.6,[LOOK.acc.slice(0,3),[1,1,1]],1.4,0,2);ringFx(c.x,c.y,c.z,1,6,0.4,LOOK.acc.slice(0,3));flashWhite=Math.max(flashWhite,0.2);}}
function updateSuit(dt){
  if(P.maskK<1&&!suitAnim)P.maskK=Math.min(1,(P.maskK||0)+dt*2.5);
  const A=suitAnim;if(!A)return;A.t+=dt;const k=A.t/A.dur,fade=$('fade');
  if(A.st==='spider'){const o=k<0.4?k/0.4:k<0.6?1:Math.max(0,1-(k-0.6)/0.4);fade.style.opacity=o.toFixed(3);if(k>=0.5&&!A.swapped)suitSwap(A);}
  else if(A.st==='speed'){const n=Math.floor(k*6);if(n!==A.n&&k<0.95){A.n=n;const p=A.ofs.slice();A.ofs=n%2?[rr(-4,4),rr(-4,4)]:[rr(-2,2),rr(-2,2)];
      streak(P.pos.x+p[0],P.pos.y+1.2,P.pos.z+p[1],P.pos.x+A.ofs[0],P.pos.y+1.2,P.pos.z+A.ofs[1]);}if(k>=0.5&&!A.swapped)suitSwap(A);}
  else if(k>=(A.st==='ring'?0.6:0.5)&&!A.swapped)suitSwap(A);
  if(A.st==='armor'&&!A.swapped&&Math.random()<0.9){const a=rr(0,TAU),r=rr(2.5,4),y=P.pos.y+rr(0.3,2.6);emit(P.pos.x+Math.cos(a)*r,y,P.pos.z+Math.sin(a)*r,-Math.cos(a)*r*2.2,0,-Math.sin(a)*r*2.2,0.45,[.85,.3,.2],1.1,0,0);}
  if(A.st==='ring'&&Math.random()<0.8){const y=P.pos.y+k*3;for(let i=0;i<3;i++){const a=rr(0,TAU);emit(P.pos.x+Math.cos(a)*0.9,y,P.pos.z+Math.sin(a)*0.9,0,1,0,0.4,RING_C,0.7,0,0);}}
  if(k>=1){if(!A.swapped)suitSwap(A);suitAnim=null;fade.style.opacity='0';}
}
function suitDrawOfs(){return suitAnim&&suitAnim.st==='speed'?suitAnim.ofs:null;}
function drawSuit(){
  const A=suitAnim;if(!A||state!=='play')return;const k=A.t/A.dur;
  if(A.st==='ring'){const y=P.pos.y+0.1+k*3,r=1.1+Math.sin(time*12)*0.05;queue(MESH.ring,M4.alignY(tmpM(),P.pos.x,y,P.pos.z,0,1,0,r),RING_C4,F_ADD);
    queue(MESH.glowBox,at(P.pos.x,P.pos.y+k*1.5,P.pos.z,0,P.heroYaw,0,1.1,k*3,0.7),[RING_C[0],RING_C[1],RING_C[2],0.2],F_ADD);}
  else if(A.st==='metal'){const y=P.pos.y+k*2.9;queue(MESH.ring,M4.alignY(tmpM(),P.pos.x,y,P.pos.z,0,1,0,1),[.9,.92,.95,1],F_ADD);}
}
// the move list (right side, H) shows everything the hero you are playing can do
function renderHeroKeys(){
  const box=$('keys-hero');if(!box)return;box.textContent='';const c=save.character;
  let grid=null; // each heading starts a section that the two-column layout keeps in one piece
  const H=t=>{const s=el('section',{class:'ks'},el('h4',{text:t}));grid=el('div',{class:'kg'});s.appendChild(grid);box.appendChild(s);};
  const K=(k,t)=>{grid.appendChild(el('kbd',{text:k}));grid.appendChild(el('span',{text:t}));};
  const m=c&&c.movement[0];
  H('Moving');K('WASD','Move');K('Space','Jump · hold for a super jump');K('C · Space in water','Dive · swim back up');
  if(m==='webSwing'){K('Right click','Swing · Shift mid-swing boosts');K('Space in the air','Tap to web-zip · hold for web wings');K('C in the air','Air trick');K('Hold Space','Slingshot launch');}
  else if(m==='superSpeed'){K('Shift · F','Run · fast mode on/off');K('C','Phase through walls');K('Run into a wall','Run up it or along it at your dial speed');K('[ ] · wheel','Speed dial (or how slow, in Slow Time)');}
  else if(m)K('F','Fly · hold on the ground to charge a launch');
  if(c){H('Your powers');c.abilities.forEach((id,i)=>{const p=POWERS[id];if(!p)return;
      K(String(i+1)+(i<3?' · '+'QER'[i]:''),p.name+(PBAL&&typeof slotLocked==='function'&&slotLocked(i)?' · unlocks at LV '+KIT_LV[i]:''));});
    K('Hold 1–5 · wheel','Size a power (up to ×30), let go to use it');}
  H('Fighting');K('Click','Punch · hold to keep swinging');K('Z · X','Lock on · dash');K('G','Get in a car · help someone up');
  if(m){H(PRESETS[m]?PRESETS[m].name:POWERS[m]?POWERS[m].name:'Your hero');
    if(m==='powerRing'){K('B','Build your construct (the last one you picked)');K('V','Construct wheel · in a construct: tap to step out, hold to switch');
      K('Click · Right click · X','Construct attacks');K('Wheel · [ ]','Grow or shrink your construct');K('O','Say or type the oath to recharge the ring');K('Y','Rebuild every broken building');}
    if(m==='armorFlight'){K('Inventor Tower','Land on its roof or pad to recharge the battery');K('B · '+(hasPower('morphBand')?'N':'V'),'Suit forms: turn into your last form · pick one');}
    if(m==='stormFlight')K('G on a tall roof','Call the storm to recharge your lightning');
    if(m==='superSpeed')K('G at a shop','Eat to refill your calories');
    if(hasPower('morphBand'))K('V','Morph Band: pick an alien · tap again to change back');
    if(hasPower('telekinesis'))K('Right click · Click','While lifting: grab more · slam down');
    if(hasPower('titanGrowth'))K('G','As a giant: pick up and throw cars');
    K('U','Suit up or down');}
  H('Menus');K('Icons, top left','Every menu, each with its key');K('K · J · I','Skills · change powers · appearance');K('L','Free the mouse to click the icons');K('Esc','Pause');K('Left panel','Leaderboard · click it for the full board');K('H','Show or hide this list');
}
