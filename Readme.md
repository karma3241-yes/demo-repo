# Skyline Guardian

An open-world superhero sandbox that runs in the browser. You create a hero, pick your powers, and choose your side in the island city of Nova Bay: stop the robberies, muggings and heists happening around you, or become the reason people lock their doors. Every fight earns XP and skill points, and the city remembers which side you picked.

## Play

Play it online at **https://demo-repo-dusky.vercel.app**, or open `index.html` in a recent browser (Chrome, Edge, Firefox or Safari). You don't need a server or an install. The game ships as one file with no dependencies, written in raw WebGL 2.

It works on laptops and phones. The game detects your device and switches between keyboard-and-mouse and touch controls automatically. You can override this in Settings.

## Your hero

- **Pick your powers.** When you create a hero you choose **2 movement powers** and **3 abilities** for free. After you confirm, they're locked in. You can swap them later with **Change powers** in the pause menu, once every 10 minutes. Skill points you spent on powers you drop come back to you.
- **Level up by fighting.** You earn XP from fights, from damage you deal, and from glowing orbs around the city (yellow 25 XP, blue 50, red 100; red orbs only appear on rooftops). Each level gives you **3 skill points**.
- **Spend skill points** to upgrade your powers (up to level 10) and four passives: Strength, Vitality, Healing and Energy (up to level 50 each). Changed your mind? **Reset skill points** at the bottom of the Skills screen refunds everything you spent. Your level, reputation and powers stay.
- **Reputation** decides your side. Stopping criminals makes you a Hero (Rookie → Vigilante → Protector → Guardian → Legend). Hurting civilians and police, or robbing shops and ATMs, makes you a Villain (Troublemaker → Outlaw → Menace → Supervillain → Nemesis). Villains get chased by police, and at −1500 reputation a bounty puts rival heroes on your trail.

### Powers

| Movement (pick 2) | Abilities (pick 3) |
| --- | --- |
| Flight | Fireball · Ice Cloud · Lightning Bolt · Energy Blast · Laser Vision |
| Super Speed | Telekinesis · Shockwave · Metal Skin · Energy Shield · Morph Band |
| Wall-Climb | Storm Hammer · Repulsor Barrage · Core Beam · Ricochet Shield |
| Web-Swinging | Blade Claws · Blink · Gravity Well · Spirit Wave · Time Dilation |

The newer abilities are original takes on famous hero styles:

| Ability | What it does |
| --- | --- |
| Storm Hammer | Throw a hammer that calls lightning where it hits, smashes everything in its path and flies back to your hand |
| Repulsor Barrage | Hold to fire rapid palm blasts from alternating hands |
| Core Beam | Wind up, then a chest beam burns through people, cars and buildings for 1.5 s |
| Ricochet Shield | A disc that bounces between up to 6 targets and comes back |
| Blade Claws | A slashing lunge through enemies; while you have them you heal much faster |
| Blink | Teleport to where you aim, knocking back anyone near where you appear |
| Gravity Well | A singularity that drags in people, cars and street furniture, then detonates |
| Spirit Wave | Hold to charge, release a huge wave that can bring down a building |
| Time Dilation | The world slows to a quarter speed while you move normally (a speed boost in multiplayer, where time can't bend) |

### Fighting

- **Punch chains.** Click up to four times for a chain. Hits 1–3 stun and keep the target close; hit 4 is a finisher. It launches them, or it's an **uppercut** if you hold `Space`, or a **spike** into the ground if you're in the air. Juggle airborne targets by hitting them again.
- **Lock on** with `Z` to keep your camera, punches and powers on one target (people, drones, rival heroes, helicopters, bosses or other players). Press `Z` again to let go. When you're locked on, your punches lunge to close the gap.
- **Dash** with `X` in any direction you're holding, once in mid-air too. You can't be hurt for a moment at the start of a dash.
- **Charged punch.** While flying and locked on, hold the left mouse button to charge, then let go: you rocket into the target and send them flying hundreds of meters.
- **Ragdolls.** Anyone launched by a finisher or a charged punch goes limp and tumbles, then gets up if they can.
- **Everything breaks.** Launched bodies crater walls, smash cars and flatten street furniture. Hit a building hard enough (a charged punch, flying into it at speed, Spirit Wave or Core Beam, big explosions) and **the whole building collapses** into dust and rubble. It grows back a couple of minutes later. The bank, hospital and police headquarters are landmarks and never fall.

You start tough: 220 health, and ordinary people and police do half damage to you.

### Getting around

- **Web-Swinging** reaches 90–170 m. Hold right click and the web finds a building ahead of you; keep holding to chain swing to swing. Let go on the upswing for a boost, press `Space` while swinging to leap, and press `Space` in mid-air to **web-zip** to a point and launch off it.
- **Wall running** is for everyone: sprint (hold `Shift`) into a wall to run up it, or hit it at an angle to run along it. `Space` leaps off. Web-swingers, wall-climbers and speedsters can run up walls as far as they like.
- **Parkour leap:** a quick jump while sprinting carries you much further.

### Morph Band

The Morph Band is an ability that turns you into one of six alien forms. Press `V` (or its ability key) to open the dial, then pick an alien. While you're transformed, your three ability keys use the alien's own powers, and a timer counts down until you change back. Press `V` again to change back early. The band then needs to recharge.

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
| `1` `2` `3` (or `Q` `E` `R`) | Your abilities. Hold for beams, clouds and telekinesis |
| `Space` | Jump. Hold, then release for a super jump. Leap off walls, web-zip in mid-air |
| `F` | Flight on/off (Space climbs, `C` dives, `Shift` boosts) |
| `Shift` | Super Speed (if you picked it) or sprint |
| Right click (hold) | Web-Swinging (if you picked it) |
| `G` | Get in or out of a car, or help an injured person up |
| `V` | Morph Band dial / change back |
| `Tab` or `K` | Skills and upgrades |
| `L` | Lock or unlock the mouse. When it's unlocked, drag with the middle mouse button to look |
| `Esc` / `P` | Pause (Appearance, Multiplayer, Leaderboard and Settings are here). In a multiplayer room the menu opens but the game keeps running |

**Driving:** `W` accelerates, `S` brakes and reverses, `A` and `D` steer, `Space` is the handbrake, and `G` gets you out.

On touch screens: drag on the left side to move (or drive), drag on the right side to look, and use the on-screen buttons for everything else. The USE button gets you into cars and helps people up, LOCK locks on, DASH dashes, and holding PUNCH while flying and locked on charges a punch.

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
