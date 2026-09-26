# Skyline Guardian

An open-world superhero sandbox that runs in the browser. You create a hero, pick your powers, and choose your side in the island city of Nova Bay: stop the robberies, muggings and heists happening around you, or become the reason people lock their doors. Every fight earns XP and skill points, and the city remembers which side you picked.

## Play

Play it online at **https://demo-repo-dusky.vercel.app**, or open `index.html` in a recent browser (Chrome, Edge, Firefox or Safari). You don't need a server or an install. The game ships as one file with no dependencies, written in raw WebGL 2.

It works on laptops and phones. The game detects your device and switches between keyboard-and-mouse and touch controls automatically. You can override this in Settings.

## Your hero

- **Build your hero.** When you create a hero you pick **one traversal power**. Three of them are complete hero kits (**presets**) that come with their own body and abilities. The fourth, **Flight**, lets you build your own: pick **one body mod** (its signature move goes in slot 1) and **2 abilities**. You can swap later with **Change powers** in the pause menu, once every 10 minutes. Skill points you spent on powers you drop come back to you.
- **Level up by fighting.** You earn XP from fights, from damage you deal, and from glowing orbs around the city (yellow 25 XP, blue 50, red 100; red orbs only appear on rooftops). Each level gives you **3 skill points**.
- **Spend skill points** to upgrade your abilities and body mod (up to level 10) and four passives: Strength, Vitality, Healing and Energy (up to level 50 each). Upgraded powers look stronger too. For example, Laser Vision starts as a thin orange line and ends as a thick red beam, and Telekinesis lifts more, and heavier things, as it levels up. **Reset skill points** at the bottom of the Skills screen refunds everything you spent.
- **Traversal grows with use.** Your traversal power has no skill points. It gets better the more you use it (mastery 1–10): flight gets faster, jumps go higher, web swings get faster and unlock new tricks, the speed dial goes higher, and ring constructs get bigger and unlock new shapes.
- **Suit up** with `U`. You swap between your civilian clothes and your suit, and each kind of hero changes differently.
- **Reputation** decides your side. Stopping criminals makes you a Hero (Rookie → Vigilante → Protector → Guardian → Legend). Hurting civilians and police, or robbing shops and ATMs, makes you a Villain (Troublemaker → Outlaw → Menace → Supervillain → Nemesis). Villains get chased by police, and at −1500 reputation a bounty puts rival heroes on your trail.

Saves from before this update are converted automatically: you keep your level, reputation and upgrades, get the closest new build, and can change powers for free once.

### Hero presets

All of these are original characters inspired by famous hero styles.

**Web-Slinger** (Web-Swinging). A full city-swinging kit inspired by the Insomniac games.
- **Swing** with right click. Webs find buildings ahead of you and chain while you hold. Press `Shift` mid-swing for a boost.
- **Web-zip** by tapping `Space` in the air. Hold `Space` in the air to open **web wings** and glide. Updrafts over tall roofs and parks lift you.
- **Slingshot launch:** hold `Space` on the ground.
- **Tricks:** dive by looking down and pressing forward. `C` in the air does a trick; flips unlock as mastery grows. You roll out of hard landings.
- **Crawl** on any wall.
- **Spider-sense** sometimes dodges attacks for you.
- **Abilities:** Web Strike (yank someone, or swing-kick them from the air), Web Bomb (pins everyone nearby) and Web Whip (knocks back everyone around you).

**Speedster** (Super Speed).
- **Running:** `Shift` runs, and `F` turns on fast mode so you always run. The **speed dial** (`[` `]` or the mouse wheel) sets how fast. It goes up to ×3 at first and ×12 when mastered, and your punches hit harder the higher it is.
- **Phasing:** `C` vibrates you through buildings.
- **Abilities:** Lightning Throw, Phase Strike (vibrates your hand through a target), Speed Tornado and Slow Time. Slow Time slows the world while you move normally, and the dial sets how slow. In multiplayer it speeds you up instead and doesn't touch other players.
- **Time Stop** freezes everyone for 3 seconds, other players included. Everything you hit in that moment lands at once when time starts again, and your path shows as lightning streaks.

**Ring Bearer** (Power Ring). Everything runs on **ring charge**, which never refills by itself.
- **Recharging:** press `O` to hold up the lantern and type the oath to recharge. At 0 charge you can only walk. After you've typed it once, `Tab` (or NEXT WORD) fills in each word for you.
- **Flying:** `F` flies.
- **Constructs:** `B` builds your default construct and `V` opens the construct wheel. The choices are a spiked Bubble, a Jet (guns and homing missiles), a Mech and a Huge Mech (punches, guns, missile salvos; the huge one tramples buildings) and a Dragon you ride (claw strike, breath, roar). Inside a construct, left click, right click and `X` are its attacks.
- **Abilities:** Ring Blast, Hammer Smash, Chain Lasso and Ring Shield.
- **Black Hole** costs 95% of your charge. It drags in people, cars, rubble and whole buildings; only the strong or the very fast get away.

### Build your own (Flight)

| Body mod (pick 1, its move goes in slot 1) | Abilities (pick 2) |
| --- | --- |
| **Metal Skin → Metal Forms**: turn to steel. Tap again to turn your hand into a hammer, a spiked flail, a blade or a shield; hold to turn back | Fireball · Ice Cloud · Lightning Bolt · Energy Blast · Laser Vision |
| **Blade Claws → Blade Leap**: a slashing lunge, and you heal much faster | Telekinesis · Shockwave · Energy Shield · Morph Band |
| **Elastic Body → Stretch Strike**: your arm shoots out, grabs someone and slams them down. Your punches reach further and hard landings bounce you back up | Storm Hammer · Repulsor Barrage · Core Beam · Ricochet Shield |
| **Titan Growth → Giant Form**: grow to three times your size, hit like a giant, and pick up cars with `G` | Blink · Gravity Well · Spirit Wave · Time Dilation |

**Telekinesis:**
- **Controls:** hold the key to lift, right click to grab more at once, left click to slam everything into the ground, and let go to throw.
- **What it lifts:** people and drones at level 1, cars at 3, rubble at 5, trucks at 6, and at 9 you tear slabs out of buildings.
- **Upgrades:** you hold one more object every 3 levels, and holding costs less energy as it levels up.

The other abilities:

| Ability | What it does |
| --- | --- |
| Storm Hammer | Throw a hammer that calls lightning where it hits, smashes everything in its path and flies back to your hand |
| Repulsor Barrage | Hold to fire rapid palm blasts from alternating hands |
| Core Beam | Wind up, then a chest beam burns through people, cars and buildings for 1.5 s |
| Ricochet Shield | A disc that bounces between up to 6 targets and comes back |
| Blink | Teleport to where you aim, knocking back anyone near where you appear |
| Gravity Well | A singularity that drags in people, cars and street furniture, then detonates |
| Spirit Wave | Hold to charge, release a huge wave that can bring down a building |
| Time Dilation | The world slows to a quarter speed while you move normally (a speed boost in multiplayer, where time can't bend) |

### Fighting

- **Punch chains.** Click up to four times for a chain. Hits 1–3 stun and keep the target close; hit 4 is a finisher. It launches them, or it's an **uppercut** if you hold `Space`, or a **spike** into the ground if you're in the air. Juggle airborne targets by hitting them again.
- **Lock on** with `Z` to keep your camera, punches and powers on one target (people, drones, rival heroes, helicopters, bosses or other players), at any distance. Press `Z` again to let go. When you're locked on, your punches lunge to close the gap. When you beat your target, the lock jumps to the nearest enemy within 110 m.
- **Dash** with `X` in any direction you're holding, once in mid-air too. You can't be hurt for a moment at the start of a dash.
- **Charged punch.** While flying and locked on, hold the left mouse button to charge, then let go: you rocket into the target and send them flying hundreds of meters.
- **Ragdolls.** Anyone launched by a finisher or a charged punch goes limp and tumbles, then gets up if they can.
- **Everything breaks.** Launched bodies crater walls, smash cars and flatten street furniture. Hit a building hard enough (a charged punch, flying into it at speed, Spirit Wave or Core Beam, big explosions, a black hole) and **the whole building collapses** into dust and rubble. It grows back a couple of minutes later. The bank, hospital and police headquarters are landmarks and never fall.

You start tough: 220 health, and ordinary people and police do half damage to you.

### Getting around

- **Wall running** is for everyone: sprint (hold `Shift`) into a wall to run up it, or hit it at an angle to run along it. `Space` leaps off.
- **Parkour leap:** a quick jump while sprinting carries you much further.
- **At night** the street lamps and car headlights light up the streets around you.

### Morph Band

The Morph Band is an ability that turns you into one of six alien forms. Press `V` (or its ability key) to open the dial, then pick an alien. While you're transformed, your ability keys use the alien's own powers, and a timer counts down until you change back. Press `V` again to change back early. The band then needs to recharge. Alien forms move with their own body, not your traversal power.

| Alien | Band level | What it does |
| --- | --- | --- |
| Magmaw | 1 | Molten brute: burning fists, a volcanic ground slam, thrown lava rocks |
| Zephyrix | 1 | Storm sprite that always flies: gale blasts, tornadoes that pull in cars and people, a slipstream dash |
| Cryolith | 3 | Living glacier: ice spike lines, freezing breath, crystal armor |
| Voltwing | 5 | Very fast and climbs anything: chain lightning, an EMP that stalls cars, short-range blinks |
| Colossus | 7 | A titan three times your size: ground stomps, car throwing, huge punches |
| Umbra | 9 | Shadow phaser: turns invisible to enemies, walks through walls, teleport strikes |

Upgrading the band unlocks more aliens, makes transformations last longer (45 s at level 1, 150 s at level 10), shortens the recharge and makes alien attacks hit harder. The aliens are original designs.

## Controls

| Keyboard and mouse | Action |
| --- | --- |
| `W` `A` `S` `D` | Move |
| Mouse | Look and aim |
| Left click | Punch chain (hold to keep swinging). While flying and locked on: hold to charge a punch |
| `Z` | Lock on to a target / let go |
| `X` | Dash |
| `1`–`5` (or `Q` `E` `R`) | Your abilities. Hold for beams, clouds and telekinesis |
| `Space` | Jump. Hold, then release for a super jump. Leap off walls |
| `F` | Flight on/off. Hold it on the ground to charge, then let go to blast off into the sky |
| `U` | Suit up / suit down |
| `G` | Get in or out of a car, or help an injured person up |
| `V` | Morph Band dial / change back (Ring Bearer: construct wheel) |
| `Tab` or `K` | Skills and upgrades |
| `L` | Lock or unlock the mouse. When it's unlocked, drag with the middle mouse button to look |
| `Esc` / `P` | Pause (Appearance, Multiplayer, Leaderboard and Settings are here). In a multiplayer room the menu opens but the game keeps running |

Each hero's own keys (swinging, the speed dial, constructs and so on) are listed above and in the in-game help panel (`H`).

**Driving:** `W` accelerates, `S` brakes and reverses, `A` and `D` steer, `Space` is the handbrake, and `G` gets you out.

On touch screens: drag on the left side to move (or drive), drag on the right side to look, and use the on-screen buttons for everything else. The USE button gets you into cars and helps people up, LOCK locks on, DASH dashes, SUIT suits up, and holding PUNCH while flying and locked on charges a punch. Each hero gets its own extra buttons (WEB, FAST/PHASE/DIAL, BUILD/PICK/ALT/OATH, GRAB+).

## The city

Nova Bay is a 16 × 16 block island with a downtown of glass towers, a brick old town, a residential district with houses, an industrial zone with warehouses and a container port, docks with cranes, and a central park with a lake. The bank, hospital (where you wake up after being knocked out) and police headquarters are landmarks on the minimap.

- **Traffic** follows lanes and traffic lights, and cars honk and brake for people in the road. You can take any car with `G`. Taking a car that someone is driving is a crime.
- **Almost everything breaks.** Street lamps, traffic lights, benches, trees, bus stops, mailboxes and hydrants shatter into pieces (and hydrants spray water). Windows break from explosions, lasers and crashes. Cars can be wrecked, and debris bounces off buildings. Broken street furniture comes back after a couple of minutes.
- **Crimes** play out on their own and only show up as icons on your minimap. There are no pop-ups. Drones rob shops and float the loot to a getaway van, drones hack ATMs, thugs mug people, and thieves break into cars and drive off. If you step in and stop one, you get a bonus.
- **Heists** are rare and big. The mothership tries to lift the bank vault into the sky, or a Titan mech rips open an armored truck.
- **People react.** Civilians flee from fights and from villains. Criminals can leave people injured on the ground; heroes can help them up with `G`. Thug gangs hang around alleys and attack heroes on sight. Police go after villains and wanted criminals, and patrol cars chase them with sirens. When your heat is high, **police helicopters** circle overhead, sweep a searchlight at night and fire at you; shoot one down and it spins out of the sky. Rival heroes and villains with their own powers roam the city too.

## Multiplayer

**Room codes (public site, https://demo-repo-dusky.vercel.app).** Open **Multiplayer** from the main menu or the pause menu. One player clicks **Create a room** and shares the 5-letter code or the invite link; friends join with the code (or just open the link). Up to 8 players share the city. No accounts are needed. Players connect directly to each other over WebRTC; the free PeerJS server only introduces them, and the host's game relays positions and attacks, so the room stays open while the host is playing. Most home networks work; some strict school or office networks block these connections.

**claude.ai version.** Everyone in the page owner's organization who has it open plays together automatically, with no code. claude.ai doesn't let people invited from outside the organization into the live room, so play with them on the public site instead. The status line in the top-right corner (top of the screen on phones) shows whether you're connected.

**In a room-code game everyone shares the host's city.** The host's game runs the people, police, gangs, traffic, drones, helicopters, rival heroes, heists and crimes, and everyone else sees the same ones. Your hits on them count, you get XP for your kills and for crimes you help stop, and police and criminals come after whichever player they have a problem with. Time of day, broken street furniture, windows, craters and collapsed buildings are shared too. Telekinesis works on the host's people and cars and on other players: lift a friend and throw them.

In the claude.ai version, players are shared but each player's city runs on their own device.

In both, heroes can't hurt other heroes and villains can't hurt other villains; neutral players can fight anyone. Knocking out another player gives you XP and moves your reputation (towards Hero if you beat a villain, towards Villain if you beat a hero). Opening the menu doesn't pause you in multiplayer.

## Saving and the leaderboard

Progress saves automatically in your browser. A short checklist in the corner walks new players through the basics. In the claude.ai version, a shared leaderboard shows the most respected heroes, the most feared villains and the highest levels. Everywhere else, the board shows only your own hero.

## For developers

The game source lives in `src/`: numbered JavaScript modules plus an HTML/CSS shell. Run `node tools/build.mjs` to join them into `index.html` (no packages needed). Commit the rebuilt `index.html` alongside source changes.

| Module | Contents |
| --- | --- |
| `00_engine.js` | Math, WebGL 2 renderer, geometry, particles, audio |
| `10_world.js` | City generation, street props, collisions, ray casts |
| `15_meshes.js` | Cars, drones, bosses |
| `20_core.js` | Config, powers, saving |
| `30_systems.js` | Damage, XP, reputation, effects, destruction, projectiles |
| `40_powers.js`, `47_abilities.js` | Hero powers, including the hero-inspired abilities |
| `42_combat.js`, `43_ragdoll.js` | Lock-on, punch chains, dash, charged punch, impacts, ragdolls |
| `44_movement.js` | Web swinging, web zip, wall running |
| `45_aliens.js` | Morph Band aliens |
| `46_buildings.js` | Building damage, collapse and regrowth |
| `50_npcs.js`, `52_heli.js` | People, traffic, police, helicopters, crimes, heists, rivals |
| `60_multiplayer.js`, `62_worldsync.js` | Players over the claude.ai room or room codes, and the shared host city |
| `70_ui.js`, `80_player.js` | HUD, menus, input, driving, player movement |
| `90_render.js`, `99_main.js` | Camera, models, draw list, main loop |

All balance numbers (powers, passives, NPCs, reputation, crime timing) live in the config objects near the top of the game script (`CONFIG`, `POWERS`, `PASSIVES`, `NPCS`, `REP`, `CRIMES`). Systems talk through a small event bus (`damaged`, `defeated`, `levelUp`), so progression and reputation only listen to combat events. See `ROADMAP.md` for what's planned next.
