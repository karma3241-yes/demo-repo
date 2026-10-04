// ================================================================
// The cyber world: a hyper-advanced civilisation, 3 x 3 km of white and blue towers, flying cars and a shield you can't leave
// ================================================================
// Arrival: the light-speed jump (66h_invasion.js, lsEnd) calls cyberArrive(): enterZone('cyber') onto a landing pad above the south outskirts, a 5.5 s skyline cutscene
// ("A world beyond ours"), the title card CONQUER THE WORLD, then the objective: fly to the Apex Spire's entrance. save.story.cyber: 0 not there, 1 arrived (go to the
// entrance), 2 went in (towerEnter() in 66j_spire.js hops into the Apex Spire: story.tower 1 = inside, 2 = the Sovereign is beaten and the real sky is back, see cyReal / cyberEnding there). With cyber 1 or 2 and tower < 2 a loaded game starts here (cyberTick):
// the solar system is "gone" until the tower's boss falls (next phase restores it). Dying here puts you back on the pad (cyberRespawn).
// ZONES.cyber sits at local origin CYO (z=120000), 3000 x 3000 m (x, z in +-1500), floor y=0, x1.3 player speed (zone.speed, 80_player.js). Layout (cyBuild): a grid of
// 150 m cells, avenues 30 m wide and boulevards (every second line) 40 m, a 330 m plaza in the middle with the Apex Spire (120 m podium, 600 m needle), towers 36-420 m taller
// towards the centre, parks, landing pads, low-rises and sky bridges (over the odd avenues only: the flying cars use the boulevards). ~25k boxes, baked into 36 regions
// (only those in front of the camera and inside the fog are drawn: zoneDrawRegions) with ~6k colliders in the zone's lookup grid (66c_zones.js: zkey, zoneCols and zoneRay
// only ever look at the cells near a point or a ray). Towers use shader material 9 (white shell, glowing blue glass bands), the shield material 10 (00_engine.js).
// The sky (cyberSky in the sky shader): gradient, grid lines, a synthetic sun (disc, rings, hex cells) and a faceted moon. The shield: a blue wall at +-1500 and a ceiling at
// y=900 that stops you (bounds + a soft push in cyShield), with a hex shimmer within 60 m.
const CYO={x:0,y:0,z:120000},CYH=1500,CYG=150,CYB=1490,CYTOP=900;
const CYAT={x:75,y:150.6,z:-1425,yaw:Math.atan2(75,-1425)}; // the arrival pad (a 150 m tower in the south), facing the Spire
const CYARCH={z0:-60,z1:-34,w:10,h:20.2}; // the entrance: an arch cut into the south face of the Spire's podium, opening x +-10, 20 m tall, 24 m deep to the light gate
const CYFRONT={x:0,y:0,z:-112,yaw:Math.PI}; // in front of the arch, facing it
const CY={cars:[],drones:[],folks:[],intro:false,msgT:-99,zapT:-99,enterT:-99,objT:0,droneT:0,said:false,zen:[.04,.2,.66],hor:[.5,.78,1],sun:[0,1,0],moon:[0,1,0],stats:{boxes:0,cols:0,ms:0},titleT:0};
let cySeed=0;const cyR=()=>{cySeed=(cySeed+0x6D2B79F5)|0;let t=Math.imul(cySeed^(cySeed>>>15),1|cySeed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const CYZ=zoneNew({id:'cyber',name:'Cyber World',origin:CYO,spawn:CYAT,speed:1.3,stars:true,sky:[.1,.25,.55],gofs:1700,gw:512,mapS:0.42,
  bounds:{x0:-CYB,x1:CYB,z0:-CYB,z1:CYB,y1:CYTOP},light:{dir:[.3,1,.2],lcol:[.9,.95,1.1],sky:[.32,.42,.62],gnd:[.2,.24,.36],fogC:[.2,.48,.92],fog:[700,4800],night:0},lights:[],
  build(){cyBuild(CYZ);},enter(){cyEnter(CYZ);},leave(){cyLeave(CYZ);},update(dt){cyUpdate(CYZ,dt);},draw(){cyDraw(CYZ);},skyU:s=>cySkyU(s),planDraw:c=>cyPlan(c),mapMarks:(plot,c)=>cyMarks(plot,c)});
const inCyber=()=>!!(zone&&zone.id==='cyber');
// ---- time of day: the sky, the light, the fog (blue all day, deep blue at night) ----
function cyEnv(){
  const L=CYZ.light,d=1-env.night,sy=env.sun[1],dusk=Math.exp(-Math.pow(sy*5,2));
  if(cyReal()){CY.sun=env.sun;L.dir=env.ldir;L.lcol=env.lcol.map(c=>Math.min(1.3,c*0.5));L.sky=mix3([.08,.13,.3],[.4,.5,.72],d);L.gnd=mix3([.04,.06,.12],[.26,.28,.36],d);L.fogC=env.hor.map(c=>c*0.97);L.night=env.night;return;} // the real sky is back (66j_spire.js): the real Sun's light and haze
  CY.zen=mix3([.008,.02,.12],[.012,.07,.42],d);CY.hor=mix3(mix3([.03,.08,.26],[.2,.48,.92],d),[.5,.45,.95],dusk*0.4);CY.sun=env.sun;
  const a=(tod-0.25)*TAU+2.2,mx=Math.cos(a),my=Math.sin(a),mz=-0.45,ml=Math.hypot(mx,my,mz);CY.moon=[mx/ml,my/ml,mz/ml];
  L.dir=env.ldir;L.lcol=mix3([.2,.3,.6],[.9,.95,1.1],d);L.sky=mix3([.08,.13,.3],[.32,.42,.62],d);L.gnd=mix3([.04,.06,.12],[.2,.24,.36],d);L.fogC=CY.hor.map(c=>c*0.97);L.night=env.night;
}
function cySkyU(s){ // the sky pass's uniforms while in the cyber world (render in 90_render.js)
  if(cyReal()){gl.uniform1f(s.uCy,0);gl.uniform1f(s.uCDis,1);gl.uniform3f(s.uCMoon,0,-999,0);gl.uniform1f(s.uNight,env.night);gl.uniform1f(s.uSpace,0);return;} // the real sky: the normal sky pass, Sun and Moon bodies are drawn by spSkyDraw
  gl.uniform1f(s.uCDis,SPR.dis);
  gl.uniform1f(s.uCy,1);gl.uniform3fv(s.uZen,CY.zen);gl.uniform3fv(s.uHor,CY.hor);gl.uniform3fv(s.uCSun,CY.sun);gl.uniform3fv(s.uCMoon,CY.moon);gl.uniform1f(s.uNight,env.night);gl.uniform1f(s.uSpace,0);
}
// ---- building the world ----
const CYPAL=[[.9,.94,1],[.9,.94,1],[.55,.74,1],[.55,.74,1],[.4,.62,.95],[.75,.85,.98]],CYGL=[.25,.8,1],CYGL2=[.55,.9,1],CYLEAF=[[.35,.8,.78],[.45,.88,.85],[.6,.95,.95]];
function cyBuild(Z){
  const t0=performance.now();cySeed=0x9e3779b1;const ox=Z.origin.x,oz=Z.origin.z,RS=500,NR=6,geos=[];
  for(let i=0;i<NR*NR;i++)geos.push({g:new Geo(),x0:1e9,x1:-1e9,z0:1e9,z1:-1e9,y1:0});
  Z.regions=[];let nb=0;
  const ri=(x,z)=>clamp(Math.floor((x+CYH)/RS),0,NR-1)*NR+clamp(Math.floor((z+CYH)/RS),0,NR-1);
  const bx=(x0,y0,z0,x1,y1,z1,col,mat=0,seed=0,solid=false)=>{const r=geos[ri((x0+x1)/2,(z0+z1)/2)];
    if(x0<r.x0)r.x0=x0;if(x1>r.x1)r.x1=x1;if(z0<r.z0)r.z0=z0;if(z1>r.z1)r.z1=z1;if(y1>r.y1)r.y1=y1;nb++;
    return zoneBox(Z,x0,y0,z0,x1,y1,z1,col,mat,{geo:r.g,col:solid,seed});};
  // a stepped-chamfer box: three overlapping boxes read as rounded corners (the shell and its glass bands: shader material 9)
  const rbox=(x,z,w,d,y0,y1,col,seed,solid)=>{const c=Math.min(w,d)*0.13;
    bx(x-w/2,y0,z-d/2+c,x+w/2,y1,z+d/2-c,col,9,seed,solid);bx(x-w/2+c,y0,z-d/2,x+w/2-c,y1,z+d/2,col,9,seed,solid);bx(x-w/2+c*.4,y0,z-d/2+c*.4,x+w/2-c*.4,y1,z+d/2-c*.4,col,9,seed,false);};
  const ring=(x,z,w,d,y,t,col,h=t)=>{bx(x-w/2,y,z-d/2,x+w/2,y+h,z-d/2+t,col,6);bx(x-w/2,y,z+d/2-t,x+w/2,y+h,z+d/2,col,6);bx(x-w/2,y,z-d/2+t,x-w/2+t,y+h,z+d/2-t,col,6);bx(x+w/2-t,y,z-d/2+t,x+w/2,y+h,z+d/2-t,col,6);};
  const tree=(x,z)=>{const k=(cyR()*3)|0,s=0.8+cyR()*0.6;bx(x-.45*s,0.4,z-.45*s,x+.45*s,5*s,z+.45*s,[.85,.9,.97]);
    if(k===0){bx(x-3.4*s,5*s,z-3.4*s,x+3.4*s,8*s,z+3.4*s,CYLEAF[0]);bx(x-2.5*s,8*s,z-2.5*s,x+2.5*s,10.6*s,z+2.5*s,CYLEAF[1]);bx(x-1.5*s,10.6*s,z-1.5*s,x+1.5*s,12.6*s,z+1.5*s,CYLEAF[2]);}
    else if(k===1){for(let i=0;i<4;i++){const w=(4-i)*1.6*s;bx(x-w,4*s+i*2.6*s,z-w,x+w,4*s+(i+1)*2.6*s,z+w,CYLEAF[i%3]);}}
    else{bx(x-2.6*s,5*s,z-2.6*s,x+2.6*s,10.4*s,z+2.6*s,[.3,.75,1],6);bx(x-3.4*s,6.6*s,z-3.4*s,x+3.4*s,8.8*s,z+3.4*s,[.2,.55,.95],6);}};
  // ---- towers ----
  const bridges=[];
  const tower=(x,z,w,d,H,flat)=>{
    const seed=cyR(),col=CYPAL[(cyR()*CYPAL.length)|0],big=H>=50,ph=big?Math.min(14,H*0.12):0,tiers=H>230?3:H>100?2:1,fr=tiers===3?[.42,.74,1]:tiers===2?[.62,1]:[1];
    if(big){rbox(x,z,w+8,d+8,0,ph,[.88,.93,.99],seed,true);ring(x,z,w+8.6,d+8.6,ph-0.2,0.5,CYGL);}
    let y=ph,cw=w,cd=d;
    for(let k=0;k<tiers;k++){const top=k===tiers-1?H:ph+(H-ph)*fr[k];rbox(x,z,cw,cd,y,top,col,(seed+k*0.13)%1,true);if(k<tiers-1)ring(x,z,cw+0.8,cd+0.8,top-0.6,0.9,k%2?CYGL2:CYGL);y=top;cw*=0.8;cd*=0.8;}
    const tw=cw/0.8,td=cd/0.8,r=cyR();
    if(flat){bx(x-tw*0.42,H,z-td*0.42,x+tw*0.42,H+0.5,z+td*0.42,[.12,.2,.38],0,0,true);ring(x,z,tw*0.84,td*0.84,H+0.5,0.8,CYGL2,0.5);ring(x,z,tw*0.5,td*0.5,H+0.5,0.8,CYGL,0.5);ring(x,z,tw*0.16,td*0.16,H+0.5,0.8,CYGL2,0.5);}
    else if(r<0.35){const a=12+cyR()*30;bx(x-.6,H,z-.6,x+.6,H+a,z+.6,[.9,.95,1]);bx(x-1,H+a,z-1,x+1,H+a+2,z+1,CYGL,6);}
    else if(r<0.6){for(const sx of [-1,1])for(const sz of [-1,1])bx(x+sx*(tw/2-2)-.6,H,z+sz*(td/2-2)-.6,x+sx*(tw/2-2)+.6,H+7,z+sz*(td/2-2)+.6,CYGL,6);ring(x,z,tw+0.4,td+0.4,H,0.6,CYGL2);}
    else if(r<0.8&&tw>=40)ring(x,z,tw*0.7,td*0.7,H,0.8,CYGL2);
    else ring(x,z,tw+0.4,td+0.4,H,0.6,CYGL);
    return {x,z,w,d,H,y0:16,y1:ph+(H-ph)*fr[0]-8};
  };
  // ---- parks, pads, low-rises, the plaza ----
  const park=(cx,cz)=>{bx(cx-54,0,cz-54,cx+54,0.4,cz+54,[.42,.72,.7]);const px=cx+(cyR()-0.5)*40,pz=cz+(cyR()-0.5)*40;bx(px-17,0.4,pz-12,px+17,0.8,pz+12,[.14,.6,.92],6);
    for(let i=0;i<14;i++){const x=cx+(cyR()-0.5)*98,z=cz+(cyR()-0.5)*98;if(Math.abs(x-px)<22&&Math.abs(z-pz)<17)continue;tree(x,z);}
    for(const s of [-1,1])bx(cx+s*50-.3,0.4,cz-54,cx+s*50+.3,1.0,cz+54,CYGL2,6);};
  const pad=(cx,cz)=>{bx(cx-50,0,cz-50,cx+50,1.4,cz+50,[.86,.92,1],0,0,true);ring(cx,cz,92,92,1.4,0.9,CYGL,0.7);ring(cx,cz,62,62,1.4,0.9,CYGL2,0.7);ring(cx,cz,30,30,1.4,0.9,CYGL,0.7);
    bx(cx-9,1.4,cz-13,cx-6,2.1,cz+13,CYGL2,6);bx(cx+6,1.4,cz-13,cx+9,2.1,cz+13,CYGL2,6);bx(cx-9,1.4,cz-1.5,cx+9,2.1,cz+1.5,CYGL2,6);
    for(const sx of [-1,1])for(const sz of [-1,1]){bx(cx+sx*46-1,1.4,cz+sz*46-1,cx+sx*46+1,8,cz+sz*46+1,[.9,.95,1]);bx(cx+sx*46-1.4,8,cz+sz*46-1.4,cx+sx*46+1.4,9.6,cz+sz*46+1.4,CYGL,6);}
    if(cyR()<0.7){const sx=cx+(cyR()-0.5)*40,sz=cz+(cyR()-0.5)*40,sd=cyR();rbox(sx,sz,22,9,4,8.5,[.93,.96,1],sd,false);bx(sx-12,4.4,sz-1,sx+12,5,sz+1,[.62,.78,.98]);bx(sx-6,2.6,sz-3,sx+6,4,sz+3,CYGL,6);}};
  const lowrise=(cx,cz)=>{const n=3+((cyR()*3)|0);for(let i=0;i<n;i++){const w=28+cyR()*18,d=28+cyR()*18,x=cx+(cyR()-0.5)*(100-w),z=cz+(cyR()-0.5)*(100-d);tower(x,z,w,d,10+cyR()*34);}};
  // ---- the ground: one tile per cell, avenues with glowing curbs, boulevard dashes ----
  const aw=k=>k%2===0?20:15; // half width of the avenue on line k
  for(let i=0;i<20;i++)for(let j=0;j<20;j++){
    const cx=(i-9.5)*CYG,cz=(j-9.5)*CYG,x0=cx-75,x1=cx+75,z0=cz-75,z1=cz+75,kl=i-10,kr=i-9,kb=j-10,kf=j-9; // the avenue lines around this cell
    bx(x0,-1,z0,x1,0,z1,[.5,.62,.82]);
    if(Math.abs(cx)<165&&Math.abs(cz)<165)continue; // the plaza has its own floor
    const AV=[.07,.1,.2],hl=aw(kl),hr=aw(kr),hb=aw(kb),hf=aw(kf);
    bx(x0,0,z0,x0+hl,0.3,z1,AV);bx(x1-hr,0,z0,x1,0.3,z1,AV);bx(x0,0,z0,x1,0.3,z0+hb,AV);bx(x0,0,z1-hf,x1,0.3,z1,AV);
    bx(x0+hl,0.3,z0+hb,x0+hl+0.6,1.0,z1-hf,CYGL,6);bx(x1-hr-0.6,0.3,z0+hb,x1-hr,1.0,z1-hf,CYGL,6);bx(x0+hl,0.3,z0+hb,x1-hr,1.0,z0+hb+0.6,CYGL,6);bx(x0+hl,0.3,z1-hf-0.6,x1-hr,1.0,z1-hf,CYGL,6);
    for(let q=0;q<5;q++){const t=-75+15+q*30; // the dashes down the boulevards' centre lines
      if(kl%2===0)bx(x0-0.4,0.3,cz+t-5,x0+0.4,0.8,cz+t+5,CYGL2,6);if(kb%2===0)bx(cx+t-5,0.3,z0-0.4,cx+t+5,0.8,z0+0.4,CYGL2,6);}
  }
  // ---- the blocks ----
  const towers=new Map();
  for(let i=0;i<20;i++)for(let j=0;j<20;j++){
    const cx=(i-9.5)*CYG,cz=(j-9.5)*CYG;if(Math.abs(cx)<165&&Math.abs(cz)<165)continue;
    if(i===10&&j===0){towers.set(i*20+j,tower(cx,cz,90,90,150,true));continue;} // the arrival tower
    const dist=Math.hypot(cx,cz),core=clamp(1-dist/1900,0,1),r=cyR(),ring1=Math.abs(cx)<300&&Math.abs(cz)<300;
    if(r<(ring1?0.5:0.09)){park(cx,cz);continue;}if(!ring1&&r<0.15){pad(cx,cz);continue;}if(!ring1&&r<0.22+(core<0.3?0.12:0)){lowrise(cx,cz);continue;}
    const n=(cyR()<0.6)?1:(cyR()<0.62?2:4),base=lerp(40,390,Math.pow(core,1.05)),land=cyR()<0.1?1.5:1;let main=null;
    const mk=(x,z,w,d)=>{const H=clamp(base*(0.55+cyR()*0.6)*land,36,420),t=tower(x,z,w,d,H);if(!main||H>main.H)main=t;};
    if(n===1)mk(cx,cz,58+cyR()*40,58+cyR()*40);
    else if(n===2){const ax=cyR()<0.5;for(const s of [-1,1]){const w=36+cyR()*14,d=36+cyR()*14;mk(cx+(ax?s*27:0),cz+(ax?0:s*27),w,d);}}
    else for(const sx of [-1,1])for(const sz of [-1,1])mk(cx+sx*26,cz+sz*26,34+cyR()*12,34+cyR()*12);
    towers.set(i*20+j,main);
  }
  // ---- sky bridges: across the odd avenues, between the main towers of two cells ----
  for(let i=0;i<20;i++)for(let j=0;j<20;j++){
    const A=towers.get(i*20+j);if(!A)continue;
    for(const [di,dj] of [[1,0],[0,1]]){const ni=i+di,nj=j+dj;if(ni>19||nj>19)continue;const B=towers.get(ni*20+nj);if(!B)continue;
      const line=di?i-9:j-9;if(line%2===0||cyR()>0.42)continue;
      const top=Math.min(A.y1,B.y1);if(top<44)continue;const y=Math.round((30+cyR()*(top-30))/6)*6,sd=cyR();
      if(di){const z0=Math.max(A.z-A.d/2,B.z-B.d/2)+4,z1=Math.min(A.z+A.d/2,B.z+B.d/2)-4;if(z1-z0<8)continue;const zc=(z0+z1)/2,hw=Math.min(3.5,(z1-z0)/2),xa=A.x+A.w/2-1,xb=B.x-B.w/2+1;
        bx(xa,y,zc-hw,xb,y+7,zc+hw,[.9,.95,1],9,sd,true);bx(xa,y+7,zc-hw+.5,xb,y+7.5,zc+hw-.5,CYGL,6);bx(xa,y-0.5,zc-hw+.5,xb,y,zc+hw-.5,CYGL2,6);}
      else{const x0=Math.max(A.x-A.w/2,B.x-B.w/2)+4,x1=Math.min(A.x+A.w/2,B.x+B.w/2)-4;if(x1-x0<8)continue;const xc=(x0+x1)/2,hw=Math.min(3.5,(x1-x0)/2),za=A.z+A.d/2-1,zb=B.z-B.d/2+1;
        bx(xc-hw,y,za,xc+hw,y+7,zb,[.9,.95,1],9,sd,true);bx(xc-hw+.5,y+7,za,xc+hw-.5,y+7.5,zb,CYGL,6);bx(xc-hw+.5,y-0.5,za,xc+hw-.5,y,zb,CYGL2,6);}}
  }
  // ---- the plaza ----
  {const F=[.52,.68,.94];for(const sx of [-1,1])for(const sz of [-1,1])bx(sx>0?0:-165,0,sz>0?0:-165,sx>0?165:0,0.4,sz>0?165:0,F);
    for(const r of [75,100,125,150])ring(0,0,r*2,r*2,0.4,0.7,r%50?CYGL:CYGL2,0.5);
    for(const s of [-1,1]){bx(s*10-0.4,0.4,-165,s*10+0.4,1.0,-52,CYGL,6);bx(s*14-0.3,0.4,-165,s*14+0.3,0.9,-52,CYGL2,6);}
    for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const x=sx*105,z=sz*105;bx(x-13,0.4,z-13,x+13,1.6,z+13,[.9,.95,1],0,0,true);bx(x-11,1.6,z-11,x+11,2.0,z+11,[.2,.7,1],6);bx(x-1.2,2,z-1.2,x+1.2,9,z+1.2,[.9,.95,1]);bx(x-1.8,9,z-1.8,x+1.8,10.4,z+1.8,CYGL,6);
      const px=sx*62,pz=sz*62;bx(px-1,0.4,pz-1,px+1,38,pz+1,[.85,.92,1]);bx(px-1.6,38,pz-1.6,px+1.6,41,pz+1.6,CYGL,6);bx(px-1.4,20,pz-1.4,px+1.4,21,pz+1.4,CYGL2,6);}
    for(let k=0;k<20;k++){const a=k*TAU/20+0.1,x=Math.cos(a)*140,z=Math.sin(a)*140;if(Math.abs(x)<24&&z<0)continue;tree(x,z);}}
  // ---- the Apex Spire and its entrance ----
  {const W2=[.95,.97,1],sd=0.62,PW=-CYARCH.z0,Z0=CYARCH.z0,Z1=CYARCH.z1;
    bx(-PW,0,-PW,-10,40,PW,W2,9,sd,true);bx(10,0,-PW,PW,40,PW,W2,9,sd,true);bx(-10,0,Z1,10,40,PW,W2,9,sd,true);
    const st=[[14,17,8.5],[17,19,6.5],[19,20.2,4]];
    for(const [a,b,e] of st)for(const s of [-1,1])bx(s>0?e:-10,a,Z0,s>0?10:-e,b,Z1,W2,0,0,true);
    bx(-10,20.2,Z0,10,40,Z1,W2,9,sd,true);
    for(const [a,b,e] of [[0,14,10],...st])for(const s of [-1,1])bx(s>0?e-0.4:-e,a,Z0,s>0?e:-e+0.4,b,Z1,CYGL,6); // glowing walls of the passage
    bx(-4,19.8,Z0,4,20.2,Z1,CYGL2,6);for(const s of [-1,1])bx(s>0?8.2:-9,0.4,Z0,s>0?9:-8.2,0.9,Z1,CYGL2,6);
    for(let k=0;k<10;k++)bx(-10,k*2,Z1-0.5,10,k*2+2,Z1-0.1,mix3([.3,.8,1],[.85,.97,1],k/9),6); // the light gate's wall (drawn over by cyDraw)
    for(const s of [-1,1])bx(s*10-(s>0?0:1.2),0,Z0-0.4,s*10+(s>0?1.2:0),14,Z0,CYGL,6); // the front frame
    bx(-26,23,Z0-0.5,26,24.2,Z0,CYGL2,6);bx(-PW+8,38.4,Z0-0.5,PW-8,40,Z0,CYGL,6);ring(0,0,PW*2+0.8,PW*2+0.8,39.4,1.2,CYGL,1.2);
    const tiers=[[96,40,170],[72,170,320],[52,320,470],[30,470,560]];
    for(const [w,y0,y1] of tiers){rbox(0,0,w,w,y0,y1,W2,sd,true);ring(0,0,w+1.2,w+1.2,y1-2,2,CYGL,2);
      for(const s of [-1,1]){bx(-1,y0+4,s*w/2-(s>0?0:.15),1,y1-4,s*w/2+(s>0?.15:0),CYGL,6);bx(s*w/2-(s>0?0:.15),y0+4,-1,s*w/2+(s>0?.15:0),y1-4,1,CYGL,6);}}
    bx(-3,560,-3,3,600,3,W2,0,0,true);bx(-1.4,600,-1.4,1.4,612,1.4,CYGL,6);for(const y of [570,584])ring(0,0,7,7,y,0.8,CYGL2,0.8);}
  // ---- bake: one mesh per region, the colliders into the lookup grid, the shield's walls ----
  for(const r of geos){if(!r.g.idx.length)continue;Z.regions.push({mesh:r.g.mesh(),x0:r.x0+ox,x1:r.x1+ox,z0:r.z0+oz,z1:r.z1+oz,y0:-1,y1:r.y1});}
  const sg=new Geo(),T=1,Y=CYTOP,sc=[1,1,1];
  sg.box(-CYH-T+ox,0,-CYH+oz,-CYH+ox,Y,CYH+oz,sc,10);sg.box(CYH+ox,0,-CYH+oz,CYH+T+ox,Y,CYH+oz,sc,10);sg.box(-CYH+ox,0,-CYH-T+oz,CYH+ox,Y,-CYH+oz,sc,10);sg.box(-CYH+ox,0,CYH+oz,CYH+ox,Y,CYH+T+oz,sc,10);sg.box(-CYH+ox,Y,-CYH+oz,CYH+ox,Y+T,CYH+oz,sc,10);
  Z.shield=sg.mesh();{const s2=new Geo();s2.box(-CYH-T+ox,0,-CYH+oz,-CYH+ox,Y,CYH+oz,sc,10);s2.box(CYH+ox,0,-CYH+oz,CYH+T+ox,Y,CYH+oz,sc,10);s2.box(-CYH+ox,0,-CYH-T+oz,CYH+ox,Y,-CYH+oz,sc,10);s2.box(-CYH+ox,0,CYH+oz,CYH+ox,Y,CYH+T+oz,sc,10);Z.shield2=s2.mesh();} // (shield2: the walls without the ceiling, after the ending)
  zoneBake(Z);
  // ---- the flying cars: lanes along the boulevards, at several heights ----
  const lines=[-300,300,-600,600,-300,300,-900,900,-1200,1200,-600,600],ys=[18,26,36,48,62,78,100,128,160,200],cols=[[.95,.97,1],[.95,.97,1],[.7,.85,1],[.55,.78,1]];
  for(let n=0;n<120;n++){const dir=n%2?1:-1,ax=((n>>1)%2),line=lines[((n*5)>>1)%lines.length];
    CY.cars.push({ax,line,off:dir*9,y:ys[(n*7)%ys.length]+cyR()*4,dir,v:34+cyR()*40,t:(cyR()-0.5)*2900,col:cols[(cyR()*cols.length)|0],tr:cyR()<0.5?[.3,.85,1]:[.7,.8,1]});}
  CY.stats.boxes=nb;CY.stats.cols=Z.cols.length;CY.stats.ms=Math.round(performance.now()-t0);
}
// ---- the minimap ----
function cyPlan(c){
  c.fillStyle='#1b3a78';for(let k=-9;k<=9;k++){const h=k%2?15:20;c.fillRect(k*CYG-h,-CYH,h*2,2*CYH);c.fillRect(-CYH,k*CYG-h,2*CYH,h*2);}
  c.fillStyle='#2f66bb';c.fillRect(-165,-165,330,330);c.fillStyle='#eaf6ff';c.fillRect(-60,-60,120,120);c.fillStyle='#3a9cff';c.fillRect(-10,-62,20,4);
  c.strokeStyle='#5ab8ff';c.lineWidth=7;c.strokeRect(-CYH,-CYH,2*CYH,2*CYH);
}
function cyMarks(plot,c){
  const q=plot(CYO.x,CYO.z,true);if(q){c.fillStyle='#eaf6ff';c.strokeStyle='#3a9cff';c.lineWidth=3;c.beginPath();for(let k=0;k<6;k++){const a=k*TAU/6;c.lineTo(q[0]+Math.cos(a)*9,q[1]+Math.sin(a)*9);}c.closePath();c.fill();c.stroke();}
  for(const d of CY.drones){if(!d.alive)continue;const p=plot(d.pos.x,d.pos.z,false);if(!p)continue;c.fillStyle=d.target?'#ff5a5a':'#5cd0ff';c.beginPath();c.arc(p[0],p[1],4,0,TAU);c.fill();}
}
// ---- life: citizens on the plaza, police drones on patrol ----
const CYSHIRT=['#f4f8ff','#cfe6ff','#7fb8ff','#4a90e8','#bfefff','#e6e9ff'].map(c4),CYPANTS=['#e9eef7','#9fb4d6','#5d7cb0','#dfe9f5'].map(c4);
function cyFolk(){
  for(let t=0;t<20;t++){const a=rr(0,TAU),r=rr(70,150),x=CYO.x+Math.cos(a)*r,z=CYO.z+Math.sin(a)*r;if(inBuilding(x,1,z,1.5)||inBuilding(x,3,z,1.5))continue;
    const h=spawnHuman('civilian',x,z,{path:{u:0,dir:1}});h.zid='cyber';h.state='cwalk';h.look={shirt:pick(CYSHIRT),pants:pick(CYPANTS),skin:pick(SKINS),hat:null};h.cwg=null;h.cwt=rr(0,3);CY.folks.push(h);return;}
}
function cyFolkUpdate(dt){
  for(let i=CY.folks.length-1;i>=0;i--){const h=CY.folks[i];if(!humans.includes(h)){CY.folks.splice(i,1);continue;}
    if(h.state==='walk'||h.state==='return')h.state='cwalk'; // (the city's paths mean nothing here)
    updateHuman(h,dt);
    if(h.state==='cwalk'&&h.alive&&!h.air&&!h.held&&!h.rag&&!(h.stun>0)&&!(h.downed>0)){
      if(!h.cwg||Math.hypot(h.cwg.x-h.pos.x,h.cwg.z-h.pos.z)<1.4){h.moving=0;h.cwt-=dt;if(h.cwt<=0){h.cwt=rr(1,4);const a=rr(0,TAU),r=rr(70,150),x=CYO.x+Math.cos(a)*r,z=CYO.z+Math.sin(a)*r;h.cwg=inBuilding(x,1,z,1.5)?null:{x,z};}}
      else moveTo(h,h.cwg.x,h.cwg.z,h.walk,dt);}}
  for(let k=0;k<2&&CY.folks.length<26&&state==='play';k++)cyFolk();
}
function cyDroneSpawn(){
  const a=rr(0,TAU),r=rr(120,500),d=spawnDrone(CYO.x+Math.cos(a)*r,rr(22,40),CYO.z+Math.sin(a)*r,'cyberpol',null);
  removeFrom(drones,d);d.zid='cyber';d.faction='police';d.name='Police drone';d.hp=d.maxHp=110+save.level*3;d.cyd=true;d.goal=null;CY.drones.push(d);
  const od=d.onDefeat;d.onDefeat=src=>{removeFrom(CY.drones,d);CY.droneT=30;od(src);}; // (the city's drone list isn't used: this one is drawn and run here)
  return d;
}
function cyPatrol(){const L=pick([-450,-300,-150,150,300,450]),t=rr(-520,520),ax=Math.random()<0.5;return {x:CYO.x+(ax?L:t),y:rr(20,44),z:CYO.z+(ax?t:L),sp:rr(13,20)};}
function cyDroneUpdate(dt){
  for(let i=CY.drones.length-1;i>=0;i--){const d=CY.drones[i];if(!d.alive){CY.drones.splice(i,1);continue;}
    if(d.target&&(!validTarget(d.target)||Math.hypot(d.target.pos.x-d.pos.x,d.target.pos.z-d.pos.z)>170))d.target=null;
    d.scanT=99; // the city drones hunt heroes; police drones only answer attacks
    if(d.target)d.goal=null;else if(!d.goal||Math.hypot(d.goal.x-d.pos.x,d.goal.y-d.pos.y,d.goal.z-d.pos.z)<8)d.goal=cyPatrol();
    updateDrone(d,dt);}
  CY.droneT-=dt;if(CY.drones.length<5&&CY.droneT<=0){CY.droneT=30;cyDroneSpawn();}
}
// ---- the shield: nothing leaves the planet ----
function cyShield(dt){
  if(P.dead||cutLocked())return;
  const o=CYO,lx=P.pos.x-o.x,lz=P.pos.z-o.z,ty=CYTOP-P.height-(P.pos.y-o.y);
  const F=[[1,0,0,CYB-lx],[-1,0,0,CYB+lx],[0,0,1,CYB-lz],[0,0,-1,CYB+lz]];if(!(save.story.tower>=2||SPR.ending))F.push([0,1,0,ty]); // outward normal, distance to the limit (no ceiling once the Sovereign is down: you can leave by the sky)
  let near=1e9;
  for(const f of F){const d=f[3];if(d<near)near=d;if(d>=60)continue;
    const s=1-Math.max(d,0)/60,vo=P.vel.x*f[0]+P.vel.y*f[1]+P.vel.z*f[2];
    if(vo>0){const k=Math.min(1,s*s*dt*5);P.vel.x-=f[0]*vo*k;P.vel.y-=f[1]*vo*k;P.vel.z-=f[2]*vo*k;}
    const push=s*s*s*50*dt;P.pos.x-=f[0]*push;P.pos.y-=f[1]*push;P.pos.z-=f[2]*push;}
  if(near<30&&!CY.said){CY.said=true;toast("The planet's shield won't let you leave",'A wall of blue light holds this world in','cyan');}
  if(near<3&&time-CY.zapT>1.1){CY.zapT=time;addShake(0.22);SFX.tone('sine',420,140,0.3,0.07);burst(P.pos.x,P.pos.y+1.3,P.pos.z,14,6,0.5,[[.3,.7,1],[.7,.9,1]],1.2,0,1.5);}
}
// ---- entering the world ----
function cyEnter(Z){
  CYZ.bounds.y1=save.story.tower>=2||SPR.ending?0:CYTOP;CY.on=true;CY.said=false;CY.enterT=time;CY.objT=0;CY.droneT=0;zoneRet={x:SPAWNS[0][0],y:0,z:SPAWNS[0][1],yaw:SPAWNS[0][2],fly:false}; // (the way back, for the next phase: the city's spawn)
  cyEnv();for(let k=0;k<80&&CY.folks.length<26;k++)cyFolk();while(CY.drones.length<5)cyDroneSpawn();
  if(!CY.intro)cyObjective(true);
}
function cyLeave(Z){for(const h of CY.folks.slice())removeActor(h);CY.folks.length=0;for(const d of CY.drones.slice())removeActor(d);CY.drones.length=0;objective(null);objectiveMark(null);CY.on=false;}
function cyObjective(force){
  const S=save.story;
  if(S.tower>=2){objectiveMark(null);const w=SPR.hint?'Fly up at full speed to travel to Earth':'';if(OBJ.text!==w)objective(w||null);return;} // after the ending: only the travel hint
  const want=S.cyber>=2?'Climb the Apex Spire':"Fly to the Apex Spire's entrance";
  if(force||OBJ.text!==want||!OBJ.mark)objective(want);if(force||!OBJ.mark)objectiveMark(CYO.x,10,CYO.z+CYARCH.z0-2,'Entrance');
}
function cyUpdate(Z,dt){
  cyEnv();
  for(const c of CY.cars){c.t+=c.v*c.dir*dt;if(c.t>1460)c.t=-1460;else if(c.t<-1460)c.t=1460;}
  cyFolkUpdate(dt);cyDroneUpdate(dt);cyShield(dt);
  const S=save.story;
  if(CY.intro&&!CUT&&time-(CY.introT||0)>16){CY.intro=false;const e=$('cytitle');if(e)e.classList.remove('on');} // an interrupted intro (a room opened) must not leave the objective off
  CY.objT-=dt;if(CY.objT<=0){CY.objT=1.5;if(!CY.intro&&!CUT&&!ASK&&!ZF.phase)cyObjective(false);}
  if(!P.dead&&!cutLocked()&&time-CY.enterT>6&&S.tower<2){const lx=P.pos.x-CYO.x,lz=P.pos.z-CYO.z,ly=P.pos.y-CYO.y;if(Math.abs(lx)<CYARCH.w+1&&lz>CYARCH.z0-3&&lz<CYARCH.z1+2&&ly<CYARCH.h+2&&ly>-1)towerEnter();} // reaching the arch's mouth is enough (stopping at the glow used to do nothing)
}
// ---- drawing: cars, drones, the gate, fountains, beacons, the shield ----
function cyCarDraw(c,t){
  let x,z,yaw;if(c.ax===0){x=CYO.x+c.line+c.off;z=CYO.z+c.t;yaw=c.dir>0?0:Math.PI;}else{z=CYO.z+c.line+c.off;x=CYO.x+c.t;yaw=c.dir>0?Math.PI/2:-Math.PI/2;}
  if(inView(x,z,1800,60)<0)return;const y=c.y+Math.sin(t*1.6+c.v)*0.4,sx=Math.sin(yaw),cz=Math.cos(yaw),root=at(x,y,z,Math.sin(t*1.3+c.v)*0.03,yaw,Math.sin(t*1.1+c.v)*0.04),d2=(x-camPos.x)**2+(z-camPos.z)**2,K=1.7,tr=c.tr;
  queue(MESH.box,child(root,0,0,0,0,0,0,2.0*K,0.55*K,4.6*K),c.col,0,0.12);                    // hull
  queue(MESH.box,child(root,0,-0.05*K,2.5*K,-0.35,0,0,1.7*K,0.4*K,1.6*K),c.col,0,0.12);      // sloping nose
  queue(MESH.sphere,child(root,0,0.38*K,-0.1*K,0,0,0,0.85*K,0.45*K,1.5*K),[.1,.35,.85,1],0,0.55); // canopy
  if(d2<700*700){for(const s of [-1,1]){queue(MESH.box,child(root,s*1.15*K,0.05*K,-1.7*K,0,0,-s*0.12,1.1*K,0.1*K,1.5*K),[.5,.72,1,1],0);queue(MESH.glowBox,child(root,s*0.75*K,0.05*K,-2.35*K,0,0,0,0.5*K,0.2*K,0.12),[.9,1,1,1],0);}
    queue(MESH.glowBox,child(root,0,0.28*K,-2.3*K,0,0,0,1.1*K,0.1*K,0.1),tr.concat(1),0);}
  queue(MESH.glowSphere,child(root,0,-0.42*K,0,0,0,0,0.95*K,0.2*K,2.1*K),[tr[0],tr[1],tr[2],0.55],F_ADD); // the lift glow underneath
  if(d2>260*260)queue(MESH.glowSphere,at(x,y,z,0,0,0,7,4,7),[tr[0],tr[1],tr[2],0.2],F_ADD);            // seen from far away: a soft light so it still reads
  const rx=x-sx*3.4*K,rz=z-cz*3.4*K;queue(MESH.glowBox,M4.beam(tmpM(),rx,y,rz,rx-sx*90,y,rz-cz*90,1.2),[tr[0],tr[1],tr[2],0.3],F_ADD);queue(MESH.glowBox,M4.beam(tmpM(),rx,y,rz,rx-sx*42,y,rz-cz*42,0.32),[1,1,1,0.5],F_ADD);
}
function cyDroneDraw(d,t){
  if(!d.alive||inView(d.pos.x,d.pos.z,600)<0)return;const bob=Math.sin(t*2.4+d.seed)*0.3,root=at(d.pos.x,d.pos.y+bob,d.pos.z,Math.sin(t*2+d.seed)*0.08,d.yaw,Math.cos(t*2.2+d.seed)*0.08),hot=d.target?1:0;
  queue(MESH.sphere,child(root,0,0,0,0,0,0,1.5,0.8,1.5),[.93,.96,1,1],F_SH,d.flash);queue(MESH.sphere,child(root,0,-0.35,0,0,0,0,1.2,0.4,1.2),[.5,.7,1,1],0,d.flash);
  queue(MESH.ring,child(root,0,0.05,0,0,t*2,0,1.7,1,1.7),hot?[1,.3,.3,0.8]:[.3,.8,1,0.7],F_ADD);
  queue(MESH.glowSphere,child(root,0,0,1.2,0,0,0,0.4,0.4,0.4),hot?[1,.25,.2,1]:[.4,.95,1,1],0);
  for(const s of [-1,1])queue(MESH.glowSphere,child(root,s*1.45,0.1,0,0,0,0,0.22,0.22,0.22),Math.sin(t*6+s*2+d.seed)>0?[1,1,1,1]:[.2,.5,1,1],0);
  queue(MESH.glowSphere,child(root,0,0,0,0,0,0,2.4,1.2,2.4),hot?[1,.2,.2,0.07]:[.3,.8,1,0.06],F_ADD);
}
function cyDraw(Z){
  const t=time,o=CYO;
  {const sh=save.story.tower>=2||SPR.ending?Z.shield2:Z.shield;if(sh)queue(sh,ID,WHITE,F_BL);}
  if(cyReal())spSkyDraw();
  for(const c of CY.cars)cyCarDraw(c,t);
  for(const d of CY.drones)cyDroneDraw(d,t);
  // the light gate at the end of the entrance
  {const gz=o.z+CYARCH.z1-0.7,open=save.story.cyber>=2,a=open?0.1:0.22;queue(MESH.box,at(o.x,o.y+9.9,gz,0,0,0,19.6,19.6,0.25),[.5,.9,1,a+0.05*Math.sin(t*3)],F_ADD);
    for(let k=0;k<4;k++){const y=((t*5+k*5)%19.6);queue(MESH.glowBox,at(o.x,o.y+y,gz-0.2,0,0,0,19.4,0.35,0.15),[.8,.97,1,0.55*(1-y/19.6)],F_ADD);}
    queue(MESH.tube,at(o.x,o.y+38,o.z+CYARCH.z0-8,0,0,0,6.5,76,6.5),[.4,.85,1,0.06+0.02*Math.sin(t*2)],F_ADD);queue(MESH.disc,at(o.x,o.y+0.5,o.z+CYARCH.z0-10,0,0,0,16,1,16),[.4,.85,1,0.14],F_ADD);}
  // the Spire's beacon
  queue(MESH.tube,at(o.x,o.y+756,o.z,0,0,0,9,288,9),[.35,.8,1,0.1+0.03*Math.sin(t*2)],F_ADD);queue(MESH.tube,at(o.x,o.y+756,o.z,0,0,0,3,288,3),[.7,.95,1,0.3],F_ADD);queue(MESH.glowSphere,at(o.x,o.y+606,o.z,0,0,0,14,14,14),[.5,.9,1,0.35],F_ADD);
  // fountains and pylons on the plaza
  for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const x=o.x+sx*105,z=o.z+sz*105;if(inView(x,z,500,60)<0)continue;
    for(let k=0;k<3;k++){const h=10+7*Math.sin(t*1.7+k*2+sx),w=2.4-k*0.5;queue(MESH.glowCyl,at(x,o.y+2+h/2,z,0,0,0,w,h,w),[.4,.85,1,0.16],F_ADD);}
    queue(MESH.glowSphere,at(x,o.y+2.4,z,0,0,0,12,3,12),[.4,.85,1,0.18],F_ADD);
    const px=o.x+sx*62,pz=o.z+sz*62;for(let k=0;k<3;k++){const y=o.y+8+((t*8+k*10)%32);queue(MESH.ring,at(px,y,pz,0,t,0,3.2,1,3.2),[.4,.9,1,0.8],F_ADD);}}
  // landing pads breathe
  queue(MESH.ring,at(o.x+CYAT.x,o.y+CYAT.y+0.8,o.z+CYAT.z,0,t*0.5,0,24+Math.sin(t*2),1,24+Math.sin(t*2)),[.5,.95,1,0.7],F_ADD);
}
// ---- the story: arriving, the title card, going back in after a reload ----
function cyberArrive(){
  const S=save.story;S.invasion=3;S.cyber=Math.max(S.cyber,1);persist();INV.ls=null;INV.state='idle';INV.fleet.length=0;objective(null);objectiveMark(null);
  P.hp=maxHp();P.en=maxEn();flashWhite=1;
  if(S.tower>=2){enterZone('cyber',CYAT,()=>toast('The Cyber World','Fly up at full speed to travel back to Earth','cyan'));return;} // after the ending: a plain arrival, no story
  CY.intro=true;CY.introT=time;
  const go=()=>cyberIntro();
  if(zone&&zone.id==='cyber')go();else if(!enterZone('cyber',CYAT,go)){CY.intro=false;}
}
function cyberIntro(){
  const o=CYO,C={x:0,y:0,z:0},Lk={x:0,y:0,z:0};
  const cam=k=>{const e=k*k*(3-2*k);C.x=o.x+lerp(-330,CYAT.x,e);C.y=o.y+lerp(360,CYAT.y+16,e);C.z=o.z+lerp(-1380,CYAT.z-26,e);return C;};
  const look=k=>{const e=k*k*(3-2*k);Lk.x=o.x+lerp(260,0,e);Lk.y=o.y+lerp(190,300,e);Lk.z=o.z+lerp(-500,0,e);return Lk;};
  cutscene({dur:5.5,fov:64,letterbox:true,text:'A world beyond ours',from:cam,to:cam,look,onEnd:cyberTitle});
}
function cyberTitle(){
  const e=$('cytitle');if(e)e.classList.add('on');
  later(3.2,()=>{if(e)e.classList.remove('on');CY.intro=false;if(inCyber())cyObjective(true);});
}
// loading a game that is past the jump but not past the tower: start here (the solar system is gone until the tower's boss is beaten)
function cyberTick(dt){
  const S=save.story;if(!S||S.cyber<1||S.cyber>2||S.tower>=2)return;
  if(zone||CUT||ASK||ZF.phase||P.dead||state!=='play'||INV.ls||(CY.intro&&time-(CY.introT||0)<16)||paused||Portal.inAd)return;
  if(S.tower===1)enterZone('spire',spStartAt(Math.min(3,S.tf+1)));else enterZone('cyber',S.cyber>=2?CYFRONT:CYAT); // (tower 1: you were inside the Spire)
}
function cyberRespawn(){
  if(!inCyber())return false;
  const o=CYO,s=save.story.cyber>=2?CYFRONT:CYAT;
  P.dead=false;P.pos.set(o.x+s.x,o.y+s.y,o.z+s.z);P.vel.set(0,0,0);P.yaw=s.yaw;P.pitch=-0.12;P.flying=false;P.grounded=true;P.hp=maxHp();P.en=maxEn();P.stun=0;P.lastHit=-99;P.web=null;P.wall=null;camDist=8;projs.length=0;
  $('dead').hidden=true;flashWhite=Math.max(flashWhite,0.4);toast('Back on your feet','The city has no way out, and neither do you','cyan');Portal.midgame();return true;
}
// ---- test hooks ----
function cyberGoArch(){
  const o=CYO;if(!inCyber()){enterZone('cyber',CYFRONT);return true;}
  P.pos.set(o.x+CYFRONT.x,CYFRONT.y,o.z+CYFRONT.z);P.vel.set(0,0,0);P.yaw=CYFRONT.yaw;P.pitch=-0.05;return true;
}
function cyberStats(){return {boxes:CY.stats.boxes,cols:CY.stats.cols,buildMs:CY.stats.ms,regions:CYZ.regions?CYZ.regions.length:0,visible:CYZ.vis||0,cells:CYZ.grid?CYZ.grid.size:0,cars:CY.cars.length,drones:CY.drones.length,folks:CY.folks.length,tris:CYZ.regions?CYZ.regions.reduce((a,r)=>a+r.mesh.n/3,0):0};}
