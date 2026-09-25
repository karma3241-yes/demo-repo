// ================================================================
// Config: every balance number lives here
// ================================================================
const CONFIG={
  progression:{spPerLevel:3,startSP:3,levelCap:100,xpToNext:l=>Math.floor(100*Math.pow(l,1.5)),dmgXp:0.2,
    orbs:{yellow:25,blue:50,red:100},orbRespawn:[30,60],orbRadius:1.5},
  picks:{movement:2,abilities:3},
  powerMax:10,powerUpgradeCost:lvl=>lvl+1,passiveMax:50,passiveCost:1,
  energy:{base:100,perLevel:5,regen:8,regenBonus:0.02,delay:1.5,togglesBlockRegen:false},
  health:{base:100,perLevel:10,baseRegen:0,healPerLevel:0.4,healDelay:4,respawn:5},
  move:{run:14,sprint:21,gravity:68,jump:30,superJump:95},
  punch:{damage:10,range:3.4,cooldown:0.3,knock:11,comboMul:1.6},
  autosave:30,
  drive:{maxSpeed:42,accel:16,brake:34,reverse:12,steer:1.7,grip:6},
  traffic:{cars:95,police:4,follow:9,stopLine:13},
  rechoiceCooldown:600,
  destruction:{propRespawn:120,windowLife:150},
};
// [min,max] pairs are the values at power level 1 and 10
const POWERS={
  flight:{name:'Flight',cat:'movement',type:'toggle',key:'F',desc:'Fly anywhere. Space climbs, C dives, Shift boosts.',speed:[40,90],drain:[4,2],boost:2.6},
  superSpeed:{name:'Super Speed',cat:'movement',type:'hold',key:'Shift',desc:'Hold Shift to run at blinding speed and bowl people over.',mult:[2,5],drain:[5,2],hitDmg:[6,20]},
  wallClimb:{name:'Wall-Climb',cat:'movement',type:'passive',key:'Auto',desc:'Run into a wall to grab it. W and S climb, A and D move sideways, Space leaps off.',speed:[8,20]},
  webSwing:{name:'Web-Swinging',cat:'movement',type:'hold',key:'Right click',desc:'Hold right click to shoot a web at a building and swing. Hit a person to snare them.',range:[40,100],force:[1,2],energy:5,stun:[1.2,3]},
  fireball:{name:'Fireball',cat:'offence',type:'projectile',desc:'Hurl a fireball that explodes and sets targets on fire.',energy:15,cooldown:2,damage:[25,120],radius:[3,7],speed:45,burnDps:[5,14],burnTime:3},
  iceCloud:{name:'Ice Cloud',cat:'offence',type:'channel',desc:'Hold to summon a freezing cloud where you aim. Slows and hurts everything inside.',energyPerSec:10,slow:[0.3,0.7],dps:[8,40],radius:[6,9],range:45},
  lightning:{name:'Lightning Bolt',cat:'offence',type:'instant',desc:'Call a bolt from the sky onto your target. Huge burst damage and a stun.',energy:20,cooldown:4,damage:[40,180],stun:[0.3,1],radius:[3,5],range:140},
  energyBlast:{name:'Energy Blast',cat:'offence',type:'projectile',desc:'A fast energy orb that knocks targets back. Your everyday ranged attack.',energy:8,cooldown:0.8,damage:[15,80],speed:95,knock:[10,26]},
  laserVision:{name:'Laser Vision',cat:'offence',type:'channel',desc:'Hold to fire a beam from your eyes. It scorches whatever it touches.',energyPerSec:15,dps:[20,110],range:[60,120]},
  telekinesis:{name:'Telekinesis',cat:'offence',type:'hold',desc:'Hold to lift a person, drone or car with your mind. Let go to throw it.',energy:10,energyPerSec:4,range:[20,50],throwDmg:[20,100]},
  shockwave:{name:'Shockwave',cat:'offence',type:'instant',desc:'Blast everything around you away. Use it in mid-air to slam into the ground.',energy:30,cooldown:1,damage:[40,160],radius:[18,40]},
  metalSkin:{name:'Metal Skin',cat:'defence',type:'toggle',desc:'Turn your skin to steel. You take far less damage but move slower.',drain:3,dr:[0.3,0.7],slow:[0.3,0.1]},
  energyShield:{name:'Energy Shield',cat:'defence',type:'toggle',desc:'Raise a bubble that soaks up damage until it breaks.',energy:25,absorb:[50,400],cooldown:15},
  morphBand:{name:'Morph Band',cat:'special',type:'special',key:'V',desc:'An alien wrist device. Transform into one of six alien forms, each with its own body and powers. Upgrades unlock more aliens and longer transformations.',duration:[45,150],recharge:[40,12],power:[1,2]},
};
const MOVEMENT_POWERS=Object.keys(POWERS).filter(k=>POWERS[k].cat==='movement');
const ABILITY_POWERS=Object.keys(POWERS).filter(k=>POWERS[k].cat!=='movement');
const PASSIVES={
  strength:{name:'Strength',desc:'+2% punch damage and +1% throw damage per level'},
  vitality:{name:'Vitality',desc:'+10 max health per level'},
  healing:{name:'Healing',desc:'+0.4 health per second, after 4 s without taking damage'},
  energy:{name:'Energy',desc:'+5 max energy and +2% energy recharge per level'},
};
const NPCS={
  civilian:{hp:50,xp:20,rep:-15,walk:1.5,run:7},
  thug:{hp:80,xp:40,rep:10,walk:1.6,run:6.5,melee:7,gun:5,sight:32,range:22},
  boss:{hp:400,xp:200,rep:50,walk:1.5,run:6,melee:14,gun:7,sight:40,range:26,blast:18},
  police:{hp:100,xp:30,rep:-20,walk:1.6,run:7,melee:8,gun:6,sight:40,range:24},
  drone:{hp:60,xp:40,rep:10,shot:7},
  rival:{hp:180,hpPerLvl:30,xp:100,xpPerLvl:10,rep:25,blast:10,blastPerLvl:1.5},
  ship:{hp:2200,xp:500,rep:100},mech:{hp:3000,xp:500,rep:100},
  car:{hp:60},van:{hp:170},truck:{hp:420},shop:{hp:60,xp:30,rep:-10,reopen:90},atm:{hp:40,xp:20,rep:-8,reopen:90},
};
const REP={min:-10000,max:10000,heroAt:100,villainAt:-100,civHit:-1,bounty:-1500,
  heroTiers:[[100,'Rookie'],[500,'Vigilante'],[1500,'Protector'],[4000,'Guardian'],[8000,'Legend']],
  villainTiers:[[-100,'Troublemaker'],[-500,'Outlaw'],[-1500,'Menace'],[-4000,'Supervillain'],[-8000,'Nemesis']]};
const CRIMES={maxActive:3,spawnGap:[14,32],minDist:90,maxDist:420,clearXp:100,clearRep:10,
  population:{civilians:40,police:5,gangs:3},despawn:175,heistFirst:240,heistGap:[360,540],heistMinLevel:3,rivalGap:[110,170]};

// ================================================================
// Core: event bus, save, settings, stats
// ================================================================
const Bus={h:{},on(e,f){(this.h[e]||(this.h[e]=[])).push(f);},emit(e,d){const l=this.h[e];if(l)for(const f of l)f(d);}};
const SAVE_KEY='skyline-guardian-save',SAVE_VERSION=1;
const DEFAULT_SETTINGS={controls:'auto',autoLock:true,sens:1,invertY:false,volume:0.7,shadows:!IS_TOUCH_DEVICE};
const SUIT_OPTS=['#1f3f9e','#17181f','#0f6b5a','#5b1f9a','#9aa3b0','#a3122a'];
const CAPE_OPTS=['#c8102e','#ffc93c','#1fb8d6','#eeeeee','#17181f','#ff4f9a'];
const ACC_OPTS=['#ffc93c','#4fd8ff','#ff3d5e','#e9f3ff','#39ff88'];
function cleanName(s){return String(s).replace(/[^\p{L}\p{N} _.'-]/gu,'').replace(/\s+/g,' ').trim().slice(0,16);}
function freshPassives(){const o={};for(const k in PASSIVES)o[k]=0;return o;}
function freshSave(){return {version:SAVE_VERSION,character:null,level:1,xp:0,sp:CONFIG.progression.startSP,powerLevels:{},passives:freshPassives(),reputation:0,rechoiceAt:0,guide:{},
  settings:Object.assign({},DEFAULT_SETTINGS),stats:{defeated:0,crimesStopped:0,crimesCommitted:0}};}
function validCharacter(c){
  if(!c||typeof c!=='object')return null;
  const mv=Array.isArray(c.movement)?[...new Set(c.movement.filter(id=>MOVEMENT_POWERS.includes(id)))]:[];
  const ab=Array.isArray(c.abilities)?[...new Set(c.abilities.filter(id=>ABILITY_POWERS.includes(id)))]:[];
  if(mv.length!==CONFIG.picks.movement||ab.length!==CONFIG.picks.abilities)return null;
  const n=(v,max)=>Number.isInteger(v)&&v>=0&&v<max?v:0;
  return {name:(typeof c.name==='string'&&cleanName(c.name))||'Guardian',suit:n(c.suit,SUIT_OPTS.length),cape:n(c.cape,CAPE_OPTS.length),accent:n(c.accent,ACC_OPTS.length),capeOn:c.capeOn!==false,movement:mv,abilities:ab};
}
function loadSave(){
  let s=null;try{s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch(e){s=null;}
  const f=freshSave();if(!s||typeof s!=='object'||s.version!==SAVE_VERSION)return f;
  const num=(v,d,a,b)=>typeof v==='number'&&isFinite(v)?clamp(v,a,b):d;
  if(s.settings&&typeof s.settings==='object'){const t=s.settings,st=f.settings;
    if(['auto','touch','kbm'].includes(t.controls))st.controls=t.controls;
    for(const k of ['autoLock','invertY','shadows'])if(typeof t[k]==='boolean')st[k]=t[k];
    st.sens=num(t.sens,1,0.3,3);st.volume=num(t.volume,0.7,0,1);}
  f.character=validCharacter(s.character);
  if(!f.character)return f;
  f.level=Math.floor(num(s.level,1,1,CONFIG.progression.levelCap));f.xp=num(s.xp,0,0,1e9);f.sp=Math.floor(num(s.sp,f.sp,0,1e5));
  f.reputation=Math.round(num(s.reputation,0,REP.min,REP.max));
  if(s.powerLevels&&typeof s.powerLevels==='object')for(const k in POWERS){const v=s.powerLevels[k];if(typeof v==='number'&&isFinite(v))f.powerLevels[k]=Math.floor(clamp(v,1,CONFIG.powerMax));}
  if(s.passives&&typeof s.passives==='object')for(const k in PASSIVES)f.passives[k]=Math.floor(num(s.passives[k],0,0,CONFIG.passiveMax));
  if(s.stats&&typeof s.stats==='object')for(const k in f.stats)f.stats[k]=Math.floor(num(s.stats[k],0,0,1e9));
  f.rechoiceAt=num(s.rechoiceAt,0,0,1e15);
  if(s.guide&&typeof s.guide==='object')for(const k of ['move','punch','ability','skills','crime','done'])if(s.guide[k]===true)f.guide[k]=true;
  return f;
}
const save=loadSave();
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch(e){}}
const touchOn=()=>save.settings.controls==='touch'||(save.settings.controls==='auto'&&IS_TOUCH_DEVICE);

const pv=k=>save.passives[k]|0;
const maxHp=()=>(CONFIG.health.base+CONFIG.health.perLevel*pv('vitality'))*(P.alien?ALIENS[P.alien.id].hp:1);
const maxEn=()=>CONFIG.energy.base+CONFIG.energy.perLevel*pv('energy');
const enRegen=()=>CONFIG.energy.regen*(1+CONFIG.energy.regenBonus*pv('energy'));
const hpRegen=()=>CONFIG.health.baseRegen+CONFIG.health.healPerLevel*pv('healing');
const strengthMul=()=>1+0.02*pv('strength');
const throwMul=()=>1+0.01*pv('strength');
const hasPower=id=>!!save.character&&(save.character.movement.includes(id)||save.character.abilities.includes(id));
const powerLevel=id=>clamp(save.powerLevels[id]|0||1,1,CONFIG.powerMax);
function pstat(id,name,lvl){const v=POWERS[id][name];if(Array.isArray(v))return lerp(v[0],v[1],((lvl||powerLevel(id))-1)/(CONFIG.powerMax-1));return v;}
function faction(rep){return rep>=REP.heroAt?'hero':rep<=REP.villainAt?'villain':'neutral';}
const playerFaction=()=>faction(save.reputation);
function repTier(r){
  if(r>=REP.heroAt){let n='Rookie';for(const [t,nm] of REP.heroTiers)if(r>=t)n=nm;return {faction:'hero',name:n};}
  if(r<=REP.villainAt){let n='Troublemaker';for(const [t,nm] of REP.villainTiers)if(r<=t)n=nm;return {faction:'villain',name:n};}
  return {faction:'neutral',name:'Unknown'};
}
const hasBounty=()=>save.reputation<=REP.bounty;
const FACTION_COL={hero:'#5aa9ff',villain:'#ff4d5e',neutral:'#e9f3ff'};
