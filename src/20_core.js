// ================================================================
// Config: every balance number lives here
// ================================================================
const CONFIG={
  progression:{spPerLevel:3,startSP:3,levelCap:100,xpToNext:l=>Math.floor(100*Math.pow(l,1.5)),dmgXp:0.2,
    orbs:{yellow:25,blue:50,red:100},orbRespawn:[30,60],orbRadius:1.5},
  picks:{movement:1,abilities:2,body:1},
  powerMax:10,powerUpgradeCost:lvl=>lvl+1,passiveMax:50,passiveCost:1,
  energy:{base:100,perLevel:5,regen:8,regenBonus:0.02,delay:1.5,togglesBlockRegen:false},
  health:{base:220,perLevel:14,baseRegen:2,healPerLevel:0.5,healDelay:3,respawn:5,npcTaken:0.5},
  move:{run:14,sprint:21,gravity:68,jump:30,superJump:95},
  punch:{damage:16,range:3.4,cooldown:0.3,knock:11,comboMul:1.6},
  autosave:30,
  drive:{maxSpeed:42,accel:16,brake:34,reverse:12,steer:1.7,grip:6},
  traffic:{cars:95,police:4,follow:11,stopLine:14},
  rechoiceCooldown:0, // seconds between power changes (off for now)
  destruction:{propRespawn:120,windowLife:150},
};
// [min,max] pairs are the values at power level 1 and 10
const POWERS={
  flight:{name:'Flight',cat:'movement',type:'toggle',key:'F',desc:'Fly anywhere. Space climbs, C dives, Shift boosts.',speed:[40,90],drain:[4,2],boost:2.6},
  superSpeed:{name:'Super Speed',cat:'movement',type:'hold',key:'Shift',desc:'Hold Shift to run at blinding speed and bowl people over.',mult:[2,5],drain:[5,2],hitDmg:[6,20]},
  wallClimb:{name:'Wall-Climb',cat:'movement',hidden:true,type:'passive',key:'Auto',desc:'Run into a wall to grab it. W and S climb, A and D move sideways, Space leaps off.',speed:[8,20]},
  webSwing:{name:'Web-Swinging',cat:'movement',type:'hold',key:'Right click',desc:'Hold right click to swing: webs find buildings ahead for you and chain while you hold. Let go at the top of a swing for a boost, Space mid-air to web-zip. Aim at a person to yank them.',range:[90,170],force:[1,2],energy:3,stun:[1.2,3]},
  fireball:{name:'Fireball',cat:'offence',type:'projectile',desc:'Hurl a fireball that explodes and sets targets on fire.',energy:15,cooldown:2,damage:[25,120],radius:[3,7],speed:45,burnDps:[5,14],burnTime:3},
  iceCloud:{name:'Ice Cloud',cat:'offence',type:'channel',desc:'Hold to summon a freezing cloud where you aim. Slows and hurts everything inside.',energyPerSec:10,slow:[0.3,0.7],dps:[8,40],radius:[6,9],range:45},
  lightning:{name:'Lightning Bolt',cat:'offence',type:'instant',desc:'Call a bolt from the sky onto your target. Huge burst damage and a stun.',energy:20,cooldown:4,damage:[40,180],stun:[0.3,1],radius:[3,5],range:140},
  energyBlast:{name:'Energy Blast',cat:'offence',type:'projectile',desc:'A fast energy orb that knocks targets back. Your everyday ranged attack.',energy:8,cooldown:0.8,damage:[15,80],speed:95,knock:[10,26]},
  laserVision:{name:'Laser Vision',cat:'offence',type:'channel',desc:'Hold to fire a beam from your eyes. It scorches whatever it touches.',energyPerSec:15,dps:[20,110],range:[60,120]},
  telekinesis:{name:'Telekinesis',cat:'offence',type:'hold',desc:'Hold to lift a person, drone or car with your mind. Let go to throw it.',energy:10,energyPerSec:4,range:[20,50],throwDmg:[20,100]},
  shockwave:{name:'Shockwave',cat:'offence',type:'instant',desc:'Blast everything around you away. Use it in mid-air to slam into the ground.',energy:30,cooldown:1,damage:[40,160],radius:[18,40]},
  metalSkin:{name:'Metal Skin',cat:'body',sig:'metalForms',desc:'Your body can turn to living steel. Gives you Metal Forms.',drain:3,dr:[0.3,0.7],slow:[0.3,0.1]},
  energyShield:{name:'Energy Shield',cat:'defence',type:'toggle',desc:'Raise a bubble that soaks up damage until it breaks.',energy:25,absorb:[50,400],cooldown:15},
  powerRing:{name:'Ring Bearer',cat:'movement',type:'toggle',key:'F',preset:true,desc:'A ring of pure willpower. Fly, and build anything you can imagine out of hard light. Its charge only comes back when you recite the oath.',speed:[35,110]},
  stormFlight:{name:'Storm God',cat:'movement',type:'toggle',key:'F',preset:true,desc:'Spin your hammer and hurl yourself into the sky. Lightning answers when you call.',speed:[40,95]},
  armorFlight:{name:'Armored Inventor',cat:'movement',type:'toggle',key:'F',preset:true,desc:'A flying suit of armor with palm repulsors and a chest beam.',speed:[45,100]},
  solarFlight:{name:'Sun Titan',cat:'movement',type:'toggle',key:'F',preset:true,desc:'Powered by the sun: flight, heat vision, freezing breath and a thunderclap.',speed:[50,120]},
  stormBody:{name:'Storm Blood',cat:'body',hidden:true,desc:'Lightning barely hurts you and your hammer never leaves your hand for long.'},
  armorSuit:{name:'Power Armor',cat:'body',hidden:true,desc:'Armor plating takes 35% off every hit.'},
  solarBody:{name:'Solar Cells',cat:'body',hidden:true,desc:'Bullets bounce off: you take 40% less damage and punch half again as hard.'},
  spiderPowers:{name:'Spider Powers',cat:'body',hidden:true,desc:'Stick to any surface, spider-sense warns you of attacks, and your strength is far beyond human.'},
  ringCore:{name:'The Ring',cat:'body',hidden:true,desc:'Everything you do runs on ring charge instead of energy.'},
  surgeSuit:{name:'Speed Surge',cat:'body',hidden:true,desc:'Your body runs on pure speed. Vibrate through walls and outrun time itself.'},
  webStrike:{name:'Web Strike',cat:'preset',type:'instant',desc:'Yank whoever you aim at toward you, or swing-kick them if you are in the air. On objects it pulls them to you.',energy:6,cooldown:0.6,damage:[20,80],range:[30,60]},
  webBomb:{name:'Web Bomb',cat:'preset',type:'instant',desc:'A web grenade that bursts and pins everyone nearby to the ground or the nearest wall.',energy:18,cooldown:5,radius:[6,12],stun:[3,6],damage:[20,70]},
  webWhip:{name:'Web Whip',cat:'preset',type:'instant',desc:'Spin a heavy web line around you, knocking everyone back.',energy:14,cooldown:3,radius:[8,14],damage:[30,110]},
  lightningThrow:{name:'Lightning Throw',cat:'preset',type:'instant',desc:'Gather the lightning you run with and throw it. Hits harder the higher your speed dial.',energy:12,cooldown:1.5,damage:[40,160]},
  phaseStrike:{name:'Phase Strike',cat:'preset',type:'instant',desc:'Vibrate your hand through a target. Devastating up close.',energy:25,cooldown:8,damage:[120,500]},
  speedTornado:{name:'Speed Tornado',cat:'preset',type:'channel',desc:'Spin your arms fast enough to whip up a tornado that lifts and tosses people.',energyPerSec:14,radius:[8,16],dps:[15,60]},
  slowTime:{name:'Slow Time',cat:'preset',type:'toggle',desc:'Everything slows down around you. Scroll or use [ and ] to set how slow.',drain:[10,4]},
  timeStop:{name:'Time Stop',cat:'preset',type:'instant',desc:'Stop time for everyone for 3 seconds. What you do in that moment lands all at once when time starts again.',energy:60,cooldown:45,duration:3},
  ringBlast:{name:'Ring Blast',cat:'preset',type:'instant',ring:2,desc:'A bolt of hard light from your ring.',cooldown:0.35,damage:[25,100]},
  hammerSmash:{name:'Hammer Smash',cat:'preset',type:'instant',ring:6,desc:'Build a giant hammer and bring it down on whatever you aim at.',cooldown:3,damage:[60,240],radius:[6,12]},
  chainLasso:{name:'Chain Lasso',cat:'preset',type:'instant',ring:5,desc:'Lasso a target with a construct chain, swing them around and slam them down.',cooldown:4,damage:[40,150]},
  ringShield:{name:'Ring Shield',cat:'preset',type:'toggle',desc:'A hard-light dome with its own health that blocks every hit. Barely costs charge to hold up, a little more while it is being hit. Enough punishment breaks it.',ringDrain:[0.3,0.1],absorb:[180,700],cooldown:4},
  blackHole:{name:'Black Hole',cat:'preset',type:'instant',ring:95,desc:'Pour almost all of your ring into a black hole. It tears buildings, rubble and people into it. Only the strong or fast escape.',cooldown:30,radius:[40,70],duration:6},
  morphBand:{name:'Morph Band',cat:'special',type:'special',key:'V',desc:'An alien wrist device. Transform into one of six alien forms, each with its own body and powers. Upgrades unlock more aliens and longer transformations.',duration:[45,150],recharge:[40,12],power:[1,2]},
  stormHammer:{name:'Storm Hammer',cat:'offence',type:'instant',desc:'Hurl an enchanted hammer. It calls lightning down on whatever it hits, smashes everything in its path and flies back to your hand.',energy:18,cooldown:3,damage:[40,170],stun:[0.5,1.2],range:[45,90]},
  repulsors:{name:'Repulsor Barrage',cat:'offence',type:'channel',desc:'Hold to fire rapid palm blasts from alternating hands. Great for keeping crowds and drones at bay.',energyPerSec:14,damage:[8,30],knock:[5,14]},
  coreBeam:{name:'Core Beam',cat:'offence',type:'instant',desc:'Wind up a blinding beam from your chest. It burns through people, cars and even buildings for a second and a half.',energy:35,cooldown:10,dps:[60,220]},
  ricochetShield:{name:'Ricochet Shield',cat:'offence',type:'instant',desc:'Throw a disc that bounces from target to target before flying back to you.',energy:12,cooldown:2.5,damage:[30,110],bounces:[3,6],stun:[0.5,1]},
  bladeClaws:{name:'Blade Claws',cat:'body',sig:'bladeLeap',desc:'Retractable claws in your hands and a healing factor that closes wounds fast. Gives you Blade Leap.',damage:[35,140],range:[10,18]},
  elasticBody:{name:'Elastic Body',cat:'body',sig:'stretchStrike',desc:'Stretch like rubber: your punches reach much further and hard landings bounce off you. Gives you Stretch Strike.',reach:[6,12],damage:[30,120]},
  titanGrowth:{name:'Titan Growth',cat:'body',sig:'giantForm',desc:'Grow to three times your size for a while. Everything you hit, you hit like a giant. Gives you Giant Form.',duration:[10,25],scale:[2.2,3.2]},
  metalForms:{name:'Metal Forms',cat:'signature',of:'metalSkin',type:'toggle',key:'',desc:'Turn to steel. Press again to cycle your hand into a hammer, a spiked flail, a blade or a shield; hold to turn back.',energy:0},
  bladeLeap:{name:'Blade Leap',cat:'signature',of:'bladeClaws',type:'instant',desc:'Lunge through enemies with a flurry of claw slashes.',energy:10,cooldown:1.5},
  stretchStrike:{name:'Stretch Strike',cat:'signature',of:'elasticBody',type:'instant',desc:'Your arm shoots out, grabs whoever you aim at and slams them into the ground.',energy:12,cooldown:2.5},
  giantForm:{name:'Giant Form',cat:'signature',of:'titanGrowth',type:'instant',desc:'Grow into a giant. Your punches shake the street and you can pick up cars with your hands.',energy:30,cooldown:30},
  blink:{name:'Blink',cat:'utility',type:'instant',desc:'Teleport to where you aim in a puff of smoke, knocking back anyone near where you appear.',energy:15,cooldown:[4,1.5],range:[25,60],damage:[20,90]},
  gravityWell:{name:'Gravity Well',cat:'offence',type:'instant',desc:'Open a singularity that drags in people, cars and street furniture, then collapses in a blast.',energy:30,cooldown:12,radius:[18,32],damage:[60,220]},
  spiritWave:{name:'Spirit Wave',cat:'offence',type:'charge',desc:'Hold to gather energy in your palms, release to unleash a massive wave that tears through anything, buildings included.',energy:40,cooldown:8,damage:[120,420]},
  timeDilation:{name:'Time Dilation',cat:'utility',type:'instant',desc:'Slow the world down around you while you move at full speed. In multiplayer it makes you faster instead.',energy:35,cooldown:20,duration:[3,7]},
};
const MOVEMENT_POWERS=Object.keys(POWERS).filter(k=>POWERS[k].cat==='movement'&&!POWERS[k].hidden);
const BODY_MODS=Object.keys(POWERS).filter(k=>POWERS[k].cat==='body'&&!POWERS[k].hidden);
const ABILITY_POWERS=Object.keys(POWERS).filter(k=>['offence','defence','utility','special'].includes(POWERS[k].cat));
// hero presets: picking one of these traversals fixes your body and abilities
const PRESETS={
  webSwing:{name:'Web-Slinger',body:'spiderPowers',abilities:['webStrike','webBomb','webWhip'],blurb:'Swing, crawl, glide and flip through the city. Spider-sense and web gadgets.'},
  superSpeed:{name:'Speedster',body:'surgeSuit',abilities:['lightningThrow','phaseStrike','speedTornado','slowTime','timeStop'],blurb:'Faster than anything alive: phase through walls, bend and stop time.'},
  stormFlight:{name:'Storm God',body:'stormBody',abilities:['stormHammer','lightning','shockwave','energyShield'],blurb:'Fly on a spinning hammer, call lightning and bring the thunder down.'},
  armorFlight:{name:'Armored Inventor',body:'armorSuit',abilities:['repulsors','energyBlast','coreBeam','energyShield'],blurb:'A flying suit of armor: repulsors, a chest beam and a force shield.'},
  solarFlight:{name:'Sun Titan',body:'solarBody',abilities:['laserVision','iceCloud','shockwave','timeDilation'],blurb:'Fly faster than jets, see through heat vision, freeze with your breath.'},
  powerRing:{name:'Ring Bearer',body:'ringCore',abilities:['ringBlast','hammerSmash','chainLasso','ringShield','blackHole'],blurb:'Build hard-light constructs, from a bubble to a dragon. Runs on ring charge.'},
};
const presetOf=c=>c&&PRESETS[c.movement[0]]||null;
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
function freshSave(){return {version:SAVE_VERSION,character:null,level:1,xp:0,sp:CONFIG.progression.startSP,powerLevels:{},passives:freshPassives(),reputation:0,rechoiceAt:0,guide:{},mastery:{},ring:100,bounty:0,
  settings:Object.assign({},DEFAULT_SETTINGS),stats:{defeated:0,crimesStopped:0,crimesCommitted:0}};}
function validCharacter(c){
  if(!c||typeof c!=='object')return null;
  const mv=Array.isArray(c.movement)?[...new Set(c.movement.filter(id=>MOVEMENT_POWERS.includes(id)))]:[];
  if(mv.length!==1)return null;
  const n=(v,max)=>Number.isInteger(v)&&v>=0&&v<max?v:0,pre=PRESETS[mv[0]];let body,ab;
  if(pre){body=pre.body;ab=pre.abilities.slice();}
  else{body=BODY_MODS.includes(c.body)?c.body:null;if(!body)return null;
    const free=Array.isArray(c.abilities)?[...new Set(c.abilities.filter(id=>ABILITY_POWERS.includes(id)))]:[];if(free.length!==CONFIG.picks.abilities)return null;
    ab=[POWERS[body].sig,...free];}
  return {name:(typeof c.name==='string'&&cleanName(c.name))||'Guardian',suit:n(c.suit,SUIT_OPTS.length),cape:n(c.cape,CAPE_OPTS.length),accent:n(c.accent,ACC_OPTS.length),capeOn:c.capeOn!==false,movement:mv,body,abilities:ab};
}
// builds from before traversal presets (two movement powers, no body mod) become the closest new build
function migrateCharacter(c){
  if(!c||typeof c!=='object'||!Array.isArray(c.movement)||c.body)return null;
  const mv=c.movement,ab=Array.isArray(c.abilities)?c.abilities:[];
  const trav=mv.includes('webSwing')||mv.includes('wallClimb')?'webSwing':mv.includes('superSpeed')?'superSpeed':'flight';
  const body=ab.includes('bladeClaws')?'bladeClaws':'metalSkin';
  const pool=[...ab.filter(id=>ABILITY_POWERS.includes(id)),'energyBlast','fireball','shockwave'];
  return validCharacter(Object.assign({},c,{movement:[trav],body,abilities:[...new Set(pool)].slice(0,2)}));
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
  if(!f.character){f.character=migrateCharacter(s.character);if(f.character)f.migrated=true;}
  if(!f.character)return f;
  f.level=Math.floor(num(s.level,1,1,CONFIG.progression.levelCap));f.xp=num(s.xp,0,0,1e9);f.sp=Math.floor(num(s.sp,f.sp,0,1e5));
  f.reputation=Math.round(num(s.reputation,0,REP.min,REP.max));
  if(s.powerLevels&&typeof s.powerLevels==='object')for(const k in POWERS){const v=s.powerLevels[k];if(typeof v==='number'&&isFinite(v))f.powerLevels[k]=Math.floor(clamp(v,1,CONFIG.powerMax));}
  if(s.passives&&typeof s.passives==='object')for(const k in PASSIVES)f.passives[k]=Math.floor(num(s.passives[k],0,0,CONFIG.passiveMax));
  if(s.stats&&typeof s.stats==='object')for(const k in f.stats)f.stats[k]=Math.floor(num(s.stats[k],0,0,1e9));
  f.rechoiceAt=f.migrated?0:num(s.rechoiceAt,0,0,1e15);
  if(s.mastery&&typeof s.mastery==='object')for(const k in s.mastery)if(POWERS[k]||k==='jump')f.mastery[k]=num(s.mastery[k],0,0,1e9);
  f.ring=num(s.ring,100,0,100);f.oathKnown=s.oathKnown===true;f.bounty=Math.round(num(s.bounty,0,0,1e6));
  if(f.migrated){const m=f.level*150;for(const k of [f.character.movement[0],'jump'])f.mastery[k]=Math.max(f.mastery[k]||0,m);}
  if(s.guide&&typeof s.guide==='object')for(const k of ['move','punch','ability','skills','crime','done','lock','wallrun','car'])if(s.guide[k]===true)f.guide[k]=true;
  return f;
}
const save=loadSave();
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch(e){}}
const touchOn=()=>save.settings.controls==='touch'||(save.settings.controls==='auto'&&IS_TOUCH_DEVICE);

const pv=k=>save.passives[k]|0;
const maxHp=()=>(CONFIG.health.base+CONFIG.health.perLevel*pv('vitality'))*(P.alien?ALIENS[P.alien.id].hp:1);
const maxEn=()=>CONFIG.energy.base+CONFIG.energy.perLevel*pv('energy');
const enRegen=()=>CONFIG.energy.regen*(1+CONFIG.energy.regenBonus*pv('energy'));
const hpRegen=()=>CONFIG.health.baseRegen+CONFIG.health.healPerLevel*pv('healing')+(hasPower('bladeClaws')?4+powerLevel('bladeClaws')*0.6:0);
const strengthMul=()=>1+0.02*pv('strength');
const throwMul=()=>1+0.01*pv('strength');
const IMPLIED={webSwing:['wallClimb'],powerRing:['flight'],stormFlight:['flight'],armorFlight:['flight'],solarFlight:['flight']};
const hasPower=id=>{const c=save.character;if(!c)return false;if(c.movement.includes(id)||c.body===id||c.abilities.includes(id))return true;const imp=IMPLIED[c.movement[0]];return !!(imp&&imp.includes(id));};
const hasTrav=id=>!!save.character&&save.character.movement[0]===id;
const LEVEL_OF=id=>POWERS[id]&&POWERS[id].of||id; // signature moves share their body mod's level
const powerLevel=id=>clamp(save.powerLevels[LEVEL_OF(id)]|0||1,1,CONFIG.powerMax);
// ---- traversal mastery: grows with use, no skill points ----
const MASTERY_MAX=10,MASTERY_K=1500;
const masteryLevel=id=>1+(MASTERY_MAX-1)*(1-Math.exp(-(save.mastery[id]||0)/MASTERY_K));
const mk=id=>(masteryLevel(id)-1)/(MASTERY_MAX-1); // 0 at the start, 1 when mastered
function addMastery(id,n){if(!save.character||!(n>0))return;const before=Math.floor(masteryLevel(id));save.mastery[id]=(save.mastery[id]||0)+n;const after=Math.floor(masteryLevel(id));
  if(after>before&&typeof feed==='function')feed((PRESETS[id]?PRESETS[id].name:POWERS[id]?POWERS[id].name:'Jumping')+' mastery '+after,MASTERY_NOTES[id]&&MASTERY_NOTES[id][after]||'You can go further, faster');}
const MASTERY_NOTES={webSwing:{3:'Backflips and twists unlocked',5:'Web wings glide further',7:'Corner boosts and slingshot launches hit harder',9:'Faster swings than ever'},
  superSpeed:{3:'Speed dial reaches higher',6:'Phasing lasts longer',9:'Near light speed'},powerRing:{3:'Bigger constructs',5:'Mech construct unlocked',7:'Huge mech unlocked',9:'Dragon unlocked'},
  flight:{5:'Supersonic flight',9:'Mach speed'},stormFlight:{5:'Supersonic flight',9:'Mach speed'},armorFlight:{5:'Supersonic flight',9:'Mach speed'},solarFlight:{5:'Supersonic flight',9:'Faster than sound'},jump:{5:'Super jumps go much higher'}};
// traversal stats grow with mastery (use), never below the level they were upgraded to before
const statLevel=id=>POWERS[id].cat==='movement'?Math.max(powerLevel(id),masteryLevel(id)):powerLevel(id);
const lvlK=id=>(powerLevel(id)-1)/(CONFIG.powerMax-1); // 0 at level 1, 1 at max: drives how strong a power looks
function pstat(id,name,lvl){const v=POWERS[id][name];if(Array.isArray(v))return lerp(v[0],v[1],((lvl||statLevel(id))-1)/(CONFIG.powerMax-1));return v;}
function faction(rep){return rep>=REP.heroAt?'hero':rep<=REP.villainAt?'villain':'neutral';}
const playerFaction=()=>faction(save.reputation);
function repTier(r){
  if(r>=REP.heroAt){let n='Rookie';for(const [t,nm] of REP.heroTiers)if(r>=t)n=nm;return {faction:'hero',name:n};}
  if(r<=REP.villainAt){let n='Troublemaker';for(const [t,nm] of REP.villainTiers)if(r<=t)n=nm;return {faction:'villain',name:n};}
  return {faction:'neutral',name:'Unknown'};
}
const hasBounty=()=>save.reputation<=REP.bounty;
const FACTION_COL={hero:'#5aa9ff',villain:'#ff4d5e',neutral:'#e9f3ff'};
