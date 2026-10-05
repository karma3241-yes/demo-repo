// ================================================================
// Config: every balance number lives here
// ================================================================
const CONFIG={
  progression:{spPerLevel:3,startSP:3,levelCap:100,xpToNext:l=>Math.floor(100*Math.pow(l,1.5)),dmgXp:0.2,
    orbs:{yellow:25,blue:50,red:100},orbRespawn:[30,60],orbRadius:1.5},
  picks:{kit:4}, // every hero has four power keys (plus the V power some of them have)
  powerMax:10,powerUpgradeCost:lvl=>lvl+1,passiveMax:50,passiveCost:1,
  energy:{base:100,perLevel:5,regen:8,regenBonus:0.02,delay:1.5,togglesBlockRegen:false},
  health:{base:220,perLevel:14,baseRegen:2,healPerLevel:0.5,healDelay:3,respawn:3,npcTaken:0.5},
  move:{run:14,sprint:21,gravity:68,jump:30,superJump:95},
  punch:{damage:16,range:3.4,cooldown:0.3,knock:11,comboMul:1.6},
  autosave:30,
  drive:{maxSpeed:42,accel:16,brake:34,reverse:12,steer:1.7,grip:6},
  traffic:{cars:GFXB.cars,police:6,follow:11,stopLine:14},
  rechoiceCooldown:0, // seconds between power changes (off for now)
  destruction:{propRespawn:120,windowLife:150},
};
// [min,max] pairs are the values at power level 1 and 10
const POWERS={
  flight:{name:'Flight',cat:'movement',hidden:true,type:'toggle',key:'F',desc:'Fly anywhere. Space climbs, C dives, Shift boosts.',speed:[40,90],drain:[4,2],boost:2.6},
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
  metalSkin:{name:'Metal Skin',cat:'body',hidden:true,sig:'metalForms',desc:'Your body can turn to living steel. Gives you Metal Forms.',drain:3,dr:[0.3,0.7],slow:[0.3,0.1]},
  energyShield:{name:'Energy Shield',cat:'defence',type:'toggle',desc:'Raise a bubble that soaks up damage until it breaks.',energy:25,absorb:[50,400],cooldown:15},
  powerRing:{name:'Ring Bearer',cat:'movement',type:'toggle',key:'F',preset:true,desc:'A ring of pure willpower. Fly, and build anything you can imagine out of hard light. Its charge only comes back when you recite the oath.',speed:[35,110]},
  stormFlight:{name:'Tempest',cat:'movement',type:'toggle',key:'F',preset:true,desc:'Ride a thunderclap into the sky. Lightning answers when you call.',speed:[40,95]},
  armorFlight:{name:'Armored Inventor',cat:'movement',type:'toggle',key:'F',preset:true,desc:'A flying suit of armor with palm blasters and a chest beam.',speed:[45,100]},
  strongFlight:{name:'The Strongest',cat:'movement',type:'toggle',key:'F',preset:true,desc:'Power armor that flies, with the best powers of other heroes: laser eyes, a giant hammer, a black hole and Time Stop.',speed:[45,100]},
  solarFlight:{name:'Sun Titan',cat:'movement',type:'toggle',key:'F',preset:true,desc:'Powered by the sun: flight, laser eyes, an ice cloud and a thunderclap.',speed:[50,120]},
  ironFlight:{name:'Ironclad',cat:'movement',type:'toggle',key:'F',preset:true,desc:'Fly with a body of living steel. Turn to metal, shove cars aside and shake the street.',speed:[38,95]},
  bladeFlight:{name:'Nightblade',cat:'movement',type:'toggle',key:'F',preset:true,desc:'A silent hunter who flies by night. Claws that heal you, a blink through the dark and a cloak to vanish in.',speed:[45,105]},
  elasticFlight:{name:'Slingshot',cat:'movement',type:'toggle',key:'F',preset:true,desc:'Fly, and stretch like rubber. Grab things from a distance, tie people up in vines and heal the street.',speed:[40,100]},
  titanFlight:{name:'Goliath',cat:'movement',type:'toggle',key:'F',preset:true,desc:'Grow to the size of a building and still fly. Call down meteors and a screaming black hole.',speed:[35,90]},
  bandFlight:{name:'Shifter',cat:'movement',type:'toggle',key:'F',preset:true,desc:'Fly, throw fire and lightning, and turn into a different alien with the Morph Band on V.',speed:[42,100]},
  stormBody:{name:'Storm Blood',cat:'body',hidden:true,desc:'Lightning barely hurts you and your hammer never leaves your hand for long.'},
  armorSuit:{name:'Power Armor',cat:'body',hidden:true,desc:'Armor plating takes 35% off every hit.'},
  solarBody:{name:'Solar Cells',cat:'body',hidden:true,desc:'Bullets bounce off: you take 40% less damage and punch half again as hard.'},
  spiderPowers:{name:'Spider Powers',cat:'body',hidden:true,desc:'Stick to any surface, a sixth sense warns you of attacks, and your strength is far beyond human.'},
  bandCore:{name:'Morph Core',cat:'body',hidden:true,desc:'The Morph Band is your body. No bonus of its own.'},
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
  morphBand:{name:'Morph Band',cat:'special',type:'special',key:'V',desc:'An alien wrist device. Transform into one of seven alien forms, each with its own body and powers. Upgrades unlock more aliens and longer transformations.',duration:[45,150],recharge:[40,12],power:[1,2]},
  stormHammer:{name:'Storm Hammer',cat:'offence',type:'instant',desc:'Hurl an enchanted hammer. It calls lightning down on whatever it hits, smashes everything in its path and flies back to your hand.',energy:18,cooldown:3,damage:[40,170],stun:[0.5,1.2],range:[45,90]},
  repulsors:{name:'Pulse Barrage',cat:'offence',type:'channel',desc:'Hold to fire rapid palm blasts from alternating hands. Great for keeping crowds and drones at bay.',energyPerSec:14,damage:[8,30],knock:[5,14]},
  coreBeam:{name:'Core Beam',cat:'offence',type:'instant',desc:'Wind up a blinding beam from your chest. It burns through people, cars and even buildings for a second and a half.',energy:35,cooldown:10,dps:[60,220]},
  ricochetShield:{name:'Ricochet Shield',cat:'offence',type:'instant',desc:'Throw a disc that bounces from target to target before flying back to you.',energy:12,cooldown:2.5,damage:[30,110],bounces:[3,6],stun:[0.5,1]},
  bladeClaws:{name:'Blade Claws',cat:'body',hidden:true,sig:'bladeLeap',desc:'Blades spring from your fists, and your wounds close fast. Gives you Blade Leap.',damage:[35,140],range:[10,18]},
  elasticBody:{name:'Elastic Body',cat:'body',hidden:true,sig:'stretchStrike',desc:'Stretch like rubber: your punches reach much further and hard landings bounce off you. Gives you Stretch Strike.',reach:[6,12],damage:[30,120]},
  titanGrowth:{name:'Titan Growth',cat:'body',hidden:true,sig:'giantForm',desc:'Grow to three times your size for a while. Everything you hit, you hit like a giant. Gives you Giant Form.',duration:[10,25],scale:[2.2,3.2]},
  metalForms:{name:'Metal Forms',cat:'signature',of:'metalSkin',type:'toggle',key:'',desc:'Turn to steel. Press again to cycle your hand into a hammer, a spiked flail, a blade or a shield; hold to turn back.',energy:0},
  bladeLeap:{name:'Blade Leap',cat:'signature',of:'bladeClaws',type:'instant',desc:'Lunge through enemies with a flurry of claw slashes.',energy:10,cooldown:1.5},
  stretchStrike:{name:'Stretch Strike',cat:'signature',of:'elasticBody',type:'instant',desc:'Your arm shoots out, grabs whoever you aim at and slams them into the ground.',energy:12,cooldown:2.5},
  giantForm:{name:'Giant Form',cat:'signature',of:'titanGrowth',type:'instant',desc:'Grow into a giant. Your punches shake the street and you can pick up cars with your hands.',energy:30,cooldown:30},
  blink:{name:'Blink',cat:'utility',type:'instant',desc:'Teleport to where you aim in a puff of smoke, knocking back anyone near where you appear.',energy:15,cooldown:[4,1.5],range:[25,60],damage:[20,90]},
  gravityWell:{name:'Gravity Well',cat:'offence',type:'instant',desc:'Open a singularity that drags in people, cars and street furniture, then collapses in a blast.',energy:30,cooldown:12,radius:[18,32],damage:[60,220]},
  sonicScream:{name:'Sonic Scream',cat:'offence',type:'instant',desc:'A deafening scream in a cone in front of you. Stuns and hurts everyone it reaches and shatters windows.',energy:22,cooldown:6,damage:[20,90],stun:[0.6,1.6],range:[26,40]},
  quakeStomp:{name:'Quake Stomp',cat:'offence',type:'instant',desc:'Stomp and send a line of erupting rock racing along the ground, throwing everyone in its path into the air.',energy:28,cooldown:7,damage:[30,130],range:[30,55]},
  meteorStrike:{name:'Meteor Strike',cat:'offence',type:'instant',desc:'Call a meteor down on where you aim. It lands a moment later with a huge blast that even hurts buildings.',energy:45,cooldown:[18,10],damage:[90,320],radius:[9,15]},
  forcePush:{name:'Force Push',cat:'offence',type:'instant',desc:'An invisible wall of force that sends people, cars and anything else in front of you flying.',energy:15,cooldown:[3,1.5],damage:[10,50],range:[22,36]},
  chainLightning:{name:'Chain Lightning',cat:'offence',type:'instant',desc:'A bolt from your hand that jumps from enemy to enemy.',energy:25,cooldown:5,damage:[25,110],bounces:[3,7]},
  healingPulse:{name:'Healing Pulse',cat:'utility',type:'instant',desc:'A warm pulse that heals you and gets injured people around you back on their feet.',energy:30,cooldown:[20,10],damage:[40,180]},
  invisibility:{name:'Invisibility',cat:'defence',type:'toggle',desc:'Turn invisible. Enemies and the police lose track of you while it lasts. Drains energy.',drain:[9,3]},
  vineSnare:{name:'Vine Snare',cat:'utility',type:'instant',desc:'Thorny vines burst out of the ground where you aim and hold everyone there in place.',energy:20,cooldown:10,radius:[6,11],stun:[2,4],damage:[10,50]},
  shadowStep:{name:'Shadow Step',cat:'utility',type:'instant',desc:'Vanish and reappear right behind your target (or where you aim), striking as you arrive.',energy:20,cooldown:[6,3],range:[30,60],damage:[40,160]},
  plasmaWhip:{name:'Plasma Whip',cat:'offence',type:'instant',desc:'A crackling whip that sweeps a wide arc around you. Fast and good against crowds.',energy:12,cooldown:[1.6,0.8],damage:[25,100],radius:[6,9]},
  spiritWave:{name:'Spirit Wave',cat:'offence',type:'charge',desc:'Hold to gather energy in your palms, release to unleash a massive wave that tears through anything, buildings included.',energy:40,cooldown:8,damage:[120,420]},
  suitBattery:{name:'Suit Battery',cat:'upgrade',hidden:true,desc:'How much charge the Armored Inventor\'s suit holds. Every power runs on it, and it only recharges at Forge Tower.',capacity:[100,300]},
  timeDilation:{name:'Time Dilation',cat:'utility',type:'instant',desc:'Slow the world down around you while you move at full speed. In multiplayer it makes you faster instead.',energy:35,cooldown:20,duration:[3,7]},
};
// the heroes: you can only pick one of these. Its movement id is the hero's identity everywhere (movement[0]), and fixes the body and
// the four power keys (the first key of a body hero is its signature move). The new fliers get their own id and fly like plain flight (IMPLIED).
const PRESETS={
  webSwing:{name:'Web Runner',body:'spiderPowers',abilities:['webStrike','webBomb','webWhip','shadowStep'],blurb:'Swing, crawl, glide and flip through the city. A sixth sense for danger and web gadgets.'},
  superSpeed:{name:'Speedster',body:'surgeSuit',abilities:['lightningThrow','phaseStrike','speedTornado','timeStop'],blurb:'Outrun anything: phase through walls, bend and stop time.'},
  stormFlight:{name:'Tempest',body:'stormBody',abilities:['stormHammer','lightning','shockwave','energyShield'],blurb:'Ride the storm, call lightning and bring the thunder down.'},
  armorFlight:{name:'Armored Inventor',body:'armorSuit',abilities:['repulsors','energyBlast','coreBeam','energyShield'],blurb:'A flying suit of armor: palm blasters, a chest beam and a force shield.'},
  solarFlight:{name:'Sun Titan',body:'solarBody',abilities:['laserVision','iceCloud','shockwave','timeDilation'],blurb:'Fly faster than jets, burn with laser eyes, freeze with an ice cloud.'},
  powerRing:{name:'Ring Bearer',body:'ringCore',abilities:['ringBlast','hammerSmash','ringShield','blackHole'],blurb:'Build hard-light constructs, from a bubble to a dragon. Runs on ring charge.'},
  ironFlight:{name:'Ironclad',body:'metalSkin',abilities:['metalForms','ricochetShield','forcePush','quakeStomp'],blurb:'Fly with a body of living steel. Turn to metal, throw a bouncing disc and shake the street.'},
  bladeFlight:{name:'Nightblade',body:'bladeClaws',abilities:['bladeLeap','plasmaWhip','blink','invisibility'],blurb:'A silent hunter. Claws that heal you, a blink through the dark and a cloak to vanish in.'},
  elasticFlight:{name:'Slingshot',body:'elasticBody',abilities:['stretchStrike','vineSnare','telekinesis','healingPulse'],blurb:'Stretch like rubber, snare people in vines, lift things with your mind and heal the street.'},
  titanFlight:{name:'Goliath',body:'titanGrowth',abilities:['giantForm','meteorStrike','gravityWell','sonicScream'],blurb:'Grow as tall as a tower. Call down meteors, open a black hole and scream the windows out.'},
  strongFlight:{name:'The Strongest',body:'armorSuit',abilities:['laserVision','hammerSmash','blackHole','timeStop'],blurb:'Power armor with the best of everyone: laser eyes, a giant hammer, a black hole and Time Stop. Rebuilds the city with Y.'},
  bandFlight:{name:'Shifter',body:'bandCore',abilities:['fireball','chainLightning','spiritWave','energyBlast'],blurb:'Fire, lightning and a Morph Band on V that turns you into aliens.'},
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
const RING_MAX=200; // ring charge tops out at 100; a loud spoken oath overcharges it up to this
// traversal styles on the V wheel for heroes without constructs: [id, name, what it does]. The first is the default.
const TRAV_STYLES={
  webSwing:[['swing','Swing','Hold right click to swing · Space mid-air to web-zip'],['zip','Zip','Right click zips you straight to where you aim'],['glide','Glide','Web wings open by themselves when you fall · hold C to fold them']],
  stormFlight:[['fly','Fly','F to fly · Shift to boost'],['leap','Hammer Leap','Tap or hold F to leap: you arc through the sky and land, no hovering'],['storm','Storm Ride','Fly at full boost on a trail of lightning · harder to steer']],
  superSpeed:[['walk','Walk','Normal pace · Shift still runs at the speed dial'],['jog','Jog','Always running at x2'],['run','Run','Always running at half your top speed'],['top','Top speed','Always running at your top speed']],
};
const DEFAULT_SETTINGS={oathInput:'hold',oathV2:true, // hold O to charge: no mic prompt, no typing; Type and Voice stay in Settings
  micLoud:0.65,controls:'auto',tSize:'m',tHand:'r',autoLock:true,sens:1,invertY:false,volume:0.7,gfx:'auto'};
const SUIT_OPTS=['#1f3f9e','#17181f','#0f6b5a','#5b1f9a','#9aa3b0','#a3122a'];
const CAPE_OPTS=['#c8102e','#ffc93c','#1fb8d6','#eeeeee','#17181f','#ff4f9a'];
const ACC_OPTS=['#ffc93c','#4fd8ff','#ff3d5e','#e9f3ff','#39ff88'];
function cleanName(s){return String(s).replace(/[^\p{L}\p{N} _.'-]/gu,'').replace(/\s+/g,' ').trim().slice(0,16);}
// other players' names are typed by them: a basic profanity filter (letters, common digit swaps and whole words)
const BAD_PART=/fuck|fck|fuk|shit|cunt|bitch|nigg|fagg|whore|slut|porn|penis|vagina|asshole|retard|hitler|nazi/,BAD_WORD=/^(rape|fag|dick|cock|kys|sex|anal|cum)$/;
function safeName(s){const n=cleanName(s);const t=n.toLowerCase().replace(/[0134579@$]/g,c=>({0:'o',1:'i',3:'e',4:'a',5:'s',7:'t',9:'g','@':'a','$':'s'})[c]);
  return BAD_PART.test(t.replace(/[^a-z]/g,''))||t.split(/[^a-z]+/).some(w=>BAD_WORD.test(w))?'':n;}
function freshPassives(){const o={};for(const k in PASSIVES)o[k]=0;return o;}
// the story (66b_story.js): stage numbers per event, 0 = not started; act = seconds of active play. Later events add their own stage field here.
function storyFresh(){return {act:0,ufo:0,item:'',destroy:false,kathana:0,kp:0,invasion:0,cyber:0,tower:0,tf:0};}
function freshSave(){return {version:SAVE_VERSION,character:null,level:1,xp:0,sp:CONFIG.progression.startSP,powerLevels:{},passives:freshPassives(),reputation:0,rechoiceAt:0,guide:{},gfxAuto:'',goal:0,daily:{last:'',streak:0},mastery:{},ring:100,battery:100,bolt:100,cal:100,bounty:0,
  settings:Object.assign({},DEFAULT_SETTINGS),stats:{defeated:0,crimesStopped:0,crimesCommitted:0},story:storyFresh()};}
// what each flier gets from plain flight (and the Shifter's Morph Band, which lives on V and takes no key). Defined here because loadSave needs it.
const IMPLIED={webSwing:['wallClimb'],powerRing:['flight'],stormFlight:['flight'],armorFlight:['flight'],strongFlight:['flight'],solarFlight:['flight'],
  ironFlight:['flight'],bladeFlight:['flight'],elasticFlight:['flight'],titanFlight:['flight'],bandFlight:['flight','morphBand']};
const LEVEL_OF=id=>POWERS[id]&&POWERS[id].of||id; // signature moves share their body mod's level
// every power whose skill level belongs to this build (a hero's V power, like the Morph Band, counts although it has no key)
const ownedIds=c=>[...new Set([...c.abilities.map(LEVEL_OF),...c.movement,c.body,...(IMPLIED[c.movement[0]]||[])])];
// takes back the skill points spent on powers that are no longer owned: drops their levels from `levels` and returns the points
function refundDropped(levels,oldIds,newIds){let r=0;
  for(const id of oldIds)if(!newIds.includes(id)){const l=levels[id]|0;for(let q=1;q<l;q++)r+=CONFIG.powerUpgradeCost(q);delete levels[id];}
  return r;}
const presetAbilities=m=>PRESETS[m].abilities.slice();
const isHero=m=>typeof m==='string'&&Object.prototype.hasOwnProperty.call(PRESETS,m);
function validCharacter(c){
  if(!c||typeof c!=='object'||!Array.isArray(c.movement)||c.movement.length!==1||!isHero(c.movement[0]))return null; // old custom builds come out null: migrateCharacter turns them into a hero
  const n=(v,max)=>Number.isInteger(v)&&v>=0&&v<max?v:0,m=c.movement[0],pre=PRESETS[m];
  return {name:(typeof c.name==='string'&&cleanName(c.name))||'Guardian',suit:n(c.suit,SUIT_OPTS.length),cape:n(c.cape,CAPE_OPTS.length),accent:n(c.accent,ACC_OPTS.length),capeOn:c.capeOn!==false,movement:[m],body:pre.body,abilities:presetAbilities(m)};
}
// old builds become the nearest hero. Flight builds (a body mod plus four abilities) go by their body; the Morph Band wins over the body;
// builds from before traversal presets (two movement powers, no body mod) keep the Web Runner and Speedster, and fly as Ironclad (or Nightblade with Blade Claws).
const BODY_HERO={metalSkin:'ironFlight',bladeClaws:'bladeFlight',elasticBody:'elasticFlight',titanGrowth:'titanFlight'};
function migrateCharacter(c){
  if(!c||typeof c!=='object'||!Array.isArray(c.movement))return null;
  const mv=c.movement.filter(x=>typeof x==='string'),ab=Array.isArray(c.abilities)?c.abilities.filter(x=>typeof x==='string'):[];let to;
  if(typeof c.body==='string'&&c.body){to=ab.includes('morphBand')?'bandFlight':BODY_HERO[c.body];}
  else to=mv.includes('webSwing')||mv.includes('wallClimb')?'webSwing':mv.includes('superSpeed')?'superSpeed':ab.includes('morphBand')?'bandFlight':ab.includes('bladeClaws')?'bladeFlight':'ironFlight';
  if(!to)return null;
  return validCharacter(Object.assign({},c,{movement:[to]}));
}
function loadSave(raw){ // raw: a save as JSON text (the CrazyGames cloud copy); otherwise the one in this browser
  let s=null;try{s=JSON.parse((raw!==undefined?raw:localStorage.getItem(SAVE_KEY))||'null');}catch(e){s=null;}
  const f=freshSave();if(!s||typeof s!=='object'||s.version!==SAVE_VERSION)return f;
  const num=(v,d,a,b)=>typeof v==='number'&&isFinite(v)?clamp(v,a,b):d;
  if(s.settings&&typeof s.settings==='object'){const t=s.settings,st=f.settings;
    if(['auto','touch','kbm'].includes(t.controls))st.controls=t.controls;
    if(t.oathV2===true&&['hold','voice','type'].includes(t.oathInput))st.oathInput=t.oathInput; // saves from before hold mode keep the new default once
    st.gfx=gfxFromSettings(t); // old Shadows switch -> a tier
    if(['s','m','l'].includes(t.tSize))st.tSize=t.tSize;if(['r','l'].includes(t.tHand))st.tHand=t.tHand;
    for(const k of ['autoLock','invertY'])if(typeof t[k]==='boolean')st[k]=t[k];
    if(t.travStyle&&typeof t.travStyle==='object'){st.travStyle={};for(const k in TRAV_STYLES)if(TRAV_STYLES[k].some(x=>x[0]===t.travStyle[k]))st.travStyle[k]=t.travStyle[k];}
    st.sens=num(t.sens,1,0.3,3);st.volume=num(t.volume,0.7,0,1);st.micLoud=num(t.micLoud,0.65,0.2,0.95);}
  f.character=validCharacter(s.character);
  const rc=s.character&&typeof s.character==='object'?s.character:{},oldAb=Array.isArray(rc.abilities)?rc.abilities.filter(x=>typeof x==='string'):null,oldMv=Array.isArray(rc.movement)?rc.movement.filter(x=>typeof x==='string'):[];
  let oldIds=null; // the powers the build had before this load, for the refund (set when the build changed)
  if(!f.character){f.character=migrateCharacter(rc);if(f.character){f.heroConv=true;if(!rc.body)f.migrated=true;
    oldIds=[...new Set([...(oldAb||[]).map(LEVEL_OF),...oldMv,...(typeof rc.body==='string'?[rc.body]:[])])];}}
  else if(oldAb&&(oldAb.length!==f.character.abilities.length||oldAb.some(id=>!f.character.abilities.includes(id)))){ // a hero that lost a key (Ring Bearer, Speedster...) or had free picks on keys 4-5
    f.heroConv=true;oldIds=[...new Set([...oldAb.map(LEVEL_OF),...f.character.movement,f.character.body,...(IMPLIED[f.character.movement[0]]||[])])];}
  if(!f.character)return f;
  f.level=Math.floor(num(s.level,1,1,CONFIG.progression.levelCap));f.xp=num(s.xp,0,0,1e9);f.sp=Math.floor(num(s.sp,f.sp,0,1e5));
  f.reputation=Math.round(num(s.reputation,0,REP.min,REP.max));
  if(s.powerLevels&&typeof s.powerLevels==='object')for(const k in POWERS){const v=s.powerLevels[k];if(typeof v==='number'&&isFinite(v))f.powerLevels[k]=Math.floor(clamp(v,1,CONFIG.powerMax));}
  if(s.passives&&typeof s.passives==='object')for(const k in PASSIVES)f.passives[k]=Math.floor(num(s.passives[k],0,0,CONFIG.passiveMax));
  if(s.stats&&typeof s.stats==='object')for(const k in f.stats)f.stats[k]=Math.floor(num(s.stats[k],0,0,1e9));
  f.rechoiceAt=f.heroConv?0:num(s.rechoiceAt,0,0,1e15); // a converted or trimmed hero may change for free
  if(s.mastery&&typeof s.mastery==='object')for(const k in s.mastery)if(POWERS[k]||k==='jump')f.mastery[k]=num(s.mastery[k],0,0,1e9);
  if(f.heroConv){ // old flight builds keep the flying mastery they earned
    if(oldMv.includes('flight')){const id=f.character.movement[0];f.mastery[id]=Math.max(f.mastery[id]||0,f.mastery.flight||0);}
    f.sp+=refundDropped(f.powerLevels,oldIds,ownedIds(f.character));}
  f.ring=num(s.ring,100,0,RING_MAX);f.battery=num(s.battery,300,0,300);f.bolt=num(s.bolt,100,0,100);f.cal=num(s.cal,100,0,100);f.oathKnown=s.oathKnown===true;f.savedAt=num(s.savedAt,0,0,1e15);f.trials={};if(s.trials&&typeof s.trials==='object')for(const k in s.trials){const v=+s.trials[k];if(v>Date.now()&&v<Date.now()+36e5)f.trials[k]=v;}f.cos=s.cos&&typeof s.cos==='object'?s.cos:null; // cleaned in 65_rewards.js
  f.xSeen=Array.isArray(s.xSeen)?s.xSeen.filter(v=>Number.isInteger(v)&&v>=0&&v<100).slice(-100):[];f.bounty=Math.round(num(s.bounty,0,0,1e6));
  if(f.migrated){const m=f.level*150;for(const k of [f.character.movement[0],'jump'])f.mastery[k]=Math.max(f.mastery[k]||0,m);}
  if(GFX_TIERS[s.gfxAuto])f.gfxAuto=s.gfxAuto; // the tier the fps watch settled on
  f.goal=typeof s.goal==='number'?Math.floor(num(s.goal,0,-1,99)):-1; // -1: a save from before goals
  if(s.daily&&typeof s.daily==='object'){const d=s.daily;if(typeof d.last==='string'&&/^\d{4}-\d\d-\d\d$/.test(d.last))f.daily.last=d.last;if(Number.isInteger(d.streak)&&d.streak>=0&&d.streak<=7)f.daily.streak=d.streak;} // last claim (local date) and the streak
  if(s.story&&typeof s.story==='object'){const t=s.story,st=f.story;st.act=num(t.act,0,0,1e9);for(const k of ['ufo','kathana','kp','invasion','cyber','tower','tf'])st[k]=Math.floor(num(t[k],0,0,30));st.item=isHero(t.item)?t.item:'';st.destroy=t.destroy===true;} // the story: only known fields, ints are stages
  if(s.guide&&typeof s.guide==='object')for(const k of ['move','punch','ability','skills','crime','done','lock','wallrun','car','wheel','grow','unlocks','swap','lockNear','sgV','sgSun'])if(s.guide[k]===true)f.guide[k]=true;
  return f;
}
const save=loadSave();GFX_SAVE=save;
let persistHook=null; // the CrazyGames build also copies every save to the portal's cloud storage (64_portal.js)
function persist(){save.savedAt=Date.now();const j=JSON.stringify(save);try{localStorage.setItem(SAVE_KEY,j);}catch(e){}if(persistHook)try{persistHook(j);}catch(e){}}
const touchOn=()=>save.settings.controls==='touch'||(save.settings.controls==='auto'&&IS_TOUCH_DEVICE);

const pv=k=>save.passives[k]|0;
// UFO boosts (66e_boost.js): once the item is taken (story.ufo>=2) every hero gets its own boost, whichever hero you play (checked at use time). boostMul(kind,id):
// 'hp' all heroes x1.2; 'dmg' (by power id) the Tempest's hammer x1.6 and the Armored Inventor's blasts x1.5; 'dmgAll' Ironclad/Nightblade/Slingshot/Goliath x1.5 on every hit;
// 'speed' flight x1.3 (those four) or swing cap x1.25 (Web Runner); 'cost' x0.5 and 'cd' x0.7 for those four.
const ufoBoost=()=>!!save.story&&(save.story.ufo===2||save.story.ufo===3); // 4 = the UFO was skipped (Kathana's fall replaced it): no boosts
const BOOST_ALL=['ironFlight','bladeFlight','elasticFlight','titanFlight','strongFlight'],BOOST_ARC=['repulsors','energyBlast','coreBeam'];
function boostMul(kind,id){
  if(!ufoBoost()||!save.character)return 1;const h=save.character.movement[0],all=BOOST_ALL.includes(h);
  switch(kind){case 'hp':return 1.2;case 'dmgAll':return all?1.5:1;case 'speed':return all?1.3:h==='webSwing'?1.25:1;case 'cost':return all?0.5:1;case 'cd':return all?0.7:1;
    case 'dmg':return h==='armorFlight'&&BOOST_ARC.includes(id)?1.5:h==='stormFlight'&&id==='stormHammer'?1.6:1;}
  return 1;}
var arenaHp=1; // Kathana's arena (66f_kathana.js) sets this to 6: a big health pool there (var: maxHp runs before that file has loaded)
const maxHp=()=>(CONFIG.health.base+CONFIG.health.perLevel*pv('vitality'))*(P.alien?ALIENS[P.alien.id].hp:1)*boostMul('hp')*(arenaHp||1);
const maxEn=()=>CONFIG.energy.base+CONFIG.energy.perLevel*pv('energy');
const enRegen=()=>CONFIG.energy.regen*(1+CONFIG.energy.regenBonus*pv('energy'));
const hpRegen=()=>CONFIG.health.baseRegen+CONFIG.health.healPerLevel*pv('healing')+(hasPower('bladeClaws')?4+powerLevel('bladeClaws')*0.6:0);
const strengthMul=()=>1+0.02*pv('strength');
const throwMul=()=>1+0.01*pv('strength');
const hasPower=id=>{const c=save.character;if(!c)return false;if(c.movement.includes(id)||c.body===id||c.abilities.includes(id))return true;const imp=IMPLIED[c.movement[0]];return !!(imp&&imp.includes(id));};
const hasTrav=id=>!!save.character&&save.character.movement[0]===id;
// the chosen V-wheel style of your traversal ('' when it has none)
const travStyle=id=>{const L=TRAV_STYLES[id];if(!L)return '';const v=save.settings.travStyle&&save.settings.travStyle[id];return L.some(x=>x[0]===v)?v:L[0][0];};
const powerLevel=id=>trialOn('lv:'+LEVEL_OF(id))?CONFIG.powerMax:clamp(save.powerLevels[LEVEL_OF(id)]|0||1,1,CONFIG.powerMax);
// ---- traversal mastery: grows with use, no skill points ----
// The CrazyGames build (PBAL) plays slower and tighter: weaker at the start, mastery takes ~6 hours, every size has a cap,
// and locked things can be tried for 10 minutes with an ad (see 65_rewards.js). The website and claude.ai keep today's balance.
const PBAL=window.__PORTAL__==='crazygames';
// CrazyGames basic launch: ads aren't allowed yet, so every ad (and the reward icons) is off, and your traversal starts
// at mastery 10 (the old maximum) so players see the best of it, then grows to 100 (levels and skill points work as usual). For full launch set this to false.
const BASIC_LAUNCH=PBAL&&true;
// Mastery runs 1..100 on one curve. 1..10 is the old balance (same early pace: level 10 at 3K points); above 10 it keeps growing
// slower: level = 10+90*t^0.7 with t=(points-3K)/6K, so 20 comes ~2300 points later (CG), 50 at ~17k and 100 at 9K points total.
// mk() stays 0..1 (0..10) so every existing consumer is unchanged; masteryOver() (levels above 10) adds the soft extras
// (flight and web speed +1% a level, construct size). BASIC_LAUNCH and the 'trav' trial start your hero at level 10: basic launch
// counts 3K free points on top of the ones you earn so it still grows with play; a trial just floors at 10.
const MASTERY_MAX=100,MASTERY_FULL=10,MASTERY_K=PBAL?9000:1500,MASTERY_P10=3*MASTERY_K,MASTERY_P100=9*MASTERY_K;
function trialOn(k){return PBAL&&!!save.trials&&save.trials[k]>Date.now();}
const masteryAt=m=>m<MASTERY_P10?1+(MASTERY_FULL-1)*(1-Math.exp(-m/MASTERY_K))/(1-Math.exp(-3)):Math.min(MASTERY_MAX,MASTERY_FULL+(MASTERY_MAX-MASTERY_FULL)*Math.pow((m-MASTERY_P10)/(MASTERY_P100-MASTERY_P10),0.7));
const masteryLevel=id=>{const m=save.mastery[id]||0,cur=!!save.character&&id===save.character.movement[0];
  if(cur&&BASIC_LAUNCH)return masteryAt(m+MASTERY_P10);if(cur&&trialOn('trav'))return Math.max(MASTERY_FULL,masteryAt(m));return masteryAt(m);};
const mk=id=>clamp((masteryLevel(id)-1)/(MASTERY_FULL-1),0,1); // 0 at the start, 1 at level 10
const masteryOver=id=>Math.max(0,masteryLevel(id)-MASTERY_FULL); // levels above 10 (0..90)
function addMastery(id,n){if(!save.character||!(n>0))return;const before=Math.floor(masteryLevel(id));save.mastery[id]=(save.mastery[id]||0)+n;const after=Math.floor(masteryLevel(id));
  if(after>before&&(after<=MASTERY_FULL||after%5===0)&&typeof feed==='function')feed((PRESETS[id]?PRESETS[id].name:POWERS[id]?POWERS[id].name:'Jumping')+' mastery '+after,MASTERY_NOTES[id]&&MASTERY_NOTES[id][after]||(after>MASTERY_FULL?'Faster and bigger again':'You can go further, faster'));}
const MASTERY_NOTES={webSwing:{3:'Backflips and twists unlocked',5:'Web wings glide further',7:'Corner boosts and slingshot launches hit harder',9:'Faster swings than ever'},
  superSpeed:{3:'Speed dial reaches higher',6:'Phasing lasts longer',9:'Near light speed'},powerRing:{3:'Mech construct unlocked',5:'Huge mech unlocked',7:'Dragon unlocked',9:'Bigger constructs than ever'},
  flight:{5:'Supersonic flight',9:'Mach speed'},stormFlight:{5:'Supersonic flight',9:'Mach speed'},armorFlight:{5:'Supersonic flight',9:'Mach speed'},solarFlight:{5:'Supersonic flight',9:'Faster than sound'},jump:{5:'Super jumps go much higher'}};
for(const id of ['ironFlight','bladeFlight','elasticFlight','titanFlight','bandFlight','strongFlight'])MASTERY_NOTES[id]=MASTERY_NOTES.flight; // the new fliers grow like plain flight
// traversal stats grow with mastery (use), never below the level they were upgraded to before
const statLevel=id=>POWERS[id].cat==='movement'?Math.min(CONFIG.powerMax,Math.max(powerLevel(id),masteryLevel(id))):powerLevel(id); // pstat lerps 1..10, so mastery above 10 is clamped here
const lvlK=id=>(powerLevel(id)-1)/(CONFIG.powerMax-1); // 0 at level 1, 1 at max: drives how strong a power looks
function pstat(id,name,lvl){const v=POWERS[id][name];let r=Array.isArray(v)?lerp(v[0],v[1],((lvl||statLevel(id))-1)/(CONFIG.powerMax-1)):v;
  if(!lvl&&typeof r==='number'&&(name==='damage'||name==='dps'))r*=boostMul('dmg',id); // UFO boost
  // a grown power (hold its key and scroll) reaches further and hits harder while it is being cast
  if(typeof castK!=='undefined'&&castK>1&&typeof r==='number'&&!lvl){if(name==='radius'||name==='range'||name==='reach')return r*castK;if(name==='damage'||name==='dps'||name==='throwDmg')return r*Math.sqrt(castK);}
  return r;}
function faction(rep){return rep>=REP.heroAt?'hero':rep<=REP.villainAt?'villain':'neutral';}
const playerFaction=()=>faction(save.reputation);
function repTier(r){
  if(r>=REP.heroAt){let n='Rookie';for(const [t,nm] of REP.heroTiers)if(r>=t)n=nm;return {faction:'hero',name:n};}
  if(r<=REP.villainAt){let n='Troublemaker';for(const [t,nm] of REP.villainTiers)if(r<=t)n=nm;return {faction:'villain',name:n};}
  return {faction:'neutral',name:'Unknown'};
}
const hasBounty=()=>save.reputation<=REP.bounty;
const FACTION_COL={hero:'#5aa9ff',villain:'#ff4d5e',neutral:'#e9f3ff'};
