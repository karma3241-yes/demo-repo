// ================================================================
// Markers in the world: crimes, and where to recharge
// ================================================================
// Every active crime gets a floating "!" pin over it with its distance (the nearest six), like the name tags. When it is
// off screen the pin slides to the edge of the screen and an arrow points the way. Heists get a bigger, pulsing "!!".
// When a hero meter runs low (under a quarter) a pin marks where to recharge it and a hint above the meters says how:
// the suit battery at Forge Tower, lightning on the nearest tall roof, calories at the nearest shop. The ring has no
// place to go, so its hint just says to press O (tap OATH) and say the oath. Plain energy refills by itself.
const markPool=[];
function markEl(i){if(!markPool[i]){const b=el('b'),arr=el('i',{class:'arr'}),pin=el('div',{class:'pin'},b),pw=el('div',{class:'pw'},pin,arr),sm=el('small'),t=el('div',{class:'mk'},pw,sm);
  $('marks').appendChild(t);markPool[i]={t,b,arr,sm,key:''};}return markPool[i];}
const fmtDist=d=>d<1000?Math.round(d)+' m':(d/1000).toFixed(1)+' km';
function placeMark(n,x,y,z,icon,col,label,cls,short){
  const m=markEl(n),W=innerWidth,H=innerHeight,dx=x-camPos.x,dy=y-camPos.y,dz=z-camPos.z;
  const fz=dx*camF.x+dy*camF.y+dz*camF.z,rx=dx*camR.x+dy*camR.y+dz*camR.z,uy=dx*camU.x+dy*camU.y+dz*camU.z;
  const p=fz>0.5?project(x,y,z):null;let sx,sy,edge=false,ang=0;
  if(p&&p[0]>36&&p[0]<W-36&&p[1]>60&&p[1]<H-40){sx=p[0];sy=p[1];}
  else{edge=true;ang=Math.atan2(-uy,rx);if(fz<=0&&Math.abs(rx)<Math.abs(uy)*0.2)ang=Math.PI/2; // straight behind you: point down
    // on touch screens the edge pins stay between the left HUD column and the buttons
    const lh=touchOn()&&save.settings.tHand==='l',L=touchOn()?(lh?Math.min(300,W*0.4):200):40,Rm=touchOn()?(lh?200:Math.min(300,W*0.4)):40,mid=(L+W-Rm)/2,hw=Math.max(40,(W-Rm-L)/2),hh=H/2-64,ux=Math.cos(ang),vy=Math.sin(ang),t=Math.min(hw/Math.max(Math.abs(ux),1e-4),hh/Math.max(Math.abs(vy),1e-4));sx=mid+ux*t;sy=H/2+vy*t;}
  m.t.hidden=false;m.t.style.transform=`translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px) translate(-50%,${edge?'-14px':'-100%'})`;
  const key=icon+'|'+col+'|'+cls+'|'+edge;if(m.key!==key){m.key=key;m.b.textContent=icon;m.t.style.setProperty('--c',col);m.t.className='mk'+(cls?' '+cls:'')+(edge?' edge':'');}
  if(edge)label=short; // at the screen edge only the distance, so it never runs off the screen
  if(m.label!==label){m.label=label;m.sm.textContent=label;}
  if(edge)m.arr.style.transform=`rotate(${ang.toFixed(3)}rad) translateX(16px)`;
}
// ---- where to recharge ----
let goalCache={t:-9,key:'',g:null};
function nearestTallRoof(){let best=null,bd=1e9;for(const r of roofTops){if(r.y<TALL_ROOF)continue;const d=Math.hypot(r.x-P.pos.x,r.z-P.pos.z);if(d<bd){bd=d;best=r;}}return best;}
function nearestShop(){let best=null,bd=1e9;for(const s of shops){if(s.prop&&!s.prop.alive)continue;const d=Math.hypot(s.x-P.pos.x,s.z-P.pos.z);if(d<bd){bd=d;best=s;}}return best;}
function rechargeGoal(){
  const m=heroMeter();if(!m||P.dead||meterFrac(m)>=0.25)return null;
  if(m.key==='ring')return {hint:'Ring low · '+(touchOn()?'tap OATH':'press O')+' and say the oath to recharge',col:'#5dff86'};
  if(m.key==='battery'){if(atInventorTower())return {hint:'Recharging at Forge Tower',col:'#ff6a3d'};if(!invTower)return null;
    return {x:invTower.x,y:invTower.top+8,z:invTower.z,icon:'🔋',label:'Forge Tower',col:'#ff6a3d',hint:(save.battery<=0?'Suit on standby':'Battery low')+' · fly to Forge Tower to recharge'};}
  if(m.key==='bolt'){if(tallRoofHere())return {hint:(touchOn()?'Tap USE':'Press G')+' to raise your hammer and call the storm',col:'#8fd8ff'};
    if(time-goalCache.t>1||goalCache.key!=='bolt'){goalCache={t:time,key:'bolt',g:nearestTallRoof()};}const r=goalCache.g;if(!r)return null;
    return {x:r.x,y:r.y+8,z:r.z,icon:'⚡',label:'Tall roof',col:'#8fd8ff',hint:'Lightning low · land on a tall roof and '+(touchOn()?'tap USE':'press G')+' to call the storm'};}
  if(m.key==='cal'){if(nearestShopToEat())return {hint:(touchOn()?'Tap USE':'Press G')+' to eat here',col:'#ffc93c'};
    if(time-goalCache.t>1||goalCache.key!=='cal'){goalCache={t:time,key:'cal',g:nearestShop()};}const s=goalCache.g;if(!s)return null;
    return {x:s.x,y:5,z:s.z,icon:'🍔',label:s.name,col:'#ffc93c',hint:'Calories low · '+(touchOn()?'tap USE':'press G')+' at a shop to eat'};}
  return null;
}
let hintKey='';
function updateMarkers(){
  let n=0;
  const on=state==='play'&&!creating&&!P.dead&&!inSpace()&&!voidbornAway();
  if(on){
    const list=[];for(const c of crimes){const d=Math.hypot(c.x-P.pos.x,c.z-P.pos.z);list.push([d,c]);}list.sort((a,b)=>a[0]-b[0]);
    for(const [d,c] of list.slice(0,6)){const big=c.heist||c.type==='vault'||c.type==='truck';
      placeMark(n++,c.x,groundY(c.x,c.z)+(big?9:5.5),c.z,big?'!!':'!',CRIME_COL[c.type]||'#ff5a3d',d<250?c.label+' · '+fmtDist(d):fmtDist(d),big?'big':'',fmtDist(d));}
  }
  const g=on?rechargeGoal():null;
  if(g&&g.x!==undefined){const d=fmtDist(Math.hypot(g.x-P.pos.x,g.z-P.pos.z));placeMark(n++,g.x,g.y,g.z,g.icon,g.col,g.label+' · '+d,'goal',d);}
  for(let i=n;i<markPool.length;i++)if(!markPool[i].t.hidden)markPool[i].t.hidden=true;
  const h=$('lowhint'),k=g?g.hint+'|'+g.col:'';
  if(k!==hintKey){hintKey=k;h.hidden=!g;if(g){h.textContent=g.hint;h.style.setProperty('--c',g.col);}}
}
