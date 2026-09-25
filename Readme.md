# Skyline Guardian

An open-world superhero sandbox that runs in the browser. You create a hero, pick your powers, and choose your side in the island city of Nova Bay: stop the robberies, muggings and heists happening around you, or become the reason people lock their doors. Every fight earns XP and skill points, and the city remembers which side you picked.

## Play

Open `index.html` in a recent browser (Chrome, Edge, Firefox or Safari). You don't need a server or an install. The game ships as one file with no dependencies, written in raw WebGL 2.

It works on laptops and phones. The game detects your device and switches between keyboard-and-mouse and touch controls automatically. You can override this in Settings.

## Your hero

- **Pick your powers.** When you create a hero you choose **2 movement powers** and **3 abilities** for free. After you confirm, they're locked in. You can swap them later with **Change powers** in the pause menu, once every 10 minutes. Skill points you spent on powers you drop come back to you.
- **Level up by fighting.** You earn XP from fights, from damage you deal, and from glowing orbs around the city (yellow 25 XP, blue 50, red 100; red orbs only appear on rooftops). Each level gives you **3 skill points**.
- **Spend skill points** to upgrade your powers (up to level 10) and four passives: Strength, Vitality, Healing and Energy (up to level 50 each). Changed your mind? **Reset skill points** at the bottom of the Skills screen refunds everything you spent. Your level, reputation and powers stay.
- **Reputation** decides your side. Stopping criminals makes you a Hero (Rookie → Vigilante → Protector → Guardian → Legend). Hurting civilians and police, or robbing shops and ATMs, makes you a Villain (Troublemaker → Outlaw → Menace → Supervillain → Nemesis). Villains get chased by police, and at −1500 reputation a bounty puts rival heroes on your trail.

### Powers

| Movement (pick 2) | Abilities (pick 3) |
| --- | --- |
| Flight | Fireball · Ice Cloud · Lightning Bolt · Energy Blast |
| Super Speed | Laser Vision · Telekinesis · Shockwave |
| Wall-Climb | Metal Skin · Energy Shield |
| Web-Swinging | Morph Band |

Everyone can also punch (a 3-hit combo) and do a charged super jump.

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
| Left click | Punch (hold to keep swinging) |
| `1` `2` `3` (or `Q` `E` `R`) | Your abilities. Hold for beams, clouds and telekinesis |
| `Space` | Jump. Hold, then release for a super jump |
| `F` | Flight on/off (Space climbs, `C` dives, `Shift` boosts) |
| `Shift` | Super Speed (if you picked it) or sprint |
| Right click (hold) | Web-Swinging (if you picked it) |
| `G` | Get in or out of a car, or help an injured person up |
| `V` | Morph Band dial / change back |
| `Tab` or `K` | Skills and upgrades |
| `L` | Lock or unlock the mouse. When it's unlocked, drag with the middle mouse button to look |
| `Esc` / `P` | Pause (Appearance, Leaderboard and Settings are here) |

**Driving:** `W` accelerates, `S` brakes and reverses, `A` and `D` steer, `Space` is the handbrake, and `G` gets you out.

On touch screens: drag on the left side to move (or drive), drag on the right side to look, and use the on-screen buttons for everything else. The USE button gets you into cars and helps people up.

## The city

Nova Bay is a 16 × 16 block island with a downtown of glass towers, a brick old town, a residential district with houses, an industrial zone with warehouses and a container port, docks with cranes, and a central park with a lake. The bank, hospital (where you wake up after being knocked out) and police headquarters are landmarks on the minimap.

- **Traffic** follows lanes and traffic lights, and cars honk and brake for people in the road. You can take any car with `G`. Taking a car that someone is driving is a crime.
- **Almost everything breaks.** Street lamps, traffic lights, benches, trees, bus stops, mailboxes and hydrants shatter into pieces (and hydrants spray water). Windows break from explosions, lasers and crashes. Cars can be wrecked, and debris bounces off buildings. Broken street furniture comes back after a couple of minutes.
- **Crimes** play out on their own and only show up as icons on your minimap. There are no pop-ups. Drones rob shops and float the loot to a getaway van, drones hack ATMs, thugs mug people, and thieves break into cars and drive off. If you step in and stop one, you get a bonus.
- **Heists** are rare and big. The mothership tries to lift the bank vault into the sky, or a Titan mech rips open an armored truck.
- **People react.** Civilians flee from fights and from villains. Criminals can leave people injured on the ground; heroes can help them up with `G`. Thug gangs hang around alleys and attack heroes on sight. Police go after villains and wanted criminals, and patrol cars chase them with sirens. Rival heroes and villains with their own powers roam the city too.

## Multiplayer

In the claude.ai version, everyone playing at the same time shares the city: you can see other players, their powers and cars, and fight them. Heroes can't hurt other heroes and villains can't hurt other villains; neutral players can fight anyone. Knocking out another player gives you XP and moves your reputation (towards Hero if you beat a villain, towards Villain if you beat a hero). Each player's crimes, traffic and pedestrians run on their own device, so only players and their attacks are shared. Opened anywhere else, the game is single-player.

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
| `40_powers.js`, `45_aliens.js` | Hero powers and Morph Band aliens |
| `50_npcs.js` | People, traffic, police, crimes, heists, rivals |
| `60_multiplayer.js` | Shared players over the claude.ai room |
| `70_ui.js`, `80_player.js` | HUD, menus, input, driving, player movement |
| `90_render.js`, `99_main.js` | Camera, models, draw list, main loop |

All balance numbers (powers, passives, NPCs, reputation, crime timing) live in the config objects near the top of the game script (`CONFIG`, `POWERS`, `PASSIVES`, `NPCS`, `REP`, `CRIMES`). Systems talk through a small event bus (`damaged`, `defeated`, `levelUp`), so progression and reputation only listen to combat events. See `ROADMAP.md` for what's planned next.
