// ================================================================
// Math helpers
// ================================================================
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const damp=(k,dt)=>1-Math.exp(-k*dt);
const angLerp=(a,b,t)=>{const d=((b-a+Math.PI)%TAU+TAU)%TAU-Math.PI;return a+d*t;};
const rr=(a,b)=>a+Math.random()*(b-a);
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const srand=mulberry32(90125);
const sr=(a,b)=>a+srand()*(b-a);
function hex(h,k=1){const n=parseInt(h.slice(1),16);return[((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255].map(c=>Math.pow(c,2.2)*k);}

class V3{
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}
  addS(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}
  mul(s){this.x*=s;this.y*=s;this.z*=s;return this;}
  len(){return Math.hypot(this.x,this.y,this.z);}
}

const M4={
  create(){const m=new Float32Array(16);m[0]=m[5]=m[10]=m[15]=1;return m;},
  _t:new Float32Array(16),
  mul(o,a,b){const t=M4._t;
    for(let c=0;c<4;c++)for(let r=0;r<4;r++){t[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];}
    o.set(t);return o;},
  // T * Ry * Rx * Rz * S
  compose(o,tx,ty,tz,rx,ry,rz,sx,sy,sz){
    const cx=Math.cos(rx),sX=Math.sin(rx),cy=Math.cos(ry),sY=Math.sin(ry),cz=Math.cos(rz),sZ=Math.sin(rz);
    o[0]=(cy*cz+sY*sX*sZ)*sx; o[1]=(cx*sZ)*sx; o[2]=(-sY*cz+cy*sX*sZ)*sx; o[3]=0;
    o[4]=(-cy*sZ+sY*sX*cz)*sy; o[5]=(cx*cz)*sy; o[6]=(sY*sZ+cy*sX*cz)*sy; o[7]=0;
    o[8]=(sY*cx)*sz; o[9]=(-sX)*sz; o[10]=(cy*cx)*sz; o[11]=0;
    o[12]=tx;o[13]=ty;o[14]=tz;o[15]=1;return o;},
  perspective(o,fovy,asp,n,f){const t=1/Math.tan(fovy/2);o.fill(0);o[0]=t/asp;o[5]=t;o[10]=(f+n)/(n-f);o[11]=-1;o[14]=2*f*n/(n-f);return o;},
  ortho(o,l,r,b,t,n,f){o.fill(0);o[0]=2/(r-l);o[5]=2/(t-b);o[10]=-2/(f-n);o[12]=-(r+l)/(r-l);o[13]=-(t+b)/(t-b);o[14]=-(f+n)/(f-n);o[15]=1;return o;},
  lookAt(o,ex,ey,ez,cx,cy,cz,ux,uy,uz){
    let zx=ex-cx,zy=ey-cy,zz=ez-cz;let l=Math.hypot(zx,zy,zz)||1;zx/=l;zy/=l;zz/=l;
    let xx=uy*zz-uz*zy,xy=uz*zx-ux*zz,xz=ux*zy-uy*zx;l=Math.hypot(xx,xy,xz)||1;xx/=l;xy/=l;xz/=l;
    const yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
    o[0]=xx;o[1]=yx;o[2]=zx;o[3]=0;o[4]=xy;o[5]=yy;o[6]=zy;o[7]=0;o[8]=xz;o[9]=yz;o[10]=zz;o[11]=0;
    o[12]=-(xx*ex+xy*ey+xz*ez);o[13]=-(yx*ex+yy*ey+yz*ez);o[14]=-(zx*ex+zy*ey+zz*ez);o[15]=1;return o;},
  // world transform whose local +Z runs from a to b (length |ab|), width w on X/Y
  beam(o,ax,ay,az,bx,by,bz,w){
    let zx=bx-ax,zy=by-ay,zz=bz-az;const L=Math.hypot(zx,zy,zz)||1e-3;zx/=L;zy/=L;zz/=L;
    let xx=zz,xz=-zx,l=Math.hypot(xx,xz);if(l<1e-4){xx=1;xz=0;l=1;}xx/=l;xz/=l;
    const yx=zy*xz,yy=zz*xx-zx*xz,yz=-zy*xx;
    o[0]=xx*w;o[1]=0;o[2]=xz*w;o[3]=0;o[4]=yx*w;o[5]=yy*w;o[6]=yz*w;o[7]=0;
    o[8]=zx*L;o[9]=zy*L;o[10]=zz*L;o[11]=0;o[12]=(ax+bx)/2;o[13]=(ay+by)/2;o[14]=(az+bz)/2;o[15]=1;return o;},
  // local +Y aligned to direction d, uniform scale s
  alignY(o,x,y,z,dx,dy,dz,s){
    let l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;
    let ax=0,ay=1,az=0;if(Math.abs(dy)>0.9){ax=1;ay=0;}
    let xx=ay*dz-az*dy,xy=az*dx-ax*dz,xz=ax*dy-ay*dx;l=Math.hypot(xx,xy,xz)||1;xx/=l;xy/=l;xz/=l;
    const zx=xy*dz-xz*dy,zy=xz*dx-xx*dz,zz=xx*dy-xy*dx;
    o[0]=xx*s;o[1]=xy*s;o[2]=xz*s;o[3]=0;o[4]=dx*s;o[5]=dy*s;o[6]=dz*s;o[7]=0;
    o[8]=zx*s;o[9]=zy*s;o[10]=zz*s;o[11]=0;o[12]=x;o[13]=y;o[14]=z;o[15]=1;return o;}
};

// ================================================================
// WebGL setup
// ================================================================
const canvas=document.getElementById('gl');
let gl=null;
try{gl=canvas.getContext('webgl2',{antialias:true,powerPreference:'high-performance'});}catch(e){gl=null;}
if(!gl){document.getElementById('nogl').hidden=false;document.getElementById('menu').hidden=true;return;}

const IS_TOUCH_DEVICE=(()=>{try{const coarse=matchMedia('(pointer: coarse)').matches,fine=matchMedia('(any-pointer: fine)').matches;return (coarse&&!fine)||(navigator.maxTouchPoints>0&&!fine);}catch(e){return false;}})();
let W=1,H=1,DPR=1;
function resize(){DPR=Math.min(window.devicePixelRatio||1,IS_TOUCH_DEVICE?1.25:1.75);W=Math.max(1,Math.floor(innerWidth*DPR));H=Math.max(1,Math.floor(innerHeight*DPR));canvas.width=W;canvas.height=H;}
addEventListener('resize',resize);resize();

function program(vs,fs){
  const p=gl.createProgram();
  for(const [type,src] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){
    const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));
    gl.attachShader(p,s);
  }
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
  const u={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
  for(let i=0;i<n;i++){const info=gl.getActiveUniform(p,i);u[info.name.replace('[0]','')]=gl.getUniformLocation(p,info.name);}
  return {p,u};
}

const GLSL_COMMON=`
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float h31(vec3 p){return h21(p.xy+p.z*17.13);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
vec3 aces(vec3 x){return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}
`;

const MAIN_VS=`#version 300 es
layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNor;layout(location=2) in vec3 aCol;layout(location=3) in vec2 aDat;
uniform mat4 uVP;uniform mat4 uM;uniform mat4 uLVP;
out vec3 vW;out vec3 vN;out vec3 vC;out vec2 vD;out vec4 vL;
void main(){vec4 w=uM*vec4(aPos,1.0);vW=w.xyz;vN=mat3(uM)*aNor;vC=aCol;vD=aDat;vL=uLVP*w;gl_Position=uVP*w;}`;

const MAIN_FS=`#version 300 es
precision highp float;precision highp sampler2DShadow;
in vec3 vW;in vec3 vN;in vec3 vC;in vec2 vD;in vec4 vL;
uniform vec4 uTint;uniform float uUnlit;uniform float uEmis;
uniform vec3 uLDir;uniform vec3 uLCol;uniform vec3 uSky;uniform vec3 uGnd;uniform vec3 uFogC;uniform vec2 uFog;
uniform vec3 uCam;uniform float uNight;uniform float uTime;uniform float uExpo;uniform float uShTexel;
uniform sampler2DShadow uShadow;uniform float uShOn;
uniform vec4 uPL[20];uniform vec3 uPLC[20];uniform float uPLn;
out vec4 o;
${GLSL_COMMON}
float shadowF(){if(uShOn<0.5)return 1.0;vec3 p=vL.xyz/vL.w*0.5+0.5;
  if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0||p.z>1.0)return 1.0;
  float s=0.0;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)s+=texture(uShadow,vec3(p.xy+vec2(float(x),float(y))*uShTexel,p.z-0.0004));
  return s/9.0;}
vec3 outc(vec3 c){return pow(aces(c*uExpo),vec3(1.0/2.2));}
void main(){
  vec3 n=normalize(vN);float mat=vD.x;vec3 base=vC*uTint.rgb;vec3 emis=vec3(0.0);float spec=0.2;float shin=40.0;
  if(mat>5.5&&mat<6.5){o=vec4(outc(vC*uTint.rgb*1.6),uTint.a);return;}
  if(mat>0.5&&mat<1.5){
    if(abs(n.y)<0.5){
      float st=floor(vD.y/1000.0),sd=mod(vD.y,1000.0);
      float u=abs(n.x)>0.5?vW.z:vW.x;float v=vW.y;
      float ww=0.5+fract(sd*0.37)*0.36;vec2 sz=vec2(3.0+fract(sd*0.71)*1.8,4.0);float wy0=0.2,wy1=0.84,gl=0.45;
      if(st>0.5&&st<1.5){ww=0.93;sz=vec2(2.4,4.0);wy0=0.05;wy1=0.97;gl=0.8;}
      else if(st>1.5&&st<2.5){ww=0.42;sz=vec2(3.4,3.6);base*=0.92+0.1*step(0.5,fract(v*2.8+floor(u*1.25)*0.5))-0.14*step(0.86,fract(v*2.8));}
      else if(st>2.5&&st<3.5){ww=0.84;sz=vec2(6.0,9.0);wy0=0.7;wy1=0.9;}
      else if(st>3.5){ww=0.4;sz=vec2(3.2,3.3);}
      vec2 c=floor(vec2(u,v)/sz);vec2 f=fract(vec2(u,v)/sz);
      float win=step(0.5-ww*0.5,f.x)*step(f.x,0.5+ww*0.5)*step(wy0,f.y)*step(f.y,wy1)*step(st>3.5?1.2:4.0,v);
      if(st>0.5&&st<1.5)base=mix(base,base*0.55,step(0.9,fract(v/4.0)));
      float h=h31(vec3(c,floor(sd)+n.x*3.1+n.z*7.7));
      vec3 glass=vec3(0.02,0.035,0.06)+uSky*gl;
      base=mix(base,glass,win);spec=mix(0.12,st>0.5&&st<1.5?1.7:1.1,win);shin=mix(30.0,90.0,win);
      float lit=step(st>2.5&&st<3.5?0.8:0.64,h)*win;
      emis=lit*mix(vec3(1.0,0.7,0.36),vec3(0.55,0.8,1.0),step(0.9,h))*(0.02+1.05*uNight)*(0.45+0.75*fract(h*13.0));
    }
  }else if(mat>1.5&&mat<2.5){emis=vC*(0.04+3.5*uNight);base*=0.5;}
  else if(mat>2.5&&mat<3.5){
    vec2 p=vW.xz;vec2 c=mod(p,80.0);vec2 d=min(c,80.0-c);
    base=vec3(0.03,0.032,0.037)*(0.8+0.4*vnoise(p*0.35));
    float lz=step(d.x,0.22)*step(10.5,d.y)*step(fract(p.y/7.0),0.55);
    float lx=step(d.y,0.22)*step(10.5,d.x)*step(fract(p.x/7.0),0.55);
    base=mix(base,vec3(0.7,0.5,0.06),max(lz,lx));
    float cz=step(d.x,9.0)*step(11.0,d.y)*step(d.y,14.0)*step(fract(p.x/1.6),0.5);
    float cx=step(d.y,9.0)*step(11.0,d.x)*step(d.x,14.0)*step(fract(p.y/1.6),0.5);
    base=mix(base,vec3(0.5),max(cz,cx));
    spec=0.08;
  }else if(mat>3.5&&mat<4.5){
    vec2 p=vW.xz;float t=uTime;
    n=normalize(vec3(sin(p.x*0.09+t*0.9)*0.04+(vnoise(p*0.3+t*0.5)-0.5)*0.12,1.0,cos(p.y*0.08+t*0.7)*0.04+(vnoise(p*0.27-t*0.4)-0.5)*0.12));
    vec3 V=normalize(uCam-vW);float fr=pow(1.0-max(dot(n,V),0.0),4.0);
    base=mix(vec3(0.004,0.02,0.035),uFogC*0.9,0.15+0.85*fr);spec=2.5;shin=220.0;
  }else if(mat>4.5&&mat<5.5){base*=0.7+0.6*vnoise(vW.xz*0.4);spec=0.04;}
  if(mat>6.5){vec3 V0=normalize(uCam-vW);float fr=pow(1.0-max(dot(n,V0),0.0),3.0);base=mix(base*0.5,uSky*1.3+vec3(0.1),0.2+0.55*fr);spec=1.8;shin=70.0;}
  float d=length(uCam-vW);float fog=smoothstep(uFog.x,uFog.y,d);
  if(uUnlit>0.5){o=vec4(outc(mix(base+emis,uFogC,fog*0.6)),uTint.a);return;}
  float sh=shadowF();
  float diff=max(dot(n,uLDir),0.0);
  vec3 amb=mix(uGnd,uSky,n.y*0.5+0.5);
  vec3 V=normalize(uCam-vW);vec3 Hh=normalize(V+uLDir);
  vec3 col=base*(amb+uLCol*diff*sh)+emis+base*uEmis*4.0;
  col+=uLCol*pow(max(dot(n,Hh),0.0),shin)*spec*sh;
  // street lamps and headlights (nearest few, sent every frame at night)
  vec3 pl=vec3(0.0),pls=vec3(0.0);
  for(int i=0;i<20;i++){if(float(i)>=uPLn)break;vec3 L=uPL[i].xyz-vW;float dl=length(L);float r=uPL[i].w;if(dl>=r)continue;
    float a=1.0-dl/r;a*=a;vec3 Ln=L/dl;float nl=max(dot(n,Ln),0.0);pl+=uPLC[i]*a*(0.25+0.75*nl);
    pls+=uPLC[i]*a*pow(max(dot(n,normalize(Ln+V)),0.0),shin)*spec*0.5;}
  col+=base*pl*3.2+pl*0.018+pls*0.6;
  o=vec4(outc(mix(col,uFogC,fog)),uTint.a);
}`;

const DEPTH_VS=`#version 300 es
layout(location=0) in vec3 aPos;uniform mat4 uLVP;uniform mat4 uM;
void main(){gl_Position=uLVP*uM*vec4(aPos,1.0);}`;
const DEPTH_FS=`#version 300 es
precision mediump float;void main(){}`;

const SKY_VS=`#version 300 es
out vec2 vP;void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2))*2.0-1.0;vP=p;gl_Position=vec4(p,0.9999,1.0);}`;
const SKY_FS=`#version 300 es
precision highp float;in vec2 vP;out vec4 o;
uniform vec3 uFwd;uniform vec3 uRight;uniform vec3 uUp;uniform vec2 uTan;uniform vec3 uSunDir;uniform vec3 uZen;uniform vec3 uHor;uniform vec3 uSunCol;
uniform float uNight;uniform float uTime;uniform float uExpo;uniform float uSpace;
${GLSL_COMMON}
float fbm(vec2 p){float s=0.0,a=0.5;for(int i=0;i<5;i++){s+=a*vnoise(p);p=p*2.03+vec2(1.7,9.2);a*=0.5;}return s;}
void main(){
  vec3 d=normalize(uFwd+vP.x*uTan.x*uRight+vP.y*uTan.y*uUp);
  float h=d.y;
  vec3 col=mix(uHor,uZen,pow(clamp(h,0.0,1.0),0.5));
  if(h<0.0)col=mix(uHor,uHor*0.55,clamp(-h*5.0,0.0,1.0));
  float sd=max(dot(d,uSunDir),0.0);
  col+=uSunCol*(smoothstep(0.9994,0.9997,sd)*6.0+pow(sd,10.0)*0.12)*step(-0.1,uSunDir.y);
  float md=max(dot(d,-uSunDir),0.0);
  col+=vec3(0.75,0.8,1.0)*(smoothstep(0.99955,0.9998,md)*1.6+pow(md,80.0)*0.08)*uNight;
  if(h>0.0){
    vec3 q=d*260.0;vec3 ip=floor(q);float s=h31(ip);
    float star=step(0.9972,s)*smoothstep(0.42,0.0,length(fract(q)-0.5))*uNight*smoothstep(0.0,0.2,h);
    col+=vec3(star)*(0.5+0.9*fract(s*97.0))*(0.75+0.25*sin(uTime*3.0+s*50.0));
    vec2 uv=d.xz/(h+0.12)*1.6+vec2(uTime*0.012,uTime*0.004);
    float cl=smoothstep(0.5,0.82,fbm(uv))*smoothstep(0.0,0.25,h);
    vec3 cc=uHor*0.85+uSunCol*0.05+vec3(0.5)*(1.0-uNight);
    col=mix(col,cc*(1.0-0.25*cl),cl*0.8);
  }
  if(uSpace>0.0){ // above the atmosphere: black sky, lots of stars, a bright sun
    vec3 q2=d*300.0;vec3 ip2=floor(q2);float s2=h31(ip2);float st2=step(0.9955,s2)*smoothstep(0.45,0.0,length(fract(q2)-0.5));
    vec3 spc=vec3(st2)*(0.4+1.2*fract(s2*97.0)); // the Sun itself is drawn as a body out there
    col=mix(col,spc,uSpace);}
  o=vec4(pow(aces(col*uExpo),vec3(1.0/2.2)),1.0);
}`;

const PART_VS=`#version 300 es
layout(location=0) in vec3 aPos;layout(location=1) in vec4 aCol;layout(location=2) in float aSize;
uniform mat4 uVP;uniform float uScale;out vec4 vC;
void main(){vec4 c=uVP*vec4(aPos,1.0);gl_Position=c;gl_PointSize=clamp(aSize*uScale/max(c.w,0.1),1.0,200.0);vC=aCol;}`;
const PART_FS=`#version 300 es
precision mediump float;in vec4 vC;out vec4 o;uniform float uAdd;uniform float uLight;
void main(){float d=length(gl_PointCoord-0.5)*2.0;float a=clamp(1.0-d,0.0,1.0);a*=a;if(uAdd>0.5)o=vec4(vC.rgb*a*vC.a,1.0);else o=vec4(vC.rgb*uLight,a*vC.a);}`;

const MAIN=program(MAIN_VS,MAIN_FS);
const DEPTH=program(DEPTH_VS,DEPTH_FS);
const SKY=program(SKY_VS,SKY_FS);
const PART=program(PART_VS,PART_FS);
const skyVao=gl.createVertexArray();

// Shadow map
const SHADOW=IS_TOUCH_DEVICE?1024:2048;
const shTex=gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D,shTex);
gl.texStorage2D(gl.TEXTURE_2D,1,gl.DEPTH_COMPONENT24,SHADOW,SHADOW);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
const shFbo=gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER,shFbo);
gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shTex,0);
gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
gl.bindFramebuffer(gl.FRAMEBUFFER,null);

// ================================================================
// Geometry
// ================================================================
function primBox(){
  const pos=[],nor=[],idx=[];
  const F=[
    [[1,0,0],[[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5]]],
    [[-1,0,0],[[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]]],
    [[0,1,0],[[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]]],
    [[0,-1,0],[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]]],
    [[0,0,1],[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]],
    [[0,0,-1],[[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]]];
  for(const [n,cs] of F){const b=pos.length/3;for(const c of cs){pos.push(...c);nor.push(...n);}idx.push(b,b+1,b+2,b,b+2,b+3);}
  return {pos,nor,idx};
}
function primSphere(ws=20,hs=14){
  const pos=[],nor=[],idx=[];
  for(let j=0;j<=hs;j++){const th=j/hs*Math.PI;for(let i=0;i<=ws;i++){const ph=i/ws*TAU;
    const x=-Math.cos(ph)*Math.sin(th),y=Math.cos(th),z=Math.sin(ph)*Math.sin(th);pos.push(x,y,z);nor.push(x,y,z);}}
  for(let j=0;j<hs;j++)for(let i=0;i<ws;i++){const a=j*(ws+1)+i,b=a+ws+1;
    if(j!==0)idx.push(a+1,a,b+1);if(j!==hs-1)idx.push(a,b,b+1);}
  return {pos,nor,idx};
}
function primCyl(seg=18,rt=1,rb=1,caps=true){
  const pos=[],nor=[],idx=[];const sl=rb-rt;
  for(let i=0;i<=seg;i++){const a=i/seg*TAU,x=Math.sin(a),z=Math.cos(a);const l=Math.hypot(1,sl);
    pos.push(x*rt,.5,z*rt,x*rb,-.5,z*rb);nor.push(x/l,sl/l,z/l,x/l,sl/l,z/l);}
  for(let i=0;i<seg;i++){const t0=i*2,b0=t0+1,t1=t0+2,b1=t0+3;idx.push(t0,b0,b1,t0,b1,t1);}
  if(caps){
    for(const [y,ny,r] of [[.5,1,rt],[-.5,-1,rb]]){
      const c=pos.length/3;pos.push(0,y,0);nor.push(0,ny,0);
      for(let i=0;i<=seg;i++){const a=i/seg*TAU;pos.push(Math.sin(a)*r,y,Math.cos(a)*r);nor.push(0,ny,0);}
      for(let i=0;i<seg;i++){if(ny>0)idx.push(c,c+1+i,c+2+i);else idx.push(c,c+2+i,c+1+i);}
    }
  }
  return {pos,nor,idx};
}
function primTorus(R=1,r=0.1,seg=36,ts=8){
  const pos=[],nor=[],idx=[];
  for(let j=0;j<=seg;j++){const u=j/seg*TAU,cx=Math.cos(u),cz=Math.sin(u);
    for(let i=0;i<=ts;i++){const v=i/ts*TAU,cv=Math.cos(v),sv=Math.sin(v);
      pos.push((R+r*cv)*cx,r*sv,(R+r*cv)*cz);nor.push(cv*cx,sv,cv*cz);}}
  for(let j=0;j<seg;j++)for(let i=0;i<ts;i++){const a=j*(ts+1)+i,b=a+ts+1;idx.push(a,a+1,b,a+1,b+1,b);}
  return {pos,nor,idx};
}
function primRing(inner=0.84,seg=56){
  const pos=[],nor=[],idx=[];
  for(let i=0;i<=seg;i++){const a=i/seg*TAU,c=Math.cos(a),s=Math.sin(a);pos.push(c*inner,0,s*inner,c,0,s);nor.push(0,1,0,0,1,0);}
  for(let i=0;i<seg;i++){const b=i*2;idx.push(b,b+2,b+1,b+1,b+2,b+3);}
  return {pos,nor,idx};
}
function primQuad(){return {pos:[-.5,0,.5,.5,0,.5,.5,0,-.5,-.5,0,-.5],nor:[0,1,0,0,1,0,0,1,0,0,1,0],idx:[0,1,2,0,2,3]};}
function primPrism(pts){
  const pos=[],nor=[],idx=[];
  const tri=(a,b,c,n)=>{const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    const cx=ab[1]*ac[2]-ab[2]*ac[1],cy=ab[2]*ac[0]-ab[0]*ac[2],cz=ab[0]*ac[1]-ab[1]*ac[0];
    const k=pos.length/3;for(const v of (cx*n[0]+cy*n[1]+cz*n[2]<0?[a,c,b]:[a,b,c])){pos.push(...v);nor.push(...n);}idx.push(k,k+1,k+2);};
  for(const sx of [.5,-.5])for(let i=1;i<pts.length-1;i++)tri([sx,pts[0][1],pts[0][0]],[sx,pts[i][1],pts[i][0]],[sx,pts[i+1][1],pts[i+1][0]],[Math.sign(sx),0,0]);
  let mz=0,my=0;for(const [z,y] of pts){mz+=z/pts.length;my+=y/pts.length;}
  for(let i=0;i<pts.length;i++){const [z0,y0]=pts[i],[z1,y1]=pts[(i+1)%pts.length];let nz=y1-y0,ny=-(z1-z0);const l=Math.hypot(nz,ny)||1;nz/=l;ny/=l;
    if(nz*((z0+z1)/2-mz)+ny*((y0+y1)/2-my)<0){nz=-nz;ny=-ny;}const n=[0,ny,nz];
    const a=[-.5,y0,z0],b=[.5,y0,z0],c=[.5,y1,z1],d=[-.5,y1,z1];tri(a,b,c,n);tri(a,c,d,n);}
  return {pos,nor,idx};
}
const PRIM={roof:primPrism([[-.5,-.5],[.5,-.5],[0,.5]]),ramp:primPrism([[-.5,-.5],[.5,-.5],[.5,.5]]),box:primBox(),sphere:primSphere(),lsphere:primSphere(10,8),lcyl:primCyl(8),psphere:primSphere(8,6),cone:primCyl(10,0.02,1,true),cyl:primCyl(14),torus:primTorus(1,0.09),ring:primRing(),quad:primQuad(),tube:primCyl(20,1,1,false)};

const TM=M4.create();
class Geo{
  constructor(){this.pos=[];this.nor=[];this.col=[];this.dat=[];this.idx=[];}
  add(p,M,color,mat=0,seed=0){
    const base=this.pos.length/3;
    for(let i=0;i<p.pos.length;i+=3){
      const x=p.pos[i],y=p.pos[i+1],z=p.pos[i+2];
      this.pos.push(M[0]*x+M[4]*y+M[8]*z+M[12],M[1]*x+M[5]*y+M[9]*z+M[13],M[2]*x+M[6]*y+M[10]*z+M[14]);
      const nx=p.nor[i],ny=p.nor[i+1],nz=p.nor[i+2];
      const tx=M[0]*nx+M[4]*ny+M[8]*nz,ty=M[1]*nx+M[5]*ny+M[9]*nz,tz=M[2]*nx+M[6]*ny+M[10]*nz;const l=Math.hypot(tx,ty,tz)||1;
      this.nor.push(tx/l,ty/l,tz/l);this.col.push(color[0],color[1],color[2]);this.dat.push(mat,seed);
    }
    for(const k of p.idx)this.idx.push(base+k);
    return this;
  }
  box(x0,y0,z0,x1,y1,z1,color,mat=0,seed=0){M4.compose(TM,(x0+x1)/2,(y0+y1)/2,(z0+z1)/2,0,0,0,x1-x0,y1-y0,z1-z0);return this.add(PRIM.box,TM,color,mat,seed);}
  prim(p,tx,ty,tz,rx,ry,rz,sx,sy,sz,color,mat=0){M4.compose(TM,tx,ty,tz,rx,ry,rz,sx,sy,sz);return this.add(p,TM,color,mat);}
  mesh(){return makeMesh(this);}
}
function makeMesh(g){
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);
  const bufs=[];const attr=(loc,data,size)=>{const b=gl.createBuffer();bufs.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);};
  attr(0,g.pos,3);attr(1,g.nor,3);attr(2,g.col,3);attr(3,g.dat,2);
  const big=g.pos.length/3>65535;const ib=gl.createBuffer();bufs.push(ib);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,big?new Uint32Array(g.idx):new Uint16Array(g.idx),gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  return {vao,bufs,n:g.idx.length,type:big?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT};
}
function freeMesh(m){gl.deleteVertexArray(m.vao);for(const b of m.bufs)gl.deleteBuffer(b);
}
const primMesh=(p,mat=0)=>new Geo().add(p,M4.create(),[1,1,1],mat).mesh();

const MESH={
  box:primMesh(PRIM.box),sphere:primMesh(PRIM.sphere),
  glowBox:primMesh(PRIM.box,6),glowSphere:primMesh(PRIM.lsphere,6),
  ring:primMesh(PRIM.ring,6),tube:primMesh(PRIM.tube,6),mbox:primMesh(PRIM.box,7),msphere:primMesh(PRIM.sphere,7),disc:primMesh(primRing(0.0),0),
  cyl:primMesh(PRIM.cyl),cone:primMesh(PRIM.cone),roof:primMesh(PRIM.roof),glowCyl:primMesh(PRIM.cyl,6),mcyl:primMesh(PRIM.cyl,7)
};

// ================================================================
// Draw queue
// ================================================================
const F_SH=1,F_UN=2,F_ADD=4,F_BL=8;
const drawList=[];let dlN=0;
const matPool=[];let mpi=0;
function tmpM(){if(mpi>=matPool.length)matPool.push(new Float32Array(16));return matPool[mpi++];}
function queue(mesh,M,tint,flags=0,emis=0){let d=drawList[dlN];if(!d){d={};drawList[dlN]=d;}dlN++;d.mesh=mesh;d.M=M;d.tint=tint;d.flags=flags;d.emis=emis;}
function child(parent,tx,ty,tz,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1){M4.compose(TM,tx,ty,tz,rx,ry,rz,sx,sy,sz);return M4.mul(tmpM(),parent,TM);}
function at(tx,ty,tz,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1){return M4.compose(tmpM(),tx,ty,tz,rx,ry,rz,sx,sy,sz);}

// ================================================================
// Particles (additive sparks/fire and alpha-blended smoke)
// ================================================================
class PSys{
  constructor(max,additive,grow){
    this.max=max;this.add=additive;this.grow=grow;
    this.p=new Float32Array(max*3);this.v=new Float32Array(max*3);this.c=new Float32Array(max*3);
    this.l=new Float32Array(max);this.m=new Float32Array(max);this.s=new Float32Array(max);this.g=new Float32Array(max);this.dr=new Float32Array(max);
    this.buf=new Float32Array(max*8);this.head=0;this.count=0;
    this.vao=gl.createVertexArray();this.vbo=gl.createBuffer();
    gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.vbo);gl.bufferData(gl.ARRAY_BUFFER,this.buf.byteLength,gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,32,0);
    gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.FLOAT,false,32,12);
    gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,1,gl.FLOAT,false,32,28);
    gl.bindVertexArray(null);
  }
  emit(x,y,z,vx,vy,vz,life,c,size,grav=0,drag=0){
    const i=this.head;this.head=(i+1)%this.max;const i3=i*3;
    this.p[i3]=x;this.p[i3+1]=y;this.p[i3+2]=z;this.v[i3]=vx;this.v[i3+1]=vy;this.v[i3+2]=vz;
    this.c[i3]=c[0];this.c[i3+1]=c[1];this.c[i3+2]=c[2];this.l[i]=life;this.m[i]=life;this.s[i]=size;this.g[i]=grav;this.dr[i]=drag;
  }
  update(dt){
    let n=0;const Pp=this.p,V=this.v,B=this.buf;
    for(let i=0;i<this.max;i++){
      if(this.l[i]<=0)continue;this.l[i]-=dt;if(this.l[i]<=0)continue;const i3=i*3;
      const d=Math.max(0,1-this.dr[i]*dt);V[i3]*=d;V[i3+1]=V[i3+1]*d-this.g[i]*dt;V[i3+2]*=d;
      Pp[i3]+=V[i3]*dt;Pp[i3+1]+=V[i3+1]*dt;Pp[i3+2]+=V[i3+2]*dt;
      const k=this.l[i]/this.m[i],o=n*8;
      B[o]=Pp[i3];B[o+1]=Pp[i3+1];B[o+2]=Pp[i3+2];B[o+3]=this.c[i3];B[o+4]=this.c[i3+1];B[o+5]=this.c[i3+2];
      B[o+6]=this.grow?k*(2-k)*0.75:k;B[o+7]=this.s[i]*(this.grow?(0.5+1.6*(1-k)):(0.4+0.6*k));n++;
    }
    this.count=n;
  }
  draw(light){
    if(!this.count)return;gl.uniform1f(PART.u.uAdd,this.add?1:0);gl.uniform1f(PART.u.uLight,light);
    gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.vbo);gl.bufferSubData(gl.ARRAY_BUFFER,0,this.buf,0,this.count*8);gl.drawArrays(gl.POINTS,0,this.count);
  }
}
const FX=new PSys(IS_TOUCH_DEVICE?3500:6000,true,false),SMOKE=new PSys(IS_TOUCH_DEVICE?900:1800,false,true);
function emit(x,y,z,vx,vy,vz,life,c,size,grav=0,drag=0){FX.emit(x,y,z,vx,vy,vz,life,c,size,grav,drag);}
function smoke(x,y,z,n=1,spread=1,size=4,life=2.5,shade=0.25){
  for(let k=0;k<n;k++){const c=shade*rr(0.75,1.1);SMOKE.emit(x+rr(-spread,spread),y+rr(-spread*0.3,spread*0.3),z+rr(-spread,spread),rr(-1.5,1.5),rr(3,7),rr(-1.5,1.5),life*rr(0.7,1.2),[c,c,c*1.04],size*rr(0.7,1.3),-1.2,0.6);}
}
function burst(x,y,z,n,spd,life,cols,size,grav=0,drag=1){
  for(let k=0;k<n;k++){let dx=rr(-1,1),dy=rr(-1,1),dz=rr(-1,1);const l=Math.hypot(dx,dy,dz)||1;const s=spd*rr(0.25,1)/l;
    emit(x,y,z,dx*s,dy*s,dz*s,life*rr(0.5,1),cols[(Math.random()*cols.length)|0],size*rr(0.6,1.3),grav,drag);}
}
const GLASSC=[[.75,.9,1],[.9,.97,1],[.6,.8,.95]],WATER=[[.6,.8,1],[.85,.93,1]],LEAF=[[.25,.55,.2],[.35,.65,.25]];
const FIRE=[[1,.85,.4],[1,.55,.15],[1,.35,.08],[1,.95,.7]],SPARK=[[1,1,.8],[1,.8,.4]],CYAN=[[.3,.9,1],[.6,1,1],[.2,.6,1]],GOLD=[[1,.85,.3],[1,.95,.6]],DUST=[[.35,.33,.3],[.28,.27,.25]],RED=[[1,.2,.25],[1,.45,.3]];
// ================================================================
// Audio (all synthesized)
// ================================================================
const SFX={ctx:null,master:null,muted:false,volume:0.7,
  init(){
    if(this.ctx){this.ctx.resume&&this.ctx.resume();return;}
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
