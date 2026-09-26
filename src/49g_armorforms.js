// ================================================================
// Armored Inventor suit forms: the armor folds itself into a jet, a bike, a sports car or a tank
// ================================================================
// Same machinery as the Ring Bearer's constructs, but built from red and gold metal plates and powered by the suit battery.
// V opens the forms wheel (N if you also carry the Morph Band), B turns into your last form and back.
const ARMOR_FX=[1,.45,.2],ARMOR_RED=[.55,.02,.03,1],ARMOR_GOLD=[.95,.7,.22,1],ARMOR_DARK=[.12,.12,.14,1];
const ARMOR_IDS=['aJet','aBike','aCar','aTank'];
Object.assign(CONSTRUCTS,{
  aJet:{name:'Jet Form',armor:true,ext:true,unlock:1,cost:5,drain:0.5,fly:true,speed:2.1,cam:1.35,attacks:'LMB guns · RMB missiles',blurb:'The suit folds into a fighter jet'},
  aBike:{name:'Bike Form',armor:true,ext:true,bike:true,unlock:2,cost:4,drain:0.35,speed:1,drive:{top:76,accel:44,steer:2.7},cam:1.25,attacks:'WASD ride · Shift boost · LMB guns · RMB ram',blurb:'A red superbike'},
  aCar:{name:'Car Form',armor:true,ext:true,unlock:3,cost:6,drain:0.45,speed:1,drive:{top:96,accel:36,steer:2.1},cam:1.45,attacks:'WASD drive · Shift boost · LMB guns · RMB missiles',blurb:'A red and gold sports car'},
  aTank:{name:'Tank Form',armor:true,ext:true,heavy:true,unlock:5,cost:10,drain:0.6,speed:1,drive:{top:34,accel:18,steer:1.4},cam:1.6,attacks:'WASD drive · LMB cannon · RMB machine gun',blurb:'A walking fortress on treads'},
});
for(const id of ARMOR_IDS)if(!CON_IDS.includes(id))CON_IDS.push(id);
function armorPrimary(K){
  const id=K.id;
  if(id==='aTank'){if(K.cd>0)return true;if(!ringSpend(3)){ringOut();return true;}K.cd=1.3;K.kick=time;const o=conMuzzle(0),d=dirTo(o,aim.x,aim.y,aim.z);
    conRocket(o,d,200*(1+mk('armorFlight'))*strengthMul(),10);explode(o.x,o.y,o.z,0.3);addShake(0.35);SFX.boom(0.7,0.9);return true;}
  K.gunning=true;return true;
}
function armorAlt(K,down){
  const id=K.id;
  if(id==='aTank'){K.gunning2=down;return true;}
  if(!down)return true;if(K.cd2>0)return true;
  if(id==='aBike'){if(!ringSpend(1.5)){ringOut();return true;}K.cd2=1.5;K.rideRam=1.1;K.spd=Math.max(K.spd||0,CONSTRUCTS.aBike.drive.top*1.2);SFX.whoosh();ringFx(P.pos.x,P.pos.y+0.8,P.pos.z,1,4,0.3,ARMOR_FX);}
  else{if(!ringSpend(2)){ringOut();return true;}K.cd2=1.1;fireMissiles(id==='aJet'?2:2);}
  return true;
}
function armorMuzzle(id,side,s,c){
  if(id==='aJet')return {x:P.pos.x+s*3+c*side*1.6,y:P.pos.y+1.1,z:P.pos.z+c*3-s*side*1.6};
  if(id==='aBike')return {x:P.pos.x+s*1.8+c*side*0.35,y:P.pos.y+1.1,z:P.pos.z+c*1.8-s*side*0.35};
  if(id==='aCar')return {x:P.pos.x+s*2.6+c*side*0.9,y:P.pos.y+0.9,z:P.pos.z+c*2.6-s*side*0.9};
  // tank: the big gun turns to where you aim; the machine gun sits beside it
  const ty=Math.atan2(camF.x,camF.z),ts=Math.sin(ty),tc=Math.cos(ty);
  return side?{x:P.pos.x+ts*2.2+tc*side*0.9,y:P.pos.y+2.6,z:P.pos.z+tc*2.2-ts*side*0.9}:{x:P.pos.x+ts*5.2,y:P.pos.y+2.4+camF.y*3,z:P.pos.z+tc*5.2};
}
const conHidesRider=id=>id==='racer'||!!(CONSTRUCTS[id]&&(CONSTRUCTS[id].armor||CONSTRUCTS[id].hide));
function drawArmorForm(s,id,isPlayer){
  const K=isPlayer?P.construct:null,x=s.pos.x,y=s.pos.y,z=s.pos.z,yaw=s.heroYaw||0,R0=ARMOR_RED,G0=ARMOR_GOLD,D0=ARMOR_DARK;
  const M=(m,c)=>queue(c===R0?MESH.box:MESH.mbox,m,c,F_SH),glow=(m,a)=>queue(MESH.glowSphere,m,[1,.85,.5,a],F_ADD);
  if(id==='aJet'){const pitch=isPlayer&&P.flying?-P.pitch*0.6:0,R=at(x,y+1.1,z,pitch,yaw,s.bank||0);
    M(child(R,0,0,0.6,0,0,0,1.3,1.0,6.8),R0);M(child(R,0,0.45,1.6,0,0,0,0.8,0.5,2.2),G0);M(child(R,0,0,3.9,0.1,0,0,0.7,0.6,1.4),R0);
    M(child(R,0,-0.1,-0.6,0,0,0,8.6,0.14,2.4),R0);M(child(R,0,-0.05,-0.6,0,0,0,8.8,0.08,0.6),G0);M(child(R,0,0.1,-3.1,0,0,0,3.4,0.12,1.2),R0);
    for(const sd of [-1,1]){M(child(R,sd*0.7,0.9,-3,0,0,sd*0.35,0.12,1.6,1.2),R0);glow(child(R,sd*0.45,0,-3.4,0,0,0,0.45,0.45,0.8),0.8);}return;}
  if(id==='aBike'||id==='aCar'||id==='aTank'){
    const lean=K?K.lean||0:s.bank||0,R=at(x,y,z,0,yaw,lean),spin=time*(K?(K.spd||0)*0.6:12);
    const wheel=(lx,ly,lz,r,w)=>{M(child(R,lx,ly,lz,spin,0,0,w,r*2,r*2),D0);M(child(R,lx*1.02,ly,lz,spin,0,0,w*1.05,r*0.9,r*0.9),G0);};
    if(id==='aBike'){wheel(0,0.55,1.3,0.55,0.35);wheel(0,0.55,-1.2,0.55,0.4);
      M(child(R,0,0.95,0.05,-0.12,0,0,0.45,0.5,2.1),R0);M(child(R,0,1.25,-0.45,0,0,0,0.5,0.2,1.0),D0);M(child(R,0,1.35,0.85,-0.5,0,0,0.5,0.55,0.5),R0);
      M(child(R,0,1.6,1.05,0,0,0,1.0,0.08,0.08),D0);glow(child(R,0,1.2,1.5,0,0,0,0.2,0.16,0.1),0.95);glow(child(R,0,0.9,-1.7,0,0,0,0.25,0.2,0.1),0.6);}
    else if(id==='aCar'){for(const sd of [-1,1]){wheel(sd*1.05,0.5,1.55,0.5,0.4);wheel(sd*1.05,0.5,-1.45,0.5,0.4);}
      M(child(R,0,0.7,0,0,0,0,2.1,0.55,4.7),R0);M(child(R,0,1.1,-0.35,0,0,0,1.5,0.5,1.8),[.08,.1,.14,1]);M(child(R,0,0.98,0.9,-0.15,0,0,1.8,0.1,1.4),R0);
      M(child(R,0,0.72,0,0,0,0,2.14,0.12,3.6),G0);M(child(R,0,1.35,-2.2,0,0,0,2.2,0.1,0.5),D0);
      for(const sd of [-1,1]){glow(child(R,sd*0.75,0.8,2.36,0,0,0,0.25,0.15,0.1),0.95);queue(MESH.glowSphere,child(R,sd*0.75,0.8,-2.36,0,0,0,0.22,0.12,0.08),[1,.15,.1,0.9],F_ADD);}}
    else{ // tank: treads, hull and a turret that turns toward your aim
      for(const sd of [-1,1]){M(child(R,sd*1.6,0.7,0,0,0,0,0.9,1.3,5.6),D0);for(let i=0;i<5;i++)M(child(R,sd*1.62,0.55,-2.2+i*1.1,spin*0.3,0,0,0.95,0.7,0.7),[.3,.3,.32,1]);}
      M(child(R,0,1.55,0,0,0,0,2.9,0.9,5.2),R0);M(child(R,0,1.56,0,0,0,0,3.0,0.14,4.4),G0);
      const ty=isPlayer?Math.atan2(camF.x,camF.z)-yaw:0,T=child(R,0,2.25,-0.3,0,ty,0);M(child(T,0,0.25,0,0,0,0,2.2,0.8,2.4),R0);
      const recoil=K&&time-(K.kick||-9)<0.2?-0.6:0,pt=isPlayer?-P.pitch*0.5:0;M(child(T,0,0.25,2.3+recoil,pt,0,0,0.35,0.35,3.4),D0);M(child(T,0,0.25,4.0+recoil,pt,0,0,0.5,0.5,0.35),G0);
      M(child(T,0.9,0.6,0.9,0,0,0,0.2,0.2,1.2),D0);glow(child(T,0,0.35,-1.0,0,0,0,0.3,0.3,0.1),0.7);}
    return;}
}
