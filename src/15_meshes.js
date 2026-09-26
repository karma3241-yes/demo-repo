// ================================================================
// Entity meshes (vehicles, drones, bosses)
// ================================================================
const GLASS_C=C('#18222e'),BLACK_C=C('#0c0d0f'),TRIM_C=C('#26282d'),CHROME=C('#b9bec6'),HEAD_C=C('#fff4d6'),TAIL_C=C('#ff1a1a');
// A car body: [length, width, bodyTop, cabinFrontZ, cabinBackZ, roofY, wheelR]
function carGeo(o){
  const g=new Geo(),W1=o.body||[1,1,1],L=o.L/2,Wd=o.W/2,bt=o.bt,cf=o.cf,cb=o.cb,ry=o.ry,wr=o.wr;
  g.box(-Wd,0.42,-L,Wd,bt,L,W1,0);
  g.box(-Wd+0.05,bt,-L+0.35,Wd-0.05,bt+0.06,L-0.35,W1,0);
  g.box(-Wd,0.3,L-0.12,Wd,0.62,L+0.12,TRIM_C,0);g.box(-Wd,0.3,-L-0.12,Wd,0.62,-L+0.12,TRIM_C,0);
  g.box(-Wd*0.6,0.62,L+0.01,Wd*0.6,0.9,L+0.05,TRIM_C,0);
  const cw=Wd-0.1;
  g.box(-cw,bt,cb,cw,ry,cf,o.cabin||W1,0);
  g.box(-cw+0.05,ry,cb+0.08,cw-0.05,ry+0.05,cf-0.08,o.cabin||W1,0);
  const wl=o.wind||0.8;
  g.prim(PRIM.ramp,0,(bt+ry)/2,cf+wl/2,0,Math.PI,0,cw*2,ry-bt,wl,GLASS_C,0);
  g.prim(PRIM.ramp,0,(bt+ry)/2,cb-wl*0.4,0,0,0,cw*2,ry-bt,wl*0.8,GLASS_C,0);
  g.box(-cw-0.02,bt+0.08,cb+0.12,-cw,ry-0.06,cf-0.12,GLASS_C,0);g.box(cw,bt+0.08,cb+0.12,cw+0.02,ry-0.06,cf-0.12,GLASS_C,0);
  g.box(-cw-0.03,bt+0.08,(cb+cf)/2-0.05,-cw,ry-0.06,(cb+cf)/2+0.05,o.cabin||W1,0);g.box(cw,bt+0.08,(cb+cf)/2-0.05,cw+0.03,ry-0.06,(cb+cf)/2+0.05,o.cabin||W1,0);
  for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const wx=x*(Wd-0.08),wz=z*(L-0.85);
    g.prim(PRIM.cyl,wx,wr,wz,0,0,Math.PI/2,wr,0.3,wr,BLACK_C,0);g.prim(PRIM.cyl,wx+x*0.02,wr,wz,0,0,Math.PI/2,wr*0.55,0.32,wr*0.55,CHROME,0);}
  g.box(-Wd+0.1,0.72,L+0.05,-Wd+0.5,0.95,L+0.13,HEAD_C,2);g.box(Wd-0.5,0.72,L+0.05,Wd-0.1,0.95,L+0.13,HEAD_C,2);
  g.box(-Wd+0.1,0.75,-L-0.13,-Wd+0.45,0.95,-L-0.05,TAIL_C,2);g.box(Wd-0.45,0.75,-L-0.13,Wd-0.1,0.95,-L-0.05,TAIL_C,2);
  g.box(-Wd-0.18,bt+0.05,cf-0.15,-Wd,bt+0.25,cf+0.05,o.cabin||W1,0);g.box(Wd,bt+0.05,cf-0.15,Wd+0.18,bt+0.25,cf+0.05,o.cabin||W1,0);
  if(o.extra)o.extra(g);
  return g.mesh();
}
const VEH_S=1.35; // vehicles are modelled at real size; heroes are bigger than life, so cars scale up to match
const CARS={
  sedan:carGeo({L:4.6,W:1.9,bt:1.05,cf:0.75,cb:-1.05,ry:1.65,wr:0.38}),
  compact:carGeo({L:3.9,W:1.8,bt:1.05,cf:0.7,cb:-1.3,ry:1.75,wr:0.36,wind:0.7}),
  suv:carGeo({L:4.9,W:2.05,bt:1.3,cf:1.0,cb:-2.0,ry:2.15,wr:0.46,extra:g=>{g.box(-0.8,2.2,-1.6,-0.7,2.3,0.7,TRIM_C,0);g.box(0.7,2.2,-1.6,0.8,2.3,0.7,TRIM_C,0);}}),
  taxi:carGeo({L:4.6,W:1.9,bt:1.05,cf:0.75,cb:-1.05,ry:1.65,wr:0.38,body:C('#f2c230'),extra:g=>{g.box(-0.35,1.7,-0.3,0.35,1.95,0.05,C('#ffe36b'),2);g.box(-0.96,0.62,-0.6,0.96,0.72,0.9,BLACK_C,0);}}),
  police:carGeo({L:4.8,W:1.95,bt:1.05,cf:0.75,cb:-1.15,ry:1.66,wr:0.39,body:C('#15171c'),cabin:C('#e9ecef'),extra:g=>{
    g.box(-0.99,0.45,-1.2,0.99,0.98,0.9,C('#e9ecef'),0);g.box(-0.75,1.71,-0.3,0.75,1.83,0.05,TRIM_C,0);
    g.box(-0.72,1.73,-0.28,-0.05,1.86,0.03,C('#6b1010'),0);g.box(0.05,1.73,-0.28,0.72,1.86,0.03,C('#10236b'),0);}}),
};
const CAR_KINDS=['sedan','sedan','compact','compact','suv','taxi'];
const vanMesh=carGeo({L:5.8,W:2.3,bt:2.9,cf:2.9,cb:2.3,ry:2.95,wr:0.5,wind:0.6,extra:g=>{g.box(-1.1,1.1,2.35,1.1,2.4,2.95,GLASS_C,0);}});
const truckMesh=(()=>{const g=new Geo();const A=C('#5b6068');
  g.box(-1.5,0.6,-3.6,1.5,3.4,2.0,A,0);g.box(-1.45,0.6,2.0,1.45,2.6,3.6,A,0);g.box(-1.3,2.6,2.0,1.3,3.2,2.6,GLASS_C,0);
  g.box(-1.52,1.6,-3.4,1.52,1.9,1.8,C('#ffc93c'),0);g.box(-0.9,0.8,-3.62,0.9,3.0,-3.58,C('#4a4f57'),0);
  for(const z of [-2.4,-0.8,2.6])for(const x of [-1.5,1.5]){g.prim(PRIM.cyl,x*0.97,0.55,z,0,0,Math.PI/2,0.55,0.4,0.55,BLACK_C,0);g.prim(PRIM.cyl,x*0.99,0.55,z,0,0,Math.PI/2,0.3,0.42,0.3,CHROME,0);}
  g.box(-1.2,1.1,3.6,-0.7,1.4,3.66,HEAD_C,2);g.box(0.7,1.1,3.6,1.2,1.4,3.66,HEAD_C,2);
  return g.mesh();})();
const droneMesh=(()=>{const g=new Geo();
  g.prim(PRIM.sphere,0,0,0,0,0,0,1.0,0.6,1.2,C('#2b3140'),0);g.prim(PRIM.sphere,0,0.35,-0.1,0,0,0,0.6,0.35,0.7,C('#3a4254'),0);
  for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]){g.prim(PRIM.box,x*0.95,0.05,z*0.95,0,Math.atan2(x,z),0,0.18,0.12,1.5,C('#1c2029'),0);
    g.prim(PRIM.cyl,x*1.55,0.1,z*1.55,0,0,0,0.22,0.35,0.22,C('#15171c'),0);g.prim(PRIM.torus,x*1.55,0.22,z*1.55,0,0,0,0.75,1,0.75,C('#ff2a3d'),6);}
  g.prim(PRIM.sphere,0,0.02,1.05,0,0,0,0.3,0.26,0.22,C('#ff3b30'),6);
  g.prim(PRIM.cyl,0,-0.55,0.3,Math.PI/2,0,0,0.14,0.9,0.14,C('#15171c'),0);g.box(-0.4,-0.7,-0.3,0.4,-0.45,0.4,C('#232833'),0);
  return g.mesh();})();
const ROTORS=[[-1.55,-1.55],[1.55,-1.55],[-1.55,1.55],[1.55,1.55]];
const bagMesh=(()=>{const g=new Geo();
  g.prim(PRIM.sphere,0,0,0,0,0,0,0.7,0.8,0.7,C('#8a6d3b'),0);g.prim(PRIM.cyl,0,0.75,0,0,0,0,0.25,0.3,0.25,C('#6b5430'),0);g.box(-0.25,-0.2,0.66,0.25,0.3,0.72,C('#2f9e5b'),0);
  return g.mesh();})();
const bossMesh=(()=>{const g=new Geo();
  g.prim(PRIM.sphere,0,0,0,0,0,0,18,3.8,18,C('#3a4150'),0);g.prim(PRIM.sphere,0,-1.2,0,0,0,0,16,3.4,16,C('#2a303c'),0);
  g.prim(PRIM.sphere,0,2.4,0,0,0,0,7,4.2,7,C('#1d8fc0'),6);
  g.prim(PRIM.torus,0,0,0,0,0,0,18.1,6,18.1,C('#ff2a3d'),6);g.prim(PRIM.torus,0,-3.2,0,0,0,0,8,4,8,C('#ff8a2a'),6);
  for(let i=0;i<14;i++){const a=i/14*TAU;g.prim(PRIM.lsphere,Math.cos(a)*14.5,1.9,Math.sin(a)*14.5,0,0,0,.6,.6,.6,C('#fff0b0'),6);
    g.prim(PRIM.box,Math.cos(a)*11,2.4,Math.sin(a)*11,0,-a,0,6,0.5,0.8,C('#4a5262'),0);}
  for(let i=0;i<4;i++){const a=i/4*TAU+0.4;g.box(Math.cos(a)*10-1,-4.5,Math.sin(a)*10-1,Math.cos(a)*10+1,-2,Math.sin(a)*10+1,C('#22262e'),0);
    g.prim(PRIM.cyl,Math.cos(a)*10,-5,Math.sin(a)*10,Math.PI/2,a,0,0.5,3,0.5,C('#15171c'),0);}
  return g.mesh();})();
// police helicopter (rotors are drawn separately so they can spin)
const heliMesh=(()=>{const g=new Geo();const W=C('#e9ecef'),K=C('#15171c'),B=C('#1f4fd1'),M=C('#3a3f48');
  g.prim(PRIM.sphere,0,1.6,0.6,0,0,0,1.5,1.35,2.4,K,0);g.prim(PRIM.sphere,0,1.35,-0.3,0,0,0,1.45,1.15,2.1,W,0);
  g.prim(PRIM.sphere,0,1.9,1.9,0.25,0,0,1.15,0.9,1.1,GLASS_C,0);
  g.box(-1.46,1.1,-1.6,1.46,1.35,1.2,B,0);
  g.prim(PRIM.cyl,0,1.9,-4.2,Math.PI/2,0,0,0.32,5.2,0.42,W,0);g.prim(PRIM.cyl,0,1.9,-4.2,Math.PI/2,0,0,0.34,1.2,0.44,B,0);
  g.box(-0.08,1.8,-7.2,0.08,3.3,-6.3,K,0);g.box(-1.1,1.85,-6.9,1.1,1.95,-6.4,K,0);
  g.prim(PRIM.cyl,0,3.05,0,0,0,0,0.35,0.6,0.35,M,0);g.box(-0.5,2.7,-0.9,0.5,3.0,0.7,M,0);
  for(const x of [-1,1]){g.box(x*1.25-0.08,0,-1.6,x*1.25+0.08,0.12,1.7,M,0);g.box(x*1.0-0.05,0.1,-0.9,x*1.0+0.05,0.9,-0.8,M,0);g.box(x*1.0-0.05,0.1,0.8,x*1.0+0.05,0.9,0.9,M,0);}
  g.box(-0.5,0.55,2.4,0.5,0.85,2.9,C('#fff4d6'),2);
  return g.mesh();})();
