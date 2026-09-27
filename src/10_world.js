// ================================================================
// City generation
// ================================================================
// A grid of 80 m cells (60 m blocks with 20 m roads between them) shaped like Manhattan and Queens:
// a long island running north-south with Central Park in the middle, a midtown skyscraper cluster and a
// dense financial district at the southern tip; the East River; and Queens across it, lower and mostly
// residential, with waterfront industry. Three bridges cross the river and piers line Manhattan's west shore.
// North is -z. i runs west to east (x), j north to south (z).
const CELL=80,GX=20,GZ=28,X0=-GX*CELL/2,Z0=-GZ*CELL/2,X1=-X0,Z1=-Z0;
const HALF=Math.max(X1,Z1),EDGE=HALF+80,LIMIT=EDGE+170,CEIL=520; // HALF/EDGE/LIMIT: the bounding square around everything
// the land mask: 0 water, 1 city block, 2 park
const LAND=new Uint8Array(GX*GZ);
(function shapeLand(){
  const set=(i0,i1,j0,j1,v)=>{for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++)LAND[i*GZ+j]=v;};
  // Manhattan: long and narrow, tapering at both tips
  set(2,6,0,1,1);set(0,7,2,25,1);set(1,6,26,26,1);set(2,5,27,27,1);set(0,0,2,3,0);set(7,7,2,4,0);
  set(2,5,7,13,2); // Central Park
  // Queens, across the East River (i 8-9 stay water)
  set(11,17,4,4,1);set(10,18,5,21,1);set(11,16,22,22,1);set(18,18,5,7,0);
})();
const BRIDGES=[7,14,20];                              // z grid lines where a bridge crosses the river
const RIVER=[8,9];                                    // the river's cell columns
const cellAt=(i,j)=>i<0||j<0||i>=GX||j>=GZ?0:LAND[i*GZ+j];
const isBlock=(i,j)=>cellAt(i,j)===1;
const cellX=i=>X0+(i+.5)*CELL,cellZ=j=>Z0+(j+.5)*CELL;
const cellI=x=>Math.floor((x-X0)/CELL),cellJ=z=>Math.floor((z-Z0)/CELL);
// road edges on the grid lines: along z (axis 0) at x line k between z nodes m and m+1; along x (axis 1) at z line m between x nodes k and k+1
function zEdge(k,m){if(m<0||m>=GZ)return false;const a=cellAt(k-1,m),b=cellAt(k,m);return !!(a||b)&&!(a===2&&b===2);}
function xEdge(m,k){if(k<0||k>=GX)return false;const a=cellAt(k,m-1),b=cellAt(k,m);if(BRIDGES.includes(m)&&RIVER.includes(k))return true;return !!(a||b)&&!(a===2&&b===2);}
const colliders=[],blockCols=[],extraCols=[],roofTops=[],mapRects=[],parks=[],shops=[],atms=[],alleys=[],curbSpots=[],orbSpots=[],lakes=[],fountainSpots=[];
const blockProps=[],tlights=[];
let bank=null,hospital=null,policeHQ=null,invTower=null;
const city=new Geo();
const C=h=>hex(h);
const STYLE={office:0,glass:1,brick:2,warehouse:3,house:4};
const FAC={office:['#9aa7b5','#c9b99a','#6f8196','#d6d0c4','#b8c6d2','#8c7b6b','#5d6f73','#c4a58a'].map(C),
  glass:['#3e5a78','#2f4a63','#4d6b86','#5a7d8c','#35505e','#6a8aa3'].map(C),
  brick:['#8e4a36','#a45c44','#7a3f31','#9c6b4e','#6e4a3a','#b0735a'].map(C),
  warehouse:['#7c7f86','#8a7d6b','#6b7477','#9a8f7c'].map(C),
  house:['#d8cbb3','#b9c7cf','#c9a98a','#a9b89a','#e0d6c2','#c2a4a4'].map(C)};
const NEON=['#ff2d95','#23e5ff','#a64dff','#ffcf33','#39ff88'].map(C);
const SHOP_COLS=['#e0453a','#2f9e5b','#e2b33c','#3a7be0','#b0569e','#e07b30','#1fa3a3'].map(C);
const SHOP_NAMES=['Deli','Pharmacy','Jeweler','Electronics','Cafe','Books','Arcade','Bakery','Florist','Tailor','Pawn Shop','Games','Diner','Music'];
const ROOF=C('#3b3f47'),WALK=C('#7d8087'),POLE=C('#2c2f35'),LAMP=C('#ffc27a'),DOOR=C('#3b2a20'),STONE=C('#cfc8b8'),TRIM=C('#4a4d55');
const GRASS=C('#3f7a3a'),TRUNK=C('#5a3d28'),PATHC=C('#b3a78e'),ROOFTILE=['#6e3b2e','#4b4f57','#5a4638','#3f4a5a'].map(C);
const TREES=['#2f6b2c','#3d7f35','#2a5c33','#4c8a3a'].map(C);
const CONT=['#b7412e','#2e6fb7','#d1a62c','#3f8f4f','#7c4bb0','#c7c7c7','#1f7d86'].map(C);

function addCollider(b,list){colliders.push(b);list.push(b);return b;}
// destructible buildings: each records its vertex range in the city mesh and its colliders
const bldgs=[];let _bs=null;
function bStart(){_bs={v0:city.pos.length/3,c0:colliders.length};}
function bEnd(x0,z0,x1,z1,kind){if(!_bs)return;const cols=colliders.slice(_bs.c0),h=Math.max(...cols.map(c=>c.y1),4),vol=(x1-x0)*(z1-z0)*h;
  const b={id:bldgs.length,v0:_bs.v0,v1:city.pos.length/3,cols,x0,z0,x1,z1,h,kind,col:cols[0]?cols[0].col:[.5,.5,.5],maxHp:Math.round(150+vol*0.025),hp:0,state:'up',t:0,off:0,tilt:0,tx:0,tz:0};
  b.hp=b.maxHp;for(const c of cols)c.bld=b;bldgs.push(b);_bs=null;}
function rect(x0,z0,x1,z1,col){mapRects.push({x0,z0,x1,z1,col});}
function districtOf(i,j){
  if(cellAt(i,j)===2)return 'park';
  if(i<=7){ // Manhattan
    if(j>=22)return 'downtown';          // the financial district
    if(j>=15)return 'midtown';           // the skyscraper cluster
    if(j>=7)return 'uptown';             // either side of the park
    return 'oldtown';                    // brick uptown blocks
  }
  // Queens
  if(i<=11&&j>=8&&j<=17)return 'lic';    // a few towers by the bridges
  if(i<=11||j>=20)return 'industrial';   // the waterfront
  if(i===14)return 'oldtown';            // the main shopping street
  return 'residential';
}
// ---- storefronts and ATMs on a street-facing face (0:+x 1:-x 2:+z 3:-z) ----
function faceInfo(face,x0,x1,z0,z1){const alongX=face>=2;return {alongX,nx:face===0?1:face===1?-1:0,nz:face===2?1:face===3?-1:0,fx:face===0?x1:face===1?x0:0,fz:face===2?z1:face===3?z0:0,len:alongX?x1-x0:z1-z0,mid:alongX?(x0+x1)/2:(z0+z1)/2};}
function slabOn(F,d0,d1,b0,b1,y0,y1,c,mat,seed=0){
  if(!F.alongX){const xa=F.fx+F.nx*d0,xb=F.fx+F.nx*d1;city.box(Math.min(xa,xb),y0,b0,Math.max(xa,xb),y1,b1,c,mat,seed);}
  else{const za=F.fz+F.nz*d0,zb=F.fz+F.nz*d1;city.box(b0,y0,Math.min(za,zb),b1,y1,Math.max(za,zb),c,mat,seed);}
}
function storefront(face,x0,x1,z0,z1){
  const F=faceInfo(face,x0,x1,z0,z1);if(F.len<8)return;
  const w=Math.min(F.len-2,13),mid=F.mid,a0=mid-w/2,a1=mid+w/2,col=SHOP_COLS[Math.floor(srand()*SHOP_COLS.length)];
  slabOn(F,0,0.14,a0+0.4,mid-1.2,0.3,3.4,C('#2c2418'),2);slabOn(F,0,0.14,mid+1.2,a1-0.4,0.3,3.4,C('#2c2418'),2);
  slabOn(F,0,0.2,a0+0.2,a0+0.4,0.25,3.5,TRIM,0);slabOn(F,0,0.2,a1-0.4,a1-0.2,0.25,3.5,TRIM,0);
  slabOn(F,0,0.16,mid-0.9,mid+0.9,0.25,3.0,DOOR,0);slabOn(F,0.16,0.2,mid-0.12,mid-0.02,1.3,1.5,C('#c9a64a'),0);
  slabOn(F,0,1.9,a0,a1,3.6,3.9,col,0);slabOn(F,1.7,1.95,a0,a1,3.25,3.9,col.map(c=>c*0.8),0);
  slabOn(F,0,0.3,mid-w*0.35,mid+w*0.35,4.2,5.3,col.map(c=>Math.min(1,c*1.6)),2);
  const px=F.alongX?mid:F.fx+F.nx*2.2,pz=F.alongX?F.fz+F.nz*2.2:mid;
  shops.push({x:px,z:pz,nx:F.nx,nz:F.nz,name:SHOP_NAMES[Math.floor(srand()*SHOP_NAMES.length)],col,fx:F.alongX?mid:F.fx+F.nx*0.6,fz:F.alongX?F.fz+F.nz*0.6:mid});
}
function atmOn(face,x0,x1,z0,z1){
  const F=faceInfo(face,x0,x1,z0,z1);const mid=lerp(F.alongX?x0:z0,F.alongX?x1:z1,sr(0.2,0.8));
  slabOn(F,0,0.55,mid-0.6,mid+0.6,0.25,2.4,C('#2b2f38'),0);slabOn(F,0.55,0.6,mid-0.4,mid+0.4,1.5,2.05,C('#3fd0ff'),2);slabOn(F,0.55,0.62,mid-0.3,mid+0.3,0.95,1.05,C('#101216'),0);
  atms.push({x:F.alongX?mid:F.fx+F.nx*1.3,z:F.alongX?F.fz+F.nz*1.3:mid,nx:F.nx,nz:F.nz,fx:F.alongX?mid:F.fx+F.nx*0.6,fz:F.alongX?F.fz+F.nz*0.6:mid});
}
// ---- building shapes ----
function parapet(x0,z0,x1,z1,y,col){const t=0.35,h=1.1;
  city.box(x0,y,z0,x1,y+h,z0+t,col,0);city.box(x0,y,z1-t,x1,y+h,z1,col,0);city.box(x0,y,z0,x0+t,y+h,z1,col,0);city.box(x1-t,y,z0,x1,y+h,z1,col,0);}
function waterTower(x,z,y){const W=C('#6b4a33');for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])city.box(x+a*1.4-.12,y,z+b*1.4-.12,x+a*1.4+.12,y+3,z+b*1.4+.12,POLE,0);
  city.prim(PRIM.cyl,x,y+4.8,z,0,0,0,2.1,3.6,2.1,W,0);city.prim(PRIM.cone,x,y+7.3,z,0,0,0,2.3,1.4,2.3,C('#3a3a3f'),0);}
function roofStuff(x0,z0,x1,z1,y,style){
  const w=x1-x0,d=z1-z0;if(w<6||d<6)return;
  if(style!=='house'&&style!=='warehouse')parapet(x0,z0,x1,z1,y,style==='glass'?C('#26303a'):ROOF);
  const n=Math.floor(sr(0,3));for(let a=0;a<n;a++){const ax=sr(x0+2,x1-4),az=sr(z0+2,z1-4);city.box(ax,y,az,ax+2.2,y+1.4,az+1.8,C('#6d727b'),0);city.box(ax+0.3,y+1.4,az+0.3,ax+1.9,y+1.55,az+1.5,C('#50555e'),0);}
  if(srand()<0.5){const bx=sr(x0+2,x1-5),bz=sr(z0+2,z1-5);city.box(bx,y,bz,bx+3,y+2.8,bz+3,style==='brick'?FAC.brick[1]:C('#8a8f98'),0);city.box(bx+1,y+0.25,bz+3,bx+2,y+2.2,bz+3.05,DOOR,0);}
  if((style==='brick'||style==='office')&&srand()<0.35)waterTower(sr(x0+3,x1-3),sr(z0+3,z1-3),y);
}
function ledges(x0,z0,x1,z1,y0,y1,col,every){for(let y=y0+every;y<y1-2;y+=every)city.box(x0-.25,y,z0-.25,x1+.25,y+0.35,z1+.25,col,0);}
function fireEscape(face,x0,x1,z0,z1,h){const F=faceInfo(face,x0,x1,z0,z1);const a=F.mid-2.5,b=F.mid+2.5;
  for(let y=7.6;y<h-3;y+=3.6){slabOn(F,0,1.4,a,b,y,y+0.12,C('#2a2c30'),0);slabOn(F,1.3,1.4,a,b,y+0.12,y+1.0,C('#2a2c30'),0);}}
function tower(x0,z0,x1,z1,h,style,list,opt={}){
  const pal=FAC[style];const f=pal[Math.floor(srand()*pal.length)],k=sr(0.88,1.08),col=[f[0]*k,f[1]*k,f[2]*k];
  const seed=STYLE[style]*1000+Math.floor(srand()*900)+srand()*0.99;
  city.box(x0,0.25,z0,x1,h,z1,col,1,seed);
  addCollider({x0,x1,z0,z1,y0:0,y1:h+0.3,col},list);rect(x0,z0,x1,z1,h);
  city.box(x0,h,z0,x1,h+0.3,z1,ROOF,0);
  if(style==='office')ledges(x0,z0,x1,z1,0,h,col.map(c=>c*0.8),16);
  if(style==='brick'){city.box(x0-.4,h-1.2,z0-.4,x1+.4,h-0.4,z1+.4,col.map(c=>c*0.75),0);ledges(x0,z0,x1,z1,0,4.2,C('#6a6a6a'),4);}
  let top=h+0.3,tx0=x0,tx1=x1,tz0=z0,tz1=z1;
  if(opt.tiers){let hh=h;for(let t=0;t<opt.tiers;t++){const ins=sr(2.5,5);if(tx1-tx0<14||tz1-tz0<14)break;tx0+=ins;tx1-=ins;tz0+=ins;tz1-=ins;
      const h2=hh+Math.round(sr(14,50)/4)*4;city.box(tx0,hh,tz0,tx1,h2,tz1,col,1,seed+0.37*(t+1));
      addCollider({x0:tx0,x1:tx1,z0:tz0,z1:tz1,y0:hh,y1:h2+0.3,col},list);city.box(tx0,h2,tz0,tx1,h2+0.3,tz1,ROOF,0);
      parapet(tx0-.3,tz0-.3,tx1+.3,tz1+.3,hh+0.3,style==='glass'?C('#26303a'):ROOF);hh=h2;top=h2+0.3;}}
  if(opt.spire&&top>100){const mx=(tx0+tx1)/2,mz=(tz0+tz1)/2,ah=sr(14,40);city.prim(PRIM.cyl,mx,top+ah/2,mz,0,0,0,0.35,ah,0.35,POLE,0);
    city.box(mx-.45,top+ah,mz-.45,mx+.45,top+ah+.9,mz+.45,C('#ff2a2a'),6);}
  roofStuff(tx0,tz0,tx1,tz1,top,style);
  if(h>36&&srand()<0.25){const nc=NEON[Math.floor(srand()*NEON.length)],side=Math.floor(srand()*4),y0=h*sr(0.25,0.4),y1=Math.min(h-4,y0+sr(14,40)),m=(side<2?(x0+x1):(z0+z1))/2;
    if(side===0)city.box(m-.8,y0,z1,m+.8,y1,z1+.35,nc,2);else if(side===1)city.box(m-.8,y0,z0-.35,m+.8,y1,z0,nc,2);
    else if(side===2)city.box(x1,y0,m-.8,x1+.35,y1,m+.8,nc,2);else city.box(x0-.35,y0,m-.8,x0,y1,m+.8,nc,2);}
  roofTops.push({x:(tx0+tx1)/2,y:top,z:(tz0+tz1)/2,x0:tx0,x1:tx1,z0:tz0,z1:tz1});
  return {col,top};
}
function house(x0,z0,x1,z1,face,list){
  bStart();
  const pal=FAC.house,col=pal[Math.floor(srand()*pal.length)],h=Math.round(sr(7,11));
  city.box(x0,0.25,z0,x1,h,z1,col,1,STYLE.house*1000+Math.floor(srand()*900));
  const rc=ROOFTILE[Math.floor(srand()*ROOFTILE.length)],alongX=face>=2,rh=sr(2.6,3.6);
  if(alongX)city.prim(PRIM.roof,(x0+x1)/2,h+rh/2,(z0+z1)/2,0,0,0,x1-x0+0.6,rh,z1-z0+0.6,rc,0);
  else city.prim(PRIM.roof,(x0+x1)/2,h+rh/2,(z0+z1)/2,0,Math.PI/2,0,z1-z0+0.6,rh,x1-x0+0.6,rc,0);
  addCollider({x0,x1,z0,z1,y0:0,y1:h+rh*0.6,col},list);rect(x0,z0,x1,z1,h);
  const F=faceInfo(face,x0,x1,z0,z1);slabOn(F,0,0.15,F.mid-0.7,F.mid+0.7,0.25,2.5,DOOR,0);slabOn(F,0,0.9,F.mid-1.1,F.mid+1.1,2.6,2.8,TRIM,0);
  if(srand()<0.6){const cx=sr(x0+1.5,x1-1.5),cz=sr(z0+1.5,z1-1.5);city.box(cx-.5,h,cz-.5,cx+.5,h+rh+1.2,cz+.5,C('#6b4a3e'),0);}
  roofTops.push({x:(x0+x1)/2,y:h+rh*0.6,z:(z0+z1)/2,x0,x1,z0,z1});
  bEnd(x0,z0,x1,z1,'house');
}
function warehouse(x0,z0,x1,z1,list){
  bStart();
  const pal=FAC.warehouse,col=pal[Math.floor(srand()*pal.length)],h=Math.round(sr(11,16));
  city.box(x0,0.25,z0,x1,h,z1,col,1,STYLE.warehouse*1000+Math.floor(srand()*900));
  const n=Math.max(2,Math.round((x1-x0)/9)),w=(x1-x0)/n;
  for(let i=0;i<n;i++)city.prim(PRIM.ramp,x0+w*(i+.5),h+1.6,(z0+z1)/2,0,Math.PI/2,0,z1-z0,3.2,w,C('#5e636b'),0);
  addCollider({x0,x1,z0,z1,y0:0,y1:h+1.6,col},list);rect(x0,z0,x1,z1,h);
  for(let i=0;i<3;i++){const dx=lerp(x0+5,x1-5,i/2);city.box(dx-2.2,0.25,z0-0.15,dx+2.2,5,z0,C('#3d4148'),0);}
  if(srand()<0.5){const sx=x1-4,sz=z1-4;city.prim(PRIM.cyl,sx,h+14,sz,0,0,0,1.6,28,1.6,C('#7a4a3a'),0);city.box(sx-1.7,h+26,sz-1.7,sx+1.7,h+27,sz+1.7,C('#d9d9d9'),0);
    addCollider({x0:sx-1.6,x1:sx+1.6,z0:sz-1.6,z1:sz+1.6,y0:h,y1:h+28,col},list);}
  roofTops.push({x:(x0+x1)/2,y:h+1.6,z:(z0+z1)/2,x0,x1,z0,z1});
  bEnd(x0,z0,x1,z1,'warehouse');
}
function containers(x0,z0,x1,z1,list,rows){
  for(let r=0;r<rows;r++){const z=z0+r*3.2;if(z+2.6>z1)break;let x=x0;
    while(x+12<=x1){const st=1+Math.floor(srand()*3);for(let s=0;s<st;s++){const c=CONT[Math.floor(srand()*CONT.length)];city.box(x,0.25+s*2.7,z,x+12,0.25+(s+1)*2.7-0.1,z+2.5,c,0);
        city.box(x+0.2,0.25+s*2.7+0.3,z-0.05,x+11.8,0.25+(s+1)*2.7-0.4,z,c.map(v=>v*0.8),0);}
      addCollider({x0:x,x1:x+12,z0:z,z1:z+2.5,y0:0,y1:0.25+st*2.7,col:CONT[0]},list);rect(x,z,x+12,z+2.5,st*3);x+=12.6;}}
}
// ---- street furniture (destructible; each block owns its own prop mesh) ----
const PROP_DEF={
  lamp:{hp:40,r:0.3,parts:[['cyl',0,3.6,0,0.12,7.2,0.12,POLE],['box',0,7.3,0.9,0.14,0.14,1.9,POLE],['box',0,7.15,1.7,0.55,0.25,0.8,LAMP,2]]},
  tlight:{hp:50,r:0.3,parts:[['cyl',0,2.8,0,0.12,5.6,0.12,POLE],['box',0,5.5,1.6,0.14,0.14,3.2,POLE],['box',0,4.9,3.0,0.45,1.3,0.45,C('#1d1f24')],['box',0,5.3,3.24,0.26,0.26,0.05,C('#3a1010')],['box',0,4.92,3.24,0.26,0.26,0.05,C('#3a3210')],['box',0,4.54,3.24,0.26,0.26,0.05,C('#103a18')]]},
  bench:{hp:30,r:0.9,parts:[['box',0,0.5,0,1.9,0.1,0.55,C('#6b4a2e')],['box',0,0.85,-0.25,1.9,0.5,0.08,C('#6b4a2e')],['box',-0.8,0.25,0,0.1,0.5,0.5,POLE],['box',0.8,0.25,0,0.1,0.5,0.5,POLE]]},
  bin:{hp:15,r:0.4,parts:[['cyl',0,0.5,0,0.35,1.0,0.35,C('#2f5d3a')],['cyl',0,1.03,0,0.38,0.08,0.38,C('#24272c')]]},
  hydrant:{hp:20,r:0.35,parts:[['cyl',0,0.35,0,0.18,0.7,0.18,C('#c4241c')],['sphere',0,0.72,0,0.2,0.15,0.2,C('#c4241c')],['cyl',0,0.45,0,0.08,0.5,0.08,C('#d6a21e'),0,0,Math.PI/2]]},
  mailbox:{hp:20,r:0.4,parts:[['box',0,0.7,0,0.55,0.9,0.5,C('#1f4fb0')],['cyl',0,1.15,0,0.27,0.5,0.25,C('#1f4fb0'),0,Math.PI/2,Math.PI/2],['box',0,0.12,0,0.4,0.24,0.35,POLE]]},
  newsbox:{hp:12,r:0.35,parts:[['box',0,0.55,0,0.5,1.1,0.45,C('#d64b2a')],['box',0,0.9,0.23,0.4,0.25,0.02,C('#e8e2d0')]]},
  busstop:{hp:60,r:1.8,glass:true,parts:[['box',-1.8,1.3,-0.5,0.1,2.6,0.1,POLE],['box',1.8,1.3,-0.5,0.1,2.6,0.1,POLE],['box',0,2.65,0,3.9,0.12,1.5,C('#3a3f47')],
    ['box',0,1.4,-0.62,3.6,2.1,0.05,C('#8fb3c9')],['box',0,0.5,-0.3,3.2,0.1,0.45,C('#6b4a2e')],['box',1.95,1.5,-0.1,0.06,1.6,0.9,C('#d9a93a'),2]]},
  tree:{hp:50,r:0.5,leaf:true,parts:[['box',0,1.7,0,0.45,3.4,0.45,TRUNK],['sphere',0,4.3,0,2.1,2.5,2.1,TREES[0]],['box',0,0.3,0,1.4,0.35,1.4,C('#5a5f66')]]},
  planter:{hp:25,r:0.8,leaf:true,parts:[['box',0,0.45,0,1.6,0.9,1.6,C('#8d8a82')],['sphere',0,1.2,0,0.9,0.7,0.9,TREES[1]]]},
};
function addProp(bi,type,x,z,yaw,extra){
  const d=PROP_DEF[type];const p=Object.assign({type,x,z,y:0.25,yaw,hp:d.hp,maxHp:d.hp,r:d.r,alive:true,respawn:0,bi},extra||{});
  if(type==='tree'){p.tint=TREES[Math.floor(srand()*TREES.length)];}
  blockProps[bi].push(p);return p;
}
function propPartM(p,part){const c=Math.cos(p.yaw),s=Math.sin(p.yaw);const lx=part[1],ly=part[2],lz=part[3];
  return M4.compose(TM,p.x+lx*c+lz*s,p.y+ly,p.z-lx*s+lz*c,part[9]||0,p.yaw+(part[10]||0),part[11]||0,part[4],part[5],part[6]);}
const PART_PRIM={box:'box',cyl:'lcyl',sphere:'psphere'};
function buildBlockProps(bi){
  const g=new Geo();for(const p of blockProps[bi]){if(!p.alive)continue;for(const part of PROP_DEF[p.type].parts){
    const col=part[0]==='sphere'&&p.tint?p.tint:part[7];g.add(PRIM[PART_PRIM[part[0]]],propPartM(p,part),col,part[8]||0);}}
  if(propMeshes[bi])freeMesh(propMeshes[bi]);propMeshes[bi]=g.idx.length?g.mesh():null;
}
const propMeshes=[];
function curbProps(bi,cx,cz,dist){
  // lamps and traffic lights on the corners, furniture along the curb
  for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){
    addProp(bi,'lamp',cx+sx*28.6,cz+sz*28.6,Math.atan2(sx,sz));
    // traffic light facing the road that runs along x (axis 1) or z (axis 0)
    const ax=srand()<0.5?0:1;
    if(ax===0)addProp(bi,'tlight',cx+sx*29.2,cz+sz*25.5,sx>0?Math.PI/2:-Math.PI/2,{axis:0,ix:Math.round((cx+sx*40-X0)/CELL),iz:Math.round((cz+sz*40-Z0)/CELL)});
    else addProp(bi,'tlight',cx+sx*25.5,cz+sz*29.2,sz>0?0:Math.PI,{axis:1,ix:Math.round((cx+sx*40-X0)/CELL),iz:Math.round((cz+sz*40-Z0)/CELL)});
  }
  const items=dist==='downtown'?['bin','planter','newsbox','hydrant','bench']:dist==='industrial'?['bin','hydrant']:['bench','bin','hydrant','mailbox','newsbox','tree','tree'];
  for(let side=0;side<4;side++){const n=1+Math.floor(srand()*3);
    for(let k=0;k<n;k++){const t=sr(-20,20),type=items[Math.floor(srand()*items.length)];
      const px=side===0?cx+t:side===1?cx+28.9:side===2?cx+t:cx-28.9,pz=side===0?cz-28.9:side===1?cz+t:side===2?cz+28.9:cz+t;
      addProp(bi,type,px,pz,side===0?Math.PI:side===1?Math.PI/2:side===2?0:-Math.PI/2);}
    if(srand()<0.12&&dist!=='industrial'){const t=sr(-12,12);const px=side===0?cx+t:side===1?cx+28.2:side===2?cx+t:cx-28.2,pz=side===0?cz-28.2:side===1?cz+t:side===2?cz+28.2:cz+t;
      addProp(bi,'busstop',px,pz,side===0?Math.PI:side===1?Math.PI/2:side===2?0:-Math.PI/2);}
  }
}
function special(i,j,cx,cz,list,bi){
  if(i===3&&j===25){ // bank (the financial district)
    const x0=cx-22,x1=cx+22,z0=cz-16,z1=cz+22,h=44;
    city.box(x0,0.25,z0,x1,h,z1,STONE,1,777.3);addCollider({x0,x1,z0,z1,y0:0,y1:h+0.6,col:STONE},list);rect(x0,z0,x1,z1,h);
    city.box(x0-.3,h,z0-.3,x1+.3,h+.6,z1+.3,ROOF,0);city.box(x0+2,0.25,z0-6,x1-2,1.2,z0,STONE,0);
    addCollider({x0:x0+2,x1:x1-2,z0:z0-6,z1:z0,y0:0,y1:1.2,col:STONE},list);
    for(let c=0;c<6;c++){const px=lerp(x0+5,x1-5,c/5);city.prim(PRIM.cyl,px,7,z0-4,0,0,0,1.3,11.6,1.3,STONE,0);}
    city.box(x0+2,12.8,z0-6,x1-2,15.5,z0,STONE,0);city.prim(PRIM.roof,cx,17,z0-3,0,0,0,x1-x0-4,3,6,STONE,0);
    city.box(cx-9,13.4,z0-6.1,cx+9,15,z0-5.95,C('#ffc93c'),2);
    const vy=h+0.6;bank={x:cx,z:z0-8,cx,cz:cz+3,roof:vy,vault:{x:cx,y:vy+3.5,z:cz+3},x0,x1,z0,z1};
    roofTops.push({x:cx+14,y:vy,z:cz+12,x0,x1,z0,z1});return true;
  }
  if(i===6&&j===11){ // hospital (where you get back on your feet), east of the park
    const x0=cx-24,x1=cx+24,z0=cz-14,z1=cz+20,h=36;tower(x0,z0,x1,z1,h,'office',list);
    for(const zf of [z0-0.3]){city.box(cx-3,20,zf,cx+3,22,zf+0.2,C('#ff2a2a'),2);city.box(cx-1,18,zf,cx+1,24,zf+0.2,C('#ff2a2a'),2);}
    city.box(cx-6,0.25,z0-6,cx+6,4,z0-5,C('#e8e8e8'),0);city.box(cx-6,4,z0-6,cx+6,4.4,z0,C('#e8e8e8'),0);
    city.box(cx-1.5,h+0.35,cz-1.5+3,cx+1.5,h+0.45,cz+1.5+3,C('#ffc93c'),0);
    hospital={x:cx,z:z0-10};return true;
  }
  if(i===4&&j===17){ // Inventor Tower (midtown): the Armored Inventor's home base, where the suit recharges. It can't be knocked down.
    const RED=C('#b3122f'),GOLD=C('#ffc93c'),GLASS=C('#2a3440'),h=290,x0=cx-15,x1=cx+15,z0=cz-15,z1=cz+15;
    city.box(cx-24,0.25,cz-24,cx+24,12,cz+24,C('#30343c'),1,STYLE.glass*1000+411.5);addCollider({x0:cx-24,x1:cx+24,z0:cz-24,z1:cz+24,y0:0,y1:12.3,col:GLASS},list);
    city.box(cx-24.3,12,cz-24.3,cx+24.3,12.6,cz+24.3,RED,0);city.box(cx-6,0.25,cz-24.4,cx+6,8,cz-24.2,C('#9fe8ff'),6);
    city.box(x0,12,z0,x1,h,z1,GLASS,1,STYLE.glass*1000+412.5);addCollider({x0,x1,z0,z1,y0:12,y1:h+0.3,col:GLASS},list);rect(cx-24,cz-24,cx+24,cz+24,h);
    for(const y of [60,120,180,240])city.box(x0-.4,y,z0-.4,x1+.4,y+1.4,z1+.4,RED,0);
    for(const [ax,az] of [[x0,z0],[x1,z0],[x0,z1],[x1,z1]])city.box(ax-1.2,12,az-1.2,ax+1.2,h+2,az+1.2,RED,0); // red corner fins
    const c0=x0+4,c1=x1-4,d0=z0+4,d1=z1-4,top=h+14;
    city.box(x0,h,z0,x1,h+0.4,z1,ROOF,0);city.box(c0,h,d0,c1,top,d1,RED,0);for(const y of [h+3,h+7,top-3])city.box(c0-.3,y,d0-.3,c1+.3,y+1.4,d1+.3,GOLD,6);
    addCollider({x0:c0,x1:c1,z0:d0,z1:d1,y0:h,y1:top+0.3,col:RED},list);city.box(c0,top,d0,c1,top+0.3,d1,C('#3a3f47'),0);
    city.prim(PRIM.cyl,cx,top+0.35,cz,0,0,0,5.5,0.06,5.5,C('#4fd8ff'),6);city.prim(PRIM.cyl,cx,top+0.4,cz,0,0,0,4.6,0.06,4.6,C('#3a3f47'),0);
    // the big emblem near the top, facing the street
    city.box(cx-4,h-34,z0-0.5,cx+4,h-4,z0,RED,0);city.box(cx-1.6,h-31,z0-0.8,cx+1.6,h-7,z0-0.5,GOLD,6);
    // the landing pad sticks out of the east face
    const py=h-40;city.box(x1,py-1,cz-9,x1+17,py,cz+9,C('#3a3f47'),0);city.box(x1,py-3,cz-2,x1+6,py-1,cz+2,C('#2a2d33'),0);
    city.prim(PRIM.cyl,x1+9,py+0.05,cz,0,0,0,6.5,0.06,6.5,C('#4fd8ff'),6);city.prim(PRIM.cyl,x1+9,py+0.1,cz,0,0,0,5.6,0.06,5.6,C('#3a3f47'),0);
    addCollider({x0:x1,x1:x1+17,z0:cz-9,z1:cz+9,y0:py-1,y1:py,col:RED},list);
    roofTops.push({x:cx,y:top+0.3,z:cz,x0:c0,x1:c1,z0:d0,z1:d1});
    invTower={x:cx,z:cz,x0:c0,x1:c1,z0:d0,z1:d1,top:top+0.3,pad:{x:x1+9,y:py,z:cz},door:{x:cx,z:cz-27}};return true;
  }
  if(i===5&&j===23){ // police headquarters (downtown)
    const x0=cx-22,x1=cx+22,z0=cz-18,z1=cz+14,h=28;tower(x0,z0,x1,z1,h,'office',list);
    city.box(cx-10,10,z1+0.05,cx+10,12.5,z1+0.35,C('#2a6fff'),2);city.box(cx-4,0.25,z1,cx+4,4,z1+0.2,DOOR,0);
    policeHQ={x:cx,z:z1+8};return true;
  }
  return false;
}
function parkBlock(i,j,cx,cz,list,bi,big){
  city.box(cx-28,0.25,cz-28,cx+28,0.4,cz+28,GRASS,5);parks.push({cx,cz});rect(cx-28,cz-28,cx+28,cz+28,-1);
  city.box(cx-28,0.4,cz-1.5,cx+28,0.45,cz+1.5,PATHC,0);city.box(cx-1.5,0.4,cz-28,cx+1.5,0.45,cz+28,PATHC,0);
  if(big&&i===7&&j===3){ // lake
    const L={x:cx+10,z:cz+10,r:14};lakes.push(L);lakeRim(L,10);
  }else parkFountain(cx,cz);
  if(big&&i===8&&j===4){city.box(cx+8,0.4,cz+8,cx+18,0.8,cz+18,STONE,0);for(const [a,b] of [[8.5,8.5],[17.5,8.5],[8.5,17.5],[17.5,17.5]])city.prim(PRIM.cyl,cx+a,3,cz+b,0,0,0,0.3,4.4,0.3,STONE,0);
    city.prim(PRIM.cone,cx+13,6.4,cz+13,0,0,0,7.5,2.6,7.5,C('#5c3b30'),0);}
  const nt=big?18:12;
  for(let t=0;t<nt;t++){const tx=cx+sr(-24,24),tz=cz+sr(-24,24);if(Math.abs(tx-cx)<3||Math.abs(tz-cz)<3)continue;if(lakes.some(l=>Math.hypot(tx-l.x,tz-l.z)<l.r+2))continue;
    if(Math.abs(tx-cx)<8&&Math.abs(tz-cz)<8)continue;addProp(bi,'tree',tx,tz,sr(0,TAU),{y:0.4});}
  for(let k=0;k<4;k++)addProp(bi,'bench',cx+(k%2?4:-4),cz+(k<2?3:-3),k<2?0:Math.PI,{y:0.4});
  orbSpots.push({x:cx+14,y:1.6,z:cz,roof:false});
}
// Central Park: grass right across the cells (no roads inside), paths, trees, a lake and the reservoir
lakes.push({x:X0+4*CELL,z:cellZ(9),r:26},{x:X0+4*CELL,z:cellZ(11)+40,r:34});
function centralPark(i,j,cx,cz,list,bi){
  const pw=cellAt(i-1,j)===2,pe=cellAt(i+1,j)===2,pn=cellAt(i,j-1)===2,ps=cellAt(i,j+1)===2;
  const x0=cx-(pw?40:30),x1=cx+(pe?40:30),z0=cz-(pn?40:30),z1=cz+(ps?40:30);
  if(!pw)city.box(cx-30.2,0,z0,cx-28.5,0.25,z1,WALK,0);if(!pe)city.box(cx+28.5,0,z0,cx+30.2,0.25,z1,WALK,0);
  if(!pn)city.box(x0,0,cz-30.2,x1,0.25,cz-28.5,WALK,0);if(!ps)city.box(x0,0,cz+28.5,x1,0.25,cz+30.2,WALK,0);
  city.box(x0,0.02,z0,x1,0.4,z1,GRASS,5);addCollider({x0,x1,z0,z1,y0:-1,y1:0.4,col:GRASS},list);parks.push({cx,cz});rect(x0,z0,x1,z1,-1);
  // paths: the long mall down the middle, two cross-park paths and a loop drive just inside the edge
  const inLake=(x,z)=>lakes.some(l=>Math.hypot(x-l.x,z-l.z)<l.r+2);
  if(i===3&&!inLake(x1-1,cz))city.box(x1-1.5,0.4,z0,x1+(pe?1.5:0),0.45,z1,PATHC,0);
  if(j===8||j===12)city.box(x0,0.4,cz-1.5,x1,0.45,cz+1.5,PATHC,0);
  if(!pw)city.box(x0+6,0.4,z0+(pn?0:6),x0+9,0.45,z1-(ps?0:6),PATHC,0);if(!pe)city.box(x1-9,0.4,z0+(pn?0:6),x1-6,0.45,z1-(ps?0:6),PATHC,0);
  if(!pn)city.box(x0+(pw?0:6),0.4,z0+6,x1-(pe?0:6),0.45,z0+9,PATHC,0);if(!ps)city.box(x0+(pw?0:6),0.4,z1-9,x1-(pe?0:6),0.45,z1-6,PATHC,0);
  for(let t=0;t<16;t++){const tx=cx+sr(-36,36),tz=cz+sr(-36,36);if(Math.abs(tx-cx)<3||Math.abs(tz-cz)<3)continue;if(tx<x0+2||tx>x1-2||tz<z0+2||tz>z1-2)continue;
    if(lakes.some(l=>Math.hypot(tx-l.x,tz-l.z)<l.r+3))continue;addProp(bi,'tree',tx,tz,sr(0,TAU),{y:0.4});}
  addProp(bi,'lamp',cx+3,cz+3,0,{y:0.4});addProp(bi,'bench',cx+4,cz-3,Math.PI,{y:0.4});addProp(bi,'bench',cx-4,cz+3,0,{y:0.4});
  orbSpots.push({x:cx+14,y:1.6,z:cz,roof:false});
}
// ponds are irregular, not circles: the shore wobbles inside the old circle (so nothing planted around it ends up in the water)
function lakeR(l,a){const h=l.x*0.137+l.z*0.071;return l.r*(0.8+0.07*Math.sin(2*a+h)+0.06*Math.sin(3*a+h*2.3+1)+0.04*Math.sin(5*a+h*3.7+2)+0.03*Math.sin(7*a+h*1.9));}
const inLake=(x,z,pad=0)=>{for(const l of lakes){const dx=x-l.x,dz=z-l.z;if(dx*dx+dz*dz<(l.r+pad)*(l.r+pad)&&Math.hypot(dx,dz)<lakeR(l,Math.atan2(dz,dx))+pad)return l;}return null;};
// a flat slab whose outline follows the shore (pad metres out), from y0 to y1
function lakeSlab(l,pad,y0,y1,N=40){
  const pos=[],nor=[],idx=[];pos.push(l.x,y1,l.z);nor.push(0,1,0);
  for(let i=0;i<=N;i++){const a=i/N*TAU,r=lakeR(l,a)+pad;pos.push(l.x+Math.cos(a)*r,y1,l.z+Math.sin(a)*r);nor.push(0,1,0);}
  for(let i=0;i<N;i++)idx.push(0,i+2,i+1);
  const b=pos.length/3;
  for(let i=0;i<=N;i++){const a=i/N*TAU,r=lakeR(l,a)+pad,c=Math.cos(a),sn=Math.sin(a);pos.push(l.x+c*r,y1,l.z+sn*r,l.x+c*r,y0,l.z+sn*r);nor.push(c,0,sn,c,0,sn);}
  for(let i=0;i<N;i++){const t0=b+i*2;idx.push(t0,t0+3,t0+1,t0,t0+2,t0+3);}
  return {pos,nor,idx};
}
const IDM=M4.create();
// the stone shore and the rocks around a pond (same random draws as the old round rim, so the rest of the city is unchanged)
function lakeRim(l,n){city.add(lakeSlab(l,1,0.15,0.45),IDM,C('#6b6456'),0);
  for(let k=0;k<n;k++){const a=k/n*TAU,r=lakeR(l,a)+1;city.prim(PRIM.sphere,l.x+Math.cos(a)*r,0.6,l.z+Math.sin(a)*r,0,a,0,sr(0.8,1.4),sr(0.5,0.9),sr(0.8,1.4),C('#7a7a74'),0);}}
// the fountain in each small square park: a stone basin with a raised lip, a column, an upper bowl and a spout.
// Both water surfaces sit a few cm above the stone under them (the old disc sat level with the basin top and flickered).
function parkFountain(x,z){const ST=C('#8d9199'),ST2=C('#a7abb2'),W=[1,1,1];
  city.prim(PRIM.cyl,x,0.8,z,0,0,0,6,0.8,6,ST,0);            // basin, 0.4 to 1.2
  city.prim(PRIM.cyl,x,1.23,z,0,0,0,5.3,0.06,5.3,W,4);        // its water, up to 1.26
  city.prim(PRIM.torus,x,1.26,z,0,0,0,5.75,2.4,5.75,ST2,0);   // the raised lip
  city.prim(PRIM.cyl,x,2.3,z,0,0,0,0.55,2.2,0.55,ST,0);       // column
  city.prim(PRIM.cyl,x,3.5,z,0,0,0,1.9,0.3,1.9,ST2,0);        // upper bowl, 3.35 to 3.65
  city.prim(PRIM.cyl,x,3.68,z,0,0,0,1.6,0.06,1.6,W,4);        // its water
  city.prim(PRIM.cyl,x,4.1,z,0,0,0,0.22,0.8,0.22,ST,0);city.prim(PRIM.sphere,x,4.55,z,0,0,0,0.32,0.32,0.32,ST2,0);
  fountainSpots.push({x,z});}
for(const l of lakes)lakeRim(l,12);
for(let i=0;i<GX;i++)for(let j=0;j<GZ;j++){
  const bi=i*GZ+j,cx=cellX(i),cz=cellZ(j),list=[],dist=districtOf(i,j);blockCols[bi]=list;blockProps[bi]=[];
  const lv=cellAt(i,j);if(!lv)continue;
  if(lv===2){centralPark(i,j,cx,cz,list,bi);continue;}
  city.box(cx-30,0,cz-30,cx+30,0.25,cz+30,WALK,0);
  city.box(cx-30.2,0,cz-30.2,cx+30.2,0.22,cz-29.8,C('#9a9ca1'),0);city.box(cx-30.2,0,cz+29.8,cx+30.2,0.22,cz+30.2,C('#9a9ca1'),0);
  addCollider({x0:cx-30,x1:cx+30,z0:cz-30,z1:cz+30,y0:-1,y1:0.25,col:WALK},list);
  curbProps(bi,cx,cz,dist);
  for(let k=0;k<2;k++){const side=Math.floor(srand()*4),t=sr(-20,20);
    if(side===0)curbSpots.push({x:cx+t,z:cz-32.2,axis:1});else if(side===1)curbSpots.push({x:cx+t,z:cz+32.2,axis:1});
    else if(side===2)curbSpots.push({x:cx-32.2,z:cz+t,axis:0});else curbSpots.push({x:cx+32.2,z:cz+t,axis:0});}
  if(special(i,j,cx,cz,list,bi))continue;
  if((dist==='uptown'||dist==='residential'||dist==='oldtown')&&srand()<0.06){parkBlock(i,j,cx,cz,list,bi,false);continue;}
  if(dist==='residential'){
    for(const [side,face] of [[0,3],[1,0],[2,2],[3,1]]){
      for(let k=0;k<4;k++){const a=-24+k*12.4+sr(-0.5,0.5),w=sr(8.5,10.5),dp=sr(10,13);
        let x0,x1,z0,z1;
        if(side===0){x0=cx+a;x1=x0+w;z0=cz-27;z1=z0+dp;}else if(side===2){x0=cx+a;x1=x0+w;z1=cz+27;z0=z1-dp;}
        else if(side===1){z0=cz+a;z1=z0+w;x1=cx+27;x0=x1-dp;}else{z0=cz+a;z1=z0+w;x0=cx-27;x1=x0+dp;}
        if(Math.abs((x0+x1)/2-cx)>14&&Math.abs((z0+z1)/2-cz)>14)continue;house(x0,z0,x1,z1,face,list);}}
    city.box(cx-12,0.25,cz-12,cx+12,0.35,cz+12,GRASS,5);continue;
  }
  if(dist==='industrial'){
    if(srand()<0.55){warehouse(cx-26,cz-26,cx+26,cz-2,list);containers(cx-26,cz+3,cx+26,cz+27,list,6);}
    else{warehouse(cx-26,cz-26,cx+2,cz+26,list);containers(cx+5,cz-26,cx+27,cz+26,list,15);}
    continue;
  }
  let lots,hRange,styles;
  const quad=[[cx-14.5,cz-14.5,25,25],[cx+14.5,cz-14.5,25,25],[cx-14.5,cz+14.5,25,25],[cx+14.5,cz+14.5,25,25]];
  if(dist==='downtown'){lots=srand()<0.45?[[cx,cz,54,54]]:quad;hRange=[120,320];styles=['glass','glass','glass','office'];}
  else if(dist==='midtown'){lots=srand()<0.4?[[cx,cz,54,54]]:quad;hRange=[90,270];styles=['glass','office','glass','office'];}
  else if(dist==='lic'){lots=srand()<0.3?[[cx,cz,54,54]]:quad;hRange=[40,150];styles=['glass','office','office'];}
  else if(dist==='oldtown'){lots=[];for(let a=0;a<3;a++)for(let b=0;b<2;b++)lots.push([cx-19+a*19,cz-14.5+b*29,17,25]);hRange=[12,40];styles=['brick','brick','office'];}
  else{lots=srand()<0.22?[[cx,cz,54,54]]:quad;hRange=[30,95];styles=['office','office','brick','brick'];} // uptown, either side of the park
  if(lots.length===4)alleys.push({x:cx,z:cz-26.5,nx:0,nz:-1},{x:cx,z:cz+26.5,nx:0,nz:1},{x:cx-26.5,z:cz,nx:-1,nz:0},{x:cx+26.5,z:cz,nx:1,nz:0});
  for(const [lx,lz,sw,sd] of lots){
    const style=styles[Math.floor(srand()*styles.length)];
    const w=sw*sr(0.78,1),dp=sd*sr(0.78,1),x0=lx-w/2,x1=lx+w/2,z0=lz-dp/2,z1=lz+dp/2;
    const hk=lots.length===1?1:0.85,h=Math.max(12,Math.round(lerp(hRange[0],hRange[1],Math.pow(srand(),1.6))*hk/4)*4);
    bStart();tower(x0,z0,x1,z1,h,style,list,{tiers:h>80&&srand()<0.7?1+(h>180?1:0):0,spire:srand()<0.5});
    const faces=[];if(lx>cx||lots.length===1)faces.push(0);if(lx<cx||lots.length===1)faces.push(1);if(lz>cz||lots.length===1)faces.push(2);if(lz<cz||lots.length===1)faces.push(3);
    const fShop=faces[Math.floor(srand()*faces.length)];
    if(srand()<(dist==='oldtown'?0.65:0.45))storefront(fShop,x0,x1,z0,z1);else if(srand()<0.3)atmOn(fShop,x0,x1,z0,z1);
    if(style==='brick'&&h>16&&srand()<0.6){const other=faces.find(f=>f!==fShop);if(other!==undefined)fireEscape(other,x0,x1,z0,z1,h);}
    bEnd(x0,z0,x1,z1,style);
  }
}
// piers along Manhattan's west shore (the Hudson)
const PIER_X1=X0-12,PIER_X0=PIER_X1-110;
(function docks(){
  for(const pz of [cellZ(5),cellZ(12)+40,cellZ(19)]){
    const x0=PIER_X0,x1=PIER_X1,z0=pz-22,z1=pz+22;
    city.box(x0,-3,z0,x1,0.25,z1,C('#6b5a48'),0);extraCols.push({x0,x1,z0,z1,y0:-3,y1:0.25,col:C('#6b5a48')});colliders.push(extraCols[extraCols.length-1]);rect(x0,z0,x1,z1,-2);
    for(let k=0;k<6;k++)city.prim(PRIM.cyl,x0+8+k*18,-2,z0-0.6,0,0,0,0.5,4,0.5,C('#4a3c30'),0);
    const list=extraCols;const before=list.length;containers(x0+6,z0+4,x1-20,z0+20,list,5);
    for(let i=before;i<list.length;i++)colliders.push(list[i]);
    const gx=x0+12;for(const dz of [z0+6,z1-6]){city.box(gx-1,0.25,dz-1,gx+1,34,dz+1,C('#d18a1f'),0);}
    city.box(gx-1.5,32,z0+4,gx+1.5,35,z1-4,C('#d18a1f'),0);city.box(gx-8,33,pz-1.2,gx+26,34.5,pz+1.2,C('#d18a1f'),0);
    extraCols.push({x0:gx-1,x1:gx+1,z0:z0+5,z1:z0+7,y0:0,y1:35,col:C('#d18a1f')},{x0:gx-1,x1:gx+1,z0:z1-7,z1:z1-5,y0:0,y1:35,col:C('#d18a1f')});
    colliders.push(extraCols[extraCols.length-2],extraCols[extraCols.length-1]);
  }
})();
// the street surface: each land cell plus a 12 m waterfront road where it meets the water; sea walls along the shore
const SHORE=12,SEAWALL=C('#8d8a82'),groundGeo=new Geo();
for(let i=0;i<GX;i++)for(let j=0;j<GZ;j++){if(!cellAt(i,j))continue;const cx=cellX(i),cz=cellZ(j),h=CELL/2+SHORE;
  groundGeo.prim(PRIM.quad,cx,0,cz,0,0,0,h*2,1,h*2,[1,1,1],3);
  if(!cellAt(i-1,j))city.box(cx-h-1.2,-4,cz-h,cx-h,0,cz+h,SEAWALL,0);if(!cellAt(i+1,j))city.box(cx+h,-4,cz-h,cx+h+1.2,0,cz+h,SEAWALL,0);
  if(!cellAt(i,j-1))city.box(cx-h,-4,cz-h-1.2,cx+h,0,cz-h,SEAWALL,0);if(!cellAt(i,j+1))city.box(cx-h,-4,cz+h,cx+h,0,cz+h+1.2,SEAWALL,0);}
// the bridges across the East River: a deck with railings, and two towers with cables
const BRIDGE_RECTS=[];
for(const m of BRIDGES){const z=Z0+m*CELL,xa=X0+RIVER[0]*CELL-SHORE,xb=X0+(RIVER[RIVER.length-1]+1)*CELL+SHORE,len=xb-xa,mid=(xa+xb)/2;
  BRIDGE_RECTS.push({x0:xa,x1:xb,z0:z-12,z1:z+12});groundGeo.prim(PRIM.quad,mid,0,z,0,0,0,len,1,24,[1,1,1],3);
  const STEEL=C('#5d6570'),STONEB=C('#9a8f7c');
  city.box(xa,-1.6,z-12.5,xb,0,z+12.5,STEEL,0);for(const sd of [-1,1])city.box(xa,0,z+sd*12-0.3,xb,1.2,z+sd*12+0.3,STEEL,0);
  for(const tx of [xa+len*0.28,xa+len*0.72]){for(const sd of [-1,1])city.box(tx-2.5,-6,z+sd*12-2.5,tx+2.5,58,z+sd*12+2.5,STONEB,0);city.box(tx-3,48,z-14,tx+3,54,z+14,STONEB,0);
    for(const sd of [-1,1])addCollider({x0:tx-2.5,x1:tx+2.5,z0:z+sd*12-2.5,z1:z+sd*12+2.5,y0:-6,y1:58,col:STONEB},extraCols);}
  for(const sd of [-1,1])for(let q=0;q<3;q++){const ta=xa+len*0.28,tb=xa+len*0.72,pts=[[xa,1.2],[ta,56],[mid,6+q*4],[tb,56],[xb,1.2]];
    for(let s=0;s<pts.length-1;s++){const [ax,ay]=pts[s],[bx,by]=pts[s+1];city.prim(PRIM.cyl,(ax+bx)/2,(ay+by)/2,z+sd*12,0,0,-Math.atan2(bx-ax,by-ay),0.25,Math.hypot(bx-ax,by-ay),0.25,STEEL,0);}}
  rect(xa,z-12,xb,z+12,0);}
for(const b of extraCols)if(!colliders.includes(b))colliders.push(b);
const cityMesh=city.mesh();
const groundMesh=groundGeo.mesh();
const waterMesh=new Geo().prim(PRIM.quad,0,-1.2,0,0,0,0,9000,1,9000,[1,1,1],4).mesh();
const lakeMesh=(()=>{const g=new Geo();for(const l of lakes)g.add(lakeSlab(l,0,0.45,0.47),IDM,[1,1,1],4);return g.mesh();})();
for(let bi=0;bi<GX*GZ;bi++)if(blockProps[bi])buildBlockProps(bi);
for(const list of blockProps)for(const p of list)if(p.type==='tlight')tlights.push(p);
(function(){
  const roofs=roofTops.slice().sort(()=>srand()-0.5).slice(0,34);
  for(const r of roofs)orbSpots.push({x:r.x+sr(-2,2),y:r.y+1.4,z:r.z+sr(-2,2),roof:true});
  for(let k=0;k<90;k++){const i=Math.floor(srand()*GX),j=Math.floor(srand()*GZ);if(!isBlock(i,j))continue;const p=pathPos({cx:cellX(i),cz:cellZ(j),u:sr(0,216),dir:1});orbSpots.push({x:p.x,y:1.5,z:p.z,roof:false});}
})();
const SPAWNS=[[hospital.x,hospital.z]];
// traffic light phase for an intersection: returns 'g', 'y' or 'r' for traffic travelling along `axis`
function lightFor(ix,iz,axis){
  const T=16,off=((ix*7+iz*13)%16),t=((time+WS.toff+off)%T+T)%T;
  const g0=t<7?'g':t<8.5?'y':'r',g1=t>=8.5&&t<15?'g':t>=15?'y':'r';
  return axis===0?g0:g1;
}

// sidewalk path around a block (u in 0..216, loops)
function pathPos(p){
  const L=54,hh=27;const u=((p.u%216)+216)%216;const seg=Math.floor(u/L),f=u-seg*L-hh;let x,z,yaw;
  if(seg===0){x=p.cx+f;z=p.cz-hh;yaw=Math.PI/2;}
  else if(seg===1){x=p.cx+hh;z=p.cz+f;yaw=0;}
  else if(seg===2){x=p.cx-f;z=p.cz+hh;yaw=-Math.PI/2;}
  else{x=p.cx-hh;z=p.cz-f;yaw=Math.PI;}
  if(p.dir<0)yaw+=Math.PI;
  return {x,z,yaw};
}
// the nearest city block (with sidewalks) to a point
function blockCenter(x,z){const i0=clamp(cellI(x),0,GX-1),j0=clamp(cellJ(z),0,GZ-1);
  for(let r=0;r<GX+GZ;r++)for(let a=-r;a<=r;a++)for(let b=-r;b<=r;b++){if(Math.max(Math.abs(a),Math.abs(b))!==r)continue;if(isBlock(i0+a,j0+b))return [cellX(i0+a),cellZ(j0+b)];}
  return [cellX(i0),cellZ(j0)];}
function pathFor(x,z,dir){
  const [cx,cz]=blockCenter(x,z);const lx=x-cx,lz=z-cz,hh=27;let u;
  if(Math.abs(lx)>Math.abs(lz)){u=lx>0?54+clamp(lz,-hh,hh)+hh:162+clamp(-lz,-hh,hh)+hh;}
  else{u=lz<0?clamp(lx,-hh,hh)+hh:108+clamp(-lx,-hh,hh)+hh;}
  return {cx,cz,u,dir:dir||(Math.random()<0.5?1:-1)};
}
function sidewalkPointNear(x,z,minD,maxD){
  for(let t=0;t<30;t++){const a=rr(0,TAU),d=rr(minD,maxD);const px=clamp(x+Math.cos(a)*d,X0+10,X1-10),pz=clamp(z+Math.sin(a)*d,Z0+10,Z1-10);
    if(!isBlock(cellI(px),cellJ(pz)))continue;const p=pathFor(px,pz);const q=pathPos(p);const dd=Math.hypot(q.x-x,q.z-z);if(dd>=minD*0.8&&dd<=maxD*1.2)return {x:q.x,z:q.z,path:p};}
  const p=pathFor(clamp(x+minD,X0+10,X1-10),clamp(z,Z0+10,Z1-10));const q=pathPos(p);return {x:q.x,z:q.z,path:p};
}

// ================================================================
// World queries
// ================================================================
const NEAR=[];
function nearCols(x,z){
  const i=cellI(x),j=cellJ(z);NEAR.length=0;
  for(let a=i-1;a<=i+1;a++)for(let b=j-1;b<=j+1;b++){if(a<0||b<0||a>=GX||b>=GZ)continue;const l=blockCols[a*GZ+b];for(let k=0;k<l.length;k++)if(!l[k].dead)NEAR.push(l[k]);}
  if(x<X0+40||(i>=RIVER[0]-1&&i<=RIVER[RIVER.length-1]+1))for(const b of extraCols)NEAR.push(b); // piers and bridge towers
  return NEAR;
}
// solid ground (land, waterfront roads, piers and bridges) on a 2 m raster; everywhere else is water
const GR=2,GRX0=X0-160,GRZ0=Z0-80,GRW=Math.ceil((X1-GRX0+80)/GR),GRH=Math.ceil((Z1-GRZ0+80)/GR),GROUND=new Uint8Array(GRW*GRH);
(function rasterGround(){const fill=(x0,z0,x1,z1)=>{const a0=Math.max(0,Math.floor((x0-GRX0)/GR)),a1=Math.min(GRW-1,Math.floor((x1-GRX0)/GR)),b0=Math.max(0,Math.floor((z0-GRZ0)/GR)),b1=Math.min(GRH-1,Math.floor((z1-GRZ0)/GR));
    for(let a=a0;a<=a1;a++)for(let b=b0;b<=b1;b++)GROUND[a*GRH+b]=1;};
  for(let i=0;i<GX;i++)for(let j=0;j<GZ;j++)if(cellAt(i,j)){const cx=cellX(i),cz=cellZ(j),h=CELL/2+SHORE;fill(cx-h,cz-h,cx+h,cz+h);}
  for(const r of BRIDGE_RECTS)fill(r.x0,r.z0,r.x1,r.z1);
})();
const onIsland=(x,z)=>{const a=Math.floor((x-GRX0)/GR),b=Math.floor((z-GRZ0)/GR);return a>=0&&b>=0&&a<GRW&&b<GRH&&GROUND[a*GRH+b]===1;};
const baseY=(x,z)=>onIsland(x,z)?0:-0.9;
function inBuilding(x,y,z,pad=0){
  for(const b of nearCols(x,z)){if(x>b.x0-pad&&x<b.x1+pad&&z>b.z0-pad&&z<b.z1+pad&&y<b.y1+pad&&y>b.y0-pad)return b;}
  return null;
}
function groundY(x,z,y=1e9){let g=baseY(x,z);for(const b of nearCols(x,z)){if(x>b.x0&&x<b.x1&&z>b.z0&&z<b.z1&&b.y1<=y+0.6&&b.y1>g)g=b.y1;}return g;}
// ray vs building boxes, walking the city grid cell by cell; fills RAYHIT with the entry normal
const RAYHIT={t:0,nx:0,ny:1,nz:0,b:null};
let _best=0;
function rayBox(b,ox,oy,oz,dx,dy,dz){
  if(b.dead)return;
  let t0=0,t1=_best,ax=-1,sg=0;
  for(let a=0;a<3;a++){
    const o=a===0?ox:a===1?oy:oz,d=a===0?dx:a===1?dy:dz,mn=a===0?b.x0:a===1?b.y0:b.z0,mx=a===0?b.x1:a===1?b.y1:b.z1;
    if(Math.abs(d)<1e-9){if(o<mn||o>mx)return;continue;}
    let tn=(mn-o)/d,tf=(mx-o)/d;if(tn>tf){const s=tn;tn=tf;tf=s;}
    if(tn>t0){t0=tn;ax=a;sg=d>0?-1:1;}if(tf<t1)t1=tf;if(t0>t1)return;
  }
  if(ax>=0&&t0<_best){_best=t0;RAYHIT.b=b;RAYHIT.nx=ax===0?sg:0;RAYHIT.ny=ax===1?sg:0;RAYHIT.nz=ax===2?sg:0;}
}
function rayCity(ox,oy,oz,dx,dy,dz,tmax){
  _best=tmax;RAYHIT.b=null;
  for(const b of extraCols)rayBox(b,ox,oy,oz,dx,dy,dz);
  let cx=cellI(ox),cz=cellJ(oz);
  const sx=dx>0?1:-1,sz=dz>0?1:-1;
  const tdx=Math.abs(dx)<1e-9?Infinity:CELL/Math.abs(dx),tdz=Math.abs(dz)<1e-9?Infinity:CELL/Math.abs(dz);
  let tmx=Math.abs(dx)<1e-9?Infinity:((cx+(dx>0?1:0))*CELL+X0-ox)/dx,tmz=Math.abs(dz)<1e-9?Infinity:((cz+(dz>0?1:0))*CELL+Z0-oz)/dz;
  for(let n=0;n<90;n++){
    if(cx>=0&&cz>=0&&cx<GX&&cz<GZ){const l=blockCols[cx*GZ+cz];for(let k=0;k<l.length;k++)rayBox(l[k],ox,oy,oz,dx,dy,dz);}
    const tn=Math.min(tmx,tmz);if(_best<=tn||tn>tmax)break;
    if(tmx<tmz){tmx+=tdx;cx+=sx;}else{tmz+=tdz;cz+=sz;}
    if((cx<0&&sx<0)||(cx>=GX&&sx>0)||(cz<0&&sz<0)||(cz>=GZ&&sz>0))break;
  }
  RAYHIT.t=_best;return _best;
}
function raySphere(ox,oy,oz,dx,dy,dz,cx,cy,cz,r,ys=1){
  const lx=cx-ox,ly=(cy-oy)*ys,lz=cz-oz;const dyy=dy*ys;const dl=Math.hypot(dx,dyy,dz);
  const ux=dx/dl,uy=dyy/dl,uz=dz/dl;
  const tca=lx*ux+ly*uy+lz*uz;const d2=lx*lx+ly*ly+lz*lz-tca*tca;if(d2>r*r)return -1;
  const th=Math.sqrt(r*r-d2);let t=tca-th;if(t<0)t=tca+th;if(t<0)return -1;return t/dl;
}
// body vs buildings: resolves penetration, reports ground and the wall that was hit
const COL={grounded:false,wall:null};
function collideBody(pos,vel,prevY,R,HT,floor){ // floor: override the ground height (the player swimming over open water)
  COL.grounded=false;COL.wall=null;const gb=floor===undefined?baseY(pos.x,pos.z):floor;
  if(pos.y<=gb){pos.y=gb;if(vel.y<0)vel.y=0;COL.grounded=true;}
  for(const b of nearCols(pos.x,pos.z)){
    if(pos.x>b.x0-R&&pos.x<b.x1+R&&pos.z>b.z0-R&&pos.z<b.z1+R&&pos.y<b.y1&&pos.y+HT>b.y0){
      if(prevY>=b.y1-0.7){pos.y=b.y1;if(vel.y<0)vel.y=0;COL.grounded=true;}
      else if(prevY+HT<=b.y0+0.3&&vel.y>0){pos.y=b.y0-HT;vel.y=0;}
      else{
        const p0=pos.x-(b.x0-R),p1=(b.x1+R)-pos.x,p2=pos.z-(b.z0-R),p3=(b.z1+R)-pos.z;const m=Math.min(p0,p1,p2,p3);
        let nx=0,nz=0;
        if(m===p0){pos.x=b.x0-R;vel.x=Math.min(vel.x,0);nx=-1;}else if(m===p1){pos.x=b.x1+R;vel.x=Math.max(vel.x,0);nx=1;}
        else if(m===p2){pos.z=b.z0-R;vel.z=Math.min(vel.z,0);nz=-1;}else{pos.z=b.z1+R;vel.z=Math.max(vel.z,0);nz=1;}
        if(b.y1>3)COL.wall={b,nx,nz};
      }
    }
  }
  return COL;
}
// street furniture near a point
const PNEAR=[];
function propsNear(x,z,r){
  PNEAR.length=0;const i=cellI(x),j=cellJ(z);
  for(let a=i-1;a<=i+1;a++)for(let b=j-1;b<=j+1;b++){if(a<0||b<0||a>=GX||b>=GZ)continue;
    for(const p of blockProps[a*GZ+b])if(p.alive&&Math.abs(p.x-x)<r+p.r&&Math.abs(p.z-z)<r+p.r)PNEAR.push(p);}
  return PNEAR;
}
